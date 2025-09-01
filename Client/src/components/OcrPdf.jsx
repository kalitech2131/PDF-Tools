import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';            // match your server
const OCR_ENDPOINT = `${API_BASE}/api/ocr-pdf`;      // <-- CHANGE if your backend route is different

const languages = [
  'Afrikaans','Albanian','Amharic','Arabic','Armenian','Assamese','Azerbaijani',
  'Basque','Belarusian','Bengali','Bosnian','Bulgarian','Burmese','Catalan',
  'Chinese','Croatian','Czech','Danish','Dutch','English','French','German',
  'Greek','Gujarati','Hebrew','Hindi','Hungarian',
];

const OcrPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : prev.length < 3
        ? [...prev, lang]
        : prev
    );
  };

  const filteredLanguages = languages.filter((lang) =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
      setDownloadUrl('');
      sessionStorage.removeItem('ocrDownloadUrl');
    } else {
      setError('Please select a valid PDF file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyOcr = async () => {
    if (!selectedFile) return setError('Please select a PDF file first');
    if (selectedLanguages.length === 0) return setError('Please select at least one language');

    setShowOptions(false);
    await handleProcessPdf(selectedFile);
  };

const resolveAbsoluteUrl = (maybeRelative) => {
  const API_BASE = 'http://localhost:5000';
  if (!maybeRelative) return '';
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  return `${API_BASE}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
};

  const handleProcessPdf = async (file) => {
    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('languages', JSON.stringify(selectedLanguages));

      // axios POST (expects JSON from backend)
      const res = await axios.post(OCR_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // If server ever returns HTML, axios will still put it in res.data (string).
        validateStatus: (s) => s >= 200 && s < 500, // treat 4xx so we can show clean error
      });

      // If server returned HTML, bail with a friendly message
      if (typeof res.data === 'string' && res.data.trim().startsWith('<!DOCTYPE')) {
        throw new Error('Server returned HTML (likely 404). Check OCR endpoint URL.');
      }

      if (!res.status || res.status >= 400) {
        const msg = res.data?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      // Expected shape: { success: true, downloadLink: "/redacted/ocr-xxxx.pdf" }
      const { success, downloadLink, downloadUrl: altUrl } = res.data || {};
      const url = resolveAbsoluteUrl(downloadLink || altUrl || '');

      if (!success || !url) {
        throw new Error('Failed to process PDF');
      }

      setDownloadUrl(url);
      sessionStorage.setItem('ocrDownloadUrl', url);
      navigate('/ocr-pdf/download');
    } catch (err) {
      console.error('OCR error:', err);
      setError(err?.message || 'Failed to process PDF');
    } finally {
      setProcessing(false);
    }
  };

  // Force download via blob (no new tab)
const handleDownload = () => {
  const saved = sessionStorage.getItem('ocrDownloadUrl') || downloadUrl;
  if (!saved) { setError('Download link missing. Please run OCR again.'); return; }
  const a = document.createElement('a');
  a.href = saved;  // absolute url now
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
};


  const handleNewConversion = () => {
    setSelectedFile(null);
    setDownloadUrl('');
    setSelectedLanguages([]);
    setError('');
    sessionStorage.removeItem('ocrDownloadUrl');
    navigate('/ocr-pdf');
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        <header className="bg-white py-4 shadow-sm flex-shrink-0"></header>
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w/full">
            <h1 className="text-3xl font-bold text-green-600 mb-6">OCR Successful!</h1>
            <p className="text-gray-700 mb-8">Your PDF with extracted text is ready to download.</p>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownload}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download OCR PDF
              </button>

              <button
                onClick={handleNewConversion}
                className="bg-white text-green-500 border border-green-500 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                OCR Another PDF
              </button>
            </div>
          </div>
        </main>
        <footer className="bg-white py-4 border-t border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} PDF Tools. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  // Processing Screen
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">Please Wait the Process is in Progress</h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">Extracting text with OCR...</p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Conversion Screen
  return (
    <div className="min-h-screen flex">
      {showOptions && (
        <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg p-6 overflow-y-auto z-10">
          <h3 className="text-xl font-bold text-gray-800 mb-2">OCR PDF options</h3>
          <p className="text-sm text-blue-700 bg-blue-100 p-3 rounded mb-4">
            The accuracy of detection is increased by correctly selecting the document's languages.
          </p>

          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">Document languages</label>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Select language</span>
              <span className="text-sm font-medium">{selectedLanguages.length}/3</span>
            </div>

            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            />

            <div className="max-h-64 overflow-y-auto border rounded p-3 bg-white">
              {filteredLanguages.map((lang) => (
                <label key={lang} className="flex items-center gap-2 text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                    className="rounded"
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full shadow"
              onClick={handleApplyOcr}
              disabled={processing}
            >
              {processing ? <span>Processing...</span> : <><i className="fa-solid fa-circle-check mr-2"></i> Apply OCR</>}
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 p-6 transition-all duration-300 ${showOptions ? 'ml-80' : ''}`}>
        <div className="max-w-xl w-full mx-auto bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10 relative">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-file-image text-green-600"></i>
            OCR PDF
          </h2>
          <p className="text-gray-700 mb-6">Extract text from your PDF files with OCR.</p>

          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="fa-solid fa-file-image text-3xl text-green-400"></i>
              <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
              {selectedFile && <p className="text-sm text-green-600 mt-2">Selected: {selectedFile.name}</p>}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
              {/* <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-green-500 hover:scale-105">
                <i className="fa-brands fa-dropbox text-inherit"></i> Dropbox
              </button>
              <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-green-500 hover:scale-105">
                <i className="fa-brands fa-google-drive text-inherit"></i> Google Drive
              </button> */}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => (selectedFile ? setShowOptions(true) : setError('Please select a PDF file first'))}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-green-600 border border-green-600"
              disabled={processing}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> OCR Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrPdf;
