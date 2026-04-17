/* ============================================================
   PREVIEW CARTELLE — RANDOM ORDER
============================================================ */

// Fisher–Yates shuffle (non muta l’array originale)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Renderizza le anteprime delle cartelle.
 * Utilizza galleryData caricato centralmente per evitare fetch duplicati.
 */
function renderFolderPreviews() {
  const container = document.querySelector('.gallery-folders');
  // galleryData deve essere popolato dal fetch centralizzato in events.js
  if (!container || !galleryData) return;

  container.innerHTML = '';

  // 🔀 RANDOMIZZA L’ORDINE DELLE CARTELLE
  const randomizedFolders = shuffleArray(galleryData);

  randomizedFolders.forEach((folder) => {
    const preview = document.createElement('div');
    preview.className = 'folder-preview';
    
    // Usiamo l'indice originale per mantenere il riferimento corretto ai dati
    preview.dataset.folderIndex = galleryData.indexOf(folder);

    const img = document.createElement('img');
    // Prende la prima immagine della cartella come anteprima
    img.src = `${folder.path}/${folder.images[0]}`;
    img.alt = folder.name;
    img.loading = "lazy"; // Ottimizzazione performance

    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.textContent = folder.name;

    preview.appendChild(img);
    preview.appendChild(overlay);

    // Apre la modale specifica per la cartella
    preview.addEventListener('click', () => {
        if (typeof openFolderModal === 'function') {
            openFolderModal(folder);
        }
    });

    container.appendChild(preview);
  });

  // Dopo il render, attiva l’observer per lo slideshow
  setupVisibilityObserver();
}


/* ============================================================
   VISIBILITY OBSERVER
============================================================ */

// Tiene traccia di quali cartelle sono visibili sullo schermo
const visibleFolders = new Set();

function setupVisibilityObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const index = entry.target.dataset.folderIndex;
      if (entry.isIntersecting) {
          visibleFolders.add(index);
      } else {
          visibleFolders.delete(index);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.folder-preview').forEach(el => observer.observe(el));
}


/* ============================================================
   SLIDESHOW RANDOM (SAFE VERSION)
============================================================ */

/**
 * Avvia lo slideshow che cambia casualmente le immagini nelle cartelle visibili.
 * Corretto con un safety counter per prevenire loop infiniti.
 */
function startRandomSlideshow() {
  // Pulizia di eventuali intervalli precedenti per evitare fetch o processi duplicati
  if (window.gallerySlideshowInterval) {
      clearInterval(window.gallerySlideshowInterval);
  }

  window.gallerySlideshowInterval = setInterval(() => {
    const previews = Array.from(document.querySelectorAll('.folder-preview'));
    if (!galleryData || visibleFolders.size === 0 || previews.length === 0) return;

    // Sceglie una cartella casuale tra quelle visibili
    const visibleArray = Array.from(visibleFolders);
    const randomVisibleIndex = visibleArray[Math.floor(Math.random() * visibleArray.length)];

    const preview = previews.find(p => p.dataset.folderIndex == randomVisibleIndex);
    if (!preview) return;

    const realIndex = preview.dataset.folderIndex;
    const folder = galleryData[realIndex];

    const img = preview.querySelector('img');
    if (!img || !folder.images || folder.images.length <= 1) return;

    const currentSrc = img.src.split('/').pop();
    let nextImg = currentSrc;
    
    // --- FIX: SAFETY BRAKE PER LOOP INFINITO ---
    let safetyCounter = 0;
    while (nextImg === currentSrc && safetyCounter < 10) {
      nextImg = folder.images[Math.floor(Math.random() * folder.images.length)];
      safetyCounter++;
    }

    // Effetto visivo glitch durante il cambio
    preview.classList.add('glitch-flash');
    
    // Aggiorna l'immagine dopo il flash
    setTimeout(() => {
        img.src = `${folder.path}/${nextImg}`;
        preview.classList.remove('glitch-flash');
    }, 120);
    
  }, 4000);
}
