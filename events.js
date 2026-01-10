/* ===============================
   EVENTI — CALENDARIO + MODALE
=============================== */
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();

  /* ELEMENTI BASE */
  const cards = Array.from(document.querySelectorAll('.event-card-visual'));
  const futureContainer = document.getElementById('future-calendar');
  const futureMonthContainer = document.getElementById('future-month-container');
  const timeline = document.getElementById('past-events');

  const btnFuture = document.getElementById('show-future');
  const btnPast = document.getElementById('show-past');
  const filterButtons = document.querySelectorAll('.calendar-filters button');

  const modal = document.getElementById('event-modal');
  const modalBody = document.getElementById('event-modal-body');
  const modalClose = document.querySelector('.event-modal-close');

  /* STATO */
  let futureMonths = [];
  let currentFutureMonthIndex = 0;
  let currentFilter = 'all';
  let currentView = 'future';

  /* ===============================
     UTILS DATE + FILTRI
  =============================== */
  function getEventDates(card) {
    const start = new Date(card.dataset.start || card.dataset.date);
    const end = new Date(card.dataset.end || card.dataset.start);
    return { start, end };
  }

  function cardMatchesFilter(card) {
    if (currentFilter === 'all') return true;
    const cats = (card.dataset.category || '').split(/\s+/);
    return cats.includes(currentFilter);
  }

  /* ===============================
     MODALE EVENTO
  =============================== */
  function openEventModal(card) {
    if (!modal || !modalBody) return;

    const { start, end } = getEventDates(card);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };

    const startStr = start.toLocaleDateString('it-IT', options);
    const endStr = end.toLocaleDateString('it-IT', options);
    const dateLabel = startStr === endStr ? startStr : `${startStr} → ${endStr}`;

    const categories = (card.dataset.category || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(cat => `<span class="event-tag">${cat}</span>`)
      .join(' ');

    const img = card.querySelector('img');
    const imgHTML = img ? `<img src="${img.src}" alt="" class="modal-img">` : '';

    const overlay = card.querySelector('.event-overlay')?.cloneNode(true) || document.createElement('div');
    overlay.querySelectorAll('.event-date, .date, .data').forEach(el => el.remove());

    modalBody.innerHTML = `
      <div class="modal-two-columns">
        <div class="modal-left">${imgHTML}</div>
        <div class="modal-right">
          <div class="event-modal-date">${dateLabel}</div>
          <div class="event-modal-categories">${categories}</div>
          <div class="event-modal-description">${overlay.innerHTML}</div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const modalImg = modal.querySelector('.modal-img');
    const modalContent = modal.querySelector('.event-modal-content');

    if (modalImg && modalContent) {
      modalImg.onload = () => {
        const ratio = modalImg.naturalWidth / modalImg.naturalHeight;
        if (ratio > 1.2) modalContent.dataset.orientation = 'landscape';
        else if (ratio < 0.8) modalContent.dataset.orientation = 'portrait';
        else modalContent.dataset.orientation = 'square';
      };
    }
  }

  function closeEventModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* Chiudi modale: bottone, click fuori, ESC */
  modalClose?.addEventListener('click', closeEventModal);

  modal?.addEventListener('click', e => {
    if (e.target === modal) closeEventModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeEventModal();
  });

  /* Click su card */
  cards.forEach(card => {
    card.addEventListener('click', () => openEventModal(card));
  });

  /* ===============================
     COSTRUZIONE GRIGLIA MENSILE
  =============================== */
  function buildCalendarMonth(year, month, events) {
    const monthName = new Date(year, month).toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric'
    }).toUpperCase();

    const wrapper = document.createElement('div');
    wrapper.classList.add('calendar-month-wrapper');
    wrapper.innerHTML = `
      <div class="calendar-month">${monthName}</div>
      <div class="calendar-grid"></div>
    `;

    const grid = wrapper.querySelector('.calendar-grid');

    const firstDay = new Date(year, month, 1).getDay() || 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i < firstDay; i++) {
      grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.classList.add('calendar-day');
      cell.innerHTML = `<div class="calendar-day-number">${day}</div>`;

      events.forEach(card => {
        const { start } = getEventDates(card);
        if (
          start.getFullYear() === year &&
          start.getMonth() === month &&
          start.getDate() === day
        ) {
          cell.classList.add('has-event');

          const postit = document.createElement('div');
          postit.classList.add('event-postit');

          const img = card.querySelector('img');
          if (img) postit.innerHTML = `<img src="${img.src}" alt="">`;

          postit.onclick = () => openEventModal(card);
          cell.appendChild(postit);
        }
      });

      grid.appendChild(cell);
    }

    return wrapper;
  }

  /* ===============================
     VISTA EVENTI FUTURI
  =============================== */
  function showFuture() {
    currentView = 'future';

    if (futureContainer) futureContainer.style.display = 'flex';
    if (timeline) {
      timeline.style.display = 'none';
      timeline.innerHTML = '';
    }
    if (futureMonthContainer) futureMonthContainer.innerHTML = '';

    const futureEvents = cards.filter(card => {
      const { end } = getEventDates(card);
      return end >= today && cardMatchesFilter(card);
    });

    const months = {};
    futureEvents.forEach(card => {
      const { start } = getEventDates(card);
      const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
      if (!months[key]) months[key] = [];
      months[key].push(card);
    });

    futureMonths = Object.keys(months).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number);
      const [yB, mB] = b.split('-').map(Number);
      return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (futureMonths.length === 0) {
      if (futureMonthContainer) {
        futureMonthContainer.innerHTML = '<p>Nessun evento futuro per questo filtro.</p>';
      }
      if (prevBtn) prevBtn.style.opacity = '0.3';
      if (nextBtn) nextBtn.style.opacity = '0.3';
      return;
    }

    currentFutureMonthIndex = 0;

    function renderFutureMonth() {
      if (!futureMonthContainer) return;

      futureMonthContainer.innerHTML = '';
      const key = futureMonths[currentFutureMonthIndex];
      const [year, month] = key.split('-').map(Number);

      futureMonthContainer.appendChild(
        buildCalendarMonth(year, month - 1, months[key])
      );

      if (prevBtn) {
        prevBtn.style.opacity = currentFutureMonthIndex > 0 ? '1' : '0.3';
      }
      if (nextBtn) {
        nextBtn.style.opacity =
          currentFutureMonthIndex < futureMonths.length - 1 ? '1' : '0.3';
      }
    }

    renderFutureMonth();

    prevBtn?.addEventListener('click', () => {
      if (currentFutureMonthIndex > 0) {
        currentFutureMonthIndex--;
        renderFutureMonth();
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (currentFutureMonthIndex < futureMonths.length - 1) {
        currentFutureMonthIndex++;
        renderFutureMonth();
      }
    });
  }

  /* ===============================
     VISTA EVENTI PASSATI
  =============================== */
  function showPast() {
    currentView = 'past';

    if (futureContainer) futureContainer.style.display = 'none';
    if (!timeline) return;

    timeline.style.display = 'block';
    timeline.innerHTML = '';

    const pastEvents = cards
      .filter(card => {
        const { end } = getEventDates(card);
        return end < today && cardMatchesFilter(card);
      })
      .sort((a, b) => getEventDates(b).end - getEventDates(a).end);

    const months = {};
    pastEvents.forEach(card => {
      const { start } = getEventDates(card);
      const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
      if (!months[key]) months[key] = [];
      months[key].push(card);
    });

    const sortedMonths = Object.keys(months).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number);
      const [yB, mB] = b.split('-').map(Number);
      return new Date(yB, mB - 1) - new Date(yA, mA - 1);
    });

    if (sortedMonths.length === 0) {
      timeline.innerHTML = '<p>Nessun evento passato per questo filtro.</p>';
      return;
    }

    sortedMonths.forEach(key => {
      const [year, month] = key.split('-').map(Number);
      timeline.appendChild(
        buildCalendarMonth(year, month - 1, months[key])
      );
    });
  }

  /* ===============================
     BOTTONI FUTURO/PASSATO
  =============================== */
  btnFuture?.addEventListener('click', () => {
    btnFuture.classList.add('active');
    btnPast?.classList.remove('active');
    showFuture();
  });

  btnPast?.addEventListener('click', () => {
    btnPast.classList.add('active');
    btnFuture?.classList.remove('active');
    showPast();
  });

  /* ===============================
     FILTRI PER CATEGORIA
  =============================== */
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';

      if (currentView === 'future') showFuture();
      else showPast();
    });
  });

  /* ===============================
     VISTA DI DEFAULT
  =============================== */
  showFuture();
});
