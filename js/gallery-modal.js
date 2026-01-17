function openFolderModal(folder) {
  currentFolder = folder;

  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const grid = modal.querySelector('.modal-grid');
  const carousel = modal.querySelector('.carousel');

  /* ============================
     CAPTION ALBUM + FOTOGRAFI
  ============================ */
  const titleEl = modal.querySelector('.modal-album-title');
  const phEl = modal.querySelector('.modal-photographer');

  // Titolo album
  if (titleEl) {
    titleEl.textContent = folder.name || "";
  }

  // Fotografi (multi-support)
  if (phEl) {
    const photographers = folder.photographers || folder.photographer || null;

    if (!photographers) {
      phEl.textContent = "";
    } else {
      let html = "pics by ";

      // Caso 1: stringa singola
      if (typeof photographers === "string") {
        html += photographers;

      // Caso 2: array
      } else if (Array.isArray(photographers)) {
        html += photographers
          .map(ph => {
            if (typeof ph === "string") {
              return ph;
            }
            if (typeof ph === "object" && ph.name) {
              return ph.url
                ? `<a href="${ph.url}" target="_blank">${ph.name}</a>`
                : ph.name;
            }
            return "";
          })
          .filter(Boolean)
          .join(", ");

      // Caso 3: oggetto singolo {name, url}
      } else if (typeof photographers === "object" && photographers.name) {
        html += photographers.url
          ? `<a href="${photographers.url}" target="_blank">${photographers.name}</a>`
          : photographers.name;
      }

      phEl.innerHTML = html;
    }
  }

  /* ============================
     RESET GRIGLIA + CAROSELLO
  ============================ */
  grid.innerHTML = '';
  if (carousel) {
    carousel.classList.add('hidden');
    carousel.classList.remove('fullscreen');
  }

  /* ============================
     GENERA GRIGLIA IMMAGINI
  ============================ */
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

  modal.classList.remove('hidden');
  modal.classList.add('open');

  document.body.style.overflow = 'hidden';
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

  modal.classList.remove('open');
  modal.classList.add('hidden');

  document.body.style.overflow = '';
}

/* ============================
   CAROSELLO
============================ */
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
    closeGalleryModal();
  });
