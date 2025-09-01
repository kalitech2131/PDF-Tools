import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const WordToPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);

  // PDF → Word dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setError(null);
      setSelectedFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);
    },
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // PDF → Word API
  const handlePdfToWord = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first!");
      return;
    }
    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/convert",
        formData,
        {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setConvertedFileUrl(url);
      navigate("/pdf-to-word/download");
    } catch (err) {
      let errorMessage = "An error occurred during conversion.";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Invalid PDF file.";
        } else if (err.response.status === 403) {
          errorMessage =
            "The PDF is password protected and cannot be converted.";
        }
      }
      setError(errorMessage);
      console.error("Conversion error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Word → PDF file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith(".doc") || file.name.endsWith(".docx"))) {
      setSelectedFile(file);
    } else {
      alert("Please select a valid Word file (.doc or .docx)");
    }
  };

  // Word → PDF API
  const handleWordToPdf = async () => {

    if (!selectedFile) {
      alert("Please select a Word file first");
      return;
    }

    setIsConverting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/word-to-pdf",
        formData,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error) {
      console.error("Conversion failed", error);
      alert("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  // Download handler (checks both Word & PDF)
  const handleDownloadClick = () => {
    if (convertedFileUrl) {
      // PDF → Word download
      const link = document.createElement("a");
      link.href = convertedFileUrl;
      link.download = fileName.replace(/\.[^/.]+$/, "") + ".docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(convertedFileUrl);
    } else if (pdfBlobUrl) {
      // Word → PDF download
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.download = `${selectedFile.name.replace(/\.(docx|doc)$/, "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfBlobUrl);
    }
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setConvertedFileUrl(null);
    setPdfBlobUrl(null);
    setFileName("");
    setError(null);
    navigate("/pdf-to-word");
  };

  // ✅ Download screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "72px",
            background: "#ffffff",
            zIndex: 2147483647,
            pointerEvents: "none",
          }}
        />

        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">
              Conversion Successful!
            </h1>
            <p className="text-gray-700 mb-8">
              Your file is ready to download.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i>
                Download File
              </button>

              <button
                onClick={handleNewConversion}
                className="bg-white text-blue-500 border border-blue-500 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-file"></i>
                Convert New File
              </button>
            </div>
          </div>
        </main>

        <footer className="bg-white py-4 border-t border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  // ✅ Upload/Conversion screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {isConverting ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait... Conversion in Progress
          </h1>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : pdfBlobUrl ? (
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <i className="fa-solid fa-circle-check text-cyan-500 text-5xl mb-6"></i>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Conversion Successful!
          </h2>
          <p className="text-gray-700 mb-6">
            Your PDF file is ready to download.
          </p>
          <button
            onClick={handleDownloadClick}
            className="bg-cyan-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-cyan-600 transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Download Now
          </button>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-blue-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-file-word text-blue-600"></i>
            Word to PDF
          </h2>
          <p className="text-gray-700 mb-6">
            Easily convert your Word files to PDF documents.
          </p>

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="fa-solid fa-file-word text-blue-600 text-3xl"></i>
              <p className="font-medium text-gray-700">
                Click or Drop Word File Here
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-file-word text-blue-500"></i>
                  <div>
                    <p className="text-gray-700 font-medium truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleWordToPdf}
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

export default WordToPdf;







