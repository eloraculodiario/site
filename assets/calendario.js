/* assets/calendario.js */
const MIN_ANTELACION_MIN = 120; // 2 horas

let reservaEstado = {
  servicio: null,
  precio: null,
  duracion: null,
  franja: null,
  fecha: null,
  hora: null,
  nombreServicio: null
};

const configFranjas = {
  '15': { intervalos: [0, 15, 30, 45], inicioManana: 9, finManana: 14, inicioTarde: 16, finTarde: 21 },
  '30': { intervalos: [0, 30], inicioManana: 9, finManana: 14, inicioTarde: 16, finTarde: 21 },
  '40': { intervalos: [0, 20, 40], inicioManana: 9, finManana: 14, inicioTarde: 16, finTarde: 21 },
  '60': { intervalos: [0], inicioManana: 9, finManana: 14, inicioTarde: 16, finTarde: 21 }
};

const serviciosInfo = {
  '60min':     { nombre: 'Lectura de 60 minutos', precio: 55, duracion: 60, franja: 60 },
  '40min':     { nombre: 'Lectura de 40 minutos', precio: 39, duracion: 40, franja: 40 },
  '20min':     { nombre: 'Lectura de 20 minutos', precio: 20, duracion: 20, franja: 15 },
  '1pregunta': { nombre: '1 Pregunta específica', precio: 6,  duracion: 15, franja: 15 },
  '2preguntas':{ nombre: '2 Preguntas',           precio: 12, duracion: 25, franja: 30 },
  '3preguntas':{ nombre: '3 Preguntas',           precio: 15, duracion: 35, franja: 30 }
};

const diasBloqueados = [];

// Usa window.GAS_URL si está definida (la inyectamos en reserva-personalizada.html)
const AVAIL_URL = (typeof window !== 'undefined' && window.GAS_URL)
  ? window.GAS_URL
  : 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';

/* ---------- Utilidades de fecha seguras (sin TZ raras) ---------- */
function parseISODate(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
  return new Date(y, (m - 1), d, 0, 0, 0, 0); // siempre local
}
function ymdFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function fetchOcupados(fecha, franja, duracion) {
  try {
    const u = new URL(AVAIL_URL);
    u.searchParams.set('action', 'availability');
    u.searchParams.set('date', fecha);
    u.searchParams.set('franja', String(franja));
    u.searchParams.set('duracion', String(duracion));

    const r = await fetch(u.toString(), {
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!r.ok) {
      console.warn('[calendario] AVAIL no OK:', r.status, r.statusText);
      return [];
    }

    const j = await r.json().catch(() => ({}));
    return Array.isArray(j.ocupados) ? j.ocupados : [];
  } catch (err) {
    console.warn('[calendario] Error availability:', err);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', function () {
  inicializarCalendario();
  inicializarFormulario();
  cargarReservaTemporal();
});

function inicializarCalendario() {
  const fecha = new Date();
  generarCalendario(fecha.getMonth(), fecha.getFullYear());

  const prev = document.getElementById('btn-mes-anterior');
  if (prev) {
    prev.addEventListener('click', function () {
      const header = document.getElementById('mes-actual');
      const mesActual = parseInt(header.dataset.mes, 10);
      const anioActual = parseInt(header.dataset.anio, 10);
      const f = new Date(anioActual, mesActual - 1, 1);
      f.setMonth(f.getMonth() - 1);
      generarCalendario(f.getMonth(), f.getFullYear());
    });
  }

  const next = document.getElementById('btn-mes-siguiente');
  if (next) {
    next.addEventListener('click', function () {
      const header = document.getElementById('mes-actual');
      const mesActual = parseInt(header.dataset.mes, 10);
      const anioActual = parseInt(header.dataset.anio, 10);
      const f = new Date(anioActual, mesActual - 1, 1);
      f.setMonth(f.getMonth() + 1);
      generarCalendario(f.getMonth(), f.getFullYear());
    });
  }
}

function generarCalendario(mes, anio) {
  const calendario = document.getElementById('calendario');
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();

  const nombresMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const header = document.getElementById('mes-actual');
  header.textContent = `${nombresMeses[mes]} ${anio}`;
  header.dataset.mes = (mes + 1).toString();
  header.dataset.anio = anio.toString();

  let html = '';
  html += '<div class="dias-semana">';
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(dia => { html += `<div class="dia-header">${dia}</div>`; });
  html += '</div>';

  html += '<div class="dias-mes">';
  // ISO lunes=0
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  for (let i = 0; i < primerDiaSemana; i++) html += '<div class="dia vacio"></div>';

  const hoyLocal = new Date();
  hoyLocal.setHours(0,0,0,0);
  const hoyMs = hoyLocal.getTime();

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const fechaObj = parseISODate(fechaStr);
    const esPasado = fechaObj.getTime() < hoyMs;
    const estaBloqueado = diasBloqueados.includes(fechaStr);
    const esSeleccionado = reservaEstado.fecha === fechaStr;

    let clases = 'dia';
    if (esPasado) clases += ' pasado';
    if (estaBloqueado) clases += ' bloqueado';
    if (esSeleccionado) clases += ' seleccionado';

    html += `<div class="${clases}" data-fecha="${fechaStr}" onclick="seleccionarFecha('${fechaStr}')">${d}</div>`;
  }

  html += '</div>';
  calendario.innerHTML = html;
}

