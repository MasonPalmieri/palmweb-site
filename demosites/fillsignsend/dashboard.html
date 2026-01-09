/* ============================================================
   FSS Demo App — app.js
   Static, works on GitHub Pages. No backend.
   Uses localStorage + pdf-lib (loaded only on sign.html).
   ============================================================ */

window.FSS = (() => {
  // ===== CONFIG =====
  const DEMO_PASSWORD = "hallam";              // demos.html / main demo gate
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

  // ===== HELPERS =====
  function escape(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function now(){
    const d = new Date();
    return d.toLocaleString();
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

  // ===== DEMO PASSWORD GATE =====
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

  // ===== AUTH =====
  function isAuthed(){
    return get(K.auth, null) && get(K.auth).ok === true;
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
    // do NOT wipe demo gate password
    // optional: keep doc + signed pdf for demo continuity
  }

  function guard(){
    // for pages inside demosites/fillsignsend/
    if(!isAuthed()){
      // If user is not authenticated, bounce to index
      const here = location.pathname.toLowerCase();
      if(!here.endsWith("/index.html") && !here.endsWith("/index")){
        location.href = "index.html";
      }
    }
  }

  // ===== DOC STATE =====
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
      },
      meta: {
        subject: "Agreement Signature Request",
        message: "Please review and sign."
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

  // ===== FIELDS =====
  function loadFields(){
    return get(K.fields, []);
  }

  function saveFields(fields){
    set(K.fields, fields || []);
  }

  // ===== AUDIT =====
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

  // ===== FILE UTILS =====
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
  // ✅ PDF SIGNING / PDF FIELD WRITING (pdf-lib)
  // Requires pdf-lib loaded on sign.html:
  // <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  // ============================================================

  function mapOverlayToPdfCoords(overlayEl, field){
    // overlay top-left = (0,0)
    // pdf-lib uses bottom-left = (0,0)
    const rect = overlayEl.getBoundingClientRect();

    // Convert from overlay pixel coords to normalized
    const xNorm = field.x / rect.width;
    const yNorm = field.y / rect.height;
    const wNorm = field.w / rect.width;
    const hNorm = field.h / rect.height;

    return { xNorm, yNorm, wNorm, hNorm };
  }

  async function generateSignedPDF(){
    try{
      // Ensure pdf-lib exists
      if(!window.PDFLib){
        console.error("pdf-lib not loaded.");
        return false;
      }

      const docState = loadDocState();
      if(!docState || !docState.template){
        console.error("No doc state / template.");
        return false;
      }

      const fields = loadFields();

      // Fetch the actual PDF template
      const templateUrl = `pdfs/${docState.template}`;
      const templateBytes = await fetchAsArrayBuffer(templateUrl);

      // Load it into pdf-lib
      const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);

      // We'll write on page 1 for demo. (You can extend to multi-page later)
      const pageIndex = 0;
      const page = pdfDoc.getPage(pageIndex);

      // Measure page size
      const { width: pdfW, height: pdfH } = page.getSize();

      // Overlay DOM size (needed to map pixels → PDF points)
      const overlayEl = document.getElementById("overlay");
      if(!overlayEl){
        console.error("overlay element missing.");
        return false;
      }

      // Font
      const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      // Draw each field value onto PDF
      for(const f of fields){
        const val = (f.value || "").trim();
        if(!val) continue;

        // Map overlay pixels into PDF coordinates
        const { xNorm, yNorm, wNorm, hNorm } = mapOverlayToPdfCoords(overlayEl, f);

        const x = xNorm * pdfW;
        const yTop = yNorm * pdfH;

        // Convert overlay top-left to PDF bottom-left
        const y = pdfH - yTop - (hNorm * pdfH);

        const boxW = wNorm * pdfW;
        const boxH = hNorm * pdfH;

        // Draw a subtle border box (looks DocuSign-ish)
        page.drawRectangle({
          x,
          y,
          width: boxW,
          height: boxH,
          borderColor: PDFLib.rgb(0.2, 0.45, 1),
          borderWidth: 1,
          color: PDFLib.rgb(1,1,1),
          opacity: 0.02
        });

        // Field label
        page.drawText(f.type.toUpperCase(), {
          x: x + 4,
          y: y + boxH - 10,
          size: 7,
          font: helvBold,
          color: PDFLib.rgb(0.1, 0.2, 0.4),
          opacity: 0.7
        });

        // Field content
        let drawValue = val;
        let fontSize = 12;
        let font = helv;

        if(f.type === "signature"){
          // mimic signature feel
          fontSize = 16;
          font = helvBold;
        }
        if(f.type === "date"){
          fontSize = 12;
          font = helv;
        }
        if(f.type === "checkbox"){
          drawValue = (val.toLowerCase() === "true" || val.toLowerCase() === "yes" || val === "1") ? "☑" : "☐";
          fontSize = 18;
          font = helvBold;
        }

        page.drawText(drawValue, {
          x: x + 8,
          y: y + (boxH / 2) - (fontSize / 2) + 2,
          size: fontSize,
          font,
          color: PDFLib.rgb(0.05, 0.1, 0.2)
        });
      }

      // Add a footer stamp to show it was completed
      const stampText = `Completed via FSS Demo — ${now()}`;
      page.drawText(stampText, {
        x: 40,
        y: 25,
        size: 9,
        font: helv,
        color: PDFLib.rgb(0.3, 0.3, 0.35),
        opacity: 0.9
      });

      // Save PDF bytes
      const signedBytes = await pdfDoc.save();

      // Store base64 so success.html can display it
      const b64 = arrayBufferToBase64(signedBytes);
      setStr(K.signed, b64);

      return true;
    }catch(err){
      console.error(err);
      return false;
    }
  }

  // ===== DASHBOARD / STATUS HELPERS =====
  function getSignedBase64(){
    return getStr(K.signed);
  }

  function hasSignedPDF(){
    return !!getStr(K.signed);
  }

  // ===== PUBLIC API =====
  return {
    // config access (optional)
    DEMO_PASSWORD,
    FSS_LOGIN_EMAIL,
    FSS_LOGIN_PASS,

    // demo gate
    isDemoUnlocked,
    unlockDemo,

    // auth
    isAuthed,
    login,
    logout,
    guard,

    // state
    defaultDoc,
    loadDocState,
    saveDocState,
    resetDoc,
    setDocStage,
    setDocStatus,

    // fields + audit
    loadFields,
    saveFields,
    loadAudit,
    logAudit,

    // pdf signing
    generateSignedPDF,
    getSignedBase64,
    hasSignedPDF,

    // utils
    escape
  };
})();
