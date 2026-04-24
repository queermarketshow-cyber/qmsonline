/* ============================================================
   CHAOS GALLERY — HOME VERSION (INTEGRATED & OPTIMIZED)
============================================================ */

async function loadChaosGallery() {
  // 1. GESTIONE DATI (Asincrona con Fallback)
  // Utilizza window.galleryData se disponibile (caricato da uno script centrale)
  // altrimenti effettua il fetch locale per compatibilità.
  let data;
  if (window.galleryData) {
    data = window.galleryData;
  } else {
    try {
      const response = await fetch('gallery.json');
      const json = await response.json();
      data = json.folders;
    } catch (err) {
      console.error("Errore nel caricamento della galleria:", err);
      return;
    }
  }

  // 2. PREPARAZIONE IMMAGINI
  const allImages = [];
  data.forEach(folder => {
    folder.images.forEach(img => {
      allImages.push({ src: `${folder.path}/${img}` });
    });
  });

  // 3. SELEZIONE CASUALE (20-35 immagini)
  const count = Math.floor(Math.random() * 16) + 20;
  const selected = allImages.sort(() => Math.random() - 0.5).slice(0, count);

  const imgLayer = document.querySelector('.qms-gallery-images');
  const labelLayer = document.querySelector('.qms-gallery-labels');
  const cta = document.querySelector('.chaos-button');
  const grid = document.querySelector('.qms-gallery-grid');

  if (!imgLayer || !labelLayer || !grid || !cta) return;

  const labels = Array.from(labelLayer.querySelectorAll('.label'));
  const gridWidth = grid.clientWidth;
  const gridHeight = grid.clientHeight;

  // 4. SCALING DINAMICO (Basato sulla dimensione del container)
  const scaleFactor = Math.min(gridWidth, gridHeight) / 900;
  const labelScale = Math.max(0.6, Math.min(1.2, scaleFactor));
  const ctaScale = Math.max(0.5, Math.min(1.0, scaleFactor));

  // Applica scaling alla CTA
  cta.style.transform = `translate(-50%, -50%) rotate(-6deg) scale(${ctaScale})`;

  // 5. GENERAZIONE IMMAGINI NEL LAYER
  imgLayer.innerHTML = ''; 
  selected.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.src;
    img.loading = "lazy"; // Ottimizzazione caricamento

    const maxX = gridWidth * 0.75;
    const maxY = gridHeight * 0.75;

    img.style.top = Math.random() * maxY + 'px';
    img.style.left = Math.random() * maxX + 'px';
    img.style.transform = `rotate(${Math.random() * 50 - 25}deg)`;
    img.style.zIndex = Math.floor(Math.random() * 50) + 1;

    imgLayer.appendChild(img);
  });

  // 6. POSIZIONAMENTO LABELS (Anti-Collisione & Anti-Freeze)
  const placedLabelsRects = [];
  const ctaRect = cta.getBoundingClientRect();
  const BUFFER = 12; // Spazio minimo tra gli elementi

  /**
   * Verifica collisioni usando coordinate virtuali per evitare 
   * continui ricalcoli del DOM (getBoundingClientRect)
   */
  function isColliding(rect, others) {
    // Collisione con la CTA centrale
    const collidesWithCTA = !(
      rect.right + BUFFER < ctaRect.left ||
      rect.left - BUFFER > ctaRect.right ||
      rect.bottom + BUFFER < ctaRect.top ||
      rect.top - BUFFER > ctaRect.bottom
    );
    if (collidesWithCTA) return true;

    // Collisione con altre label già posizionate
    return others.some(br => !(
      rect.right + BUFFER < br.left ||
      rect.left - BUFFER > br.right ||
      rect.bottom + BUFFER < br.top ||
      rect.top - BUFFER > br.bottom
    ));
  }

  labels.forEach((label) => {
    let attempts = 0;
    let placed = false;

    // Reset stile per calcolo dimensioni
    label.style.display = 'block';
    label.style.visibility = 'hidden';

    const lw = label.offsetWidth * labelScale;
    const lh = label.offsetHeight * labelScale;

    // Limite di tentativi (150) per evitare loop infiniti su schermi piccoli
    while (!placed && attempts < 150) {
      attempts++;

      const top = Math.random() * (gridHeight - lh - 20);
      const left = Math.random() * (gridWidth - lw - 20);

      const virtualRect = {
        left: left,
        top: top,
        right: left + lw,
        bottom: top + lh
      };

      if (!isColliding(virtualRect, placedLabelsRects)) {
        label.style.top = top + 'px';
        label.style.left = left + 'px';
        label.style.transformOrigin = "left top";
        label.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${labelScale})`;
        
        placedLabelsRects.push(virtualRect);
        placed = true;
      }
    }

    // Se dopo i tentativi è posizionata, la rendiamo visibile
    if (placed) {
      label.style.visibility = 'visible';
    } else {
      label.style.display = 'none'; // Nasconde se non c'è spazio
    }
  });
}

/* ============================================================
   INIZIALIZZAZIONE SICURA
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Avvia la galleria se i dati sono pronti, altrimenti attende l'evento custom
  if (window.galleryData) {
    loadChaosGallery();
  } else {
    document.addEventListener('galleryReady', loadChaosGallery);
    // Fallback temporizzato se galleryReady non dovesse scattare
    setTimeout(loadChaosGallery, 2000);
  }
});
