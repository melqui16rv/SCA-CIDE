<?php
// SCA-APP/api/admin.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

session_start();

$action = $_GET['action'] ?? 'list';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $password = $data['password'] ?? '';
        
        // Define standard admin password
        if ($password === 'ScaAdmin2026') {
            $_SESSION['admin_logged_in'] = true;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta.']);
        }
        exit;
    }

    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        echo json_encode(['success' => false, 'message' => 'No autorizado.']);
        exit;
    }

    if ($action === 'list') {
        $pdo = getPDOConnection();
        // Fetch users who have submitted the second step (i.e. have a photo route)
        $stmt = $pdo->query('SELECT * FROM sca_cide_aprendices WHERE ruta_foto_aprendiz IS NOT NULL AND ruta_foto_aprendiz != "" ORDER BY nombre_completo_aprendiz ASC');
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $users]);
        exit;
    }
    if ($action === 'toggle_validation') {
        $documento = $_GET['documento'] ?? '';
        $estado = $_GET['estado'] ?? '';
        if ($documento && in_array($estado, ['validado', 'no_validado'])) {
            $pdo = getPDOConnection();
            $stmt = $pdo->prepare('UPDATE sca_cide_aprendices SET estado_validacion = ? WHERE numero_documento_aprendiz = ?');
            $stmt->execute([$estado, $documento]);
            echo json_encode(['success' => true]);
            exit;
        }
        echo json_encode(['success' => false, 'message' => 'Parámetros inválidos.']);
        exit;
    }

    if ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
