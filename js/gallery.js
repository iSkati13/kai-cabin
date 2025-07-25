if (typeof db === 'undefined') {
  var db;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }
  db = firebase.firestore();
}

let galleryImages = [];

async function fetchGalleryImages() {
  try {
    const snapshot = await db.collection("gallery").orderBy("order", "asc").get();
    galleryImages = snapshot.docs.map(doc => doc.data());
    return galleryImages;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchGalleryImages();

  const slideshow = document.getElementById('gallerySlideshow');
  const dotsContainer = document.querySelector('.gallery__dots');
  if (!slideshow || !dotsContainer || galleryImages.length === 0) return;

  slideshow.innerHTML = galleryImages.map((img, i) => `
    <div class="gallery__slide${i === 0 ? ' active' : ''}">
      <div class="gallery__holder">
        <img src="${img.imageUrl || img.imgUrl || img.src || ''}" alt="${img.alt || 'Gallery Image'}" class="gallery__image">
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = galleryImages.map((_, i) =>
    `<span class="gallery__dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`
  ).join('');

  const slides = Array.from(slideshow.querySelectorAll('.gallery__slide'));
  const dots = Array.from(dotsContainer.querySelectorAll('.gallery__dot'));
  let current = 0;
  let timer;

  function showSlide(idx) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev', 'next');
      if (i === idx) slide.classList.add('active');
      else if (i === (idx - 1 + slides.length) % slides.length) slide.classList.add('prev');
      else if (i === (idx + 1) % slides.length) slide.classList.add('next');
    });
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[idx]) dots[idx].classList.add('active');
    current = idx;
  }

  function nextSlide() {
    showSlide((current + 1) % slides.length);
  }

  function prevSlide() {
    showSlide((current - 1 + slides.length) % slides.length);
  }

  function startTimer() {
    timer = setInterval(nextSlide, 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  // Dot navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.idx));
      resetTimer();
    });
  });

  // Swipe support for mobile
  if (galleryImages.length > 1) {
    let xDown = null;
    let yDown = null;
    
    slideshow.addEventListener('touchstart', (evt) => {
      xDown = evt.touches[0].clientX;
      yDown = evt.touches[0].clientY;
    }, false);
    
    slideshow.addEventListener('touchmove', (evt) => {
      if (!xDown || !yDown) return;
      
      const xUp = evt.touches[0].clientX;
      const yUp = evt.touches[0].clientY;
      const xDiff = xDown - xUp;
      const yDiff = yDown - yUp;
      
      if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
        if (xDiff > 0) nextSlide();
        else prevSlide();
        xDown = null;
        yDown = null;
        resetTimer();
      }
    }, false);
  }

  // Initialize gallery
  startTimer();
  showSlide(0);
});