// // controllers/htmlToPdfController.js
// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// puppeteer.use(StealthPlugin());

// function normalizeUrl(input) {
//   let u = String(input || "").trim();
//   if (!u) return null;
//   if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
//   try {
//     const parsed = new URL(u);
//     if (!["http:", "https:"].includes(parsed.protocol)) return null;
//     return parsed.toString();
//   } catch {
//     return null;
//   }
// }

// // ✅ works with old/new puppeteer (no waitForTimeout required)
// const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// exports.htmlToPdf = async (req, res) => {
//   let browser;
//   try {
//     let { url } = req.body || {};
//     url = normalizeUrl(url);
//     if (!url) {
//       return res.status(400).json({ error: "Invalid or missing URL. Use http(s)://..." });
//     }

//     const execPath =
//       process.env.PUPPETEER_EXECUTABLE_PATH ||
//       (typeof puppeteer.executablePath === "function" ? puppeteer.executablePath() : undefined);

//     const isWin = process.platform === "win32";
//     console.log("Launching Chromium:", execPath || "(puppeteer default)");

//     browser = await puppeteer.launch({
//       headless: true,
//       executablePath: execPath,
//       ignoreHTTPSErrors: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--window-size=1280,800",
//         ...(isWin ? [] : ["--single-process", "--no-zygote"]),
//       ],
//     });

//     const page = await browser.newPage();
//     // optional: increase default nav timeout
//     if (typeof page.setDefaultNavigationTimeout === "function") {
//       page.setDefaultNavigationTimeout(180000);
//     }
//     await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
//     );
//     await page.setViewport({ width: 1280, height: 800 });
//     if (typeof page.emulateMediaType === "function") {
//       await page.emulateMediaType("screen");
//     }

//     console.log("Navigating to:", url);
//     try {
//       await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
//     } catch {
//       // Fallback for sites that never become 'idle'
//       await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
//       await delay(5000); // ⬅️ replace page.waitForTimeout
//     }

//     // Make sure body exists
//     if (typeof page.waitForSelector === "function") {
//       await page.waitForSelector("body", { timeout: 30000 }).catch(() => {});
//       // Spotify ke liye extra (optional):
//       await page.waitForSelector("main", { timeout: 20000 }).catch(() => {});
//     } else {
//       await delay(2000);
//     }

//     // Lazy-load scroll
//     await page.evaluate(async () => {
//       await new Promise((resolve) => {
//         let total = 0, step = 200;
//         const t = setInterval(() => {
//           const sh = document.body.scrollHeight;
//           window.scrollBy(0, step);
//           total += step;
//           if (total >= sh) { clearInterval(t); resolve(); }
//         }, 100);
//       });
//     });

//     await delay(1500); // ⬅️ replace page.waitForTimeout

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
//       preferCSSPageSize: false,
//     });

//     const persist = String(req.query.persist || '').toLowerCase() === 'true';

//     if (persist) {
//   const outName = `webpdf_${Date.now()}.pdf`;
//   const outPath = path.join(__dirname, '..', 'converted', outName);
//   fs.writeFileSync(outPath, pdfBuffer); // save on server

//   return res.json({
//     ok: true,
//     fileName: outName,
//     // public URL served by server.js
//     fileUrl: `/converted/${outName}`,
//   });
// }

// // default: stream to client (no server file)
// res.setHeader('Content-Type', 'application/pdf');
// res.setHeader('Content-Disposition', `attachment; filename="converted_${Date.now()}.pdf"`);
// return res.send(pdfBuffer);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="converted_${Date.now()}.pdf"`);
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     const msg = String(error?.message || "");
//     if (/Could not find expected browser|executable doesn’t exist|Failed to launch the browser process|ENOENT/i.test(msg)) {
//       return res.status(500).json({ error: "Chromium/Chrome not available for Puppeteer.", details: msg });
//     }
//     if (/Navigation timeout|net::ERR_NAME_NOT_RESOLVED|ERR_CERT|Invalid URL/i.test(msg)) {
//       return res.status(400).json({ error: "Failed to open the URL.", details: msg });
//     }
//     return res.status(500).json({ error: "Failed to generate PDF.", details: msg });
//   } finally {
//     if (browser) { try { await browser.close(); } catch (e) { console.error("Browser close error:", e); } }
//   }
// };










