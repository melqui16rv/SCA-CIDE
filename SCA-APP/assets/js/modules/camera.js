/**
 * Camera Module - Handles WebRTC, Stencils, and Cropping
 */

const Camera = {
    state: {
        stream: null,
        currentStep: 'foto', // 'foto', 'doc-front', 'doc-back'
        cropper: null
    },

    configs: {
        'foto': {
            title: 'Foto estilo carnet',
            hint: 'Centra tu rostro dentro del óvalo. Mantén una expresión neutral.',
            stencil: "M150,55 C215,55 255,120 255,200 C255,305 205,355 150,355 C95,355 45,305 45,200 C45,120 85,55 150,55 Z",
            facing: 'user',
            isDoc: false
        },
        'doc-front': {
            title: 'Cara frontal del documento',
            hint: 'Acerca bien la cámara • El documento debe llenar el recuadro verde',
            stencil: "",
            facing: 'environment',
            isDoc: true,
            guideLabel: 'Cara frontal (donde está tu foto)'
        },
        'doc-back': {
            title: 'Reverso del documento',
            hint: 'Acerca bien la cámara • El reverso debe llenar el recuadro verde',
            stencil: "",
            facing: 'environment',
            isDoc: true,
            guideLabel: 'Reverso (lado del código de barras)'
        }
    },

    async start(step) {
        this.state.currentStep = step;
        const cfg = this.configs[step];
        const modal      = document.getElementById('camera-modal');
        const video      = document.getElementById('camera-video');
        const title      = document.getElementById('camera-title');
        const hint       = document.getElementById('camera-instructions');
        const stencilSvg = document.getElementById('camera-stencil');
        const docGuide   = document.getElementById('doc-camera-guide');
        const docLabel   = document.getElementById('doc-guide-label');
        const aspectBox  = document.querySelector('.camera-aspect-ratio');

        title.textContent = cfg.title;
        hint.textContent  = cfg.hint;

        if (cfg.isDoc) {
            // Document mode: show guide overlay with animated corners, hide oval stencil
            stencilSvg.style.display = 'none';
            docGuide.classList.remove('hidden');
            if (docLabel) docLabel.textContent = cfg.guideLabel;
            aspectBox.classList.add('doc-mode');
        } else {
            // Photo mode: show oval stencil, hide doc guide
            stencilSvg.style.display = '';
            docGuide.classList.add('hidden');
            aspectBox.classList.remove('doc-mode');
            const stencilPath   = document.getElementById('stencil-path');
            const stencilBorder = document.getElementById('stencil-border');
            stencilPath.setAttribute('d', cfg.stencil);
            stencilBorder.setAttribute('d', cfg.stencil);
        }

        modal.classList.remove('hidden');

        try {
            this.stop();
            const constraints = {
                video: { facingMode: { ideal: cfg.facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            };
            this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = this.state.stream;
        } catch (err) {
            console.error('Camera error:', err);
            modal.classList.add('hidden');
            return false;
        }
        return true;
    },

    stop() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => track.stop());
            this.state.stream = null;
        }
    },

    capture() {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        this.stop();
        document.getElementById('camera-modal').classList.add('hidden');

        // Reset modal UI state for next time
        document.getElementById('camera-stencil').style.display = '';
        document.getElementById('doc-camera-guide').classList.add('hidden');
        document.querySelector('.camera-aspect-ratio').classList.remove('doc-mode');

        return canvas.toDataURL('image/jpeg', 0.9);
    },

    initCropper(imageElement, step, onConfirm) {
        if (this.state.cropper) this.state.cropper.destroy();

        const isDoc = step === 'doc-front' || step === 'doc-back';
        const ratio  = isDoc ? 1.586 : (3 / 4);  // cédula ratio vs carnet ratio

        // Update the cropper modal help text dynamically
        const cropperHint = document.querySelector('#cropper-modal .help-text');
        if (cropperHint) {
            cropperHint.textContent = isDoc
                ? 'Asegúrate de que los cuatro bordes del documento sean visibles. El recuadro ya tiene la proporción correcta.'
                : 'Ajusta el recuadro para que tu rostro quede centrado.';
        }

        this.state.cropper = new Cropper(imageElement, {
            aspectRatio: ratio,
            viewMode: 2,               // crop box cannot exceed canvas
            guides: true,
            center: true,
            highlight: true,
            autoCropArea: isDoc ? 0.97 : 0.85,
            // For documents: lock the crop box so the user cannot shrink it —
            // they MUST fill the frame by moving physically closer with the phone.
            movable: !isDoc,
            zoomable: !isDoc,
            cropBoxMovable: !isDoc,
            cropBoxResizable: !isDoc
        });

        const oldBtn = document.getElementById('btn-crop-confirm');
        const confirmBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(confirmBtn, oldBtn);

        confirmBtn.onclick = () => {
            // Higher output resolution for documents to keep text legible
            const cropW = isDoc ? 1000 : 450;
            const cropH = isDoc ?  630 : 600;

            const canvas = this.state.cropper.getCroppedCanvas({
                width: cropW,
                height: cropH,
                imageSmoothingQuality: 'high'
            });

            // Pixel-level brightness check
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let colorSum = 0;
            for (let i = 0; i < imgData.data.length; i += 4) {
                colorSum += (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
            }
            const brightness = colorSum / (canvas.width * canvas.height);
            if (brightness < 60) {
                if (!confirm('⚠️ La imagen parece estar muy oscura. Te recomendamos repetirla en un lugar más iluminado. ¿Deseas continuar con esta imagen?')) {
                    return;
                }
            }

            canvas.toBlob((blob) => {
                onConfirm(blob, canvas.toDataURL('image/jpeg', 0.85));
                this.state.cropper.destroy();
                document.getElementById('cropper-modal').classList.add('hidden');
            }, 'image/jpeg', 0.85);
        };
    }
};

export default Camera;