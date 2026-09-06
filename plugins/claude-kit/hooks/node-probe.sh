#!/bin/sh
# SessionStart probe: the one kit hook that does not need Node, because it exists
# to report that Node is missing.
#
# Every other hook in hooks.json runs as `node "${CLAUDE_PLUGIN_ROOT}/hooks/<f>.js"`,
# and Claude Code bundles no Node on any install path (native installer, Homebrew,
# WinGet, apt/dnf/apk, the desktop app; the npm method needs Node only to install).
# So on a machine without Node every guard fails open, compaction recovery never
# fires, the goal leash never holds, and the plugin still lists its skills.
#
# THAT FAILURE IS SILENT, and it was verified rather than assumed on 2026-09-06.
# A hook whose command cannot be spawned is recorded as exit_code 127 with
# outcome "error" in the hook_response event, and that event is visible ONLY under
# `--output-format stream-json --verbose`. An ordinary session prints nothing at
# all. The measurement: a deliberately unspawnable SessionStart hook registered
# via `claude -p --settings`, whose session printed only its answer while the
# stream carried `/bin/sh: 1: <cmd>: not found` and outcome "error".
#
# WHY A SHELL SCRIPT IS SAFE HERE, which is what the backlog item could not price.
# That same measurement shows hook commands are run through /bin/sh on POSIX (the
# error text is the shell's own), so this script runs. On Windows, where no `sh`
# is on PATH, this hook fails to spawn and is therefore silent - the very property
# measured above. The Windows half costs nothing rather than adding noise, which
# is why "POSIX-only" stopped being an objection to building it.
#
# Silence is success: when Node is present this prints nothing and exits 0, which
# is one extra process per session start and no output.
#
# It cannot cover every case and does not pretend to. A `node` on PATH here is not
# proof that the Node which Claude Code spawns for the other hooks is the same one
# or is usable; this catches absence, which is the failure anyone has actually
# reasoned about, and README.md step 6 carries the end-to-end check.

command -v node >/dev/null 2>&1 && exit 0

printf '%s' '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"claude-kit: `node` is not on PATH, so EVERY kit hook is dead on this machine. Claude Code bundles no Node, and a hook whose command cannot be spawned fails silently: the plugin still lists its skills while the docs/ and push guards fail open, compaction recovery never fires, and the kit-goal leash never holds. Nothing else in the kit can report this, because everything else in the kit is a Node script. Install Node, then re-check with README.md step 6. Tell the user this plainly before doing any work that assumes a guard is protecting them."}}'
