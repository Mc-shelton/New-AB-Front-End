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

function envv(string $key, string $default = ''): string {
  $value = getenv($key);
  if ($value !== false && $value !== '') return $value;
  if (!empty($_SERVER[$key])) return (string)$_SERVER[$key];
  if (!empty($_ENV[$key])) return (string)$_ENV[$key];
  return $default;
}

function respond(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

function normalise_order(array $order, string $rawLine): array {
  if (!isset($order['id'])) {
    $hashSource = $order['ts'] ?? $rawLine;
    $order['id'] = 'legacy_' . substr(md5($hashSource), 0, 12);
  }
  if (!isset($order['status']) || $order['status'] === '') {
    $order['status'] = 'pending';
  }
  return $order;
}

function load_orders(string $ordersFile): array {
  if (!is_file($ordersFile)) return [];
  $lines = file($ordersFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  if ($lines === false) return [];
  $orders = [];
  foreach ($lines as $line) {
    $decoded = json_decode($line, true);
    if (is_array($decoded)) {
      $orders[] = normalise_order($decoded, $line);
    }
  }
  return $orders;
}

function write_orders(string $ordersFile, array $orders): void {
  $fh = fopen($ordersFile, 'w');
  if (!$fh) respond(500, ['ok' => false, 'error' => 'Could not persist orders']);
  foreach ($orders as $order) {
    fwrite($fh, json_encode($order, JSON_UNESCAPED_SLASHES) . "\n");
  }
  fclose($fh);
}

function send_merch_email(string $to, string $subject, string $textBody, string $htmlBody = ''): bool {
  if ($textBody === '' && $htmlBody === '') return false;
  if ($htmlBody !== '' && $textBody === '') {
    $textBody = strip_tags($htmlBody);
  }

  $from = envv('AB_MAIL_FROM', 'system@adventband.org');
  $fromName = envv('AB_MAIL_FROM_NAME', 'Advent Band');

  $headers = [];
  $headers[] = 'From: ' . $fromName . ' <' . $from . '>';
  $headers[] = 'Reply-To: people@adventband.org';
  $headers[] = 'MIME-Version: 1.0';

  if ($htmlBody !== '') {
    try {
      $boundary = 'AB-MERCH-' . bin2hex(random_bytes(12));
    } catch (Throwable $err) {
      $boundary = 'AB-MERCH-' . bin2hex(md5(uniqid('', true), true));
    }
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
    $parts = [
      '--' . $boundary,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      $textBody,
      '--' . $boundary,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      $htmlBody,
      '--' . $boundary . '--',
      '',
    ];
    $body = implode("\r\n", $parts);
  } else {
    $headers[] = 'Content-Type: text/plain; charset="UTF-8"';
    $headers[] = 'Content-Transfer-Encoding: 8bit';
    $body = $textBody;
  }

  return @mail($to, $subject, $body, implode("\r\n", $headers));
}

function send_merch_confirmation_email(array $order): array {
  try {
    $to = trim($order['customerEmail'] ?? '');
    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) return ['ok' => false, 'detail' => 'invalid email'];

    $currency = $order['currency'] ?? 'KES';
    $total = number_format((float)($order['total'] ?? 0));
    $items = $order['items'] ?? [];
    $itemsPlain = [];
    $itemsHtml = '';
    foreach ($items as $item) {
      $line = ($item['name'] ?? 'Item') . ' × ' . (int)($item['quantity'] ?? 1);
      if (!empty($item['size'])) $line .= ' • Size ' . $item['size'];
      if (!empty($item['color']['label'])) $line .= ' • ' . $item['color']['label'];
      $itemsPlain[] = $line;

      $nameHtml = htmlspecialchars($item['name'] ?? 'Item', ENT_QUOTES, 'UTF-8');
      $qtyHtml = (int)($item['quantity'] ?? 1);
      $sizeHtml = !empty($item['size']) ? '<span style="color:#6b7280;"> • Size ' . htmlspecialchars($item['size'], ENT_QUOTES, 'UTF-8') . '</span>' : '';
      $colorLabel = $item['color']['label'] ?? '';
      $colorHtml = $colorLabel !== '' ? '<span style="color:#6b7280;"> • ' . htmlspecialchars($colorLabel, ENT_QUOTES, 'UTF-8') . '</span>' : '';
      $itemsHtml .= '<tr><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:14px;">' . $nameHtml . ' × ' . $qtyHtml . $sizeHtml . $colorHtml . '</td></tr>';
    }

    $subject = 'We received your Advent Band merch order';
    $plain = [
      'Hi ' . ($order['customerName'] ?: 'friend') . ',',
      '',
      'Thank you for supporting the Street Vespers Initiative through Advent Band. Your merch order is safely on file and our team is now reviewing the payment reference.',
      '',
      'Order summary',
      '• Reference: ' . $order['id'],
      '• Payment reference: ' . ($order['paymentReference'] ?? ''),
      '• Total: ' . $currency . ' ' . $total,
    ];
    if ($itemsPlain) {
      $plain[] = '• Items:';
      foreach ($itemsPlain as $line) {
        $plain[] = '   - ' . $line;
      }
    }
    $plain = array_merge($plain, [
      '',
      'What happens next',
      'We confirm M-Pesa references within 24 hours (often sooner). Once approved we will contact you to arrange delivery or pickup.',
      '',
      'If anything looks off, reply to this email and we will help right away.',
      '',
      'Blessings,',
      'Advent Band Team',
    ]);

    $plainBody = implode("\r\n", $plain);

    $customerName = htmlspecialchars($order['customerName'] ?: 'friend', ENT_QUOTES, 'UTF-8');
    $orderId = htmlspecialchars($order['id'], ENT_QUOTES, 'UTF-8');
    $paymentRef = htmlspecialchars($order['paymentReference'] ?? '', ENT_QUOTES, 'UTF-8');
    $totalHtml = htmlspecialchars($currency . ' ' . $total, ENT_QUOTES, 'UTF-8');

    $htmlItems = $itemsHtml !== ''
      ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">' . $itemsHtml . '</table>'
      : '';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Merch order received</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f2ee;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;background:#f4f2ee;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(17,24,39,0.12);">
            <tr>
              <td style="background:#111827;color:#f9fafb;padding:24px 32px;">
                <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fbbf24;font-weight:600;">Street Vespers Merchandise</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;">We received your order</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi {$customerName},</p>
                <p style="margin:0 0 16px;">Thank you for supporting the <strong>Street Vespers Initiative</strong> through Advent Band. Your merch order is on file and our finance team is now reviewing the M-Pesa reference.</p>
                <div style="margin:0 0 20px;padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
                  <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;font-weight:600;">Order summary</p>
                  <p style="margin:4px 0;"><strong>Reference:</strong> <span style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:13px;">{$orderId}</span></p>
                  <p style="margin:4px 0;"><strong>Payment reference:</strong> <span style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:13px;">{$paymentRef}</span></p>
                  <p style="margin:4px 0;"><strong>Total paid:</strong> {$totalHtml}</p>
                  {$htmlItems}
                </div>
                <h2 style="margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;color:#f59e0b;">What happens next</h2>
                <p style="margin:0 0 16px;">We confirm M-Pesa payments within 24 hours (often sooner). Once verified, we will reach out to coordinate delivery or pickup details.</p>
                <p style="margin:0 0 16px;">If anything looks incorrect, reply to this email and we will help right away.</p>
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

    $sent = send_merch_email($to, $subject, $plainBody, $html);
    return ['ok' => $sent, 'detail' => $sent ? 'mail' : 'mail_failed'];
  } catch (Throwable $err) {
    return ['ok' => false, 'detail' => 'exception: ' . $err->getMessage()];
  }
}

function send_merch_approval_email(array $order): void {
  $to = $order['customerEmail'] ?? '';
  if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) return;

  $itemsLines = [];
  foreach ($order['items'] as $item) {
    $line = '- ' . ($item['name'] ?? 'Item');
    if (!empty($item['size'])) $line .= ' (Size: ' . $item['size'] . ')';
    if (!empty($item['color']['label'])) $line .= ' (Colour: ' . $item['color']['label'] . ')';
    $line .= ' x' . ($item['quantity'] ?? 1);
    $itemsLines[] = $line;
  }

  $body = "Hi " . ($order['customerName'] ?: 'supporter') . ",\n\n"
    . "We have received your Advent Band merch order and it has been approved. Our team will reach out soon to coordinate delivery and any balance payments if needed.\n\n"
    . "Order summary:\n"
    . implode("\n", $itemsLines) . "\n\n"
    . "Total: " . ($order['currency'] ?? 'KES') . ' ' . number_format((float)($order['total'] ?? 0)) . "\n"
    . "Payment reference: " . ($order['paymentReference'] ?? '(not provided)') . "\n\n"
    . "Thank you for fuelling the street vespers outreach.\n\n"
    . "Blessings,\nAdvent Band Team";

  $from = envv('AB_MAIL_FROM', 'system@adventband.org');
  $fromName = envv('AB_MAIL_FROM_NAME', 'Advent Band');
  $headers = [
    'From: ' . $fromName . ' <' . $from . '>',
    'Reply-To: people@adventband.org',
    'Content-Type: text/plain; charset=UTF-8',
  ];
  @mail($to, 'Your Advent Band merch order is confirmed', $body, implode("\r\n", $headers));
}

