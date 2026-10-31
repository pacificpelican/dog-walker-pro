<?php
// JSON API for Dog Walker Pro: accounts, saves, status, and the NPC chat proxy.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/lib/store.php';
$cfg = require __DIR__ . '/config.php';

function cut(string $s, int $start, int $len): string {
    return function_exists('mb_substr') ? mb_substr($s, $start, $len) : substr($s, $start, $len);
}

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

// Resolve the active AI provider's url/model/key from config (ollama = top-level keys, others = 'cloud' block).
function ai_resolve(array $ai): array {
    $p = strtolower((string)($ai['provider'] ?? 'ollama'));
    if ($p === 'ollama' || !isset($ai['cloud'][$p])) {
        return ['provider' => 'ollama', 'url' => (string)$ai['url'], 'model' => (string)$ai['model'], 'key' => '', 'version' => ''];
    }
    $c = $ai['cloud'][$p];
    $envName = ['openai' => 'OPENAI_API_KEY', 'anthropic' => 'ANTHROPIC_API_KEY', 'gemini' => 'GEMINI_API_KEY', 'azure' => 'AZURE_OPENAI_API_KEY'][$p] ?? '';
    $key = (string)($c['api_key'] ?? '');
    if ($key === '' && $envName !== '') { $key = (string)(getenv($envName) ?: ''); }
    return ['provider' => $p, 'url' => (string)($c['url'] ?? ''), 'model' => (string)($c['model'] ?? ''), 'key' => $key, 'version' => (string)($c['api_version'] ?? '')];
}
function ai_post(string $url, array $headers, array $payload, int $timeout): ?array {
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => implode("\r\n", array_merge(['Content-Type: application/json'], $headers)) . "\r\n",
        'content' => json_encode($payload),
        'timeout' => $timeout,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents($url, false, $ctx);
    $j = $res ? json_decode($res, true) : null;
    return is_array($j) ? $j : null;
}
// Returns the reply text or null. $msgs = [system, ...history, user] in {role, content} form.
function ai_chat(array $r, string $system, array $history, string $msg, int $maxTokens, int $timeout): ?string {
    $base = rtrim($r['url'], '/');
    $turns = array_merge($history, [['role' => 'user', 'content' => $msg]]);
    $chat = array_merge([['role' => 'system', 'content' => $system]], $turns);
    if ($r['provider'] !== 'ollama' && $r['key'] === '') { return null; }
    switch ($r['provider']) {
        case 'ollama':
            $j = ai_post($base . '/api/chat', [], ['model' => $r['model'], 'stream' => false, 'messages' => $chat, 'options' => ['num_predict' => $maxTokens]], $timeout);
            return $j['message']['content'] ?? null;
        case 'openai':
            $j = ai_post($base . '/chat/completions', ['Authorization: Bearer ' . $r['key']], ['model' => $r['model'], 'messages' => $chat, 'max_tokens' => $maxTokens], $timeout);
            return $j['choices'][0]['message']['content'] ?? null;
        case 'azure':
            $url = $base . '/openai/deployments/' . rawurlencode($r['model']) . '/chat/completions?api-version=' . rawurlencode($r['version'] ?: '2024-10-21');
            $j = ai_post($url, ['api-key: ' . $r['key']], ['messages' => $chat, 'max_tokens' => $maxTokens], $timeout);
            return $j['choices'][0]['message']['content'] ?? null;
        case 'anthropic':
            $j = ai_post($base . '/messages', ['x-api-key: ' . $r['key'], 'anthropic-version: 2023-06-01'],
                ['model' => $r['model'], 'system' => $system, 'messages' => $turns, 'max_tokens' => $maxTokens], $timeout);
            return $j['content'][0]['text'] ?? null;
        case 'gemini':
            $contents = array_map(fn($t) => ['role' => $t['role'] === 'assistant' ? 'model' : 'user', 'parts' => [['text' => $t['content']]]], $turns);
            $j = ai_post($base . '/models/' . rawurlencode($r['model']) . ':generateContent', ['x-goog-api-key: ' . $r['key']],
                ['systemInstruction' => ['parts' => [['text' => $system]]], 'contents' => $contents, 'generationConfig' => ['maxOutputTokens' => $maxTokens]], $timeout);
            return $j['candidates'][0]['content']['parts'][0]['text'] ?? null;
    }
    return null;
}

switch ($action) {
    case 'status': {
        $ai = $cfg['ai'];
        $r = ai_resolve($ai);
        out(['ok' => true, 'storage' => $storeInfo, 'ai' => ['enabled' => (bool)$ai['enabled'], 'provider' => $r['provider'], 'url' => $r['url'], 'model' => $r['model']]]);
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
        $msg = cut(trim((string)($body['message'] ?? '')), 0, 300);
        $npc = is_array($body['npc'] ?? null) ? $body['npc'] : [];
        if ($msg === '') { out(['ok' => false, 'error' => 'Empty message'], 400); }
        if (empty($ai['enabled'])) { out(['ok' => true, 'reply' => null, 'source' => 'disabled']); }

        $clean = fn($v, $n) => cut(preg_replace('/[\r\n]+/', ' ', (string)$v), 0, $n);
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
        $r = ai_resolve($ai);
        $reply = ai_chat($r, $system, $history, $msg, (int)$ai['max_tokens'], (int)$ai['timeout']);
        if (!is_string($reply) || trim($reply) === '') { out(['ok' => true, 'reply' => null, 'source' => 'unreachable']); }
        out(['ok' => true, 'reply' => cut(trim($reply), 0, 400), 'source' => $r['provider']]);
    }
    default:
        out(['ok' => false, 'error' => 'Unknown action'], 404);
}
