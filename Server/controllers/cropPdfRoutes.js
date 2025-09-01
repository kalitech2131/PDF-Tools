// controllers/cropPdfController.js
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

exports.cropPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded.' });
  }

  const tempUploadedPath = req.file.path;

  try {
    // Expect: cropOptions JSON string
    // { selectedPages: "current", cropData: { "1": {x,y,width,height}, ... } }
    const cropOptions = JSON.parse(req.body.cropOptions || '{}');
    const { cropData } = cropOptions;

    if (!cropData || typeof cropData !== 'object' || !Object.keys(cropData).length) {
      return res.status(400).json({ error: 'Invalid crop options.' });
    }

    const pdfBytes = fs.readFileSync(tempUploadedPath);
    const srcDoc = await PDFDocument.load(pdfBytes);
    const outDoc = await PDFDocument.create();

    for (let i = 0; i < srcDoc.getPageCount(); i++) {
      const pageNumber = i + 1;
      const area = cropData[pageNumber];
      if (!area) continue; // sirf wahi pages jinke liye selection aaya hai

      // copy page into new doc
      const [p] = await outDoc.copyPages(srcDoc, [i]);

      // page size
      const { width, height } = p.getSize();

      // frontend top-left → PDF bottom-left
      const boxX = area.x;
      const boxY = height - (area.y + area.height);
      const boxW = area.width;
      const boxH = area.height;

      // bounds clamp (safety)
      const x = Math.max(0, Math.min(boxX, width));
      const y = Math.max(0, Math.min(boxY, height));
      const w = Math.max(1, Math.min(boxW, width - x));
      const h = Math.max(1, Math.min(boxH, height - y));

      p.setCropBox(x, y, w, h);
      outDoc.addPage(p);
    }

    if (outDoc.getPageCount() === 0) {
      return res.status(400).json({ error: 'No valid crop areas for any page.' });
    }

    const outBytes = await outDoc.save();
    const fileName = `cropped-${Date.now()}.pdf`;
    const outPath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(outPath, outBytes);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({
      fileName,
      downloadUrl: `${baseUrl}/uploads/${fileName}`,
    });
  } catch (err) {
    console.error('Error cropping PDF:', err);
    return res.status(500).json({ error: 'Error cropping PDF.' });
  } finally {
    // temp file cleanup
    try {
      if (tempUploadedPath && fs.existsSync(tempUploadedPath)) {
        fs.unlinkSync(tempUploadedPath);
      }
    } catch {}
  }
};

exports.downloadFile = (req, res) => {
  const safeName = path.basename(req.params.file);
  const fullPath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('File not found');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.download(fullPath, safeName);
};
