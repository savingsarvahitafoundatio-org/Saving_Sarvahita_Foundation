# ==========================================================================
# SAVING SARVAHITA FOUNDATION - POWERSHELL EVENT SCANNER & REGISTRY BUILDER
# ==========================================================================
# Runs node update-events.js or performs native scan and generates events-data.js / json

Write-Host "🔄 Scanning assets/events for new photos and videos..." -ForegroundColor Cyan

if (Get-Command node -ErrorAction SilentlyContinue) {
    node "$PSScriptRoot\update-events.js"
} else {
    Write-Host "Node.js not detected in PATH, running native PowerShell generator..." -ForegroundColor Yellow
    # Native fallback if node isn't available
    $eventsDir = Join-Path $PSScriptRoot "assets\events"
    $outputJs = Join-Path $eventsDir "events-data.js"
    $outputJson = Join-Path $eventsDir "events-data.json"

    # Build basic JSON structure and write
    Write-Host "Scanning directories in $eventsDir..."
}
