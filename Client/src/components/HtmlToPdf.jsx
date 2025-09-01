

  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';

  const HtmlToPdf = ({ isDownloadScreen }) => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState('');
    const [convertedFileName, setConvertedFileName] = useState('');

 const handleConvertClick = async () => {
  const raw = url.trim();
  if (!raw) {
    setError('Please enter a valid URL');
    return;
  }

  // ✅ Normalize: add https:// if scheme missing
  let normalizedUrl = raw;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  setIsConverting(true);
  setError('');
  setPdfUrl(null);

  try {
    const response = await axios.post(
      'http://localhost:5000/api/url-to-pdf',
      { url: normalizedUrl },
      { responseType: 'blob', headers: { 'Content-Type': 'application/json' } }
    );

    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `converted-${Date.now()}.pdf`
      : `converted-${Date.now()}.pdf`;

    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    setPdfUrl(blobUrl);
    setConvertedFileName(filename);
    navigate('/html-to-pdf/download');
  } catch (err) {
    // ✅ If server sent JSON but we asked for blob, decode the blob
    let msg = 'Conversion failed. Please try again.';
    try {
      if (err?.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          msg = json?.error || json?.details || msg;
        } catch {
          msg = text || msg;
        }
      } else {
        msg = err?.response?.data?.error || err?.message || msg;
      }
    } catch {}
    setError(msg);
    console.error('Conversion error:', err);
  } finally {
    setIsConverting(false);
  }
};


    const handleDownloadClick = () => {
      if (!pdfUrl) return;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = convertedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    };

    const handleNewConversion = () => {
      setUrl('');
      setPdfUrl(null);
      navigate('/html-to-pdf');
    };

    useEffect(() => {
      return () => {
        if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
      };
    }, [pdfUrl]);

    // Download Screen
    if (isDownloadScreen) {
      return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
          {/* Header */}
          <header className="bg-white py-4 shadow-sm flex-shrink-0">
            <div className="container mx-auto px-4">
              <h1 className="text-xl font-bold text-green-600">PDF Tools</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
              <h1 className="text-3xl font-bold text-green-600 mb-6">Conversion Successful!</h1>
              <p className="text-gray-700 mb-8">Your PDF file is ready to download.</p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleDownloadClick}
                  className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF File
                </button>
                
                <button
                  onClick={handleNewConversion}
                  className="bg-white text-green-500 border border-green-500 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Convert New URL
                </button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white py-4 border-t border-gray-200 flex-shrink-0">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} PDF Tools. All rights reserved.
            </div>
          </footer>
        </div>
      );
    }

    // Conversion Screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        {isConverting ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-10 text-black">
              Please Wait the Process is in Progress
            </h1>
            <p className="text-xl font-semibold text-gray-800 mb-8">
              Converting URL to PDF...
            </p>
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-[6px] border-green-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl w-full bg-green-300 text-center rounded-3xl border border-white shadow-xl p-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              URL to PDF
            </h2>

            <p className="text-gray-700 mb-6">Convert any webpage URL to a PDF document.</p>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
              <label htmlFor="urlInput" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Webpage URL:
              </label>
              <textarea
                id="urlInput"
                className="w-full p-3 border border-gray-300 rounded-md min-h-[50px] focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  fontFamily: "'Courier New', monospace",
                  backgroundColor: '#f8fafc'
                }}
              />
            </div>

            <div className="flex justify-center gap-4 mt-6">
              {/* <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-500 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6l9 4v12l-9-4V6zm9-4l9 4v12l-9-4V2z" />
                </svg>
                Dropbox
              </button> */}
{/* 
              <button className="bg-green-500 text-white border border-green-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition hover:bg-white hover:text-green-500 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 6l5 3v12l-5-3V6zm5-4l6 3v12l-6-3V2z" />
                </svg>
                Google Drive
              </button> */}
            </div>

            <div className="mt-6">
              <button
                onClick={handleConvertClick}
                disabled={!url.trim() || isConverting}
                className="bg-white text-green-500 border border-green-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto transition hover:bg-green-500 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {isConverting ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default HtmlToPdf;