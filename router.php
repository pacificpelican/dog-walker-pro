<?php
// Router for PHP's built-in server:  php -S localhost:8000 router.php
// Blocks direct access to private files. (On Apache, data/.htaccess does the same.)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/(data|lib)(/|$)#', $path) || preg_match('#^/config\.php$#', $path) || preg_match('#^/\.#', $path)) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}
return false;
