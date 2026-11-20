let currentFolder = null;
let currentIndex = 0;

function openFolderModal(folder) {

  console.log("MODALE APERTA", folder);

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
    photographer.textContent = folder.photographer || "";
  }

  if (grid) {

    grid.innerHTML = "";

    if (folder.images && folder.images.length) {

      folder.images.forEach((image, index) => {

        const img = document.createElement("img");

        img.src = `${folder.path}/${image}`;
        img.loading = "lazy";

img.addEventListener("click", () => {

  const lightbox =
    document.getElementById("lightbox");

  const lightboxImg =
    document.getElementById("lightbox-img");

  currentIndex = index;

  lightboxImg.src =
    `${folder.path}/${folder.images[index]}`;

  lightbox.classList.remove("hidden");

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

function closeGalleryModal() {

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.add("hidden");

  document.body.style.overflow = "";
}

function openCarousel(index) {

  if (!currentFolder) return;

  currentIndex = index;

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  const carousel = modal.querySelector(".carousel");
  const img = modal.querySelector(".carousel-img");
  const grid = modal.querySelector(".modal-grid");

  if (!img || !carousel) return;

  img.src =
    `${currentFolder.path}/${currentFolder.images[currentIndex]}`;

  /* NASCONDE TOTALMENTE LA GRIGLIA */
  if (grid) {
    grid.style.display = "none";
  }

  /* MOSTRA IL CAROSELLO */
  carousel.style.display = "flex";
  carousel.classList.remove("hidden");
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

function closeGalleryModal() {

  const modal = document.getElementById("galleryModal");

  if (!modal) return;

  const grid = modal.querySelector(".modal-grid");
  const carousel = modal.querySelector(".carousel");

  if (grid) {
    grid.style.display = "";
    grid.classList.remove("hidden");
  }

  if (carousel) {
    carousel.style.display = "";
    carousel.classList.add("hidden");
  }

  modal.classList.remove("open");
  modal.classList.add("hidden");

  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("galleryModal");

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

});

window.openFolderModal = openFolderModal;
window.closeGalleryModal = closeGalleryModal;

console.log("gallery-modal.js caricato");
console.log(typeof window.openFolderModal);
