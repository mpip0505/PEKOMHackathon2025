const logger = require('../utils/logger');
const { getDashboardMetrics } = require('../services/googleSheets.service');
const { analyzeSalesTrends } = require('../services/jamai.service');

const getOverview = async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics();
    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(`Failed to load dashboard: ${error.message}`);
    return next(error);
  }
};

const generateInsights = async (req, res, next) => {
  try {
    const metrics = req.body?.metrics || await getDashboardMetrics();
    const insights = await analyzeSalesTrends(metrics);

    return res.json({
      success: true,
      insights,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOverview,
  generateInsights,
};

