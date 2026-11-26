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

  // 5 slot desktop molto ampi per riempire gran parte della parete con taglie opposte
  const DESKTOP_SLOTS = [
    // 1. Enorme strato basso che occupa quasi tutta la larghezza
    { bottom: '-4%', left: '-3%',   w: 'clamp(560px, 78vw, 1150px)', h: 'clamp(240px, 44vh, 420px)', tilt: '-2deg',   z: 2, tear: 'tear-1' },
    // 2. Ampio strato alto che taglia la parte superiore
    { top: '-5%',    left: '6%',    w: 'clamp(520px, 74vw, 1080px)', h: 'clamp(190px, 34vh, 320px)', tilt: '2.5deg',  z: 2, tear: 'tear-2' },
    // 3. Colonna strappata alta e stretta sul lato sinistro
    { top: '8%',     left: '-4%',   w: 'clamp(190px, 24vw, 340px)',  h: 'clamp(360px, 68vh, 620px)', tilt: '-3.5deg', z: 3, tear: 'tear-3' },
    // 4. Grande blocco strappato sul lato destro
    { top: '12%',    right: '-4%',  w: 'clamp(260px, 34vw, 490px)',  h: 'clamp(310px, 56vh, 520px)', tilt: '3deg',    z: 2, tear: 'tear-4' },
    // 5. Ritaglio compatto ma denso in basso a destra
    { bottom: '2%',  right: '4%',   w: 'clamp(175px, 22vw, 310px)',  h: 'clamp(135px, 22vh, 210px)', tilt: '-4.5deg', z: 3, tear: 'tear-5' }
  ];

  // 5 slot mobile: coprono molta più superficie pur restando ai bordi/sotto del testo
  const MOBILE_SLOTS = [
    { top: '-3%',    left: '-4%',   w: '340px', h: '145px', tilt: '-2.5deg', z: 2, tear: 'tear-1' },
    { top: '10%',    right: '-24px', w: '145px', h: '280px', tilt: '3.5deg',  z: 2, tear: 'tear-2' },
    { top: '34%',    left: '-24px',  w: '135px', h: '230px', tilt: '-4deg',   z: 2, tear: 'tear-3' },
    { bottom: '8%',  right: '-14px', w: '290px', h: '165px', tilt: '2.5deg',  z: 2, tear: 'tear-4' },
    { bottom: '-3%', left: '-6%',   w: '210px', h: '125px', tilt: '-3.5deg', z: 2, tear: 'tear-5' }
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
      const randomTiltOffset = (Math.random() * 2.5 - 1.25).toFixed(1);

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