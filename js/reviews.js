if (typeof db === 'undefined') {
  var db;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }
  db = firebase.firestore();
}

let reviews = [];
let currentReview = 0;
let autoSlideInterval;
let isSliding = false;
const ANIMATION_DURATION = 700;

function fetchReviewsFromFirestore() {
  db.collection('reviews').get().then(snapshot => {
    reviews = snapshot.docs.map(doc => doc.data());
    if (reviews.length === 0) {
      reviews = [{
        name: "No reviews yet",
        location: "",
        rating: 5,
        comment: "Be the first to leave a review!"
      }];
    }
    currentReview = 0;
    renderReview(currentReview);
    startAutoSlide();
  }).catch(() => {
    reviews = [{
      name: "Error loading reviews",
      location: "",
      rating: 5,
      comment: "Please try again later."
    }];
    currentReview = 0;
    renderReview(currentReview);
  });
}

function renderReview(index, direction = 'right') {
  const review = reviews[index];
  const stars = Array.from({length: 5}, (_, i) =>
    `<span class="review__star${i < review.rating ? ' review__star--filled' : ''}">&#9733;</span>`
  ).join('');
  const reviewCard = document.createElement('div');
  reviewCard.className = `review__card review__card--slide-in-${direction}`;
  reviewCard.innerHTML = `
    <div class="review__stars">${stars}</div>
    <div class="review__comment">"${review.comment}"</div>
    <div class="review__name">- ${review.name}${review.location ? ', <span class=\"review__location\">' + review.location + '</span>' : ''}</div>
  `;
  const slideshow = document.getElementById('reviewsSlideshow');
  const oldCard = slideshow.querySelector('.review__card');
  if (oldCard) {
    isSliding = true;
    oldCard.classList.add(`review__card--slide-out-${direction}`);
    setTimeout(() => {
      slideshow.innerHTML = '';
      slideshow.appendChild(reviewCard);
      renderDots();
      isSliding = false;
    }, ANIMATION_DURATION);
  } else {
    slideshow.innerHTML = '';
    slideshow.appendChild(reviewCard);
    renderDots();
    isSliding = false;
  }
}

function renderDots() {
  const dots = reviews.map((_, i) =>
    `<span class="review__dot${i === currentReview ? ' review__dot--active' : ''}" data-index="${i}"></span>`
  ).join('');
  document.getElementById('reviewsDots').innerHTML = dots;
}

document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.reviews__title');
  if (title) title.textContent = "Hear From Our Guests";
  const container = document.querySelector('#reviews .container');
  if (container && !document.getElementById('reviewsSubtitle')) {
    const subtitle = document.createElement('div');
    subtitle.id = 'reviewsSubtitle';
    subtitle.textContent = "What Guests Are Saying About Kai's Cabin";
    subtitle.className = 'reviews__subtitle';
    container.insertBefore(subtitle, document.getElementById('reviewsSlideshow'));
  }
  fetchReviewsFromFirestore();

  document.getElementById('reviewsDots').addEventListener('click', (e) => {
    if (isSliding) return;
    if (e.target.classList.contains('review__dot')) {
      const idx = parseInt(e.target.dataset.index, 10);
      if (idx !== currentReview) {
        renderReview(idx, idx > currentReview ? 'right' : 'left');
        currentReview = idx;
        resetAutoSlide();
      }
    }
  });
});

function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    const next = (currentReview + 1) % reviews.length;
    renderReview(next, 'right');
    currentReview = next;
  }, 11000);
}

function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  startAutoSlide();
} 