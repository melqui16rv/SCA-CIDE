document.addEventListener('DOMContentLoaded', () => {
    // Views
    const view1 = document.getElementById('view1');
    const view2 = document.getElementById('view2');
    const viewAdminLogin = document.getElementById('admin-login');
    const viewAdminDashboard = document.getElementById('admin-dashboard');

    // Forms
    const formView1 = document.getElementById('form-view1');
    const formView2 = document.getElementById('form-view2');
    const formAdminLogin = document.getElementById('form-admin-login');

    // UI Elements
    const errorDocMsg = document.getElementById('error-doc-msg');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // State
    let currentDocumento = '';
    let cropper = null;
    let croppedBlob = null;
    let docFrontBase64 = null;
    let docBackBase64 = null;

    // Helper: Show/Hide Views
    function showView(viewElement) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        viewElement.classList.remove('hidden');
        // small timeout for animation
        setTimeout(() => viewElement.classList.add('active'), 50);
    }

    // Helper: Show Loading
    function showLoading(text) {
        loadingText.textContent = text || 'Procesando...';
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    // View 1 Submit (Check Document / Admin Login)
    formView1.addEventListener('submit', async (e) => {
        e.preventDefault();
        const documento = document.getElementById('numero_documento').value.trim();
        errorDocMsg.textContent = '';

        if (documento === 'ScaAdmin2026') {
            document.getElementById('numero_documento').value = '';
            showView(viewAdminLogin);
            return;
        }

        if (!documento) return;

        showLoading('Validando documento...');
        try {
            const res = await fetch(`api/check_document.php?documento=${encodeURIComponent(documento)}`);
            const data = await res.json();

            if (data.success) {
                currentDocumento = documento;
                // Populate View 2
                document.getElementById('nombre_completo').value = data.data.nombre_completo_aprendiz || '';
                document.getElementById('correo').value = data.data.correo_electronico_aprendiz || '';
                document.getElementById('telefono').value = data.data.telefono_aprendiz || '';
                showView(view2);
            } else {
                errorDocMsg.textContent = data.message;
            }
        } catch (err) {
            errorDocMsg.textContent = 'Error de conexión. Intente nuevamente.';
        } finally {
            hideLoading();
        }
    });

    // Back to View 1
    document.getElementById('btn-back').addEventListener('click', () => {
        showView(view1);
        formView2.reset();
        resetFiles();
    });

    // Reset files function
    function resetFiles() {
        croppedBlob = null;
        docFrontBase64 = null;
        docBackBase64 = null;
        document.getElementById('foto_preview_container').style.display = 'none';
        document.getElementById('doc_front_preview').classList.add('hidden');
        document.getElementById('doc_back_preview').classList.add('hidden');
    }

    // Cropper JS Setup
    const fotoInput = document.getElementById('foto_input');
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const fotoPreviewContainer = document.getElementById('foto_preview_container');
    const fotoImagePreview = document.getElementById('foto_image');

    fotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            cropperImage.src = url;
            cropperModal.classList.remove('hidden');

            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 3 / 4, // Typical ID photo ratio
                viewMode: 2,
            });
        }
    });

    document.getElementById('btn-crop-cancel').addEventListener('click', () => {
        cropperModal.classList.add('hidden');
        fotoInput.value = '';
    });

    document.getElementById('btn-crop-confirm').addEventListener('click', () => {
        if (!cropper) return;
        cropper.getCroppedCanvas({
            width: 300,
            height: 400,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        }).toBlob((blob) => {
            croppedBlob = blob;
            const url = URL.createObjectURL(blob);
            fotoImagePreview.src = url;
            fotoPreviewContainer.style.display = 'block';
            cropperModal.classList.add('hidden');

            // Mark selfie as done
            document.getElementById('status-foto').style.background = 'rgba(16,185,129,0.1)';
            document.getElementById('status-foto').innerHTML = `<span>📸 Foto Carnet</span> <span class="badge success">✓ Capturado</span>`;

            // Auto-advance to document front if not yet captured
            if (!docFrontBase64) {
                setTimeout(() => startCameraStep('doc-front'), 800);
            }
        }, 'image/png', 0.8);
    });

    // Location Select Logic
    const deptoSelect = document.getElementById('lugar_depto');
    const ciudadSelect = document.getElementById('lugar_ciudad');
    const otroCheck = document.getElementById('lugar_otro_check');
    const lugarInput = document.getElementById('lugar_expedicion');
    const lugarControls = document.querySelector('.lugar-controls');

    let divipolaData = [];

    async function fetchUbicaciones() {
        try {
            const res = await fetch('https://www.datos.gov.co/resource/gdxc-w37w.json?$select=dpto,nom_mpio&$limit=2000');
            if (!res.ok) throw new Error('API no disponible');
            const data = await res.json();
            divipolaData = data.map(item => ({ departamento: item.dpto, municipio: item.nom_mpio }));
            
            const deptos = [...new Set(divipolaData.map(item => item.departamento))].sort();
            
            deptos.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                deptoSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('Error fetching ubicaciones:', err);
            // Fallback: show text input if API fails
            document.querySelector('.lugar-controls').style.display = 'none';
            lugarInput.style.display = 'block';
            lugarInput.placeholder = 'Escriba el departamento y ciudad (ej: Cundinamarca, Bogotá)';
            lugarInput.required = true;
        }
    }
    fetchUbicaciones();

    deptoSelect.addEventListener('change', () => {
        const depto = deptoSelect.value;
        ciudadSelect.innerHTML = '<option value="">Ciudad</option>';
        if (depto) {
            ciudadSelect.disabled = false;
            const ciudades = divipolaData
                .filter(item => item.departamento === depto)
                .map(item => item.municipio)
                .sort();
            ciudades.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                ciudadSelect.appendChild(opt);
            });
        } else {
            ciudadSelect.disabled = true;
        }
    });

    otroCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            lugarControls.style.display = 'none';
            lugarInput.style.display = 'block';
            lugarInput.required = true;
            deptoSelect.required = false;
            ciudadSelect.required = false;
        } else {
            lugarControls.style.display = 'flex';
            lugarInput.style.display = 'none';
            lugarInput.required = false;
            deptoSelect.required = true;
            ciudadSelect.required = true;
        }
    });

    function getLugarExpedicion() {
        if (otroCheck.checked) {
            return lugarInput.value.trim();
        } else {
            const ciudad = ciudadSelect.value;
            const depto = deptoSelect.value;
            return ciudad && depto ? `${ciudad}, ${depto}` : '';
        }
    }

    // File Fallback Logic
    const docFrontInput = document.getElementById('doc_front_input');
    const docBackInput = document.getElementById('doc_back_input');

    const fileToDataURL = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    docFrontInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            docFrontBase64 = await fileToDataURL(e.target.files[0]);
            document.getElementById('status-doc-front').className = 'media-status-item success';
            document.getElementById('status-doc-front').innerHTML = `<span>🪪 Doc. Frontal</span> <span class="badge success">Completado</span>`;
            
            const preview = document.getElementById('doc_front_preview');
            preview.src = docFrontBase64;
            preview.classList.remove('hidden');
        }
    });

    docBackInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            docBackBase64 = await fileToDataURL(e.target.files[0]);
            document.getElementById('status-doc-back').className = 'media-status-item success';
            document.getElementById('status-doc-back').innerHTML = `<span>🪪 Doc. Reverso</span> <span class="badge success">Completado</span>`;
            
            const preview = document.getElementById('doc_back_preview');
            preview.src = docBackBase64;
            preview.classList.remove('hidden');
        }
    });

    // Camera Logic
    const btnOpenCamera = document.getElementById('btn-open-camera');
    const cameraModal = document.getElementById('camera-modal');
    const cameraVideo = document.getElementById('camera-video');
    const cameraStencilBorder = document.getElementById('stencil-border');
    const cameraStencilPath = document.getElementById('stencil-path');
    const cameraTitle = document.getElementById('camera-title');
    const cameraInstructions = document.getElementById('camera-instructions');
    const btnCameraCancel = document.getElementById('btn-camera-cancel');
    const btnCameraCapture = document.getElementById('btn-camera-capture');
    
    let currentCameraStream = null;
    let currentCameraStep = 'foto'; // 'foto', 'doc-front', 'doc-back'

    // Define Stencils — SVG paths within a 300x400 viewBox
    // Oval for face (portrait, centered)
    const STENCIL_OVAL = "M150,55 C215,55 255,120 255,200 C255,305 205,355 150,355 C95,355 45,305 45,200 C45,120 85,55 150,55 Z";
    // Rectangle for Document — landscape card centered in portrait viewBox
    const STENCIL_RECT = "M20,130 L280,130 L280,270 L20,270 Z";
    // Camera facing modes per step
    const STEP_CONFIG = {
        'foto':      { title: 'Foto Carnet',         hint: 'Centra tu rostro y hombros dentro del óvalo. Mantén el celular de frente a tu cara.',     stencil: STENCIL_OVAL, facing: 'user' },
        'doc-front': { title: 'Doc. Frontal — Cédula', hint: 'Coloca la cédula con la FOTO visible dentro del recuadro verde. Fondo claro, sin reflejos.', stencil: STENCIL_RECT, facing: 'environment' },
        'doc-back':  { title: 'Doc. Reverso — Cédula', hint: 'Voltea la cédula (lado con datos y código de barras) y ubícala dentro del recuadro verde.',  stencil: STENCIL_RECT, facing: 'environment' },
    };

    document.getElementById('btn-fallback-upload').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('camera-section').style.display = 'none';
        document.getElementById('fallback-section').classList.remove('hidden');
    });

    btnOpenCamera.addEventListener('click', () => {
        if (!croppedBlob) {
            startCameraStep('foto');
        } else if (!docFrontBase64) {
            startCameraStep('doc-front');
        } else if (!docBackBase64) {
            startCameraStep('doc-back');
        } else {
            alert('Todas las fotos ya fueron capturadas.');
        }
    });

    btnCameraCancel.addEventListener('click', () => {
        stopCamera();
        cameraModal.classList.add('hidden');
    });

    async function startCameraStep(step) {
        currentCameraStep = step;
        const cfg = STEP_CONFIG[step];

        cameraTitle.textContent = cfg.title;
        cameraInstructions.textContent = cfg.hint;
        cameraStencilBorder.setAttribute('d', cfg.stencil);
        cameraStencilPath.setAttribute('d', cfg.stencil);

        cameraModal.classList.remove('hidden');

        try {
            if (currentCameraStream) stopCamera();

            // Try ideal facingMode; fallback gracefully
            let constraints = {
                video: { facingMode: { ideal: cfg.facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            };
            currentCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraVideo.srcObject = currentCameraStream;
        } catch (err) {
            console.error('Camera access error:', err);
            cameraModal.classList.add('hidden');
            stopCamera();
            const goFallback = confirm('No se pudo acceder a la cámara.\n\n¿Desea subir las fotos manualmente desde su galería?');
            if (goFallback) {
                document.getElementById('camera-section').style.display = 'none';
                document.getElementById('fallback-section').classList.remove('hidden');
            }
        }
    }

    function stopCamera() {
        if (currentCameraStream) {
            currentCameraStream.getTracks().forEach(track => track.stop());
            currentCameraStream = null;
        }
    }

    btnCameraCapture.addEventListener('click', () => {
        if (!currentCameraStream) return;
        
        // Capture current video frame at full resolution
        const canvas = document.createElement('canvas');
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        cameraModal.classList.add('hidden');

        if (currentCameraStep === 'foto') {
            // For portrait photo — send through Cropper for adjustment
            cropperImage.src = dataUrl;
            cropperModal.classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 3 / 4,
                viewMode: 1,
                guides: true,
                center: true,
                highlight: true,
            });
            // Status will be updated after crop confirm
        } else if (currentCameraStep === 'doc-front') {
            docFrontBase64 = dataUrl;
            document.getElementById('status-doc-front').style.background = 'rgba(16,185,129,0.1)';
            document.getElementById('status-doc-front').innerHTML = `<span>🪪 Doc. Frontal</span> <span class="badge success">✓ Capturado</span>`;
            
            if (!docBackBase64) {
                setTimeout(() => startCameraStep('doc-back'), 600);
            }
        } else if (currentCameraStep === 'doc-back') {
            docBackBase64 = dataUrl;
            document.getElementById('status-doc-back').style.background = 'rgba(16,185,129,0.1)';
            document.getElementById('status-doc-back').innerHTML = `<span>🪪 Doc. Reverso</span> <span class="badge success">✓ Capturado</span>`;
        }
    });

    // View 2 Submit (Final Submit)
    formView2.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!croppedBlob) {
            alert('Por favor recorte su fotografía.');
            return;
        }

        if (!docFrontBase64 || !docBackBase64) {
            alert('Por favor proporcione las fotos de ambos lados de su documento de identidad.');
            return;
        }

        const lugarFinal = getLugarExpedicion();
        if (!lugarFinal) {
            alert('Por favor indique el lugar de expedición del documento.');
            return;
        }

        showLoading('Generando documento y guardando...');

        try {
            // Generate PDF using jsPDF — A4 portrait layout
            const { jsPDF } = window.jspdf;
            
            // Load images to determine dimensions
            const loadImage = (dataUrl) => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = dataUrl;
            });

            const imgFront = await loadImage(docFrontBase64);
            const imgBack  = await loadImage(docBackBase64);

            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageW = 210;  // A4 width mm
            const pageH = 297;  // A4 height mm
            const margin = 10;
            const usableW = pageW - margin * 2;

            // Helper: add image maintaining aspect ratio
            const addDocImage = (img, yStart, maxH) => {
                const aspect = img.naturalWidth / img.naturalHeight;
                const imgW = usableW;
                const imgH = Math.min(imgW / aspect, maxH);
                // Detect format from data URL prefix
                const fmt = img.src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                pdf.addImage(img.src, fmt, margin, yStart, imgW, imgH);
                return imgH;
            };

            // Page 1: Front of ID
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Documento de Identidad — Cara Frontal', margin, 14);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 120);
            pdf.text('SCA-CIDE — Sistema de Registro de Aprendices', margin, 20);
            pdf.setTextColor(0, 0, 0);
            const hFront = addDocImage(imgFront, 26, pageH / 2 - 30);

            // Page 1: Back of ID (below)
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Documento de Identidad — Reverso', margin, 26 + hFront + 10);
            addDocImage(imgBack, 26 + hFront + 16, pageH / 2 - 30);

            const pdfBlob = pdf.output('blob');

            // Send via FormData
            const formData = new FormData();
            formData.append('documento', currentDocumento);
            formData.append('fecha_expedicion', document.getElementById('fecha_expedicion').value);
            formData.append('lugar_expedicion', lugarFinal);
            formData.append('foto', croppedBlob, `${currentDocumento}.png`);
            formData.append('documento_pdf', pdfBlob, `${currentDocumento}.pdf`);

            const res = await fetch('api/submit_data.php', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            
            if (result.success) {
                alert('¡Datos registrados correctamente!');
                showView(view1);
                formView1.reset();
                formView2.reset();
                resetFiles();
                currentDocumento = '';
            } else {
                alert(result.message || 'Ocurrió un error al guardar.');
            }

        } catch (err) {
            alert('Error al procesar los archivos. Intente nuevamente.');
            console.error(err);
        } finally {
            hideLoading();
        }
    });

    // Admin Login logic
    document.getElementById('btn-admin-cancel').addEventListener('click', () => {
        showView(view1);
        formAdminLogin.reset();
    });

    formAdminLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin_password').value;
        const msg = document.getElementById('admin-error-msg');
        msg.textContent = '';

        showLoading('Verificando credenciales...');
        try {
            const res = await fetch('api/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();

            if (data.success) {
                loadAdminData();
            } else {
                msg.textContent = data.message;
            }
        } catch (err) {
            msg.textContent = 'Error de conexión.';
        } finally {
            hideLoading();
        }
    });

    let allAdminUsers = [];

    async function loadAdminData() {
        showLoading('Cargando datos...');
        try {
            const res = await fetch('api/admin.php?action=list');
            const result = await res.json();

            if (result.success) {
                allAdminUsers = result.data;
                renderAdminTable();
                showView(viewAdminDashboard);
            } else {
                alert(result.message);
                showView(view1); // back if unauthorized
            }
        } catch (err) {
            alert('Error al cargar datos administrativos.');
        } finally {
            hideLoading();
        }
    }

    function renderAdminTable() {
        const tbody = document.getElementById('users-tbody');
        const searchTerm = document.getElementById('admin-search').value.toLowerCase();
        const filterStatus = document.getElementById('admin-filter').value;

        let total = 0;
        let validadoCount = 0;
        let noValidadoCount = 0;

        tbody.innerHTML = '';

        const filteredUsers = allAdminUsers.filter(user => {
            total++;
            if (user.estado_validacion === 'validado') validadoCount++;
            else noValidadoCount++;

            // Apply filters for rendering
            if (filterStatus !== 'todos' && user.estado_validacion !== filterStatus) return false;
            
            if (searchTerm) {
                const doc = (user.numero_documento_aprendiz || '').toLowerCase();
                const nom = (user.nombre_completo_aprendiz || '').toLowerCase();
                if (!doc.includes(searchTerm) && !nom.includes(searchTerm)) return false;
            }
            return true;
        });

        // Update Metrics
        document.getElementById('metric-total').textContent = total;
        document.getElementById('metric-validado').textContent = validadoCount;
        document.getElementById('metric-no-validado').textContent = noValidadoCount;

        if (filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:24px;">No se encontraron registros.</td></tr>';
            return;
        }

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            const isChecked = user.estado_validacion === 'validado' ? 'checked' : '';
            
            // The DB stores 'SCA-APP/fotografias/file.png'
            // When served from the SCA-APP root, strip the 'SCA-APP/' prefix
            const fotoUrl = (user.ruta_foto_aprendiz || '').replace(/^SCA-APP\//, '');
            const pdfUrl  = (user.ruta_documento_identificacion_aprendiz || '').replace(/^SCA-APP\//, '');
            
            tr.innerHTML = `
                <td>
                    <strong>${user.numero_documento_aprendiz}</strong><br>
                    ${user.nombre_completo_aprendiz}<br>
                    <small style="color:var(--text-muted);">${user.correo_electronico_aprendiz || ''}</small><br>
                    <small style="color:var(--text-muted);">${user.telefono_aprendiz || 'Sin teléfono'}</small>
                </td>
                <td>
                    ${fotoUrl ? `<a href="${fotoUrl}" target="_blank" download style="display:inline-block; margin-bottom:4px; font-weight:600; color:var(--primary-color);">📷 Foto Carnet</a>` : '<span style="color:var(--text-muted);">Sin foto</span>'}
                    <br>
                    ${pdfUrl ? `<a href="${pdfUrl}" target="_blank" download style="font-weight:600; color:var(--primary-color);">📄 Doc. PDF</a>` : '<span style="color:var(--text-muted);">Sin documento</span>'}
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="status-toggle" data-doc="${user.numero_documento_aprendiz}" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                        <span style="font-size:0.85rem; color:var(--text-muted);">${isChecked ? 'Validado' : 'Pendiente'}</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach listeners to toggles
        document.querySelectorAll('.status-toggle').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const doc = e.target.getAttribute('data-doc');
                const newState = e.target.checked ? 'validado' : 'no_validado';
                e.target.disabled = true; // disable while fetching
                
                try {
                    const res = await fetch(`api/admin.php?action=toggle_validation&documento=${doc}&estado=${newState}`);
                    const json = await res.json();
                    if (json.success) {
                        // update local state
                        const userIndex = allAdminUsers.findIndex(u => u.numero_documento_aprendiz === doc);
                        if (userIndex > -1) {
                            allAdminUsers[userIndex].estado_validacion = newState;
                        }
                        renderAdminTable(); // re-render to update metrics and UI
                    } else {
                        alert('Error al actualizar estado.');
                        e.target.checked = !e.target.checked;
                    }
                } catch (err) {
                    alert('Error de conexión al actualizar.');
                    e.target.checked = !e.target.checked;
                } finally {
                    e.target.disabled = false;
                }
            });
        });
    }

    document.getElementById('admin-search').addEventListener('input', renderAdminTable);
    document.getElementById('admin-filter').addEventListener('change', renderAdminTable);

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('api/admin.php?action=logout');
        showView(view1);
    });

});
