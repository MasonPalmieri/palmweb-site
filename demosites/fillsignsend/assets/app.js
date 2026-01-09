/* =========================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   No backend. Uses localStorage to simulate sessions + doc state.
   ========================================================= */

window.FSS = (() => {

  /* =========================
     CONFIG
  ========================== */
  const DEMO_PASSWORD = "hallam";
  const DEMO_EMAIL = "demo@client.com";

  const STORE_KEYS = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",
    doc: "fss_doc",
    fields: "fss_fields",
    audit: "fss_audit",
    signed: "fss_signed_pdf_b64"
  };

  /* =========================
     UTILS
  ========================== */
  function safeJSONParse(str, fallback){
    try{
      return JSON.parse(str);
    }catch{
      return fallback;
    }
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
    const d = new Date();
    return d.toLocaleString();
  }

  function uuid(){
    return "ENV-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
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
    // allow direct folder access and index.html as login
    return (
      p.endsWith("/fillsignsend/") ||
      p.endsWith("/fillsignsend/index.html") ||
      p.endsWith("/index.html") && p.includes("/fillsignsend/")
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
    // simple demo auth:
    // allow demo email with DEMO_PASSWORD
    // also allow any email if password matches demo password
    const ok =
      (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (password === DEMO_PASSWORD);

    if(!ok) return false;

    setKey(STORE_KEYS.auth, {
      ok: true,
      email: email,
      at: nowStamp()
    });

    logAudit(`Login successful (${email})`);
    return true;
  }

  function logout(){
    removeKey(STORE_KEYS.auth);
    // keep doc state (so user can log back in)
    logAudit("Logged out");
  }

  /**
   * Guard protected pages.
   * ✅ NEVER redirects from login page (prevents loop).
   * ✅ Redirects to index.html only when not authenticated.
   */
  function guard(){
    if(isLoginPage()) return;

    if(!isAuthed()){
      // Use relative redirect to keep GitHub Pages stable
      location.replace("index.html");
    }
  }

  /* =========================
     DOC STATE
  ========================== */
  function defaultDoc(){
    return {
      id: uuid(),
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
    removeKey(STORE_KEYS.signed);
    setKey(STORE_KEYS.audit, []);
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
     FIELDS
  ========================== */
  function loadFields(){
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields){
    setKey(STORE_KEYS.fields, fields);
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
     PDF HELPERS
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
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  /* =========================
     PUBLIC API
  ========================== */
  return {
    // auth
    login,
    logout,
    isAuthed,
    guard,

    // doc
    defaultDoc,
    loadDocState,
    saveDocState,
    resetDoc,
    setDocStage,

    // audit
    loadAudit,
    logAudit,

    // fields
    loadFields,
    saveFields,

    // signed pdf
    setSignedBase64,
    hasSignedPDF,
    getSignedBase64,

    // helpers
    escape,
    fetchAsArrayBuffer,
    arrayBufferToBase64
  };

})();
