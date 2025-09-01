// import React, { useEffect, useState, useRef } from "react";
// import { useSearchParams } from "react-router-dom";
// import { PDFDocument, rgb } from "pdf-lib";

// const colorHexMap = {
//   black: "#000000",
//   "red-500": "#ef4444",
//   "blue-500": "#3b82f6",
//   "yellow-400": "#facc15",
//   "purple-600": "#9333ea",
// };

// function hexToRgb01(hex) {
//   const h = hex.replace("#", "");
//   const bigint = parseInt(h, 16);
//   const r = (bigint >> 16) & 255;
//   const g = (bigint >> 8) & 255;
//   const b = bigint & 255;
//   return rgb(r / 255, g / 255, b / 255);
// }

// const PdfEditor = () => {
//   const [sp] = useSearchParams();
//   const fileUrlParam = sp.get("fileUrl") || null;
//   const fileNameParam = sp.get("fileName") || "document.pdf";

//   const [selectedFile, setSelectedFile] = useState(null);
//   const [viewerSrc, setViewerSrc] = useState(null);         // iframe src
//   const [originalBytes, setOriginalBytes] = useState(null); // ArrayBuffer of original
//   const [editedBlob, setEditedBlob] = useState(null);       // Blob of edited pdf

//   const [isEditing, setIsEditing] = useState(false);
//   const [activeTool, setActiveTool] = useState(null);

//   // Text tool state
//   const [textContent, setTextContent] = useState("");
//   const [fontFamily, setFontFamily] = useState("Arial");
//   const [fontSize, setFontSize] = useState("16");
//   const [textColor, setTextColor] = useState("black");

//   // Shapes (UI only in this version; not baked yet)
//   const [shapeType, setShapeType] = useState("rectangle");
//   const [shapeColor, setShapeColor] = useState("black");
//   const [shapeSize, setShapeSize] = useState("medium");

//   // Image tool (UI only preview in this version)
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [selectedImageId, setSelectedImageId] = useState(null);
//   const [imageOpacity, setImageOpacity] = useState(100);
//   const [imageRotation, setImageRotation] = useState(0);
//   const [imageSize, setImageSize] = useState("medium");
//   const fileInputRef = useRef(null);

//   // Pending annotations we will bake into PDF on Save
//   const [annotations, setAnnotations] = useState([]); // {type:'text', text, size, colorHex}

