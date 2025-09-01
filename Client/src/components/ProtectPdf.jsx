// ProtectPdf.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PasswordModal = ({
  show,
  onClose,
  onSubmit,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  passwordError,
  setPasswordError,        // <-- pass this
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Enter Password</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="text-gray-700 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Enter password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Confirm password"
              required
              autoComplete="new-password"
            />
            {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
              Protect PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProtectPdf = () => {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloadScreen, setIsDownloadScreen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [protectedFileName, setProtectedFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleProtectClick = () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    setIsConverting(true);

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    formData.append('password', password);

    try {
      // ✅ Use the PROTECT endpoint (not unlock)
      const response = await axios.post(
        'http://localhost:5000/api/secure-pdf',
        formData,
        {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const fileName = selectedFile.name.replace(/\.pdf$/i, '') + '_protected.pdf';

      setDownloadUrl(url);
      setProtectedFileName(fileName);
      setIsDownloadScreen(true);
    } catch (error) {
      // ✅ Proper blob error parsing
      let msg = 'Failed to protect PDF.';
      try {
        if (error.response?.data) {
          const txt = await new Response(error.response.data).text();
          msg = txt || msg;
        }
      } catch (_) {}
      alert(msg);
    } finally {
      setIsConverting(false);
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = protectedFileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  };

  const handleNewConversion = () => {
    setSelectedFile(null);
    setIsConverting(false);
    setIsDownloadScreen(false);
    setDownloadUrl('');
    setProtectedFileName('');
  };

  if (isDownloadScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full">
          <div className="mb-6 text-cyan-500">
            <i className="fa-solid fa-circle-check text-5xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">PDF Protected Successfully!</h2>
          <p className="text-gray-700 mb-6">Your PDF is now password protected and ready to download.</p>
          <button onClick={handleDownload} className="mt-4 bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-cyan-600 mb-4">
            <i className="bi bi-download mr-2"></i> Download Protected PDF
          </button>
          <button onClick={handleNewConversion} className="mt-2 bg-white text-cyan-500 border border-cyan-500 px-6 py-2 rounded-full font-semibold hover:bg-cyan-50">
            <i className="bi bi-shield-plus mr-2"></i> Protect Another PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <PasswordModal
        show={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setConfirmPassword('');
          setPasswordError('');
        }}
        onSubmit={handlePasswordSubmit}
        password={password}
        confirmPassword={confirmPassword}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        passwordError={passwordError}
        setPasswordError={setPasswordError}  // <-- pass it
      />

      {isConverting ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-10 text-black">Please Wait the Process is in Progress</h1>
          <p className="text-xl font-semibold text-gray-800 mb-8">Protecting PDF...</p>
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full font-bold font-size-300 bg-cyan-300 text-center rounded-3xl border border-white shadow-xl p-10">
          {/* ... your existing uploader UI unchanged ... */}
          <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
            <input type="file" name="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="flex flex-col items-center justify-center space-y-2 z-0">
              <i className="bi bi-shield-exclamation text-cyan-400 text-3xl"></i>
              <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-cyan-100 rounded-md">
              <p className="text-gray-700 font-medium flex items-center justify-center gap-2">
                <i className="bi bi-file-earmark-pdf text-cyan-500"></i>{selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {/* <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 hover:bg-white hover:text-cyan-500 transition">
              <i className="fa-brands fa-dropbox text-inherit"></i> Dropbox
            </button>
            <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 hover:bg-white hover:text-cyan-500 transition">
              <i className="fa-brands fa-google-drive text-inherit"></i> Google Drive
            </button> */}
          </div>

          <div className="mt-6">
            <button
              onClick={handleProtectClick}
              className="bg-white text-cyan-500 border border-cyan-500 rounded-full shadow-lg px-6 py-2 font-medium flex items-center justify-center gap-2 mx-auto hover:bg-cyan-600 hover:text-white"
              disabled={!selectedFile}
            >
              <i className="bi bi-shield-lock"></i> Protect PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectPdf;
