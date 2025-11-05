// assets/notificaciones-seguras.js - VERSIÓN CORREGIDA
class NotificadorReservas {
    constructor() {
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbze-n4YpKul3q2dXtCUr1Xc0IUjKJeNhs3mzC-db2Sqo0AfDxPxIfI83-T_Mf0rRV0q9w/exec';
    }

    async enviarReserva(datos) {
        try {
            console.log('📤 Enviando reserva a Telegram...', datos);
            
            const payload = {
                tipo: 'nueva_reserva',
                servicio: datos.servicio,
                precio: datos.precio,
                duracion: datos.duracion,
                fecha: datos.fecha,
                hora: datos.hora,
                nombre: datos.nombre,
                telefono: datos.telefono,
                metodo: datos.metodo,
                consulta: datos.consulta || 'No especificada',
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('✅ Respuesta del servidor:', resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error enviando reserva:', error);
            return {
                status: 'error',
                message: 'Error de conexión: ' + error.message
            };
        }
    }

    // Fallback por email
    enviarFallback(datos) {
        const subject = `📅 Nueva Reserva - ${datos.servicio}`;
        const body = `
NUEVA RESERVA DE TAROT - SISTEMA DE RESPALDO

📋 DATOS DE LA RESERVA:
────────────────────
• Servicio: ${datos.servicio}
• Precio: ${datos.precio}€
• Duración: ${datos.duracion} minutos
• Fecha: ${datos.fecha}
• Hora: ${datos.hora}

👤 DATOS DEL CLIENTE:
──────────────────
• Nombre: ${datos.nombre}
• Teléfono: ${datos.telefono}
• Método preferido: ${datos.metodo}

💬 CONSULTA:
──────────
${datos.consulta || 'No especificada'}

⏰ RECIBIDO: ${new Date().toLocaleString('es-ES')}

⚠️ Esta reserva se envió por el sistema de respaldo ya que falló la notificación automática por Telegram.
        `.trim();

        const mailtoUrl = `mailto:tu-email@dominio.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
        
        return {
            status: 'success',
            message: 'Fallback por email iniciado'
        };
    }
}

// Inicializar globalmente
const notificador = new NotificadorReservas();
