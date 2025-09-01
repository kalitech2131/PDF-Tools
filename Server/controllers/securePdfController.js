const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.securePdf = (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  if (!req.body.password) return res.status(400).send("No password provided.");

  const inputPath = req.file.path;
  const outputPath = `${inputPath}_secured.pdf`;
  const password = req.body.password;

  const scriptPath = path.join(__dirname, "../secure_pdf.py");

  const py = spawn("python", [scriptPath, inputPath, outputPath, password]);

  py.stdout.on("data", (d) => console.log(`secure_pdf.py: ${d}`));
  py.stderr.on("data", (d) => console.error(`secure_pdf.py ERR: ${d}`));

  const cleanup = () => {
    try { fs.existsSync(inputPath) && fs.unlinkSync(inputPath); } catch {}
    try { fs.existsSync(outputPath) && fs.unlinkSync(outputPath); } catch {}
  };

  py.on("close", (code) => {
    if (code === 0) {
      // stream the protected file to client then clean up
      res.download(outputPath, path.basename(outputPath), (err) => {
        if (err) console.error("Send error:", err);
        cleanup();
      });
    } else {
      res.status(500).send("Failed to protect the PDF. Check the file or password.");
      cleanup();
    }
  });

  py.on("error", (err) => {
    console.error("Python spawn error:", err);
    res.status(500).send("Internal error while protecting PDF.");
    cleanup();
  });
};
