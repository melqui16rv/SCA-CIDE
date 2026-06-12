/**
 * Utils Module - Custom DatePicker and helpers
 */

const Utils = {
    initDatePicker() {
        const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const DAYS   = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

        let step = 'year';
        let selYear  = null;
        let selMonth = null;
        let selDay   = null;
        let yearPage = 0; // 0 = most recent years page

        const dpInput   = document.getElementById('dpInput');
        const dpPanel   = document.getElementById('dpPanel');
        const dpGrid    = document.getElementById('dpGrid');
        const dpStepLbl = document.getElementById('dpStepLabel');
        const dpDisplay = document.getElementById('dpDisplay');
        const fechaH    = document.getElementById('fecha_expedicion');
        const btnPrev   = document.getElementById('dpPrev');
        const btnNext   = document.getElementById('dpNext');

        const today   = new Date();
        const maxYear = today.getFullYear();

        /* ── Open / Close ───────────────────────────────── */
        const open  = () => { dpPanel.classList.add('open'); render(); };
        const close = () => { dpPanel.classList.remove('open'); };

        dpInput.addEventListener('click', (e) => {
            e.stopPropagation();
            dpPanel.classList.contains('open') ? close() : open();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('dpWrap').contains(e.target)) close();
        });

        /* ── Navigation arrows — context-aware ─────────── */
        btnPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            if (step === 'year') {
                // Older years
                yearPage++;
            } else if (step === 'month') {
                // Previous year
                selYear--;
                dpStepLbl.textContent = selYear;
            } else if (step === 'day') {
                // Previous month
                selMonth--;
                if (selMonth < 0) { selMonth = 11; selYear--; }
            }
            render();
        });

        btnNext.addEventListener('click', (e) => {
            e.stopPropagation();
            if (step === 'year') {
                // Newer years (can't go past current page 0)
                if (yearPage > 0) yearPage--;
            } else if (step === 'month') {
                // Next year (can't exceed current year)
                if (selYear < maxYear) selYear++;
                dpStepLbl.textContent = selYear;
            } else if (step === 'day') {
                // Next month (can't exceed today)
                const isCurrentYearMonth = selYear === maxYear && selMonth === today.getMonth();
                if (!isCurrentYearMonth) {
                    selMonth++;
                    if (selMonth > 11) { selMonth = 0; selYear++; }
                }
            }
            render();
        });

        /* ── Render ─────────────────────────────────────── */
        const make = (text, selected, disabled) => {
            const c = document.createElement('div');
            c.className = 'dp-cell' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '');
            c.textContent = text;
            return c;
        };

        const render = () => {
            dpGrid.innerHTML = '';

            if (step === 'year') {
                dpGrid.className = 'dp-grid years';
                dpStepLbl.textContent = 'Selecciona el año';
                const start = maxYear - yearPage * 16;
                for (let y = start; y >= Math.max(start - 15, 1940); y--) {
                    const c = make(y, y === selYear, false);
                    c.onclick = (e) => { e.stopPropagation(); selYear = y; step = 'month'; render(); };
                    dpGrid.appendChild(c);
                }

            } else if (step === 'month') {
                dpGrid.className = 'dp-grid months';
                dpStepLbl.textContent = selYear;
                MONTHS.forEach((m, i) => {
                    const future = selYear === maxYear && i > today.getMonth();
                    const c = make(m.slice(0, 3), i === selMonth, future);
                    c.onclick = (e) => {
                        if (future) return;
                        e.stopPropagation();
                        selMonth = i;
                        step = 'day';
                        render();
                    };
                    dpGrid.appendChild(c);
                });

            } else {
                // Day view
                dpGrid.className = 'dp-grid days';
                dpStepLbl.textContent = MONTHS[selMonth] + ' ' + selYear;

                DAYS.forEach(d => {
                    const l = document.createElement('div');
                    l.className = 'dp-cell day-label';
                    l.textContent = d;
                    dpGrid.appendChild(l);
                });

                const offset = (new Date(selYear, selMonth, 1).getDay() + 6) % 7;
                const total  = new Date(selYear, selMonth + 1, 0).getDate();

                for (let i = 0; i < offset; i++) {
                    dpGrid.appendChild(document.createElement('div'));
                }
                for (let d = 1; d <= total; d++) {
                    const future = selYear === maxYear &&
                                   selMonth === today.getMonth() &&
                                   d > today.getDate();
                    const c = make(d, d === selDay, future);
                    c.onclick = (e) => {
                        if (future) return;
                        e.stopPropagation();
                        selDay = d;
                        finish();
                    };
                    dpGrid.appendChild(c);
                }
            }
        };

        /* ── Finish ─────────────────────────────────────── */
        const finish = () => {
            const mm = String(selMonth + 1).padStart(2, '0');
            const dd = String(selDay).padStart(2, '0');
            fechaH.value    = `${selYear}-${mm}-${dd}`;
            dpDisplay.textContent = `${selYear} / ${mm} / ${dd}`;
            dpDisplay.style.color = 'var(--text-main)';
            dpInput.classList.add('filled');
            close();
            // Reset step so user can re-open and navigate cleanly
            step = 'year';
        };
    },

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    loadImage(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = dataUrl;
        });
    }
};

export default Utils;