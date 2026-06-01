<?php
// Reactions API: stores per-slug reaction counts in JSON.
// GET  /api/reactions.php?slug=abc            -> { ok, counts: { like: 1, love: 2, ... } }
// POST /api/reactions.php { slug, reaction }  -> { ok, counts } (idempotent-ish per ip/slug/reaction window)

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = __DIR__ . '/../data/reactions.json';
@mkdir(dirname($dataFile), 0775, true);
if (!file_exists($dataFile)) { file_put_contents($dataFile, json_encode(['slugs' => new stdClass()], JSON_UNESCAPED_SLASHES)); }

$logFile = __DIR__ . '/../data/reactions_log.jsonl';

// Allowed reaction keys (keep aligned with frontend)
$allowedReactions = ['like','love','insightful','pray','clap'];

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

function sanitize_slug($s) {
  $s = (string)$s;
  $s = preg_replace('/[^a-z0-9\-]/i','', $s);
  return substr($s, 0, 128);
}

function load_json_file($path) {
  $raw = @file_get_contents($path);
  if ($raw === false) return null;
  $data = json_decode($raw, true);
  return is_array($data) ? $data : null;
}

function save_json_file($path, $data) {
  return file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $mode = isset($_GET['mode']) ? (string)$_GET['mode'] : '';
  $db = load_json_file($dataFile) ?: ['slugs'=>[]];
  if ($mode === 'all') {
    $adminKey = envv('AB_BLOGS_ADMIN_KEY','');
    $provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
    if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit; }
    echo json_encode(['ok'=>true,'slugs'=>$db['slugs']]);
    exit;
  }
  $slug = isset($_GET['slug']) ? sanitize_slug($_GET['slug']) : '';
  if ($slug === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'slug required']); exit; }
  $counts = ($db['slugs'][$slug] ?? []);
  echo json_encode(['ok'=>true,'counts'=>$counts]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

$slug = isset($data['slug']) ? sanitize_slug($data['slug']) : '';
$reaction = isset($data['reaction']) ? (string)$data['reaction'] : '';
$undo = isset($data['undo']) ? (bool)$data['undo'] : false;

if ($slug === '' || $reaction === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'slug and reaction required']); exit; }
if (!in_array($reaction, $allowedReactions, true)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid reaction']); exit; }

// Basic anti-abuse: throttle duplicate ip+slug+reaction within 6h
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$cid = isset($_SERVER['HTTP_X_CLIENT_ID']) ? preg_replace('/[^a-z0-9]/i','', (string)$_SERVER['HTTP_X_CLIENT_ID']) : '';
$client = $cid !== '' ? $cid : $ip;
$now = time();
$window = 6 * 3600;

$recentLines = @file($logFile, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) ?: [];
$duplicate = false;
$lastAction = null; // 'add' | 'undo' | 'dup'
for ($i = count($recentLines)-1; $i >= 0 && $i >= count($recentLines)-5000; $i--) {
  $obj = json_decode($recentLines[$i], true);
  if (!is_array($obj)) continue;
  // prefer client id match if present, else ip
  $matchClient = isset($obj['cid']) ? ($obj['cid'] === $client) : (($obj['ip'] ?? '') === $client);
  if (!$matchClient) continue;
  if (($obj['slug'] ?? '') !== $slug) continue;
  if (($obj['reaction'] ?? '') !== $reaction) continue;
  $ts = strtotime($obj['ts'] ?? '') ?: 0;
  if (!$ts || ($now - $ts) >= $window) continue;
  // Found the latest relevant action within window
  $lastAction = isset($obj['action']) ? (string)$obj['action'] : 'add';
  break;
}

if ($lastAction !== null) {
  if ($undo) {
    // If last action was already an undo, consider this a duplicate; otherwise allow
    $duplicate = ($lastAction === 'undo');
  } else {
    // We are adding; it's a duplicate only if the last action was an add
    $duplicate = ($lastAction === 'add');
  }
}

$db = load_json_file($dataFile) ?: ['slugs' => []];
if (!isset($db['slugs'][$slug])) $db['slugs'][$slug] = [];
if (!isset($db['slugs'][$slug][$reaction])) $db['slugs'][$slug][$reaction] = 0;

if ($undo) {
  $db['slugs'][$slug][$reaction] = max(0, (int)$db['slugs'][$slug][$reaction] - 1);
} else if (!$duplicate) {
  $db['slugs'][$slug][$reaction] = (int)$db['slugs'][$slug][$reaction] + 1;
}

save_json_file($dataFile, $db);

// Log after deciding action
@file_put_contents($logFile, json_encode([
  'ts'=>gmdate('c'), 'ip'=>$ip, 'cid'=>$cid, 'slug'=>$slug, 'reaction'=>$reaction,
  'action' => $undo ? 'undo' : ($duplicate ? 'dup' : 'add'),
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND|LOCK_EX);

echo json_encode(['ok'=>true,'counts'=>$db['slugs'][$slug], 'duplicate'=>$duplicate]);
exit;
