// components/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="text-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">PDF Tools</h1>
        <p className="text-gray-600 text-lg mb-8">Simple tools to work with your PDF files</p>

        {/* Upload Box */}
        <div className="max-w-xl mx-auto border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white shadow-sm hover:border-blue-500 hover:shadow-md transition">
          <div className="flex flex-col items-center space-y-2">
            <i className="fa-solid fa-cloud-arrow-down text-4xl text-gray-400" style={{ color: '#93969a' }}></i>
            <h2 className="text-lg font-semibold">Choose PDF files</h2>
            <p className="text-sm text-gray-500">or drag and drop here</p>
            <label htmlFor="fileUpload" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 cursor-pointer">
              Select Files
            </label>
            <input type="file" name="file" id="fileUpload" className="hidden" />
            <p className="text-xs text-gray-400 mt-2">Free and secure processing</p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="bg-white py-12 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 px-6">

          {/* PDF to Word */}
          <Link to="/pdf-to-word">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-blue-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-blue-100">
                <i className="fa-solid fa-file-lines text-2xl text-blue-500"></i>
              </div>
              <p className="font-semibold">PDF to Word</p>
              <p className="text-sm text-gray-500">Convert to editable Word document</p>
            </div>
          </Link>

          {/* PDF to Image */}
          <Link to="/pdf-to-image">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-green-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100">
                <i className="fa-solid fa-file-image text-2xl text-green-400"></i>
              </div>
              <p className="font-semibold">PDF to PNG</p>
              <p className="text-sm text-gray-500">Convert to editable Word documnet</p> {/* Typo "documnet" maintained from original HTML */}
            </div>
          </Link>

          {/* Merge PDF */}
          <Link to="/merge-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-purple-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-100">
                <i className="bi bi-archive text-purple-400 text-2xl"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Merge PDF</p>
              <p className="text-sm text-gray-500">Combine multiple PDF files</p>
            </div>
          </Link>

          {/* Split PDF */}
          <Link to="/split-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-orange-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-orange-100">
                <i className="fa-solid fa-scissors text-orange-400 text-2xl"></i>
              </div>
              <p className="font-semibold">Split PDF</p>
              <p className="text-sm text-gray-500">Extract or separate pages</p>
            </div>
          </Link>

          {/* Compress PDF */}
          <Link to="/compress-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-red-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-red-100">
                <i className="bi bi-archive text-red-400 text-2xl"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Compress PDF</p>
              <p className="text-sm text-gray-500">Reduce file size</p>
            </div>
          </Link>

          {/* PDF to Excel */}
          <Link to="/pdf-to-excel">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-green-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100">
                <i className="fa-solid fa-file-lines text-red-400 text-2xl" style={{ color: '#204601' }}></i>
              </div>
              <p className="font-semibold">PDF to Excel</p>
              <p className="text-sm text-gray-500">Convert to spreadsheet</p>
            </div>
          </Link>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 px-6 py-10">

          {/* Word to PDF */}
          <Link to="/word-to-pdf">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-blue-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-blue-100">
                <i className="fa-solid fa-file-word text-blue-500 text-2xl"></i>
              </div>
              <p className="font-semibold">Word to PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word document</p>
            </div>
          </Link>

          {/* PDF to PowerPoint */}
          <Link to="/pdf-to-powerpoint">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-red-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-red-100">
                <i className="fa-solid fa-file-powerpoint text-2xl text-red-400"></i>
              </div>
              <p className="font-semibold">PDF to PowerPoint</p>
              <p className="text-sm text-gray-500">Convert to editable Word documnet</p> {/* Typo "documnet" maintained from original HTML */}
            </div>
          </Link>

          {/* PDF to JPG */}
          <Link to="/pdf-to-jpg">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-yellow-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-yellow-200">
                <i className="fa-solid fa-file-image text-yellow-600 text-2xl"></i>
              </div>
              <p className="font-semibold">PDF to JPG</p>
              <p className="text-sm text-gray-500">Convert to editable Word document</p>
            </div>
          </Link>
          {/* PowerPoint to PDF */}
          <Link to="/powerpoint-to-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-red-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-red-100">
                <i className="fa-solid fa-file-powerpoint text-2xl text-red-400"></i>
              </div>
              <p className="font-semibold">PowerPoint to PDF</p>
              <p className="text-sm text-gray-500">Extract or separate pages.Can't support large file</p>
            </div>
          </Link>

          {/* Excel to PDF */}
          <Link to="/excel-to-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-green-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100">
                <i className="fa-solid fa-file-excel text-green-400 text-2xl"></i>
              </div>
              <p className="font-semibold">Excel to PDF</p>
              <p className="text-sm text-gray-500">Reduce file size</p>
            </div>
          </Link>

          {/* Edit PDF */}
          <Link to="/edit-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-purple-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-200">
                <i className="fa-solid fa-pen-to-square text-purple-600 text-2xl"></i>
              </div>
              <p className="font-semibold">Edit PDF</p>
              <p className="text-sm text-gray-500">Convert to spreadsheet</p>
            </div>
          </Link>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 px-6 py-10">

          {/* Sign PDF */}
          <Link to="/sign-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-blue-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-blue-200">
                <i className="fa-solid fa-pen-nib text-blue-600 text-2xl"></i>
              </div>
              <p className="font-semibold">Sign PDF</p>
              <p className="text-sm text-gray-500">Combine multiple PDF files</p>
            </div>
          </Link>

          {/* JPG to PDF */}
          <Link to="/jpg-to-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-yellow-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-yellow-200">
                <i className="bi bi-filetype-jpg text-yellow-600 text-2xl"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">JPG to PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word documnet</p> {/* Typo "documnet" maintained from original HTML */}
            </div>
          </Link>

          {/* Watermark */}
          <Link to="/watermark">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-purple-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-200">
                <i className="fa-solid fa-stamp text-2xl text-purple-500"></i>
              </div>
              <p className="font-semibold">Watermark</p>
              <p className="text-sm text-gray-500">Extract or separate pages</p>
            </div>
          </Link>

          {/* Rotate PDF */}
          <Link to="/rotate-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-red-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-red-200">
                <i className="fa-solid fa-rotate text-2xl text-red-500"></i>
              </div>
              <p className="font-semibold">Rotate PDF</p>
              <p className="text-sm text-gray-500">Reduce file size</p>
            </div>
          </Link>

          {/* HTML to PDF */}
          <Link to="/html-to-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-cyan-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-cyan-200">
                <i className="bi bi-filetype-html text-2xl text-cyan-500"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">HTML to PDF</p>
              <p className="text-sm text-gray-500">Convert to spreadsheet</p>
            </div>
          </Link>

          {/* Unlock PDF */}
          <Link to="/unlock-pdf">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-lime-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-lime-200">
                <i className="fa-solid fa-unlock-keyhole text-2xl text-lime-600"></i>
              </div>
              <p className="font-semibold">Unlock PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word document</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 px-6 py-10">

          {/* Protect PDF */}
          <Link to="/protect-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-teal-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-teal-200">
                <i className="bi bi-shield-exclamation text-teal-500 text-2xl"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Protect PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word documnet</p> {/* Typo "documnet" maintained from original HTML */}
            </div>
          </Link>

          {/* Organize PDF */}
          <Link to="/organize-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-orange-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-orange-200">
                <i className="bi bi-sort-alpha-up text-2xl text-orange-500"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Organize PDF</p>
              <p className="text-sm text-gray-500">Combine multiple PDF files</p>
            </div>
          </Link>

          {/* PDF to PDF/A */}
          <Link to="/pdf-to-pdf-a">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-pink-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-pink-200">
                <i className="fa-solid fa-a text-2xl text-pink-600"></i>
              </div>
              <p className="font-semibold">PDF to PDF/A</p>
              <p className="text-sm text-gray-500">Extract or separate pages</p>
            </div>
          </Link>

          {/* Repair PDF */}
          <Link to="/repair-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-teal-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-teal-100">
                <i className="fa-solid fa-screwdriver-wrench text-2xl text-teal-400"></i>
              </div>
              <p className="font-semibold">Repair PDF</p>
              <p className="text-sm text-gray-500">Reduce file size</p>
            </div>
          </Link>

          {/* Page numbers */}
          <Link to="/page-numbers">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-green-50 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100">
                <i className="bi bi-123 text-2xl text-green-400"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Page numbers</p>
              <p className="text-sm text-gray-500">Convert to spreadsheet</p>
            </div>
          </Link>

          {/* Scan to PDF */}
          <Link to="/scan-to-pdf">
            <div className="text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-blue-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-blue-200">
                <i className="bi bi-upc-scan text-2xl text-blue-500"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Scan to PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word document</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 px-6 py-10">

          {/* OCR PDF */}
          <Link to="/ocr-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-green-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-200">
                <i className="fa-solid fa-file-image text-2xl text-green-500"></i>
              </div>
              <p className="font-semibold">OCR PDF</p>
              <p className="text-sm text-gray-500">Convert to editable Word documnet</p> {/* Typo "documnet" maintained from original HTML */}
            </div>
          </Link>

          {/* Compare PDF */}
          <Link to="/compare-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-purple-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-200">
                <i className="fa-solid fa-code-compare text-2xl text-purple-500"></i>
              </div>
              <p className="font-semibold">Compare PDF</p>
              <p className="text-sm text-gray-500"> Please use the original PDF, not one modified by another tool</p>
            </div>
          </Link>

          {/* Redact PDF */}
          <Link to="/redact-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-orange-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-orange-200">
                <i className="bi bi-file-earmark-x text-2xl text-orange-500"></i> {/* Bootstrap Icon */}
              </div>
              <p className="font-semibold">Redact PDF</p>
              <p className="text-sm text-gray-500">Extract or separate pages </p>
            </div>
          </Link>

          {/* Crop PDF */}
          <Link to="/crop-pdf">
            <div className="tool text-center p-4 border rounded-lg shadow transition min-h-[200px] hover:bg-red-100 hover:scale-105 hover:shadow-lg">
              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-red-200">
                <i className="fa-solid fa-crop-simple text-2xl text-red-500"></i>
              </div>
              <p className="font-semibold">Crop PDF</p>
              <p className="text-sm text-gray-500">The portion that has been crop in these tools will be download</p>
            </div>
          </Link>
        </div>
        {/* Centered Footer Text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-lg">Upload PDF files to start using the tools</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mt-10 py-10">
        <h2 className="text-center text-2xl font-bold mb-8">How it works</h2>
        <div className="flex flex-col sm:flex-row justify-around text-center space-y-6 sm:space-y-0 px-4">
          <div>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full bg-blue-100">
              <i className="fa-solid fa-arrow-up-from-bracket text-blue-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-lg">1. Upload</h3>
            <p className="text-gray-500">Select your PDF files</p>
          </div>
          <div>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100">
              <i className="fa-solid fa-arrow-right text-green-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-lg">2. Choose Tool</h3>
            <p className="text-gray-500">Pick what you want to do</p>
          </div>
          <div>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-100">
              <i className="fa-solid fa-arrow-down text-purple-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-lg">3. Download</h3>
            <p className="text-gray-500">Get your processed file</p>
          </div>
        </div>
      </section>
      <hr />
    </>
  );
};

export default Home;