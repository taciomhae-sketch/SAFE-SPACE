<?php
/**
 * Safe Space — Server-Side Protected Administrative API
 *
 * All routes in this endpoint strictly require administrative authorization
 * verified via require_admin_authorization(true).
 *
 * Requests from unauthorized accounts or unauthenticated sessions are
 * denied immediately with HTTP 401 Unauthorized or HTTP 403 Forbidden.
 */

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/supabase_bridge.php';

// Enforce strict administrative authorization middleware
$adminSession = require_admin_authorization(true);

$action = $_GET['action'] ?? '';
$client = new SupabaseClient();

switch ($action) {
    // ── 1. DASHBOARD OVERVIEW STATS ───────────────────────────────────
    case 'stats':
        $usersRes = $client->request('GET', 'profiles?select=id,role,is_deactivated,created_at');
        $postsRes = $client->request('GET', 'posts?select=id,created_at,archived,deleted_at');
        $reportsRes = $client->request('GET', 'reports?select=id,status');

        $users = ($usersRes['success'] && is_array($usersRes['data'])) ? $usersRes['data'] : [];
        $posts = ($postsRes['success'] && is_array($postsRes['data'])) ? $postsRes['data'] : [];
        $reports = ($reportsRes['success'] && is_array($reportsRes['data'])) ? $reportsRes['data'] : [];

        $totalUsers = count($users);
        $totalPosts = count($posts);
        $pendingReports = count(array_filter($reports, function($r) {
            return ($r['status'] ?? '') === 'pending' || ($r['status'] ?? '') === 'under_review';
        }));

        echo json_encode([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_posts' => $totalPosts,
                'pending_reports' => $pendingReports,
                'admin_status' => 'Admin Authentication: Enabled',
                'authorized_account' => AUTHORIZED_ADMIN_NAME
            ]
        ]);
        break;

    // ── 2. MODERATION REPORTS ──────────────────────────────────────────
    case 'reports':
        $res = $client->request('GET', 'reports?select=*,reporter:reporter_id(username,first_name,last_name),post:post_id(content,user_id)&order=created_at.desc');
        echo json_encode($res);
        break;

    // ── 3. USER MANAGEMENT (PROTECTED) ─────────────────────────────────
    case 'users':
        $res = $client->request('GET', 'profiles?select=id,username,first_name,last_name,email,role,is_admin,is_deactivated,account_status,violation_count,created_at&order=created_at.desc');
        echo json_encode($res);
        break;

    // ── 4. POST MODERATION ACTIONS ─────────────────────────────────────
    case 'moderate_post':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $postId = $input['post_id'] ?? '';
        $moderationStatus = $input['status'] ?? 'APPROVED';

        if (empty($postId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing post_id']);
            exit;
        }

        $updateData = ['moderation_status' => $moderationStatus];
        if ($moderationStatus === 'BLOCKED' || $moderationStatus === 'HIDDEN') {
            $updateData['deleted_at'] = date('c');
            $updateData['archived'] = true;
        }

        $res = $client->request('PATCH', "posts?id=eq.{$postId}", $updateData);
        echo json_encode($res);
        break;

    // ── 5. USER STATUS / ROLE UPDATE (PROTECTED) ───────────────────────
    case 'update_user_role':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $targetUserId = $input['user_id'] ?? '';
        $newRole = $input['role'] ?? 'student';

        // Cannot modify primary administrator account
        if ($targetUserId === AUTHORIZED_ADMIN_USER_ID && $newRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'The primary administrator account role cannot be modified.']);
            exit;
        }

        $isAdmin = ($newRole === 'admin');
        $res = $client->request('PATCH', "profiles?id=eq.{$targetUserId}", [
            'role' => $newRole,
            'is_admin' => $isAdmin
        ]);
        echo json_encode($res);
        break;

    default:
        echo json_encode([
            'success' => true,
            'service' => 'Safe Space Protected Admin API',
            'status' => 'Admin Authentication: Enabled'
        ]);
        break;
}
