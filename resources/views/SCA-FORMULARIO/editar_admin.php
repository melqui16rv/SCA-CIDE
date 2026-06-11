<?php
require_once '../config/conexion.php';
$id = $_GET['id']; 
$stmt = $pdo->prepare("SELECT * FROM `sca-cide_aprendices` WHERE ID = ?");
$stmt->execute([$id]);
$datos = $stmt->fetch();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualizar Datos</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f4f4f9;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .form-card {
            background: #ffffff;
            border-radius: 14px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1F3B36 0%, #39A900 100%);
            color: white;
            padding: 22px 28px;
        }

        .header h2 {
            font-size: 18px;
            margin-bottom: 4px;
        }

        .header p {
            font-size: 13px;
            opacity: 0.85;
        }

        .content {
            padding: 25px 28px 30px;
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
            transition: border-color 0.2s, background 0.2s;
        }

        input[type="file"]:hover {
            border-color: #39A900;
            background: #f3fcef;
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
    </style>
</head>
<body>

<div class="form-card">
    <div class="header">
        <h2>📝 Actualizar Datos</h2>
        <p>Sube tu foto y documento actualizados</p>
    </div>
    <div class="content">
        <form action="guardar_cambios.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="id" value="<?php echo $id; ?>">

            <label>📷 Actualizar foto</label>
            <input type="file" name="foto" accept="image/*">

            <label>📄 Cargar documento</label>
            <input type="file" name="cargar_documento" accept="application/pdf">

            <button type="submit">Guardar Cambios</button>
        </form>
    </div>
</div>

</body>
</html>