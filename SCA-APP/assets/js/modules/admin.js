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

    /**
     * Force-download a file using fetch + blob URL.
     * Works for same-origin files where the browser would normally open them inline.
     */
    async downloadFile(url, filename) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('No se pudo obtener el archivo');
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
            alert('No se pudo descargar el archivo. Es posible que aún no haya sido cargado.');
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

        // Update Metrics
        document.getElementById('metric-total').textContent = total;
        document.getElementById('metric-validado').textContent = validado;
        document.getElementById('metric-no-validado').textContent = pendiente;
        document.getElementById('metric-incompletos').textContent = incompletos;

        // Pagination
        const totalPages = Math.ceil(filtered.length / this.state.itemsPerPage);
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageUsers = filtered.slice(start, start + this.state.itemsPerPage);

        tbody.innerHTML = pageUsers.length
            ? ''
            : '<tr><td colspan="4" style="text-align:center; padding:32px; color:var(--text-muted);">No se encontraron registros.</td></tr>';

        pageUsers.forEach(u => {
            const tr = document.createElement('tr');
            const isChecked = u.estado_validacion === 'validado' ? 'checked' : '';
            // Strip the SCA-APP/ prefix so paths are relative to the web root
            const fotoUrl = (u.ruta_foto_aprendiz || '').replace(/^SCA-APP\//, '');
            const pdfUrl  = (u.ruta_documento_identificacion_aprendiz || '').replace(/^SCA-APP\//, '');
            const doc     = u.numero_documento_aprendiz;

            tr.innerHTML = `
                <td>
                    <strong>${u.nombre_completo_aprendiz}</strong><br>
                    <small style="color:var(--text-muted)">CC ${doc}</small>
                </td>
                <td>
                    <div style="font-size:0.85rem; line-height:1.7;">
                        <span style="color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">Correo</span><br>
                        ${u.correo_electronico_aprendiz || '—'}<br>
                        <span style="color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">Teléfono</span><br>
                        ${u.telefono_aprendiz || '—'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${fotoUrl
                            ? `<button class="btn-sm btn-secondary dl-btn" data-url="${fotoUrl}" data-filename="foto_${doc}.jpg" title="Descargar Foto" style="gap:4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Foto
                               </button>`
                            : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin foto</span>'}
                        ${pdfUrl
                            ? `<button class="btn-sm btn-secondary dl-btn" data-url="${pdfUrl}" data-filename="documento_${doc}.pdf" title="Descargar PDF" style="gap:4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                PDF
                               </button>`
                            : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin doc.</span>'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="status-toggle" data-doc="${doc}" ${isChecked}>
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
        this.bindDownloadButtons();
    },

    /**
     * Bind click handlers on all download buttons in the table.
     */
    bindDownloadButtons() {
        document.querySelectorAll('.dl-btn').forEach(btn => {
            btn.onclick = () => {
                const url = btn.dataset.url;
                const filename = btn.dataset.filename;
                this.downloadFile(url, filename);
            };
        });
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

        document.getElementById('btn-prev-page').onclick = () => {
            if (this.state.currentPage > 1) { this.state.currentPage--; this.render(); }
        };
        document.getElementById('btn-next-page').onclick = () => {
            this.state.currentPage++; this.render();
        };
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