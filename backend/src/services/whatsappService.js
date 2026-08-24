/* =====================================================================
   whatsappService.js – Envío de mensajes vía WhatsApp Cloud API (Meta)
   Requiere en backend/.env:
     WHATSAPP_ACCESS_TOKEN=EAAG...        (token permanente o de desarrollo)
     WHATSAPP_PHONE_NUMBER_ID=123456789   (ID del número de WhatsApp Business)
   Opcional (producción fuera de ventana 24h):
     WHATSAPP_TEMPLATE_NAME=confirmacion_cita
   ===================================================================== */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** Indica si el servicio está configurado con credenciales de Meta */
function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Normaliza el número destino a dígitos internacionales (ej: 57310266100) */
function normalizeTo(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  // Colombia: móvil local de 10 dígitos que empieza en 3 → prefijo 57
  if (digits.length === 10 && digits.startsWith('3')) digits = '57' + digits;
  return digits;
}

/** POST genérico a la Graph API */
async function postToGraph(payload) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `${GRAPH_API_BASE}/${phoneId}/messages`;

  if (typeof fetch !== 'function') {
    throw new Error('Se requiere Node.js 18+ (fetch nativo)');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const apiError = data.error && data.error.message ? data.error.message : `HTTP ${res.status}`;
    throw new Error(apiError);
  }
  return data;
}

/**
 * Envía un mensaje de texto de WhatsApp.
 * Nota: los textos libres solo son entregables dentro de la ventana de 24h
 * del usuario. Para confirmaciones iniciadas por el negocio se usa plantilla
 * si WHATSAPP_TEMPLATE_NAME está definido.
 */
async function sendMessage(to, message, templateParams = []) {
  if (!isConfigured()) {
    return { sent: false, reason: 'not_configured' };
  }

  const destino = normalizeTo(to);

  // Con plantilla aprobada (mensajes iniciados por el negocio)
  if (process.env.WHATSAPP_TEMPLATE_NAME) {
    await postToGraph({
      messaging_product: 'whatsapp',
      to: destino,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME,
        language: { code: 'es' },
        components: [{
          type: 'body',
          parameters: templateParams.map(t => ({ type: 'text', text: String(t) }))
        }]
      }
    });
    return { sent: true, mode: 'template' };
  }

  // Texto libre (ideal para pruebas con número de test de Meta)
  await postToGraph({
    messaging_product: 'whatsapp',
    to: destino,
    type: 'text',
    text: { preview_url: false, body: message }
  });
  return { sent: true, mode: 'text' };
}

module.exports = { isConfigured, normalizeTo, sendMessage };
