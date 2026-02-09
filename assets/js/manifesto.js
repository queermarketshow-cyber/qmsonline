// Intersection Observer
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.tagName === 'STRONG') {
        entry.target.classList.add('active');
      }
    }
  });
});

// Applica agli elementi
document.querySelectorAll('.manifesto-body p').forEach(p => {
  const r = (Math.random() * 1.2 - 0.6).toFixed(2);
  p.style.setProperty('--tilt', `${r}deg`);
  observer.observe(p);
});

document.querySelectorAll('.manifesto-body strong').forEach(strong => {
  observer.observe(strong);
});
