/* ============================================================
   CONFIGURAZIONE BASE
============================================================ */

let events = [];
let currentMonth;
let currentYear;

const now = new Date();
const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayYear = todayDate.getFullYear();
const todayMonth = todayDate.getMonth();

let activeCategory = "all";

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

/* ============================================================
   RILEVAMENTO DEVICE "DELICATI" (OPPO / COLOROS)
============================================================ */

function isOppoDevice() {
  return /OPPO|CPH|PCLM|PCRT|PCKM|RMX|CPH/i.test(navigator.userAgent);
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

    while (cursor <= endDate) {
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
    }
  }

  return occurrences;
}


/* ============================================================
   CARICAMENTO EVENTI
============================================================ */

fetch("events.json")
  .then(res => res.json())
  .then(data => {
    const expanded = [];
    data.forEach(ev => expanded.push(...expandEvent(ev)));

    events = expanded.sort((a, b) => a.dateObj - b.dateObj);

    const first = findFirstFutureMonthWithEvents();
    currentMonth = first.month;
    currentYear = first.year;

    initFilters();
    initControls();
    renderAll();
  });


/* ============================================================
   MESE → HA EVENTI?
============================================================ */

function monthHasEvents(month, year) {
  return events.some(ev =>
    ev.dateObj.getFullYear() === year &&
    ev.dateObj.getMonth() === month &&
    (activeCategory === "all" || ev.categories.includes(activeCategory))
  );
}


/* ============================================================
   TROVA PRIMO MESE FUTURO CON EVENTI
============================================================ */

function findFirstFutureMonthWithEvents() {
  let m = todayMonth;
  let y = todayYear;

  while (!monthHasEvents(m, y)) {
    m++;
    if (m > 11) { m = 0; y++; }
  }

  return { month: m, year: y };
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
   DOT WINDOW (15 DOT VISIBILI)
============================================================ */

function generateDotsWindow(total, activeIndex) {
  const dotsContainer = document.getElementById("mobile-dots");
  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";

  const windowSize = 15;
  const half = Math.floor(windowSize / 2);

  let start = Math.max(0, activeIndex - half);
  let end = Math.min(total - 1, activeIndex + half);

  if (activeIndex < half) {
    end = Math.min(total - 1, windowSize - 1);
  }

  if (activeIndex > total - half - 1) {
    start = Math.max(0, total - windowSize);
  }

  for (let i = start; i <= end; i++) {
    const dot = document.createElement("div");
    dot.className = "mobile-dot" + (i === activeIndex ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  }
}


/* ============================================================
   FILTRI
============================================================ */

function initFilters() {
  const container = document.getElementById("calendar-filters");
  if (!container) return;

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


/* ============================================================
   CONTROLLI FUTURO / PASSATO
============================================================ */

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


/* ============================================================
   CALENDARIO DESKTOP
============================================================ */

function renderCalendar(month, year) {
  const container = document.getElementById("future-month-container");
  if (!container) return;

  container.innerHTML = "";

  const date = new Date(year, month, 1);
  const monthName = date.toLocaleString("it-IT", { month: "long" });

  const monthEl = document.createElement("div");
  monthEl.className = "calendar-month";
  monthEl.textContent = `${monthName} ${year}`;
  container.appendChild(monthEl);

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

      postit.addEventListener("click", () => openEventModal(mainEv));
      dayEl.appendChild(postit);
    }

    grid.appendChild(dayEl);
  }

  container.appendChild(grid);
}


/* ============================================================
   NAVIGAZIONE MESI
============================================================ */

const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    let m = currentMonth;
    let y = currentYear;

    do {
      m--;
      if (m < 0) { m = 11; y--; }
    } while (!monthHasEvents(m, y));

    currentMonth = m;
    currentYear = y;

    renderAll();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    let m = currentMonth;
    let y = currentYear;

    do {
      m++;
      if (m > 11) { m = 0; y++; }
    } while (!monthHasEvents(m, y));

    currentMonth = m;
    currentYear = y;

    renderAll();
  });
}


/* ============================================================
   MOBILE CAROUSEL (TIMELINE CONTINUA)
============================================================ */

function renderMobileCalendarCarousel() {
  const carousel = document.getElementById("mobile-calendar-carousel");
  const dotsContainer = document.getElementById("mobile-dots");
  if (!carousel || !dotsContainer) return;

  carousel.innerHTML = "";
  dotsContainer.innerHTML = "";

  const timelineEvents = events
    .filter(ev => activeCategory === "all" || ev.categories.includes(activeCategory))
    .sort((a, b) => a.dateObj - b.dateObj);

  const firstFutureIndex = timelineEvents.findIndex(ev => ev.dateObj >= todayDate);
  const startIndex = firstFutureIndex !== -1 ? firstFutureIndex : 0;

  timelineEvents.forEach(ev => {
    const card = document.createElement("div");
    card.className = "mobile-event-card";

    card.innerHTML = `
      ${ev.image ? `<img src="${ev.image}">` : ""}
      <div class="mobile-event-date">${ev.dateReadable}</div>
      <div class="mobile-event-title">${ev.title}</div>
      <div class="mobile-event-tags">
        ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
      </div>
    `;

    card.addEventListener("click", () => openEventModal(ev));
    carousel.appendChild(card);
  });

  generateDotsWindow(timelineEvents.length, startIndex);
  initMobileSwipe(carousel, dotsContainer, startIndex);


  requestAnimationFrame(() => {
    if (carousel.children[startIndex]) {
      carousel.scrollTo({
        left: carousel.children[startIndex].offsetLeft,
        behavior: "smooth"
      });
    }
  });
}


