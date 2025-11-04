// Estado de la reserva
let reservaEstado = {
    servicio: null,
    precio: null,
    duracion: null,
    franja: null,
    fecha: null,
    hora: null,
    nombreServicio: null
};

// Configuración de horarios por franjas
const configFranjas = {
    '15': { // Franja de 15 minutos
        intervalos: [0, 15, 30, 45],
        inicioManana: 9,
        finManana: 14,
        inicioTarde: 16,
        finTarde: 21
    },
    '30': { // Franja de 30 minutos
        intervalos: [0, 30],
        inicioManana: 9,
        finManana: 14,
        inicioTarde: 16,
        finTarde: 21
    },
    '60': { // Franja de 60 minutos
        intervalos: [0],
        inicioManana: 9,
        finManana: 14,
        inicioTarde: 16,
        finTarde: 21
    }
};

// Días bloqueados (ejemplo)
const diasBloqueados = [
    '2024-12-25', // Navidad
    '2025-01-01'  // Año nuevo
];

// Horarios ya reservados (simulado)
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
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(dia => {
        html += `<div class="dia-header">${dia}</div>`;
    });
    html += '</div>';
    
    // Días del mes
    html += '<div class="dias-mes">';
    
    // Espacios vacíos al inicio
    const primerDiaSemana = (primerDia.getDay() + 6) % 7; // Lunes como primer día
    for (let i = 0; i < primerDiaSemana; i++) {
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
    
    // Generar horarios basados en la franja del servicio
    generarHorarios(fecha);
}

function generarHorarios(fecha) {
    const contenedor = document.getElementById('horarios-container');
    const franja = reservaEstado.franja;
    const config = configFranjas[franja];
    
    if (!config) {
        contenedor.innerHTML = '<p class="text-center muted py-8">Error en la configuración de horarios</p>';
        return;
    }
    
    // Calcular horarios disponibles basados en la franja
    const horarios = calcularHorariosDisponibles(fecha, config);
    
    if (horarios.length === 0) {
        contenedor.innerHTML = '<p class="text-center muted py-8">No hay horarios disponibles para esta fecha</p>';
        return;
    }
    
    let html = '';
    horarios.forEach(horario => {
        const ocupado = estaHorarioOcupado(fecha, horario, franja);
        html += `
            <button class="hora-btn ${ocupado ? 'ocupado' : 'disponible'}" 
                    ${ocupado ? 'disabled' : ''}
                    onclick="seleccionarHora('${horario}')">
                ${horario}
                <div class="text-xs mt-1 opacity-75">${franja} min</div>
            </button>
        `;
    });
    
    contenedor.innerHTML = html;
}

function calcularHorariosDisponibles(fecha, config) {
    const horarios = [];
    const ahora = new Date();
    const fechaSeleccionada = new Date(fecha);
    const esHoy = fechaSeleccionada.toDateString() === ahora.toDateString();
    
    // Generar horarios de mañana
    for (let hora = config.inicioManana; hora < config.finManana; hora++) {
        config.intervalos.forEach(minuto => {
            const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
            
            // Si es hoy, filtrar horarios pasados
            if (esHoy) {
                const [horas, minutos] = horario.split(':').map(Number);
                const horarioObj = new Date();
                horarioObj.setHours(horas, minutos, 0, 0);
                if (horarioObj < ahora) return;
            }
            
            horarios.push(horario);
        });
    }
    
    // Generar horarios de tarde
    for (let hora = config.inicioTarde; hora < config.finTarde; hora++) {
        config.intervalos.forEach(minuto => {
            const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
            horarios.push(horario);
        });
    }
    
    return horarios;
}

function estaHorarioOcupado(fecha, horario, franja) {
    if (!horariosOcupados[fecha]) return false;
    
    const [horaInicio, minutoInicio] = horario.split(':').map(Number);
    const horaFin = new Date(0, 0, 0, horaInicio, minutoInicio + parseInt(franja));
    const horarioFin = `${String(horaFin.getHours()).padStart(2, '0')}:${String(horaFin.getMinutes()).padStart(2, '0')}`;
    
    // Verificar si algún horario ocupado se solapa con este
    return horariosOcupados[fecha].some(ocupado => {
        const [ocupadoHora, ocupadoMinuto] = ocupado.split(':').map(Number);
        const ocupadoInicio = new Date(0, 0, 0, ocupadoHora, ocupadoMinuto);
        const ocupadoFin = new Date(ocupadoInicio.getTime() + 30 * 60000); // Asumiendo 30min por reserva
        
        const inicioReserva = new Date(0, 0, 0, horaInicio, minutoInicio);
        const finReserva = new Date(inicioReserva.getTime() + parseInt(franja) * 60000);
        
        return (inicioReserva < ocupadoFin && finReserva > ocupadoInicio);
    });
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
    
    // Actualizar resumen
    actualizarResumenReserva();
}

function actualizarResumenReserva() {
    const fechaObj = new Date(reservaEstado.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
    
    const resumen = `${reservaEstado.nombreServicio} - ${fechaFormateada} a las ${reservaEstado.hora}`;
    document.getElementById('resumen-reserva').textContent = resumen;
}

// Servicios
function seleccionarServicio(servicio, precio, duracion, franja) {
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
    reservaEstado.franja = franja;
    reservaEstado.nombreServicio = servicios[servicio];

    document.getElementById('nombre-servicio').textContent = servicios[servicio];
    document.getElementById('precio-servicio').textContent = precio + '€';
    document.getElementById('duracion-servicio').textContent = duracion + ' minutos de duración';
    document.getElementById('franja-servicio').textContent = 'Franjas de ' + franja + ' minutos';
    document.getElementById('servicio-seleccionado').classList.remove('hidden');
    
    // Resetear selecciones anteriores
    reservaEstado.fecha = null;
    reservaEstado.hora = null;
    document.getElementById('info-fecha').classList.add('hidden');
    document.getElementById('formulario-contacto').classList.add('hidden');
    document.querySelectorAll('.dia.seleccionado').forEach(dia => dia.classList.remove('seleccionado'));
    document.querySelectorAll('.hora-btn.seleccionado').forEach(btn => btn.classList.remove('seleccionado'));
    
    // Actualizar mensaje de horarios
    document.getElementById('horarios-container').innerHTML = 
        '<p class="text-center muted py-8">Ahora selecciona una fecha para ver horarios disponibles en franjas de ' + franja + ' minutos</p>';
    
    // Scroll suave al calendario
    document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' });
}

function deseleccionarServicio() {
    reservaEstado.servicio = null;
    reservaEstado.precio = null;
    reservaEstado.duracion = null;
    reservaEstado.franja = null;
    reservaEstado.fecha = null;
    reservaEstado.hora = null;
    
    document.getElementById('servicio-seleccionado').classList.add('hidden');
    document.getElementById('info-fecha').classList.add('hidden');
    document.getElementById('formulario-contacto').classList.add('hidden');
    document.getElementById('horarios-container').innerHTML = 
        '<p class="text-center muted py-8">Selecciona un servicio y una fecha para ver horarios disponibles</p>';
    
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

        const fechaObj = new Date(datos.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });

        alert(`¡Gracias ${datos.nombre}! Tu reserva ha sido confirmada:\n\n` +
              `📅 ${fechaFormateada} a las ${datos.hora}\n` +
              `⏰ ${datos.nombreServicio} (${datos.duracion} minutos)\n` +
              `💬 Te contactaré por ${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'} para coordinar los detalles finales.`);

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
