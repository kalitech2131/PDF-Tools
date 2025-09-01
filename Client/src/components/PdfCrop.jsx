import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// ✅ pdf.js in Vite (ESM worker)
import * as pdfjsLib from "pdfjs-dist";
import PdfJsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfJsWorker();

/* ----------------------- Wrapper: decide which screen ---------------------- */
export default function PdfCrop() {
  const location = useLocation();
  const isDownload = location.pathname.endsWith("/download");
  return isDownload ? <DownloadScreen /> : <CropScreen />;
}

/* ------------------------------- Download UI ------------------------------ */
function DownloadScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Preparing download...");

  useEffect(() => {
    const run = async () => {
      try {
        // 1) If blob passed via route state
        const st = location.state || {};
        if (st.blob instanceof Blob) {
          const fileName = st.fileName || "cropped.pdf";
          const url = URL.createObjectURL(st.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setStatus("Download started.");
          return;
        }

        // 2) If direct URL provided: /crop-pdf/download?url=...
        const params = new URLSearchParams(location.search);
        const u = params.get("url");
        if (u) {
          setStatus("Redirecting to download...");
          window.location.href = u; // backend serves the file
          return;
        }

        // 3) If file name provided: /crop-pdf/download?file=...
        const f = params.get("file");
        if (f) {
          const res = await axios.get(`http://localhost:5000/api/download/${encodeURIComponent(f)}`, {
            responseType: "blob",
          });
          const blobUrl = URL.createObjectURL(res.data);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = f || "file";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);
          setStatus("Download started.");
          return;
        }

        setStatus("Missing download info. Please try again.");
      } catch (e) {
        console.error(e);
        setStatus("Download failed.");
      }
    };
    run();
  }, [location.search, location.state]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6">
      <div className="text-center">
        <svg className="animate-spin h-6 w-6 mx-auto mb-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 004 12z" />
        </svg>
        <p className="text-gray-700">{status}</p>
        <button
          className="mt-4 px-4 py-2 border rounded-lg text-sm"
          onClick={() => navigate("/crop-pdf", { replace: true })}
        >
          Back to Crop
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Crop UI -------------------------------- */
function CropScreen() {
  const navigate = useNavigate();

  const [showCropPage, setShowCropPage] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [cropAreas, setCropAreas] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, page: null });

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const renderPage = async (pageNumber, canvasElement) => {
    if (!pdfDoc || !canvasElement) return;
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const ctx = canvasElement.getContext("2d");
      canvasElement.height = viewport.height;
      canvasElement.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error("render error", err);
      showMessage("Error rendering PDF page. Please try again.");
    }
  };

  useEffect(() => {
    if (!showCropPage || !pdfDoc) return;
    if (canvasRef.current) renderPage(currentPage, canvasRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale, showCropPage, pageCount]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploaded(true);
    setPdfFile(file);

    try {
      const buf = await file.arrayBuffer();
      const typedArray = new Uint8Array(buf);
      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageCount(pdf.numPages);
      setCurrentPage(1);
      setCropAreas({});
    } catch (error) {
      console.error("Error loading PDF:", error);
      showMessage("Error loading PDF file. Please ensure it is a valid PDF.");
      resetFile();
    }
  };

  const openCropPage = () => fileUploaded && setShowCropPage(true);
  const closeCropPage = () => {
    setShowCropPage(false);
    if (pdfDoc) setPdfDoc(null);
  };

  const resetFile = () => {
    setFileUploaded(false);
    setPdfFile(null);
    setPdfDoc(null);
    setPageCount(1);
    setCurrentPage(1);
    setCropAreas({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetAll = () => {
    setCropAreas({});
    setCurrentPage(1);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (!pdfDoc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDragging(true);
    setStartPos({ x, y, page: currentPage });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !pdfDoc || startPos.page === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const width = currentX - startPos.x;
    const height = currentY - startPos.y;
    setCropAreas((prev) => ({
      ...prev,
      [startPos.page]: {
        x: width > 0 ? startPos.x : currentX,
        y: height > 0 ? startPos.y : currentY,
        width: Math.abs(width),
        height: Math.abs(height),
      },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (startPos.page !== null) {
      const area = cropAreas[startPos.page];
      if (area && area.width < 10 && area.height < 10) {
        setCropAreas((prev) => {
          const next = { ...prev };
          delete next[startPos.page];
          return next;
        });
      }
    }
    setStartPos({ x: 0, y: 0, page: null });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => handleMouseMove(e);
    const up = () => handleMouseUp();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, startPos, cropAreas]);

  const handleRemoveCropArea = (pageNumber) => {
    setCropAreas((prev) => {
      const next = { ...prev };
      delete next[pageNumber];
      return next;
    });
  };

  const convertToPdfCoords = async (x, y, width, height, pageNum) => {
    if (!pdfDoc) return null;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ratioX = viewport.width / canvas.width;
    const ratioY = viewport.height / canvas.height;
    return { x: x * ratioX, y: y * ratioY, width: width * ratioX, height: height * ratioY };
  };

  const handleApplyCrop = async () => {
    const area = cropAreas[currentPage];
    if (!pdfFile || !area || area.width < 10 || area.height < 10) {
      showMessage("Please select a valid area to crop (minimum 10x10 pixels)");
      return;
    }

    try {
      setIsProcessing(true);
      const mapped = await convertToPdfCoords(area.x, area.y, area.width, area.height, currentPage);
      const payload = { selectedPages: "current", cropData: { [currentPage]: mapped } };

      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("cropOptions", JSON.stringify(payload));

      // 🔗 Direct backend URL (Option A)
      const resp = await axios.post("http://localhost:5000/api/croppdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const ct = (resp.headers["content-type"] || "").toLowerCase();
      if (ct.includes("application/json")) {
        // Some servers send JSON as blob; parse safely
        const text = await resp.data.text();
        const data = JSON.parse(text || "{}");
        if (data.downloadUrl) {
          // go to download route that will redirect to URL
          navigate(`/crop-pdf/download?url=${encodeURIComponent(data.downloadUrl)}`);
        } else if (data.fileName) {
          navigate(`/crop-pdf/download?file=${encodeURIComponent(data.fileName)}`);
        } else {
          showMessage("Crop done, but no download info returned.");
        }
      } else {
        // PDF blob returned directly -> pass via route state
        navigate("/crop-pdf/download", {
          state: { blob: resp.data, fileName: "cropped.pdf" },
        });
      }
    } catch (error) {
      console.error("Error croping pdf", error);
      showMessage(`Error cropping PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const zoomIn = () => setScale((p) => Math.min(p + 0.1, 2));
  const zoomOut = () => setScale((p) => Math.max(p - 0.1, 0.5));
  const handlePageChange = (n) => {
    if (n >= 1 && n <= pageCount) {
      setCurrentPage(n);
      setCropAreas({});
    }
  };

  /* ------------------------------ Upload Screen ------------------------------ */
  if (!showCropPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-red-300 text-center rounded-3xl border border-red-200 shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Crop PDF
          </h2>
          <p className="text-gray-700 mb-6">Easily crop your PDF pages to the exact size you need</p>

          <div className="border-2 border-dashed border-red-400 p-8 rounded-xl bg-red-50 hover:border-red-500 transition cursor-pointer relative">
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              accept=".pdf"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              {fileUploaded ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">PDF Uploaded Successfully!</p>
                  <button onClick={resetFile} className="text-red-500 text-sm mt-2 hover:underline">
                    Change PDF
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
                  <p className="text-sm text-gray-500">Supports PDF files up to 50MB</p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              className={`${fileUploaded ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"} text-white rounded-full shadow-lg px-8 py-3 font-medium flex items-center gap-2 hover:scale-105`}
              onClick={openCropPage}
              disabled={!fileUploaded}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Crop PDF
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">All files are processed securely and deleted automatically after 1 hour</p>
            <p className="text-xs text-gray-500 mt-2">© 2024 PDF Tools</p>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------- Crop Screen -------------------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Crop PDF
          </h2>
          <button onClick={closeCropPage} className="text-gray-500 hover:text-red-500 transition flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Upload
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <p className="text-gray-700 mb-4">
            Click and drag to select the area you want to keep. Click on a selection to remove it.
          </p>

          <div className="border-2 border-dashed border-gray-300 p-4 mb-6 rounded-xl bg-white h-[600px] relative overflow-y-auto flex flex-col">
            {pdfDoc ? (
              <div className="relative self-center">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-200 z-0"
                  onMouseDown={handleMouseDown}
                  style={{ cursor: isDragging && startPos.page === currentPage ? "grabbing" : "crosshair" }}
                />
                {cropAreas[currentPage] && (
                  <div
                    className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCropArea(currentPage);
                    }}
                    style={{
                      left: `${cropAreas[currentPage].x}px`,
                      top: `${cropAreas[currentPage].y}px`,
                      width: `${cropAreas[currentPage].width}px`,
                      height: `${cropAreas[currentPage].height}px`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-gray-500">PDF preview will appear here</p>
              </div>
            )}
          </div>

          {message && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm">
              <button onClick={zoomOut} className="p-1 text-gray-700 hover:bg-gray-100 rounded" disabled={scale <= 0.5}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm text-gray-700 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="p-1 text-gray-700 hover:bg-gray-100 rounded" disabled={scale >= 2}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleResetAll}
              className="text-red-500 hover:text-red-700 text-sm flex items-center bg-white px-3 py-1 rounded-lg shadow-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All
            </button>
          </div>

          <div className="mb-6">
            <p className="font-medium text-gray-700 mb-3">Page navigation:</p>
            <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-gray-700 px-3 py-1 bg-gray-100 rounded">
                {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pageCount}
                className={`p-2 rounded-full ${currentPage === pageCount ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={closeCropPage}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className={`text-white px-6 py-3 rounded-lg transition flex items-center gap-2 shadow-md ${isProcessing ? "bg-red-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">All files are processed securely and deleted automatically after 1 hour</p>
          <p className="text-xs text-gray-500 mt-2">© 2024 PDF Tools</p>
        </div>
      </div>
    </div>
  );
}
