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
            facing: 'user'
        },
        'doc-front': {
            title: 'Cara frontal del documento',
            hint: 'Ubica la parte frontal de tu documento dentro del recuadro verde.',
            stencil: "M20,130 L280,130 L280,270 L20,270 Z",
            facing: 'environment'
        },
        'doc-back': {
            title: 'Reverso del documento',
            hint: 'Ubica el reverso (donde está el código) dentro del recuadro verde.',
            stencil: "M20,130 L280,130 L280,270 L20,270 Z",
            facing: 'environment'
        }
    },

    async start(step) {
        this.state.currentStep = step;
        const cfg = this.configs[step];
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-video');
        const title = document.getElementById('camera-title');
        const hint = document.getElementById('camera-instructions');
        const stencilPath = document.getElementById('stencil-path');
        const stencilBorder = document.getElementById('stencil-border');

        title.textContent = cfg.title;
        hint.textContent = cfg.hint;
        stencilPath.setAttribute('d', cfg.stencil);
        stencilBorder.setAttribute('d', cfg.stencil);
        
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
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        this.stop();
        document.getElementById('camera-modal').classList.add('hidden');
        
        return canvas.toDataURL('image/jpeg', 0.9);
    },

    initCropper(imageElement, onConfirm) {
        if (this.state.cropper) this.state.cropper.destroy();
        
        this.state.cropper = new Cropper(imageElement, {
            aspectRatio: 3 / 4,
            viewMode: 1,
            guides: true,
            center: true,
            highlight: true,
            autoCropArea: 0.8
        });

        const confirmBtn = document.getElementById('btn-crop-confirm');
        confirmBtn.onclick = () => {
            const canvas = this.state.cropper.getCroppedCanvas({
                width: 450,
                height: 600,
                imageSmoothingQuality: 'high'
            });
            canvas.toBlob((blob) => {
                onConfirm(blob, canvas.toDataURL('image/jpeg', 0.85));
                this.state.cropper.destroy();
                document.getElementById('cropper-modal').classList.add('hidden');
            }, 'image/jpeg', 0.85);
        };
    }
};

export default Camera;