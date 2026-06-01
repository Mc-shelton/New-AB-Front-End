<?php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function envv($key, $default='') {
  $v = getenv($key);
  if ($v !== false && $v !== '') return $v;
  if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
  if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
  return $default;
}

function respond($code, $payload) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

$dataFile = __DIR__ . '/../data/badge_orders.json';
$assetsDir = __DIR__ . '/../data/badge_orders';
@mkdir(dirname($dataFile), 0775, true);
@mkdir($assetsDir, 0775, true);
if (!file_exists($dataFile)) file_put_contents($dataFile, json_encode([]));

$orders = json_decode(file_get_contents($dataFile), true);
if (!is_array($orders)) $orders = [];

$adminKey = envv('AB_BLOGS_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
$providedKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
$isAdmin = $adminKey && $providedKey && hash_equals($adminKey, $providedKey);

function saveOrders($orders, $dataFile) {
  $ok = file_put_contents($dataFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
  if ($ok === false) respond(500, ['ok'=>false,'error'=>'Failed to persist orders']);
}

function decodeDataUrl($dataUrl) {
  if (!$dataUrl || strpos($dataUrl, 'base64,') === false) return null;
  $commaPos = strpos($dataUrl, ',');
  if ($commaPos === false) return null;
  $meta = substr($dataUrl, 0, $commaPos);
  $b64 = substr($dataUrl, $commaPos + 1);
  if ($b64 === '') return null;
  $meta = strtolower(trim($meta));
  if (strpos($meta, 'data:') !== 0) return null;
  $meta = substr($meta, 5);
  $semiPos = strpos($meta, ';');
  $mime = $semiPos === false ? $meta : substr($meta, 0, $semiPos);
  $decoded = base64_decode(strtr($b64, ' ', '+'), true);
  if ($decoded === false) return null;
  return [$mime ?: 'application/octet-stream', $decoded];
}

function storeAsset($assetsDir, $orderId, $type, $dataUrl) {
  $decoded = decodeDataUrl($dataUrl);
  if (!$decoded) return null;
  [$mime, $bytes] = $decoded;
  $ext = 'png';
  if ($mime === 'image/jpeg' || $mime === 'image/jpg') $ext = 'jpg';
  else if ($mime === 'image/webp') $ext = 'webp';
  else if ($mime === 'image/svg+xml') $ext = 'svg';
  $name = $orderId . '_' . $type . '.' . $ext;
  $path = rtrim($assetsDir, '/').'/'.$name;
  $ok = file_put_contents($path, $bytes);
  if ($ok === false) return null;
  return $path;
}

function readJsonBody() {
  $raw = file_get_contents('php://input');
  $json = json_decode($raw, true);
  return is_array($json) ? $json : [];
}

function findOrderIndex(&$orders, $id) {
  foreach ($orders as $idx => $order) if (($order['id'] ?? '') === $id) return $idx;
  return -1;
}

function toLower($value) {
  $string = (string)$value;
  if (function_exists('mb_strtolower')) return mb_strtolower($string, 'UTF-8');
  return strtolower($string);
}

function lb($count = 1) {
  return str_repeat("\r\n", max(1, (int)$count));
}

function buildEmailBodies(array $plainLines, $html = '') {
  return [
    'text' => implode("\r\n", $plainLines),
    'html' => $html,
  ];
}

function sendApprovedEmail($order, $assetsDir) {
  try {
    $to = $order['email'];
    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) return ['ok'=>false, 'detail'=>'invalid email'];

    $subject = 'Your Street Vespers Initiative Badge';
    $plain = buildEmailBodies([
      'Hi ' . $order['name'] . ',',
      '',
      'Thank you for partnering with the Street Vespers Initiative through Advent Band. Your ' . $order['tierName'] . ' badge is attached along with a share-ready poster.',
      'We look forward to seeing you at the Aga Khan Walk vespers.',
      '',
      'Blessings,',
      'Advent Band Team',
    ]);
    $html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Advent Band badge</title></head>'
      . '<body style="margin:0;padding:0;background:#f7f5f2;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">'
      . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#f7f5f2;">'
      . '<tr><td>'
      . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 8px 28px rgba(31,41,51,0.12);">'
      . '<tr><td style="font-size:18px;font-weight:600;padding-bottom:12px;">Your badge kit is attached</td></tr>'
      . '<tr><td style="font-size:15px;line-height:1.6;">'
      . '<p style="margin:0 0 16px;">Hi ' . htmlspecialchars($order['name']) . ',</p>'
      . '<p style="margin:0 0 16px;">Thank you for partnering with the <strong>Street Vespers Initiative</strong> through Advent Band. We have attached your <strong>' . htmlspecialchars($order['tierName']) . '</strong> badge and share-ready poster.</p>'
      . '<p style="margin:0 0 16px;">We look forward to seeing you at the Aga Khan Walk vespers.</p>'
      . '<p style="margin:24px 0 0;">Blessings,<br />Advent Band Team</p>'
      . '</td></tr></table>'
      . '<p style="text-align:center;margin-top:16px;font-size:12px;color:#7b8794;">Advent Band • ministry@adventband.org</p>'
      . '</td></tr></table></body></html>';
    $bodies = ['text' => $plain['text'], 'html' => $html];

    $attachments = [];
    foreach (['badgePath' => 'Badge', 'posterPath' => 'Poster'] as $key => $label) {
      $path = $order[$key] ?? '';
      if (!$path || !is_file($path) || !is_readable($path)) {
        continue;
      }
      $data = @file_get_contents($path);
      if ($data === false) {
        continue;
      }
      $attachments[] = [
        'path' => $path,
        'name' => basename($path),
        'mime' => 'image/png',
        'label' => $label,
        'content' => $data,
      ];
    }

    if (!$attachments) return ['ok'=>false, 'detail'=>'attachments missing'];

    return sendMailWithAttachments($to, $subject, $bodies, $attachments);
  } catch (Throwable $err) {
    return ['ok'=>false, 'detail'=>'exception: ' . $err->getMessage()];
  }
}

function sendOrderConfirmationEmail($order) {
  try {
    $to = $order['email'] ?? '';
    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) return ['ok'=>false, 'detail'=>'invalid email'];

    $subject = 'We received your Street Vespers badge order';
    $amount = isset($order['amount']) ? number_format((float)$order['amount']) : '—';
    $plainLines = [
      'Hi ' . $order['name'] . ',',
      '',
      'Thanks for partnering with the Street Vespers Initiative through Advent Band. We have received your badge request and it is now pending review.',
      '',
      'Order summary',
      '• Order reference: ' . $order['id'],
      '• Tier: ' . $order['tierName'] . ' (KES ' . $amount . ')',
      '• Payment reference: ' . $order['paymentReference'],
      '',
      'What happens next',
      'Our team verifies payments within 24 hours (often sooner). Once confirmed, we will email your badge kit and printable poster.',
      '',
      'If anything looks off, simply reply to this email and we will help right away.',
      '',
      'Blessings,',
      'Advent Band Team',
    ];

    $plain = buildEmailBodies($plainLines);

    $orderName = htmlspecialchars($order['name']);
    $orderId = htmlspecialchars($order['id']);
    $orderTier = htmlspecialchars($order['tierName']);
    $orderPayment = htmlspecialchars($order['paymentReference']);

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Badge order received</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f3ef;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;background:#f5f3ef;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(31,41,55,0.12);">
            <tr>
              <td style="background:#f9e7ff;padding:24px 32px;">
                <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6b21a8;font-weight:600;">Street Vespers Initiative</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#3b0764;">We received your badge order</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi {$orderName},</p>
                <p style="margin:0 0 16px;">Thank you for partnering with the <strong>Street Vespers Initiative</strong> through Advent Band. We have logged your badge request and a team member will review it shortly.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 20px;background:#f9fafb;border-radius:12px;padding:18px;font-size:14px;color:#1f2937;border:1px solid #e5e7eb;">
                  <tr>
                    <td style="padding-bottom:12px;"><strong>Order reference:</strong><br /><span style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:13px;">{$orderId}</span></td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;"><strong>Tier:</strong><br />{$orderTier} <span style="color:#6b7280;">(KES {$amount})</span></td>
                  </tr>
                  <tr>
                    <td><strong>Payment reference:</strong><br /><span style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:13px;">{$orderPayment}</span></td>
                  </tr>
                </table>
                <h2 style="margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;color:#6b21a8;">What happens next</h2>
                <p style="margin:0 0 16px;">We verify payments within 24 hours (often sooner). Once approved, your badge kit and share-ready poster will land in this inbox.</p>
                <p style="margin:0 0 16px;">If any detail looks off, reply directly to this email and our admin team will help right away.</p>
                <p style="margin:24px 0 0;">Blessings,<br />Advent Band Team</p>
              </td>
            </tr>
          </table>
          <p style="text-align:center;margin-top:18px;font-size:12px;color:#94a3b8;">Advent Band • ministry@adventband.org</p>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;

    return sendMailWithAttachments($to, $subject, ['text'=>$plain['text'], 'html'=>$html], []);
  } catch (Throwable $err) {
    return ['ok'=>false, 'detail'=>'exception: ' . $err->getMessage()];
  }
}

