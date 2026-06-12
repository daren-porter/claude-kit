# Install home/CLAUDE.md into each Claude config dir, backing up any existing file.
# Windows symlinks need developer mode, so this installs copies; re-run after
# editing home/CLAUDE.md to refresh them.
# Run from the repo root: .\setup.ps1

$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot "home\CLAUDE.md"
if (-not (Test-Path $source)) {
    Write-Error "home\CLAUDE.md not found next to setup.ps1. Run from the repo root."
    exit 1
}

# Target the alias config dirs when they exist; otherwise the default dir.
$aliasDirs = @("$env:USERPROFILE\.claude-personal", "$env:USERPROFILE\.claude-work") | Where-Object { Test-Path $_ }
$configDirs = if ($aliasDirs) { $aliasDirs } else { @("$env:USERPROFILE\.claude") }

foreach ($dir in $configDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
    $target = Join-Path $dir "CLAUDE.md"
    # Never destroy a differing CLAUDE.md; the backup is the undo button.
    if ((Test-Path $target) -and ((Get-FileHash $target).Hash -ne (Get-FileHash $source).Hash)) {
        $backup = "$target.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $target $backup -Force
        Write-Host "Existing CLAUDE.md backed up to $backup"
    }
    Copy-Item $source $target -Force
    Write-Host "Installed $source -> $target"
}

# With alias config dirs in use, a CLAUDE.md in the default dir loads a second
# time: the directory walk from any repo under the user profile picks it up
# alongside the config dir's copy. Remove the duplicate.
$default = "$env:USERPROFILE\.claude\CLAUDE.md"
if ($aliasDirs -and (Test-Path $default)) {
    $backup = "$default.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $default $backup -Force
    Remove-Item $default
    Write-Host "Removed duplicate $default (backed up to $backup)"
}

Write-Host "Next: /plugin marketplace add daren-porter/claude-kit ; /plugin install claude-kit@daren (user scope)"
