// artists.js
// Inizializzatore della sezione ARTIST3
// Da chiamare DOPO che l'HTML di #artist3 è stato inserito nel DOM

function initArtist3() {
  const section = document.getElementById("artist3");
  if (!section) return;

  const residentContainer = section.querySelector("#artists-resident");
  const guestContainer = section.querySelector("#artists-guest");
  const modalContainer = section.querySelector("#artist-modals");

  const btnResident = section.querySelector("#btn-resident");
  const btnGuest = section.querySelector("#btn-guest");

  if (!residentContainer || !guestContainer || !modalContainer || !btnResident || !btnGuest) return;

  let artists = [];

  // FETCH DATI ARTISTI
  fetch("artists.json")
    .then(res => res.json())
    .then(data => {
      artists = Array.isArray(data) ? data : [];
      renderArtists();
      renderModals();
    })
    .catch(err => console.error("Errore caricamento artisti:", err));

  // CREA CARD
  function createArtistCard(a) {
    const card = document.createElement("div");
    card.className = "artist-card";
    card.dataset.id = a.id;

    card.innerHTML = `
      <img src="${a.path}/${a.cover}" alt="${a.name}">
      <div class="artista-info">
        <h3>${a.name}</h3>
        <p>${a.role || ""}</p>
        <p>${a.bio_short || ""}</p>
      </div>
    `;

    card.addEventListener("click", () => openArtistModal(a.id));
    return card;
  }

  // CREA MODALE
  function createArtistModal(a) {
    const modal = document.createElement("div");
    modal.id = a.id;
    modal.className = "artist-modal hidden";

    const galleryImgs = (a.images || [])
      .map(img => `<img src="${a.path}/${img}" alt="${a.name}">`)
      .join("");

    modal.innerHTML = `
      <div class="artist-modal-content">
        <button class="close-button">×</button>

        <div class="artist-modal-layout">
          <div class="artist-modal-text">
            <div class="artist-header">
              <h3>${a.name}</h3>
              ${
                a.instagram
                  ? `<a href="${a.instagram}" target="_blank" rel="noopener">
                      <i class="fab fa-instagram"></i>
                    </a>`
                  : ""
              }
            </div>

            <p>${a.bio_long || ""}</p>
          </div>

          <div class="artist-modal-gallery">
            ${galleryImgs}
          </div>
        </div>
      </div>
    `;

    modal.addEventListener("click", () => closeArtistModal(a.id));

    const content = modal.querySelector(".artist-modal-content");
    content.addEventListener("click", (e) => e.stopPropagation());

    const closeBtn = modal.querySelector(".close-button");
    closeBtn.addEventListener("click", () => closeArtistModal(a.id));

    const imgs = modal.querySelectorAll(".artist-modal-gallery img");
    imgs.forEach(img => {
      img.addEventListener("click", () => {
        if (typeof window.openLightbox === "function") {
          window.openLightbox(img.src);
        }
      });
    });

    return modal;
  }

  // RENDER CARD
  function renderArtists() {
    residentContainer.innerHTML = "";
    guestContainer.innerHTML = "";

    artists.forEach(a => {
      const card = createArtistCard(a);

      if (a.type === "resident") {
        residentContainer.appendChild(card);
      } else if (a.type === "guest") {
        guestContainer.appendChild(card);
      }
    });

    // Stato iniziale: resident visibili
    residentContainer.style.display = "grid";
    guestContainer.style.display = "none";

    btnResident.classList.add("active");
    btnGuest.classList.remove("active");
  }

  // RENDER MODALI
  function renderModals() {
    modalContainer.innerHTML = "";
    artists.forEach(a => modalContainer.appendChild(createArtistModal(a)));
  }

  // SWITCH RESIDENT / GUEST
  btnResident.addEventListener("click", () => {
    btnResident.classList.add("active");
    btnGuest.classList.remove("active");

    residentContainer.style.display = "grid";
    guestContainer.style.display = "none";
  });

  btnGuest.addEventListener("click", () => {
    btnGuest.classList.add("active");
    btnResident.classList.remove("active");

    residentContainer.style.display = "none";
    guestContainer.style.display = "grid";
  });

  // OPEN/CLOSE MODALE
  function openArtistModal(id) {
    const modal = section.querySelector(`#${CSS.escape(id)}`);
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeArtistModal(id) {
    const modal = section.querySelector(`#${CSS.escape(id)}`);
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

window.initArtist3 = initArtist3;
