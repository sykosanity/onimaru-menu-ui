import { copyFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

if (!existsSync(resolve(dist, "classic.html"))) {
  console.error("Run npm run build first.");
  process.exit(1);
}

// GitHub Pages serves from repo root — publish built bundles only (never overwrite src/classic.html).
copyFileSync(resolve(dist, "classic.html"), resolve(root, "classic.html"));
copyFileSync(resolve(dist, "index.html"), resolve(root, "index.html"));
writeFileSync(resolve(root, ".nojekyll"), "");
console.log("Published dist/classic.html + dist/index.html to repo root for GitHub Pages.");
