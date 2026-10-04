<?php
/**
 * Safe Space — PHP to Supabase REST Bridge
 * Allows the PHP application in XAMPP to interact directly with Supabase PostgreSQL.
 */

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config.php';

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

        default:
            echo json_encode(['success' => true, 'service' => 'Safe Space Supabase PHP API']);
            break;
    }
}
