/**
 * Utils Module - Custom DatePicker and helpers
 */

const Utils = {
    initDatePicker() {
        const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const DAYS   = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
        let step = 'year', selYear = null, selMonth = null, selDay = null, yearPage = 0;

        const dpInput   = document.getElementById('dpInput');
        const dpPanel   = document.getElementById('dpPanel');
        const dpGrid    = document.getElementById('dpGrid');
        const dpStepLbl = document.getElementById('dpStepLabel');
        const dpDisplay = document.getElementById('dpDisplay');
        const fechaH    = document.getElementById('fecha_expedicion');
        const btnPrev   = document.getElementById('dpPrev');
        const btnNext   = document.getElementById('dpNext');

        const today = new Date();
        const maxYear = today.getFullYear();

        const open = () => { dpPanel.classList.add('open'); render(); };
        const close = () => { dpPanel.classList.remove('open'); };

        dpInput.addEventListener('click', () => dpPanel.classList.contains('open') ? close() : open());
        document.addEventListener('click', e => { if(!document.getElementById('dpWrap').contains(e.target)) close(); });
        
        btnPrev.onclick = (e) => { e.stopPropagation(); yearPage++; render(); };
        btnNext.onclick = (e) => { e.stopPropagation(); yearPage--; render(); };

        const make = (text, selected, disabled) => {
            const c = document.createElement('div');
            c.className = 'dp-cell' + (selected?' selected':'') + (disabled?' disabled':'');
            c.textContent = text; return c;
        };

        const render = () => {
            dpGrid.innerHTML = '';
            if(step === 'year'){
                dpGrid.className = 'dp-grid years';
                dpStepLbl.textContent = 'Selecciona el año';
                const start = maxYear - yearPage * 16;
                for(let y = start; y >= Math.max(start - 15, 1940); y--){
                    const c = make(y, y === selYear, false);
                    c.onclick = () => { selYear = y; step = 'month'; render(); };
                    dpGrid.appendChild(c);
                }
            } else if(step === 'month'){
                dpGrid.className = 'dp-grid months';
                dpStepLbl.textContent = selYear;
                MONTHS.forEach((m, i) => {
                    const future = selYear === maxYear && i > today.getMonth();
                    const c = make(m.slice(0,3), i === selMonth, future);
                    c.onclick = () => { selMonth = i; step = 'day'; render(); };
                    dpGrid.appendChild(c);
                });
            } else {
                dpGrid.className = 'dp-grid days';
                dpStepLbl.textContent = MONTHS[selMonth] + ' ' + selYear;
                DAYS.forEach(d => {
                    const l = document.createElement('div');
                    l.className = 'dp-cell day-label'; l.textContent = d; dpGrid.appendChild(l);
                });
                const offset = (new Date(selYear, selMonth, 1).getDay() + 6) % 7;
                const total  = new Date(selYear, selMonth + 1, 0).getDate();
                for(let i=0;i<offset;i++){ dpGrid.appendChild(document.createElement('div')); }
                for(let d=1;d<=total;d++){
                    const future = selYear===maxYear && selMonth===today.getMonth() && d>today.getDate();
                    const c = make(d, d === selDay, future);
                    c.onclick = () => { selDay = d; finish(); };
                    dpGrid.appendChild(c);
                }
            }
        };

        const finish = () => {
            const mm = String(selMonth+1).padStart(2,'0');
            const dd = String(selDay).padStart(2,'0');
            fechaH.value = `${selYear}-${mm}-${dd}`;
            dpDisplay.textContent = `${selYear} / ${mm} / ${dd}`;
            dpDisplay.style.color = 'var(--text-main)';
            dpInput.classList.add('filled');
            close(); step = 'year';
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