async function loadGalleryImages() {
  try {
    const response = await fetch('gallery.json');
    const data = await response.json();

    const result = [];

    data.folders.forEach(folder => {
      const safeFolder = encodeURI(folder.path); // mantiene gli slash
      folder.images.forEach(img => {
        const safeImg = encodeURIComponent(img); // codifica tutto il necessario
        result.push(`${safeFolder}/${safeImg}`);
      });
    });

    return result;

  } catch (e) {
    console.error("Errore JSON:", e);
    return [];
  }
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function applyRandomImages() {
  const imgs = await loadGalleryImages();
  if (!imgs.length) return [];

  const chosen = pickRandom(imgs, 3);
  const els = document.querySelectorAll('.poster-galleria .collage-img');

  // Precarica le immagini
  const preload = chosen.map(src => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });
  });

  await Promise.all(preload);

  // Applica i background SOLO dopo il preload
  els.forEach((el, i) => {
    el.style.backgroundImage = `url('${chosen[i]}')`;
  });

  return chosen;
}

function resizeMasonryItem(item) {
  const grid = document.querySelector('.masonry-grid');
  if (!grid) return;

  const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
  const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('gap'));
  const height = item.getBoundingClientRect().height;

  const span = Math.ceil((height + rowGap) / (rowHeight + rowGap));
  item.style.gridRowEnd = `span ${span}`;
}

function resizeAll() {
  document.querySelectorAll('.masonry-grid .poster')
    .forEach(item => resizeMasonryItem(item));
}

async function initMasonry() {
  await applyRandomImages();
  forceMasonryReflow();
}

function forceMasonryReflow() {
  // Aspetta che il browser ridisegni tutto
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeAll();
    });
  });
}

window.addEventListener('load', () => {
  setTimeout(initMasonry, 300);
});

// Ricalcolo intelligente al resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    forceMasonryReflow();
  }, 200);
});


// ------------------------------
// 1. Loader per artist3.json
// ------------------------------
async function loadArtist3Images() {
  try {
    const response = await fetch('artist3.json');
    const data = await response.json();

    const result = [];

    // artist3.json ha struttura:
    // { "artist3": [ { name, path, images[] }, ... ] }
    data.artist3.forEach(folder => {
      const safeFolder = encodeURI(folder.path);
      folder.images.forEach(img => {
        const safeImg = encodeURIComponent(img);
        result.push(`${safeFolder}/${safeImg}`);
      });
    });

    return result;

  } catch (e) {
    console.error("Errore JSON ARTIST3:", e);
    return [];
  }
}


// ------------------------------
// 2. Applica collage XS (16 immagini random)
// ------------------------------
async function applyArtist3XS() {
  const imgs = await loadArtist3Images();
  if (!imgs.length) return;

  // Randomizza l’array e prendi le prime 16
  const chosen = imgs
    .sort(() => Math.random() - 0.5)
    .slice(0, 16);

  const cells = document.querySelectorAll('.poster-artist3.poster-XS .cell');

  cells.forEach((cell, i) => {
    if (chosen[i]) {
      cell.style.backgroundImage = `url('${chosen[i]}')`;
    }
  });
}


// ------------------------------
// 3. Avvia dopo la masonry
// ------------------------------
window.addEventListener('load', () => {
  setTimeout(applyArtist3XS, 500);
});

