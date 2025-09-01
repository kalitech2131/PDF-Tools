import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PdfToPowerPoint = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pptxBlobUrl, setPptxBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      setSelectedFile(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleConvertClick = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

      try {
        const response = await axios.post('http://localhost:5000/api/convert-pdf-to-powerpoint', formData, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
      const url = window.URL.createObjectURL(blob);
      setPptxBlobUrl(url);
    } catch (error) {
      console.error('Conversion failed', error);
      setError(error.response?.data?.message || 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadClick = () => {
    if (!pptxBlobUrl) return;

    const link = document.createElement('a');
    link.href = pptxBlobUrl;
    link.download = `${selectedFile.name.replace(/\.pdf$/i, '')}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewConversion = () => {
    setPptxBlobUrl(null);
    setSelectedFile(null);
    navigate('/pdf-to-powerpoint');
  };

  const handleDropboxSelect = () => {
    // Implement Dropbox file picker integration
    console.log('Dropbox integration');
    // This would typically use the Dropbox Chooser
    // https://www.dropbox.com/developers/chooser
  };

  const handleGoogleDriveSelect = () => {
    // Implement Google Drive file picker integration
    console.log('Google Drive integration');
    // This would typically use the Google Picker API
    // https://developers.google.com/drive/picker
  };

  if (isDownloadScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-red-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Conversion Complete!</h2>
          <p className="text-gray-700 mb-6">
            Your PowerPoint file has been downloaded automatically.
            If the download didn't start, check your browser's download folder.
          </p>
          <button
            onClick={handleNewConversion}
            className="bg-red-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 w-full"
          >
            <i className="fa-solid fa-rotate-left"></i>
            Convert Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {isConverting ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait... Conversion in Progress
          </h1>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-red-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : pptxBlobUrl ? (
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-red-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Conversion Successful!</h2>
          <p className="text-gray-700 mb-6">Your PowerPoint file is ready to download.</p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={handleDownloadClick}
              className="bg-red-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Download Now
            </button>
            
            <button
              onClick={handleNewConversion}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-left"></i>
              Convert Another File
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full bg-red-50 text-center rounded-3xl border border-gray-200 shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            PDF to PowerPoint
          </h2>

          <p className="text-gray-700 mb-6">Convert your PDF documents to editable PowerPoint presentations</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-red-500 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="fa-solid fa-file-arrow-up text-red-500 text-3xl"></i>
              <p className="font-medium text-gray-700">Click or Drop PDF File Here</p>
              <p className="text-sm text-gray-500">Supports .pdf files</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 my-4">
            {/* <button 
              onClick={handleDropboxSelect}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <i className="fa-brands fa-dropbox"></i>
              Dropbox
            </button> */}
            
                  {/* <button 
                    onClick={handleGoogleDriveSelect}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <i className="fa-brands fa-google-drive"></i>
                    Google Drive
                  </button> */}
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-300">
              <div className="flex items-center">
                <i className="fa-solid fa-file-pdf text-red-500 mr-3"></i>
                <div>
                  <p className="text-gray-700 font-medium truncate max-w-[200px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <button
              onClick={handleConvertClick}
              disabled={!selectedFile}
              className={`${selectedFile ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-full font-medium transition flex items-center justify-center gap-2 mx-auto`}
            >
              <i className="fa-solid fa-file-powerpoint"></i>
              Convert to PowerPoint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToPowerPoint;








































// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// const PdfToPowerPoint = ({ isDownloadScreen }) => {
//   const navigate = useNavigate();
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isConverting, setIsConverting] = useState(false);
//   const [pptxBlobUrl, setPptxBlobUrl] = useState(null);
//   const [error, setError] = useState(null);

//   const handleFileChange = (e) => {
//     setError(null);
//     const file = e.target.files[0];
//     if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
//       setSelectedFile(file);
//     } else {
//       setError('Please select a valid PDF file');
//     }
//   };

//   const handleConvertClick = async () => {
//     if (!selectedFile) {
//       setError('Please select a PDF file first');
//       return;
//     }

//     setIsConverting(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     try {
//       // Check if the server is reachable first
//       try {
//         await axios.get('http://localhost:5000/api/health');
//       } catch (err) {
//         throw new Error('Conversion server is not available. Please make sure the backend is running.');
//       }

//       const response = await axios.post(
//         'http://localhost:5000/api/convert-pdf-to-powerpoint', 
//         formData, 
//         {
//           responseType: 'blob',
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//           timeout: 300000, // 5 minutes timeout for large files
//         }
//       );

//       // Check if we got a successful response
//       if (response.status !== 200) {
//         // Try to parse error message from response
//         const errorText = await response.data.text();
//         throw new Error(errorText || 'Conversion failed');
//       }

//       const blob = new Blob([response.data], { 
//         type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
//       });
//       const url = window.URL.createObjectURL(blob);
//       setPptxBlobUrl(url);
//     } catch (error) {
//       console.error('Conversion failed', error);
      
//       // Handle different types of errors
//       if (error.code === 'ERR_NETWORK') {
//         setError('Network error. Please check if the conversion server is running.');
//       } else if (error.code === 'ECONNABORTED') {
//         setError('Request timeout. The conversion is taking too long.');
//       } else if (error.response?.status === 404) {
//         setError('Conversion endpoint not found. Please check the server configuration.');
//       } else if (error.response?.status === 413) {
//         setError('File too large. Please try with a smaller PDF file.');
//       } else if (error.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//       } else {
//         setError(error.message || 'Conversion failed. Please try again.');
//       }
//     } finally {
//       setIsConverting(false);
//     }
//   };

//   // Rest of the component remains the same...
//   const handleDownloadClick = () => {
//     if (!pptxBlobUrl) return;

//     const link = document.createElement('a');
//     link.href = pptxBlobUrl;
//     link.download = `${selectedFile.name.replace(/\.pdf$/i, '')}.pptx`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleNewConversion = () => {
//     setPptxBlobUrl(null);
//     setSelectedFile(null);
//     navigate('/pdf-to-powerpoint');
//   };

//   const handleDropboxSelect = () => {
//     console.log('Dropbox integration');
//   };

//   const handleGoogleDriveSelect = () => {
//     console.log('Google Drive integration');
//   };

//   // Rest of the JSX remains the same...
//   if (isDownloadScreen) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-6">
//         <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
//           <div className="mb-6 text-red-500">
//             <i className="fa-solid fa-circle-check text-5xl"></i>
//           </div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Conversion Complete!</h2>
//           <p className="text-gray-700 mb-6">
//             Your PowerPoint file has been downloaded automatically.
//             If the download didn't start, check your browser's download folder.
//           </p>
//           <button
//             onClick={handleNewConversion}
//             className="bg-red-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 w-full"
//           >
//             <i className="fa-solid fa-rotate-left"></i>
//             Convert Another File
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-6">
//       {isConverting ? (
//         <div className="text-center">
//           <h1 className="text-4xl font-bold mb-10 text-black">
//             Please Wait... Conversion in Progress
//           </h1>
//           <div className="w-20 h-20 mx-auto relative">
//             <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
//             <div className="absolute inset-0 rounded-full border-[6px] border-red-500 border-t-transparent animate-spin"></div>
//           </div>
//           <p className="mt-4 text-gray-600">This may take a few minutes...</p>
//         </div>
//       ) : pptxBlobUrl ? (
//         <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
//           <div className="mb-6 text-red-500">
//             <i className="fa-solid fa-circle-check text-5xl"></i>
//           </div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Conversion Successful!</h2>
//           <p className="text-gray-700 mb-6">Your PowerPoint file is ready to download.</p>
          
//           <div className="flex flex-col gap-4">
//             <button
//               onClick={handleDownloadClick}
//               className="bg-red-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
//             >
//               <i className="fa-solid fa-download"></i>
//               Download Now
//             </button>
            
//             <button
//               onClick={handleNewConversion}
//               className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
//             >
//               <i className="fa-solid fa-rotate-left"></i>
//               Convert Another File
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div className="max-w-xl w-full bg-red-50 text-center rounded-3xl border border-gray-200 shadow-xl p-10">
//           <h2 className="text-4xl font-bold text-gray-800 mb-3">
//             PDF to PowerPoint
//           </h2>

//           <p className="text-gray-700 mb-6">Convert your PDF documents to editable PowerPoint presentations</p>

//           {error && (
//             <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
//               <i className="fa-solid fa-triangle-exclamation mr-2"></i>
//               {error}
//             </div>
//           )}

//           <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-red-500 transition cursor-pointer relative">
//             <input
//               type="file"
//               accept=".pdf"
//               onChange={handleFileChange}
//               className="absolute inset-0 opacity-0 cursor-pointer z-10"
//             />
//             <div className="flex flex-col items-center justify-center space-y-2 z-0">
//               <i className="fa-solid fa-file-arrow-up text-red-500 text-3xl"></i>
//               <p className="font-medium text-gray-700">Click or Drop PDF File Here</p>
//               <p className="text-sm text-gray-500">Supports .pdf files</p>
//             </div>
//           </div>

//           <div className="flex justify-center gap-4 my-4">
//             <button 
//               onClick={handleDropboxSelect}
//               className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
//             >
//               <i className="fa-brands fa-dropbox"></i>
//               Dropbox
//             </button>
            
//             <button 
//               onClick={handleGoogleDriveSelect}
//               className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
//             >
//               <i className="fa-brands fa-google-drive"></i>
//               Google Drive
//             </button>
//           </div>

//           {selectedFile && (
//             <div className="mt-4 p-3 bg-white rounded-md border border-gray-300">
//               <div className="flex items-center">
//                 <i className="fa-solid fa-file-pdf text-red-500 mr-3"></i>
//                 <div>
//                   <p className="text-gray-700 font-medium truncate max-w-[200px]">
//                     {selectedFile.name}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     {(selectedFile.size / 1024).toFixed(2)} KB
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="mt-6 space-y-4">
//             <button
//               onClick={handleConvertClick}
//               disabled={!selectedFile}
//               className={`${selectedFile ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-full font-medium transition flex items-center justify-center gap-2 mx-auto`}
//             >
//               <i className="fa-solid fa-file-powerpoint"></i>
//               Convert to PowerPoint
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PdfToPowerPoint;