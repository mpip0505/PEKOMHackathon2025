const express = require('express');
const { listLeads, createLead } = require('../controllers/leads.controller');

const router = express.Router();

router.get('/', listLeads);
router.post('/', createLead);

module.exports = router;

