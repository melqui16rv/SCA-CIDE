<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();
$stmt = $pdo->query("SHOW INDEXES FROM sca_cide_aprendices");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
