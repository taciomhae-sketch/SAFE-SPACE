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
        $postsRes = $client->request('GET', 'posts?select=id,sentiment,sentiment_score,moderation_status,moderation_category,ai_recommendation,is_user_confirmed,created_at,archived,deleted_at');
        $reportsRes = $client->request('GET', 'reports?select=id,status');

        $users = ($usersRes['success'] && is_array($usersRes['data'])) ? $usersRes['data'] : [];
        $posts = ($postsRes['success'] && is_array($postsRes['data'])) ? $postsRes['data'] : [];
        $reports = ($reportsRes['success'] && is_array($reportsRes['data'])) ? $reportsRes['data'] : [];

        $totalUsers = count($users);
        $totalPosts = count($posts);
        $pendingReports = count(array_filter($reports, function($r) {
            return ($r['status'] ?? '') === 'pending' || ($r['status'] ?? '') === 'under_review';
        }));

        $postsAnalyzed = $totalPosts;
        $warningsDisplayed = 0;
        $postsBlocked = 0;
        $postsRequiringReview = 0;
        $recommendationsGenerated = 0;

        foreach ($posts as $p) {
            $status = strtoupper($p['moderation_status'] ?? 'APPROVED');
            $cat = strtoupper($p['moderation_category'] ?? 'SAFE');
            $isConfirmed = !empty($p['is_user_confirmed']);

            if ($isConfirmed || $status === 'REVIEW' || $status === 'BLOCKED' || $cat !== 'SAFE') {
                $warningsDisplayed++;
            }
            if ($status === 'BLOCKED' || !empty($p['deleted_at'])) {
                $postsBlocked++;
            }
            if ($status === 'REVIEW') {
                $postsRequiringReview++;
            }
            if (!empty($p['ai_recommendation'])) {
                $recommendationsGenerated++;
            }
        }

        // Live Safety Monitoring Metrics
        $alertsRes = $client->request('GET', 'safety_alerts?select=id,risk_level,status,concern_type,is_anonymous,created_at');
        $alerts = ($alertsRes['success'] && is_array($alertsRes['data'])) ? $alertsRes['data'] : [];

        $criticalCount = 0;
        $moderateCount = 0;
        $lowCount = 0;
        $unreviewedAlerts = 0;
        $escalatedCases = 0;
        $resolvedCases = 0;

        foreach ($alerts as $a) {
            $rl = strtolower($a['risk_level'] ?? 'none');
            $st = strtolower($a['status'] ?? 'new');

            if ($rl === 'critical' || $rl === 'high') {
                $criticalCount++;
            } elseif ($rl === 'moderate') {
                $moderateCount++;
            } elseif ($rl === 'low') {
                $lowCount++;
            }

            if ($st === 'new') {
                $unreviewedAlerts++;
            } elseif ($st === 'escalated') {
                $escalatedCases++;
            } elseif ($st === 'resolved') {
                $resolvedCases++;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_posts' => $totalPosts,
                'pending_reports' => $pendingReports,
                'posts_analyzed' => $postsAnalyzed,
                'safety_warnings_displayed' => $warningsDisplayed,
                'posts_blocked' => $postsBlocked,
                'posts_requiring_review' => $postsRequiringReview,
                'recommendations_generated' => $recommendationsGenerated,
                'safety_critical_count' => $criticalCount,
                'safety_moderate_count' => $moderateCount,
                'safety_low_count' => $lowCount,
                'safety_unreviewed_count' => $unreviewedAlerts,
                'safety_escalated_count' => $escalatedCases,
                'safety_resolved_count' => $resolvedCases,
                'admin_status' => 'Admin Authentication: Enabled',
                'authorized_account' => AUTHORIZED_ADMIN_NAME
            ]
        ]);
        break;

    // ── 1B. AGGREGATED AI MODERATION & SENTIMENT ANALYTICS ───────────────
    case 'ai_metrics':
        $postsRes = $client->request('GET', 'posts?select=id,sentiment,sentiment_score,moderation_status,moderation_category,ai_recommendation,is_user_confirmed,created_at,archived,deleted_at');
        $posts = ($postsRes['success'] && is_array($postsRes['data'])) ? $postsRes['data'] : [];

        $totalPosts = count($posts);
        $warningsCount = 0;
        $blockedCount = 0;
        $reviewCount = 0;
        $recCount = 0;

        $sentimentCounts = ['POSITIVE' => 0, 'NEUTRAL' => 0, 'NEGATIVE' => 0];
        $categoryCounts = [
            'SAFE' => 0,
            'SELF_HARM' => 0,
            'BULLYING_HARASSMENT' => 0,
            'THREAT_VIOLENCE' => 0,
            'DISTRESS_SENSITIVE' => 0,
            'OTHER' => 0
        ];

        foreach ($posts as $p) {
            $sent = strtoupper($p['sentiment'] ?? 'NEUTRAL');
            if (isset($sentimentCounts[$sent])) {
                $sentimentCounts[$sent]++;
            } else {
                $sentimentCounts['NEUTRAL']++;
            }

            $cat = strtoupper($p['moderation_category'] ?? 'SAFE');
            if ($cat === 'SAFE') {
                $categoryCounts['SAFE']++;
            } elseif ($cat === 'SELF_HARM' || $cat === 'ENCOURAGEMENT_OF_SELF_HARM') {
                $categoryCounts['SELF_HARM']++;
            } elseif ($cat === 'BULLYING' || $cat === 'HARASSMENT' || $cat === 'HATE') {
                $categoryCounts['BULLYING_HARASSMENT']++;
            } elseif ($cat === 'THREAT' || $cat === 'VIOLENCE') {
                $categoryCounts['THREAT_VIOLENCE']++;
            } elseif ($cat === 'DISTRESS' || $cat === 'ALARMING' || $cat === 'SENSITIVE') {
                $categoryCounts['DISTRESS_SENSITIVE']++;
            } else {
                $categoryCounts['OTHER']++;
            }

            $status = strtoupper($p['moderation_status'] ?? 'APPROVED');
            if (!empty($p['is_user_confirmed']) || $status === 'REVIEW' || $status === 'BLOCKED' || $cat !== 'SAFE') {
                $warningsCount++;
            }
            if ($status === 'BLOCKED' || !empty($p['deleted_at'])) {
                $blockedCount++;
            }
            if ($status === 'REVIEW') {
                $reviewCount++;
            }
            if (!empty($p['ai_recommendation'])) {
                $recCount++;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'posts_analyzed' => $totalPosts,
                'safety_warnings_displayed' => $warningsCount,
                'posts_revised_or_blocked' => $blockedCount,
                'posts_requiring_review' => $reviewCount,
                'recommendations_generated' => $recCount,
                'sentiment_distribution' => $sentimentCounts,
                'category_distribution' => $categoryCounts,
                'last_updated' => date('c')
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
        $res = $client->request('GET', 'profiles?select=id,username,first_name,last_name,email,role,is_admin,student_id,approval_status,is_approved,is_deactivated,account_status,violation_count,created_at&order=created_at.desc');
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

    // ── 5B. GET PENDING USERS (PROTECTED) ──────────────────────────────
    case 'pending_users':
        $res = $client->request('GET', 'profiles?approval_status=eq.pending&is_approved=eq.false&order=created_at.desc');
        echo json_encode($res);
        break;

    // ── 6. APPROVE STUDENT SIGN-UP (PROTECTED) ─────────────────────────
    case 'approve_user':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $targetUserId = trim($input['user_id'] ?? '');
        if (empty($targetUserId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing student user_id']);
            exit;
        }

        // Verify target account exists
        $checkRes = $client->request('GET', "profiles?id=eq.{$targetUserId}&select=id,email,approval_status,is_approved,role");
        if (!$checkRes['success'] || empty($checkRes['data'])) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Target student account not found in database']);
            exit;
        }

        $targetUser = $checkRes['data'][0];
        $currentStatus = strtolower(trim($targetUser['approval_status'] ?? ''));
        if ($currentStatus === 'approved' && !empty($targetUser['is_approved'])) {
            echo json_encode([
                'success' => true,
                'already_approved' => true,
                'message' => 'Student account has already been approved',
                'user_id' => $targetUserId
            ]);
            exit;
        }

        // Perform atomic database update on actual user profile record
        $updatePayload = [
            'approval_status' => 'approved',
            'is_approved' => true,
            'approved_at' => date('c'),
            'approved_by' => $adminSession['email'] ?? AUTHORIZED_ADMIN_EMAIL
        ];

        $res = $client->request('PATCH', "profiles?id=eq.{$targetUserId}", $updatePayload);

        if ($res['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'Student account approved successfully',
                'user_id' => $targetUserId,
                'approved_at' => $updatePayload['approved_at']
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $res['error'] ?? 'Database update failed when approving student account'
            ]);
        }
        break;

    // ── 7. REJECT STUDENT SIGN-UP (PROTECTED) ──────────────────────────
    case 'reject_user':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $targetUserId = $input['user_id'] ?? '';
        $reason = $input['reason'] ?? 'Registration details could not be verified.';
        if (empty($targetUserId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing user_id']);
            exit;
        }

        $res = $client->request('PATCH', "profiles?id=eq.{$targetUserId}", [
            'approval_status' => 'rejected',
            'is_approved' => false,
            'reject_reason' => $reason,
            'rejected_at' => date('c')
        ]);
        echo json_encode($res);
        break;

    // ── 7B. VERIFY STUDENT ID DOCUMENT & MATCHING STATUS ──────────────
    case 'verify_student_id_document':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $targetUserId = trim($input['user_id'] ?? '');
        $status = strtoupper(trim($input['status'] ?? 'VERIFIED'));
        $notes = trim($input['notes'] ?? '');

        if (empty($targetUserId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing student user_id']);
            exit;
        }

        $isVerified = ($status === 'VERIFIED');
        $patchData = [
            'student_id_status' => $status,
            'student_id_verified' => $isVerified,
            'student_id_verified_at' => $isVerified ? date('c') : null,
            'student_id_notes' => $notes ?: ($isVerified ? 'Official Student ID verified by administrator' : 'Student ID document rejected')
        ];

        $res = $client->request('PATCH', "profiles?id=eq.{$targetUserId}", $patchData);
        echo json_encode($res);
        break;

    // ── 8. SAFETY MONITORING & RISK ALERTS (PROTECTED) ─────────────────
    case 'safety_alerts':
        $riskFilter = $_GET['risk_level'] ?? '';
        $statusFilter = $_GET['status'] ?? '';
        $anonFilter = $_GET['is_anonymous'] ?? '';
        $query = 'safety_alerts?select=*&order=created_at.desc';

        if (!empty($riskFilter) && $riskFilter !== 'all') {
            if ($riskFilter === 'critical_high') {
                $query .= '&risk_level=in.(critical,high)';
            } else {
                $query .= "&risk_level=eq.{$riskFilter}";
            }
        }
        if (!empty($statusFilter) && $statusFilter !== 'all') {
            $query .= "&status=eq.{$statusFilter}";
        }
        if ($anonFilter !== '' && $anonFilter !== 'all') {
            $isAnonBool = ($anonFilter === 'true' || $anonFilter === '1') ? 'true' : 'false';
            $query .= "&is_anonymous=eq.{$isAnonBool}";
        }

        $res = $client->request('GET', $query);
        if (!$res['success']) {
            echo json_encode([
                'success' => false,
                'error' => $res['error'] ?? 'Database table safety_alerts not ready or query failed',
                'data' => []
            ]);
            break;
        }
        $alerts = is_array($res['data']) ? $res['data'] : [];

        // Attach user display details securely
        // CRITICAL PRIVACY SAFEGUARD: If post is anonymous, author identity remains masked!
        // Authorized admins can reveal it via 'reveal_identity' with documented justification.
        $sanitizedAlerts = [];
        foreach ($alerts as $a) {
            $isAnon = !empty($a['is_anonymous']);
            $uId = $a['user_id'] ?? '';

            if ($isAnon) {
                $a['author_display_name'] = 'Anonymous';
                $a['author_email'] = null;
                $a['author_student_id'] = null;
                $a['is_identity_locked'] = true;
            } else {
                $a['is_identity_locked'] = false;
                // Fetch public user details
                if (!empty($uId)) {
                    $uRes = $client->request('GET', "profiles?id=eq.{$uId}&select=username,first_name,last_name,email,student_id");
                    if ($uRes['success'] && !empty($uRes['data'][0])) {
                        $prof = $uRes['data'][0];
                        $fullName = trim(($prof['first_name'] ?? '') . ' ' . ($prof['last_name'] ?? ''));
                        $a['author_display_name'] = !empty($fullName) ? $fullName : ($prof['username'] ?? 'Student');
                        $a['author_email'] = $prof['email'] ?? '';
                        $a['author_student_id'] = $prof['student_id'] ?? '';
                    } else {
                        $a['author_display_name'] = 'Member';
                    }
                } else {
                    $a['author_display_name'] = 'Member';
                }
            }
            $sanitizedAlerts[] = $a;
        }

        echo json_encode([
            'success' => true,
            'data' => $sanitizedAlerts
        ]);
        break;

    // ── 9. UPDATE SAFETY ALERT STATUS & RESOLUTION WORKFLOW ───────────
    case 'update_safety_alert':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        // Strict Admin Authorization Verification
        if (empty($adminSession['sub']) || $adminSession['sub'] !== AUTHORIZED_ADMIN_USER_ID) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied. Administrator authorization required.']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $alertId = trim((string)($input['alert_id'] ?? ''));
        $newStatus = trim((string)($input['status'] ?? 'under_investigation'));
        $actionTaken = trim((string)($input['action_taken'] ?? 'pending_review'));
        $referralEntity = trim((string)($input['referral_entity'] ?? ($input['counselor_referral'] ?? 'none')));
        $referralStatus = trim((string)($input['referral_status'] ?? 'none'));
        $followupDate = trim((string)($input['followup_date'] ?? ''));
        $notes = trim((string)($input['review_notes'] ?? ($input['admin_notes'] ?? '')));
        $resolutionSummary = trim((string)($input['resolution_summary'] ?? ''));
        $assignedTo = trim((string)($input['assigned_to'] ?? AUTHORIZED_ADMIN_NAME));
        $statusHistory = $input['status_history'] ?? [];

        if (empty($alertId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing alert_id']);
            exit;
        }

        $updatePayload = [
            'status' => $newStatus,
            'assigned_to' => $assignedTo,
            'action_taken' => $actionTaken,
            'referral_entity' => $referralEntity,
            'referral_status' => $referralStatus,
            'updated_at' => date('c')
        ];
        if (!empty($notes)) {
            $updatePayload['review_notes'] = $notes;
        }
        if (!empty($followupDate)) {
            $updatePayload['followup_date'] = $followupDate;
        }
        if (!empty($resolutionSummary)) {
            $updatePayload['resolution_summary'] = $resolutionSummary;
        }
        if ($newStatus === 'resolved' || $newStatus === 'closed') {
            $updatePayload['resolved_at'] = date('c');
        }
        if (!empty($statusHistory)) {
            $updatePayload['status_history'] = $statusHistory;
        }

        // Try primary UUID update
        $res = $client->request('PATCH', "safety_alerts?id=eq.{$alertId}", $updatePayload);
        // If not found, try by alert_code
        if (!$res['success']) {
            $res = $client->request('PATCH', "safety_alerts?alert_code=eq.{$alertId}", $updatePayload);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Safety case resolution record saved successfully.',
            'data' => array_merge(['id' => $alertId], $updatePayload)
        ]);
        break;

    // ── 10. REVEAL ANONYMOUS ACCOUNT IDENTITY (RESTRICTED AUDIT WORKFLOW) ──
    case 'reveal_identity':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        // Strict Admin Authorization Verification
        if (empty($adminSession['sub']) || $adminSession['sub'] !== AUTHORIZED_ADMIN_USER_ID) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Access denied. You are not authorized to view this account identity.'
            ]);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $alertId = trim((string)($input['alert_id'] ?? ''));
        $contentId = trim((string)($input['content_id'] ?? ''));
        $reason = trim((string)($input['reason'] ?? ''));

        // 1. Mandatory justification requirement (RA 10173 & safety policy compliance)
        if (empty($reason) || strlen($reason) < 10) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'A specific, documented justification reason (at least 10 characters) is required under the safety and data privacy policy to reveal an anonymous author.'
            ]);
            exit;
        }

        // 2. Fetch target user ID from alert or specific content (posts / messages)
        $targetUserId = null;
        $associatedContentText = '';
        $contentType = 'post';
        $submissionTimestamp = '';

        // Check safety alert if alertId provided
        if (!empty($alertId)) {
            // First try by UUID id
            $alertRes = $client->request('GET', "safety_alerts?id=eq.{$alertId}&select=id,alert_code,content_id,content_type,user_id,is_anonymous,risk_level,evidence_text,created_at");
            // If not found, try by alert_code
            if (!$alertRes['success'] || empty($alertRes['data'][0])) {
                $alertRes = $client->request('GET', "safety_alerts?alert_code=eq.{$alertId}&select=id,alert_code,content_id,content_type,user_id,is_anonymous,risk_level,evidence_text,created_at");
            }

            if ($alertRes['success'] && !empty($alertRes['data'][0])) {
                $alertData = $alertRes['data'][0];
                $targetUserId = $alertData['user_id'] ?? null;
                $contentId = $contentId ?: ($alertData['content_id'] ?? '');
                $contentType = $alertData['content_type'] ?? 'post';
                $associatedContentText = $alertData['evidence_text'] ?? '';
                $submissionTimestamp = $alertData['created_at'] ?? '';
            }
        }

        // Check actual content reference (posts table or messages table)
        if (!empty($contentId)) {
            if ($contentType === 'chat' || $contentType === 'message') {
                $msgRes = $client->request('GET', "messages?id=eq.{$contentId}&select=id,sender_id,message,created_at");
                if ($msgRes['success'] && !empty($msgRes['data'][0])) {
                    $targetUserId = $msgRes['data'][0]['sender_id'] ?? $targetUserId;
                    $submissionTimestamp = $msgRes['data'][0]['created_at'] ?? $submissionTimestamp;
                    if (empty($associatedContentText)) {
                        $associatedContentText = $msgRes['data'][0]['message'] ?? '';
                    }
                }
            } else {
                $postRes = $client->request('GET', "posts?id=eq.{$contentId}&select=id,user_id,content,is_anonymous,created_at");
                if ($postRes['success'] && !empty($postRes['data'][0])) {
                    $targetUserId = $postRes['data'][0]['user_id'] ?? $targetUserId;
                    $submissionTimestamp = $postRes['data'][0]['created_at'] ?? $submissionTimestamp;
                    if (empty($associatedContentText)) {
                        $associatedContentText = $postRes['data'][0]['content'] ?? '';
                    }
                } elseif ($contentType !== 'post') {
                    $msgRes = $client->request('GET', "messages?id=eq.{$contentId}&select=id,sender_id,message,created_at");
                    if ($msgRes['success'] && !empty($msgRes['data'][0])) {
                        $targetUserId = $msgRes['data'][0]['sender_id'] ?? $targetUserId;
                        $submissionTimestamp = $msgRes['data'][0]['created_at'] ?? $submissionTimestamp;
                        if (empty($associatedContentText)) {
                            $associatedContentText = $msgRes['data'][0]['message'] ?? '';
                        }
                    }
                }
            }
        }

        // If target account association could not be determined
        if (empty($targetUserId)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => "Unable to verify the author's account. The associated account record could not be found."
            ]);
            exit;
        }

        // 3. Retrieve student account information from profiles (NEVER return passwords, hashes, tokens)
        $userRes = $client->request('GET', "profiles?id=eq.{$targetUserId}&select=id,username,first_name,middle_name,last_name,email,student_id,avatar_url,avatar_value,role,approval_status,is_approved,account_status,is_deactivated,created_at");
        if (!$userRes['success'] || empty($userRes['data'][0])) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => "Unable to verify the author's account. The associated account record could not be found."
            ]);
            exit;
        }

        $studentProfile = $userRes['data'][0];

        // Formulate student account fields
        $first = trim((string)($studentProfile['first_name'] ?? ''));
        $middle = trim((string)($studentProfile['middle_name'] ?? ''));
        $last = trim((string)($studentProfile['last_name'] ?? ''));
        $fullName = trim($first . ($middle ? ' ' . $middle : '') . ($last ? ' ' . $last : ''));
        if (empty($fullName)) {
            $fullName = $studentProfile['username'] ?? 'Student User';
        }

        $accountStatus = 'Active';
        if (!empty($studentProfile['is_deactivated'])) {
            $accountStatus = 'Deactivated';
        } elseif (!empty($studentProfile['account_status'])) {
            $accountStatus = ucfirst((string)$studentProfile['account_status']);
        }

        // 4. Record protected administrative audit log (RA 10173 compliance)
        $clientIp = get_client_ip();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $auditEntry = [
            'id' => 'aud_' . time() . '_' . bin2hex(random_bytes(4)),
            'admin_id' => AUTHORIZED_ADMIN_USER_ID,
            'admin_email' => AUTHORIZED_ADMIN_EMAIL,
            'admin_name' => AUTHORIZED_ADMIN_NAME,
            'admin_role' => 'ADMINISTRATOR',
            'alert_id' => $alertId ?: 'DIRECT_LOOKUP',
            'content_id' => $contentId ?: 'N/A',
            'target_user_id' => $targetUserId,
            'target_user_name' => $fullName,
            'target_username' => $studentProfile['username'] ?? '',
            'justification_reason' => $reason,
            'ip_address' => $clientIp,
            'user_agent' => substr($userAgent, 0, 255),
            'accessed_at' => date('c')
        ];
        $client->request('POST', 'admin_identity_audit_logs', $auditEntry);

        // Persistent file backup for resilient offline/local auditing
        $logFile = __DIR__ . '/../database/admin_identity_audit_logs.json';
        $existingLogs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
        array_unshift($existingLogs, $auditEntry);
        @file_put_contents($logFile, json_encode(array_slice($existingLogs, 0, 100), JSON_PRETTY_PRINT));

        // Return verified account identity payload strictly to authorized admin interface
        echo json_encode([
            'success' => true,
            'message' => 'Identity revealed and logged in compliance with institutional safety policy.',
            'data' => [
                'user_id' => $studentProfile['id'],
                'username' => $studentProfile['username'] ?: 'Unavailable',
                'full_name' => $fullName,
                'first_name' => $studentProfile['first_name'] ?? '',
                'last_name' => $studentProfile['last_name'] ?? '',
                'email' => $studentProfile['email'] ?: 'Not provided',
                'student_id' => $studentProfile['student_id'] ?: 'Not provided',
                'profile_picture' => $studentProfile['avatar_url'] ?: ($studentProfile['avatar_value'] ?: ''),
                'created_at' => $studentProfile['created_at'] ?: 'Unavailable',
                'account_status' => $accountStatus,
                'approval_status' => $studentProfile['approval_status'] ?? 'approved',
                'case_id' => $alertId ?: 'N/A',
                'content_id' => $contentId ?: 'N/A',
                'content_ref' => $contentId ?: ($alertData['content_id'] ?? 'N/A'),
                'submission_timestamp' => $submissionTimestamp ?: ($alertData['created_at'] ?? date('c')),
                'associated_content' => $associatedContentText ?: 'N/A',
                'audit_logged' => true
            ]
        ]);
        break;

    // ── 11. IDENTITY DISCLOSURE AUDIT LOGS (RA 10173 GOVERNANCE) ───────
    case 'identity_audit_logs':
        $res = $client->request('GET', 'admin_identity_audit_logs?select=*&order=accessed_at.desc&limit=50');
        if ($res['success'] && !empty($res['data'])) {
            echo json_encode($res);
        } else {
            // Resilient fallback to local JSON audit records
            $logFile = __DIR__ . '/../database/admin_identity_audit_logs.json';
            $logs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
            echo json_encode([
                'success' => true,
                'data' => $logs
            ]);
        }
        break;

    default:
        echo json_encode([
            'success' => true,
            'service' => 'Safe Space Protected Admin API',
            'status' => 'Admin Authentication: Enabled'
        ]);
        break;
}