function seleccionarFecha(fecha) {
  if (!reservaEstado.servicio) {
    alert('Por favor, selecciona un servicio primero.');
    return;
  }

  const f = parseISODate(fecha);
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  if (f.getTime() < hoy.getTime() || diasBloqueados.includes(fecha)) return;

  reservaEstado.fecha = fecha;

  document.querySelectorAll('.dia').forEach(d => d.classList.remove('seleccionado'));
  const el = document.querySelector(`[data-fecha="${fecha}"]`);
  if (el) el.classList.add('seleccionado');

  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('fecha-seleccionada-texto').textContent = f.toLocaleDateString('es-ES', opciones);
  document.getElementById('info-fecha').classList.remove('hidden');

  generarHorarios(fecha);
}

async function generarHorarios(fecha) {
  const contenedor = document.getElementById('horarios-container');
  const franja = String(reservaEstado.franja);
  const config = configFranjas[franja];

  if (!config) {
    contenedor.innerHTML = '<p class="text-center muted py-8">Error en la configuración de horarios</p>';
    return;
  }

  contenedor.innerHTML = '<p class="text-center muted py-8">Cargando horarios…</p>';

  const horarios = calcularHorariosDisponibles(fecha, config);

  if (horarios.length === 0) {
    contenedor.innerHTML = '<p class="text-center muted py-8">No hay horarios disponibles para esta fecha</p>';
    return;
  }

  const duracionMin = parseInt(reservaEstado.duracion || reservaEstado.franja || 30, 10);
  let ocupados = [];
  try {
    ocupados = await fetchOcupados(fecha, parseInt(franja, 10), duracionMin);
  } catch (_) {
    ocupados = [];
  }

  let html = '';
  horarios.forEach(horario => {
    const ocupado = ocupados.includes(horario);
    html += `
      <button class="hora-btn ${ocupado ? 'ocupado' : 'disponible'}"
              ${ocupado ? 'disabled' : ''}
              onclick="${ocupado ? '' : `seleccionarHora('${horario}')`}">
        ${horario}
        <div class="text-xs mt-1 opacity-75">${franja} min</div>
      </button>`;
  });

  contenedor.innerHTML = html;
}

