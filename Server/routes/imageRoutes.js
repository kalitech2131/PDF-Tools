const express = require("express");
const multer = require("multer");
const path = require("path");
const { convertPdfToImages } = require("../controllers/imageController");

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post("/convert-pdf-to-image", upload.single("file"), convertPdfToImages);

module.exports = router;
