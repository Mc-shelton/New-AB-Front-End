<?php
// Notify all subscribers about a new blog by slug.
// POST { slug } with header X-Admin-Key.

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

function envv($k,$d=''){ $v=getenv($k); if($v!==false&&$v!=='')return $v; if(isset($_SERVER[$k])&&$_SERVER[$k]!=='')return $_SERVER[$k]; if(isset($_ENV[$k])&&$_ENV[$k]!=='')return $_ENV[$k]; return $d; }

$adminKey = envv('AB_BLOGS_ADMIN_KEY','');
$provided = isset($_SERVER['HTTP_X_ADMIN_KEY']) ? $_SERVER['HTTP_X_ADMIN_KEY'] : '';
if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }
$slug = isset($data['slug']) ? preg_replace('/[^a-z0-9\-]/i','', (string)$data['slug']) : '';
if ($slug===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'slug required']); exit; }

$blogsFile = __DIR__ . '/../data/blogs.json';
$subsFile = __DIR__ . '/../data/subscribers.json';
if (!file_exists($blogsFile)) { http_response_code(404); echo json_encode(['ok'=>false,'error'=>'blogs not found']); exit; }
if (!file_exists($subsFile)) { echo json_encode(['ok'=>true,'detail'=>'no subscribers','sent'=>0]); exit; }
$blogs = json_decode(file_get_contents($blogsFile), true);
$subs = json_decode(file_get_contents($subsFile), true);
if (!is_array($blogs)) $blogs = [];
$items = isset($subs['items']) && is_array($subs['items']) ? $subs['items'] : [];

$blog = null;
foreach ($blogs as $b) { if (($b['slug'] ?? '') === $slug) { $blog = $b; break; } }
if (!$blog) { http_response_code(404); echo json_encode(['ok'=>false,'error'=>'blog not found']); exit; }

$title = $blog['title'] ?? ('New Blog: ' . $slug);
$summary = trim((string)($blog['summary'] ?? ''));
$shareUrl = (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : (isset($_SERVER['REQUEST_SCHEME'],$_SERVER['HTTP_HOST']) ? $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] : 'https://adventband.org')) . '/share/blogs/' . $slug . '.html';

$from = envv('AB_MAIL_FROM', 'system@adventband.org');
$fromName = 'Advent Band';
$smtpHost = envv('AB_SMTP_HOST', 'mail.adventband.org');
$smtpPort = (int)envv('AB_SMTP_PORT', '465');
$smtpUser = envv('AB_SMTP_USER', 'system@adventband.org');
$smtpPass = envv('AB_SMTP_PASS', 'm@jiMot0');
$smtpSecure = strtolower(envv('AB_SMTP_SECURE', 'ssl'));

$subject = 'New Blog: ' . $title;
$bodyTpl = "Hello,\n\nWe just published a new post: %TITLE%\n\n%SUMMARY%\n\nRead and share: %URL%\n\n— Advent Band";
$sent = 0; $errors = [];

foreach ($items as $it) {
  $email = trim((string)($it['email'] ?? ''));
  $status = strtolower((string)($it['status'] ?? 'active'));
  if ($email === '' || $status !== 'active') continue;
  $body = str_replace(['%TITLE%','%SUMMARY%','%URL%'], [$title, $summary, $shareUrl], $bodyTpl);

  $ok = smtp_send([
    'host' => $smtpHost,
    'port' => $smtpPort,
    'secure' => $smtpSecure,
    'username' => $smtpUser,
    'password' => $smtpPass,
  ], $from, $fromName, $email, $subject, $body, 'no-reply@adventband.org');

  if ($ok === true) { $sent++; }
  else { $errors[] = ['email'=>$email,'error'=>$ok]; }
}

// Log activity
@file_put_contents(__DIR__ . '/../data/admin_activity.jsonl', json_encode([
  'ts' => gmdate('c'),
  'type' => 'blogs.notify',
  'message' => 'Notified subscribers of blog',
  'actorIp' => $_SERVER['REMOTE_ADDR'] ?? '',
  'meta' => ['slug' => $slug, 'sent' => $sent, 'errors' => count($errors)],
], JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode(['ok'=>true,'sent'=>$sent,'errors'=>$errors]);
exit;

// Minimal SMTP (copied from send.php)
function smtp_read($fp) { $data=''; while ($str=fgets($fp,515)) { $data.=$str; if (substr($str,3,1)==' ') break; } return $data; }
function smtp_cmd($fp,$cmd,$expect){ if($cmd!==null) fwrite($fp,$cmd."\r\n"); $resp=smtp_read($fp); if(substr($resp,0,3)!=(string)$expect){ return $resp?:'Unexpected SMTP response'; } return true; }
function smtp_send($cfg,$from,$fromName,$to,$subject,$body,$replyTo){
  $host=$cfg['host']; $port=(int)$cfg['port']; $secure=$cfg['secure']; $username=$cfg['username']; $password=$cfg['password'];
  $remote=($secure==='ssl')?'ssl://'.$host:$host;
  $fp=@stream_socket_client($remote.':'.$port,$errno,$errstr,30,STREAM_CLIENT_CONNECT);
  if(!$fp) return "Connect failed: $errstr ($errno)";
  $r=smtp_read($fp); if(substr($r,0,3)!='220') return "Server greeting failed: $r";
  $domain='adventband.org'; $ok=smtp_cmd($fp,'EHLO '.$domain,250); if($ok!==true) return $ok;
  if($secure==='tls'){ $ok=smtp_cmd($fp,'STARTTLS',220); if($ok!==true) return $ok; if(!stream_socket_enable_crypto($fp,true,STREAM_CRYPTO_METHOD_TLS_CLIENT)) return 'TLS upgrade failed'; $ok=smtp_cmd($fp,'EHLO '.$domain,250); if($ok!==true) return $ok; }
  $ok=smtp_cmd($fp,'AUTH LOGIN',334); if($ok!==true) return $ok; $ok=smtp_cmd($fp,base64_encode($username),334); if($ok!==true) return $ok; $ok=smtp_cmd($fp,base64_encode($password),235); if($ok!==true) return $ok;
  $ok=smtp_cmd($fp,'MAIL FROM: <'.$from.'>',250); if($ok!==true) return $ok; $ok=smtp_cmd($fp,'RCPT TO: <'.$to.'>',250); if($ok!==true) return $ok; $ok=smtp_cmd($fp,'DATA',354); if($ok!==true) return $ok;
  $headers=[]; $headers[]='From: '.encode_header($fromName).' <'.$from.'>'; $headers[]='To: <'.$to.'>'; $headers[]='Reply-To: '.$replyTo; $headers[]='Subject: '.encode_header($subject); $headers[]='MIME-Version: 1.0'; $headers[]='Content-Type: text/plain; charset=UTF-8'; $headers[]='Content-Transfer-Encoding: 8bit';
  $msg=implode("\r\n",$headers)."\r\n\r\n".preg_replace("/(\r?\n)\./","$1..",$body)."\r\n.";
  fwrite($fp,$msg."\r\n"); $ok=smtp_cmd($fp,null,250); if($ok!==true) return $ok; smtp_cmd($fp,'QUIT',221); fclose($fp); return true;
}
function encode_header($s){ if(!preg_match('/[\x80-\xFF]/',$s)) return $s; return '=?UTF-8?B?'.base64_encode($s).'?='; }
