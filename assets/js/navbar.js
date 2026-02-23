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
   ACTIVE LINK BASATO SU HASH
=============================== */
function updateActiveLinkFromHash() {
  const current = window.location.hash.replace('#', '');
  allLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === '#' + current
    );
  });
}

window.addEventListener('hashchange', updateActiveLinkFromHash);
updateActiveLinkFromHash();

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
/* ===============================
   NAVIGAZIONE A MONDI
=============================== */

const worlds = [
  "#home",
  "#manifesto",
  "#eventi",
  "#artist3",
  "#collab-altro",
  "#gallery",
  "#contatti",
  "#sostienici"
];

const defaultWorld = "#gallery";

function getWorldFromHash() {
  const h = window.location.hash;
  return worlds.includes(h) ? h : defaultWorld;
}

function activateWorld(id) {
  document.querySelectorAll("section[id]").forEach(sec => {
    sec.classList.toggle("active", "#" + sec.id === id);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const world = getWorldFromHash();
  activateWorld(world);
  if (window.location.hash !== world) {
    window.location.hash = world;
  }
});

window.addEventListener("hashchange", () => {
  activateWorld(getWorldFromHash());
});
