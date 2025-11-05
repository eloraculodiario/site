a// assets/notificaciones-seguras.js
class NotificadorReservas {
    constructor() {
        // PEGA AQUÍ LA URL QUE COPIASTE del Paso 8
            this.scriptUrl = 'https://script.google.com/macros/s/AKfycbze-n4YpKul3q2dXtCUr1Xc0IUjKJeNhs3mzC-db2Sqo0AfDxPxIfI83-T_Mf0rRV0q9w/exec';

    }

    async enviarReserva(datos) {
        try {
            console.log('📤 Enviando reserva...', datos);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });

            const resultado = await response.json();
            console.log('✅ Respuesta:', resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error:', error);
            return {
                status: 'error',
                message: 'Error de conexión: ' + error.message
            };
        }
    }
}

// Inicializar
const notificador = new NotificadorReservas();
