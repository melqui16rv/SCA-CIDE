<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();
$stmt = $pdo->prepare("SELECT * FROM sca_cide_aprendices WHERE numero_documento_aprendiz = ?");
$stmt->execute(['1024554710']);
print_r($stmt->fetch(PDO::FETCH_ASSOC));
