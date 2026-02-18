document.querySelectorAll('.qms-acc-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    const isOpen = item.classList.contains('active');

    // Chiudi tutti
    document.querySelectorAll('.qms-acc-item').forEach(i => {
      i.classList.remove('active');
    });

    // Se non era aperto, aprilo
    if (!isOpen) {
      item.classList.add('active');
    }
  });
});
