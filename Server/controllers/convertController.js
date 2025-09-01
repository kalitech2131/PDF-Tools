const fs = require("fs");
const path = require("path");
const { convertWithPython } = require('../services/pdfToWord.service');

exports.convertPdfToDocx = async (req, res) => {
  
try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const inputPath = req.file.path; // from multer (uploads/<filename>.pdf)
    const outputBase = path.parse(inputPath).name;
    const outputPath = path.join('output', `${outputBase}.docx`);

    // ensure output dir and run conversion
    await convertWithPython(inputPath, outputPath);

    // stream/download the file, then cleanup both input + output
    res.download(outputPath, (err) => {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }

      if (err && !res.headersSent) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error sending the file' });
      }
    });
  } catch (err) {
    // cleanup input file on error
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
    next(err);
  }
}

