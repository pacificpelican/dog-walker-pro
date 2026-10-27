<?php
// Dog Walker Pro configuration.
// Storage: by default player accounts and saves live in ./data (a local file store).
// To use MySQL / MariaDB instead, set 'mysql.enabled' => true and fill in the credentials.
// If the connection fails the app falls back to local storage; the Settings > Debug panel says which is active.
return [
    'mysql' => [
        'enabled'  => false,
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'database' => 'dogwalkerpro',
        'user'     => 'root',
        'password' => '',
    ],

    // Local file store directory (must be writable by PHP).
    'local_data_dir' => __DIR__ . '/data',

    // NPC conversations. Point this at an Ollama server (local by default).
    // If disabled or unreachable, NPCs answer with built-in scripted lines.
    'ai' => [
        'enabled'    => true,
        'provider'   => 'ollama',
        'url'        => 'http://127.0.0.1:11434',
        'model'      => 'llama3.1:8b',
        'timeout'    => 60,
        'max_tokens' => 120,
    ],

    // Session lifetime in days.
    'session_days' => 30,
];
