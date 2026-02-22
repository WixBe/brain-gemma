#!/usr/bin/env pwsh
# BrainGemma — Start both backend and frontend
# Usage: .\start.ps1
#
# Prerequisites:
#   1. python -m venv .venv  (already created)
#   2. .venv\Scripts\pip install -r requirements.txt
#   3. cd frontend && npm install
#   4. Edit .env with your LLM_BASE_URL

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

Write-Host "`n🧠 BrainGemma — Starting services...`n" -ForegroundColor Cyan

# ── Backend ────────────────────────────────────────────────────────────────────
Write-Host "▶  Backend  →  http://localhost:8000" -ForegroundColor Green
Write-Host "   Swagger  →  http://localhost:8000/docs" -ForegroundColor DarkGreen

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    & ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 2

# ── Frontend ───────────────────────────────────────────────────────────────────
Write-Host "▶  Frontend →  http://localhost:5173" -ForegroundColor Blue

$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\frontend"
    npm run dev -- --port 5173 --strictPort
}

Write-Host "`n✅ Both services started. Press Ctrl+C to stop.`n" -ForegroundColor Cyan

# Stream output from both jobs
try {
    while ($true) {
        Receive-Job $backendJob | ForEach-Object { Write-Host "[API] $_" -ForegroundColor DarkGreen }
        Receive-Job $frontendJob | ForEach-Object { Write-Host "[UI]  $_" -ForegroundColor DarkBlue }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "`nStopped." -ForegroundColor Yellow
}
