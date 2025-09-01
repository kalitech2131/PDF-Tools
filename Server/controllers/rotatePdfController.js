const { PDFDocument, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

// Valid rotation angles
const VALID_ROTATIONS = [0, 90, 180, 270];

exports.rotatePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const { angle } = req.body;
    if (!angle || isNaN(angle)) {
      return res.status(400).json({ error: "Invalid rotation angle" });
    }

    let rotationAngle = parseInt(angle);
    if (!VALID_ROTATIONS.includes(rotationAngle)) {
      return res.status(400).json({
        error: "Invalid rotation angle. Must be 0, 90, 180, or 270 degrees",
      });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
      page.setRotation(degrees(rotationAngle));
    });

    const rotatedPdfBytes = await pdfDoc.save();
    const outputPath = path.join("uploads", `rotated-${req.file.filename}`);
    fs.writeFileSync(outputPath, rotatedPdfBytes);

    // delete original
    fs.unlinkSync(req.file.path);

    res.download(outputPath, () => {
      fs.unlinkSync(outputPath); // delete rotated after download
    });
  } catch (error) {
    console.error("Error rotating PDF:", error);
    res.status(500).json({ error: "Failed to rotate PDF" });
  }
};
