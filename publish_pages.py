import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
URL_FILE = BASE_DIR / "public-url.txt"
DOCS_URL_FILE = DOCS_DIR / "url.json"
GIT_EXE = Path(r"C:\Program Files\Git\cmd\git.exe")
GH_EXE = Path(r"C:\Program Files\GitHub CLI\gh.exe")


def write_docs_url() -> str:
    if not URL_FILE.exists():
        raise RuntimeError("public-url.txt not found")

    public_url = URL_FILE.read_text(encoding="utf-8").strip()
    if not public_url.startswith("http"):
        raise RuntimeError("public url is empty")

    payload = {
        "url": public_url,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    DOCS_URL_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return public_url


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [str(GIT_EXE), "-C", str(BASE_DIR), *args],
        capture_output=True,
        text=True,
        check=False,
    )


def has_remote() -> bool:
    result = git("remote", "-v")
    return result.returncode == 0 and bool(result.stdout.strip())


def can_push() -> bool:
    result = subprocess.run(
        [str(GH_EXE), "auth", "status"],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0


def sync_repo() -> None:
    if not has_remote() or not can_push():
        return

    git("add", "docs/url.json")
    status = git("status", "--short", "docs/url.json")
    if not status.stdout.strip():
        return

    git("commit", "-m", "Update public entry url")
    git("push", "origin", "main")


def main() -> None:
    public_url = write_docs_url()
    sync_repo()
    print(public_url)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise
