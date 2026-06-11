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

    // ─────────────────────────────────────────────
    // Fecha de Expedición — input moderno AAAA/MM/DD
    // ─────────────────────────────────────────────
// ── Date Picker ──────────────────────────────
(function(){
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS   = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
  let step = 'year', selYear = null, selMonth = null, selDay = null, yearPage = 0;

  const dpInput  = document.getElementById('dpInput');
  const dpPanel  = document.getElementById('dpPanel');
  const dpGrid   = document.getElementById('dpGrid');
  const dpStepLbl= document.getElementById('dpStepLabel');
  const dpDisplay= document.getElementById('dpDisplay');
  const fechaH   = document.getElementById('fecha_expedicion');
  const btnPrev  = document.getElementById('dpPrev');
  const btnNext  = document.getElementById('dpNext');

  const today = new Date();
  const maxYear = today.getFullYear();

  dpInput.addEventListener('click', () => dpPanel.classList.contains('open') ? close() : open());
  document.addEventListener('click', e => { if(!document.getElementById('dpWrap').contains(e.target)) close(); });
  btnPrev.addEventListener('click', () => { yearPage++; render(); });
  btnNext.addEventListener('click', () => { yearPage--; render(); });

  function open(){ dpPanel.classList.add('open'); render(); }
  function close(){ dpPanel.classList.remove('open'); }

  function render(){
    dpGrid.innerHTML = '';
    if(step === 'year'){
      dpGrid.className = 'dp-grid years';
      dpStepLbl.textContent = 'Selecciona el año';
      const start = maxYear - yearPage * 16;
      for(let y = start; y >= Math.max(start - 15, 1940); y--){
        const c = make(y, y === selYear, false);
        c.addEventListener('click', () => { selYear = y; step = 'month'; render(); });
        dpGrid.appendChild(c);
      }
    } else if(step === 'month'){
      dpGrid.className = 'dp-grid months';
      dpStepLbl.textContent = selYear;
      MONTHS.forEach((m, i) => {
        const future = selYear === maxYear && i > today.getMonth();
        const c = make(m.slice(0,3), i === selMonth, future);
        c.addEventListener('click', () => { selMonth = i; step = 'day'; render(); });
        dpGrid.appendChild(c);
      });
    } else {
      dpGrid.className = 'dp-grid days';
      dpStepLbl.textContent = MONTHS[selMonth] + ' ' + selYear;
      DAYS.forEach(d => {
        const l = document.createElement('div');
        l.className = 'dp-cell day-label'; l.textContent = d; dpGrid.appendChild(l);
      });
      const offset = (new Date(selYear, selMonth, 1).getDay() + 6) % 7;
      const total  = new Date(selYear, selMonth + 1, 0).getDate();
      for(let i=0;i<offset;i++){ const e=document.createElement('div'); dpGrid.appendChild(e); }
      for(let d=1;d<=total;d++){
        const future = selYear===maxYear && selMonth===today.getMonth() && d>today.getDate();
        const c = make(d, d === selDay, future);
        c.addEventListener('click', () => { selDay = d; finish(); });
        dpGrid.appendChild(c);
      }
    }
  }

  function make(text, selected, disabled){
    const c = document.createElement('div');
    c.className = 'dp-cell' + (selected?' selected':'') + (disabled?' disabled':'');
    c.textContent = text; return c;
  }

  function finish(){
    const mm = String(selMonth+1).padStart(2,'0');
    const dd = String(selDay).padStart(2,'0');
    fechaH.value = selYear+'-'+mm+'-'+dd;
    dpDisplay.textContent = selYear+' / '+mm+' / '+dd;
    dpDisplay.style.color = '';
    dpInput.classList.add('filled');
    close(); step = 'year';
  }
})();

    // Referencia global para el input de fecha oculto
    const fechaHidden = document.getElementById('fecha_expedicion');
    const fechaDisplay = document.getElementById('dpDisplay');

    // ─────────────────────────────────────────────
    // Helper: Show/Hide Views
    // ─────────────────────────────────────────────
    function showView(viewElement) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        viewElement.classList.remove('hidden');
        setTimeout(() => viewElement.classList.add('active'), 50);
    }

    function showLoading(text) {
        loadingText.textContent = text || 'Procesando...';
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    // ─────────────────────────────────────────────
    // View 1 Submit
    // ─────────────────────────────────────────────
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
                document.getElementById('nombre_completo').value = data.data.nombre_completo_aprendiz || '';
                document.getElementById('correo').value           = data.data.correo_electronico_aprendiz || '';
                document.getElementById('telefono').value         = data.data.telefono_aprendiz || '';
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

    // ─────────────────────────────────────────────
    // Back to View 1
    // ─────────────────────────────────────────────
    document.getElementById('btn-back').addEventListener('click', () => {
        showView(view1);
        formView2.reset();
        // Limpiar fecha display también
        fechaDisplay.textContent = 'AAAA / MM / DD';
        fechaDisplay.style.color = 'var(--text-muted)';
        document.getElementById('dpInput').classList.remove('filled');
        fechaHidden.value = '';
        resetFiles();
    });

    function resetFiles() {
        croppedBlob    = null;
        docFrontBase64 = null;
        docBackBase64  = null;
        
        // Reset media UI
        updateMediaUI('foto', false);
        updateMediaUI('doc-front', false);
        updateMediaUI('doc-back', false);
        
        // Reset preview containers
        document.getElementById('foto-preview-box').innerHTML = '<span class="media-icon">📸</span>';
        document.getElementById('doc-front-preview-box').innerHTML = '<span class="media-icon">🪪</span>';
        document.getElementById('doc-back-preview-box').innerHTML = '<span class="media-icon">🪪</span>';
        
        // Reset fallback inputs
        document.getElementById('foto_input').value = '';
        document.getElementById('doc_front_input').value = '';
        document.getElementById('doc_back_input').value = '';
        document.getElementById('foto_preview_container').style.display = 'none';
        document.getElementById('doc_front_preview_container').style.display = 'none';
        document.getElementById('doc_back_preview_container').style.display = 'none';
    }

    // ─────────────────────────────────────────────
    // Cropper JS Setup & Media Upload Logic
    // ─────────────────────────────────────────────
    const fotoInput           = document.getElementById('foto_input');
    const cropperModal        = document.getElementById('cropper-modal');
    const cropperImage        = document.getElementById('cropper-image');
    const fotoPreviewContainer = document.getElementById('foto_preview_container');
    const fotoImagePreview    = document.getElementById('foto_image');

    // Función para actualizar UI de media items
    function updateMediaUI(type, hasContent) {
        const badge = document.getElementById(`badge-${type}`);
        const box = document.getElementById(`${type}-preview-box`);
        const deleteBtn = document.getElementById(`btn-delete-${type}`);
        const captureBtn = document.getElementById(`btn-capture-${type}`);
        
        if (hasContent) {
            badge.className = 'badge success';
            badge.textContent = '✓ Capturado';
            box.style.borderStyle = 'solid';
            box.style.borderColor = 'var(--success-color)';
            box.style.background = 'rgba(16,185,129,0.05)';
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
            if (captureBtn) captureBtn.textContent = 'Reemplazar';
        } else {
            badge.className = 'badge pending';
            badge.textContent = 'Pendiente';
            box.style.borderStyle = 'dashed';
            box.style.borderColor = '#cbd5e1';
            box.style.background = '#fff';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (captureBtn) captureBtn.textContent = 'Capturar';
        }
    }

    // Mostrar preview en media item
    function showMediaPreview(type, dataUrl) {
        const box = document.getElementById(`${type}-preview-box`);
        if (box) {
            box.innerHTML = `<img src="${dataUrl}" alt="Preview" style="max-width:100%; max-height:100%; object-fit:cover; border-radius:6px;">`;
        }
    }

    // Event listeners para botones de captura
    document.getElementById('btn-capture-foto')?.addEventListener('click', () => {
        if (!croppedBlob) startCameraStep('foto');
        else fotoInput.click();
    });

    document.getElementById('btn-capture-doc-front')?.addEventListener('click', () => {
        if (!docFrontBase64) startCameraStep('doc-front');
        else document.getElementById('doc_front_input').click();
    });

    document.getElementById('btn-capture-doc-back')?.addEventListener('click', () => {
        if (!docBackBase64) startCameraStep('doc-back');
        else document.getElementById('doc_back_input').click();
    });

    // Botones de eliminar
    document.getElementById('btn-delete-foto')?.addEventListener('click', () => {
        croppedBlob = null;
        fotoInput.value = '';
        document.getElementById('foto-preview-box').innerHTML = '<span class="media-icon">📸</span>';
        updateMediaUI('foto', false);
    });

    document.getElementById('btn-delete-doc-front')?.addEventListener('click', () => {
        docFrontBase64 = null;
        document.getElementById('doc_front_input').value = '';
        document.getElementById('doc-front-preview-box').innerHTML = '<span class="media-icon">🪪</span>';
        updateMediaUI('doc-front', false);
    });

    document.getElementById('btn-delete-doc-back')?.addEventListener('click', () => {
        docBackBase64 = null;
        document.getElementById('doc_back_input').value = '';
        document.getElementById('doc-back-preview-box').innerHTML = '<span class="media-icon">🪪</span>';
        updateMediaUI('doc-back', false);
    });

    fotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            cropperImage.src = url;
            cropperModal.classList.remove('hidden');

            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 3 / 4,
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
            showMediaPreview('foto', url);
            updateMediaUI('foto', true);
            cropperModal.classList.add('hidden');

            if (!docFrontBase64) {
                setTimeout(() => startCameraStep('doc-front'), 800);
            }
        }, 'image/png', 0.8);
    });

    // ─────────────────────────────────────────────
    // Location Select Logic
    // ─────────────────────────────────────────────
    const deptoSelect   = document.getElementById('lugar_depto');
    const ciudadSelect  = document.getElementById('lugar_ciudad');
    const otroCheck     = document.getElementById('lugar_otro_check');
    const lugarInput    = document.getElementById('lugar_expedicion');
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
            lugarInput.style.display    = 'block';
            lugarInput.required         = true;
            deptoSelect.required        = false;
            ciudadSelect.required       = false;
        } else {
            lugarControls.style.display = 'flex';
            lugarInput.style.display    = 'none';
            lugarInput.required         = false;
            deptoSelect.required        = true;
            ciudadSelect.required       = true;
        }
    });

    function getLugarExpedicion() {
        if (otroCheck.checked) {
            return lugarInput.value.trim();
        }
        const ciudad = ciudadSelect.value;
        const depto  = deptoSelect.value;
        return ciudad && depto ? `${ciudad}, ${depto}` : '';
    }

    // ─────────────────────────────────────────────
    // File Fallback Logic
    // ─────────────────────────────────────────────
    const docFrontInput = document.getElementById('doc_front_input');
    const docBackInput  = document.getElementById('doc_back_input');

    const fileToDataURL = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    docFrontInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            docFrontBase64 = await fileToDataURL(e.target.files[0]);
            showMediaPreview('doc-front', docFrontBase64);
            updateMediaUI('doc-front', true);
        }
    });

    docBackInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            docBackBase64 = await fileToDataURL(e.target.files[0]);
            showMediaPreview('doc-back', docBackBase64);
            updateMediaUI('doc-back', true);
        }
    });

    // ─────────────────────────────────────────────
    // Camera Logic
    // ─────────────────────────────────────────────
    const btnOpenCamera      = document.getElementById('btn-open-camera');
    const cameraModal        = document.getElementById('camera-modal');
    const cameraVideo        = document.getElementById('camera-video');
    const cameraStencilBorder = document.getElementById('stencil-border');
    const cameraStencilPath  = document.getElementById('stencil-path');
    const cameraTitle        = document.getElementById('camera-title');
    const cameraInstructions = document.getElementById('camera-instructions');
    const btnCameraCancel    = document.getElementById('btn-camera-cancel');
    const btnCameraCapture   = document.getElementById('btn-camera-capture');

    let currentCameraStream = null;
    let currentCameraStep   = 'foto';

    const STENCIL_OVAL = "M150,55 C215,55 255,120 255,200 C255,305 205,355 150,355 C95,355 45,305 45,200 C45,120 85,55 150,55 Z";
    const STENCIL_RECT = "M20,130 L280,130 L280,270 L20,270 Z";
    const STEP_CONFIG  = {
        'foto':      { title: 'Foto Carnet',          hint: 'Centra tu rostro y hombros dentro del óvalo. Mantén el celular de frente a tu cara.',      stencil: STENCIL_OVAL, facing: 'user' },
        'doc-front': { title: 'Doc. Frontal — Cédula', hint: 'Coloca la cédula con la FOTO visible dentro del recuadro verde. Fondo claro, sin reflejos.', stencil: STENCIL_RECT, facing: 'environment' },
        'doc-back':  { title: 'Doc. Reverso — Cédula', hint: 'Voltea la cédula (lado con datos y código de barras) y ubícala dentro del recuadro verde.',  stencil: STENCIL_RECT, facing: 'environment' },
    };

    document.getElementById('btn-fallback-upload').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('camera-section').style.display = 'none';
        document.getElementById('fallback-section').classList.remove('hidden');
    });

    btnOpenCamera.addEventListener('click', () => {
        if (!croppedBlob)        startCameraStep('foto');
        else if (!docFrontBase64) startCameraStep('doc-front');
        else if (!docBackBase64)  startCameraStep('doc-back');
        else alert('Todas las fotos ya fueron capturadas.');
    });

    btnCameraCancel.addEventListener('click', () => {
        stopCamera();
        cameraModal.classList.add('hidden');
    });

    async function startCameraStep(step) {
        currentCameraStep = step;
        const cfg = STEP_CONFIG[step];

        cameraTitle.textContent        = cfg.title;
        cameraInstructions.textContent = cfg.hint;
        cameraStencilBorder.setAttribute('d', cfg.stencil);
        cameraStencilPath.setAttribute('d', cfg.stencil);

        cameraModal.classList.remove('hidden');

        try {
            if (currentCameraStream) stopCamera();
            const constraints = {
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

        const canvas = document.createElement('canvas');
        canvas.width  = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        canvas.getContext('2d').drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        cameraModal.classList.add('hidden');

        if (currentCameraStep === 'foto') {
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
        } else if (currentCameraStep === 'doc-front') {
            docFrontBase64 = dataUrl;
            showMediaPreview('doc-front', docFrontBase64);
            updateMediaUI('doc-front', true);
            if (!docBackBase64) setTimeout(() => startCameraStep('doc-back'), 600);
        } else if (currentCameraStep === 'doc-back') {
            docBackBase64 = dataUrl;
            showMediaPreview('doc-back', docBackBase64);
            updateMediaUI('doc-back', true);
        }
    });

    // ─────────────────────────────────────────────
    // View 2 Submit
    // ─────────────────────────────────────────────
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

        // Validar que la fecha esté completa
        if (!fechaHidden.value) {
            alert('Por favor ingrese una fecha de expedición válida (AAAA / MM / DD).');
            document.getElementById('dpInput').focus();
            return;
        }

        showLoading('Generando documento y guardando...');

        try {
            const { jsPDF } = window.jspdf;

            const loadImage = (dataUrl) => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = dataUrl;
            });

            const imgFront = await loadImage(docFrontBase64);
            const imgBack  = await loadImage(docBackBase64);

            const pdf     = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageW   = 210;
            const pageH   = 297;
            const margin  = 10;
            const usableW = pageW - margin * 2;

            const addDocImage = (img, yStart, maxH) => {
                const aspect = img.naturalWidth / img.naturalHeight;
                const imgW   = usableW;
                const imgH   = Math.min(imgW / aspect, maxH);
                const fmt    = img.src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                pdf.addImage(img.src, fmt, margin, yStart, imgW, imgH);
                return imgH;
            };

            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Documento de Identidad — Cara Frontal', margin, 14);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 120);
            pdf.text('SCA-CIDE — Sistema de Registro de Aprendices', margin, 20);
            pdf.setTextColor(0, 0, 0);
            const hFront = addDocImage(imgFront, 26, pageH / 2 - 30);

            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Documento de Identidad — Reverso', margin, 26 + hFront + 10);
            addDocImage(imgBack, 26 + hFront + 16, pageH / 2 - 30);

            const pdfBlob = pdf.output('blob');

            const formData = new FormData();
            formData.append('documento',       currentDocumento);
            formData.append('fecha_expedicion', fechaHidden.value);
            formData.append('lugar_expedicion', lugarFinal);
            formData.append('foto',             croppedBlob, `${currentDocumento}.png`);
            formData.append('documento_pdf',    pdfBlob,     `${currentDocumento}.pdf`);

            const res    = await fetch('api/submit_data.php', { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                alert('¡Datos registrados correctamente!');
                showView(view1);
                formView1.reset();
                formView2.reset();
                fechaDisplay.textContent = 'AAAA / MM / DD';
                fechaDisplay.style.color = 'var(--text-muted)';
                document.getElementById('dpInput').classList.remove('filled');
                fechaHidden.value = '';
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

    // ─────────────────────────────────────────────
    // Admin Login
    // ─────────────────────────────────────────────
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
            const res  = await fetch('api/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (data.success) loadAdminData();
            else msg.textContent = data.message;
        } catch (err) {
            msg.textContent = 'Error de conexión.';
        } finally {
            hideLoading();
        }
    });

    // ─────────────────────────────────────────────
    // Admin Dashboard
    // ─────────────────────────────────────────────
    let allAdminUsers = [];

    async function loadAdminData() {
        showLoading('Cargando datos...');
        try {
            const res    = await fetch('api/admin.php?action=list');
            const result = await res.json();
            if (result.success) {
                allAdminUsers = result.data;
                renderAdminTable();
                showView(viewAdminDashboard);
            } else {
                alert(result.message);
                showView(view1);
            }
        } catch (err) {
            alert('Error al cargar datos administrativos.');
        } finally {
            hideLoading();
        }
    }

    // ─────────────────────────────────────────────
    // Admin Dashboard State
    // ─────────────────────────────────────────────
    let currentAdminPage = 1;
    let itemsPerPage = 10;

    function showDownloadValidationModal(fileName, fileUrl) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay-validation';
            overlay.innerHTML = `
                <div class="validation-modal">
                    <h3>⬇️ Descargar Archivo</h3>
                    <p>¿Está seguro de que desea descargar <strong>${fileName}</strong>?</p>
                    <div class="validation-actions">
                        <button class="btn-cancel">Cancelar</button>
                        <button class="btn-confirm">Descargar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            overlay.querySelector('.btn-cancel').addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            
            overlay.querySelector('.btn-confirm').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = fileName;
                link.click();
                overlay.remove();
                resolve(true);
            });
        });
    }

    function renderAdminTable() {
        const tbody        = document.getElementById('users-tbody');
        const searchTerm   = document.getElementById('admin-search').value.toLowerCase();
        const filterStatus = document.getElementById('admin-filter').value;
        itemsPerPage       = parseInt(document.getElementById('admin-page-size').value) || 10;

        let total = 0, validadoCount = 0, noValidadoCount = 0;
        let faltaFotoCount = 0, faltaDocCount = 0, completosCount = 0;

        // Calcular métricas
        allAdminUsers.forEach(user => {
            total++;
            const hasFoto = !!user.ruta_foto_aprendiz;
            const hasDoc  = !!user.ruta_documento_identificacion_aprendiz;
            
            if (user.estado_validacion === 'validado') validadoCount++;
            else noValidadoCount++;
            
            if (!hasFoto) faltaFotoCount++;
            if (!hasDoc) faltaDocCount++;
            if (hasFoto && hasDoc) completosCount++;
        });

        // Actualizar métricas en UI
        document.getElementById('metric-total').textContent       = total;
        document.getElementById('metric-validado').textContent     = validadoCount;
        document.getElementById('metric-no-validado').textContent  = noValidadoCount;
        document.getElementById('metric-falta-foto').textContent   = faltaFotoCount;
        document.getElementById('metric-falta-doc').textContent    = faltaDocCount;
        document.getElementById('metric-completos').textContent    = completosCount;

        // Filtrar usuarios
        let filteredUsers = allAdminUsers.filter(user => {
            const hasFoto = !!user.ruta_foto_aprendiz;
            const hasDoc  = !!user.ruta_documento_identificacion_aprendiz;
            
            // Aplicar filtro de estado
            if (filterStatus === 'validado' && user.estado_validacion !== 'validado') return false;
            if (filterStatus === 'no_validado' && user.estado_validacion !== 'no_validado') return false;
            if (filterStatus === 'completos' && !(hasFoto && hasDoc)) return false;
            if (filterStatus === 'falta_foto' && hasFoto) return false;
            if (filterStatus === 'falta_doc' && hasDoc) return false;
            
            // Aplicar búsqueda
            if (searchTerm) {
                const doc = (user.numero_documento_aprendiz  || '').toLowerCase();
                const nom = (user.nombre_completo_aprendiz   || '').toLowerCase();
                if (!doc.includes(searchTerm) && !nom.includes(searchTerm)) return false;
            }
            return true;
        });

        // Calcular paginación
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        if (currentAdminPage > totalPages) currentAdminPage = Math.max(1, totalPages);
        
        const startIdx = (currentAdminPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIdx, endIdx);

        tbody.innerHTML = '';

        if (paginatedUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:24px;">No se encontraron registros.</td></tr>';
        } else {
            paginatedUsers.forEach(user => {
                const tr        = document.createElement('tr');
                const isChecked = user.estado_validacion === 'validado' ? 'checked' : '';
                const fotoUrl   = (user.ruta_foto_aprendiz || '').replace(/^SCA-APP\//, '');
                const pdfUrl    = (user.ruta_documento_identificacion_aprendiz || '').replace(/^SCA-APP\//, '');
                const hasFoto   = !!fotoUrl;
                const hasDoc    = !!pdfUrl;

                tr.innerHTML = `
                    <td style="position: relative;">
                        <strong>${user.numero_documento_aprendiz}</strong><br>
                        ${user.nombre_completo_aprendiz}<br>
                        <small style="color:var(--text-muted);">${user.correo_electronico_aprendiz || 'Sin correo'}</small>
                    </td>
                    <td>
                        <small style="color:var(--text-muted);">${user.correo_electronico_aprendiz || 'No disponible'}</small>
                    </td>
                    <td style="position: relative;">
                        ${hasFoto ? `<button class="btn-download-preview" data-url="${fotoUrl}" data-type="foto" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-weight: 600; text-decoration: underline;">📷 Foto</button>` : '<span style="color:var(--text-muted);">Sin foto</span>'}
                        <br>
                        ${hasDoc ? `<button class="btn-download-preview" data-url="${pdfUrl}" data-type="doc" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-weight: 600; text-decoration: underline;">📄 Doc</button>` : '<span style="color:var(--text-muted);">Sin doc</span>'}
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
        }

        // Actualizar controles de paginación
        updatePaginationControls(totalPages);

        // Agregar event listeners para descargas con validación
        document.querySelectorAll('.btn-download-preview').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const fileUrl = btn.getAttribute('data-url');
                const fileType = btn.getAttribute('data-type');
                const fileName = fileType === 'foto' ? 'foto_carnet' : 'documento_identificacion';
                const confirmed = await showDownloadValidationModal(fileName, fileUrl);
                if (confirmed) {
                    // Descarga confirmada
                }
            });
        });

        // Event listeners para status toggle
        document.querySelectorAll('.status-toggle').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const doc      = e.target.getAttribute('data-doc');
                const newState = e.target.checked ? 'validado' : 'no_validado';
                e.target.disabled = true;
                try {
                    const res  = await fetch(`api/admin.php?action=toggle_validation&documento=${doc}&estado=${newState}`);
                    const json = await res.json();
                    if (json.success) {
                        const idx = allAdminUsers.findIndex(u => u.numero_documento_aprendiz === doc);
                        if (idx > -1) allAdminUsers[idx].estado_validacion = newState;
                        renderAdminTable();
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

    function updatePaginationControls(totalPages) {
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');
        const infoDiv = document.getElementById('pagination-info');
        
        if (prevBtn) prevBtn.disabled = currentAdminPage === 1;
        if (nextBtn) nextBtn.disabled = currentAdminPage === totalPages;
        if (infoDiv) infoDiv.textContent = `Página ${currentAdminPage} de ${totalPages}`;
    }

    // Event listeners para búsqueda, filtros y paginación
    document.getElementById('admin-search')?.addEventListener('input', () => {
        currentAdminPage = 1;
        renderAdminTable();
    });
    
    document.getElementById('admin-filter')?.addEventListener('change', () => {
        currentAdminPage = 1;
        renderAdminTable();
    });
    
    document.getElementById('admin-page-size')?.addEventListener('change', () => {
        currentAdminPage = 1;
        renderAdminTable();
    });
    
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
        if (currentAdminPage > 1) {
            currentAdminPage--;
            renderAdminTable();
            document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    document.getElementById('btn-next-page')?.addEventListener('click', () => {
        currentAdminPage++;
        renderAdminTable();
        document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('api/admin.php?action=logout');
        showView(view1);
    });

});