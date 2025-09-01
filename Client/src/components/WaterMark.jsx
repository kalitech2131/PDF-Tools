
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaterMark = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [convertedFileName, setConvertedFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('application/pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.match('application/pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleWatermarkClick = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }
    if (!watermarkText.trim()) {
      setError('Please enter watermark text');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('watermarkText', watermarkText);
      formData.append('watermarkPosition', watermarkPosition);

      const response = await axios.post('http://localhost:5000/api/add-watermark', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Check if response is an error (JSON) instead of a file
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.error || 'Watermarking failed');
          } catch (e) {
            setError('Watermarking failed. Please try again.');
          }
          setIsProcessing(false);
        };
        reader.readAsText(response.data);
        return;
      }

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `watermarked-${selectedFile.name}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      setConvertedFileName(filename);
      navigate('/watermark/download');
    } catch (err) {
      if (err.response && err.response.data) {
        // Handle JSON error responses
        if (err.response.headers['content-type']?.includes('application/json')) {
          setError(err.response.data.error || 'Watermarking failed');
        } else {
          setError('Watermarking failed. Please try again.');
        }
      } else {
        setError('Watermarking failed. Please try again.');
      }
      console.error('Watermark error:', err);
    } finally {
      setIsProcessing(false);
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
    setSelectedFile(null);
    setWatermarkText('');
    setWatermarkPosition('center');
    setDownloadUrl('');
    setError('');
    navigate('/watermark');
  };

  // Position button styling function
  const getPositionButtonClass = (position) => {
    return `px-4 py-2 rounded-md transition ${
      watermarkPosition === position 
        ? 'bg-purple-600 text-white shadow-md transform scale-105' 
        : 'bg-white text-purple-500 border border-purple-500 hover:bg-purple-50'
    }`;
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
            <h1 className="text-3xl font-bold text-purple-600 mb-6">Watermark Added!</h1>
            <p className="text-gray-700 mb-8">Your watermarked PDF is ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF File
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-purple-500 border border-purple-500 px-6 py-3 rounded-full font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Add New Watermark
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

  // Main Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      {isProcessing ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Adding Watermark...
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Please wait while we process your PDF
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-purple-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-purple-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Add Watermark
          </h2>

          <p className="text-gray-700 mb-6">Add watermark to your PDF files</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-500 font-medium">{error}</p>
              {error.includes('encrypted') && (
                <p className="text-red-400 text-sm mt-1">
                  Tip: Try removing password protection from your PDF before uploading.
                </p>
              )}
            </div>
          )}

          <div 
            className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              name="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-gray-700">
                {selectedFile ? selectedFile.name : "Click or Drop PDF Here"}
              </p>
              <p className="text-sm text-gray-500">Max file size: 10MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-purple-100 rounded-md">
              <label className="block text-gray-700 mb-2 font-medium">Watermark Text:</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                placeholder="Enter watermark text"
              />
              
              <label className="block text-gray-700 mb-2 font-medium">Watermark Position:</label>
              <div className="flex justify-center gap-4 mb-2">
                <button
                  onClick={() => setWatermarkPosition('left')}
                  className={getPositionButtonClass('left')}
                >
                  Left
                </button>
                <button
                  onClick={() => setWatermarkPosition('center')}
                  className={getPositionButtonClass('center')}
                >
                  Center
                </button>
                <button
                  onClick={() => setWatermarkPosition('right')}
                  className={getPositionButtonClass('right')}
                >
                  Right
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected position: <span className="font-semibold text-purple-600">{watermarkPosition}</span>
              </p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleWatermarkClick}
              disabled={!selectedFile || !watermarkText.trim() || isProcessing}
              className="bg-white text-purple-500 border border-purple-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-purple-500 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {isProcessing ? 'Processing...' : 'Add Watermark'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterMark;