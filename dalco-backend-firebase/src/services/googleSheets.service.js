const { google } = require('googleapis');
const logger = require('../utils/logger');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEETS_SPREADSHEET_ID,
  GOOGLE_SHEETS_INVENTORY_RANGE = 'Inventory!A2:F',
  GOOGLE_SHEETS_ORDER_RANGE = 'Orders!A2:G',
} = process.env;

const getSheetsClient = async () => {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('Google Sheets env vars missing');
  }

  // Debug: log presence/length of key parts (do not log full secrets)
  logger.info(`Google Sheets env: email=${Boolean(GOOGLE_SERVICE_ACCOUNT_EMAIL)}, spreadsheetId=${Boolean(GOOGLE_SHEETS_SPREADSHEET_ID)}, privateKeyLength=${GOOGLE_PRIVATE_KEY ? GOOGLE_PRIVATE_KEY.length : 0}`);

  // Sanitize private key: some .env formats include surrounding quotes — remove them.
  let privateKeyRaw = GOOGLE_PRIVATE_KEY;
  if (privateKeyRaw.startsWith('"') && privateKeyRaw.endsWith('"')) {
    privateKeyRaw = privateKeyRaw.slice(1, -1);
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    privateKey,
    SCOPES,
  );

  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
};

const readInventory = async () => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: GOOGLE_SHEETS_INVENTORY_RANGE,
  });

  const rows = response.data.values || [];

  return rows.map(([sku, name, color, size, stock, price]) => ({
    sku,
    name,
    color,
    size,
    stock: Number(stock) || 0,
    price: Number(price) || 0,
  }));
};

const checkInventoryAvailability = async ({ itemName, attributes = {}, quantity = 1 }) => {
  const inventory = await readInventory();
  const targetColor = attributes.color?.toLowerCase();
  const targetSize = attributes.size?.toUpperCase();

  const match = inventory.find((item) => {
    const matchesName = item.name.toLowerCase().includes(itemName.toLowerCase());
    const matchesColor = targetColor ? item.color.toLowerCase().includes(targetColor) : true;
    const matchesSize = targetSize ? item.size.toUpperCase() === targetSize : true;
    return matchesName && matchesColor && matchesSize;
  });

  if (!match) {
    return { available: false };
  }

  return {
    available: match.stock >= quantity,
    item: match,
    remainingStock: match.stock,
  };
};

const appendOrder = async (order) => {
  const sheets = await getSheetsClient();
  const timestamp = new Date().toISOString();

  const lineItem = order.lineItems?.[0] || {};

  const row = [
    timestamp,
    order.customerName,
    order.phoneNumber,
    lineItem.itemName,
    lineItem.quantity,
    order.deliveryAddress,
    order.notes || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: GOOGLE_SHEETS_ORDER_RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });

  logger.info(`Order logged to Google Sheets for ${order.customerName}`);
};

const readOrders = async () => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: GOOGLE_SHEETS_ORDER_RANGE,
  });

  const rows = response.data.values || [];
  return rows.map(([timestamp, customerName, phone, item, quantity, address]) => ({
    timestamp,
    customerName,
    phone,
    item,
    quantity: Number(quantity) || 0,
    address,
  }));
};

const getDashboardMetrics = async () => {
  try {
    const orders = await readOrders();
    const totalOrders = orders.length;
    const itemCounts = {};

    orders.forEach(({ item, quantity }) => {
      itemCounts[item] = (itemCounts[item] || 0) + quantity;
    });

    const topProduct = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
    const topProductName = topProduct ? topProduct[0] : null;
    const topProductShare = topProduct ? Math.round((topProduct[1] / Math.max(1, totalOrders)) * 100) : 0;

    return {
      totalOrders,
      topProduct: topProductName,
      topProductShare,
      lastOrders: orders.slice(-5),
    };
  } catch (error) {
    logger.error(`getDashboardMetrics failed: ${error.message}`);
    // Return safe fallback so callers (API) don't 500
    return {
      totalOrders: 0,
      topProduct: null,
      topProductShare: 0,
      lastOrders: [],
    };
  }
};

module.exports = {
  readInventory,
  checkInventoryAvailability,
  appendOrder,
  getDashboardMetrics,
};

