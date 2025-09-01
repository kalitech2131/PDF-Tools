import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import PdfToWord from "./components/PdfToWord";
import "../src/App.css";
import WordToPdf from "./components/WordToPdf";
import PdfToImage from "./components/PdfToImage";
import MergePdf from "./components/MergePdf";
import SplitPdf from "./components/SplitPdf";
import CompressPdf from "./components/CompreesPdf";
import PdfToExcel from "./components/PdfToExcel";
import PdfToPowerPoint from "./components/PdfToPowerPoint";
import PdfToJpg from "./components/PdfToJpg";
import SignPdf from "./components/SignPdf";
import JpgToPdf from "./components/JpgToPdf";
import HtmlToPdf from "./components/HtmlToPdf";
import PowerPointToPdf from "./components/PowerPointToPdf";
import WaterMark from "./components/WaterMark";
import RotatePdf from "./components/RotatePdf";
import ProtectPdf from "./components/ProtectPdf";
import Unloack from "./components/Unloack";
import OcrPdf from "./components/OcrPdf";
import RepairPdf from "./components/RepairPdf";
import ExcelToPdf from "./components/ExcelToPdf";
import EditPdf from "./components/EditPdf";
import Compare from "./components/Compare";
import OrganizePdf from "./components/OrganizePdf";
import PdfToPdfA from "./components/PdfToPdfA";
import PdfCrop from "./components/PdfCrop";
import PageNumbers from "./components/PageNumbers";
import RedactPdf from "./components/ReadactPdf";
import ScanToPdf from "./components/ScanToPdf";

function App() {
  return (
    <Router>
      <div className="bg-gray-50 text-gray-800 font-sans min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pdf-to-word" element={<PdfToWord />} />
          <Route
            path="/pdf-to-word/download"
            element={<PdfToWord isDownloadScreen />}
          />

          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route
            path="/word-to-pdf/download"
            element={<WordToPdf isDownloadScreen />}
          />

          <Route path="/pdf-to-image" element={<PdfToImage />} />
          <Route
            path="/pdf-to-image/download"
            element={<PdfToImage isDownloadScreen />}
          />

          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route
            path="/merge-pdf/download"
            element={<MergePdf isDownloadScreen />}
          />

          <Route path="/split-pdf" element={<SplitPdf />} />
          <Route
            path="/split-pdf/download"
            element={<SplitPdf isDownloadScreen />}
          />

          <Route path="/compress-pdf" element={<CompressPdf />} />
          <Route
            path="/compress-pdf/download"
            element={<CompressPdf isDownloadScreen />}
          />

          <Route path="/pdf-to-excel" element={<PdfToExcel />} />
          <Route
            path="/pdf-to-excel/download"
            element={<PdfToExcel isDownloadScreen />}
          />

          <Route path="/pdf-to-excel" element={<PdfToExcel />} />
          <Route
            path="/pdf-to-excel/download"
            element={<PdfToExcel isDownloadScreen />}
          />

          <Route path="/pdf-to-powerpoint" element={<PdfToPowerPoint />} />
          <Route
            path="/pdf-to-powerpoint/download"
            element={<PdfToPowerPoint isDownloadScreen />}
          />

          <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
          <Route
            path="/pdf-to-jpg/download"
            element={<PdfToJpg isDownloadScreen />}
          />

          <Route path="/powerpoint-to-pdf" element={<PowerPointToPdf />} />
          <Route
            path="/powerpoint-to-pdf/download"
            element={<PowerPointToPdf isDownloadScreen />}
          />

          <Route path="/sign-pdf" element={<SignPdf />} />
          <Route
            path="/sign-pdf/download"
            element={<SignPdf isDownloadScreen />}
          />

          <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
          <Route
            path="/excel-to-pdf/download"
            element={<ExcelToPdf isDownloadScreen />}
          />

          <Route path="/edit-pdf" element={<EditPdf />} />
          <Route
            path="/edit-pdf/download"
            element={<EditPdf isDownloadScreen />}
          />

          <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
          <Route
            path="/jpg-to-pdf/download"
            element={<JpgToPdf isDownloadScreen />}
          />

          <Route path="/watermark" element={<WaterMark />} />
          <Route
            path="/watermark/download"
            element={<WaterMark isDownloadScreen />}
          />

          <Route path="/rotate-pdf" element={<RotatePdf />} />
          <Route
            path="/rotate-pdf/download"
            element={<RotatePdf isDownloadScreen />}
          />

          <Route path="/html-to-pdf" element={<HtmlToPdf />} />
          <Route
            path="/html-to-pdf/download"
            element={<HtmlToPdf isDownloadScreen />}
          />

          <Route path="/protect-pdf" element={<ProtectPdf />} />
          <Route
            path="/protect-pdf/download"
            element={<ProtectPdf isDownloadScreen />}
          />

          <Route path="/unlock-pdf" element={<Unloack />} />
          <Route
            path="/unlock-pdf/download"
            element={<Unloack isDownloadScreen />}
          />

          <Route path="/repair-pdf" element={<RepairPdf />} />
          <Route
            path="/repair-pdf/download"
            element={<RepairPdf isDownloadScreen />}
          />

          {/* <Route path="/scan-to-pdf" element={<ScanToPdf />} />
          <Route
            path="/scan-to-pdf/download"
            element={<ScanToPdf isDownloadScreen />}
          /> */}

          <Route path="/ocr-pdf" element={<OcrPdf />} />
          <Route
            path="/ocr-pdf/download"
            element={<OcrPdf isDownloadScreen />}
          />

          <Route path="/compare-pdf" element={<Compare />} />
          <Route
            path="/compare-pdf/download"
            element={<Compare isDownloadScreen />}
          />

          <Route path="/organize-pdf" element={<OrganizePdf />} />
          <Route
            path="/organize-pdf/download"
            element={<OrganizePdf isDownloadScreen />}
          />

          <Route path="/pdf-to-pdf-a" element={<PdfToPdfA />} />
          <Route
            path="/pdf-to-pdf-a/download"
            element={<PdfToPdfA isDownloadScreen />}
          />

          <Route path="/crop-pdf" element={<PdfCrop />} />
          <Route path="/crop-pdf/download" element={<PdfCrop />} />

          <Route path="/page-numbers" element={<PageNumbers />} />
          <Route
            path="/page-numbers/download"
            element={<PageNumbers isDownloadScreen />}
          />

          <Route path="/redact-pdf" element={<RedactPdf />} />
          <Route
            path="/redact-download"
            element={<RedactPdf isDownloadScreen />}
          />
          <Route path="*" element={<RedactPdf />} />


 <Route path="/scan-to-pdf" element={<ScanToPdf/>   } />
          <Route
            path="/scan-to-pdf/download"
            element={<ScanToPdf isDownloadScreen />}
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="flex justify-between items-center py-4 px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <i
            className="fa-solid fa-file-lines text-2xl"
            style={{ color: "#f20d52" }}
          ></i>
          <Link to="/" className="text-xl font-bold text-gray-800">
            PDF Tools
          </Link>
        </div>
        <div>
          <span className="text-sm text-gray-500">
            Free • No registration required
          </span>
        </div>
      </nav>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="text-center text-gray-400 text-sm mt-10 mb-4">
      <p>
        All files are processed securely and deleted automatically after 1 hour
      </p>
      <p>&copy; 2024 PDF Tools</p>
    </footer>
  );
};

export default App;
