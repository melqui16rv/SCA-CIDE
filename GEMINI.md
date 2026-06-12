# Auditoría y Refactorización: SCA-APP

Este documento detalla los cambios realizados en el sistema de registro de aprendices SCA-CIDE para mejorar su usabilidad, escalabilidad y mantenimiento.

## 1. Arquitectura del Sistema

### Frontend (Modular)
Se ha migrado de un archivo monolítico (`app.js`) a una estructura basada en módulos ES6 dentro de `assets/js/modules/`:

- **`main.js`**: Orquestador principal de la aplicación.
- **`ui.js`**: Control de la interfaz, transiciones de vistas y lógica del Stepper.
- **`api.js`**: Centralización de todas las llamadas al servidor (Fetch API).
- **`camera.js`**: Gestión de hardware de cámara, stencils visuales y recortes (Cropper.js).
- **`location.js`**: Integración con la API Divipola para la selección de departamento y ciudad.
- **`utils.js`**: Funciones auxiliares, manejo de fechas y procesamiento de imágenes.
- **`admin.js`**: Lógica aislada para el panel de administración.

### Backend (PHP)
Se han refinado los controladores de la API para garantizar respuestas claras y atómicas:

- **`check_document.php`**: Validación de aprendices con mensajes amigables.
- **`submit_data.php`**: Procesamiento de archivos, eliminación de registros anteriores y actualización de BD.
- **`admin.php`**: Controlador de seguridad y gestión de datos para administradores.

## 2. Mejoras de Experiencia de Usuario (UX)

### Asistente Paso a Paso (Stepper)
El formulario de actualización de datos se ha transformado en un asistente de 4 pasos:
1.  **Confirmación:** Verificación de datos básicos traídos de la BD.
2.  **Expedición:** Ingreso sencillo de fecha y lugar.
3.  **Fotografía:** Captura guiada con óvalo de referencia para foto carnet.
4.  **Documento:** Captura de ambos lados del documento con recuadro de ayuda.

### Lenguaje e Interfaz
- Se han eliminado términos técnicos para el usuario final.
- Se implementaron alertas informativas y estados visuales (Badges) para indicar el progreso de las capturas.
- Diseño **Mobile-First** optimizado para su uso en celulares durante la captura física de documentos.

## 3. Optimización de Archivos
- **Fotos:** Se utiliza Cropper.js con calidad controlada para generar archivos entre 200kb y 500kb.
- **PDF:** Se generan del lado del cliente usando jsPDF, comprimiendo las imágenes en formato JPEG para mantener el peso final por debajo de 1MB, ideal para hosting compartido.

## 4. Estructura de Archivos Actualizada
```text
SCA-APP/
├── api/
│   ├── admin.php
│   ├── check_document.php
│   ├── db.php
│   └── submit_data.php
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── modules/
│       │   ├── admin.js
│       │   ├── api.js
│       │   ├── camera.js
│       │   ├── location.js
│       │   ├── ui.js
│       │   └── utils.js
│       └── main.js
├── documentos_identificacion/ (Almacena PDFs)
├── fotografias/ (Almacena Fotos PNG)
├── index.html
└── vendor/ (Dependencias PHP)
```

## 5. Mantenimiento
Para agregar nuevas funcionalidades, se recomienda seguir el patrón de módulos en `assets/js/modules/` y exportar los objetos para ser utilizados en `main.js`. El acceso administrativo se mantiene con el código secreto `ScaAdmin2026` en el campo de número de documento.