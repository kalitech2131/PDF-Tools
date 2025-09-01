import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const PdfToPng = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState(null);
  const [error, setError] = useState(null);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setError(null);
      }
    },
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleApiCall = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first!");
      return;
    }

    setIsConverting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/images/convert-pdf-to-image', 
        formData, 
        { 
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setConvertedFileUrl(url);
      navigate('/pdf-to-png/download');
    } catch (err) {
      console.error('Error during conversion:', err);
      let errorMsg = 'An error occurred during conversion.';
      
      if (err.response) {
        if (err.response.status === 413) {
          errorMsg = 'File too large. Maximum size is 50MB.';
        } else if (err.response.data instanceof Blob) {
          const errorText = await err.response.data.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.message || errorMsg;
          } catch {
            errorMsg = errorText || errorMsg;
          }
        }
      }
      
      setError(errorMsg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (convertedFileUrl && selectedFile) {
      const link = document.createElement('a');
      link.href = convertedFileUrl;
      link.download = `${selectedFile.name.replace('.pdf', '')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(convertedFileUrl);
      setConvertedFileUrl(null);
    }
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setConvertedFileUrl(null);
    setError(null);
    navigate('/pdf-to-png');
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        {/* Header */}
        <header className="bg-white py-4 shadow-sm flex-shrink-0">
          <div className="container mx-auto px-4">
            <h1 className="text-xl font-bold text-green-600">PDF Tools</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-green-600 mb-6">Conversion Successful!</h1>
            <p className="text-gray-700 mb-8">Your PNG files are ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PNG Files
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-green-500 border border-green-500 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
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
            Converting PDF to PNG...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            PDF to PNG
          </h2>

          <p className="text-gray-700 mb-6">Convert your PDF files to high-quality PNG images.</p>

          <div 
            {...getRootProps()} 
            className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-green-800 transition cursor-pointer relative"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-gray-700">
                {isDragActive ? 'Drop the PDF here...' : 'Click or Drop PDF Here'}
              </p>
              <p className="text-sm text-gray-500">(Max 50MB)</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-green-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleApiCall}
              disabled={!selectedFile || isConverting}
              className="bg-white text-green-500 border border-green-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-green-600 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isConverting ? 'Converting...' : 'Convert to PNG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToPng;