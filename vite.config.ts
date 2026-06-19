import { defineConfig, type Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Macho CEF needs CSS in <head> and JS after DOM — singlefile puts script in head and breaks init. */
function reorderClassicHtmlForMacho(): Plugin {
  return {
    name: "onimaru-classic-macho-html",
    closeBundle() {
      const built = resolve(process.cwd(), "dist/classic.html");
      const pages = resolve(process.cwd(), "dist/index.html");
      if (!existsSync(built)) return;

      let html = readFileSync(built, "utf8");

      const styleTag = html.match(/<style[^>]*>[\s\S]*?<\/style>/i)?.[0] ?? "";
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyInner = bodyMatch?.[1] ?? "";

      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headInner = headMatch?.[1] ?? "";
      let bundleScript =
        headInner.match(/<script[^>]*>[\s\S]*?<\/script>/i)?.[0] ?? "";
      bundleScript = bundleScript
        .replace(/\s*type="module"/gi, "")
        .replace(/\s*crossorigin/gi, "");

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

      writeFileSync(built, output);
      writeFileSync(pages, output);
    },
  };
}

// Macho DUI runs classic script + static HTML reliably (same model as the working FODO menu).
// React module bundles can fail to mount in Macho's CEF, leaving a blank transparent layer.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile(), reorderClassicHtmlForMacho()],
  build: {
    target: "es2018",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "classic.html"),
      },
    },
  },
});
