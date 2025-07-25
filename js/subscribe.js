document.addEventListener('DOMContentLoaded', function() {
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }
  var db = firebase.firestore();
  var form = document.getElementById("subscribe-form");
  if (!form) return;

  // Use palette from styles.css
  var palette = {
    success: getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || '#5d8a4a',
    error: getComputedStyle(document.documentElement).getPropertyValue('--error') || '#a45d5d',
    text: getComputedStyle(document.documentElement).getPropertyValue('--brand-dark') || '#334a2a',
    bg: getComputedStyle(document.documentElement).getPropertyValue('--brand-light') || '#eef2e8',
  };

  function showModal(title, message, isSuccess) {
    var oldModal = document.getElementById('subscribe-modal');
    if (oldModal) oldModal.remove();
    var modal = document.createElement('div');
    modal.id = 'subscribe-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background: ${palette.bg}; border-radius: 16px; max-width: 90vw; width: 400px; padding: 2.5rem 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.18); text-align: center; border-top: 8px solid ${isSuccess ? palette.success : palette.error};">
        <h2 style="margin-bottom: 0.5rem; color: ${isSuccess ? palette.success : palette.error}; font-size: 1.5rem; letter-spacing: 0.5px;">${title}</h2>
        <p style="margin-bottom: 1.5rem; color: ${palette.text}; font-size: 1.08rem;">${message}</p>
        <button id="close-subscribe-modal" style="background: ${palette.success}; color: #fff; border: none; border-radius: 6px; padding: 0.6rem 2rem; font-size: 1.08rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-subscribe-modal').onclick = () => {
      modal.remove();
    };
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var email = form.email.value.trim().toLowerCase();
    if (!email) return;

    // Frontend rate limiting: 1 subscribe per minute per browser
    var lastSub = localStorage.getItem('lastSubscribe');
    var now = Date.now();
    if (lastSub && now - parseInt(lastSub, 10) < 60 * 1000) {
      showModal("Please wait", "You can only subscribe once per minute from this device.", false);
      return;
    }
    localStorage.setItem('lastSubscribe', now.toString());

    db.collection("subscriptions").add({ email: email, createdAt: new Date() })
      .then(function() {
        // Call backend API to send welcome email
        fetch(`${window.API_BASE}/api/send-welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        showModal(
          "Subscription Successful",
          "Thank you for subscribing. You will receive updates from us via email.",
          true
        );
        form.reset();
      })
      .catch(function(err) {
        showModal(
          "Subscription Error",
          "An error occurred. Please try again later or contact us at <a href='mailto:kaiscabinph@gmail.com'>kaiscabinph@gmail.com</a>.",
          false
        );
      });
  });
}); 