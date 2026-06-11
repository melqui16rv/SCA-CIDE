<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SCA-CIDE | Inicio</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #1F3B36 0%, #39A900 100%);
            padding: 20px;
        }

        .box {
            background: #ffffff;
            padding: 40px 35px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            width: 100%;
            max-width: 400px;
            animation: fadeIn 0.6s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo-circle {
            width: 70px;
            height: 70px;
            background: #39A900;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
            margin: 0 auto 15px;
            box-shadow: 0 4px 10px rgba(57,169,0,0.4);
        }

        h1 {
            color: #1F3B36;
            font-size: 22px;
            margin-bottom: 5px;
        }

        .subtitle {
            color: #777;
            font-size: 14px;
            margin-bottom: 25px;
        }

        h3 {
            color: #39A900;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }

        input[type="text"] {
            padding: 12px 14px;
            width: 100%;
            margin: 8px 0 18px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #39A900;
            box-shadow: 0 0 0 3px rgba(57,169,0,0.15);
        }

        button {
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

        hr {
            border: none;
            border-top: 1px solid #eee;
            margin: 25px 0 10px;
        }

        .footer-text {
            color: #aaa;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="box">
        <div class="logo-circle">SC</div>
        <h1>Bienvenido</h1>
        <p class="subtitle">Actualiza tus datos en la plataforma SCA-CIDE</p>

        <form action="autenticador.php" method="POST">
            <h3>Soy Aprendiz</h3>
            <input type="text" name="documento" placeholder="Digita tu número de documento" required>
            <button type="submit">Ingresar a mi perfil</button>
        </form>

        <hr>
        <p class="footer-text">SENA · Formación Complementaria</p>
    </div>
</body>
</html>