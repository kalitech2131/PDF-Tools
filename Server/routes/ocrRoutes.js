// routes/ocrRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const upload = require('../config/multerConfig'); // your existing multer config
const { processPdf, downloadPdf } = require('../controllers/ocrController');

const router = express.Router();

// Ensure required dirs exist
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ───────────────────────────────────────────────────────────────
// FRONTEND EXPECTS: POST /api/ocr-pdf
// (it used to be /api/process-pdf; we’re standardizing to /api/ocr-pdf)
// ───────────────────────────────────────────────────────────────
router.post('/ocr-pdf', upload.single('pdf'), processPdf);

// Download the final OCR PDF
// GET /api/download/:filename
router.get('/download/:filename', downloadPdf);

module.exports = router;
