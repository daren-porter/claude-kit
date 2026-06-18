#!/usr/bin/env sh
# Wire the user-level CLAUDE.md to the kit's canonical scheme: one real file at
# ~/.claude/CLAUDE.md, with each alias config dir's CLAUDE.md (the CLAUDE_CONFIG_DIR
# profiles, e.g. ~/.claude-work, ~/.claude-personal) symlinked to it. Claude Code
# dedupes the directory-walk copy against the config-dir copy by realpath, so the
# rules load exactly once, and the symlink keeps them loading for repos outside $HOME.
#
# Most users do NOT need this: install the plugin and accept the reconcile offer (or
# run the reconcile-claude-md skill), which writes ~/.claude/CLAUDE.md for you. This
# script does only the one thing the plugin cannot: point alias config dirs at that
# single canonical file. Idempotent; backs up anything it replaces.
# Run from the repo root: ./setup.sh

set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# The recommended content ships in the plugin; the repo is only the author's edit source.
ASSET="$SCRIPT_DIR/plugins/claude-kit/assets/CLAUDE.md"
if [ ! -f "$ASSET" ]; then
    echo "Plugin asset missing: $ASSET (incomplete checkout?)." >&2
    exit 1
fi

CANON="$HOME/.claude/CLAUDE.md"
mkdir -p "$HOME/.claude"
ts() { date +%Y%m%d-%H%M%S; }
# Back up a path to a timestamped name without ever clobbering an existing backup
# (safe even for two runs within the same second).
backup_to() {
    b="$1.bak.$(ts)"; c=1
    while [ -e "$b" ]; do b="$1.bak.$(ts)_$c"; c=$((c + 1)); done
    cp -a "$1" "$b" 2>/dev/null || true
}

# 1) Ensure the canonical real file exists. Never clobber an existing real canonical -
#    it may hold merged customizations; only create it (from the asset) when absent. A
#    stray symlink at the canonical path is replaced by a real file.
created_canonical=false
if [ -L "$CANON" ]; then
    backup_to "$CANON"
    rm -f "$CANON"
    echo "Replaced a stray symlink at $CANON (backed up)."
fi
if [ ! -e "$CANON" ]; then
    cp "$ASSET" "$CANON"
    created_canonical=true
    echo "Created canonical $CANON from the plugin asset."
else
    echo "Kept existing canonical $CANON (not overwritten)."
fi

# 2) Point each present alias config dir's CLAUDE.md at the canonical. Back up any real
#    file or differing symlink first; skip dirs already linked correctly (idempotent).
for DIR in "$HOME/.claude-personal" "$HOME/.claude-work"; do
    [ -d "$DIR" ] || continue
    TARGET="$DIR/CLAUDE.md"
    if [ "$(readlink "$TARGET" 2>/dev/null)" = "$CANON" ]; then
        echo "Already linked: $TARGET -> $CANON"
        continue
    fi
    if [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
        backup_to "$TARGET"
        echo "Backed up $TARGET"
    fi
    ln -sf "$CANON" "$TARGET"
    echo "Linked $TARGET -> $CANON"
done

# 3) Only when this run created the canonical from the asset (so it equals the
#    recommended) do we record the sync marker + baseline, so the SessionStart hook does
#    not immediately nag. If the canonical pre-existed, leave the marker alone and let the
#    reconcile-claude-md skill compare and reconcile.
if [ "$created_canonical" = true ]; then
    HASH=$( { sha256sum "$ASSET" 2>/dev/null || shasum -a 256 "$ASSET"; } | cut -d' ' -f1 )
    printf '%s' "$HASH" > "$HOME/.claude/.claude-kit-md-version"
    cp "$ASSET" "$HOME/.claude/.claude-kit-md-base.md"
    echo "Recorded sync marker and baseline."
else
    echo "Left the sync marker as-is; run the reconcile-claude-md skill to reconcile."
fi

echo "Done. Update the rules later with the reconcile-claude-md skill (or re-run this)."
