/* ============================================================
   CHAOS GALLERY — HOME VERSION (INTEGRATED & OPTIMIZED)
============================================================ */

async function loadChaosGallery() {
  if (loadChaosGallery._done) return;

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

  if (!Array.isArray(data) || !data.length) return;
  loadChaosGallery._done = true;

  const allImages = [];
  data.forEach(folder => {
    (folder.images || []).forEach(img => {
      allImages.push({ src: `${folder.path}/${img}` });
    });
  });

  if (!allImages.length) return;

  // 36-52 foto per riempire il tavolo in modo denso; se il pool è più corto, ricicla mescolando
  const targetCount = Math.floor(Math.random() * 17) + 36;
  const pool = [];
  while (pool.length < targetCount) {
    const shuffled = allImages.slice().sort(() => Math.random() - 0.5);
    pool.push(...shuffled);
  }
  const selected = pool.slice(0, targetCount);

  const imgLayer = document.querySelector('.qms-gallery-images');
  const labelLayer = document.querySelector('.qms-gallery-labels');
  const cta = document.querySelector('.chaos-button');
  const grid = document.querySelector('.qms-gallery-grid');

  if (!imgLayer || !labelLayer || !grid || !cta) return;

  const labels = Array.from(labelLayer.querySelectorAll('.label'));
  const gridWidth = grid.clientWidth;
  const gridHeight = grid.clientHeight;
  const isMobile = gridWidth <= 768;

  const scaleFactor = Math.min(gridWidth, gridHeight) / 900;
  const labelScale = Math.max(0.6, Math.min(1.0, scaleFactor));
  const ctaScale = Math.max(0.88, Math.min(1.32, scaleFactor * 1.15));

  cta.style.zIndex = '200';
  cta.style.transform = `translate(-50%, -50%) rotate(-5deg) scale(${ctaScale})`;

  imgLayer.innerHTML = '';

  const approxCardW = isMobile ? Math.min(138, gridWidth * 0.25) : Math.min(225, gridWidth * 0.155);
  const approxCardH = isMobile ? Math.min(165, gridWidth * 0.30) : Math.min(270, gridWidth * 0.19);
  const maxX = Math.max(20, gridWidth - approxCardW * 0.65);
  const maxY = Math.max(20, gridHeight - approxCardH * 0.65);

  const cols = isMobile ? 4 : 7;
  const rows = Math.ceil(targetCount / cols);

  selected.forEach((item, index) => {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = '';
    img.loading = 'eager';
    img.addEventListener('error', () => {
      img.style.display = 'none';
    }, { once: true });

    const col = index % cols;
    const row = Math.floor(index / cols);

    const cellW = maxX / cols;
    const cellH = maxY / Math.max(1, rows);

    const jitterX = (Math.random() - 0.5) * cellW * 1.15;
    const jitterY = (Math.random() - 0.5) * cellH * 1.15;

    const left = Math.max(-approxCardW * 0.25, Math.min(maxX, col * cellW + cellW * 0.2 + jitterX));
    const top = Math.max(-approxCardH * 0.2, Math.min(maxY, row * cellH + cellH * 0.2 + jitterY));

    img.style.top = `${top}px`;
    img.style.left = `${left}px`;
    img.style.transform = `rotate(${(Math.random() * 44 - 22).toFixed(1)}deg)`;
    img.style.zIndex = String(Math.floor(Math.random() * 60) + 1);

    imgLayer.appendChild(img);
  });

  const placedLabelsRects = [];
  const ctaRect = cta.getBoundingClientRect();
  const BUFFER = 24;

  function isColliding(rect, others) {
    const collidesWithCTA = !(
      rect.right + BUFFER < ctaRect.left ||
      rect.left - BUFFER > ctaRect.right ||
      rect.bottom + BUFFER < ctaRect.top ||
      rect.top - BUFFER > ctaRect.bottom
    );
    if (collidesWithCTA) return true;

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

    label.style.display = 'block';
    label.style.visibility = 'hidden';

    const lw = label.offsetWidth * labelScale;
    const lh = label.offsetHeight * labelScale;

    while (!placed && attempts < 180) {
      attempts++;

      const top = Math.random() * Math.max(0, gridHeight - lh - 24);
      const left = Math.random() * Math.max(0, gridWidth - lw - 24);

      const virtualRect = {
        left,
        top,
        right: left + lw,
        bottom: top + lh
      };

      if (!isColliding(virtualRect, placedLabelsRects)) {
        label.style.top = `${top}px`;
        label.style.left = `${left}px`;
        label.style.transformOrigin = 'left top';
        label.style.transform = `rotate(${(Math.random() * 26 - 13).toFixed(1)}deg) scale(${labelScale})`;

        placedLabelsRects.push(virtualRect);
        placed = true;
      }
    }

    if (placed) {
      label.style.visibility = 'visible';
    } else {
      label.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.galleryData) {
    loadChaosGallery();
  } else {
    document.addEventListener('galleryReady', loadChaosGallery, { once: true });
    setTimeout(loadChaosGallery, 2000);
  }
});