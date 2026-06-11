<?php
// SCA-APP/api/submit_data.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido.');
    }

    $documento = $_POST['documento'] ?? '';
    $fecha_expedicion = $_POST['fecha_expedicion'] ?? '';
    $lugar_expedicion = $_POST['lugar_expedicion'] ?? '';

    if (empty($documento) || empty($fecha_expedicion) || empty($lugar_expedicion)) {
        throw new Exception('Faltan datos requeridos en el formulario.');
    }

    if (!isset($_FILES['foto']) || !isset($_FILES['documento_pdf'])) {
        throw new Exception('Faltan los archivos requeridos (fotografía y/o documento de identidad).');
    }

    $fotoDir = __DIR__ . '/../fotografias';
    $pdfDir = __DIR__ . '/../documentos_identificacion';

    if (!is_dir($fotoDir)) mkdir($fotoDir, 0755, true);
    if (!is_dir($pdfDir)) mkdir($pdfDir, 0755, true);

    // Save as .png for photo and .pdf for document as requested
    $fotoPathRelative = "SCA-APP/fotografias/{$documento}.png";
    $pdfPathRelative = "SCA-APP/documentos_identificacion/{$documento}.pdf";

    $fotoPathAbsolute = $fotoDir . "/{$documento}.png";
    $pdfPathAbsolute = $pdfDir . "/{$documento}.pdf";

    // Overwrite existing files
    if (file_exists($fotoPathAbsolute)) unlink($fotoPathAbsolute);
    if (file_exists($pdfPathAbsolute)) unlink($pdfPathAbsolute);

    if (!move_uploaded_file($_FILES['foto']['tmp_name'], $fotoPathAbsolute)) {
        throw new Exception('Error al guardar la fotografía en el servidor.');
    }
    if (!move_uploaded_file($_FILES['documento_pdf']['tmp_name'], $pdfPathAbsolute)) {
        throw new Exception('Error al guardar el documento PDF en el servidor.');
    }

    $pdo = getPDOConnection();
    $stmt = $pdo->prepare('
        UPDATE sca_cide_aprendices 
        SET 
            ruta_foto_aprendiz = ?, 
            fecha_expedicion_documento_identificacion_aprendiz = ?, 
            lugar_expedicion_documento_identificacion_aprendiz = ?, 
            ruta_documento_identificacion_aprendiz = ?,
            estado_validacion = "no_validado"
        WHERE numero_documento_aprendiz = ?
    ');

    $stmt->execute([
        $fotoPathRelative,
        $fecha_expedicion,
        $lugar_expedicion,
        $pdfPathRelative,
        $documento
    ]);

    echo json_encode(['success' => true, 'message' => 'Datos y archivos actualizados correctamente.']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
