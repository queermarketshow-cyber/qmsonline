/* ===============================
   VARIABILI GLOBALI
=============================== */
let galleryData = null;
let currentFolder = null;
let currentIndex = 0;
let initialDistance = 0;
let currentScale = 1;
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
   CARICAMENTO GALLERIA
=============================== */
document.addEventListener('DOMContentLoaded', () => {
  fetch('/gallery.json')
    .then(res => res.json())
    .then(data => {
      galleryData = data.folders || [];
      renderFolderPreviews();
      setupVisibilityObserver();
      startRandomSlideshow();
    })
    .catch(err => console.error('Errore caricamento gallery.json:', err));
});
