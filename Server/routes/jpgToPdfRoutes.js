const express = require("express");
const multer = require("multer");
const { convertJpgToPdf } = require("../controllers/jpgToPdfController");

const router = express.Router();

// Multer storage in memory
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG/JPEG/PNG images are allowed"), false);
  }
};

// Multer config
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20, // Max 20 images
  },
});

// Route for JPG → PDF
router.post("/convert-jpg-to-pdf", upload.array("images", 20), convertJpgToPdf);

module.exports = router;
