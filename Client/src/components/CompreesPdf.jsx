import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const CompreesPdf = ({ isDownloadScreen: propIsDownloadScreen }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedFileUrl, setCompressedFileUrl] = useState(null);
  const [compressedFileName, setCompressedFileName] = useState("");
  const [compressedFileSize, setCompressedFileSize] = useState(null);
  const [originalFileSize, setOriginalFileSize] = useState(null); // New state for original file size
  const [showDownloadScreen, setShowDownloadScreen] =
    useState(propIsDownloadScreen);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCompressedFileUrl(null);
      setCompressedFileName("");
      setCompressedFileSize(null);
      setOriginalFileSize(null); // Reset original file size
      setShowDownloadScreen(false);
    }
  };

  const handleCompressClick = async () => {
    if (!selectedFile) {
      alert("Please select a PDF file first");
      return;
    }

    setIsCompressing(true);
    setCompressedFileUrl(null);
    setCompressedFileName("");
    setCompressedFileSize(null);

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);

   try {
      const res = await axios.post(`${API_BASE}/api/compress-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false,
        timeout: 120000,
      });

      // Server returns JSON {file (base64), fileName, originalFileSize, compressedFileSize}
      const data = res.data;

      // base64 -> Blob
      const bin = atob(data.file);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      setCompressedFileUrl(url);
      setCompressedFileName(data.fileName);
      setCompressedFileSize(data.compressedFileSize);
      setOriginalFileSize(data.originalFileSize);
      setShowDownloadScreen(true);
    } catch (err) {
      console.error("Compress error:", err);
      // This keeps the real network/CORS message
      const msg =
        err?.response?.data?.message || err?.message || "Compression failed";
      alert("Compression failed: " + msg);
    } finally {
      setIsCompressing(false);
    }
  };

 const handleDownloadClick = () => {
    if (!compressedFileUrl || !compressedFileName) {
      alert('No file available for download.');
      return;
    }
    const a = document.createElement('a');
    a.href = compressedFileUrl;
    a.download = compressedFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(compressedFileUrl);
    setCompressedFileUrl(null);
    setCompressedFileName('');
    setCompressedFileSize(null);
    setOriginalFileSize(null);
    setSelectedFile(null);
    setShowDownloadScreen(false);
  };

  // Helper function to format file size in KB or MB
  const formatFileSize = (bytes) => {
    if (bytes === null) {
      return "N/A";
    }
    // Convert bytes directly to MB
    // 1 MB = 1024 KB = 1024 * 1024 Bytes
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes.toFixed(2)} MB`; // Always show two decimal places and 'MB'
  };

  const formatMB = (bytes) => (bytes == null ? 'N/A' : `${(bytes / (1024 * 1024)).toFixed(2)} MB`);
  const compressionPct =
    originalFileSize && compressedFileSize != null && originalFileSize > 0
      ? (((originalFileSize - compressedFileSize) / originalFileSize) * 100).toFixed(2)
      : 'N/A';

  if (showDownloadScreen && compressedFileUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Compression Successful!
          </h2>
          <p className="text-gray-700 mb-2">
            Your compressed PDF is ready to download.
          </p>
          {compressedFileName && (
            <p className="text-gray-600 mb-1">
              **File Name:** {compressedFileName}
            </p>
          )}
          {originalFileSize !== null && (
            <p className="text-gray-600 mb-1">
              **Original Size:** {formatFileSize(originalFileSize)}
            </p>
          )}
          {compressedFileSize !== null && (
            <p className="text-gray-600 mb-1">
              **Compressed Size:** {formatFileSize(compressedFileSize)}
            </p>
          )}
          {originalFileSize !== null &&
            compressedFileSize !== null &&
            originalFileSize > 0 && (
              <p className="text-gray-600 font-semibold mb-6">
                **Compressed by:** {compressionPct}%
              </p>
            )}
          <button
            onClick={handleDownloadClick}
            className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-download"></i>
            Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-red-300 text-center rounded-3xl border border-white shadow-xl p-10">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <i className="bi bi-archive text-red-400"></i>
          Compress PDF
        </h2>

        <p className="text-gray-700 mb-6">
          Easily compress your PDF file to reduce size.
        </p>

        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
          <input
            type="file"
            name="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <i className="bi bi-archive text-red-400 text-3xl"></i>
            <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-red-100 rounded-md">
            <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-pdf text-red-500"></i>
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              **Original Size:** {formatFileSize(selectedFile.size)}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-6">
          {/* <button className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-red-500 hover:scale-105">
            <i className="fa-brands fa-dropbox text-inherit"></i>
            Dropbox
          </button> */}

          {/* <button className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-red-500 hover:scale-105">
            <i className="fa-brands fa-google-drive text-inherit"></i>
            Google Drive
          </button> */}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleCompressClick}
            disabled={isCompressing || !selectedFile}
            className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-8 py-3 font-semibold flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-red-500 hover:scale-105 disabled:opacity-50"
          >
            <i className="bi bi-file-earmark-arrow-down text-inherit"></i>
            {isCompressing ? "Compressing..." : "Compress PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompreesPdf;
