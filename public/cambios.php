<?php
require_once '../config/conexion.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $nombre = $_POST['nombre'];
    $correo = $_POST['correo'];
    $telefono = $_POST['telefono'];

    // Ejecutamos el UPDATE con los nombres de columna correctos
    $sql = "UPDATE `sca-cide_aprendices` 
            SET `Nombre` = :nombre, 
                `Correo electrónico` = :correo, 
                `Teléfono` = :telefono 
            WHERE ID = :id";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'nombre'   => $nombre,
        'correo'   => $correo,
        'telefono' => $telefono,
        'id'       => $id
    ]);

    header("Location: lista_aprendices.php?mensaje=actualizado");
}
?>