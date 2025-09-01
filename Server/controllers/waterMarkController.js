// const { PDFDocument, rgb, degrees } = require("pdf-lib");
// const fs = require("fs");
// const path = require("path");

// const outputDir = "outputs";
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir, { recursive: true });
// }

// exports.addWatermark = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
//     if (!req.body.watermarkText) {
//       return res.status(400).json({ error: "Watermark text is required" });
//     }

//     const pdfBytes = fs.readFileSync(req.file.path);
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();
//     const helveticaFont = await pdfDoc.embedFont("Helvetica");

//     const watermarkText = req.body.watermarkText;
//     const position = req.body.watermarkPosition || "center";
//     const fontSize = 48;
//     const opacity = 0.5;
//     const rotationAngle = degrees(-45);

//     const textWidth = helveticaFont.widthOfTextAtSize(
//       watermarkText,
//       fontSize
//     );

//     // Add watermark on each page
//     pages.forEach((page) => {
//       const { width, height } = page.getSize();

//       let x, y;
//       switch (position) {
//         case "left":
//           x = 40;
//           y = height / 2;
//           break;
//         case "right":
//           x = width - textWidth - 40;
//           y = height / 2;
//           break;
//         case "center":
//         default:
//           x = (width - textWidth) / 2;
//           y = height / 2;
//       }

//       page.drawText(watermarkText, {
//         x,
//         y,
//         size: fontSize,
//         font: helveticaFont,
//         color: rgb(0.5, 0.5, 0.5),
//         opacity: opacity,
//         rotate: rotationAngle,
//       });
//     });

//     const watermarkedPdfBytes = await pdfDoc.save();
//     const outputPath = path.join(outputDir, `watermarked-${Date.now()}.pdf`);
//     fs.writeFileSync(outputPath, watermarkedPdfBytes);

//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=watermarked-${req.file.originalname}`
//     );
//     res.setHeader("Content-Type", "application/pdf");

//     const fileStream = fs.createReadStream(outputPath);
//     fileStream.pipe(res);

//     fileStream.on("end", () => {
//       // cleanup
//       fs.unlinkSync(req.file.path);
//       setTimeout(() => {
//         fs.unlinkSync(outputPath);
//       }, 300000); // 5 min delete
//     });
//   } catch (err) {
//     console.error("Watermark error:", err);
//     res.status(500).json({ error: "Failed to add watermark" });
//   }
// };



















const { PDFDocument, rgb, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const outputDir = "outputs";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

exports.addWatermark = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.body.watermarkText) {
      return res.status(400).json({ error: "Watermark text is required" });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    
    // Load PDF with encryption handling
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      ignoreEncryption: true 
    });
    
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont("Helvetica");

    const watermarkText = req.body.watermarkText;
    const position = req.body.watermarkPosition || "center";
    const fontSize = 48;
    const opacity = 0.5;
    const rotationAngle = degrees(-45);

    const textWidth = helveticaFont.widthOfTextAtSize(
      watermarkText,
      fontSize
    );

    // Add watermark on each page
    pages.forEach((page) => {
      const { width, height } = page.getSize();

      let x, y;
      switch (position) {
        case "left":
          x = 40;
          y = height / 2;
          break;
        case "right":
          x = width - textWidth - 40;
          y = height / 2;
          break;
        case "center":
        default:
          x = (width - textWidth) / 2;
          y = height / 2;
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity,
        rotate: rotationAngle,
      });
    });

    const watermarkedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(outputDir, `watermarked-${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, watermarkedPdfBytes);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=watermarked-${req.file.originalname}`
    );
    res.setHeader("Content-Type", "application/pdf");

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      // cleanup
      fs.unlinkSync(req.file.path);
      setTimeout(() => {
        fs.unlinkSync(outputPath);
      }, 300000); // 5 min delete
    });
  } catch (err) {
    console.error("Watermark error:", err);
    
    // Handle specific error cases
    if (err.message.includes('encrypted')) {
      return res.status(400).json({ 
        error: "Cannot process encrypted PDF files. Please upload a non-encrypted PDF." 
      });
    }
    
    res.status(500).json({ error: "Failed to add watermark" });
  }
};