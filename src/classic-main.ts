import "../shadow.css";
import appSource from "../app.js?raw";

function mountApp() {
  const target = document.body || document.documentElement;
  if (!target) {
    return;
  }
  const script = document.createElement("script");
  script.textContent = appSource;
  target.appendChild(script);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp);
} else {
  mountApp();
}
