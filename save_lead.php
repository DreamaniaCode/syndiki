<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Receive JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    exit;
}

$building = $data['building'] ?? 'Unknown';
$contactType = $data['contactType'] ?? 'Unknown';
$contactValue = $data['contactValue'] ?? 'Unknown';
$date = date('Y-m-d H:i:s');

// Format: Date, Building, ContactType, ContactValue
$line = "$date,$building,$contactType,$contactValue\n";

// Append to CSV file
$file = 'leads.csv';
$success = file_put_contents($file, $line, FILE_APPEND | LOCK_EX);

if ($success === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save lead']);
} else {
    echo json_encode(['status' => 'success']);
}
?>
