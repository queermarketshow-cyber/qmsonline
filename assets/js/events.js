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
   (attualmente non usato, ma pronto se servirà)
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

/* ============================================================
   CALENDARIO DESKTOP + SELETTORE ANNO → MESE
============================================================ */

function renderCalendar(month, year) {
  const container = document.getElementById("future-month-container");
  if (!container) return;

  container.innerHTML = "";

  const date = new Date(year, month, 1);
  const monthName = date.toLocaleString("it-IT", { month: "long" });

  /* -------------------------------
     HEADER MESE + TRIANGOLINO
  --------------------------------*/
  const monthWrapper = document.createElement("div");
  monthWrapper.className = "calendar-month";
  monthWrapper.style.display = "flex";
  monthWrapper.style.alignItems = "center";
  monthWrapper.style.gap = "8px";
  monthWrapper.style.cursor = "pointer";

  const monthText = document.createElement("span");
  monthText.textContent = `${monthName} ${year}`;

  const triangle = document.createElement("span");
  triangle.textContent = "▼";
  triangle.style.fontSize = "1rem";
  triangle.style.transform = "translateY(2px)";

  monthWrapper.appendChild(monthText);
  monthWrapper.appendChild(triangle);
  container.appendChild(monthWrapper);

  /* -------------------------------
     SELETTORE ANNO → MESE
  --------------------------------*/
  buildYearMonthSelector(monthWrapper);

  /* -------------------------------
     GRIGLIA CALENDARIO
  --------------------------------*/
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
   SELETTORE ANNO → MESE (due dropdown + OK)
============================================================ */

function buildYearMonthSelector(monthWrapper) {
  // rimuovi eventuali selector precedenti
  monthWrapper.querySelectorAll(".month-selector").forEach(el => el.remove());

  const selector = document.createElement("div");
  selector.className = "month-selector";
  selector.style.display = "none";
  selector.style.flexDirection = "column";
  selector.style.gap = "0.6rem";
  selector.style.padding = "0.8rem";
  selector.style.background = "#000";
  selector.style.border = "2px solid #ff2fa8";
  selector.style.boxShadow = "6px 6px 0 #000";
  selector.style.position = "absolute";
  selector.style.top = "100%";
  selector.style.left = "0";
  selector.style.zIndex = "50";

  /* -------------------------------
     1) Raccogli TUTTI gli anni e mesi con eventi
  --------------------------------*/
  const map = new Map(); // year → Set(months)

  events.forEach(ev => {
    const y = ev.dateObj.getFullYear();
    const m = ev.dateObj.getMonth();
    if (!map.has(y)) map.set(y, new Set());
    map.get(y).add(m);
  });

  const years = [...map.keys()].sort((a, b) => b - a);

  /* -------------------------------
     Dropdown ANNO
  --------------------------------*/
  const yearSelect = document.createElement("select");
  yearSelect.style.padding = "0.4rem";
  yearSelect.style.fontWeight = "900";
  yearSelect.style.background = "#ff2fa8";
  yearSelect.style.border = "2px solid #000";
  yearSelect.style.cursor = "pointer";

  const defaultYearOption = document.createElement("option");
  defaultYearOption.textContent = "Seleziona anno";
  defaultYearOption.value = "";
  yearSelect.appendChild(defaultYearOption);

  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  /* -------------------------------
     Dropdown MESE (disabilitato finché non scelgo anno)
  --------------------------------*/
  const monthSelect = document.createElement("select");
  monthSelect.style.padding = "0.4rem";
  monthSelect.style.fontWeight = "900";
  monthSelect.style.background = "#ff2fa8";
  monthSelect.style.border = "2px solid #000";
  monthSelect.style.cursor = "pointer";
  monthSelect.disabled = true;

  const defaultMonthOption = document.createElement("option");
  defaultMonthOption.textContent = "Seleziona mese";
  defaultMonthOption.value = "";
  monthSelect.appendChild(defaultMonthOption);

  /* -------------------------------
     Quando seleziono l’anno → popolo i mesi
  --------------------------------*/
  yearSelect.addEventListener("change", () => {
    const y = Number(yearSelect.value);
    monthSelect.innerHTML = "";
    monthSelect.appendChild(defaultMonthOption);
    monthSelect.disabled = false;

    const months = [...map.get(y)].sort((a, b) => a - b);

    months.forEach(m => {
      const opt = document.createElement("option");
      const name = new Date(y, m, 1).toLocaleString("it-IT", { month: "long" });
      opt.value = m;
      opt.textContent = name;
      monthSelect.appendChild(opt);
    });
  });

  /* -------------------------------
     Pulsante OK → applica selezione
  --------------------------------*/
  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.style.padding = "0.4rem 0.8rem";
  okBtn.style.fontWeight = "900";
  okBtn.style.background = "#ff2fa8";
  okBtn.style.border = "2px solid #000";
  okBtn.style.cursor = "pointer";
  okBtn.style.boxShadow = "3px 3px 0 #000";

  okBtn.addEventListener("click", () => {
    const y = Number(yearSelect.value);
    const m = Number(monthSelect.value);

    if (!y || isNaN(m)) return;

    currentYear = y;
    currentMonth = m;

    selector.style.display = "none";
    renderAll();
  });

  /* -------------------------------
     Monta il menu
  --------------------------------*/
  selector.appendChild(yearSelect);
  selector.appendChild(monthSelect);
  selector.appendChild(okBtn);

  monthWrapper.style.position = "relative";
  monthWrapper.appendChild(selector);

  /* -------------------------------
     Toggle apertura menu
  --------------------------------*/
  monthWrapper.addEventListener("click", () => {
    selector.style.display = selector.style.display === "flex" ? "none" : "flex";
  });
}


/* ============================================================
   NAVIGAZIONE MESI (rinominata)
============================================================ */

const calPrevBtn = document.getElementById("prev-month");
const calNextBtn = document.getElementById("next-month");

if (calPrevBtn) {
  calPrevBtn.addEventListener("click", () => {
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

if (calNextBtn) {
  calNextBtn.addEventListener("click", () => {
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
   MOBILE CAROUSEL (TIMELINE CONTINUA, SENZA MODALE)
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

      <div class="mobile-event-info">
        ${ev.time ? `<div class="mobile-event-time">🕒 ${ev.time}</div>` : ""}
        ${ev.location ? `<div class="mobile-event-location">📍 ${ev.location}</div>` : ""}
      </div>

      <div class="mobile-event-tags">
        ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
      </div>
    `;

    // niente modale qui: il carosello è solo navigazione
    carousel.appendChild(card);
  });

  generateDotsWindow(timelineEvents.length, startIndex);
  initMobileSwipe(carousel, dotsContainer, startIndex);

  requestAnimationFrame(() => {
    if (carousel.children[startIndex]) {
      carousel.scrollTo({
        left: carousel.children[startIndex].offsetLeft,
        behavior: "auto"
      });
    }
  });
}


/* ============================================================
   SWIPE + FRECCE + DOTS (VERSIONE ANGOLARE, SAFE)
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

  // esposto globalmente per i dot
  window.goTo = goTo;

  // ---------------------------------------------------------
  // SWIPE ORIZZONTALE SOLO SE IL GESTO È CHIARAMENTE ORIZZONTALE
  // Nessun preventDefault: lo scroll verticale resta sempre nativo
  // ---------------------------------------------------------
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let isDragging = false;

  const onPointerDown = e => {
    if (e.pointerType && e.pointerType !== "touch" && e.pointerType !== "pen") return;

    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    isDragging = true;
  };

  const onPointerMove = e => {
    if (!isDragging) return;
    if (e.pointerType && e.pointerType !== "touch" && e.pointerType !== "pen") return;

    // aggiorniamo solo la posizione, nessun preventDefault
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const endDrag = e => {
    if (!isDragging) return;
    if (e.pointerType && e.pointerType !== "touch" && e.pointerType !== "pen") {
      isDragging = false;
      return;
    }

    isDragging = false;

    const dx = lastX - startX;
    const dy = lastY - startY;

    // gesto troppo piccolo → ignora
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    // se non è chiaramente orizzontale → lascia che resti solo scroll verticale
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) return;

    // da qui in poi: gesto chiaramente orizzontale
    if (Math.abs(dx) > 40) {
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    } else {
      goTo(index);
    }
  };

  carousel.addEventListener("pointerdown", onPointerDown);
  carousel.addEventListener("pointermove", onPointerMove); // nessuna opzione, quindi passive di default
  carousel.addEventListener("pointerup", endDrag);
  carousel.addEventListener("pointercancel", endDrag);
  carousel.addEventListener("pointerleave", endDrag);

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
      el.dataset.date = ev.dateStr;

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
      el.dataset.date = ev.dateStr;

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
   LINK CALENDARIO → TIMELINE (USA data-date)
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
