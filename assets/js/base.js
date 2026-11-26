/* ===============================
   VARIABILI GLOBALI (solo quelle utili)
=============================== */
let galleryData = [];
let currentFolder = null;
let currentIndex = 0;
let visibleFolders = new Set();

/* ===============================
   SCROLL "ENTRA" → MANIFESTO
=============================== */
const enterBtn = document.getElementById('enterBtn');
if (enterBtn) {
  enterBtn.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#manifesto')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ===============================
   CARICAMENTO GALLERIA (ottimizzato)
=============================== */
document.addEventListener('DOMContentLoaded', async () => {
  const hasGalleryInPage = document.querySelector(
    '.gallery-folders, .poster-collage, .poster-collage-xs, #galleryModal'
  );

  if (!hasGalleryInPage) return;

  try {
    const res = await fetch('gallery.json', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    galleryData = data.folders || [];

    if (galleryData.length === 0) {
      console.warn('Nessuna cartella trovata in gallery.json');
      return;
    }

    if (typeof window.renderFolderPreviews === 'function') {
      window.renderFolderPreviews();
    }
    if (typeof window.setupVisibilityObserver === 'function') {
      window.setupVisibilityObserver();
    }
    if (typeof window.startRandomSlideshow === 'function') {
      window.startRandomSlideshow();
    }
  } catch (err) {
    console.error('Errore caricamento gallery.json:', err);
  }
});