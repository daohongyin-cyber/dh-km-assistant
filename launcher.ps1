$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $baseDir
$env:PYTHONDONTWRITEBYTECODE = "1"

function Ensure-Server {
    try {
        $connection = Get-NetTCPConnection -LocalPort 8123 -State Listen -ErrorAction Stop | Select-Object -First 1
        if ($connection -and $connection.OwningProcess) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 600
        }
    } catch {
    }

    Start-Process -FilePath "py" -ArgumentList "server.py" -WorkingDirectory $baseDir -WindowStyle Hidden

    for ($i = 0; $i -lt 40; $i++) {
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:8123/api/health" -UseBasicParsing | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }

    throw "Local server failed to start."
}

function Generate-MobileQr {
    Start-Process -FilePath "py" -ArgumentList "generate_mobile_qr.py" -WorkingDirectory $baseDir -Wait -NoNewWindow
}

function Start-PublicTunnel {
    Start-Process -FilePath "py" -ArgumentList "public_tunnel.py" -WorkingDirectory $baseDir -Wait -NoNewWindow
}

function Publish-FixedEntry {
    try {
        Start-Process -FilePath "py" -ArgumentList "publish_pages.py" -WorkingDirectory $baseDir -Wait -NoNewWindow
    } catch {
    }
}

function Open-Url($url) {
    $browsers = @(
        "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        "C:\Program Files\Google\Chrome\Application\chrome.exe",
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    )

    foreach ($browser in $browsers) {
        if (Test-Path $browser) {
            Start-Process -FilePath $browser -ArgumentList $url
            return
        }
    }

    Start-Process $url
}

Ensure-Server
Generate-MobileQr
Start-PublicTunnel
Publish-FixedEntry

Open-Url "http://127.0.0.1:8123"

$publicQr = Join-Path $baseDir "public-qr.png"
if (Test-Path $publicQr) {
    Open-Url $publicQr
}
