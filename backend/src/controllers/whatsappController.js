const whatsappService = require('../services/whatsappService');

const whatsappController = {
  // Estado de configuración del servicio
  getStatus: (req, res) => {
    res.json({
      configured: whatsappService.isConfigured(),
      provider: 'meta-cloud-api',
      template: process.env.WHATSAPP_TEMPLATE_NAME || null
    });
  },

  // Envía un mensaje de WhatsApp
  sendMessage: async (req, res) => {
    try {
      const { to, message, templateParams } = req.body;

      if (!to || !message) {
        return res.status(400).json({ message: 'Los campos "to" y "message" son obligatorios' });
      }

      if (!whatsappService.isConfigured()) {
        return res.status(503).json({
          sent: false,
          reason: 'not_configured',
          message: 'WhatsApp Cloud API no está configurada. Define WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID en backend/.env'
        });
      }

      const result = await whatsappService.sendMessage(to, message, templateParams || []);
      res.json({ sent: true, to: whatsappService.normalizeTo(to), mode: result.mode });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(502).json({ sent: false, message: 'No se pudo enviar el mensaje de WhatsApp', error: error.message });
    }
  }
};

module.exports = whatsappController;
