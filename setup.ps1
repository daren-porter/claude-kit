# Wire the user-level CLAUDE.md to the kit's canonical scheme on Windows: one real file
# at ~\.claude\CLAUDE.md, with each alias config dir's CLAUDE.md symlinked to it (Claude
# Code dedupes the directory-walk copy against the config-dir copy by realpath, so the
# rules load once). Symlinks need Developer Mode or an elevated shell; if creation fails
# this falls back to a copy and warns (copies do not auto-update or dedupe, so re-run
# after the rules change).
#
# Most users do NOT need this: install the plugin and accept the reconcile offer (or run
# the reconcile-claude-md skill), which writes ~\.claude\CLAUDE.md for you. This only
# points alias config dirs (CLAUDE_CONFIG_DIR profiles) at that one file.
# Run from the repo root: .\setup.ps1

$ErrorActionPreference = 'Stop'

# The recommended content ships in the plugin; the repo is only the author's edit source.
$asset = Join-Path $PSScriptRoot "plugins\claude-kit\assets\CLAUDE.md"
if (-not (Test-Path $asset)) {
    Write-Error "Plugin asset not found: $asset. Run from the repo root."
    exit 1
}

$claudeDir = Join-Path $env:USERPROFILE ".claude"
$canon = Join-Path $claudeDir "CLAUDE.md"
New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
function Backup-To($path) {
    # Timestamped backup that never clobbers an existing one (same-second safe).
    $b = "$path.bak.$stamp"; $c = 1
    while (Test-Path $b) { $b = "$path.bak.${stamp}_$c"; $c++ }
    Copy-Item $path $b -Force
}

# 1) Ensure the canonical real file exists; only create it (from the asset) when absent,
#    never clobbering an existing real canonical that may hold merged customizations. A
#    stray link at the canonical path is replaced by a real file.
$createdCanonical = $false
$canonItem = Get-Item $canon -ErrorAction SilentlyContinue
if ($canonItem -and $canonItem.LinkType -eq 'SymbolicLink') {
    Backup-To $canon
    Remove-Item $canon -Force
    Write-Host "Replaced a stray symlink at $canon (backed up)."
}
if (-not (Test-Path $canon)) {
    Copy-Item $asset $canon -Force
    $createdCanonical = $true
    Write-Host "Created canonical $canon from the plugin asset."
} else {
    Write-Host "Kept existing canonical $canon (not overwritten)."
}

# 2) Point each present alias config dir's CLAUDE.md at the canonical: symlink if possible,
#    else copy with a warning. Back up anything replaced.
$aliasDirs = @("$env:USERPROFILE\.claude-personal", "$env:USERPROFILE\.claude-work") | Where-Object { Test-Path $_ }
$canonFull = [IO.Path]::GetFullPath($canon)
foreach ($dir in $aliasDirs) {
    $target = Join-Path $dir "CLAUDE.md"
    $existing = Get-Item $target -ErrorAction SilentlyContinue
    if ($existing -and $existing.LinkType -eq 'SymbolicLink') {
        $existingTarget = @($existing.Target)[0]
        if ($existingTarget -and ([IO.Path]::GetFullPath($existingTarget) -eq $canonFull)) {
            Write-Host "Already linked: $target -> $canon"
            continue
        }
    }
    if (Test-Path $target) {
        Backup-To $target
        Remove-Item $target -Force
        Write-Host "Backed up $target"
    }
    try {
        New-Item -ItemType SymbolicLink -Path $target -Target $canon -Force | Out-Null
        Write-Host "Linked $target -> $canon"
    } catch {
        # Mirror the canonical (which may hold the user's merged customizations), not the
        # pristine asset; copies do not track future canonical edits.
        Copy-Item $canon $target -Force
        Write-Warning "Could not symlink ($target); Developer Mode off? Copied the canonical file instead. Copies do not auto-update or dedupe; re-run after the rules change."
    }
}

# 3) Record the sync marker + baseline only when this run created the canonical from the
#    asset (so it equals the recommended); otherwise leave the marker for the skill.
if ($createdCanonical) {
    (Get-FileHash $asset -Algorithm SHA256).Hash.ToLower() | Set-Content -NoNewline (Join-Path $claudeDir ".claude-kit-md-version")
    Copy-Item $asset (Join-Path $claudeDir ".claude-kit-md-base.md") -Force
    Write-Host "Recorded sync marker and baseline."
} else {
    Write-Host "Left the sync marker as-is; run the reconcile-claude-md skill to reconcile."
}

Write-Host "Done. Update the rules later with the reconcile-claude-md skill (or re-run this)."
