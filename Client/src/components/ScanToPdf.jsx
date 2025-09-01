import React from 'react'

const ScanToPdf = () => {
  return (
<div className="min-h-screen flex items-center justify-center p-6 ">
      {/* Container With Glass Effect */}
      <div className="max-w-xl w-full bg-blue-300 text-center rounded-3xl border border-white shadow-xl p-10">
        {/* Heading With PDF */}
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <i className="bi bi-upc-scan text-blue-600"></i>
          Scan to PDF
        </h2>

        {/* Subtitle Paragraph */}
        <p className="text-gray-700 mb-6">Easily separate your PDF pages into individual files.</p>

        {/* File input area */}
        <div className="border-2 border-dashed border-gray-400 p-8 rounded-md bg-white hover:border-blue-800 transition cursor-pointer relative">
          <input type="file" name="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center justify-center space-y-2 z-0">
            <i className="bi bi-upc-scan text-3xl text-blue-400"></i>
            <p className="font-medium text-gray-700">Click or Drop PDF Here</p>
          </div>
        </div>

        {/* Buttons for Google Drive and Dropbox */}
        <div className="flex justify-center gap-4 mt-6">
          {/* Dropbox Button */}
          <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-cyan-500 hover:scale-105">
            <i className="fa-brands fa-dropbox text-inherit"></i>
            Dropbox
          </button>

          {/* Google Drive Button */}
          <button className="bg-cyan-500 text-white border border-cyan-500 rounded-full shadow-lg px-5 py-2 font-medium flex items-center gap-2 transition duration-300 ease-in-out hover:bg-white hover:text-cyan-500 hover:scale-105">
            <i className="fa-brands fa-google-drive text-inherit"></i>
            Google Drive
          </button>
        </div>
      </div>
    </div>  )
}

export default ScanToPdf