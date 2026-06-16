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
            hint: '⚠️ Usa un FONDO BLANCO o claro y encuadra tu rostro de frente.',
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
        const docGuide   = document.getElementById('doc-camera-guide');
        const docLabel   = document.getElementById('doc-guide-label');
        const aspectBox  = document.querySelector('.camera-aspect-ratio');

        title.textContent = cfg.title;
        hint.textContent  = cfg.hint;

        if (cfg.isDoc) {
            docGuide.classList.remove('hidden');
            if (docLabel) docLabel.textContent = cfg.guideLabel;
            aspectBox.classList.add('doc-mode');
        } else {
            docGuide.classList.add('hidden');
            aspectBox.classList.remove('doc-mode');
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
        document.getElementById('doc-camera-guide').classList.add('hidden');
        document.querySelector('.camera-aspect-ratio').classList.remove('doc-mode');

        return canvas.toDataURL('image/jpeg', 0.9);
    },

    /**
     * Adaptive JPEG quality via binary bisection.
     * Iterates until blob size is within [minKB, maxKB] or max attempts reached.
     *
     * @param {HTMLCanvasElement} canvas
     * @param {number} minKB  - Lower bound target (KB)
     * @param {number} maxKB  - Upper bound target (KB)
     * @param {string} [mime] - MIME type, defaults to 'image/jpeg'
     * @returns {Promise<{blob: Blob, dataUrl: string, quality: number, sizeKB: number}>}
     */
    compressToTarget(canvas, minKB, maxKB, mime = 'image/jpeg') {
        return new Promise((resolve) => {
            let lo = 0.50, hi = 0.97;
            let attempts = 0;
            const MAX_ATTEMPTS = 14;

            const tryQuality = (q) => {
                canvas.toBlob((blob) => {
                    attempts++;
                    const sizeKB = blob.size / 1024;

                    const inRange  = sizeKB >= minKB && sizeKB <= maxKB;
                    const tooManyAttempts = attempts >= MAX_ATTEMPTS;

                    if (inRange || tooManyAttempts) {
                        const dataUrl = canvas.toDataURL(mime, q);
                        resolve({ blob, dataUrl, quality: q, sizeKB });
                        return;
                    }

                    if (sizeKB > maxKB) {
                        // Too heavy → lower quality
                        hi = q;
                    } else {
                        // Too light → raise quality
                        lo = q;
                    }
                    tryQuality((lo + hi) / 2);
                }, mime, q);
            };

            // Start from a mid-high quality guess
            tryQuality(0.88);
        });
    },

    initCropper(imageElement, step, onConfirm) {
        if (this.state.cropper) this.state.cropper.destroy();

        const isDoc = step === 'doc-front' || step === 'doc-back';
        const ratio  = isDoc ? 1.586 : (3 / 4);  // cédula ratio vs carnet ratio

        // Update the cropper modal help text dynamically
        const cropperHint = document.getElementById('cropper-hint');
        if (cropperHint) {
            cropperHint.textContent = isDoc
                ? 'Mueve o redimensiona el recuadro azul para encuadrar bien el documento. El recuadro mantiene la proporción correcta.'
                : 'Ajusta el recuadro para que tu rostro y hombros queden bien centrados.';
        }

        this.state.cropper = new Cropper(imageElement, {
            aspectRatio: ratio,
            viewMode: 1,              // crop box stays within canvas
            guides: true,
            center: true,
            highlight: true,
            autoCropArea: isDoc ? 0.95 : 0.85,
            movable: true,
            zoomable: !isDoc,
            cropBoxMovable: true,
            cropBoxResizable: true
        });

        const oldBtn = document.getElementById('btn-crop-confirm');
        const confirmBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(confirmBtn, oldBtn);

        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Procesando…';

            // ── Output resolution ──────────────────────────────────────────
            // Foto carnet : 800 × 1066 px  (3:4 ratio)
            // Documento   : 1400 × 882 px (1.586:1)
            const cropW = isDoc ? 1400 : 800;
            const cropH = isDoc ?  882 : 1066;

            const canvas = this.state.cropper.getCroppedCanvas({
                width:  cropW,
                height: cropH,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            // ── Brightness guard ───────────────────────────────────────────
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let colorSum = 0;
            for (let i = 0; i < imgData.data.length; i += 4) {
                colorSum += (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
            }
            const brightness = colorSum / (canvas.width * canvas.height);

            if (brightness < 60) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirmar';
                if (!confirm('⚠️ La imagen parece estar muy oscura. Te recomendamos repetirla en un lugar más iluminado. ¿Deseas continuar con esta imagen?')) {
                    return;
                }
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Procesando…';
            }

            // ── Adaptive compression ───────────────────────────────────────
            const minKB = isDoc ? 400 : 250;
            const maxKB = isDoc ? 900 : 500;

            const { blob, dataUrl, quality, sizeKB } = await this.compressToTarget(canvas, minKB, maxKB);

            console.info(
                `[Camera] ${isDoc ? 'Documento' : 'Foto'} → ` +
                `${cropW}×${cropH}px | quality ${quality.toFixed(3)} | ${sizeKB.toFixed(1)} KB`
            );

            onConfirm(blob, dataUrl);
            this.state.cropper.destroy();
            document.getElementById('cropper-modal').classList.add('hidden');

            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar';
        };
    }
};

export default Camera;