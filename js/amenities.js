if (typeof db === 'undefined') {
  var db;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }
  db = firebase.firestore();
}

let amenitiesData = [];
let currentCategory = 'All';
let currentPage = 0;
const CARDS_PER_PAGE = 4;

function fetchAmenities() {
  return db.collection("amenities").get().then(snapshot => {
    amenitiesData = snapshot.docs.map(doc => doc.data());
    renderAll();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAmenities();
});

function renderCategoryButtons() {
  const categoriesContainer = document.querySelector('.amenities__categories');
  if (!categoriesContainer) return;
  // Get unique categories from current amenitiesData
  const categories = Array.from(new Set(amenitiesData.map(a => a.category)));
  categoriesContainer.innerHTML = '';
  // All button
  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn' + (currentCategory === 'All' ? ' active' : '');
  allBtn.textContent = 'All';
  allBtn.onclick = () => {
    currentCategory = 'All';
    currentPage = 0;
    renderAll();
  };
  categoriesContainer.appendChild(allBtn);
  // Category buttons
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn' + (currentCategory === cat ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      currentCategory = cat;
      currentPage = 0;
      renderAll();
    };
    categoriesContainer.appendChild(btn);
  });
}

function renderAmenities() {
  const carousel = document.querySelector('.amenities__carousel');
  if (!carousel) return;
  carousel.innerHTML = '';
  let filtered = amenitiesData;
  if (currentCategory !== 'All') {
    filtered = amenitiesData.filter(a => a.category === currentCategory);
  } else {
    // Sort alphabetically by label for 'All'
    filtered = [...amenitiesData].sort((a, b) => a.label.localeCompare(b.label));
  }
  // Pagination
  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
  const startIdx = currentPage * CARDS_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + CARDS_PER_PAGE);

  // Render as a grid (4 per row)
  const grid = document.createElement('div');
  grid.className = 'amenities__slide active';
  pageItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'amenity';
    card.innerHTML = `
      <img src="${item.icon}" alt="${item.label}" class="amenity__icon">
      <span class="amenity__label">${item.label}</span>
      <span class="amenity__desc">${item.desc}</span>
    `;
    grid.appendChild(card);
  });
  // Fill with empty cards for layout
  const remainder = pageItems.length % CARDS_PER_PAGE;
  if (remainder !== 0) {
    for (let i = 0; i < CARDS_PER_PAGE - remainder; i++) {
      const empty = document.createElement('div');
      empty.className = 'amenity amenity--empty';
      grid.appendChild(empty);
    }
  }
  // Clear carousel and append grid first
  carousel.innerHTML = '';
  carousel.appendChild(grid);

  // Pagination controls (always after grid)
  if (totalPages > 1) {
    const controls = document.createElement('div');
    controls.className = 'amenities__carousel-controls';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'amenities__carousel-btn prev';
    prevBtn.innerHTML = '&#8592;';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => {
      if (currentPage > 0) {
        currentPage--;
        renderAll();
      }
    };
    controls.appendChild(prevBtn);
    const nextBtn = document.createElement('button');
    nextBtn.className = 'amenities__carousel-btn next';
    nextBtn.innerHTML = '&#8594;';
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.onclick = () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        renderAll();
      }
    };
    controls.appendChild(nextBtn);
    // Always append controls after the grid
    carousel.appendChild(controls);
  }
}

function renderAll() {
  renderCategoryButtons();
  renderAmenities();
}