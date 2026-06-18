---
name: reconcile-claude-md
description: "Use when reconciling the kit's recommended global CLAUDE.md into the user's live CLAUDE.md: an explicit 'sync/reconcile/update my CLAUDE.md' request, or accepting the SessionStart hook's offer that the kit baseline advanced. Not for project CLAUDE.md files."
---

# Reconcile CLAUDE.md

The kit ships a recommended global CLAUDE.md inside the plugin. The user's live
CLAUDE.md is their own real file. This skill pulls the recommended into the live
file when the kit's baseline has moved, the user's choice each time: a **merge**
that keeps their own content, or a wholesale **overwrite**. The flow is
one-directional - the repo is the author's edit source, the plugin distributes it,
this skill applies it - so it never edits the repo or the plugin, only the live
file.

The worst failure is silently dropping a rule the user wrote. Everything below
exists to make that impossible: back up before every write, flag instead of guess,
keep what you cannot classify.

## The three files

Resolve these first and print them, so the user sees what you are operating on.

- **Recommended** (the kit baseline), call it `$REC`: `assets/CLAUDE.md` under the
  plugin root, two directories above this skill's base directory (the path shown to
  you when this skill loaded). Read-only.
- **Live** (what the session loads): `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/CLAUDE.md`.
  Resolve symlinks to the canonical real file: `$CANON` = `readlink -f` of the live
  path. That real file (never the symlink itself) is what you back up and write, so
  every profile that symlinks to it gets the update.
- **Marker + baseline snapshot**, both anchored at `$HOME/.claude` regardless of the
  active profile (the same anchor the SessionStart hook uses via `os.homedir()`, so
  the skill writes the file the hook reads): `.claude-kit-md-version` holds the
  SHA-256 of the recommended the user last reconciled; `.claude-kit-md-base.md` holds
  that recommended's content, the base for the next merge.

Hash portably: `{ sha256sum "$F" 2>/dev/null || shasum -a 256 "$F"; } | cut -d' ' -f1`.

## Pick the mode (observable predicates, in order)

1. **No live file at all** (the live path is neither a file nor a symlink) ->
   **Install**. But if the live path is a symlink whose target is missing (a dangling
   link - a likely transient during the Section 4 migration, or a moved canonical),
   STOP and report the broken link. Do not install: that would write a fresh
   recommended where the user's canonical used to point and silently lose their
   content. `readlink -f` reports a missing target as "absent," so test the link
   itself, not just the resolved path.
2. **Marker present and equal to the recommended's hash** -> **In sync**: the kit
   has nothing new. Say so and stop; do not touch the file. A match means no kit
   delta, not "your file equals the recommended" - the user's own customizations
   are theirs to keep. (They can still ask for an overwrite to reset to baseline.)
3. **Marker missing or unequal** -> the baseline advanced (or was never recorded).
   Show what changed and offer **merge** or **overwrite**.

## Install (first run)

The live file is absent, so there is nothing to back up. Offer to write the
recommended verbatim; on yes, write it to the resolved live path, then write the
marker and baseline snapshot. On a machine with alias profiles this installs the
active profile's file only; wiring the other profiles' symlinks to one canonical
file is the install script's job, not this skill's.

## Merge (the careful path)

Three inputs: **base** (`.claude-kit-md-base.md`, the recommended at last sync),
**ours** (current recommended), **theirs** (the live file). The kit's delta is
base -> ours; fold that delta onto theirs:

- Apply each kit change (a new rule, a reworded rule) where theirs still matches
  base there - the user had not diverged, so the kit update is uncontested.
- Keep every line of theirs that the kit never had. That is the user's content; it
  is not yours to remove.
- Where a kit change lands on a spot the user also changed, **flag the conflict**
  and let the user pick. Do not silently take either side.
- If `.claude-kit-md-base.md` is missing you cannot compute a true delta. Drop to
  comparing ours against theirs section by section and treat every difference as
  flag-and-ask, defaulting to keep theirs.

Present the proposed result and every flagged conflict, then write only after the
user confirms.

**Never drop or silently reword a user rule.** When you cannot tell whether a line
is a stale kit rule or something the user wrote, it is the user's: keep it and flag
it. These rationalizations all end in a dropped rule, and all are wrong:

| The thought | Why it is wrong |
|---|---|
| "It looks like an old version of a kit rule, so I will replace it." | You are guessing. A reworded kit rule and a deliberate user edit look identical. Flag it. |
| "The merge reads cleaner without it." | Clean is not the goal; keeping their rules is. |
| "It contradicts a kit rule, so the kit wins." | A contradiction is the user's most deliberate customization. Surface it; never overrule it silently. |
| "It is probably a duplicate, I will fold it in." | "Probably" is a flag, not a delete. |

Red flags in your own output: the merged file has fewer rules than theirs without
your having discussed the removals; a user line vanished without showing up in the
conflict list; you "tidied" wording nobody asked you to touch.

## Overwrite

Replace the live file wholesale with the recommended. Back up first, exactly as for
merge. The backup is the user's only way back to their customizations, so confirm
they accept that overwrite discards them.

## Every write, no exceptions

1. **Back up** the canonical file first:
   `cp -a "$CANON" "$CANON.bak.$(date +%Y%m%d-%H%M%S)"`.
2. Write the new content to the canonical file.
3. Update the marker and baseline to the **recommended**, never the merged result.
   Write the bare hash (no trailing label, so the hook's `trim()` reader matches) and
   copy the content:
   `{ sha256sum "$REC" 2>/dev/null || shasum -a 256 "$REC"; } | cut -d' ' -f1 > "$HOME/.claude/.claude-kit-md-version"`
   then `cp -a "$REC" "$HOME/.claude/.claude-kit-md-base.md"`. The merge's product was
   the live file; the baseline must track the recommended so the next delta is correct.

A write you invoke here modifies global config and may prompt for permission even
in an auto-accept session; that is expected - the user invoking this skill is the
authorization.
