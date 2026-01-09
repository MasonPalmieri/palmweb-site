/* =============================================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage to simulate sessions + doc state.
   Supports:
     - Template PDFs from /pdfs/
     - Uploaded PDFs (stored base64 in localStorage)
     - Scratch-built PDFs (generated dynamically and stored base64)
   Signed PDF generation uses pdf-lib (loaded only on sign.html).
============================================================================= */

window.FSS = (() => {

  /* =========================
     CONFIG
  ========================= */
  const DEMO_PASSWORD = "hallam";

  // Optional: hide your internal demo name
  const APP_LABEL = "Client Demo";

  const STORE_KEYS = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64"
  };

  /* =========================
     HELPERS
  ========================= */
  function escape(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function safeJSONParse(str, fallback){
    try { return JSON.parse(str); }
    catch { return fallback; }
  }

  function nowStamp(){
    return new Date().toLocaleString();
  }

  function uid(){
    return String(Date.now()) + String(Math.floor(Math.random() * 100000));
  }

  function setKey(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }

  function getKey(key, fallback){
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function removeKey(key){
    localStorage.removeItem(key);
  }

  /* =========================
     DEMO GATE (Main site password)
  ========================= */
  function isDemoUnlocked(){
    return !!localStorage.getItem(STORE_KEYS.demoGate);
  }

  function unlockDemo(password){
    if((password || "").trim().toLowerCase() === DEMO_PASSWORD){
      localStorage.setItem(STORE_KEYS.demoGate, "true");
      return true;
    }
    return false;
  }

  /* =========================
     AUTH
  ========================= */
  function isAuthed(){
    return !!localStorage.getItem(STORE_KEYS.auth);
  }

  function login(email, password){
    const e = (email || "").trim().toLowerCase();
    const p = (password || "").trim();

    // This is a demo auth gate only
    if(!e || !p) return false;
    if(p !== DEMO_PASSWORD) return false;

    const auth = { email: e, at: nowStamp() };
    setKey(STORE_KEYS.auth, auth);
    logAudit(`Login successful (${e}).`);
    return true;
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out.");
  }

  function guard(options = {}){
    const {
      allowDemoGate = false,
      demoGatePath = "../../demos.html"
    } = options;

    // Demo gate optional
    if(allowDemoGate && !isDemoUnlocked()){
      location.href = demoGatePath;
      return;
    }

    // Auth required for everything except index.html
    const path = location.pathname.toLowerCase();
    const isIndex = path.endsWith("/index.html") || path.endsWith("/index");

    if(!isIndex && !isAuthed()){
      location.href = "index.html";
      return;
    }
  }

  /* =========================
     DOC STATE
  ========================= */
  function defaultDoc(){
    return {
      id: "ENV-" + uid(),
      createdAt: new Date().toISOString(),
      template: null,

      // sourceType determines how the PDF is loaded
      // "template" | "upload" | "scratch"
      sourceType: "template",

      // For upload/scratch, store PDF base64 here
      customPdfBase64: null,
      customPdfName: null,

      status: "draft", // draft | sent | completed

      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: ""
      },

      title: "Confidential Agreement"
    };
  }

  function loadDocState(){
    return getKey(STORE_KEYS.doc, null);
  }

  function saveDocState(doc){
    setKey(STORE_KEYS.doc, doc);
  }

  function resetDoc(){
    const d = defaultDoc();
    saveDocState(d);
    removeKey(STORE_KEYS.fields);
    removeKey(STORE_KEYS.values);
    removeKey(STORE_KEYS.signed);
    logAudit("Envelope reset.");
    return d;
  }

  function setDocStage(stage){
    const doc = loadDocState() || defaultDoc();
    doc.status = stage;
    saveDocState(doc);
    logAudit(`Status updated: ${stage}`);
    return doc;
  }

  /* =========================
     FIELDS + VALUES
  ========================= */
  function loadFields(){
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields){
    setKey(STORE_KEYS.fields, fields || []);
  }

  function loadValues(){
    return getKey(STORE_KEYS.values, {});
  }

  function saveValues(values){
    setKey(STORE_KEYS.values, values || {});
  }

  function setFieldValue(type, value){
    const values = loadValues();
    values[type] = value;
    saveValues(values);
  }

  function getFieldValue(type){
    const values = loadValues();
    return values[type];
  }

  /* =========================
     AUDIT TRAIL
  ========================= */
  function loadAudit(){
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(audit){
    setKey(STORE_KEYS.audit, audit || []);
  }

  function logAudit(message){
    const audit = loadAudit();
    audit.unshift({
      at: nowStamp(),
      msg: message
    });
    saveAudit(audit);
  }

  /* =========================
     PDF UTILITIES
  ========================= */
  async function fetchAsArrayBuffer(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error("Failed to fetch PDF: " + url);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer){
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for(let i=0; i<bytes.length; i += chunkSize){
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  function base64ToBlobURL(base64, mime="application/pdf"){
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  }

  function setSignedBase64(b64){
    localStorage.setItem(STORE_KEYS.signed, b64 || "");
  }

  function getSignedBase64(){
    return localStorage.getItem(STORE_KEYS.signed) || "";
  }

  function hasSignedPDF(){
    const b = getSignedBase64();
    return !!(b && b.length > 50);
  }

  /* =========================
     PDF SOURCE GETTER (template/upload/scratch)
  ========================= */
  async function getActivePdfBytes(){
    const doc = loadDocState();
    if(!doc) throw new Error("No doc state.");

    // Template
    if(doc.sourceType === "template"){
      const template = doc.template || "nda.pdf";
      const url = `pdfs/${encodeURIComponent(template)}`;
      return await fetchAsArrayBuffer(url);
    }

    // Upload or Scratch
    if((doc.sourceType === "upload" || doc.sourceType === "scratch") && doc.customPdfBase64){
      const bytes = Uint8Array.from(atob(doc.customPdfBase64), c => c.charCodeAt(0));
      return bytes.buffer;
    }

    throw new Error("No active PDF source found.");
  }

  function getActivePdfViewerURL(zoom=125){
    const doc = loadDocState();
    if(!doc) return "";

    if(doc.sourceType === "template"){
      const template = doc.template || "nda.pdf";
      return `pdfs/${encodeURIComponent(template)}#zoom=${zoom}`;
    }

    if((doc.sourceType === "upload" || doc.sourceType === "scratch") && doc.customPdfBase64){
      const blobUrl = base64ToBlobURL(doc.customPdfBase64);
      return `${blobUrl}#zoom=${zoom}`;
    }

    return "";
  }

  /* =========================
     SCRATCH PDF GENERATION
     Creates a simple agreement PDF (real PDF bytes), stores it into doc.customPdfBase64
  ========================= */
  async function createScratchPDF({ title, partyA, partyB, bodyText }){
    if(!window.PDFLib){
      throw new Error("pdf-lib not loaded. Scratch PDF generation requires pdf-lib.");
    }

    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 54;
    let y = 740;

    page.drawText(title || "Confidential Agreement", {
      x: margin,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1)
    });

    y -= 36;

    const meta = [
      `Party A: ${partyA || "—"}`,
      `Party B: ${partyB || "—"}`,
      `Date: ${new Date().toLocaleDateString()}`
    ];

    meta.forEach(line => {
      page.drawText(line, {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.25, 0.25, 0.25)
      });
      y -= 18;
    });

    y -= 18;

    const body = (bodyText || "").trim() || "This Agreement is made between Party A and Party B. The parties agree to keep information confidential and not disclose it to third parties without written consent.";

    // simple wrap
    const maxWidth = 612 - margin*2;
    const words = body.split(/\s+/);
    let line = "";
    const lines = [];

    for(const w of words){
      const test = line ? (line + " " + w) : w;
      const width = font.widthOfTextAtSize(test, 12);
      if(width > maxWidth){
        lines.push(line);
        line = w;
      }else{
        line = test;
      }
    }
    if(line) lines.push(line);

    lines.forEach(ln => {
      if(y < 120){
        const p2 = pdfDoc.addPage([612, 792]);
        y = 740;
        p2.drawText(ln, { x: margin, y, size: 12, font, color: rgb(0.12,0.12,0.12) });
      }else{
        page.drawText(ln, { x: margin, y, size: 12, font, color: rgb(0.12,0.12,0.12) });
      }
      y -= 16;
    });

    // signature placeholders
    const sigY = 92;
    page.drawText("Party A Signature: ____________________________", { x: margin, y: sigY, size: 12, font, color: rgb(0.2,0.2,0.2) });
    page.drawText("Party B Signature: ____________________________", { x: margin, y: sigY - 22, size: 12, font, color: rgb(0.2,0.2,0.2) });

    const bytes = await pdfDoc.save();
    const b64 = arrayBufferToBase64(bytes);

    const doc = loadDocState() || defaultDoc();
    doc.sourceType = "scratch";
    doc.customPdfBase64 = b64;
    doc.customPdfName = (title || "Scratch Agreement") + ".pdf";
    doc.template = null;
    saveDocState(doc);

    logAudit("Scratch PDF created.");
    return doc;
  }

  /* =========================
     SIGNED PDF GENERATION
     Embeds sender signature + date stamp on last page.
  ========================= */
  async function generateSignedPDF(){
    try{
      if(!window.PDFLib){
        console.error("pdf-lib not loaded");
        return false;
      }

      const docState = loadDocState();
      if(!docState) return false;

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      // Load PDF bytes based on source
      const pdfBytes = await getActivePdfBytes();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      // Pull sender + date values
      const senderName = docState.parties.aName || "Sender";
      const dateText = new Date().toLocaleDateString();

      // Footer signature stamp (clean, readable)
      const stampX = 54;
      const stampY = 54;

      lastPage.drawRectangle({
        x: stampX - 10,
        y: stampY - 12,
        width: 504,
        height: 52,
        color: rgb(0.98, 0.98, 0.99),
        borderColor: rgb(0.85, 0.85, 0.88),
        borderWidth: 1
      });

      lastPage.drawText("Signed via FSS Demo", {
        x: stampX,
        y: stampY + 22,
        size: 10,
        font: helvBold,
        color: rgb(0.15, 0.15, 0.16)
      });

      lastPage.drawText(`Signer: ${senderName}`, {
        x: stampX,
        y: stampY + 8,
        size: 10,
        font: helv,
        color: rgb(0.18, 0.18, 0.20)
      });

      lastPage.drawText(`Date: ${dateText}`, {
        x: stampX + 280,
        y: stampY + 8,
        size: 10,
        font: helv,
        color: rgb(0.18, 0.18, 0.20)
      });

      // Optional: also embed a large signature mark for "wow factor"
      lastPage.drawText(senderName, {
        x: stampX + 300,
        y: stampY + 24,
        size: 14,
        font: helvBold,
        color: rgb(0.75, 0.10, 0.22)
      });

      const signedBytes = await pdfDoc.save();
      const signedB64 = arrayBufferToBase64(signedBytes);

      setSignedBase64(signedB64);
      logAudit("Signed PDF generated.");
      return true;

    }catch(err){
      console.error("generateSignedPDF error:", err);
      return false;
    }
  }

  /* =========================
     UPLOAD HANDLER
     Reads PDF file from <input type="file">, stores base64 in doc state.
  ========================= */
  function handlePdfUpload(file){
    return new Promise((resolve, reject) => {
      if(!file) return reject(new Error("No file provided."));
      if(!file.name.toLowerCase().endsWith(".pdf")) return reject(new Error("Only PDF files allowed."));

      const reader = new FileReader();
      reader.onload = () => {
        try{
          const arrayBuffer = reader.result;
          const b64 = arrayBufferToBase64(arrayBuffer);

          const doc = loadDocState() || defaultDoc();
          doc.sourceType = "upload";
          doc.customPdfBase64 = b64;
          doc.customPdfName = file.name;
          doc.template = null;
          saveDocState(doc);

          logAudit(`PDF uploaded: ${file.name}`);
          resolve(doc);
        }catch(e){
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsArrayBuffer(file);
    });
  }

  /* =========================
     PUBLIC API
  ========================= */
  return {
    // config
    DEMO_PASSWORD,
    APP_LABEL,

    // demo gate
    isDemoUnlocked,
    unlockDemo,

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
    setDocStage,

    // fields/values
    uid,
    loadFields,
    saveFields,
    loadValues,
    saveValues,
    setFieldValue,
    getFieldValue,

    // audit
    loadAudit,
    logAudit,

    // signed pdf
    hasSignedPDF,
    getSignedBase64,
    generateSignedPDF,

    // active PDF source/viewer helpers
    getActivePdfViewerURL,

    // scratch + upload
    createScratchPDF,
    handlePdfUpload,

    // helper
    escape
  };

})();
