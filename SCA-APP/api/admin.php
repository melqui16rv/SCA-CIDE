<?php
/**
 * API - Admin Controller
 * Handles authentication and data management for administrators
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

session_start();

$action = $_GET['action'] ?? 'list';

try {
    // Authentication (POST password)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $password = $data['password'] ?? '';
        
        // standard admin password
        if ($password === 'ScaAdmin2026') {
            $_SESSION['admin_logged_in'] = true;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña de acceso incorrecta.']);
        }
        exit;
    }

    // Security Check
    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Sesión no autorizada.']);
        exit;
    }

    $pdo = getPDOConnection();

    if ($action === 'list') {
        $stmt = $pdo->query('SELECT * FROM sca_cide_aprendices ORDER BY nombre_completo_aprendiz ASC');
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $users]);
        exit;
    }

    if ($action === 'toggle_validation') {
        $documento = $_GET['documento'] ?? '';
        $estado = $_GET['estado'] ?? '';
        if ($documento && in_array($estado, ['validado', 'no_validado'])) {
            $stmt = $pdo->prepare('UPDATE sca_cide_aprendices SET estado_validacion = ? WHERE numero_documento_aprendiz = ?');
            $stmt->execute([$estado, $documento]);
            echo json_encode(['success' => true]);
            exit;
        }
        throw new Exception('Parámetros de validación inválidos.');
    }

    if ($action === 'toggle_carnet') {
        $documento = $_GET['documento'] ?? '';
        $estado = $_GET['estado'] ?? '';
        if ($documento && in_array($estado, ['realizado', 'pendiente', 'no realizar'])) {
            $stmt = $pdo->prepare('UPDATE sca_cide_aprendices SET estado_carnet = ? WHERE numero_documento_aprendiz = ?');
            $stmt->execute([$estado, $documento]);
            echo json_encode(['success' => true]);
            exit;
        }
        throw new Exception('Parámetros de carnet inválidos.');
    }

    if ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}