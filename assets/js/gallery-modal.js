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

  /* --- CAPTION ALBUM + FOTOGRAFI (LOGICA AVANZATA) --- */
  const titleEl = modal.querySelector('.modal-album-title');
  const phEl = modal.querySelector('.modal-photographer');

  if (titleEl) titleEl.textContent = folder.name || "";

  if (phEl) {
    // Supporta sia folder.photographers (array/oggetto) che folder.photographer (stringa)
    const photographers = folder.photographers || folder.photographer || null;

    if (!photographers) {
      phEl.textContent = "";
    } else {
      let html = "pics by ";

      // Caso 1: Stringa singola
      if (typeof photographers === "string") {
        html += photographers;
      } 
      // Caso 2: Array di fotografi
      else if (Array.isArray(photographers)) {
        html += photographers
          .map(ph => {
            if (typeof ph === "string") return ph;
            if (typeof ph === "object" && ph.name) {
              return ph.url 
                ? `<a href="${ph.url}" target="_blank">${ph.name}</a>` 
                : ph.name;
            }
            return "";
          })
          .filter(Boolean)
          .join(", ");
      }
      // Caso 3: Oggetto singolo {name, url}
      else if (typeof photographers === "object" && photographers.name) {
        html += photographers.url 
          ? `<a href="${photographers.url}" target="_blank">${photographers.name}</a>` 
          : photographers.name;
      }
      
      phEl.innerHTML = html;
    }
  }

  /* --- RENDER GRIGLIA IMMAGINI --- */
  if (grid) {
    grid.innerHTML = '';
    folder.images.forEach((imgSrc, index) => {
      const img = document.createElement('img');
      img.src = `${folder.path}/${imgSrc}`;
      img.loading = "lazy"; // Ottimizzazione caricamento
      img.addEventListener('click', () => openCarousel(index));
      grid.appendChild(img);
    });
    grid.classList.remove('hidden');
  }

  // Reset carosello all'apertura di una nuova cartella
  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }

  modal.classList.remove('hidden');
  modal.classList.add('open');

  // Blocca lo scroll del body
  document.body.style.overflow = 'hidden';
}

/* ============================================================
   CHIUSURA MODALE
============================================================ */
function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const carousel = modal.querySelector('.carousel');
  const grid = modal.querySelector('.modal-grid');

  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }
  if (grid) grid.classList.remove('hidden');

  modal.classList.remove('open');
  modal.classList.add('hidden');

  // Ripristina lo scroll e pulisce lo stato
  document.body.style.overflow = '';
  currentFolder = null;
  currentIndex = 0;
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

/* ============================================================
   UI CONTROLS & EVENT LISTENER
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('galleryModal');
  if (!modalEl) return;

  const closeBtn = modalEl.querySelector('.close');
  const prevBtn = modalEl.querySelector('.prev');
  const nextBtn = modalEl.querySelector('.next');

  // Gestione chiusura
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeGalleryModal();
    });
  }

  // Frecce (Nascondi se non vuoi navigazione nel carosello o riattiva se serve)
  if (prevBtn) prevBtn.style.display = "none"; 
  if (nextBtn) nextBtn.style.display = "none";

  // Chiudi cliccando fuori dal contenuto (opzionale)
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeGalleryModal();
  });
});
