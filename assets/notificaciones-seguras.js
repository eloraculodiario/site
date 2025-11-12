const GAS_URL = 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';
const FALLBACK_EMAIL = 'el.oraculo.guardian@gmail.com';

const notificador = {
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
      timestamp: new Date().toISOString()
    };

    try {
      const r = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) {
        return { status: 'error', message: 'No se pudo confirmar el envío' };
      }
      return j;
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

