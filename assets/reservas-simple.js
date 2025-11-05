// assets/reservas-simple.js - VERSIÓN COMPLETA Y CORREGIDA

// Estado de la reserva
let reservaEstado = {
    servicio: null,
    precio: null,
    duracion: null,
    nombreServicio: null
};

// Mapeo de servicios
const serviciosInfo = {
    '60min': { 
        nombre: 'Lectura de 60 minutos', 
        precio: 45, 
        duracion: '60 minutos',
        descripcion: 'Lectura completa y profunda con análisis detallado'
    },
    '30min': { 
        nombre: 'Lectura de 30 minutos', 
        precio: 25, 
        duracion: '30 minutos',
        descripcion: 'Perfecto para 1-2 áreas específicas que necesiten claridad'
    },
    '20min': { 
        nombre: 'Lectura de 20 minutos', 
        precio: 15, 
        duracion: '20 minutos',
        descripcion: 'Ideal para una pregunta específica o orientación rápida'
    },
    '1pregunta': { 
        nombre: '1 Pregunta específica', 
        precio: 10, 
        duracion: '15 minutos',
        descripcion: 'Respuesta clara y concisa a una pregunta específica por audio'
    },
    '2preguntas': { 
        nombre: '2 Preguntas', 
        precio: 18, 
        duracion: '25 minutos',
        descripcion: 'Dos preguntas relacionadas para una visión más completa'
    },
    '3preguntas': { 
        nombre: '3 Preguntas', 
        precio: 25, 
        duracion: '35 minutos',
        descripcion: 'Visión general con tres preguntas para contexto completo'
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarSeleccionServicio();
    actualizarProgreso(1);
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
            const servicioInfo = serviciosInfo[servicio];
            
            if (servicioInfo) {
                reservaEstado.servicio = servicio;
                reservaEstado.precio = servicioInfo.precio;
                reservaEstado.duracion = servicioInfo.duracion;
                reservaEstado.nombreServicio = servicioInfo.nombre;
                
                // Mostrar botón continuar
                document.getElementById('btn-continuar-1').classList.remove('hidden');
                
                // Efecto visual de confirmación
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });

    // Efectos hover mejorados
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('seleccionado')) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('seleccionado')) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            }
        });
    });
}

