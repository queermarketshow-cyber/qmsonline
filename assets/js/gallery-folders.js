/* ============================================================
   GALLERY FOLDERS — GESTIONE ANTEPRIME E SLIDESHOW
============================================================ */

// Tiene traccia di quali cartelle sono visibili sullo schermo per lo slideshow
const visibleFolders = new Set();

/**
 * Inizializzazione: Carica i dati dal JSON e avvia la galleria
 */
document.addEventListener('DOMContentLoaded', () => {
  fetch('gallery.json') // Assicurati che il percorso sia corretto rispetto all'HTML
    .then(response => {
      if (!response.ok) throw new Error("Errore nel caricamento di gallery.json");
      return response.json();
    })
    .then(data => {
      // Popola la variabile globale necessaria per le funzioni
      window.galleryData = data.folders;
      
      // Avvia il rendering e lo slideshow
      renderFolderPreviews();
      startRandomSlideshow();
    })
    .catch(error => console.error("Errore inizializzazione:", error));
});

/**
 * Fisher–Yates shuffle: randomizza l'ordine di un array.
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
 * Renderizza le anteprime delle cartelle.
 */
function renderFolderPreviews() {
  const container = document.querySelector('.gallery-folders');
  if (!container || !window.galleryData) return;

  container.innerHTML = '';

  // Randomizza l'ordine delle cartelle
  const randomizedFolders = shuffleArray(window.galleryData);

  randomizedFolders.forEach((folder) => {
    const preview = document.createElement('div');
    preview.className = 'folder-preview';
    
    // Mantiene l'indice originale per il riferimento ai dati
    preview.dataset.folderIndex = window.galleryData.indexOf(folder);

    const img = document.createElement('img');
    img.src = `${folder.path}/${folder.images[0]}`;
    img.alt = folder.name;
    img.loading = "lazy";

    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.textContent = folder.name;

    preview.appendChild(img);
    preview.appendChild(overlay);

    // Click per aprire la modale (definita in gallery-modal.js)
    preview.addEventListener('click', () => {
      if (typeof openFolderModal === 'function') {
        openFolderModal(folder);
      }
    });

    container.appendChild(preview);
  });

  setupVisibilityObserver();
}

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

function startRandomSlideshow() {
  if (window.gallerySlideshowInterval) {
    clearInterval(window.gallerySlideshowInterval);
  }

  window.gallerySlideshowInterval = setInterval(() => {
    const previews = Array.from(document.querySelectorAll('.folder-preview'));
    if (!window.galleryData || visibleFolders.size === 0 || previews.length === 0) return;

    const visibleArray = Array.from(visibleFolders);
    const randomVisibleIndex = visibleArray[Math.floor(Math.random() * visibleArray.length)];

    const preview = previews.find(p => p.dataset.folderIndex == randomVisibleIndex);
    if (!preview) return;

    const folder = window.galleryData[preview.dataset.folderIndex];
    const img = preview.querySelector('img');
    if (!img || !folder.images || folder.images.length <= 1) return;

    const currentSrc = img.src.split('/').pop();
    let nextImg = currentSrc;
    
    let safetyCounter = 0;
    while (nextImg === currentSrc && safetyCounter < 10) {
      nextImg = folder.images[Math.floor(Math.random() * folder.images.length)];
      safetyCounter++;
    }

    preview.classList.add('glitch-flash');
    
    setTimeout(() => {
      img.src = `${folder.path}/${nextImg}`;
      preview.classList.remove('glitch-flash');
    }, 120);
    
  }, 4000);
}
