<?php
/**
 * Safe Space — Server-Side Protected Admin Route
 *
 * When accessed via Apache/XAMPP or PHP web server, enforces server-side
 * security headers, session handling, and loads the Admin & AI Dashboard.
 */

require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/admin_auth.php';

// Security Headers
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Load the secured admin dashboard interface
require_once __DIR__ . '/admin.html';
