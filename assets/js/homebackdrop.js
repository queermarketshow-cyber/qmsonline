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

  // 6 slot desktop: dimensioni molto diverse, sovrapposizioni reali, corridoio centrale leggibile
  const DESKTOP_SLOTS = [
    { top: '2%',     left: '11%',  w: 'clamp(240px, 31vw, 440px)', h: 'clamp(88px, 13vh, 145px)',  tilt: '-5.5deg', z: 2, tear: 'torn-a' },
    { top: '7%',     right: '14%', w: 'clamp(118px, 14vw, 185px)', h: 'clamp(215px, 35vh, 335px)', tilt: '6.5deg',  z: 2, tear: 'torn-b' },
    { bottom: '3%',  left: '12%',  w: 'clamp(138px, 17vw, 225px)', h: 'clamp(170px, 26vh, 260px)', tilt: '-4deg',   z: 3, tear: 'torn-c' },
    { bottom: '4%',  right: '18%', w: 'clamp(270px, 36vw, 520px)', h: 'clamp(102px, 15vh, 170px)', tilt: '4.5deg',  z: 3, tear: 'torn-d' },
    { top: '37%',    left: '-3%',  w: 'clamp(102px, 12vw, 160px)', h: 'clamp(190px, 28vh, 290px)', tilt: '-7deg',   z: 2, tear: 'torn-b' },
    { top: '41%',    right: '-2%', w: 'clamp(148px, 18vw, 245px)', h: 'clamp(92px, 13vh, 148px)',  tilt: '7.5deg',  z: 2, tear: 'torn-a' }
  ];

  // 6 slot mobile: almeno 5-6 ritagli strappati sui bordi, senza schiacciare il centro
  const MOBILE_SLOTS = [
    { top: '1%',     left: '12%',  w: '165px', h: '64px',  tilt: '-5.5deg', z: 2, tear: 'torn-a' },
    { top: '12%',    right: '-14px',w: '88px',  h: '126px', tilt: '6.5deg',  z: 2, tear: 'torn-b' },
    { top: '34%',    left: '-16px', w: '84px',  h: '112px', tilt: '-6deg',   z: 2, tear: 'torn-c' },
    { bottom: '18%', right: '-14px',w: '94px',  h: '114px', tilt: '5.5deg',  z: 2, tear: 'torn-d' },
    { bottom: '5%',  left: '6%',   w: '124px', h: '76px',  tilt: '-4deg',   z: 2, tear: 'torn-a' },
    { bottom: '1%',  right: '10%', w: '180px', h: '68px',  tilt: '4.5deg',  z: 2, tear: 'torn-c' }
  ];

  const TEARS = ['torn-a', 'torn-b', 'torn-c', 'torn-d'];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Seleziona almeno minCount immagini (ripetendo se l'array avesse meno elementi)
  function pickImages(pool, count) {
    const minCount = Math.max(5, count);
    const result = [];
    while (result.length < minCount) {
      result.push(...shuffle(pool));
    }
    return result.slice(0, minCount);
  }

  function renderWall() {
    if (!HOME_WALL_IMAGES.length) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
    const targetCount = Math.max(5, slots.length);
    const pickedImages = pickImages(HOME_WALL_IMAGES, targetCount);

    wallContainer.innerHTML = '';

    pickedImages.forEach((src, idx) => {
      const slot = slots[idx] || slots[idx % slots.length];
      const tearClass = TEARS[(idx + Math.floor(Math.random() * TEARS.length)) % TEARS.length];
      const randomTiltOffset = (Math.random() * 4 - 2).toFixed(1);

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