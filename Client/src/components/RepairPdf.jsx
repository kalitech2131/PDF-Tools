import React, { useState } from 'react';
import axios from 'axios';

const RepairPdf = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloadScreen, setIsDownloadScreen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [repairStatus, setRepairStatus] = useState('');
  const [repairedFileName, setRepairedFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const handleRepairNowClick = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    setError('');
    setRepairStatus('Starting repair process...');

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      setRepairStatus('Uploading file to server...');
      
      const response = await axios.post('http://localhost:5000/api/repair-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setRepairStatus(`Uploading: ${percentCompleted}%`);
        }
      });

      setRepairStatus('Processing PDF file...');
      
      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const fileName = selectedFile.name.replace('.pdf', '') + '_repaired.pdf';
      
      setDownloadUrl(url);
      setRepairedFileName(fileName);
      setIsDownloadScreen(true);
      setRepairStatus('Repair completed successfully!');
      
    } catch (err) {
      console.error('Repair error:', err);
      
      // Handle error response
      if (err.response?.data instanceof Blob) {
        // Try to read error message from blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.error || 'Failed to repair PDF');
          } catch {
            setError('Failed to repair PDF. The file might be severely corrupted.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to repair PDF');
      }
      
      setRepairStatus('Repair failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = repairedFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }
  };

  const handleNewRepair = () => {
    setSelectedFile(null);
    setIsDownloadScreen(false);
    setDownloadUrl('');
    setRepairedFileName('');
    setRepairStatus('');
  };

  // Handle cloud storage buttons (placeholder functions)
  const handleDropboxClick = () => {
    alert('Dropbox integration would be implemented here');
  };

  const handleGoogleDriveClick = () => {
    alert('Google Drive integration would be implemented here');
  };

  // === Show Download Success Screen ===
  if (isDownloadScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-green-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">PDF Repaired Successfully!</h2>
          <p className="text-gray-700 mb-6">Your PDF has been repaired and is ready to download.</p>
          <button
            onClick={handleDownload}
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 mb-4"
          >
            <i className="bi bi-download mr-2"></i>
            Download Repaired PDF
          </button>
          <button
            onClick={handleNewRepair}
            className="mt-2 bg-white text-green-500 border border-green-500 px-6 py-2 rounded-full font-semibold hover:bg-green-50"
          >
            <i className="bi bi-tools mr-2"></i>
            Repair Another PDF
          </button>
        </div>
      </div>
    );
  }

  // === Show Loading Screen ===
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Repairing PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
          </div>
          {repairStatus && (
            <p className="mt-4 text-gray-700">{repairStatus}</p>
          )}
        </div>
      </div>
    );
  }

  // === Show File Upload and Repair UI ===
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10">
        {/* Heading */}
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <i className="bi bi-tools text-green-600"></i>
          Repair PDF
        </h2>

        {/* Subheading */}
        <p className="text-gray-700 mb-6">Fix corrupted or damaged PDF files with our advanced repair system.</p>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
          <input
            type="file"
            name="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <i className="bi bi-tools text-green-400 text-3xl"></i>
            <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-3 bg-green-100 rounded-md">
            <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
              <i className="bi bi-file-earmark-pdf text-green-500"></i>
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            <i className="bi bi-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {/* Cloud Storage Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          {/* <button 
            onClick={handleDropboxClick}
            className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 hover:bg-white hover:text-green-500 transition"
          >
            <i className="fa-brands fa-dropbox text-inherit"></i>
            Dropbox
          </button>

          <button 
            onClick={handleGoogleDriveClick}
            className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 hover:bg-white hover:text-green-500 transition"
          >
            <i className="fa-brands fa-google-drive text-inherit"></i>
            Google Drive
          </button> */}
        </div>

        {/* Repair Now Button - Centered at bottom */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleRepairNowClick}
            disabled={!selectedFile || isLoading}
            className="bg-white text-green-500 border border-green-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-tools"></i>
                Repair PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairPdf;