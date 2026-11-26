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

  const count = Math.min(allImages.length, Math.floor(Math.random() * 16) + 20);
  const selected = allImages.sort(() => Math.random() - 0.5).slice(0, count);

  const imgLayer = document.querySelector('.qms-gallery-images');
  const labelLayer = document.querySelector('.qms-gallery-labels');
  const cta = document.querySelector('.chaos-button');
  const grid = document.querySelector('.qms-gallery-grid');

  if (!imgLayer || !labelLayer || !grid || !cta) return;

  const labels = Array.from(labelLayer.querySelectorAll('.label'));
  const gridWidth = grid.clientWidth;
  const gridHeight = grid.clientHeight;

  const scaleFactor = Math.min(gridWidth, gridHeight) / 900;
  const labelScale = Math.max(0.6, Math.min(1.2, scaleFactor));
  const ctaScale = Math.max(0.5, Math.min(1.0, scaleFactor));

  cta.style.transform = `translate(-50%, -50%) rotate(-6deg) scale(${ctaScale})`;

  imgLayer.innerHTML = '';
  selected.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.style.display = 'none';
    }, { once: true });

    const maxX = Math.max(0, gridWidth * 0.78);
    const maxY = Math.max(0, gridHeight * 0.75);

    img.style.top = Math.random() * maxY + 'px';
    img.style.left = Math.random() * maxX + 'px';
    img.style.transform = `rotate(${Math.random() * 50 - 25}deg)`;
    img.style.zIndex = String(Math.floor(Math.random() * 50) + 1);

    imgLayer.appendChild(img);
  });

  const placedLabelsRects = [];
  const ctaRect = cta.getBoundingClientRect();
  const BUFFER = 12;

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

    while (!placed && attempts < 150) {
      attempts++;

      const top = Math.random() * Math.max(0, gridHeight - lh - 20);
      const left = Math.random() * Math.max(0, gridWidth - lw - 20);

      const virtualRect = {
        left,
        top,
        right: left + lw,
        bottom: top + lh
      };

      if (!isColliding(virtualRect, placedLabelsRects)) {
        label.style.top = top + 'px';
        label.style.left = left + 'px';
        label.style.transformOrigin = 'left top';
        label.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${labelScale})`;

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