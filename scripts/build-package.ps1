#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$distDir = Join-Path $repoRoot "dist"

Push-Location $repoRoot
try {
    if (-not (Test-Path $distDir)) {
        New-Item -ItemType Directory -Path $distDir | Out-Null
    }

    npm run lint
    npm run compile
    npx vsce package `
        --allow-missing-repository `
        --baseContentUrl https://github.com/placeholder/vscode-mcp-hook `
        --out $distDir
}
finally {
    Pop-Location
}
