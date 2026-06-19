import { copyFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

if (!existsSync(resolve(dist, "classic.html"))) {
  console.error("Run npm run build first.");
  process.exit(1);
}

copyFileSync(resolve(dist, "classic.html"), resolve(root, "classic.html"));
copyFileSync(resolve(dist, "index.html"), resolve(root, "index.html"));
writeFileSync(resolve(root, ".nojekyll"), "");
console.log("Copied dist/classic.html and dist/index.html to repo root for GitHub Pages.");
