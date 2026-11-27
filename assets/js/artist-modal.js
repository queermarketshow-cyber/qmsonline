(() => {
  "use strict";

  const CONFIG = {
    candidateUrls: [
      "./artists.json",
      "artists.json",
      "/artists.json",
      "../artists.json",
      "./data/artists.json"
    ],
    timeoutMs: 8000
  };

  // Elenco predefinito: usato se artists.json non esiste o è vuoto
  const FALLBACK_ARTISTS = [
    {
      id: "artist-1",
      name: "Vespera",
      role: "resident",
      image: "images/artisti/resident-1.jpg",
      bio: "DJ e selettore tra elettronica sperimentale, club culture e sonorità del sud.",
      gallery: []
    },
    {
      id: "artist-2",
      name: "Mina K.",
      role: "resident",
      image: "images/artisti/resident-2.jpg",
      bio: "Visual artist e performer attive tra installazioni, luce e immagine in movimento.",
      gallery: []
    },
    {
      id: "artist-3",
      name: "Soraia",
      role: "guest",
      image: "images/artisti/guest-1.jpg",
      bio: "Artista ospite e ricercatrice sonora con focus su archivi e narrazioni collettive.",
      gallery: []
    }
  ];

  function getDom() {
    return {
      sectionHome:
        document.getElementById("artiste") ||
        document.getElementById("artistə") ||
        document.getElementById("artist3") ||
        document.querySelector(".home-artists-section"),
      btnResident: document.getElementById("btn-resident"),
      btnGuest: document.getElementById("btn-guest"),
      residentGallery: document.getElementById("artists-resident"),
      guestGallery: document.getElementById("artists-guest"),
      allGallery: document.getElementById("artists-all"),
      allFilters: document.getElementById("all-artists-filters"),
      modalsContainer: document.getElementById("artist-modals")
    };
  }

  const state = {
    artists: [],
    allFilter: "all",
    activeArtistId: null,
    listenersBound: false
  };

  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function sanitizeUrl(url = "") {
    const trimmed = String(url).trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../")
    ) {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.href;
      }
    } catch {
      return "";
    }
    return "";
  }

  function normalizeRole(artist) {
    const raw = String(
      artist.role ?? artist.ruolo ?? artist.type ?? artist.tipo ?? artist.category ?? ""
    )
      .trim()
      .toLowerCase();

    if (
      raw === "guest" ||
      raw === "ospite" ||
      raw === "ospiti" ||
      raw === "guests"
    ) {
      return "guest";
    }
    return "resident";
  }

  function normalizeArtists(payload) {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.artists)
        ? payload.artists
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return list
      .map((item, idx) => {
        if (!item || typeof item !== "object") return null;
        const rawName = item.name ?? item.nome ?? item.title;
        if (!rawName || !String(rawName).trim()) return null;

        const rawImage = item.image ?? item.img ?? item.foto ?? item.avatar ?? "";
        const rawBio = item.bio ?? item.description ?? item.descrizione ?? "";
        const rawGallery = Array.isArray(item.gallery)
          ? item.gallery
          : Array.isArray(item.immagini)
            ? item.immagini
            : [];

        return {
          id: String(item.id ?? `artist-${idx + 1}`),
          name: String(rawName).trim(),
          role: normalizeRole(item),
          image: sanitizeUrl(rawImage),
          bio: String(rawBio).trim(),
          gallery: rawGallery.map((g) => sanitizeUrl(g)).filter(Boolean)
        };
      })
      .filter(Boolean);
  }

  async function fetchSingle(url) {
    const resolved = new URL(url, window.location.href).href;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CONFIG.timeoutMs);
    try {
      const res = await fetch(resolved, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function loadArtistsData() {
    if (window.location.protocol === "file:") {
      return normalizeArtists(FALLBACK_ARTISTS);
    }

    for (const url of CONFIG.candidateUrls) {
      try {
        const data = await fetchSingle(url);
        const normalized = normalizeArtists(data);
        if (normalized.length > 0) {
          console.info("[artists.js] Caricato da:", url, "Totale:", normalized.length);
          return normalized;
        }
      } catch {
        // Prova il percorso successivo
      }
    }

    console.info("[artists.js] Nessun artists.json trovato, uso dati predefiniti.");
    return normalizeArtists(FALLBACK_ARTISTS);
  }

  function renderArtistCard(artist) {
    const safeId = escapeHTML(artist.id);
    const safeName = escapeHTML(artist.name);
    const safeImg = escapeHTML(artist.image);
    const badgeLabel = artist.role === "guest" ? "Ospite" : "Resident";

    return `
      <article class="artist-card" data-artist-id="${safeId}" tabindex="0" role="button" aria-label="Apri scheda di ${safeName}">
        ${
          safeImg
            ? `<img src="${safeImg}" alt="${safeName}" loading="lazy" onerror="this.style.display='none'">`
            : ""
        }
        <div class="artista-info">
          <span class="artista-name">${safeName}</span>
          <span class="artista-role-tag">${escapeHTML(badgeLabel)}</span>
        </div>
      </article>
    `;
  }

  function renderHomeGalleries(dom) {
    if (dom.sectionHome) {
      dom.sectionHome.style.opacity = "1";
    }

    const residents = state.artists.filter((a) => a.role === "resident");
    const guests = state.artists.filter((a) => a.role === "guest");

    console.info(
      `[artists.js] Residenti: ${residents.length} | Ospiti: ${guests.length}`
    );

    if (dom.residentGallery) {
      dom.residentGallery.innerHTML = residents.length
        ? residents.map(renderArtistCard).join("")
        : `<p class="empty-state">Nessuna artista resident disponibile al momento.</p>`;
    }

    if (dom.guestGallery) {
      dom.guestGallery.innerHTML = guests.length
        ? guests.map(renderArtistCard).join("")
        : `<p class="empty-state">Nessuna artista ospite al momento.</p>`;
    }
  }

  function renderAllArtistsPage(dom) {
    if (!dom.allGallery) return;

    const filtered =
      state.allFilter === "all"
        ? state.artists
        : state.artists.filter((a) => a.role === state.allFilter);

    dom.allGallery.innerHTML = filtered.length
      ? filtered.map(renderArtistCard).join("")
      : `<p class="empty-state">Nessuna artista trovata per questo filtro.</p>`;
  }

  function openArtistModal(artistId, dom) {
    const currentIndex = state.artists.findIndex((a) => a.id === artistId);
    if (currentIndex === -1 || !dom.modalsContainer) return;

    const artist = state.artists[currentIndex];
    state.activeArtistId = artist.id;

    const hasGallery = artist.gallery.length > 0;
    const galleryHTML = hasGallery
      ? `<div class="artist-modal-gallery">${artist.gallery
          .map(
            (src) =>
              `<img src="${escapeHTML(src)}" alt="${escapeHTML(artist.name)}" loading="lazy">`
          )
          .join("")}</div>`
      : "";

    const navHTML =
      state.artists.length > 1
        ? `
          <div class="artist-modal-nav">
            <button type="button" class="artist-nav-btn" data-action="prev-artist">← Prec</button>
            <button type="button" class="artist-nav-btn" data-action="next-artist">Succ →</button>
          </div>
        `
        : "";

    dom.modalsContainer.innerHTML = `
      <div class="artist-modal" role="dialog" aria-modal="true" aria-labelledby="artist-modal-title">
        <div class="artist-modal-content">
          <button type="button" class="close-button" data-action="close-artist-modal" aria-label="Chiudi scheda">&times;</button>
          <div class="artist-header">
            <h3 id="artist-modal-title">${escapeHTML(artist.name)}</h3>
            <span class="artista-role-tag">${artist.role === "guest" ? "Ospite" : "Resident"}</span>
          </div>
          <div class="artist-modal-layout ${hasGallery ? "" : "artist-modal-layout--single"}">
            <div class="artist-modal-text">
              ${artist.bio ? `<p>${escapeHTML(artist.bio)}</p>` : `<p>Biografia in aggiornamento.</p>`}
            </div>
            ${galleryHTML}
          </div>
          ${navHTML}
        </div>
      </div>
    `;

    document.body.classList.add("modal-open");
  }

  function stepArtistModal(direction, dom) {
    if (!state.activeArtistId || state.artists.length < 2) return;
    const idx = state.artists.findIndex((a) => a.id === state.activeArtistId);
    if (idx === -1) return;
    const nextIdx = (idx + direction + state.artists.length) % state.artists.length;
    openArtistModal(state.artists[nextIdx].id, dom);
  }

  function closeArtistModal(dom) {
    state.activeArtistId = null;
    if (dom.modalsContainer) {
      dom.modalsContainer.innerHTML = "";
    }
    document.body.classList.remove("modal-open");
  }

  function bindEventsOnce() {
    if (state.listenersBound) return;
    state.listenersBound = true;

    const dom = getDom();

    if (dom.btnResident && dom.btnGuest && dom.residentGallery && dom.guestGallery) {
      dom.btnResident.addEventListener("click", () => {
        dom.btnResident.classList.add("active");
        dom.btnGuest.classList.remove("active");
        dom.residentGallery.style.display = "";
        dom.guestGallery.style.display = "none";
      });

      dom.btnGuest.addEventListener("click", () => {
        dom.btnGuest.classList.add("active");
        dom.btnResident.classList.remove("active");
        dom.guestGallery.style.display = "";
        dom.residentGallery.style.display = "none";
      });
    }

    if (dom.allFilters) {
      dom.allFilters.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-artist-filter]");
        if (!btn) return;
        state.allFilter = btn.dataset.artistFilter;
        dom.allFilters.querySelectorAll("[data-artist-filter]").forEach((el) => {
          el.classList.toggle("active", el === btn);
        });
        renderAllArtistsPage(getDom());
      });
    }

    document.addEventListener("click", (e) => {
      const currentDom = getDom();

      if (e.target.closest('[data-action="close-artist-modal"]')) {
        closeArtistModal(currentDom);
        return;
      }

      if (e.target.closest('[data-action="prev-artist"]')) {
        stepArtistModal(-1, currentDom);
        return;
      }

      if (e.target.closest('[data-action="next-artist"]')) {
        stepArtistModal(1, currentDom);
        return;
      }

      const modalBackdrop = e.target.closest(".artist-modal");
      if (modalBackdrop && e.target === modalBackdrop) {
        closeArtistModal(currentDom);
        return;
      }

      const card = e.target.closest(".artist-card[data-artist-id]");
      if (card) {
        openArtistModal(card.dataset.artistId, currentDom);
      }
    });

    document.addEventListener("keydown", (e) => {
      const currentDom = getDom();
      if (e.key === "Escape" && state.activeArtistId) {
        closeArtistModal(currentDom);
        return;
      }
      if (state.activeArtistId && e.key === "ArrowLeft") {
        e.preventDefault();
        stepArtistModal(-1, currentDom);
        return;
      }
      if (state.activeArtistId && e.key === "ArrowRight") {
        e.preventDefault();
        stepArtistModal(1, currentDom);
        return;
      }
      if (e.key === "Enter") {
        const card = document.activeElement?.closest(".artist-card[data-artist-id]");
        if (card) {
          e.preventDefault();
          openArtistModal(card.dataset.artistId, currentDom);
        }
      }
    });
  }

  async function init() {
    const dom = getDom();
    bindEventsOnce();
    state.artists = await loadArtistsData();
    renderHomeGalleries(dom);
    renderAllArtistsPage(dom);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();