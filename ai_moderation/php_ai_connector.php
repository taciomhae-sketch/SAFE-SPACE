<?php
/**
 * =============================================================
 *  php_ai_connector.php — PHP to Python AI API Connector
 *  Project: AN AI-POWERED SAFE SPACE PLATFORM
 *           WITH AUTOMATED MODERATION AND SENTIMENT ANALYSIS
 *
 *  PURPOSE:
 *  This is a STANDALONE EXAMPLE showing how your existing PHP
 *  system can communicate with the Python AI service.
 *
 *  DO NOT rebuild your existing PHP system.
 *  Instead, copy the relevant functions into your existing
 *  PHP files where you handle post/comment submissions.
 *
 *  USAGE FLOW:
 *    1. Student submits a post or comment
 *    2. Your PHP receives the submitted text
 *    3. PHP calls the Python AI API (this file shows how)
 *    4. Python AI analyzes the text and returns JSON
 *    5. PHP reads the JSON result
 *    6. PHP decides what to do (store, review, or reject)
 *
 *  REQUIREMENT:
 *    - Python AI server must be running: python app.py
 *    - PHP cURL extension must be enabled (usually is by default)
 * =============================================================
 */

// ── Configuration ────────────────────────────────────────────
define('AI_API_URL',     'http://127.0.0.1:8000');
define('AI_TIMEOUT_SEC', 15);   // Seconds to wait for AI response
define('AI_MAX_TEXT_LEN', 5000); // Must match config.py MAX_TEXT_LENGTH

// ── Moderation Status Constants ───────────────────────────────
define('STATUS_APPROVED', 'APPROVED');
define('STATUS_REVIEW',   'REVIEW');
define('STATUS_BLOCKED',  'BLOCKED');

// ── Category Constants ────────────────────────────────────────
define('CAT_SAFE',           'SAFE');
define('CAT_OFFENSIVE',      'OFFENSIVE');
define('CAT_BULLYING',       'BULLYING_HARASSMENT');
define('CAT_DISCRIMINATORY', 'DISCRIMINATORY');
define('CAT_THREATENING',    'THREATENING');
define('CAT_SELF_HARM',      'SELF_HARM_CONCERN');
define('CAT_SEXUAL',         'SEXUAL_EXPLICIT');
define('CAT_SPAM',           'SPAM');


// ════════════════════════════════════════════════════════════
//  FUNCTION: call_ai_moderate($text)
//  RETURNS:  array with AI result or error
// ════════════════════════════════════════════════════════════
/**
 * Send text to the Python AI service for combined
 * content moderation and sentiment analysis.
 *
 * @param  string $text  The student-submitted text to analyze
 * @return array         AI result array or error array
 */
function call_ai_moderate(string $text): array
{
    // ── Input Validation ─────────────────────────────────
    $text = trim($text);

    if (empty($text)) {
        return [
            'success' => false,
            'error'   => 'Text is required for moderation.',
        ];
    }

    if (mb_strlen($text) > AI_MAX_TEXT_LEN) {
        return [
            'success' => false,
            'error'   => 'Text exceeds maximum allowed length.',
        ];
    }

    // ── Prepare JSON Request ──────────────────────────────
    $request_data = json_encode(['text' => $text]);
    $endpoint     = AI_API_URL . '/moderate';

    // ── cURL Setup ────────────────────────────────────────
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL            => $endpoint,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $request_data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => AI_TIMEOUT_SEC,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        // Only connect locally — never expose to internet
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
    ]);

    // ── Execute Request ───────────────────────────────────
    $response    = curl_exec($ch);
    $http_code   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error  = curl_error($ch);
    curl_close($ch);

    // ── Handle Connection Errors ──────────────────────────
    if ($curl_error || $response === false) {
        // Log error for developer; do NOT show to student
        error_log('[SafeSpace AI] cURL error: ' . $curl_error);
        return [
            'success'     => false,
            'error'       => 'AI service is unavailable. The post will be queued for manual review.',
            'ai_offline'  => true,
            // Safe default when AI is offline: queue for manual review
            'category'    => CAT_SAFE,
            'status'      => STATUS_REVIEW,
            'confidence'  => 0.0,
            'sentiment'   => 'NEUTRAL',
            'sentiment_score' => 0.5,
        ];
    }

    // ── Handle Non-200 Responses ──────────────────────────
    if ($http_code !== 200) {
        error_log('[SafeSpace AI] HTTP error: ' . $http_code . ' — ' . $response);
        return [
            'success'    => false,
            'error'      => 'AI service returned an unexpected response.',
            'http_code'  => $http_code,
            'status'     => STATUS_REVIEW,  // Safe default
        ];
    }

    // ── Decode JSON Response ──────────────────────────────
    $result = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('[SafeSpace AI] Invalid JSON response: ' . $response);
        return [
            'success' => false,
            'error'   => 'AI service returned an invalid response.',
            'status'  => STATUS_REVIEW,
        ];
    }

    return $result;
}


