// const fs = require("fs");
// const path = require("path");
// const { exec } = require("child_process");
// const pdf = require("pdf-parse");
// const PptxGenJS = require("pptxgenjs");
// var xlsx = require("xlsx");

// // Ensure directories exist
// const ensureDirectoriesExist = () => {
//   ["uploads", "slides", "converted"].forEach((dir) => {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//   });
// };
// ensureDirectoriesExist();

// // PDF to Excel conversion function
// exports.convertPdfToExcel = async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//   const pdfPath = path.resolve(req.file.path);
//   const outputFileName = `${
//     path.parse(req.file.originalname).name
//   }-converted.xlsx`;
//   const outputExcelPath = path.resolve(`converted/${outputFileName}`);

//   try {
//     const dataBuffer = fs.readFileSync(pdfPath);
//     const pdfData = await pdf(dataBuffer);

//     // Split text by lines
//     const lines = pdfData.text.split("\n");

//     // Convert lines to Excel rows
//     const worksheetData = lines.map((line) => [line]);
//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

//     xlsx.writeFile(workbook, outputExcelPath);

//     // Stream Excel file to client
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${outputFileName}"`
//     );
//     const fileStream = fs.createReadStream(outputExcelPath);
//     fileStream.pipe(res);

//     // Cleanup after sending
//     fileStream.on("close", () => {
//       if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
//       if (fs.existsSync(outputExcelPath)) fs.unlinkSync(outputExcelPath);
//     });
//   } catch (error) {
//     console.error("PDF-to-Excel conversion error:", error);
//     res.status(500).json({ message: "Conversion failed. Please try again." });
//     if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
//   }
// };

// // PDF → PowerPoint
// exports.pdfToPowerPoint = async (req, res) => {
//   let pdfFilePath, outputFileName, outputPptxPath;

//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     pdfFilePath = path.resolve(req.file.path);
//     outputFileName = `${path.parse(req.file.originalname).name}-converted.pptx`;
//     outputPptxPath = path.resolve(`converted/${outputFileName}`);

//     // Verify PDF
//     const dataBuffer = fs.readFileSync(pdfFilePath);
//     await pdf(dataBuffer).catch(() => {
//       throw new Error("Invalid PDF file. Please upload a valid PDF.");
//     });

//     // Convert PDF → images
//     const popplerPath = "C:\Users\admin\Downloads\Release-25.07.0-0 (1)\poppler-25.07.0\Library\bin\pdftoppm.exe";

//     const convertCommand = `${popplerPath} -png "${pdfFilePath}" "${path.resolve(
//       "slides/slide"
//     )}"`;

//     await new Promise((resolve, reject) => {
//       exec(convertCommand, (error, stdout, stderr) => {
//         if (error) {
//           console.error("pdftoppm error:", error);
//           console.error("stderr:", stderr);
//           return reject(new Error("Failed to convert PDF to images."));
//         }
//         console.log("pdftoppm stdout:", stdout);
//         resolve();
//       });
//     });

//     // Create PPTX
//     const pptx = new PptxGenJS();
//     const slideImages = fs
//       .readdirSync(path.resolve("slides"))
//       .filter((file) => file.match(/\.png$/i))
//       .sort(
//         (a, b) =>
//           parseInt(a.match(/-?(\d+)\./)[1]) - parseInt(b.match(/-?(\d+)\./)[1])
//       );

//     if (!slideImages.length) throw new Error("No slides generated from PDF");

//     slideImages.forEach((imageFile) => {
//       const slide = pptx.addSlide();
//       slide.addImage({
//         path: path.resolve(`slides/${imageFile}`),
//         x: 0,
//         y: 0,
//         w: "100%",
//         h: "100%",
//       });
//     });

//     await pptx.writeFile({ fileName: outputPptxPath });

