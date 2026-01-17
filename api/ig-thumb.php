<?php
header('Content-Type: application/json');

$user = $_GET['u'] ?? null;
if (!$user) {
  echo json_encode(["error" => "missing username"]);
  exit;
}

$context = stream_context_create([
  "http" => [
    "header" => "User-Agent: Mozilla/5.0"
  ]
]);

$json = @file_get_contents("https://www.instagram.com/$user/?__a=1&__d=dis", false, $context);
$data = json_decode($json, true);

$url = $data['graphql']['user']['profile_pic_url_hd'] ?? null;

echo json_encode(["url" => $url]);