// Navegación entre pasos
function siguientePaso(pasoActual) {
    if (pasoActual === 1) {
        // Validar que se haya seleccionado un servicio
        if (!reservaEstado.servicio) {
            mostrarAlerta('Por favor, selecciona un servicio antes de continuar.', 'error');
            return;
        }
        
        // Actualizar resumen en paso 2
        actualizarResumen();
        
        // Cambiar a paso 2
        document.getElementById('paso-1').classList.remove('activo');
        document.getElementById('paso-2').classList.add('activo');
        
        // Actualizar indicador de progreso
        actualizarProgreso(2);
        
        // Scroll suave al paso 2
        document.getElementById('paso-2').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function anteriorPaso(pasoActual) {
    if (pasoActual === 2) {
        // Volver a paso 1
        document.getElementById('paso-2').classList.remove('activo');
        document.getElementById('paso-1').classList.add('activo');
        
        // Actualizar indicador de progreso
        actualizarProgreso(1);
        
        // Scroll suave al paso 1
        document.getElementById('paso-1').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
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
    const servicioInfo = serviciosInfo[reservaEstado.servicio];
    
    detalles.innerHTML = `
        <div class="flex justify-between items-center py-2 border-b border-gray-200/30">
            <span class="text-sm">Servicio:</span>
            <strong class="text-purple-300">${reservaEstado.nombreServicio}</strong>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-200/30">
            <span class="text-sm">Duración:</span>
            <strong>${reservaEstado.duracion}</strong>
        </div>
        <div class="flex justify-between items-center py-2">
            <span class="text-sm">Precio:</span>
            <strong class="text-xl text-green-400">${reservaEstado.precio}€</strong>
        </div>
    `;
    
    resumenServicio.textContent = `${reservaEstado.nombreServicio} - ${reservaEstado.precio}€`;
    
    // Agregar descripción si existe
    if (servicioInfo && servicioInfo.descripcion) {
        detalles.innerHTML += `
            <div class="mt-3 pt-3 border-t border-gray-200/30">
                <p class="text-xs text-gray-400">${servicioInfo.descripcion}</p>
            </div>
        `;
    }
}

// Funciones de contacto - ACTUALIZA ESTOS DATOS CON TUS CONTACTOS REALES
function contactarPorWhatsApp() {
    if (!reservaEstado.servicio) {
        mostrarAlerta('Por favor, selecciona un servicio primero.', 'error');
        return;
    }
    
    const servicioInfo = serviciosInfo[reservaEstado.servicio];
    const mensaje = `¡Hola! Me gustaría reservar una *${reservaEstado.nombreServicio}*.

• Duración: ${reservaEstado.duracion}
• Precio: ${reservaEstado.precio}€
• Descripción: ${servicioInfo.descripcion}

¿Podrías ayudarme a coordinar fecha y hora para mi sesión? ¡Gracias! ✨`;

    // ⚠️ REEMPLAZA ESTE NÚMERO CON TU NÚMERO REAL (sin el +)
    const telefono = '34123456789'; // Ejemplo: 34123456789 para +34 123 456 789
    
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir en nueva pestaña
    window.open(url, '_blank');
    
    // Tracking (opcional)
    console.log('WhatsApp abierto para:', reservaEstado.nombreServicio);
}

function contactarPorTelegram() {
    if (!reservaEstado.servicio) {
        mostrarAlerta('Por favor, selecciona un servicio primero.', 'error');
        return;
    }
    
    const servicioInfo = serviciosInfo[reservaEstado.servicio];
    const mensaje = `¡Hola! Me gustaría reservar una *${reservaEstado.nombreServicio}*.

• Duración: ${reservaEstado.duracion}
• Precio: ${reservaEstado.precio}€  
• Descripción: ${servicioInfo.descripcion}

¿Podrías ayudarme a coordinar fecha y hora para mi sesión? ¡Gracias! ✨`;

    // ⚠️ REEMPLAZA ESTE USERNAME CON TU USUARIO REAL DE TELEGRAM
    const username = ''@lordpietre; // Ejemplo: ElOraculoDiario para @ElOraculoDiario
    
    const url = `https://t.me/${username}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir en nueva pestaña
    window.open(url, '_blank');
    
    // Tracking (opcional)
    console.log('Telegram abierto para:', reservaEstado.nombreServicio);
}

// Función para mostrar alertas elegantes
function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        tipo === 'error' ? 'bg-red-600 text-white' : 
        tipo === 'success' ? 'bg-green-600 text-white' : 
        'bg-blue-600 text-white'
    }`;
    
    alerta.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="text-xl">${tipo === 'error' ? '❌' : tipo === 'success' ? '✅' : 'ℹ️'}</div>
            <div class="flex-1">
                <div class="font-semibold">${tipo === 'error' ? 'Error' : tipo === 'success' ? 'Éxito' : 'Información'}</div>
                <div class="text-sm opacity-90">${mensaje}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-xl opacity-70 hover:opacity-100">&times;</button>
        </div>
    `;
    
    // Agregar al documento
    document.body.appendChild(alerta);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alerta.parentElement) {
            alerta.remove();
        }
    }, 5000);
}

// Efectos para botones de apps
document.addEventListener('DOMContentLoaded', function() {
    // Efectos hover para tarjetas de apps
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        card.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });
        
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
    });
});

// Persistencia en localStorage
function guardarReservaTemporal() {
    if (reservaEstado.servicio) {
        localStorage.setItem('reservaSimpleTemporal', JSON.stringify(reservaEstado));
    }
}

function cargarReservaTemporal() {
    try {
        const temporal = localStorage.getItem('reservaSimpleTemporal');
        if (temporal) {
            const datos = JSON.parse(temporal);
            if (datos.servicio && serviciosInfo[datos.servicio]) {
                // Restaurar servicio seleccionado
                const cards = document.querySelectorAll('.servicio-card');
                cards.forEach(card => {
                    if (card.dataset.servicio === datos.servicio) {
                        card.classList.add('seleccionado');
                        reservaEstado = { ...datos };
                        document.getElementById('btn-continuar-1').classList.remove('hidden');
                    }
                });
                
                console.log('Reserva temporal cargada:', datos);
            }
        }
    } catch (error) {
        console.error('Error cargando reserva temporal:', error);
        localStorage.removeItem('reservaSimpleTemporal');
    }
}

function limpiarReservaTemporal() {
    localStorage.removeItem('reservaSimpleTemporal');
}

// Cargar reserva temporal al iniciar
setTimeout(cargarReservaTemporal, 100);

// Guardar automáticamente cada 10 segundos cuando hay cambios
setInterval(() => {
    if (reservaEstado.servicio) {
        guardarReservaTemporal();
    }
}, 10000);

// Limpiar al cerrar/recargar (opcional)
window.addEventListener('beforeunload', function() {
    if (reservaEstado.servicio) {
        guardarReservaTemporal();
    }
});

// Función para reiniciar el proceso
function reiniciarReserva() {
    reservaEstado = {
        servicio: null,
        precio: null,
        duracion: null,
        nombreServicio: null
    };
    
    // Limpiar selecciones visuales
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.classList.remove('seleccionado');
    });
    
    document.getElementById('btn-continuar-1').classList.add('hidden');
    document.getElementById('paso-2').classList.remove('activo');
    document.getElementById('paso-1').classList.add('activo');
    actualizarProgreso(1);
    
    limpiarReservaTemporal();
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    mostrarAlerta('Proceso de reserva reiniciado. Puedes seleccionar un nuevo servicio.', 'info');
}

// Agregar botón de reinicio si no existe
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('btn-reiniciar')) {
        const btnReiniciar = document.createElement('button');
        btnReiniciar.id = 'btn-reiniciar';
        btnReiniciar.className = 'btn btn-ghost btn-sm fixed bottom-4 left-4 z-40 opacity-70 hover:opacity-100';
        btnReiniciar.innerHTML = '🔄 Reiniciar';
        btnReiniciar.onclick = reiniciarReserva;
        document.body.appendChild(btnReiniciar);
    }
});
