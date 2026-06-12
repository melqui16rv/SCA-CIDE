/**
 * API Module - Handles all backend communication
 */

const API = {
    /**
     * Checks if a document exists in the database
     * @param {string} documento 
     */
    async checkDocument(documento) {
        try {
            const res = await fetch(`api/check_document.php?documento=${encodeURIComponent(documento)}`);
            return await res.json();
        } catch (err) {
            console.error('API Error (checkDocument):', err);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    /**
     * Submits the registration form data
     * @param {FormData} formData 
     */
    async submitRegistration(formData) {
        try {
            const res = await fetch('api/submit_data.php', {
                method: 'POST',
                body: formData
            });
            return await res.json();
        } catch (err) {
            console.error('API Error (submitRegistration):', err);
            return { success: false, message: 'Error al enviar los datos. Revisa tu conexión.' };
        }
    },

    /**
     * Admin Login
     * @param {string} password 
     */
    async adminLogin(password) {
        try {
            const res = await fetch('api/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Error de conexión.' };
        }
    },

    /**
     * Get all registered users (Admin)
     */
    async listUsers() {
        try {
            const res = await fetch('api/admin.php?action=list');
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Error al cargar los datos.' };
        }
    },

    /**
     * Toggles the validation status of a user
     */
    async toggleValidation(documento, estado) {
        try {
            const res = await fetch(`api/admin.php?action=toggle_validation&documento=${documento}&estado=${estado}`);
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Error de conexión.' };
        }
    },

    /**
     * Admin Logout
     */
    async logout() {
        return await fetch('api/admin.php?action=logout');
    }
};

export default API;