/* ============================================================
   CONFIGURAZIONE BASE & CACHING
============================================================ */

let events = [];
let currentMonth;
let currentYear;
const dataCache = {}; // Previene fetch duplicati

const now = new Date();
const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayYear = todayDate.getFullYear();
const todayMonth = todayDate.getMonth();

let activeCategory = "all";

// Fetch centralizzata con gestione errori e cache
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

    // Sicurezza: limite massimo di iterazioni per evitare loop infiniti
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

// Avvio applicazione
initApp();

/* ============================================================
   LOGICA DI RICERCA MESE (SAFE)
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
  const maxSearch = 24; // Smette di cercare dopo 2 anni se non trova nulla

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
      if (iterations > 24) return; // Break di sicurezza
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
      if (iterations > 24) return; // Break di sicurezza
    } while (!monthHasEvents(m, y));

    currentMonth = m;
    currentYear = y;
    renderAll();
  });
}

/* ============================================================
   RENDER ALL
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

/* ============================================================
   CALENDARIO DESKTOP + SELETTORE
============================================================ */

function renderCalendar(month, year) {
  const container = document.getElementById("future-month-container");
  if (!container) return;

  container.innerHTML = "";

  const date = new Date(year, month, 1);
  const monthName = date.toLocaleString("it-IT", { month: "long" });

  const monthWrapper = document.createElement("div");
  monthWrapper.className = "calendar-month";
  monthWrapper.style.display = "flex";
  monthWrapper.style.alignItems = "center";
  monthWrapper.style.gap = "8px";
  monthWrapper.style.cursor = "pointer";
  monthWrapper.style.position = "relative";

  const monthText = document.createElement("span");
  monthText.textContent = `${monthName} ${year}`;

  const triangle = document.createElement("span");
  triangle.textContent = "▼";
  triangle.style.fontSize = "1rem";
  triangle.style.transform = "translateY(2px)";
  triangle.className = "month-triangle";

  monthWrapper.appendChild(monthText);
  monthWrapper.appendChild(triangle);
  container.appendChild(monthWrapper);

  buildYearMonthSelector(monthWrapper);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const firstDay = date.getDay() === 0 ? 6 : date.getDay() - 1;
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";

    const fullDate = new Date(year, month, d);
    const iso = [
      fullDate.getFullYear(),
      String(fullDate.getMonth() + 1).padStart(2, "0"),
      String(fullDate.getDate()).padStart(2, "0")
    ].join("-");
    dayEl.dataset.date = iso;

    const num = document.createElement("div");
    num.className = "calendar-day-number";
    num.textContent = d;
    dayEl.appendChild(num);

    const todaysEvents = events.filter(ev =>
      ev.dateStr === iso &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    );

    if (todaysEvents.length > 0) {
      dayEl.classList.add("has-event");
      const mainEv = todaysEvents[0];

      const postit = document.createElement("div");
      postit.className = "event-postit";

      if (mainEv.image) {
        const img = document.createElement("img");
        img.src = mainEv.image;
        postit.appendChild(img);
      }

      postit.addEventListener("click", (e) => {
        e.stopPropagation();
        openEventModal(mainEv);
      });
      dayEl.appendChild(postit);
    }

    grid.appendChild(dayEl);
  }

  container.appendChild(grid);
}

function buildYearMonthSelector(monthWrapper) {
  monthWrapper.querySelectorAll(".month-selector").forEach(el => el.remove());

  const selector = document.createElement("div");
  selector.className = "month-selector";
  selector.style.display = "none";

  selector.addEventListener("click", e => e.stopPropagation());

  const map = new Map();
  events.forEach(ev => {
    const y = ev.dateObj.getFullYear();
    const m = ev.dateObj.getMonth();
    if (!map.has(y)) map.set(y, new Set());
    map.get(y).add(m);
  });

  const years = [...map.keys()].sort((a, b) => b - a);

  const yearSelect = document.createElement("select");
  yearSelect.innerHTML = `<option value="">Anno</option>`;
  years.forEach(y => { yearSelect.innerHTML += `<option value="${y}">${y}</option>`; });

  const monthSelect = document.createElement("select");
  monthSelect.innerHTML = `<option value="">Mese</option>`;
  monthSelect.disabled = true;

  yearSelect.addEventListener("change", () => {
    const y = Number(yearSelect.value);
    monthSelect.disabled = false;
    monthSelect.innerHTML = `<option value="">Mese</option>`;
    if (map.has(y)) {
      [...map.get(y)].sort((a, b) => a - b).forEach(m => {
        const name = new Date(y, m, 1).toLocaleString("it-IT", { month: "long" });
        monthSelect.innerHTML += `<option value="${m}">${name}</option>`;
      });
    }
  });

  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", () => {
    const y = Number(yearSelect.value);
    const m = Number(monthSelect.value);
    if (!y || isNaN(m)) return;
    currentYear = y; currentMonth = m;
    selector.style.display = "none";
    monthWrapper.classList.remove("menu-open");
    renderAll();
  });

  selector.appendChild(yearSelect);
  selector.appendChild(monthSelect);
  selector.appendChild(okBtn);
  monthWrapper.appendChild(selector);

  monthWrapper.addEventListener("click", () => {
    const isOpen = selector.style.display === "flex";
    selector.style.display = isOpen ? "none" : "flex";
    monthWrapper.classList.toggle("menu-open", !isOpen);
  });
}

/* ============================================================
   MOBILE CAROUSEL & SWIPE
============================================================ */

function generateDotsWindow(total, activeIndex) {
  const dotsContainer = document.getElementById("mobile-dots");
  if (!dotsContainer) return;
  dotsContainer.innerHTML = "";

  const windowSize = 15;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, activeIndex - half);
  let end = Math.min(total - 1, activeIndex + half);

  if (activeIndex < half) end = Math.min(total - 1, windowSize - 1);
  if (activeIndex > total - half - 1) start = Math.max(0, total - windowSize);

  for (let i = start; i <= end; i++) {
    const dot = document.createElement("div");
    dot.className = "mobile-dot" + (i === activeIndex ? " active" : "");
    dot.addEventListener("click", () => window.goTo(i));
    dotsContainer.appendChild(dot);
  }
}

function renderMobileCalendarCarousel() {
  const carousel = document.getElementById("mobile-calendar-carousel");
  const dotsContainer = document.getElementById("mobile-dots");
  if (!carousel || !dotsContainer) return;

  carousel.innerHTML = "";
  const timelineEvents = events
    .filter(ev => activeCategory === "all" || ev.categories.includes(activeCategory))
    .sort((a, b) => a.dateObj - b.dateObj);

  if (timelineEvents.length === 0) return;

  const firstFutureIndex = timelineEvents.findIndex(ev => ev.dateObj >= todayDate);
  const startIndex = firstFutureIndex !== -1 ? firstFutureIndex : 0;

  timelineEvents.forEach(ev => {
    const card = document.createElement("div");
    card.className = "mobile-event-card";
    card.innerHTML = `
      ${ev.image ? `<img src="${ev.image}">` : ""}
      <div class="mobile-event-date">${ev.dateReadable}</div>
      <div class="mobile-event-title">${ev.title}</div>
      <div class="mobile-event-info">
        ${ev.time ? `<div class="mobile-event-time">🕒 ${ev.time}</div>` : ""}
        ${ev.location ? `<div class="mobile-event-location">📍 ${ev.location}</div>` : ""}
      </div>
      <div class="mobile-event-tags">
        ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
      </div>
    `;
    carousel.appendChild(card);
  });

  generateDotsWindow(timelineEvents.length, startIndex);
  initMobileSwipe(carousel, dotsContainer, startIndex);
}

