const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { convertPowerPointToPdf } = require("../controllers/powerPointToPdfController");

const router = express.Router();

// Storage for PowerPoint files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for PPT/PPTX
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  const allowedExtensions = [".ppt", ".pptx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PowerPoint files (.ppt, .pptx) are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Route
router.post(
  "/convert-powerpoint-to-pdf",
  upload.single("powerpointFile"),
  convertPowerPointToPdf
);

module.exports = router;
