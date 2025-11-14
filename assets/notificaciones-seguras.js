// assets/notificaciones-seguras.js
const FALLBACK_EMAIL = 'el.oraculo.guardian@gmail.com';

const GAS_URL = (typeof window !== 'undefined' && window.GAS_URL)
  ? window.GAS_URL
  : 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';

async function postForm(url, payload) {
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    body.append(k, String(v));
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body,
      credentials: 'omit'
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        status: 'error',
        message: `HTTP ${res.status} ${res.statusText}`,
        data
      };
    }

    if (data && data.status) {
      return {
        status: data.status,
        message: data.message || '',
        data
      };
    }

    return {
      status: 'success',
      message: 'Reserva enviada (respuesta sin status claro)',
      data
    };
  } catch (e) {
    return { status: 'error', message: String(e) };
  }
}

window.notificador = {
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
      timestamp: new Date().toISOString()
    };

    if (!GAS_URL) {
      console.warn('[notificador] GAS_URL no definido. No se puede enviar la reserva.');
      return { status: 'error', message: 'GAS_URL no definido' };
    }

    return await postForm(GAS_URL, payload);
  },

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

