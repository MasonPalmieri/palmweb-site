/* ================================
   FSS Demo App (Static)
   - Login simulation
   - Create -> Sign flow via localStorage
   - PDF display with PDF.js
   - PDF "completion" with pdf-lib (downloads a new copy)
================================ */

(function () {
  const path = window.location.pathname;

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);

  function setSession(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function getSession(key) {
    const raw = localStorage.getItem(key);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function clearSession() {
    localStorage.removeItem("fss_auth");
    localStorage.removeItem("fss_doc");
    localStorage.removeItem("fss_parties");
  }

  // ---------- Logout ----------
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => clearSession());
  }

  // ===========================================
  // CREATE PAGE LOGIC (create.html)
  // ===========================================
  if (path.includes("create.html")) {
    const pdfSelect = $("pdfSelect");
    const previewBtn = $("previewBtn");
    const goSignBtn = $("goSignBtn");
    const previewArea = $("pdfPreview");

    async function renderPreview(pdfName) {
      previewArea.innerHTML = "";
      if (!pdfName) {
        previewArea.innerHTML = `<div class="pdfEmpty">Select a document and click <b>Preview PDF</b>.</div>`;
        return;
      }

      const url = `pdfs/${encodeURIComponent(pdfName)}`;

      const loadingTask = window["pdfjsLib"].getDocument(url);
      const pdf = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "pdfPage";

        previewArea.appendChild(canvas);

        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }

    previewBtn.addEventListener("click", () => {
      renderPreview(pdfSelect.value);
    });

    goSignBtn.addEventListener("click", () => {
      const selected = pdfSelect.value;
      if (!selected) {
        alert("Please select a document first.");
        return;
      }

      const parties = {
        partyA: {
          company: $("aCompany").value.trim(),
          title: $("aTitle").value.trim(),
          first: $("aFirst").value.trim(),
          last: $("aLast").value.trim(),
          email: $("aEmail").value.trim(),
        },
        partyB: {
          company: $("bCompany").value.trim(),
          title: $("bTitle").value.trim(),
          first: $("bFirst").value.trim(),
          last: $("bLast").value.trim(),
          email: $("bEmail").value.trim(),
        }
      };

      setSession("fss_doc", { pdf: selected });
      setSession("fss_parties", parties);

      window.location.href = "sign.html";
    });

    // Set PDF.js worker
    if (window["pdfjsLib"]) {
      window["pdfjsLib"].GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js";
    }
  }

  // ===========================================
  // SIGN PAGE LOGIC (sign.html)
  // ===========================================
  if (path.includes("sign.html")) {
    // Set PDF.js worker
    if (window["pdfjsLib"]) {
      window["pdfjsLib"].GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js";
    }

    const doc = getSession("fss_doc");
    if (!doc || !doc.pdf) {
      alert("No document selected. Returning to Create page.");
      window.location.href = "create.html";
      return;
    }

    const pdfCanvasWrap = $("pdfCanvasWrap");
    const overlay = $("overlay");
    const docTitle = $("docTitle");

    const addSig = $("addSig");
    const addDate = $("addDate");
    const completeBtn = $("completeBtn");
    const cancelBtn = $("cancelBtn");

    docTitle.textContent = doc.pdf;

    // We'll render first page large for signing (simple demo)
    const pdfUrl = `pdfs/${encodeURIComponent(doc.pdf)}`;

    let pageViewport = null;

    function makeField(type, text) {
      const el = document.createElement("div");
      el.className = `field ${type}`;
      el.textContent = text;
      el.style.left = "40px";
      el.style.top = "40px";

      // drag
      let isDown = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      el.addEventListener("mousedown", (e) => {
        isDown = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseFloat(el.style.left);
        startTop = parseFloat(el.style.top);
        el.classList.add("dragging");
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.style.left = `${startLeft + dx}px`;
        el.style.top = `${startTop + dy}px`;
      });

      document.addEventListener("mouseup", () => {
        isDown = false;
        el.classList.remove("dragging");
      });

      // double-click remove
      el.addEventListener("dblclick", () => el.remove());

      return el;
    }

    addSig.addEventListener("click", () => {
      const name = $("signerName").value.trim() || "Signature";
      overlay.appendChild(makeField("sig", `✍ ${name}`));
    });

    addDate.addEventListener("click", () => {
      const d = new Date();
      const stamp = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      overlay.appendChild(makeField("date", `📅 ${stamp}`));
    });

    cancelBtn.addEventListener("click", () => {
      window.location.href = "create.html";
    });

    async function renderFirstPage() {
      pdfCanvasWrap.innerHTML = "";
      overlay.innerHTML = "";

      const loadingTask = window["pdfjsLib"].getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.45 });
      pageViewport = viewport;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = "pdfPage";

      pdfCanvasWrap.appendChild(canvas);

      await page.render({ canvasContext: ctx, viewport }).promise;

      // overlay must match canvas size
      overlay.style.width = `${viewport.width}px`;
      overlay.style.height = `${viewport.height}px`;
    }

    renderFirstPage();

    // Export a new PDF with overlay drawn onto the first page
    async function completeAndDownload() {
      const fields = Array.from(overlay.querySelectorAll(".field"));
      if (fields.length === 0) {
        alert("Add at least one signature or date field first.");
        return;
      }

      const existingPdfBytes = await fetch(pdfUrl).then(r => r.arrayBuffer());
      const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const { width, height } = firstPage.getSize();

      // Convert overlay positions (px) to PDF coordinates
      // PDF origin is bottom-left; DOM origin is top-left.
      // We rendered at scale and canvas size = viewport width/height.
      const scaleX = width / pageViewport.width;
      const scaleY = height / pageViewport.height;

      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      fields.forEach((el) => {
        const leftPx = parseFloat(el.style.left);
        const topPx = parseFloat(el.style.top);
        const text = el.textContent;

        // Translate DOM top-left to PDF bottom-left
        const x = leftPx * scaleX;
        const y = height - (topPx * scaleY) - (18 * scaleY);

        firstPage.drawText(text, {
          x,
          y,
          size: 14,
          font,
          color: PDFLib.rgb(0.9, 0.1, 0.3)
        });

        // Add a subtle border rectangle behind signature fields
        firstPage.drawRectangle({
          x: x - 6,
          y: y - 6,
          width: Math.max(140, text.length * 7) * scaleX,
          height: 26 * scaleY,
          borderColor: PDFLib.rgb(0.9, 0.1, 0.3),
          borderWidth: 1,
          opacity: 0.12
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SIGNED_${doc.pdf}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      // Simulate success page
      setTimeout(() => (window.location.href = "success.html"), 450);
    }

    completeBtn.addEventListener("click", completeAndDownload);
  }

})();
