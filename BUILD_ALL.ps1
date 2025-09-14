# PowerShell script to build all packages
Write-Host "Building Ventprom Packer..." -ForegroundColor Green

# Set encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:NODE_OPTIONS = "--max-old-space-size=4096"

try {
    Write-Host "1. Installing root dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { throw "Root install failed" }

    Write-Host "2. Building core package..." -ForegroundColor Yellow
    Set-Location "packages\core"
    npm install --legacy-peer-deps
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Core build failed" }
    Set-Location "..\..\"

    Write-Host "3. Building parsers package..." -ForegroundColor Yellow
    Set-Location "packages\parsers"
    npm install --legacy-peer-deps
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Parsers build failed" }
    Set-Location "..\..\"

    Write-Host "4. Building API..." -ForegroundColor Yellow
    Set-Location "apps\api"
    npm install --legacy-peer-deps
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "API build failed" }
    Set-Location "..\..\"

    Write-Host "5. Building Web..." -ForegroundColor Yellow
    Set-Location "apps\web"
    npm install --legacy-peer-deps
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
    Set-Location "..\..\"

    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "🚀 Ready to start with:" -ForegroundColor Cyan
    Write-Host "   API: cd apps\api && npm run start:dev" -ForegroundColor White
    Write-Host "   Web: cd apps\web && npm run dev" -ForegroundColor White
    Write-Host "   Or use: LOCAL_START.bat" -ForegroundColor White

} catch {
    Write-Host "❌ BUILD FAILED: $_" -ForegroundColor Red
    Write-Host "Check the error above and fix the issue" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue..."
