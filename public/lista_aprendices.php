<?php
namespace App\Controllers;

use Config\Conexion; // <--- Aquí es donde se vuelve útil el archivo anterior

class AprendizController {
    public function listar() {
        // Usamos la conexión de forma limpia
        $db = Conexion::conectar(); 
        
        // Ejecutamos la consulta
        $query = $db->prepare("SELECT * FROM aprendices");
        $query->execute();
        $aprendices = $query->fetchAll();

        // Enviamos a la vista
        require_once __DIR__ . '/../../resources/views/lista_aprendices.php';
    }
}

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f4f4f9;
            padding: 30px 20px;
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #1F3B36 0%, #39A900 100%);
            color: white;
            padding: 20px 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .top-bar h1 {
            font-size: 20px;
        }

        .top-bar p {
            font-size: 13px;
            opacity: 0.85;
        }

        .btn-volver {
            background: rgba(255,255,255,0.15);
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s;
        }

        .btn-volver:hover {
            background: rgba(255,255,255,0.3);
        }

        .table-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 14px 16px;
            text-align: left;
            font-size: 14px;
        }

        th {
            background-color: #1F3B36;
            color: white;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
        }

        tbody tr {
            border-bottom: 1px solid #eee;
            transition: background 0.15s;
        }

        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }

        tbody tr:hover {
            background-color: #eafbe0;
        }

        td {
            color: #444;
        }

        .btn-editar {
            background: #39A900;
            padding: 6px 14px;
            text-decoration: none;
            border-radius: 6px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s;
            display: inline-block;
        }

        .btn-editar:hover {
            background: #2f8a00;
        }

        @media (max-width: 700px) {
            table, thead, tbody, th, td, tr { display: block; }
            thead { display: none; }
            tbody tr {
                margin-bottom: 12px;
                border-radius: 10px;
                border: 1px solid #eee;
                padding: 10px;
            }
            td {
                padding: 8px 10px;
                border: none;
            }
            td::before {
                content: attr(data-label);
                font-weight: 700;
                color: #39A900;
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="top-bar">
        <div>
            <h1>📋 Listado de Aprendices</h1>
            <p>Administración de información SCA-CIDE</p>
        </div>
        <a href="index.php" class="btn-volver">← Volver al inicio</a>
    </div>

    <div class="table-card">
        <table>
            <thead>
                <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($aprendices as $fila): ?>
                <tr>
                    <td data-label="Documento"><?php echo htmlspecialchars($fila['ID']); ?></td>
                    <td data-label="Nombre"><?php echo htmlspecialchars($fila['Nombre']); ?></td>
                    <td data-label="Correo"><?php echo htmlspecialchars($fila['Correo electrónico']); ?></td>
                    <td data-label="Teléfono"><?php echo htmlspecialchars($fila['Teléfono'] ?? 'N/A'); ?></td>
                    <td data-label="Acciones">
                        <a href="editar_admin.php?id=<?php echo $fila['ID']; ?>" class="btn-editar">Editar</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>