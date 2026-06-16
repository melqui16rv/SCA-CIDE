<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();

try {
    // 1. Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM sca_cide_aprendices LIKE 'rol'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE sca_cide_aprendices ADD COLUMN rol VARCHAR(100) DEFAULT 'APRENDIZ'");
        echo "Column 'rol' added successfully.\n";
    } else {
        echo "Column 'rol' already exists.\n";
    }

    // 2. Add Unique Index if it doesn't exist
    $stmt = $pdo->query("SHOW INDEXES FROM sca_cide_aprendices WHERE Key_name = 'idx_numero_documento'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE sca_cide_aprendices ADD UNIQUE INDEX idx_numero_documento (numero_documento_aprendiz)");
        echo "Unique index 'idx_numero_documento' added successfully.\n";
    } else {
        echo "Unique index already exists.\n";
    }

} catch (PDOException $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
}
