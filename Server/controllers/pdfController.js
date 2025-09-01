const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');
const diff = require('diff');
const pdfParse = require('pdf-parse');
const { generateFullReport, generateDiffHtml } = require('../utils/pdfUtils');

// ✅ Match server.js
const REPORTS_DIR = path.resolve(__dirname, '../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

exports.comparePDFs = async (req, res) => {
  try {
    const { original, modified } = req.files || {};
    if (!original?.[0] || !modified?.[0]) {
      return res.status(400).json({ error: 'Both PDF files are required' });
    }

    await verifyPdfFile(original[0].path);
    await verifyPdfFile(modified[0].path);

    const originalText = await extractTextFromPDF(original[0].path);
    const modifiedText = await extractTextFromPDF(modified[0].path);

    const differences = diff.diffWordsWithSpace(originalText, modifiedText);
    const diffHtml = generateDiffHtml(differences);

    const reportId = Date.now();
    const pdfFilename = `report-${reportId}.pdf`;
    const pdfPath = path.join(REPORTS_DIR, pdfFilename);

    const htmlContent = generateFullReport(
      originalText,
      modifiedText,
      diffHtml,
      {
        originalName: original[0].originalname,
        modifiedName: modified[0].originalname,
      }
    );

    await new Promise((resolve, reject) => {
      pdf.create(htmlContent, {
        format: 'A4',
        border: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      }).toFile(pdfPath, (err) => (err ? reject(err) : resolve()));
    });

    // cleanup temp uploads
    try { fs.unlinkSync(original[0].path); } catch {}
    try { fs.unlinkSync(modified[0].path); } catch {}

    // ✅ return URL that matches the static mount
    return res.json({
      success: true,
      reportUrl: `/reports/${pdfFilename}`,
      originalName: original[0].originalname,
      modifiedName: modified[0].originalname,
      originalText,
      modifiedText,
      differences: diffHtml,
    });
  } catch (err) {
    console.error('Error comparing PDFs:', err);
    return res.status(500).json({ error: 'Failed to compare PDFs', details: err.message });
  }
};

// -- helpers --
async function verifyPdfFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const header = buf.slice(0, 5).toString();
  if (!header.startsWith('%PDF-')) {
    throw new Error('File is not a valid PDF');
  }
}

async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}
