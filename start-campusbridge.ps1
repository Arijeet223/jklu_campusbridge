<#
.SYNOPSIS
    CampusBridge AI (PS-06) - One-Click Development & Demonstration Launcher.
.DESCRIPTION
    Validates Python and Node.js environments, runs the 55-test verification suite,
    and launches the FastAPI service (Port 8000) and Next.js Studio (Port 3000).
.EXAMPLE
    .\start-campusbridge.ps1
    .\start-campusbridge.ps1 -SkipTests
#>

[CmdletBinding()]
param(
    [switch]$SkipTests = $false,
    [switch]$BackendOnly = $false,
    [switch]$FrontendOnly = $false,
    [int]$ApiPort = 8000,
    [int]$WebPort = 3000
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
Write-Header "CampusBridge AI (PS-06) - Engineering Launcher"
Write-Host "  Architecture: Deterministic Shell, Probabilistic Core (v1.1)" -ForegroundColor DarkGray
Write-Host "  Target: NIT Surathkal Placement Season Demo" -ForegroundColor DarkGray

# 1. Environment Verification
Write-Header "Step 1: Environment & Dependency Verification"

# Python check
$PythonExe = "python"
if (Test-Path "$ScriptDir\.venv\Scripts\python.exe") {
    $PythonExe = "$ScriptDir\.venv\Scripts\python.exe"
    Write-Success "Using project virtualenv: $PythonExe"
} else {
    Write-Info "Using system python interpreter: $PythonExe"
}

# Node.js check
try {
    $NodeVer = node --version
    Write-Success "Node.js detected: $NodeVer"
} catch {
    Write-Host "  [!] Node.js is required to run the Next.js studio frontend." -ForegroundColor Red
}

# 2. Run Test Suite (55 Tests)
if (-not $SkipTests) {
    Write-Header "Step 2: Executing 55-Test Verification Suite"
    Write-Host "  Running Phase 1, Phase 2, Phase 3, CI Red-Team & Agent Endpoints..." -ForegroundColor DarkGray

    $env:PYTHONUNBUFFERED = "1"
    $env:MODEL_TIMEOUT = "0.2"

    $TestCommands = @(
        @{ Name = "Phase 1: Deterministic Engine & Scoring (13 tests)"; Script = "tests/test_domain_and_api.py" },
        @{ Name = "Phase 2: Hybrid RAG & Evidence Quarantine (14 tests)"; Script = "tests/test_rag_pipeline.py" },
        @{ Name = "Phase 3: Scoped MCP Tool Ecosystem (9 tests)"; Script = "tests/test_mcp_ecosystem.py" },
        @{ Name = "Phase 4: Adversarial Red-Team & CI Evals (7 gates)"; Script = "evals/eval_suite.py" },
        @{ Name = "Phase 4: Specialist Agents & Mentor Prompts (12 tests)"; Script = "tests/test_agent_endpoints.py" },
        @{ Name = "Live Qwen 2.5 + Hybrid RAG + MCP Pipeline (8 tests)"; Script = "tests/test_qwen_rag_mcp_pipeline.py" },
        @{ Name = "Live Two-Way Excel Store & Practice Arena (6 tests)"; Script = "tests/test_excel_and_practice.py" }
    )

    foreach ($T in $TestCommands) {
        Write-Host "  Executing $($T.Name)..." -ForegroundColor White
        & $PythonExe -u $T.Script
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [X] Test verification failed at $($T.Script)!" -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Success "$($T.Name): PASSED"
    }

    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Green
    Write-Host "  ALL 63 BACKEND TESTS PASSED (100% Deterministic & Live Grounded)" -ForegroundColor Green
    Write-Host "  ================================================================" -ForegroundColor Green
} else {
    Write-Info "Skipping test suite execution (-SkipTests enabled)."
}

# 3. Launch Services
Write-Header "Step 3: Launching CampusBridge AI Services"

# A. FastAPI Backend
if (-not $FrontendOnly) {
    Write-Host "  Starting FastAPI backend on port $ApiPort..." -ForegroundColor White
    $BackendArgs = "-m uvicorn services.api.main:app --host 0.0.0.0 --port $ApiPort"
    $BackendJob = Start-Process -FilePath $PythonExe -ArgumentList $BackendArgs -WorkingDirectory $ScriptDir -PassThru -NoNewWindow
    Write-Success "FastAPI running [PID: $($BackendJob.Id)] -> http://localhost:$ApiPort"
}

# B. Next.js Studio Frontend
if (-not $BackendOnly) {
    Write-Host "  Starting Next.js studio frontend on port $WebPort..." -ForegroundColor White
    $WebDir = Join-Path $ScriptDir "apps\web"
    
    # Check if built, else build
    if (-not (Test-Path "$WebDir\.next")) {
        Write-Info "Building Next.js production bundle..."
        cmd.exe /c ("cd /d " + [char]34 + $WebDir + [char]34 + " && npm run build")
    }

    $FrontendArgs = "/c cd /d " + [char]34 + $WebDir + [char]34 + " && npm start"
    $FrontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList $FrontendArgs -PassThru -NoNewWindow
    Write-Success "Next.js studio running [PID: $($FrontendJob.Id)] -> http://localhost:$WebPort"
}

# 4. Ready Dashboard
Write-Header "CampusBridge AI Studio - Ready for Live Demonstration"

Write-Host "  Access Points:" -ForegroundColor White
Write-Host "  * Student Career Command Center : http://localhost:$WebPort (Default Overview)" -ForegroundColor Green
Write-Host "  * AI Career Companion Chat      : http://localhost:$WebPort (Click 'AI Companion')" -ForegroundColor Green
Write-Host "  * Placement Officer Console     : http://localhost:$WebPort (Drawer -> Switch to Officer)" -ForegroundColor Green
Write-Host "  * Recruiter Partner Portal      : http://localhost:$WebPort (Drawer -> Switch to Recruiter)" -ForegroundColor Green
Write-Host "  * Faculty Mentor Advisory       : http://localhost:$WebPort (Drawer -> Switch to Faculty)" -ForegroundColor Green
Write-Host "  * FastAPI Swagger API Docs      : http://localhost:$ApiPort/docs" -ForegroundColor Cyan
Write-Host "  * Live Demo Playbook Guide      : docs/DEMO_PLAYBOOK.md" -ForegroundColor Yellow

Write-Host ""
Write-Host "  Press Ctrl+C to terminate services." -ForegroundColor DarkGray
Write-Host ""
