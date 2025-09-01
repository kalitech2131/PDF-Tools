import React, { useState } from 'react';

const RotatePdf = () => {
  const [file, setFile] = useState(null);
  const [showRotationPage, setShowRotationPage] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRotateClick = () => {
    if (file) {
      setShowRotationPage(true);
    } else {
      alert('Please upload a PDF file first');
    }
  };

  const rotateLeft = () => {
    setRotationAngle((prev) => {
      const newAngle = prev - 90;
      return newAngle < 0 ? 270 : newAngle;
    });
  };

  const rotateRight = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('angle', rotationAngle.toString());

      const response = await fetch('http://localhost:5000/api/rotate-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rotate PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated-${file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to download rotated PDF');
    } finally {
      setIsLoading(false);
    }
  };

  if (showRotationPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-red-300 text-center rounded-3xl border border-white shadow-xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <i className="fa-solid fa-rotate text-red-600"></i>
            Rotate PDF
          </h2>

          <div className="border-2 border-gray-400 p-8 rounded-md bg-white mb-6">
            <div className="flex flex-col items-center justify-center">
              <p className="font-medium text-gray-700 mb-4">Current Rotation: {rotationAngle}°</p>
              <div className="flex justify-center gap-8 mb-6">
                <button 
                  onClick={rotateLeft}
                  className="bg-blue-500 text-white rounded-full shadow-lg px-6 py-3 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-blue-600 hover:scale-105"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  Rotate Left (-90°)
                </button>
                <button 
                  onClick={rotateRight}
                  className="bg-blue-500 text-white rounded-full shadow-lg px-6 py-3 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-blue-600 hover:scale-105"
                >
                  <i className="fa-solid fa-rotate-right"></i>
                  Rotate Right (+90°)
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-blue-500 text-white rounded-full shadow-lg px-8 py-3 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-blue-600 hover:scale-105 mx-auto disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fa-solid fa-download"></i>
                Download Rotated PDF
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-red-300 text-center rounded-3xl border border-white shadow-xl p-10">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <i className="fa-solid fa-rotate text-red-600"></i>
          Rotate PDF
        </h2>

        <p className="text-gray-700 mb-6">Easily rotate your PDF pages to the desired angle.</p>

        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
          <input 
            type="file" 
            name="file" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            onChange={handleFileChange}
            accept=".pdf"
          />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <i className="fa-solid fa-rotate text-3xl text-red-400"></i>
            <p className="font-medium text-gray-700">
              {file ? file.name : 'Click or Drop PDF Here'}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
            {/* <button className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-red-500 hover:scale-105">
              <i className="fa-brands fa-dropbox text-inherit"></i>
              Dropbox
            </button> */}

          {/* <button className="bg-red-500 text-white border border-red-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-red-500 hover:scale-105">
            <i className="fa-brands fa-google-drive text-inherit"></i>
            Google Drive
          </button> */}
        </div>

        <button 
          onClick={handleRotateClick}
          disabled={!file}
          className="mt-6 bg-red-500 text-white rounded-full shadow-lg px-8 py-3 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-red-600 hover:scale-105 mx-auto disabled:opacity-50"
        >
          <i className="fa-solid fa-rotate"></i>
          Rotate PDF
        </button>
      </div>
    </div>
  );
};

export default RotatePdf;