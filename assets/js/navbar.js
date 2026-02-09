/* ===============================
   NAVBAR — ACTIVE LINK + MENU MOBILE
=============================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ELEMENTI */
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.navbar a');
  const mobileLinks = document.querySelectorAll('.menu-mobile a');
  const allLinks = [...desktopLinks, ...mobileLinks];

  const menuToggle = document.querySelector('.menu-toggle');
  const menuMobile = document.querySelector('.menu-mobile');

  /* ===============================
     ACTIVE LINK SU SCROLL
  =============================== */
  function updateActiveLink() {
    let current = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        current = section.id;
      }
    });

    allLinks.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === '#' + current
      );
    });
  }

  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();

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

    /* Chiudi menu al click su un link */
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