function sendMailWithAttachments($to, $subject, $bodyContent, $attachments) {
  try {
    $from = envv('AB_MAIL_FROM', 'system@adventband.org');
    $fromName = envv('AB_MAIL_FROM_NAME', 'Advent Band');
    $smtpHost = envv('AB_SMTP_HOST', 'mail.adventband.org');
    $smtpUser = envv('AB_SMTP_USER', 'system@adventband.org');
    $smtpPass = envv('AB_SMTP_PASS', 'm@jiMot0');
    $smtpPort = (int)envv('AB_SMTP_PORT', '465');
    $smtpSecure = strtolower(envv('AB_SMTP_SECURE', 'ssl'));

    $textBody = is_array($bodyContent) ? ($bodyContent['text'] ?? '') : (string)$bodyContent;
    $htmlBody = is_array($bodyContent) ? ($bodyContent['html'] ?? '') : '';
    if ($textBody === '' && $htmlBody !== '') {
      $textBody = strip_tags($htmlBody);
    }

    $preparedAttachments = [];
    foreach ($attachments as $att) {
      $contentsRaw = $att['content'] ?? null;
      $path = $att['path'] ?? '';
      if ($contentsRaw === null && $path && is_readable($path)) {
        $contentsRaw = @file_get_contents($path);
      }
      if (!is_string($contentsRaw) || $contentsRaw === '') continue;
      $preparedAttachments[] = [
        'content' => $contentsRaw,
        'mime' => $att['mime'] ?? 'application/octet-stream',
        'name' => encodeHeader($att['name'] ?? ($path ? basename($path) : 'attachment')),
      ];
    }

    $headers = [
      'From: ' . encodeHeader($fromName) . ' <' . $from . '>',
      'Reply-To: ' . $from,
      'MIME-Version: 1.0',
    ];

    $bodyLines = [];

    if (count($preparedAttachments) > 0) {
      try {
        $mixedBoundary = 'AB-' . bin2hex(random_bytes(16));
      } catch (Throwable $err) {
        $mixedBoundary = 'AB-' . bin2hex(md5(uniqid('', true), true));
      }
      $headers[] = 'Content-Type: multipart/mixed; boundary="' . $mixedBoundary . '"';

      if ($htmlBody !== '') {
        try {
          $altBoundary = 'AB-ALT-' . bin2hex(random_bytes(12));
        } catch (Throwable $err) {
          $altBoundary = 'AB-ALT-' . bin2hex(md5(uniqid('', true), true));
        }
        $bodyLines[] = '--' . $mixedBoundary;
        $bodyLines[] = 'Content-Type: multipart/alternative; boundary="' . $altBoundary . '"';
        $bodyLines[] = '';
        $bodyLines[] = '--' . $altBoundary;
        $bodyLines[] = 'Content-Type: text/plain; charset="UTF-8"';
        $bodyLines[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = '';
        $bodyLines[] = $textBody;
        $bodyLines[] = '--' . $altBoundary;
        $bodyLines[] = 'Content-Type: text/html; charset="UTF-8"';
        $bodyLines[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = '';
        $bodyLines[] = $htmlBody;
        $bodyLines[] = '--' . $altBoundary . '--';
      } else {
        $bodyLines[] = '--' . $mixedBoundary;
        $bodyLines[] = 'Content-Type: text/plain; charset="UTF-8"';
        $bodyLines[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = '';
        $bodyLines[] = $textBody;
      }

      foreach ($preparedAttachments as $attachment) {
        $bodyLines[] = '--' . $mixedBoundary;
        $bodyLines[] = 'Content-Type: ' . $attachment['mime'] . '; name="' . $attachment['name'] . '"';
        $bodyLines[] = 'Content-Transfer-Encoding: base64';
        $bodyLines[] = 'Content-Disposition: attachment; filename="' . $attachment['name'] . '"';
        $bodyLines[] = '';
        $bodyLines[] = chunk_split(base64_encode($attachment['content']));
      }
      $bodyLines[] = '--' . $mixedBoundary . '--';
      $bodyLines[] = '';
    } else {
      if ($htmlBody !== '') {
        try {
          $altBoundary = 'AB-ALT-' . bin2hex(random_bytes(12));
        } catch (Throwable $err) {
          $altBoundary = 'AB-ALT-' . bin2hex(md5(uniqid('', true), true));
        }
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $altBoundary . '"';
        $bodyLines[] = '--' . $altBoundary;
        $bodyLines[] = 'Content-Type: text/plain; charset="UTF-8"';
        $bodyLines[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = '';
        $bodyLines[] = $textBody;
        $bodyLines[] = '--' . $altBoundary;
        $bodyLines[] = 'Content-Type: text/html; charset="UTF-8"';
        $bodyLines[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = '';
        $bodyLines[] = $htmlBody;
        $bodyLines[] = '--' . $altBoundary . '--';
        $bodyLines[] = '';
      } else {
        $headers[] = 'Content-Type: text/plain; charset="UTF-8"';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
        $bodyLines[] = $textBody;
      }
    }

    $bodyText = implode("\r\n", $bodyLines);
    $headerText = implode("\r\n", $headers);

    if ($smtpHost && $smtpUser && $smtpPass) {
      $res = smtpSendWithAttachments([
        'host' => $smtpHost,
        'port' => $smtpPort,
        'secure' => $smtpSecure,
        'username' => $smtpUser,
        'password' => $smtpPass,
      ], $from, $fromName, $to, $subject, $headerText, $bodyText);
      if ($res === true) return ['ok'=>true, 'detail'=>'smtp'];
    }

    if (function_exists('mail')) {
      $sent = mail($to, encodeHeader($subject), $bodyText, $headerText);
      if ($sent) return ['ok'=>true, 'detail'=>'mail'];
      return ['ok'=>false, 'detail'=>'mail_failed'];
    }
    return ['ok'=>false, 'detail'=>'mail_function_unavailable'];
  } catch (Throwable $err) {
    return ['ok'=>false, 'detail'=>'exception: ' . $err->getMessage()];
  }
}

function encodeHeader($str) {
  if (!preg_match('/[\x80-\xFF]/', $str)) return $str;
  return '=?UTF-8?B?' . base64_encode($str) . '?=';
}

function smtpRead($fp) {
  $data = '';
  while ($str = fgets($fp, 515)) {
    $data .= $str;
    if (substr($str, 3, 1) == ' ') break;
  }
  return $data;
}

function smtpCmd($fp, $cmd, $expect) {
  if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
  $resp = smtpRead($fp);
  if (substr($resp, 0, 3) != (string)$expect) return $resp ?: 'Unexpected SMTP response';
  return true;
}

function smtpSendWithAttachments($cfg, $from, $fromName, $to, $subject, $headerText, $bodyText) {
  $host = $cfg['host'];
  $port = (int)$cfg['port'];
  $secure = $cfg['secure'];
  $username = $cfg['username'];
  $password = $cfg['password'];
  $remote = ($secure === 'ssl') ? 'ssl://' . $host : $host;
  $fp = @stream_socket_client($remote . ':' . $port, $errno, $errstr, 30, STREAM_CLIENT_CONNECT);
  if (!$fp) return "Connect failed: $errstr ($errno)";
  $resp = smtpRead($fp);
  if (substr($resp, 0, 3) != '220') return "Greeting failed: $resp";
  $domain = 'adventband.org';
  $ok = smtpCmd($fp, 'EHLO ' . $domain, 250);
  if ($ok !== true) return $ok;
  if ($secure === 'tls') {
    $ok = smtpCmd($fp, 'STARTTLS', 220);
    if ($ok !== true) return $ok;
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) return 'TLS upgrade failed';
    $ok = smtpCmd($fp, 'EHLO ' . $domain, 250);
    if ($ok !== true) return $ok;
  }
  $ok = smtpCmd($fp, 'AUTH LOGIN', 334);
  if ($ok !== true) return $ok;
  $ok = smtpCmd($fp, base64_encode($username), 334);
  if ($ok !== true) return $ok;
  $ok = smtpCmd($fp, base64_encode($password), 235);
  if ($ok !== true) return $ok;
  $ok = smtpCmd($fp, 'MAIL FROM: <' . $from . '>', 250);
  if ($ok !== true) return $ok;
  $ok = smtpCmd($fp, 'RCPT TO: <' . $to . '>', 250);
  if ($ok !== true) return $ok;
  $ok = smtpCmd($fp, 'DATA', 354);
  if ($ok !== true) return $ok;

  $payloadHeaders = [
    'From: ' . encodeHeader($fromName) . ' <' . $from . '>',
    'To: <' . $to . '>',
    'Subject: ' . encodeHeader($subject),
  ];

  $hasMimeVersion = false;
  foreach (explode("\r\n", $headerText) as $line) {
    if ($line === '') continue;
    $key = strtolower((string)substr($line, 0, strpos($line, ':')));
    if ($key === 'from') continue; // already added above
    if ($key === 'mime-version') {
      $hasMimeVersion = true;
    }
    $payloadHeaders[] = $line;
  }
  if (!$hasMimeVersion) {
    $payloadHeaders[] = 'MIME-Version: 1.0';
  }
  $payloadHeaders[] = ''; // blank line before body
  $payload = implode("\r\n", $payloadHeaders) . "\r\n" . $bodyText . "\r\n.";
  fwrite($fp, $payload . "\r\n");
  $ok = smtpCmd($fp, null, 250);
  smtpCmd($fp, 'QUIT', 221);
  fclose($fp);
  return $ok === true ? true : $ok;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!$isAdmin) respond(401, ['ok'=>false,'error'=>'Unauthorized']);
  $status = isset($_GET['status']) ? strtolower(trim($_GET['status'])) : '';
  $query = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $items = $orders;
  if ($status) {
    $items = array_values(array_filter($items, function($o) use ($status) { return strtolower($o['status'] ?? '') === $status; }));
  }
  if ($query !== '') {
    $q = toLower($query);
    $items = array_values(array_filter($items, function($o) use ($q) {
      $haystack = [
        $o['name'] ?? '',
        $o['email'] ?? '',
        $o['phone'] ?? '',
        $o['paymentReference'] ?? '',
        $o['tierName'] ?? '',
        $o['id'] ?? '',
      ];
      foreach ($haystack as $value) {
        if ($value === '') continue;
        if (strpos(toLower($value), $q) !== false) return true;
      }
      return false;
    }));
  }
  respond(200, ['ok'=>true,'items'=>$items]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = readJsonBody();
  if ($isAdmin && isset($body['id'])) {
    $id = (string)($body['id'] ?? '');
    $idx = findOrderIndex($orders, $id);
    if ($idx === -1) respond(404, ['ok'=>false,'error'=>'Order not found']);
    $status = strtolower((string)($body['status'] ?? ''));
    $didMutate = false;

    if (isset($body['shareUrl'])) {
      $orders[$idx]['shareUrl'] = trim((string)$body['shareUrl']);
      $didMutate = true;
    }

    if (array_key_exists('portraitDataUrl', $body)) {
      $portraitDataUrl = $body['portraitDataUrl'];
      if ($portraitDataUrl) {
        $portraitPath = storeAsset($assetsDir, $id, 'portrait', $portraitDataUrl);
        if (!$portraitPath) respond(500, ['ok'=>false,'error'=>'Failed to store portrait artwork']);
        $orders[$idx]['portraitPath'] = $portraitPath;
      }
      $didMutate = true;
    }

    if (array_key_exists('badgeDataUrl', $body)) {
      $badgeDataUrl = $body['badgeDataUrl'];
      if ($badgeDataUrl) {
        $badgePath = storeAsset($assetsDir, $id, 'badge', $badgeDataUrl);
        if (!$badgePath) respond(500, ['ok'=>false,'error'=>'Failed to store badge artwork']);
        $orders[$idx]['badgePath'] = $badgePath;
      }
      $didMutate = true;
    }

    if (array_key_exists('posterDataUrl', $body)) {
      $posterDataUrl = $body['posterDataUrl'];
      if ($posterDataUrl) {
        $posterPath = storeAsset($assetsDir, $id, 'poster', $posterDataUrl);
        if (!$posterPath) respond(500, ['ok'=>false,'error'=>'Failed to store poster artwork']);
        $orders[$idx]['posterPath'] = $posterPath;
      }
      $didMutate = true;
    }

    if (isset($body['status'])) {
      if (!in_array($status, ['approved','rejected','pending'], true)) respond(400,['ok'=>false,'error'=>'Invalid status']);
      if ($status === 'approved') {
        if (empty($orders[$idx]['badgePath']) || empty($orders[$idx]['posterPath'])) {
          respond(400, ['ok'=>false,'error'=>'Generate badge and poster before approving']);
        }
        $orders[$idx]['approvedAt'] = gmdate('c');
        $emailRes = sendApprovedEmail($orders[$idx], $assetsDir);
        $orders[$idx]['delivery'] = $emailRes;
      }
      $orders[$idx]['status'] = $status;
      $orders[$idx]['adminNote'] = (string)($body['note'] ?? '');
      $orders[$idx]['updatedAt'] = gmdate('c');
      $didMutate = true;
    }

    if ($didMutate) {
      if (!isset($body['status'])) {
        $orders[$idx]['updatedAt'] = gmdate('c');
      }
      saveOrders($orders, $dataFile);
    }
    respond(200, ['ok'=>true,'order'=>$orders[$idx]]);
  }

  $name = trim((string)($body['name'] ?? ''));
  $email = trim((string)($body['email'] ?? ''));
  $phone = trim((string)($body['phone'] ?? ''));
  $tierKey = trim((string)($body['tierKey'] ?? ''));
  $tierName = trim((string)($body['tierName'] ?? ''));
  $amount = (int)($body['amount'] ?? 0);
  $paymentRef = trim((string)($body['paymentReference'] ?? ''));
  $wantsHardCopy = (bool)($body['hardCopy'] ?? false);
  $portraitDataUrl = $body['portraitDataUrl'] ?? '';
  $shareUrl = trim((string)($body['shareUrl'] ?? ''));
  $notes = trim((string)($body['notes'] ?? ''));

  if ($name === '') respond(400, ['ok'=>false,'error'=>'Name is required']);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(400, ['ok'=>false,'error'=>'Valid email required']);
  if ($tierKey === '' || $tierName === '') respond(400, ['ok'=>false,'error'=>'Tier details missing']);
  if ($amount <= 0) respond(400, ['ok'=>false,'error'=>'Amount missing']);
  if ($paymentRef === '') respond(400, ['ok'=>false,'error'=>'Payment reference required']);

  $id = 'order_' . gmdate('Ymd_His') . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
  $portraitPath = null;
  if ($portraitDataUrl) {
    $portraitPath = storeAsset($assetsDir, $id, 'portrait', $portraitDataUrl);
    if (!$portraitPath) respond(500, ['ok'=>false,'error'=>'Failed to store portrait artwork']);
  }

  $order = [
    'id' => $id,
    'createdAt' => gmdate('c'),
    'status' => 'pending',
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'tierKey' => $tierKey,
    'tierName' => $tierName,
    'amount' => $amount,
    'paymentReference' => $paymentRef,
    'hardCopy' => $wantsHardCopy,
    'notes' => $notes,
    'shareUrl' => $shareUrl,
    'portraitPath' => $portraitPath,
    'badgePath' => null,
    'posterPath' => null,
  ];

  $order['submissionDelivery'] = sendOrderConfirmationEmail($order);

  $orders[] = $order;
  saveOrders($orders, $dataFile);
  respond(200, ['ok'=>true,'id'=>$id,'submissionDelivery'=>$order['submissionDelivery']]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
  if (!$isAdmin) respond(401, ['ok'=>false,'error'=>'Unauthorized']);
  $body = readJsonBody();
  $id = (string)($body['id'] ?? '');
  $idx = findOrderIndex($orders, $id);
  if ($idx === -1) respond(404, ['ok'=>false,'error'=>'Order not found']);
  $update = [];
  if (isset($body['adminNote'])) $orders[$idx]['adminNote'] = trim((string)$body['adminNote']);
  if (isset($body['status'])) {
    $status = strtolower((string)$body['status']);
    if (!in_array($status, ['approved','rejected','pending'], true)) respond(400,['ok'=>false,'error'=>'Invalid status']);
    $orders[$idx]['status'] = $status;
    $orders[$idx]['updatedAt'] = gmdate('c');
    if ($status === 'approved') {
      $orders[$idx]['approvedAt'] = gmdate('c');
      $emailRes = sendApprovedEmail($orders[$idx], $assetsDir);
      $orders[$idx]['delivery'] = $emailRes;
    }
  }
  saveOrders($orders, $dataFile);
  respond(200, ['ok'=>true,'order'=>$orders[$idx]]);
}

respond(405, ['ok'=>false,'error'=>'Method not allowed']);
