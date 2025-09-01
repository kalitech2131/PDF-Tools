import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const PdfToImage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [zipUrl, setZipUrl] = useState(null);
  const [error, setError] = useState(null);

  const baseName = useMemo(
    () =>
      selectedFile ? selectedFile.name.replace(/\.pdf$/i, "") : "converted",
    [selectedFile]
  );

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setSelectedFile(null);
      setError("Please select a valid PDF file.");
      return;
    } else {
      // alert("Please select a valid PDF file.");
      setSelectedFile(file);
    }
  };

  const handleConvertClick = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      alert("Please select a PDF file first");
      return;
    }
    setError(null);
    setIsConverting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API_BASE}/api/convert-pdf-to-image`,
        formData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      setZipUrl(url);
    } catch (error) {
      console.error("Conversion failed", error);
      setError("Conversion failed. Please try again.");
      alert("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (!zipUrl) return;

    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = `${baseName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewConvertClick = () => {
    setZipUrl(null);
    setSelectedFile(null);
    setError(null);
  };

  // 🧹 Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (zipUrl) {
        window.URL.revokeObjectURL(zipUrl);
      }
    };
  }, [zipUrl]);

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Loading */}
      {isConverting && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6 text-black">
            Please Wait... Conversion in Progress
          </h1>
          <p className="text-lg font-medium text-gray-700 mb-8">
            Converting PDF to PNG...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      )}

      {/* Success (TWO BUTTONS) */}
      {!isConverting && zipUrl && (
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-green-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Conversion Successful!
          </h1>
          <p className="text-gray-700 mb-8">
            Your PNG files are ready to download.
          </p>

          {/* Download button */}
          <button
            onClick={handleDownloadClick}
            className="w-full mb-4 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Download PNG Files
          </button>

          {/* Convert New PDF button */}
          <button
            onClick={handleNewConvertClick}
            className="w-full bg-white text-green-600 border border-green-500 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-file-arrow-up"></i>
            Convert New PDF
          </button>
        </div>
      )}

      {/* Upload Screen */}
      {!isConverting && !zipUrl && (
        <div className="max-w-xl w-full bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-file-pdf text-green-600"></i>
            PDF to PNG
          </h2>
          <p className="text-gray-700 mb-6">
            Convert PDF pages into images instantly.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md text-left bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <label className="block border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-green-700 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="fa-solid fa-file-pdf text-green-600 text-3xl"></i>
              <p className="font-medium text-gray-700">
                Click or Drop PDF Here
              </p>
              <p className="text-xs text-gray-400">Max 100 MB</p>
            </div>
          </label>

          {selectedFile && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-300 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-file-pdf text-green-600"></i>
                  <div>
                    <p className="text-gray-700 font-medium truncate max-w-[220px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-green-600"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          {/* FIRST ROW: Dropbox + Google Drive */}
          <div className="flex justify-center gap-4 mt-6">
            <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-600 hover:scale-105">
              <i className="fa-brands fa-dropbox"></i>
              Dropbox
            </button>

            <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-600 hover:scale-105">
              <i className="fa-brands fa-google-drive"></i>
              Google Drive
            </button>
          </div>

          {/* SECOND ROW: Centered PDF To PNG (BELOW cloud buttons) */}
          <div className="mt-4">
            <button
              onClick={handleConvertClick}
              disabled={!selectedFile}
              className={`mx-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-semibold transition
                ${
                  selectedFile
                    ? "bg-green-600 text-white border border-green-600 hover:bg-green-700"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
            >
              <i className="fa-solid fa-arrow-right-arrow-left"></i>
              PDF To PNG
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PdfToImage;
