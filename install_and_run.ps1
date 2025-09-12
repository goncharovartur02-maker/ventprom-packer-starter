# Ventprom Packer Setup Script
Write-Host "🚀 Ventprom Packer Setup Script" -ForegroundColor Green
Write-Host ""

# Step 1: Find Node.js and npm
Write-Host "📋 Step 1: Finding Node.js and npm..." -ForegroundColor Yellow

# Try to find Node.js in common locations
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe",
    "$env:LOCALAPPDATA\nodejs\node.exe"
)

$nodePath = $null
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodePath = $path
        break
    }
}

if (-not $nodePath) {
    Write-Host "❌ Node.js not found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   Make sure to check 'Add to PATH' during installation" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js found at: $nodePath" -ForegroundColor Green

# Try to find npm
$npmPaths = @(
    "C:\Program Files\nodejs\npm.cmd",
    "C:\Program Files (x86)\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd"
)

$npmPath = $null
foreach ($path in $npmPaths) {
    if (Test-Path $path) {
        $npmPath = $path
        break
    }
}

if (-not $npmPath) {
    Write-Host "❌ npm not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Please reinstall Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ npm found at: $npmPath" -ForegroundColor Green

# Test Node.js version
try {
    $nodeVersion = & $nodePath --version
    Write-Host "📦 Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Could not get Node.js version" -ForegroundColor Red
    exit 1
}

# Test npm version
try {
    $npmVersion = & $npmPath --version
    Write-Host "📦 npm version: $npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Could not get npm version" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow

try {
    & $npmPath install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Try running: npm cache clean --force" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 3: Start the application
Write-Host "🚀 Step 3: Starting the application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 The application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📁 Upload your example files to test the universal parser" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

try {
    & $npmPath run dev
} catch {
    Write-Host "❌ Failed to start the application" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}




