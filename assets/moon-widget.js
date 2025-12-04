// Widget de Fase Lunar - ViewBits API
async function cargarFaseLunar() {
    try {
        const url = 'https://api.viewbits.com/v1/moonphase';
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            const moonData = data[3] || data[0]; // Índice 3 es el día actual

            const faseNombres = {
                'New Moon': '🌑 Luna Nueva',
                'Waxing Crescent': '🌒 Luna Creciente',
                'First Quarter': '🌓 Cuarto Creciente',
                'Waxing Gibbous': '🌔 Gibosa Creciente',
                'Full Moon': '🌕 Luna Llena',
                'Waning Gibbous': '🌖 Gibosa Menguante',
                'Last Quarter': '🌗 Cuarto Menguante',
                'Third Quarter': '🌗 Cuarto Menguante',
                'Waning Crescent': '🌘 Luna Menguante'
            };

            const moonIcons = {
                'New Moon': '🌑',
                'Waxing Crescent': '🌒',
                'First Quarter': '🌓',
                'Waxing Gibbous': '🌔',
                'Full Moon': '🌕',
                'Waning Gibbous': '🌖',
                'Last Quarter': '🌗',
                'Third Quarter': '🌗',
                'Waning Crescent': '🌘'
            };

            const phase = moonData.phase || 'Unknown';
            document.getElementById('moon-phase-name').textContent = faseNombres[phase] || phase;
            document.getElementById('moon-icon').textContent = moonIcons[phase] || '🌙';
            document.getElementById('moon-illumination').textContent = Math.round((moonData.illumination || 0) * 100) + '%';
            document.getElementById('moon-rise').textContent = Math.round(moonData.moon_age || 0) + ' días';
            document.getElementById('moon-set').textContent = moonData.moon_sign || '--';

            console.log('🌙 Fase lunar cargada:', moonData);
        }
    } catch (error) {
        console.error('Error cargando fase lunar:', error);
        document.getElementById('moon-phase-name').textContent = 'No disponible';
    }
}

// Cargar al iniciar la página
document.addEventListener('DOMContentLoaded', cargarFaseLunar);
