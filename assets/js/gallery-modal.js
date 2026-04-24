/* ============================================================
   STATO GLOBALE MODALE
============================================================ */
let currentFolder = null;
let currentIndex = 0;

/* ============================================================
   APERTURA MODALE CARTELLA
============================================================ */
function openFolderModal(folder) {
  currentFolder = folder;
  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const grid = modal.querySelector('.modal-grid');
  const carousel = modal.querySelector('.carousel');
  const titleEl = modal.querySelector('.modal-album-title');
  const phEl = modal.querySelector('.modal-photographer');

  if (titleEl) titleEl.textContent = folder.name || "";

  // Gestione fotografi (stringa o array)
  if (phEl) {
    const photographers = folder.photographers || folder.photographer || null;
    if (!photographers) {
      phEl.textContent = "";
    } else {
      let html = "pics by ";
      if (typeof photographers === "string") {
        html += photographers;
      } else if (Array.isArray(photographers)) {
        html += photographers
          .map(ph => (typeof ph === "object" ? (ph.url ? `<a href="${ph.url}" target="_blank">${ph.name}</a>` : ph.name) : ph))
          .join(", ");
      }
      phEl.innerHTML = html;
    }
  }

  // Render griglia immagini
  if (grid) {
    grid.innerHTML = '';
    folder.images.forEach((imgSrc, index) => {
      const img = document.createElement('img');
      img.src = `${folder.path}/${imgSrc}`;
      img.loading = "lazy";
      img.addEventListener('click', () => openCarousel(index));
      grid.appendChild(img);
    });
    grid.classList.remove('hidden');
  }

  if (carousel) carousel.classList.add('hidden');

  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   CAROSELLO (LIGHTBOX)
============================================================ */
function openCarousel(index) {
  currentIndex = index;
  const modal = document.getElementById('galleryModal');
  const carousel = modal.querySelector('.carousel');
  const img = modal.querySelector('.carousel-img');

  if (!carousel || !img || !currentFolder) return;

  img.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
  carousel.classList.remove('hidden');
  carousel.classList.add('fullscreen');
  if (modal.querySelector('.modal-grid')) modal.querySelector('.modal-grid').classList.add('hidden');
}

function nextSlide() {
  if (!currentFolder) return;
  currentIndex = (currentIndex + 1) % currentFolder.images.length;
  updateCarousel();
}

function prevSlide() {
  if (!currentFolder) return;
  currentIndex = (currentIndex - 1 + currentFolder.images.length) % currentFolder.images.length;
  updateCarousel();
}

function updateCarousel() {
  const img = document.querySelector('.carousel-img');
  if (img && currentFolder) {
    img.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
  }
}

/* ============================================================
   CONTROLLI UI
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('galleryModal');
  if (!modalEl) return;

  modalEl.querySelector('.close')?.addEventListener('click', closeGalleryModal);
  modalEl.querySelector('.next')?.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });
  modalEl.querySelector('.prev')?.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeGalleryModal();
  });
});
