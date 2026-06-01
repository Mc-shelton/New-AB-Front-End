<?php
// Subscribers admin/list endpoint
// GET  /api/subscribers.php?mode=list   (admin) -> { ok, items: [ {email, status, created_at, source} ] }
// POST /api/subscribers.php { email }    -> add/activate subscriber

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$subsFile = __DIR__ . '/../data/subscribers.json';
@mkdir(dirname($subsFile), 0775, true);
if (!file_exists($subsFile)) { file_put_contents($subsFile, json_encode(['items'=>[]], JSON_UNESCAPED_SLASHES)); }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $mode = isset($_GET['mode']) ? (string)$_GET['mode'] : 'list';
  if ($mode !== 'list') { echo json_encode(['ok'=>false,'error'=>'unknown mode']); exit; }
  $adminKey = envv('AB_BLOGS_ADMIN_KEY','');
  $provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
  if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit; }
  $raw = @file_get_contents($subsFile);
  $obj = json_decode($raw, true);
  $items = (is_array($obj) && isset($obj['items']) && is_array($obj['items'])) ? $obj['items'] : [];
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

$email = isset($data['email']) ? trim((string)$data['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Valid email required']); exit; }
$source = isset($data['source']) ? trim((string)$data['source']) : 'api';

$raw = @file_get_contents($subsFile);
$obj = json_decode($raw, true);
if (!is_array($obj)) $obj = ['items'=>[]];
if (!isset($obj['items']) || !is_array($obj['items'])) $obj['items'] = [];
$lower = strtolower($email);
$exists = false;
foreach ($obj['items'] as &$it) {
  if (strtolower($it['email'] ?? '') === $lower) { $exists = true; $it['status'] = 'active'; break; }
}
if (!$exists) {
  $obj['items'][] = [ 'email'=>$email, 'source'=>$source, 'status'=>'active', 'created_at'=>gmdate('c') ];
}
$ok = @file_put_contents($subsFile, json_encode($obj, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
if (!$ok) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Write failed']); exit; }
echo json_encode(['ok'=>true]);
exit;

