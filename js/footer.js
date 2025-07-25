(function() {
  const nearbyLocationsLink = document.getElementById('nearbyLocationsLink');
  const nearbyLocationsModal = document.getElementById('nearbyLocationsModal');
  const nearbyLocationsClose = document.getElementById('nearbyLocationsClose');
  let lastScrollY = 0;

  function openModal() {
    lastScrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${lastScrollY}px`;
    nearbyLocationsModal.classList.remove('hidden');
    nearbyLocationsModal.classList.add('show');
  }

  function closeModal() {
    document.body.classList.remove('modal-open');
    nearbyLocationsModal.classList.remove('show');
    nearbyLocationsModal.classList.add('hidden');
    window.scrollTo(0, lastScrollY);
    document.body.style.top = '';
  }

  if (nearbyLocationsLink && nearbyLocationsModal && nearbyLocationsClose) {
    nearbyLocationsLink.addEventListener('click', function(e) {
      e.preventDefault();
      openModal();
    });
    nearbyLocationsClose.addEventListener('click', closeModal);
    nearbyLocationsModal.addEventListener('click', function(e) {
      if (e.target === nearbyLocationsModal) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nearbyLocationsModal.classList.contains('show')) {
        closeModal();
      }
    });
  }

  const cancellationPolicyLink = document.getElementById('cancellationPolicyLink');
  const cancellationPolicyModal = document.getElementById('cancellationPolicyModal');
  const cancellationPolicyClose = document.getElementById('cancellationPolicyClose');
  let lastScrollY2 = 0;

  function openCancellationModal() {
    lastScrollY2 = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${lastScrollY2}px`;
    cancellationPolicyModal.classList.remove('hidden');
    cancellationPolicyModal.classList.add('show');
  }

  function closeCancellationModal() {
    document.body.classList.remove('modal-open');
    cancellationPolicyModal.classList.remove('show');
    cancellationPolicyModal.classList.add('hidden');
    window.scrollTo(0, lastScrollY2);
    document.body.style.top = '';
  }

  if (cancellationPolicyLink && cancellationPolicyModal && cancellationPolicyClose) {
    cancellationPolicyLink.addEventListener('click', function(e) {
      e.preventDefault();
      openCancellationModal();
    });
    cancellationPolicyClose.addEventListener('click', closeCancellationModal);
    cancellationPolicyModal.addEventListener('click', function(e) {
      if (e.target === cancellationPolicyModal) {
        closeCancellationModal();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && cancellationPolicyModal.classList.contains('show')) {
        closeCancellationModal();
      }
    });
  }

  // House Rules Modal
  const houseRulesLink = document.getElementById('houseRulesLink');
  const houseRulesModal = document.getElementById('houseRulesModal');
  const houseRulesClose = document.getElementById('houseRulesClose');
  let lastScrollY3 = 0;

  function openHouseRulesModal(e) {
    if (e) e.preventDefault();
    lastScrollY3 = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${lastScrollY3}px`;
    houseRulesModal.classList.remove('hidden');
    houseRulesModal.classList.add('show');
  }
  function closeHouseRulesModal() {
    document.body.classList.remove('modal-open');
    houseRulesModal.classList.remove('show');
    houseRulesModal.classList.add('hidden');
    window.scrollTo(0, lastScrollY3);
    document.body.style.top = '';
  }
  if (houseRulesLink && houseRulesModal && houseRulesClose) {
    houseRulesLink.addEventListener('click', openHouseRulesModal);
    houseRulesClose.addEventListener('click', closeHouseRulesModal);
    houseRulesModal.addEventListener('click', function(e) {
      if (e.target === houseRulesModal) closeHouseRulesModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && houseRulesModal.classList.contains('show')) closeHouseRulesModal();
    });
  }
})(); 