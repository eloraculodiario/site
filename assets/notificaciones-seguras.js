// assets/notificaciones-seguras.js
const FALLBACK_EMAIL = 'el.oraculo.guardian@gmail.com';

// Usa window.GAS_URL si está definido en la página (reserva-personalizada.html lo define)
const GAS_URL = (typeof window !== 'undefined' && window.GAS_URL)
  ? window.GAS_URL
  : 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';

async function postConCors(url, payload) {
  // Intento 1: CORS "real"
  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // por si el usuario cierra/navega inmediatamente
    });

    const ctype = res.headers.get('content-type') || '';
    let data = null;

    if (ctype.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    } else {
      const text = await res.text().catch(() => '');
      try { data = JSON.parse(text); } catch { data = null; }
    }

    // Caso 1: JSON con success explícito
    if (res.ok && data && (data.status === 'success' || data.calendar?.success === true)) {
      console.debug('[notificador] Respuesta JSON success (CORS):', data);
      return { status: 'success', message: 'Reserva enviada (CORS)', data };
    }

    // Caso 2: JSON con error explícito
    if (res.ok && data && data.status === 'error') {
      console.warn('[notificador] Respuesta JSON error (CORS):', data);
      return { status: 'error', message: data.message || 'Error del servidor (CORS)', data };
    }

    // Caso 3: Respuesta OK pero no JSON interpretable → lo tratamos como éxito
    if (res.ok) {
      console.debug('[notificador] Respuesta OK sin JSON claro (CORS). Se asume éxito.');
      return { status: 'success', message: 'Reserva enviada (CORS sin JSON)' };
    }

    console.warn('[notificador] HTTP no OK (CORS):', res.status, res.statusText);
    return { status: 'error', message: `HTTP ${res.status} ${res.statusText}` };

  } catch (e) {
    // Intento 2: fallback sin CORS (respuesta opaca)
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      console.debug('[notificador] Envío en modo no-cors (fallback).');
      return { status: 'success', message: 'Reserva enviada (fallback no-cors)' };
    } catch (e2) {
      console.warn('[notificador] Falló también no-cors:', e2);
      return { status: 'error', message: String(e2) };
    }
  }
}

window.notificador = {
  /**
   * Envía una reserva al Apps Script (Telegram + Email + Calendar).
   */
  async enviarReserva(datos) {
    const payload = {
      tipo: 'reserva',
      servicio: datos.servicio,
      precio: datos.precio,
      duracion: datos.duracion,
      fecha: datos.fecha,
      hora: datos.hora,
      nombre: datos.nombre,
      telefono: datos.telefono,
      metodo: datos.metodo,
      consulta: datos.consulta || '',
      origen: datos.origen || 'web',
      timestamp: new Date().toISOString(),
    };
    if (!GAS_URL) {
      console.warn('[notificador] GAS_URL no definido. No se puede enviar la reserva.');
      return { status: 'error', message: 'GAS_URL no definido' };
    }
    return await postConCors(GAS_URL, payload);
  },

  /**
   * Fallback por email (abre el cliente del usuario con un borrador).
   */
  enviarFallback(datos) {
    const subject = `📅 NUEVA RESERVA - ${datos.servicio}`;
    const body = `
RESERVA DE TAROT - DATOS COMPLETOS:

📍 SERVICIO
• Servicio: ${datos.servicio}
• Precio: ${datos.precio}€
• Duración: ${datos.duracion} min
• Fecha: ${datos.fecha}
• Hora: ${datos.hora}

👤 CLIENTE
• Nombre: ${datos.nombre}
• Teléfono: ${datos.telefono}
• Método preferido: ${datos.metodo === 'whatsapp' ? 'WhatsApp' : 'Telegram'}

💭 CONSULTA
${datos.consulta || 'No especificada'}

⏰ TIMESTAMP
${new Date().toLocaleString('es-ES')}

---
📱 Enviado desde el formulario web de El oráculo diario
    `.trim();
    const mailtoUrl = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  },

  /**
   * Ping opcional para diagnóstico del endpoint (GET /exec).
   * Devuelve estado del servicio sin crear reservas.
   */
  async ping() {
    if (!GAS_URL) return { status: 'error', message: 'GAS_URL no definido' };
    try {
      const u = new URL(GAS_URL);
      u.searchParams.set('t', Date.now().toString());
      const res = await fetch(u.toString(), { method: 'GET', mode: 'cors' });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
};

