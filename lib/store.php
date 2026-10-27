<?php
// Storage abstraction: LocalStore (JSON file on disk) or MysqlStore (PDO).

interface DwpStore {
    public function mode(): string;
    public function createUser(string $name, string $hash): bool;
    public function getUser(string $name): ?array;          // ['name','hash']
    public function createSession(string $name, string $tokenHash): void;
    public function userByToken(string $tokenHash, int $maxAgeDays): ?string;
    public function dropSession(string $tokenHash): void;
    public function saveState(string $name, string $json): void;
    public function loadState(string $name): ?string;
    public function deleteUser(string $name): void;
}

class LocalStore implements DwpStore {
    private string $file;
    public function __construct(string $dir) {
        if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
        if (!is_dir($dir) || !is_writable($dir)) { throw new RuntimeException('Local data dir not writable: ' . $dir); }
        $this->file = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'store.json';
    }
    public function mode(): string { return 'local'; }

    private function mutate(callable $fn) {
        $fh = fopen($this->file, 'c+');
        flock($fh, LOCK_EX);
        $raw = stream_get_contents($fh);
        $db = $raw ? json_decode($raw, true) : null;
        if (!is_array($db)) { $db = ['users' => [], 'sessions' => []]; }
        $res = $fn($db);
        ftruncate($fh, 0); rewind($fh);
        fwrite($fh, json_encode($db));
        fflush($fh); flock($fh, LOCK_UN); fclose($fh);
        return $res;
    }
    public function createUser(string $name, string $hash): bool {
        return $this->mutate(function (&$db) use ($name, $hash) {
            $k = strtolower($name);
            if (isset($db['users'][$k])) { return false; }
            $db['users'][$k] = ['name' => $name, 'hash' => $hash, 'state' => null, 'created' => time()];
            return true;
        });
    }
    public function getUser(string $name): ?array {
        return $this->mutate(function (&$db) use ($name) {
            $u = $db['users'][strtolower($name)] ?? null;
            return $u ? ['name' => $u['name'], 'hash' => $u['hash']] : null;
        });
    }
    public function createSession(string $name, string $tokenHash): void {
        $this->mutate(function (&$db) use ($name, $tokenHash) {
            $db['sessions'][$tokenHash] = ['user' => strtolower($name), 'created' => time()];
        });
    }
    public function userByToken(string $tokenHash, int $maxAgeDays): ?string {
        return $this->mutate(function (&$db) use ($tokenHash, $maxAgeDays) {
            $s = $db['sessions'][$tokenHash] ?? null;
            if (!$s) { return null; }
            if ($s['created'] < time() - $maxAgeDays * 86400) { unset($db['sessions'][$tokenHash]); return null; }
            return $db['users'][$s['user']]['name'] ?? null;
        });
    }
    public function dropSession(string $tokenHash): void {
        $this->mutate(function (&$db) use ($tokenHash) { unset($db['sessions'][$tokenHash]); });
    }
    public function saveState(string $name, string $json): void {
        $this->mutate(function (&$db) use ($name, $json) {
            $k = strtolower($name);
            if (isset($db['users'][$k])) { $db['users'][$k]['state'] = $json; }
        });
    }
    public function loadState(string $name): ?string {
        return $this->mutate(function (&$db) use ($name) { return $db['users'][strtolower($name)]['state'] ?? null; });
    }
    public function deleteUser(string $name): void {
        $this->mutate(function (&$db) use ($name) {
            $k = strtolower($name);
            unset($db['users'][$k]);
            foreach ($db['sessions'] as $t => $s) { if ($s['user'] === $k) { unset($db['sessions'][$t]); } }
        });
    }
}

class MysqlStore implements DwpStore {
    private PDO $pdo;
    public function __construct(array $c) {
        if (!extension_loaded('pdo_mysql')) { throw new RuntimeException('pdo_mysql extension is not loaded'); }
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], (int)$c['port'], $c['database']);
        $this->pdo = new PDO($dsn, $c['user'], $c['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 4,
        ]);
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS dwp_users (
            name VARCHAR(40) NOT NULL PRIMARY KEY, hash VARCHAR(255) NOT NULL,
            state MEDIUMTEXT NULL, created INT NOT NULL) DEFAULT CHARSET=utf8mb4');
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS dwp_sessions (
            token CHAR(64) NOT NULL PRIMARY KEY, user_name VARCHAR(40) NOT NULL, created INT NOT NULL,
            INDEX (user_name)) DEFAULT CHARSET=utf8mb4');
    }
    public function mode(): string { return 'mysql'; }
    public function createUser(string $name, string $hash): bool {
        $q = $this->pdo->prepare('SELECT 1 FROM dwp_users WHERE name = ?');
        $q->execute([$name]);
        if ($q->fetchColumn()) { return false; }
        $this->pdo->prepare('INSERT INTO dwp_users (name, hash, created) VALUES (?,?,?)')->execute([$name, $hash, time()]);
        return true;
    }
    public function getUser(string $name): ?array {
        $q = $this->pdo->prepare('SELECT name, hash FROM dwp_users WHERE name = ?');
        $q->execute([$name]);
        return $q->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    public function createSession(string $name, string $tokenHash): void {
        $this->pdo->prepare('INSERT INTO dwp_sessions (token, user_name, created) VALUES (?,?,?)')->execute([$tokenHash, $name, time()]);
    }
    public function userByToken(string $tokenHash, int $maxAgeDays): ?string {
        $q = $this->pdo->prepare('SELECT u.name FROM dwp_sessions s JOIN dwp_users u ON u.name = s.user_name WHERE s.token = ? AND s.created > ?');
        $q->execute([$tokenHash, time() - $maxAgeDays * 86400]);
        $n = $q->fetchColumn();
        return $n === false ? null : $n;
    }
    public function dropSession(string $tokenHash): void {
        $this->pdo->prepare('DELETE FROM dwp_sessions WHERE token = ?')->execute([$tokenHash]);
    }
    public function saveState(string $name, string $json): void {
        $this->pdo->prepare('UPDATE dwp_users SET state = ? WHERE name = ?')->execute([$json, $name]);
    }
    public function loadState(string $name): ?string {
        $q = $this->pdo->prepare('SELECT state FROM dwp_users WHERE name = ?');
        $q->execute([$name]);
        $s = $q->fetchColumn();
        return $s === false ? null : $s;
    }
    public function deleteUser(string $name): void {
        $this->pdo->prepare('DELETE FROM dwp_sessions WHERE user_name = ?')->execute([$name]);
        $this->pdo->prepare('DELETE FROM dwp_users WHERE name = ?')->execute([$name]);
    }
}

// Returns [store, info]. info explains which backend is active and why.
function dwp_open_store(array $cfg): array {
    $info = ['mode' => 'local', 'mysqlConfigured' => !empty($cfg['mysql']['enabled']), 'mysqlError' => null];
    if ($info['mysqlConfigured']) {
        try {
            return [new MysqlStore($cfg['mysql']), array_merge($info, ['mode' => 'mysql'])];
        } catch (Throwable $e) {
            $info['mysqlError'] = $e->getMessage();
        }
    }
    return [new LocalStore($cfg['local_data_dir']), $info];
}
