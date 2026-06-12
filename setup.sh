#!/usr/bin/env sh
# Link home/CLAUDE.md as the single user-level CLAUDE.md: one symlink per Claude
# config dir (the CLAUDE_CONFIG_DIR alias dirs), so editing the repo file updates
# every profile and git is the version history. Keep the checkout in place; the
# links point into it.
# Run from the repo root: ./setup.sh

set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SOURCE="$SCRIPT_DIR/home/CLAUDE.md"

if [ ! -f "$SOURCE" ]; then
    echo "home/CLAUDE.md is missing next to setup.sh (incomplete checkout?)." >&2
    exit 1
fi

# Target the alias config dirs when they exist; otherwise the default dir.
ALIAS_DIRS=""
for DIR in "$HOME/.claude-personal" "$HOME/.claude-work"; do
    [ -d "$DIR" ] && ALIAS_DIRS="$ALIAS_DIRS $DIR"
done

if [ -n "$ALIAS_DIRS" ]; then
    CONFIG_DIRS="$ALIAS_DIRS"
else
    CONFIG_DIRS="$HOME/.claude"
fi

for DIR in $CONFIG_DIRS; do
    mkdir -p "$DIR"
    TARGET="$DIR/CLAUDE.md"
    # Never destroy an existing real file; the backup is the undo button.
    if [ -f "$TARGET" ] && [ ! -L "$TARGET" ]; then
        BACKUP="$TARGET.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$TARGET" "$BACKUP"
        echo "Existing CLAUDE.md backed up to $BACKUP"
    fi
    ln -sf "$SOURCE" "$TARGET"
    echo "Linked $TARGET -> $SOURCE"
done

# With alias config dirs in use, a CLAUDE.md in the default dir loads a second
# time: the directory walk from any repo under $HOME picks it up alongside the
# config dir's copy. Remove the duplicate rather than linking it.
DEFAULT="$HOME/.claude/CLAUDE.md"
if [ -n "$ALIAS_DIRS" ] && { [ -e "$DEFAULT" ] || [ -L "$DEFAULT" ]; }; then
    if [ -f "$DEFAULT" ] && [ ! -L "$DEFAULT" ]; then
        BACKUP="$DEFAULT.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$DEFAULT" "$BACKUP"
        echo "Duplicate $DEFAULT backed up to $BACKUP"
    fi
    rm -f "$DEFAULT"
    echo "Removed $DEFAULT (would double-load alongside the config-dir links)"
fi

echo "Next: /plugin marketplace add daren-porter/claude-kit ; /plugin install claude-kit@daren (user scope)"
