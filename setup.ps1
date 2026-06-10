# Install home/CLAUDE.md as the user-level CLAUDE.md, backing up any existing file.
# Run from the repo root: .\setup.ps1

$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot "home\CLAUDE.md"
$targetDir = Join-Path $env:USERPROFILE ".claude"
$target = Join-Path $targetDir "CLAUDE.md"

if (-not (Test-Path $source)) {
    Write-Error "home\CLAUDE.md not found next to setup.ps1. Run from the repo root."
    exit 1
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

# Never destroy an existing CLAUDE.md; the backup is the undo button.
if (Test-Path $target) {
    $backup = "$target.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $target $backup -Force
    Write-Host "Existing CLAUDE.md backed up to $backup"
}

Copy-Item $source $target -Force
Write-Host "Installed $source -> $target"
Write-Host "Next: /plugin marketplace add daren-porter/claude-kit ; /plugin install claude-kit@daren (user scope)"
