lightboxImg.src  // Se il mosaico è aperto, deve tornare cliccabile
  const mosaic = document.querySelector('.mosaic-gallery');
  if (mosaic && mosaic.classList.contains('open')) {
    mosaic.style.pointerEvents = 'auto';
  }
}

/* NAVIGAZIONE */
function prevLightbox() {
  if (!currentFolder) return;
  currentIndex = (currentIndex - 1 + currentFolder.images.length) % currentFolder.images.length;
  lightboxImg.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
}

function nextLightbox() {
  if (!currentFolder) return;
  currentIndex = (currentIndex + 1) % currentFolder.images.length;
  lightboxImg.src = `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
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