// ════════════════════════════════════════════════════════════
//  FUNCTION: check_ai_health()
//  RETURNS:  true if AI service is online, false if offline
// ════════════════════════════════════════════════════════════
function check_ai_health(): bool
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => AI_API_URL . '/',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 3,
        CURLOPT_CONNECTTIMEOUT => 2,
    ]);
    $response  = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200 && $response) {
        $data = json_decode($response, true);
        return isset($data['status']) && $data['status'] === 'online';
    }
    return false;
}


// ════════════════════════════════════════════════════════════
//  FUNCTION: handle_moderation_result($ai_result, $post_data)
//  This shows HOW TO USE the AI result in your PHP logic.
//  Copy this pattern into your existing post-saving code.
// ════════════════════════════════════════════════════════════
/**
 * Example of how to handle the AI moderation result.
 * Adapt this to your existing PHP database and logic.
 *
 * @param array  $ai_result  Result from call_ai_moderate()
 * @param array  $post_data  The student's submitted data
 * @return array             What to do next
 */
function handle_moderation_result(array $ai_result, array $post_data): array
{
    // ── If AI call failed ─────────────────────────────────
    if (!($ai_result['success'] ?? false)) {
        // When AI is offline, queue for human review
        return [
            'action'   => 'review',
            'message'  => 'Your post has been submitted and will be reviewed shortly.',
            'db_status' => 'PENDING_REVIEW',
        ];
    }

    $category        = $ai_result['category']        ?? CAT_SAFE;
    $status          = $ai_result['status']          ?? STATUS_REVIEW;
    $confidence      = $ai_result['confidence']      ?? 0.0;
    $sentiment       = $ai_result['sentiment']       ?? 'NEUTRAL';
    $sentiment_score = $ai_result['sentiment_score'] ?? 0.5;
    $reason          = $ai_result['reason']          ?? '';

    // ── Route based on moderation status ──────────────────
    switch ($status) {

        case STATUS_APPROVED:
            /**
             * Content is SAFE — save to database normally.
             * Example SQL (adapt to your schema):
             *   INSERT INTO posts (content, ai_category, ai_status, ai_sentiment, user_id)
             *   VALUES (?, ?, ?, ?, ?)
             */
            return [
                'action'    => 'approve',
                'message'   => 'Your post was published successfully.',
                'db_status' => 'PUBLISHED',
                // Data to save alongside the post:
                'ai_data'   => [
                    'ai_category'        => $category,
                    'ai_status'          => $status,
                    'ai_confidence'      => $confidence,
                    'ai_sentiment'       => $sentiment,
                    'ai_sentiment_score' => $sentiment_score,
                ],
            ];

        case STATUS_REVIEW:
            /**
             * Content needs HUMAN REVIEW.
             * Save the post but mark it as pending review.
             * Notify admin via notification system.
             *
             * IMPORTANT: The AI does NOT determine guilt.
             * The AI flags content for authorized personnel to review.
             * Students are NOT automatically punished.
             */
            error_log(sprintf(
                '[SafeSpace AI] Post flagged for review. Category: %s, Confidence: %.0f%%',
                $category,
                $confidence * 100
            ));

            return [
                'action'    => 'review',
                'message'   => 'Your post has been submitted and is pending review.',
                'db_status' => 'PENDING_REVIEW',
                'ai_data'   => [
                    'ai_category'        => $category,
                    'ai_status'          => $status,
                    'ai_confidence'      => $confidence,
                    'ai_sentiment'       => $sentiment,
                    'ai_sentiment_score' => $sentiment_score,
                    'ai_reason'          => $reason,
                ],
            ];

        case STATUS_BLOCKED:
            /**
             * Content is clearly inappropriate.
             * Do NOT save to database.
             * Log the attempt for admin records.
             *
             * IMPORTANT: Even BLOCKED posts require human
             * confirmation before any disciplinary action.
             * The AI does NOT automatically punish students.
             */
            error_log(sprintf(
                '[SafeSpace AI] Post BLOCKED. Category: %s, Confidence: %.0f%%. User: %s',
                $category,
                $confidence * 100,
                $post_data['user_id'] ?? 'unknown'
            ));

            return [
                'action'    => 'block',
                'message'   => (
                    'Your post could not be published because it may contain '
                    . 'content that violates Safe Space community guidelines. '
                    . 'If you believe this is a mistake, please contact your advisor.'
                ),
                'db_status' => 'BLOCKED',
                'ai_data'   => [
                    'ai_category'   => $category,
                    'ai_status'     => $status,
                    'ai_confidence' => $confidence,
                ],
            ];

        default:
            return [
                'action'    => 'review',
                'message'   => 'Your post has been submitted for review.',
                'db_status' => 'PENDING_REVIEW',
            ];
    }
}


