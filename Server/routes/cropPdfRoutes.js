// routes/cropPdfRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { cropPdf, downloadFile } = require('../controllers/cropPdfRoutes');

const router = express.Router();

// Make sure uploads dir exists (safety; server.js bhi create karta hai)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage here (inside routes file)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.pdf';
    cb(null, `upload-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // accept only pdf
    if ((file.mimetype && file.mimetype.includes('pdf')) || path.extname(file.originalname).toLowerCase() === '.pdf') {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed.'));
  },
});

// POST /api/croppdf  (field name must be "pdf")
router.post('/croppdf', upload.single('pdf'), cropPdf);

// GET /api/download/:file  (optional helper)
router.get('/download/:file', downloadFile);

module.exports = router;
