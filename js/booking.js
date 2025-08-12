if (typeof db === 'undefined') {
  var db;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }
  db = firebase.firestore();
}

// Utility functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

// Validate form data
function validateFormData(formData) {
  const errors = [];
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (!data.firstName || !data.firstName.trim()) errors.push('First name is required');
  if (!data.lastName || !data.lastName.trim()) errors.push('Last name is required');
  if (!data.email || !data.email.trim()) errors.push('Email is required');
  if (!data.phone || !data.phone.trim()) errors.push('Phone is required');
  if (!data.address || !data.address.trim()) errors.push('Address is required');
  if (!data.guests || !data.guests.trim()) errors.push('Number of guests is required');

  // Check for checkin/checkout in hidden fields
  const modalCheckin = document.getElementById('modal-checkin').value;
  const modalCheckout = document.getElementById('modal-checkout').value;

  if (!modalCheckin || !modalCheckin.trim()) errors.push('Check-in date is required');
  if (!modalCheckout || !modalCheckout.trim()) errors.push('Check-out date is required');

  // Validate email format
  if (data.email && !validateEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }

  // Validate phone format
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Please enter a valid phone number');
  }

  // Validate guests number
  const guests = parseInt(data.guests);
  if (isNaN(guests) || guests < 1 || guests > 50) {
    errors.push('Number of guests must be between 1 and 50');
  }

  return errors;
}

// Show success message
function showSuccessMessage(message) {
  // Success message handler (implement as needed for production)
}

// Show error message
function showErrorMessage(message) {
  alert('Error: ' + message); // Simple alert for now, can be enhanced with a modal
}

// Reset form (simplified version that doesn't depend on calendar variables)
function resetForm() {
  const form = document.getElementById('reservationForm');
  if (form) {
    form.reset();
  }

  // Close all modals
  const reservationModal = document.getElementById('reservationModal');
  const confirmationModal = document.getElementById('confirmationModal');

  if (reservationModal) {
    reservationModal.classList.remove('show');
    reservationModal.classList.add('hidden');
  }
  if (confirmationModal) {
    confirmationModal.classList.remove('show');
    confirmationModal.classList.add('hidden');
  }

  // Update body scroll
  document.body.classList.remove('modal-open');
  document.body.style.top = '';

  // Reset calendar selections without reloading page
  selectedStart = null;
  selectedEnd = null;
  selectionMode = 'checkin';
  updateFields();
  renderCalendar();
}

// Get client IP (simplified version)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// Fetch all approved reservations from Firestore
async function fetchApprovedReservations() {
  const q = firebase.firestore().collection("reservations").where("approved", "==", true);
  const snapshot = await q.get();
  return snapshot.docs.map(doc => doc.data());
}

// Build a Set of all blocked dates (YYYY-MM-DD) and a Set of all checkout dates
function getBlockedAndCheckoutDateSets(reservations) {
  const blocked = new Set();
  const availableForCheckout = new Set(); // Dates available for check-out (check-in dates)
  const availableForCheckin = new Set(); // Dates available for check-in (check-out dates)
  
  reservations.forEach(res => {
    if (!res.checkin || !res.checkout) return;
    const start = new Date(res.checkin);
    const end = new Date(res.checkout);
    
    // Track check-in dates as available for check-out
    availableForCheckout.add(start.toISOString().slice(0, 10));
    
    // Block nights up to (but not including) checkout
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      blocked.add(d.toISOString().slice(0, 10));
    }
    // Mark check-out dates as available for check-in
    availableForCheckin.add(new Date(end).toISOString().slice(0, 10));
  });
  
  // Find mixed days (dates that are both check-in and check-out)
  const mixedDays = new Set();
  availableForCheckout.forEach(date => {
    if (availableForCheckin.has(date)) {
      mixedDays.add(date);
    }
  });
  
  // Remove check-in and check-out dates from blocked set (they should be available)
  // BUT keep mixed days blocked
  availableForCheckout.forEach(date => {
    if (!mixedDays.has(date)) {
      blocked.delete(date);
    }
  });
  availableForCheckin.forEach(date => {
    if (!mixedDays.has(date)) {
      blocked.delete(date);
    }
  });
  
  // Remove mixed days from available sets since they should be blocked
  mixedDays.forEach(date => {
    availableForCheckout.delete(date);
    availableForCheckin.delete(date);
  });
  
  return { blocked, availableForCheckout, availableForCheckin };
}

