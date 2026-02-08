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
  resizeAll();
}

window.addEventListener('load', () => {
  setTimeout(initMasonry, 300);
});

window.addEventListener('resize', () => {
  setTimeout(resizeAll, 150);
});
