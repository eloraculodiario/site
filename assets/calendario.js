// Estado de la reserva
let reservaEstado = {
    servicio: null,
    precio: null,
    duracion: null,
    fecha: null,
    hora: null,
    nombreServicio: null
};

// Configuración de horarios
const configHorarios = {
    inicioManana: 9,    // 9:00
    finManana: 14,      // 14:00
    inicioTarde: 16,    // 16:00
    finTarde: 21,       // 21:00
    intervalo: 30       // Intervalo en minutos
};

// Días bloqueados (ejemplo)
const diasBloqueados = [
    '2024-12-25', // Navidad
    '2025-01-01'  // Año nuevo
];

// Horarios ya reservados (simulado - en producción vendría de una base de datos)
const horariosOcupados = {
    '2024-12-20': ['10:00', '11:30', '17:00'],
    '2024-12-21': ['09:30', '16:30', '19:00'],
    '2024-12-22': ['10:30', '18:00']
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarCalendario();
    inicializarFormulario();
});

// Calendario
function inicializarCalendario() {
    const fecha = new Date();
    generarCalendario(fecha.getMonth(), fecha.getFullYear());
    
    document.getElementById('btn-mes-anterior').addEventListener('click', function() {
        const mesActual = document.getElementById('mes-actual').dataset.mes;
        const añoActual = document.getElementById('mes-actual').dataset.año;
        const fecha = new Date(añoActual, mesActual - 1, 1);
        fecha.setMonth(fecha.getMonth() - 1);
        generarCalendario(fecha.getMonth(), fecha.getFullYear());
    });
    
    document.getElementById('btn-mes-siguiente').addEventListener('click', function() {
        const mesActual = document.getElementById('mes-actual').dataset.mes;
        const añoActual = document.getElementById('mes-actual').dataset.año;
        const fecha = new Date(añoActual, mesActual - 1, 1);
        fecha.setMonth(fecha.getMonth() + 1);
        generarCalendario(fecha.getMonth(), fecha.getFullYear());
    });
}

function generarCalendario(mes, año) {
    const calendario = document.getElementById('calendario');
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    document.getElementById('mes-actual').textContent = `${nombresMeses[mes]} ${año}`;
    document.getElementById('mes-actual').dataset.mes = mes + 1;
    document.getElementById('mes-actual').dataset.año = año;
    
    let html = '';
    
    // Días de la semana
    html += '<div class="dias-semana">';
    ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].forEach(dia => {
        html += `<div class="dia-header">${dia}</div>`;
    });
    html += '</div>';
    
    // Días del mes
    html += '<div class="dias-mes">';
    
    // Espacios vacíos al inicio
    for (let i = 0; i < (primerDia.getDay() + 6) % 7; i++) {
        html += '<div class="dia vacio"></div>';
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const fechaObj = new Date(fechaStr);
        const hoy = new Date().setHours(0,0,0,0);
        
        const esPasado = fechaObj < hoy;
        const estaBloqueado = diasBloqueados.includes(fechaStr);
        const esSeleccionado = reservaEstado.fecha === fechaStr;
        
        let clases = 'dia';
        if (esPasado) clases += ' pasado';
        if (estaBloqueado) clases += ' bloqueado';
        if (esSeleccionado) clases += ' seleccionado';
        
        html += `<div class="${clases}" data-fecha="${fechaStr}" onclick="seleccionarFecha('${fechaStr}')">${dia}</div>`;
    }
    
    html += '</div>';
    calendario.innerHTML = html;
}

function seleccionarFecha(fecha) {
    if (!reservaEstado.servicio) {
        alert('Por favor, selecciona un servicio primero.');
        return;
    }
    
    const fechaObj = new Date(fecha);
    const hoy = new Date().setHours(0,0,0,0);
    
    // Validar fecha
    if (fechaObj < hoy || diasBloqueados.includes(fecha)) {
        return;
    }
    
    reservaEstado.fecha = fecha;
    
    // Actualizar UI
    document.querySelectorAll('.dia').forEach(dia => {
        dia.classList.remove('seleccionado');
    });
    document.querySelector(`[data-fecha="${fecha}"]`).classList.add('seleccionado');
    
    // Mostrar fecha seleccionada
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
    document.getElementById('fecha-seleccionada-texto').textContent = fechaFormateada;
    document.getElementById('info-fecha').classList.remove('hidden');
    
    // Generar horarios basados en la duración del servicio
    generarHorarios(fecha);
}

function generarHorarios(fecha) {
    const contenedor = document.getElementById('horarios-container');
    const duracion = reservaEstado.duracion;
    
    // Calcular horarios disponibles basados en la duración
    const horarios = calcularHorariosDisponibles(fecha, duracion);
    
    if (horarios.length === 0) {
        contenedor.innerHTML = '<p class="text-center muted py-8">No hay horarios disponibles para esta fecha</p>';
        return;
    }
    
    let html = '';
    horarios.forEach(horario => {
        const ocupado = horariosOcupados[fecha] && horariosOcupados[fecha].includes(horario);
        html += `
            <button class="hora-btn ${ocupado ? 'ocupado' : 'disponible'}" 
                    ${ocupado ? 'disabled' : ''}
                    onclick="seleccionarHora('${horario}')">
                ${horario}
            </button>
        `;
    });
    
    contenedor.innerHTML = html;
}

