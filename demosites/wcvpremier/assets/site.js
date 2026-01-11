(function(){
  // year
  const y = document.getElementById("year");
  if(y) y.textContent = new Date().getFullYear();

  // active nav
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    const p = (a.getAttribute("data-page") || "").toLowerCase();
    if(p === page) a.classList.add("active");
  });
})();
