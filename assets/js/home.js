/* ============================================================
   GALLERY — CARICAMENTO PERCORSI DA JSON
============================================================ */

async function loadGalleryImages() {
  try {
    const response = await fetch('gallery.json');
    const data = await response.json();

    const result = [];

    data.folders.forEach(folder => {
      const safeFolder = encodeURI(folder.path);
      folder.images.forEach(img => {
        const safeImg = encodeURIComponent(img);
        result.push(`${safeFolder}/${safeImg}`);
      });
    });

    return result;

  } catch (e) {
    console.error("Errore JSON GALLERY:", e);
    return [];
  }
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/* ============================================================
   GALLERY — ASSEGNA 3 IMG RANDOM AI COLLAGE (data-bg)
============================================================ */

async function setupGalleryCollage() {
  const imgs = await loadGalleryImages();
  if (!imgs.length) return;

  const chosen = pickRandom(imgs, 3);
  const els = document.querySelectorAll('.poster-galleria .collage-img');

  els.forEach((el, i) => {
    if (chosen[i]) {
      el.dataset.bg = chosen[i];
    }
  });
}

/* ============================================================
   ARTIST3 — CARICAMENTO PERCORSI DA JSON
============================================================ */

async function loadArtist3Images() {
  try {
    const response = await fetch('artist3.json');
    const data = await response.json();

    const result = [];

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

/* ============================================================
   ARTIST3 — ASSEGNA 16 IMG RANDOM AL COLLAGE XS (data-bg)
============================================================ */

async function setupArtist3XSData() {
  const imgs = await loadArtist3Images();
  if (!imgs.length) return;

  const chosen = imgs
    .sort(() => Math.random() - 0.5)
    .slice(0, 16);

  const cells = document.querySelectorAll('.poster-artist3.poster-XS .cell');

  cells.forEach((cell, i) => {
    if (chosen[i]) {
      cell.dataset.bg = chosen[i];
    }
  });
}

/* ============================================================
   MASONRY — CALCOLO ALTEZZE (GRID AUTO-ROWS)
============================================================ */

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

function forceMasonryReflow() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeAll();
    });
  });
}

/* ============================================================
   LAZY-LOADING + GLITCH ALLA PRIMA APPARIZIONE
============================================================ */

function initLazyBackgrounds() {
  const items = document.querySelectorAll('[data-bg]');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => {
      const bg = el.dataset.bg;
      if (bg) {
        el.style.backgroundImage = `url('${bg}')`;
        el.classList.add('glitch-in');
        setTimeout(() => el.classList.remove('glitch-in'), 320);
      }
      const poster = el.closest('.poster');
      if (poster) resizeMasonryItem(poster);
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const bg = el.dataset.bg;

      if (bg) {
        el.style.backgroundImage = `url('${bg}')`;
        el.classList.add('glitch-in');
        setTimeout(() => el.classList.remove('glitch-in'), 320);
      }

      const poster = el.closest('.poster');
      if (poster) resizeMasonryItem(poster);

      observer.unobserve(el);
    });
  }, {
    rootMargin: '100px 0px'
  });

  items.forEach(el => {
    if (el.dataset.bg) observer.observe(el);
  });
}

/* ============================================================
   PATCH POSTER HOME — CARICAMENTO IMMEDIATO + FIX MASONRY
============================================================ */

/* 1) Carica SUBITO i background dei poster della home */
function forceHomePosterBackgrounds() {
  document.querySelectorAll('.poster [data-bg]').forEach(el => {
    const bg = el.dataset.bg;
    if (bg && bg.trim() !== "") {
      el.style.backgroundImage = `url('${bg}')`;
    }
  });
}

/* 2) Ricalcola la masonry DOPO che i background sono applicati */
function reflowHomePosters() {
  const posters = document.querySelectorAll('.masonry-grid .poster');
  posters.forEach(p => resizeMasonryItem(p));
}

/* 3) Patch globale: forza il caricamento dei poster appena pronti */
async function initHomePostersPatch() {
  await setupGalleryCollage();
  await setupArtist3XSData();

  forceHomePosterBackgrounds();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reflowHomePosters();
    });
  });
}

/* ============================================================
   INIT MASONRY + PATCH
============================================================ */

window.addEventListener('load', () => {
  setTimeout(() => {
    initHomePostersPatch();
    initLazyBackgrounds(); // lazy load per tutto il resto
  }, 200);
});

/* Ricalcolo intelligente al resize */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    forceMasonryReflow();
  }, 200);
});
