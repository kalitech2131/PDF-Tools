// converters/pdfToImage.js
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');
const archiver = require('archiver');

const convertPdfToImagesAndZip = async (pdfPath, outputDir, zipDir) => {
  const fileName = path.basename(pdfPath, '.pdf');
  const imageOutputPath = path.join(outputDir, fileName);

  // Create output image folder if not exists
  if (!fs.existsSync(imageOutputPath)) {
    fs.mkdirSync(imageOutputPath, { recursive: true });
  }

  // Setup converter
  const converter = fromPath(pdfPath, {
    density: 150,
    saveFilename: fileName,
    savePath: imageOutputPath,
    format: "png",
    width: 1200,
    height: 1600
  });

  // Get number of pages
  const pages = await converter(1, true); // check total pages
  const totalPages = pages.length || pages.page || 1;

  const imagePromises = [];
  for (let i = 1; i <= totalPages; i++) {
    imagePromises.push(converter(i));
  }

  await Promise.all(imagePromises);

  // Create zip
  const zipFilePath = path.join(zipDir, `${fileName}.zip`);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipFilePath));
    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    fs.readdirSync(imageOutputPath)
      .filter(file => file.endsWith('.png'))
      .forEach(file => {
        archive.file(path.join(imageOutputPath, file), { name: file });
      });

    archive.finalize();
  });
};

module.exports = convertPdfToImagesAndZip;
