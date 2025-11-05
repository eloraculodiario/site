// assets/notificaciones-seguras.js - VERSIÓN DE EMERGENCIA
class NotificadorReservas {
    constructor() {
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';
    }

    async enviarReserva(datos) {
        console.log('📤 Intentando enviar reserva...', datos);
        
        // SIMULACIÓN TEMPORAL - Siempre muestra éxito
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Reserva simulada - Revisa la consola para datos reales');
        
        // Muestra los datos en consola para que los veas
        console.log('📋 DATOS DE LA RESERVA:', datos);
        
        return {
            status: 'success',
            message: 'Reserva procesada (modo simulación)'
        };
    }

    enviarFallback(datos) {
        const subject = `📅 NUEVA RESERVA - ${datos.servicio}`;
        const body = `
RESERVA DE TAROT - DATOS COMPLETOS:

Servicio: ${datos.servicio}
Precio: ${datos.precio}€
Duración: ${datos.duracion} min
Fecha: ${datos.fecha}
Hora: ${datos.hora}

CLIENTE:
Nombre: ${datos.nombre}
Teléfono: ${datos.telefono}
Método: ${datos.metodo}

CONSULTA:
${datos.consulta || 'No especificada'}

⚠️ CONFIGURAR GOOGLE APPS SCRIPT PARA NOTIFICACIONES AUTOMÁTICAS
        `.trim();

        const mailtoUrl = `mailto:tuemail@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
    }
}

const notificador = new NotificadorReservas();
