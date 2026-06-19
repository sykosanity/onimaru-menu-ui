import "../shadow.css";
import appSource from "../app.js?raw";

function mountApp() {
  const target = document.body || document.documentElement;
  if (!target || !document.getElementById("dashboard")) {
    return;
  }
  const script = document.createElement("script");
  script.textContent = appSource;
  target.appendChild(script);
}

function scheduleMount() {
  if (document.getElementById("dashboard")) {
    mountApp();
    return;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountApp, { once: true });
  }
}

scheduleMount();
