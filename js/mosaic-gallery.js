/* ===============================
   GALLERIA A MOSAICO
=============================== */

const mosaicGallery = document.querySelector('.mosaic-gallery');
const mosaicGrid = document.querySelector('.mosaic-grid');
const mosaicClose = document.querySelector('.mosaic-close');

/* CHIUDI */
mosaicClose?.addEventListener('click', () => {
  mosaicGallery.classList.add('hidden');
});

/* APRI MOSAICO */
function openMosaic(folder) {
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
}
