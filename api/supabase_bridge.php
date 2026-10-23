<?php
/**
 * Safe Space — PHP to Supabase REST Bridge
 * Allows the PHP application in XAMPP to interact directly with Supabase PostgreSQL.
 */

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config.php';

function censor_word(string $w): string {
    $len = mb_strlen($w);
    if ($len <= 2) {
        return $w;
    }
    if (strtolower($w) === 'putangina') {
        return mb_substr($w, 0, 1) . '******' . mb_substr($w, -1, 1);
    }
    return mb_substr($w, 0, 1) . str_repeat('*', $len - 2) . mb_substr($w, -1, 1);
}

function censor_profanity(string $text): string {
    if (empty($text)) {
        return $text;
    }
    $patterns = [
        '\bputang[\s\-_]*ina\b',
        '\bpukinang[\s\-_]*ina\b',
        '\bpuki[\s\-_]*nang[\s\-_]*ina\b',
        '\btang[\s\-_]*ina\b',
        '\btang[\s\-_]*ena\b',
        '\banak[\s\-_]*ng[\s\-_]*puta\b',
        '\bhayop[\s\-_]*ka\b',
        '\bhayup[\s\-_]*ka\b',
        '\bputangina\b',
        '\bpukinangina\b',
        '\btangina\b',
        '\btangena\b',
        '\btaena\b',
        '\btayna\b',
        '\bkingina\b',
        '\bamputa\b',
        '\bampota\b',
        '\bpunyeta\b',
        '\bleche\b',
        '\bletse\b',
        '\bpiste\b',
        '\bpeste\b',
        '\byawa\b',
        '\bkupal\b',
        '\bogag\b',
        '\bpota\b',
        '\bputa\b',
        '\blintik\b',
        '\bhudas\b',
        '\bgago(?:ng)?\b',
        '\bgaga\b',
        '\bkagaguhan\b',
        '\btarantado\b',
        '\btarantada\b',
        '\bkatarantadohan\b',
        '\bbobo(?:ng)?\b',
        '\bboba\b(?!\s+(?:tea|milk|drink))',
        '\bkabobohan\b',
        '\bbopols\b',
        '\bboplaks\b',
        '\bulol\b',
        '\binutil\b',
        '\btanga(?:ng)?\b',
        '\bkatangahan\b',
        '\bbwisit\b',
        '\bbuwisit\b',
        '\bhinayupak\b',
        '\bkantot(?:an|in)?\b',
        '\bchupa(?:in)?\b',
        '\btsupa(?:in)?\b',
        '\btite\b',
        '\bpuke\b',
        '\bpuki\b',
        '\bkiki\b',
        '\btamod\b',
        '\bjakol\b',
        '\bburat\b',
        '\bbayag\b',
        '\bpepe\b',
        '\biyot(?:an)?\b',
        '\bpokpok\b',
        '\bmotherfuck(?:er|ers|ing)?\b',
        '\bfuck(?:ing|ers?|ed|s)?\b',
        '\bbullshit(?:s)?\b',
        '\bdipshit(?:s)?\b',
        '\bhorseshit\b',
        '\bshit(?:s|ted|ting|ty)?\b',
        '\bbitch(?:es|ing|y)?\b',
        '\basshole(?:s)?\b',
        '\bdumbass(?:es)?\b',
        '\bjackass(?:es)?\b',
        '\bfatass(?:es)?\b',
        '\bbastard(?:s)?\b',
        '\bcunt(?:s)?\b',
        '\bdickhead(?:s)?\b',
        '\bdick(?:s)?\b',
        '\bcocksucker(?:s)?\b',
        '\bcock(?:s)?\b',
        '\bpuss(?:y|ies)\b',
        '\btwat(?:s)?\b',
        '\bwanker(?:s)?\b',
        '\bslut(?:s|ty)?\b',
        '\bwhore(?:s)?\b',
        '(?<![a-zA-Z0-9])ass(?:es)?(?![a-zA-Z0-9])'
    ];

    $regex = '/' . implode('|', $patterns) . '/iu';
    return preg_replace_callback($regex, function($m) {
        return preg_replace_callback('/[a-zA-Z]+/u', function($wm) {
            return censor_word($wm[0]);
        }, $m[0]);
    }, $text);
}

class SupabaseClient {
    private $url;
    private $key;

    public function __construct($url = SUPABASE_URL, $key = SUPABASE_ANON_KEY) {
        $this->url = rtrim($url, '/');
        $this->key = $key;
    }

    public function request($method, $endpoint, $data = null, $token = null) {
        $ch = curl_init();
        $targetUrl = $this->url . '/rest/v1/' . ltrim($endpoint, '/');

        $headers = [
            'apikey: ' . $this->key,
            'Authorization: Bearer ' . ($token ? $token : $this->key),
            'Content-Type: application/json',
            'Prefer: return=representation'
        ];

        // Server-Side Censorship Enforcement before saving to database
        if (is_array($data)) {
            if (isset($data['content']) && is_string($data['content'])) {
                $data['content'] = censor_profanity($data['content']);
            }
            if (isset($data['message']) && is_string($data['message'])) {
                $data['message'] = censor_profanity($data['message']);
            }
        }

        curl_setopt($ch, CURLOPT_URL, $targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        if ($data !== null && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => $error, 'code' => 500];
        }

        $decoded = json_decode($response, true);
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'code' => $httpCode,
            'data' => $decoded
        ];
    }

    public function getProfiles() {
        return $this->request('GET', 'profiles?select=id,username,first_name,last_name,avatar_url,bio,is_online');
    }

    public function getFeed($limit = 30) {
        return $this->request('GET', "posts?select=*,profiles:user_id(username,first_name,last_name,avatar_url)&order=created_at.desc&limit={$limit}");
    }

    public function getMessages($userId1, $userId2, $limit = 30) {
        $filter = "(sender_id.eq.{$userId1},receiver_id.eq.{$userId2}),(sender_id.eq.{$userId2},receiver_id.eq.{$userId1})";
        return $this->request('GET', "messages?select=*&or={$filter}&order=created_at.asc&limit={$limit}");
    }
}

// Simple REST routing if accessed directly through HTTP
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    $action = $_GET['action'] ?? '';
    $client = new SupabaseClient();

    switch ($action) {
        case 'ping':
            echo json_encode(['success' => true, 'message' => 'Supabase PHP Bridge Active', 'version' => '2.0.0']);
            break;

        case 'profiles':
            echo json_encode($client->getProfiles());
            break;

        case 'feed':
            echo json_encode($client->getFeed());
            break;

        case 'admin_reports':
            require_once __DIR__ . '/admin_auth.php';
            require_admin_authorization(true);
            echo json_encode($client->request('GET', 'reports?select=*,reporter:reporter_id(username,first_name,last_name),post:post_id(content,user_id)&order=created_at.desc'));
            break;

        case 'admin_users':
            require_once __DIR__ . '/admin_auth.php';
            require_admin_authorization(true);
            echo json_encode($client->request('GET', 'profiles?select=id,username,first_name,last_name,email,role,is_admin,is_deactivated,account_status,violation_count&order=created_at.desc'));
            break;

        default:
            echo json_encode(['success' => true, 'service' => 'Safe Space Supabase PHP API', 'status' => 'Admin Authentication: Enabled']);
            break;
    }
}
