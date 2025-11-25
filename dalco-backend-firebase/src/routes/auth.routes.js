const express = require('express');
const { verifyFirebaseToken } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/verify', verifyFirebaseToken);

module.exports = router;

