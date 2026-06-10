#!/usr/bin/env sh
# Install home/CLAUDE.md as the user-level CLAUDE.md, backing up any existing file.
# Run from the repo root: ./setup.sh

set -e

# Resolve paths relative to this script so it only works from a full checkout.
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SOURCE="$SCRIPT_DIR/home/CLAUDE.md"
TARGET_DIR="$HOME/.claude"
TARGET="$TARGET_DIR/CLAUDE.md"

if [ ! -f "$SOURCE" ]; then
    echo "home/CLAUDE.md is missing next to setup.sh (incomplete checkout?)." >&2
    exit 1
fi

mkdir -p "$TARGET_DIR"

# Never destroy an existing CLAUDE.md; the backup is the undo button.
if [ -f "$TARGET" ]; then
    BACKUP="$TARGET.bak.$(date +%Y%m%d-%H%M%S)"
    cp "$TARGET" "$BACKUP"
    echo "Existing CLAUDE.md backed up to $BACKUP"
fi

cp "$SOURCE" "$TARGET"
echo "Installed $SOURCE -> $TARGET"
echo "Next: /plugin marketplace add daren-porter/claude-kit ; /plugin install claude-kit@daren (user scope)"
