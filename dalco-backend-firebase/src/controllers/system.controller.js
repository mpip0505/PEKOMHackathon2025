const { getSystemStatus } = require('../services/system.service');

const getStatus = async (req, res, next) => {
  try {
    const deep = req.query.deep === 'true';
    const status = await getSystemStatus({ deep });
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
};

