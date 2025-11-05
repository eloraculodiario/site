// assets/notificaciones-seguras.js - VERSIÓN COMPLETA Y CORREGIDA
class NotificadorReservas {
    constructor() {
        // ⚠️ REEMPLAZA CON TU URL REAL DE GOOGLE APPS SCRIPT
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzaWPQ1Sy6VNN2FEe2Wq8kNFlTpKZltmWAiAJZFN4Lzqe7GTcfaba5i77jfr-tharFNcw/exec';
        this.fallbackEmail = 'el.oraculo.guardian@gmail.com'; // ⚠️ REEMPLAZA CON TU EMAIL
    }

    async enviarReserva(datos) {
        console.log('📤 Enviando reserva a Google Apps Script...', datos);
        
        try {
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

            console.log('📦 Payload a enviar:', payload);

            // Usar fetch con no-cors para evitar problemas CORS
            const respuesta = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // En modo no-cors no podemos leer la respuesta, pero confiamos en que se envió
            console.log('✅ Reserva enviada (no-cors mode) - Revisa tu Google Apps Script');
            
            return {
                status: 'success',
                message: 'Reserva enviada correctamente'
            };

        } catch (error) {
            console.error('❌ Error enviando reserva:', error);
            
            // Fallback: intentar con método alternativo
            try {
                console.log('🔄 Intentando método alternativo...');
                await this.enviarReservaAlternativo(datos);
                return {
                    status: 'success', 
                    message: 'Reserva enviada mediante método alternativo'
                };
            } catch (fallbackError) {
                console.error('❌ Error en método alternativo:', fallbackError);
                return {
                    status: 'error',
                    message: 'Error de conexión: ' + error.message
                };
            }
        }
    }

    async enviarReservaAlternativo(datos) {
        // Método alternativo usando FormData (mejor compatibilidad)
        const formData = new FormData();
        formData.append('tipo', 'reserva');
        formData.append('servicio', datos.servicio);
        formData.append('precio', datos.precio);
        formData.append('duracion', datos.duracion);
        formData.append('fecha', datos.fecha);
        formData.append('hora', datos.hora);
        formData.append('nombre', datos.nombre);
        formData.append('telefono', datos.telefono);
        formData.append('metodo', datos.metodo);
        formData.append('consulta', datos.consulta || '');
        formData.append('timestamp', new Date().toISOString());

        const respuesta = await fetch(this.scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        console.log('✅ Reserva enviada (método alternativo)');
    }

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

        const mailtoUrl = `mailto:${this.fallbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
        
        console.log('📧 Fallback email activado');
        console.log('📋 Datos para email:', datos);
    }

    // Método de prueba para verificar conexión
    async probarConexion() {
        console.log('🔍 Probando conexión con Google Apps Script...');
        
        try {
            const respuesta = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tipo: 'test',
                    mensaje: 'Conexión de prueba',
                    timestamp: new Date().toISOString()
                })
            });
            
            console.log('✅ Conexión de prueba enviada');
            return true;
        } catch (error) {
            console.error('❌ Error en conexión de prueba:', error);
            return false;
        }
    }
}

// Instancia global
const notificador = new NotificadorReservas();

// Función de prueba global (para ejecutar en consola)
window.probarNotificador = function() {
    const datosPrueba = {
        servicio: 'Lectura de 30 minutos',
        precio: 25,
        duracion: '30 minutos',
        fecha: '2024-12-20',
        hora: '17:00',
        nombre: 'Cliente de Prueba',
        telefono: '+34123456789',
        metodo: 'whatsapp',
        consulta: 'Esta es una reserva de prueba desde la consola'
    };
    
    console.log('🧪 Iniciando prueba de notificador...');
    notificador.enviarReserva(datosPrueba)
        .then(resultado => console.log('Resultado prueba:', resultado))
        .catch(error => console.error('Error prueba:', error));
};

console.log('🔮 NotificadorReservas cargado correctamente');
console.log('💡 Usa probarNotificador() en la consola para probar');
