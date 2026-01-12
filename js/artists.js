document.addEventListener("DOMContentLoaded", () => {
  const residentContainer = document.getElementById("artists-resident");
  const guestContainer = document.getElementById("artists-guest");
  const modalContainer = document.getElementById("artist-modals");

  const btnResident = document.getElementById("btn-resident");
  const btnGuest = document.getElementById("btn-guest");

  let artists = [];

  fetch("artists.json")
    .then(res => res.json())
    .then(data => {
      artists = data;
      renderArtists();
      renderModals();
    })
    .catch(err => console.error("Errore caricamento artisti:", err));

  /* CREA CARD */
  function createArtistCard(a) {
    const card = document.createElement("div");
    card.className = "artist-card";
    card.dataset.id = a.id;

    card.innerHTML = `
      <img src="${a.path}/${a.cover}" alt="${a.name}">
      <div class="artista-info">
        <h3>${a.name}</h3>
        <p>${a.role}</p>
        <p>${a.bio_short}</p>
      </div>
    `;

    card.addEventListener("click", () => openArtistModal(a.id));
    return card;
  }

  /* CREA MODALE */
  function createArtistModal(a) {
    const modal = document.createElement("div");
    modal.id = a.id;
    modal.className = "artist-modal hidden";

    const galleryImgs = a.images
      .map(img => `<img src="${a.path}/${img}">`)
      .join("");

    modal.innerHTML = `
      <div class="artist-modal-content" onclick="event.stopPropagation()">
        <button class="close-button">×</button>

        <div class="artist-modal-layout">
          <div class="artist-modal-text">
            <div class="artist-header">
              <h3>${a.name}</h3>
              <a href="${a.instagram}" target="_blank">
                <i class="fab fa-instagram"></i>
              </a>
            </div>

            <p>${a.bio_long}</p>
          </div>

          <div class="artist-modal-gallery">
            ${galleryImgs}
          </div>
        </div>
      </div>
    `;

    modal.addEventListener("click", () => closeArtistModal(a.id));

    modal.querySelector(".close-button")
      .addEventListener("click", () => closeArtistModal(a.id));

    modal.querySelectorAll(".artist-modal-gallery img")
      .forEach(img => img.addEventListener("click", () => openLightbox(img.src)));

    return modal;
  }

  /* RENDER CARD */
  function renderArtists() {
    residentContainer.innerHTML = "";
    guestContainer.innerHTML = "";

    artists.forEach(a => {
      const card = createArtistCard(a);
      if (a.type === "resident") residentContainer.appendChild(card);
      else guestContainer.appendChild(card);
    });
  }

  /* RENDER MODALI */
  function renderModals() {
    modalContainer.innerHTML = "";
    artists.forEach(a => modalContainer.appendChild(createArtistModal(a)));
  }

  /* SWITCH */
  btnResident.addEventListener("click", () => {
    btnResident.classList.add("active");
    btnGuest.classList.remove("active");
    residentContainer.style.display = "flex";
    guestContainer.style.display = "none";
  });

  btnGuest.addEventListener("click", () => {
    btnGuest.classList.add("active");
    btnResident.classList.remove("active");
    residentContainer.style.display = "none";
    guestContainer.style.display = "flex";
  });

  /* OPEN/CLOSE MODALE */
  function openArtistModal(id) {
    document.getElementById(id).classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeArtistModal(id) {
    document.getElementById(id).classList.add("hidden");
    document.body.style.overflow = "";
  }
});
