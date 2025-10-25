<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = htmlspecialchars($_POST["name"]);
  $email = htmlspecialchars($_POST["email"]);
  $message = htmlspecialchars($_POST["message"]);

  $sendto = "queermarketshow@gmail.com"; // <-- Inserisci qui l'indirizzo corretto

  $subject = "Nuovo messaggio da $name";
  $headers = "From: $email" . "\r\n" .
             "Reply-To: $email" . "\r\n" .
             "Content-Type: text/plain; charset=UTF-8";

  $body = "Nome: $name\nEmail: $email\nMessaggio:\n$message";

  if (mail($sendto, $subject, $body, $headers)) {
    echo "Messaggio inviato con successo.";
  } else {
    echo "Errore nell'invio del messaggio.";
  }
}
?>