//   // Load from query param (Option A) if present
//   useEffect(() => {
//     let revoke;
//     (async () => {
//       if (fileUrlParam) {
//         setViewerSrc(fileUrlParam);
//         try {
//           const res = await fetch(fileUrlParam);
//           if (!res.ok) throw new Error("Failed to load PDF from server URL");
//           const ab = await res.arrayBuffer();
//           setOriginalBytes(ab);
//         } catch (e) {
//           alert("Failed to load PDF: " + (e?.message || "Unknown error"));
//         }
//       }
//     })();
//     return () => {
//       if (revoke) URL.revokeObjectURL(revoke);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fileUrlParam]);

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file || file.type !== "application/pdf") {
//       alert("Please upload a valid PDF file");
//       return;
//     }
//     setSelectedFile(file);
//     const url = URL.createObjectURL(file);
//     setViewerSrc(url);

//     // Read bytes for editing
//     const buf = await file.arrayBuffer();
//     setOriginalBytes(buf);
//     setEditedBlob(null);
//     setAnnotations([]);
//   };

//   const handleEditClick = () => {
//     if (!viewerSrc || !originalBytes) {
//       alert("Please load a PDF first (or pass fileUrl).");
//       return;
//     }
//     setIsEditing(true);
//   };

//   const handleBackToUpload = () => {
//     setIsEditing(false);
//     setActiveTool(null);
//   };

//   const handleToolClick = (tool) => {
//     setActiveTool(tool === activeTool ? null : tool);
//   };

//   // TEXT: queue a text annotation (this version places text top-left with spacing)
//   const queueTextAnnotation = () => {
//     if (!textContent.trim()) {
//       alert("Please type some text first.");
//       return;
//     }
//     const colorHex = colorHexMap[textColor] || "#000000";
//     setAnnotations((prev) => [
//       ...prev,
//       {
//         type: "text",
//         text: textContent,
//         size: parseInt(fontSize, 10) || 16,
//         colorHex,
//         fontFamily, // not all families available, pdf-lib will use a default
//       },
//     ]);
//     alert("Text added to pending edits. Click 'Save PDF' to bake it.");
//   };

//   // SAVE: bake annotations into a new PDF (editedBlob)
//   const handleSavePdf = async () => {
//     try {
//       if (!originalBytes) {
//         alert("No PDF loaded.");
//         return;
//       }
//       const pdfDoc = await PDFDocument.load(originalBytes);

//       // Currently stamp everything onto first page, stacked downwards.
//       const pages = pdfDoc.getPages();
//       if (pages.length === 0) {
//         alert("PDF has no pages.");
//         return;
//       }
//       const firstPage = pages[0];
//       const { width, height } = firstPage.getSize();

//       let cursorY = height - 50; // start near top
//       const lineGap = 8;

//       for (const ann of annotations) {
//         if (ann.type === "text") {
//           const textRgb = hexToRgb01(ann.colorHex || "#000000");
//           const size = ann.size || 16;

//           // Simple stamp at left margin, moving downward each item
//           firstPage.drawText(ann.text, {
//             x: 50,
//             y: cursorY,
//             size,
//             color: textRgb,
//           });
//           cursorY -= size + lineGap;
//           if (cursorY < 40) cursorY = height - 50; // wrap to top if overflow
//         }
//         // You can extend here: ann.type === 'image' | 'rect' etc.
//       }

//       const bytes = await pdfDoc.save();
//       const blob = new Blob([bytes], { type: "application/pdf" });
//       setEditedBlob(blob);
//       alert("Edits saved. Click 'Download' to get the file.");
//     } catch (e) {
//       alert("Save failed: " + (e?.message || "Unknown error"));
//     }
//   };

//   // DOWNLOAD: prefer edited PDF if present, else original source
//   const handleDownload = async () => {
//     try {
//       let blobToDownload = editedBlob;

//       if (!blobToDownload) {
//         // If no edits saved yet, try to save quickly and then download
//         if (annotations.length > 0) {
//           await handleSavePdf();
//           if (!editedBlob) return; // Save failed
//           blobToDownload = editedBlob; // state may not update synchronously; re-pull below
//         }
//       }

//       if (!blobToDownload) {
//         // No edits; download original
//         if (viewerSrc?.startsWith("http")) {
//           // Server URL → fetch to blob for download
//           const res = await fetch(viewerSrc);
//           if (!res.ok) throw new Error("Failed to fetch original PDF");
//           blobToDownload = await res.blob();
//         } else if (selectedFile) {
//           blobToDownload = selectedFile;
//         }
//       }

//       if (!blobToDownload) {
//         alert("Nothing to download.");
//         return;
//       }

//       const url = URL.createObjectURL(blobToDownload);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = editedBlob ? fileNameParam.replace(/\.pdf$/i, "_edited.pdf") : fileNameParam;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (e) {
//       alert("Download failed: " + (e?.message || "Unknown error"));
//     }
//   };

//   // IMAGE uploads (UI only; not baked into PDF in this minimal fix)
//   const handleImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
//     const images = files.filter((f) => validImageTypes.includes(f.type));
//     if (images.length === 0) {
//       alert("Please upload valid image files (JPEG, PNG, GIF)");
//       return;
//     }
//     const previews = images.map((image) => ({
//       id: Date.now() + Math.random(),
//       file: image,
//       preview: URL.createObjectURL(image),
//       opacity: 100,
//       rotation: 0,
//       size: "medium",
//     }));
//     setUploadedImages((prev) => [...prev, ...previews]);
//   };

//   const removeImage = (id) => {
//     setUploadedImages((prev) => prev.filter((x) => x.id !== id));
//     if (selectedImageId === id) setSelectedImageId(null);
//   };

//   const selectImage = (id) => {
//     setSelectedImageId(id);
//     const img = uploadedImages.find((x) => x.id === id);
//     if (img) {
//       setImageOpacity(img.opacity);
//       setImageRotation(img.rotation);
//       setImageSize(img.size);
//     }
//   };

//   const updateImageProperties = () => {
//     if (!selectedImageId) return;
//     setUploadedImages((prev) =>
//       prev.map((img) =>
//         img.id === selectedImageId
//           ? { ...img, opacity: imageOpacity, rotation: imageRotation, size: imageSize }
//           : img
//       )
//     );
//     alert("Image properties updated (UI). To bake images into PDF, say the word and I’ll add it next.");
//   };

//   const getImageSizeClass = (size) => {
//     switch (size) {
//       case "small":
//         return "max-h-20";
//       case "medium":
//         return "max-h-32";
//       case "large":
//         return "max-h-48";
//       case "custom":
//         return "max-h-64";
//       default:
//         return "max-h-32";
//     }
//   };

//   const colorDot = (colorKey, current, setFn) => (
//     <button
//       key={colorKey}
//       onClick={() => setFn(colorKey)}
//       className={`w-6 h-6 rounded-full border ${current === colorKey ? "ring-2 ring-purple-500" : ""}`}
//       style={{ backgroundColor: colorHexMap[colorKey] || "#000" }}
//       title={colorKey}
//     />
//   );

//   return (
//     <div className="min-h-screen bg-gray-100 p-4">
//       {!isEditing ? (
//         <div className="flex items-center justify-center">
//           <div className="bg-purple-300 rounded-3xl p-8 w-full max-w-lg shadow-xl">
//             <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Edit PDF</h1>
//             <p className="text-center text-gray-700 mb-8">
//               Upload your PDF document (or open from previous screen) to start editing
//             </p>

//             <div className="border-2 border-dashed border-gray-400 bg-white rounded-lg p-10 text-center hover:border-purple-500 cursor-pointer relative mb-6">
//               <input
//                 type="file"
//                 accept=".pdf"
//                 onChange={handleFileChange}
//                 className="absolute inset-0 opacity-0 cursor-pointer"
//               />
//               <div className="flex flex-col items-center justify-center space-y-2">
//                 <i className="fas fa-file-pdf text-purple-600 text-6xl mb-3"></i>
//                 <p className="text-gray-700 font-medium">Click or Drop PDF File Here</p>
//               </div>
//             </div>

//             {(selectedFile || fileUrlParam) && (
//               <div className="mt-4 bg-purple-100 rounded-md px-4 py-2 text-center">
//                 <p className="text-gray-700 font-medium">
//                   {selectedFile ? selectedFile.name : fileNameParam}
//                 </p>
//               </div>
//             )}

//             <div className="flex justify-center mt-6">
//               <button
//                 onClick={handleEditClick}
//                 disabled={!viewerSrc || !originalBytes}
//                 className={`px-8 py-3 rounded-full font-semibold shadow ${
//                   viewerSrc && originalBytes
//                     ? "bg-purple-600 text-white hover:bg-purple-700"
//                     : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                 } transition`}
//               >
//                 Edit PDF
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
//           <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handleBackToUpload}
//                 className="p-2 bg-purple-500 rounded hover:bg-purple-700"
//                 title="Back"
//               >
//                 <i className="fas fa-arrow-left text-white"></i>
//               </button>
//               <h2 className="text-xl font-semibold">PDF Editor</h2>
//             </div>
//             <div className="flex space-x-2">
//               <button
//                 onClick={handleSavePdf}
//                 className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-purple-50"
//               >
//                 Save PDF
//               </button>
//               <button
//                 onClick={handleDownload}
//                 className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-purple-50"
//               >
//                 Download
//               </button>
//             </div>
//           </div>

//           <div className="flex h-[calc(100vh-180px)]">
//             {/* Left tools */}
//             <div className="w-56 bg-gray-50 border-r p-4">
//               <h3 className="font-medium text-gray-700 mb-4">Tools</h3>
//               <div className="space-y-3">
//                 {[
//                   { icon: "fa-font", label: "Add Text" },
//                   { icon: "fa-image", label: "Add Image" },
//                   { icon: "fa-shapes", label: "Draw Shape" },
//                 ].map((tool) => (
//                   <button
//                     key={tool.label}
//                     onClick={() => handleToolClick(tool.label)}
//                     className={`flex items-center gap-3 w-full p-2 rounded ${
//                       activeTool === tool.label
//                         ? "bg-purple-600 text-white"
//                         : "bg-white text-gray-700 hover:bg-purple-100"
//                     }`}
//                   >
//                     <i
//                       className={`fas ${tool.icon} w-7 text-lg ${
//                         activeTool === tool.label ? "text-white" : "text-gray-600"
//                       }`}
//                     ></i>
//                     <span>{tool.label}</span>
//                   </button>
//                 ))}
//               </div>

//               {/* Add Text options */}
//               {activeTool === "Add Text" && (
//                 <div className="mt-4 p-3 bg-gray-100 rounded-lg">
//                   <h4 className="font-medium text-gray-700 mb-2">Text Options</h4>
//                   <label className="block text-sm text-gray-600 mb-1">Text Content</label>
//                   <textarea
//                     value={textContent}
//                     onChange={(e) => setTextContent(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded mb-3"
//                     placeholder="Enter your text"
//                     rows={3}
//                   />
//                   <label className="block text-sm text-gray-600 mb-1">Font Family</label>
//                   <select
//                     value={fontFamily}
//                     onChange={(e) => setFontFamily(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded mb-3"
//                   >
//                     <option>Arial</option>
//                     <option>Times New Roman</option>
//                     <option>Courier New</option>
//                     <option>Verdana</option>
//                     <option>Georgia</option>
//                   </select>

//                   <label className="block text-sm text-gray-600 mb-1">Font Size</label>
//                   <select
//                     value={fontSize}
//                     onChange={(e) => setFontSize(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded mb-3"
//                   >
//                     {[10, 12, 14, 16, 18, 24, 32].map((s) => (
//                       <option key={s} value={s}>{s}pt</option>
//                     ))}
//                   </select>

//                   <label className="block text-sm text-gray-600 mb-1">Color</label>
//                   <div className="flex gap-2 mb-3">
//                     {Object.keys(colorHexMap).map((ck) =>
//                       colorDot(ck, textColor, setTextColor)
//                     )}
//                   </div>

//                   <button
//                     className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
//                     onClick={queueTextAnnotation}
//                   >
//                     Add Text
//                   </button>
//                 </div>
//               )}

//               {/* Add Image options (UI) */}
//               {activeTool === "Add Image" && (
//                 <div className="mt-4 p-3 bg-gray-100 rounded-lg">
//                   <h4 className="font-medium text-gray-700 mb-2">Image Options</h4>
//                   <button
//                     onClick={() => fileInputRef.current.click()}
//                     className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mb-3"
//                   >
//                     Upload Images
//                   </button>
//                   <input
//                     type="file"
//                     ref={fileInputRef}
//                     onChange={handleImageUpload}
//                     accept="image/*"
//                     multiple
//                     className="hidden"
//                   />
//                   {uploadedImages.length > 0 && (
//                     <>
//                       <label className="block text-sm text-gray-600 mb-1">Uploaded</label>
//                       <div className="space-y-2 max-h-60 overflow-y-auto">
//                         {uploadedImages.map((img) => (
//                           <div
//                             key={img.id}
//                             className={`relative group border rounded p-1 ${
//                               selectedImageId === img.id ? "border-purple-600" : "border-gray-300"
//                             }`}
//                             onClick={() => selectImage(img.id)}
//                           >
//                             <img
//                               src={img.preview}
//                               alt="Preview"
//                               className="w-full h-20 object-contain"
//                               style={{ opacity: img.opacity / 100, transform: `rotate(${img.rotation}deg)` }}
//                             />
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 removeImage(img.id);
//                               }}
//                               className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                               title="Remove"
//                             >
//                               ×
//                             </button>
//                             <p className="text-xs text-gray-500 truncate">{img.file.name}</p>
//                           </div>
//                         ))}
//                       </div>

//                       <label className="block text-sm text-gray-600 mt-3 mb-1">Opacity: {imageOpacity}%</label>
//                       <input
//                         type="range"
//                         min="0"
//                         max="100"
//                         value={imageOpacity}
//                         onChange={(e) => setImageOpacity(parseInt(e.target.value, 10))}
//                         className="w-full accent-purple-600"
//                       />

//                       <label className="block text-sm text-gray-600 mt-3 mb-1">Rotation: {imageRotation}°</label>
//                       <input
//                         type="range"
//                         min="0"
//                         max="360"
//                         value={imageRotation}
//                         onChange={(e) => setImageRotation(parseInt(e.target.value, 10))}
//                         className="w-full accent-purple-600"
//                       />

//                       <label className="block text-sm text-gray-600 mt-3 mb-1">Size</label>
//                       <select
//                         value={imageSize}
//                         onChange={(e) => setImageSize(e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded"
//                       >
//                         <option value="small">Small</option>
//                         <option value="medium">Medium</option>
//                         <option value="large">Large</option>
//                         <option value="custom">Custom</option>
//                       </select>

//                       <button
//                         className="w-full mt-3 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
//                         onClick={updateImageProperties}
//                         disabled={!selectedImageId}
//                       >
//                         Update Image (UI)
//                       </button>
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* Draw Shape UI (not baked in this minimal fix) */}
//               {activeTool === "Draw Shape" && (
//                 <div className="mt-4 p-3 bg-gray-100 rounded-lg">
//                   <h4 className="font-medium text-gray-700 mb-2">Shape Options</h4>
//                   <label className="block text-sm text-gray-600 mb-1">Type</label>
//                   <select
//                     value={shapeType}
//                     onChange={(e) => setShapeType(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded mb-3"
//                   >
//                     <option value="rectangle">Rectangle</option>
//                     <option value="circle">Circle</option>
//                     <option value="line">Line</option>
//                     <option value="arrow">Arrow</option>
//                     <option value="triangle">Triangle</option>
//                   </select>

