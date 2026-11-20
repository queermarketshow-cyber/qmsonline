/* ============================================================
   STATO GLOBALE MODALE
============================================================ */

let currentFolder = null;
let currentIndex = 0;

/* ============================================================
   APERTURA MODALE CARTELLA
============================================================ */

function openFolderModal(folder) {

  console.log("MODALE APERTA", folder);

  currentFolder = folder;

  const modal = document.getElementById("galleryModal");

  if (!modal) {
    console.error("galleryModal non trovato");
    return;
  }

  const grid = modal.querySelector(".modal-grid");
  const carousel = modal.querySelector(".carousel");
  const titleEl = modal.querySelector(".modal-album-title");
  const phEl = modal.querySelector(".modal-photographer");

  if (titleEl) {
    titleEl.textContent = folder.name || "";
  }

  if (phEl) {
    const photographers =
      folder.photographers ||
      folder.photographer ||
      null;

    if (!photographers) {
      phEl.textContent = "";
    } else if (typeof photographers === "string") {
      phEl.textContent = "pics by " + photographers;
    } else if (Array.isArray(photographers)) {
      phEl.textContent =
        "pics by " +
        photographers
          .map(p => typeof p === "object" ? p.name : p)
          .join(", ");
    }
  }

  if (grid) {

    grid.innerHTML = "";

    if (folder.images && folder.images.length) {

      folder.images.forEach((image, index) => {

        const img = document.createElement("img");

        img.src = `${folder.path}/${image}`;
        img.loading = "lazy";

        img.addEventListener("click", () => {
          openCarousel(index);
        });

        grid.appendChild(img);

      });

    }

    grid.classList.remove("hidden");
  }

  if (carousel) {
    carousel.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("open");

  document.body.style.overflow = "hidden";
}

/* ============================================================
   CHIUSURA MODALE
============================================================ */

function closeGalleryModal() {

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.add("hidden");

  document.body.style.overflow = "";
}

/* ============================================================
   CAROSELLO
============================================================ */

function openCarousel(index) {

  if (!currentFolder) return;

  currentIndex = index;

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  const carousel = modal.querySelector(".carousel");
  const img = modal.querySelector(".carousel-img");
  const grid = modal.querySelector(".modal-grid");

  if (!carousel || !img) return;

  img.src =
    `${currentFolder.path}/${currentFolder.images[currentIndex]}`;

  carousel.classList.remove("hidden");

  if (grid) {
    grid.classList.add("hidden");
  }
}

function updateCarousel() {

  const img = document.querySelector(".carousel-img");

  if (!img || !currentFolder) return;

  img.src =
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
   EVENTI UI
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("galleryModal");

  if (!modal) {
    console.error("galleryModal non trovato");
    return;
  }

  modal
    .querySelector(".close")
    ?.addEventListener("click", closeGalleryModal);

  modal
    .querySelector(".next")
    ?.addEventListener("click", e => {
      e.stopPropagation();
      nextSlide();
    });

  modal
    .querySelector(".prev")
    ?.addEventListener("click", e => {
      e.stopPropagation();
      prevSlide();
    });

  modal.addEventListener("click", e => {

    if (e.target === modal) {
      closeGalleryModal();
    }

  });

  console.log("gallery-modal.js CARICATO");
});

/* ============================================================
   ESPOSIZIONE GLOBALE
============================================================ */

window.openFolderModal = openFolderModal;
window.closeGalleryModal = closeGalleryModal;

console.log("openFolderModal registrata:", typeof window.openFolderModal);
