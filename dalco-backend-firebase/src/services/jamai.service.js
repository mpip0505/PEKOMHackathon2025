const axios = require('axios');
const logger = require('../utils/logger');

const JAMAI_BASE_URL = process.env.JAMAI_BASE_URL || 'https://api.jamaibase.com/v1';

const jamaibaseClient = axios.create({
  baseURL: JAMAI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.JAMAI_API_KEY || ''}`,
  },
  timeout: 15000,
});

const invokeTable = async (tableType, tableId, payload) => {
  if (!tableId) {
    throw new Error(`Missing JamAI Base ${tableType} table ID`);
  }

  try {
    const endpoint = `/tables/${tableType}/${tableId}/invoke`;
    const { data } = await jamaibaseClient.post(endpoint, payload);
    return data;
  } catch (error) {
    logger.error(`JamAI Base ${tableType} invocation failed: ${error.message}`);
    throw error;
  }
};

const detectIntent = async (message) => {
  if (!process.env.JAMAI_INTENT_ACTION_TABLE_ID) {
    return fallbackIntent(message);
  }

  try {
    const data = await invokeTable('action', process.env.JAMAI_INTENT_ACTION_TABLE_ID, {
      input: { message },
    });
    return data?.intent || fallbackIntent(message);
  } catch (error) {
    return fallbackIntent(message);
  }
};

const fallbackIntent = (message) => {
  const text = message.toLowerCase();

  if (text.includes('stok') || text.includes('stock') || text.includes('ada tak') || text.includes('availability')) {
    return 'inventory';
  }

  if (text.includes('order') || text.includes('tempah') || text.includes('purchase') || text.includes('buy')) {
    return 'order';
  }

  if (text.includes('refund') || text.includes('return') || text.includes('policy') || text.includes('time')) {
    return 'faq';
  }

  return 'general';
};

const answerFaq = async (query) => {
  if (!process.env.JAMAI_FAQ_KNOWLEDGE_TABLE_ID) {
    return fallbackFaq(query);
  }

  try {
    const data = await invokeTable('knowledge', process.env.JAMAI_FAQ_KNOWLEDGE_TABLE_ID, {
      query,
      options: {
        language: 'ms-en',
      },
    });

    return data?.answer || fallbackFaq(query);
  } catch (error) {
    return fallbackFaq(query);
  }
};

const fallbackFaq = (query) => (
  `Maaf, saya tidak jumpa maklumat tepat untuk soalan "${query}". ` +
  'Boleh saya bantu dengan stok atau buat pesanan?'
);

const extractInventoryQuery = async (message) => {
  if (!process.env.JAMAI_INVENTORY_ACTION_TABLE_ID) {
    return fallbackInventoryExtraction(message);
  }

  try {
    const data = await invokeTable('action', process.env.JAMAI_INVENTORY_ACTION_TABLE_ID, {
      input: { message },
    });

    return data?.inventoryRequest || fallbackInventoryExtraction(message);
  } catch (error) {
    return fallbackInventoryExtraction(message);
  }
};

const fallbackInventoryExtraction = (message) => {
  const regex = /(\d+)\s*(pcs|pieces|unit|units)?\s*(?:of)?\s*([a-z0-9\s\-]+)/i;
  const match = message.match(regex);

  return {
    itemName: match ? match[3].trim() : 't-shirt',
    quantity: match ? Number(match[1]) : 1,
    attributes: {
      color: message.toLowerCase().includes('blue') ? 'Blue' : undefined,
      size: message.toLowerCase().match(/(xs|s|m|l|xl|xxl)/i)?.[0]?.toUpperCase(),
    },
  };
};

const extractOrderDetails = async (payload) => {
  if (!process.env.JAMAI_ORDER_ACTION_TABLE_ID) {
    return fallbackOrderExtraction(payload);
  }

  try {
    const data = await invokeTable('action', process.env.JAMAI_ORDER_ACTION_TABLE_ID, {
      input: payload,
    });
    return data?.order || fallbackOrderExtraction(payload);
  } catch (error) {
    return fallbackOrderExtraction(payload);
  }
};

const fallbackOrderExtraction = ({ message, phoneNumber, displayName }) => ({
  customerName: displayName || 'WhatsApp Customer',
  phoneNumber,
  lineItems: [
    {
      itemName: 'Bulk T-Shirt',
      quantity: message.match(/\d+/) ? Number(message.match(/\d+/)[0]) : 10,
      remarks: message,
    },
  ],
  deliveryAddress: 'To be confirmed',
  notes: message,
});

const analyzeSalesTrends = async (dataset) => {
  if (!process.env.JAMAI_ANALYTICS_GENERATIVE_TABLE_ID) {
    return fallbackAnalytics(dataset);
  }

  try {
    const data = await invokeTable('generative', process.env.JAMAI_ANALYTICS_GENERATIVE_TABLE_ID, {
      input: {
        prompt: 'Analyze SME sales trends',
        data: dataset,
      },
    });

    return data?.insights || fallbackAnalytics(dataset);
  } catch (error) {
    return fallbackAnalytics(dataset);
  }
};

const fallbackAnalytics = (dataset = {}) => {
  const { totalOrders = 0, topProduct = 'Blue T-Shirt', topProductShare = 0 } = dataset;

  return [
    `Jumlah pesanan mingguan: ${totalOrders}.`,
    `${topProduct} menyumbang ${topProductShare}% daripada jualan.`,
    'Cadangan: tambah stok warna paling laris dan jalankan promosi hujung minggu.',
  ].join(' ');
};

module.exports = {
  detectIntent,
  answerFaq,
  extractInventoryQuery,
  extractOrderDetails,
  analyzeSalesTrends,
};

