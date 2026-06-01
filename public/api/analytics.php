<?php
// Admin analytics: aggregates public tracker logs.
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$adminKey = envv('AB_BLOGS_ADMIN_KEY','');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

$mode = $_GET['mode'] ?? 'blog_views';
$unique = isset($_GET['unique']) ? (int)$_GET['unique'] : 0; // if 1, aggregate unique clients by cid/ip
$sinceDays = isset($_GET['since']) ? intval($_GET['since']) : 30;
$sinceTs = time() - max(0, $sinceDays) * 86400;

$logFile = __DIR__ . '/../data/analytics.jsonl';
if (!file_exists($logFile)) { echo json_encode(['ok'=>true,'items'=>[]]); exit; }

$lines = @file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

if ($mode === 'blog_views') {
  $counts = [];
  $seen = [];
  foreach ($lines as $ln) {
    $obj = json_decode($ln, true);
    if (!is_array($obj)) continue;
    if (($obj['type'] ?? '') !== 'blog.view') continue;
    $ts = strtotime($obj['ts'] ?? '') ?: 0;
    if ($sinceDays > 0 && $ts && $ts < $sinceTs) continue;
    $slug = $obj['slug'] ?? '';
    if (!$slug) continue;
    if (!isset($counts[$slug])) $counts[$slug] = ['slug'=>$slug, 'total'=>0, 'unique'=>0, 'lastTs'=>0, 'site'=>0, 'share'=>0];
    $counts[$slug]['total']++;
    if ($unique) {
      $client = ($obj['cid'] ?? '') ?: ($obj['ip'] ?? '');
      if ($client) {
        $k = $slug.'\t'.$client;
        if (!isset($seen[$k])) { $seen[$k]=1; $counts[$slug]['unique']++; }
      }
    }
    $src = $obj['src'] ?? '';
    if ($src === 'site') $counts[$slug]['site']++;
    if ($src === 'share') $counts[$slug]['share']++;
    if ($ts > $counts[$slug]['lastTs']) $counts[$slug]['lastTs'] = $ts;
  }
  $items = array_values($counts);
  usort($items, function($a,$b){ return $b['total'] <=> $a['total']; });
  foreach ($items as &$it) { $it['lastSeen'] = $it['lastTs'] ? gmdate('c', $it['lastTs']) : null; unset($it['lastTs']); }
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

if ($mode === 'page_views') {
  $counts = [];
  $seen = [];
  foreach ($lines as $ln) {
    $obj = json_decode($ln, true);
    if (!is_array($obj)) continue;
    if (($obj['type'] ?? '') !== 'page.view') continue;
    $ts = strtotime($obj['ts'] ?? '') ?: 0;
    if ($sinceDays > 0 && $ts && $ts < $sinceTs) continue;
    $page = $obj['page'] ?: ($obj['path'] ?? '');
    if (!$page) continue;
    if (!isset($counts[$page])) $counts[$page] = ['page'=>$page, 'total'=>0, 'unique'=>0, 'lastTs'=>0];
    $counts[$page]['total']++;
    if ($unique) {
      $client = ($obj['cid'] ?? '') ?: ($obj['ip'] ?? '');
      if ($client) {
        $k = $page.'\t'.$client;
        if (!isset($seen[$k])) { $seen[$k]=1; $counts[$page]['unique']++; }
      }
    }
    if ($ts > $counts[$page]['lastTs']) $counts[$page]['lastTs'] = $ts;
  }
  $items = array_values($counts);
  usort($items, function($a,$b){ return $b['total'] <=> $a['total']; });
  foreach ($items as &$it) { $it['lastSeen'] = $it['lastTs'] ? gmdate('c', $it['lastTs']) : null; unset($it['lastTs']); }
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

if ($mode === 'events') {
  $counts = [];
  $filterName = isset($_GET['name']) ? (string)$_GET['name'] : '';
  foreach ($lines as $ln) {
    $obj = json_decode($ln, true);
    if (!is_array($obj)) continue;
    if (($obj['type'] ?? '') !== 'event') continue;
    $ts = strtotime($obj['ts'] ?? '') ?: 0;
    if ($sinceDays > 0 && $ts && $ts < $sinceTs) continue;
    $name = $obj['name'] ?? '';
    if (!$name) continue;
    if ($filterName && $name !== $filterName) continue;
    if (!isset($counts[$name])) $counts[$name] = ['name'=>$name, 'total'=>0, 'lastTs'=>0];
    $counts[$name]['total']++;
    if ($ts > $counts[$name]['lastTs']) $counts[$name]['lastTs'] = $ts;
  }
  $items = array_values($counts);
  usort($items, function($a,$b){ return $b['total'] <=> $a['total']; });
  foreach ($items as &$it) { $it['lastSeen'] = $it['lastTs'] ? gmdate('c', $it['lastTs']) : null; unset($it['lastTs']); }
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

if ($mode === 'stream') {
  $limit = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 200;
  $typeFilter = isset($_GET['type']) ? (string)$_GET['type'] : '';
  $nameFilter = isset($_GET['name']) ? (string)$_GET['name'] : '';
  $lines = @file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
  $lines = array_slice($lines, -$limit);
  $items = [];
  foreach ($lines as $ln) {
    $obj = json_decode($ln, true);
    if (!is_array($obj)) continue;
    if ($typeFilter && ($obj['type'] ?? '') !== $typeFilter) continue;
    if ($nameFilter && ($obj['name'] ?? '') !== $nameFilter) continue;
    $items[] = $obj;
  }
  echo json_encode(['ok'=>true,'items'=>$items]);
  exit;
}

echo json_encode(['ok'=>false,'error'=>'Unknown mode']);
exit;
