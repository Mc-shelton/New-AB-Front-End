<?php
// Generates static share pages for badges with Open Graph/Twitter tags.
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$adminKey = envv('AB_BLOGS_ADMIN_KEY',''); // reuse same key
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

// Accept either { items: [...] } or a single object
$items = [];
if (isset($payload['items']) && is_array($payload['items'])) {
  $items = $payload['items'];
} else {
  $items = [$payload];
}

$outDir = __DIR__ . '/../share';
@mkdir($outDir, 0775, true);

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'adventband.org';
$base = $scheme . '://' . $host;

function esc($s){ return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

$count = 0; $ids = [];
foreach ($items as $b) {
  if (!isset($b['id']) || !isset($b['title'])) continue;
  $id = $b['id'];
  $title = $b['title'];
  $description = isset($b['description']) ? $b['description'] : '';
  $owner = isset($b['ownerName']) ? $b['ownerName'] : '';
  $issued = isset($b['issuedAt']) ? $b['issuedAt'] : '';
  $image = isset($b['image']) && $b['image'] ? $b['image'] : ($base . '/open/badges/' . rawurlencode($id) . '.png');
  $to = $base . '/badges?id=' . rawurlencode($id);

  $desc = trim($description);
  if ($owner || $issued) {
    $extra = ' Holder: ' . $owner . ($issued ? ' • Issued: ' . $issued : '');
    $desc = $desc ? ($desc . ' ' . $extra) : $extra;
  }

  $shareHtml = '<!doctype html><html lang="en"><head>'
    . '<meta charset="utf-8" />'
    . '<meta name="viewport" content="width=device-width, initial-scale=1" />'
    . '<title>' . esc($title) . ' — Advent Band Badge</title>'
    . '<meta property="og:title" content="' . esc($title) . ' — Advent Band Badge" />'
    . '<meta property="og:description" content="' . esc($desc) . '" />'
    . '<meta property="og:image" content="' . esc($image) . '" />'
    . '<meta property="og:url" content="' . esc($to) . '" />'
    . '<meta property="og:type" content="website" />'
    . '<meta name="twitter:card" content="summary_large_image" />'
    . '<meta name="twitter:title" content="' . esc($title) . ' — Advent Band Badge" />'
    . '<meta name="twitter:description" content="' . esc($desc) . '" />'
    . '<meta name="twitter:image" content="' . esc($image) . '" />'
    . '<link rel="canonical" href="' . esc($to) . '" />'
    . '<meta http-equiv="refresh" content="0; url=' . esc($to) . '" />'
    . '<script>location.replace(' . json_encode($to) . ');</script>'
    . '</head><body><noscript>Redirecting… <a href="' . esc($to) . '">Click here</a>.</noscript></body></html>';

  $ok = file_put_contents($outDir . '/' . $id . '.html', $shareHtml);
  if ($ok !== false) { $count++; $ids[] = $id; }
}

echo json_encode(['ok'=>true,'count'=>$count,'ids'=>$ids]);
@file_put_contents(__DIR__ . '/../data/admin_activity.jsonl', json_encode([
  'ts' => gmdate('c'),
  'type' => 'badges.generate_share',
  'message' => 'Generated badge share pages',
  'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
  'meta' => ['count' => $count, 'ids' => $ids],
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
exit;
