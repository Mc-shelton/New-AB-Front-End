<?php
// Newsletter subscription relay for Advent Band.
// Accepts JSON: { email: string, source?: string }

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Origin: *');
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
  exit;
}

header('Access-Control-Allow-Origin: *');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
  exit;
}

function val($arr, $key) {
  return isset($arr[$key]) ? trim((string)$arr[$key]) : '';
}

$email = val($data, 'email');
$source = val($data, 'source');

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Valid email required']);
  exit;
}

// Simple honeypot (optional)
if (isset($data['website']) && $data['website'] !== '') {
  http_response_code(200);
  echo json_encode(['ok' => true, 'detail' => 'ignored']);
  exit;
}

$to = env('AB_SUBSCRIBE_TO', env('AB_MAIL_TO', 'people@adventband.org'));
$subject = 'Newsletter Subscription';

$body = "Newsletter subscription request\n"
      . "Source: " . ($source ?: 'web') . "\n"
      . "Email: $email\n";

// From headers: use a domain you control to avoid SPF/DMARC issues.
$from = env('AB_MAIL_FROM', 'system@adventband.org');
$fromName = 'Advent Band';
$replyTo = $email;

// Try SMTP first if configured
$smtpHost = env('AB_SMTP_HOST', 'mail.adventband.org');
$smtpPort = env('AB_SMTP_PORT', '465');
$smtpUser = env('AB_SMTP_USER', 'system@adventband.org');
$smtpPass = env('AB_SMTP_PASS', 'm@jiMot0');
$smtpSecure = strtolower(env('AB_SMTP_SECURE', 'ssl')); // ssl|tls|none

if ($smtpHost && $smtpUser && $smtpPass) {
  $smtpResult = smtp_send([
    'host' => $smtpHost,
    'port' => (int)$smtpPort,
    'secure' => $smtpSecure,
    'username' => $smtpUser,
    'password' => $smtpPass,
  ], $from, $fromName, $to, $subject, $body, $replyTo);
  if ($smtpResult === true) {
    echo json_encode(['ok' => true, 'detail' => 'sent via smtp', 'persisted' => $_persisted]);
    exit;
  }
}

$headers = [];
$headers[] = 'From: ' . $fromName . ' <' . $from . '>';
$headers[] = 'Reply-To: ' . $replyTo;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$sent = @mail($to, $subject, $body, implode("\r\n", $headers));
if ($sent) {
  echo json_encode(['ok' => true, 'detail' => 'sent via mail()', 'persisted' => $_persisted]);
  exit;
}

http_response_code(500);
echo json_encode(['ok' => false, 'error' => 'sending failed', 'persisted' => $_persisted]);
exit;

// --- minimal SMTP client (duplicated from send.php to keep endpoint standalone) ---
function smtp_read($fp) {
  $data = '';
  while ($str = fgets($fp, 515)) {
    $data .= $str;
    if (substr($str, 3, 1) == ' ') break;
  }
  return $data;
}

function smtp_cmd($fp, $cmd, $expect) {
  if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
  $resp = smtp_read($fp);
  if (substr($resp, 0, 3) != (string)$expect) {
    return $resp ?: 'Unexpected SMTP response';
  }
  return true;
}

function smtp_send($cfg, $from, $fromName, $to, $subject, $body, $replyTo) {
  $host = $cfg['host'];
  $port = (int)$cfg['port'];
  $secure = $cfg['secure']; // ssl|tls|none
  $username = $cfg['username'];
  $password = $cfg['password'];

  $remote = ($secure === 'ssl') ? 'ssl://' . $host : $host;
  $fp = @stream_socket_client($remote . ':' . $port, $errno, $errstr, 30, STREAM_CLIENT_CONNECT);
  if (!$fp) return "Connect failed: $errstr ($errno)";

  $r = smtp_read($fp);
  if (substr($r,0,3) != '220') return "Server greeting failed: $r";

  $domain = 'adventband.org';
  $ok = smtp_cmd($fp, 'EHLO ' . $domain, 250);
  if ($ok !== true) return $ok;

  if ($secure === 'tls') {
    $ok = smtp_cmd($fp, 'STARTTLS', 220);
    if ($ok !== true) return $ok;
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) return 'TLS upgrade failed';
    $ok = smtp_cmd($fp, 'EHLO ' . $domain, 250);
    if ($ok !== true) return $ok;
  }

  $ok = smtp_cmd($fp, 'AUTH LOGIN', 334);
  if ($ok !== true) return $ok;
  $ok = smtp_cmd($fp, base64_encode($username), 334);
  if ($ok !== true) return $ok;
  $ok = smtp_cmd($fp, base64_encode($password), 235);
  if ($ok !== true) return $ok;

  $ok = smtp_cmd($fp, 'MAIL FROM: <' . $from . '>', 250);
  if ($ok !== true) return $ok;
  $ok = smtp_cmd($fp, 'RCPT TO: <' . $to . '>', 250);
  if ($ok !== true) return $ok;
  $ok = smtp_cmd($fp, 'DATA', 354);
  if ($ok !== true) return $ok;

  $headers = [];
  $headers[] = 'From: ' . encode_header($fromName) . ' <' . $from . '>';
  $headers[] = 'To: <' . $to . '>';
  $headers[] = 'Reply-To: ' . $replyTo;
  $headers[] = 'Subject: ' . encode_header($subject);
  $headers[] = 'MIME-Version: 1.0';
  $headers[] = 'Content-Type: text/plain; charset=UTF-8';
  $headers[] = 'Content-Transfer-Encoding: 8bit';

  $msg = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace("/(\r?\n)\./", "$1..", $body) . "\r\n.";
  fwrite($fp, $msg . "\r\n");
  $ok = smtp_cmd($fp, null, 250);
  if ($ok !== true) return $ok;
  smtp_cmd($fp, 'QUIT', 221);
  fclose($fp);
  return true;
}

function encode_header($str) {
  if (!preg_match('/[\x80-\xFF]/', $str)) return $str;
  return '=?UTF-8?B?' . base64_encode($str) . '?=';
}

function env($key, $default='') {
  $v = getenv($key);
  if ($v !== false && $v !== '') return $v;
  if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
  if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
  return $default;
}
// Persist subscriber to JSON list (dedup by email)
$subsFile = __DIR__ . '/../data/subscribers.json';
@mkdir(dirname($subsFile), 0775, true);
if (!file_exists($subsFile)) { file_put_contents($subsFile, json_encode(['items'=>[]], JSON_UNESCAPED_SLASHES)); }
$_persisted = false;
try {
  $rawSubs = @file_get_contents($subsFile);
  $obj = json_decode($rawSubs, true);
  if (!is_array($obj)) $obj = ['items'=>[]];
  if (!isset($obj['items']) || !is_array($obj['items'])) $obj['items'] = [];
  $lower = strtolower($email);
  $exists = false;
  foreach ($obj['items'] as &$it) {
    if (strtolower($it['email'] ?? '') === $lower) { $exists = true; $it['status'] = 'active'; break; }
  }
  if (!$exists) {
    $obj['items'][] = [
      'email' => $email,
      'source' => $source ?: 'web',
      'status' => 'active',
      'created_at' => gmdate('c'),
    ];
  }
  $_persisted = @file_put_contents($subsFile, json_encode($obj, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
} catch (Exception $e) {
  // non-fatal
}
