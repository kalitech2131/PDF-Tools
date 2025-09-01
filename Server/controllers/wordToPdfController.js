// const { spawn } = require("child_process");
// const fs = require("fs");
// const path = require("path");

// // Use a single absolute uploads directory (no reliance on CWD or __dirname differences)
// const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// // Make sure uploads dir exists (also created in server, but double-safety)
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// exports.convertWordToPdf = (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No Word file uploaded." });
//   }

//   const inputPath = path.resolve(req.file.path);
//   const inputBase = path.parse(inputPath).name;
//   const outputPath = path.join(UPLOADS_DIR, `${inputBase}.pdf`);
    
// // Allow overriding soffice path via env if it's not on PATH
//   const sofficeBin = process.env.SOFFICE_BIN || "soffice";
//   const args = [
//     "--headless",
//     "--norestore",
//     "--nolockcheck",
//     "--convert-to", "pdf:writer_pdf_Export",
//     inputPath,
//     "--outdir", UPLOADS_DIR
//   ];

//   let stderr = "";
//   let stdout = "";

//   try {
//     const child = spawn(sofficeBin, args, { env: process.env });

//     // Collect LO output (LibreOffice often logs to stderr even when successful)
//     child.stdout.on("data", (d) => (stdout += d.toString()));
//     child.stderr.on("data", (d) => (stderr += d.toString()));

//     // Avoid hangs on bad/corrupt docs
//     const timeoutMs = 90_000;
//     const killer = setTimeout(() => {
//       try { child.kill("SIGKILL"); } catch {}
//     }, timeoutMs);

//     child.on("close", (code) => {
//       clearTimeout(killer);

//       // Success path: LO exits 0 and output file exists in our absolute outdir
//       if (code === 0 && fs.existsSync(outputPath)) {
//         res.download(outputPath, path.basename(outputPath), (err) => {
//           // clean up temp files
//           try {
//             if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
//             if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
//           } catch (cleanupErr) {
//             console.error("Cleanup error:", cleanupErr);
//           }
//           if (err && !res.headersSent) {
//             res.status(500).json({ message: "Error sending the file" });
//           }
//         });
//       } else {
//         // Failure: clean input and return detailed error so client can surface it
//         try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}

//         return res.status(500).json({
//           error: "Conversion failed",
//           details: stderr || stdout || "No output from LibreOffice.",
//           hint: "Ensure 'soffice' is installed and accessible; uploads dir must be writable."
//         });
//       }
//     });
//   } catch (err) {
//     try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
//     console.error("Unexpected error:", err);
//     return res.status(500).json({ error: "Unexpected error occurred." });
//   }
// };





const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Use a single absolute uploads directory (no reliance on CWD or __dirname differences)
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// Make sure uploads dir exists (also created in server, but double-safety)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Main conversion function using LibreOffice
const convertWordToPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Word file uploaded." });
  }

  const inputPath = path.resolve(req.file.path);
  const inputBase = path.parse(inputPath).name;
  const outputPath = path.join(UPLOADS_DIR, `${inputBase}.pdf`);
    
  // FIX: Use full path to soffice to avoid PATH issues
  const sofficePath = process.env.SOFFICE_PATH || 
                     'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
  
  const args = [
    "--headless",
    "--norestore",
    "--nolockcheck",
    "--convert-to", "pdf:writer_pdf_Export",
    inputPath,
    "--outdir", UPLOADS_DIR
  ];

  let stderr = "";
  let stdout = "";

  // FIX: Check if soffice exists at the specified path
  if (!fs.existsSync(sofficePath)) {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    return res.status(500).json({ 
      error: "LibreOffice not found",
      details: `Could not find soffice at: ${sofficePath}`,
      hint: "Install LibreOffice or set SOFFICE_PATH environment variable"
    });
  }

  try {
    const child = spawn(sofficePath, args, { env: process.env });

    // Collect LO output
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    // Avoid hangs on bad/corrupt docs
    const timeoutMs = 90_000;
    const killer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch {}
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(killer);

      // Success path
      if (code === 0 && fs.existsSync(outputPath)) {
        res.download(outputPath, path.basename(outputPath), (err) => {
          // Clean up temp files
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
          if (err && !res.headersSent) {
            res.status(500).json({ message: "Error sending the file" });
          }
        });
      } else {
        // Failure: clean input and return detailed error
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}

        return res.status(500).json({
          error: "Conversion failed",
          details: stderr || stdout || "No output from LibreOffice.",
          hint: "Ensure LibreOffice is installed correctly and the file is a valid DOCX."
        });
      }
    });
    
    // FIX: Added error event handler for spawn
    child.on("error", (err) => {
      clearTimeout(killer);
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
      console.error("Spawn error:", err);
      return res.status(500).json({ 
        error: "Failed to start LibreOffice",
        details: err.message,
        hint: "Check if LibreOffice is installed and SOFFICE_PATH is set correctly"
      });
    });
  } catch (err) {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error occurred." });
  }
};

// Alternative implementation using Python script
const convertWordToPdfPython = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Word file uploaded." });
  }

  const inputPath = path.resolve(req.file.path);
  const inputBase = path.parse(inputPath).name;
  const outputPath = path.join(UPLOADS_DIR, `${inputBase}.pdf`);

  try {
    // Use Python script for conversion
    const python = spawn('python', [
      path.resolve(__dirname, 'converter_word_to_pdf.py'),
      inputPath,
      outputPath
    ]);

    let stderr = '';
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        res.download(outputPath, path.basename(outputPath), (err) => {
          // Clean up temp files
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
          if (err && !res.headersSent) {
            res.status(500).json({ message: "Error sending the file" });
          }
        });
      } else {
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
        return res.status(500).json({
          error: "Conversion failed",
          details: stderr || "Python conversion failed",
          hint: "Ensure python is installed and docx2pdf package is available"
        });
      }
    });

    python.on('error', (err) => {
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
      return res.status(500).json({ 
        error: "Failed to start Python",
        details: err.message,
        hint: "Check if Python is installed and available in PATH"
      });
    });
  } catch (err) {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error occurred." });
  }
};

// Export both functions properly
module.exports = {
  convertWordToPdf,
  convertWordToPdfPython
};