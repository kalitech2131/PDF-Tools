const poppler = require("pdf-poppler");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const { cleanDirectory } = require("../utils/fileUtils");

exports.convertPdfToJpg = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

  const pdfPath = req.file.path;
  const outputDir = path.join(__dirname, "../converted", `conversion_${Date.now()}`);
  const originalName = path.parse(req.file.originalname).name;
  const zipName = `${originalName}_images.zip`;

  try {
    fs.mkdirSync(outputDir, { recursive: true });

    const opts = {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: "page",
      scale: 1200
    };

    await poppler.convert(pdfPath, opts);

    const jpgFiles = fs.readdirSync(outputDir).filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg"));
    if (jpgFiles.length === 0) throw new Error("Conversion failed - no JPG files created");

    const zipPath = path.join(__dirname, "../temp_zips", zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", err => { throw err; });
    archive.pipe(output);

    jpgFiles.forEach(file => archive.file(path.join(outputDir, file), { name: file }));
    await archive.finalize();

    output.on("close", () => {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
      const readStream = fs.createReadStream(zipPath);
      readStream.pipe(res);

      readStream.on("close", () => {
        try {
          fs.unlinkSync(pdfPath);
          cleanDirectory(outputDir);
          fs.unlinkSync(zipPath);
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
    });
  } catch (error) {
    console.error("Conversion error:", error);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    if (fs.existsSync(outputDir)) cleanDirectory(outputDir);
    res.status(500).json({ error: "Failed to convert PDF to JPG", details: error.message });
  }
};
