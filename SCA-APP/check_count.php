<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();
$stmt = $pdo->query("SELECT COUNT(*) FROM sca_cide_aprendices");
echo "Current rows in DB: " . $stmt->fetchColumn() . "\n";
