/* ===============================
   GALLERIA A MOSAICO
=============================== */

const mosaicGallery = document.querySelector('.mosaic-gallery');
const mosaicGrid = document.querySelector('.mosaic-grid');
const mosaicClose = document.querySelector('.mosaic-close');

/* CHIUSURA GENERALE */
function closeMosaic() {
  if (!mosaicGallery) return;

  mosaicGallery.classList.remove('open');
  mosaicGallery.classList.add('hidden');

  document.body.style.overflow = '';
}

window.closeMosaic = closeMosaic;

/* CHIUDI CON LA X */
if (mosaicClose) {
  mosaicClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMosaic();
  });
}

/* CHIUDI CLICCANDO FUORI */
if (mosaicGallery) {
  mosaicGallery.addEventListener('click', (e) => {
    if (e.target === mosaicGallery) {
      closeMosaic();
    }
  });
}

/* CHIUDI CON ESC */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMosaic();
  }
});

/* APRI MOSAICO */
window.openMosaic = function (folder) {
  if (!mosaicGallery || !mosaicGrid) return;

  mosaicGrid.innerHTML = '';

  folder.images.forEach(imgName => {
    const img = document.createElement('img');
    img.src = `${folder.path}/${imgName}`;
    img.alt = folder.name;
    img.addEventListener('click', () => openLightbox(`${folder.path}/${imgName}`));
    mosaicGrid.appendChild(img);
  });

  mosaicGallery.classList.remove('hidden');
  mosaicGallery.classList.add('open');

  document.body.style.overflow = 'hidden';
};
