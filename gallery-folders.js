/* PREVIEW CARTELLE */
function renderFolderPreviews() {
  const container = document.querySelector('.gallery-folders');
  if (!container || !galleryData) return;

  container.innerHTML = '';

  galleryData.forEach((folder, folderIndex) => {
    const preview = document.createElement('div');
    preview.className = 'folder-preview';
    preview.dataset.folderIndex = folderIndex;

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
    const randomFolderIndex = visibleArray[Math.floor(Math.random() * visibleArray.length)];

    const preview = previews[randomFolderIndex];
    const folder = galleryData[randomFolderIndex];
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
