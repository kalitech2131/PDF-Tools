// controllers/excelToPdfController.js
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'converted');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const writePDF = async (sheetsData, outputFilePath) => {
  return new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({ margin: 30 });
    const writeStream = fs.createWriteStream(outputFilePath);
    pdfDoc.pipe(writeStream);

    sheetsData.forEach((sheet, sheetIndex) => {
      if (sheetIndex > 0) pdfDoc.addPage();

      // Title
      pdfDoc.fontSize(16).text(sheet.name, { align: 'center' });
      pdfDoc.moveDown();

      if (sheet.data && sheet.data.length > 0) {
        const fontSize = 8;
        pdfDoc.fontSize(fontSize);

        const colWidths = [];
        const maxCols = Math.max(...sheet.data.map(row => row.length));
        for (let i = 0; i < maxCols; i++) colWidths[i] = 40;

        // width calc
        sheet.data.forEach(row => {
          row.forEach((cell, c) => {
            const txt = cell != null ? String(cell) : '';
            const tw = txt.length * (fontSize * 0.6);
            if (tw + 20 > colWidths[c]) colWidths[c] = tw + 20;
          });
        });

        // fit to page
        const pageWidth = pdfDoc.page.width - 60;
        const totalWidth = colWidths.reduce((s, w) => s + w, 0);
        if (totalWidth > pageWidth) {
          const scale = pageWidth / totalWidth;
          for (let i = 0; i < colWidths.length; i++) colWidths[i] *= scale;
        }

        let y = pdfDoc.y;
        const rowH = 15;

        sheet.data.forEach((row, r) => {
          if (y + rowH > pdfDoc.page.height - 30) {
            pdfDoc.addPage();
            y = 30;
          }
          let x = 30;
          for (let c = 0; c < maxCols; c++) {
            const val = row[c] != null ? String(row[c]) : '';
            const w = colWidths[c] || 40;

            pdfDoc.rect(x, y, w, rowH).stroke();
            pdfDoc.font(r === 0 ? 'Helvetica-Bold' : 'Helvetica');
            pdfDoc.text(val, x + 3, y + 3, {
              width: w - 6,
              height: rowH - 6,
              align: 'left',
            });
            x += w;
          }
          y += rowH;
        });
      } else {
        pdfDoc.text('No data available in this sheet.');
      }
    });

    pdfDoc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

const parseXlsxWithExcelJS = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheetsData = [];
  workbook.eachSheet((ws) => {
    const data = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      const rowData = row.values.slice(1).map((val) => {
        if (val == null) return '';
        if (typeof val === 'object' && val.text) return val.text;
        if (typeof val === 'object' && val.result) return val.result;
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
      if (rowData.some((c) => c !== '')) data.push(rowData);
    });
    if (data.length > 0) sheetsData.push({ name: ws.name, data });
  });
  return sheetsData;
};

const parseXlsWithXLSX = (filePath) => {
  const wb = XLSX.readFile(filePath, { cellDates: true, type: 'file' });
  const sheetsData = [];

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const data = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
      const rowData = [];
      let hasData = false;

      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        let val = '';
        if (cell) {
          if (cell.t === 'n') val = cell.v;
          else if (cell.t === 's') val = cell.v;
          else if (cell.t === 'b') val = cell.v ? 'TRUE' : 'FALSE';
          else if (cell.t === 'd') val = new Date((cell.v - 25569) * 86400 * 1000).toLocaleDateString();
          else if (cell.t === 'e') val = '';
          else val = cell.w || cell.v || '';
          if (val !== '') hasData = true;
        }
        rowData.push(val);
      }
      if (hasData) data.push(rowData);
    }

    if (data.length > 0) sheetsData.push({ name: sheetName, data });
  });

  return sheetsData;
};

const excelToPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputFileName = `${path.parse(req.file.originalname).name}.pdf`;
    const outputFilePath = path.join(OUTPUT_DIR, outputFileName);

    // 👇 Option A switches live here (INSIDE the handler!)
    const persist = req.query.persist === 'true';
    const mode = (req.query.mode || 'stream').toLowerCase(); // 'json' | 'stream'

    let sheetsData = [];

    try {
      if (ext === '.xlsx') sheetsData = await parseXlsxWithExcelJS(filePath);
      else if (ext === '.xls') sheetsData = parseXlsWithXLSX(filePath);
      else throw new Error('Unsupported file format');

      if (sheetsData.length === 0) throw new Error('No data found in the Excel file');

      await writePDF(sheetsData, outputFilePath);

      // --- Option A: return a URL JSON and KEEP the output file
      if (mode === 'json' && persist) {
        const publicUrl = `/converted/${path.basename(outputFilePath)}`;
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
        return res.json({ ok: true, fileName: outputFileName, fileUrl: publicUrl });
      }

      // --- Default: stream and delete both temp files
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);

      const stream = fs.createReadStream(outputFilePath);
      stream.pipe(res);

      stream.on('end', () => {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
        } catch (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
        }
      });

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).end();
      });
    } catch (convErr) {
      console.error('Conversion error:', convErr);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      res.status(500).json({ error: 'Conversion failed', details: convErr.message });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = { excelToPdf };
