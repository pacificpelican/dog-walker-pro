<?php
// JSON API for Dog Walker Pro: accounts, saves, status, and the NPC chat proxy.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/lib/store.php';
$cfg = require __DIR__ . '/config.php';

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    [$store, $storeInfo] = dwp_open_store($cfg);
} catch (Throwable $e) {
    out(['ok' => false, 'error' => 'Storage unavailable: ' . $e->getMessage()], 500);
}

$action = $_GET['action'] ?? '';
$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 400000) { out(['ok' => false, 'error' => 'Payload too large'], 413); }
    $body = json_decode($raw ?: '{}', true);
    if (!is_array($body)) { $body = []; }
}

function token_hash(string $t): string { return hash('sha256', $t); }
function current_user(DwpStore $store, array $cfg): ?string {
    $t = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if (!is_string($t) || strlen($t) < 20) { return null; }
    return $store->userByToken(token_hash($t), (int)$cfg['session_days']);
}
function valid_name(string $n): bool { return (bool)preg_match('/^[A-Za-z0-9_][A-Za-z0-9_ \-]{1,18}[A-Za-z0-9_]$/', $n); }
function start_session(DwpStore $store, string $name): string {
    $t = bin2hex(random_bytes(24));
    $store->createSession($name, token_hash($t));
    return $t;
}

switch ($action) {
    case 'status': {
        $ai = $cfg['ai'];
        out(['ok' => true, 'storage' => $storeInfo, 'ai' => ['enabled' => (bool)$ai['enabled'], 'url' => $ai['url'], 'model' => $ai['model']]]);
    }
    case 'register': {
        $name = trim((string)($body['username'] ?? ''));
        $pass = (string)($body['password'] ?? '');
        if (!valid_name($name)) { out(['ok' => false, 'error' => 'Screen name must be 3-20 letters, numbers, spaces, - or _.'], 400); }
        if (strlen($pass) < 6 || strlen($pass) > 100) { out(['ok' => false, 'error' => 'Password must be at least 6 characters.'], 400); }
        if (!$store->createUser($name, password_hash($pass, PASSWORD_DEFAULT))) { out(['ok' => false, 'error' => 'That screen name is taken.'], 409); }
        out(['ok' => true, 'username' => $name, 'token' => start_session($store, $name)]);
    }
    case 'login': {
        $name = trim((string)($body['username'] ?? ''));
        $pass = (string)($body['password'] ?? '');
        $u = $store->getUser($name);
        if (!$u || !password_verify($pass, $u['hash'])) { out(['ok' => false, 'error' => 'Wrong screen name or password.'], 401); }
        out(['ok' => true, 'username' => $u['name'], 'token' => start_session($store, $u['name'])]);
    }
    case 'me': {
        $u = current_user($store, $cfg);
        out(['ok' => true, 'username' => $u]);
    }
    case 'logout': {
        $t = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
        if (is_string($t) && $t !== '') { $store->dropSession(token_hash($t)); }
        out(['ok' => true]);
    }
    case 'save': {
        $u = current_user($store, $cfg);
        if (!$u) { out(['ok' => false, 'error' => 'Log in to save.'], 401); }
        $state = $body['state'] ?? null;
        if (!is_array($state)) { out(['ok' => false, 'error' => 'Missing state.'], 400); }
        $store->saveState($u, json_encode($state));
        out(['ok' => true, 'savedAt' => time()]);
    }
    case 'load': {
        $u = current_user($store, $cfg);
        if (!$u) { out(['ok' => false, 'error' => 'Log in to load.'], 401); }
        $s = $store->loadState($u);
        out(['ok' => true, 'state' => $s ? json_decode($s, true) : null]);
    }
    case 'delete_account': {
        $u = current_user($store, $cfg);
        if (!$u) { out(['ok' => false, 'error' => 'Not logged in.'], 401); }
        $rec = $store->getUser($u);
        if (!$rec || !password_verify((string)($body['password'] ?? ''), $rec['hash'])) { out(['ok' => false, 'error' => 'Password incorrect.'], 403); }
        $store->deleteUser($u);
        out(['ok' => true]);
    }
    case 'chat': {
        $ai = $cfg['ai'];
        $msg = mb_substr(trim((string)($body['message'] ?? '')), 0, 300);
        $npc = is_array($body['npc'] ?? null) ? $body['npc'] : [];
        if ($msg === '') { out(['ok' => false, 'error' => 'Empty message'], 400); }
        if (empty($ai['enabled'])) { out(['ok' => true, 'reply' => null, 'source' => 'disabled']); }

        $clean = fn($v, $n) => mb_substr(preg_replace('/[\r\n]+/', ' ', (string)$v), 0, $n);
        $places = array_slice(array_map(fn($p) => $clean($p, 40), is_array($body['places'] ?? null) ? $body['places'] : []), 0, 20);
        $system = "You are {$clean($npc['name'] ?? 'a local', 40)}, {$clean($npc['persona'] ?? 'a resident', 160)}, "
            . "a non-player character in a cheerful pixel-art video game called Dog Walker Pro set in a small city neighborhood. "
            . "The player is a woman who walks dogs and birds for points. Reply in character in 1-3 short sentences, plain text, no stage directions, "
            . "family-friendly. Things you know about: " . $clean($npc['topic'] ?? '', 200) . ". "
            . "Local businesses: " . implode(', ', $places) . ". Viking Sandwiches and Black Belle Books are neighborhood favorites. "
            . "Never mention being an AI or a game character.";
        $history = [];
        foreach (array_slice(is_array($body['history'] ?? null) ? $body['history'] : [], -6) as $h) {
            if (is_array($h) && in_array($h['role'] ?? '', ['user', 'assistant'], true)) {
                $history[] = ['role' => $h['role'], 'content' => $clean($h['content'] ?? '', 300)];
            }
        }
        $payload = json_encode([
            'model' => $ai['model'],
            'stream' => false,
            'messages' => array_merge([['role' => 'system', 'content' => $system]], $history, [['role' => 'user', 'content' => $msg]]),
            'options' => ['num_predict' => (int)$ai['max_tokens']],
        ]);
        $ctx = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => (int)$ai['timeout'],
            'ignore_errors' => true,
        ]]);
        $res = @file_get_contents(rtrim($ai['url'], '/') . '/api/chat', false, $ctx);
        $j = $res ? json_decode($res, true) : null;
        $reply = is_array($j) ? ($j['message']['content'] ?? null) : null;
        if (!is_string($reply) || trim($reply) === '') { out(['ok' => true, 'reply' => null, 'source' => 'unreachable']); }
        out(['ok' => true, 'reply' => mb_substr(trim($reply), 0, 400), 'source' => 'ollama']);
    }
    default:
        out(['ok' => false, 'error' => 'Unknown action'], 404);
}
