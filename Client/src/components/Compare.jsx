import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const ComparePDFs = () => {
  const [files, setFiles] = useState({
    original: null,
    modified: null,
  });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load download history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("pdfComparisonHistory");
    if (savedHistory) {
      setDownloadHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFiles({ ...files, [type]: file });
      setError(null);
    } else {
      setError("Please upload a valid PDF file");
    }
  };

  const handleCompare = async () => {
    if (!files.original || !files.modified) {
      setError("Please upload both PDF files");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("original", files.original);
      formData.append("modified", files.modified);

      const response = await axios.post(
        `${API_BASE}/api/compare-pdfs`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setComparisonResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to compare PDFs. Please try again."
      );
      console.error("Comparison error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const handleDownloadReport = async () => {
  if (!comparisonResult?.reportUrl) return;

  try {
    const url = `${API_BASE}${comparisonResult.reportUrl}`;

    // ⬇️ fetch as BLOB so we can force a download filename cross-origin
    const response = await axios.get(url, { responseType: 'blob' });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const filename = `comparison-report-${Date.now()}.pdf`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;         // works because it’s a blob URL
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);

    // ✅ accurate size from blob
    const newHistoryItem = {
      name: filename,
      size: formatSize(blob.size),
      date: new Date().toLocaleString(),
      url: comparisonResult.reportUrl, // keep relative path for "Open"
    };

    const updatedHistory = [newHistoryItem, ...downloadHistory.slice(0, 9)];
    setDownloadHistory(updatedHistory);
    localStorage.setItem('pdfComparisonHistory', JSON.stringify(updatedHistory));

    setShowHistory(true);
  } catch (e) {
    console.error('Download error:', e);
    setError('Could not download the report. Please try again.');
  }
};

  const handleReset = () => {
    setFiles({ original: null, modified: null });
    setComparisonResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-purple-50">
      {!comparisonResult ? (
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-purple-700 flex items-center justify-center gap-2">
              <i className="fa-solid fa-code-compare text-purple-600 text-2xl"></i>
              Compare PDF
            </h2>
            <p className="text-gray-600 mt-2">
              Upload both PDF files to compare their content don't allow
              calculation..please waiting for proccess
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-6 flex-col md:flex-row">
            {[
              { label: "Original PDF", type: "original" },
              { label: "Modified PDF", type: "modified" },
            ].map(({ label, type }) => (
              <div
                key={type}
                className="flex-1 border rounded-lg p-4 bg-gray-50 shadow-inner"
              >
                <p className="text-gray-600 font-semibold mb-4">{label}</p>

                <label
                  htmlFor={type}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400 hover:border-purple-600 bg-white p-6 rounded-xl cursor-pointer transition duration-300"
                >
                  <i className="fa-solid fa-arrow-up-from-bracket text-purple-500 text-4xl mb-2"></i>
                  <span className="text-purple-600 font-medium mb-1">
                    Upload PDF File
                  </span>
                </label>
                <input
                  id={type}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileChange(e, type)}
                  className="hidden"
                />

                <div className="h-64 bg-white border border-dashed mt-4 rounded-md flex flex-col items-center justify-center text-gray-500 text-sm px-4 text-center">
                  {files[type] ? (
                    <>
                      <i className="fa-solid fa-file-pdf text-4xl text-purple-400 mb-2"></i>
                      <p className="font-medium text-gray-800 truncate w-full">
                        {files[type].name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(files[type].size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file text-5xl opacity-30"></i>
                      <p className="text-xs mt-2">No file selected</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleCompare}
              disabled={isLoading || !files.original || !files.modified}
              className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Comparing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-code-compare"></i>
                  Compare Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-purple-700 flex gap-2">
              <i className="fa-solid fa-file-pdf text-purple-600"></i>
              Compare View
            </h3>
            <button
              onClick={handleReset}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded-full"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-purple-600 mb-2">
                Original PDF: {comparisonResult?.originalName}
              </h4>
              <div className="bg-gray-50 p-3 rounded-md h-64 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {comparisonResult?.originalText}
                </pre>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-purple-600 mb-2">
                Modified PDF: {comparisonResult?.modifiedName}
              </h4>
              <div className="bg-gray-50 p-3 rounded-md h-64 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {comparisonResult?.modifiedText}
                </pre>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-purple-600 mb-2">Differences</h4>
            <div
              className="bg-gray-50 p-3 rounded-md min-h-64 overflow-auto"
              dangerouslySetInnerHTML={{
                __html: comparisonResult?.differences,
              }}
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleDownloadReport}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Download Report
            </button>
          </div>
        </div>
      )}

      {/* Download History Sidebar */}
      {showHistory && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-10 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Recent download history
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4">
            {downloadHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No download history yet
              </p>
            ) : (
              <ul className="space-y-3">
                {downloadHistory.map((item, index) => (
                  <li key={index} className="p-2 hover:bg-gray-50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.size} • {item.date}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          window.open(`${API_BASE}${item.url}`, "_blank")
                        }
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Open
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePDFs;