//                   <label className="block text-sm text-gray-600 mb-1">Color</label>
//                   <div className="flex gap-2 mb-3">
//                     {Object.keys(colorHexMap).map((ck) =>
//                       colorDot(ck, shapeColor, setShapeColor)
//                     )}
//                   </div>

//                   <label className="block text-sm text-gray-600 mb-1">Size</label>
//                   <select
//                     value={shapeSize}
//                     onChange={(e) => setShapeSize(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded"
//                   >
//                     <option value="small">Small</option>
//                     <option value="medium">Medium</option>
//                     <option value="large">Large</option>
//                   </select>

//                   <p className="text-xs text-gray-500 mt-3">
//                     Note: In this minimal version, shapes are not baked into the PDF yet.
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Center viewer */}
//             <div className="flex-1 p-4 overflow-auto bg-gray-50">
//               <div className="bg-white shadow-md mx-auto p-4 max-w-4xl">
//                 <div className="border rounded-lg min-h-[600px] flex items-stretch justify-center">
//                   {viewerSrc ? (
//                     <iframe
//                       title="PDF Preview"
//                       src={viewerSrc}
//                       className="w-full h-[80vh] rounded"
//                     />
//                   ) : (
//                     <div className="flex-1 flex items-center justify-center text-gray-500">
//                       PDF document preview will appear here
//                     </div>
//                   )}
//                 </div>
//                 {annotations.length > 0 && (
//                   <div className="mt-3 text-sm text-gray-600">
//                     Pending edits: {annotations.length} (Save to apply)
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Right properties (simple placeholder) */}
//             <div className="w-64 bg-gray-50 border-l p-4">
//               <h3 className="font-medium text-gray-700 mb-3">Properties</h3>
//               <div className="text-sm text-gray-600">
//                 <div><span className="font-medium">File:</span> {selectedFile ? selectedFile.name : fileNameParam}</div>
//                 <div><span className="font-medium">Edits:</span> {annotations.length}</div>
//                 <div><span className="font-medium">Saved:</span> {editedBlob ? "Yes" : "No"}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PdfEditor;























