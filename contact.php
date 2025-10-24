<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = htmlspecialchars($_POST["name"]);
  $email = htmlspecialchars($_POST["email"]);
  $message = htmlspecialchars($_POST["message"]);

  $sendto = "queermarkertshow@gmail.com";
  $subject = "Nuovo messaggio dal sito";
  $body = "Nome: $name\nEmail: $email\nMessaggio:\n$message";
  $headers = "From: $email";

  mail($sendto, $subject, $body, $headers);
  header("Location: index.html"); // Torna alla home dopo invio
  exit();
}
?>
