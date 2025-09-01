import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PdfOrganizer = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPdfBlobUrl(null);
    }
  };

  const handleProcessClick = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setPdfBlobUrl(null);

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/organize-pdf',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important: tells axios to return binary data
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPdfBlobUrl(url);
    } catch (error) {
      alert('Processing failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadClick = () => {
    if (!pdfBlobUrl || !selectedFile) {
      alert('No file to download.');
      return;
    }

    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = selectedFile.name.replace(/\.pdf$/, '_organized.pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleNewProcess = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setPdfBlobUrl(null);
  };

  // UI States
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait, the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Organizing PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (pdfBlobUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-orange-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Processing Successful!</h2>
          <p className="text-gray-700 mb-6">Your organized PDF is ready to download.</p>
          <button
            onClick={handleDownloadClick}
            className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-download"></i>
            Download Now
          </button>
          <button
            onClick={handleNewProcess}
            className="mt-4 bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2 mx-auto"
          >
            New Conversion
          </button>
        </div>
      </div>
    );
  }

  // Default state
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-xl w-full bg-orange-300 text-center rounded-3xl border border-white shadow-xl p-10">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          {/* <i className="fa-solid fa-file-pdf text-orange-600"></i> */}
          Organize PDF
        </h2>

        <p className="text-gray-700 mb-6">Upload your PDF and we’ll organize it for you.</p>

        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-orange-800 transition cursor-pointer relative">
          <input
            type="file"
            name="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            {/* <i className="fa-solid fa-file-pdf text-orange-600 text-3xl"></i> */}
            <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-green-100 rounded-md">
            <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-pdf text-orange-500"></i>
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleProcessClick}
            className="bg-white text-orange-500 border border-orange-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-orange-600 hover:text-white hover:scale-105"
          >
            <i className="fa-solid fa-arrow-right-arrow-left"></i>
            Organize
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfOrganizer;
