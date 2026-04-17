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

  /* --- CAPTION ALBUM + FOTOGRAFI --- */
  const titleEl = modal.querySelector('.modal-album-title');
  const phEl = modal.querySelector('.modal-photographer');

  if (titleEl) titleEl.textContent = folder.name || "";

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
          .map(ph => {
            if (typeof ph === "string") return ph;
            if (typeof ph === "object" && ph.name) {
              return ph.url ? `<a href="${ph.url}" target="_blank">${ph.name}</a>` : ph.name;
            }
            return "";
          })
          .filter(Boolean)
          .join(", ");
      } else if (typeof photographers === "object" && photographers.name) {
        html += photographers.url ? `<a href="${photographers.url}" target="_blank">${photographers.name}</a>` : photographers.name;
      }
      phEl.innerHTML = html;
    }
  }

  /* --- RESET GRIGLIA + CAROSELLO --- */
  grid.innerHTML = '';
  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }

  /* --- GENERA GRIGLIA IMMAGINI (Safe Logic) --- */
  folder.images.forEach((imgName, index) => {
    const img = document.createElement('img');
    img.src = `${folder.path}/${imgName}`;
    img.className = 'grid-img';
    img.alt = `${folder.name} ${index + 1}`;
    
    // PERFORMANCE: Lazy load per le immagini nella griglia modale
    img.loading = "lazy";

    img.addEventListener('click', () => {
      // FIX: Chiamiamo openCarousel invece di un inesistente openLightbox
      openCarousel(index);
    });

    grid.appendChild(img);
  });

  modal.classList.remove('hidden');
  modal.classList.add('open');

  // Blocca lo scroll del body
  document.body.style.overflow = 'hidden';
}

/* ============================================================
   GESTIONE CHIUSURA
============================================================ */
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

  modal.classList.remove('open');
  modal.classList.add('hidden');

  document.body.style.overflow = '';
  currentFolder = null; // Reset stato
}

/* ============================================================
   CAROSELLO (LIGHTBOX)
============================================================ */
function openCarousel(index) {
  currentIndex = index;

  const modal = document.getElementById('galleryModal');
  if (!modal || !currentFolder) return;

  const carousel = modal.querySelector('.carousel');
  const img = modal.querySelector('.carousel-img');
  if (!carousel || !img) return;

  // Carica l'immagine selezionata
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

/* --- UI CONTROLS --- */
// Frecce disattivate come da tua richiesta, ma logica pronta per il futuro
const modalEl = document.getElementById('galleryModal');
if (modalEl) {
    const prevBtn = modalEl.querySelector('.prev');
    const nextBtn = modalEl.querySelector('.next');
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";

    modalEl.querySelector('.close')?.addEventListener('click', closeGalleryModal);
}
