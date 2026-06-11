/**
 * Location Module - Handles Divipola API for Depto/City
 */

const Location = {
    data: [],
    selectors: {
        depto: document.getElementById('lugar_depto'),
        ciudad: document.getElementById('lugar_ciudad'),
        otroCheck: document.getElementById('lugar_otro_check'),
        input: document.getElementById('lugar_expedicion'),
        controls: document.querySelector('.lugar-controls')
    },

    async init() {
        try {
            const res = await fetch('https://www.datos.gov.co/resource/gdxc-w37w.json?$select=dpto,nom_mpio&$limit=2000');
            if (!res.ok) throw new Error('API Unavailable');
            const rawData = await res.json();
            this.data = rawData.map(item => ({ depto: item.dpto, municipio: item.nom_mpio }));

            const deptos = [...new Set(this.data.map(item => item.depto))].sort();
            deptos.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d; opt.textContent = d;
                this.selectors.depto.appendChild(opt);
            });

            this.bindEvents();
        } catch (err) {
            console.error('Divipola Error:', err);
            this.selectors.controls.style.display = 'none';
            this.selectors.input.style.display = 'block';
            this.selectors.input.required = true;
        }
    },

    bindEvents() {
        this.selectors.depto.onchange = () => {
            const depto = this.selectors.depto.value;
            this.selectors.ciudad.innerHTML = '<option value="">Selecciona Ciudad</option>';
            if (depto) {
                this.selectors.ciudad.disabled = false;
                const ciudades = this.data
                    .filter(item => item.depto === depto)
                    .map(item => item.municipio)
                    .sort();
                ciudades.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c; opt.textContent = c;
                    this.selectors.ciudad.appendChild(opt);
                });
            } else {
                this.selectors.ciudad.disabled = true;
            }
        };

        this.selectors.otroCheck.onchange = (e) => {
            if (e.target.checked) {
                this.selectors.controls.style.display = 'none';
                this.selectors.input.style.display = 'block';
                this.selectors.input.required = true;
                this.selectors.depto.required = false;
                this.selectors.ciudad.required = false;
            } else {
                this.selectors.controls.style.display = 'flex';
                this.selectors.input.style.display = 'none';
                this.selectors.input.required = false;
                this.selectors.depto.required = true;
                this.selectors.ciudad.required = true;
            }
        };
    },

    getValue() {
        if (this.selectors.otroCheck.checked) {
            return this.selectors.input.value.trim();
        }
        const ciudad = this.selectors.ciudad.value;
        const depto  = this.selectors.depto.value;
        return (ciudad && depto) ? `${ciudad}, ${depto}` : '';
    }
};

export default Location;