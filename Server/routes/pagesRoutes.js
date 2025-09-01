const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const pagesController = require('../controllers/pagesController');

// Get total number of pages in PDF
router.post('/pdf-pages', upload.single('pdfFile'), pagesController.getTotalPages);

module.exports = router;
