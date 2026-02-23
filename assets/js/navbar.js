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

  /* ===============================
     MAPPATURA HASH REALI → SEZIONI REALI
  =============================== */
  const hashMap = {
    "home": "home",
    "manifesto": "manifesto",
    "calendario": "eventi",
    "artist3": "artist3",
    "partnership": "collab-altro",
    "gallery": "gallery",
    "contatti": "contatti",
    "sostienici": "sostienici"
  };

  const defaultWorld = "home";

  /* ===============================
     CLEAN HASH
  =============================== */
  function cleanHash(raw) {
    if (!raw) return "";
    return raw.replace("#", "").split("#")[0].trim();
  }

  /* ===============================
     HASH → ID SEZIONE VALIDO
  =============================== */
  function getCurrentIdFromHash() {
    const cleaned = cleanHash(window.location.hash);
    if (!cleaned) return defaultWorld;
    return hashMap[cleaned] || defaultWorld;
  }

  /* ===============================
     APPLICA STATO ATTIVO
  =============================== */
  function applyActiveState(currentId) {
    allLinks.forEach(link => {
      const href = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", hashMap[href] === currentId || href === currentId);
    });

    sections.forEach(section => {
      section.classList.toggle("active", section.id === currentId);
    });
  }

  /* ===============================
     AGGIORNA DA HASH
  =============================== */
  function updateFromHash() {
    const currentId = getCurrentIdFromHash();
    applyActiveState(currentId);
  }

  window.addEventListener("hashchange", () => {
    updateFromHash();
    sessionStorage.setItem("lastSectionHash", window.location.hash);
  });

  /* ===============================
     SCROLL → HASH
  =============================== */
  let scrollActivationEnabled = false;

  function updateHashFromScroll() {
    if (!scrollActivationEnabled) return;

    let currentId = null;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentId = section.id;
      }
    });

    if (!currentId) return;

    const targetHash = "#" + currentId;

    if (window.location.hash !== targetHash) {
      history.replaceState(null, "", targetHash);
      applyActiveState(currentId);
      sessionStorage.setItem("lastSectionHash", targetHash);
    }
  }

  window.addEventListener("scroll", updateHashFromScroll);

  /* ===============================
     MENU MOBILE
  =============================== */
  if (menuToggle && menuMobile) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuMobile.classList.toggle("show");

      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileLinks.forEach(link => {
      link.addEventListener("click", () => {
        menuMobile.classList.remove("show");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ===============================
     SESSION HASH MEMORY
     Ricorda l’ultima section visitata
  =============================== */

  const savedHash = sessionStorage.getItem("lastSectionHash");

  // Se non c’è hash nell’URL ma esiste un hash salvato → ripristina
  if (!window.location.hash && savedHash) {
    history.replaceState(null, "", savedHash);
  }

  // Salva l’hash anche quando si lascia la pagina
  window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("lastSectionHash", window.location.hash);
  });

  /* ===============================
     INIZIALIZZAZIONE
  =============================== */

  let rawCleaned = cleanHash(window.location.hash);

  // Se non c’è hash → usa home
  if (!rawCleaned) {
    history.replaceState(null, "", "#home");
    rawCleaned = "home";
  }

  let initialId = hashMap[rawCleaned] || defaultWorld;

  if (window.location.hash.replace("#", "") !== initialId) {
    history.replaceState(null, "", "#" + initialId);
  }

  applyActiveState(initialId);

  setTimeout(() => {
    scrollActivationEnabled = true;
  }, 500);
});
