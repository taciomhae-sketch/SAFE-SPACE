<?php
/**
 * Safe Space — Server-Side PHP Configuration
 * Used when running on XAMPP (Apache) / PHP Backend
 */

// Supabase Configuration
define('SUPABASE_URL', 'https://ssqswqqfsbfgjsrllprq.supabase.co');
define('SUPABASE_ANON_KEY', 'sb_publishable_yOcs11bwjXyhA1DuUAQCBQ_dwo-zhLM');

// AI Moderation API URL
define('AI_API_URL', 'http://127.0.0.1:8000');

// =========================================================================
// STRICT ADMINISTRATOR AUTHORIZATION & CREDENTIAL SECURITY
// =========================================================================
// The only authorized account permitted to access the Admin & AI Dashboard
define('AUTHORIZED_ADMIN_USER_ID', '60d80c30-97e8-44cf-90e2-3a3c02b9975a');
define('AUTHORIZED_ADMIN_EMAIL', 'taciomhae@gmail.com');
define('AUTHORIZED_ADMIN_NAME', 'Lovely Mae Tacio');

// Secure Bcrypt hash generated via password_hash() for administrator authentication.
// Plaintext password is NEVER stored or exposed anywhere in the platform.
define('ADMIN_PASSWORD_HASH', '$2y$10$gHNKqm/QAPl8WwKuhZPokOjXF7HsEGsaZyDxaOZHKnJ1GZW5FBvGK');

// Cryptographic signing secret for administrative session tokens
define('ADMIN_TOKEN_SECRET', 'c7f93e18a8b2405d9e51c360814bb6f8319e7a89204cd1549cf52d80ef74a102');

// Session & rate limiting parameters
define('ADMIN_SESSION_LIFETIME', 7200); // 2 hours
define('ADMIN_MAX_ATTEMPTS', 5);        // 5 failed attempts before lockout
define('ADMIN_LOCKOUT_TIME', 900);      // 15 minutes lockout
