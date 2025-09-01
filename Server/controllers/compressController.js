// controllers/compressController.js
const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const COMPRESSED_DIR = path.resolve(process.cwd(), 'compressed_pdfs');
// Double-safety: ensure dir exists even if server didn’t create
if (!fs.existsSync(COMPRESSED_DIR)) fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

// sanitize filename base (no extension)
function safeBase(name) {
  return (name || 'document')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.pdf$/i, '');
}

async function compressWithPdfLib(inputPath, outputPath) {
  const src = await fsp.readFile(inputPath);
  const doc = await PDFDocument.load(src);
  // NOTE: pdf-lib re-save -> light compression (no image downsample)
  const out = await doc.save({ useObjectStreams: true });
  await fsp.writeFile(outputPath, out);
}

exports.compressPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded (field must be "pdfFile")' });

  const inputPath = path.resolve(req.file.path);
  const originalName = req.file.originalname || 'document.pdf';
  const originalSize = req.file.size || 0;

  const base = safeBase(originalName);
  const outputName = `compressed-${base}.pdf`;
  const outputPath = path.join(COMPRESSED_DIR, `${req.file.filename}_compressed.pdf`);

  try {
    await compressWithPdfLib(inputPath, outputPath);

    const buf = await fsp.readFile(outputPath);
    const compressedSize = buf.length;

    // JSON (base64) — matches your frontend
    res.json({
      success: true,
      file: buf.toString('base64'),
      fileName: outputName,
      originalFileSize: originalSize,
      compressedFileSize: compressedSize,
      method: 'pdf-lib'
    });
  } catch (err) {
    console.error('Compression failed:', err);
    res.status(500).json({ message: 'Compression failed' });
  } finally {
    // Cleanup temp files
    try { await fsp.unlink(inputPath); } catch {}
    try { await fsp.unlink(outputPath); } catch {}
  }
};
