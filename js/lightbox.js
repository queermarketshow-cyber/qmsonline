const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lb = document.getElementById('lightbox');
if (lb) lb.classList.remove('lightbox-artist');

/* OPEN */
function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = src;

  // Aggiorna caption
  updateLightboxCaption();

  lightbox.classList.remove('hidden');
  lightbox.classList.add('open');

  currentScale = 1;
  lightboxImg.style.transform = 'scale(1)';

  document.body.style.overflow = 'hidden';
}

/* CLOSE */
function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove('open');
  lightbox.classList.add('hidden');

  document.body.style.overflow = '';

  const galleryModal = document.getElementById('galleryModal');
  if (galleryModal && galleryModal.classList.contains('open')) {
    galleryModal.style.pointerEvents = 'auto';
  }

  const mosaic = document.querySelector('.mosaic-gallery');
  if (mosaic && mosaic.classList.contains('open')) {
    mosaic.style.pointerEvents = 'auto';
  }
}

/* PREV */
function prevLightbox() {
  if (!currentFolder) return;

  currentIndex = (currentIndex - 1 + currentFolder.images.length) % currentFolder.images.length;
  const newSrc = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
  lightboxImg.src = newSrc;

  updateLightboxCaption();
}

/* NEXT */
function nextLightbox() {
  if (!currentFolder) return;

  currentIndex = (currentIndex + 1) % currentFolder.images.length;
  const newSrc = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
  lightboxImg.src = newSrc;

  updateLightboxCaption();
}

/* CAPTION */
function updateLightboxCaption() {
  const caption = document.getElementById('lightbox-caption');
  if (!caption || !currentFolder) return;

  const title = currentFolder.name || "";
  const ph = currentFolder.photographer || "";
  const phUrl = currentFolder.photographerUrl || "";

  let html = "";
  if (title) html += `<strong>${title}</strong>`;
  if (ph) html += `<br>pics by <a href="${phUrl}" target="_blank">${ph}</a>`;

  caption.innerHTML = html;
}

/* SWIPE */
let touchStartX = 0;
let touchEndX = 0;

lightbox?.addEventListener('touchstart', e => {
  if (e.touches.length === 1) touchStartX = e.touches[0].screenX;
}, { passive: true });

lightbox?.addEventListener('touchend', e => {
  if (e.changedTouches.length === 1) {
    touchEndX = e.changedTouches[0].screenX;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) >= 50) delta > 0 ? prevLightbox() : nextLightbox();
  }
}, { passive: true });

/* PINCH TO ZOOM */
lightboxImg?.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
  }
}, { passive: false });

lightboxImg?.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDistance = Math.sqrt(dx * dx + dy * dy);
    currentScale = Math.min(Math.max(newDistance / initialDistance, 1), 4);
    lightboxImg.style.transform = `scale(${currentScale})`;
  }
}, { passive: false });

lightboxImg?.addEventListener('touchend', () => {
  if (currentScale <= 1.05) {
    currentScale = 1;
    lightboxImg.style.transform = 'scale(1)';
  }
});
