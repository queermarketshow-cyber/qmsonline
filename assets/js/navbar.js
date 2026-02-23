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
    "calendario": "eventi",        // ← FIX
    "artist3": "artist3",
    "partnership": "collab-altro", // ← FIX
    "gallery": "gallery",
    "contatti": "contatti",
    "sostienici": "sostienici"
  };

  // mondo di default: HOME
  const defaultWorld = "home";

  /* ===============================
     CLEAN HASH (fix ritorno archivio)
  =============================== */
  function cleanHash(raw) {
    if (!raw) return "";
    return raw
      .replace("#", "")
      .split("#")[0]
      .trim();
  }

  /* ===============================
     HASH → ID SEZIONE VALIDO
     - nessun hash → defaultWorld (home)
     - hash non mappato → defaultWorld (home)
  =============================== */
  function getCurrentIdFromHash() {
    const cleaned = cleanHash(window.location.hash);
    if (!cleaned) return defaultWorld;
    return hashMap[cleaned] || defaultWorld;
  }

  /* ===============================
     APPLICA STATO ATTIVO A LINK + SEZIONI
  =============================== */
  function applyActiveState(currentId) {
    // link attivi
    allLinks.forEach(link => {
      const href = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", hashMap[href] === currentId || href === currentId);
    });

    // sezioni attive
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

  window.addEventListener("hashchange", updateFromHash);

  /* ===============================
     SCROLL → HASH (attivo solo dopo delay)
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
     INIZIALIZZAZIONE — FORZA #home SE HASH MANCANTE
  =============================== */

  // 1. leggi hash grezzo
  let rawCleaned = cleanHash(window.location.hash);

  // 2. se non c’è hash → forza #home
  if (!rawCleaned) {
    history.replaceState(null, "", "#home");
    rawCleaned = "home";
  }

  // 3. mappa hash → id reale (usa defaultWorld se non valido)
  let initialId = hashMap[rawCleaned] || defaultWorld;

  // 4. se l’hash nell’URL non coincide con l’id reale, riallinea
  if (window.location.hash.replace("#", "") !== initialId) {
    history.replaceState(null, "", "#" + initialId);
  }

  // 5. applica stato attivo
  applyActiveState(initialId);

  // 6. attiva logica scroll dopo un attimo
  setTimeout(() => {
    scrollActivationEnabled = true;
  }, 500);
});
