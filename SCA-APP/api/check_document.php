<?php
// SCA-APP/api/check_document.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $pdo = getPDOConnection();
    
    $documento = $_GET['documento'] ?? '';
    
    if (empty($documento)) {
        echo json_encode(['success' => false, 'message' => 'Documento no proporcionado.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT numero_documento_aprendiz, nombre_completo_aprendiz, correo_electronico_aprendiz, telefono_aprendiz, ruta_foto_aprendiz, fecha_expedicion_documento_identificacion_aprendiz, lugar_expedicion_documento_identificacion_aprendiz, ruta_documento_identificacion_aprendiz FROM sca_cide_aprendices WHERE numero_documento_aprendiz = ?');
    $stmt->execute([$documento]);
    $aprendiz = $stmt->fetch();

    if ($aprendiz) {
        echo json_encode(['success' => true, 'data' => $aprendiz]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontraron registros asociados al documento ingresado. Por favor, verifique e intente nuevamente.']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de servidor. No se pudo conectar a la base de datos o ejecutar la consulta.']);
    // Log exception somewhere if needed
}
