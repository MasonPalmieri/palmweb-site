/* ============================================================================
   FSS Demo App — app.js (Static / GitHub Pages, no backend)
   - Uses localStorage to simulate auth + document state.
   - Supports:
       • Template PDFs from /pdfs/<template>.pdf
       • Uploaded / Scratch PDFs stored as base64 in doc.customPdfBase64
       • Drag & Drop field placement (pixel coords on rendered preview)
       • Signed PDF generation using pdf-lib (embeds signature + date text)
   - Pages call:
       FSS.guard(), FSS.login(), FSS.logout()
       FSS.loadDocState(), FSS.saveDocState(), FSS.resetDoc()
       FSS.loadFields(), FSS.saveFields()
       FSS.setFieldValue(), FSS.getFieldValue()
       FSS.generateSignedPDF(), FSS.hasSignedPDF(), FSS.getSignedBase64()
============================================================================ */

(function () {
  const CONFIG = {
    DEMO_EMAIL: "demo@client.com",
    DEMO_PASSWORD: "hallam", // can change
    BASE_PATH: "", // keep "" for same folder. If you host in subfolder, set e.g. "/demosites/fillsignsend"
  };

  const STORE_KEYS = {
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64",
  };

  // -------------------------
  // Safe JSON Helpers
  // -------------------------
  function safeJSONParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  function getKey(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function setKey(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKey(key) {
    localStorage.removeItem(key);
  }

  // -------------------------
  // Auth
  // -------------------------
  function isAuthed() {
    const auth = getKey(STORE_KEYS.auth, null);
    return !!(auth && auth.ok && auth.email);
  }

  function login(email, password) {
    const em = String(email || "").trim().toLowerCase();
    const pw = String(password || "").trim();

    // Demo-only authentication
    if (em === CONFIG.DEMO_EMAIL && pw === CONFIG.DEMO_PASSWORD) {
      const auth = { ok: true, email: em, at: Date.now() };
      setKey(STORE_KEYS.auth, auth);
      logAudit("Login successful (" + em + ")");
      return true;
    }

    return false;
  }

  function logout() {
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out");
  }

  function guard() {
    // Any page except index.html should require auth
    if (!isAuthed()) {
      const path = location.pathname.toLowerCase();
      const isIndex = path.endsWith("/index.html") || path.endsWith("index.html") || path.endsWith("/");
      if (!isIndex) {
        location.href = "index.html";
      }
    }
  }

  // -------------------------
  // Doc State
  // -------------------------
  function defaultDoc() {
    return {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      template: "nda.pdf",              // used if no customPdfBase64
      customPdfBase64: "",              // overrides template if present
      customPdfName: "",                // optional name for custom pdf
      status: "draft",                  // draft | sent | completed
      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: "",
      },
    };
  }

  function loadDocState() {
    return getKey(STORE_KEYS.doc, null);
  }

  function saveDocState(doc) {
    setKey(STORE_KEYS.doc, doc);
  }

  function resetDoc() {
    const d = defaultDoc();
    saveDocState(d);
    saveFields([]);
    removeSigned();
    setKey(STORE_KEYS.values, {});
    setKey(STORE_KEYS.audit, []);
    logAudit("Envelope reset");
    return d;
  }

  // -------------------------
  // Fields
  // Fields are stored in "canvas pixel space" based on the rendered PDF
  // sign.html stores: {id,type,page,x,y,w,h,required,role}
  // -------------------------
  function loadFields() {
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields) {
    setKey(STORE_KEYS.fields, fields || []);
  }

  // -------------------------
  // Values
  // Used for signature/date values
  // -------------------------
  function loadValues() {
    return getKey(STORE_KEYS.values, {});
  }

  function saveValues(values) {
    setKey(STORE_KEYS.values, values || {});
  }

  function setFieldValue(type, value) {
    const values = loadValues();
    values[type] = value;
    saveValues(values);
  }

  function getFieldValue(type) {
    const values = loadValues();
    return values[type];
  }

  // -------------------------
  // Audit Trail
  // -------------------------
  function loadAudit() {
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(events) {
    setKey(STORE_KEYS.audit, events || []);
  }

  function logAudit(message) {
    const audit = loadAudit();
    audit.unshift({
      at: new Date().toISOString(),
      msg: message,
    });
    saveAudit(audit);
  }

  // -------------------------
  // Signed PDF storage
  // -------------------------
  function setSignedBase64(b64) {
    if (!b64) return;
    localStorage.setItem(STORE_KEYS.signed, b64);
  }

  function getSignedBase64() {
    return localStorage.getItem(STORE_KEYS.signed) || "";
  }

  function hasSignedPDF() {
    return !!getSignedBase64();
  }

  function removeSigned() {
    localStorage.removeItem(STORE_KEYS.signed);
  }

  // -------------------------
  // Base64 / Bytes
  // -------------------------
  function base64ToUint8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function uint8ToBase64(uint8) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < uint8.length; i += chunk) {
      const sub = uint8.subarray(i, i + chunk);
      binary += String.fromCharCode(...sub);
    }
    return btoa(binary);
  }

  // -------------------------
  // Load PDF bytes (template OR custom)
  // -------------------------
  async function fetchPdfBytes() {
    const doc = loadDocState();
    if (!doc) throw new Error("No doc state found.");

    // Custom PDF (upload/scratch)
    if (doc.customPdfBase64) {
      return {
        bytes: base64ToUint8(doc.customPdfBase64),
        name: doc.customPdfName || "custom.pdf",
        source: "custom",
      };
    }

    // Template PDF
    const template = doc.template || "nda.pdf";
    const url = `pdfs/${encodeURIComponent(template)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Template not found: " + url);
    const ab = await res.arrayBuffer();
    return {
      bytes: new Uint8Array(ab),
      name: template,
      source: "template",
    };
  }

  // -------------------------
  // Coordinates mapping (preview px -> PDF points)
  // sign.html stores fields in preview pixel coords.
  // We must map them onto the actual PDF page size.
  //
  // Approach:
  // - Preview canvas size = (PDF page size in points) * previewScale
  // - But sign.html field x/y is relative to stage scroll container.
  // - In sign.html we set field x/y based on stage content coords.
  // - So we treat those as "canvas pixel coords".
  //
  // To map:
  //   pdfX = x / previewScale
  //   pdfY = pageHeight - ((y + fieldHeight) / previewScale)
  // (because PDF origin is bottom-left)
  // -------------------------
  function mapToPdfCoords(field, previewScale, pageHeight) {
    const x = (field.x || 0) / previewScale;
    const yTop = (field.y || 0) / previewScale;
    const w = (field.w || 160) / previewScale;
    const h = (field.h || 44) / previewScale;

    // Convert from top-left origin to PDF bottom-left origin
    const y = pageHeight - (yTop + h);

    return { x, y, w, h };
  }

  // -------------------------
  // Generate Signed PDF
  // This is the core fix for:
  //  - "builder pdf failed"
  //  - signed PDF not appearing
  //  - custom/scratch PDFs not showing
  // -------------------------
  async function generateSignedPDF() {
    try {
      if (!window.PDFLib) {
        console.error("pdf-lib missing. Ensure sign.html includes pdf-lib or loads it.");
        return false;
      }

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      const docState = loadDocState();
      if (!docState) throw new Error("Missing docState");

      const fields = loadFields();
      if (!fields || fields.length === 0) {
        throw new Error("No fields placed. Place signature/date fields first.");
      }

      // Load original PDF bytes
      const { bytes, name } = await fetchPdfBytes();
      const pdfDoc = await PDFDocument.load(bytes);

      // Use first page for now (demo). You can extend to multi-page.
      const page = pdfDoc.getPages()[0];
      const { width: pageW, height: pageH } = page.getSize();

      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Values to embed
      const sigText = String(getFieldValue("signature") || docState.parties?.aName || "Sender").trim();
      const dateText = String(getFieldValue("date") || new Date().toLocaleDateString()).trim();

      // IMPORTANT: previewScale needs to match sign.html default zoom scale.
      // sign.html uses zoom = 1.3 by default.
      // If the user changes zoom, sign.html re-renders but keeps fields in stage pixel coords.
      // For best results we store current zoom in localStorage whenever user zooms.
      //
      // We'll attempt to read it here, fallback to 1.3.
      const previewScale = parseFloat(localStorage.getItem("fss_preview_scale") || "1.3") || 1.3;

      // Find signature & date fields
      const sigField = fields.find(f => f.type === "signature");
      const dateField = fields.find(f => f.type === "date");

      if (!sigField || !dateField) {
        throw new Error("Missing required fields: signature and/or date");
      }

      // Map to PDF coords
      const sig = mapToPdfCoords(sigField, previewScale, pageH);
      const dat = mapToPdfCoords(dateField, previewScale, pageH);

      // Draw signature (as styled text) + line
      page.drawRectangle({
        x: sig.x,
        y: sig.y,
        width: sig.w,
        height: sig.h,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.9, 0.2, 0.5),
        borderWidth: 1,
        opacity: 0.95,
      });

      page.drawText(sigText, {
        x: sig.x + 10,
        y: sig.y + sig.h / 2 - 7,
        size: 14,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });

      // Draw date
      page.drawRectangle({
        x: dat.x,
        y: dat.y,
        width: dat.w,
        height: dat.h,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.2, 0.9, 0.5),
        borderWidth: 1,
        opacity: 0.95,
      });

      page.drawText(dateText, {
        x: dat.x + 10,
        y: dat.y + dat.h / 2 - 7,
        size: 12,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });

      // Add footer stamp
      page.drawText("Signed via FSS Demo", {
        x: 36,
        y: 22,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: 0.75,
      });

      // Save PDF
      const signedBytes = await pdfDoc.save();
      const b64 = uint8ToBase64(signedBytes);

      setSignedBase64(b64);

      logAudit("Signed PDF generated (" + name + ")");
      return true;
    } catch (err) {
      console.error("generateSignedPDF ERROR:", err);
      logAudit("ERROR generating signed PDF: " + (err?.message || "unknown error"));
      return false;
    }
  }

  // -------------------------
  // PUBLIC API
  // -------------------------
  window.FSS = {
    // config
    CONFIG,

    // auth
    isAuthed,
    login,
    logout,
    guard,

    // doc
    defaultDoc,
    loadDocState,
    saveDocState,
    resetDoc,

    // fields + values
    loadFields,
    saveFields,
    setFieldValue,
    getFieldValue,

    // audit
    loadAudit,
    logAudit,

    // pdf
    fetchPdfBytes,
    generateSignedPDF,

    // signed
    hasSignedPDF,
    getSignedBase64,
    removeSigned,
  };
})();