$dataDir = __DIR__ . '/../data';
$ordersFile = $dataDir . '/merch_orders.jsonl';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $adminKey = envv('AB_MERCH_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
  $provided = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
  if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
    respond(401, ['ok' => false, 'error' => 'Unauthorized']);
  }
  $orders = load_orders($ordersFile);
  respond(200, ['ok' => true, 'orders' => array_reverse($orders)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
  $adminKey = envv('AB_MERCH_ADMIN_KEY', 'CHANGE_ME_SUPER_SECRET_KEY');
  $provided = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
  if (!$adminKey || !$provided || !hash_equals($adminKey, $provided)) {
    respond(401, ['ok' => false, 'error' => 'Unauthorized']);
  }

  $payload = json_decode(file_get_contents('php://input'), true);
  if (!is_array($payload)) respond(400, ['ok' => false, 'error' => 'Invalid JSON payload']);
  $id = trim($payload['id'] ?? '');
  $status = strtolower(trim($payload['status'] ?? ''));
  $notes = trim($payload['notes'] ?? '');
  $validStatuses = ['pending', 'approved', 'rejected'];
  if ($id === '' || !in_array($status, $validStatuses, true)) {
    respond(400, ['ok' => false, 'error' => 'Invalid id or status']);
  }

  $orders = load_orders($ordersFile);
  $updated = null;
  foreach ($orders as &$order) {
    if (($order['id'] ?? '') === $id) {
      $previousStatus = $order['status'] ?? 'pending';
      $order['status'] = $status;
      $order['staffNotes'] = $notes;
      $order['reviewedAt'] = gmdate('c');
      $updated = $order;
      if ($status === 'approved' && $previousStatus !== 'approved') {
        send_merch_approval_email($order);
      }
      break;
    }
  }
  unset($order);

  if ($updated === null) {
    respond(404, ['ok' => false, 'error' => 'Order not found']);
  }

  if (!is_dir($dataDir)) @mkdir($dataDir, 0775, true);
  write_orders($ordersFile, $orders);
  respond(200, ['ok' => true, 'order' => $updated]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) respond(400, ['ok' => false, 'error' => 'Invalid JSON payload']);

$items = $payload['items'] ?? null;
if (!is_array($items) || !$items) respond(400, ['ok' => false, 'error' => 'Missing cart items']);
foreach ($items as $index => $item) {
  if (!isset($item['itemId'], $item['name'], $item['price'], $item['quantity'])) {
    respond(400, ['ok' => false, 'error' => "Item $index is incomplete"]);
  }
}
$paymentReference = trim($payload['paymentReference'] ?? '');
if ($paymentReference === '') respond(400, ['ok' => false, 'error' => 'Payment reference is required']);

$order = [
  'id' => uniqid('mo_', true),
  'ts' => gmdate('c'),
  'customerName' => trim($payload['customerName'] ?? ''),
  'customerEmail' => trim($payload['customerEmail'] ?? ''),
  'customerPhone' => trim($payload['customerPhone'] ?? ''),
  'notes' => trim($payload['notes'] ?? ''),
  'paymentReference' => $paymentReference,
  'status' => 'pending',
  'total' => (float)($payload['total'] ?? 0),
  'currency' => $payload['currency'] ?? 'KES',
  'items' => $items,
  'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
];

if (!is_dir($dataDir)) @mkdir($dataDir, 0775, true);
$line = json_encode($order, JSON_UNESCAPED_SLASHES);
if ($line === false || file_put_contents($ordersFile, $line . "\n", FILE_APPEND | LOCK_EX) === false) {
  respond(500, ['ok' => false, 'error' => 'Could not record order']);
}

$order['submissionDelivery'] = send_merch_confirmation_email($order);

// Persist the submission delivery status by rewriting the last line if possible.
$orders = load_orders($ordersFile);
if ($orders) {
  $orders[count($orders) - 1]['submissionDelivery'] = $order['submissionDelivery'];
  write_orders($ordersFile, $orders);
}

@file_put_contents(
  $dataDir . '/admin_activity.jsonl',
  json_encode([
    'ts' => gmdate('c'),
    'type' => 'merch.order.received',
    'message' => 'Merch order submitted',
    'meta' => [
      'items' => count($items),
      'total' => $order['total'],
      'customer' => $order['customerEmail'] ?: $order['customerName'],
      'delivery' => $order['submissionDelivery']['detail'] ?? null,
    ],
  ], JSON_UNESCAPED_SLASHES) . "\n",
  FILE_APPEND | LOCK_EX
);

respond(200, ['ok' => true, 'id' => $order['id'], 'submissionDelivery' => $order['submissionDelivery']]);
