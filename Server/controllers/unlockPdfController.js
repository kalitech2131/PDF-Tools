const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.unlockPdf = (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  if (!req.body.password) return res.status(400).send("No password provided.");

  const inputPath = req.file.path;
  const outputPath = `${inputPath}_unlocked.pdf`;
  const password = req.body.password;

  const scriptPath = path.join(__dirname, "../remove_password.py"); 

  const pythonProcess = spawn("python", [
    scriptPath,
    inputPath,
    outputPath,
    password,
  ]);

  pythonProcess.stdout.on("data", (data) =>
    console.log(`Python Script stdout: ${data}`)
  );
  pythonProcess.stderr.on("data", (data) =>
    console.error(`Python Script stderr: ${data}`)
  );

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.download(outputPath, (err) => {
        if (err) console.error("Error sending the file:", err);

        // Cleanup
        fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      });
    } else {
      res
        .status(500)
        .send("Failed to unlock the PDF. Please check the password.");

      // Cleanup
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }
  });

  pythonProcess.on('error', (err) => {
        console.error(`Python execution error: ${err}`);
        res.status(500).send('Internal server error during PDF securing.');
        fs.unlinkSync(inputPath);
    });
};
