const express = require('express');
const { mergePdfs } = require('../controllers/mergeController');

const router = express.Router();

// Route
router.post('/merge-pdfs', mergePdfs);

module.exports = router;