import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const colorHexMap = {
  black: "#000000",
  "red-500": "#ef4444",
  "blue-500": "#3b82f6",
  "yellow-400": "#facc15",
  "purple-600": "#9333ea",
};

function hexToRgb01(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return rgb(r / 255, g / 255, b / 255);
}

const PdfEditor = () => {
  const [sp] = useSearchParams();
  const fileUrlParam = sp.get("fileUrl") || null;
  const fileNameParam = sp.get("fileName") || "document.pdf";

  const [selectedFile, setSelectedFile] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);
  const [originalBytes, setOriginalBytes] = useState(null);
  const [editedBlob, setEditedBlob] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // Text tool state
  const [textContent, setTextContent] = useState("");
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("black");

  // Shape tool state
  const [shapeType, setShapeType] = useState("rectangle");
  const [shapeColor, setShapeColor] = useState("black");
  const [shapeSize, setShapeSize] = useState("medium");

  // Image tool state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageSize, setImageSize] = useState("medium");
  const fileInputRef = useRef(null);

  // Annotations that will be baked into PDF on Save
  const [annotations, setAnnotations] = useState([]);

  // Load from query param if present
  useEffect(() => {
    let revoke;
    (async () => {
      if (fileUrlParam) {
        setViewerSrc(fileUrlParam);
        try {
          const res = await fetch(fileUrlParam);
          if (!res.ok) throw new Error("Failed to load PDF from server URL");
          const ab = await res.arrayBuffer();
          setOriginalBytes(ab);
        } catch (e) {
          alert("Failed to load PDF: " + (e?.message || "Unknown error"));
        }
      }
    })();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrlParam]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setViewerSrc(url);

    // Read bytes for editing
    const buf = await file.arrayBuffer();
    setOriginalBytes(buf);
    setEditedBlob(null);
    setAnnotations([]);
  };

  const handleEditClick = () => {
    if (!viewerSrc || !originalBytes) {
      alert("Please load a PDF first (or pass fileUrl).");
      return;
    }
    setIsEditing(true);
  };

  const handleBackToUpload = () => {
    setIsEditing(false);
    setActiveTool(null);
  };

  const handleToolClick = (tool) => {
    setActiveTool(tool === activeTool ? null : tool);
  };

  // TEXT: queue a text annotation
  const queueTextAnnotation = () => {
    if (!textContent.trim()) {
      alert("Please type some text first.");
      return;
    }
    const colorHex = colorHexMap[textColor] || "#000000";
    setAnnotations((prev) => [
      ...prev,
      {
        type: "text",
        text: textContent,
        size: parseInt(fontSize, 10) || 16,
        colorHex,
        fontFamily,
        id: Date.now() + Math.random(),
      },
    ]);
    setTextContent("");
  };

  // SHAPE: queue a shape annotation
  const queueShapeAnnotation = () => {
    const colorHex = colorHexMap[shapeColor] || "#000000";
    setAnnotations((prev) => [
      ...prev,
      {
        type: "shape",
        shapeType,
        colorHex,
        size: shapeSize,
        id: Date.now() + Math.random(),
      },
    ]);
  };

  // IMAGE: queue an image annotation
  const queueImageAnnotation = (imageId) => {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;
    
    setAnnotations((prev) => [
      ...prev,
      {
        type: "image",
        imageData: image.preview,
        opacity: imageOpacity,
        rotation: imageRotation,
        size: imageSize,
        id: Date.now() + Math.random(),
      },
    ]);
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedImageId(null);
  };

  // Remove annotation
  const removeAnnotation = (id) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  // SAVE: bake annotations into a new PDF
  const handleSavePdf = async () => {
    try {
      if (!originalBytes) {
        alert("No PDF loaded.");
        return;
      }
      const pdfDoc = await PDFDocument.load(originalBytes);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        alert("PDF has no pages.");
        return;
      }
      
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Process annotations
      for (const ann of annotations) {
        if (ann.type === "text") {
          const textRgb = hexToRgb01(ann.colorHex || "#000000");
          const size = ann.size || 16;
          
          // Simple placement - in a real app you'd want more control
          firstPage.drawText(ann.text, {
            x: 50,
            y: height - 50,
            size,
            color: textRgb,
            font: pdfDoc.embedStandardFont(ann.fontFamily === "Helvetica" ? "Helvetica" : "Times-Roman"),
          });
        } 
        else if (ann.type === "shape") {
          const shapeRgb = hexToRgb01(ann.colorHex || "#000000");
          const size = ann.size === "small" ? 30 : ann.size === "large" ? 70 : 50;
          
          if (ann.shapeType === "rectangle") {
            firstPage.drawRectangle({
              x: 50,
              y: height - 100,
              width: size,
              height: size/2,
              color: shapeRgb,
            });
          } else if (ann.shapeType === "circle") {
            firstPage.drawCircle({
              x: 80,
              y: height - 100,
              size: size/2,
              color: shapeRgb,
            });
          }
        }
        else if (ann.type === "image") {
          try {
            // Fetch the image
            const response = await fetch(ann.imageData);
            const imageBytes = await response.arrayBuffer();
            
            // Embed the image in the PDF
            let image;
            if (ann.imageData.toLowerCase().endsWith('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
            
            // Calculate dimensions based on size
            let imgWidth, imgHeight;
            switch(ann.size) {
              case "small": 
                imgWidth = 100;
                break;
              case "large":
                imgWidth = 200;
                break;
              default:
                imgWidth = 150;
            }
            imgHeight = image.height * imgWidth / image.width;
            
            // Draw the image
            firstPage.drawImage(image, {
              x: 50,
              y: height - 150,
              width: imgWidth,
              height: imgHeight,
              opacity: ann.opacity / 100,
              rotate: degrees(ann.rotation),
            });
          } catch (error) {
            console.error("Error embedding image:", error);
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setEditedBlob(blob);
      
      // Update the viewer
      const url = URL.createObjectURL(blob);
      setViewerSrc(url);
      
      alert("Edits saved successfully!");
    } catch (e) {
      alert("Save failed: " + (e?.message || "Unknown error"));
    }
  };

  // DOWNLOAD: download the edited PDF
  const handleDownload = async () => {
    try {
      let blobToDownload = editedBlob;

      if (!blobToDownload) {
        if (annotations.length > 0) {
          await handleSavePdf();
          if (!editedBlob) return;
          blobToDownload = editedBlob;
        } else {
          // No edits; download original
          if (viewerSrc?.startsWith("http")) {
            const res = await fetch(viewerSrc);
            if (!res.ok) throw new Error("Failed to fetch original PDF");
            blobToDownload = await res.blob();
          } else if (selectedFile) {
            blobToDownload = selectedFile;
          }
        }
      }

      if (!blobToDownload) {
        alert("Nothing to download.");
        return;
      }

      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement("a");
      a.href = url;
      a.download = editedBlob ? fileNameParam.replace(/\.pdf$/i, "_edited.pdf") : fileNameParam;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed: " + (e?.message || "Unknown error"));
    }
  };

  // IMAGE uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
    const images = files.filter((f) => validImageTypes.includes(f.type));
    if (images.length === 0) {
      alert("Please upload valid image files (JPEG, PNG, GIF)");
      return;
    }
    const previews = images.map((image) => ({
      id: Date.now() + Math.random(),
      file: image,
      preview: URL.createObjectURL(image),
      opacity: 100,
      rotation: 0,
      size: "medium",
    }));
    setUploadedImages((prev) => [...prev, ...previews]);
  };

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((x) => x.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  const selectImage = (id) => {
    setSelectedImageId(id);
    const img = uploadedImages.find((x) => x.id === id);
    if (img) {
      setImageOpacity(img.opacity);
      setImageRotation(img.rotation);
      setImageSize(img.size);
    }
  };

  const updateImageProperties = () => {
    if (!selectedImageId) return;
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId
          ? { ...img, opacity: imageOpacity, rotation: imageRotation, size: imageSize }
          : img
      )
    );
  };

  const getImageSizeClass = (size) => {
    switch (size) {
      case "small":
        return "max-h-20";
      case "medium":
        return "max-h-32";
      case "large":
        return "max-h-48";
      case "custom":
        return "max-h-64";
      default:
        return "max-h-32";
    }
  };

  const colorDot = (colorKey, current, setFn) => (
    <button
      key={colorKey}
      onClick={() => setFn(colorKey)}
      className={`w-6 h-6 rounded-full border ${current === colorKey ? "ring-2 ring-purple-500" : ""}`}
      style={{ backgroundColor: colorHexMap[colorKey] || "#000" }}
      title={colorKey}
    />
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!isEditing ? (
        <div className="flex items-center justify-center">
          <div className="bg-purple-300 rounded-3xl p-8 w-full max-w-lg shadow-xl">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Edit PDF</h1>
            <p className="text-center text-gray-700 mb-8">
              Upload your PDF document (or open from previous screen) to start editing
            </p>

            <div className="border-2 border-dashed border-gray-400 bg-white rounded-lg p-10 text-center hover:border-purple-500 cursor-pointer relative mb-6">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* <i className="fas fa-file-pdf text-purple-600 text-6xl mb-3"></i> */}
                <p className="text-gray-700 font-medium">Click or Drop PDF File Here</p>
              </div>
            </div>

            {(selectedFile || fileUrlParam) && (
              <div className="mt-4 bg-purple-100 rounded-md px-4 py-2 text-center">
                <p className="text-gray-700 font-medium">
                  {selectedFile ? selectedFile.name : fileNameParam}
                </p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleEditClick}
                disabled={!viewerSrc || !originalBytes}
                className={`px-8 py-3 rounded-full font-semibold shadow ${
                  viewerSrc && originalBytes
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
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
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
            <div className="flex space-x-2">
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

          <div className="flex h-[calc(100vh-180px)]">
            {/* Left tools */}
            <div className="w-56 bg-gray-50 border-r p-4">
              <h3 className="font-medium text-gray-700 mb-4">Tools</h3>
              <div className="space-y-3">
                {[
                  { icon: "fa-font", label: "Add Text" },
                  // { icon: "fa-image", label: "Add Image" },
                  { icon: "fa-shapes", label: "Draw Shape" },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    onClick={() => handleToolClick(tool.label)}
                    className={`flex items-center gap-3 w-full p-2 rounded ${
                      activeTool === tool.label
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700 hover:bg-purple-100"
                    }`}
                  >
                    <i
                      className={`fas ${tool.icon} w-7 text-lg ${
                        activeTool === tool.label ? "text-white" : "text-gray-600"
                      }`}
                    ></i>
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Add Text options */}
              {activeTool === "Add Text" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Text Options</h4>
                  <label className="block text-sm text-gray-600 mb-1">Text Content</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    placeholder="Enter your text"
                    rows={3}
                  />

                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2 mb-3">
                    {Object.keys(colorHexMap).map((ck) =>
                      colorDot(ck, textColor, setTextColor)
                    )}
                  </div>

                  <button
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                    onClick={queueTextAnnotation}
                  >
                    Add Text
                  </button>
                </div>
              )}

              {/* Add Image options */}
{/*               
              {activeTool === "Add Image" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Image Options</h4>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mb-3"
                  >
                    Upload Images
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  {uploadedImages.length > 0 && (
                    <>
                      <label className="block text-sm text-gray-600 mb-1">Uploaded</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uploadedImages.map((img) => (
                          <div
                            key={img.id}
                            className={`relative group border rounded p-1 ${
                              selectedImageId === img.id ? "border-purple-600" : "border-gray-300"
                            }`}
                            onClick={() => selectImage(img.id)}
                          >
                            <img
                              src={img.preview}
                              alt="Preview"
                              className="w-full h-20 object-contain"
                              style={{ opacity: img.opacity / 100, transform: `rotate(${img.rotation}deg)` }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(img.id);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-500 truncate">{img.file.name}</p>
                          </div>
                        ))}
                      </div> */}
{/* 
                      <label className="block text-sm text-gray-600 mt-3 mb-1">Opacity: {imageOpacity}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imageOpacity}
                        onChange={(e) => setImageOpacity(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-600"
                      />

                      <label className="block text-sm text-gray-600 mt-3 mb-1">Rotation: {imageRotation}°</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={imageRotation}
                        onChange={(e) => setImageRotation(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-600"
                      />

                      <label className="block text-sm text-gray-600 mt-3 mb-1">Size</label>
                      <select
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>

                      <button
                        className="w-full mt-3 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                        onClick={updateImageProperties}
                        disabled={!selectedImageId}
                      >
                        Update Image
                      </button>
                      
                      <button
                        className="w-full mt-2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                        onClick={() => queueImageAnnotation(selectedImageId)}
                        disabled={!selectedImageId}
                      >
                        Add to PDF
                      </button>
                    </>
                  )}
                </div>
              )} */}

              {/* Draw Shape options */}
              {activeTool === "Draw Shape" && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Shape Options</h4>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select
                    value={shapeType}
                    onChange={(e) => setShapeType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                  </select>

                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2 mb-3">
                    {Object.keys(colorHexMap).map((ck) =>
                      colorDot(ck, shapeColor, setShapeColor)
                    )}
                  </div>

                  <label className="block text-sm text-gray-600 mb-1">Size</label>
                  <select
                    value={shapeSize}
                    onChange={(e) => setShapeSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>

                  <button
                    className="w-full mt-3 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                    onClick={queueShapeAnnotation}
                  >
                    Add Shape
                  </button>
                </div>
              )}
            </div>

            {/* Center viewer */}
            <div className="flex-1 p-4 overflow-auto bg-gray-50">
              <div className="bg-white shadow-md mx-auto p-4 max-w-4xl">
                <div className="border rounded-lg min-h-[600px] flex items-stretch justify-center">
                  {viewerSrc ? (
                    <iframe
                      title="PDF Preview"
                      src={viewerSrc}
                      className="w-full h-[80vh] rounded"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      PDF document preview will appear here
                    </div>
                  )}
                </div>
                
                {annotations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Pending Edits</h4>
                    <div className="flex flex-wrap gap-2">
                      {annotations.map(ann => (
                        <div key={ann.id} className="bg-gray-100 rounded-md px-3 py-1 flex items-center">
                          <span className="text-sm">
                            {ann.type === 'text' && `Text: ${ann.text.substring(0, 15)}...`}
                            {ann.type === 'shape' && `Shape: ${ann.shapeType}`}
                            {ann.type === 'image' && `Image`}
                          </span>
                          <button 
                            onClick={() => removeAnnotation(ann.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right properties */}
            <div className="w-64 bg-gray-50 border-l p-4">
              <h3 className="font-medium text-gray-700 mb-3">Properties</h3>
              <div className="text-sm text-gray-600">
                <div><span className="font-medium">File:</span> {selectedFile ? selectedFile.name : fileNameParam}</div>
                <div><span className="font-medium">Edits:</span> {annotations.length}</div>
                <div><span className="font-medium">Saved:</span> {editedBlob ? "Yes" : "No"}</div>
              </div>
              
              {annotations.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={handleSavePdf}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mb-2"
                  >
                    Save All Edits
                  </button>
                  <button
                    onClick={() => setAnnotations([])}
                    className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                  >
                    Clear All Edits
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfEditor;