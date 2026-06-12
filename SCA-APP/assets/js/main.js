/**
 * Main Orchestrator - Binds all modules and handles core flow
 */
import API from './modules/api.js';
import UI from './modules/ui.js';
import Camera from './modules/camera.js';
import Utils from './modules/utils.js';
import Location from './modules/location.js';
import Admin from './modules/admin.js';

document.addEventListener('DOMContentLoaded', () => {
    // State
    const AppState = {
        currentDocumento: '',
        currentStep: 1,
        fotoBlob: null,
        docFrontBase64: null,
        docBackBase64: null,
        docPdfBlob: null // For direct PDF upload
    };

    // Initialize Utils
    Utils.initDatePicker();
    Location.init();

    // ─────────────────────────────────────────────
    // View 1: Document Validation
    // ─────────────────────────────────────────────
    const formView1 = document.getElementById('form-view1');

    // Helper: populate and proceed to step 1 after confirmation
    const proceedToRegistration = (data) => {
        document.getElementById('nombre_completo').value = data.nombre_completo_aprendiz || '';
        document.getElementById('correo').value = data.correo_electronico_aprendiz || '';
        document.getElementById('telefono').value = data.telefono_aprendiz || '';
        UI.showView('view2');
        UI.goToStep(1);
        AppState.currentStep = 1;
    };

    formView1.onsubmit = async (e) => {
        e.preventDefault();
        const doc = document.getElementById('numero_documento').value.trim();
        if (!doc) return;

        // Admin Secret Code
        if (doc === 'ScaAdmin2026') {
            UI.showView('admin-login');
            return;
        }

        UI.showLoading('Verificando aprendiz...');
        const res = await API.checkDocument(doc);
        UI.hideLoading();

        if (res.success) {
            AppState.currentDocumento = doc;

            if (res.tiene_registro) {
                // Show overwrite confirmation modal
                document.getElementById('overwrite-modal').classList.remove('hidden');
                if (typeof lucide !== 'undefined') lucide.createIcons();

                document.getElementById('btn-overwrite-confirm').onclick = () => {
                    document.getElementById('overwrite-modal').classList.add('hidden');
                    proceedToRegistration(res.data);
                };
                document.getElementById('btn-overwrite-cancel').onclick = () => {
                    document.getElementById('overwrite-modal').classList.add('hidden');
                    document.getElementById('numero_documento').value = '';
                    AppState.currentDocumento = '';
                };
            } else {
                proceedToRegistration(res.data);
            }
        } else {
            document.getElementById('error-doc-msg').textContent = res.message;
        }
    };


    // ─────────────────────────────────────────────
    // Stepper Navigation
    // ─────────────────────────────────────────────
    document.querySelectorAll('.btn-next-step').forEach(btn => {
        btn.onclick = () => {
            if (AppState.currentStep < 4) {
                // Validation before moving
                if (AppState.currentStep === 2) {
                    if (!document.getElementById('fecha_expedicion').value || !Location.getValue()) {
                        alert('Por favor completa la fecha y el lugar de expedición.');
                        return;
                    }
                }
                if (AppState.currentStep === 3 && !AppState.fotoBlob) {
                    alert('Debes capturar tu fotografía para continuar.');
                    return;
                }

                AppState.currentStep++;
                UI.goToStep(AppState.currentStep);
            }
        };
    });

    document.querySelectorAll('.btn-prev-step').forEach(btn => {
        btn.onclick = () => {
            if (AppState.currentStep > 1) {
                AppState.currentStep--;
                UI.goToStep(AppState.currentStep);
            }
        };
    });

    document.querySelector('.btn-back-v1').onclick = () => UI.showView('view1');

    // ─────────────────────────────────────────────
    // Camera & Media Logic
    // ─────────────────────────────────────────────
    
    document.getElementById('btn-capture-foto-wizard').onclick = () => Camera.start('foto');
    document.getElementById('btn-capture-doc-front-wizard').onclick = () => Camera.start('doc-front');
    document.getElementById('btn-capture-doc-back-wizard').onclick = () => Camera.start('doc-back');

    // Shutter Button
    document.getElementById('btn-camera-capture').onclick = () => {
        const dataUrl = Camera.capture();
        const step = Camera.state.currentStep;

        const cropperImg = document.getElementById('cropper-image');
        document.getElementById('cropper-modal').classList.remove('hidden');

        // IMPORTANT: wait for image to load before initializing Cropper
        // Otherwise Cropper reads 0x0 dimensions and applies wrong aspect ratio
        cropperImg.onload = () => {
            Camera.initCropper(cropperImg, step, (blob, previewUrl) => {
                if (step === 'foto') {
                    AppState.fotoBlob = blob;
                    const box = document.getElementById('foto-preview-box');
                    box.classList.add('has-image');
                    box.innerHTML = `<img src="${previewUrl}" alt="Foto carnet">`;
                    UI.updateBadge('foto', 'success');
                    document.getElementById('btn-delete-foto-wizard').style.display = 'inline-flex';
                } else if (step === 'doc-front') {
                    AppState.docFrontBase64 = previewUrl;
                    const box = document.getElementById('doc-front-preview-box');
                    box.classList.add('has-image');
                    box.innerHTML = `<img src="${previewUrl}" alt="Doc Frontal">`;
                    UI.updateBadge('doc-front', 'success');
                    document.getElementById('btn-delete-doc-front-wizard').style.display = 'inline-flex';
                } else if (step === 'doc-back') {
                    AppState.docBackBase64 = previewUrl;
                    const box = document.getElementById('doc-back-preview-box');
                    box.classList.add('has-image');
                    box.innerHTML = `<img src="${previewUrl}" alt="Doc Reverso">`;
                    UI.updateBadge('doc-back', 'success');
                    document.getElementById('btn-delete-doc-back-wizard').style.display = 'inline-flex';
                }
            });
        };
        // Set src AFTER onload is registered
        cropperImg.src = dataUrl;
    };


    document.getElementById('btn-camera-cancel').onclick = () => {
        Camera.stop();
        document.getElementById('camera-modal').classList.add('hidden');
    };

    document.getElementById('btn-crop-cancel').onclick = () => {
        document.getElementById('cropper-modal').classList.add('hidden');
    };

    // Delete Buttons Logic
    document.getElementById('btn-delete-foto-wizard').onclick = () => {
        AppState.fotoBlob = null;
        const box = document.getElementById('foto-preview-box');
        box.classList.remove('has-image');
        box.innerHTML = `<i data-lucide="user-circle" class="media-icon-svg"></i><p>Presiona "Abrir C\u00e1mara" para tomar tu foto</p>`;
        lucide.createIcons();
        UI.updateBadge('foto', 'pending');
        document.getElementById('btn-delete-foto-wizard').style.display = 'none';
    };

    document.getElementById('btn-delete-doc-front-wizard').onclick = () => {
        AppState.docFrontBase64 = null;
        const box = document.getElementById('doc-front-preview-box');
        box.classList.remove('has-image');
        box.innerHTML = `<i data-lucide="credit-card" class="media-icon-svg"></i>`;
        lucide.createIcons();
        UI.updateBadge('doc-front', 'pending');
        document.getElementById('btn-delete-doc-front-wizard').style.display = 'none';
    };

    document.getElementById('btn-delete-doc-back-wizard').onclick = () => {
        AppState.docBackBase64 = null;
        const box = document.getElementById('doc-back-preview-box');
        box.classList.remove('has-image');
        box.innerHTML = `<i data-lucide="credit-card" class="media-icon-svg"></i>`;
        lucide.createIcons();
        UI.updateBadge('doc-back', 'pending');
        document.getElementById('btn-delete-doc-back-wizard').style.display = 'none';
    };

    // ─────────────────────────────────────────────
    // Form Submission
    // ─────────────────────────────────────────────
    const formView2 = document.getElementById('form-view2');
    formView2.onsubmit = async (e) => {
        e.preventDefault();

        if (!AppState.fotoBlob) {
            alert('Debes capturar tu fotografía.');
            return;
        }

        if (!AppState.docPdfBlob && (!AppState.docFrontBase64 || !AppState.docBackBase64)) {
            alert('Asegúrate de haber capturado ambas caras del documento o de haber subido un archivo PDF.');
            return;
        }

        UI.showLoading('Generando documento y guardando registro...');

        try {
            let finalPdfBlob = AppState.docPdfBlob;

            // Generate PDF Client-Side if images were captured
            if (!finalPdfBlob) {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                
                const imgFront = await Utils.loadImage(AppState.docFrontBase64);
                const imgBack = await Utils.loadImage(AppState.docBackBase64);

                pdf.setFontSize(16);
                pdf.text('SCA-CIDE: Registro de Documento', 105, 20, { align: 'center' });
                
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text(`Aprendiz: ${document.getElementById('nombre_completo').value}`, 20, 30);
                pdf.text(`Documento: ${AppState.currentDocumento}`, 20, 35);
                
                const addImgToPdf = (img, y, title) => {
                    pdf.setTextColor(0);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(title, 20, y);
                    const ratio = img.naturalWidth / img.naturalHeight;
                    const w = 170;
                    const h = w / ratio;
                    pdf.addImage(img.src, 'JPEG', 20, y + 5, w, h, undefined, 'FAST');
                    return h + 15;
                };

                let currentY = 45;
                currentY += addImgToPdf(imgFront, currentY, 'Cara Frontal');
                addImgToPdf(imgBack, currentY, 'Cara Reverso');

                finalPdfBlob = pdf.output('blob');
            }

            // Build FormData
            const fd = new FormData();
            fd.append('documento', AppState.currentDocumento);
            fd.append('fecha_expedicion', document.getElementById('fecha_expedicion').value);
            fd.append('lugar_expedicion', Location.getValue());
            fd.append('foto', AppState.fotoBlob, `${AppState.currentDocumento}.jpg`);
            fd.append('documento_pdf', finalPdfBlob, `${AppState.currentDocumento}.pdf`);

            const res = await API.submitRegistration(fd);
            UI.hideLoading();

            if (res.success) {
                alert('¡Excelente! Tus datos han sido registrados correctamente.');
                location.reload(); // Reset everything
            } else {
                alert(res.message);
            }
        } catch (err) {
            UI.hideLoading();
            console.error(err);
            alert('Ocurrió un error al procesar los archivos. Por favor intenta de nuevo.');
        }
    };

    // ─────────────────────────────────────────────
    // Admin Flow
    // ─────────────────────────────────────────────
    document.getElementById('btn-admin-cancel').onclick = () => UI.showView('view1');

    const formAdminLogin = document.getElementById('form-admin-login');
    formAdminLogin.onsubmit = async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin_password').value;
        UI.showLoading('Autenticando...');
        const res = await API.adminLogin(pwd);
        UI.hideLoading();

        if (res.success) {
            Admin.init();
        } else {
            document.getElementById('admin-error-msg').textContent = res.message;
        }
    };

    document.getElementById('btn-logout').onclick = async () => {
        await API.logout();
        location.reload();
    };

    // ─────────────────────────────────────────────
    // Manual File Inputs (Gallery / Files)
    // ─────────────────────────────────────────────
    document.getElementById('foto_input').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const dataUrl = await Utils.fileToDataURL(file);
            const cropperImg = document.getElementById('cropper-image');
            document.getElementById('cropper-modal').classList.remove('hidden');
            cropperImg.onload = () => {
                Camera.initCropper(cropperImg, 'foto', (blob, previewUrl) => {
                    AppState.fotoBlob = blob;
                    const box = document.getElementById('foto-preview-box');
                    box.classList.add('has-image');
                    box.innerHTML = `<img src="${previewUrl}">`;
                    UI.updateBadge('foto', 'success');
                    document.getElementById('btn-delete-foto-wizard').style.display = 'inline-flex';
                });
            };
            cropperImg.src = dataUrl;
            e.target.value = ''; // Reset input
        }
    };


    document.getElementById('doc_pdf_input').onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            AppState.docPdfBlob = file;
            document.getElementById('docs-camera-section').style.display = 'none';
            document.getElementById('doc-pdf-success-section').style.display = 'block';
            document.getElementById('doc-pdf-filename').textContent = file.name;
            document.getElementById('doc-pdf-upload-hint').style.display = 'none';
        } else {
            alert('Por favor selecciona un archivo PDF válido.');
        }
        e.target.value = ''; // Reset
    };

    document.getElementById('btn-remove-pdf').onclick = () => {
        AppState.docPdfBlob = null;
        document.getElementById('docs-camera-section').style.display = 'grid';
        document.getElementById('doc-pdf-success-section').style.display = 'none';
        document.getElementById('doc-pdf-upload-hint').style.display = 'block';
    };
});
