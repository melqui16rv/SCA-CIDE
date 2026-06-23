import io
import qrcode
from PIL import Image
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

# 1. El contenido para el QR
datos = "https://carnetizacion.vermqen.com/"

# 2. Configurar el QR con ALTA corrección de errores
qr = qrcode.QRCode(
    version=3,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=14,   # ← más grande = más píxeles = logo más nítido
    border=4,
)

# 3. Agregar los datos y compilar la matriz
qr.add_data(datos)
qr.make(fit=True)

# --- VACIAR MÓDULOS DE LA MATRIZ CENTRAL ---
matriz = qr.modules
tam_matriz = len(matriz)

# Zona blanca ligeramente más amplia para que el logo respire
inicio_vaciado = int(tam_matriz * 0.38)
fin_vaciado    = int(tam_matriz * 0.62)

for fila in range(inicio_vaciado, fin_vaciado):
    for col in range(inicio_vaciado, fin_vaciado):
        matriz[fila][col] = False
# ------------------------------------------------------------

# 4. Crear la imagen QR
imagen_qr = qr.make_image(fill_color="#32CD32", back_color="white").convert("RGB")
ancho_qr, alto_qr = imagen_qr.size

try:
    # 5. Tamaño final del logo en el QR (22% del ancho)
    tamaño_logo = int(ancho_qr * 0.22)

    # --- RENDERIZAR EL SVG A ALTA RESOLUCIÓN EN MEMORIA ---
    drawing = svg2rlg("favicon.svg")

    if drawing is None:
        raise FileNotFoundError("svglib no pudo leer 'favicon.svg'.")

    # Renderizar a 4x el tamaño final para luego reducir con LANCZOS
    # (supersampling: más resolución → al reducir queda perfectamente nítido)
    factor_ss  = 4
    tamaño_render = tamaño_logo * factor_ss

    escala = min(tamaño_render / drawing.width, tamaño_render / drawing.height)
    drawing.width     = drawing.width  * escala
    drawing.height    = drawing.height * escala
    drawing.transform = (escala, 0, 0, escala, 0, 0)

    png_bytes = renderPM.drawToString(drawing, fmt="PNG", backend="rlPyCairo")
    logo_hires = Image.open(io.BytesIO(png_bytes)).convert("RGBA")

    # Reducir con LANCZOS: antialiasing perfecto, sin pixelado
    logo = logo_hires.resize((tamaño_logo, tamaño_logo), Image.Resampling.LANCZOS)
    # ------------------------------------------------------

    # Añadir fondo blanco circular detrás del logo para aislarlo del QR
    radio = int(tamaño_logo * 0.58)
    fondo = Image.new("RGBA", (tamaño_logo, tamaño_logo), (0, 0, 0, 0))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(fondo)
    cx = cy = tamaño_logo // 2
    draw.ellipse(
        [cx - radio, cy - radio, cx + radio, cy + radio],
        fill=(255, 255, 255, 255)
    )
    # Componer: fondo blanco + logo encima
    compuesto = Image.alpha_composite(fondo, logo)

    # Pegar centrado en el QR
    posicion_x = (ancho_qr - tamaño_logo) // 2
    posicion_y = (alto_qr  - tamaño_logo) // 2
    imagen_qr.paste(compuesto, (posicion_x, posicion_y), mask=compuesto)

    print("✅ Logo SVG vectorizado integrado con supersampling 4x — máxima nitidez!")

except FileNotFoundError as e:
    print(f"⚠️  {e}")

# 6. Guardar en alta calidad
imagen_qr.save("qr_carnet_completo.png", dpi=(300, 300))
print("✅ QR guardado como 'qr_carnet_completo.png'")
