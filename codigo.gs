const CONFIG = {
  telegram: {
    botToken: '8522609669:AAHH16OAvDtdOq5kZj9olhntuPgkjBiIakU',
    chatId: '5176952354'
  },
  email: {
    destinatario: 'el.oraculo.guardian@gmail.com',
    asuntoBase: '📅 Nueva Reserva - El Oráculo Diario'
  },
  negocio: {
    nombre: 'El Oráculo Diario',
    web: 'https://eloraculodiario.github.io'
  },
  calendar: {
    calendarId: 'el.oraculo.guardian@gmail.com', // puedes usar 'primary' si quieres
    timezone: 'Europe/Madrid'
  },
  politicas: {
    minimoHorasAntelacion: 2
  }
};

/* =========================
   HELPERS COMUNES (CORS)
   ========================= */
function jsonOutput(obj, code) {
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  out.setHeader('Access-Control-Allow-Origin', '*');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  out.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  if (code) out.setHeader('X-Status-Code', String(code));
  return out;
}

function _getCalendar() {
  const cal = CONFIG.calendar.calendarId
    ? CalendarApp.getCalendarById(CONFIG.calendar.calendarId)
    : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error('No se pudo abrir el calendario (calendarId incorrecto o sin permisos).');
  return cal;
}

/**
 * Determina si un servicio es de tipo "por preguntas"
 * (1 pregunta, 2 preguntas, 3 preguntas...)
 */
function esServicioDePreguntas(servicio) {
  const s = (servicio || '').toString().toLowerCase();
  return s.indexOf('pregunta') !== -1;
}

/* ======================================
   ENDPOINTS
   ====================================== */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};

    // Health: verifica acceso a Calendar
    if (p.action === 'health') {
      let calendarReady = false;
      let tz = Session.getScriptTimeZone();
      try {
        const cal = _getCalendar();
        calendarReady = !!cal;
      } catch (_) { calendarReady = false; }
      return jsonOutput({
        status: 'active',
        message: '✅ Servicio operativo',
        timestamp: new Date().toISOString(),
        version: '4.4',
        timeZone: tz,
        calendar_ready: calendarReady,
        calendarId: CONFIG.calendar.calendarId || '(default)'
      });
    }

    // Disponibilidad del día
    if (p.action === 'availability') {
      const date = p.date;
      const franja = parseInt(p.franja || '30', 10);
      const duracion = parseInt(p.duracion || String(franja), 10);
      if (!date) throw new Error('Falta parámetro "date"');

      const data = calcularDisponibilidadDia(date, franja, duracion);
      return jsonOutput({ status: 'ok', date, franja, duracion, ocupados: data.ocupados });
    }

    // Respuesta "root"
    let calendarReady = false;
    try { _getCalendar(); calendarReady = true; } catch (_) {}
    return jsonOutput({
      status: 'active',
      message: '✅ Servicio de notificaciones funcionando',
      timestamp: new Date().toISOString(),
      version: '4.4',
      servicios: ['Telegram', 'Email Gmail', 'Google Calendar', 'Sheets (opcional)'],
      config: { email: CONFIG.email.destinatario, negocio: CONFIG.negocio.nombre },
      calendar_ready: calendarReady,
      calendarId: CONFIG.calendar.calendarId || '(default)'
    });
  } catch (err) {
    return jsonOutput({ status: 'error', message: 'Error en doGet: ' + err.message });
  }
}

