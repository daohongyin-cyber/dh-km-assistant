import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BASE_DIR = process.cwd();
const DOCS_DIR = path.join(BASE_DIR, "docs");

const STATIC_FILES = [
  "index.html",
  "app.js",
  "styles.css",
  "service-worker.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "loading-preview.html",
  "content.js",
];

function copyStaticFiles() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  for (const file of STATIC_FILES) {
    fs.copyFileSync(path.join(BASE_DIR, file), path.join(DOCS_DIR, file));
  }
  fs.writeFileSync(path.join(DOCS_DIR, ".nojekyll"), "", "utf8");
}

const build = spawnSync(process.execPath, [path.join(BASE_DIR, "build_content.mjs")], {
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

copyStaticFiles();
