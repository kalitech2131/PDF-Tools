// controllers/redactController.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// ✅ pdf.js v3 legacy build (CommonJS)
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const REDACT_DIR = path.join(__dirname, '..', 'redacted');
if (!fs.existsSync(REDACT_DIR)) fs.mkdirSync(REDACT_DIR, { recursive: true });

// ✅ pdf.js standard fonts path (stop LiberationSans warning)
const STANDARD_FONTS_DIR = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts'
);
// pdf.js expects a trailing slash (use path.sep for Windows compatibility)
const standardFontDataUrl = STANDARD_FONTS_DIR + path.sep;

const patterns = [
  { label: 'Aadhaar', pattern: /\b\d{12}\b/g },
  { label: 'PAN',     pattern: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g },
  { label: 'Phone',   pattern: /\b\d{10}\b/g },
  { label: 'Email',   pattern: /\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g },
];

exports.redactPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No PDF file uploaded.' });
  }

  const inputPath = req.file.path;
  const outputFileName = `${Date.now()}_${Math.random().toString(36).slice(2)}_redacted.pdf`;
  const outputPath = path.join(REDACT_DIR, outputFileName);

  try {
    // 🔴 Buffer -> real Uint8Array
    const buf = fs.readFileSync(inputPath);
    const uint8 = Uint8Array.from(buf);

    // pdf-lib load with Uint8Array
    const pdfDoc = await PDFDocument.load(uint8);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // ✅ Use namespace + pass standardFontDataUrl
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useWorker: false,
      isEvalSupported: false,
      standardFontDataUrl,
    });
    const pdf = await loadingTask.promise;

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      const pdfLibPage = pages[i];

      content.items.forEach((item) => {
        const text = item.str || '';

        const hit = patterns.find((p) => {
          const ok = p.pattern.test(text);
          p.pattern.lastIndex = 0; // reset global regex
          return ok;
        });
        if (!hit) return;

        // item.transform: [a,b,c,d,e,f] -> e=x, f=y (bottom-left origin)
        const x = item.transform?.[4] ?? 0;
        const y = item.transform?.[5] ?? 0;
        const width  = item.width ?? (text.length * 6);
        const height = 12;

        // Black rect + placeholder
        pdfLibPage.drawRectangle({ x, y, width, height, color: rgb(0, 0, 0) });
        pdfLibPage.drawText('XXXXX', {
          x: x + 2,
          y: y + 2,
          size: 9,
          font,
          color: rgb(1, 1, 1),
        });
      });
    }

    const outBytes = await pdfDoc.save();

    // extra-safe: ensure dir exists before write
    if (!fs.existsSync(REDACT_DIR)) fs.mkdirSync(REDACT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, outBytes);

    try { fs.unlinkSync(inputPath); } catch {}

    return res.json({ success: true, downloadUrl: `/redacted/${outputFileName}` });
  } catch (err) {
    console.error('Redaction error:', err);
    try { fs.unlinkSync(inputPath); } catch {}
    return res.status(500).json({ success: false, error: 'Redaction failed.' });
  }
};
