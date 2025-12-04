// Widget de Fase Lunar - Farmsense API
async function cargarFaseLunar() {
    try {
        // Obtener timestamp Unix actual
        const timestamp = Math.floor(Date.now() / 1000);
        const url = `https://api.farmsense.net/v1/moonphases/?d=${timestamp}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            const moonData = data[0];

            // Mapeo de fases en español
            const faseNombres = {
                'New Moon': '🌑 Luna Nueva',
                'Waxing Crescent': '🌒 Luna Creciente',
                'First Quarter': '🌓 Cuarto Creciente',
                'Waxing Gibbous': '🌔 Gibosa Creciente',
                'Full Moon': '🌕 Luna Llena',
                'Waning Gibbous': '🌖 Gibosa Menguante',
                'Last Quarter': '🌗 Cuarto Menguante',
                'Waning Crescent': '🌘 Luna Menguante'
            };

            // Iconos de luna según la fase
            const moonIcons = {
                'New Moon': '🌑',
                'Waxing Crescent': '🌒',
                'First Quarter': '🌓',
                'Waxing Gibbous': '🌔',
                'Full Moon': '🌕',
                'Waning Gibbous': '🌖',
                'Last Quarter': '🌗',
                'Waning Crescent': '🌘'
            };

            // Actualizar nombre de fase
            const faseNombre = faseNombres[moonData.Phase] || moonData.Phase;
            document.getElementById('moon-phase-name').textContent = faseNombre;

            // Actualizar icono de luna
            const moonIcon = moonIcons[moonData.Phase] || '🌙';
            document.getElementById('moon-icon').textContent = moonIcon;

            // Actualizar iluminación
            const illumination = Math.round(moonData.Illumination * 100);
            document.getElementById('moon-illumination').textContent = illumination + '%';

            // Actualizar Edad (Age)
            const ageEl = document.getElementById('moon-age');
            if (ageEl) {
                // MoonData.Age es usualmente días desde la luna nueva
                ageEl.textContent = Math.round(moonData.Age || 0) + ' días';
            }

            // Actualizar Signo (no siempre disponible en Farmsense básico, pero intentamos si existe o usamos placeholder)
            // Farmsense v1 básico a veces no devuelve signo zodiacal directamente en este endpoint simple.
            // Verificamos si hay campo 'Sign' o similar, si no, lo dejamos vacío o calculado si fuera necesario.
            // En el script original inline no se usaba signo, se usaba Moonrise/Moonset.
            // El usuario pidió "Signo", pero si la API no lo da, podemos mostrar Moonrise/Moonset como fallback o buscar otra API.
            // Por ahora restauramos Moonrise/Moonset si el usuario prefiere, PERO el HTML nuevo tiene etiquetas "Edad" y "Signo".
            // Revisando el JSON de Farmsense: devuelve {Error: 0, ErrorMsg: "success", TargetDate: "...", Moon: [...], Index: 0, Age: 24.5, Phase: "Waning Crescent", Distance: ..., Illumination: ..., AngularDiameter: ..., SunAngle: ..., SunDistance: ...}
            // No devuelve Signo.

            // Sin embargo, el usuario tenía en el HTML original:
            // <span class="muted">Sale:</span> <strong id="moon-rise">
            // <span class="muted">Se pone:</span> <strong id="moon-set">

            // Y en el NUEVO HTML (que yo puse en el paso anterior) puse:
            // <span class="muted">Edad:</span> <strong id="moon-age">
            // <span class="muted">Signo:</span> <strong id="moon-sign">

            // El usuario se quejó de que no se veían los datos.
            // Si uso Farmsense, tengo Age, pero no Signo.
            // Si uso Viewbits, tenía Signo pero fallaba.

            // Voy a intentar usar una librería astronómica ligera o simplemente mostrar lo que Farmsense da.
            // Si el usuario quiere "Signo", Farmsense no lo da fácil.
            // Pero el usuario dijo "Sale por triplicado... y yo lo quiero en la parte superior...".
            // En su request original copió texto que decía "Signo: --".

            // Voy a adaptar el script para llenar "Edad" con `Age` y dejar "Signo" como "--" o intentar calcularlo si es crítico, 
            // pero para asegurar que funcione YA, usaré Farmsense que es fiable para Fase/Iluminación/Edad.

            const signEl = document.getElementById('moon-sign');
            if (signEl) signEl.textContent = '--'; // Farmsense no devuelve signo por defecto

            console.log('🌙 Fase lunar cargada:', moonData);
        }
    } catch (error) {
        console.error('Error cargando fase lunar:', error);
        document.getElementById('moon-phase-name').textContent = 'No disponible';
        document.getElementById('moon-illumination').textContent = '--';
        const ageEl = document.getElementById('moon-age');
        if (ageEl) ageEl.textContent = '--';
        const signEl = document.getElementById('moon-sign');
        if (signEl) signEl.textContent = '--';
    }
}

// Cargar al iniciar la página
document.addEventListener('DOMContentLoaded', cargarFaseLunar);
