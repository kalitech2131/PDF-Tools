import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000'; // proxy nahi use kar rahe to full URL

const RedactPdf = ({ isDownloadScreen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // Restore downloadUrl if we navigated to /redact-download
  useEffect(() => {
    if (isDownloadScreen) {
      const saved = sessionStorage.getItem('redactDownloadUrl') || '';
      if (saved && !downloadUrl) setDownloadUrl(saved);
    }
  }, [isDownloadScreen, downloadUrl]);

  const resolveAbsoluteUrl = (maybeRelative) => {
    if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
    return `${API_BASE}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('application/pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      setSelectedFile(file);
      setIsUploaded(true);
      setError('');
      setDownloadUrl('');
      sessionStorage.removeItem('redactDownloadUrl');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.match('application/pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      setSelectedFile(file);
      setIsUploaded(true);
      setError('');
      setDownloadUrl('');
      sessionStorage.removeItem('redactDownloadUrl');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleRedact = async () => {
    if (!selectedFile) {
      setError('Please upload a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const res = await axios.post(`${API_BASE}/api/redact-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { success, downloadUrl: urlFromApi } = res.data || {};
      if (success && urlFromApi) {
        const abs = resolveAbsoluteUrl(urlFromApi);
        setDownloadUrl(abs);
        sessionStorage.setItem('redactDownloadUrl', abs);
        navigate('/redact-download');
      } else {
        throw new Error('Redaction failed');
      }
    } catch (err) {
      console.error('Redaction error:', err);
      const msg = err?.response?.data?.error || err?.message || 'Redaction failed';
      setError(`Redaction failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔽 helper: filename extraction from headers or URL
  const getFilename = (res, url) => {
    const cd = res?.headers?.['content-disposition'];
    if (cd) {
      const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
      if (m) return decodeURIComponent(m[1] || m[2]);
    }
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').pop();
      return last || 'redacted.pdf';
    } catch {
      return 'redacted.pdf';
    }
  };

  // ✅ Option B: force download via blob (no new tab)
  const handleDownloadClick = async () => {
    const saved = sessionStorage.getItem('redactDownloadUrl') || downloadUrl;
    if (!saved) {
      setError('Missing download URL. Please run redaction again.');
      return;
    }

    const abs = resolveAbsoluteUrl(saved);

    try {
      const res = await axios.get(abs, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const filename = getFilename(res, abs);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed:', e);
      setError('Download failed. Please try again.');
    }
  };

  const handleNewRedaction = () => {
    navigate('/redact-pdf');
    setSelectedFile(null);
    setIsUploaded(false);
    setDownloadUrl('');
    setError('');
    sessionStorage.removeItem('redactDownloadUrl');
  };

  // Download Screen
  if (isDownloadScreen) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        <header className="bg-white py-4 shadow-sm flex-shrink-0"></header>
        <main className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
            <h1 className="text-3xl font-bold text-orange-600 mb-6">Redaction Complete!</h1>
            <p className="text-gray-700 mb-8">Your redacted PDF is ready to download.</p>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex flex-col gap-4">
              <button
                onClick={handleDownloadClick}
                className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download Redacted PDF
              </button>

              <button
                onClick={handleNewRedaction}
                className="bg-white text-orange-500 border border-orange-500 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                Redact Another PDF
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
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">
            Please Wait the Process is in Progress
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">
            Redacting sensitive information...
          </p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-orange-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Main Redaction Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-xl w-full bg-orange-300 text-center rounded-3xl border border-white shadow-xl p-10">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Redact PDF
        </h2>

        <p className="text-gray-700 mb-6">Upload your PDF to redact personal information</p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div
          className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-medium text-gray-700">
              {selectedFile ? selectedFile.name : "Click or Drop PDF Here"}
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-orange-100 rounded-md">
            <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-6">
          {/* <button className="bg-orange-500 text-white border border-orange-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-orange-500 hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
            </svg>
            Dropbox
          </button>

          <button className="bg-orange-500 text-white border border-orange-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-orange-500 hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
            </svg>
            Google Drive
          </button> */}
        </div>

        <div className="mt-6">
          <button
            onClick={handleRedact}
            disabled={!selectedFile || isProcessing}
            className="bg-white text-orange-500 border border-orange-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-orange-500 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isProcessing ? 'Processing...' : 'Redact PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedactPdf;
