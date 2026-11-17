<?php
// Co na talerz — odbiór automatycznych zgłoszeń błędów ze strony (src/errors.js).
// Zapisuje jedną linię JSON na błąd do _reports/errors-RRRR-MM-DD.jsonl (katalog niedostępny z WWW).
// Bot .github/workflows/bot-errors.yml co godzinę pobiera te pliki przez SFTP i zakłada zgłoszenia na GitHubie.
// Nie zapisuje adresu IP. Limit: 30 zgłoszeń na adres na godzinę (licznik po skrócie SHA-256 z dobową solą)
// i 5000 linii na dobę.
declare(strict_types=1);
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); header('Allow: POST'); echo "POST only\n"; exit; }
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !preg_match('#^https://(www\.)?conatalerz\.pl$#', $origin)) { http_response_code(403); exit; }

$raw = file_get_contents('php://input', false, null, 0, 8193);
if ($raw === false || $raw === '' || strlen($raw) > 8192) { http_response_code(413); exit; }
$in = json_decode($raw, true);
if (!is_array($in) || ($in['v'] ?? null) !== 1) { http_response_code(400); exit; }

$dir = __DIR__ . '/_reports';
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
if (!is_file($dir . '/.htaccess')) { @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n"); }

$day = gmdate('Y-m-d');
// Limit na adres: skrót z dobową solą, bez zapisu samego IP.
$saltFile = $dir . '/.salt-' . $day;
if (!is_file($saltFile)) { @file_put_contents($saltFile, bin2hex(random_bytes(16))); foreach (glob($dir . '/.salt-*') ?: [] as $f) if ($f !== $saltFile) @unlink($f); }
$salt = (string)@file_get_contents($saltFile);
$who = substr(hash('sha256', $salt . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
$rateFile = $dir . '/.rate-' . gmdate('YmdH') . '-' . $who;
$count = (int)@file_get_contents($rateFile);
if ($count >= 30) { http_response_code(429); exit; }
@file_put_contents($rateFile, (string)($count + 1));
foreach (glob($dir . '/.rate-*') ?: [] as $f) if (!str_contains($f, '.rate-' . gmdate('YmdH'))) @unlink($f);

$file = $dir . '/errors-' . $day . '.jsonl';
if (is_file($file) && filesize($file) > 5_000_000) { http_response_code(429); exit; }

$str = static fn($v, int $n): string => mb_substr(is_scalar($v) ? (string)$v : '', 0, $n);
$kind = in_array($in['kind'] ?? '', ['error', 'rejection', 'resource'], true) ? $in['kind'] : 'error';
$rec = [
  'kind' => $kind,
  'message' => $str($in['message'] ?? '', 500),
  'source' => $str($in['source'] ?? '', 300),
  'line' => (int)($in['line'] ?? 0),
  'col' => (int)($in['col'] ?? 0),
  'stack' => $str($in['stack'] ?? '', 2000),
  'page' => $str($in['page'] ?? '', 200),
  'lang' => $str($in['lang'] ?? '', 10),
  'standalone' => (bool)($in['standalone'] ?? false),
  'online' => (bool)($in['online'] ?? true),
  'ua' => $str($in['ua'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? ''), 300),
  'at' => $str($in['at'] ?? '', 40),
  'received' => gmdate('c'),
];
$line = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE) . "\n";
if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) { http_response_code(500); exit; }
http_response_code(204);
