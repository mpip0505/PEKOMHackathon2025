const { FieldValue } = require('firebase-admin/firestore');
const logger = require('../utils/logger');
const { db } = require('../config/firebase');
const {
  detectIntent,
  answerFaq,
  extractInventoryQuery,
  extractOrderDetails,
} = require('../services/jamai.service');
const {
  checkInventoryAvailability,
  appendOrder,
} = require('../services/googleSheets.service');

const logMessage = async (payload) => {
  try {
    await db.collection('messages').add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.warn(`Failed to log message: ${error.message}`);
  }
};

const processWhatsAppMessage = async (req, res, next) => {
  try {
    const {
      message,
      phoneNumber,
      displayName,
      channel = 'whatsapp',
      locale = 'ms',
    } = req.body;

    if (!message || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Message and phoneNumber are required',
      });
    }

    await logMessage({
      channel,
      direction: 'inbound',
      from: phoneNumber,
      content: message,
      locale,
      status: 'received',
    });

    const intent = await detectIntent(message);
    let reply;
    let metadata = {};

    if (intent === 'faq') {
      reply = await answerFaq(message);
    } else if (intent === 'inventory') {
      const query = await extractInventoryQuery(message);
      const availability = await checkInventoryAvailability(query);

      metadata = { query, availability };

      if (availability.available) {
        reply = `Yes, stok ${query.quantity} unit untuk ${availability.item.name} tersedia. ` +
          `Baki stok: ${availability.remainingStock}. Mahu teruskan pesanan?`;
      } else {
        reply = 'Maaf, stok tidak mencukupi sekarang. Boleh kami cadangkan pilihan lain?';
      }
    } else if (intent === 'order') {
      const order = await extractOrderDetails({
        message,
        phoneNumber,
        displayName,
      });

      await appendOrder(order);

      metadata = { order };

      reply = [
        `Terima kasih ${order.customerName}!`,
        `Pesanan ${order.lineItems?.[0]?.itemName || 'produk'} (${order.lineItems?.[0]?.quantity || ''} unit) telah direkod.`,
        'Kami akan hubungi anda untuk pengesahan penghantaran.',
      ].join(' ');
    } else {
      reply = 'Hai! Saya DalCo bot. Saya boleh bantu semak stok, jawab FAQ, atau urus pesanan borong anda.';
    }

    await logMessage({
      channel,
      direction: 'outbound',
      to: phoneNumber,
      content: reply,
      locale,
      intent,
      metadata,
      status: 'sent',
    });

    return res.json({
      success: true,
      intent,
      reply,
      metadata,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  processWhatsAppMessage,
};

