// Shared JS for WCV demo (small + safe)
(function(){
  const y = document.getElementById("year");
  if(y) y.textContent = new Date().getFullYear();

  // Highlight active nav
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav a[data-page]").forEach(a => {
    if((a.getAttribute("data-page") || "").toLowerCase() === path){
      a.classList.add("active");
    }
  });
})();
