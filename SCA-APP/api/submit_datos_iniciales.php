<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once 'db.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido.');
    }

    $pdo = getPDOConnection();
    
    // Validar datos requeridos
    $required_fields = ['tipo_documento', 'documento', 'nombre', 'correo', 'telefono', 'rol', 'vinculacion'];
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("El campo '$field' es obligatorio.");
        }
    }

    $tipo_documento = $_POST['tipo_documento'];
    $documento = preg_replace('/[^0-9]/', '', $_POST['documento']);
    $nombre = trim($_POST['nombre']);
    $correo = filter_var(trim($_POST['correo']), FILTER_SANITIZE_EMAIL);
    $telefono = trim($_POST['telefono']);
    $rol = $_POST['rol']; // INSTRUCTOR, ADMINISTRATIVO
    $vinculacion = $_POST['vinculacion']; // FUNCIONARIO, CONTRATISTA

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("El correo electrónico no es válido.");
    }

    // Insertar en la BD
    $stmt = $pdo->prepare('
        INSERT INTO personal_cundinamarca 
        (tipo_documento, numero_documento, nombre_completo, correo_electronico, telefono, rol, vinculacion) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    
    $success = $stmt->execute([
        $tipo_documento,
        $documento,
        $nombre,
        $correo,
        $telefono,
        $rol,
        $vinculacion
    ]);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => '¡Datos registrados exitosamente!'
        ]);
    } else {
        throw new Exception('Error al guardar en la base de datos.');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
