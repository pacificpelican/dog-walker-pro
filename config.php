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

    // NPC conversations. Defaults to an Ollama server (local).
    // If disabled or unreachable, NPCs answer with built-in scripted lines.
    // 'provider' is one of: ollama | openai | anthropic | gemini | azure
    //   ollama    uses 'url' and 'model' below.
    //   others    use the matching block in 'cloud' (url/model optional overrides; 'openai' also works
    //             with any OpenAI-compatible endpoint, e.g. Mistral, Groq, xAI, via 'url').
    //   azure     = Azure OpenAI: set 'url' to your resource endpoint (https://NAME.openai.azure.com)
    //             and 'model' to your deployment name.
    // API keys: put them in 'api_key' or, preferably when deployed, in the environment variable shown.
    'ai' => [
        'enabled'    => true,
        'provider'   => 'ollama',
        'url'        => 'http://127.0.0.1:11434',
        'model'      => 'llama3.1:8b',
        'timeout'    => 60,
        'max_tokens' => 120,

        'cloud' => [
            'openai'    => ['url' => 'https://api.openai.com/v1',                    'model' => 'gpt-4o-mini',        'api_key' => ''], // env OPENAI_API_KEY
            'anthropic' => ['url' => 'https://api.anthropic.com/v1',                 'model' => 'claude-3-5-haiku-latest', 'api_key' => ''], // env ANTHROPIC_API_KEY
            'gemini'    => ['url' => 'https://generativelanguage.googleapis.com/v1beta', 'model' => 'gemini-2.0-flash', 'api_key' => ''], // env GEMINI_API_KEY
            'azure'     => ['url' => '',                                             'model' => '',                   'api_key' => '', 'api_version' => '2024-10-21'], // env AZURE_OPENAI_API_KEY
        ],
    ],

    // Session lifetime in days.
    'session_days' => 30,
];
