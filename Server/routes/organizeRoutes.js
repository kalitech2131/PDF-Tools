const express = require('express');
const multer = require('multer');
const { organizePdf } = require('../controllers/organizeController');

const router = express.Router();

// Setup multer
const upload = multer({ dest: 'uploads/' });

// Route: Accept PDF and return same organized PDF
router.post('/organize-pdf', upload.single('pdfFile'), organizePdf);

module.exports = router;
