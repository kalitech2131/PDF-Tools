const express = require("express");
const multer = require("multer");
const constroller = require("../controllers/convertController")

const router = express.Router();

// file upload storage
const upload = multer({ dest: "uploads/" });

// POST /api/convert
router.post('/convert', upload.single('pdfFile'), constroller.convertPdfToDocx);

module.exports = router;
