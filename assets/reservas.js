// Estado de la reserva
let reservaEstado = {
  servicio: null,
  precio: null,
  fecha: null,
  hora: null,
  datos: {}
};

// Horarios disponibles (personaliza según tu disponibilidad)
const horariosDisponibles = [
  '09:00', '10:00', '11:00', '12:00', 
  '16:00', '17:00', '18:00', '19:00'
];

// Días bloqueados (ejemplo)
const diasBloqueados = [
  '2024-12-25', // Navidad
  '2025-01-01'  // Año nuevo
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  inicializarSeleccionServicio();
  inicializarCalendario();
  inicializarFormulario();
});

// Paso 1: Selección de servicio
function inicializarSeleccionServicio() {
  const cards = document.querySelectorAll('.servicio-card');
  
  cards.forEach(card => {
    card.addEventListener('click', function() {
      // Quitar selección anterior
      cards.forEach(c => c.classList.remove('border-purple-400', 'bg-purple-50'));
      
      // Seleccionar actual
      this.classList.add('border-purple-400', 'bg-purple-50');
      
      // Guardar datos
      reservaEstado.servicio = this.dataset.servicio;
      reservaEstado.precio = this.dataset.precio;
      
      // Mostrar botón continuar
      document.getElementById('btn-continuar').classList.remove('hidden');
    });
  });
}

// Paso 2: Calendario y horarios
function inicializarCalendario() {
  const calendario = document.getElementById('calendario');
  const fecha = new Date();
  const mes = fecha.getMonth();
  const año = fecha.getFullYear();
  
  // Generar calendario del mes actual
  generarCalendario(mes, año, calendario);
}

function generarCalendario(mes, año, contenedor) {
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  
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
  for (let i = 0; i < primerDia.getDay(); i++) {
    html += '<div class="dia vacio"></div>';
  }
  
  // Días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const esPasado = new Date(fechaStr) < new Date().setHours(0,0,0,0);
    const estaBloqueado = diasBloqueados.includes(fechaStr);
    const esSeleccionado = reservaEstado.fecha === fechaStr;
    
    let clases = 'dia';
    if (esPasado) clases += ' pasado';
    if (estaBloqueado) clases += ' bloqueado';
    if (esSeleccionado) clases += ' seleccionado';
    
    html += `<div class="${clases}" data-fecha="${fechaStr}" onclick="seleccionarFecha('${fechaStr}')">${dia}</div>`;
  }
  
  html += '</div>';
  contenedor.innerHTML = html;
}

function seleccionarFecha(fecha) {
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
  
  // Mostrar horarios
  mostrarHorarios();
}

function mostrarHorarios() {
  const contenedor = document.getElementById('horarios');
  let html = '';
  
  horariosDisponibles.forEach(hora => {
    // Simular disponibilidad (en realidad verificarías contra tu base de datos)
    const disponible = Math.random() > 0.3; // 70% de disponibilidad
    
    html += `
      <button class="hora-btn ${disponible ? 'disponible' : 'ocupado'}" 
              ${!disponible ? 'disabled' : ''}
              onclick="seleccionarHora('${hora}')">
        ${hora}
      </button>
    `;
  });
  
  contenedor.innerHTML = html;
}

function seleccionarHora(hora) {
  reservaEstado.hora = hora;
  
  // Actualizar UI
  document.querySelectorAll('.hora-btn').forEach(btn => {
    btn.classList.remove('seleccionado');
  });
  document.querySelector(`[onclick="seleccionarHora('${hora}')"]`).classList.add('seleccionado');
  
  // Mostrar botón confirmar
  document.getElementById('btn-confirmar-fecha').classList.remove('hidden');
}

// Paso 3: Formulario de datos
function inicializarFormulario() {
  document.getElementById('formulario-reserva').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    reservaEstado.datos = Object.fromEntries(formData);
    
    // Redirigir a página de pago
    window.location.href = `pago.html?servicio=${reservaEstado.servicio}&precio=${reservaEstado.precio}&fecha=${reservaEstado.fecha}&hora=${reservaEstado.hora}`;
  });
}

// Navegación entre pasos
function siguientePaso() {
  const pasos = ['paso-servicio', 'paso-fecha', 'paso-datos'];
  const pasoActual = pasos.find(paso => !document.getElementById(paso).classList.contains('hidden'));
  const siguientePaso = pasos[pasos.indexOf(pasoActual) + 1];
  
  if (siguientePaso) {
    document.getElementById(pasoActual).classList.add('hidden');
    document.getElementById(siguientePaso).classList.remove('hidden');
  }
}

function anteriorPaso() {
  const pasos = ['paso-servicio', 'paso-fecha', 'paso-datos'];
  const pasoActual = pasos.find(paso => !document.getElementById(paso).classList.contains('hidden'));
  const anteriorPaso = pasos[pasos.indexOf(pasoActual) - 1];
  
  if (anteriorPaso) {
    document.getElementById(pasoActual).classList.add('hidden');
    document.getElementById(anteriorPaso).classList.remove('hidden');
  }
}
