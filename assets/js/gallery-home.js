async function loadChaosGallery() {
  const response = await fetch('gallery.json');
  const data = await response.json();

  // 1. Costruisci un array con TUTTE le immagini
  const allImages = [];
  data.folders.forEach(folder => {
    folder.images.forEach(img => {
      allImages.push({
        src: `${folder.path}/${img}`
      });
    });
  });

  // 2. Scegli 20–35 immagini random
  const count = Math.floor(Math.random() * 16) + 20;
  const shuffled = allImages.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  const imgLayer = document.querySelector('.qms-gallery-images');
  const labelLayer = document.querySelector('.qms-gallery-labels');
  const labels = Array.from(labelLayer.querySelectorAll('.label'));
  const cta = document.querySelector('.chaos-button');

  const grid = document.querySelector('.qms-gallery-grid');

  // 🔥 DIMENSIONI REALI DEL CONTAINER
  const gridWidth = grid.clientWidth;
  const gridHeight = grid.clientHeight;

  // 🔥 SCALING DINAMICO
  const scaleFactor = Math.min(gridWidth, gridHeight) / 900; // base 900px
  const labelScale = Math.max(0.6, Math.min(1.2, scaleFactor));
  const ctaScale = Math.max(0.5, Math.min(1.0, scaleFactor));

  // Applica scaling alle label
  labels.forEach(label => {
    label.style.transform = `scale(${labelScale})`;
    label.style.transformOrigin = "left top";
  });

  // Applica scaling alla CTA
  cta.style.transform = `translate(-50%, -50%) rotate(-6deg) scale(${ctaScale})`;

  // ---------------------------
  // FUNZIONE DI COLLISIONE CON BUFFER
  // ---------------------------
  const BUFFER = 12; // distanza minima tra label

  function isCollidingBuffered(a, b) {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return !(
      ar.right + BUFFER < br.left ||
      ar.left - BUFFER > br.right ||
      ar.bottom + BUFFER < br.top ||
      ar.top - BUFFER > br.bottom
    );
  }

  // ---------------------------
  // GENERA IMMAGINI
  // ---------------------------
  selected.forEach((item, i) => {
    const img = document.createElement('img');
    img.src = item.src;

    const maxX = gridWidth * 0.75;
    const maxY = gridHeight * 0.75;

    const top = Math.random() * maxY;
    const left = Math.random() * maxX;
    const rot = Math.random() * 50 - 25; // rotazione leggermente ridotta
    const z = Math.floor(Math.random() * 50) + 1;

    img.style.top = top + 'px';
    img.style.left = left + 'px';
    img.style.transform = `rotate(${rot}deg)`;
    img.style.zIndex = z;

    imgLayer.appendChild(img);
  });

  // ---------------------------
  // POSIZIONA LABELS SENZA SOVRAPPOSIZIONI
  // ---------------------------
  const placedLabels = [];
  const ctaRect = cta.getBoundingClientRect();

  labels.forEach((label, i) => {
    let attempts = 0;
    let placed = false;

    label.style.visibility = 'hidden';
    label.style.display = 'block';

    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;

    while (!placed && attempts < 500) {
      attempts++;

      const maxX = gridWidth - labelWidth - 20;
      const maxY = gridHeight - labelHeight - 20;

      const top = Math.random() * maxY;
      const left = Math.random() * maxX;
      const rot = Math.random() * 30 - 15; // rotazione più morbida

      label.style.top = top + 'px';
      label.style.left = left + 'px';
      label.style.transform = `rotate(${rot}deg) scale(${labelScale})`;

      let collision = false;

      // collisione con altre labels
      for (const other of placedLabels) {
        if (isCollidingBuffered(label, other)) {
          collision = true;
          break;
        }
      }

      // collisione con CTA
      if (!collision) {
        const lr = label.getBoundingClientRect();
        if (!(lr.right + BUFFER < ctaRect.left ||
              lr.left - BUFFER > ctaRect.right ||
              lr.bottom + BUFFER < ctaRect.top ||
              lr.top - BUFFER > ctaRect.bottom)) {
          collision = true;
        }
      }

      if (!collision) {
        placed = true;
        placedLabels.push(label);
      }
    }

    label.style.visibility = 'visible';
  });
}

loadChaosGallery();
