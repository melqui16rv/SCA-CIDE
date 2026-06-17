<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();

$csvFile = __DIR__ . '/../requerimientos/adjuntos/LISTADO_FALTANTE_INS_ADM.csv';

if (!file_exists($csvFile)) {
    die("CSV file not found: $csvFile\n");
}

$handle = fopen($csvFile, "r");
if ($handle !== FALSE) {
    // Read the header line
    $header = @fgetcsv($handle, 1000, ";");
    
    $batchSize = 500;
    $values = [];
    $placeholders = [];
    
    $insertedCount = 0;
    
    $pdo->beginTransaction();
    try {
        while (($data = @fgetcsv($handle, 1000, ";")) !== FALSE) {
            if (count($data) < 8) continue;
            
            $id = trim($data[0]);
            $nombre = trim($data[1]);
            $correo = trim($data[2]);
            $telefono = trim($data[3]);
            $rol = trim($data[7]);
            
            if (!mb_check_encoding($nombre, 'UTF-8')) $nombre = mb_convert_encoding($nombre, 'UTF-8', 'ISO-8859-1');
            if (!mb_check_encoding($rol, 'UTF-8')) $rol = mb_convert_encoding($rol, 'UTF-8', 'ISO-8859-1');
            
            if (empty($id) || $id === 'ID' || $id === 'NUMERO DOCUMENTO') continue;
            
            $values = array_merge($values, [$id, $nombre, $correo, $telefono, $rol]);
            $placeholders[] = "(?, ?, ?, ?, ?)";
            
            if (count($placeholders) >= $batchSize) {
                $sql = "INSERT INTO sca_cide_aprendices 
                        (numero_documento_aprendiz, nombre_completo_aprendiz, correo_electronico_aprendiz, telefono_aprendiz, rol) 
                        VALUES " . implode(", ", $placeholders) . "
                        ON DUPLICATE KEY UPDATE 
                        nombre_completo_aprendiz = VALUES(nombre_completo_aprendiz),
                        correo_electronico_aprendiz = VALUES(correo_electronico_aprendiz),
                        telefono_aprendiz = VALUES(telefono_aprendiz),
                        rol = VALUES(rol)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
                
                $values = [];
                $placeholders = [];
            }
        }
        
        // Final batch
        if (count($placeholders) > 0) {
            $sql = "INSERT INTO sca_cide_aprendices 
                    (numero_documento_aprendiz, nombre_completo_aprendiz, correo_electronico_aprendiz, telefono_aprendiz, rol) 
                    VALUES " . implode(", ", $placeholders) . "
                    ON DUPLICATE KEY UPDATE 
                    nombre_completo_aprendiz = VALUES(nombre_completo_aprendiz),
                    correo_electronico_aprendiz = VALUES(correo_electronico_aprendiz),
                    telefono_aprendiz = VALUES(telefono_aprendiz),
                    rol = VALUES(rol)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
        }
        
        $pdo->commit();
        echo "Import successful.\n";
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Failed: " . $e->getMessage() . "\n";
    }
    
    fclose($handle);
} else {
    echo "Error opening file.\n";
}
