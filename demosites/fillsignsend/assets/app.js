// ====== Demo "auth" (soft) ======
export function demoLogin(email, password){
  const ok =
    (email || "").toLowerCase().includes("@") &&
    (password || "").length >= 4;

  if(ok){
    localStorage.setItem("fss_demo_authed", "true");
    localStorage.setItem("fss_demo_user", email);
  }
  return ok;
}

export function demoLogout(){
  localStorage.removeItem("fss_demo_authed");
  localStorage.removeItem("fss_demo_user");
}

export function requireAuth(){
  const ok = localStorage.getItem("fss_demo_authed") === "true";
  if(!ok) window.location.href = "index.html";
}

export function getUser(){
  return localStorage.getItem("fss_demo_user") || "demo@client.com";
}

// ====== Agreement storage ======
const KEY = "fss_demo_agreements";

export function getAgreements(){
  try{
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  }catch{
    return [];
  }
}

export function saveAgreements(list){
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function saveAgreement(agreement){
  const list = getAgreements();
  list.unshift(agreement);
  saveAgreements(list);
}

export function updateAgreement(updated){
  const list = getAgreements();
  const idx = list.findIndex(x => x.id === updated.id);
  if(idx >= 0){
    list[idx] = updated;
    saveAgreements(list);
  }
}

// ====== Utilities ======
export function uid(){
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function fmtDate(ts){
  return new Date(ts).toLocaleString();
}
