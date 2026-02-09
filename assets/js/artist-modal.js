/* ============================================================
   ARTIST MODAL — SISTEMA COMPLETO E CORRETTO
============================================================ */

/* APRI MODALE ARTISTA */
function openArtistModal(artistId) {
  // Chiudi eventuale modale artista già aperta
  const alreadyOpen = document.querySelector('.artist-modal.open');
  if (alreadyOpen) {
    alreadyOpen.classList.remove('open');
    alreadyOpen.classList.add('hidden');
  }

  const modal = document.getElementById(artistId);
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('open');

  document.body.style.overflow = 'hidden';
}

/* CHIUDI MODALE ARTISTA */
function closeArtistModal() {
  const modal = document.querySelector('.artist-modal.open');
  if (!modal) return;

  modal.classList.remove('open');
  modal.classList.add('hidden');

  document.body.style.overflow = '';
}

/* CLICK SULLA X */
document.querySelectorAll('.artist-modal .close-button').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    closeArtistModal();
  });
});

/* CLICK FUORI DALLA MODALE */
document.querySelectorAll('.artist-modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target.classList.contains('artist-modal')) {
      closeArtistModal();
    }
  });
});

/* ESC PER CHIUDERE */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeArtistModal();
  }
});

/* CLICK SULLE IMMAGINI → LIGHTBOX */
document.querySelectorAll('.artist-modal-gallery img').forEach(img => {
  img.addEventListener('click', e => {
    e.stopPropagation();

    // aggiunge la classe che disattiva le frecce
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.add('lightbox-artist');

    // qui continui a usare il tuo lightbox unificato
    openLightbox(img.src);
  });
});
/* COLLEGA LE CARD ARTISTA ALLE MODALI */
document.querySelectorAll('.artist-card').forEach(card => {
  card.addEventListener('click', () => {
    const artistId = card.dataset.id;
    if (artistId) openArtistModal(artistId);
  });
});