function doPost(e) {
  try {
    if (!e) throw new Error('Solicitud vacía');

    let data = {};

    // 1) Si viene JSON
    if (e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1) {
      try {
        data = JSON.parse(e.postData.contents || '{}');
      } catch (_jsonErr) {
        data = {};
      }
    }

    // 2) Volcar e.parameter (form-urlencoded estándar de GAS)
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      Object.keys(e.parameter).forEach(function (k) {
        data[k] = e.parameter[k];
      });
    }

    // 3) Si sigue vacío, parsear manualmente el cuerpo urlencoded (por seguridad extra)
    if ((!data || Object.keys(data).length === 0) &&
        e.postData && e.postData.contents) {
      const body = e.postData.contents; // ej: "tipo=reserva&servicio=Lectura..."
      const parts = body.split('&');
      parts.forEach(function (part) {
        if (!part) return;
        const eq = part.indexOf('=');
        let k, v;
        if (eq >= 0) {
          k = decodeURIComponent(part.substring(0, eq));
          v = decodeURIComponent(part.substring(eq + 1));
        } else {
          k = decodeURIComponent(part);
          v = '';
        }
        if (k) data[k] = v;
      });
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('No se recibieron datos en la solicitud');
    }

    const reserva = normalizarReserva(data);
    const resultado = procesarReserva(reserva);
    return jsonOutput(resultado);

  } catch (error) {
    return jsonOutput({
      status: 'error',
      message: 'Error procesando la solicitud: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/* ======================================
   LÓGICA DE RESERVA
   ====================================== */
function procesarReserva(reserva) {
  try {
    const esPreguntas = esServicioDePreguntas(reserva.servicio);

    // Para servicios de preguntas: ignoramos fecha/hora del formulario
    // y creamos un bloque técnico 24h después del timestamp.
    if (esPreguntas) {
      const base = reserva.timestamp ? new Date(reserva.timestamp) : new Date();
      const objetivo = new Date(base.getTime() + 24 * 60 * 60 * 1000); // +24h

      const yy = objetivo.getFullYear();
      const mm = ('0' + (objetivo.getMonth() + 1)).slice(-2);
      const dd = ('0' + objetivo.getDate()).slice(-2);
      const hh = ('0' + objetivo.getHours()).slice(-2);
      const mi = ('0' + objetivo.getMinutes()).slice(-2);

      reserva.fecha = `${yy}-${mm}-${dd}`;
      reserva.hora  = `${hh}:${mi}`;
      // Duración técnica mínima para bloquear el calendario (2 minutos)
      if (!reserva.duracion) reserva.duracion = '2';
    }

    const faltantes = ['nombre', 'servicio', 'fecha', 'hora', 'duracion', 'precio'].filter(c => !reserva[c]);
    if (faltantes.length) {
      return {
        status: 'error',
        message: 'Datos incompletos. Faltan: ' + faltantes.join(', '),
        timestamp: new Date().toISOString()
      };
    }

    const verif = verificarAntelacion(reserva.fecha, reserva.hora, CONFIG.politicas.minimoHorasAntelacion);
    if (!verif.ok) {
      return {
        status: 'error',
        message:
          `La reserva debe realizarse con al menos ${CONFIG.politicas.minimoHorasAntelacion} horas de antelación. ` +
          `Seleccionado: ${reserva.fecha} ${reserva.hora} (${verif.diffMinutos} min restantes)`,
        timestamp: new Date().toISOString()
      };
    }

    // 1️⃣ Primero calendario (si falla, NO mandamos Telegram ni email)
    const rCalendar = crearEventoCalendar(reserva);
    if (!rCalendar || !rCalendar.success) {
      return {
        status: 'error',
        message: rCalendar && rCalendar.error
          ? rCalendar.error
          : 'Error al crear el evento en el calendario.',
        calendar: rCalendar || null,
        timestamp: new Date().toISOString()
      };
    }

    // 2️⃣ Si el calendario ha ido bien: Telegram + Email + (opcional) Sheets
    const rTelegram = enviarNotificacionTelegram(reserva);
    const rEmail    = enviarNotificacionEmail(reserva);
    const rSheets   = guardarEnSheets(reserva);

    return {
      status: 'success',
      message: 'Reserva procesada (Calendar + Telegram + Email)',
      timestamp: new Date().toISOString(),
      telegram: rTelegram,
      email: rEmail,
      calendar: rCalendar,
      sheets: rSheets
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function normalizarReserva(data) {
  const precioRaw = (data.precio ?? '').toString().replace(',', '.').trim();
  const durRaw    = (data.duracion ?? '').toString().replace(' min', '').replace(' minutos', '').trim();
  return {
    tipo:      (data.tipo || 'reserva').toString(),
    servicio:  (data.servicio || '').toString(),
    precio:    precioRaw,
    duracion:  durRaw,
    fecha:     (data.fecha || '').toString(),
    hora:      (data.hora || '').toString(),
    nombre:    (data.nombre || '').toString(),
    telefono:  (data.telefono || '').toString(),
    metodo:    (data.metodo || '').toString(),
    consulta:  (data.consulta || '').toString(),
    timestamp: data.timestamp || new Date().toISOString(),
    origen:    (data.origen || 'web').toString()
  };
}

function verificarAntelacion(fechaISO, horaHM, minimoHoras) {
  try {
    const [y, m, d] = fechaISO.split('-').map(Number);
    const [hh, mm]  = horaHM.split(':').map(Number);
    const inicio    = new Date(y, (m - 1), d, hh, mm, 0, 0);
    const ahora     = new Date();
    const diffMs    = inicio.getTime() - ahora.getTime();
    const diffMin   = Math.floor(diffMs / 60000);
    return { ok: diffMin >= minimoHoras * 60, diffMinutos: diffMin };
  } catch (e) {
    return { ok: false, diffMinutos: -1 };
  }
}

function enviarNotificacionTelegram(reserva) {
  try {
    const esPreguntas = esServicioDePreguntas(reserva.servicio);

    const lineaFecha = esPreguntas
      ? `*Plazo estimado:* respuesta en las próximas 24 horas`
      : `*Fecha:* ${formatearFechaBonita(reserva.fecha)}`;

    const lineaHora = esPreguntas
      ? ''
      : `\n*Hora:* ${reserva.hora}`;

    const lineaDuracion = esPreguntas
      ? `*Duración (bloque calendario):* ${reserva.duracion} min`
      : `*Duración:* ${reserva.duracion} min`;

    const mensaje =
`🃏 *NUEVA RESERVA DE TAROT* 🃏

*Servicio:* ${reserva.servicio}
*Precio:* ${reserva.precio}€
${lineaDuracion}
${lineaFecha}${lineaHora}

*Cliente:* ${reserva.nombre}
*Teléfono:* ${reserva.telefono}
*Método:* ${reserva.metodo}

*Consulta:*
${reserva.consulta || 'No especificada'}

*Políticas:*
• Todos los servicios son previo pago
• Reservas con mínimo ${CONFIG.politicas.minimoHorasAntelacion} horas de antelación
• Cambios y cancelaciones con más de ${CONFIG.politicas.minimoHorasAntelacion} horas

📧 *Email enviado a:* ${CONFIG.email.destinatario}`;

    const url = `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        chat_id: CONFIG.telegram.chatId,
        text: mensaje,
        parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText() || '{}');
    if (!json.ok) return { success: false, error: json.description || 'Error Telegram', response: json };
    return { success: true, messageId: json.result.message_id, timestamp: new Date().toISOString() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function enviarNotificacionEmail(reserva) {
  try {
    const esPreguntas = esServicioDePreguntas(reserva.servicio);

    const fechaFormateada = esPreguntas
      ? 'Dentro de las próximas 24 horas'
      : formatearFechaBonita(reserva.fecha);

    const horaMostrada = esPreguntas
      ? 'No aplica (respuesta asíncrona)'
      : reserva.hora;

    const duracionTexto = esPreguntas
      ? `${reserva.duracion} minutos (bloque técnico de calendario)`
      : `${reserva.duracion} minutos`;

    const accionesHtml = esPreguntas
      ? `
        <li>Responder al cliente por ${reserva.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'} en menos de 24h</li>
        <li>Coordinar método de pago</li>
        <li>Registrar internamente la hora real de envío si lo necesitas</li>
      `
      : `
        <li>Contactar al cliente por ${reserva.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'} en menos de 24h</li>
        <li>Confirmar disponibilidad de la fecha y hora</li>
        <li>Coordinar método de pago</li>
        <li>Enviar recordatorio 1 hora antes de la sesión</li>
      `;

    const accionesTexto = esPreguntas
      ? `
ACCIONES:
- Responder al cliente en menos de 24h
- Coordinar método de pago
- Registrar internamente la hora real de envío si lo necesitas
`
      : `
ACCIONES:
- Contactar al cliente en menos de 24h
- Confirmar disponibilidad de la fecha y hora
- Coordinar método de pago
- Enviar recordatorio 1 hora antes de la sesión
`;

    const asunto = `${CONFIG.email.asuntoBase} - ${reserva.servicio}`;
    const cuerpoHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed, #d946ef); color: white; padding: 20px; border-radius: 10px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .reserva-info { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #7c3aed; }
    .cliente-info { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #d946ef; }
    .badge { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #10b981; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    table td { vertical-align: top; }
  </style>
</head><body>
  <div class="container">
    <div class="header"><h1>✨ Nueva Reserva Recibida</h1><p>${CONFIG.negocio.nombre}</p></div>
    <div class="content">
      <div style="text-align:center;margin-bottom:20px;">
        <span class="badge badge-success">RESERVA REGISTRADA</span>
        <span class="badge badge-warning">PENDIENTE DE PAGO</span>
      </div>
      <div class="reserva-info">
        <h3>📋 Detalles de la Reserva</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Servicio:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${reserva.servicio}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Precio:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${reserva.precio}€</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Duración:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${duracionTexto}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>${esPreguntas ? 'Plazo de respuesta:' : 'Fecha:'}</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${fechaFormateada}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Hora:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${horaMostrada}</td></tr>
        </table>
      </div>
      <div class="cliente-info">
        <h3>👤 Información del Cliente</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Nombre:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${reserva.nombre}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Teléfono:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${reserva.telefono}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Método de contacto:</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${reserva.metodo === 'whatsapp' ? 'WhatsApp 💚' : 'Telegram 💙'}</td></tr>
        </table>
      </div>
      ${reserva.consulta ? `<div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #8b5cf6;margin-top:15px;"><h3>💬 Consulta del Cliente</h3><p style="font-style:italic;margin:0;">"${reserva.consulta}"</p></div>` : ''}
      <div style="background:#f0f9ff;padding:15px;border-radius:8px;margin-top:20px;border:1px solid #bae6fd;">
        <h4>📞 Acciones Requeridas</h4>
        <ul style="margin:0;padding-left:20px;">
          ${accionesHtml}
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>⚡ Notificación automática generada por ${CONFIG.negocio.nombre}</p>
      <p>🕒 Recibido: ${new Date().toLocaleString('es-ES')}</p>
      <p>🌐 ${CONFIG.negocio.web}</p>
    </div>
  </div>
</body></html>`;

    const cuerpoTexto = `
NUEVA RESERVA - ${CONFIG.negocio.nombre}
=========================================

📋 DETALLES DE LA RESERVA:
Servicio: ${reserva.servicio}
Precio: ${reserva.precio}€
Duración: ${duracionTexto}
${esPreguntas ? 'Plazo de respuesta (orientativo): ' + fechaFormateada : 'Fecha: ' + fechaFormateada}
Hora: ${horaMostrada}

👤 INFORMACIÓN DEL CLIENTE:
Nombre: ${reserva.nombre}
Teléfono: ${reserva.telefono}
Método: ${reserva.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}

💬 CONSULTA:
${reserva.consulta || 'No especificada'}

Políticas:
• Todos los servicios son previo pago
• Reservas con mínimo ${CONFIG.politicas.minimoHorasAntelacion} horas de antelación
• Cambios y cancelaciones con más de ${CONFIG.politicas.minimoHorasAntelacion} horas
${accionesTexto}

🕒 Recibido: ${new Date().toLocaleString('es-ES')}
🌐 ${CONFIG.negocio.web}
`.trim();

    MailApp.sendEmail({
      to: CONFIG.email.destinatario,
      subject: asunto,
      body: cuerpoTexto,
      htmlBody: cuerpoHtml
    });
    return { success: true, destinatario: CONFIG.email.destinatario, timestamp: new Date().toISOString() };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function crearEventoCalendar(reserva) {
  try {
    const cal = _getCalendar();
    const esPreguntas = esServicioDePreguntas(reserva.servicio);

    // Para preguntas, bloque técnico corto (2 min); para el resto, duración real
    const durMin = esPreguntas ? 2 : (parseInt(reserva.duracion, 10) || 30);
    const { inicio, fin } = construirIntervaloFechaHora(reserva.fecha, reserva.hora, durMin);

    // Antelación
    const now = new Date();
    const leadMs = (CONFIG.politicas.minimoHorasAntelacion || 2) * 60 * 60 * 1000;
    if (inicio.getTime() - now.getTime() < leadMs) {
      return {
        success: false,
        error: `La reserva debe hacerse con al menos ${CONFIG.politicas.minimoHorasAntelacion} horas de antelación.`
      };
    }

    // Solapes
    const overlapping = cal.getEvents(inicio, fin);
    if (overlapping && overlapping.length > 0) {
      return { success: false, error: 'Ese horario ya está ocupado en el calendario.' };
    }

    const titulo = `🔮 ${reserva.servicio} — ${reserva.nombre}`;

    // Deduplicación (mismo día, misma hora, mismo título)
    const existentes = cal.getEventsForDay(inicio) || [];
    const dup = existentes.find(ev =>
      ev.getTitle() === titulo &&
      Math.abs(ev.getStartTime().getTime() - inicio.getTime()) < 60000 &&
      Math.abs(ev.getEndTime().getTime() - fin.getTime()) < 60000
    );
    if (dup) {
      return {
        success: true,
        eventId: dup.getId(),
        start: dup.getStartTime().toISOString(),
        end: dup.getEndTime().toISOString(),
        note: 'Evento ya existía (deduplicado)'
      };
    }

    const lineasDescripcion = [
      `Servicio: ${reserva.servicio}`,
      `Precio: ${reserva.precio}€`,
      `Duración: ${durMin} min${esPreguntas ? ' (bloque técnico por preguntas)' : ''}`,
      `Cliente: ${reserva.nombre}`,
      `Teléfono: ${reserva.telefono}`,
      `Método: ${reserva.metodo === 'whatsapp' ? 'WhatsApp 💚' : 'Telegram 💙'}`,
      `Consulta: ${reserva.consulta || 'No especificada'}`,
      '',
      'POLÍTICAS:',
      `• Reservas con mínimo ${CONFIG.politicas.minimoHorasAntelacion} horas de antelación`,
      `• Cambios y cancelaciones con más de ${CONFIG.politicas.minimoHorasAntelacion} horas`
    ];

    if (esPreguntas) {
      lineasDescripcion.push(
        '',
        'NOTA:',
        'Este evento es un recordatorio interno para responder una lectura por preguntas dentro de las próximas 24 horas.'
      );
    }

    const descripcion = lineasDescripcion.join('\n');

    const evento = cal.createEvent(titulo, inicio, fin, {
      description: descripcion,
      location: 'Online'
    });

    try { evento.removeAllReminders(); } catch (_) {}
    evento.addEmailReminder(60);
    evento.addPopupReminder(10);

    return {
      success: true,
      eventId: evento.getId(),
      start: inicio.toISOString(),
      end: fin.toISOString()
    };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function construirIntervaloFechaHora(fechaISO, horaHM, duracionMin) {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const [hh, mm] = horaHM.split(':').map(Number);
  const inicio = new Date(y, m - 1, d, hh, mm, 0, 0);
  const fin = new Date(inicio.getTime() + (duracionMin || 30) * 60000);
  return { inicio, fin };
}

function guardarEnSheets(reserva) {
  try {
    const sheetId = null; // pon tu ID si usas Sheets
    if (!sheetId) return { success: true, message: 'Sheets no configurado (opcional)' };
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    sheet.appendRow([
      new Date(),
      reserva.nombre,
      reserva.telefono,
      reserva.servicio,
      reserva.precio,
      reserva.duracion,
      reserva.fecha,
      reserva.hora,
      reserva.metodo,
      reserva.consulta || 'No especificada',
      'Pendiente'
    ]);
    return { success: true, message: 'Guardado en Sheets' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function formatearFechaBonita(yyyy_mm_dd) {
  try {
    const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
    const f = new Date(y, m - 1, d);
    return f.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (_e) {
    return yyyy_mm_dd;
  }
}

function calcularDisponibilidadDia(fechaISO, franjaMin, duracionMin) {
  const cal = _getCalendar();

  const [y, m, d] = fechaISO.split('-').map(Number);
  const dia = new Date(y, m - 1, d);
  const eventos = cal.getEventsForDay(dia) || [];
  const intervals = eventos.map(ev => ({
    ini: ev.getStartTime().getTime(),
    fin: ev.getEndTime().getTime()
  }));
  const ocupados = [];

  for (let hh = 0; hh < 24; hh++) {
    for (let mm = 0; mm < 60; mm += franjaMin) {
      const ini = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
      const fin = ini + duracionMin * 60000;
      const overlap = intervals.some(iv => ini < iv.fin && fin > iv.ini);
      if (overlap) ocupados.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    }
  }
  return { ocupados };
}

/* ======================================
   SELF-TEST (para autorizar Calendar)
   Ejecuta _selfTestOnce() con ▶️
   ====================================== */
function _selfTestOnce() {
  const cal = _getCalendar();

  const now = new Date();
  const inicio = new Date(now.getTime() + 5 * 60000);
  const fin    = new Date(inicio.getTime() + 5 * 60000);
  const titulo = '🔧 SELF-TEST Oráculo Diario';

  const ev = cal.createEvent(titulo, inicio, fin, { description: 'Prueba de permisos' });
  try { ev.removeAllReminders(); } catch (_) {}
  Logger.log('Creado evento de prueba: ' + ev.getId());

  ev.deleteEvent();
  Logger.log('Evento de prueba eliminado. ✅');

  return 'OK: Calendar autorizado y operativo.';
}

/* ======================================
   TEST MANUAL DE RESERVA
   Ejecuta _testReservaManual() con ▶️
   ====================================== */
function _testReservaManual() {
  const reserva = {
    tipo:      'reserva',
    servicio:  'Lectura de 60 minutos',
    precio:    '55',
    duracion:  '60',
    fecha:     '2025-11-15',     // cambia a una fecha futura
    hora:      '16:00',          // y una hora
    nombre:    'TEST ORACULO',
    telefono:  '600000000',
    metodo:    'whatsapp',
    consulta:  'Reserva de prueba desde _testReservaManual',
    timestamp: new Date().toISOString(),
    origen:    'test_manual'
  };

  const resultado = procesarReserva(reserva);
  Logger.log(JSON.stringify(resultado, null, 2));
  return resultado;
}

/**
 * TEST PARA PREGUNTAS
 * Ejecuta _testReservaPregunta() con ▶️ para probar el flujo 1/2/3 preguntas
 */
function _testReservaPregunta() {
  const reserva = {
    tipo:      'reserva',
    servicio:  '2 Preguntas',
    precio:    '12',
    duracion:  '30',     // el backend lo convertirá a bloque técnico corto
    fecha:     '',       // se ignorará y se usará timestamp + 24h
    hora:      '',
    nombre:    'TEST PREGUNTAS',
    telefono:  '600000001',
    metodo:    'telegram',
    consulta:  'Prueba de servicio por preguntas',
    timestamp: new Date().toISOString(),
    origen:    'test_preguntas'
  };

  const resultado = procesarReserva(reserva);
  Logger.log(JSON.stringify(resultado, null, 2));
  return resultado;
}
