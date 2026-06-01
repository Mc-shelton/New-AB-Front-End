<?php
// Generates static share pages for blogs with Open Graph/Twitter tags.
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$adminKey = envv('AB_BLOGS_ADMIN_KEY','');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

$dataFile = __DIR__ . '/../data/blogs.json';
$outDir = __DIR__ . '/../share/blogs';
if (!file_exists($dataFile)) { http_response_code(404); echo json_encode(['ok'=>false,'error'=>'blogs.json not found']); exit; }

$raw = file_get_contents($dataFile); $items = json_decode($raw, true);
if (!is_array($items)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid blogs.json']); exit; }

@mkdir($outDir, 0775, true);

// Build base URL from request
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'adventband.org';
$base = $scheme . '://' . $host;

function esc($s){ return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

$fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60';

$count = 0; $slugs = [];
foreach ($items as $b) {
  if (!isset($b['slug']) || !isset($b['title'])) continue;
  $slug = $b['slug'];
  $title = $b['title'];
  $summary = isset($b['summary']) ? $b['summary'] : '';
  $image = isset($b['image']) && $b['image'] ? $b['image'] : $fallbackImage;
  $url = $base . '/blogs/' . rawurlencode($slug);
  $shareHtml = '<!doctype html><html lang="en"><head>'
    . '<meta charset="utf-8" />'
    . '<meta name="viewport" content="width=device-width, initial-scale=1" />'
    . '<title>' . esc($title) . ' — Advent Band Blog</title>'
    . '<meta property="og:title" content="' . esc($title) . ' — Advent Band" />'
    . '<meta property="og:description" content="' . esc($summary) . '" />'
    . '<meta property="og:image" content="' . esc($image) . '" />'
    . '<meta property="og:url" content="' . esc($url) . '" />'
    . '<meta property="og:type" content="article" />'
    . '<meta name="twitter:card" content="summary_large_image" />'
    . '<meta name="twitter:title" content="' . esc($title) . ' — Advent Band" />'
    . '<meta name="twitter:description" content="' . esc($summary) . '" />'
    . '<meta name="twitter:image" content="' . esc($image) . '" />'
    . '<link rel="canonical" href="' . esc($url) . '" />'
    . '<meta http-equiv="refresh" content="0; url=' . esc($url) . '" />'
    . '<script>location.replace(' . json_encode($url) . ');</script>'
    . '</head><body><noscript>Redirecting… <a href="' . esc($url) . '">Click here</a>.</noscript></body></html>';
  $ok = file_put_contents($outDir . '/' . $slug . '.html', $shareHtml);
  if ($ok !== false) { $count++; $slugs[] = $slug; }
}

echo json_encode(['ok'=>true,'count'=>$count,'slugs'=>$slugs]);
@file_put_contents(__DIR__ . '/../data/admin_activity.jsonl', json_encode([
  'ts' => gmdate('c'),
  'type' => 'blogs.generate_share',
  'message' => 'Generated blog share pages',
  'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
  'meta' => ['count' => $count, 'slugs' => $slugs],
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
exit;
