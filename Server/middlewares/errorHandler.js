const multer = require('multer');

module.exports = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Unexpected error' });
  }
  res.status(500).json({ message: 'Unknown error' });
};