function calcularHorariosDisponibles(fecha, config) {
  const horarios = [];
  const ahora = new Date();

  const fechaSeleccionada = parseISODate(fecha);
  const esHoy = ymdFromDate(fechaSeleccionada) === ymdFromDate(ahora);

  const duracionMin = parseInt(reservaEstado.duracion || reservaEstado.franja || 30, 10);

  const slotValidoPorAntelacion = (hh, mm) => {
    if (!esHoy) return true;
    const slot = new Date();
    slot.setHours(hh, mm, 0, 0);
    const diffMin = Math.floor((slot.getTime() - ahora.getTime()) / 60000);
    return diffMin >= MIN_ANTELACION_MIN;
  };

  // Mañana
  for (let hora = config.inicioManana; hora < config.finManana; hora++) {
    for (const minuto of config.intervalos) {
      if (!slotValidoPorAntelacion(hora, minuto)) continue;
      horarios.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`);
    }
  }

  // Tarde (evitar que el final se pase de finTarde)
  for (let hora = config.inicioTarde; hora < config.finTarde; hora++) {
    for (const minuto of config.intervalos) {
      const finTeorico = new Date(0, 0, 0, hora, minuto + duracionMin);
      const finH = finTeorico.getHours();
      const finM = finTeorico.getMinutes();
      // Si rebasa EXACTAMENTE la hora de cierre con minutos > 0, descartar
      if (finH > config.finTarde || (finH === config.finTarde && finM > 0)) continue;
      if (!slotValidoPorAntelacion(hora, minuto)) continue;
      horarios.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`);
    }
  }

  return horarios;
}

