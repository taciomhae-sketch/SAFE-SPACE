<?php
/**
 * Safe Space — Server-Side Administrator Authentication & Authorization Middleware
 *
 * Implements strict, tamper-proof administrative security:
 * 1. Restricts dashboard access exclusively to Lovely Mae Tacio (UUID 60d80c30-97e8-44cf-90e2-3a3c02b9975a).
 * 2. Verifies credentials using Bcrypt password_verify() on the server.
 * 3. Never returns or exposes the password or hash.
 * 4. Issues time-limited cryptographically signed session tokens.
 * 5. Applies IP/session brute-force rate limiting.
 * 6. Returns HTTP 401 Unauthorized / 403 Forbidden for unauthorized requests.
 */

require_once __DIR__ . '/config.php';

// Ensure CORS & Security Headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// Start PHP session if not already active and headers not sent
if (session_status() === PHP_SESSION_NONE && !headers_sent() && php_sapi_name() !== 'cli') {
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.use_only_cookies', '1');
    @session_start();
}

/**
 * Retrieve client IP address
 */
function get_client_ip() {
    $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = explode(',', $_SERVER[$k])[0];
            return trim($ip);
        }
    }
    return '127.0.0.1';
}

/**
 * Check brute-force rate limit
 */
function check_rate_limit($ip) {
    $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ss_admin_rate_' . md5($ip) . '.json';
    if (!file_exists($file)) {
        return ['allowed' => true];
    }
    $raw = @file_get_contents($file);
    $data = json_decode($raw, true);
    if (!$data || !is_array($data)) {
        return ['allowed' => true];
    }

    $now = time();
    if (!empty($data['lockout_until']) && $data['lockout_until'] > $now) {
        $remaining = $data['lockout_until'] - $now;
        return [
            'allowed' => false,
            'retry_after' => $remaining,
            'message' => "Too many authentication attempts. Please try again in {$remaining} seconds."
        ];
    }

    // Reset if window expired
    if (!empty($data['last_attempt']) && ($now - $data['last_attempt']) > ADMIN_LOCKOUT_TIME) {
        @unlink($file);
        return ['allowed' => true];
    }

    return ['allowed' => true];
}

/**
 * Record a failed authentication attempt
 */
function record_failed_attempt($ip) {
    $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ss_admin_rate_' . md5($ip) . '.json';
    $now = time();
    $data = ['attempts' => 0, 'last_attempt' => $now, 'lockout_until' => 0];

    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        $parsed = json_decode($raw, true);
        if (is_array($parsed)) {
            $data = $parsed;
        }
    }

    $data['attempts'] = ($data['attempts'] ?? 0) + 1;
    $data['last_attempt'] = $now;

    if ($data['attempts'] >= ADMIN_MAX_ATTEMPTS) {
        $data['lockout_until'] = $now + ADMIN_LOCKOUT_TIME;
    }

    @file_put_contents($file, json_encode($data));
}

/**
 * Reset rate limit after successful authentication
 */
function reset_rate_limit($ip) {
    $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ss_admin_rate_' . md5($ip) . '.json';
    if (file_exists($file)) {
        @unlink($file);
    }
}

/**
 * Verify a Supabase JWT access token directly against Supabase Auth API
 */
function verify_supabase_jwt($accessToken) {
    if (empty($accessToken)) return null;

    $ch = curl_init();
    $url = rtrim(SUPABASE_URL, '/') . '/auth/v1/user';

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $user = json_decode($response, true);
        if (!empty($user['id'])) {
            return $user;
        }
    }
    return null;
}

/**
 * Generate a signed HMAC-SHA256 admin session token
 */
