const express = require('express');
const {
  getOverview,
  generateInsights,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/overview', getOverview);
router.post('/insights', generateInsights);

module.exports = router;

