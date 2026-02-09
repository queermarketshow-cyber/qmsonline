/* ============================================================
   CONFIGURAZIONE BASE
============================================================ */

let events = [];
let currentMonth;
let currentYear;

const today = new Date();
const todayISO = today.toISOString().split("T")[0];

const todayYear = today.getFullYear();
const todayMonth = today.getMonth();

const prevMonthDate = new Date(todayYear, todayMonth - 1, 1);
const prevMonth = prevMonthDate.getMonth();
const prevYear = prevMonthDate.getFullYear();

let activeCategory = "all";

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}


/* ============================================================
   CARICAMENTO EVENTI
============================================================ */

fetch("events.json")
  .then(res => res.json())
  .then(data => {
    events = data.map(ev => {
      const d = new Date(ev.start);
      return {
        ...ev,
        date: ev.start,
        dateObj: d,
        dateReadable: d.toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      };
    });

    currentMonth = todayMonth;
    currentYear = todayYear;

    initFilters();
    initControls();
    renderAll();
  });


/* ============================================================
   INIZIALIZZAZIONE
============================================================ */

function renderAll() {
  renderCalendar(currentMonth, currentYear);
  renderMobileTimeline();
  renderPastEvents();
  linkCalendarToTimeline();
  enableTimelineReveal();
}


/* ============================================================
   FILTRI CATEGORIE
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

  futureBtn.addEventListener("click", () => {
    futureBtn.classList.add("active");
    pastBtn.classList.remove("active");

    document.getElementById("past-events").style.display = "none";

    renderCalendar(currentMonth, currentYear);
    if (isMobile()) renderMobileTimeline();
  });

  pastBtn.addEventListener("click", () => {
    pastBtn.classList.add("active");
    futureBtn.classList.remove("active");

    document.getElementById("past-events").style.display = "flex";

    renderPastEvents();
  });
}


/* ============================================================
   CALENDARIO FUTURO (DESKTOP)
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
    const iso = fullDate.toISOString().split("T")[0];
    dayEl.dataset.date = iso;

    const num = document.createElement("div");
    num.className = "calendar-day-number";
    num.textContent = d;
    dayEl.appendChild(num);

    const todaysEvents = events.filter(ev =>
      ev.date === iso &&
      ev.date >= todayISO &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    );

    if (todaysEvents.length > 0) {
      dayEl.classList.add("has-event");

      const postit = document.createElement("div");
      postit.className = "event-postit";

      if (todaysEvents[0].image) {
        const img = document.createElement("img");
        img.src = todaysEvents[0].image;
        postit.appendChild(img);
      }

      postit.addEventListener("click", () => openEventModal(todaysEvents[0]));
      dayEl.appendChild(postit);
    }

    grid.appendChild(dayEl);
  }

  container.appendChild(grid);
}


/* ============================================================
   TIMELINE MOBILE FUTURA
============================================================ */

function renderMobileTimeline() {
  const timeline = document.getElementById("mobile-timeline");
  if (!timeline) return;

  timeline.innerHTML = "";

  events
    .filter(ev =>
      ev.date >= todayISO &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";
      el.dataset.date = ev.date;

      el.innerHTML = `
        <div class="timeline-event-date">${ev.dateReadable}</div>
        <div class="timeline-event-title">${ev.title}</div>
        <div class="timeline-event-tags">
          ${ev.categories.map(c => `<span class="timeline-event-tag">${c}</span>`).join("")}
        </div>
        ${ev.image ? `<img src="${ev.image}" class="timeline-event-img">` : ""}
      `;

      el.addEventListener("click", () => openEventModal(ev));
      timeline.appendChild(el);
    });
}


/* ============================================================
   EVENTI PASSATI
============================================================ */

function renderPastEvents() {
  const container = document.getElementById("past-events");
  if (!container) return;

  container.innerHTML = "";

  const filtered = events.filter(ev => {
    const d = ev.dateObj;
    return (
      ev.date < todayISO &&
      d >= new Date(prevYear, prevMonth, 1) &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    );
  });

  filtered
    .sort((a, b) => a.date.localeCompare(b.date))
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
   MODALE EVENTO
============================================================ */

function openEventModal(ev) {
  const modal = document.getElementById("event-modal");
  const body = document.getElementById("event-modal-body");

  body.innerHTML = `
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
}

document.querySelector(".event-modal-close").addEventListener("click", () => {
  document.getElementById("event-modal").style.display = "none";
});