function generate_admin_token($userId) {
    $payloadData = [
        'sub' => $userId,
        'role' => 'admin',
        'exp' => time() + ADMIN_SESSION_LIFETIME,
        'iat' => time(),
        'nonce' => bin2hex(random_bytes(16))
    ];
    $payloadJson = json_encode($payloadData);
    $payloadEncoded = rtrim(strtr(base64_encode($payloadJson), '+/', '-_'), '=');
    $signature = hash_hmac('sha256', $payloadEncoded, ADMIN_TOKEN_SECRET);
    return $payloadEncoded . '.' . $signature;
}

/**
 * Verify an HMAC-SHA256 admin session token
 */
function verify_admin_token($token) {
    if (empty($token) || !is_string($token)) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;

    list($payloadEncoded, $signature) = $parts;
    $expectedSignature = hash_hmac('sha256', $payloadEncoded, ADMIN_TOKEN_SECRET);

    if (!hash_equals($expectedSignature, $signature)) {
        return null; // Invalid signature
    }

    $remainder = strlen($payloadEncoded) % 4;
    if ($remainder) {
        $payloadEncoded .= str_repeat('=', 4 - $remainder);
    }
    $payloadJson = base64_decode(strtr($payloadEncoded, '-_', '+/'));
    $payload = json_decode($payloadJson, true);

    if (!$payload || !is_array($payload)) return null;

    // Check expiration
    if (empty($payload['exp']) || $payload['exp'] < time()) {
        return null; // Token expired
    }

    // Verify authorized user ID
    if (empty($payload['sub']) || $payload['sub'] !== AUTHORIZED_ADMIN_USER_ID) {
        return null; // Unauthorized user
    }

    return $payload;
}

/**
 * Middleware: Verify that current request is authorized as the administrator.
 *
 * @param bool $requireAuth If true, terminates with HTTP 401/403 on failure.
 * @return array|null Returns admin session payload if authorized, or null.
 */
function require_admin_authorization($requireAuth = true) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    }

    // 1. Try verifying admin session token from header
    if (!empty($token)) {
        $verified = verify_admin_token($token);
        if ($verified) {
            return $verified;
        }
    }

    // 2. Try verifying PHP session
    if (!empty($_SESSION['admin_auth']['user_id'])) {
        $sUserId = $_SESSION['admin_auth']['user_id'];
        $sExp = $_SESSION['admin_auth']['expires_at'] ?? 0;
        if ($sUserId === AUTHORIZED_ADMIN_USER_ID && $sExp > time()) {
            return [
                'sub' => $sUserId,
                'role' => 'admin',
                'exp' => $sExp
            ];
        }
    }

    // 3. Not authorized
    if ($requireAuth) {
        header('Content-Type: application/json; charset=UTF-8');
        if (empty($token) && empty($_SESSION['admin_auth'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Authentication required. Please sign in with the authorized administrator account.',
                'code' => 401
            ]);
        } else {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Access denied. Account is not authorized for administrator access.',
                'code' => 403
            ]);
        }
        exit;
    }

    return null;
}

