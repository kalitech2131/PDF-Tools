import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UnlockPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [unlockedFileUrl, setUnlockedFileUrl] = useState('');
  const [convertedFileName, setConvertedFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('application/pdf')) {
        setError('Please upload a PDF file');
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
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleUnlockClick = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }
    if (!password) {
      setError('Please enter the PDF password');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      formData.append('password', password);

      const response = await axios.post('http://localhost:5000/api/unlock-pdf', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `unlocked-${Date.now()}.pdf`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setUnlockedFileUrl(url);
      setConvertedFileName(filename);
      navigate('/unlock-pdf/download');
    } catch (err) {
      setError('Unlocking failed. Please check the password and try again.');
      console.error('Unlock error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement('a');
    link.href = unlockedFileUrl;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(unlockedFileUrl);
    setUnlockedFileUrl('');
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setPassword('');
    setUnlockedFileUrl('');
    navigate('/unlock-pdf');
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        {/* Header */}
        <header className="bg-white py-4 shadow-sm flex-shrink-0">
          <div className="container mx-auto px-4">
            <h1 className="text-xl font-bold text-lime-600">PDF Tools</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-lime-600 mb-6">Unlocking Successful!</h1>
            <p className="text-gray-700 mb-8">Your unlocked PDF is ready to download.</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-lime-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-lime-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF File
              </button>
              
              <button
                onClick={handleNewConversion}
                className="bg-white text-lime-500 border border-lime-500 px-6 py-3 rounded-full font-semibold hover:bg-lime-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Unlock Another PDF
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
      {isProcessing ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Unlocking PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-lime-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-lime-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-lime-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Unlock PDF
          </h2>

          <p className="text-gray-700 mb-6">Remove password protection from your PDF files.</p>

          {error && <p className="text-red-500 mb-4">{error}</p>}

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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-lime-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-gray-700">
                {selectedFile ? selectedFile.name : "Click or Drop PDF Here"}
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-lime-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-lime-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-lime-100 rounded-md">
            <label className="block text-gray-700 mb-2 font-medium">PDF Password:</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Enter PDF password"
            />
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {/* <button className="bg-lime-500 text-white border border-lime-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-lime-500 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
              </svg>
              Dropbox
            </button> */}

            {/* <button className="bg-lime-500 text-white border border-lime-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-lime-500 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
              </svg>
              Google Drive
            </button> */}
          </div>

          <div className="mt-6">
            <button
              onClick={handleUnlockClick}
              disabled={!selectedFile || !password || isProcessing}
              className="bg-white text-lime-500 border border-lime-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-lime-500 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isProcessing ? 'Processing...' : 'Unlock PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnlockPdf;