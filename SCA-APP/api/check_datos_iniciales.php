<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $pdo = getPDOConnection();
    
    $documento = $_GET['documento'] ?? '';
    
    if (empty($documento)) {
        throw new Exception('Por favor, ingresa tu número de documento.');
    }

    $documento = preg_replace('/[^0-9]/', '', $documento);

    // 1. Validar en la tabla principal sca_cide_aprendices
    $stmtPrincipal = $pdo->prepare('SELECT numero_documento_aprendiz FROM sca_cide_aprendices WHERE numero_documento_aprendiz = ?');
    $stmtPrincipal->execute([$documento]);
    if ($stmtPrincipal->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'El documento ya está registrado en la base de datos principal. Por favor, usa el formulario principal para cargar tus documentos.'
        ]);
        exit;
    }

    // 2. Validar en la tabla personal_cundinamarca
    $stmt = $pdo->prepare('SELECT numero_documento FROM personal_cundinamarca WHERE numero_documento = ?');
    $stmt->execute([$documento]);
    $registro = $stmt->fetch();

    if ($registro) {
        echo json_encode([
            'success' => false,
            'message' => 'El documento ya completó este registro inicial de datos.'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Documento disponible.'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