// ── Direct HTTP API Endpoint Routing ──────────────────────────────────────────
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    header('Content-Type: application/json; charset=UTF-8');
    $action = $_GET['action'] ?? '';
    $clientIp = get_client_ip();

    switch ($action) {
        // ── 1. VERIFY ADMIN PASSCODE & ACCOUNT ─────────────────────────────
        case 'verify':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
                exit;
            }

            // Rate limit check
            $rate = check_rate_limit($clientIp);
            if (!$rate['allowed']) {
                http_response_code(429);
                echo json_encode(['success' => false, 'error' => $rate['message'], 'retry_after' => $rate['retry_after']]);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true) ?: [];

            $submittedPassword = trim((string)($input['password'] ?? ''));
            $accessToken = trim((string)($input['access_token'] ?? ''));

            if (empty($submittedPassword)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password is required.']);
                exit;
            }

            // 1. Verify user identity via Supabase token or authenticated session
            $authenticatedUser = null;
            if (!empty($accessToken)) {
                $authenticatedUser = verify_supabase_jwt($accessToken);
            }

            // If Supabase token provided, ensure it belongs strictly to Lovely Mae Tacio
            if ($authenticatedUser) {
                if ($authenticatedUser['id'] !== AUTHORIZED_ADMIN_USER_ID) {
                    record_failed_attempt($clientIp);
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Access denied. Account is not authorized for administrator access.'
                    ]);
                    exit;
                }
            } else {
                // If token could not be verified online, check if user session or ID was claimed
                $claimedUserId = trim((string)($input['user_id'] ?? ''));
                if ($claimedUserId !== AUTHORIZED_ADMIN_USER_ID) {
                    record_failed_attempt($clientIp);
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Access denied. Account is not authorized for administrator access.'
                    ]);
                    exit;
                }
            }

            // 2. Verify password hash using Bcrypt
            if (!password_verify($submittedPassword, ADMIN_PASSWORD_HASH)) {
                record_failed_attempt($clientIp);
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Authentication failed. Invalid password or unauthorized account.'
                ]);
                exit;
            }

            // Success! Reset rate limit and issue token
            reset_rate_limit($clientIp);
            $token = generate_admin_token(AUTHORIZED_ADMIN_USER_ID);

            $_SESSION['admin_auth'] = [
                'user_id' => AUTHORIZED_ADMIN_USER_ID,
                'email' => AUTHORIZED_ADMIN_EMAIL,
                'role' => 'admin',
                'expires_at' => time() + ADMIN_SESSION_LIFETIME
            ];

            echo json_encode([
                'success' => true,
                'message' => 'Admin authorization granted',
                'admin_token' => $token,
                'status_indicator' => 'Admin Authentication: Enabled',
                'expires_in' => ADMIN_SESSION_LIFETIME
            ]);
            break;

        // ── 2. CHECK ACCESS STATUS (FOR PROFILE MENU & ROUTE GUARDS) ──────
        case 'check_access':
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = trim($matches[1]);
            }

            // A. Check if already has valid admin token
            if (!empty($token)) {
                $verified = verify_admin_token($token);
                if ($verified) {
                    echo json_encode([
                        'authorized' => true,
                        'account_authorized' => true,
                        'unlocked' => true,
                        'user_id' => AUTHORIZED_ADMIN_USER_ID,
                        'status' => 'Admin Authentication: Enabled'
                    ]);
                    exit;
                }
            }

            // B. Check if Supabase access token belongs to Lovely Mae Tacio
            $supabaseToken = $_GET['token'] ?? ($_POST['token'] ?? '');
            if (!empty($supabaseToken)) {
                $sbUser = verify_supabase_jwt($supabaseToken);
                if ($sbUser && $sbUser['id'] === AUTHORIZED_ADMIN_USER_ID) {
                    echo json_encode([
                        'authorized' => false,
                        'account_authorized' => true,
                        'unlocked' => false,
                        'user_id' => AUTHORIZED_ADMIN_USER_ID,
                        'message' => 'Account authorized. Password verification required.'
                    ]);
                    exit;
                }
            }

            // C. Check user_id parameter if requested by client-side guard
            $reqUserId = $_GET['user_id'] ?? '';
            $isAuthorizedAccount = ($reqUserId === AUTHORIZED_ADMIN_USER_ID);

            echo json_encode([
                'authorized' => false,
                'account_authorized' => $isAuthorizedAccount,
                'unlocked' => false
            ]);
            break;

        // ── 3. LOGOUT / LOCK ADMIN SESSION ─────────────────────────────────
        case 'logout':
            unset($_SESSION['admin_auth']);
            if (session_id()) {
                session_destroy();
            }
            echo json_encode(['success' => true, 'message' => 'Admin session terminated']);
            break;

        default:
            echo json_encode([
                'success' => true,
                'service' => 'Safe Space Administrator Authorization Service',
                'status' => 'Admin Authentication: Enabled'
            ]);
            break;
    }
}
