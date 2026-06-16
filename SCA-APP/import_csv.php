<?php
require_once __DIR__ . '/api/db.php';
$pdo = getPDOConnection();

$csvFile = __DIR__ . '/../requerimientos/adjuntos/sca-cide_aprendices.csv';

if (!file_exists($csvFile)) {
    die("CSV file not found: $csvFile\n");
}

$handle = fopen($csvFile, "r");
if ($handle !== FALSE) {
    // Read the header line
    $header = fgetcsv($handle, 1000, ";");
    
    // Prepare the UPSERT statement
    $sql = "INSERT INTO sca_cide_aprendices (
                numero_documento_aprendiz, 
                nombre_completo_aprendiz, 
                correo_electronico_aprendiz, 
                telefono_aprendiz, 
                rol
            ) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nombre_completo_aprendiz = VALUES(nombre_completo_aprendiz),
                correo_electronico_aprendiz = VALUES(correo_electronico_aprendiz),
                telefono_aprendiz = VALUES(telefono_aprendiz),
                rol = VALUES(rol)";
                
    $stmt = $pdo->prepare($sql);

    $insertedCount = 0;
    $updatedCount = 0;
    
    $pdo->beginTransaction();
    try {
        while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
            // Expected CSV format: ID;Nombre;Correo electrónico;Teléfono;foto;expedicion_documento;cargar _documento;rol
            // Indices: 0:ID, 1:Nombre, 2:Correo, 3:Telefono, 4:foto, 5:exp_doc, 6:cargar_doc, 7:rol
            if (count($data) < 8) continue; // Skip invalid rows
            
            $id = trim($data[0]);
            $nombre = trim($data[1]);
            $correo = trim($data[2]);
            $telefono = trim($data[3]);
            $rol = trim($data[7]);
            
            // Handle possible encoding issues (ISO-8859-1 to UTF-8)
            // It seems the CSV might contain standard Spanish characters
            if (!mb_check_encoding($nombre, 'UTF-8')) {
                $nombre = mb_convert_encoding($nombre, 'UTF-8', 'ISO-8859-1');
            }
            if (!mb_check_encoding($rol, 'UTF-8')) {
                $rol = mb_convert_encoding($rol, 'UTF-8', 'ISO-8859-1');
            }
            
            if (empty($id) || $id === 'ID') continue; // Extra safety check

            $stmt->execute([$id, $nombre, $correo, $telefono, $rol]);
            
            // We can't easily track insert vs update with ON DUPLICATE KEY without checking rowCount (1 = insert, 2 = update)
            $rc = $stmt->rowCount();
            if ($rc == 1) {
                $insertedCount++;
            } elseif ($rc == 2) {
                $updatedCount++;
            }
        }
        $pdo->commit();
        echo "Import successful.\n";
        echo "Inserted new records: $insertedCount\n";
        echo "Updated existing records: $updatedCount\n";
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Failed: " . $e->getMessage() . "\n";
    }
    
    fclose($handle);
} else {
    echo "Error opening file.\n";
}