// controllers/htmlToPdfController.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

function normalizeUrl(input) {
  let u = String(input || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ---- helpers to resolve executable safely ----
function isPopplerPath(p) {
  if (!p) return false;
  const base = path.basename(p).toLowerCase();
  return base === "pdftoppm.exe" || base === "pdftocairo.exe";
}

function pickBrowserPath() {
  // Prefer explicit CHROME_PATH (your actual Chrome/Chromium)
  let execPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || "";

  // Prevent common mistake: pointing to Poppler instead of Chrome
  if (isPopplerPath(execPath)) {
    throw new Error(
      `PUPPETEER_EXECUTABLE_PATH/CHROME_PATH points to Poppler (${execPath}). ` +
      `Set it to Chrome/Chromium (e.g., C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe).`
    );
  }

  // If not provided, try puppeteer bundled chromium (works if 'puppeteer' pkg is installed)
  if (!execPath && typeof puppeteer.executablePath === "function") {
    execPath = puppeteer.executablePath();
  }
  return execPath || undefined;
}

exports.htmlToPdf = async (req, res) => {
  let browser;
  try {
    let { url } = req.body || {};
    url = normalizeUrl(url);
    if (!url) {
      return res.status(400).json({ error: "Invalid or missing URL. Use http(s)://..." });
    }

    const execPath = pickBrowserPath();
    const isWin = process.platform === "win32";
    console.log("Launching Chromium/Chrome:", execPath || "(puppeteer bundled)");

    browser = await puppeteer.launch({
      headless: true,
      executablePath: execPath, // undefined => bundled chromium (if available)
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1280,800",
        // Windows doesn't need single-process/no-zygote; keep Linux-only
        ...(isWin ? [] : ["--single-process", "--no-zygote"]),
      ],
    });

    const page = await browser.newPage();
    if (typeof page.setDefaultNavigationTimeout === "function") {
      page.setDefaultNavigationTimeout(180000);
    }
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });
    if (typeof page.emulateMediaType === "function") {
      await page.emulateMediaType("screen");
    }

    console.log("Navigating to:", url);
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
      await delay(5000);
    }

    if (typeof page.waitForSelector === "function") {
      await page.waitForSelector("body", { timeout: 30000 }).catch(() => {});
      await page.waitForSelector("main", { timeout: 20000 }).catch(() => {});
    } else {
      await delay(2000);
    }

    // Lazy-load scroll to trigger images
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let total = 0, step = 200;
        const t = setInterval(() => {
          const sh = document.body.scrollHeight;
          window.scrollBy(0, step);
          total += step;
          if (total >= sh) { clearInterval(t); resolve(); }
        }, 100);
      });
    });

    await delay(1500);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      preferCSSPageSize: false,
    });

    const persist = String(req.query.persist || "").toLowerCase() === "true";
    if (persist) {
      const outName = `webpdf_${Date.now()}.pdf`;
      const outDir = path.join(__dirname, "..", "converted");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, pdfBuffer);

      return res.json({
        ok: true,
        fileName: outName,
        fileUrl: `/converted/${outName}`, // make sure server.js serves this folder statically
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="converted_${Date.now()}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating PDF:", error);
    const msg = String(error?.message || "");

    if (/Poppler/.test(msg) || /pdftoppm/i.test(msg)) {
      return res.status(500).json({
        error: "Wrong executable path",
        details: "Your PUPPETEER_EXECUTABLE_PATH/CHROME_PATH points to Poppler (pdftoppm.exe). Set it to Chrome/Chromium.",
      });
    }
    if (/Could not find expected browser|executable doesn’t exist|Failed to launch the browser process|ENOENT/i.test(msg)) {
      return res.status(500).json({ error: "Chromium/Chrome not available for Puppeteer.", details: msg });
    }
    if (/Navigation timeout|net::ERR_NAME_NOT_RESOLVED|ERR_CERT|Invalid URL/i.test(msg)) {
      return res.status(400).json({ error: "Failed to open the URL.", details: msg });
    }
    return res.status(500).json({ error: "Failed to generate PDF.", details: msg });
  } finally {
    if (browser) { try { await browser.close(); } catch (e) { console.error("Browser close error:", e); } }
  }
};
