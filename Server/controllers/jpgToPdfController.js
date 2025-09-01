const PDFDocument = require("pdfkit");

// JPG to PDF Conversion Controller
exports.convertJpgToPdf = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files uploaded" });
    }

    // Unique PDF file name
    const pdfFileName = `converted-${Date.now()}.pdf`;

    // Create PDF document
    const doc = new PDFDocument({ autoFirstPage: false });

    // Response headers
    res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe PDF directly to response
    doc.pipe(res);

    // Process each uploaded image
    for (const file of req.files) {
      try {
        doc.addPage();
        doc.image(file.buffer, {
          fit: [500, 700], // fit to standard size
          align: "center",
          valign: "center",
        });
      } catch (err) {
        console.error(`Error processing image ${file.originalname}:`, err);
        throw new Error(`Failed to process image: ${file.originalname}`);
      }
    }

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({
      error: err.message || "Failed to convert images to PDF",
    });
  }
};
