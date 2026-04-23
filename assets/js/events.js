/* ============================================================
   CONFIGURAZIONE BASE & CACHING
============================================================ */

let events = [];
let currentMonth;
let currentYear;
const dataCache = {}; // Prevents duplicate fetches

const now = new Date();
const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayYear = todayDate.getFullYear();
const todayMonth = todayDate.getMonth();

let activeCategory = "all";

// Centralized Fetch to prevent duplicate network requests
async function fetchJSON(url) {
  if (dataCache[url]) return dataCache[url];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    dataCache[url] = await res.json();
    return dataCache[url];
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

/* ============================================================
   UTILITY DATE
============================================================ */

function parseDateString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const normalized = `${y}-${mm}-${dd}`;

  return {
    dateObj,
    dateStr: normalized,
    dateReadable: dateObj.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  };
}

/* ============================================================
   ESPANSIONE EVENTI
============================================================ */

function expandEvent(ev) {
  const occurrences = [];

  if (ev.start) {
    const base = parseDateString(ev.start);
    occurrences.push({ ...ev, ...base });
  }

  if (Array.isArray(ev.specificDates)) {
    ev.specificDates.forEach(ds => {
      const spec = parseDateString(ds);
      if (!occurrences.some(o => o.dateStr === spec.dateStr)) {
        occurrences.push({ ...ev, ...spec });
      }
    });
  }

  if (Array.isArray(ev.recurringWeekdays) && ev.recurringWeekdays.length > 0 && ev.start && ev.end) {
    const startInfo = parseDateString(ev.start);
    const endInfo = parseDateString(ev.end);

    let cursor = new Date(startInfo.dateObj.getTime());
    const endDate = endInfo.dateObj;

    // Safety check for recurrence loop
    let safetyCounter = 0;
    while (cursor <= endDate && safetyCounter < 1000) {
      const jsDay = cursor.getDay();
      const ourDay = (jsDay + 6) % 7;

      if (ev.recurringWeekdays.includes(ourDay)) {
        const y = cursor.getFullYear();
        const m = cursor.getMonth() + 1;
        const d = cursor.getDate();
        const mm = String(m).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        const ds = `${y}-${mm}-${dd}`;

        if (!occurrences.some(o => o.dateStr === ds)) {
          const info = parseDateString(ds);
          occurrences.push({ ...ev, ...info });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
      safetyCounter++;
    }
  }

  return occurrences;
}

/* ============================================================
   CARICAMENTO INIZIALE
============================================================ */

async function initApp() {
  const data = await fetchJSON("events.json");
  if (!data) return;

  const expanded = [];
  data.forEach(ev => expanded.push(...expandEvent(ev)));

  events = expanded.sort((a, b) => a.dateObj - b.dateObj);

  const first = findFirstFutureMonthWithEvents();
  currentMonth = first.month;
  currentYear = first.year;

  initFilters();
  initControls();
  renderAll();
}

// Start the app
initApp();

/* ============================================================
   LOGICA DI RICERCA (SAFE FROM INFINITE LOOPS)
============================================================ */

function monthHasEvents(month, year) {
  return events.some(ev =>
    ev.dateObj.getFullYear() === year &&
    ev.dateObj.getMonth() === month &&
    (activeCategory === "all" || ev.categories.includes(activeCategory))
  );
}

function findFirstFutureMonthWithEvents() {
  let m = todayMonth;
  let y = todayYear;
  
  if (events.length === 0) return { month: m, year: y };

  let iterations = 0;
  const maxSearch = 24; // Stop after 2 years if no events found

  while (!monthHasEvents(m, y) && iterations < maxSearch) {
    m++;
    if (m > 11) { m = 0; y++; }
    iterations++;
  }

  return { month: m, year: y };
}

/* ============================================================
   NAVIGAZIONE MESI (FIXED LOOPS)
============================================================ */

const calPrevBtn = document.getElementById("prev-month");
const calNextBtn = document.getElementById("next-month");

if (calPrevBtn) {
  calPrevBtn.addEventListener("click", () => {
    let m = currentMonth;
    let y = currentYear;
    let iterations = 0;

    do {
      m--;
      if (m < 0) { m = 11; y--; }
      iterations++;
      if (iterations > 24) return; // Safety break
    } while (!monthHasEvents(m, y));

    currentMonth = m;
    currentYear = y;
    renderAll();
  });
}

if (calNextBtn) {
  calNextBtn.addEventListener("click", () => {
    let m = currentMonth;
    let y = currentYear;
    let iterations = 0;

    do {
      m++;
      if (m > 11) { m = 0; y++; }
      iterations++;
      if (iterations > 24) return; // Safety break
    } while (!monthHasEvents(m, y));

    currentMonth = m;
    currentYear = y;
    renderAll();
  });
}

/* ============================================================
   RENDER ALL & UI LOGIC
============================================================ */

function renderAll() {
  const pastBtn = document.getElementById("show-past");
  const showingPast = pastBtn && pastBtn.classList.contains("active");

  if (!showingPast) {
    renderCalendar(currentMonth, currentYear);
    renderMobileCalendarCarousel();
    renderFutureList();
  }

  renderPastEvents();
  linkCalendarToTimeline();
}

// ... [Rest of your UI functions: renderCalendar, buildYearMonthSelector, 
// renderMobileCalendarCarousel, initMobileSwipe, renderFutureList, 
// renderPastEvents, linkCalendarToTimeline, openEventModal, etc. 
// remain as provided in your original file] ...

/* ============================================================
   FILTRI (UPDATED TO USE DATA)
============================================================ */

function initFilters() {
  const container = document.getElementById("calendar-filters");
  if (!container || events.length === 0) return;

  const allCats = new Set();
  events.forEach(ev => ev.categories.forEach(c => allCats.add(c)));

  container.innerHTML = `
    <button data-cat="all" class="active">Tutti</button>
    ${[...allCats].map(c => `<button data-cat="${c}">${c}</button>`).join("")}
  `;

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.cat;
      renderAll();
    });
  });
}

function initControls() {
  const futureBtn = document.getElementById("show-future");
  const pastBtn = document.getElementById("show-past");
  const pastContainer = document.getElementById("past-events");

  if (!futureBtn || !pastBtn || !pastContainer) return;

  futureBtn.addEventListener("click", () => {
    futureBtn.classList.add("active");
    pastBtn.classList.remove("active");
    pastContainer.style.display = "none";
    renderAll();
  });

  pastBtn.addEventListener("click", () => {
    pastBtn.classList.add("active");
    futureBtn.classList.remove("active");
    pastContainer.style.display = "flex";
    renderAll();
  });
}
