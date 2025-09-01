import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PowerPointToPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/vnd.ms-powerpoint' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                 file.name.endsWith('.ppt') || 
                 file.name.endsWith('.pptx'))) {
      setSelectedFile(file);
      setError('');
    } else {
      setSelectedFile(null);
      setError('Please select a valid PowerPoint file (.ppt or .pptx)');
    }
  };

  const handleConvertClick = async () => {
    if (!selectedFile) {
      setError('Please select a PowerPoint file first');
      return;
    }

    setIsConverting(true);
    setError('');

    const formData = new FormData();
    formData.append('powerpointFile', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/convert-powerpoint-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      navigate('/powerpoint-to-pdf/download');
    } catch (error) {
      setError('Conversion failed: ' + error.message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (!pdfBlobUrl || !selectedFile) return;

    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = selectedFile.name.replace(/\.pptx?$/i, '.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setPdfBlobUrl(null);
    navigate('/powerpoint-to-pdf');
  };

  const handleDropboxSelect = () => {
    console.log('Dropbox integration');
  };

  const handleGoogleDriveSelect = () => {
    console.log('Google Drive integration');
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        {/* Header */}
        <header className="bg-white py-4 shadow-sm flex-shrink-0">
          <div className="container mx-auto px-4">
            <h1 className="text-xl font-bold text-red-600">PDF Tools</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-red-600 mb-6">Conversion Successful!</h1>
            <p className="text-gray-700 mb-8">Your PDF file is ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-red-500 border border-red-500 px-6 py-3 rounded-full font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Convert New File
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white py-4 border-t border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} PDF Tools. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  // Conversion Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {isConverting ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Converting PowerPoint to PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-red-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-red-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            PowerPoint to PDF
          </h2>

          <p className="text-gray-700 mb-6">Convert your PowerPoint presentations to PDF documents.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-red-600 transition cursor-pointer relative">
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-gray-700">Click or Drop PowerPoint Here</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-red-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {/* <button 
              onClick={handleDropboxSelect}
              className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-red-500 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
              </svg>
              Dropbox
            </button> */}

            {/* <button 
              onClick={handleGoogleDriveSelect}
              className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-red-500 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
              </svg>
              Google Drive
            </button> */}
          </div>

          <div className="mt-6">
            <button
              onClick={handleConvertClick}
              disabled={!selectedFile || isConverting}
              className="bg-white text-red-500 border border-red-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-red-600 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isConverting ? 'Converting...' : 'Convert to PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerPointToPdf;