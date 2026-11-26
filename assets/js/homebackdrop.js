(() => {
  const wallContainer = document.getElementById('home-wall-layers');
  if (!wallContainer) return;

  const HOME_WALL_IMAGES = [
    'images/home/338233954_5962539573836900_4659792516574297463.webp',
    'images/home/398234958_1057370678621093_8217094582292216192.webp',
    'images/home/453448716_505750998697903_4175446922477215165.webp',
    'images/home/461980259_1587722182166146_7681036948518047935.webp',
    'images/home/collage.jpg',
    'images/home/homegallery.jpeg',
    'images/home/soldi.png',
    'images/home/398305568_326402376660831_151121864657075626.webp'
  ];

  // 5 slot desktop: dimensioni nettamente diverse e ampie per riempire il muro
  const DESKTOP_SLOTS = [
    // 1. Enorme fascia-muro bassa/larga
    { top: '54%',   left: '8%',   w: 'clamp(420px, 56vw, 820px)', h: 'clamp(190px, 34vh, 330px)', tilt: '-2.5deg', z: 2, tear: 'tear-1' },
    // 2. Blocco alto-largo che taglia la parte superiore
    { top: '-2%',   left: '20%',  w: 'clamp(360px, 48vw, 700px)', h: 'clamp(140px, 23vh, 230px)', tilt: '2deg',    z: 2, tear: 'tear-2' },
    // 3. Ritaglio alto e stretto sul lato sinistro
    { top: '12%',   left: '-2%',  w: 'clamp(150px, 18vw, 260px)', h: 'clamp(280px, 48vh, 460px)', tilt: '-4deg',   z: 3, tear: 'tear-3' },
    // 4. Ritaglio medio-grande a destra
    { top: '18%',   right: '-2%', w: 'clamp(210px, 27vw, 390px)', h: 'clamp(230px, 39vh, 370px)', tilt: '3.5deg',  z: 2, tear: 'tear-4' },
    // 5. Pezzo compatto ma denso in basso a destra
    { bottom: '2%', right: '10%', w: 'clamp(160px, 20vw, 280px)', h: 'clamp(120px, 19vh, 185px)', tilt: '-5deg',   z: 3, tear: 'tear-5' }
  ];

  // 5 slot mobile: 5 dimensioni diverse che coprono molta parete senza impilarsi in lista
  const MOBILE_SLOTS = [
    { top: '-1%',    left: '6%',   w: '280px', h: '105px', tilt: '-3deg', z: 2, tear: 'tear-1' },
    { top: '14%',    right: '-18px',w: '115px', h: '210px', tilt: '4deg',  z: 2, tear: 'tear-2' },
    { top: '36%',    left: '-16px', w: '105px', h: '165px', tilt: '-4.5deg',z: 2, tear: 'tear-3' },
    { bottom: '14%', right: '-10px',w: '230px', h: '115px', tilt: '3deg',  z: 2, tear: 'tear-4' },
    { bottom: '-1%', left: '8%',   w: '145px', h: '88px',  tilt: '-4deg', z: 2, tear: 'tear-5' }
  ];

  const TEARS = ['tear-1', 'tear-2', 'tear-3', 'tear-4', 'tear-5'];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickFiveImages(pool) {
    const result = [];
    while (result.length < 5) {
      result.push(...shuffle(pool));
    }
    return result.slice(0, 5);
  }

  function renderWall() {
    if (!HOME_WALL_IMAGES.length) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
    const pickedImages = pickFiveImages(HOME_WALL_IMAGES);

    wallContainer.innerHTML = '';

    pickedImages.forEach((src, idx) => {
      const slot = slots[idx];
      const tearClass = TEARS[(idx + Math.floor(Math.random() * TEARS.length)) % TEARS.length];
      const randomTiltOffset = (Math.random() * 3 - 1.5).toFixed(1);

      const patch = document.createElement('div');
      patch.className = `home-wall-patch ${tearClass}`;
      patch.style.width = slot.w;
      patch.style.height = slot.h;
      patch.style.zIndex = String(slot.z);
      patch.style.setProperty('--tilt', `calc(${slot.tilt} + ${randomTiltOffset}deg)`);

      if (slot.top !== undefined) patch.style.top = slot.top;
      if (slot.bottom !== undefined) patch.style.bottom = slot.bottom;
      if (slot.left !== undefined) patch.style.left = slot.left;
      if (slot.right !== undefined) patch.style.right = slot.right;

      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';

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