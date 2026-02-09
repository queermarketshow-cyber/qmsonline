/* ============================================================
   1) VARIABILI GLOBALI
============================================================ */

let events = [];
let currentMonth;
let currentYear;


/* ============================================================
   2) CARICAMENTO EVENTI DA events.json
============================================================ */

fetch('events.json')
  .then(res => res.json())
  .then(data => {
    events = data.map(ev => ({
      ...ev,
      date: ev.start, // normalizziamo
      dateReadable: new Date(ev.start).toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
      past: new Date(ev.start) < new Date()
    }));

    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();

    initializeCalendarSystem();
  })
  .catch(err => console.error("Errore nel caricamento di events.json:", err));


/* ============================================================
   3) INIZIALIZZAZIONE COMPLETA
============================================================ */

function initializeCalendarSystem() {
  renderCalendar(currentMonth, currentYear);
  initHybridCalendar(events);
  renderPastEvents(events);
  initMonthNavigation();
}


/* ============================================================
   4) CALENDARIO DESKTOP
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
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    grid.appendChild(empty);
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

    const todaysEvents = events.filter(ev => ev.date === iso && !ev.past);

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
   5) NAVIGAZIONE MESE
============================================================ */

function initMonthNavigation() {
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
      initHybridCalendar(events);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
      initHybridCalendar(events);
    });
  }
}


/* ============================================================
   6) TIMELINE MOBILE
============================================================ */

function generateMobileTimeline(events) {
  const timeline = document.getElementById("mobile-timeline");
  if (!timeline) return;

  timeline.innerHTML = "";

  events
    .filter(ev => !ev.past)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
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
          ${ev.categories
            .map(cat => `<span class="timeline-event-tag">${cat}</span>`)
            .join("")}
        </div>

        <div class="timeline-event-desc">${ev.description || ""}</div>

        ${
          ev.image
            ? `<img src="${ev.image}" class="timeline-event-img" alt="">`
            : ""
        }
      `;

      el.addEventListener("click", () => openEventModal(ev));

      timeline.appendChild(el);
    });
}


/* ============================================================
   7) EVENTI PASSATI
============================================================ */

function renderPastEvents(events) {
  const container = document.getElementById("past-events");
  if (!container) return;

  container.innerHTML = "";

  const past = events
    .filter(ev => ev.past)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  past.forEach(ev => {
    const el = document.createElement("div");
    el.className = "timeline-event";
    el.style.setProperty("--tilt", (Math.random() * 2 - 1).toFixed(2) + "deg");

    el.innerHTML = `
      <div class="timeline-event-date">${ev.dateReadable}</div>
      <div class="timeline-event-title">${ev.title}</div>
      <div class="timeline-event-tags">
        ${ev.categories
          .map(cat => `<span class="timeline-event-tag">${cat}</span>`)
          .join("")}
      </div>
      <div class="timeline-event-desc">${ev.description || ""}</div>
      ${
        ev.image
          ? `<img src="${ev.image}" class="timeline-event-img" alt="">`
          : ""
      }
    `;

    el.addEventListener("click", () => openEventModal(ev));

    container.appendChild(el);
  });
}


/* ============================================================
   8) LINK CALENDARIO → TIMELINE
============================================================ */

function linkCalendarToTimeline() {
  const days = document.querySelectorAll(".calendar-day.has-event");

  days.forEach(day => {
    day.addEventListener("click", () => {
      const date = day.dataset.date;
      const target = document.querySelector(
        `.timeline-event[data-date="${date}"]`
      );

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}


/* ============================================================
   9) SCROLL-REVEAL
============================================================ */

function enableTimelineReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  });

  document
    .querySelectorAll(".timeline-event")
    .forEach(el => observer.observe(el));
}


/* ============================================================
   10) INTEGRAZIONE IBRIDA
============================================================ */

function initHybridCalendar(events) {
  generateMobileTimeline(events);
  linkCalendarToTimeline();
  enableTimelineReveal();
}


/* ============================================================
   11) MODALE EVENTO
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
          ${ev.categories
            .map(cat => `<span class="event-tag">${cat}</span>`)
            .join("")}
        </div>
        <h2>${ev.title}</h2>
        <p>${ev.description || ""}</p>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  const img = body.querySelector(".modal-img");
  if (img) {
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const content = document.querySelector(".event-modal-content");

      if (w > h) content.dataset.orientation = "landscape";
      else if (h > w) content.dataset.orientation = "portrait";
      else content.dataset.orientation = "square";
    };
  }
}

document
  .querySelector(".event-modal-close")
  ?.addEventListener("click", () => {
    document.getElementById("event-modal").style.display = "none";
  });
