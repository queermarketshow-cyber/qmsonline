/* ============================================================
   GALLERY FOLDERS — GESTIONE ANTEPRIME E SLIDESHOW
============================================================ */

/* evita errori di doppia dichiarazione */
window.archiveVisibleFolders =
  window.archiveVisibleFolders || new Set();

/**
 * Inizializzazione
 */
document.addEventListener("DOMContentLoaded", () => {

  fetch("gallery.json")

    .then(response => {

      if (!response.ok) {
        throw new Error(
          `Errore nel caricamento di gallery.json (${response.status})`
        );
      }

      return response.json();

    })

    .then(data => {

      window.galleryData = data.folders || [];

      console.log(
        "Gallery caricata:",
        window.galleryData
      );

      renderFolderPreviews();
      startRandomSlideshow();

    })

    .catch(error => {

      console.error(
        "Errore inizializzazione:",
        error
      );

    });

});

/**
 * Shuffle
 */
function shuffleArray(array) {

  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [arr[i], arr[j]] =
      [arr[j], arr[i]];

  }

  return arr;
}

/**
 * Render cartelle
 */
function renderFolderPreviews() {

  const container =
    document.querySelector(".gallery-folders");

  if (!container || !window.galleryData) return;

  container.innerHTML = "";

  const randomizedFolders =
    shuffleArray(window.galleryData);

  randomizedFolders.forEach(folder => {

    const preview =
      document.createElement("div");

    preview.className =
      "folder-preview";

    preview.dataset.folderIndex =
      window.galleryData.indexOf(folder);

    const img =
      document.createElement("img");

    if (
      folder.images &&
      folder.images.length > 0
    ) {

      img.src =
        `${folder.path}/${folder.images[0]}`;

    }

    img.alt =
      folder.name || "";

    img.loading = "lazy";

    const overlay =
      document.createElement("div");

    overlay.className =
      "folder-overlay";

    overlay.textContent =
      folder.name || "";

    preview.appendChild(img);
    preview.appendChild(overlay);

    /* click cartella */
    preview.addEventListener("click", () => {

      console.log(
        "CLICK CARTELLA",
        folder.name
      );

      if (
        typeof window.openFolderModal !==
        "function"
      ) {

        console.error(
          "openFolderModal non disponibile"
        );

        return;
      }

      window.openFolderModal(folder);

    });

    container.appendChild(preview);

  });

  setupVisibilityObserver();
}

/**
 * Observer
 */
function setupVisibilityObserver() {

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          const index =
            entry.target.dataset.folderIndex;

          if (entry.isIntersecting) {

            window.archiveVisibleFolders
              .add(index);

          } else {

            window.archiveVisibleFolders
              .delete(index);

          }

        });

      },
      {
        threshold: 0.4
      }
    );

  document
    .querySelectorAll(".folder-preview")
    .forEach(el =>
      observer.observe(el)
    );

}

/**
 * Slideshow
 */
function startRandomSlideshow() {

  if (window.gallerySlideshowInterval) {

    clearInterval(
      window.gallerySlideshowInterval
    );

  }

  window.gallerySlideshowInterval =
    setInterval(() => {

      const previews =
        Array.from(
          document.querySelectorAll(
            ".folder-preview"
          )
        );

      if (
        !window.galleryData ||
        window.archiveVisibleFolders.size === 0 ||
        previews.length === 0
      ) {
        return;
      }

      const visibleArray =
        Array.from(
          window.archiveVisibleFolders
        );

      const randomVisibleIndex =
        visibleArray[
          Math.floor(
            Math.random() *
            visibleArray.length
          )
        ];

      const preview =
        previews.find(
          p =>
            p.dataset.folderIndex ==
            randomVisibleIndex
        );

      if (!preview) return;

      const folder =
        window.galleryData[
          preview.dataset.folderIndex
        ];

      const img =
        preview.querySelector("img");

      if (
        !img ||
        !folder.images ||
        folder.images.length <= 1
      ) {
        return;
      }

      const currentSrc =
        img.src.split("/").pop();

      let nextImg =
        currentSrc;

      let safetyCounter = 0;

      while (
        nextImg === currentSrc &&
        safetyCounter < 10
      ) {

        nextImg =
          folder.images[
            Math.floor(
              Math.random() *
              folder.images.length
            )
          ];

        safetyCounter++;

      }

      preview.classList.add(
        "glitch-flash"
      );

      setTimeout(() => {

        img.src =
          `${folder.path}/${nextImg}`;

        preview.classList.remove(
          "glitch-flash"
        );

      }, 120);

    }, 4000);

}