// ════════════════════════════════════════════════════════════
//  EXAMPLE: Complete integration in a post submission handler
//  This demonstrates the full flow — adapt to your own code.
// ════════════════════════════════════════════════════════════
/**
 * Example usage in your existing PHP post submission handler.
 * In your real system, this would be inside your post-creation
 * function or the form handler that receives student posts.
 */
function example_post_submission_handler(array $_POST_data, int $current_user_id): void
{
    // 1. Get the student's submitted text
    $post_content = trim($_POST_data['content'] ?? '');

    if (empty($post_content)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Post content cannot be empty.']);
        return;
    }

    // 2. Send text to Python AI for analysis
    $ai_result = call_ai_moderate($post_content);

    // 3. Determine what to do based on AI result
    $post_data = ['user_id' => $current_user_id, 'content' => $post_content];
    $outcome   = handle_moderation_result($ai_result, $post_data);

    // 4. Act on the outcome
    switch ($outcome['action']) {

        case 'approve':
            /*
             * Save post to your existing database.
             * YOUR DATABASE LOGIC HERE — example:
             *
             *   $stmt = $pdo->prepare(
             *       "INSERT INTO posts
             *        (user_id, content, status, ai_category, ai_sentiment, created_at)
             *        VALUES (?, ?, ?, ?, ?, NOW())"
             *   );
             *   $stmt->execute([
             *       $current_user_id,
             *       $post_content,
             *       'PUBLISHED',
             *       $outcome['ai_data']['ai_category'],
             *       $outcome['ai_data']['ai_sentiment'],
             *   ]);
             */
            echo json_encode([
                'success'   => true,
                'message'   => $outcome['message'],
                'status'    => 'PUBLISHED',
                'sentiment' => $ai_result['sentiment'] ?? 'NEUTRAL',
            ]);
            break;

        case 'review':
            /*
             * Save post with pending status.
             * YOUR DATABASE LOGIC HERE
             */
            echo json_encode([
                'success'   => true,
                'message'   => $outcome['message'],
                'status'    => 'PENDING_REVIEW',
            ]);
            break;

        case 'block':
            /*
             * Do NOT save post.
             * Log the attempt for admin records.
             * YOUR DATABASE LOGIC HERE (save to moderation log if desired)
             */
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => $outcome['message'],
                'status'  => 'BLOCKED',
            ]);
            break;
    }
}


// ════════════════════════════════════════════════════════════
//  DEMO / DIRECT EXECUTION
//  When you run this file directly for testing:
//    php php_ai_connector.php
// ════════════════════════════════════════════════════════════
if (php_sapi_name() === 'cli') {
    echo "\n=== Safe Space PHP ↔ Python AI Connector Demo ===\n\n";

    // Check if AI is running
    echo "Checking AI service health...\n";
    if (!check_ai_health()) {
        echo "⚠  AI service is OFFLINE.\n";
        echo "   Start it with:  python app.py\n\n";
        echo "Running test with OFFLINE fallback...\n\n";
    } else {
        echo "✓  AI service is ONLINE.\n\n";
    }

    // Test cases
    $test_cases = [
        ["I had such a great day with my classmates today!", "Safe positive post"],
        ["I am stressed because of my final exams this week.", "Academic stress"],
        ["Everyone should avoid that student because she is ugly.", "Bullying"],
        ["I will hurt you if you tell anyone.", "Threat"],
        ["CLICK NOW FREE MONEY CLICK NOW FREE MONEY", "Spam"],
        ["Patayin kita bukas.", "Filipino threat"],
    ];

    foreach ($test_cases as [$text, $label]) {
        echo "Test: $label\n";
        echo "Text: \"$text\"\n";

        $result = call_ai_moderate($text);

        if ($result['success'] ?? false) {
            echo sprintf(
                "Result: %s → %s (confidence: %.0f%%) | Sentiment: %s (%.2f)\n",
                $result['category']        ?? 'N/A',
                $result['status']          ?? 'N/A',
                ($result['confidence']     ?? 0) * 100,
                $result['sentiment']       ?? 'N/A',
                $result['sentiment_score'] ?? 0
            );
        } else {
            echo "AI Error: " . ($result['error'] ?? 'Unknown') . "\n";
            echo "Fallback status: " . ($result['status'] ?? 'REVIEW') . "\n";
        }

        echo str_repeat('-', 50) . "\n";
    }
}
