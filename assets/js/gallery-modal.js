/* ============================================================
   STATO GLOBALE
============================================================ */

let galleryCurrentFolder = null;
let galleryCurrentIndex = 0;

/* ============================================================
   APERTURA CARTELLA
============================================================ */

function openFolderModal(folder) {

  galleryCurrentFolder = folder;

  const modal =
    document.getElementById("galleryModal");

  if (!modal) return;

  const title =
    modal.querySelector(".modal-album-title");

  const photographer =
    modal.querySelector(".modal-photographer");

  const grid =
    modal.querySelector(".modal-grid");

  const carousel =
    modal.querySelector(".carousel");

  if (title) {
    title.textContent = folder.name || "";
  }

  if (photographer) {

    const photographers =
      folder.photographers ||
      folder.photographer ||
      "";

    if (Array.isArray(photographers)) {

      photographer.textContent =
        photographers
          .map(p =>
            typeof p === "object"
              ? p.name
              : p
          )
          .join(", ");

    } else {

      photographer.textContent =
        photographers;

    }

  }

  if (!grid) return;

  grid.innerHTML = "";

  if (
    folder.images &&
    folder.images.length
  ) {

    folder.images.forEach(
      (image, index) => {

        const img =
          document.createElement("img");

        img.src =
          `${folder.path}/${image}`;

        img.alt = image;

        img.loading = "lazy";

        img.addEventListener(
          "click",
          () => openCarousel(index)
        );

        grid.appendChild(img);

      }
    );

  }

  grid.classList.remove("hidden");

  if (carousel) {
    carousel.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("open");

  document.body.style.overflow =
    "hidden";
}

/* ============================================================
   APERTURA CAROSELLO
============================================================ */

function openCarousel(index) {

  if (!galleryCurrentFolder) return;

  galleryCurrentIndex = index;

  const modal =
    document.getElementById("galleryModal");

  if (!modal) return;

  const grid =
    modal.querySelector(".modal-grid");

  const carousel =
    modal.querySelector(".carousel");

  const image =
    modal.querySelector(".carousel-img");

  if (!carousel || !image) return;

  image.src =
    `${galleryCurrentFolder.path}/${galleryCurrentFolder.images[galleryCurrentIndex]}`;

  if (grid) {
    grid.classList.add("hidden");
  }

  carousel.classList.remove("hidden");
}

/* ============================================================
   CHIUSURA SOLO CAROSELLO
============================================================ */

function closeCarousel() {

  const modal =
    document.getElementById("galleryModal");

  if (!modal) return;

  const grid =
    modal.querySelector(".modal-grid");

  const carousel =
    modal.querySelector(".carousel");

  if (carousel) {
    carousel.classList.add("hidden");
  }

  if (grid) {
    grid.classList.remove("hidden");
  }

}

/* ============================================================
   AGGIORNA IMMAGINE
============================================================ */

function updateCarousel() {

  const image =
    document.querySelector(".carousel-img");

  if (
    !image ||
    !galleryCurrentFolder
  ) return;

  image.src =
    `${galleryCurrentFolder.path}/${galleryCurrentFolder.images[galleryCurrentIndex]}`;
}

/* ============================================================
   NAVIGAZIONE
============================================================ */

function nextSlide() {

  if (!galleryCurrentFolder) return;

  galleryCurrentIndex =
    (galleryCurrentIndex + 1) %
    galleryCurrentFolder.images.length;

  updateCarousel();
}

function prevSlide() {

  if (!galleryCurrentFolder) return;

  galleryCurrentIndex =
    (galleryCurrentIndex - 1 +
      galleryCurrentFolder.images.length) %
    galleryCurrentFolder.images.length;

  updateCarousel();
}

/* ============================================================
   CHIUSURA MODALE
============================================================ */

function closeGalleryModal() {

  const modal =
    document.getElementById("galleryModal");

  if (!modal) return;

  const grid =
    modal.querySelector(".modal-grid");

  const carousel =
    modal.querySelector(".carousel");

  if (carousel) {
    carousel.classList.add("hidden");
  }

  if (grid) {
    grid.classList.remove("hidden");
  }

  modal.classList.remove("open");
  modal.classList.add("hidden");

  document.body.style.overflow = "";
}

/* ============================================================
   EVENTI UI
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const modal =
      document.getElementById(
        "galleryModal"
      );

    if (!modal) return;

    modal
      .querySelector(".close")
      ?.addEventListener(
        "click",
        closeGalleryModal
      );

    modal
      .querySelector(".carousel-close")
      ?.addEventListener(
        "click",
        closeCarousel
      );

    modal
      .querySelector(".next")
      ?.addEventListener(
        "click",
        event => {

          event.stopPropagation();
          nextSlide();

        }
      );

    modal
      .querySelector(".prev")
      ?.addEventListener(
        "click",
        event => {

          event.stopPropagation();
          prevSlide();

        }
      );

    modal.addEventListener(
      "click",
      event => {

        if (event.target === modal) {
          closeGalleryModal();
        }

      }
    );

  }
);

/* ============================================================
   ESPOSIZIONE GLOBALE
============================================================ */

window.openFolderModal =
  openFolderModal;

window.closeGalleryModal =
  closeGalleryModal;

console.log(
  "gallery-modal.js caricato"
);
