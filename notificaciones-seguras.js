// assets/notificaciones-seguras.js
// IMPORTANTE: usa application/x-www-form-urlencoded para evitar preflight CORS en Apps Script.
// Apps Script leerá los campos desde e.parameter y procesará la reserva correctamente.

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';
const FALLBACK_EMAIL = 'el.oraculo.guardian@gmail.com';

window.notificador = {
  async enviarReserva(datos) {
    // Empaquetamos los datos como form-urlencoded (simple CORS)
    const params = new URLSearchParams();
    params.set('tipo', 'reserva');
    params.set('servicio', datos.servicio);
    params.set('precio', datos.precio);
    params.set('duracion', datos.duracion);
    params.set('fecha', datos.fecha);
    params.set('hora', datos.hora);
    params.set('nombre', datos.nombre);
    params.set('telefono', datos.telefono);
    params.set('metodo', datos.metodo || '');
    params.set('consulta', datos.consulta || '');
    params.set('timestamp', new Date().toISOString());
    params.set('origen', 'formulario_web');

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'cors',           // ya no usamos 'no-cors'
        body: params            // NO pongas headers; fetch pondrá Content-Type: application/x-www-form-urlencoded
      });

      // Apps Script devuelve JSON; lo leemos si no es opaquo
      let ok = false;
      let message = 'Reserva enviada';
      try {
        const j = await res.json();
        ok = j && j.status === 'success';
        message = (j && j.message) || message;
      } catch {
        // Si por alguna razón no se pudo parsear JSON, asumimos que llegó al servidor
        ok = res.ok;
      }

      return ok
        ? { status: 'success', message }
        : { status: 'error', message: 'No se pudo confirmar la creación en Calendar' };

    } catch (e) {
      return { status: 'error', message: String(e) };
    }
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
  }
};

