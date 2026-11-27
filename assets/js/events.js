(() => {
  "use strict";

  const CONFIG = {
    candidateUrls: [
      "./events.json",
      "events.json",
      "/events.json",
      "../events.json",
      "./data/events.json",
      "/data/events.json",
      "./event.json",
      "event.json",
      "/event.json",
      "../event.json",
      "./data/event.json"
    ],
    fetchOptions: {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*"
      },
      cache: "no-store"
    },
    timeoutMs: 8000,
    recurringHorizonDays: 180
  };

  const dom = {
    featuredContent: document.getElementById("featured-event-content"),
    featuredHome: document.getElementById("featured-event-home"),
    calendarSection: document.getElementById("calendario"),
    filters: document.getElementById("calendar-filters"),
    prevMonthBtn: document.getElementById("prev-month"),
    monthContainer: document.getElementById("future-month-container"),
    nextMonthBtn: document.getElementById("next-month"),
    mobileWrapper: document.getElementById("mobile-calendar-wrapper"),
    mobileDots: document.getElementById("mobile-dots"),
    mobilePrevBtn: document.getElementById("mobile-prev"),
    mobileCarousel: document.getElementById("mobile-calendar-carousel"),
    mobileNextBtn: document.getElementById("mobile-next"),
    pastEvents: document.getElementById("past-events"),
    archiveFilters: null
  };

  const state = {
    events: [],
    selectedCategory: "Tutti",
    activeMonthIndex: 0,
    mobileSlideIndex: 0,
    archiveFilters: {
      years: new Set(),
      months: new Set(),
      categories: new Set()
    },
    isLoading: false,
    error: null,
    listenersBound: false
  };

  function ensureArchiveFilterContainer() {
    if (!dom.pastEvents) return null;
    if (dom.archiveFilters && dom.archiveFilters.isConnected) {
      return dom.archiveFilters;
    }

    const existing = document.getElementById("archive-filters");
    if (existing) {
      dom.archiveFilters = existing;
      return existing;
    }

    const container = document.createElement("div");
    container.id = "archive-filters";
    container.className = "archive-filters";
    container.setAttribute("aria-label", "Filtri archivio eventi");
    dom.pastEvents.parentNode.insertBefore(container, dom.pastEvents);
    dom.archiveFilters = container;
    return container;
  }

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

  function toISODateLocal(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function addDays(dateObj, days) {
    return new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate() + days
    );
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

  function formatDateRangeIT(startStr, endStr) {
    const startFormatted = formatDateIT(startStr);
    if (!endStr || endStr === startStr) return startFormatted;
    return `${startFormatted} – ${formatDateIT(endStr)}`;
  }

  function formatMonthYearIT(dateObj) {
    return new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric"
    }).format(dateObj);
  }

  function formatMonthNameIT(monthNumber) {
    const sampleDate = new Date(2026, monthNumber - 1, 1);
    return new Intl.DateTimeFormat("it-IT", {
      month: "long"
    }).format(sampleDate);
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

  function normalizeWeekdays(rawWeekdays) {
    if (!Array.isArray(rawWeekdays)) return [];
    const dayMap = {
      sun: 0, sunday: 0, dom: 0, domenica: 0,
      mon: 1, monday: 1, lun: 1, lunedì: 1, lunedi: 1,
      tue: 2, tuesday: 2, mar: 2, martedì: 2, martedi: 2,
      wed: 3, wednesday: 3, mer: 3, mercoledì: 3, mercoledi: 3,
      thu: 4, thursday: 4, gio: 4, giovedì: 4, giovedi: 4,
      fri: 5, friday: 5, ven: 5, venerdì: 5, venerdi: 5,
      sat: 6, saturday: 6, sab: 6, sabato: 6
    };

    return rawWeekdays
      .map((val) => {
        if (typeof val === "number" && val >= 0 && val <= 6) return val;
        if (typeof val === "string") {
          const clean = val.trim().toLowerCase();
          if (/^[0-6]$/.test(clean)) return Number(clean);
          if (clean in dayMap) return dayMap[clean];
        }
        return null;
      })
      .filter((v) => v !== null);
  }

  function normalizeCategories(item) {
    if (Array.isArray(item.categories)) {
      const cleaned = item.categories
        .map((c) => String(c || "").trim())
        .filter(Boolean);
      if (cleaned.length) return [...new Set(cleaned)];
    }
    if (typeof item.category === "string" && item.category.trim()) {
      return [item.category.trim()];
    }
    return ["Generale"];
  }

  function extractRawList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.events)) return payload.events;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload && typeof payload === "object" && (payload.start || payload.date) && payload.title) {
      return [payload];
    }
    return null;
  }

  function normalizeEventsPayload(payload) {
    const rawList = extractRawList(payload);
    if (!rawList) {
      throw new Error("Struttura JSON non riconosciuta: serve un array di eventi o un oggetto con 'start' e 'title'.");
    }

    const parsed = rawList
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const startDateObj = parseLocalDate(item.start ?? item.date);
        if (!startDateObj || !item.title) return null;

        const endDateObj = parseLocalDate(item.end) || startDateObj;
        const safeEndDateObj = endDateObj < startDateObj ? startDateObj : endDateObj;

        const specificDates = Array.isArray(item.specificDates)
          ? item.specificDates
              .map((d) => parseLocalDate(d))
              .filter(Boolean)
              .map((d) => toISODateLocal(d))
          : [];

        return {
          id: String(item.id ?? `evt-${index + 1}`),
          title: String(item.title).trim(),
          start: toISODateLocal(startDateObj),
          end: toISODateLocal(safeEndDateObj),
          time: item.time ? String(item.time).trim() : "",
          description: item.description ? String(item.description).trim() : "",
          location: item.location ? String(item.location).trim() : "",
          venueUrl: sanitizeUrl(item.venueUrl),
          image: sanitizeUrl(item.image),
          ticketUrl: sanitizeUrl(item.ticketUrl),
          freeEntry: Boolean(item.freeEntry),
          recurringWeekdays: normalizeWeekdays(item.recurringWeekdays),
          specificDates,
          categories: normalizeCategories(item),
          _startObj: startDateObj,
          _endObj: safeEndDateObj
        };
      })
      .filter(Boolean);

    if (rawList.length > 0 && parsed.length === 0) {
      throw new Error("Eventi trovati nel JSON, ma nessuno ha 'title' e una data 'start' valida (YYYY-MM-DD).");
    }

    return parsed;
  }

  function resolveCandidateUrl(candidate) {
    return new URL(candidate, window.location.href).href;
  }

  async function fetchSingleUrl(url, timeoutMs) {
    const resolvedUrl = resolveCandidateUrl(url);
    const controller = new AbortController();
    const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(resolvedUrl, {
        ...CONFIG.fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        const err = new Error(`HTTP ${response.status} su ${resolvedUrl}`);
        err.status = response.status;
        throw err;
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`JSON non valido in ${resolvedUrl}: ${parseErr.message}`);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`Timeout durante il caricamento di ${resolvedUrl}`);
      }
      throw err;
    } finally {
      window.clearTimeout(timerId);
    }
  }

  async function fetchEventsFromCandidates() {
    if (window.location.protocol === "file:") {
      throw new Error(
        "Stai aprendo la pagina tramite file://. Avvia un server locale (es. Live Server o 'python -m http.server') per permettere a fetch() di leggere events.json."
      );
    }

    const tried = [];
    let lastError = null;

    for (const url of CONFIG.candidateUrls) {
      const resolvedUrl = resolveCandidateUrl(url);
      tried.push(resolvedUrl);
      try {
        const data = await fetchSingleUrl(url, CONFIG.timeoutMs);
        console.info("[events.js] Caricato con successo da:", resolvedUrl);
        return data;
      } catch (err) {
        lastError = err;
        if (err.message && err.message.includes("JSON non valido")) {
          throw err;
        }
      }
    }

    throw new Error(
      `File JSON non trovato. URL provati da ${window.location.href}: ${tried.join(", ")} (${lastError ? lastError.message : "errore sconosciuto"})`
    );
  }

  function splitEvents(events) {
    const today = startOfToday();
    const horizonEnd = addDays(today, CONFIG.recurringHorizonDays);
    const upcoming = [];
    const past = [];

    events.forEach((evt) => {
      const hasSpecific = Array.isArray(evt.specificDates) && evt.specificDates.length > 0;
      const hasRecurring = Array.isArray(evt.recurringWeekdays) && evt.recurringWeekdays.length > 0;

      if (hasSpecific) {
        let latestPastDate = null;
        let earliestFutureDate = null;

        evt.specificDates.forEach((iso) => {
          const d = parseLocalDate(iso);
          if (!d) return;
          if (d >= today) {
            if (!earliestFutureDate || d < earliestFutureDate) earliestFutureDate = d;
          } else if (!latestPastDate || d > latestPastDate) {
            latestPastDate = d;
          }
        });

        if (earliestFutureDate) {
          const iso = toISODateLocal(earliestFutureDate);
          upcoming.push({ ...evt, start: iso, end: iso, _dateObj: earliestFutureDate });
        }
        if (latestPastDate) {
          const iso = toISODateLocal(latestPastDate);
          past.push({ ...evt, start: iso, end: iso, _dateObj: latestPastDate });
        }
        return;
      }

      if (hasRecurring) {
        const rangeStart = evt._startObj > today ? evt._startObj : today;
        const rangeEnd =
          evt._endObj > rangeStart && evt._endObj < horizonEnd
            ? evt._endObj
            : horizonEnd;

        let nextOccurrence = null;
        for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
          if (evt.recurringWeekdays.includes(cursor.getDay())) {
            nextOccurrence = new Date(cursor);
            break;
          }
        }

        if (nextOccurrence) {
          const iso = toISODateLocal(nextOccurrence);
          upcoming.push({ ...evt, start: iso, end: iso, _dateObj: nextOccurrence });
        }

        if (evt._startObj < today) {
          const pastEnd = evt._endObj < today ? evt._endObj : addDays(today, -1);
          past.push({ ...evt, _dateObj: pastEnd });
        }
        return;
      }

      if (evt._endObj >= today) {
        upcoming.push({ ...evt, _dateObj: evt._startObj });
      } else {
        past.push({ ...evt, _dateObj: evt._endObj });
      }
    });

    upcoming.sort((a, b) => a._dateObj - b._dateObj);
    past.sort((a, b) => b._dateObj - a._dateObj);

    console.info(
      `[events.js] Totale: ${events.length} | Futuri/Prossimi: ${upcoming.length} | Archivio: ${past.length}`
    );

    return { upcoming, past };
  }

  function getFeaturedContainers() {
    return [dom.featuredContent, dom.featuredHome].filter(Boolean);
  }

  function renderLoadingState() {
    const loadingMarkup = `<p class="loading-state" role="status">Caricamento eventi in corso...</p>`;
    getFeaturedContainers().forEach((el) => {
      el.innerHTML = loadingMarkup;
    });
    if (dom.filters) dom.filters.innerHTML = "";
    if (dom.monthContainer) dom.monthContainer.innerHTML = loadingMarkup;
    if (dom.mobileCarousel) dom.mobileCarousel.innerHTML = loadingMarkup;
    if (dom.mobileDots) dom.mobileDots.innerHTML = "";
    if (dom.archiveFilters) dom.archiveFilters.innerHTML = "";
    if (dom.pastEvents) dom.pastEvents.innerHTML = loadingMarkup;

    [dom.prevMonthBtn, dom.nextMonthBtn, dom.mobilePrevBtn, dom.mobileNextBtn].forEach((btn) => {
      if (btn) btn.disabled = true;
    });
  }

  function renderErrorState(message) {
    console.error("[events.js]", message);
    const safeMsg = escapeHTML(message);
    const errorMarkup = `
      <div class="error-state" role="alert">
        <p>${safeMsg}</p>
        <button type="button" class="retry-events-btn" data-action="retry-events">Riprova</button>
      </div>
    `;

    getFeaturedContainers().forEach((el) => {
      el.innerHTML = errorMarkup;
    });
    if (dom.filters) dom.filters.innerHTML = "";
    if (dom.monthContainer) {
      dom.monthContainer.innerHTML = `<p class="empty-state">Calendario non disponibile al momento.</p>`;
    }
    if (dom.mobileCarousel) {
      dom.mobileCarousel.innerHTML = `<p class="empty-state">Calendario non disponibile al momento.</p>`;
    }
    if (dom.mobileDots) dom.mobileDots.innerHTML = "";
    if (dom.archiveFilters) dom.archiveFilters.innerHTML = "";
    if (dom.pastEvents) {
      dom.pastEvents.innerHTML = `<p class="empty-state">Archivio non disponibile al momento.</p>`;
    }

    [dom.prevMonthBtn, dom.nextMonthBtn, dom.mobilePrevBtn, dom.mobileNextBtn].forEach((btn) => {
      if (btn) btn.disabled = true;
    });
  }

  function renderCategoriesHTML(categories) {
    return categories
      .map((cat) => `<span class="event-category">${escapeHTML(cat)}</span>`)
      .join("");
  }

  function renderLocationHTML(evt) {
    if (!evt.location) return "";
    const text = escapeHTML(evt.location);
    if (evt.venueUrl) {
      return `<p class="event-location"><a href="${escapeHTML(evt.venueUrl)}" target="_blank" rel="noopener noreferrer">${text}</a></p>`;
    }
    return `<p class="event-location">${text}</p>`;
  }

  function renderEntryAndTicketHTML(evt) {
    const parts = [];
    if (evt.freeEntry) {
      parts.push(`<span class="event-free-entry">Ingresso gratuito</span>`);
    }
    if (evt.ticketUrl) {
      parts.push(`<a class="event-ticket-link" href="${escapeHTML(evt.ticketUrl)}" target="_blank" rel="noopener noreferrer">Biglietti / Info</a>`);
    }
    if (!parts.length) return "";
    return `<div class="event-actions">${parts.join("")}</div>`;
  }

  function renderPosterHTML(evt, className) {
    if (!evt.image) return "";
    return `
      <div class="event-poster-media">
        <img class="${escapeHTML(className)}" src="${escapeHTML(evt.image)}" alt="Locandina ${escapeHTML(evt.title)}" loading="lazy">
      </div>
    `;
  }

  function renderFeaturedEvent(upcomingEvents) {
    const containers = getFeaturedContainers();
    if (!containers.length) return;

    if (dom.calendarSection) {
      dom.calendarSection.style.opacity = "1";
    }

    const nextEvent = upcomingEvents[0];
    if (!nextEvent) {
      const emptyMarkup = `<p class="empty-state">Nessun prossimo evento in programma al momento.</p>`;
      containers.forEach((el) => {
        el.innerHTML = emptyMarkup;
      });
      return;
    }

    const dateLabel = formatDateRangeIT(nextEvent.start, nextEvent.end);
    const cardMarkup = `
      <article class="featured-event-card" data-event-id="${escapeHTML(nextEvent.id)}">
        <div class="featured-event-body">
          <div class="event-categories">${renderCategoriesHTML(nextEvent.categories)}</div>
          <time class="event-date" datetime="${escapeHTML(nextEvent.start)}">
            ${escapeHTML(dateLabel)}${nextEvent.time ? ` · ${escapeHTML(nextEvent.time)}` : ""}
          </time>
          <h3 class="event-title">${escapeHTML(nextEvent.title)}</h3>
          ${renderLocationHTML(nextEvent)}
          ${nextEvent.description ? `<p class="event-description">${escapeHTML(nextEvent.description)}</p>` : ""}
          ${renderEntryAndTicketHTML(nextEvent)}
        </div>
        ${renderPosterHTML(nextEvent, "featured-event-image")}
      </article>
    `;

    containers.forEach((el) => {
      el.innerHTML = cardMarkup;
    });
  }

  function getFilteredUpcoming(upcomingEvents) {
    if (state.selectedCategory === "Tutti") return upcomingEvents;
    return upcomingEvents.filter((evt) => evt.categories.includes(state.selectedCategory));
  }

  function renderFilters(upcomingEvents) {
    if (!dom.filters) return;

    const allCats = upcomingEvents.flatMap((e) => e.categories || []).filter(Boolean);
    const categories = ["Tutti", ...new Set(allCats)];

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
    const dateLabel = formatDateRangeIT(evt.start, evt.end);
    return `
      <article class="calendar-event-item" data-event-id="${escapeHTML(evt.id)}">
        <div class="calendar-event-info">
          <div class="calendar-event-meta">
            <time datetime="${escapeHTML(evt.start)}">${escapeHTML(dateLabel)}</time>
            ${evt.time ? `<span class="event-time">${escapeHTML(evt.time)}</span>` : ""}
            <div class="event-categories">${renderCategoriesHTML(evt.categories)}</div>
          </div>
          <h4 class="event-title">${escapeHTML(evt.title)}</h4>
          ${renderLocationHTML(evt)}
          ${evt.description ? `<p class="event-description">${escapeHTML(evt.description)}</p>` : ""}
          ${renderEntryAndTicketHTML(evt)}
        </div>
        ${renderPosterHTML(evt, "calendar-event-image")}
      </article>
    `;
  }

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

  // --- Filtri multipli Archivio (Anno, Mese, Tipologia evento) ---
  function getArchiveOptions(pastEvents) {
    const yearsSet = new Set();
    const monthsSet = new Set();
    const categoriesSet = new Set();

    pastEvents.forEach((evt) => {
      const d = evt._dateObj || parseLocalDate(evt.start);
      if (d) {
        yearsSet.add(String(d.getFullYear()));
        monthsSet.add(String(d.getMonth() + 1).padStart(2, "0"));
      }
      (evt.categories || []).forEach((cat) => {
        if (cat) categoriesSet.add(cat);
      });
    });

    const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    const months = Array.from(monthsSet).sort((a, b) => Number(a) - Number(b));
    const categories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, "it"));

    return { years, months, categories };
  }

  function pruneInvalidArchiveSelections(options) {
    state.archiveFilters.years.forEach((y) => {
      if (!options.years.includes(y)) state.archiveFilters.years.delete(y);
    });
    state.archiveFilters.months.forEach((m) => {
      if (!options.months.includes(m)) state.archiveFilters.months.delete(m);
    });
    state.archiveFilters.categories.forEach((c) => {
      if (!options.categories.includes(c)) state.archiveFilters.categories.delete(c);
    });
  }

  function getFilteredArchive(pastEvents) {
    const { years, months, categories } = state.archiveFilters;

    return pastEvents.filter((evt) => {
      const d = evt._dateObj || parseLocalDate(evt.start);
      const evtYear = d ? String(d.getFullYear()) : "";
      const evtMonth = d ? String(d.getMonth() + 1).padStart(2, "0") : "";
      const evtCats = evt.categories || [];

      if (years.size > 0 && !years.has(evtYear)) return false;
      if (months.size > 0 && !months.has(evtMonth)) return false;
      if (categories.size > 0 && !evtCats.some((c) => categories.has(c))) return false;

      return true;
    });
  }

