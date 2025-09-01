// routes/excelToPdfRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const { excelToPdf } = require('../controllers/excelToPdfController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (/\.(xlsx|xls)$/i.test(file.originalname)) cb(null, true);
  else cb(new Error('Only Excel files are allowed!'));
};

const upload = multer({ storage, fileFilter });

// POST /api/excel-to-pdf
router.post('/excel-to-pdf', upload.single('excelFile'), excelToPdf);

module.exports = router;
