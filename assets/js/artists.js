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

  function getDom() {
    return {
      sectionHome:
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
    const combined = cleanDir ? `${cleanDir}/${cleanFile.replace(/^\/+/, "")}` : cleanFile;
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

        const basePath = item.path ?? item.folder ?? "";
        const rawCover = item.cover ?? item.image ?? item.img ?? item.foto ?? "";
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
    if (window.location.protocol === "file:") {
      console.warn("[artists.js] Protocollo file:// rilevato: avvia un server locale per leggere artists.json.");
      return [];
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

    console.warn("[artists.js] Nessun artists.json valido trovato.");
    return [];
  }

  function renderArtistCard(artist) {
    const safeId = escapeHTML(artist.id);
    const safeName = escapeHTML(artist.name);
    const safeCover = escapeHTML(artist.cover);
    const typeLabel = artist.type === "guest" ? "Ospite" : "Resident";
    const roleTag = artist.role ? `<span class="artista-role-tag">${escapeHTML(artist.role)}</span>` : "";

    return `
      <article class="artist-card" data-artist-id="${safeId}" tabindex="0" role="button" aria-label="Apri scheda di ${safeName}">
        ${
          safeCover
            ? `<img class="artist-cover-img" src="${safeCover}" alt="${safeName}" onerror="this.style.display='none';">`
            : ""
        }
        <div class="artista-info">
          <span class="artista-name">${safeName}</span>
          <span class="artista-role-tag">${escapeHTML(typeLabel)}</span>
          ${roleTag}
        </div>
      </article>
    `;
  }

  function renderHomeGalleries(dom) {
    if (dom.sectionHome) {
      dom.sectionHome.style.opacity = "1";
    }

    const residents = state.artists.filter((a) => a.type === "resident");
    const guests = state.artists.filter((a) => a.type === "guest");

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
        : state.artists.filter((a) => a.type === state.allFilter);

    dom.allGallery.innerHTML = filtered.length
      ? filtered.map(renderArtistCard).join("")
      : `<p class="empty-state">Nessuna artista trovata per questo filtro.</p>`;
  }

  function openArtistModal(artistId, dom) {
    const artist = state.artists.find((a) => a.id === artistId);
    if (!artist || !dom.modalsContainer) return;

    state.activeArtistId = artist.id;

    const modalGalleryItems = artist.gallery.length
      ? artist.gallery
      : artist.cover
        ? [artist.cover]
        : [];

    const galleryHTML = modalGalleryItems.length
      ? `<div class="artist-modal-gallery">${modalGalleryItems
          .map((src) => `<img src="${escapeHTML(src)}" alt="${escapeHTML(artist.name)}">`)
          .join("")}</div>`
      : "";

    const bioHTML = [
      artist.bioShort ? `<p class="artist-modal-lead"><strong>${escapeHTML(artist.bioShort)}</strong></p>` : "",
      artist.bioLong ? `<p>${escapeHTML(artist.bioLong)}</p>` : ""
    ]
      .filter(Boolean)
      .join("") || `<p>Biografia in aggiornamento.</p>`;

    const igHTML = artist.instagram
      ? `<p class="artist-modal-social"><a href="${escapeHTML(artist.instagram)}" target="_blank" rel="noopener noreferrer">Instagram →</a></p>`
      : "";

    dom.modalsContainer.innerHTML = `
      <div class="artist-modal" role="dialog" aria-modal="true" aria-labelledby="artist-modal-title">
        <div class="artist-modal-content">
          <button type="button" class="close-button" data-action="close-artist-modal" aria-label="Chiudi scheda">&times;</button>
          <div class="artist-header">
            <h3 id="artist-modal-title">${escapeHTML(artist.name)}</h3>
            <span class="artista-role-tag">${artist.type === "guest" ? "Ospite" : "Resident"}</span>
            ${artist.role ? `<span class="artista-role-tag">${escapeHTML(artist.role)}</span>` : ""}
          </div>
          <div class="artist-modal-layout">
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