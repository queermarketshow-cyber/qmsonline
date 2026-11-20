
/* ============================================================
   STATO GLOBALE
============================================================ */

let currentFolder = null;
let currentIndex = 0;

/* ============================================================
   APERTURA CARTELLA
============================================================ */

function openFolderModal(folder) {

  currentFolder = folder;

  const modal = document.getElementById("galleryModal");

  if (!modal) {
    console.error("galleryModal non trovato");
    return;
  }

  const title = modal.querySelector(".modal-album-title");
  const photographer = modal.querySelector(".modal-photographer");
  const grid = modal.querySelector(".modal-grid");
  const carousel = modal.querySelector(".carousel");

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
          .map(p => typeof p === "object" ? p.name : p)
          .join(", ");

    } else {

      photographer.textContent = photographers;

    }

  }

  if (!grid) return;

  grid.innerHTML = "";

  if (folder.images && folder.images.length) {

    folder.images.forEach((image, index) => {

      const img = document.createElement("img");

      img.src = `${folder.path}/${image}`;
      img.alt = image;
      img.loading = "lazy";

      img.addEventListener("click", () => {
        openCarousel(index);
      });

      grid.appendChild(img);

    });

  }

  grid.style.display = "";
  grid.classList.remove("hidden");

  if (carousel) {
    carousel.style.display = "none";
    carousel.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("open");

  document.body.style.overflow = "hidden";
}

/* ============================================================
   CAROSELLO
============================================================ */

function openCarousel(index) {

  if (!currentFolder) return;

  currentIndex = index;

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  const grid = modal.querySelector(".modal-grid");
  const carousel = modal.querySelector(".carousel");
  const image = modal.querySelector(".carousel-img");

  if (!carousel || !image) return;

  image.src =
    `${currentFolder.path}/${currentFolder.images[currentIndex]}`;

  if (grid) {
    grid.style.display = "none";
  }

  carousel.style.display = "flex";
  carousel.classList.remove("hidden");
}

function updateCarousel() {

  const image =
    document.querySelector(".carousel-img");

  if (!image || !currentFolder) return;

  image.src =
    `${currentFolder.path}/${currentFolder.images[currentIndex]}`;
}

function nextSlide() {

  if (!currentFolder) return;

  currentIndex =
    (currentIndex + 1) %
    currentFolder.images.length;

  updateCarousel();
}

function prevSlide() {

  if (!currentFolder) return;

  currentIndex =
    (currentIndex - 1 + currentFolder.images.length) %
    currentFolder.images.length;

  updateCarousel();
}

/* ============================================================
   CHIUSURA MODALE
============================================================ */

function closeGalleryModal() {

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  const grid = modal.querySelector(".modal-grid");
  const carousel = modal.querySelector(".carousel");

  if (grid) {
    grid.style.display = "";
  }

  if (carousel) {
    carousel.style.display = "none";
    carousel.classList.add("hidden");
  }

  modal.classList.remove("open");
  modal.classList.add("hidden");

  document.body.style.overflow = "";
}

/* ============================================================
   EVENTI
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const modal =
    document.getElementById("galleryModal");

  if (!modal) return;

  modal
    .querySelector(".close")
    ?.addEventListener("click", closeGalleryModal);

  modal
    .querySelector(".next")
    ?.addEventListener("click", (e) => {

      e.stopPropagation();
      nextSlide();

    });

  modal
    .querySelector(".prev")
    ?.addEventListener("click", (e) => {

      e.stopPropagation();
      prevSlide();

    });

  modal.addEventListener("click", (e) => {

    if (e.target === modal) {
      closeGalleryModal();
    }

  });

  const carousel =
    modal.querySelector(".carousel");

  if (carousel) {

    carousel.style.display = "none";
    carousel.classList.add("hidden");

  }

});

/* ============================================================
   ESPOSIZIONE GLOBALE
============================================================ */

window.openFolderModal = openFolderModal;
window.closeGalleryModal = closeGalleryModal;

console.log("gallery-modal.js caricato");
console.log(
  "openFolderModal:",
  typeof window.openFolderModal
);
