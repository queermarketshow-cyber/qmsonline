<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configura la cartella contenente le immagini
$folder = 'images/gallery/';
$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Leggi i file dalla cartella
$files = array_filter(scandir($folder), function($file) use ($folder, $allowed_extensions) {
  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  return in_array($ext, $allowed_extensions) && is_file($folder . $file);
});

// Mischia le immagini
shuffle($files);
?>

<section id="galleria" class="scroll-section">
  <h2>Galleria</h2>
  <p>Immagini, video e opere che raccontano il nostro percorso.</p>
  <div class="gallery">
    <?php foreach ($files as $file): ?>
      <div class="item">
        <img src="<?= $folder . $file ?>" alt="Opera QMS" />
        <div class="overlay"><?= strtoupper(pathinfo($file, PATHINFO_FILENAME)) ?></div>
      </div>
    <?php endforeach; ?>
  </div>
</section>
