/**
 * UI Module - Handles view transitions, stepper logic, and loaders
 */

const UI = {
    elements: {
        views: document.querySelectorAll('.view'),
        steps: document.querySelectorAll('.step-content'),
        stepperSteps: document.querySelectorAll('.step'),
        stepperLines: document.querySelectorAll('.step-line'),
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        stepTitle: document.getElementById('step-title')
    },

    stepTitles: {
        1: 'Paso 1: Confirma tus datos básicos',
        2: 'Paso 2: Información de tu documento',
        3: 'Paso 3: Tu Fotografía estilo carnet',
        4: 'Paso 4: Fotos de tu documento'
    },

    /**
     * Shows a specific view and hides others
     */
    showView(viewId) {
        const targetView = document.getElementById(viewId);
        if (!targetView) return;

        this.elements.views.forEach(v => {
            v.classList.remove('active');
            setTimeout(() => { if(!v.classList.contains('active')) v.classList.add('hidden'); }, 300);
        });

        targetView.classList.remove('hidden');
        setTimeout(() => targetView.classList.add('active'), 50);
    },

    /**
     * Handles Stepper Navigation
     */
    goToStep(stepNumber) {
        this.elements.steps.forEach((s, idx) => {
            s.classList.toggle('active', (idx + 1) === stepNumber);
        });

        // Update Stepper Indicator
        this.elements.stepperSteps.forEach((s, idx) => {
            const num = idx + 1;
            s.classList.toggle('active', num === stepNumber);
            s.classList.toggle('completed', num < stepNumber);
        });

        this.elements.stepperLines.forEach((l, idx) => {
            l.classList.toggle('active', (idx + 1) < stepNumber);
        });

        if (this.elements.stepTitle) {
            this.elements.stepTitle.textContent = this.stepTitles[stepNumber] || '';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showLoading(text) {
        if (this.elements.loadingText) this.elements.loadingText.textContent = text || 'Procesando...';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.classList.remove('hidden');
    },

    hideLoading() {
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.classList.add('hidden');
    },

    updateBadge(type, status) {
        const badge = document.getElementById(`badge-${type}`);
        if (!badge) return;

        if (status === 'success') {
            badge.className = 'badge success';
            badge.textContent = '✓ Capturado';
        } else {
            badge.className = 'badge pending';
            badge.textContent = 'Pendiente';
        }
    }
};

export default UI;