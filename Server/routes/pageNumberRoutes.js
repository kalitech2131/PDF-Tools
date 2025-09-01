// routes/pageNumberRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { addPageNumbers } = require('../controllers/pageNumberController');

const router = express.Router();

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer (inside routes)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.pdf';
    cb(null, `upload-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const ok = (file.mimetype && file.mimetype.includes('pdf')) ||
               path.extname(file.originalname || '').toLowerCase() === '.pdf';
    cb(ok ? null : new Error('Only PDF files are allowed.'), ok);
  },
});

// POST /api/add-page-numbers (field name: pdfFile)
router.post('/add-page-numbers', upload.single('pdfFile'), addPageNumbers);

module.exports = router;