//     // Stream to client
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.presentationml.presentation"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${outputFileName}"`
//     );
//     fs.createReadStream(outputPptxPath)
//       .pipe(res)
//       .on("close", () => cleanupFiles(pdfFilePath, outputPptxPath));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message || "Conversion failed" });
//     cleanupFiles(pdfFilePath, outputPptxPath);
//   }
// };

// // Cleanup temporary files
// function cleanupFiles(pdfPath, pptxPath) {
//   try {
//     if (pdfPath && fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
//     if (pptxPath && fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
//     if (fs.existsSync("slides"))
//       fs.rmSync("slides", { recursive: true, force: true });
//     fs.mkdirSync("slides", { recursive: true });
//   } catch (err) {
//     console.error("Cleanup error:", err);
//   }
// }











// controllers/pdfToEx-PoController.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const pdf = require("pdf-parse");
const PptxGenJS = require("pptxgenjs");
const xlsx = require("xlsx");

// Ensure directories exist
const ensureDirectoriesExist = () => {
  ["uploads", "slides", "converted"].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
ensureDirectoriesExist();

const isWin = process.platform === "win32";

// Resolve pdftoppm executable path safely from .env
function getPdftoppmPath() {
  const binDir = process.env.POPPLER_PATH || ""; // e.g. C:\poppler\bin  OR  C:\Users\admin\...\Library\bin
  const exe = isWin ? "pdftoppm.exe" : "pdftoppm";
  if (!binDir) {
    // assume in PATH
    return exe;
  }
  const full = path.join(binDir, exe);
  if (!fs.existsSync(full)) {
    throw new Error(
      `pdftoppm not found at:\n${full}\n\n` +
      `Fix:\n1) Verify Poppler installed.\n2) .env me POPPLER_PATH=...\\bin set karein (bin folder, exe nahi)\n3) Path me spaces/() allowed hai; code execFile use kar raha hai, so it's safe.\n`
    );
  }
  return full;
}

// ---------------- PDF to Excel ----------------
exports.convertPdfToExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const pdfPath = path.resolve(req.file.path);
  const outputFileName = `${path.parse(req.file.originalname).name}-converted.xlsx`;
  const outputExcelPath = path.resolve(`converted/${outputFileName}`);

  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);

    const lines = pdfData.text.split("\n");
    const worksheetData = lines.map((line) => [line]);

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    xlsx.writeFile(workbook, outputExcelPath);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${outputFileName}"`);

    const fileStream = fs.createReadStream(outputExcelPath);
    fileStream.pipe(res);

    fileStream.on("close", () => {
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(outputExcelPath)) fs.unlinkSync(outputExcelPath);
    });
  } catch (error) {
    console.error("PDF-to-Excel conversion error:", error);
    res.status(500).json({ message: "Conversion failed. Please try again." });
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  }
};

// ---------------- PDF to PowerPoint ----------------
exports.pdfToPowerPoint = async (req, res) => {
  let pdfFilePath, outputFileName, outputPptxPath;
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    pdfFilePath = path.resolve(req.file.path);
    outputFileName = `${path.parse(req.file.originalname).name}-converted.pptx`;
    outputPptxPath = path.resolve(`converted/${outputFileName}`);

    // Verify PDF readability
    const dataBuffer = fs.readFileSync(pdfFilePath);
    await pdf(dataBuffer).catch(() => {
      throw new Error("Invalid PDF file. Please upload a valid PDF.");
    });

    // Ensure dirs exist
    ensureDirectoriesExist();

    // Build pdftoppm call safely (no manual quoting)
    const pdftoppm = getPdftoppmPath();
    const slidePrefix = path.resolve(path.join("slides", "slide")); // slide-1.png, slide-2.png ...

    await new Promise((resolve, reject) => {
      execFile(
        pdftoppm,
        ["-png", pdfFilePath, slidePrefix],
        { windowsHide: true },
        (error, stdout, stderr) => {
          if (error) {
            console.error("pdftoppm error:", error);
            console.error("stderr:", stderr);
            return reject(
              new Error(
                "Failed to convert PDF to images. Check POPPLER_PATH, file permissions, and that pdftoppm runs from that path."
              )
            );
          }
          resolve();
        }
      );
    });

    // Read generated PNGs
    const slideDir = path.resolve("slides");
    const slideImages = fs
      .readdirSync(slideDir)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .sort((a, b) => {
        const na = parseInt(a.match(/(\d+)\.png$/)?.[1] || "0", 10);
        const nb = parseInt(b.match(/(\d+)\.png$/)?.[1] || "0", 10);
        return na - nb;
      });

    if (!slideImages.length) {
      throw new Error("No slides generated from PDF");
    }

    // Build PPTX with full-bleed images
    const pptx = new PptxGenJS();
    slideImages.forEach((imageFile) => {
      const slide = pptx.addSlide();
      slide.addImage({
        path: path.join(slideDir, imageFile),
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });
    });

    await pptx.writeFile({ fileName: outputPptxPath });

    // Stream to client
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${outputFileName}"`);

    fs.createReadStream(outputPptxPath)
      .pipe(res)
      .on("close", () => cleanupFiles(pdfFilePath, outputPptxPath));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Conversion failed" });
    cleanupFiles(pdfFilePath, outputPptxPath);
  }
};

// Cleanup temporary files
function cleanupFiles(pdfPath, pptxPath) {
  try {
    if (pdfPath && fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    if (pptxPath && fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
    if (fs.existsSync("slides")) fs.rmSync("slides", { recursive: true, force: true });
    fs.mkdirSync("slides", { recursive: true });
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}


