/* ==========================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage to simulate sessions + doc state.
   PDF signing is done in-browser via pdf-lib (loaded only on sign.html).
   ========================================================== */

window.FSS = (() => {
  /* =========================
     CONFIG
     ========================= */
  const DEMO_PASSWORD = "hallam";
  const DEMO_EMAIL = "demo@client.com";
  const DEMO_PASS = "hallam";

  const STORE_KEYS = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64",
    uploadedPdf: "fss_uploaded_pdf_b64",
    uploadedPdfName: "fss_uploaded_pdf_name"
  };

  /* =========================
     HELPERS
     ========================= */
  function safeJSONParse(str, fallback){
    try{ return JSON.parse(str); }catch{ return fallback; }
  }

  function getKey(key, fallback){
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function setKey(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKey(key){
    localStorage.removeItem(key);
  }

  function uid(){
    return String(Date.now()) + String(Math.floor(Math.random() * 100000));
  }

  function escapeHTML(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  /* =========================
     DEMO GATE (optional)
     ========================= */
  function isDemoUnlocked(){
    return !!localStorage.getItem(STORE_KEYS.demoGate);
  }

  function unlockDemo(password){
    if(String(password || "").trim().toLowerCase() === DEMO_PASSWORD){
      localStorage.setItem(STORE_KEYS.demoGate, "true");
      return true;
    }
    return false;
  }

  /* =========================
     AUTH (demo login)
     ========================= */
  function isAuthed(){
    const auth = getKey(STORE_KEYS.auth, null);
    return !!(auth && auth.ok);
  }

  function login(email, password){
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "").trim();

    if(e === DEMO_EMAIL && p === DEMO_PASS){
      const auth = { ok:true, email:e, at: new Date().toISOString() };
      setKey(STORE_KEYS.auth, auth);
      logAudit("Login successful.");
      return true;
    }
    return false;
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out.");
  }

  function guard(){
    // Demo gate optional
    if(!isDemoUnlocked()){
      // Allow index.html to run without gating redirect if you want.
      const path = location.pathname.toLowerCase();
      if(!path.endsWith("/index.html") && !path.endsWith("/index")){
        location.href = "index.html";
        return;
      }
    }

    if(!isAuthed()){
      const path = location.pathname.toLowerCase();
      if(!path.endsWith("/index.html") && !path.endsWith("/index")){
        location.href = "index.html";
      }
    }
  }

  /* =========================
     DOC STATE
     ========================= */
  function defaultDoc(){
    return {
      id: "ENV-" + Math.random().toString(16).slice(2,10).toUpperCase(),
      createdAt: new Date().toISOString(),
      template: "nda.pdf",
      templateSource: "library", // "library" | "upload"
      status: "draft", // draft | sent | completed
      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: ""
      }
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
    setKey(STORE_KEYS.fields, []);
    setKey(STORE_KEYS.values, {});
    removeKey(STORE_KEYS.signed);
    // NOTE: we do NOT remove uploaded pdf here, because upload can be reused
    logAudit("Envelope reset.");
    return d;
  }

  function setDocStatus(stage){
    const doc = loadDocState() || defaultDoc();
    doc.status = stage;
    saveDocState(doc);
    logAudit(`Status updated: ${stage}`);
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
    const vals = loadValues() || {};
    vals[type] = value;
    saveValues(vals);
  }

  function getFieldValue(type){
    const vals = loadValues() || {};
    return vals[type] || "";
  }

  /* =========================
     AUDIT
     ========================= */
  function loadAudit(){
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(list){
    setKey(STORE_KEYS.audit, list || []);
  }

  function logAudit(message){
    const list = loadAudit() || [];
    list.unshift({
      id: uid(),
      at: new Date().toISOString(),
      msg: message
    });
    saveAudit(list);
  }

  /* =========================
     UPLOADED PDF (BASE64)
     ========================= */
  function setUploadedPDFBase64(b64, filename){
    if(!b64) return;
    localStorage.setItem(STORE_KEYS.uploadedPdf, b64);
    localStorage.setItem(STORE_KEYS.uploadedPdfName, filename || "uploaded.pdf");
  }

  function getUploadedPDFBase64(){
    return localStorage.getItem(STORE_KEYS.uploadedPdf) || "";
  }

  function getUploadedPDFName(){
    return localStorage.getItem(STORE_KEYS.uploadedPdfName) || "uploaded.pdf";
  }

  function clearUploadedPDF(){
    localStorage.removeItem(STORE_KEYS.uploadedPdf);
    localStorage.removeItem(STORE_KEYS.uploadedPdfName);
  }

  /* =========================
     SIGNED PDF STORAGE
     ========================= */
  function setSignedBase64(b64){
    if(!b64) return;
    localStorage.setItem(STORE_KEYS.signed, b64);
  }

  function hasSignedPDF(){
    return !!localStorage.getItem(STORE_KEYS.signed);
  }

  function getSignedBase64(){
    return localStorage.getItem(STORE_KEYS.signed) || "";
  }

  /* =========================
     FILE UTILS
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

  function base64ToBlobURL(b64, mime="application/pdf"){
    const byteChars = atob(b64);
    const bytes = new Uint8Array(byteChars.length);
    for(let i=0; i<byteChars.length; i++){
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type:mime });
    return URL.createObjectURL(blob);
  }

  /* =========================
     TEMPLATE RESOLUTION
     ========================= */
  function getActivePDFInfo(){
    const doc = loadDocState() || defaultDoc();
    // If doc says upload, but upload missing, fall back to library template
    if(doc.templateSource === "upload"){
      const b64 = getUploadedPDFBase64();
      if(b64){
        return {
          source: "upload",
          name: getUploadedPDFName(),
          url: base64ToBlobURL(b64, "application/pdf"),
          b64
        };
      }
      // fallback
      doc.templateSource = "library";
      saveDocState(doc);
    }

    // library
    const t = doc.template || "nda.pdf";
    return {
      source: "library",
      name: t,
      url: `pdfs/${encodeURIComponent(t)}`,
      b64: ""
    };
  }

  /* =========================
     REAL SIGNED PDF GENERATOR (pdf-lib)
     - places signature/date in lower right area on LAST page
     - adds "Signed via FSS Demo" footer & audit excerpt
     ========================= */
  async function generateSignedPDF(){
    try{
      if(!window.PDFLib){
        console.error("pdf-lib not loaded");
        return false;
      }

      const docState = loadDocState() || defaultDoc();

      // get PDF bytes (template from library OR upload)
      const pdfInfo = getActivePDFInfo();
      let templateBytes;

      if(pdfInfo.source === "upload"){
        // base64 -> bytes
        const byteChars = atob(pdfInfo.b64);
        const bytes = new Uint8Array(byteChars.length);
        for(let i=0; i<byteChars.length; i++){
          bytes[i] = byteChars.charCodeAt(i);
        }
        templateBytes = bytes.buffer;
      }else{
        templateBytes = await fetchAsArrayBuffer(pdfInfo.url);
      }

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // signatures
      const signerName = docState.parties.aName || "Sender";
      const signerEmail = docState.parties.aEmail || "";
      const recipientName = docState.parties.bName || "Recipient";
      const recipientEmail = docState.parties.bEmail || "";
      const signedAt = new Date().toLocaleString();

      // Place at lower right of last page
      const { width, height } = lastPage.getSize();

      const boxW = Math.min(280, width * 0.42);
      const boxH = 92;

      const x = width - boxW - 40;
      const y = 50;

      // Card background
      lastPage.drawRectangle({
        x, y, width: boxW, height: boxH,
        color: rgb(0.96,0.96,0.98),
        borderColor: rgb(0.75,0.75,0.78),
        borderWidth: 1
      });

      // Header
      lastPage.drawText("Signature Record", {
        x: x + 14,
        y: y + boxH - 22,
        size: 12,
        font: helvBold,
        color: rgb(0.15,0.15,0.18)
      });

      // signer
      lastPage.drawText(`Sender: ${signerName}`, {
        x: x + 14,
        y: y + boxH - 40,
        size: 10,
        font: helv,
        color: rgb(0.18,0.18,0.22)
      });

      if(signerEmail){
        lastPage.drawText(`${signerEmail}`, {
          x: x + 14,
          y: y + boxH - 54,
          size: 9,
          font: helv,
          color: rgb(0.35,0.35,0.40)
        });
      }

      // recipient
      lastPage.drawText(`Recipient: ${recipientName}`, {
        x: x + 14,
        y: y + 26,
        size: 10,
        font: helv,
        color: rgb(0.18,0.18,0.22)
      });

      if(recipientEmail){
        lastPage.drawText(`${recipientEmail}`, {
          x: x + 14,
          y: y + 12,
          size: 9,
          font: helv,
          color: rgb(0.35,0.35,0.40)
        });
      }

      // time
      lastPage.drawText(`Signed: ${signedAt}`, {
        x: x + 14,
        y: y + 40,
        size: 9.5,
        font: helvBold,
        color: rgb(0.12,0.12,0.16)
      });

      // footer stamp on first page
      const firstPage = pages[0];
      firstPage.drawText("Signed via FSS Demo", {
        x: 40,
        y: 18,
        size: 9,
        font: helv,
        color: rgb(0.35,0.35,0.35),
        opacity: 0.9
      });

      // Embed a short audit excerpt on last page
      const audit = loadAudit() || [];
      const auditText = audit.slice(0,4).map(a => `• ${a.msg}`).join(" ");
      lastPage.drawText(auditText.slice(0, 140), {
        x: 40,
        y: 18,
        size: 8.5,
        font: helv,
        color: rgb(0.35,0.35,0.35),
        opacity: 0.8
      });

      const signedBytes = await pdfDoc.save();
      const b64 = arrayBufferToBase64(signedBytes);
      setSignedBase64(b64);

      return true;
    }catch(err){
      console.error("generateSignedPDF error:", err);
      return false;
    }
  }

  /* =========================
     PUBLIC API
     ========================= */
  return {
    // config
    DEMO_PASSWORD,
    DEMO_EMAIL,
    DEMO_PASS,

    // gate
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
    setDocStatus,

    // fields
    loadFields,
    saveFields,
    loadValues,
    saveValues,
    setFieldValue,
    getFieldValue,

    // audit
    loadAudit,
    logAudit,

    // pdf stored
    hasSignedPDF,
    getSignedBase64,

    // uploaded pdf
    setUploadedPDFBase64,
    getUploadedPDFBase64,
    getUploadedPDFName,
    clearUploadedPDF,

    // helper
    uid,
    escapeHTML,
    base64ToBlobURL,
    getActivePDFInfo,

    // signing
    generateSignedPDF
  };
})();
