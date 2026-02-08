async function loadGalleryImages() {
  try {
    const response = await fetch('gallery.json');
    const data = await response.json();

    const result = [];

    function extract(node, base = "") {
      if (Array.isArray(node)) {
        node.forEach(n => extract(n, base));
      } else if (typeof node === "object") {
        if (node.folder) {
          extract(node.files, `${base}${node.folder}/`);
        }
      } else if (typeof node === "string") {
        result.push(`${base}${node}`);
      }
    }

    extract(data);
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
  if (!imgs.length) return;

  const chosen = pickRandom(imgs, 3);
  const els = document.querySelectorAll('.poster-galleria .collage-img');

  els.forEach((el, i) => {
    el.style.backgroundImage = `url('${chosen[i]}')`;
  });
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

  // Aspetta che il browser abbia finito TUTTO il reflow
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeAll();
    });
  });
}

window.addEventListener('load', () => {
  setTimeout(initMasonry, 300);
});

window.addEventListener('resize', () => {
  setTimeout(resizeAll, 150);
});
