// controllers/splitController.js
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const OUTPUT_DIR = path.resolve(process.cwd(), 'outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

exports.pdfPages = async (req, res) => {
  let inputPath;
  try {
    if (!req.file) throw new Error('No PDF uploaded');
    inputPath = req.file.path;

    const pdfBytes = await fs.promises.readFile(inputPath);
    const doc = await PDFDocument.load(pdfBytes);
    const totalPages = doc.getPageCount();

    await fs.promises.unlink(inputPath).catch(() => {});
    res.json({ success: true, totalPages });
  } catch (err) {
    if (inputPath && fs.existsSync(inputPath)) await fs.promises.unlink(inputPath).catch(() => {});
    const msg = /Encrypted|Password/i.test(String(err))
      ? 'Encrypted PDFs are not supported.'
      : (err.message || 'Failed to read PDF');
    res.status(400).json({ success: false, message: msg });
  }
};

exports.splitPdf = async (req, res) => {
  let inputPath;
  try {
    if (!req.file) throw new Error('No PDF uploaded');

    const { startPage, endPage } = req.body;
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < 1 || start > end) {
      throw new Error('Invalid page range');
    }

    inputPath = req.file.path;
    const pdfBytes = await fs.promises.readFile(inputPath);
    const srcDoc = await PDFDocument.load(pdfBytes);
    const totalPages = srcDoc.getPageCount();
    if (start > totalPages || end > totalPages) {
      throw new Error(`Page range exceeds total pages (${totalPages})`);
    }

    const outDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
    const pages = await outDoc.copyPages(srcDoc, indices);
    pages.forEach(p => outDoc.addPage(p));

    const outBytes = await outDoc.save();
    const base = (req.file.originalname || 'document').replace(/\.pdf$/i,'');
   const outputFilename = `split-${base}-p${start}-${end}-${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    await fs.promises.writeFile(outputPath, outBytes);

    await fs.promises.unlink(inputPath).catch(() => {});

    // IMPORTANT: include /api in the URL so it hits Express, not the SPA
    const absoluteUrl = `${req.protocol}://${req.get('host')}/api/download/${outputFilename}`;

    res.json({ success: true, downloadUrl: absoluteUrl, totalPages });
  } catch (err) {
    if (inputPath && fs.existsSync(inputPath)) await fs.promises.unlink(inputPath).catch(() => {});
    const msg = /Encrypted|Password/i.test(String(err))
      ? 'Encrypted PDFs are not supported.'
      : (err.message || 'Failed to split PDF');
    res.status(400).json({ success: false, message: msg });
  }
};
