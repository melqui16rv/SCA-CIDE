/**
 * Admin Module - Handles dashboard data and validation
 */
import API from './api.js';
import UI from './ui.js';

const Admin = {
    state: {
        users: [],
        currentPage: 1,
        itemsPerPage: 10
    },

    async init() {
        UI.showLoading('Cargando datos administrativos...');
        const result = await API.listUsers();
        UI.hideLoading();

        if (result.success) {
            this.state.users = result.data;
            this.render();
            this.bindEvents();
            UI.showView('admin-dashboard');
        } else {
            alert(result.message);
            UI.showView('view1');
        }
    },

    render() {
        const tbody = document.getElementById('users-tbody');
        const searchTerm = document.getElementById('admin-search').value.toLowerCase();
        const filterStatus = document.getElementById('admin-filter').value;
        this.state.itemsPerPage = parseInt(document.getElementById('admin-page-size').value) || 10;

        let total = 0, validado = 0, pendiente = 0, incompletos = 0;

        // Calculate Metrics & Filter
        const filtered = this.state.users.filter(u => {
            total++;
            const hasFoto = !!u.ruta_foto_aprendiz;
            const hasDoc  = !!u.ruta_documento_identificacion_aprendiz;
            const isValid = u.estado_validacion === 'validado';

            if (isValid) validado++; else pendiente++;
            if (!hasFoto || !hasDoc) incompletos++;

            // Apply Filters
            if (filterStatus === 'validado' && !isValid) return false;
            if (filterStatus === 'no_validado' && isValid) return false;
            if (filterStatus === 'completos' && (!hasFoto || !hasDoc)) return false;
            if (filterStatus === 'incompletos' && (hasFoto && hasDoc)) return false;

            if (searchTerm) {
                const doc = (u.numero_documento_aprendiz || '').toLowerCase();
                const name = (u.nombre_completo_aprendiz || '').toLowerCase();
                if (!doc.includes(searchTerm) && !name.includes(searchTerm)) return false;
            }
            return true;
        });

        // Update UI Metrics
        document.getElementById('metric-total').textContent = total;
        document.getElementById('metric-validado').textContent = validado;
        document.getElementById('metric-no-validado').textContent = pendiente;
        document.getElementById('metric-incompletos').textContent = incompletos;

        // Pagination
        const totalPages = Math.ceil(filtered.length / this.state.itemsPerPage);
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageUsers = filtered.slice(start, start + this.state.itemsPerPage);

        tbody.innerHTML = pageUsers.length ? '' : '<tr><td colspan="4" style="text-align:center; padding:32px;">No se encontraron registros.</td></tr>';

        pageUsers.forEach(u => {
            const tr = document.createElement('tr');
            const isChecked = u.estado_validacion === 'validado' ? 'checked' : '';
            const fotoUrl = (u.ruta_foto_aprendiz || '').replace(/^SCA-APP\//, '');
            const pdfUrl  = (u.ruta_documento_identificacion_aprendiz || '').replace(/^SCA-APP\//, '');

            tr.innerHTML = `
                <td>
                    <strong>${u.nombre_completo_aprendiz}</strong><br>
                    <small style="color:var(--text-muted)">CC ${u.numero_documento_aprendiz}</small>
                </td>
                <td>
                    <div style="font-size:0.85rem">
                        📧 ${u.correo_electronico_aprendiz || 'N/A'}<br>
                        📞 ${u.telefono_aprendiz || 'N/A'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:8px;">
                        ${fotoUrl ? `<a href="${fotoUrl}" target="_blank" title="Ver Foto">📸</a>` : '❌'}
                        ${pdfUrl ? `<a href="${pdfUrl}" target="_blank" title="Ver PDF">📄</a>` : '❌'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="status-toggle" data-doc="${u.numero_documento_aprendiz}" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                        <span class="badge ${isChecked ? 'success' : 'pending'}">${isChecked ? 'Válido' : 'Pendiente'}</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.updatePagination(totalPages);
        this.bindToggleEvents();
    },

    updatePagination(totalPages) {
        const info = document.getElementById('pagination-info');
        const prev = document.getElementById('btn-prev-page');
        const next = document.getElementById('btn-next-page');

        if (info) info.textContent = `Página ${this.state.currentPage} de ${totalPages || 1}`;
        if (prev) prev.disabled = this.state.currentPage <= 1;
        if (next) next.disabled = this.state.currentPage >= totalPages;
    },

    bindEvents() {
        document.getElementById('admin-search').oninput = () => { this.state.currentPage = 1; this.render(); };
        document.getElementById('admin-filter').onchange = () => { this.state.currentPage = 1; this.render(); };
        document.getElementById('admin-page-size').onchange = () => { this.state.currentPage = 1; this.render(); };
        
        document.getElementById('btn-prev-page').onclick = () => { if(this.state.currentPage > 1) { this.state.currentPage--; this.render(); }};
        document.getElementById('btn-next-page').onclick = () => { this.state.currentPage++; this.render(); };
    },

    bindToggleEvents() {
        document.querySelectorAll('.status-toggle').forEach(t => {
            t.onchange = async (e) => {
                const doc = e.target.dataset.doc;
                const newState = e.target.checked ? 'validado' : 'no_validado';
                e.target.disabled = true;
                
                const res = await API.toggleValidation(doc, newState);
                if (res.success) {
                    const idx = this.state.users.findIndex(u => u.numero_documento_aprendiz === doc);
                    if (idx > -1) this.state.users[idx].estado_validacion = newState;
                    this.render();
                } else {
                    alert('No se pudo actualizar el estado.');
                    e.target.checked = !e.target.checked;
                }
                e.target.disabled = false;
            };
        });
    }
};

export default Admin;