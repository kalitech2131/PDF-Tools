import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PdfToJpg = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [zipBlobUrl, setZipBlobUrl] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setSelectedFile(null);
      setError('Please select a valid PDF file');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsConverting(true);
    setError('');

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/api/convert-pdf-to-jpg', formData, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      setZipBlobUrl(url);
      navigate('/pdf-to-jpg/download');
    } catch (err) {
      let errorMessage = 'Conversion failed. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        if (err.response.data.details) {
          errorMessage += ` (${err.response.data.details})`;
        }
      }
      setError(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (!zipBlobUrl) return;

    const link = document.createElement('a');
    link.href = zipBlobUrl;
    link.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_images.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(zipBlobUrl);
    setZipBlobUrl(null);
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setZipBlobUrl(null);
    navigate('/pdf-to-jpg');
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
          
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-yellow-600 mb-6">Conversion Successful!</h1>
            <p className="text-gray-700 mb-8">Your JPG images (ZIP file) is ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download ZIP File
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-yellow-500 border border-yellow-500 px-6 py-3 rounded-full font-semibold hover:bg-yellow-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Convert New PDF
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
            Converting PDF to JPG...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-yellow-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-yellow-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            PDF to JPG
          </h2>

          <p className="text-gray-700 mb-6">Convert your PDF pages into JPG images inside a ZIP file.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-yellow-600 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
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
              className="bg-yellow-500 text-white border border-yellow-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-yellow-500 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
              </svg>
              Dropbox
            </button> */}

            {/* <button 
              onClick={handleGoogleDriveSelect}
              className="bg-yellow-500 text-white border border-yellow-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-yellow-500 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
              </svg>
              Google Drive
            </button> */}
          </div>

          <div className="mt-6">
            <button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="bg-white text-yellow-500 border border-yellow-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-yellow-600 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isConverting ? 'Converting...' : 'Convert to JPG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToJpg;