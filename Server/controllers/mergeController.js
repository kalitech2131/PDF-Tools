  const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Directory Setup
const uploadsDir = path.join(__dirname, '../uploads');
const mergedPdfsDir = path.join(__dirname, '../merged_pdfs');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(mergedPdfsDir)) fs.mkdirSync(mergedPdfsDir, { recursive: true });

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
}).array('pdfFiles', 10);

// Helper: Cleanup Files
function cleanupFiles(filePaths) {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, err => { 
        if (err) console.error(`Error deleting ${filePath}:`, err); 
      });
    }
  });
}

// Controller Function
const mergePdfs = (req, res) => {
  // Apply CORS
  cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] })(req, res, () => {

    upload(req, res, async (err) => {
      if (err) {
        const message = err.message || 'File upload failed.';
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ success: false, message: 'Please upload a maximum of 10 PDF files.' });
          }
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File size too large. Maximum 50MB per file.' });
          }
        }
        return res.status(400).json({ success: false, message });
      }

      if (!req.files || req.files.length < 2) {
        if (req.files && req.files.length > 0) cleanupFiles(req.files.map(f => f.path));
        return res.status(400).json({
          success: false,
          message: 'Please upload at least 2 and up to 10 PDF files to merge.'
        });
      }

      const uploadedFilePaths = req.files.map(f => f.path);

      // Total File Size Check
      const totalSize = req.files.reduce((acc, f) => acc + f.size, 0);
      const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

      if (totalSize > MAX_TOTAL_SIZE) {
        cleanupFiles(uploadedFilePaths);
        return res.status(400).json({
          success: false,
          message: `Total file size exceeds 100MB. Your total size is ${(totalSize / (1024 * 1024)).toFixed(2)}MB.`
        });
      }

      // Check if client is still connected
      if (req.aborted) {
        cleanupFiles(uploadedFilePaths);
        return res.status(499).json({ success: false, message: 'Client closed the connection' });
      }

      try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
          try {
            // Check connection status before each file processing
            if (req.aborted) {
              cleanupFiles(uploadedFilePaths);
              return res.status(499).json({ success: false, message: 'Client closed the connection' });
            }

            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(p => mergedPdf.addPage(p));
          } catch (pdfError) {
            console.error(`Error processing "${file.originalname}":`, pdfError);
            cleanupFiles(uploadedFilePaths);
            return res.status(400).json({
              success: false,
              message: `Error processing "${file.originalname}". It may be corrupted or encrypted.`
            });
          }
        }

        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfFileName = `merged_${Date.now()}.pdf`;
        const outputPath = path.join(mergedPdfsDir, mergedPdfFileName);

        await fs.promises.writeFile(outputPath, mergedPdfBytes);

        // Check connection status before sending
        if (req.aborted) {
          cleanupFiles(uploadedFilePaths);
          fs.unlink(outputPath, () => {});
          return res.status(499).json({ success: false, message: 'Client closed the connection' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${mergedPdfFileName}"`);
        res.setHeader('Content-Length', mergedPdfBytes.length);
        
        // Send the file
        res.send(mergedPdfBytes);

        // Cleanup after successful send
        cleanupFiles(uploadedFilePaths);
        fs.unlink(outputPath, () => {});

      } catch (mergeErr) {
        console.error('Merging process failed:', mergeErr);
        cleanupFiles(uploadedFilePaths);
        res.status(500).json({
          success: false,
          message: 'An error occurred during merging. Please ensure your files are valid PDFs.'
        });
      }
    });
  });
};

module.exports = { mergePdfs };
