import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ---- PDF render (viewer) ----
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry"; // ensures worker is bundled

// ---- PDF edit (writer) ----
import {
  PDFDocument as PDFLibDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

// ---- Color helpers ----
const colorHexMap = {
  black: "#000000",
  "red-500": "#ef4444",
  "blue-500": "#3b82f6",
  "yellow-400": "#facc15",
  "purple-600": "#9333ea",
};
const hexToRgb01 = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return rgb(r / 255, g / 255, b / 255);
};

const PdfEditor = () => {
  const [sp] = useSearchParams();
  const fileUrlParam = sp.get("fileUrl") || null;
  const fileNameParam = sp.get("fileName") || "document.pdf";

  // ---------- Core state ----------
  const [originalBytes, setOriginalBytes] = useState(null); // ArrayBuffer original
  const [editedBlob, setEditedBlob] = useState(null);       // Blob of edited
  const [isEditing, setIsEditing] = useState(false);

  // ---------- PDF.js render state ----------
  const [pdfjsDoc, setPdfjsDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // 0-based
  const [scale, setScale] = useState(1.3);
  const canvasRef = useRef(null);
  const [basePageSize, setBasePageSize] = useState({ width: 0, height: 0 }); // PDF pts (scale=1)
  const [thumbs, setThumbs] = useState([]); // dataURL array

  // ---------- Tools ----------
  const [activeTool, setActiveTool] = useState(null); // "Add Text" | "Add Image" | "Draw Rect"
  // Text
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("black");
  // Image
  const [uploadedImages, setUploadedImages] = useState([]); // {id,file,preview}
  const [selectedImageId, setSelectedImageId] = useState(null);
  const imageFileForPlacement = useMemo(
    () => uploadedImages.find((x) => x.id === selectedImageId)?.file || null,
    [uploadedImages, selectedImageId]
  );
  const fileInputRef = useRef(null);
  // Rect
  const [rectColor, setRectColor] = useState("yellow-400");
  const [rectOpacity, setRectOpacity] = useState(40); // percent
  const [rectWidth, setRectWidth] = useState(200); // pts
  const [rectHeight, setRectHeight] = useState(50); // pts

  // ---------- Pending annotations ----------
  // type: 'text' | 'image' | 'rect'
  // { type, pageIndex, x, y, ...}
  const [annotations, setAnnotations] = useState([]);

  // ============ LOAD ============
  // Load from query param (server URL) if present
  useEffect(() => {
    (async () => {
      if (!fileUrlParam) return;
      try {
        const res = await fetch(fileUrlParam);
        if (!res.ok) throw new Error("Failed to load PDF from server URL");
        const ab = await res.arrayBuffer();
        await loadPdfFromArrayBuffer(ab);
      } catch (e) {
        alert("Failed to load PDF: " + (e?.message || "Unknown error"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrlParam]);

  // Render current page whenever page/scale changes
  useEffect(() => {
    if (pdfjsDoc) renderPage(currentPageIndex, scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfjsDoc, currentPageIndex, scale]);

  const loadPdfFromArrayBuffer = async (ab) => {
    setOriginalBytes(ab);
    const doc = await pdfjsLib.getDocument({ data: ab }).promise;
    setPdfjsDoc(doc);
    setPageCount(doc.numPages);
    setCurrentPageIndex(0);
    setAnnotations([]);
    setEditedBlob(null);
    // generate thumbs lazily (after render first page)
    renderPage(0, scale, { alsoMakeThumbs: true });
  };

  const renderPage = async (index, useScale, opts = {}) => {
    if (!pdfjsDoc) return;
    const page = await pdfjsDoc.getPage(index + 1);
    const baseViewport = page.getViewport({ scale: 1 });
    setBasePageSize({ width: baseViewport.width, height: baseViewport.height });

    const viewport = page.getViewport({ scale: useScale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;

    // draw lightweight overlay previews for pending annots on this page
    drawOverlayPreview(ctx, viewport, index);

    if (opts.alsoMakeThumbs) {
      // generate small thumbnails for all pages
      const t = [];
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const p = await pdfjsDoc.getPage(i);
        const tv = p.getViewport({ scale: 0.2 });
        const c = document.createElement("canvas");
        c.width = tv.width;
        c.height = tv.height;
        const cx = c.getContext("2d");
        await p.render({ canvasContext: cx, viewport: tv }).promise;
        t.push(c.toDataURL());
      }
      setThumbs(t);
    }
  };

  const drawOverlayPreview = (ctx, viewport, pageIndex) => {
    // Simple preview: just draw small markers for items of this page
    const pageAnnots = annotations.filter((a) => a.pageIndex === pageIndex);
    if (!pageAnnots.length) return;

    ctx.save();
    for (const a of pageAnnots) {
      if (a.type === "text") {
        ctx.font = `${a.size * scale}px sans-serif`;
        ctx.fillStyle = colorHexMap[a.colorKey] || "#000";
        const yPx = (basePageSize.height - a.y) * scale; // convert PDF y->canvas y
        const xPx = a.x * scale;
        ctx.fillText(a.text, xPx, yPx);
      } else if (a.type === "rect") {
        const col = colorHexMap[a.colorKey] || "#facc15";
        ctx.fillStyle = hexWithOpacity(col, a.opacity / 100);
        const yPx = (basePageSize.height - a.y - a.h) * scale; // top-left
        const xPx = a.x * scale;
        ctx.fillRect(xPx, yPx, a.w * scale, a.h * scale);
      } else if (a.type === "image") {
        // just a placeholder box
        ctx.strokeStyle = "#22c55e";
        const yPx = (basePageSize.height - a.y - a.h) * scale;
        const xPx = a.x * scale;
        ctx.strokeRect(xPx, yPx, a.w * scale, a.h * scale);
      }
    }
    ctx.restore();
  };

  const hexWithOpacity = (hex, alpha) => {
    // alpha 0..1 -> rgba
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // ============ Upload local file ============
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      return;
    }
    const ab = await file.arrayBuffer();
    await loadPdfFromArrayBuffer(ab);
  };

  const handleEditClick = () => {
    if (!originalBytes) {
      alert("Please load a PDF first");
      return;
    }
    setIsEditing(true);
  };

  const handleBackToUpload = () => {
    setIsEditing(false);
    setActiveTool(null);
  };

  // ============ Canvas click-to-place ============
  const handleCanvasClick = (e) => {
    if (!activeTool) return;
    // get click offset in canvas pixels
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // convert to PDF points (base scale)
    const x = px / scale;
    const yFromTop = py / scale;
    // PDF origin is bottom-left:
    const y = basePageSize.height - yFromTop;

    if (activeTool === "Add Text") {
      if (!textContent.trim()) {
        alert("Type some text first.");
        return;
      }
      setAnnotations((prev) => [
        ...prev,
        {
          type: "text",
          pageIndex: currentPageIndex,
          x,
          y,
          text: textContent,
          size: parseInt(fontSize, 10) || 16,
          colorKey: textColor,
        },
      ]);
    } else if (activeTool === "Add Image") {
      if (!imageFileForPlacement) {
        alert("Select an image in the left panel first.");
        return;
      }
      // default image box 150x150 pts
      setAnnotations((prev) => [
        ...prev,
        {
          type: "image",
          pageIndex: currentPageIndex,
          x,
          y: y,   // top-left will be y - h while baking
          w: 150,
          h: 150,
          file: imageFileForPlacement, // keep File to read at save
        },
      ]);
    } else if (activeTool === "Draw Rect") {
      setAnnotations((prev) => [
        ...prev,
        {
          type: "rect",
          pageIndex: currentPageIndex,
          x,
          y, // top-left will use y - h for drawing
          w: parseFloat(rectWidth) || 200,
          h: parseFloat(rectHeight) || 50,
          colorKey: rectColor,
          opacity: parseInt(rectOpacity, 10) || 40,
        },
      ]);
    }

    // re-render to show overlay preview
    renderPage(currentPageIndex, scale);
  };

  // ============ Thumbnails ============
  const gotoPage = (idx) => {
    if (idx < 0 || idx >= pageCount) return;
    setCurrentPageIndex(idx);
  };

  // ============ Upload images (for placement) ============
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => /image\/(png|jpeg|jpg)/i.test(f.type));
    if (!valid.length) {
      alert("Upload PNG/JPG images only.");
      return;
    }
    const list = valid.map((f) => ({
      id: Date.now() + Math.random(),
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setUploadedImages((prev) => [...prev, ...list]);
  };

  // ============ Save (bake) ============
  const handleSavePdf = async () => {
    try {
      if (!originalBytes) {
        alert("No PDF loaded.");
        return;
      }
      const pdfDoc = await PDFLibDocument.load(originalBytes);
      const pages = pdfDoc.getPages();
      const helv = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);

      for (const a of annotations) {
        const page = pages[a.pageIndex];
        if (!page) continue;
        if (a.type === "text") {
          const color = hexToRgb01(colorHexMap[a.colorKey] || "#000");
          page.drawText(a.text, {
            x: a.x,
            y: a.y,
            size: a.size,
            font: helv,
            color,
          });
        } else if (a.type === "rect") {
          const color = hexToRgb01(colorHexMap[a.colorKey] || "#facc15");
          page.drawRectangle({
            x: a.x,
            y: a.y - a.h, // top-left to bottom-left
            width: a.w,
            height: a.h,
            color,
            opacity: Math.max(0, Math.min(1, (a.opacity || 40) / 100)),
            borderWidth: 0,
          });
        } else if (a.type === "image") {
          // read bytes
          const bytes = await a.file.arrayBuffer();
          let img;
          if (/png$/i.test(a.file.name) || a.file.type === "image/png") {
            img = await pdfDoc.embedPng(bytes);
          } else {
            img = await pdfDoc.embedJpg(bytes);
          }
          // place with top-left correction
          page.drawImage(img, {
            x: a.x,
            y: a.y - a.h,
            width: a.w,
            height: a.h,
          });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setEditedBlob(blob);
      alert("Edits saved. Click Download to get the file.");
    } catch (e) {
      alert("Save failed: " + (e?.message || "Unknown error"));
    }
  };

  // ============ Download ============
  const handleDownload = async () => {
    try {
      let blobToDownload = editedBlob;
      if (!blobToDownload) {
        // If not saved, create a blob from original to download
        blobToDownload = new Blob([originalBytes], { type: "application/pdf" });
      }
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement("a");
      a.href = url;
      a.download = editedBlob
        ? fileNameParam.replace(/\.pdf$/i, "_edited.pdf")
        : fileNameParam;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed: " + (e?.message || "Unknown error"));
    }
  };

  // ---- UI helpers ----
  const ToolButton = ({ icon, label }) => (
    <button
      onClick={() => setActiveTool((t) => (t === label ? null : label))}
      className={`flex items-center gap-3 w-full p-2 rounded ${
        activeTool === label
          ? "bg-purple-600 text-white"
          : "bg-white text-gray-700 hover:bg-purple-100"
      }`}
    >
      <i
        className={`fas ${icon} w-7 text-lg ${
          activeTool === label ? "text-white" : "text-gray-600"
        }`}
      ></i>
      <span>{label}</span>
    </button>
  );

  const ColorDot = ({ value, current, onChange }) => (
    <button
      className={`w-6 h-6 rounded-full border ${
        current === value ? "ring-2 ring-purple-500" : ""
      }`}
      style={{ backgroundColor: colorHexMap[value] || "#000" }}
      onClick={() => onChange(value)}
      title={value}
    />
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!isEditing ? (
        <div className="flex items-center justify-center">
          <div className="bg-purple-300 rounded-3xl p-8 w-full max-w-lg shadow-xl">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
              Edit PDF
            </h1>
            <p className="text-center text-gray-700 mb-8">
              Upload a PDF or open it from previous screen to start editing
            </p>

            <div className="border-2 border-dashed border-gray-400 bg-white rounded-lg p-10 text-center hover:border-purple-500 cursor-pointer relative mb-6">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <i className="fas fa-file-pdf text-purple-600 text-6xl mb-3"></i>
                <p className="text-gray-700 font-medium">
                  Click or Drop PDF File Here
                </p>
              </div>
            </div>

            {(originalBytes || fileUrlParam) && (
              <div className="mt-4 bg-purple-100 rounded-md px-4 py-2 text-center">
                <p className="text-gray-700 font-medium">{fileNameParam}</p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleEditClick}
                disabled={!originalBytes}
                className={`px-8 py-3 rounded-full font-semibold shadow ${
                  originalBytes
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } transition`}
              >
                Edit PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBackToUpload}
                className="p-2 bg-purple-500 rounded hover:bg-purple-700"
                title="Back"
              >
                <i className="fas fa-arrow-left text-white"></i>
              </button>
              <h2 className="text-xl font-semibold">PDF Editor</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePdf}
                className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-purple-50"
              >
                Save PDF
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-purple-50"
              >
                Download
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 h-[calc(100vh-180px)]">
            {/* Left: tools */}
            <div className="col-span-2 bg-gray-50 border-r p-4 overflow-auto">
              <h3 className="font-medium text-gray-700 mb-4">Tools</h3>
              <div className="space-y-3">
                <ToolButton icon="fa-font" label="Add Text" />
                <ToolButton icon="fa-image" label="Add Image" />
                <ToolButton icon="fa-vector-square" label="Draw Rect" />
              </div>

              {/* Add Text options */}
              {activeTool === "Add Text" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Text</h4>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    placeholder="Type text and click canvas"
                    rows={3}
                  />
                  <label className="block text-sm text-gray-600 mb-1">Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                  >
                    {[10, 12, 14, 16, 18, 24, 32].map((s) => (
                      <option key={s} value={s}>
                        {s}pt
                      </option>
                    ))}
                  </select>
                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2">
                    {Object.keys(colorHexMap).map((ck) => (
                      <ColorDot
                        key={ck}
                        value={ck}
                        current={textColor}
                        onChange={setTextColor}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Click on the page to place text.
                  </p>
                </div>
              )}

              {/* Add Image options */}
              {activeTool === "Add Image" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Images</h4>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full mb-3 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                  >
                    Upload (PNG/JPG)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                  />
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageId(img.id)}
                          className={`border rounded p-1 ${
                            selectedImageId === img.id
                              ? "border-purple-600"
                              : "border-gray-300"
                          }`}
                          title="Select to place on click"
                        >
                          <img
                            src={img.preview}
                            alt="preview"
                            className="w-full h-20 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No images uploaded.</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Choose an image, then click on the page to place it (150×150 pts).
                  </p>
                </div>
              )}

              {/* Rect options */}
              {activeTool === "Draw Rect" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Rectangle</h4>
                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2 mb-3">
                    {Object.keys(colorHexMap).map((ck) => (
                      <ColorDot
                        key={ck}
                        value={ck}
                        current={rectColor}
                        onChange={setRectColor}
                      />
                    ))}
                  </div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Opacity: {rectOpacity}%
                  </label>
                  <input
                    type="range"
                    className="w-full accent-purple-600 mb-3"
                    min={5}
                    max={100}
                    value={rectOpacity}
                    onChange={(e) => setRectOpacity(parseInt(e.target.value, 10))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={rectWidth}
                        onChange={(e) => setRectWidth(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={rectHeight}
                        onChange={(e) => setRectHeight(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Click page to place top-left corner.
                  </p>
                </div>
              )}
            </div>

            {/* Center: canvas viewer */}
            <div className="col-span-8 p-4 overflow-auto bg-gray-50">
              <div className="bg-white shadow-md mx-auto p-4 max-w-4xl">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full border rounded"
                  style={{ cursor: activeTool ? "crosshair" : "default" }}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                      className="px-3 py-1 border rounded"
                    >
                      -
                    </button>
                    <span className="text-sm text-gray-700">{(scale * 100).toFixed(0)}%</span>
                    <button
                      onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))}
                      className="px-3 py-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Page {currentPageIndex + 1} / {pageCount || "--"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: thumbnails */}
            <div className="col-span-2 bg-gray-50 border-l p-3 overflow-auto">
              <h3 className="font-medium text-gray-700 mb-3">Pages</h3>
              <div className="space-y-2">
                {thumbs.map((src, i) => (
                  <button
                    key={i}
                    className={`block w-full border rounded overflow-hidden ${
                      i === currentPageIndex ? "border-purple-600" : "border-gray-300"
                    }`}
                    onClick={() => gotoPage(i)}
                    title={`Go to page ${i + 1}`}
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img src={src} className="w-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfEditor;
