<?php
$baseUrl = getenv('SMSAPI_BASE_URL') ?: 'http://localhost:3100';
$apiKey = getenv('SMSAPI_KEY') ?: 'smsapi_your_api_key';

function smsapi_post($path, $payload) {
    global $baseUrl, $apiKey;

    $ch = curl_init($baseUrl . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));

    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($body, true)];
}

$sms = smsapi_post('/v1/messages/sms', [
    'to' => '01012345678',
    'from' => '0212345678',
    'text' => '[서비스명] 인증번호는 123456입니다.',
    'clientRequestId' => 'signup-sms-' . time()
]);

$email = smsapi_post('/v1/messages/email', [
    'to' => 'customer@example.com',
    'from' => 'noreply@example.com',
    'subject' => '가입 안내',
    'html' => '<p>가입을 완료해 주세요.</p>',
    'text' => '가입을 완료해 주세요.',
    'clientRequestId' => 'signup-email-' . time()
]);

print_r([$sms, $email]);
