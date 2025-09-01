const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const poppler = require("pdf-poppler");

// Directories
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const OUTPUT_DIR = path.join(__dirname, "../converted_images");
const TEMP_ZIP_DIR = path.join(__dirname, "../temp_zips");

// Cleanup utility
const cleanup = (files, dirs) => {
  files.forEach(file => fs.existsSync(file) && fs.unlinkSync(file));
  dirs.forEach(dir => fs.existsSync(dir) && fs.rmSync(dir, { recursive: true, force: true }));
};

exports.convertPdfToImages = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file uploaded." });

  const pdfFilePath = req.file.path;
  const outputImageName = path.basename(req.file.filename, path.extname(req.file.filename));
  const currentOutputImagesDir = path.join(OUTPUT_DIR, outputImageName + "_" + Date.now());
  const zipFileName = `${outputImageName}.zip`;
  const zipFilePath = path.join(TEMP_ZIP_DIR, zipFileName);

  let cleanupFiles = [pdfFilePath];
  let cleanupDirs = [];

  try {
    if (!fs.existsSync(currentOutputImagesDir)) fs.mkdirSync(currentOutputImagesDir, { recursive: true });
    cleanupDirs.push(currentOutputImagesDir);
    if (!fs.existsSync(TEMP_ZIP_DIR)) fs.mkdirSync(TEMP_ZIP_DIR, { recursive: true });

    const options = {
      format: "png",
      out_dir: currentOutputImagesDir,
      out_prefix: outputImageName,
      page: null
    };

    console.log(`Converting PDF: ${pdfFilePath}`);
    await poppler.convert(pdfFilePath, options);
    console.log("Conversion complete.");

    const imageFiles = fs.readdirSync(currentOutputImagesDir)
      .filter(file => file.endsWith(".png"))
      .map(file => path.join(currentOutputImagesDir, file));

    if (!imageFiles.length) throw new Error("No images were generated.");

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    cleanupFiles.push(zipFilePath);

    output.on("close", () => {
      res.download(zipFilePath, zipFileName, err => {
        if (err) console.error("Download error:", err);
        cleanup(cleanupFiles, cleanupDirs);
      });
    });

    archive.on("warning", err => { if (err.code !== "ENOENT") throw err; });
    archive.on("error", err => { throw err; });

    archive.pipe(output);
    imageFiles.forEach(file => archive.file(file, { name: path.basename(file) }));
    await archive.finalize();

  } catch (err) {
    console.error("Error during conversion:", err);
    cleanup(cleanupFiles, cleanupDirs);
    res.status(500).json({ error: "Conversion or zipping failed. Check server logs." });
  }
};
