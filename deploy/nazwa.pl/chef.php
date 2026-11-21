<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const CORPUS = 'https://recipes.airon.app/v1/recipes';
const CUISINES = ['polish','italian','german','french','japanese','indian','mexican','american','mediterranean',
    'asian','chinese','thai','vietnamese','korean','spanish','portuguese','turkish','hungarian','ukrainian','georgian',
    'british','scandinavian','latinamerican','african','jewish','russian','czech','levantine','international'];

function reply(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function normalized(string $value): string {
    $value = mb_strtolower($value, 'UTF-8');
    $value = strtr($value, ['ą'=>'a','ć'=>'c','ę'=>'e','ł'=>'l','ń'=>'n','ó'=>'o','ś'=>'s','ź'=>'z','ż'=>'z']);
    if (class_exists('Transliterator')) $value = transliterator_transliterate('NFD; [:Nonspacing Mark:] Remove; NFC', $value) ?: $value;
    return trim(preg_replace('/[^\p{L}\p{N}]+/u', ' ', $value) ?? '');
}
function includesName(string $name, string $query): bool {
    return str_contains(' '.normalized($name).' ', ' '.$query.' ');
}
function sourceUrl($url): string {
    return is_string($url) && strlen($url) <= 500 && filter_var($url, FILTER_VALIDATE_URL) &&
        parse_url($url, PHP_URL_SCHEME) === 'https' && parse_url($url, PHP_URL_USER) === null ? $url : '';
}
function requestJson(string $url): ?array {
    $ch = curl_init($url);
    $response = '';
    curl_setopt_array($ch, [
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 12,
        CURLOPT_USERAGENT => 'Co na talerz recipe lookup (https://conatalerz.pl/)',
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$response): int {
            if (strlen($response) + strlen($chunk) > 262144) return 0;
            $response .= $chunk;
            return strlen($chunk);
        },
    ]);
    $ok = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($ok === false || $status < 200 || $status >= 300) return null;
    $json = json_decode($response, true);
    return is_array($json) ? $json : null;
}
function storeFile(string $path, array $body): bool {
    $temp = tempnam(dirname($path), 'tmp-');
    if ($temp === false) return false;
    $ok = file_put_contents($temp, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)) !== false
        && rename($temp, $path);
    if (!$ok) @unlink($temp);
    return $ok;
}
function text($value, int $limit): string {
    return is_string($value) ? trim(mb_substr(strip_tags($value), 0, $limit)) : '';
}
function recipeRecord(array $recipe, string $id, string $lang, string $query): ?array {
    $name = text($recipe['name'] ?? null, 150);
    $steps = array_values(array_filter(array_map(
        static fn($step) => text($step, 800),
        array_slice(is_array($recipe['steps'] ?? null) ? $recipe['steps'] : [], 0, 30)
    )));
    $items = [];
    foreach (array_slice(is_array($recipe['ingredients'] ?? null) ? $recipe['ingredients'] : [], 0, 50) as $row) {
        if (!is_array($row) || ($label = text($row['name'] ?? '', 120)) === '') continue;
        $qty = $row['qty'] ?? null;
        $items[] = [$label, is_numeric($qty) && (float)$qty > 0 && (float)$qty < 100000 ? (float)$qty : null,
            text($row['unit'] ?? '', 35), text($row['note'] ?? '', 160)];
    }
    $attribution = $recipe['attribution'] ?? [];
    $source = sourceUrl($attribution['url'] ?? null);
    if ($source === '' || !includesName($name, $query) || count($steps) < 2 || count($items) < 2) return null;
    $cuisine = $recipe['cuisine'] ?? 'international';
    $cuisine = ['greek'=>'mediterranean','middle_eastern'=>'levantine','nordic'=>'scandinavian','other'=>'international'][$cuisine] ?? $cuisine;
    $category = $recipe['category'] ?? '';
    $allergens = array_values(array_unique(array_map(
        static fn($a) => ['egg'=>'eggs','tree_nuts'=>'nuts','shellfish'=>'crustaceans'][$a] ?? $a,
        array_filter((array)($recipe['allergens'] ?? []), 'is_string')
    )));
    return [
        'id'=>$id, 'category'=>in_array($category, ['breakfast','snack','lunch','dinner','dessert','starter'], true) ? $category : 'starter',
        'cuisine'=>in_array($cuisine, CUISINES, true) ? $cuisine : 'international',
        'minutes'=>min(1440,max(0,(int)($recipe['time_min']['total'] ?? 0))), 'servings'=>min(50,max(0,(int)($recipe['servings'] ?? 0))),
        'allergens'=>$allergens, 'aliases'=>[$query],
        $lang=>['name'=>$name,'summary'=>text($recipe['summary'] ?? '', 320),'items'=>$items,'steps'=>$steps],
        'credit'=>text($attribution['credit'] ?? '', 250),'source'=>$source,'history'=>sourceUrl($attribution['history_url'] ?? null),
        'license'=>text($attribution['license'] ?? '', 50),'changes'=>text($attribution['changes'] ?? '', 180),
        'machineTranslated'=>($recipe['machine_translated'] ?? false) === true,
    ];
}
function corpusLookup(string $input, string $lang, string $query): ?array {
    $response = requestJson(CORPUS.'?'.http_build_query(['q'=>$input,'lang'=>$lang,'limit'=>8]));
    if ($response === null) return null;
    if (($response['lang_served'] ?? '') !== $lang) return [];
    $hits = [];
    foreach ((array)($response['results'] ?? []) as $row) {
        if (!is_array($row) || !is_string($row['name'] ?? null) || !includesName($row['name'],$query)) continue;
        if (!is_string($row['id'] ?? null) || !preg_match('/^[a-z0-9]+:[a-z0-9-]+$/D', $row['id'])) continue;
        $hits[] = $row;
    }
    usort($hits, static fn($a,$b) => (int)(normalized($b['name']) === $query) <=> (int)(normalized($a['name']) === $query));
    if ($hits === []) return [];
    $key = $hits[0]['id'];
    $detail = requestJson(CORPUS.'/'.rawurlencode($key).'?lang='.$lang);
    if ($detail === null) return null;
    if (($detail['lang_served'] ?? '') !== $lang || !is_array($detail['recipe'] ?? null)) return [];
    $id = 'web-'.$lang.'-'.str_replace(':','-',$key);
    $record = recipeRecord($detail['recipe'], $id, $lang, $query);
    return $record ? [$record] : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET','POST'], true)) reply(405, ['error'=>'method']);
$dir = __DIR__.'/_chef';
if ((!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) || !is_writable($dir)) reply(503, ['error'=>'storage']);
if (!is_file($dir.'/.htaccess')) @file_put_contents($dir.'/.htaccess', "Require all denied\n", LOCK_EX);
if ($method === 'GET') {
    $requested = is_string($_GET['ids'] ?? null) ? substr($_GET['ids'],0,5100) : '';
    if ($requested !== '') {
        $ids = array_unique(array_slice(explode(',', $requested),0,50));
        $files = array_map(static fn($id) => $dir.'/recipe-'.$id.'.json', array_filter(
            $ids, static fn($id) => preg_match('/^web-(?:pl|en)-[a-z0-9-]{1,90}$/D', $id)
        ));
    } else {
        $files = glob($dir.'/recipe-*.json') ?: [];
        usort($files, static fn($a,$b) => filemtime($b) <=> filemtime($a));
    }
    $rows = [];
    foreach (array_slice($files, 0, 100) as $file) {
        $row = json_decode((string)@file_get_contents($file), true);
        if (is_array($row)) $rows[] = $row;
    }
    reply(200, ['recipes'=>$rows]);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$local = PHP_SAPI === 'cli-server' && preg_match('#^http://(?:127\.0\.0\.1|localhost):\d+$#D',$origin);
if ($origin !== 'https://conatalerz.pl' && !$local) reply(403, ['error'=>'origin']);
$raw = file_get_contents('php://input', false, null, 0, 2049);
$body = is_string($raw) && strlen($raw) <= 2048 ? json_decode($raw, true) : null;
$input = is_string($body['query'] ?? null) ? trim($body['query']) : '';
$lang = $body['lang'] ?? '';
if (!in_array($lang,['pl','en'],true) || mb_strlen($input) < 3 || mb_strlen($input) > 96 ||
    !preg_match("/^[\p{L}\p{M}][\p{L}\p{M}\p{N} .’'&()+-]+$/uD", $input)) reply(400, ['error'=>'query']);
$query = normalized($input);
$key = hash('sha256', $lang.':'.$query);
$day = gmdate('Y-m-d');
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$lock = fopen($dir.'/limit.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) reply(503, ['error'=>'storage']);
$cache = $dir.'/query-'.$key.'.json';
if (is_file($cache)) {
    $cached = json_decode((string)file_get_contents($cache), true);
    $record = is_string($cached['id'] ?? null) && preg_match('/^web-[a-z0-9-]+$/D',$cached['id'])
        ? json_decode((string)@file_get_contents($dir.'/recipe-'.$cached['id'].'.json'), true) : null;
    if ($record || ($cached['until'] ?? 0) > time()) reply(200, ['recipes'=>$record ? [$record] : []]);
}

$ratePath = $dir.'/limits-'.$day.'.json';
$rate = json_decode((string)@file_get_contents($ratePath), true) ?: ['salt'=>bin2hex(random_bytes(24)),'total'=>0,'clients'=>[]];
$client = hash_hmac('sha256', $ip, $rate['salt']);
if ($rate['total'] >= 120 || ($rate['clients'][$client] ?? 0) >= 12) reply(429, ['error'=>'limit']);
$rate['total']++;
$rate['clients'][$client] = 1 + ($rate['clients'][$client] ?? 0);
if (!storeFile($ratePath, $rate)) reply(503, ['error'=>'storage']);
foreach (glob($dir.'/limits-*.json') ?: [] as $old) if ($old !== $ratePath) @unlink($old);
// Emit a short reservation so simultaneous requests for the same term use one lookup.
if (!storeFile($cache, ['until'=>time()+30])) reply(503, ['error'=>'storage']);
if (random_int(1,20) === 1) {
    foreach (glob($dir.'/query-*.json') ?: [] as $old) if (filemtime($old) < time()-86400*30) @unlink($old);
}
flock($lock, LOCK_UN);
fclose($lock);

$recipes = corpusLookup($input, $lang, $query);
if ($recipes === null) reply(503, ['error'=>'source']);
if ($recipes !== []) {
    $recipe = $recipes[0];
    if (!storeFile($dir.'/recipe-'.$recipe['id'].'.json', $recipe) || !storeFile($cache, ['id'=>$recipe['id']])) reply(503, ['error'=>'storage']);
} else {
    storeFile($cache, ['until'=>time()+3600]);
}
reply(200, ['recipes'=>$recipes]);
