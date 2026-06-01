<?php
// Admin activity log API: GET (list recent), POST (append)
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$adminKey = envv('AB_BLOGS_ADMIN_KEY','');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

$logFile = __DIR__ . '/../data/admin_activity.jsonl';
@mkdir(dirname($logFile), 0775, true);
if (!file_exists($logFile)) { file_put_contents($logFile, ''); }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $limit = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 200;
  $type = isset($_GET['type']) ? (string)$_GET['type'] : '';
  $lines = @file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
  $lines = array_slice($lines, -$limit);
  $items = [];
  foreach ($lines as $ln) {
    $obj = json_decode($ln, true);
    if (!is_array($obj)) continue;
    if ($type && ($obj['type'] ?? '') !== $type) continue;
    $items[] = $obj;
  }
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }
  $event = [
    'ts' => gmdate('c'),
    'type' => (string)($data['type'] ?? 'custom'),
    'message' => (string)($data['message'] ?? ''),
    'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
    'meta' => $data['meta'] ?? new stdClass(),
  ];
  $ok = file_put_contents($logFile, json_encode($event, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
  if ($ok === false) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Write failed']); exit; }
  echo json_encode(['ok'=>true]);
  exit;
}

http_response_code(405);
echo json_encode(['ok'=>false,'error'=>'Method not allowed']);
exit;

