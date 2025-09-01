const libre = require("libreoffice-convert");
const path = require("path");
const fs = require("fs");
const { cleanUpFiles } = require("../utils/fileUtils");

// PowerPoint to PDF Conversion Controller
exports.convertPowerPointToPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
      details: "Please upload a PowerPoint file (.ppt or .pptx)",
    });
  }

  const inputPath = req.file.path;
  const outputFileName =
    path.basename(req.file.originalname, path.extname(req.file.originalname)) +
    ".pdf";
  const outputPath = path.join(__dirname, "../converted", outputFileName);

  try {
    // Read the uploaded PowerPoint file
    const pptBuffer = fs.readFileSync(inputPath);

    // Convert to PDF using libreoffice-convert
    const pdfBuffer = await new Promise((resolve, reject) => {
      libre.convert(pptBuffer, ".pdf", undefined, (err, result) => {
        if (err) {
          reject(new Error(`Conversion failed: ${err.message}`));
        } else {
          resolve(result);
        }
      });
    });

    // Save the converted PDF
    fs.writeFileSync(outputPath, pdfBuffer);

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${outputFileName}"`
    );

    // Stream PDF to client
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Cleanup after streaming
    fileStream.on("end", () => {
      cleanUpFiles([inputPath, outputPath]);
    });

    fileStream.on("error", (err) => {
      console.error("File stream error:", err);
      cleanUpFiles([inputPath, outputPath]);
      res.status(500).json({ error: "Error streaming the converted file" });
    });
  } catch (error) {
    console.error("Conversion error:", error);
    cleanUpFiles([inputPath, outputPath]);

    res.status(500).json({
      error: "Conversion failed",
      details: error.message,
    });
  }
};
