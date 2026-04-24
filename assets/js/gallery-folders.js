/* ============================================================
   GALLERY FOLDERS — GESTIONE ANTEPRIME E SLIDESHOW
============================================================ */

// Tiene traccia di quali cartelle sono visibili sullo schermo per lo slideshow
const visibleFolders = new Set();

/**
 * Fisher–Yates shuffle: randomizza l'ordine di un array senza mutare l'originale.
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Renderizza le anteprime delle cartelle in ordine casuale.
 * Utilizza galleryData (che deve essere popolato dal fetch centrale).
 */
function renderFolderPreviews() {
  const container = document.querySelector('.gallery-folders');
  // galleryData deve essere globale o passato all'app
  if (!container || !window.galleryData) return;

  container.innerHTML = '';

  // 🔀 RANDOMIZZA L’ORDINE DELLE CARTELLE
  const randomizedFolders = shuffleArray(window.galleryData);

  randomizedFolders.forEach((folder) => {
    const preview = document.createElement('div');
    preview.className = 'folder-preview';
    
    // Mantiene l'indice originale per il riferimento corretto ai dati
    preview.dataset.folderIndex = window.galleryData.indexOf(folder);

    const img = document.createElement('img');
    img.src = `${folder.path}/${folder.images[0]}`;
    img.alt = folder.name;
    img.loading = "lazy"; // Ottimizzazione performance

    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.textContent = folder.name;

    preview.appendChild(img);
    preview.appendChild(overlay);

    // Evento click per aprire la modale della cartella
    preview.addEventListener('click', () => {
      if (typeof openFolderModal === 'function') {
        openFolderModal(folder);
      }
    });

    container.appendChild(preview);
  });

  // Dopo il rendering, inizializza l'observer per lo slideshow
  setupVisibilityObserver();
}

/* ============================================================
   VISIBILITY OBSERVER
============================================================ */

/**
 * Monitora quali anteprime entrano o escono dal viewport.
 */
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
   SLIDESHOW RANDOM (INTEGRATED & SAFE)
============================================================ */

/**
 * Avvia il ciclo che cambia le immagini nelle cartelle attualmente visibili.
 */
function startRandomSlideshow() {
  // Pulisce eventuali intervalli esistenti per evitare processi duplicati
  if (window.gallerySlideshowInterval) {
    clearInterval(window.gallerySlideshowInterval);
  }

  window.gallerySlideshowInterval = setInterval(() => {
    const previews = Array.from(document.querySelectorAll('.folder-preview'));
    if (!window.galleryData || visibleFolders.size === 0 || previews.length === 0) return;

    // Sceglie una cartella casuale tra quelle marcate come visibili
    const visibleArray = Array.from(visibleFolders);
    const randomVisibleIndex = visibleArray[Math.floor(Math.random() * visibleArray.length)];

    const preview = previews.find(p => p.dataset.folderIndex == randomVisibleIndex);
    if (!preview) return;

    const realIndex = preview.dataset.folderIndex;
    const folder = window.galleryData[realIndex];

    const img = preview.querySelector('img');
    if (!img || !folder.images || folder.images.length <= 1) return;

    const currentSrc = img.src.split('/').pop();
    let nextImg = currentSrc;
    
    // Sicurezza: prevenzione loop infinito nella scelta della nuova immagine
    let safetyCounter = 0;
    while (nextImg === currentSrc && safetyCounter < 10) {
      nextImg = folder.images[Math.floor(Math.random() * folder.images.length)];
      safetyCounter++;
    }

    // Effetto visivo glitch durante lo scambio
    preview.classList.add('glitch-flash');
    
    setTimeout(() => {
      img.src = `${folder.path}/${nextImg}`;
      preview.classList.remove('glitch-flash');
    }, 120);
    
  }, 4000); // Cambio ogni 4 secondi
}
