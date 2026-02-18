
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("qmsForm");
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Stato "invio in corso"
    form.classList.add("sending");
    form.querySelector("button").disabled = true;
    status.textContent = "Invio in corso...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" },
      });

      if (response.ok) {
        // trasformazione visiva: il form diventa "GRAZIE!"
        form.innerHTML = `
          <div class="form-thanks">
            <h2>GRAZIE!</h2>
            <p>Abbiamo ricevuto il tuo messaggio.<br>
            Ti risponderemo presto 💌</p>
          </div>
        `;
        form.classList.add("sent");
      } else {
        throw new Error("Errore di rete");
      }
    } catch (error) {
      form.classList.remove("sending");
      form.querySelector("button").disabled = false;
      status.textContent =
        "Qualcosa è andato storto. Riprova oppure scrivici su Instagram.";
    }
  });
});

