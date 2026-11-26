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

  const TEAR_EDGE_SRC = 'images/bordo_strappato.png';

  // 5 slot desktop: dimensioni nettamente diverse e ampie per riempire molto spazio
  const DESKTOP_SLOTS = [
    { bottom: '-4%', left: '-3%',   w: 'clamp(560px, 78vw, 1150px)', h: 'clamp(240px, 44vh, 420px)', tilt: '-2deg',   z: 2 },
    { top: '-5%',    left: '6%',    w: 'clamp(520px, 74vw, 1080px)', h: 'clamp(190px, 34vh, 320px)', tilt: '2.5deg',  z: 2 },
    { top: '8%',     left: '-4%',   w: 'clamp(190px, 24vw, 340px)',  h: 'clamp(360px, 68vh, 620px)', tilt: '-3.5deg', z: 3 },
    { top: '12%',    right: '-4%',  w: 'clamp(260px, 34vw, 490px)',  h: 'clamp(310px, 56vh, 520px)', tilt: '3deg',    z: 2 },
    { bottom: '2%',  right: '4%',   w: 'clamp(175px, 22vw, 310px)',  h: 'clamp(135px, 22vh, 210px)', tilt: '-4.5deg', z: 3 }
  ];

  // 5 slot mobile: 5 dimensioni diverse che coprono molta parete
  const MOBILE_SLOTS = [
    { top: '-3%',    left: '-4%',   w: '340px', h: '145px', tilt: '-2.5deg', z: 2 },
    { top: '10%',    right: '-24px', w: '145px', h: '280px', tilt: '3.5deg',  z: 2 },
    { top: '34%',    left: '-24px',  w: '135px', h: '230px', tilt: '-4deg',   z: 2 },
    { bottom: '8%',  right: '-14px', w: '290px', h: '165px', tilt: '2.5deg',  z: 2 },
    { bottom: '-3%', left: '-6%',   w: '210px', h: '125px', tilt: '-3.5deg', z: 2 }
  ];

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
      const randomTiltOffset = (Math.random() * 2.5 - 1.25).toFixed(1);

      const patch = document.createElement('div');
      patch.className = 'home-wall-patch';
      patch.style.width = slot.w;
      patch.style.height = slot.h;
      patch.style.zIndex = String(slot.z);
      patch.style.setProperty('--tilt', `calc(${slot.tilt} + ${randomTiltOffset}deg)`);

      if (slot.top !== undefined) patch.style.top = slot.top;
      if (slot.bottom !== undefined) patch.style.bottom = slot.bottom;
      if (slot.left !== undefined) patch.style.left = slot.left;
      if (slot.right !== undefined) patch.style.right = slot.right;

      const img = document.createElement('img');
      img.className = 'home-wall-photo';
      img.src = src;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';

      const tearImg = document.createElement('img');
      tearImg.className = 'home-wall-tear-overlay';
      tearImg.src = TEAR_EDGE_SRC;
      tearImg.alt = '';
      tearImg.loading = 'eager';
      tearImg.decoding = 'async';
      tearImg.addEventListener('error', () => tearImg.remove(), { once: true });

      patch.appendChild(img);
      patch.appendChild(tearImg);
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