function initMobileSwipe(carousel, dotsContainer, startIndex = 0) {
  let index = startIndex;
  const cards = [...carousel.children];
  const total = cards.length;

  window.goTo = function(i, instant = false) {
    index = Math.max(0, Math.min(i, total - 1));
    const target = cards[index];
    if (!target) return;
    carousel.scrollTo({ left: target.offsetLeft, behavior: instant ? "auto" : "smooth" });
    generateDotsWindow(total, index);
  };

  let startX = 0, startY = 0, lastX = 0, lastY = 0, isDragging = false;

  carousel.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse") return;
    startX = e.clientX; startY = e.clientY;
    lastX = e.clientX; lastY = e.clientY;
    isDragging = true;
  });

  carousel.addEventListener("pointermove", e => {
    if (!isDragging) return;
    lastX = e.clientX; lastY = e.clientY;
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    const dx = lastX - startX;
    const dy = lastY - startY;
    if (Math.abs(dx) <= Math.abs(dy) * 1.2 || Math.abs(dx) < 40) return;
    dx < 0 ? window.goTo(index + 1) : window.goTo(index - 1);
  };

  carousel.addEventListener("pointerup", endDrag);
  carousel.addEventListener("pointercancel", endDrag);

  const prev = document.getElementById("mobile-prev");
  const next = document.getElementById("mobile-next");
  if (prev) prev.onclick = () => window.goTo(index - 1);
  if (next) next.onclick = () => window.goTo(index + 1);

  window.goTo(startIndex, true);
}

/* ============================================================
   FILTRI E LISTE
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

function renderFutureList() {
  const container = document.getElementById("future-events-list");
  if (!container) return;
  container.innerHTML = "";

  events
    .filter(ev => ev.dateObj >= todayDate && (activeCategory === "all" || ev.categories.includes(activeCategory)))
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";
      el.dataset.date = ev.dateStr;
      el.innerHTML = `
        <div class="timeline-event-date">${ev.dateReadable}</div>
        <div class="timeline-event-title">${ev.title}</div>
        <div class="timeline-event-tags">${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}</div>
        ${ev.image ? `<img src="${ev.image}" class="timeline-event-img">` : ""}
      `;
      el.addEventListener("click", () => openEventModal(ev));
      container.appendChild(el);
    });
}

function renderPastEvents() {
  const container = document.getElementById("past-events");
  if (!container) return;
  container.innerHTML = "";

  events
    .filter(ev => ev.dateObj < todayDate && (activeCategory === "all" || ev.categories.includes(activeCategory)))
    .sort((a, b) => b.dateObj - a.dateObj)
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";
      el.dataset.date = ev.dateStr;
      el.innerHTML = `
        <div class="timeline-event-date">${ev.dateReadable}</div>
        <div class="timeline-event-title">${ev.title}</div>
        <div class="timeline-event-tags">${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}</div>
        ${ev.image ? `<img src="${ev.image}" class="timeline-event-img">` : ""}
      `;
      el.addEventListener("click", () => openEventModal(ev));
      container.appendChild(el);
    });
}

function linkCalendarToTimeline() {
  document.querySelectorAll(".calendar-day.has-event").forEach(day => {
    day.addEventListener("click", () => {
      const target = document.querySelector(`.timeline-event[data-date="${day.dataset.date}"]`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

/* ============================================================
   MODALE EVENTO + BODY LOCK
============================================================ */

function lockBodyForModal() {
  if (!(isMobile() && window.innerHeight > window.innerWidth)) return;
  const scrollY = window.scrollY;
  document.body.dataset.scrollY = scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
}

function unlockBodyFromModal() {
  if (document.body.style.position !== "fixed") return;
  const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollY);
}

function openEventModal(ev) {
  const modal = document.getElementById("event-modal");
  const modalBody = document.getElementById("event-modal-body");
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="modal-two-columns">
      <div class="modal-left">${ev.image ? `<img src="${ev.image}" class="modal-img">` : ""}</div>
      <div class="modal-right">
        <div class="event-modal-date">${ev.dateReadable}</div>
        <div class="event-modal-categories">${ev.categories.map(c => `<span class="event-tag">${c}</span>`).join("")}</div>
        <h2>${ev.title}</h2>
      </div>
    </div>
  `;
  modal.style.display = "flex";
  lockBodyForModal();
}

const modalCloseBtn = document.querySelector(".event-modal-close");
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", () => {
    document.getElementById("event-modal").style.display = "none";
    unlockBodyFromModal();
  });
}
