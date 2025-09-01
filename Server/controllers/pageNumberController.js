// controllers/pageNumberController.js
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

// Helper: number -> Roman (basic up to 20, else as-is)
const toRoman = (num) => {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 1) return String(num);
  const roman = [
    '', 'I','II','III','IV','V','VI','VII','VIII','IX','X',
    'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'
  ];
  return num <= 20 ? roman[num] : String(num);
};

exports.addPageNumbers = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const { pageMode = 'single', coverPage = 'false', position = 'bottom-center',
          firstNumber = '1', numberStyle = 'numeric' } = req.body;

  const tempPath = req.file.path;

  try {
    const startNumber = parseInt(firstNumber, 10);
    if (Number.isNaN(startNumber)) {
      throw new Error('Invalid first number provided.');
    }
    const isCover = String(coverPage) === 'true';

    const pdfBytes = fs.readFileSync(tempPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
      // Skip 1st page if cover page selected
      if (isCover && index === 0) return;

      const currentPageNumber = index + startNumber;
      const numberText =
        numberStyle === 'roman' ? toRoman(currentPageNumber) : String(currentPageNumber);

      const { width, height } = page.getSize();
      const margin = 20;
      const textWidthApprox = numberText.length * 5; // rough for size 12

      let x, y;

      if (pageMode === 'single') {
        switch (position) {
          case 'top-left':     x = margin; y = height - margin; break;
          case 'top-center':   x = (width / 2) - (textWidthApprox / 2); y = height - margin; break;
          case 'top-right':    x = width - margin - textWidthApprox; y = height - margin; break;
          case 'bottom-left':  x = margin; y = margin; break;
          case 'bottom-center':x = (width / 2) - (textWidthApprox / 2); y = margin; break;
          case 'bottom-right': x = width - margin - textWidthApprox; y = margin; break;
          default:             x = (width / 2) - (textWidthApprox / 2); y = margin;
        }
      } else {
        // 'facing' mode: outer margins at bottom
        if (index % 2 === 0) { // even index => left page
          x = margin;
        } else {               // odd index => right page
          x = width - margin - textWidthApprox;
        }
        y = margin;
      }

      page.drawText(numberText, { x, y, size: 12, color: rgb(0, 0, 0) });
    });

    const modifiedPdf = await pdfDoc.save();

    const original = req.file.originalname || 'input.pdf';
    const safeName = path.basename(original).replace(/[^\w.\-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=numbered-${safeName}`);
    return res.send(Buffer.from(modifiedPdf));
  } catch (err) {
    console.error('Error processing PDF:', err);
    return res.status(500).json({ error: 'Failed to process PDF: ' + err.message });
  } finally {
    // cleanup temp upload
    try { if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
  }
};
