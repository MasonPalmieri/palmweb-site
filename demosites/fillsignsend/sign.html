/* ============================================================================
   FSS Demo App — app.js (Static / GitHub Pages)
   - No backend. Uses localStorage for auth + envelope/doc state.
   - Supports:
     • Template PDFs in /pdfs/
     • Custom PDFs (upload / builder) stored in localStorage as base64
   - PDF Signing:
     • Uses pdf-lib (must be available on pages that call generateSignedPDF)
       <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
   ========================================================================== */

window.FSS = (() => {
  /* ============================= CONFIG ================================== */
  const DEMO_PASSWORD = "hallam";        // demo gate password (index.html gate)
  const DEMO_EMAIL = "demo@client.com";  // login email (index.html)
  const DEMO_PASS  = "hallam";           // login password

  const STORE_KEYS = {
    demoGate: "palmweb_demo_gate",
    auth: "fss_auth",

    doc: "fss_doc",
    fields: "fss_fields",
    values: "fss_values",
    audit: "fss_audit",

    signed: "fss_signed_pdf_b64",
    customPdf: "fss_custom_pdf_b64" // custom uploaded/built pdf base64
  };

  /* ============================= HELPERS ================================= */
  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function getKey(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function setKey(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKey(key) {
    localStorage.removeItem(key);
  }

  function nowStamp() {
    return new Date().toLocaleString();
  }

  function uid() {
    return String(Date.now()) + String(Math.floor(Math.random() * 100000));
  }

  function isDemoUnlocked() {
    return localStorage.getItem(STORE_KEYS.demoGate) === "true";
  }

  function unlockDemo() {
    localStorage.setItem(STORE_KEYS.demoGate, "true");
  }

  function isAuthed() {
    const auth = getKey(STORE_KEYS.auth, null);
    return !!(auth && auth.email);
  }

  /* ============================== AUTH =================================== */
  function login(email, password) {
    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    if (email !== DEMO_EMAIL || password !== DEMO_PASS) return false;

    setKey(STORE_KEYS.auth, { email, at: Date.now() });
    logAudit(`Login successful (${email}).`);
    return true;
  }

  function logout() {
    removeKey(STORE_KEYS.auth);
    logAudit("Logged out.");
  }

  function guard() {
    // demo gate required
    if (!isDemoUnlocked()) {
      const path = location.pathname.toLowerCase();
      if (!path.endsWith("/index.html") && !path.endsWith("/index")) {
        location.href = "index.html";
        return;
      }
    }

    // login required for internal pages
    const path = location.pathname.toLowerCase();
    const isPublic = path.endsWith("/index.html") || path.endsWith("/index");
    if (!isPublic && !isAuthed()) {
      location.href = "index.html";
      return;
    }
  }

  /* ============================ DOC STATE ================================ */
  function defaultDoc() {
    return {
      id: "ENV-" + uid(),
      createdAt: new Date().toISOString(),
      template: "nda.pdf",
      source: "template", // "template" | "custom"
      status: "draft",    // "draft" | "sent" | "completed"
      parties: {
        aName: "",
        aEmail: "",
        bName: "",
        bEmail: ""
      }
    };
  }

  function loadDocState() {
    return getKey(STORE_KEYS.doc, null);
  }

  function saveDocState(doc) {
    setKey(STORE_KEYS.doc, doc);
  }

  function resetDoc() {
    const d = defaultDoc();
    saveDocState(d);
    setKey(STORE_KEYS.fields, []);
    setKey(STORE_KEYS.values, {});
    setKey(STORE_KEYS.audit, []);
    removeKey(STORE_KEYS.signed);
    logAudit("Envelope reset.");
    return d;
  }

  function setStatus(stage) {
    const doc = loadDocState() || defaultDoc();
    doc.status = stage;
    saveDocState(doc);
    logAudit(`Status updated: ${stage}.`);
  }

  /* ============================ AUDIT LOG ================================ */
  function loadAudit() {
    return getKey(STORE_KEYS.audit, []);
  }

  function saveAudit(list) {
    setKey(STORE_KEYS.audit, list);
  }

  function logAudit(message) {
    const audit = loadAudit();
    audit.unshift({ at: nowStamp(), msg: message });
    saveAudit(audit);
  }

  /* ============================= FIELDS ================================== */
  function loadFields() {
    return getKey(STORE_KEYS.fields, []);
  }

  function saveFields(fields) {
    setKey(STORE_KEYS.fields, fields);
  }

  function loadValues() {
    return getKey(STORE_KEYS.values, {});
  }

  function saveValues(values) {
    setKey(STORE_KEYS.values, values);
  }

  function setFieldValue(fieldId, value) {
    const values = loadValues();
    values[fieldId] = value;
    saveValues(values);
  }

  function getFieldValue(fieldId) {
    const values = loadValues();
    return values[fieldId] || "";
  }

  /* ======================== SIGNED PDF STORAGE =========================== */
  function setSignedBase64(b64) {
    setKey(STORE_KEYS.signed, b64);
  }

  function getSignedBase64() {
    return getKey(STORE_KEYS.signed, null);
  }

  function hasSignedPDF() {
    const b64 = getSignedBase64();
    return !!(b64 && String(b64).length > 50);
  }

  /* ======================== CUSTOM PDF STORAGE =========================== */
  function setCustomPdfBase64(b64) {
    setKey(STORE_KEYS.customPdf, b64);
  }

  function getCustomPdfBase64() {
    return getKey(STORE_KEYS.customPdf, null);
  }

  function hasCustomPdf() {
    const b64 = getCustomPdfBase64();
    return !!(b64 && String(b64).length > 50);
  }

  /* =========================== FILE HELPERS ============================== */
  async function fetchAsArrayBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch PDF: " + url);
    return await res.arrayBuffer();
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function base64ToUint8Array(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function base64ToBlobURL(b64) {
    const bytes = base64ToUint8Array(b64);
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  }

  /* ====================== FIELD UI OVERLAYS (SIGN) ======================= */
  // This is used by sign.html to create draggable/editable overlays
  function overlayFieldToHTML(field, value = "") {
    const label = field.type === "signature" ? "Signature"
                : field.type === "date" ? "Date"
                : field.type === "text" ? "Text"
                : "Field";

    const display = value ? String(value) : label;

    return `
      <div class="fss-field"
           data-id="${escapeHtml(field.id)}"
           data-type="${escapeHtml(field.type)}"
           style="
             position:absolute;
             left:${field.x}px; top:${field.y}px;
             width:${field.w}px; height:${field.h}px;
             border-radius:12px;
             border: 2px solid ${field.type === "signature" ? "rgba(255,70,145,.85)" :
                               field.type === "date" ? "rgba(104,255,171,.85)" :
                               "rgba(120,180,255,.85)"};
             background: rgba(255,255,255,.06);
             box-shadow: 0 16px 40px rgba(0,0,0,.35);
             cursor: move;
             user-select:none;
             display:flex;
             align-items:center;
             justify-content:center;
             font-weight: 950;
             font-size: 13px;
             color: rgba(10,10,10,.82);
             padding: 8px 10px;
             backdrop-filter: blur(10px);
           ">
        <span style="
          display:block;
          width:100%;
          text-align:center;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          color: rgba(0,0,0,.80);
          font-weight: 950;
        ">${escapeHtml(display)}</span>

        <button class="fss-x"
          title="Remove"
          type="button"
          style="
            position:absolute;
            top:-10px;
            right:-10px;
            width:28px;
            height:28px;
            border-radius:999px;
            border:1px solid rgba(255,255,255,.35);
            background: rgba(0,0,0,.65);
            color:#fff;
            font-weight:950;
            cursor:pointer;
          ">×</button>
      </div>
    `.trim();
  }

  /**
   * Attach draggable + editable behavior to overlays inside a container.
   * containerEl must be the "PDF stage" wrapper (position: relative).
   */
  function enableOverlayEditing(containerEl, onChanged) {
    if (!containerEl) return;

    // drag support
    let drag = null;

    function getMousePos(e) {
      const rect = containerEl.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top)
      };
    }

    function startDrag(e, el) {
      const id = el.getAttribute("data-id");
      const fields = loadFields();
      const f = fields.find(x => x.id === id);
      if (!f) return;

      const pos = getMousePos(e);
      drag = {
        id,
        el,
        startX: pos.x,
        startY: pos.y,
        origX: f.x,
        origY: f.y
      };
    }

    function moveDrag(e) {
      if (!drag) return;
      const fields = loadFields();
      const f = fields.find(x => x.id === drag.id);
      if (!f) return;

      const pos = getMousePos(e);
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;

      f.x = Math.max(0, Math.round(drag.origX + dx));
      f.y = Math.max(0, Math.round(drag.origY + dy));

      // update element
      drag.el.style.left = f.x + "px";
      drag.el.style.top  = f.y + "px";

      saveFields(fields);
      if (onChanged) onChanged();
    }

    function endDrag() {
      drag = null;
    }

    function editFieldValue(fieldId) {
      const fields = loadFields();
      const f = fields.find(x => x.id === fieldId);
      if (!f) return;

      const existing = getFieldValue(fieldId) || "";
      const label = f.type === "signature" ? "Signature"
                  : f.type === "date" ? "Date"
                  : f.type === "text" ? "Text"
                  : "Value";

      let next = prompt(`Enter ${label} value:`, existing);

      if (next === null) return; // cancelled
      next = String(next).trim();

      // optional defaults for signature/date if user leaves blank
      if (!next && f.type === "signature") {
        const doc = loadDocState() || defaultDoc();
        next = doc.parties?.aName || "";
      }
      if (!next && f.type === "date") {
        next = new Date().toLocaleDateString();
      }

      setFieldValue(fieldId, next);

      // update overlay label
      const el = containerEl.querySelector(`.fss-field[data-id="${CSS.escape(fieldId)}"] span`);
      if (el) el.textContent = next || label;

      if (onChanged) onChanged();
    }

    function removeField(fieldId) {
      const fields = loadFields().filter(f => f.id !== fieldId);
      saveFields(fields);

      // also remove stored value
      const values = loadValues();
      delete values[fieldId];
      saveValues(values);

      const el = containerEl.querySelector(`.fss-field[data-id="${CSS.escape(fieldId)}"]`);
      if (el) el.remove();

      logAudit("Field removed.");
      if (onChanged) onChanged();
    }

    // mouse interactions
    containerEl.addEventListener("mousedown", (e) => {
      const fieldEl = e.target.closest(".fss-field");
      if (!fieldEl) return;

      // clicking X removes
      if (e.target.classList.contains("fss-x")) return;

      startDrag(e, fieldEl);
    });

    window.addEventListener("mousemove", (e) => moveDrag(e));
    window.addEventListener("mouseup", () => endDrag());

    // remove button
    containerEl.addEventListener("click", (e) => {
      if (!e.target.classList.contains("fss-x")) return;
      const fieldEl = e.target.closest(".fss-field");
      if (!fieldEl) return;
      const id = fieldEl.getAttribute("data-id");
      removeField(id);
    });

    // double-click to edit value
    containerEl.addEventListener("dblclick", (e) => {
      const fieldEl = e.target.closest(".fss-field");
      if (!fieldEl) return;
      const id = fieldEl.getAttribute("data-id");
      editFieldValue(id);
    });

    // keyboard: if a field is "selected" (clicked), allow Enter to edit
    containerEl.addEventListener("click", (e) => {
      const fieldEl = e.target.closest(".fss-field");
      containerEl.querySelectorAll(".fss-field").forEach(n => n.classList.remove("is-selected"));
      if (fieldEl && !e.target.classList.contains("fss-x")) fieldEl.classList.add("is-selected");
    });

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const selected = containerEl.querySelector(".fss-field.is-selected");
      if (!selected) return;
      const id = selected.getAttribute("data-id");
      editFieldValue(id);
    });

    return { editFieldValue };
  }

  /* ====================== PDF SIGNING / GENERATION ======================= */
  /**
   * Load the active PDF bytes:
   * - If doc.source === "custom", load from fss_custom_pdf_b64
   * - Else load from /pdfs/<doc.template>
   */
  async function loadActivePdfBytes() {
    const doc = loadDocState() || defaultDoc();

    if (doc.source === "custom") {
      const b64 = getCustomPdfBase64();
      if (!b64) throw new Error("No custom PDF stored.");
      return base64ToUint8Array(b64);
    }

    const template = doc.template || "nda.pdf";
    const url = `pdfs/${encodeURIComponent(template)}`;
    const buf = await fetchAsArrayBuffer(url);
    return new Uint8Array(buf);
  }

  /**
   * This creates a real signed PDF in-browser using pdf-lib
   * It embeds:
   * - sender signature
   * - date
   * - any text fields
   * It stores result in localStorage (base64)
   */
  async function generateSignedPDF() {
    // This is the #1 cause of “Sign as sender” errors:
    // PDFLib not loaded or blocked.
    if (!window.PDFLib) {
      console.error("pdf-lib not loaded. Add the pdf-lib script before app.js on sign.html.");
      return { ok: false, error: "pdf-lib not loaded (PDFLib missing)." };
    }

    try {
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

      const docState = loadDocState() || defaultDoc();
      const fields = loadFields();
      const values = loadValues();

      if (!fields || fields.length === 0) {
        return { ok: false, error: "No fields placed. Place Signature/Date/Text first." };
      }

      const pdfBytes = await loadActivePdfBytes();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();

      // Helper: clamp page index
      const getPage = (pageNum) => {
        const idx = Math.max(0, Math.min((pageNum || 1) - 1, pages.length - 1));
        return pages[idx];
      };

      // We place text using approximate mapping:
      // sign.html overlays are pixel coords relative to the PDF viewer stage,
      // NOT actual PDF coords. In a real solution we’d map canvas coords → PDF coords.
      //
      // For this demo, we assume stage coords roughly match a portrait PDF view.
      // So we use a “best effort” conversion based on page width/height ratio.
      //
      // If your stage always represents the page at 1:1, this works nicely.
      function overlayToPdfCoords(page, field) {
        const { width, height } = page.getSize();

        // these are "overlay pixels"
        const x = field.x;
        const y = field.y;
        const w = field.w;
        const h = field.h;

        // Convert overlay top-left to PDF bottom-left
        // We treat overlay height as same as page height (approx),
        // so we flip Y.
        const pdfX = x;
        const pdfY = height - (y + h);

        return { pdfX, pdfY, pdfW: w, pdfH: h };
      }

      // Draw all fields
      for (const f of fields) {
        const page = getPage(f.page || 1);
        const { pdfX, pdfY, pdfW, pdfH } = overlayToPdfCoords(page, f);

        const v = (values[f.id] || "").trim();

        // faint box so the signed PDF visibly contains the fields
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.2, 0.2),
          color: rgb(1, 1, 1),
          opacity: 0.0
        });

        // signature/date/text rendering
        if (f.type === "signature") {
          const sig = v || docState.parties?.aName || "Signed";
          page.drawText(sig, {
            x: pdfX + 8,
            y: pdfY + (pdfH / 2) - 6,
            size: Math.min(16, Math.max(10, pdfH * 0.45)),
            font: helvBold,
            color: rgb(0.05, 0.05, 0.05),
            opacity: 0.92
          });
        }

        if (f.type === "date") {
          const dateVal = v || new Date().toLocaleDateString();
          page.drawText(dateVal, {
            x: pdfX + 8,
            y: pdfY + (pdfH / 2) - 5,
            size: Math.min(12, Math.max(9, pdfH * 0.42)),
            font: helv,
            color: rgb(0.05, 0.05, 0.05),
            opacity: 0.92
          });
        }

        if (f.type === "text") {
          const textVal = v || "";
          page.drawText(textVal, {
            x: pdfX + 8,
            y: pdfY + (pdfH / 2) - 5,
            size: Math.min(12, Math.max(9, pdfH * 0.42)),
            font: helv,
            color: rgb(0.05, 0.05, 0.05),
            opacity: 0.92
          });
        }
      }

      // Add footer audit stamp
      const last = pages[pages.length - 1];
      const footer = `Signed via FSS Demo • ${nowStamp()} • Sender: ${docState.parties?.aEmail || "—"} • Recipient: ${docState.parties?.bEmail || "—"}`;
      last.drawText(footer, {
        x: 28,
        y: 18,
        size: 9,
        font: helv,
        color: rgb(0.35, 0.35, 0.35),
        opacity: 0.85
      });

      const outBytes = await pdfDoc.save();
      const b64 = arrayBufferToBase64(outBytes.buffer);

      setSignedBase64(b64);
      logAudit("Signed PDF generated.");

      return { ok: true, base64: b64 };
    } catch (err) {
      console.error("generateSignedPDF error:", err);
      return { ok: false, error: err?.message || String(err) };
    }
  }

  /* ========================== PUBLIC API ================================ */
  return {
    // config / demo gate
    DEMO_PASSWORD,
    isDemoUnlocked,
    unlockDemo,

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
    setStatus,

    // audit
    loadAudit,
    logAudit,

    // fields
    uid,
    loadFields,
    saveFields,
    loadValues,
    saveValues,
    setFieldValue,
    getFieldValue,
    overlayFieldToHTML,
    enableOverlayEditing,

    // signed
    generateSignedPDF,
    hasSignedPDF,
    getSignedBase64,
    setSignedBase64,
    base64ToBlobURL,

    // custom pdf
    setCustomPdfBase64,
    getCustomPdfBase64,
    hasCustomPdf
  };
})();
