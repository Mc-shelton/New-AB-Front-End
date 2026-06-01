<?php
// Polls API: JSON-backed simple polls with IP-based throttling.
// GET  /api/polls.php?id=reading   -> { ok, id, question, options: { A: 1, B: 2 } }
// POST /api/polls.php { id, option, question?, initialOptions?[] }

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key, X-Client-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = __DIR__ . '/../data/polls.json';
@mkdir(dirname($dataFile), 0775, true);
if (!file_exists($dataFile)) { file_put_contents($dataFile, json_encode(['polls' => new stdClass()], JSON_UNESCAPED_SLASHES)); }

$logFile = __DIR__ . '/../data/polls_log.jsonl';

function sid($s) { return substr(preg_replace('/[^a-z0-9_\-]/i','', (string)$s), 0, 64); }
function loadf($p){ $r=@file_get_contents($p); $d=json_decode($r,true); return is_array($d)?$d:null; }
function savef($p,$d){ return file_put_contents($p, json_encode($d, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX)!==false; }
function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $mode = isset($_GET['mode']) ? (string)$_GET['mode'] : '';
  $db = loadf($dataFile) ?: ['polls'=>[]];
  if ($mode === 'all') {
    $adminKey = envv('AB_BLOGS_ADMIN_KEY','');
    $provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
    if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit; }
    echo json_encode(['ok'=>true,'polls'=>$db['polls']]);
    exit;
  }
  $id = isset($_GET['id']) ? sid($_GET['id']) : '';
  if ($id===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'id required']); exit; }
  $poll = $db['polls'][$id] ?? null;
  if (!$poll) { echo json_encode(['ok'=>false,'error'=>'not found']); exit; }
  echo json_encode(['ok'=>true,'id'=>$id,'question'=>$poll['question'],'options'=>$poll['options']]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

$id = isset($data['id']) ? sid($data['id']) : '';
$option = isset($data['option']) ? (string)$data['option'] : '';
if ($id==='' || $option==='') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'id and option required']); exit; }

$db = loadf($dataFile) ?: ['polls'=>[]];
if (!isset($db['polls'][$id])) {
  // Create poll on first write using provided question/options (open creation)
  $question = isset($data['question']) ? trim((string)$data['question']) : 'Poll';
  $initial = isset($data['initialOptions']) && is_array($data['initialOptions']) ? $data['initialOptions'] : [];
  if (empty($initial)) { $initial = [$option]; }
  $opts = [];
  foreach ($initial as $o) { $opts[(string)$o] = 0; }
  $db['polls'][$id] = [ 'question' => $question, 'options' => $opts ];
}

// Ensure option exists
if (!isset($db['polls'][$id]['options'][$option])) { $db['polls'][$id]['options'][$option] = 0; }

// Basic daily limit per client/id
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$cid = isset($_SERVER['HTTP_X_CLIENT_ID']) ? preg_replace('/[^a-z0-9]/i','', (string)$_SERVER['HTTP_X_CLIENT_ID']) : '';
$client = $cid !== '' ? $cid : $ip;
$lines = @file($logFile, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) ?: [];
$now = time(); $day = 86400; $dup=false;
for ($i = count($lines)-1; $i >= 0 && $i >= count($lines)-5000; $i--) {
  $obj = json_decode($lines[$i], true);
  if (!is_array($obj)) continue;
  $matchClient = isset($obj['cid']) ? ($obj['cid'] === $client) : (($obj['ip']??'')===$client);
  if (!$matchClient) continue;
  if (($obj['id']??'')!==$id) continue;
  if (($obj['option']??'')!==$option) continue; // throttle per option so multiple choices can be recorded
  $ts = strtotime($obj['ts']??'') ?: 0;
  if ($ts && ($now - $ts) < $day) { $dup=true; break; }
}

if (!$dup) {
  $db['polls'][$id]['options'][$option] = (int)$db['polls'][$id]['options'][$option] + 1;
  savef($dataFile, $db);
}

@file_put_contents($logFile, json_encode(['ts'=>gmdate('c'),'ip'=>$ip,'cid'=>$cid,'id'=>$id,'option'=>$option, 'dup'=>$dup], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode(['ok'=>true,'id'=>$id,'question'=>$db['polls'][$id]['question'],'options'=>$db['polls'][$id]['options'],'duplicate'=>$dup]);
exit;
