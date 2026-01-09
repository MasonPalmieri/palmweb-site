/* ============================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage.
   Requires pdf-lib loaded on sign.html (window.PDFLib).
============================================================ */

window.FSS = (() => {
  /* =========================
     CONFIG
  ========================= */
  const DEMO_PASSWORD = "hallam";       // demo gate password (optional)
  const DEMO_LOGIN_EMAIL = "demo@client.com";
  const DEMO_LOGIN_PASS  = "hallam";

  const STORE_KEYS = {
    auth:  "fss_auth",
    doc:   "fss_doc",
    fields:"fss_fields",
    values:"fss_values",
    audit: "fss_audit",
    signed:"fss_signed_pdf_b64",
    demoGate: "palmweb_demo_gate",
    customPdf: "fss_custom_pdf_b64"
  };

  /* =========================
     HELPERS
  ========================= */
  function safeJSONParse(str, fallback){
    try { return JSON.parse(str); } catch(e){ return fallback; }
  }

  function getKey(key, fallback){
    const raw = localStorage.getItem(key);
    if(raw === null || raw === undefined) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function setKey(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKey(key){
    localStorage.removeItem(key);
  }

  function nowStamp(){
    return new Date().toLocaleString();
  }

  function uid(){
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function clamp(n, min, max){
    return Math.max(min, Math.min(max, n));
  }

  /* =========================
     AUTH
  ========================= */
  function isAuthed(){
    const auth = getKey(STORE_KEYS.auth, null);
    return !!(auth && auth.email && auth.ok === true);
  }

  function login(email, password){
    const em = String(email || "").trim().toLowerCase();
    const pw = String(password || "").trim();

    // allow demo creds only (static demo)
    if(em === DEMO_LOGIN_EMAIL && pw === DEMO_LOGIN_PASS){
      const auth = { ok:true, email: em, at: Date.now() };
      setKey(STORE_KEYS.auth, auth);
      logAudit(`Login successful (${em}).`);
      return { ok:true };
    }

    return { ok:false, error: "Invalid demo credentials." };
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out.");
  }

  function guard(){
    const path = location.pathname.toLowerCase();
    const onLogin = path.endsWith("/index.html") || path.endsWith("/login.html") || path.endsWith("/");

    if(!isAuthed() && !onLogin){
      // bounce to login
      location.replace("index.html");
      return false;
    }

    // already authed but on login page? send to dashboard
    if(isAuthed() && onLogin){
      location.replace("dashboard.html");
      return true;
    }

    return true;
  }

  /* =========================
     DOC STATE
  ========================= */
  function defaultDoc(){
    return {
      id: "ENV-" + Math.random().toString(36).slice(2,10).toUpperCase(),
      createdAt: new Date().toISOString(),
      template: "nda.pdf",
      source: "template", // "template" | "custom" | "builder"
      status: "draft",    // draft | sent | completed
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
    saveDocState(defaultDoc());
    setKey(STORE_KEYS.fields, []);
    setKey(STORE_KEYS.values, {});
    removeKey(STORE_KEYS.signed);
    removeKey(STORE_KEYS.customPdf);
    logAudit("Envelope reset.");
  }

  /* =========================
     AUDIT
  ========================= */
  function loadAudit(){
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(audit){
    setKey(STORE_KEYS.audit, audit);
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
     FIELDS + VALUES
  ========================= */
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

  function setFieldValue(fieldId, value){
    const values = loadValues();
    values[fieldId] = value;
    saveValues(values);
  }

  function getFieldValue(fieldId){
    const values = loadValues();
    return values[fieldId] || "";
  }

  /* =========================
     SIGNED PDF STORAGE
  ========================= */
  function setSignedBase64(b64){
    setKey(STORE_KEYS.signed, b64);
  }

  function getSignedBase64(){
    return getKey(STORE_KEYS.signed, null);
  }

  function hasSignedPDF(){
    const b64 = getSignedBase64();
    return !!(b64 && typeof b64 === "string" && b64.length > 100);
  }

  /* =========================
     CUSTOM PDF STORAGE
  ========================= */
  function setCustomPdfBase64(b64){
    setKey(STORE_KEYS.customPdf, b64);
  }

  function getCustomPdfBase64(){
    return getKey(STORE_KEYS.customPdf, null);
  }

  /* =========================
     FILE HELPERS
  ========================= */
  async function fetchAsArrayBuffer(url){
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to fetch PDF: ${url}`);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer){
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for(let i=0; i<bytes.length; i+=chunkSize){
      binary += String.fromCharCode(...bytes.subarray(i, i+chunkSize));
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

  /* =========================
     FIELD OVERLAY HTML
  ========================= */
  function overlayFieldToHTML(field, value){
    const v = escapeHtml(value || "");
    const type = escapeHtml(field.type || "");
    const id = escapeHtml(field.id || "");

    const left = `${field.x}px`;
    const top  = `${field.y}px`;
    const width = `${field.w}px`;
    const height= `${field.h}px`;

    const label = (v || type).slice(0,80);

    return `
      <div class="fss-field"
           data-id="${id}"
           style="
             position:absolute;
             left:${left};
             top:${top};
             width:${width};
             height:${height};
             border-radius: 12px;
             border: 2px solid rgba(255,255,255,.18);
             background: rgba(20,20,20,.55);
             color: rgba(255,255,255,.95);
             font-weight: 900;
             font-size: 13px;
             display:flex;
             align-items:center;
             justify-content:center;
             cursor: grab;
             user-select:none;
             box-shadow: 0 10px 28px rgba(0,0,0,.35);
           ">
        <span class="fss-field-label">${label || type}</span>
        <button class="fss-field-x"
                title="Remove"
                style="
                  position:absolute;
                  right:-10px;
                  top:-10px;
                  width: 26px;
                  height:26px;
                  border-radius: 999px;
                  border: 1px solid rgba(255,255,255,.16);
                  background: rgba(0,0,0,.65);
                  color:#fff;
                  font-weight: 900;
                  cursor:pointer;
                ">×</button>
      </div>
    `;
  }

  function enableOverlayEditing(layerEl){
    if(!layerEl) return;

    let dragId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function select(el){
      layerEl.querySelectorAll(".fss-field").forEach(x => x.classList.remove("is-selected"));
      if(el) el.classList.add("is-selected");
    }

    layerEl.addEventListener("mousedown", (e) => {
      const fieldEl = e.target.closest(".fss-field");
      if(!fieldEl) return;

      // remove click
      if(e.target.classList.contains("fss-field-x")){
        const id = fieldEl.getAttribute("data-id");
        const fields = loadFields().filter(f => f.id !== id);
        const values = loadValues();
        delete values[id];
        saveFields(fields);
        saveValues(values);
        logAudit("Removed field.");
        renderLayer(layerEl);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      dragId = fieldEl.getAttribute("data-id");
      const rect = fieldEl.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      fieldEl.style.cursor = "grabbing";
      select(fieldEl);
    });

    window.addEventListener("mousemove", (e) => {
      if(!dragId) return;
      const fields = loadFields();
      const f = fields.find(x => x.id === dragId);
      if(!f) return;

      const parentRect = layerEl.getBoundingClientRect();
      f.x = clamp(Math.round(e.clientX - parentRect.left - dragOffsetX), 0, parentRect.width - f.w);
      f.y = clamp(Math.round(e.clientY - parentRect.top  - dragOffsetY), 0, parentRect.height - f.h);
      saveFields(fields);

      const el = layerEl.querySelector(`.fss-field[data-id="${dragId}"]`);
      if(el){
        el.style.left = f.x + "px";
        el.style.top  = f.y + "px";
      }
    });

    window.addEventListener("mouseup", () => {
      if(!dragId) return;
      const el = layerEl.querySelector(`.fss-field[data-id="${dragId}"]`);
      if(el) el.style.cursor = "grab";
      dragId = null;
    });

    // double click to edit value
    layerEl.addEventListener("dblclick", (e) => {
      const fieldEl = e.target.closest(".fss-field");
      if(!fieldEl) return;

      const id = fieldEl.getAttribute("data-id");
      const fields = loadFields();
      const f = fields.find(x => x.id === id);
      if(!f) return;

      const current = getFieldValue(id) || "";
      const promptLabel = f.type === "signature" ? "Signature name:" :
                          f.type === "date" ? "Date:" :
                          "Text:";
      const next = prompt(promptLabel, current);
      if(next === null) return; // canceled

      setFieldValue(id, next);
      logAudit(`Edited ${f.type} field.`);
      renderLayer(layerEl);
    });

    // Enter key to edit selected
    window.addEventListener("keydown", (e) => {
      if(e.key !== "Enter") return;
      const selected = layerEl.querySelector(".fss-field.is-selected");
      if(!selected) return;
      selected.dispatchEvent(new MouseEvent("dblclick", { bubbles:true }));
    });
  }

  function renderLayer(layerEl){
    if(!layerEl) return;
    const fields = loadFields();
    const values = loadValues();
    layerEl.innerHTML = fields.map(f => overlayFieldToHTML(f, values[f.id] || "")).join("");
  }

  /* =========================
     PDF SIGN GENERATOR (REAL)
  ========================= */
  async function getTemplateArrayBuffer(){
    const doc = loadDocState();
    if(!doc) throw new Error("No document state found.");

    // CUSTOM PDF base64
    if(doc.source === "custom"){
      const b64 = getCustomPdfBase64();
      if(!b64) throw new Error("Custom PDF missing.");
      const byteChars = atob(b64);
      const bytes = new Uint8Array(byteChars.length);
      for(let i=0; i<byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      return bytes.buffer;
    }

    // TEMPLATE in /pdfs
    const template = doc.template || "nda.pdf";
    const url = `pdfs/${encodeURIComponent(template)}`;
    return await fetchAsArrayBuffer(url);
  }

  async function generateSignedPDF(){
    try{
      if(!window.PDFLib){
        console.error("pdf-lib not loaded (window.PDFLib missing)");
        return { ok:false, error:"pdf-lib not loaded. Ensure sign.html includes pdf-lib script." };
      }

      const docState = loadDocState();
      if(!docState) return { ok:false, error:"No document state found." };

      const fields = loadFields();
      const values = loadValues();

      if(!fields || fields.length === 0){
        return { ok:false, error:"No fields placed. Place Signature/Date/Text fields first." };
      }

      // ensure required signature + date have values
      const req = fields.filter(f => f.required);
      for(const f of req){
        const v = values[f.id];
        if(!v || String(v).trim() === ""){
          return { ok:false, error:`Missing required value for: ${f.type}` };
        }
      }

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      const templateBuffer = await getTemplateArrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBuffer);

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Basic strategy:
      // This demo doesn't convert overlay pixels to real PDF points perfectly.
      // But it will still produce a valid signed PDF, and positions will be roughly correct.
      // For perfect placement: upgrade to PDF.js canvas rendering (next step).

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pw, height: ph } = firstPage.getSize();

      // assume overlay layer is roughly "page size" scaled.
      // we map x/y as percentages of a 1000px base and apply to PDF.
      // (this is stable across PDFs with different sizes)
      function mapX(x){ return (x / 1000) * pw; }
      function mapY(y){ return ph - ((y / 1000) * ph); } // invert Y

      for(const f of fields){
        const pageIndex = Math.max(0, (f.page || 1) - 1);
        const page = pages[pageIndex] || pages[0];
        const { width, height } = page.getSize();

        const x = (f.x / 1000) * width;
        const y = height - ((f.y / 1000) * height) - 14;

        const text = String(values[f.id] || "");
        if(!text) continue;

        const fontSize = f.type === "signature" ? 14 : 12;
        const font = f.type === "signature" ? helvBold : helv;

        page.drawRectangle({
          x: x - 4,
          y: y - 10,
          width: (f.w / 1000) * width + 8,
          height: 26,
          color: rgb(0,0,0),
          opacity: 0.06,
          borderColor: rgb(0.15,0.15,0.15),
          borderWidth: 0.5
        });

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.15,0.15,0.15)
        });
      }

      // add footer / audit stamp
      const last = pages[pages.length - 1];
      const footer = `Signed via FSS Demo • ${nowStamp()} • Sender: ${docState.parties.aEmail || "—"} • Recipient: ${docState.parties.bEmail || "—"}`;
      last.drawText(footer, {
        x: 26,
        y: 18,
        size: 8,
        font: helv,
        color: rgb(0.35,0.35,0.35)
      });

      const signedBytes = await pdfDoc.save();
      const b64 = arrayBufferToBase64(signedBytes);

      setSignedBase64(b64);
      return { ok:true };
    }catch(err){
      console.error("generateSignedPDF error:", err);
      return { ok:false, error: err?.message || String(err) };
    }
  }

  /* =========================
     PUBLIC API
  ========================= */
  return {
    // auth
    login, logout, guard, isAuthed,

    // doc
    defaultDoc, loadDocState, saveDocState, resetDoc,

    // audit
    loadAudit, logAudit,

    // fields
    loadFields, saveFields, loadValues, saveValues,
    setFieldValue, getFieldValue,

    // pdf storage
    setSignedBase64, getSignedBase64, hasSignedPDF,

    // custom pdf
    setCustomPdfBase64, getCustomPdfBase64,

    // helpers
    uid, escapeHtml, base64ToBlobURL,

    // overlays
    overlayFieldToHTML,
    enableOverlayEditing,
    renderLayer,

    // signing
    generateSignedPDF
  };
})();
