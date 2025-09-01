import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const PdfToWord = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const downloadLinkRef = useRef(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConvertClick = () => {
    if (!selectedFile) {
      alert("Please select a PDF file first");
      return;
    }

    setIsConverting(true);
    setTimeout(() => {
      navigate("/pdf-to-word/download");
    }, 3000);
  };

  const handleDownloadClick = () => {
    if (convertedFileUrl && selectedFile) {
      const link = document.createElement("a");
      link.href = convertedFileUrl;
      link.download = selectedFile.name.replace(/\.[^/.]+$/, "") + ".docx"; // ✅ proper filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(convertedFileUrl);
      setConvertedFileUrl(null);
      alert("Download started!");
    } else {
      alert("No file available for download!");
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setSelectedFile(acceptedFiles[0]);
    },
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleApiCall = async () => {
    if (!selectedFile) {
      alert("Please select a PDF file first!");
      return;
    }

    setIsConverting(true);
    const formData = new FormData();
    formData.append("pdfFile", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/convert",
        formData,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setConvertedFileUrl(url);
      navigate("/pdf-to-word/download");
    } catch (error) {
      console.error("Error during conversion:", error);
      alert(
        error.response?.data?.message || "An error occurred during conversion."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setConvertedFileUrl(null);
    navigate("/pdf-to-word");
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200">
          <h2 className="text-3xl font-bold text-cyan-600 mb-4">
            Conversion Successful!
          </h2>
          <p className="text-gray-700 mb-6">
            Your Word file is ready to download.
          </p>
          <button
            onClick={handleDownloadClick}
            className="bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-cyan-700 transition flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-download"></i>
            Download
          </button>
        </div>
      </div>
    );
  }

  // Conversion Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {isConverting ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Converting WORD to PDF...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-blue-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-file-lines text-blue-600"></i>
            PDF to Word
          </h2>

          <p className="text-gray-700 mb-6">
            Easily separate your PDF pages into individual files.
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
              <i className="fa-solid fa-file-lines text-blue-600 text-3xl"></i>
              <p className="font-medium text-gray-700">
                Click or Drop PDF Here
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <i className="fa-solid fa-file-pdf text-cyan-500"></i>
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {/* <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-cyan-500 hover:scale-105">
              <i className="fa-brands fa-dropbox text-inherit"></i>
              Dropbox
            </button>

            <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-cyan-500 hover:scale-105">
              <i className="fa-brands fa-google-drive text-inherit"></i>
              Google Drive
            </button> */}
          </div>

          <div className="mt-6">
            <button
              onClick={handleApiCall}
              className="bg-white text-cyan-500 border border-cyan-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-cyan-600 hover:text-white hover:scale-105"
            >
              <i className="fa-solid fa-arrow-right-arrow-left"></i>
              Convert
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
