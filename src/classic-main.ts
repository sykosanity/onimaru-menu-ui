import "../shadow.css";
import appSource from "../app.js?raw";

const script = document.createElement("script");
script.textContent = appSource;
document.body.appendChild(script);
