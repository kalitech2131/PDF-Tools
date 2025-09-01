import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const SplitPdfSidebar = () => {
  const [fileSize, setFileSize] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitDone, setIsSplitDone] = useState(false);
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const resetState = () => {
    setFile(null);
    setTotalPages(0);
    setFileSize(null);
    setStartPage("");
    setEndPage("");
    setIsSplitDone(false);
    setDownloadUrl("");
    setError("");
    setIsProcessing(false);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile);
    setError("");
    setDownloadUrl("");

    if (!selectedFile) return;

    setFileSize({
      kb: (selectedFile.size / 1024).toFixed(2),
      mb: (selectedFile.size / 1024 / 1024).toFixed(2),
    });

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const res = await axios.post(`${API_BASE}/api/pdf-pages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Failed to load PDF (might be encrypted or corrupted)";
      setError(msg);
    }
  };

  const handleSplit = async () => {
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }

    const s = Number(startPage);
    const e = Number(endPage);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < 1 || s > e) {
      setError("Please provide a valid start and end page (start <= end).");
      return;
    }

    setError("");
    setDownloadUrl("");
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("startPage", String(s));
    formData.append("endPage", String(e));

    try {
      const { data } = await axios.post(`${API_BASE}/api/split-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = data?.downloadUrl;
      if (!url) throw new Error("No download URL returned from server.");

      const finalUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      setDownloadUrl(finalUrl);
      setIsSplitDone(true);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Failed to split PDF (might be invalid page range or encrypted)";
      setError(msg);
      setIsSplitDone(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Robust download: fetch the file as a blob and trigger a save (no popup blockers)
  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const res = await axios.get(downloadUrl, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `split_${Date.now()}.pdf`; // filename shown to user
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed:", e);
      setError("Could not download file. Check server logs.");
    }
    resetState();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg p-6 border-r">
        <h1 className="text-xl font-bold text-orange-600 mb-6 text-center">
          Split PDF Options
        </h1>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-1">
            📃 Total Pages
          </label>
          <p className="text-gray-600">
            {totalPages ? `${totalPages} pages` : "Upload a PDF to detect"}
          </p>
        </div>

        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-1">
            🔢 Select Page Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Start"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              className="border p-2 w-full rounded"
              min="1"
              max={totalPages || undefined}
              disabled={!file}
            />
            <input
              type="number"
              placeholder="End"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              className="border p-2 w-full rounded"
              min="1"
              max={totalPages || undefined}
              disabled={!file}
            />
          </div>
        </div>

        <div className="mt-6 mb-6">
          <button
            onClick={handleSplit}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full shadow w-full disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            disabled={!file || !startPage || !endPage || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Splitting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-scissors"></i>
                Split PDF
              </>
            )}
          </button>
        </div>

        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-1">
            📦 File Size
          </label>
          <p className="text-gray-600">
            {fileSize
              ? `${fileSize.mb} MB (${fileSize.kb} KB)`
              : "Upload a PDF to see size"}
          </p>
        </div>

        {isSplitDone && downloadUrl && (
          <div className="mt-4">
            {/* ⬇️ Replace the <a download> with a button that calls handleDownload */}
            <button
              onClick={handleDownload}
              className="bg-orange-600 text-white px-4 py-2 rounded-full w-full block text-center font-semibold hover:bg-orange-700 transition"
            >
              ⬇️ Download Split PDF
            </button>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50">
        {isProcessing ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-10 text-black">Please Wait...</h1>
            <p className="text-xl font-semibold text-gray-800 mb-8">Splitting PDF...</p>
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-[6px] border-orange-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl w-full bg-orange-200 text-center rounded-3xl border border-white shadow-xl p-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
              <i className="fa-solid fa-file-lines text-orange-600"></i>
              Split PDF
            </h2>
            <p className="text-gray-700 mb-6">Easily split your PDF files into desired ranges.</p>

            <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-orange-600 transition cursor-pointer relative">
              <input
                type="file"
                name="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2 z-0">
                <i className="fa-solid fa-file-pdf text-orange-500 text-3xl"></i>
                <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
                <p className="text-sm text-gray-500">(No size limit)</p>
              </div>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-orange-100 rounded-md">
                <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                  <i className="fa-solid fa-file-pdf text-orange-500"></i>
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {fileSize ? `${fileSize.mb} MB (${fileSize.kb} KB)` : ""}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <button className="bg-orange-500 text-white border border-orange-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-orange-500 hover:scale-105">
                <i className="fa-brands fa-dropbox"></i> Dropbox
              </button>
              <button className="bg-orange-500 text-white border border-orange-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-orange-500 hover:scale-105">
                <i className="fa-brands fa-google-drive"></i> Google Drive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitPdfSidebar;
