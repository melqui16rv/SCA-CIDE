<?php
require_once __DIR__ . '/api/db.php';

try {
    $pdo = getPDOConnection();
    
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM sca_cide_aprendices LIKE 'rh_aprendiz'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        $pdo->exec("ALTER TABLE sca_cide_aprendices ADD COLUMN rh_aprendiz VARCHAR(5) NULL AFTER telefono_aprendiz");
        echo "Exito: Columna rh_aprendiz agregada correctamente.\n";
    } else {
        echo "Info: La columna rh_aprendiz ya existe.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