// Helper to check if a date is blocked
function isDateBlocked(date, blockedDates) {
  const iso = date.toISOString().slice(0, 10);
  return blockedDates.has(iso);
}

// Helper to check if a range overlaps with blocked dates
function isRangeBlocked(start, end, blockedDates) {
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (blockedDates.has(iso)) {
      return true;
    }
  }
  return false;
}

// Add this helper function near the top of your file
async function verifyRecaptchaToken(token) {
  const response = await fetch('https://kais-cabin.vercel.app/api/verify-recaptcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return response.json();
}



document.addEventListener('DOMContentLoaded', async () => {
  // Check if reCAPTCHA is loaded
  if (typeof grecaptcha === 'undefined') {
    // console.error('❌ reCAPTCHA not loaded! Check if the script is loading properly.');
  } else {
    // console.log('✅ reCAPTCHA is loaded and ready!'); // Removed for production cleanliness
  }

  const calendarEl = document.getElementById('bookingCalendar');
  const checkinEl = document.getElementById('checkin');
  const checkoutEl = document.getElementById('checkout');
  const guestsInput = document.getElementById('guests');
  const decreaseBtn = document.querySelector('.guests-btn--decrease');
  const increaseBtn = document.querySelector('.guests-btn--increase');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedStart = null;
  let selectedEnd = null;
  let selectionMode = 'checkin'; // 'checkin' or 'checkout'

  // Fetch approved reservations and build blocked and checkout dates sets
  const reservations = await fetchApprovedReservations();
  const { blocked: blockedDates, availableForCheckout: checkoutDates, availableForCheckin: checkinDates } = getBlockedAndCheckoutDateSets(reservations);

  function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }

  function renderCalendar(month = today.getMonth(), year = today.getFullYear()) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    let html = `<div class="calendar-header">
      <button class="calendar-prev" ${month === today.getMonth() && year === today.getFullYear() ? 'disabled' : ''}>&lt;</button>
      ${firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })}
      <button class="calendar-next">&gt;</button>
    </div>
    <div class="calendar-days">
      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="calendar-dates">`;

    let day = 1;
    for (let i = 0; i < 6 * 7; i++) {
      const date = new Date(year, month, day);
      if (i < startDay || day > lastDay.getDate()) {
        html += `<span class="calendar-date muted"></span>`;
      } else {
        const isPast = date < today;
        const isToday = date.toDateString() === today.toDateString();
        const iso = date.toISOString().slice(0, 10);
        // --- Refactored logic ---
        const isBlocked = isDateBlocked(date, blockedDates);
        const isCheckinDay = checkoutDates.has(iso);
        const isCheckoutDay = checkinDates.has(iso);
        let classes = ['calendar-date'];
        if (isPast) classes.push('muted');
        if (isToday) classes.push('today');
        if (isBlocked || isCheckinDay) classes.push('blocked');
        if (isCheckoutDay) classes.push('checkout');
        if (isCheckinDay) classes.push('checkin');
        const isSelected = selectedStart && formatDate(date) === formatDate(selectedStart);
        const isInRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;
        const isEnd = selectedEnd && formatDate(date) === formatDate(selectedEnd);
        if (isSelected) classes.push('selected');
        if (isInRange) classes.push('in-range');
        if (isEnd) classes.push('selected');
        let isClickable = false;
        if (!isPast && !isToday) {
          if (!isBlocked && !isCheckinDay) {
            isClickable = true;
          }
          if (selectionMode === 'checkout' && selectedStart && date > selectedStart) {
            if ((!isBlocked && !isCheckinDay) || isCheckinDay) {
              if (!isRangeBlocked(selectedStart, date, blockedDates)) {
                isClickable = true;
                if (isCheckinDay) classes.push('checkout-available');
              }
            }
          }
        }
        if (!isClickable || isToday) classes.push('not-clickable');
        classes = classes.join(' ');
        const clickAttr = isClickable ? 'tabindex="0"' : 'tabindex="-1"';
        html += `<span class="${classes}" data-date="${formatDate(date)}" ${clickAttr}>${day}</span>`;
        day++;
      }
    }
    html += `</div>`;
    calendarEl.innerHTML = html;
    const legendHtml = `
      <div class="calendar-legend" aria-label="Calendar Legend">
        <div class="calendar-legend__title">Legend</div>
        <div class="calendar-legend-row">
          <span><span class="calendar-legend__icon available" title="Available"></span> Available</span>
          <span><span class="calendar-legend__icon blocked" title="Occupied"></span> Occupied</span>
        </div>
      </div>
    `;
    calendarEl.insertAdjacentHTML('beforeend', legendHtml);
    calendarEl.querySelector('.calendar-prev')?.addEventListener('click', () => {
      renderCalendar(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
    });
    calendarEl.querySelector('.calendar-next')?.addEventListener('click', () => {
      renderCalendar(month === 11 ? 0 : month + 1, month === 11 ? year + 1 : year);
    });
    calendarEl.querySelectorAll('.calendar-date:not(.muted)').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('not-clickable')) return;
        const date = new Date(el.dataset.date);
        if (selectedStart && date <= selectedStart) {
          selectedStart = date;
          selectedEnd = null;
          selectionMode = 'checkout';
          updateFields();
          renderCalendar(month, year);
          return;
        }
        if (!selectedStart || (selectedStart && selectedEnd)) {
          selectedStart = date;
          selectedEnd = null;
          selectionMode = 'checkout';
        } else if (date > selectedStart) {
          if (isRangeBlocked(selectedStart, date, blockedDates)) {
            showErrorMessage('Selected range overlaps with a blocked date. Please choose another range.');
            selectedStart = null;
            selectedEnd = null;
            selectionMode = 'checkin';
            updateFields();
            renderCalendar(month, year);
            return;
          }
          selectedEnd = date;
          selectionMode = 'checkin';
        }
        updateFields();
        renderCalendar(month, year);
      });
    });
  }

  function updateFields() {
    checkinEl.value = selectedStart ? formatDate(selectedStart) : '';
    checkoutEl.value = selectedEnd ? formatDate(selectedEnd) : '';
  }

  renderCalendar();



  const openModalBtn = document.getElementById("openModal");
  const modal = document.getElementById("reservationModal");
  const closeBtn = modal.querySelector(".close");

  // Helper to manage body scroll lock for modals
  let lastScrollY = 0;
  function updateBodyModalOpen() {
    const anyModalOpen = document.querySelector('.modal.show');
    if (anyModalOpen) {
      if (!document.body.classList.contains('modal-open')) {
        lastScrollY = window.scrollY;
        document.body.style.top = `-${lastScrollY}px`;
      }
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      window.scrollTo(0, lastScrollY);
      document.body.style.top = '';
    }
  }

  openModalBtn.addEventListener("click", () => {
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    if (!checkin || !checkout) {
      showErrorMessage('Please select both check-in and check-out dates before proceeding.');
      return;
    }
    document.getElementById("modal-checkin").value = checkin;
    document.getElementById("modal-checkout").value = checkout;
    document.getElementById("modal-checkin-display").textContent = checkin;
    document.getElementById("modal-checkout-display").textContent = checkout;
    modal.classList.remove("hidden");
    modal.classList.add("show");
    updateBodyModalOpen();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    updateBodyModalOpen();
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      modal.classList.add("hidden");
      updateBodyModalOpen();
    }
  });

  if (guestsInput && decreaseBtn && increaseBtn) {
    decreaseBtn.addEventListener('click', function() {
      let value = parseInt(guestsInput.value, 10) || 1;
      if (value > 1) {
        guestsInput.value = value - 1;
      }
    });
    increaseBtn.addEventListener('click', function() {
      let value = parseInt(guestsInput.value, 10) || 1;
      guestsInput.value = value + 1;
    });
    guestsInput.addEventListener('input', function() {
      if (parseInt(guestsInput.value, 10) < 1 || isNaN(guestsInput.value)) {
        guestsInput.value = 1;
      }
    });
  }

  // Confirmation modal logic
  const reservationForm = document.getElementById('reservationForm');
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmFields = {
    checkin: document.getElementById('confirm-checkin'),
    checkout: document.getElementById('confirm-checkout'),
    firstName: document.getElementById('confirm-first-name'),
    lastName: document.getElementById('confirm-last-name'),
    email: document.getElementById('confirm-email'),
    phone: document.getElementById('confirm-phone'),
    address: document.getElementById('confirm-address'),
    guests: document.getElementById('confirm-guests'),
    message: document.getElementById('confirm-message'),
  };
  const confirmSubmitBtn = document.getElementById('confirmSubmit');
  const cancelConfirmationBtn = document.getElementById('cancelConfirmation');
  const confirmationCloseBtn = document.getElementById('confirmationClose');

  if (reservationForm && confirmationModal) {
    reservationForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Check if dates are selected
      const checkin = document.getElementById('modal-checkin').value;
      const checkout = document.getElementById('modal-checkout').value;

      if (!checkin || !checkout) {
        showErrorMessage('Please select both check-in and check-out dates before proceeding.');
        return;
      }

      // Populate confirmation modal
      confirmFields.checkin.textContent = checkin;
      confirmFields.checkout.textContent = checkout;
      confirmFields.firstName.textContent = document.getElementById('first-name').value;
      confirmFields.lastName.textContent = document.getElementById('last-name').value;
      confirmFields.email.textContent = document.getElementById('email').value;
      confirmFields.phone.textContent = document.getElementById('country-code').value + ' ' + document.getElementById('phone').value;
      confirmFields.address.textContent = document.getElementById('address').value;
      confirmFields.guests.textContent = document.getElementById('guests').value;
      confirmFields.message.textContent = document.getElementById('message').value || 'No additional message';

      // Show confirmation modal
      confirmationModal.classList.add('show');
      confirmationModal.classList.remove('hidden');
      // updateBodyModalOpen(); // If you use scroll lock
    });

    // Confirm & Submit
    confirmSubmitBtn.addEventListener('click', async function() {
      if (confirmSubmitBtn.disabled) return;

      confirmSubmitBtn.disabled = true;
      confirmSubmitBtn.textContent = "Sending...";

      try {
        // Get form data directly from form elements
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const guests = document.getElementById('guests').value.trim();
        const checkin = document.getElementById('modal-checkin').value.trim();
        const checkout = document.getElementById('modal-checkout').value.trim();
        const note = document.getElementById('message').value.trim();

        // Manual validation first
        const validationErrors = [];
        if (!firstName) validationErrors.push('First name is required');
        if (!lastName) validationErrors.push('Last name is required');
        if (!email) validationErrors.push('Email is required');
        if (!phone) validationErrors.push('Phone is required');
        if (!address) validationErrors.push('Address is required');
        if (!guests) validationErrors.push('Number of guests is required');
        if (!checkin) validationErrors.push('Check-in date is required');
        if (!checkout) validationErrors.push('Check-out date is required');

        // Validate email format
        if (email && !validateEmail(email)) validationErrors.push('Please enter a valid email address');
        // Validate phone format
        if (phone && !validatePhone(phone)) validationErrors.push('Please enter a valid phone number');
        // Validate guests number
        const guestsNum = parseInt(guests);
        if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 50) {
          validationErrors.push('Number of guests must be between 1 and 50');
        }

        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join('\n'));
        }

        // Get reCAPTCHA token
        const recaptchaToken = await executeRecaptcha();
        if (!recaptchaToken) {
          throw new Error('CAPTCHA verification failed. Please try again.');
        }

        // Prepare reservation data
        const reservationData = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: document.getElementById('country-code').value + ' ' + phone,
          address: address,
          guests: guestsNum,
          checkin: checkin,
          checkout: checkout,
          note: note || ''
        };

        // Submit to backend for reCAPTCHA verification, duplicate check, and Firestore write
        const response = await fetch('https://kais-cabin.vercel.app/api/submit-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationData, recaptchaToken })
        });
        const result = await response.json();
        if (!result.success) {
          showErrorMessage(result.message || 'Reservation failed. Please try again.');
          confirmSubmitBtn.disabled = false;
          confirmSubmitBtn.textContent = "Confirm & Submit";
          return;
        }

        // Handle subscription if checkbox is checked
        const subscribeChecked = document.getElementById('subscribe-checkbox')?.checked;
        const subEmail = document.getElementById('email')?.value.trim().toLowerCase();

        if (subscribeChecked && subEmail) {
          // Async subscription process - doesn't block form submission
          (async () => {
            try {
              // Add to Firestore with timeout
              const firestorePromise = db.collection("subscriptions").add({ 
                email: subEmail, 
                createdAt: new Date() 
              });
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore timeout')), 3000)
              );
              
              await Promise.race([firestorePromise, timeoutPromise]);
            } catch (firestoreErr) {
              // Continue to send welcome email even if Firestore fails
            }
            
            // Send welcome email
            try {
              await fetch(`${window.API_BASE}/api/send-welcome-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: subEmail })
              });
            } catch (emailErr) {
              // Silent fail - doesn't affect user experience
            }
          })();
        }
        
        // Close confirmation modal first
        confirmationModal.classList.remove('show');
        confirmationModal.classList.add('hidden');
        updateBodyModalOpen();
        
        // Show success popup and wait for user to close it
        alert('Reservation submitted successfully! We will contact you soon.');
        
        // Give time for the welcome email to be sent before reloading
        setTimeout(() => {
          window.location.reload();
        }, 2000); // 2 second delay

      } catch (error) {
        showErrorMessage(error.message);
        confirmSubmitBtn.disabled = false;
        confirmSubmitBtn.textContent = "Confirm & Submit";
      }
    });

    // Cancel or close
    cancelConfirmationBtn.addEventListener('click', function() {
      confirmationModal.classList.remove('show');
      confirmationModal.classList.add('hidden');
    });
    
    confirmationCloseBtn.addEventListener('click', function() {
      confirmationModal.classList.remove('show');
      confirmationModal.classList.add('hidden');
    });
  }

  // Booking form feedback messages
  (function() {
    const form = document.getElementById('reservationForm');
    if (!form) return;
    let feedback = document.createElement('div');
    feedback.className = 'form-feedback full-width';
    feedback.setAttribute('aria-live', 'polite');
    const firstFullWidth = form.querySelector('.form-group.full-width');
    if (firstFullWidth) {
      form.insertBefore(feedback, firstFullWidth);
    } else {
      form.insertBefore(feedback, form.firstChild);
    }

    form.addEventListener('submit', function(e) {
      feedback.textContent = '';
      feedback.classList.remove('form-feedback--error', 'form-feedback--success');
      let valid = form.checkValidity();
      if (!valid) {
        e.preventDefault();
        feedback.textContent = 'Please fill out all required fields correctly.';
        feedback.classList.add('form-feedback--error');
        feedback.focus && feedback.focus();
        return false;
      }
    });
  })();
});

async function executeRecaptcha() {
  if (typeof grecaptcha !== 'undefined') {
    // Use your actual site key here (from your <script> tag)
    return await grecaptcha.execute('6LcgbnArAAAAAN5X7tRuPKnQUODjze7RCWtDSG-b', { action: 'submit' });
  } else {
    return null;
  }
}