import { defineConfig, type Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Macho CEF needs CSS in <head> and JS after DOM — singlefile puts script in head and breaks init. */
function reorderClassicHtmlForMacho(): Plugin {
  return {
    name: "onimaru-classic-macho-html",
    closeBundle() {
      const distDir = resolve(process.cwd(), "dist");
      const builtCandidates = [
        resolve(distDir, "classic.html"),
        resolve(distDir, "src/classic.html"),
        resolve(distDir, "index.html"),
      ];
      const built = builtCandidates.find((p) => existsSync(p));
      const pages = resolve(distDir, "index.html");
      const classicOut = resolve(distDir, "classic.html");
      if (!built) return;

      let html = readFileSync(built, "utf8");

      const styleTag = html.match(/<style[^>]*>[\s\S]*?<\/style>/i)?.[0] ?? "";
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyInner = bodyMatch?.[1] ?? "";

      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headInner = headMatch?.[1] ?? "";
      let bundleScript =
        headInner.match(/<script[^>]*>[\s\S]*?<\/script>/i)?.[0] ?? "";
      // Only normalize the opening <script> tag — never strip "crossorigin" inside JS
      // (Vite's modulepreload polyfill uses n.crossOrigin; global replace breaks it).
      bundleScript = bundleScript.replace(/^<script[^>]*>/i, "<script>");

      const cleanBody = bodyInner.replace(bundleScript, "").trim();

      const output = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Onimaru Menu</title>
    ${styleTag}
</head>
<body>
${cleanBody}
${bundleScript}
</body>
</html>
`;

      writeFileSync(classicOut, output);
      writeFileSync(pages, output);
      if (built !== classicOut && built !== pages) {
        try {
          const stale = resolve(distDir, "src/classic.html");
          if (existsSync(stale)) unlinkSync(stale);
        } catch {
          /* ignore */
        }
      }
    },
  };
}

// Macho DUI runs classic script + static HTML reliably (same model as the working FODO menu).
// React module bundles can fail to mount in Macho's CEF, leaving a blank transparent layer.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile(), reorderClassicHtmlForMacho()],
  esbuild: {
    target: "es2015",
    supported: {
      "nullish-coalescing": false,
      "optional-chain": false,
    },
  },
  build: {
    target: "es2015",
    modulePreload: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/classic.html"),
      },
    },
  },
});
