import { defineConfig, type Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

function classicInlineScript(): Plugin {
  return {
    name: "onimaru-classic-inline-script",
    closeBundle() {
      const built = resolve(process.cwd(), "dist/classic.html");
      const pages = resolve(process.cwd(), "dist/index.html");
      if (!existsSync(built)) return;
      let html = readFileSync(built, "utf8");
      html = html.replace(/<script\s+type="module"(\s+crossorigin)?\s*>/g, "<script>");
      writeFileSync(built, html);
      writeFileSync(pages, html);
    },
  };
}

// Macho DUI runs classic script + static HTML reliably (same model as the working FODO menu).
// React module bundles can fail to mount in Macho's CEF, leaving a blank transparent layer.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile(), classicInlineScript()],
  build: {
    target: "es2018",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "classic.html"),
      },
    },
  },
});
