import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent
CLOUDFLARED_EXE = BASE_DIR / "cloudflared.exe"
PID_FILE = BASE_DIR / "public-tunnel.pid"
URL_FILE = BASE_DIR / "public-url.txt"
QR_FILE = BASE_DIR / "public-qr.png"
LOG_FILE = BASE_DIR / "public-tunnel.log"
PUBLIC_URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com", re.I)
LATEST_RELEASE_API = "https://api.github.com/repos/cloudflare/cloudflared/releases/latest"
DOWNLOAD_NAME = "cloudflared-windows-amd64.exe"


def hide_file(path: Path) -> None:
    if os.name != "nt" or not path.exists():
        return
    try:
        import ctypes

        attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
        if attrs != -1:
            ctypes.windll.kernel32.SetFileAttributesW(str(path), attrs | 0x02)
    except Exception:
        return


def unhide_file(path: Path) -> None:
    if os.name != "nt" or not path.exists():
        return
    try:
        import ctypes

        attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
        if attrs != -1:
            ctypes.windll.kernel32.SetFileAttributesW(str(path), attrs & ~0x02)
    except Exception:
        return


def reset_output(path: Path) -> None:
    if path.exists():
        unhide_file(path)
        path.unlink()


def request_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "DH-KM-Assistant/3.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def ensure_cloudflared() -> None:
    if CLOUDFLARED_EXE.exists():
        return

    data = request_json(LATEST_RELEASE_API)
    download_url = None
    for asset in data.get("assets", []):
        if asset.get("name") == DOWNLOAD_NAME:
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        raise RuntimeError("cloudflared download URL not found")

    request = urllib.request.Request(download_url, headers={"User-Agent": "DH-KM-Assistant/3.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        CLOUDFLARED_EXE.write_bytes(response.read())
    hide_file(CLOUDFLARED_EXE)


def stop_previous_tunnel() -> None:
    if not PID_FILE.exists():
        return

    try:
        pid = int(PID_FILE.read_text(encoding="utf-8").strip())
    except Exception:
        pid = None

    if pid:
        subprocess.run(
            ["taskkill", "/PID", str(pid), "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

    reset_output(PID_FILE)
    reset_output(LOG_FILE)


def start_tunnel() -> subprocess.Popen:
    reset_output(LOG_FILE)
    log_file = LOG_FILE.open("w", encoding="utf-8")
    hide_file(LOG_FILE)

    process = subprocess.Popen(
        [str(CLOUDFLARED_EXE), "tunnel", "--url", "http://127.0.0.1:8123", "--no-autoupdate"],
        stdout=log_file,
        stderr=subprocess.STDOUT,
        cwd=str(BASE_DIR),
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    PID_FILE.write_text(str(process.pid), encoding="utf-8")
    hide_file(PID_FILE)
    return process


def wait_for_public_url(timeout_seconds: int = 35) -> str:
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        if LOG_FILE.exists():
            content = LOG_FILE.read_text(encoding="utf-8", errors="ignore")
            match = PUBLIC_URL_RE.search(content)
            if match:
                return match.group(0)
        time.sleep(0.5)

    raise RuntimeError("public tunnel URL was not generated in time")


def get_font(size: int, bold: bool = False):
    candidates = []
    if bold:
        candidates.extend(
            [
                r"C:\Windows\Fonts\msyhbd.ttc",
                r"C:\Windows\Fonts\simhei.ttf",
            ]
        )
    candidates.extend(
        [
            r"C:\Windows\Fonts\msyh.ttc",
            r"C:\Windows\Fonts\simsun.ttc",
            r"C:\Windows\Fonts\arial.ttf",
        ]
    )
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default()


def fetch_qr_image(url: str) -> Image.Image:
    qr_url = "https://api.qrserver.com/v1/create-qr-code/?" + urllib.parse.urlencode(
        {"size": "900x900", "data": url}
    )
    request = urllib.request.Request(qr_url, headers={"User-Agent": "DH-KM-Assistant/3.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read()
    return Image.open(io.BytesIO(payload)).convert("RGBA")


def build_qr_card(url: str) -> None:
    reset_output(QR_FILE)
    qr = fetch_qr_image(url).resize((700, 700))
    card = Image.new("RGBA", (1080, 1380), (58, 13, 29, 255))
    draw = ImageDraw.Draw(card)

    draw.rounded_rectangle((48, 42, 1032, 1332), radius=42, fill=(255, 247, 243, 248))
    draw.text((92, 86), "DH KM 助理", fill=(140, 35, 61, 255), font=get_font(28))
    draw.text((92, 138), "手机直接扫码", fill=(36, 20, 24, 255), font=get_font(58, bold=True))
    draw.text((92, 216), "不再走同 Wi-Fi 局域网，直接用临时公网链接。", fill=(115, 84, 93, 255), font=get_font(28))
    draw.rounded_rectangle((140, 302, 940, 1102), radius=36, fill=(248, 233, 226, 255))
    card.alpha_composite(qr, (190, 352))
    draw.text((92, 1160), "当前访问地址", fill=(140, 35, 61, 255), font=get_font(28, bold=True))
    draw.text((92, 1210), url, fill=(36, 20, 24, 255), font=get_font(25))

    card.save(QR_FILE)
    hide_file(QR_FILE)


def main() -> None:
    ensure_cloudflared()
    stop_previous_tunnel()
    start_tunnel()
    public_url = wait_for_public_url()

    reset_output(URL_FILE)
    URL_FILE.write_text(public_url, encoding="utf-8")
    hide_file(URL_FILE)

    build_qr_card(public_url)

    print(public_url)
    print(QR_FILE)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise
