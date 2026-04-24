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