function seleccionarHora(hora) {
  reservaEstado.hora = hora;

  document.querySelectorAll('.hora-btn').forEach(btn => btn.classList.remove('seleccionado'));
  const btn = document.querySelector(`[onclick="seleccionarHora('${hora}')"]`);
  if (btn) btn.classList.add('seleccionado');

  const formC = document.getElementById('formulario-contacto');
  if (formC) formC.classList.remove('hidden');
  actualizarResumenReserva();
  document.getElementById('formulario-contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function actualizarResumenReserva() {
  const fechaObj = parseISODate(reservaEstado.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const resumen = `${reservaEstado.nombreServicio} — ${fechaFormateada} a las ${reservaEstado.hora}`;
  const el = document.getElementById('resumen-reserva');
  if (el) el.textContent = resumen;
}

function seleccionarServicio(servicio) {
  const servicioInfo = serviciosInfo[servicio];
  if (!servicioInfo) return;

  reservaEstado.servicio = servicio;
  reservaEstado.precio = servicioInfo.precio;
  reservaEstado.duracion = servicioInfo.duracion;
  reservaEstado.franja = servicioInfo.franja;
  reservaEstado.nombreServicio = servicioInfo.nombre;

  // Render resumen de servicio seleccionado
  const elNom = document.getElementById('nombre-servicio');
  const elPre = document.getElementById('precio-servicio');
  const elDur = document.getElementById('duracion-servicio');
  const elFra = document.getElementById('franja-servicio');
  if (elNom) elNom.textContent = servicioInfo.nombre;
  if (elPre) elPre.textContent = servicioInfo.precio + '€';
  if (elDur) elDur.textContent = servicioInfo.duracion + ' minutos de duración';
  if (elFra) elFra.textContent = 'Franjas de ' + servicioInfo.franja + ' minutos';

  document.getElementById('servicio-seleccionado')?.classList.remove('hidden');

  // Reset selección de fecha/hora
  reservaEstado.fecha = null;
  reservaEstado.hora = null;
  document.getElementById('info-fecha')?.classList.add('hidden');
  document.getElementById('formulario-contacto')?.classList.add('hidden');
  document.querySelectorAll('.dia.seleccionado').forEach(d => d.classList.remove('seleccionado'));
  document.querySelectorAll('.hora-btn.seleccionado').forEach(b => b.classList.remove('seleccionado'));

  const hc = document.getElementById('horarios-container');
  if (hc) {
    hc.innerHTML = `<p class="text-center muted py-8">Ahora selecciona una fecha para ver horarios disponibles en franjas de ${servicioInfo.franja} minutos</p>`;
  }

  document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  guardarReservaTemporal();
}

function deseleccionarServicio() {
  reservaEstado = {
    servicio: null, precio: null, duracion: null, franja: null,
    fecha: null, hora: null, nombreServicio: null
  };

  document.getElementById('servicio-seleccionado')?.classList.add('hidden');
  document.getElementById('info-fecha')?.classList.add('hidden');
  document.getElementById('formulario-contacto')?.classList.add('hidden');

  const hc = document.getElementById('horarios-container');
  if (hc) hc.innerHTML = '<p class="text-center muted py-8">Selecciona un servicio y una fecha para ver horarios disponibles</p>';

  document.querySelectorAll('.dia.seleccionado').forEach(d => d.classList.remove('seleccionado'));
  document.querySelectorAll('.hora-btn.seleccionado').forEach(b => b.classList.remove('seleccionado'));

  limpiarReservaTemporal();
}

function inicializarFormulario() {
  const formulario = document.getElementById('formulario-reserva');
  if (!formulario) return;

  formulario.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!reservaEstado.servicio || !reservaEstado.fecha || !reservaEstado.hora) {
      alert('Por favor, completa toda la información de la reserva.');
      return;
    }

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      alert(errorValidacion);
      return;
    }

    const formData = new FormData(this);
    const metodo = formData.get('metodo');
    const datosReserva = {
      servicio: reservaEstado.nombreServicio,
      precio: String(reservaEstado.precio),
      duracion: String(reservaEstado.duracion),
      fecha: reservaEstado.fecha,
      hora: reservaEstado.hora,
      nombre: (formData.get('nombre') || '').toString().trim(),
      telefono: (formData.get('telefono') || '').toString().trim(),
      metodo,
      consulta: (formData.get('consulta') || '').toString().trim(),
      timestamp: new Date().toISOString(),
      origen: 'formulario_web'
    };

    const btn = document.getElementById('btn-enviar');
    const btnOriginal = btn ? btn.innerHTML : null;
    if (btn) {
      btn.innerHTML = '📤 Enviando reserva...';
      btn.disabled = true;
    }
    mostrarLoading();

    try {
      const resultado = await window.notificador.enviarReserva(datosReserva);
      if (resultado && resultado.status === 'success') {
        mostrarConfirmacionExito(datosReserva);
      } else {
        const msg = resultado?.message || 'Error desconocido al enviar la reserva';
        throw new Error(msg);
      }
    } catch (error) {
      mostrarErrorReserva(datosReserva, error.message || String(error));
    } finally {
      if (btn && btnOriginal !== null) {
        btn.innerHTML = btnOriginal;
        btn.disabled = false;
      }
      ocultarLoading();
    }
  });
}

function validarFormulario() {
  const nombre = (document.querySelector('input[name="nombre"]')?.value || '').trim();
  const telefono = (document.querySelector('input[name="telefono"]')?.value || '').trim();
  const metodo = document.querySelector('input[name="metodo"]:checked');

  if (!nombre || nombre.length < 2) return 'Por favor, ingresa tu nombre completo (mínimo 2 caracteres).';
  if (!telefono) return 'Por favor, ingresa tu número de teléfono.';
  if (!/^[\+]?[0-9\s\-\(\)]{7,}$/.test(telefono)) return 'Por favor, ingresa un número de teléfono válido.';
  if (!metodo) return 'Por favor, selecciona un método de comunicación (WhatsApp o Telegram).';

  const [hh, mm] = (reservaEstado.hora || '00:00').split(':').map(Number);
  const dt = parseISODate(reservaEstado.fecha);
  dt.setHours(hh, mm, 0, 0);
  const diffMin = Math.floor((dt.getTime() - Date.now()) / 60000);
  if (diffMin < MIN_ANTELACION_MIN) return `Debe reservarse con al menos ${MIN_ANTELACION_MIN / 60} horas de antelación.`;

  return null;
}

