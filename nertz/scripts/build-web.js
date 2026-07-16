/* build-web.js — assemble a clean static frontend folder (dist-web/) for
 * bundlers that want a single web root (e.g. Tauri's frontendDist). Copies the
 * game's static assets without node_modules / build configs.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist-web");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const item of ["index.html", "css", "js", "assets"]) {
  const src = path.join(root, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(out, item), { recursive: true });
}

console.log("dist-web assembled at", out);
