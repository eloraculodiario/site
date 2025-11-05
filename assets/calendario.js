// assets/calendario.js - VERSIÓN COMPLETA Y CORREGIDA

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
    
    // Scroll suave al formulario
    document.getElementById('formulario-contacto').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
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
    document.getElementById('reserva').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
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

// Formulario - VERSIÓN CORREGIDA CON NOTIFICACIONES
function inicializarFormulario() {
    document.getElementById('formulario-reserva').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!reservaEstado.servicio || !reservaEstado.fecha || !reservaEstado.hora) {
            alert('Por favor, completa toda la información de la reserva.');
            return;
        }

        // Validar formulario
        const errorValidacion = validarFormulario();
        if (errorValidacion) {
            alert(errorValidacion);
            return;
        }

        const formData = new FormData(this);
        const datosReserva = {
            servicio: reservaEstado.nombreServicio,
            precio: reservaEstado.precio,
            duracion: reservaEstado.duracion,
            fecha: reservaEstado.fecha,
            hora: reservaEstado.hora,
            nombre: formData.get('nombre').trim(),
            telefono: formData.get('telefono').trim(),
            metodo: formData.get('metodo'),
            consulta: formData.get('consulta')?.trim() || ''
        };

        // Mostrar loading
        const btn = document.getElementById('btn-enviar');
        const btnOriginal = btn.innerHTML;
        btn.innerHTML = '📤 Enviando reserva...';
        btn.disabled = true;
        
        // Mostrar estado de carga global
        mostrarLoading();

        try {
            // Enviar notificación a Telegram
            const resultado = await notificador.enviarReserva(datosReserva);
            
            if (resultado.status === 'success') {
                mostrarConfirmacionExito(datosReserva);
            } else {
                throw new Error(resultado.message || 'Error desconocido al enviar la reserva');
            }
            
        } catch (error) {
            console.error('Error en reserva:', error);
            mostrarErrorReserva(datosReserva, error.message);
        } finally {
            // Restaurar botón
            btn.innerHTML = btnOriginal;
            btn.disabled = false;
            ocultarLoading();
        }
    });
}

// Función de validación del formulario
function validarFormulario() {
    const nombre = document.querySelector('input[name="nombre"]').value.trim();
    const telefono = document.querySelector('input[name="telefono"]').value.trim();
    const metodo = document.querySelector('input[name="metodo"]:checked');
    
    if (!nombre || nombre.length < 2) {
        return 'Por favor, ingresa tu nombre completo (mínimo 2 caracteres)';
    }
    
    if (!telefono) {
        return 'Por favor, ingresa tu número de teléfono';
    }
    
    if (!/^[\+]?[0-9\s\-\(\)]{7,}$/.test(telefono)) {
        return 'Por favor, ingresa un número de teléfono válido';
    }
    
    if (!metodo) {
        return 'Por favor, selecciona un método de comunicación (WhatsApp o Telegram)';
    }
    
    return null;
}

// Función para mostrar confirmación de éxito
function mostrarConfirmacionExito(datos) {
    const fechaObj = new Date(datos.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });

    // Reemplazar formulario con mensaje de éxito
    const formularioContainer = document.getElementById('formulario-contacto');
    formularioContainer.innerHTML = `
        <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-2xl font-bold mb-4">¡Reserva Confirmada!</h3>
            
            <div class="card max-w-md mx-auto text-left mb-6 bg-green-900/20 border-green-400">
                <h4 class="font-bold mb-3 text-green-300">📋 Detalles de tu reserva:</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Servicio:</span>
                        <strong>${datos.servicio}</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Fecha:</span>
                        <strong>${fechaFormateada}</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Hora:</span>
                        <strong>${datos.hora}</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Duración:</span>
                        <strong>${datos.duracion} minutos</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Precio:</span>
                        <strong>${datos.precio}€</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Método:</span>
                        <strong>${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</strong>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-900/20 border border-blue-400 rounded-lg p-4 mb-6">
                <p class="text-blue-300 mb-2">
                    ✅ <strong>Notificación enviada correctamente</strong>
                </p>
                <p class="text-sm muted">
                    Te contactaré por <strong>${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</strong> 
                    en menos de 24 horas para coordinar los detalles finales y el pago.
                </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button onclick="location.reload()" class="btn btn-primary">
                    🔮 Hacer otra reserva
                </button>
                <button onclick="window.print()" class="btn btn-ghost">
                    📄 Imprimir confirmación
                </button>
            </div>
            
            <p class="text-xs muted mt-6">
                Se ha enviado un correo de confirmación a tu email (si lo proporcionaste).
                Guarda esta información para referencia.
            </p>
        </div>
    `;

    // Scroll to top del formulario
    formularioContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Limpiar localStorage si existía reserva temporal
    limpiarReservaTemporal();
}

// Función para mostrar error en reserva
function mostrarErrorReserva(datos, errorMsg) {
    const intentarFallback = confirm(
        `❌ Error al enviar la reserva automáticamente:\n\n"${errorMsg}"\n\n¿Quieres enviar la reserva por email como respaldo?`
    );
    
    if (intentarFallback) {
        notificador.enviarFallback(datos);
        alert('✅ Se abrirá tu cliente de email. Por favor, envía el mensaje generado para completar tu reserva.');
    } else {
        // Mostrar información de contacto directo
        const metodoContacto = datos.metodo === 'whatsapp' ? 
            'WhatsApp: +34TU_NUMERO' : 
            'Telegram: @TU_USUARIO';
            
        alert(`📞 Puedes contactarnos directamente para completar tu reserva:\n\n${metodoContacto}\n\nMenciona que tienes una reserva pendiente para: ${datos.servicio} el ${datos.fecha} a las ${datos.hora}`);
    }
}

// Funciones de loading
function mostrarLoading() {
    document.body.style.cursor = 'wait';
    document.querySelectorAll('button, input, .dia, .hora-btn').forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.7';
    });
}

function ocultarLoading() {
    document.body.style.cursor = 'default';
    document.querySelectorAll('button, input, .dia, .hora-btn').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
    });
}

// Funciones de persistencia (opcional)
function guardarReservaTemporal() {
    if (reservaEstado.servicio) {
        localStorage.setItem('reservaTemporal', JSON.stringify(reservaEstado));
    }
}

function cargarReservaTemporal() {
    const temporal = localStorage.getItem('reservaTemporal');
    if (temporal) {
        const datos = JSON.parse(temporal);
        // Restaurar servicio si existe
        if (datos.servicio && serviciosInfo[datos.servicio]) {
            const servicio = serviciosInfo[datos.servicio];
            seleccionarServicio(
                datos.servicio, 
                datos.precio, 
                datos.duracion, 
                datos.franja
            );
        }
    }
}

function limpiarReservaTemporal() {
    localStorage.removeItem('reservaTemporal');
}

// Mapeo de servicios para persistencia
const serviciosInfo = {
    '60min': { precio: 45, duracion: 60, franja: 60 },
    '30min': { precio: 25, duracion: 30, franja: 30 },
    '20min': { precio: 15, duracion: 20, franja: 15 },
    '1pregunta': { precio: 10, duracion: 15, franja: 15 },
    '2preguntas': { precio: 18, duracion: 25, franja: 30 },
    '3preguntas': { precio: 25, duracion: 35, franja: 30 }
};

// Cargar reserva temporal al iniciar (opcional)
document.addEventListener('DOMContentLoaded', function() {
    // Cargar reserva temporal después de un breve delay
    setTimeout(cargarReservaTemporal, 100);
    
    // Guardar reserva temporal cuando cambien los datos
    setInterval(guardarReservaTemporal, 5000);
});
