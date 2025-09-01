// routes/htmlToPdfRoutes.js
const express = require('express');
const { htmlToPdf } = require('../controllers/htmlToPdfController');
const router = express.Router();
router.post('/url-to-pdf', htmlToPdf);
module.exports = router;
