/* ============================================================
   ARTIST MODAL — SISTEMA COMPLETO
   Ricostruito per integrarsi con:
   - .open / .hidden
   - lightbox
   - mosaic-gallery
   - galleryModal
============================================================ */

let currentArtist = null;

/* APRI MODALE ARTISTA */
function openArtistModal(artist) {
  currentArtist = artist;

  const modal = document.querySelector('.artist-modal');
  if (!modal) return;

  const nameEl = modal.querySelector('.artist-header h3');
  const linkEl = modal.querySelector('.artist-header a');
  const textEl = modal.querySelector('.artist-modal-text');
  const galleryEl = modal.querySelector('.artist-modal-gallery');

  if (!nameEl || !textEl || !galleryEl) return;

  /* POPOLA CONTENUTI */
  nameEl.textContent = artist.name || '';
  if (linkEl) {
    if (artist.link) {
      linkEl.href = artist.link;
      linkEl.style.display = 'inline-block';
    } else {
      linkEl.style.display = 'none';
    }
  }

  textEl.innerHTML = artist.bio || '';

  /* GALLERIA IMMAGINI */
  galleryEl.innerHTML = '';
  if (artist.images && artist.images.length > 0) {
    artist.images.forEach(imgName => {
      const img = document.createElement('img');
      img.src = `${artist.path}/${imgName}`;
      img.alt = artist.name;
      img.addEventListener('click', () => openLightbox(`${artist.path}/${imgName}`));
      galleryEl.appendChild(img);
    });
  }

  /* MOSTRA MODALE */
  modal.classList.remove('hidden');
  modal.classList.add('open');

  /* BLOCCA SCROLL */
  document.body.style.overflow = 'hidden';
}

/* CHIUDI MODALE ARTISTA */
function closeArtistModal() {
  const modal = document.querySelector('.artist-modal');
  if (!modal) return;

  modal.classList.remove('open');
  modal.classList.add('hidden');

  /* RIPRISTINA SCROLL */
  document.body.style.overflow = '';
}

/* EVENTO: CLICK SU X */
document.querySelector('.artist-modal .close-button')
  ?.addEventListener('click', closeArtistModal);

/* EVENTO: CLICK FUORI DALLA MODALE */
document.querySelector('.artist-modal')
  ?.addEventListener('click', e => {
    if (e.target.classList.contains('artist-modal')) {
      closeArtistModal();
    }
  });

/* ESC PER CHIUDERE */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeArtistModal();
});

/* COLLEGA LE CARD ARTISTA */
document.querySelectorAll('.artist-card').forEach(card => {
  card.addEventListener('click', () => {
    const artist = {
      name: card.dataset.name || '',
      bio: card.dataset.bio || '',
      link: card.dataset.link || '',
      path: card.dataset.path || '',
      images: card.dataset.images ? card.dataset.images.split(',') : []
    };

    openArtistModal(artist);
  });
});
