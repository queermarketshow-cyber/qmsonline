(() => {
  "use strict";

  // 1. Configurazione sorgente dati
  // Puoi puntare a un file JSON locale ("./events.json") o a un endpoint API ("https://tuodominio.it/api/events")
  const CONFIG = {
    sourceUrl: "./events.json",
    fetchOptions: {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    },
    timeoutMs: 8000
  };

  // 2. Riferimenti DOM
  const dom = {
    featuredContent: document.getElementById("featured-event-content"),
    filters: document.getElementById("calendar-filters"),
    prevMonthBtn: document.getElementById("prev-month"),
    monthContainer: document.getElementById("future-month-container"),
    nextMonthBtn: document.getElementById("next-month"),
    mobileWrapper: document.getElementById("mobile-calendar-wrapper"),
    mobileDots: document.getElementById("mobile-dots"),
    mobilePrevBtn: document.getElementById("mobile-prev"),
    mobileCarousel: document.getElementById("mobile-calendar-carousel"),
    mobileNextBtn: document.getElementById("mobile-next"),
    pastEvents: document.getElementById("past-events")
  };

  // 3. Stato applicativo
  const state = {
    events: [],
    selectedCategory: "Tutti",
    activeMonthIndex: 0,
    mobileSlideIndex: 0,
    isLoading: false,
    error: null,
    listenersBound: false
  };

  // --- Utility date e stringhe ---
  function parseLocalDate(dateStr) {
    if (typeof dateStr !== "string" || !dateStr.trim()) return null;
    const clean = dateStr.trim().split("T")[0];
    const parts = clean.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function formatDateIT(dateStr) {
    const date = parseLocalDate(dateStr);
    if (!date) return dateStr || "";
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatMonthYearIT(dateObj) {
    return new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric"
    }).format(dateObj);
  }

  function getMonthKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  }

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

  // --- Normalizzazione e caricamento asincrono ---
  function normalizeEventsPayload(payload) {
    // Supporta sia un array diretto [...] sia oggetti wrapper comuni ({ events: [...] } o { data: [...] })
    const rawList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : null;

    if (!rawList) {
      throw new Error("Formato JSON non valido: atteso un array di eventi.");
    }

    return rawList
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const parsedDate = parseLocalDate(item.date);
        if (!parsedDate || !item.title) return null;

        return {
          id: String(item.id ?? `evt-${index + 1}`),
          title: String(item.title).trim(),
          date: String(item.date).trim(),
          time: item.time ? String(item.time).trim() : "",
          category: item.category ? String(item.category).trim() : "Generale",
          location: item.location ? String(item.location).trim() : "",
          description: item.description ? String(item.description).trim() : "",
          image: sanitizeUrl(item.image),
          url: sanitizeUrl(item.url),
          _dateObj: parsedDate
        };
      })
      .filter(Boolean);
  }

  async function fetchEvents(url = CONFIG.sourceUrl, timeoutMs = CONFIG.timeoutMs) {
    const controller = new AbortController();
    const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...CONFIG.fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status} durante il caricamento degli eventi.`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json") && !url.endsWith(".json")) {
        // Prova comunque a leggere come JSON ma segnala risposte malformate
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error("La risposta del server non è in formato JSON valido.");
        }
      }

      return await response.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Il caricamento degli eventi ha superato il tempo massimo consentito.");
      }
      if (err instanceof TypeError) {
        throw new Error("Impossibile raggiungere la sorgente eventi. Verifica la connessione o il percorso del file.");
      }
      throw err;
    } finally {
      window.clearTimeout(timerId);
    }
  }

  // --- Suddivisione Futuri / Passati ---
  function splitEvents(events) {
    const today = startOfToday();
    const upcoming = [];
    const past = [];

    events.forEach((evt) => {
      const evtDate = evt._dateObj || parseLocalDate(evt.date);
      if (!evtDate) return;

      const normalized = { ...evt, _dateObj: evtDate };
      if (evtDate >= today) {
        upcoming.push(normalized);
      } else {
        past.push(normalized);
      }
    });

    upcoming.sort((a, b) => a._dateObj - b._dateObj);
    past.sort((a, b) => b._dateObj - a._dateObj);

    return { upcoming, past };
  }

  // --- Stati Loading ed Errore ---
  function renderLoadingState() {
    const loadingMarkup = `<p class="loading-state" role="status">Caricamento eventi in corso...</p>`;
    if (dom.featuredContent) dom.featuredContent.innerHTML = loadingMarkup;
    if (dom.filters) dom.filters.innerHTML = "";
    if (dom.monthContainer) dom.monthContainer.innerHTML = loadingMarkup;
    if (dom.mobileCarousel) dom.mobileCarousel.innerHTML = loadingMarkup;
    if (dom.mobileDots) dom.mobileDots.innerHTML = "";
    if (dom.pastEvents) dom.pastEvents.innerHTML = loadingMarkup;

    [dom.prevMonthBtn, dom.nextMonthBtn, dom.mobilePrevBtn, dom.mobileNextBtn].forEach((btn) => {
      if (btn) btn.disabled = true;
    });
  }

  function renderErrorState(message) {
    const safeMsg = escapeHTML(message);
    const errorMarkup = `
      <div class="error-state" role="alert">
        <p>${safeMsg}</p>
        <button type="button" class="retry-events-btn" data-action="retry-events">Riprova</button>
      </div>
    `;

    if (dom.featuredContent) dom.featuredContent.innerHTML = errorMarkup;
    if (dom.filters) dom.filters.innerHTML = "";
    if (dom.monthContainer) {
      dom.monthContainer.innerHTML = `<p class="empty-state">Calendario non disponibile al momento.</p>`;
    }
    if (dom.mobileCarousel) {
      dom.mobileCarousel.innerHTML = `<p class="empty-state">Calendario non disponibile al momento.</p>`;
    }
    if (dom.mobileDots) dom.mobileDots.innerHTML = "";
    if (dom.pastEvents) {
      dom.pastEvents.innerHTML = `<p class="empty-state">Archivio non disponibile al momento.</p>`;
    }

    [dom.prevMonthBtn, dom.nextMonthBtn, dom.mobilePrevBtn, dom.mobileNextBtn].forEach((btn) => {
      if (btn) btn.disabled = true;
    });
  }

  // --- 1. Prossimo Evento (#featured-event-content) ---
  function renderFeaturedEvent(upcomingEvents) {
    if (!dom.featuredContent) return;

    const nextEvent = upcomingEvents[0];
    if (!nextEvent) {
      dom.featuredContent.innerHTML = `<p class="empty-state">Nessun prossimo evento in programma al momento.</p>`;
      return;
    }

    dom.featuredContent.innerHTML = `
      <article class="featured-event-card" data-event-id="${escapeHTML(nextEvent.id)}">
        ${nextEvent.image ? `<img class="featured-event-image" src="${escapeHTML(nextEvent.image)}" alt="${escapeHTML(nextEvent.title)}" loading="lazy">` : ""}
        <div class="featured-event-body">
          <span class="event-category">${escapeHTML(nextEvent.category)}</span>
          <time class="event-date" datetime="${escapeHTML(nextEvent.date)}">
            ${escapeHTML(formatDateIT(nextEvent.date))}${nextEvent.time ? ` · ${escapeHTML(nextEvent.time)}` : ""}
          </time>
          <h3 class="event-title">${escapeHTML(nextEvent.title)}</h3>
          ${nextEvent.location ? `<p class="event-location">${escapeHTML(nextEvent.location)}</p>` : ""}
          ${nextEvent.description ? `<p class="event-description">${escapeHTML(nextEvent.description)}</p>` : ""}
          ${nextEvent.url ? `<a class="event-link" href="${escapeHTML(nextEvent.url)}">Dettagli</a>` : ""}
        </div>
      </article>
    `;
  }

  // --- 2. Filtri (#calendar-filters) ---
  function getFilteredUpcoming(upcomingEvents) {
    if (state.selectedCategory === "Tutti") return upcomingEvents;
    return upcomingEvents.filter((evt) => evt.category === state.selectedCategory);
  }

  function renderFilters(upcomingEvents) {
    if (!dom.filters) return;

    const categories = ["Tutti", ...new Set(upcomingEvents.map((e) => e.category).filter(Boolean))];
    if (!categories.includes(state.selectedCategory)) {
      state.selectedCategory = "Tutti";
    }

    dom.filters.innerHTML = categories
      .map((cat) => {
        const isActive = cat === state.selectedCategory;
        return `
          <button
            type="button"
            class="filter-btn ${isActive ? "is-active" : ""}"
            data-category="${escapeHTML(cat)}"
            aria-pressed="${isActive}"
          >
            ${escapeHTML(cat)}
          </button>
        `;
      })
      .join("");
  }

  // --- Raggruppamento per mese ---
  function groupEventsByMonth(events) {
    const map = new Map();

    events.forEach((evt) => {
      const key = getMonthKey(evt._dateObj);
      if (!map.has(key)) {
        map.set(key, {
          key,
          monthDate: new Date(evt._dateObj.getFullYear(), evt._dateObj.getMonth(), 1),
          events: []
        });
      }
      map.get(key).events.push(evt);
    });

    return Array.from(map.values());
  }

  function renderEventItemHTML(evt) {
    return `
      <article class="calendar-event-item" data-event-id="${escapeHTML(evt.id)}">
        <div class="calendar-event-meta">
          <time datetime="${escapeHTML(evt.date)}">${escapeHTML(formatDateIT(evt.date))}</time>
          ${evt.time ? `<span>${escapeHTML(evt.time)}</span>` : ""}
          <span class="event-category">${escapeHTML(evt.category)}</span>
        </div>
        <h4 class="event-title">${escapeHTML(evt.title)}</h4>
        ${evt.location ? `<p class="event-location">${escapeHTML(evt.location)}</p>` : ""}
        ${evt.description ? `<p class="event-description">${escapeHTML(evt.description)}</p>` : ""}
      </article>
    `;
  }

  // --- 3. Calendario Desktop (#future-month-container, #prev-month, #next-month) ---
  function renderDesktopCalendar(monthGroups) {
    if (!dom.monthContainer) return;

    if (!monthGroups.length) {
      dom.monthContainer.innerHTML = `<p class="empty-state">Nessun evento futuro per il filtro selezionato.</p>`;
      if (dom.prevMonthBtn) dom.prevMonthBtn.disabled = true;
      if (dom.nextMonthBtn) dom.nextMonthBtn.disabled = true;
      return;
    }

    state.activeMonthIndex = Math.max(0, Math.min(state.activeMonthIndex, monthGroups.length - 1));
    const currentGroup = monthGroups[state.activeMonthIndex];

    dom.monthContainer.innerHTML = `
      <div class="month-block" data-month="${escapeHTML(currentGroup.key)}">
        <h3 class="month-title">${escapeHTML(formatMonthYearIT(currentGroup.monthDate))}</h3>
        <div class="month-events-list">
          ${currentGroup.events.map(renderEventItemHTML).join("")}
        </div>
      </div>
    `;

    if (dom.prevMonthBtn) dom.prevMonthBtn.disabled = state.activeMonthIndex === 0;
    if (dom.nextMonthBtn) dom.nextMonthBtn.disabled = state.activeMonthIndex === monthGroups.length - 1;
  }

  // --- 4. Carosello Mobile (#mobile-calendar-carousel, #mobile-dots, #mobile-prev, #mobile-next) ---
  function renderMobileCarousel(monthGroups) {
    if (!dom.mobileCarousel) return;

    if (!monthGroups.length) {
      dom.mobileCarousel.innerHTML = `<p class="empty-state">Nessun evento futuro disponibile.</p>`;
      if (dom.mobileDots) dom.mobileDots.innerHTML = "";
      if (dom.mobilePrevBtn) dom.mobilePrevBtn.disabled = true;
      if (dom.mobileNextBtn) dom.mobileNextBtn.disabled = true;
      return;
    }

    state.mobileSlideIndex = Math.max(0, Math.min(state.mobileSlideIndex, monthGroups.length - 1));
    const activeSlide = monthGroups[state.mobileSlideIndex];

    dom.mobileCarousel.innerHTML = `
      <div class="mobile-slide" data-month="${escapeHTML(activeSlide.key)}">
        <h3 class="month-title">${escapeHTML(formatMonthYearIT(activeSlide.monthDate))}</h3>
        <div class="month-events-list">
          ${activeSlide.events.map(renderEventItemHTML).join("")}
        </div>
      </div>
    `;

    if (dom.mobileDots) {
      dom.mobileDots.innerHTML = monthGroups
        .map((group, idx) => {
          const active = idx === state.mobileSlideIndex;
          return `
            <button
              type="button"
              class="mobile-dot ${active ? "is-active" : ""}"
              data-slide-index="${idx}"
              aria-label="Vai a ${escapeHTML(formatMonthYearIT(group.monthDate))}"
              aria-current="${active ? "true" : "false"}"
            ></button>
          `;
        })
        .join("");
    }

    if (dom.mobilePrevBtn) dom.mobilePrevBtn.disabled = state.mobileSlideIndex === 0;
    if (dom.mobileNextBtn) dom.mobileNextBtn.disabled = state.mobileSlideIndex === monthGroups.length - 1;
  }

  // --- 5. Archivio Eventi (#past-events) ---
  function renderArchive(pastEvents) {
    if (!dom.pastEvents) return;

    if (!pastEvents.length) {
      dom.pastEvents.innerHTML = `<p class="empty-state">Nessun evento nell'archivio.</p>`;
      return;
    }

    dom.pastEvents.innerHTML = pastEvents
      .map(
        (evt) => `
        <article class="archive-event-card" data-event-id="${escapeHTML(evt.id)}">
          <div class="archive-event-meta">
            <time datetime="${escapeHTML(evt.date)}">${escapeHTML(formatDateIT(evt.date))}</time>
            <span class="event-category">${escapeHTML(evt.category)}</span>
          </div>
          <h3 class="event-title">${escapeHTML(evt.title)}</h3>
          ${evt.location ? `<p class="event-location">${escapeHTML(evt.location)}</p>` : ""}
          ${evt.description ? `<p class="event-description">${escapeHTML(evt.description)}</p>` : ""}
        </article>
      `
      )
      .join("");
  }

  // --- Eventi UI e Rendering principale ---
  function getCurrentGroups() {
    const { upcoming } = splitEvents(state.events);
    return groupEventsByMonth(getFilteredUpcoming(upcoming));
  }

  function refreshCalendarViews(upcoming) {
    renderFilters(upcoming);
    const groups = groupEventsByMonth(getFilteredUpcoming(upcoming));
    renderDesktopCalendar(groups);
    renderMobileCarousel(groups);
  }

  function renderAll(eventsData) {
    const { upcoming, past } = splitEvents(eventsData);
    renderFeaturedEvent(upcoming);
    refreshCalendarViews(upcoming);
    renderArchive(past);
  }

  function bindEventsOnce() {
    if (state.listenersBound) return;
    state.listenersBound = true;

    // Delegazione per pulsante "Riprova" in caso di errore di rete/JSON
    document.addEventListener("click", (e) => {
      const retryBtn = e.target.closest('[data-action="retry-events"]');
      if (retryBtn) {
        loadAndRenderEvents();
      }
    });

    if (dom.filters) {
      dom.filters.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn[data-category]");
        if (!btn) return;
        state.selectedCategory = btn.dataset.category;
        state.activeMonthIndex = 0;
        state.mobileSlideIndex = 0;
        const { upcoming } = splitEvents(state.events);
        refreshCalendarViews(upcoming);
      });
    }

    if (dom.prevMonthBtn) {
      dom.prevMonthBtn.addEventListener("click", () => {
        if (state.activeMonthIndex > 0) {
          state.activeMonthIndex -= 1;
          renderDesktopCalendar(getCurrentGroups());
        }
      });
    }

    if (dom.nextMonthBtn) {
      dom.nextMonthBtn.addEventListener("click", () => {
        const groups = getCurrentGroups();
        if (state.activeMonthIndex < groups.length - 1) {
          state.activeMonthIndex += 1;
          renderDesktopCalendar(groups);
        }
      });
    }

    if (dom.mobilePrevBtn) {
      dom.mobilePrevBtn.addEventListener("click", () => {
        if (state.mobileSlideIndex > 0) {
          state.mobileSlideIndex -= 1;
          renderMobileCarousel(getCurrentGroups());
        }
      });
    }

    if (dom.mobileNextBtn) {
      dom.mobileNextBtn.addEventListener("click", () => {
        const groups = getCurrentGroups();
        if (state.mobileSlideIndex < groups.length - 1) {
          state.mobileSlideIndex += 1;
          renderMobileCarousel(groups);
        }
      });
    }

    if (dom.mobileDots) {
      dom.mobileDots.addEventListener("click", (e) => {
        const dot = e.target.closest(".mobile-dot[data-slide-index]");
        if (!dot) return;
        state.mobileSlideIndex = Number(dot.dataset.slideIndex);
        renderMobileCarousel(getCurrentGroups());
      });
    }
  }

  async function loadAndRenderEvents() {
    if (state.isLoading) return;
    state.isLoading = true;
    state.error = null;
    renderLoadingState();

    try {
      const rawPayload = await fetchEvents(CONFIG.sourceUrl, CONFIG.timeoutMs);
      state.events = normalizeEventsPayload(rawPayload);
      renderAll(state.events);
    } catch (err) {
      state.error = err.message || "Errore imprevisto durante il caricamento degli eventi.";
      renderErrorState(state.error);
    } finally {
      state.isLoading = false;
    }
  }

  function init() {
    bindEventsOnce();
    loadAndRenderEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();