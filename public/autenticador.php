<?php
require_once '../config/conexion.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $documento = $_POST['documento'];

    // 1. ¿Es el administrador?
    // Puedes definir una clave secreta para el administrador
    if ($documento == "3011") { 
        header("Location: lista_aprendices.php");
        exit();
    }

    // 2. ¿Es un aprendiz?
    $stmt = $pdo->prepare("SELECT * FROM `sca-cide_aprendices` WHERE ID = :id");
    $stmt->execute(['id' => $documento]);
    $aprendiz = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($aprendiz) {
        // Si existe en la tabla, lo enviamos a su perfil usando su ID
        header("Location: perfil_aprendiz.php?id=" . $aprendiz['ID']);
        exit();
    } else {
        echo "Documento no encontrado. <a href='index.php'>Volver al inicio</a>";
    }
}
?>