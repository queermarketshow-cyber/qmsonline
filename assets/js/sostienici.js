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
const cards = document.querySelectorAll('.sost-card[data-card]');
const lightbox = document.getElementById('sost-lightbox');
const lightboxBody = lightbox.querySelector('.sost-lightbox-body');
const closeBtn = lightbox.querySelector('.sost-lightbox-close');

const sostContent = {
  1: `
    <p>
      Da anni costruiamo un nodo vivo, necessario, ostinato.  
      Ora serve un salto collettivo: trasformare il Queer Market Show in un 
      <strong>Festival dal basso</strong>, stabile, accessibile, radicale.  
      Un luogo che non chiede permesso per esistere.
    </p>
  `,

  2: `
    <p>
      Siamo il collettivo che anima il QMS a Lecce: corpi, mani, desideri, 
      lavoro invisibile e cura condivisa.  
      Dopo tante edizioni, vogliamo dare forma a un Festival che rispecchi 
      davvero la nostra comunità:  
      <strong>libero, autogestito, visibile</strong>.
    </p>
  `,

  3: `
    <p>
      Il QMS nasce da un’urgenza: creare uno spazio sicuro, radicale, 
      contaminato e collettivo.  
      Qui l’arte, l’artigianato e la socialità diventano strumenti di 
      <strong>autodeterminazione</strong>, cura e resistenza culturale.  
      Uno spazio che non si limita a esistere: <strong>si prende spazio</strong>.
    </p>
  `,

  4: `
    <p>
      Costruire un Festival è un <strong>investimento politico</strong>.  
      Finora tutto è stato possibile grazie a volontariə, autofinanziamento, 
      caparbietà e amore.  
      Ma per crescere serve un passo in più.
    </p>
    <p>
      Il tuo contributo non è una donazione:  
      è un <strong>atto militante</strong> che sostiene autonomia, dignità del lavoro, 
      continuità e possibilità.
    </p>
  `,

  5: `
    <ul class="sost-list">
      <li><strong>Riconoscimento Economico:</strong> compensi degni per performer, musicistə e artistə.</li>
      <li><strong>Spazio e Accessibilità:</strong> affitto di un luogo adeguato, sicuro e accessibile.</li>
      <li><strong>Strutture Minime:</strong> audio/luci essenziali, gazebo, sedie, pannelli.</li>
      <li><strong>Spese Vive:</strong> rimborsi equi per chi lavora alla logistica.</li>
      <li><strong>Materiali per l’Espressione:</strong> laboratori, scenografie, allestimenti politici.</li>
    </ul>
  `,

  6: `
    <p>
      Ogni contributo mantiene libero questo spazio, amplifica voci spesso 
      silenziate e sostiene concretamente il lavoro artistico e politico 
      della nostra comunità.
    </p>
    <p>
      È un gesto che dice: <strong>questo spazio deve continuare a esistere</strong>.
    </p>
  `,

  7: `
    <p>
      Facciamo in modo che questo spazio resti vivo, necessario, rumoroso.  
      <strong>Sostieni l’autonomia e l’etica del Queer Market Show Festival.</strong>
    </p>
    <p>
      Grazie — dal collettivo che lo costruisce ogni giorno.
    </p>
  `
};

cards.forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.card;
    lightboxBody.innerHTML = sostContent[id];
    lightbox.classList.add('show');
  });
});

closeBtn.addEventListener('click', () => {
  lightbox.classList.remove('show');
});
