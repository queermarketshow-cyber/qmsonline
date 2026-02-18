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

  // ---------------------------
  // FUNZIONE DI COLLISIONE
  // ---------------------------
  function isColliding(a, b) {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return !(
      ar.right < br.left ||
      ar.left > br.right ||
      ar.bottom < br.top ||
      ar.top > br.bottom
    );
  }

  // ---------------------------
  // GENERA IMMAGINI
  // ---------------------------
  selected.forEach((item, i) => {
    const img = document.createElement('img');
    img.src = item.src;

    // margini di sicurezza
    const maxX = gridWidth * 0.75;
    const maxY = gridHeight * 0.75;

    const top = Math.random() * maxY;
    const left = Math.random() * maxX;
    const rot = Math.random() * 60 - 30;
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

  // misura CTA una volta sola
  const ctaRect = cta.getBoundingClientRect();

  labels.forEach((label, i) => {
    let attempts = 0;
    let placed = false;

    // misura label
    label.style.visibility = 'hidden';
    label.style.display = 'block';

    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;

    while (!placed && attempts < 400) {
      attempts++;

      // margini per evitare overflow
      const maxX = gridWidth - labelWidth - 20;
      const maxY = gridHeight - labelHeight - 20;

      const top = Math.random() * maxY;
      const left = Math.random() * maxX;
      const rot = Math.random() * 40 - 20;

      label.style.top = top + 'px';
      label.style.left = left + 'px';
      label.style.transform = `rotate(${rot}deg)`;

      let collision = false;

      // collisione con altre labels
      for (const other of placedLabels) {
        if (isColliding(label, other)) {
          collision = true;
          break;
        }
      }

      // collisione con CTA
      if (!collision) {
        const lr = label.getBoundingClientRect();
        if (!(lr.right < ctaRect.left ||
              lr.left > ctaRect.right ||
              lr.bottom < ctaRect.top ||
              lr.top > ctaRect.bottom)) {
          collision = true;
        }
      }

      // se non collide → posizione accettata
      if (!collision) {
        placed = true;
        placedLabels.push(label);
      }
    }

    label.style.visibility = 'visible';
  });
}

loadChaosGallery();
