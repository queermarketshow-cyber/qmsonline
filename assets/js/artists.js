(() => {
  "use strict";

  const CONFIG = {
    candidateUrls: [
      "./artists.json",
      "artists.json",
      "/artists.json",
      "../artists.json",
      "../../artists.json",
      "./data/artists.json",
      "/data/artists.json"
    ],
    timeoutMs: 8000
  };

  function getDom() {
    return {
      sectionHome:
        document.getElementById("artiste") ||
        document.getElementById("artistə") ||
        document.getElementById("artist3") ||
        document.querySelector(".home-artists-section"),
      residentGallery: document.getElementById("artists-resident"),
      allGallery: document.getElementById("artists-all"),
      allFilters: document.getElementById("all-artists-filters"),
      modalsContainer: document.getElementById("artist-modals")
    };
  }

  const state = {
    artists: [],
    allFilter: "all",
    activeArtistId: null,
    lastFocusedCard: null,
    savedScrollY: null,
    loadError: "",
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
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../")
    ) {
      return trimmed;
    }
    try {
      const base =
        window.location.origin && window.location.origin !== "null"
          ? window.location.origin
          : window.location.href;
      new URL(trimmed, base);
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  function joinAssetPath(basePath, fileOrUrl) {
    const cleanFile = String(fileOrUrl || "").trim();
    if (!cleanFile) return "";

    if (
      cleanFile.startsWith("http://") ||
      cleanFile.startsWith("https://") ||
      cleanFile.startsWith("/") ||
      cleanFile.startsWith("./") ||
      cleanFile.startsWith("../")
    ) {
      return sanitizeUrl(cleanFile);
    }

    const cleanDir = String(basePath || "").trim().replace(/^\/+|\/+$/g, "");
    const combined = cleanDir
      ? `${cleanDir}/${cleanFile.replace(/^\/+/, "")}`
      : cleanFile;
    return sanitizeUrl(combined);
  }

  function normalizeArtistType(artist) {
    const raw = String(artist.type ?? artist.category ?? "")
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

        const basePath =
          item.path ?? item.folder ?? item.dir ?? item.basePath ?? "";
        const rawCover =
          item.cover ?? item.image ?? item.img ?? item.foto ?? "";
        const coverUrl = joinAssetPath(basePath, rawCover);

        const rawImages = Array.isArray(item.images)
          ? item.images
          : Array.isArray(item.gallery)
            ? item.gallery
            : [];

        const galleryUrls = rawImages
          .map((img) => joinAssetPath(basePath, img))
          .filter(Boolean);

        const finalCover = coverUrl || galleryUrls[0] || "";
        const bioLong = item.bio_long ? String(item.bio_long).trim() : "";
        const bioShort = item.bio_short ? String(item.bio_short).trim() : "";

        return {
          id: String(item.id ?? `artist-${idx + 1}`),
          name: String(rawName).trim(),
          role: item.role ? String(item.role).trim() : "",
          type: normalizeArtistType(item),
          bioShort,
          bioLong,
          bio: bioLong || bioShort,
          instagram: sanitizeUrl(item.instagram ?? item.ig ?? ""),
          path: String(basePath || "").trim(),
          cover: finalCover,
          gallery: galleryUrls
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
    state.loadError = "";

    if (window.location.protocol === "file:") {
      state.loadError =
        "Apertura tramite file://: avvia un server locale per caricare artists.json.";
      console.warn("[artists.js]", state.loadError);
      return [];
    }

    const tried = [];
    for (const url of CONFIG.candidateUrls) {
      tried.push(url);
      try {
        const data = await fetchSingle(url);
        const normalized = normalizeArtists(data);
        if (normalized.length > 0) {
          console.info(
            "[artists.js] Caricato da:",
            url,
            "Totale:",
            normalized.length
          );
          return normalized;
        }
      } catch {
        // Prova il percorso successivo
      }
    }

    state.loadError = `Impossibile caricare artists.json (percorsi provati: ${tried.join(", ")}).`;
    console.warn("[artists.js]", state.loadError);
    return [];
  }

  function renderArtistCard(artist) {
    const safeId = escapeHTML(artist.id);
    const safeName = escapeHTML(artist.name);
    const safeCover = escapeHTML(artist.cover);

    const typeLabel = artist.type === "guest" ? "OSPITE" : "RESIDENT";

    const roleTag = artist.role
      ? `
        <span class="artist-cast-tag">
          ${escapeHTML(artist.role)}
        </span>
      `
      : "";

    return `
      <article
        class="artist-card artist-cast-card"
        data-artist-id="${safeId}"
        tabindex="0"
        role="button"
        aria-label="Apri scheda di ${safeName}"
      >
        <div class="artist-cast-image">
          ${
            safeCover
              ? `
                <img
                  class="artist-cover-img"
                  src="${safeCover}"
                  alt="${safeName}"
                  loading="lazy"
                  onerror="this.style.display='none';"
                >
              `
              : ""
          }
        </div>

        <div class="artist-cast-info">
          <span class="artist-cast-name">
            ${safeName}
          </span>

          <div class="artist-cast-tags">
            <span class="artist-cast-tag">
              ${escapeHTML(typeLabel)}
            </span>

            ${roleTag}
          </div>
        </div>
      </article>
    `;
  }

  function renderHomeResidents(dom) {
    if (dom.sectionHome) {
      dom.sectionHome.style.opacity = "1";
    }
    if (!dom.residentGallery) return;

    const residents = state.artists.filter((a) => a.type === "resident");
    dom.residentGallery.innerHTML = residents.length
      ? residents.map(renderArtistCard).join("")
      : `<p class="empty-state">${escapeHTML(state.loadError || "Nessuna artista resident disponibile al momento.")}</p>`;
  }

  function syncAllFilterButtons(dom) {
    if (!dom.allFilters) return;
    dom.allFilters.querySelectorAll("[data-artist-filter]").forEach((btn) => {
      const isActive = btn.dataset.artistFilter === state.allFilter;
      btn.classList.toggle("active", isActive);
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderAllArtistsPage(dom) {
    if (!dom.allGallery) return;
    syncAllFilterButtons(dom);

    const filtered =
      state.allFilter === "all"
        ? state.artists
        : state.artists.filter((a) => a.type === state.allFilter);

    if (!filtered.length) {
      const msg =
        state.loadError ||
        "Nessuna artista trovata per questo filtro.";
      dom.allGallery.innerHTML = `<p class="empty-state">${escapeHTML(msg)}</p>`;
      return;
    }

    dom.allGallery.innerHTML = filtered.map(renderArtistCard).join("");
  }

  function getModalList() {
    const isHomeOnly =
      Boolean(document.getElementById("artists-resident")) &&
      !document.getElementById("artists-all");

    if (isHomeOnly && state.activeArtistId) {
      const residents = state.artists.filter((a) => a.type === "resident");
      if (residents.some((a) => a.id === state.activeArtistId)) {
        return residents;
      }
    }

    if (document.getElementById("artists-all") && state.allFilter !== "all") {
      const filtered = state.artists.filter((a) => a.type === state.allFilter);
      if (filtered.some((a) => a.id === state.activeArtistId)) {
        return filtered;
      }
    }

    return state.artists;
  }

  function openArtistModal(artistId, dom, triggerCard = null) {
    const artist = state.artists.find((a) => a.id === artistId);
    if (!artist || !dom.modalsContainer) return;

    const isFirstOpen = !state.activeArtistId;
    state.activeArtistId = artist.id;

    if (isFirstOpen) {
      state.savedScrollY = window.scrollY;
      state.lastFocusedCard =
        triggerCard ||
        document.querySelector(`.artist-card[data-artist-id="${CSS.escape(artistId)}"]`) ||
        null;
    }

    const modalGalleryItems = artist.gallery.length
      ? artist.gallery
      : artist.cover
        ? [artist.cover]
        : [];

    const hasGallery = modalGalleryItems.length > 0;
    const galleryHTML = hasGallery
      ? `<div class="artist-modal-gallery">${modalGalleryItems
          .map((src) => `<img src="${escapeHTML(src)}" alt="${escapeHTML(artist.name)}" loading="lazy">`)
          .join("")}</div>`
      : "";

    const bioHTML =
      [
        artist.bioShort
          ? `<p class="artist-modal-lead"><strong>${escapeHTML(artist.bioShort)}</strong></p>`
          : "",
        artist.bioLong ? `<p>${escapeHTML(artist.bioLong)}</p>` : ""
      ]
        .filter(Boolean)
        .join("") || `<p>Biografia in aggiornamento.</p>`;

    const igHTML = artist.instagram
      ? `<p class="artist-modal-social"><a href="${escapeHTML(artist.instagram)}" target="_blank" rel="noopener noreferrer">Instagram →</a></p>`
      : "";

    const navList = getModalList();
    const closeBtnHTML = `<button type="button" class="close-button" data-action="close-artist-modal" aria-label="Chiudi scheda">&times;</button>`;
    const navHTML =
      navList.length > 1
        ? `
          <div class="artist-modal-nav">
            <button type="button" class="artist-nav-btn" data-action="prev-artist">← Prec</button>
            ${closeBtnHTML}
            <button type="button" class="artist-nav-btn" data-action="next-artist">Succ →</button>
          </div>
        `
        : `<div class="artist-modal-nav artist-modal-nav--single">${closeBtnHTML}</div>`;

    dom.modalsContainer.innerHTML = `
      <div class="artist-modal" role="dialog" aria-modal="true" aria-labelledby="artist-modal-title">
        <div class="artist-modal-content">
          ${navHTML}
          <div class="artist-header">
            <h3 id="artist-modal-title">${escapeHTML(artist.name)}</h3>
            <span class="artista-role-tag">${artist.type === "guest" ? "Ospite" : "Resident"}</span>
            ${artist.role ? `<span class="artista-role-tag">${escapeHTML(artist.role)}</span>` : ""}
          </div>
          <div class="artist-modal-layout ${hasGallery ? "" : "artist-modal-layout--single"}">
            <div class="artist-modal-text">
              ${bioHTML}
              ${igHTML}
            </div>
            ${galleryHTML}
          </div>
        </div>
      </div>
    `;

    document.body.classList.add("modal-open");
  }

  function stepArtistModal(direction, dom) {
    if (!state.activeArtistId) return;
    const navList = getModalList();
    if (navList.length < 2) return;
    const idx = navList.findIndex((a) => a.id === state.activeArtistId);
    if (idx === -1) return;
    const nextIdx = (idx + direction + navList.length) % navList.length;
    openArtistModal(navList[nextIdx].id, dom);
  }

  function closeArtistModal(dom) {
    const targetCard = state.lastFocusedCard;
    const targetScrollY = state.savedScrollY;

    state.activeArtistId = null;
    state.lastFocusedCard = null;
    state.savedScrollY = null;

    if (dom.modalsContainer) {
      dom.modalsContainer.innerHTML = "";
    }
    document.body.classList.remove("modal-open");

    if (typeof targetScrollY === "number") {
      window.scrollTo({ top: targetScrollY, behavior: "instant" });
    }

    if (targetCard && targetCard.isConnected) {
      try {
        targetCard.focus({ preventScroll: true });
      } catch {
        targetCard.focus();
      }
    } else if (dom.sectionHome) {
      dom.sectionHome.scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }

  function bindEventsOnce() {
    if (state.listenersBound) return;
    state.listenersBound = true;

    document.addEventListener("click", (e) => {
      const currentDom = getDom();

      const filterBtn = e.target.closest("#all-artists-filters [data-artist-filter]");
      if (filterBtn) {
        state.allFilter = filterBtn.dataset.artistFilter;
        renderAllArtistsPage(currentDom);
        return;
      }

      if (e.target.closest('[data-action="close-artist-modal"]')) {
        e.preventDefault();
        closeArtistModal(currentDom);
        return;
      }

      if (e.target.closest('[data-action="prev-artist"]')) {
        e.preventDefault();
        stepArtistModal(-1, currentDom);
        return;
      }

      if (e.target.closest('[data-action="next-artist"]')) {
        e.preventDefault();
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
        e.preventDefault();
        openArtistModal(card.dataset.artistId, currentDom, card);
      }
    });

    window.addEventListener(
      "keydown",
      (e) => {
        if (!state.activeArtistId) {
          if (e.key === "Enter") {
            const card = document.activeElement?.closest(".artist-card[data-artist-id]");
            if (card) {
              e.preventDefault();
              openArtistModal(card.dataset.artistId, getDom(), card);
            }
          }
          return;
        }

        const currentDom = getDom();
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeArtistModal(currentDom);
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          stepArtistModal(-1, currentDom);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          stepArtistModal(1, currentDom);
        }
      },
      true
    );
  }

  async function init() {
    const dom = getDom();
    bindEventsOnce();
    state.artists = await loadArtistsData();
    renderHomeResidents(dom);
    renderAllArtistsPage(dom);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();