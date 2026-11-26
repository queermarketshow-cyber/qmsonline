(() => {
  const wallContainer = document.getElementById('home-wall-layers');
  if (!wallContainer) return;

  // Inserisci qui i file presenti in images/home/
  const HOME_WALL_IMAGES = [
    'images/home/338233954_5962539573836900_4659792516574297463.webp',
    'images/home/02.jpgimages/home/398234958_1057370678621093_8217094582292216192.webp',
    'images/home/03.pngimages/home/453448716_505750998697903_4175446922477215165.webp',
    'images/home/04.jpgimages/home/461980259_1587722182166146_7681036948518047935.webp',
    'images/home/collage.jpg',
    'images/home/homegallery.jpeg',
    'images/home/soldi.png',
    'images/home/398305568_326402376660831_151121864657075626.webp'
  ];

  // Slot studiati per creare sovrapposizioni reali ai lati/angoli senza chiudere il centro
  const DESKTOP_SLOTS = [
    { top: '4%',  left: '14%',  w: 'clamp(150px, 18vw, 250px)', h: 'clamp(110px, 17vh, 190px)', tilt: '-5deg',  z: 2 },
    { top: '12%', right: '18%', w: 'clamp(160px, 19vw, 260px)', h: 'clamp(120px, 18vh, 200px)', tilt: '4.5deg', z: 2 },
    { bottom: '6%', left: '16%', w: 'clamp(170px, 21vw, 280px)', h: 'clamp(115px, 17vh, 195px)', tilt: '-3.5deg',z: 3 },
    { bottom: '9%', right: '22%',w: 'clamp(155px, 19vw, 260px)', h: 'clamp(120px, 18vh, 200px)', tilt: '5.5deg', z: 3 },
    { top: '44%', left: '-2%',  w: 'clamp(130px, 15vw, 210px)', h: 'clamp(140px, 20vh, 220px)', tilt: '-6deg',  z: 2 },
    { top: '46%', right: '-2%', w: 'clamp(135px, 16vw, 220px)', h: 'clamp(140px, 20vh, 220px)', tilt: '6deg',   z: 2 }
  ];

  const MOBILE_SLOTS = [
    { top: '2%',    left: '18%',  w: '120px', h: '86px',  tilt: '-4deg', z: 2 },
    { top: '18%',   right: '-10px',w: '115px', h: '82px',  tilt: '5deg',  z: 2 },
    { bottom: '18%', left: '-10px', w: '122px', h: '84px',  tilt: '-5deg', z: 2 },
    { bottom: '3%',  right: '16%', w: '130px', h: '88px',  tilt: '4deg',  z: 2 }
  ];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderWall() {
    if (!HOME_WALL_IMAGES.length) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
    const pickedImages = shuffle(HOME_WALL_IMAGES).slice(0, slots.length);

    wallContainer.innerHTML = '';

    pickedImages.forEach((src, idx) => {
      const slot = slots[idx];
      const patch = document.createElement('div');
      patch.className = 'home-wall-patch';
      patch.style.width = slot.w;
      patch.style.height = slot.h;
      patch.style.zIndex = String(slot.z);
      patch.style.setProperty('--tilt', slot.tilt);

      if (slot.top !== undefined) patch.style.top = slot.top;
      if (slot.bottom !== undefined) patch.style.bottom = slot.bottom;
      if (slot.left !== undefined) patch.style.left = slot.left;
      if (slot.right !== undefined) patch.style.right = slot.right;

      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';

      // Se un file in images/home/ manca o ha un errore di caricamento, rimuove il tassello vuoto
      img.addEventListener('error', () => patch.remove(), { once: true });

      patch.appendChild(img);
      wallContainer.appendChild(patch);
    });
  }

  renderWall();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderWall, 180);
  });
})();