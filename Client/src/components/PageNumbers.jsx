import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000'; // Option A (no proxy). Proxy ho to base badal dena.

const PageNumbers = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [coverPage, setCoverPage] = useState(false);
  const [position, setPosition] = useState('bottom-center');
  const [firstNumber, setFirstNumber] = useState(3);
  const [numberStyle, setNumberStyle] = useState('numeric');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const revokeIfAny = (url) => {
    try {
      if (url) URL.revokeObjectURL(url);
    } catch {}
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // clear old blob url (if any)
      revokeIfAny(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) setShowOptions(true);
    else alert('Please select a PDF file first');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // clear previous blob link
    revokeIfAny(downloadUrl);
    setDownloadUrl(null);

    try {
      if (!selectedFile) throw new Error('No file selected');

      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      formData.append('pageMode', 'single'); // hardcoded
      formData.append('coverPage', String(coverPage));
      formData.append('position', position);
      formData.append('firstNumber', String(firstNumber));
      formData.append('numberStyle', numberStyle);

      const resp = await axios.post(
        `${API_BASE}/api/add-page-numbers`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob', // <- IMPORTANT
        }
      );

      // axios with responseType:'blob' always gives Blob in resp.data
      const contentType = (resp.headers['content-type'] || '').toLowerCase();

      if (contentType.includes('application/json')) {
        // Server ne JSON bheja (shayad {downloadUrl} ya {error})
        const text = await resp.data.text();
        const data = JSON.parse(text || '{}');

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.downloadUrl) {
          // Static/absolute URL se blob fetch, taki aapka Download button same tarah chale
          const fileRes = await axios.get(data.downloadUrl, { responseType: 'blob' });
          const url = URL.createObjectURL(fileRes.data);
          setDownloadUrl(url);
          return;
        }

        // Agar JSON me blob nahi mila
        throw new Error('Unexpected server response.');
      } else {
        // Direct PDF blob
        const url = URL.createObjectURL(resp.data);
        setDownloadUrl(url);
      }
    } catch (err) {
      console.error('Error processing PDF:', err);
      alert('Error processing PDF: ' + (err?.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadClick = () => {
    if (downloadUrl && selectedFile) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `numbered-${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  useEffect(() => {
    return () => {
      revokeIfAny(downloadUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className={`max-w-2xl w-full text-center rounded-3xl border border-gray-200 shadow-xl p-10 transition-all duration-300 ${showOptions ? 'bg-white' : 'bg-green-300'}`}>
        {!showOptions ? (
          <>
            {/* Upload Screen */}
            <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
              <i className="bi bi-123 text-green-600"></i>
              Page numbers
            </h2>

            <p className="text-gray-700 mb-6">Add page numbers to your PDF document.</p>

            <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-600 transition cursor-pointer relative mb-6">
              <input
                type="file"
                ref={fileInputRef}
                name="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2 z-0">
                <i className="bi bi-file-earmark-pdf text-4xl text-red-500"></i>
                <p className="font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Click or Drop PDF Here'}
                </p>
                {!selectedFile && <p className="text-sm text-gray-500">PDF files only</p>}
              </div>
            </div>

            {/* Cloud Storage Buttons */}
            <div className="flex flex-col gap-4 mb-6">
              <p className="text-gray-600 text-sm">Or import from cloud storage:</p>
              <div className="flex justify-center gap-4">
                {/* <button
                  className="flex items-center gap-2 bg-green-500 text-white rounded-full shadow-lg px-6 py-3 font-semibold transition duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] hover:bg-green-600"
                  onClick={() => alert('Dropbox integration would open here')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M6 1.5l-6 4.5 6 4.5 6-4.5-6-4.5zM0 9l6 4.5 6-4.5-6-4.5-6 4.5zM18 6l-6 4.5 6 4.5 6-4.5-6-4.5zM12 13.5l6 4.5 6-4.5-6-4.5-6 4.5zM6 13.5l-6 4.5 6 4.5 6-4.5-6-4.5z"/>
                  </svg>
                  Dropbox
                </button>
                <button
                  className="flex items-center gap-2 bg-green-500 text-white rounded-full shadow-lg px-6 py-3 font-semibold transition duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] hover:bg-green-600"
                  onClick={() => alert('Google Drive integration would open here')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M7.635 10.5l2.385 4.14L14.865 10.5H7.635zM14.865 9.5h7.29L15.99 3.5l-2.385 4.14L14.865 9.5zM3.855 9.5h7.29L9.75 5.64L7.365 9.5H3.855zM0.705 10.5h7.29l2.385 4.14L5.085 10.5H0.705zM22.155 10.5h-7.29l-2.385 4.14h7.29L22.155 10.5z"/>
                  </svg>
                  Google Drive
                </button> */}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleUploadClick}
                disabled={!selectedFile}
                className={`bg-green-500 text-white rounded-full shadow-lg px-8 py-3 font-semibold flex items-center gap-2 transition duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] ${
                  !selectedFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                }`}
              >
                <i className="bi bi-cloud-arrow-up"></i>
                Page-Number
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Options Form */}
            <div className="text-left">
              <button
                onClick={() => setShowOptions(false)}
                className="mb-4 text-gray-500 hover:text-gray-700 transition flex items-center"
              >
                <i className="bi bi-arrow-left mr-2"></i>Back
              </button>

              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="bi bi-123 text-green-600"></i>
                Page Number Options
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Position</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].map(pos => (
                      <label key={pos} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
                        <input
                          type="radio"
                          name="position"
                          value={pos}
                          checked={position === pos}
                          onChange={(e) => setPosition(e.target.value)}
                          className="h-5 w-5 text-green-500 focus:ring-green-400"
                        />
                        <span className="capitalize">{pos.replace('-',' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number Style</label>
                    <select
                      value={numberStyle}
                      onChange={(e) => setNumberStyle(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="numeric">1, 2, 3</option>
                      <option value="roman">i, ii, iii</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First number</label>
                    <input
                      type="number"
                      value={firstNumber}
                      onChange={(e) => setFirstNumber(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-green-500 focus:border-green-500"
                      min="1"
                    />
                  </div>
                  {/* If you want "cover page" toggle visible:
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={coverPage} onChange={(e)=>setCoverPage(e.target.checked)} />
                    <span>First page is cover page (skip numbering)</span>
                  </label>
                  */}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-40% bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-lg px-6 py-4 font-semibold flex items-center justify-center gap-2 transition duration-100 ease-in-out hover:shadow-md hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-magic"></i>
                      Apply Page Numbers
                    </>
                  )}
                </button>

                {downloadUrl && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleDownloadClick}
                      className="w-40% bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-lg px-6 py-4 font-semibold flex items-center justify-center gap-2 transition duration-100 ease-in-out hover:shadow-md hover:scale-[1.01]"
                    >
                      <i className="bi bi-download "></i>
                      Download Numbered PDF
                    </button>
                  </div>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PageNumbers;
