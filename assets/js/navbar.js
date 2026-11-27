/* ===============================
   NAVBAR — ACTIVE LINK + MENU MOBILE + SCROLL LOGIC
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ELEMENTI */
  const sections = Array.from(document.querySelectorAll("section[id]"));

  const desktopLinks = document.querySelectorAll(
    ".navbar a[href^='#']"
  );

  const mobileLinks = document.querySelectorAll(
    ".menu-mobile a[href^='#']"
  );

  const allLinks = [...desktopLinks, ...mobileLinks];

  const menuToggle = document.querySelector(".menu-toggle");
  const menuMobile = document.querySelector(".menu-mobile");

  const defaultSection = "home";

  /* ===============================
     CLEAN HASH
  =============================== */
  function cleanHash(raw) {
    if (!raw) return "";
    return raw.replace("#", "").trim();
  }

  /* ===============================
     HASH → ID REALE
  =============================== */
  function getCurrentIdFromHash() {
    const cleaned = cleanHash(window.location.hash);
    return cleaned || defaultSection;
  }

  /* ===============================
     LINK ATTIVO
  =============================== */
  function applyActiveState(currentId) {

    allLinks.forEach(link => {
      const href = cleanHash(link.getAttribute("href"));

      link.classList.toggle(
        "active",
        href === currentId
      );
    });

    sections.forEach(section => {
      section.classList.toggle(
        "active",
        section.id === currentId
      );
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
    sessionStorage.setItem(
      "lastSectionHash",
      window.location.hash
    );
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

      history.replaceState(
        null,
        "",
        targetHash
      );

      applyActiveState(currentId);

      sessionStorage.setItem(
        "lastSectionHash",
        targetHash
      );
    }
  }

  window.addEventListener(
    "scroll",
    updateHashFromScroll
  );

  /* ===============================
     MENU MOBILE
  =============================== */

  if (menuToggle && menuMobile) {

    menuToggle.addEventListener("click", () => {

      const isOpen =
        menuMobile.classList.toggle("show");

      menuToggle.classList.toggle(
        "open",
        isOpen
      );

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

      document.body.style.overflow =
        isOpen ? "hidden" : "";
    });

    mobileLinks.forEach(link => {

      link.addEventListener("click", () => {

        menuMobile.classList.remove("show");

        menuToggle.classList.remove("open");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        document.body.style.overflow = "";
      });

    });

  }

  /* ===============================
     SESSION HASH MEMORY
  =============================== */

  const savedHash =
    sessionStorage.getItem("lastSectionHash");

  if (!window.location.hash && savedHash) {

    history.replaceState(
      null,
      "",
      savedHash
    );

  }

  window.addEventListener("beforeunload", () => {

    sessionStorage.setItem(
      "lastSectionHash",
      window.location.hash
    );

  });

  /* ===============================
     INIZIALIZZAZIONE
  =============================== */

  let currentId =
    getCurrentIdFromHash();

  if (!window.location.hash) {

    history.replaceState(
      null,
      "",
      "#home"
    );

    currentId = "home";
  }

  applyActiveState(currentId);

  setTimeout(() => {
    scrollActivationEnabled = true;
  }, 500);

});