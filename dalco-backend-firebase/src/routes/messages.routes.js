const express = require('express');
const { processWhatsAppMessage } = require('../controllers/messages.controller');

const router = express.Router();

router.post('/whatsapp', processWhatsAppMessage);

module.exports = router;

