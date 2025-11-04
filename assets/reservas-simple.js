// Estado de la reserva
let reservaEstado = {
    servicio: null,
    precio: null,
    duracion: null,
    nombreServicio: null
};

// Mapeo de servicios
const serviciosInfo = {
    '60min': { nombre: 'Lectura de 60 minutos', precio: 45, duracion: '60 minutos' },
    '30min': { nombre: 'Lectura de 30 minutos', precio: 25, duracion: '30 minutos' },
    '20min': { nombre: 'Lectura de 20 minutos', precio: 15, duracion: '20 minutos' },
    '1pregunta': { nombre: '1 Pregunta específica', precio: 10, duracion: '15 minutos' },
    '2preguntas': { nombre: '2 Preguntas', precio: 18, duracion: '25 minutos' },
    '3preguntas': { nombre: '3 Preguntas', precio: 25, duracion: '35 minutos' }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarSeleccionServicio();
});

// Paso 1: Selección de servicio
function inicializarSeleccionServicio() {
    const cards = document.querySelectorAll('.servicio-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // Quitar selección anterior
            cards.forEach(c => c.classList.remove('seleccionado'));
            
            // Seleccionar actual
            this.classList.add('seleccionado');
            
            // Guardar datos
            const servicio = this.dataset.servicio;
            reservaEstado.servicio = servicio;
            reservaEstado.precio = this.dataset.precio;
            reservaEstado.duracion = this.dataset.duracion;
            reservaEstado.nombreServicio = serviciosInfo[servicio].nombre;
            
            // Mostrar botón continuar
            document.getElementById('btn-continuar-1').classList.remove('hidden');
        });
    });
}

// Navegación entre pasos
function siguientePaso(pasoActual) {
    if (pasoActual === 1) {
        // Validar que se haya seleccionado un servicio
        if (!reservaEstado.servicio) {
            alert('Por favor, selecciona un servicio antes de continuar.');
            return;
        }
        
        // Actualizar resumen en paso 2
        actualizarResumen();
        
        // Cambiar a paso 2
        document.getElementById('paso-1').classList.remove('activo');
        document.getElementById('paso-2').classList.add('activo');
        
        // Actualizar indicador de progreso
        actualizarProgreso(2);
    }
}

function anteriorPaso(pasoActual) {
    if (pasoActual === 2) {
        // Volver a paso 1
        document.getElementById('paso-2').classList.remove('activo');
        document.getElementById('paso-1').classList.add('activo');
        
        // Actualizar indicador de progreso
        actualizarProgreso(1);
    }
}

function actualizarProgreso(paso) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${paso}"]`).classList.add('active');
}

function actualizarResumen() {
    const detalles = document.getElementById('detalles-reserva');
    const resumenServicio = document.getElementById('resumen-servicio');
    
    detalles.innerHTML = `
        <div class="flex justify-between">
            <span>Servicio:</span>
            <strong>${reservaEstado.nombreServicio}</strong>
        </div>
        <div class="flex justify-between">
            <span>Duración:</span>
            <strong>${reservaEstado.duracion} minutos</strong>
        </div>
        <div class="flex justify-between">
            <span>Precio:</span>
            <strong>${reservaEstado.precio}€</strong>
        </div>
    `;
    
    resumenServicio.textContent = `Has seleccionado: ${reservaEstado.nombreServicio} - ${reservaEstado.precio}€`;
}

// Funciones de contacto
function contactarPorWhatsApp() {
    const mensaje = `Hola! Me gustaría reservar una ${reservaEstado.nombreServicio} (${reservaEstado.duracion} minutos - ${reservaEstado.precio}€). ¿Podrías ayudarme a coordinar fecha y hora?`;
    const telefono = '+34TU_NUMERO'; // Reemplaza con tu número
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function contactarPorTelegram() {
    const mensaje = `Hola! Me gustaría reservar una ${reservaEstado.nombreServicio} (${reservaEstado.duracion} minutos - ${reservaEstado.precio}€). ¿Podrías ayudarme a coordinar fecha y hora?`;
    const username = 'TU_USUARIO_TELEGRAM'; // Reemplaza con tu usuario
    const url = `https://t.me/${username}?start=${encodeURIComponent(btoa(mensaje))}`;
    window.open(url, '_blank');
}
