<?php
/**
 * API - Check Document
 * Verifies if a document exists in the system
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $pdo = getPDOConnection();
    
    $documento = $_GET['documento'] ?? '';
    
    if (empty($documento)) {
        throw new Exception('Por favor, ingresa tu número de documento.');
    }

    // Sanitize document (only numbers)
    $documento = preg_replace('/[^0-9]/', '', $documento);

    $stmt = $pdo->prepare('
        SELECT 
            numero_documento_aprendiz, 
            nombre_completo_aprendiz, 
            correo_electronico_aprendiz, 
            telefono_aprendiz,
            ruta_foto_aprendiz,
            ruta_documento_identificacion_aprendiz
        FROM sca_cide_aprendices 
        WHERE numero_documento_aprendiz = ?
    ');
    $stmt->execute([$documento]);
    $aprendiz = $stmt->fetch();

    if ($aprendiz) {
        // Detect if user already has a previous registration
        $tiene_registro = !empty($aprendiz['ruta_foto_aprendiz']) || 
                          !empty($aprendiz['ruta_documento_identificacion_aprendiz']);
        echo json_encode([
            'success'         => true,
            'tiene_registro'  => $tiene_registro,
            'data'            => [
                'numero_documento_aprendiz'  => $aprendiz['numero_documento_aprendiz'],
                'nombre_completo_aprendiz'   => $aprendiz['nombre_completo_aprendiz'],
                'correo_electronico_aprendiz'=> $aprendiz['correo_electronico_aprendiz'],
                'telefono_aprendiz'          => $aprendiz['telefono_aprendiz']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'No encontramos un registro con ese número. Por favor, verifica los datos o solicita ayuda en tu centro.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Ocurrió un problema técnico. Por favor, intenta de nuevo en unos minutos.'
    ]);
}