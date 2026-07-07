<?php
/**
 * API - Submit Registration Data
 * Handles file uploads and database updates
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido.');
    }

    $documento = $_POST['documento'] ?? '';
    $rh_aprendiz = $_POST['rh_aprendiz'] ?? '';
    $fecha_expedicion = $_POST['fecha_expedicion'] ?? '';
    $lugar_expedicion = $_POST['lugar_expedicion'] ?? '';

    if (empty($documento) || empty($rh_aprendiz) || empty($fecha_expedicion) || empty($lugar_expedicion)) {
        throw new Exception('Faltan datos obligatorios (documento, RH, fecha o lugar).');
    }

    if (!isset($_FILES['foto']) || !isset($_FILES['documento_pdf'])) {
        throw new Exception('Debes proporcionar tanto la fotografía como el documento de identidad.');
    }

    $fotoDir = __DIR__ . '/../fotografias';
    $pdfDir = __DIR__ . '/../documentos_identificacion';

    // Create directories if they don't exist
    if (!is_dir($fotoDir)) mkdir($fotoDir, 0755, true);
    if (!is_dir($pdfDir)) mkdir($pdfDir, 0755, true);

    // Define consistent paths
    $fotoName = "{$documento}.jpg";
    $pdfName  = "{$documento}.pdf";

    $fotoPathAbsolute = $fotoDir . "/" . $fotoName;
    $pdfPathAbsolute  = $pdfDir . "/" . $pdfName;

    // Database Paths (Relative for web access)
    $fotoPathDB = "SCA-APP/fotografias/" . $fotoName;
    $pdfPathDB  = "SCA-APP/documentos_identificacion/" . $pdfName;

    // Rule 1: Delete previous files if they exist (Reset data)
    if (file_exists($fotoPathAbsolute)) @unlink($fotoPathAbsolute);
    if (file_exists($pdfPathAbsolute))  @unlink($pdfPathAbsolute);

    // Save New Files
    if (!move_uploaded_file($_FILES['foto']['tmp_name'], $fotoPathAbsolute)) {
        throw new Exception('No se pudo guardar la fotografía en el servidor.');
    }
    if (!move_uploaded_file($_FILES['documento_pdf']['tmp_name'], $pdfPathAbsolute)) {
        throw new Exception('No se pudo guardar el documento PDF en el servidor.');
    }

    // Update Database
    $pdo = getPDOConnection();
    $stmt = $pdo->prepare('
        UPDATE sca_cide_aprendices 
        SET 
            rh_aprendiz = ?,
            ruta_foto_aprendiz = ?, 
            fecha_expedicion_documento_identificacion_aprendiz = ?, 
            lugar_expedicion_documento_identificacion_aprendiz = ?, 
            ruta_documento_identificacion_aprendiz = ?,
            estado_validacion = "no_validado"
        WHERE numero_documento_aprendiz = ?
    ');

    $success = $stmt->execute([
        $rh_aprendiz,
        $fotoPathDB,
        $fecha_expedicion,
        $lugar_expedicion,
        $pdfPathDB,
        $documento
    ]);

    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => '¡Tu registro ha sido actualizado con éxito!'
        ]);
    } else {
        throw new Exception('Error al actualizar los datos en la base de datos.');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Lo sentimos, ocurrió un error: ' . $e->getMessage()
    ]);
}