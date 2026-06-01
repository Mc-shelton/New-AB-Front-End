<?php
// Simple blog content API: GET returns JSON list, POST updates it (admin only)
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = __DIR__ . '/../data/blogs.json';
if (!file_exists($dataFile)) {
  @mkdir(dirname($dataFile), 0775, true);
  file_put_contents($dataFile, json_encode([]));
}

function env($k, $d=''){
  $v = getenv($k); if ($v !== false && $v !== '') return $v;
  if (isset($_SERVER[$k]) && $_SERVER[$k] !== '') return $_SERVER[$k];
  if (isset($_ENV[$k]) && $_ENV[$k] !== '') return $_ENV[$k];
  return $d;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $json = file_get_contents($dataFile);
  echo $json === false ? '[]' : $json; exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit;
}

$adminKey = env('AB_BLOGS_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

// Basic validation: expect an array of objects with title,url,slug
if (!isset($payload['items']) || !is_array($payload['items'])) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing items']); exit;
}
foreach ($payload['items'] as $i => $b) {
  if (!isset($b['title'],$b['url'],$b['slug'])) {
    http_response_code(400); echo json_encode(['ok'=>false,'error'=>"Item $i missing title/url/slug"]); exit;
  }
}

$ok = file_put_contents($dataFile, json_encode($payload['items'], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX);
if ($ok === false) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Write failed']); exit; }

// Log activity
@file_put_contents(__DIR__ . '/../data/admin_activity.jsonl', json_encode([
  'ts' => gmdate('c'),
  'type' => 'blogs.save',
  'message' => 'Saved blogs.json',
  'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
  'meta' => ['count' => count($payload['items'])],
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode(['ok'=>true]);
exit;
