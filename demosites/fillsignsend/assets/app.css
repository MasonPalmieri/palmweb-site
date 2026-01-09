/* =========================================================
   FSS Demo App — app.css
   Dark UI, readable inputs/selects, DocuSign-style layout
   ========================================================= */

:root{
  --bg0:#06070a;
  --bg1:#0b0f16;
  --panel: rgba(255,255,255,.06);
  --panel2: rgba(255,255,255,.04);
  --border: rgba(255,255,255,.10);

  --text: rgba(255,255,255,.92);
  --muted: rgba(255,255,255,.68);

  --accent:#ff2e63;
  --accent2:#ff4f99;

  --good:#60ff9d;
  --warn:#ffc452;
  --bad:#ff4f63;

  --shadow: 0 18px 55px rgba(0,0,0,.55);
  --radius: 18px;
}

*{ box-sizing:border-box; }
html,body{ height:100%; }

body{
  margin:0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  color: var(--text);
  background:
    radial-gradient(1200px 560px at 20% -10%, rgba(255,46,99,.18), transparent 60%),
    radial-gradient(1200px 560px at 90% 0%, rgba(91,231,255,.12), transparent 60%),
    linear-gradient(180deg, var(--bg0), var(--bg1));
  line-height:1.5;
}

a{ color: inherit; }
img{ max-width:100%; display:block; }

.container{
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 18px;
}

/* ========= TOP BAR ========= */
.app-top{
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
  background: rgba(0,0,0,.38);
  backdrop-filter: blur(14px);
}

.app-top-inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 14px;
  padding: 14px 18px;
  max-width: 1280px;
  margin: 0 auto;
}

.app-brand{
  display:flex;
  align-items:center;
  gap: 12px;
  text-decoration:none;
  min-width:0;
}

.logo-badge{
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(255,46,99,.16);
  border: 1px solid rgba(255,46,99,.24);
  font-weight: 1000;
  letter-spacing:.3px;
}

.brand-text{
  display:flex;
  flex-direction:column;
  gap: 2px;
  min-width:0;
}
.brand-text strong{
  font-weight: 1000;
  font-size: 13px;
  letter-spacing:.2px;
}
.brand-text span{
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
}

/* nav */
.app-nav{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap:wrap;
}

.nav-link{
  text-decoration:none;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  color: rgba(255,255,255,.78);
  font-weight: 950;
  font-size: 13px;
}
.nav-link:hover{
  color:#fff;
  background: rgba(255,255,255,.06);
}
.nav-link.active{
  background: rgba(255,46,99,.18);
  border-color: rgba(255,46,99,.22);
  color:#fff;
}

/* user */
.app-user{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.user-pill{
  display:inline-flex;
  align-items:center;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  font-weight: 900;
  font-size: 13px;
  color: rgba(255,255,255,.86);
}

/* ========= BUTTONS ========= */
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid transparent;
  text-decoration:none;
  font-weight: 1000;
  cursor:pointer;
  user-select:none;
  transition: transform .06s ease, background .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.btn:active{ transform: translateY(1px); }

.btn-primary{
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color:#fff;
  box-shadow: 0 12px 28px rgba(255,46,99,.18);
}
.btn-primary:hover{
  box-shadow: 0 16px 35px rgba(255,46,99,.25);
}

.btn-outline{
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.92);
}
.btn-outline:hover{ background: rgba(255,255,255,.09); }

.btn-danger{
  background: rgba(255,79,99,.18);
  border-color: rgba(255,79,99,.22);
  color:#fff;
}
.btn-danger:hover{ background: rgba(255,79,99,.24); }

/* ========= FORMS ========= */
label{
  display:flex;
  flex-direction:column;
  gap: 6px;
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.78);
}

input, select, textarea{
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.28);
  color: rgba(255,255,255,.92);
  outline:none;
  font-size: 14px;
  font-weight: 850;
}

/* ✅ This fixes your invisible dropdown */
select{
  appearance: auto;
  -webkit-appearance: auto;
  -moz-appearance: auto;
  background-color: rgba(0,0,0,.28);
  color: rgba(255,255,255,.92);
}

select option{
  background: #0b0f16;
  color: rgba(255,255,255,.92);
}

input:focus, select:focus, textarea:focus{
  border-color: rgba(255,46,99,.55);
  box-shadow: 0 0 0 4px rgba(255,46,99,.12);
}

textarea{ min-height: 110px; resize: vertical; }

.help{
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255,255,255,.62);
  font-weight: 800;
}

/* ========= PANELS ========= */
.card{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.card.pad{ padding: 16px; }

.divider{
  height: 1px;
  background: rgba(255,255,255,.10);
  margin: 14px 0;
}

.status{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.04);
  font-weight: 850;
  font-size: 13px;
  color: rgba(255,255,255,.86);
}
.status.good{ border-color: rgba(96,255,157,.30); background: rgba(96,255,157,.08); }
.status.warn{ border-color: rgba(255,196,82,.30); background: rgba(255,196,82,.08); }
.status.bad{ border-color: rgba(255,79,99,.30); background: rgba(255,79,99,.08); }

/* ========= MODAL VIEWER ========= */
.modal{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.72);
  display:none;
  align-items:center;
  justify-content:center;
  padding: 16px;
  z-index: 1000;
}
.modal.show{ display:flex; }

.modal-card{
  width: min(1200px, 100%);
  height: min(92vh, 860px);
  background: rgba(0,0,0,.55);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 22px;
  box-shadow: 0 24px 80px rgba(0,0,0,.7);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}

.modal-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.35);
}

.modal-head strong{
  font-weight: 1000;
  font-size: 13px;
}

.modal-close{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.92);
  border-radius: 999px;
  padding: 8px 10px;
  cursor:pointer;
  font-weight: 1000;
}
.modal-close:hover{ background: rgba(255,255,255,.09); }

.modal-body{
  flex: 1;
  background: rgba(255,255,255,.03);
}

.modal-body iframe{
  width: 100%;
  height: 100%;
  border: 0;
  background:#fff;
}

/* ========= RESPONSIVE ========= */
@media (max-width: 980px){
  .app-nav{ display:none; }
}
