// controllers/ocrController.js
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { convertPdfToImages } = require('../services/imageService');
const { createPdfFromText } = require('../services/pdfService');
const languageMap = require('../utils/languageMap');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function safeParseLanguages(val) {
  try {
    const arr = JSON.parse(val || '["English"]');
    return Array.isArray(arr) ? arr : ['English'];
  } catch {
    return ['English'];
  }
}

async function processPdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const selectedLanguages = safeParseLanguages(req.body.languages);
  const tesseractLangs = selectedLanguages.map((lang) => languageMap[lang] || 'eng');
  const langString = tesseractLangs.join('+');

  try {
    const baseName = path.basename(filePath, path.extname(filePath));
    const imageFiles = await convertPdfToImages(filePath, OUTPUT_DIR, baseName);

    let fullText = '';
    for (const img of imageFiles) {
      try {
        const { data: { text } } = await Tesseract.recognize(img, langString, { logger: (m) => console.log(m) });
        fullText += (text || '') + '\n\n';
      } finally {
        try { fs.unlinkSync(img); } catch {}
      }
    }

    const pdfBytes = await createPdfFromText(fullText);
    const outputFileName = `${Date.now()}-ocr.pdf`;
    const outputFilePath = path.join(OUTPUT_DIR, outputFileName);
    fs.writeFileSync(outputFilePath, pdfBytes);

    // ✅ Return ABSOLUTE URL to /output/<file>
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host  = req.headers['x-forwarded-host']  || req.get('host');
    const absoluteUrl = `${proto}://${host}/output/${outputFileName}`;

    console.log('[OCR] Created file:', outputFilePath);
    console.log('[OCR] Download URL:', absoluteUrl);

    return res.json({
      success: true,
      downloadLink: absoluteUrl,
    });
  } catch (err) {
    console.error('OCR Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'OCR processing failed' });
  } finally {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
}


// controllers/ocrController.js (downloadPdf)
function downloadPdf(req, res) {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  console.log('[OCR] Download request for:', filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  res.download(filePath, 'ocr_result.pdf', (err) => {
    if (err) console.error('Download error:', err);
    // delete only after attempt completes
    try { fs.unlinkSync(filePath); } catch (e) { console.warn('Cleanup failed:', e.message); }
  });
}


module.exports = { processPdf, downloadPdf };
