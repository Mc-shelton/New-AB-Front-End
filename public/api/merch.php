<?php
// Merchandise catalogue API. GET returns list, POST replaces list (requires admin key).
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = __DIR__ . '/../data/merch.json';
if (!file_exists($dataFile)) {
  @mkdir(dirname($dataFile), 0775, true);
  file_put_contents($dataFile, json_encode([]));
}

function envv($key, $default = '') {
  $value = getenv($key);
  if ($value !== false && $value !== '') return $value;
  if (!empty($_SERVER[$key])) return $_SERVER[$key];
  if (!empty($_ENV[$key])) return $_ENV[$key];
  return $default;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $json = file_get_contents($dataFile);
  echo $json === false ? '[]' : $json;
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$adminKey = envv('AB_MERCH_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
$provided = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload']);
  exit;
}

if (!isset($payload['items']) || !is_array($payload['items'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing items']);
  exit;
}

foreach ($payload['items'] as $i => $m) {
  if (!isset($m['name'], $m['slug'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Item $i missing name or slug"]);
    exit;
  }
  if (!isset($m['price'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Item $i missing price"]);
    exit;
  }
  if (!is_numeric($m['price'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Item $i price must be numeric"]);
    exit;
  }
  $payload['items'][$i]['price'] = (float)$m['price'];
}

$encoded = json_encode($payload['items'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($encoded === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Encode failed']);
  exit;
}

if (file_put_contents($dataFile, $encoded, LOCK_EX) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Write failed']);
  exit;
}

@file_put_contents(
  __DIR__ . '/../data/admin_activity.jsonl',
  json_encode([
    'ts' => gmdate('c'),
    'type' => 'merch.save',
    'message' => 'Saved merch.json',
    'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
    'meta' => ['count' => count($payload['items'])],
  ], JSON_UNESCAPED_SLASHES) . "\n",
  FILE_APPEND | LOCK_EX
);

echo json_encode(['ok' => true]);
exit;