/* ============================================================
   SWIPE + FRECCE + DOTS (ROBUSTO MULTI-DEVICE)
============================================================ */

function initMobileSwipe(carousel, dotsContainer, startIndex = 0) {
  let index = startIndex;
  const cards = [...carousel.children];
  const total = cards.length;

  function updateDots() {
    generateDotsWindow(total, index);
  }

  function goTo(i, instant = false) {
    index = Math.max(0, Math.min(i, total - 1));
    const target = cards[index];
    if (!target) return;

    carousel.scrollTo({
      left: target.offsetLeft,
      behavior: instant ? "auto" : "smooth"
    });

    updateDots();
  }

  window.goTo = goTo;

  // 🔥 blocchiamo lo scroll libero su TUTTI i device
  carousel.addEventListener("scroll", () => {
    const target = cards[index];
    if (!target) return;
    if (Math.abs(carousel.scrollLeft - target.offsetLeft) > 2) {
      carousel.scrollLeft = target.offsetLeft;
    }
  });

  // 🔥 swipe manuale universale
  let startX = 0;
  let isDragging = false;

  carousel.addEventListener("touchstart", e => {
    if (!e.touches[0]) return;
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  carousel.addEventListener("touchmove", e => {
    if (!isDragging) return;
    e.preventDefault(); // impedisce al sistema di rubare la gesture
  }, { passive: false });

  carousel.addEventListener("touchend", e => {
    if (!isDragging || !e.changedTouches[0]) return;
    isDragging = false;

    const diff = e.changedTouches[0].clientX - startX;

    if (Math.abs(diff) > 40) {
      if (diff < 0) goTo(index + 1);
      else goTo(index - 1);
    } else {
      goTo(index); // torna alla card corrente
    }
  });

  // frecce
  const prev = document.getElementById("mobile-prev");
  const next = document.getElementById("mobile-next");
  if (prev && next) {
    prev.onclick = () => goTo(index - 1);
    next.onclick = () => goTo(index + 1);
  }

  // avvio
  goTo(startIndex, true);
}



/* ============================================================
   LISTA FUTURA DESKTOP
============================================================ */

function renderFutureList() {
  const container = document.getElementById("future-events-list");
  if (!container) return;

  container.innerHTML = "";

  events
    .filter(ev =>
      ev.dateObj >= todayDate &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    )
    .sort((a, b) => a.dateObj - b.dateObj)
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";

      el.innerHTML = `
        <div class="timeline-event-date">${ev.dateReadable}</div>
        <div class="timeline-event-title">${ev.title}</div>
        <div class="timeline-event-tags">
          ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
        </div>
        ${ev.image ? `<img src="${ev.image}" class="timeline-event-img">` : ""}
      `;

      el.addEventListener("click", () => openEventModal(ev));
      container.appendChild(el);
    });
}


/* ============================================================
   EVENTI PASSATI
============================================================ */

function renderPastEvents() {
  const container = document.getElementById("past-events");
  if (!container) return;

  container.innerHTML = "";

  const filtered = events.filter(ev =>
    ev.dateObj < todayDate &&
    (activeCategory === "all" || ev.categories.includes(activeCategory))
  );

  filtered
    .sort((a, b) => b.dateObj - a.dateObj)
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";

      el.innerHTML = `
        <div class="timeline-event-date">${ev.dateReadable}</div>
        <div class="timeline-event-title">${ev.title}</div>
        <div class="timeline-event-tags">
          ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
        </div>
        ${ev.image ? `<img src="${ev.image}" class="timeline-event-img">` : ""}
      `;

      el.addEventListener("click", () => openEventModal(ev));
      container.appendChild(el);
    });
}


/* ============================================================
   LINK CALENDARIO → TIMELINE MOBILE
============================================================ */

function linkCalendarToTimeline() {
  document.querySelectorAll(".calendar-day.has-event").forEach(day => {
    day.addEventListener("click", () => {
      const target = document.querySelector(`.timeline-event[data-date="${day.dataset.date}"]`);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}


/* ============================================================
   MODALE EVENTO + BODY LOCK
============================================================ */

function shouldLockBody() {
  // blocchiamo solo su mobile in verticale
  return isMobile() && window.innerHeight > window.innerWidth;
}

function lockBodyForModal() {
  if (!shouldLockBody()) return;

  const scrollY = window.scrollY || window.pageYOffset;
  document.body.dataset.scrollY = scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
}

function unlockBodyFromModal() {
  if (!shouldLockBody()) return;

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
      <div class="modal-left">
        ${ev.image ? `<img src="${ev.image}" class="modal-img">` : ""}
      </div>
      <div class="modal-right">
        <div class="event-modal-date">${ev.dateReadable}</div>
        <div class="event-modal-categories">
          ${ev.categories.map(c => `<span class="event-tag">${c}</span>`).join("")}
        </div>
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
    const modal = document.getElementById("event-modal");
    if (modal) modal.style.display = "none";
    unlockBodyFromModal();
  });
}
