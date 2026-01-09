window.FSS = (function(){
  const AUTH_KEY = "fss_auth";
  const DOC_KEY = "fss_doc";
  const FIELDS_KEY = "fss_fields";
  const SIGNED_KEY = "fss_signed";
  const AUDIT_KEY = "fss_audit";

  function escape(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function getAuth(){
    const raw = localStorage.getItem(AUTH_KEY);
    try{ return raw ? JSON.parse(raw) : null; }catch{ return null; }
  }

  function guard(){
    const path = (location.pathname || "").toLowerCase();
    if(path.endsWith("/index.html") || path.endsWith("/fillsignsend/")) return;

    const auth = getAuth();
    if(!auth){
      location.href = "index.html";
    }
  }

  function logout(){
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(DOC_KEY);
    localStorage.removeItem(FIELDS_KEY);
    localStorage.removeItem(SIGNED_KEY);
    localStorage.removeItem(AUDIT_KEY);
  }

  function loadDocState(){
    const raw = localStorage.getItem(DOC_KEY);
    try{ return raw ? JSON.parse(raw) : null; }catch{ return null; }
  }

  function saveDocState(obj){
    localStorage.setItem(DOC_KEY, JSON.stringify(obj));
  }

  function loadFields(){
    const raw = localStorage.getItem(FIELDS_KEY);
    try{ return raw ? JSON.parse(raw) : []; }catch{ return []; }
  }

  function saveFields(fields){
    localStorage.setItem(FIELDS_KEY, JSON.stringify(fields || []));
  }

  function fieldDefaults(type){
    if(type === "signature") return { w: 210, h: 70, required: true };
    if(type === "date") return { w: 160, h: 54, required: true };
    if(type === "initials") return { w: 140, h: 54, required: false };
    if(type === "checkbox") return { w: 70, h: 70, required: false };
    if(type === "text") return { w: 220, h: 54, required: false };
    return { w: 200, h: 54, required: false };
  }

  async function fetchArrayBuffer(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error("Fetch failed: " + res.status);
    return await res.arrayBuffer();
  }

  // Signed blob storage
  function saveSignedBlob(bytes, templateName){
    const base64 = arrayBufferToBase64(bytes);
    const payload = {
      templateName: templateName || "document.pdf",
      generatedAt: Date.now(),
      base64
    };
    localStorage.setItem(SIGNED_KEY, JSON.stringify(payload));
  }

  function getSignedBlob(){
    const raw = localStorage.getItem(SIGNED_KEY);
    try{ return raw ? JSON.parse(raw) : null; }catch{ return null; }
  }

  function getSignedBytes(){
    const signed = getSignedBlob();
    if(!signed?.base64) return null;
    return base64ToUint8(signed.base64);
  }

  let _signedObjectUrl = null;
  function getSignedObjectUrl(){
    const bytes = getSignedBytes();
    if(!bytes) return null;

    if(_signedObjectUrl) URL.revokeObjectURL(_signedObjectUrl);

    const blob = new Blob([bytes], { type:"application/pdf" });
    _signedObjectUrl = URL.createObjectURL(blob);
    return _signedObjectUrl;
  }

  function downloadSigned(){
    const signed = getSignedBlob();
    const bytes = getSignedBytes();
    if(!signed || !bytes) return;

    const blob = new Blob([bytes], { type:"application/pdf" });
    const a = document.createElement("a");
    const safeName = (signed.templateName || "SIGNED.pdf").replace(".pdf","");

    a.href = URL.createObjectURL(blob);
    a.download = `SIGNED_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Audit
  function auditGet(){
    const raw = localStorage.getItem(AUDIT_KEY);
    try{ return raw ? JSON.parse(raw) : []; }catch{ return []; }
  }

  function auditAdd(title, desc){
    const events = auditGet();
    events.unshift({ title, desc, at: Date.now() });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(events));
  }

  function auditAddOnce(title, desc){
    const events = auditGet();
    if(events.some(e => e.title === title)) return;
    auditAdd(title, desc);
  }

  // Base64 helpers
  function arrayBufferToBase64(buffer){
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;

    for(let i=0;i<bytes.length;i+=chunkSize){
      binary += String.fromCharCode(...bytes.slice(i,i+chunkSize));
    }
    return btoa(binary);
  }

  function base64ToUint8(base64){
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++){
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // PDF Signing via pdf-lib
  async function generateSignedPdf({ originalPdfBytes, fields, parties }){
    const { PDFDocument, rgb, StandardFonts } = await import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm");

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const now = new Date();
    const signedOn = `${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}/${now.getFullYear()}`;

    const sizeRaw = localStorage.getItem("fss_last_canvas_size");
    let lastSize = null;
    try{ lastSize = sizeRaw ? JSON.parse(sizeRaw) : null; }catch{}
    const fallbackW = 900;
    const fallbackH = 1200;

    const vp = { w: lastSize?.w || fallbackW, h: lastSize?.h || fallbackH };

    function toPdfX(px, page){
      return (px / vp.w) * page.getWidth();
    }
    function toPdfY(py, page, heightPx){
      const pageH = page.getHeight();
      const yTop = (py / vp.h) * pageH;
      const h = (heightPx / vp.h) * pageH;
      return pageH - yTop - h;
    }

    function drawField(page, f){
      const x = toPdfX(f.x, page);
      const y = toPdfY(f.y, page, f.h);
      const w = (f.w / vp.w) * page.getWidth();
      const h = (f.h / vp.h) * page.getHeight();

      // soft box
      page.drawRectangle({
        x, y, width:w, height:h,
        borderColor: rgb(0.20,0.45,0.90),
        borderWidth: 1,
        color: rgb(0.96,0.98,1.0),
        opacity: 0.20
      });

      const text = (f.value || "").toString();
      const fontSize = Math.max(9, Math.min(16, h * 0.46));

      if(f.type === "checkbox"){
        if(text){
          page.drawText("✓", {
            x: x + (w * 0.30),
            y: y + (h * 0.16),
            size: Math.max(18, h * 0.7),
            font,
            color: rgb(0.08,0.72,0.35),
          });
        }
        return;
      }

      if(f.type === "signature"){
        page.drawText(text || (f.owner === "sender" ? (parties?.aName || "") : (parties?.bName || "")), {
          x: x + 8,
          y: y + (h * 0.30),
          size: Math.max(13, fontSize + 3),
          font,
          color: rgb(0.06,0.20,0.42),
        });
        return;
      }

      if(f.type === "date"){
        page.drawText(text || signedOn, {
          x: x + 8,
          y: y + (h * 0.30),
          size: fontSize,
          font,
          color: rgb(0.08,0.14,0.26),
        });
        return;
      }

      page.drawText(text, {
        x: x + 8,
        y: y + (h * 0.30),
        size: fontSize,
        font,
        color: rgb(0.08,0.14,0.26),
        maxWidth: Math.max(40, w - 16),
      });
    }

    for(const f of (fields || [])){
      const pageIndex = (f.page || 1) - 1;
      const page = pages[pageIndex];
      if(!page) continue;
      drawField(page, f);
    }

    const lastPage = pages[pages.length - 1];
    lastPage.drawText(`Signed via Client Portal Demo • ${signedOn}`, {
      x: 36,
      y: 24,
      size: 9,
      font,
      color: rgb(0.40,0.45,0.52),
    });

    const out = await pdfDoc.save();
    return out;
  }

  return {
    escape,
    guard,
    logout,

    loadDocState,
    saveDocState,

    loadFields,
    saveFields,
    fieldDefaults,

    fetchArrayBuffer,

    saveSignedBlob,
    getSignedBlob,
    getSignedObjectUrl,
    downloadSigned,

    auditGet,
    auditAdd,
    auditAddOnce,

    generateSignedPdf,
  };
})();
