<?php
// Public, minimal event tracker (no auth) — logs whitelisted events.
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Client-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }

$type = isset($data['type']) ? (string)$data['type'] : '';

// Whitelist event types
$allowed = ['blog.view', 'page.view', 'event'];
if (!in_array($type, $allowed, true)) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }

$logFile = __DIR__ . '/../data/analytics.jsonl';
@mkdir(dirname($logFile), 0775, true);
if (!file_exists($logFile)) { file_put_contents($logFile, ''); }

// Basic fields
$name = isset($data['name']) ? substr(preg_replace('/[^a-z0-9_\.\-]/i','', (string)$data['name']), 0, 64) : '';
$cid = isset($_SERVER['HTTP_X_CLIENT_ID']) ? substr(preg_replace('/[^a-z0-9]/i','', (string)$_SERVER['HTTP_X_CLIENT_ID']), 0, 64) : '';
if (!$cid && isset($data['cid'])) { $cid = substr(preg_replace('/[^a-z0-9]/i','', (string)$data['cid']), 0, 64); }

$event = [
  'ts' => gmdate('c'),
  'type' => $type,
  'name' => $type === 'event' ? $name : '',
  'slug' => isset($data['slug']) ? substr(preg_replace('/[^a-z0-9\-]/i','', (string)$data['slug']), 0, 128) : '',
  'src' => isset($data['src']) ? substr((string)$data['src'], 0, 32) : '', // e.g., 'site' | 'share'
  'ref' => isset($_SERVER['HTTP_REFERER']) ? (string)$_SERVER['HTTP_REFERER'] : (string)($data['ref'] ?? ''),
  'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
  'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
  'cid' => $cid,
  'page' => isset($data['page']) ? substr(preg_replace('/[^a-z0-9_\-\/]/i','', (string)$data['page']), 0, 128) : '',
  'path' => isset($data['path']) ? substr((string)$data['path'], 0, 256) : ($_SERVER['REQUEST_URI'] ?? ''),
  'meta' => isset($data['meta']) && is_array($data['meta']) ? $data['meta'] : new stdClass(),
];

// Write
@file_put_contents($logFile, json_encode($event, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
echo json_encode(['ok'=>true]);
exit;
