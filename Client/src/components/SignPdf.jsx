import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const SignPdf = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signedPdfBlob, setSignedPdfBlob] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');

  const signatureCanvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setSignedPdfBlob(null);
    }
  };

  const handleOpenSignatureModal = () => setShowSignatureModal(true);

  const handleCloseSignatureModal = () => {
    setShowSignatureModal(false);
    setSignatureDataUrl('');
    setTypedSignature('');
    clearSignature(); // canvas भी clear कर दे
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
    setTypedSignature('');
  };

  const handleApplySignature = async () => {
    if (!pdfFile) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      let pngImage;
      if (signatureDataUrl) {
        const pngImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
        pngImage = await pdfDoc.embedPng(pngImageBytes);
      }

      let font;
      if (typedSignature.trim()) {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      for (const page of pages) {
        const { width } = page.getSize();

        if (pngImage) {
          page.drawImage(pngImage, {
            x: width - 150,
            y: 100,
            width: 100,
            height: 40,
          });
        }

        if (typedSignature.trim()) {
          page.drawText(typedSignature, {
            x: width - 150,
            y: 80,
            size: 14,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      setSignedPdfBlob(signedBlob);
      setShowSignatureModal(false);
    } catch (err) {
      console.error('Error applying signature:', err);
      alert('Something went wrong while signing PDF.');
    }
  };

  const handleDownloadSignedPDF = () => {
    if (!signedPdfBlob) return;
    const url = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signed-document.pdf';
    a.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center rounded-3xl border border-gray-200 shadow-xl p-10 bg-blue-400">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <i className="fa-solid fa-pen-nib text-blue-600"></i>
          Sign PDF
        </h2>
        <p className="text-gray-700 mb-6">Draw and type your name to sign every page of the PDF.</p>

        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-gray-50 hover:border-blue-800 transition cursor-pointer relative mb-6">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            {/* <i className="fa-solid fa-file-pdf text-red-500 text-3xl"></i> */}
            <p className="font-medium text-gray-700">
              {pdfFile ? pdfFile.name : 'Click or Drop PDF Here'}
            </p>
            <p className="text-sm text-gray-500">(PDF files only)</p>
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-4">
          <button
            onClick={handleOpenSignatureModal}
            disabled={!pdfFile}
            className={`px-6 py-2 rounded-full font-semibold shadow-md transition-all ${
              pdfFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-signature mr-2"></i> Add Signature
          </button>

          {signedPdfBlob && (
            <button
              onClick={handleDownloadSignedPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 font-semibold"
            >
              <i className="fa-solid fa-download mr-2"></i>Download PDF
            </button>
          )}
        </div>

        {showSignatureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-white p-5 border-b border-gray-200 text-center">
                <h3 className="text-2xl font-bold text-gray-800">Add Signature</h3>
              </div>

              <div className="p-6 space-y-4">
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={100}
                  className="border border-gray-300 rounded"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />

                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-center text-lg"
                />

                <div className="flex justify-between">
                  <button
                    onClick={clearSignature}
                    className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApplySignature}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-right">
                <button
                  onClick={handleCloseSignatureModal}
                  className="px-5 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignPdf;