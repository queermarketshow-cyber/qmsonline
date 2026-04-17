/* ============================================================
   CHAOS GALLERY — HOME VERSION (FIXED)
============================================================ */

async function loadChaosGallery() {
  // 1. USA IL CACHE GLOBALE (Evita il fetch duplicato)
  // Se galleryData non è ancora pronto, attendi o usa la funzione centralizzata
  if (!window.galleryData) {
    console.warn("Dati gallery non ancora pronti.");
    return;
  }

  // 1. Costruisci un array con TUTTE le immagini
  const allImages = [];
  window.galleryData.forEach(folder => {
    folder.images.forEach(img => {
      allImages.push({ src: `${folder.path}/${img}` });
    });
  });

  // 2. Shuffle più efficiente (Fisher-Yates)
  const count = Math.floor(Math.random() * 16) + 20;
  const shuffled = allImages.sort(() => Math.random() - 0.5); // Per il caos va bene così
  const selected = shuffled.slice(0, count);

  const imgLayer = document.querySelector('.qms-gallery-images');
  const labelLayer = document.querySelector('.qms-gallery-labels');
  if (!imgLayer || !labelLayer) return;

  const labels = Array.from(labelLayer.querySelectorAll('.label'));
  const cta = document.querySelector('.chaos-button');
  const grid = document.querySelector('.qms-gallery-grid');

  const gridWidth = grid.clientWidth;
  const gridHeight = grid.clientHeight;

  // Scaling Dinamico
  const scaleFactor = Math.min(gridWidth, gridHeight) / 900;
  const labelScale = Math.max(0.6, Math.min(1.2, scaleFactor));
  const ctaScale = Math.max(0.5, Math.min(1.0, scaleFactor));

  labels.forEach(label => {
    label.style.transform = `scale(${labelScale})`;
    label.style.transformOrigin = "left top";
  });

  cta.style.transform = `translate(-50%, -50%) rotate(-6deg) scale(${ctaScale})`;

  // ---------------------------
  // GENERAZIONE IMMAGINI (Con Safety Counter)
  // ---------------------------
  imgLayer.innerHTML = ''; // Pulisce prima di iniettare
  selected.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.src;

    const maxX = gridWidth * 0.75;
    const maxY = gridHeight * 0.75;

    img.style.top = Math.random() * maxY + 'px';
    img.style.left = Math.random() * maxX + 'px';
    img.style.transform = `rotate(${Math.random() * 50 - 25}deg)`;
    img.style.zIndex = Math.floor(Math.random() * 50) + 1;
    img.loading = "lazy"; // Ottimizzazione

    imgLayer.appendChild(img);
  });

  // ---------------------------
  // POSIZIONAMENTO LABELS (Anti-Freeze)
  // ---------------------------
  const placedLabels = [];
  const ctaRect = cta.getBoundingClientRect();
  const BUFFER = 12;

  function isColliding(lr, otherRects) {
    // Collisione con CTA
    const collidesWithCTA = !(
      lr.right + BUFFER < ctaRect.left ||
      lr.left - BUFFER > ctaRect.right ||
      lr.bottom + BUFFER < ctaRect.top ||
      lr.top - BUFFER > ctaRect.bottom
    );
    if (collidesWithCTA) return true;

    // Collisione con altre Labels
    return otherRects.some(br => !(
      lr.right + BUFFER < br.left ||
      lr.left - BUFFER > br.right ||
      lr.bottom + BUFFER < br.top ||
      lr.top - BUFFER > br.bottom
    ));
  }

  labels.forEach((label) => {
    let attempts = 0;
    let placed = false;

    // Forza display per calcolare offsetWidth/Height una volta sola
    label.style.display = 'block';
    label.style.visibility = 'hidden';

    const lw = label.offsetWidth * labelScale;
    const lh = label.offsetHeight * labelScale;

    while (!placed && attempts < 150) { // Ridotto a 150 per performance
      attempts++;

      const top = Math.random() * (gridHeight - lh - 20);
      const left = Math.random() * (gridWidth - lw - 20);

      // Simuliamo il rect senza chiamare getBoundingClientRect() ogni volta
      const virtualRect = {
        left: left,
        top: top,
        right: left + lw,
        bottom: top + lh
      };

      if (!isColliding(virtualRect, placedLabels)) {
        label.style.top = top + 'px';
        label.style.left = left + 'px';
        label.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${labelScale})`;
        
        placedLabels.push(virtualRect);
        placed = true;
      }
    }
    label.style.visibility = 'visible';
  });
}

// Inizializzazione sicura
document.addEventListener('DOMContentLoaded', () => {
    // Se i dati sono già pronti, carica, altrimenti aspetta l'evento custom
    if (window.galleryData) loadChaosGallery();
    else document.addEventListener('galleryReady', loadChaosGallery);
});
