import io
import ctypes
import os
import socket
import subprocess
import textwrap
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent
PORT = 8123
URL_FILE = BASE_DIR / "mobile-url.txt"
TEXT_FILE = BASE_DIR / "mobile-info.txt"
QR_FILE = BASE_DIR / "mobile-qr.png"
DIRECT_QR_FILE = BASE_DIR / "mobile-qr-direct.png"


def mark_hidden(path: Path) -> None:
    if os.name != "nt" or not path.exists():
        return
    try:
        attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
        if attrs == -1:
            return
        ctypes.windll.kernel32.SetFileAttributesW(str(path), attrs | 0x02)
    except Exception:
        return


def reset_output(path: Path) -> None:
    if path.exists():
        if os.name == "nt":
            try:
                attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
                if attrs != -1:
                    ctypes.windll.kernel32.SetFileAttributesW(str(path), attrs & ~0x02)
            except Exception:
                pass
        path.unlink()


def get_ipv4_addresses() -> list[str]:
    command = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        (
            "$paths = Get-NetIPAddress -AddressFamily IPv4 | "
            "Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' } | "
            "Select-Object -ExpandProperty IPAddress -Unique; "
            "$paths"
        ),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    addresses = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    addresses = [address for address in addresses if not address.startswith("28.")]

    def sort_key(ip: str) -> tuple[int, str]:
        if ip.startswith("192.168."):
            return (0, ip)
        if ip.startswith("10."):
            return (1, ip)
        if ip.startswith("172."):
            return (2, ip)
        return (3, ip)

    return sorted(addresses, key=sort_key)


def build_urls() -> tuple[str, str | None, list[str]]:
    computer_name = os.environ.get("COMPUTERNAME") or socket.gethostname()
    hostname_url = f"http://{computer_name}:{PORT}/"
    ip_urls = [f"http://{ip}:{PORT}/" for ip in get_ipv4_addresses()]

    all_urls: list[str] = []
    for url in [hostname_url, *ip_urls]:
        if url not in all_urls:
            all_urls.append(url)

    fallback_url = ip_urls[0] if ip_urls else None
    return hostname_url, fallback_url, all_urls


def write_url_files(hostname_url: str, fallback_url: str | None, all_urls: list[str]) -> None:
    lines = [
        "DH KM 助理 手机访问地址",
        "",
        "优先长期入口：电脑名称地址，IP 变化时通常不用重新换图标。",
        hostname_url,
        "",
    ]
    if fallback_url:
        lines.extend(["当前备用入口：如果长期入口打不开，就用这一条。", fallback_url, ""])

    if len(all_urls) > 1:
        lines.append("其他可用地址：")
        lines.extend(all_urls[1:])
        lines.append("")

    lines.extend(
        [
            "使用说明：",
            "1. 手机和电脑要在同一个 Wi-Fi。",
            "2. 电脑需要保持开机。",
            "3. 第一次先在手机浏览器里打开一次，再添加到主屏幕。",
        ]
    )

    content = "\n".join(lines)
    reset_output(TEXT_FILE)
    reset_output(URL_FILE)
    TEXT_FILE.write_text(content, encoding="utf-8")
    URL_FILE.write_text("\n".join(all_urls), encoding="utf-8")
    mark_hidden(TEXT_FILE)
    mark_hidden(URL_FILE)


