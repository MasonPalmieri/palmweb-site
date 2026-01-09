/* =========================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage to simulate sessions + doc state.
   pdf-lib is loaded only on sign.html (window.PDFLib).
   ========================================================= */

window.FSS = (() => {

  /* =========================
     CONFIG
  ========================== */
  const DEMO_PASSWORD = "hallam";
  const DEMO_EMAIL = "demo@client.com";

  const STORE_KEYS = {
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64"
  };

  /* =========================
     UTILS
  ========================== */
  function safeJSONParse(str, fallback){
    try{ return JSON.parse(str); }catch{ return fallback; }
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

  function nowStamp(){
    return new Date().toLocaleString();
  }

  function uid(){
    return "fss_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function escape(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function getPath(){
    return location.pathname.toLowerCase();
  }

  function isLoginPage(){
    const p = getPath();
    return (
      p.endsWith("/fillsignsend/") ||
      p.endsWith("/fillsignsend/index.html") ||
      (p.endsWith("/index.html") && p.includes("/fillsignsend/"))
    );
  }

  /* =========================
     AUTH
  ========================== */
  function isAuthed(){
    const auth = getKey(STORE_KEYS.auth, null);
    return !!(auth && auth.ok && auth.email);
  }

  function login(email, password){
    const ok =
      (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (password === DEMO_PASSWORD);

    if(!ok) return false;

    setKey(STORE_KEYS.auth, { ok:true, email, at: nowStamp() });
    logAudit(`Login successful (${email})`);
    return true;
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out");
  }

  function guard(){
    if(isLoginPage()) return;
    if(!isAuthed()){
      location.replace("index.html");
    }
  }

  /* =========================
     DOC STATE
  ========================== */
  function defaultDoc(){
    return {
      id: uid(),
      createdAt: nowStamp(),
      template: "nda.pdf",
      status: "draft",
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
    setKey(STORE_KEYS.audit, []);
    removeKey(STORE_KEYS.signed);
    logAudit("Envelope reset");
    return d;
  }

  function setDocStage(stage){
    const d = loadDocState() || defaultDoc();
    d.status = stage;
    saveDocState(d);
    logAudit(`Status updated → ${stage}`);
    return d;
  }

  /* =========================
     AUDIT
  ========================== */
  function loadAudit(){
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(a){
    setKey(STORE_KEYS.audit, a);
  }

  function logAudit(msg){
    const audit = loadAudit();
    audit.unshift({ at: nowStamp(), msg });
    saveAudit(audit);
  }

  /* =========================
     FIELDS + VALUES
  ========================== */
  function loadFields(){
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields){
    setKey(STORE_KEYS.fields, fields);
  }

  function loadValues(){
    return getKey(STORE_KEYS.values, {});
  }

  function saveValues(values){
    setKey(STORE_KEYS.values, values);
  }

  function setFieldValue(key, value){
    const v = loadValues();
    v[key] = value;
    saveValues(v);
  }

  function getFieldValue(key){
    const v = loadValues();
    return v[key];
  }

  /* =========================
     SIGNED PDF
  ========================== */
  function setSignedBase64(b64){
    setKey(STORE_KEYS.signed, { b64, at: nowStamp() });
    logAudit("Signed PDF generated");
  }

  function hasSignedPDF(){
    const s = getKey(STORE_KEYS.signed, null);
    return !!(s && s.b64);
  }

  function getSignedBase64(){
    const s = getKey(STORE_KEYS.signed, null);
    return s?.b64 || null;
  }

  /* =========================
     FILE HELPERS
  ========================== */
  async function fetchAsArrayBuffer(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error("Failed to fetch PDF: " + url);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer){
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for(let i=0; i<bytes.length; i+=chunkSize){
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunkSize));
    }
    return btoa(binary);
  }

  function base64ToBlobURL(b64, mime){
    const byteChars = atob(b64);
    const bytes = new Uint8Array(byteChars.length);
    for(let i=0; i<byteChars.length; i++){
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    return URL.createObjectURL(blob);
  }

  function downloadBase64PDF(b64, filename){
    const url = base64ToBlobURL(b64, "application/pdf");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "signed.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* =========================
     REAL SIGNED PDF GENERATOR
     - Embeds sender signature + date on last page bottom-right
     - Adds audit footer "Signed via FSS Demo"
     - Requires pdf-lib loaded on sign.html
  ========================== */
  async function generateSignedPDF({ templateFile, senderName, senderEmail, recipientName, recipientEmail }){
    try{
      if(!window.PDFLib){
        console.error("pdf-lib not loaded");
        return false;
      }

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      const template = templateFile || "nda.pdf";
      const url = `pdfs/${encodeURIComponent(template)}`;
      const pdfBytes = await fetchAsArrayBuffer(url);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const senderSig = senderName || "Sender";
      const dateVal = getFieldValue("sender_date") || new Date().toLocaleDateString();

      const { width, height } = lastPage.getSize();

      // Signature block position (bottom-right)
      const sigX = width - 270;
      const sigY = 90;

      // A signature-like font isn't available in standard PDF fonts,
      // so we mimic it by making it larger + italic-ish styling.
      lastPage.drawText(senderSig, {
        x: sigX,
        y: sigY + 28,
        size: 22,
        font: helvBold,
        color: rgb(0.05, 0.05, 0.05),
        opacity: 0.95
      });

      lastPage.drawText(`Date: ${dateVal}`, {
        x: sigX,
        y: sigY + 10,
        size: 11,
        font: helv,
        color: rgb(0.20, 0.20, 0.20),
        opacity: 0.95
      });

      // Audit footer
      const auditText = `Signed via FSS Demo • ${nowStamp()} • Sender: ${senderEmail || senderSig} • Recipient: ${recipientEmail || recipientName || "—"}`;
      lastPage.drawText(auditText, {
        x: 36,
        y: 28,
        size: 8,
        font: helv,
        color: rgb(0.35, 0.35, 0.35),
        opacity: 0.85
      });

      // Output bytes
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
  ========================== */
  return {
    // auth
    login, logout, isAuthed, guard,

    // doc
    defaultDoc, loadDocState, saveDocState, resetDoc, setDocStage,

    // audit
    loadAudit, logAudit,

    // fields
    loadFields, saveFields,

    // values
    setFieldValue, getFieldValue,

    // signed pdf
    setSignedBase64, hasSignedPDF, getSignedBase64,

    // helpers
    uid, escape, fetchAsArrayBuffer, arrayBufferToBase64,
    base64ToBlobURL, downloadBase64PDF,

    // signer
    generateSignedPDF
  };

})();
