import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ExcelToPdf = () => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPdfBlobUrl(null);
    }
  };

  const handleConvertClick = async () => {
    if (!selectedFile) {
      alert('Please select an Excel file first');
      return;
    }

    setIsConverting(true);
    setPdfBlobUrl(null);

    const formData = new FormData();
    formData.append('excelFile', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/excel-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);

    } catch (error) {
      alert('Conversion failed: ' + error.message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (!pdfBlobUrl || !selectedFile) {
      alert('No file to download or original file not selected.');
      return;
    }

    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = selectedFile.name.replace(/\.(xlsx|xls)$/, '.pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setIsConverting(false);
    setPdfBlobUrl(null);
  };

  if (isConverting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait, the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Converting Excel to PDF...
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
          <div className="mb-6 text-green-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Conversion Successful!</h2>
          <p className="text-gray-700 mb-6">Your PDF file is ready to download.</p>
          <button
            onClick={handleDownloadClick}
            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-download"></i>
            Download Now
          </button>
          <button
            onClick={handleNewConversion}
            className="mt-4 bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2 mx-auto"
          >
            New Conversion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-xl w-full bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          {/* <i className="fa-solid f a-file-pdf text-green-600"></i> */}
          Excel to PDF
        </h2>

        <p className="text-gray-700 mb-6">Easily convert your Excel files to PDF documents.</p>

        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-green-800 transition cursor-pointer relative">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <i className="fa-solid fa-file-excel text-green-600 text-3xl"></i>
            <p className="font-medium text-gray-700">Click or Drop Excel File Here</p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-green-100 rounded-md">
            <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-excel text-green-500"></i>
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-6">
          {/* <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-500 hover:scale-105">
            <i className="fa-brands fa-dropbox text-inherit"></i>
            Dropbox
          </button> */}

          {/* <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-500 hover:scale-105">
            <i className="fa-brands fa-google-drive text-inherit"></i>
            Google Drive
          </button> */}
        </div>

        <div className="mt-6">
          <button
            onClick={handleConvertClick}
            className="bg-white text-green-500 border border-green-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-green-600 hover:text-white hover:scale-105"
          >
            <i className="fa-solid fa-arrow-right-arrow-left"></i>
            Convert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelToPdf;