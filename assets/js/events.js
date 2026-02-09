/* ============================================================
   CONFIGURAZIONE BASE
============================================================ */

let events = [];
let currentMonth;
let currentYear;

const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = today.getMonth();
const todayDay = today.getDate();

// Normalizziamo "oggi" a mezzanotte
const todayDate = new Date(todayYear, todayMonth, todayDay);

// Mese precedente
const prevMonthDate = new Date(todayYear, todayMonth - 1, 1);
const prevMonth = prevMonthDate.getMonth();
const prevYear = prevMonthDate.getFullYear();

// Categoria attiva
let activeCategory = "all";


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
        }),
        past: d < todayDate
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

    document.getElementById("future-calendar").style.display = "flex";
    document.getElementById("mobile-timeline").style.display = "flex";
    document.getElementById("past-events").style.display = "none";

    renderCalendar(currentMonth, currentYear);
    renderMobileTimeline();
  });

  pastBtn.addEventListener("click", () => {
    pastBtn.classList.add("active");
    futureBtn.classList.remove("active");

    document.getElementById("future-calendar").style.display = "none";
    document.getElementById("mobile-timeline").style.display = "none";
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

  container.style.opacity = 0;
  setTimeout(() => { container.innerHTML = ""; }, 150);

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
      !ev.past &&
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

  setTimeout(() => { container.style.opacity = 1; }, 150);
}


/* ============================================================
   NAVIGAZIONE MESI FUTURI (CLAMP)
============================================================ */

document.getElementById("prev-month").addEventListener("click", () => {
  let m = currentMonth - 1;
  let y = currentYear;

  if (m < 0) { m = 11; y--; }

  if (y < todayYear || (y === todayYear && m < todayMonth)) return;

  currentMonth = m;
  currentYear = y;

  renderCalendar(currentMonth, currentYear);
});

document.getElementById("next-month").addEventListener("click", () => {
  let m = currentMonth + 1;
  let y = currentYear;

  if (m > 11) { m = 0; y++; }

  currentMonth = m;
  currentYear = y;

  renderCalendar(currentMonth, currentYear);
});


/* ============================================================
   TIMELINE MOBILE FUTURA
============================================================ */

function renderMobileTimeline() {
  const timeline = document.getElementById("mobile-timeline");
  if (!timeline) return;

  timeline.innerHTML = "";

  events
    .filter(ev => !ev.past && (activeCategory === "all" || ev.categories.includes(activeCategory)))
    .sort((a, b) => a.dateObj - b.dateObj)
    .forEach(ev => {
      const tilt = (Math.random() * 2 - 1).toFixed(2) + "deg";

      const el = document.createElement("div");
      el.className = "timeline-event";
      el.dataset.date = ev.date;
      el.style.setProperty("--tilt", tilt);

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
   EVENTI PASSATI (SOLO MESE PRECEDENTE)
============================================================ */

function renderPastEvents() {
  const container = document.getElementById("past-events");
  if (!container) return;

  container.innerHTML = "";

  const filtered = events.filter(ev => {
    const d = ev.dateObj;
    return (
      d < todayDate &&
      d >= new Date(prevYear, prevMonth, 1) &&
      (activeCategory === "all" || ev.categories.includes(activeCategory))
    );
  });

  filtered
    .sort((a, b) => a.dateObj - b.dateObj)
    .forEach(ev => {
      const el = document.createElement("div");
      el.className = "timeline-event";
      el.style.setProperty("--tilt", (Math.random() * 2 - 1).toFixed(2) + "deg");

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
   LINK CALENDARIO → TIMELINE
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
   SCROLL REVEAL
============================================================ */

function enableTimelineReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  });

  document.querySelectorAll(".timeline-event").forEach(el => observer.observe(el));
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