def fetch_qr_image(url: str) -> Image.Image:
    qr_url = "https://api.qrserver.com/v1/create-qr-code/?" + urllib.parse.urlencode(
        {"size": "700x700", "data": url}
    )
    request = urllib.request.Request(qr_url, headers={"User-Agent": "DH-KM-Assistant/3.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read()
    return Image.open(io.BytesIO(payload)).convert("RGBA")


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


def draw_wrapped_text(draw: ImageDraw.ImageDraw, text: str, box: tuple[int, int], font, fill, width: int) -> None:
    wrapped = "\n".join(textwrap.wrap(text, width=width))
    draw.multiline_text(box, wrapped, font=font, fill=fill, spacing=8)


def build_card(hostname_url: str, fallback_url: str | None) -> Image.Image:
    canvas = Image.new("RGBA", (1320, 1700), (58, 13, 29, 255))
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((50, 42, 1270, 1650), radius=42, fill=(255, 247, 243, 248))
    draw.text((92, 84), "DH KM 助理", fill=(140, 35, 61, 255), font=get_font(28))
    draw.text((92, 134), "手机长期入口二维码", fill=(36, 20, 24, 255), font=get_font(58, bold=True))
    draw.text(
        (92, 214),
        "左边优先长期使用，右边是当前备用入口。",
        fill=(115, 84, 93, 255),
        font=get_font(30),
    )

    left_panel = (92, 300, 620, 1110)
    right_panel = (700, 300, 1228, 1110)
    draw.rounded_rectangle(left_panel, radius=34, fill=(248, 233, 226, 255))
    draw.rounded_rectangle(right_panel, radius=34, fill=(248, 233, 226, 255))

    draw.text((132, 340), "长期入口", fill=(140, 35, 61, 255), font=get_font(36, bold=True))
    draw.text((132, 392), "优先扫这个", fill=(115, 84, 93, 255), font=get_font(26))

    hostname_qr = fetch_qr_image(hostname_url).resize((400, 400))
    canvas.alpha_composite(hostname_qr, (156, 456))
    draw_wrapped_text(draw, hostname_url, (132, 890), get_font(24), (36, 20, 24, 255), 28)

    if fallback_url:
        draw.text((740, 340), "备用入口", fill=(140, 35, 61, 255), font=get_font(36, bold=True))
        draw.text((740, 392), "长期入口打不开再扫", fill=(115, 84, 93, 255), font=get_font(26))
        fallback_qr = fetch_qr_image(fallback_url).resize((400, 400))
        canvas.alpha_composite(fallback_qr, (764, 456))
        draw_wrapped_text(draw, fallback_url, (740, 890), get_font(24), (36, 20, 24, 255), 28)
    else:
        draw.text((740, 340), "备用入口", fill=(140, 35, 61, 255), font=get_font(36, bold=True))
        draw.text((740, 392), "当前没有找到局域网 IP", fill=(115, 84, 93, 255), font=get_font(26))

    notes = [
        "1. 手机和电脑要连同一个 Wi-Fi。",
        "2. 电脑需要保持开机，服务要先启动。",
        "3. 第一次先在手机浏览器打开，再添加到主屏幕。",
        "4. 如果旧图标内容不对，删掉旧图标后重新添加。",
    ]
    draw.text((92, 1195), "使用说明", fill=(140, 35, 61, 255), font=get_font(34, bold=True))
    draw.multiline_text((92, 1250), "\n".join(notes), fill=(115, 84, 93, 255), font=get_font(28), spacing=14)

    return canvas


def build_direct_card(url: str) -> Image.Image:
    canvas = Image.new("RGBA", (1080, 1400), (58, 13, 29, 255))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((48, 42, 1032, 1352), radius=42, fill=(255, 247, 243, 248))
    draw.text((92, 84), "DH KM 助理", fill=(140, 35, 61, 255), font=get_font(28))
    draw.text((92, 138), "手机直接扫码", fill=(36, 20, 24, 255), font=get_font(58, bold=True))
    draw.text((92, 214), "打开相机直接扫这个码。", fill=(115, 84, 93, 255), font=get_font(30))

    draw.rounded_rectangle((132, 302, 948, 1118), radius=38, fill=(248, 233, 226, 255))
    qr = fetch_qr_image(url).resize((640, 640))
    canvas.alpha_composite(qr, (220, 390))

    draw.text((92, 1180), "当前直连地址", fill=(140, 35, 61, 255), font=get_font(28, bold=True))
    draw_wrapped_text(draw, url, (92, 1230), get_font(28), (36, 20, 24, 255), 34)
    return canvas


def main() -> None:
    hostname_url, fallback_url, all_urls = build_urls()
    write_url_files(hostname_url, fallback_url, all_urls)
    card = build_card(hostname_url, fallback_url)
    direct_url = fallback_url or hostname_url
    direct_card = build_direct_card(direct_url)
    reset_output(QR_FILE)
    reset_output(DIRECT_QR_FILE)
    card.save(QR_FILE)
    direct_card.save(DIRECT_QR_FILE)
    mark_hidden(QR_FILE)
    mark_hidden(DIRECT_QR_FILE)
    print(hostname_url)
    if fallback_url:
        print(fallback_url)
    print(QR_FILE)


if __name__ == "__main__":
    main()
