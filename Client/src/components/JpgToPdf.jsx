import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JpgToPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [convertedFileName, setConvertedFileName] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndSetFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    validateAndSetFiles(files);
  };

  const validateAndSetFiles = (files) => {
    const invalidFiles = files.filter(file => 
      !file.type.match('image/jpeg') && !file.type.match('image/jpg')
    );
    
    if (invalidFiles.length > 0) {
      setError('Please upload only JPG/JPEG images');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('File size should be less than 10MB');
      return;
    }
    
    setSelectedFiles(files);
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleConvertClick = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one JPG file');
      return;
    }
    
    setIsConverting(true);
    setError('');
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post('http://localhost:5000/api/convert-jpg-to-pdf', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `converted-${Date.now()}.pdf`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      setConvertedFileName(filename);
      navigate('/jpg-to-pdf/download');
    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
  };

  const handleNewConversion = () => {
    setSelectedFiles([]);
    setDownloadUrl('');
    navigate('/jpg-to-pdf');
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
            <p className="text-gray-700 mb-8">Your PDF file is ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF File
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-yellow-500 border border-yellow-500 px-6 py-3 rounded-full font-semibold hover:bg-yellow-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Convert New Images
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
            Converting JPG to PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-yellow-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-yellow-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            JPG to PDF
          </h2>

          <p className="text-gray-700 mb-6">Convert your JPG images to a single PDF file.</p>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div 
            className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              name="file"
              accept="image/jpeg, image/jpg"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              multiple
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-gray-700">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} file(s) selected` 
                  : "Click or Drop JPG Images Here"}
              </p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-md">
              <h3 className="text-gray-700 font-medium mb-2">Selected Files:</h3>
              <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="truncate py-1">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {/* <button className="bg-yellow-500 text-white border border-yellow-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-yellow-500 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
              </svg>
              Dropbox
            </button> */}

            {/* <button className="bg-yellow-500 text-white border border-yellow-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-yellow-500 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
              </svg>
              Google Drive
            </button> */}
            
          </div>

          <div className="mt-6">
            <button
              onClick={handleConvertClick}
              disabled={selectedFiles.length === 0 || isConverting}
              className="bg-white text-yellow-500 border border-yellow-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-yellow-500 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default JpgToPdf;