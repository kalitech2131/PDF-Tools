

//
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const MergePdf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDownloadScreen = location.pathname === '/merge-pdf/download';

  const [isMerging, setIsMerging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState(null);

  const MAX_FILES = 10;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (selectedFiles.length + files.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} PDF files can be merged at once`);
        return;
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
      setError(null);
    }
  };

  const handleRemoveFile = (fileName) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const handleMergeClick = async () => {
    if (selectedFiles.length < 2) {
      setError('Please select at least two PDF files to merge.');
      return;
    }

    if (selectedFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} PDF files can be merged at once`);
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('pdfFiles', file);
      });

      const response = await axios.post('http://localhost:5000/api/merge-pdfs', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      navigate('/merge-pdf/download');
    } catch (err) {
      setError(err.response?.data?.message || 'Merging failed. Please try again.');
      console.error('Merging error:', err);
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `merged_document.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleNewConversion = () => {
    setSelectedFiles([]);
    setDownloadUrl('');
    navigate('/merge-pdf');
  };

  if (isDownloadScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-purple-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Merging Successful!</h2>
          <p className="text-gray-700 mb-6">Your merged PDF file is ready to download.</p>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleDownloadClick}
              className="bg-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Download Merged PDF
            </button>

            <button
              onClick={handleNewConversion}
              className="text-purple-500 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 border border-purple-500"
            >
              <i className="fa-solid fa-rotate-left"></i>
              Merge New PDFs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (  
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {isMerging ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Merging PDF files...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-purple-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-purple-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-file-pdf text-purple-600"></i>
            Merge PDF
          </h2>

          <p className="text-gray-700 mb-6">
            Combine multiple PDF files into one (Max {MAX_FILES} files)
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-purple-700 rounded-md">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-purple-800 transition cursor-pointer relative">
            <input
              type="file"
              name="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={selectedFiles.length >= MAX_FILES}
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="fa-solid fa-plus text-purple-600 text-3xl"></i>
              <p className="font-medium text-gray-700">
                {selectedFiles.length > 0 
                  ? selectedFiles.length >= MAX_FILES 
                    ? 'Maximum files reached' 
                    : 'Add More PDFs' 
                  : 'Click or Drop PDFs Here'}
              </p>
              <p className="text-sm text-gray-500">
                Maximume 10MB file merge 
                {/* {selectedFiles.length}/{MAX_FILES} files selected */}
              </p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-300 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-file-pdf text-purple-500"></i>
                    <div>
                      <p className="text-gray-700 font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.name)}
                    className="text-gray-400 hover:text-purple-500"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <button className="bg-purple-500 text-white border border-purple-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-purple-500 hover:scale-105">
              <i className="fa-brands fa-dropbox text-inherit"></i>
              Dropbox
            </button>

            <button className="bg-purple-500 text-white border border-purple-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-purple-500 hover:scale-105">
              <i className="fa-brands fa-google-drive text-inherit"></i>
              Google Drive
            </button>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleMergeClick}
              disabled={selectedFiles.length < 2 || selectedFiles.length > MAX_FILES}
              className={`bg-white text-purple-500 border border-purple-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 transition hover:scale-105 ${
                selectedFiles.length >= 2 && selectedFiles.length <= MAX_FILES 
                  ? 'hover:bg-purple-600 hover:text-white' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-code-merge"></i>
              Merge PDFs
            </button>

            {selectedFiles.length > 0 && (
              <button
                onClick={handleClearAllFiles}
                className="bg-white text-purple-500 border border-purple-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 transition hover:scale-105 hover:bg-purple-600 hover:text-white"
              >
                <i className="fa-solid fa-trash"></i>
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePdf;




