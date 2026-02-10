/* ============================================================
   GALLERY — CARICAMENTO PERCORSI DA JSON
============================================================ */

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

  // Fallback se IntersectionObserver non esiste
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => {
      const bg = el.dataset.bg;
      if (bg) {
        el.style.backgroundImage = `url('${bg}')`;
        el.classList.add('glitch-in');
        setTimeout(() => {
          el.classList.remove('glitch-in');
        }, 320);
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

        // Rimuove la classe dopo l’animazione (glitch medio ~280ms)
        setTimeout(() => {
          el.classList.remove('glitch-in');
        }, 320);
      }

      // Aggiorna la masonry per questo poster
      const poster = el.closest('.poster');
      if (poster) resizeMasonryItem(poster);

      // Glitch solo la prima volta
      observer.unobserve(el);
    });
  }, {
    rootMargin: '100px 0px'
  });

  items.forEach(el => {
    if (el.dataset.bg) {
      observer.observe(el);
    }
  });
}

/* ============================================================
   INIT MASONRY + COLLAGE
============================================================ */

async function initMasonry() {
  // 1. Prepara i data-bg per Galleria e Artist3
  await setupGalleryCollage();
  await setupArtist3XSData();

  // 2. Attiva lazy-loading + glitch
  initLazyBackgrounds();

  // 3. Primo calcolo masonry
  forceMasonryReflow();
}

/* ============================================================
   EVENTI GLOBALI
============================================================ */

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
