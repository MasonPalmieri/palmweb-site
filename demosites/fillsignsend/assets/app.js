/* =========================================================
   FSS Demo App — app.js
   Static (GitHub Pages). No backend.
   Uses localStorage to simulate sessions + document state.
   Supports:
    - Template PDFs in /pdfs/
    - Upload custom PDFs (stored as base64)
    - Build-from-scratch clause builder (generates a PDF)
    - Signed PDF generation using pdf-lib on sign.html only
   ========================================================= */

window.FSS = (() => {
  // ===== CONFIG =====
  const DEMO_PASSWORD = "hallam"; // demo gate
  const FSS_LOGIN_EMAIL = "demo@client.com";
  const FSS_LOGIN_PASS = "hallam";

  const STORE_KEYS = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64"
  };

  // ===== SMALL HELPERS =====
  function uid(){
    return String(Date.now()) + String(Math.floor(Math.random() * 100000));
  }

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

  function nowStamp(){
    const d = new Date();
    return d.toLocaleString();
  }

  function escapeHTML(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // ===== DEMO GATE =====
  function isDemoUnlocked(){
    return getKey(STORE_KEYS.demoGate, false) === true;
  }

  function unlockDemo(password){
    if(String(password || "").trim().toLowerCase() === DEMO_PASSWORD){
      setKey(STORE_KEYS.demoGate, true);
      return true;
    }
    return false;
  }

  // ===== AUTH =====
  function isAuthed(){
    return !!getKey(STORE_KEYS.auth, null);
  }

  function login(email, password){
    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    if(email === FSS_LOGIN_EMAIL && password === FSS_LOGIN_PASS){
      setKey(STORE_KEYS.auth, { email, at: Date.now() });
      logAudit("Login successful");
      return true;
    }
    return false;
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    // keep doc state for demo continuity
    logAudit("Logged out");
  }

  function guard(){
    // demo gate
    if(!isDemoUnlocked()){
      const p = location.pathname.toLowerCase();
      const okOnIndex = p.endsWith("/index.html") || p.endsWith("/fss/") || p.endsWith("/fss/index.html") || p.endsWith("/fillsignsend/index.html");
      if(!okOnIndex){
        location.href = "index.html";
        return;
      }
    }

    // auth
    if(!isAuthed()){
      const p = location.pathname.toLowerCase();
      if(!p.endsWith("/index.html")){
        location.href = "index.html";
      }
    }
  }

  // ===== DOC STATE =====
  function defaultDoc(){
    return {
      id: "ENV-" + uid().slice(-8),
      createdAt: new Date().toISOString(),
      status: "draft", // draft -> signed_by_sender -> sent -> completed
      templateMode: "template", // template | upload | builder
      template: "nda.pdf",

      // upload support
      uploadName: null,
      uploadB64: null, // raw pdf bytes base64 (no data: prefix)

      // builder support
      builderTitle: "Confidential Agreement",
      builderClauses: [],

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
    const doc = defaultDoc();
    saveDocState(doc);
    setKey(STORE_KEYS.fields, []);
    setKey(STORE_KEYS.values, {});
    removeKey(STORE_KEYS.signed);
    setKey(STORE_KEYS.audit, []);
    logAudit("Envelope created");
    return doc;
  }

  function setDocStatus(status){
    const doc = loadDocState() || defaultDoc();
    doc.status = status;
    saveDocState(doc);
    logAudit(`Status updated: ${status}`);
    return doc;
  }

  // ===== FIELDS + VALUES =====
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

  // ===== AUDIT =====
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

  // ===== SIGNED PDF STORAGE =====
  function setSignedBase64(b64){
    setKey(STORE_KEYS.signed, { b64, at: Date.now() });
  }

  function getSignedBase64(){
    const obj = getKey(STORE_KEYS.signed, null);
    return obj?.b64 || null;
  }

  function hasSignedPDF(){
    return !!getSignedBase64();
  }

  // ===== PDF HELPERS =====
  async function fetchAsArrayBuffer(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error("Failed to fetch PDF: " + url);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer){
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for(let i=0; i<bytes.length; i+=chunk){
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
    }
    return btoa(binary);
  }

  function base64ToBlobURL(b64){
    const byteChars = atob(b64);
    const bytes = new Uint8Array(byteChars.length);
    for(let i=0; i<byteChars.length; i++){
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type:"application/pdf" });
    return URL.createObjectURL(blob);
  }

  // Returns a URL usable inside <iframe>
  function getCurrentPDFURL(){
    const doc = loadDocState();
    if(!doc) return null;

    if(doc.templateMode === "upload" && doc.uploadB64){
      const url = base64ToBlobURL(doc.uploadB64);
      return url;
    }

    if(doc.templateMode === "builder"){
      // builder produces a PDF and stores it in uploadB64
      if(doc.uploadB64){
        const url = base64ToBlobURL(doc.uploadB64);
        return url;
      }
      return null;
    }

    // template mode
    const name = doc.template || "nda.pdf";
    return `pdfs/${encodeURIComponent(name)}`;
  }

  // ===== BUILDER: CREATE PDF FROM SCRATCH =====
  async function generateBuilderPDF(){
    if(!window.PDFLib){
      throw new Error("pdf-lib not loaded");
    }

    const docState = loadDocState() || defaultDoc();
    const title = docState.builderTitle || "Confidential Agreement";
    const clauses = Array.isArray(docState.builderClauses) ? docState.builderClauses : [];
    const parties = docState.parties || {};

    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 54;
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();

    let y = height - margin;

    function drawText(text, opts = {}){
      const size = opts.size || 12;
      const f = opts.bold ? fontBold : font;
      const color = opts.color || rgb(0,0,0);
      page.drawText(text, { x: margin, y, size, font: f, color });
      y -= size + (opts.gap ?? 10);
    }

    drawText(title, { size: 22, bold: true, gap: 14 });
    drawText("Generated Agreement (Demo)", { size: 12, gap: 18, color: rgb(0.2,0.2,0.2) });

    const pA = `${parties.aName || "Party A"} (${parties.aEmail || "—"})`;
    const pB = `${parties.bName || "Party B"} (${parties.bEmail || "—"})`;

    drawText(`Party A: ${pA}`, { size: 12, gap: 8, bold: true });
    drawText(`Party B: ${pB}`, { size: 12, gap: 18, bold: true });

    drawText("Selected Clauses:", { size: 14, bold: true, gap: 10 });

    // Basic wrapping
    function wrap(text, maxChars){
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for(const w of words){
        const next = line ? (line + " " + w) : w;
        if(next.length > maxChars){
          if(line) lines.push(line);
          line = w;
        }else{
          line = next;
        }
      }
      if(line) lines.push(line);
      return lines;
    }

    const maxChars = 90;
    let idx = 1;

    for(const clause of clauses){
      const heading = `${idx}. ${clause.title}`;
      const lines = wrap(clause.text, maxChars);

      // page break
      if(y < 120){
        const np = pdfDoc.addPage([612,792]);
        y = 792 - margin;
        // (simple) swap page reference for drawText
        page.drawText("", { x: 0, y: 0, size: 1, font }); // no-op to avoid lint
      }

      page.drawText(heading, { x: margin, y, size: 12, font: fontBold, color: rgb(0,0,0) });
      y -= 18;

      for(const ln of lines){
        page.drawText(ln, { x: margin, y, size: 11, font, color: rgb(0,0,0) });
        y -= 15;
        if(y < 120) break;
      }

      y -= 10;
      idx++;
    }

    // Signature block
    if(y < 170){
      pdfDoc.addPage([612,792]);
    }

    const lastPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
    lastPage.drawText("SIGNATURES", { x: margin, y: 140, size: 13, font: fontBold, color: rgb(0,0,0) });
    lastPage.drawText("Party A: ________________________________    Date: ____________", {
      x: margin, y: 110, size: 11, font, color: rgb(0,0,0)
    });
    lastPage.drawText("Party B: ________________________________    Date: ____________", {
      x: margin, y: 88, size: 11, font, color: rgb(0,0,0)
    });

    const bytes = await pdfDoc.save();
    const b64 = arrayBufferToBase64(bytes.buffer);

    // store as uploadB64 so viewer/sign uses it
    docState.templateMode = "builder";
    docState.uploadName = `${title.replace(/\s+/g,"-").toLowerCase()}.pdf`;
    docState.uploadB64 = b64;
    saveDocState(docState);

    logAudit("Agreement built from scratch (PDF generated).");
    return true;
  }

  // ===== SIGNED PDF GENERATOR =====
  // Requires pdf-lib loaded on the page calling this.
  async function generateSignedPDF(){
    if(!window.PDFLib){
      console.error("pdf-lib not loaded");
      return false;
    }

    const docState = loadDocState();
    if(!docState) return false;

    try{
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      // Load the correct PDF source (template or uploaded/builder)
      let sourceBytes;

      if(docState.templateMode === "upload" || docState.templateMode === "builder"){
        if(!docState.uploadB64){
          console.error("No uploaded/builder pdf available");
          return false;
        }
        const url = base64ToBlobURL(docState.uploadB64);
        sourceBytes = await fetchAsArrayBuffer(url);
      } else {
        const templateName = docState.template || "nda.pdf";
        sourceBytes = await fetchAsArrayBuffer(`pdfs/${encodeURIComponent(templateName)}`);
      }

      const pdfDoc = await PDFDocument.load(sourceBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      const senderName = docState.parties?.aName || "Sender";
      const recipientName = docState.parties?.bName || "Recipient";

      const signedAt = new Date().toLocaleString();

      // Draw a simple "signature" + date at bottom
      lastPage.drawRectangle({
        x: 54, y: 54,
        width: width - 108,
        height: 72,
        color: rgb(0,0,0),
        opacity: 0.04
      });

      lastPage.drawText("Signed via Demo Workflow", {
        x: 64, y: 108,
        size: 12,
        font: fontBold,
        color: rgb(0.1,0.1,0.1)
      });

      lastPage.drawText(`Sender: ${senderName}`, {
        x: 64, y: 88,
        size: 11,
        font,
        color: rgb(0.15,0.15,0.15)
      });

      lastPage.drawText(`Recipient: ${recipientName}`, {
        x: 64, y: 72,
        size: 11,
        font,
        color: rgb(0.15,0.15,0.15)
      });

      lastPage.drawText(`Timestamp: ${signedAt}`, {
        x: 64, y: 58,
        size: 10,
        font,
        color: rgb(0.25,0.25,0.25)
      });

      // Footer
      lastPage.drawText("© Signed in-browser demo", {
        x: width - 220,
        y: 18,
        size: 9,
        font,
        color: rgb(0.35,0.35,0.35),
        opacity: 0.85
      });

      const signedBytes = await pdfDoc.save();
      const signedB64 = arrayBufferToBase64(signedBytes.buffer);

      setSignedBase64(signedB64);
      setDocStatus("signed_by_sender");
      logAudit("Signed PDF generated.");

      return true;
    }catch(err){
      console.error("generateSignedPDF error:", err);
      return false;
    }
  }

  // ===== PUBLIC API =====
  return {
    // config
    DEMO_PASSWORD,
    FSS_LOGIN_EMAIL,
    FSS_LOGIN_PASS,

    // gate/auth
    isDemoUnlocked,
    unlockDemo,
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

    // fields/values
    loadFields,
    saveFields,
    loadValues,
    saveValues,
    setFieldValue,
    getFieldValue,

    // audit
    loadAudit,
    logAudit,

    // signed
    hasSignedPDF,
    getSignedBase64,

    // pdf helpers
    uid,
    escapeHTML,
    getCurrentPDFURL,
    base64ToBlobURL,
    generateBuilderPDF,
    generateSignedPDF
  };
})();
