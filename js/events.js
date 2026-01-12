/* ============================================================
   EVENTI 2.0 — JSON → CALENDARIO + MODALE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();

  /* ELEMENTI BASE */
  const futureContainer = document.getElementById("future-calendar");
  const futureMonthContainer = document.getElementById("future-month-container");
  const timeline = document.getElementById("past-events");

  const btnFuture = document.getElementById("show-future");
  const btnPast = document.getElementById("show-past");
  const filterButtons = document.querySelectorAll(".calendar-filters button");

  const modal = document.getElementById("event-modal");
  const modalBody = document.getElementById("event-modal-body");
  const modalClose = document.querySelector(".event-modal-close");

  /* STATO */
  let events = [];
  let currentFilter = "all";
  let currentView = "future";
  let futureMonths = [];
  let currentFutureMonthIndex = 0;

  /* ============================================================
     CARICA EVENTS.JSON
  ============================================================ */
  fetch("events.json")
    .then((res) => res.json())
    .then((data) => {
      events = data;
      showFuture();
    })
    .catch((err) => console.error("Errore nel caricamento degli eventi:", err));

  /* ============================================================
     UTILS DATE
  ============================================================ */

  function parseDate(str) {
    return new Date(str + "T00:00:00");
  }

  function getEventDates(ev) {
    const start = parseDate(ev.start);
    const end = ev.end ? parseDate(ev.end) : start;

    // Se specificDates esiste, ignoriamo il range
    if (ev.specificDates && ev.specificDates.length > 0) {
      return ev.specificDates.map(parseDate);
    }

    // Altrimenti generiamo il range completo
    const dates = [];
    let cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  function eventMatchesFilter(ev) {
    if (currentFilter === "all") return true;
    return ev.categories.includes(currentFilter);
  }

  /* ============================================================
     MODALE EVENTO
  ============================================================ */

  function openEventModal(ev) {
    if (!modal || !modalBody) return;

    const dates = getEventDates(ev);
    const options = { day: "numeric", month: "long", year: "numeric" };

    let dateLabel = "";
    if (dates.length === 1) {
      dateLabel = dates[0].toLocaleDateString("it-IT", options);
    } else {
      const first = dates[0].toLocaleDateString("it-IT", options);
      const last = dates[dates.length - 1].toLocaleDateString("it-IT", options);
      dateLabel = `${first} → ${last}`;
    }

    const categories = ev.categories
      .map((c) => `<span class="event-tag">${c}</span>`)
      .join(" ");

    modalBody.innerHTML = `
      <div class="modal-two-columns">
        <div class="modal-left">
          <img src="${ev.image}" alt="${ev.title}" class="modal-img">
        </div>
        <div class="modal-right">
          <div class="event-modal-date">${dateLabel}</div>
          <div class="event-modal-categories">${categories}</div>
          <div class="event-modal-description">
            <h3>${ev.title}</h3>
            <p>${ev.location}</p>
          </div>
        </div>
      </div>
    `;

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeEventModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  modalClose?.addEventListener("click", closeEventModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeEventModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEventModal();
  });

  /* ============================================================
     COSTRUZIONE GRIGLIA MENSILE
  ============================================================ */

  function buildCalendarMonth(year, month, monthEvents) {
    const monthName = new Date(year, month).toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    }).toUpperCase();

    const wrapper = document.createElement("div");
    wrapper.classList.add("calendar-month-wrapper");
    wrapper.innerHTML = `
      <div class="calendar-month">${monthName}</div>
      <div class="calendar-grid"></div>
    `;

    const grid = wrapper.querySelector(".calendar-grid");

    const firstDay = new Date(year, month, 1).getDay() || 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i < firstDay; i++) {
      grid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.classList.add("calendar-day");
      cell.innerHTML = `<div class="calendar-day-number">${day}</div>`;

      monthEvents.forEach((ev) => {
        const dates = getEventDates(ev);
        dates.forEach((d) => {
          if (
            d.getFullYear() === year &&
            d.getMonth() === month &&
            d.getDate() === day
          ) {
            cell.classList.add("has-event");

            const postit = document.createElement("div");
            postit.classList.add("event-postit");
            postit.innerHTML = `<img src="${ev.image}" alt="">`;
            postit.onclick = () => openEventModal(ev);

            cell.appendChild(postit);
          }
        });
      });

      grid.appendChild(cell);
    }

    return wrapper;
  }

  /* ============================================================
     EVENTI FUTURI
  ============================================================ */

  function showFuture() {
    currentView = "future";

    futureContainer.style.display = "flex";
    timeline.style.display = "none";
    futureMonthContainer.innerHTML = "";

    const futureEvents = events.filter((ev) => {
      const last = getEventDates(ev).slice(-1)[0];
      return last >= today && eventMatchesFilter(ev);
    });

    const months = {};
    futureEvents.forEach((ev) => {
      const first = getEventDates(ev)[0];
      const key = `${first.getFullYear()}-${first.getMonth() + 1}`;
      if (!months[key]) months[key] = [];
      months[key].push(ev);
    });

    futureMonths = Object.keys(months).sort((a, b) => {
      const [yA, mA] = a.split("-").map(Number);
      const [yB, mB] = b.split("-").map(Number);
      return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");

    if (futureMonths.length === 0) {
      futureMonthContainer.innerHTML =
        "<p>Nessun evento futuro per questo filtro.</p>";
      prevBtn.style.opacity = "0.3";
      nextBtn.style.opacity = "0.3";
      return;
    }

    currentFutureMonthIndex = 0;

    function renderFutureMonth() {
      futureMonthContainer.innerHTML = "";
      const key = futureMonths[currentFutureMonthIndex];
      const [year, month] = key.split("-").map(Number);

      futureMonthContainer.appendChild(
        buildCalendarMonth(year, month - 1, months[key])
      );

      prevBtn.style.opacity = currentFutureMonthIndex > 0 ? "1" : "0.3";
      nextBtn.style.opacity =
        currentFutureMonthIndex < futureMonths.length - 1 ? "1" : "0.3";
    }

    renderFutureMonth();

    prevBtn.onclick = () => {
      if (currentFutureMonthIndex > 0) {
        currentFutureMonthIndex--;
        renderFutureMonth();
      }
    };

    nextBtn.onclick = () => {
      if (currentFutureMonthIndex < futureMonths.length - 1) {
        currentFutureMonthIndex++;
        renderFutureMonth();
      }
    };
  }

  /* ============================================================
     EVENTI PASSATI
  ============================================================ */

  function showPast() {
    currentView = "past";

    futureContainer.style.display = "none";
    timeline.style.display = "block";
    timeline.innerHTML = "";

    const pastEvents = events
      .filter((ev) => {
        const last = getEventDates(ev).slice(-1)[0];
        return last < today && eventMatchesFilter(ev);
      })
      .sort((a, b) => {
        const da = getEventDates(a).slice(-1)[0];
        const db = getEventDates(b).slice(-1)[0];
        return db - da;
      });

    const months = {};
    pastEvents.forEach((ev) => {
      const first = getEventDates(ev)[0];
      const key = `${first.getFullYear()}-${first.getMonth() + 1}`;
      if (!months[key]) months[key] = [];
      months[key].push(ev);
    });

    const sortedMonths = Object.keys(months).sort((a, b) => {
      const [yA, mA] = a.split("-").map(Number);
      const [yB, mB] = b.split("-").map(Number);
      return new Date(yB, mB - 1) - new Date(yA, mA - 1);
    });

    if (sortedMonths.length === 0) {
      timeline.innerHTML = "<p>Nessun evento passato per questo filtro.</p>";
      return;
    }

    sortedMonths.forEach((key) => {
      const [year, month] = key.split("-").map(Number);
      timeline.appendChild(
        buildCalendarMonth(year, month - 1, months[key])
      );
    });
  }

  /* ============================================================
     BOTTONI FUTURO/PASSATO
  ============================================================ */

  btnFuture.onclick = () => {
    btnFuture.classList.add("active");
    btnPast.classList.remove("active");
    showFuture();
  };

  btnPast.onclick = () => {
    btnPast.classList.add("active");
    btnFuture.classList.remove("active");
    showPast();
  };

  /* ============================================================
     FILTRI
  ============================================================ */

  filterButtons.forEach((btn) => {
    btn.onclick = () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter || "all";

      if (currentView === "future") showFuture();
      else showPast();
    };
  });
});
