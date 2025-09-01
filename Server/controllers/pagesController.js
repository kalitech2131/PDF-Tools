const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const fileUtils = require('../utils/fileUtils');

exports.getTotalPages = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const inputPath = req.file.path;
  try {
    const pdfBytes = fs.readFileSync(inputPath);
    const doc = await PDFDocument.load(pdfBytes);
    res.json({ success: true, totalPages: doc.getPageCount() });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to read PDF' });
  } finally {
    fileUtils.cleanupFiles([inputPath]);
  }
};