function calcularHorariosDisponibles(fecha, duracion) {
    const horarios = [];
    const ahora = new Date();
    const fechaSeleccionada = new Date(fecha);
    const esHoy = fechaSeleccionada.toDateString() === ahora.toDateString();
    
    // Generar horarios de mañana
    for (let hora = configHorarios.inicioManana; hora < configHorarios.finManana; hora++) {
        for (let minuto = 0; minuto < 60; minuto += configHorarios.intervalo) {
            const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
            
            // Si es hoy, filtrar horarios pasados
            if (esHoy) {
                const [horas, minutos] = horario.split(':').map(Number);
                const horarioObj = new Date();
                horarioObj.setHours(horas, minutos, 0, 0);
                if (horarioObj < ahora) continue;
            }
            
            horarios.push(horario);
        }
    }
    
    // Generar horarios de tarde
    for (let hora = configHorarios.inicioTarde; hora < configHorarios.finTarde; hora++) {
        for (let minuto = 0; minuto < 60; minuto += configHorarios.intervalo) {
            const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
            horarios.push(horario);
        }
    }
    
    return horarios;
}

function seleccionarHora(hora) {
    reservaEstado.hora = hora;
    
    // Actualizar UI
    document.querySelectorAll('.hora-btn').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    document.querySelector(`[onclick="seleccionarHora('${hora}')"]`).classList.add('seleccionado');
    
    // Mostrar formulario de contacto
    document.getElementById('formulario-contacto').classList.remove('hidden');
}

// Servicios
function seleccionarServicio(servicio, precio, duracion) {
    const servicios = {
        '60min': 'Lectura de 60 minutos',
        '30min': 'Lectura de 30 minutos', 
        '20min': 'Lectura de 20 minutos',
        '1pregunta': '1 Pregunta específica',
        '2preguntas': '2 Preguntas',
        '3preguntas': '3 Preguntas'
    };

    reservaEstado.servicio = servicio;
    reservaEstado.precio = precio;
    reservaEstado.duracion = duracion;
    reservaEstado.nombreServicio = servicios[servicio];

    document.getElementById('nombre-servicio').textContent = servicios[servicio];
    document.getElementById('precio-servicio').textContent = precio + '€';
    document.getElementById('duracion-servicio').textContent = duracion + ' minutos de duración';
    document.getElementById('servicio-seleccionado').classList.remove('hidden');
    
    // Scroll suave al calendario
    document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' });
}

function deseleccionarServicio() {
    reservaEstado.servicio = null;
    reservaEstado.precio = null;
    reservaEstado.duracion = null;
    reservaEstado.fecha = null;
    reservaEstado.hora = null;
    
    document.getElementById('servicio-seleccionado').classList.add('hidden');
    document.getElementById('info-fecha').classList.add('hidden');
    document.getElementById('formulario-contacto').classList.add('hidden');
    document.getElementById('horarios-container').innerHTML = '<p class="text-center muted py-8">Selecciona una fecha para ver horarios disponibles</p>';
    
    // Limpiar selecciones
    document.querySelectorAll('.dia.seleccionado').forEach(dia => dia.classList.remove('seleccionado'));
    document.querySelectorAll('.hora-btn.seleccionado').forEach(btn => btn.classList.remove('seleccionado'));
}

// Formulario
function inicializarFormulario() {
    document.getElementById('formulario-reserva').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!reservaEstado.servicio || !reservaEstado.fecha || !reservaEstado.hora) {
            alert('Por favor, completa toda la información de la reserva.');
            return;
        }

        const formData = new FormData(this);
        const datos = {
            ...reservaEstado,
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            metodo: formData.get('metodo'),
            consulta: formData.get('consulta')
        };

        // Simular envío (aquí integrarías con tu backend)
        console.log('Datos de reserva:', datos);
        
        // Mostrar confirmación
        const btn = document.getElementById('btn-enviar');
        const btnOriginal = btn.innerHTML;
        btn.innerHTML = '✓ Reserva confirmada';
        btn.classList.add('bg-green-600');
        btn.disabled = true;

        alert(`¡Gracias ${datos.nombre}! Tu reserva para ${datos.nombreServicio} el ${datos.fecha} a las ${datos.hora} ha sido confirmada. Te contactaré por ${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'} para coordinar los detalles.`);

        // Resetear después de 3 segundos
        setTimeout(() => {
            this.reset();
            deseleccionarServicio();
            btn.innerHTML = btnOriginal;
            btn.classList.remove('bg-green-600');
            btn.disabled = false;
        }, 3000);
    });
}
