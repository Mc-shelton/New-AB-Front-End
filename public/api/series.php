<?php
// Series content API: GET returns all series; POST replaces them (admin only).
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = __DIR__ . '/../data/series.json';
if (!file_exists($dataFile)) {
  @mkdir(dirname($dataFile), 0775, true);
  file_put_contents($dataFile, json_encode([]));
}

function series_env($key, $default = '') {
  $value = getenv($key);
  if ($value !== false && $value !== '') return $value;
  if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
  if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
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

$adminKey = series_env('AB_BLOGS_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload) || !isset($payload['items']) || !is_array($payload['items'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing items']);
  exit;
}

$seenIds = [];
foreach ($payload['items'] as $index => $series) {
  if (!isset($series['seriesId'], $series['title'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Series $index missing seriesId/title"]);
    exit;
  }
  $seriesId = trim((string)$series['seriesId']);
  if ($seriesId === '' || isset($seenIds[$seriesId])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Series $index has an empty or duplicate seriesId"]);
    exit;
  }
  $seenIds[$seriesId] = true;
}

$ok = file_put_contents(
  $dataFile,
  json_encode($payload['items'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
  LOCK_EX
);
if ($ok === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Write failed']);
  exit;
}

@file_put_contents(__DIR__ . '/../data/admin_activity.jsonl', json_encode([
  'ts' => gmdate('c'),
  'type' => 'series.save',
  'message' => 'Saved series.json',
  'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
  'meta' => ['count' => count($payload['items'])],
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode(['ok' => true]);
exit;
