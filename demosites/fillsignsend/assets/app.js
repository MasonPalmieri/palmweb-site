/* ============================================================
   FSS Demo App — assets/app.js
   - Auth + routing guard
   - Doc state + audit
   - Template + custom + builder PDFs
   - Field placement + drag + edit
   - Generate signed PDF (pdf-lib)
============================================================ */

(function(){
  const KEY_AUTH = "fss_auth";
  const KEY_DEMOS = "fss_demos_access";
  const KEY_DOC = "fss_doc";
  const KEY_FIELDS = "fss_fields";
  const KEY_SIGNED = "fss_signed_pdf_b64";
  const KEY_CUSTOMPDF = "fss_custom_pdf_b64";
  const KEY_BUILDERPDF = "fss_builder_pdf_b64";
  const KEY_AUDIT = "fss_audit";

  // Use ONE login credential for the demo app itself.
  const DEMO_USER = { email:"demo@client.com", pass:"demo123" };

  // Templates available in /pdfs
  const TEMPLATE_LIST = [
    "nda.pdf",
    "consulting_agreement.pdf",
    "non-compete-agreement.pdf",
    "real-estate-agreement.pdf",
    "lease-waiver.pdf",
    "event-accident-waiver.pdf",
    "Photo-Release.pdf"
  ];

  function nowISO(){
    return new Date().toISOString();
  }

  function uid(){
    return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  }

  function safeJSONParse(v){
    try{ return JSON.parse(v); }catch{ return null; }
  }

  function save(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function load(key, fallback=null){
    const raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    const parsed = safeJSONParse(raw);
    return parsed == null ? fallback : parsed;
  }

  function saveRaw(key, str){
    localStorage.setItem(key, str);
  }

  function loadRaw(key){
    return localStorage.getItem(key);
  }

  function remove(key){
    localStorage.removeItem(key);
  }

  function logAudit(message){
    const audit = load(KEY_AUDIT, []);
    audit.unshift({
      id: uid(),
      at: nowISO(),
      message
    });
    save(KEY_AUDIT, audit.slice(0, 100));
  }

  function getAudit(){
    return load(KEY_AUDIT, []);
  }

  /* =======================
     DEMO LOCK (Main site)
  ======================= */
  function demoAccessGranted(){
    return load(KEY_DEMOS, false) === true;
  }
  function grantDemoAccess(){
    save(KEY_DEMOS, true);
  }

  /* =======================
     AUTH (FSS App)
  ======================= */
  function login(email, pass){
    email = (email || "").trim();
    pass = (pass || "").trim();

    if(email === DEMO_USER.email && pass === DEMO_USER.pass){
      save(KEY_AUTH, { email, at: nowISO() });
      logAudit("Logged in to demo app.");
      return { ok:true };
    }
    return { ok:false, error:"Invalid demo credentials." };
  }

  function logout(){
    remove(KEY_AUTH);
    logAudit("Logged out.");
  }

  function isAuthed(){
    const a = load(KEY_AUTH, null);
    return !!(a && a.email);
  }

  function guard(){
    if(!isAuthed()){
      // prevent redirect loop
      const path = location.pathname.toLowerCase();
      if(!path.endsWith("/index.html") && !path.endsWith("/index")){
        location.href = "index.html";
      }
    }
  }

  /* =======================
     DOC STATE
  ======================= */
  function defaultDoc(){
    return {
      id: uid(),
      createdAt: nowISO(),
      status: "draft", // draft | sent | completed
      source: "template", // template | custom | builder
      template: "nda.pdf",
      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: ""
      }
    };
  }

  function loadDocState(){
    return load(KEY_DOC, null);
  }

  function saveDocState(doc){
    save(KEY_DOC, doc);
  }

  function resetDoc(){
    saveDocState(defaultDoc());
    saveFields([]);
    clearSignedPDF();
    clearCustomPDF();
    clearBuilderPDF();
    logAudit("New envelope created.");
  }

  /* =======================
     PDF STORAGE
  ======================= */
  function setSignedBase64(b64){
    saveRaw(KEY_SIGNED, b64);
  }

  function getSignedBase64(){
    return loadRaw(KEY_SIGNED);
  }

  function hasSignedPDF(){
    return !!getSignedBase64();
  }

  function clearSignedPDF(){
    remove(KEY_SIGNED);
  }

  function setCustomPdfBase64(b64){
    saveRaw(KEY_CUSTOMPDF, b64);
  }

  function getCustomPdfBase64(){
    return loadRaw(KEY_CUSTOMPDF);
  }

  function clearCustomPDF(){
    remove(KEY_CUSTOMPDF);
  }

  function setBuilderPdfBase64(b64){
    saveRaw(KEY_BUILDERPDF, b64);
  }

  function getBuilderPdfBase64(){
    return loadRaw(KEY_BUILDERPDF);
  }

  function clearBuilderPDF(){
    remove(KEY_BUILDERPDF);
  }

  function base64ToUint8(b64){
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function uint8ToBase64(bytes){
    let binary = "";
    for(let i=0; i<bytes.length; i++){
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBlobURL(b64){
    const bytes = base64ToUint8(b64);
    const blob = new Blob([bytes], { type:"application/pdf" });
    return URL.createObjectURL(blob);
  }

  async function fileToBase64(file){
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    return uint8ToBase64(bytes);
  }

  /* =======================
     FIELDS (click/drag/edit)
     We store fields in NORMALIZED coordinates:
     - page: always 1 for this demo
     - nx, ny, nw, nh are 0..1 relative to the CANVAS size
     - value is user-editable content
  ======================= */

  function loadFields(){
    return load(KEY_FIELDS, []);
  }

  function saveFields(fields){
    save(KEY_FIELDS, fields);
  }

  function addField(field){
    const fields = loadFields();
    fields.push(field);
    saveFields(fields);
  }

  function updateField(fieldId, patch){
    const fields = loadFields();
    const idx = fields.findIndex(f => f.id === fieldId);
    if(idx < 0) return;
    fields[idx] = { ...fields[idx], ...patch };
    saveFields(fields);
  }

  function removeField(fieldId){
    const fields = loadFields().filter(f => f.id !== fieldId);
    saveFields(fields);
  }

  /* =======================
     PDF SOURCE SELECTION
  ======================= */

  async function getPdfBytesForSigning(){
    // Priorities for signing:
    // - If signed already exists: sign again should re-generate from ORIGINAL source, not the signed copy.
    // - If source is builder: use builder base64
    // - If source is custom: use custom base64
    // - Else template: fetch from /pdfs
    const doc = loadDocState();
    if(!doc) throw new Error("No doc state.");

    if(doc.source === "builder"){
      const b64 = getBuilderPdfBase64();
      if(!b64) throw new Error("Builder PDF missing.");
      return base64ToUint8(b64);
    }

    if(doc.source === "custom"){
      const b64 = getCustomPdfBase64();
      if(!b64) throw new Error("Custom PDF missing.");
      return base64ToUint8(b64);
    }

    const template = doc.template || "nda.pdf";
    const res = await fetch(`pdfs/${encodeURIComponent(template)}`, { cache:"no-store" });
    if(!res.ok) throw new Error("Template PDF missing in /pdfs.");
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  async function getPdfBytesForViewer(){
    // Priorities for viewer:
    // 1) signed
    // 2) custom/builder
    // 3) template
    const doc = loadDocState();
    if(!doc) throw new Error("No doc state.");

    if(hasSignedPDF()){
      return base64ToUint8(getSignedBase64());
    }

    if(doc.source === "builder"){
      const b64 = getBuilderPdfBase64();
      if(!b64) throw new Error("Builder PDF missing.");
      return base64ToUint8(b64);
    }

    if(doc.source === "custom"){
      const b64 = getCustomPdfBase64();
      if(!b64) throw new Error("Custom PDF missing.");
      return base64ToUint8(b64);
    }

    const template = doc.template || "nda.pdf";
    const res = await fetch(`pdfs/${encodeURIComponent(template)}`, { cache:"no-store" });
    if(!res.ok) throw new Error("Template PDF missing in /pdfs.");
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  function getViewerLabel(){
    const doc = loadDocState();
    if(!doc) return "—";

    if(hasSignedPDF()) return "Signed PDF";
    if(doc.source === "builder") return "Scratch-built PDF";
    if(doc.source === "custom") return "Custom PDF";
    return doc.template || "Template";
  }

  /* =======================
     SIGNING (pdf-lib)
     Embed placed fields into the real PDF.
  ======================= */

  function ensurePdfLib(){
    if(typeof PDFLib === "undefined"){
      throw new Error("pdf-lib not found. Make sure pdf-lib script is loaded.");
    }
  }

  function fontSizeForBox(text, w, h){
    // Very basic auto sizing
    const base = 16;
    const min = 9;
    const max = 20;

    const len = (text || "").length || 1;
    const approx = Math.min(max, Math.max(min, base - Math.floor(len / 12)));
    return Math.min(approx, Math.floor(h * 0.55));
  }

  async function generateSignedPDF(){
    try{
      ensurePdfLib();

      const docState = loadDocState();
      if(!docState) return { ok:false, error:"No doc state found." };

      if(!docState.parties?.aName || !docState.parties?.bName){
        return { ok:false, error:"Missing sender/recipient details. Go to Create first." };
      }

      // If no fields exist, we auto-create sender signature + date + recipient signature
      let fields = loadFields();
      if(!fields || fields.length === 0){
        fields = [
          {
            id: uid(),
            type:"signature",
            role:"sender",
            page:1,
            nx: 0.62, ny: 0.78, nw: 0.28, nh: 0.06,
            value: docState.parties.aName
          },
          {
            id: uid(),
            type:"date",
            role:"sender",
            page:1,
            nx: 0.62, ny: 0.86, nw: 0.28, nh: 0.05,
            value: new Date().toLocaleDateString()
          },
          {
            id: uid(),
            type:"signature",
            role:"recipient",
            page:1,
            nx: 0.12, ny: 0.78, nw: 0.30, nh: 0.06,
            value: docState.parties.bName
          }
        ];
        saveFields(fields);
        logAudit("Auto-placed default signature/date fields.");
      }

      // Sender actions: fill missing sender fields
      const today = new Date().toLocaleDateString();
      fields = fields.map(f => {
        if(f.type === "signature" && f.role === "sender" && (!f.value || f.value === "Signature")){
          return { ...f, value: docState.parties.aName };
        }
        if(f.type === "date" && f.role === "sender" && (!f.value || f.value === "Date")){
          return { ...f, value: today };
        }
        return f;
      });

      saveFields(fields);

      const bytes = await getPdfBytesForSigning();
      const pdfDoc = await PDFLib.PDFDocument.load(bytes);

      const pages = pdfDoc.getPages();
      const page = pages[0];
      const { width, height } = page.getSize();

      const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      // Draw each field onto the PDF
      for(const f of fields){
        const x = f.nx * width;
        const yTop = f.ny * height;
        const w = f.nw * width;
        const h = f.nh * height;

        // PDF coordinates origin bottom-left.
        // Our ny is from TOP of page, so convert:
        const y = height - yTop - h;

        // box
        page.drawRectangle({
          x, y,
          width: w,
          height: h,
          borderColor: PDFLib.rgb(0.13, 0.47, 0.78),
          borderWidth: 1,
          color: PDFLib.rgb(0.97, 0.98, 1)
        });

        const text = (f.value || "").trim() || (f.type === "date" ? "Date" : (f.type === "signature" ? "Signature" : "Text"));
        const size = fontSizeForBox(text, w, h);

        const isSig = f.type === "signature";
        const font = isSig ? helveticaBold : helvetica;

        page.drawText(text, {
          x: x + 8,
          y: y + Math.max(6, (h - size) / 2),
          size,
          font,
          color: PDFLib.rgb(0.05, 0.09, 0.16)
        });

        // tiny label
        const label = f.type.toUpperCase();
        page.drawText(label, {
          x: x + 6,
          y: y + h - 12,
          size: 7.5,
          font: helvetica,
          color: PDFLib.rgb(0.25, 0.35, 0.45)
        });
      }

      const out = await pdfDoc.save();
      setSignedBase64(uint8ToBase64(out));

      // Update doc status if needed
      const ds = loadDocState();
      if(ds && ds.status === "draft"){
        ds.status = "draft"; // stays draft until "Send"
        saveDocState(ds);
      }

      return { ok:true };
    }catch(err){
      console.error(err);
      return { ok:false, error: (err && err.message) ? err.message : "Signing failed." };
    }
  }

  /* =======================
     PUBLIC API
  ======================= */
  window.FSS = {
    // Demo gate (main site)
    demoAccessGranted,
    grantDemoAccess,

    // Auth
    login,
    logout,
    isAuthed,
    guard,

    // Doc state
    uid,
    resetDoc,
    loadDocState,
    saveDocState,

    // Audit
    logAudit,
    getAudit,

    // Fields
    loadFields,
    saveFields,
    addField,
    updateField,
    removeField,

    // PDFs
    TEMPLATE_LIST,
    fileToBase64,
    setCustomPdfBase64,
    getCustomPdfBase64,
    setBuilderPdfBase64,
    getBuilderPdfBase64,
    clearCustomPDF,
    clearBuilderPDF,

    setSignedBase64,
    getSignedBase64,
    hasSignedPDF,
    clearSignedPDF,

    base64ToUint8,
    uint8ToBase64,
    base64ToBlobURL,

    getPdfBytesForViewer,
    getPdfBytesForSigning,
    getViewerLabel,

    // Signing
    generateSignedPDF
  };
})();
