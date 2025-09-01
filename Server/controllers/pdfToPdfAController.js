const fs = require('fs');

exports.convertToPdfA = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Just send original file for now (demo)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.file.originalname.replace('.pdf', '-pdfa.pdf')}"`
    );

    const fileStream = fs.createReadStream(req.file.path);
    fileStream.pipe(res);

    fileStream.on('close', () => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }
    res.status(500).json({ error: 'Conversion failed. Please try again.' });
  }
};
