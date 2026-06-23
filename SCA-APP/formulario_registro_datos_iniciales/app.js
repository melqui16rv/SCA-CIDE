document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Elementos DOM
    const views = {
        doc: document.getElementById('view-doc'),
        form: document.getElementById('view-form'),
        success: document.getElementById('view-success')
    };

    const forms = {
        doc: document.getElementById('doc-form'),
        data: document.getElementById('data-form')
    };

    const errors = {
        doc: document.getElementById('doc-error'),
        form: document.getElementById('form-error')
    };

    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // Estado local
    let currentDocumento = '';

    // Funciones de UI
    const showView = (viewName) => {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    };

    const showError = (type, message) => {
        const errorEl = errors[type];
        errorEl.textContent = message;
        
        // Modal informativo nativo (solicitado por UX)
        alert(message);
        
        // Quitar la clase oculta (ahora usamos active si queremos, pero la alerta de error usa hidden)
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 5000);
    };

    const showLoading = (text = 'Procesando...') => {
        loadingText.textContent = text;
        overlay.classList.remove('hidden');
    };

    const hideLoading = () => {
        overlay.classList.add('hidden');
    };

    // Formulario de Documento
    forms.doc.addEventListener('submit', async (e) => {
        e.preventDefault();
        const docInput = document.getElementById('documento').value.trim();
        
        if (!docInput) {
            showError('doc', 'Por favor, ingrese un documento válido.');
            return;
        }

        showLoading('Verificando documento...');
        
        try {
            const response = await fetch(`/api/check_datos_iniciales.php?documento=${docInput}`);
            const result = await response.json();

            hideLoading();

            if (!result.success) {
                // Si success es false, significa que el documento YA EXISTE o hubo un error
                showError('doc', result.message);
            } else {
                // Documento disponible, avanzar al formulario
                currentDocumento = docInput;
                showView('form');
            }
        } catch (error) {
            hideLoading();
            showError('doc', 'Error de conexión con el servidor.');
            console.error(error);
        }
    });

    // Botón Volver
    document.getElementById('btn-back').addEventListener('click', () => {
        currentDocumento = '';
        document.getElementById('documento').value = '';
        showView('doc');
    });

    // Botón Finalizar
    const btnFinish = document.getElementById('btn-finish');
    if (btnFinish) {
        btnFinish.addEventListener('click', () => {
            currentDocumento = '';
            document.getElementById('documento').value = '';
            forms.data.reset();
            showView('doc');
        });
    }

    // Formulario de Datos
    forms.data.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(forms.data);
        formData.append('documento', currentDocumento);

        showLoading('Guardando registro...');

        try {
            const response = await fetch('/api/submit_datos_iniciales.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            hideLoading();

            if (result.success) {
                showView('success');
            } else {
                showError('form', result.message);
            }
        } catch (error) {
            hideLoading();
            showError('form', 'Error al guardar los datos.');
            console.error(error);
        }
    });
});
