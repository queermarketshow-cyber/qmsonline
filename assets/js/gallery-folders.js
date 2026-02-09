/* PREVIEW CARTELLE — RANDOM ORDER */

// Fisher–Yates shuffle (non muta l’array originale)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderFolderPreviews() {
  const container = document.querySelector('.gallery-folders');
  if (!container || !galleryData) return;

  container.innerHTML = '';

  // 🔀 RANDOMIZZA L’ORDINE DELLE CARTELLE
  const randomizedFolders = shuffleArray(galleryData);

  randomizedFolders.forEach((folder, randomizedIndex) => {
    const preview = document.createElement('div');
    preview.className = 'folder-preview';
    preview.dataset.folderIndex = galleryData.indexOf(folder);

    const img = document.createElement('img');
    img.src = `${folder.path}/${folder.images[0]}`;
    img.alt = folder.name;

    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.textContent = folder.name;

    preview.appendChild(img);
    preview.appendChild(overlay);

    preview.addEventListener('click', () => openFolderModal(folder));

    container.appendChild(preview);
  });

  // Dopo il render, riattiva l’observer
  setupVisibilityObserver();
}


/* VISIBILITY OBSERVER */
function setupVisibilityObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const index = entry.target.dataset.folderIndex;
      if (entry.isIntersecting) visibleFolders.add(index);
      else visibleFolders.delete(index);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.folder-preview').forEach(el => observer.observe(el));
}


/* SLIDESHOW RANDOM */
function startRandomSlideshow() {
  setInterval(() => {
    const previews = Array.from(document.querySelectorAll('.folder-preview'));
    if (!galleryData || visibleFolders.size === 0 || previews.length === 0) return;

    const visibleArray = Array.from(visibleFolders);
    const randomVisibleIndex = visibleArray[Math.floor(Math.random() * visibleArray.length)];

    // Recupera la preview corretta
    const preview = previews.find(p => p.dataset.folderIndex == randomVisibleIndex);
    if (!preview) return;

    // Recupera l’indice REALE della cartella
    const realIndex = preview.dataset.folderIndex;
    const folder = galleryData[realIndex];

    const img = preview.querySelector('img');
    if (!img) return;

    const currentSrc = img.src.split('/').pop();
    let nextImg = currentSrc;

    while (nextImg === currentSrc && folder.images.length > 1) {
      nextImg = folder.images[Math.floor(Math.random() * folder.images.length)];
    }

    preview.classList.add('glitch-flash');
    setTimeout(() => preview.classList.remove('glitch-flash'), 120);

    img.src = `${folder.path}/${nextImg}`;
  }, 4000);
}
