const logger = require('../utils/logger');
const { getConfigReport } = require('../utils/configCheck');
const { db } = require('../config/firebase');
const { readInventory, getDashboardMetrics } = require('./googleSheets.service');
const { detectIntent } = require('./jamai.service');

const testFirestore = async () => {
  try {
    const testDoc = db.collection('_system_checks').doc('status');
    await testDoc.set({ checkedAt: new Date() });
    return { healthy: true };
  } catch (error) {
    logger.error(`Firestore check failed: ${error.message}`);
    return { healthy: false, error: error.message };
  }
};

const testJamai = async () => {
  try {
    if (!process.env.JAMAI_INTENT_ACTION_TABLE_ID) {
      return { healthy: false, error: 'JamAI table IDs missing' };
    }

    const response = await detectIntent('health check message');
    return { healthy: Boolean(response), sampleIntent: response };
  } catch (error) {
    logger.error(`JamAI check failed: ${error.message}`);
    return { healthy: false, error: error.message };
  }
};

const testGoogleSheets = async () => {
  try {
    const [inventory, metrics] = await Promise.all([
      readInventory().catch(() => []),
      getDashboardMetrics().catch(() => ({})),
    ]);

    return {
      healthy: true,
      sampleInventoryCount: inventory.length,
      metricsSummary: {
        totalOrders: metrics.totalOrders || 0,
        topProduct: metrics.topProduct || null,
      },
    };
  } catch (error) {
    logger.error(`Google Sheets check failed: ${error.message}`);
    return { healthy: false, error: error.message };
  }
};

const getSystemStatus = async ({ deep = false } = {}) => {
  const configReport = getConfigReport();

  if (!deep) {
    return {
      config: configReport,
      deepChecks: null,
    };
  }

  const [firestore, jamai, sheets] = await Promise.all([
    testFirestore(),
    testJamai(),
    testGoogleSheets(),
  ]);

  return {
    config: configReport,
    deepChecks: {
      firestore,
      jamai,
      googleSheets: sheets,
    },
  };
};

module.exports = {
  getSystemStatus,
};

