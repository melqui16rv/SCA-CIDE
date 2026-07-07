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
            this.initAutocomplete();
            this.render();
            this.bindEvents();
            UI.showView('admin-dashboard');
        } else {
            alert(result.message);
            UI.showView('view1');
        }
    },

    initAutocomplete() {
        const input = document.getElementById('admin-ficha-filter');
        const list = document.getElementById('ficha-autocomplete-list');
        if (!input || !list) return;

        const uniqueFichas = [...new Set(this.state.users
            .map(u => u.ficha_aprendiz)
            .filter(f => f != null && f.trim() !== ''))]
            .sort((a, b) => a.localeCompare(b));

        input.addEventListener('input', () => {
            const val = input.value.trim().toLowerCase();
            list.innerHTML = '';
            if (!val) {
                list.classList.add('hidden');
                this.state.currentPage = 1; 
                this.render();
                return;
            }

            const matches = uniqueFichas.filter(f => f.toLowerCase().includes(val));
            if (matches.length > 0) {
                matches.forEach(m => {
                    const div = document.createElement('div');
                    div.textContent = m;
                    div.addEventListener('click', () => {
                        input.value = m;
                        list.classList.add('hidden');
                        this.state.currentPage = 1;
                        this.render();
                    });
                    list.appendChild(div);
                });
                list.classList.remove('hidden');
            } else {
                list.classList.add('hidden');
            }
            
            this.state.currentPage = 1;
            this.render();
        });

        // Hide autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== list) {
                list.classList.add('hidden');
            }
        });
    },

    /**
     * Force-download a file using fetch + blob URL.
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

    /**
     * Open the preview modal for a photo or PDF file.
     * @param {string} url       - Relative URL of the file
     * @param {string} filename  - Filename for download
     * @param {'image'|'pdf'}  type - File type for rendering
     */
    showPreview(url, filename, type) {
        const modal     = document.getElementById('preview-modal');
        const body      = document.getElementById('preview-modal-body');
        const title     = document.getElementById('preview-modal-title');
        const dlBtn     = document.getElementById('btn-preview-download');
        const closeBtn  = document.getElementById('btn-preview-cancel');
        const closeBtn2 = document.getElementById('btn-preview-close');

        title.textContent = type === 'image' ? 'Foto del aprendiz' : 'Documento de identidad (PDF)';

        if (type === 'image') {
            body.innerHTML = `
                <div class="preview-img-wrap">
                    <img src="${url}?t=${Date.now()}" alt="Foto del aprendiz" class="preview-img">
                </div>`;
        } else {
            body.innerHTML = `
                <div class="preview-pdf-wrap">
                    <iframe src="${url}" class="preview-pdf" title="Documento PDF"></iframe>
                </div>`;
        }

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Download handler
        const newDlBtn = dlBtn.cloneNode(true);
        dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
        newDlBtn.onclick = () => this.downloadFile(url, filename);

        // Close handlers
        const close = () => {
            modal.classList.add('hidden');
            body.innerHTML = ''; // Free iframe/img resources
        };
        closeBtn.onclick  = close;
        closeBtn2.onclick = close;
    },

    render() {
        const tbody = document.getElementById('users-tbody');
        const searchTerm = document.getElementById('admin-search').value.toLowerCase();
        const filterStatus = document.getElementById('admin-filter').value;
        const filterRole = document.getElementById('admin-role-filter') ? document.getElementById('admin-role-filter').value : 'todos';
        const filterFicha = document.getElementById('admin-ficha-filter') ? document.getElementById('admin-ficha-filter').value.trim() : '';
        this.state.itemsPerPage = parseInt(document.getElementById('admin-page-size').value) || 10;

        let total = 0, validado = 0, pendiente = 0, incompletos = 0, carnetEntregado = 0;

        // Calculate Metrics & Filter
        const filtered = this.state.users.filter(u => {
            total++;
            const hasFoto = !!u.ruta_foto_aprendiz;
            const hasDoc  = !!u.ruta_documento_identificacion_aprendiz;
            const isValid = u.estado_validacion === 'validado';
            const isCarnetEntregado = u.estado_carnet === 'realizado';

            if (isValid) validado++; else pendiente++;
            if (!hasFoto || !hasDoc) incompletos++;
            if (isCarnetEntregado) carnetEntregado++;

            if (filterStatus === 'validado' && !isValid) return false;
            if (filterStatus === 'no_validado' && isValid) return false;
            if (filterStatus === 'completos' && (!hasFoto || !hasDoc)) return false;
            if (filterStatus === 'incompletos' && (hasFoto && hasDoc)) return false;
            if (filterStatus === 'carnet_realizado' && !isCarnetEntregado) return false;
            if (filterStatus === 'carnet_pendiente' && isCarnetEntregado) return false;

            if (filterRole !== 'todos' && u.rol !== filterRole) return false;
            
            if (filterFicha !== '') {
                const fStr = (u.ficha_aprendiz || '').toLowerCase();
                if (!fStr.includes(filterFicha.toLowerCase())) return false;
            }

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
        const metricCarnet = document.getElementById('metric-carnet-entregado');
        if (metricCarnet) metricCarnet.textContent = carnetEntregado;

        // Pagination
        const totalPages = Math.ceil(filtered.length / this.state.itemsPerPage);
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageUsers = filtered.slice(start, start + this.state.itemsPerPage);

        tbody.innerHTML = pageUsers.length
            ? ''
            : '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No se encontraron registros.</td></tr>';

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
                    <small style="color:var(--text-muted)">CC ${doc}</small><br>
                    ${u.rh_aprendiz ? `<span class="badge" style="background:#fee2e2; color:#ef4444; margin-top:4px;">RH: ${u.rh_aprendiz}</span>` : ''}
                </td>
                <td>
                    <div style="font-size:0.85rem; line-height:1.7;">
                        <span class="badge" style="background:#e2e8f0; color:#475569;">${u.rol || 'N/A'}</span><br>
                        ${u.rol === 'APRENDIZ' ? 
                            `<span style="color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">Ficha:</span> ${u.ficha_aprendiz || '—'}<br>
                             <span style="color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">Programa:</span> <span style="font-size:0.75rem;">${u.nombre_programa_aprendiz || '—'}</span>` 
                            : ''
                        }
                    </div>
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
                            ? `<button class="btn-sm btn-secondary dl-btn" data-url="${fotoUrl}" data-filename="foto_${doc}.jpg" data-type="image" title="Ver y descargar Foto" style="gap:4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                Foto
                               </button>`
                            : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin foto</span>'}
                        ${pdfUrl
                            ? `<button class="btn-sm btn-secondary dl-btn" data-url="${pdfUrl}" data-filename="documento_${doc}.pdf" data-type="pdf" title="Ver y descargar PDF" style="gap:4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
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
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" class="carnet-toggle" data-doc="${doc}" ${u.estado_carnet === 'realizado' ? 'checked' : ''}>
                            <span class="slider" style="${u.estado_carnet === 'realizado' ? '--toggle-active: #8b5cf6;' : ''}"></span>
                        </label>
                        <span class="badge" style="${u.estado_carnet === 'realizado' ? 'background:#ede9fe; color:#8b5cf6;' : ''}">${u.estado_carnet === 'realizado' ? 'Realizado' : 'Pendiente'}</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.updatePagination(totalPages, filtered.length);
        this.bindToggleEvents();
        this.bindCarnetToggleEvents();
        this.bindDownloadButtons();
    },

    /**
     * Bind click handlers on all download buttons in the table.
     * Now opens preview modal first; download is inside the modal.
     */
    bindDownloadButtons() {
        document.querySelectorAll('.dl-btn').forEach(btn => {
            btn.onclick = () => {
                const url      = btn.dataset.url;
                const filename = btn.dataset.filename;
                const type     = btn.dataset.type; // 'image' or 'pdf'
                this.showPreview(url, filename, type);
            };
        });
    },

    updatePagination(totalPages, totalItems) {
        const info = document.getElementById('pagination-info');
        const prev = document.getElementById('btn-prev-page');
        const next = document.getElementById('btn-next-page');

        if (info) info.textContent = `Página ${this.state.currentPage} de ${totalPages || 1} (${totalItems} registros)`;
        if (prev) prev.disabled = this.state.currentPage <= 1;
        if (next) next.disabled = this.state.currentPage >= totalPages;
    },

    bindEvents() {
        document.getElementById('admin-search').oninput = () => { this.state.currentPage = 1; this.render(); };
        document.getElementById('admin-filter').onchange = () => { this.state.currentPage = 1; this.render(); };
        const roleFilter = document.getElementById('admin-role-filter');
        if (roleFilter) roleFilter.onchange = () => { this.state.currentPage = 1; this.render(); };
        const fichaFilter = document.getElementById('admin-ficha-filter');
        if (fichaFilter) fichaFilter.oninput = () => { this.state.currentPage = 1; this.render(); };
        document.getElementById('admin-page-size').onchange = () => { this.state.currentPage = 1; this.render(); };

        document.getElementById('btn-prev-page').onclick = () => {
            if (this.state.currentPage > 1) { this.state.currentPage--; this.render(); }
        };
        document.getElementById('btn-next-page').onclick = () => {
            this.state.currentPage++; this.render();
        };

        const btnCopyUrl = document.getElementById('btn-copy-form-url');
        if (btnCopyUrl) {
            btnCopyUrl.onclick = async () => {
                const url = 'https://carnetizacion.vermqen.com/formulario_registro_datos_iniciales/';
                try {
                    await navigator.clipboard.writeText(url);
                    const originalHtml = btnCopyUrl.innerHTML;
                    btnCopyUrl.innerHTML = '<i data-lucide="check"></i> Copiado';
                    if (window.lucide) window.lucide.createIcons();
                    setTimeout(() => {
                        btnCopyUrl.innerHTML = originalHtml;
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                } catch (err) {
                    alert('No se pudo copiar automáticamente. URL: ' + url);
                }
            };
        }

        const btnDiagram = document.getElementById('btn-view-diagram');
        if (btnDiagram) {
            btnDiagram.onclick = () => {
                const iframe = document.getElementById('diagram-iframe');
                if (iframe && !iframe.src.includes('carnetizacion.drawio.html')) {
                    iframe.src = 'assets/docs/carnetizacion.drawio.html';
                }
                UI.showView('admin-diagram-view');
            };
        }

        const btnDiagramBack = document.getElementById('btn-diagram-back');
        if (btnDiagramBack) {
            btnDiagramBack.onclick = () => UI.showView('admin-dashboard');
        }
    },

    bindToggleEvents() {
        document.querySelectorAll('.status-toggle').forEach(t => {
            t.onchange = async (e) => {
                const doc = e.target.dataset.doc;
                const newState = e.target.checked ? 'validado' : 'no_validado';
                e.target.disabled = true;

                const res = await API.toggleValidation(doc, newState);
                if (res.success) {
                    const idx = this.state.users.findIndex(u => u.numero_documento_aprendiz == doc);
                    if (idx > -1) this.state.users[idx].estado_validacion = newState;
                    this.render();
                } else {
                    alert('No se pudo actualizar el estado.');
                    e.target.checked = !e.target.checked;
                }
                e.target.disabled = false;
            };
        });
    },

    bindCarnetToggleEvents() {
        document.querySelectorAll('.carnet-toggle').forEach(t => {
            t.onchange = async (e) => {
                const doc = e.target.dataset.doc;
                const newState = e.target.checked ? 'realizado' : 'pendiente';
                e.target.disabled = true;

                const res = await API.toggleCarnet(doc, newState);
                if (res.success) {
                    const idx = this.state.users.findIndex(u => u.numero_documento_aprendiz == doc);
                    if (idx > -1) this.state.users[idx].estado_carnet = newState;
                    this.render();
                } else {
                    alert('No se pudo actualizar el estado del carnet.');
                    e.target.checked = !e.target.checked;
                }
                e.target.disabled = false;
            };
        });
    }
};

export default Admin;