import json
import shutil
from pathlib import Path

import server


BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(exist_ok=True)

STATIC_FILES = [
    "index.html",
    "app.js",
    "styles.css",
    "service-worker.js",
    "manifest.webmanifest",
    "icon.svg",
    "icon-192.png",
    "icon-512.png",
    "apple-touch-icon.png",
]


def sync_static_files() -> None:
    for name in STATIC_FILES:
        shutil.copy2(BASE_DIR / name, DOCS_DIR / name)

    (DOCS_DIR / ".nojekyll").write_text("", encoding="utf-8")


def write_briefing() -> None:
    payload = server.build_digest()
    target = DOCS_DIR / "briefing.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    sync_static_files()
    write_briefing()


if __name__ == "__main__":
    main()
