<?php
require_once '../config/conexion.php';

// Verificamos que recibimos el ID
if (!isset($_GET['id'])) {
    die("Error: No se ha especificado un ID de aprendiz.");
}

$id = $_GET['id'];

// Consultamos los datos de ese aprendiz específico
$stmt = $pdo->prepare("SELECT * FROM `sca-cide_aprendices` WHERE ID = ?");
$stmt->execute([$id]);
$datos = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$datos) {
    die("Aprendiz no encontrado.");
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil de Aprendiz</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f4f4f9;
            min-height: 100vh;
            padding: 30px 15px;
            display: flex;
            justify-content: center;
        }

        .perfil-box {
            background: #ffffff;
            padding: 0;
            border-radius: 14px;
            max-width: 520px;
            width: 100%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            height: fit-content;
        }

        .header {
            background: linear-gradient(135deg, #1F3B36 0%, #39A900 100%);
            color: white;
            padding: 25px 30px;
        }

        .header h2 {
            font-size: 20px;
            margin-bottom: 4px;
        }

        .header p {
            font-size: 13px;
            opacity: 0.85;
        }

        .content {
            padding: 25px 30px 30px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }

        .info-row span:first-child {
            color: #888;
            font-weight: 600;
        }

        .info-row span:last-child {
            color: #1F3B36;
            font-weight: 500;
            text-align: right;
        }

        h3.section-title {
            color: #39A900;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 25px 0 15px;
            border-bottom: 2px solid #39A900;
            display: inline-block;
            padding-bottom: 4px;
        }

        label {
            display: block;
            margin-top: 15px;
            margin-bottom: 6px;
            font-weight: 600;
            font-size: 13px;
            color: #444;
        }

        input[type="file"] {
            width: 100%;
            padding: 10px;
            border: 1px dashed #ccc;
            border-radius: 8px;
            font-size: 13px;
            background: #fafafa;
            cursor: pointer;
        }

        button {
            margin-top: 25px;
            padding: 12px 24px;
            background: #39A900;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            width: 100%;
            transition: background 0.2s, transform 0.1s;
        }

        button:hover {
            background: #2f8a00;
        }

        button:active {
            transform: scale(0.98);
        }

        .salir-link {
            display: block;
            text-align: center;
            margin-top: 18px;
            color: #888;
            text-decoration: none;
            font-size: 13px;
        }

        .salir-link:hover {
            color: #39A900;
            text-decoration: underline;
        }
    </style>
</head>
<body>

<div class="perfil-box">
    <div class="header">
        <h2>👤 Perfil del Aprendiz</h2>
        <p>Consulta y actualiza tu información</p>
    </div>

    <div class="content">
        <div class="info-row">
            <span>Nombre</span>
            <span><?php echo htmlspecialchars($datos['Nombre']); ?></span>
        </div>
        <div class="info-row">
            <span>ID / Documento</span>
            <span><?php echo htmlspecialchars($datos['ID']); ?></span>
        </div>
        <div class="info-row">
            <span>Correo electrónico</span>
            <span><?php echo htmlspecialchars($datos['Correo electrónico']); ?></span>
        </div>

        <h3 class="section-title">Actualizar información</h3>

        <form action="guardar_cambios.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="id" value="<?php echo $id; ?>">

            <label>📷 Nueva foto de perfil</label>
            <input type="file" name="foto" accept="image/*">

            <label>📄 Cargar nuevo documento (PDF)</label>
            <input type="file" name="doc_pdf" accept="application/pdf">

            <button type="submit">Guardar cambios</button>
        </form>

        <a href="index.php" class="salir-link">← Salir</a>
    </div>
</div>

</body>
</html>