function mostrarConfirmacionExito(datos) {
  const fechaObj = parseISODate(datos.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const cont = document.getElementById('formulario-contacto');
  if (!cont) return;
  cont.innerHTML = `
    <div class="text-center py-8">
      <div class="text-6xl mb-4">✅</div>
      <h3 class="text-2xl font-bold mb-4">¡Reserva Confirmada!</h3>
      <div class="card max-w-md mx-auto text-left mb-6 bg-green-900/20 border-green-400">
        <h4 class="font-bold mb-3 text-green-300">📋 Detalles de tu reserva:</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span>Servicio:</span><strong>${datos.servicio}</strong></div>
          <div class="flex justify-between"><span>Fecha:</span><strong>${fechaFormateada}</strong></div>
          <div class="flex justify-between"><span>Hora:</span><strong>${datos.hora}</strong></div>
          <div class="flex justify-between"><span>Duración:</span><strong>${datos.duracion} minutos</strong></div>
          <div class="flex justify-between"><span>Precio:</span><strong>${datos.precio}€</strong></div>
          <div class="flex justify-between"><span>Método:</span><strong>${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</strong></div>
        </div>
      </div>
      <div class="bg-blue-900/20 border border-blue-400 rounded-lg p-4 mb-6">
        <p class="text-blue-300 mb-2">✅ <strong>Notificación enviada correctamente</strong></p>
        <p class="text-sm muted">
          Te contactaré por <strong>${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</strong>
          en menos de 24 horas para coordinar detalles y el pago.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button onclick="location.reload()" class="btn btn-primary">🔮 Hacer otra reserva</button>
        <button onclick="window.print()" class="btn btn-ghost">📄 Imprimir confirmación</button>
      </div>
      <p class="text-xs muted mt-6">Guarda esta información para referencia.</p>
    </div>
  `;
  cont.scrollIntoView({ behavior: 'smooth' });
  limpiarReservaTemporal();
}

function mostrarErrorReserva(datos, errorMsg) {
  const intentarFallback = confirm(`❌ Error al enviar la reserva automáticamente:\n\n"${errorMsg}"\n\n¿Quieres enviar la reserva por email como respaldo?`);
  if (intentarFallback) {
    window.notificador.enviarFallback(datos);
    alert('✅ Se abrirá tu cliente de email. Envía el mensaje generado para completar tu reserva.');
  } else {
    const metodoContacto = datos.metodo === 'whatsapp' ? 'WhatsApp: +34TU_NUMERO' : 'Telegram: @ElOraculoDiario';
    alert(`📞 Puedes contactarnos directamente:\n\n${metodoContacto}\n\nMenciona tu reserva: ${datos.servicio} — ${datos.fecha} ${datos.hora}`);
  }
}

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

function guardarReservaTemporal() {
  if (reservaEstado.servicio) {
    try { localStorage.setItem('reservaTemporal', JSON.stringify(reservaEstado)); } catch {}
  }
}

function cargarReservaTemporal() {
  try {
    const temporal = localStorage.getItem('reservaTemporal');
    if (!temporal) return;
    const datos = JSON.parse(temporal);
    if (datos.servicio && serviciosInfo[datos.servicio]) {
      seleccionarServicio(datos.servicio);
      if (datos.fecha) {
        setTimeout(() => seleccionarFecha(datos.fecha), 300);
      }
    }
  } catch (e) {
    localStorage.removeItem('reservaTemporal');
  }
}

function limpiarReservaTemporal() {
  try { localStorage.removeItem('reservaTemporal'); } catch {}
}

// Exponer funciones usadas por los botones inline del HTML
window.seleccionarServicio = seleccionarServicio;
window.seleccionarFecha = seleccionarFecha;
window.seleccionarHora = seleccionarHora;

