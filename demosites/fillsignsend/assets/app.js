/* ============================================================
   FSS Demo App — app.js (FULL UPDATED)
   Static demo for GitHub Pages.
   Uses localStorage + pdf-lib (loaded only on sign.html).
   ============================================================ */

window.FSS = (() => {
  // ===== CONFIG =====
  const DEMO_PASSWORD = "hallam";              // demo gate password
  const FSS_LOGIN_EMAIL = "demo@client.com";   // login credential for FSS
  const FSS_LOGIN_PASS  = "hallam";            // login credential for FSS

  // ===== STORAGE KEYS =====
  const K = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    audit: "fss_audit",
    signed: "fss_signed",
  };

  // ============================================================
  // Helpers
  // ============================================================

  function escape(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function now(){
    return new Date().toLocaleString();
  }

  function uid(){
    return "F-" + Math.random().toString(16).slice(2, 10).toUpperCase();
  }

  function set(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }
  function get(key, fallback=null){
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function setStr(key, val){
    localStorage.setItem(key, val);
  }
  function getStr(key){
    return localStorage.getItem(key);
  }

  // ============================================================
  // Demo Password Gate
  // ============================================================

  function isDemoUnlocked(){
    return get(K.demoGate, false) === true;
  }

  function unlockDemo(password){
    if((password || "").trim().toLowerCase() === DEMO_PASSWORD){
      set(K.demoGate, true);
      return true;
    }
    return false;
  }

  // ============================================================
  // Auth
  // ============================================================

  function isAuthed(){
    const a = get(K.auth, null);
    return a && a.ok === true;
  }

  function login(email, pass){
    const e = (email || "").trim().toLowerCase();
    const p = (pass || "").trim();

    if(e === FSS_LOGIN_EMAIL && p === FSS_LOGIN_PASS){
      set(K.auth, { ok:true, email:e, at: Date.now() });
      return true;
    }
    return false;
  }

  function logout(){
    localStorage.removeItem(K.auth);
  }

  function guard(){
    // For pages inside demosites/fillsignsend/
    if(!isAuthed()){
      const here = location.pathname.toLowerCase();
      if(!here.endsWith("/index.html") && !here.endsWith("/index")){
        location.href = "index.html";
      }
    }
  }

  // ============================================================
  // Document State
  // ============================================================

  function defaultDoc(){
    return {
      id: "ENV-" + Math.random().toString(16).slice(2, 10).toUpperCase(),
      createdAt: Date.now(),
      template: "nda.pdf",
      status: "draft",      // draft | sent | completed
      stage: "sender",      // sender | recipient
      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: ""
      }
    };
  }

  function loadDocState(){
    return get(K.doc, null);
  }

  function saveDocState(doc){
    set(K.doc, doc);
  }

  function resetDoc(){
    saveDocState(defaultDoc());
    saveFields([]);
    set(K.audit, []);
    localStorage.removeItem(K.signed);
  }

  function setDocStage(stage){
    const d = loadDocState() || defaultDoc();
    d.stage = stage;
    saveDocState(d);
  }

  function setDocStatus(status){
    const d = loadDocState() || defaultDoc();
    d.status = status;
    saveDocState(d);
  }

  // ============================================================
  // Fields
  // Each field:
  // { id, type, page, x, y, w, h, value, required, label, role }
  // ============================================================

  function loadFields(){
    return get(K.fields, []);
  }

  function saveFields(fields){
    set(K.fields, fields || []);
  }

  function setFieldValue(type, value){
    const fields = loadFields() || [];
    const ix = fields.findIndex(f => f.type === type);
    if(ix === -1) return false;

    fields[ix].value = value;
    saveFields(fields);
    return true;
  }

  // ============================================================
  // Audit
  // ============================================================

  function loadAudit(){
    return get(K.audit, []);
  }

  function logAudit(message){
    const audit = loadAudit();
    const doc = loadDocState();
    audit.unshift({
      at: now(),
      env: doc?.id || "—",
      msg: message
    });
    set(K.audit, audit);
  }

  // ============================================================
  // File helpers
  // ============================================================

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

  // ============================================================
  // PDF Signing (pdf-lib)
  // ============================================================

  function mapFieldToPdfCoords(field, overlayWidth, overlayHeight, pdfW, pdfH){
    // Convert overlay pixels into normalized ratios
    const xNorm = field.x / overlayWidth;
    const yNorm = field.y / overlayHeight;
    const wNorm = field.w / overlayWidth;
    const hNorm = field.h / overlayHeight;

    // PDF coordinates are bottom-left based
    const x = xNorm * pdfW;
    const yTop = yNorm * pdfH;
    const y = pdfH - yTop - (hNorm * pdfH);

    return {
      x,
      y,
      boxW: wNorm * pdfW,
      boxH: hNorm * pdfH
    };
  }

  async function generateSignedPDF(){
    try{
      if(!window.PDFLib){
        console.error("pdf-lib is not loaded. Add script tag to sign.html.");
        return false;
      }

      const docState = loadDocState();
      if(!docState || !docState.template){
        console.error("No doc state / template.");
        return false;
      }

      const fields = loadFields();
      if(!fields || fields.length === 0){
        console.error("No fields to apply.");
        return false;
      }

      // Fetch PDF template
      const templateUrl = `pdfs/${docState.template}`;
      const templateBytes = await fetchAsArrayBuffer(templateUrl);

      // Load into pdf-lib
      const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
      const page = pdfDoc.getPage(0);

      const { width: pdfW, height: pdfH } = page.getSize();

      // We need overlay dimensions. If overlay element exists, use it.
      // If not (rare), fallback to a known size.
      const overlayEl = document.getElementById("overlay");
      let overlayW = 800;
      let overlayH = 1000;

      if(overlayEl){
        const r = overlayEl.getBoundingClientRect();
        overlayW = Math.max(1, r.width);
        overlayH = Math.max(1, r.height);
      }

      // Fonts
      const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      // Draw each field
      for(const f of fields){
        const value = (f.value || "").trim();
        if(!value) continue;

        const { x, y, boxW, boxH } = mapFieldToPdfCoords(f, overlayW, overlayH, pdfW, pdfH);

        // Box background for readability
        page.drawRectangle({
          x,
          y,
          width: boxW,
          height: boxH,
          color: PDFLib.rgb(1, 1, 1),
          opacity: 0.92,
          borderColor: PDFLib.rgb(0.2, 0.45, 1),
          borderWidth: 1,
        });

        // Label
        page.drawText((f.label || f.type).toUpperCase(), {
          x: x + 5,
          y: y + boxH - 10,
          size: 7,
          font: helvBold,
          color: PDFLib.rgb(0.15, 0.2, 0.35),
          opacity: 0.75
        });

        // Value formatting
        let drawValue = value;
        let font = helv;
        let fontSize = 12;

        if(f.type === "signature"){
          font = helvBold;
          fontSize = 16;
        }

        if(f.type === "checkbox"){
          const checked = ["true","yes","1","checked"].includes(value.toLowerCase());
          drawValue = checked ? "☑" : "☐";
          font = helvBold;
          fontSize = 18;
        }

        page.drawText(drawValue, {
          x: x + 8,
          y: y + (boxH / 2) - (fontSize / 2) + 2,
          size: fontSize,
          font,
          color: PDFLib.rgb(0.05, 0.1, 0.2)
        });
      }

      // Footer stamp
      const stamp = `Completed via FSS Demo — ${now()}`;
      page.drawText(stamp, {
        x: 40,
        y: 22,
        size: 9,
        font: helv,
        color: PDFLib.rgb(0.35, 0.35, 0.4),
        opacity: 0.9
      });

      // Save to bytes + store base64
      const signedBytes = await pdfDoc.save();
      const b64 = arrayBufferToBase64(signedBytes);
      setStr(K.signed, b64);

      return true;
    }catch(err){
      console.error("generateSignedPDF failed:", err);
      return false;
    }
  }

  // ============================================================
  // Signed PDF Access
  // ============================================================

  function getSignedBase64(){
    return getStr(K.signed);
  }

  function hasSignedPDF(){
    return !!getStr(K.signed);
  }

  // ============================================================
  // Public API
  // ============================================================

  return {
    // config
    DEMO_PASSWORD,
    FSS_LOGIN_EMAIL,
    FSS_LOGIN_PASS,

    // helpers
    escape,
    uid,

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
    setDocStage,
    setDocStatus,

    // fields + audit
    loadFields,
    saveFields,
    setFieldValue,
    loadAudit,
    logAudit,

    // pdf
    generateSignedPDF,
    getSignedBase64,
    hasSignedPDF,
  };
})();
