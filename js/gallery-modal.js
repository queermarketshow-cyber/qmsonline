function openFolderModal(folder) {
  currentFolder = folder;

  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const grid = modal.querySelector('.modal-grid');
  const carousel = modal.querySelector('.carousel');

  grid.innerHTML = '';
  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }

  folder.images.forEach((imgName, index) => {
    const img = document.createElement('img');
    img.src = `${folder.path}/${imgName}`;
    img.className = 'grid-img';
    img.alt = `${folder.name} ${index + 1}`;

    img.addEventListener('click', () => {
      currentIndex = index;
      openLightbox(`${folder.path}/${imgName}`);
    });

    grid.appendChild(img);
  });

  modal.classList.add('open');
  modal.classList.remove('hidden');
}

function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const grid = modal.querySelector('.modal-grid');
  const carousel = modal.querySelector('.carousel');

  if (grid) grid.classList.remove('hidden');

  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }

  modal.classList.add('hidden');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* CAROSELLO */
function openCarousel(index) {
  currentIndex = index;

  const modal = document.getElementById('galleryModal');
  if (!modal || !currentFolder) return;

  const carousel = modal.querySelector('.carousel');
  const img = modal.querySelector('.carousel-img');
  if (!carousel || !img) return;

  img.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;

  carousel.classList.remove('hidden');
  carousel.classList.add('fullscreen');

  const grid = modal.querySelector('.modal-grid');
  if (grid) grid.classList.add('hidden');
}

function updateCarousel() {
  const modal = document.getElementById('galleryModal');
  const img = modal?.querySelector('.carousel-img');
  if (!img || !currentFolder) return;

  img.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
}

document.getElementById('galleryModal')
  ?.querySelector('.prev')
  ?.addEventListener('click', () => {
    if (!currentFolder) return;
    currentIndex = (currentIndex - 1 + currentFolder.images.length) % currentFolder.images.length;
    updateCarousel();
  });

document.getElementById('galleryModal')
  ?.querySelector('.next')
  ?.addEventListener('click', () => {
    if (!currentFolder) return;
    currentIndex = (currentIndex + 1) % currentFolder.images.length;
    updateCarousel();
  });

document.getElementById('galleryModal')
  ?.querySelector('.close')
  ?.addEventListener('click', () => {
    const modal = document.getElementById('galleryModal');
    if (!modal) return;

    const grid = modal.querySelector('.modal-grid');
    const carousel = modal.querySelector('.carousel');

    if (grid) grid.classList.remove('hidden');

    if (carousel) {
      carousel.classList.add('hidden');
      carousel.classList.remove('fullscreen');
    }
  });
