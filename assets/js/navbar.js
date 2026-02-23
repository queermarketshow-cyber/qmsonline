/* ===============================
   NAVBAR — ACTIVE LINK + MENU MOBILE + SCROLL LOGIC
=============================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ELEMENTI */
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const desktopLinks = document.querySelectorAll('.navbar a[href^="#"]');
  const mobileLinks = document.querySelectorAll('.menu-mobile a[href^="#"]');
  const allLinks = [...desktopLinks, ...mobileLinks];

  const menuToggle = document.querySelector('.menu-toggle');
  const menuMobile = document.querySelector('.menu-mobile');

  const worlds = [
    'home',
    'manifesto',
    'eventi',
    'artist3',
    'collab-altro',
    'gallery',
    'contatti',
    'sostienici'
  ];
  const defaultWorld = 'gallery';

  /* ===============================
     UTIL — NORMALIZZA HASH
  =============================== */
  function getCurrentIdFromHash() {
    const raw = window.location.hash.replace('#', '');
    if (worlds.includes(raw)) return raw;
    return defaultWorld;
  }

  /* ===============================
     APPLICA STATO ATTIVO A LINK + SEZIONI
  =============================== */
  function applyActiveState(currentId) {
    // link attivi
    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + currentId);
    });

    // sezioni attive
    sections.forEach(section => {
      section.classList.toggle('active', section.id === currentId);
    });
  }

  /* ===============================
     AGGIORNA DA HASH
  =============================== */
  function updateFromHash() {
    const currentId = getCurrentIdFromHash();
    applyActiveState(currentId);
  }

  window.addEventListener('hashchange', updateFromHash);

  /* ===============================
     AGGIORNA HASH DA SCROLL
  =============================== */
  function updateHashFromScroll() {
    let currentId = null;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentId = section.id;
      }
    });

    if (!currentId) return;

    const targetHash = '#' + currentId;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
      applyActiveState(currentId);
    }
  }

  window.addEventListener('scroll', updateHashFromScroll);

  /* ===============================
     MENU MOBILE
  =============================== */
  if (menuToggle && menuMobile) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuMobile.classList.toggle('show');

      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuMobile.classList.remove('show');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
});
