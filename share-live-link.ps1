<#
.SYNOPSIS
    CampusBridge AI - Live Public Shareable Link Generator.
.DESCRIPTION
    Launches a secure Cloudflare Tunnel pointing to Next.js (Port 3000), which
    proxies to FastAPI (Port 8000) and Qwen 2.5 on localhost:11434 via /api/backend/*.
    Outputs an instant public https:// URL that can be opened on any device.
.EXAMPLE
    .\share-live-link.ps1
#>

[CmdletBinding()]
param(
    [int]$Port = 3000,
    [int]$BackendPort = 8000
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor White
    Write-Host ("=" * 72) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "  [i] $Text" -ForegroundColor Yellow
}

Clear-Host
Write-Header "CampusBridge AI - Live Public Sharing Launcher"
Write-Host "  Generating instant public HTTPS URL via Cloudflare Tunnel..." -ForegroundColor DarkGray

# 1. Verify Next.js and FastAPI services
Write-Header "Step 1: Checking Local Services"

$WebOk = $false
try {
    $res = Invoke-WebRequest -Uri "http://localhost:$Port" -Method Head -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) { $WebOk = $true }
} catch {}

if (-not $WebOk) {
    Write-Info "Next.js studio frontend not detected on port $Port. Launching..."
    $WebDir = Join-Path $ScriptDir "apps\web"
    Start-Process -FilePath "cmd.exe" -ArgumentList ("/c cd /d " + [char]34 + $WebDir + [char]34 + " && npm start") -PassThru -NoNewWindow | Out-Null
    Start-Sleep -Seconds 3
}
Write-Success "Next.js Studio Frontend is active on port $Port"

$ApiOk = $false
try {
    $res = Invoke-WebRequest -Uri "http://localhost:$BackendPort/docs" -Method Head -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) { $ApiOk = $true }
} catch {}

if (-not $ApiOk) {
    Write-Info "FastAPI backend not detected on port $BackendPort. Launching..."
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn services.api.main:app --host 0.0.0.0 --port $BackendPort" -WorkingDirectory $ScriptDir -PassThru -NoNewWindow | Out-Null
    Start-Sleep -Seconds 2
}
Write-Success "FastAPI AI Backend is active on port $BackendPort"
Write-Success "Unified Proxy active: Next.js /api/backend/* -> FastAPI :$BackendPort"

# 2. Launch Cloudflare Tunnel
Write-Header "Step 2: Establishing Secure Public Tunnel"
Write-Host "  Requesting public ingress for http://localhost:$Port..." -ForegroundColor White

$TunnelProcess = $null
$PublicUrl = $null
$LogFile = [System.IO.Path]::GetTempFileName()

try {
    $TunnelProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npx --yes cloudflared tunnel --url http://localhost:$Port > `"$LogFile`" 2>&1" `
        -PassThru -NoNewWindow

    $TimeoutSec = 30
    $Elapsed = 0

    while ($Elapsed -lt $TimeoutSec) {
        Start-Sleep -Seconds 1
        $Elapsed++
        if (Test-Path $LogFile) {
            $LogContent = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
            if ($LogContent -match '(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                $PublicUrl = $Matches[1]
                break
            }
            # Fallback for localtunnel if cloudflared fails
            if ($LogContent -match 'your url is:\s*(https:\/\/[^\s]+)') {
                $PublicUrl = $Matches[1]
                break
            }
        }
    }

    if (-not $PublicUrl) {
        Write-Info "Cloudflare tunnel negotiating... trying alternative localtunnel fallback..."
        $TunnelProcess = Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c npx --yes localtunnel --port $Port > `"$LogFile`" 2>&1" `
            -PassThru -NoNewWindow
        
        $Elapsed = 0
        while ($Elapsed -lt 15) {
            Start-Sleep -Seconds 1
            $Elapsed++
            if (Test-Path $LogFile) {
                $LogContent = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
                if ($LogContent -match '(https:\/\/[a-zA-Z0-9-]+\.loca\.lt)') {
                    $PublicUrl = $Matches[1]
                    break
                }
            }
        }
    }

    if ($PublicUrl) {
        Write-Header "CampusBridge AI - Live Public Link Ready!"
        Write-Host ""
        Write-Host "  +------------------------------------------------------------------------+" -ForegroundColor Green
        Write-Host "  |  SHAREABLE PUBLIC DEMO URL:                                            |" -ForegroundColor Green
        Write-Host "  |                                                                        |" -ForegroundColor Green
        Write-Host ("  |  " + $PublicUrl.PadRight(70) + "|") -ForegroundColor Yellow
        Write-Host "  |                                                                        |" -ForegroundColor Green
        Write-Host "  +------------------------------------------------------------------------+" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Key Capabilities Live on this Public URL:" -ForegroundColor White
        Write-Host "  * Student Career Hub : Full overview, progress radar, and verified skills" -ForegroundColor Cyan
        Write-Host "  * AI Career Companion : Real-time Qwen 2.5 conversations with trace pill" -ForegroundColor Cyan
        Write-Host "  * What-If Fit Sandbox : Instant deterministic score simulation" -ForegroundColor Cyan
        Write-Host "  * 120s Micro-Defense  : Proof-of-work technical defenses" -ForegroundColor Cyan
        Write-Host "  * 4 Persona Switches  : Student, Placement Officer, Recruiter, Faculty" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Open this link on any mobile phone, iPad, or remote laptop anywhere." -ForegroundColor Green
        Write-Host "  Press Ctrl+C to terminate the public tunnel." -ForegroundColor DarkGray
        Write-Host ""

        # Keep running
        while ($true) {
            Start-Sleep -Seconds 2
        }
    } else {
        Write-Host "  [!] Could not automatically capture tunnel URL within timeout." -ForegroundColor Red
        Write-Host "  Check manual log: $LogFile" -ForegroundColor Yellow
    }
} finally {
    if ($TunnelProcess -and -not $TunnelProcess.HasExited) {
        Stop-Process -Id $TunnelProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $LogFile -Force -ErrorAction SilentlyContinue
}

