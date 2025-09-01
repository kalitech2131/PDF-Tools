const fs = require('fs');
const path = require('path');
const { processPdf, ensureDirectories  } = require('../utils/pdfUtils');

exports.repairPdf = async (req, res) => {
  ensureDirectories();
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  const inputPath = req.file.path;
  const outputFilename = `repaired-${req.file.filename}`;
  const outputPath = path.join('repaired', outputFilename);

  try {
    await processPdf(inputPath, outputPath);
    const repairedBytes = fs.readFileSync(outputPath);

    // cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace('.pdf', '')}_repaired.pdf"`);
    res.send(repairedBytes);
  } catch (error) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    res.status(500).json({ success: false, error: error.message || 'PDF repair failed' });
  }
};
