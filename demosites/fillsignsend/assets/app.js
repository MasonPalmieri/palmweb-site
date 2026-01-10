/* ============================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage for auth + doc state.
   ============================================================ */

window.FSS = (() => {

  /* =========================
     CONFIG
     ========================= */
  const DEMO_PASSWORD = "hallam"; // required password
  const STORE_KEYS = {
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64",
    uploadedB64: "fss_uploaded_pdf_b64",
    uploadedName: "fss_uploaded_pdf_name",
  };

  /* =========================
     HELPERS
     ========================= */
  function nowStamp() {
    return new Date().toISOString();
  }

  function uid() {
    return String(Date.now()) + String(Math.floor(Math.random() * 100000));
  }

  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function getKey(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function setKey(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function removeKey(key) {
    localStorage.removeItem(key);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* =========================
     AUTH
     ========================= */
  function isAuthed() {
    const a = getKey(STORE_KEYS.auth, null);
    return !!(a && a.email);
  }

  // ✅ Allow ANY email as long as password matches DEMO_PASSWORD
  function login(email, password) {
    const e = (email || "").trim().toLowerCase();
    const p = (password || "").trim();

    if (!e || !p) return { ok: false, msg: "Missing email or password." };
    if (p !== DEMO_PASSWORD) return { ok: false, msg: "Incorrect password." };

    setKey(STORE_KEYS.auth, { email: e, at: nowStamp() });
    logAudit(`Login successful (${e}).`);
    return { ok: true };
  }

  function logout() {
    removeKey(STORE_KEYS.auth);
    logAudit("Logout.");
  }

  // ✅ Prevent redirect loops
  function guard() {
    if (!isAuthed()) {
      const path = location.pathname.toLowerCase();
      if (!path.endsWith("/index.html") && !path.endsWith("index.html")) {
        location.replace("index.html");
      }
    }
  }

  function hardReset() {
    localStorage.removeItem(STORE_KEYS.auth);
    localStorage.removeItem(STORE_KEYS.doc);
    localStorage.removeItem(STORE_KEYS.fields);
    localStorage.removeItem(STORE_KEYS.values);
    localStorage.removeItem(STORE_KEYS.audit);
    localStorage.removeItem(STORE_KEYS.signed);
    localStorage.removeItem(STORE_KEYS.uploadedB64);
    localStorage.removeItem(STORE_KEYS.uploadedName);
  }

  /* =========================
     DOC STATE
     ========================= */
  function defaultDoc() {
    return {
      id: uid(),
      createdAt: nowStamp(),
      updatedAt: nowStamp(),
      stage: "create",
      status: "draft",
      template: "nda.pdf",
      parties: {
        aName: "",
        aEmail: "",
        aTitle: "",
        aAddr: "",
        bName: "",
        bEmail: "",
        bTitle: "",
        bAddr: "",
      },
      builder: null,
    };
  }

  function loadDocState() {
    return getKey(STORE_KEYS.doc, null);
  }

  function saveDocState(doc) {
    doc.updatedAt = nowStamp();
    setKey(STORE_KEYS.doc, doc);
  }

  function resetDoc() {
    const d = defaultDoc();
    setKey(STORE_KEYS.doc, d);
    removeKey(STORE_KEYS.signed);
    setKey(STORE_KEYS.fields, []);
    setKey(STORE_KEYS.values, {});
    setKey(STORE_KEYS.audit, []);
    return d;
  }

  /* =========================
     AUDIT
     ========================= */
  function loadAudit() {
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(arr) {
    setKey(STORE_KEYS.audit, arr);
  }

  function logAudit(message) {
    const audit = loadAudit();
    audit.unshift({ at: nowStamp(), msg: message });
    saveAudit(audit);
  }

  /* =========================
     FIELDS + VALUES
     ========================= */
  function loadFields() {
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields) {
    setKey(STORE_KEYS.fields, fields || []);
  }

  function loadValues() {
    return getKey(STORE_KEYS.values, {});
  }

  function saveValues(values) {
    setKey(STORE_KEYS.values, values || {});
  }

  function setFieldValue(fieldIdOrType, value) {
    const values = loadValues();
    values[fieldIdOrType] = value;
    saveValues(values);
  }

  function getFieldValue(fieldIdOrType) {
    const values = loadValues();
    return values[fieldIdOrType];
  }

  /* =========================
     SIGNED PDF STORAGE
     ========================= */
  function setSignedBase64(b64) {
    setKey(STORE_KEYS.signed, b64 || null);
  }

  function getSignedBase64() {
    return getKey(STORE_KEYS.signed, null);
  }

  function hasSignedPDF() {
    const b64 = getSignedBase64();
    return !!(b64 && String(b64).length > 20);
  }

  /* =========================
     UPLOAD HELPERS
     ========================= */
  function hasUploadedPDF() {
    return !!localStorage.getItem(STORE_KEYS.uploadedB64);
  }

  function getUploadedPDFBase64() {
    return localStorage.getItem(STORE_KEYS.uploadedB64);
  }

  function getUploadedPDFName() {
    return localStorage.getItem(STORE_KEYS.uploadedName) || "Uploaded.pdf";
  }

  /* =========================
     PDF LIB LOADER
     ========================= */
  async function ensurePdfLib() {
    if (window.PDFLib) return true;

    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function fetchAsArrayBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${url} (${res.status})`);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToBytes(b64) {
    const byteChars = atob(b64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    return bytes;
  }

  function base64ToBlobURL(b64, mime = "application/pdf") {
    const bytes = base64ToBytes(b64);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  }

  /* =========================
     BUILDER PDF GENERATOR
     ========================= */
  async function generateBuilderPDFBytes() {
    const ok = await ensurePdfLib();
    if (!ok || !window.PDFLib) return null;

    const docState = loadDocState();
    if (!docState || !docState.builder || !docState.builder.text) return null;

    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

    const pdfDoc = await PDFDocument.create();
    const pageW = 612;
    const pageH = 792;
    const margin = 54;
    const lineHeight = 14;
    const fontSize = 11;

    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const title = (docState.builder.title || "Agreement").trim();
    const text = (docState.builder.text || "").trim();
    const lines = wrapText(text, font, fontSize, pageW - margin * 2);

    let page = pdfDoc.addPage([pageW, pageH]);
    let y = pageH - margin;

    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 26;

    for (const ln of lines) {
      if (y < margin + 40) {
        page = pdfDoc.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      page.drawText(ln, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    return await pdfDoc.save();
  }

  function wrapText(text, font, fontSize, maxWidth) {
    const paragraphs = String(text || "").split(/\n/);
    const out = [];

    for (const p of paragraphs) {
      const line = p.replace(/\t/g, "    ");
      if (!line.trim()) {
        out.push("");
        continue;
      }

      const words = line.split(/\s+/);
      let cur = "";

      for (const w of words) {
        const test = cur ? (cur + " " + w) : w;
        const width = font.widthOfTextAtSize(test, fontSize);
        if (width <= maxWidth) cur = test;
        else {
          if (cur) out.push(cur);
          cur = w;
        }
      }
      if (cur) out.push(cur);
    }

    return out;
  }

  async function getSourcePDFBytes() {
    const docState = loadDocState();
    if (!docState) throw new Error("No doc state found.");

    if (hasUploadedPDF()) {
      const b64 = getUploadedPDFBase64();
      if (!b64) throw new Error("Uploaded PDF is missing.");
      return base64ToBytes(b64);
    }

    if (docState.builder && docState.builder.text) {
      const bytes = await generateBuilderPDFBytes();
      if (!bytes) throw new Error("Builder PDF generation failed.");
      return bytes;
    }

    const template = docState.template || "nda.pdf";
    const url = `pdfs/${encodeURIComponent(template)}`;
    const buf = await fetchAsArrayBuffer(url);
    return new Uint8Array(buf);
  }

  async function generateSignedPDF() {
    const ok = await ensurePdfLib();
    if (!ok || !window.PDFLib) return false;

    try {
      const docState = loadDocState();
      if (!docState) throw new Error("Missing doc state.");

      const fields = loadFields() || [];
      const values = loadValues() || {};

      const senderName = docState.parties?.aName || "Sender";
      const defaultDate = new Date().toLocaleDateString();

      if (!values.signature) values.signature = senderName;
      if (!values.date) values.date = defaultDate;

      const srcBytes = await getSourcePDFBytes();
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(srcBytes);

      const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontTextBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSig = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      const pages = pdfDoc.getPages();

      for (const f of fields) {
        const pageIndex = clamp((f.page || 1) - 1, 0, pages.length - 1);
        const page = pages[pageIndex];

        const x = Number(f.x || 0);
        const yTop = Number(f.y || 0);
        const w = Number(f.w || 140);
        const h = Number(f.h || 34);

        const pageH = page.getHeight();
        const pdfY = pageH - yTop - h;

        let value = "";
        if (f.id && values[f.id] != null) value = String(values[f.id]);
        else if (values[f.type] != null) value = String(values[f.type]);

        if (!value && f.type === "signature") value = senderName;
        if (!value && f.type === "date") value = defaultDate;

        if (f.type === "checkbox") {
          const checked = String(value).toLowerCase() === "true" || value === "1" || value === "yes";
          value = checked ? "✔" : "";
        }

        let font = fontText;
        let size = 12;

        if (f.type === "signature") { font = fontSig; size = 18; }
        else if (f.type === "date") { font = fontTextBold; size = 11; }
        else if (f.type === "initials") { font = fontTextBold; size = 12; }
        else if (f.type === "checkbox") { font = fontTextBold; size = 14; }

        const padX = 6;
        const padY = 9;

        page.drawText(value, {
          x: x + padX,
          y: pdfY + padY,
          size,
          font,
          color: rgb(0, 0, 0),
          opacity: 1,
        });
      }

      const last = pages[pages.length - 1];
      last.drawText(`Signed via FSS Demo — ${new Date().toLocaleString()}`, {
        x: 44,
        y: 18,
        size: 9,
        font: fontText,
        color: rgb(0.15, 0.15, 0.15),
        opacity: 0.85,
      });

      const signedBytes = await pdfDoc.save();
      const b64 = arrayBufferToBase64(signedBytes);
      setSignedBase64(b64);
      return true;
    } catch (err) {
      console.error("generateSignedPDF error:", err);
      return false;
    }
  }

  /* =========================
     EXPORTED API
     ========================= */
  return {
    DEMO_PASSWORD,
    uid,

    // Auth
    isAuthed,
    login,
    logout,
    guard,
    hardReset,

    // Doc
    defaultDoc,
    loadDocState,
    saveDocState,
    resetDoc,

    // Audit
    loadAudit,
    logAudit,

    // Fields
    loadFields,
    saveFields,
    loadValues,
    saveValues,
    setFieldValue,
    getFieldValue,

    // Signed
    setSignedBase64,
    getSignedBase64,
    hasSignedPDF,

    // Upload
    hasUploadedPDF,
    getUploadedPDFBase64,
    getUploadedPDFName,

    // Utils
    base64ToBlobURL,

    // PDF
    ensurePdfLib,
    generateBuilderPDFBytes,
    generateSignedPDF,
  };
})();