import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// After everything is inlined into one HTML, drop `type="module"` so the page runs as a
// plain classic script. Macho's DUI/CEF executes classic scripts reliably (the old
// app.js proved it); some CEF builds won't run module scripts at all. The bundle has no
// top-level import/export, so it is valid as a classic script.
function classicInlineScript(): Plugin {
  return {
    name: "onimaru-classic-inline-script",
    closeBundle() {
      const file = resolve(process.cwd(), "dist/index.html");
      if (!existsSync(file)) return;
      let html = readFileSync(file, "utf8");
      html = html.replace(/<script\s+type="module"(\s+crossorigin)?\s*>/g, "<script>");
      writeFileSync(file, html);
    },
  };
}

// Macho's DUI/CEF surface reliably executes a single self-contained HTML page, but
// can fail to load React's default split build (separate `type="module"` asset fetched
// from an absolute /onimaru-menu-ui/assets/... path). Inlining the JS + CSS into one
// index.html removes the extra fetch, the absolute paths and the crossorigin module,
// so the page mounts in-game exactly like the old classic-script app.js did.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile(), classicInlineScript()],
  build: {
    target: "es2018",
  },
});