function renderArchiveFilters(pastEvents) {

  const container = ensureArchiveFilterContainer();

  if (!container) return;

  if (!pastEvents.length) {
    container.innerHTML = "";
    return;
  }

  const options = getArchiveOptions(pastEvents);

  pruneInvalidArchiveSelections(options);

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {

    const selectedYear =
      [...state.archiveFilters.years][0] || "";

    const selectedMonth =
      [...state.archiveFilters.months][0] || "";

    const selectedCategory =
      [...state.archiveFilters.categories][0] || "";

    const hasAnySelection =
      selectedYear ||
      selectedMonth ||
      selectedCategory;

    container.innerHTML = `

      <div class="archive-mobile-filters">

        <select id="archive-year-mobile">

          <option value="">
            Anno
          </option>

          ${options.years.map(year => `
            <option
              value="${escapeHTML(year)}"
              ${selectedYear === year ? "selected" : ""}
            >
              ${escapeHTML(year)}
            </option>
          `).join("")}

        </select>

        <select id="archive-month-mobile">

          <option value="">
            Mese
          </option>

          ${options.months.map(month => `
            <option
              value="${escapeHTML(month)}"
              ${selectedMonth === month ? "selected" : ""}
            >
              ${escapeHTML(
                formatMonthNameIT(Number(month))
              )}
            </option>
          `).join("")}

        </select>

        <select id="archive-category-mobile">

          <option value="">
            Tipo
          </option>

          ${options.categories.map(category => `
            <option
              value="${escapeHTML(category)}"
              ${selectedCategory === category ? "selected" : ""}
            >
              ${escapeHTML(category)}
            </option>
          `).join("")}

        </select>

        ${
          hasAnySelection
            ? `
              <button
                type="button"
                class="archive-filter-reset"
                data-action="reset-archive-filters">
                Azzera filtri
              </button>
            `
            : ""
        }

      </div>

    `;

    requestAnimationFrame(() => {

      const yearSelect =
        document.getElementById(
          "archive-year-mobile"
        );

      const monthSelect =
        document.getElementById(
          "archive-month-mobile"
        );

      const categorySelect =
        document.getElementById(
          "archive-category-mobile"
        );

      yearSelect?.addEventListener(
        "change",
        e => {

          state.archiveFilters.years.clear();

          if (e.target.value) {
            state.archiveFilters.years.add(
              e.target.value
            );
          }

          const { past } =
            splitEvents(state.events);

          renderArchive(past);

        }
      );

      monthSelect?.addEventListener(
        "change",
        e => {

          state.archiveFilters.months.clear();

          if (e.target.value) {
            state.archiveFilters.months.add(
              e.target.value
            );
          }

          const { past } =
            splitEvents(state.events);

          renderArchive(past);

        }
      );

      categorySelect?.addEventListener(
        "change",
        e => {

          state.archiveFilters.categories.clear();

          if (e.target.value) {
            state.archiveFilters.categories.add(
              e.target.value
            );
          }

          const { past } =
            splitEvents(state.events);

          renderArchive(past);

        }
      );

    });

    return;
  }

  const hasAnySelection =
    state.archiveFilters.years.size > 0 ||
    state.archiveFilters.months.size > 0 ||
    state.archiveFilters.categories.size > 0;

  const renderGroupButtons = (
    groupKey,
    items,
    selectedSet,
    formatLabel
  ) => {

    if (!items.length) {
      return `
        <span class="archive-filter-empty">
          Nessuna opzione
        </span>
      `;
    }

    return items
      .map(val => {

        const isSelected =
          selectedSet.has(val);

        return `
          <button
            type="button"
            class="archive-filter-btn ${isSelected ? "is-active active" : ""}"
            data-archive-group="${escapeHTML(groupKey)}"
            data-archive-value="${escapeHTML(val)}"
            aria-pressed="${isSelected}"
          >
            ${escapeHTML(formatLabel(val))}
          </button>
        `;
      })
      .join("");

  };

  container.innerHTML = `

    <div class="archive-filter-groups">

      <div class="archive-filter-group">

        <span class="archive-filter-label">
          Anno
        </span>

        <div class="archive-filter-options">

          ${renderGroupButtons(
            "years",
            options.years,
            state.archiveFilters.years,
            y => y
          )}

        </div>

      </div>

      <div class="archive-filter-group">

        <span class="archive-filter-label">
          Mese
        </span>

        <div class="archive-filter-options">

          ${renderGroupButtons(
            "months",
            options.months,
            state.archiveFilters.months,
            m => formatMonthNameIT(Number(m))
          )}

        </div>

      </div>

      <div class="archive-filter-group">

        <span class="archive-filter-label">
          Tipologia
        </span>

        <div class="archive-filter-options">

          ${renderGroupButtons(
            "categories",
            options.categories,
            state.archiveFilters.categories,
            c => c
          )}

        </div>

      </div>

    </div>

    ${
      hasAnySelection
        ? `
          <button
            type="button"
            class="archive-filter-reset"
            data-action="reset-archive-filters">
            Azzera filtri
          </button>
        `
        : ""
    }

  `;
}
  function renderArchive(pastEvents) {
    renderArchiveFilters(pastEvents);
    if (!dom.pastEvents) return;

    if (!pastEvents.length) {
      dom.pastEvents.innerHTML = `<p class="empty-state">Nessun evento nell'archivio.</p>`;
      return;
    }

    const filteredPast = getFilteredArchive(pastEvents);
    if (!filteredPast.length) {
      dom.pastEvents.innerHTML = `<p class="empty-state">Nessun evento nell'archivio corrisponde ai filtri selezionati.</p>`;
      return;
    }

    dom.pastEvents.innerHTML = filteredPast
      .map((evt) => {
        const dateLabel = formatDateRangeIT(evt.start, evt.end);
        return `
          <article class="archive-event-card" data-event-id="${escapeHTML(evt.id)}">
            <div class="archive-event-meta">
              <time datetime="${escapeHTML(evt.start)}">${escapeHTML(dateLabel)}</time>
              <div class="event-categories">${renderCategoriesHTML(evt.categories)}</div>
            </div>
            <h3 class="event-title">${escapeHTML(evt.title)}</h3>
            ${renderLocationHTML(evt)}
            ${evt.description ? `<p class="event-description">${escapeHTML(evt.description)}</p>` : ""}
          </article>
        `;
      })
      .join("");
  }

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

    document.addEventListener("click", (e) => {
      const retryBtn = e.target.closest('[data-action="retry-events"]');
      if (retryBtn) {
        loadAndRenderEvents();
        return;
      }

      const resetArchiveBtn = e.target.closest('[data-action="reset-archive-filters"]');
      if (resetArchiveBtn) {
        state.archiveFilters.years.clear();
        state.archiveFilters.months.clear();
        state.archiveFilters.categories.clear();
        const { past } = splitEvents(state.events);
        renderArchive(past);
        return;
      }

      const archiveFilterBtn = e.target.closest(".archive-filter-btn[data-archive-group][data-archive-value]");
      if (archiveFilterBtn) {
        const group = archiveFilterBtn.dataset.archiveGroup;
        const value = archiveFilterBtn.dataset.archiveValue;
        const targetSet = state.archiveFilters[group];
        if (targetSet) {
          if (targetSet.has(value)) {
            targetSet.delete(value);
          } else {
            targetSet.add(value);
          }
          const { past } = splitEvents(state.events);
          renderArchive(past);
        }
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
      const rawPayload = await fetchEventsFromCandidates();
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
    ensureArchiveFilterContainer();
    bindEventsOnce();
    loadAndRenderEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();