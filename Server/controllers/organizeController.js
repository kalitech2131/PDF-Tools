const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Ensure output folder exists
const outputDir = path.resolve(__dirname, '..', 'outputs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Cleanup utility
function cleanUp(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

exports.organizePdf = async (req, res) => {
    console.log("reqest enter in server")
  if (!req.file) return res.status(400).send('No file uploaded');

  const inputPath = req.file.path;
  const baseName = path.basename(req.file.originalname, '.pdf');
  const outputPath = path.join(outputDir, `${baseName}_organized.pdf`);

  try {
    // Load the original PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const originalPdf = await PDFDocument.load(pdfBytes);

    // In case you want to manipulate (rotate, reorder etc.), you can do it here.
    // Right now we're just saving as is.

    const savedBytes = await originalPdf.save();
    fs.writeFileSync(outputPath, savedBytes);

    // Send the final organized PDF
    res.download(outputPath, `organized_${baseName}.pdf`, (err) => {
      if (err) console.error('❌ Download error:', err);
      cleanUp(inputPath);
      cleanUp(outputPath);
    });
  } catch (err) {
    console.error('❌ Processing error:', err.message);
    cleanUp(inputPath);
    res.status(500).send('Failed to process PDF');
  }
};
