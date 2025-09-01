const express = require('express');
const {compressPdf} = require('../controllers/compressController');
const multer =require("multer")
const path = require('path');

const router = express.Router();

// Multer: save temp files to /uploads (absolute path)
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // keep multer's random name + extension
    const ext = (file.originalname || '').toLowerCase().endsWith('.pdf') ? '.pdf' : path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext || '.pdf'}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const ok = file.mimetype === 'application/pdf' || (file.originalname || '').toLowerCase().endsWith('.pdf');
  cb(ok ? null : new Error('Only PDF files are allowed'), ok);
};

const upload = multer({ storage, fileFilter });

// Compress PDF
router.post('/compress-pdf', upload.single('pdfFile'), compressPdf);

module.exports = router;
