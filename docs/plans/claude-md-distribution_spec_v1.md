# CLAUDE.md distribution: plugin-shipped, self-reconciling, repo-independent

Status: In Progress
Commit Model: Commit-and-Push
Created: 2026-06-17

## Goal

Decouple the global CLAUDE.md from the repo so the kit works for anyone who installs
the plugin, with or without the repo checked out. The recommended CLAUDE.md ships
inside the plugin (travels with the marketplace install); the user's live CLAUDE.md
is a real, repo-independent file loaded exactly once; and the kit detects when its
recommended version has advanced and offers to reconcile it into the user's file -
merge (preserving the user's unrelated content, flagging overlap) or overwrite -
with a backup. When done, updating the kit's global rules on any machine is "update
the plugin, accept the reconcile offer," and a third party with no access to the repo
gets a working, updatable CLAUDE.md from the plugin alone.

## Approach

Replaces v1's single-source-install scheme (Section 11 of claude-kit_spec_v1), which
made the repo the symlink source - coupling the live CLAUDE.md to a repo at a fixed
path. Key decisions, agreed with Daren across the design conversation:

1. **The recommended CLAUDE.md becomes a plugin asset.** It moves from the repo's
   `home/CLAUDE.md` (outside the plugin, unreadable by a hook) to inside the plugin
   (e.g. `plugins/claude-kit/assets/CLAUDE.md`), so it ships over the marketplace and
   the hook and skill can read it from the plugin cache. The repo is the author's edit
   source; the plugin is the distribution channel; neither is needed at runtime once
   installed.

2. **The user's live CLAUDE.md is a real file at `~/.claude/CLAUDE.md`, loaded once.**
   CONFIRMED (this machine, 2026-06-12 double-load observation): with
   `CLAUDE_CONFIG_DIR` set to an alias dir, both the alias-dir CLAUDE.md and
   `~/.claude/CLAUDE.md` load. INFERRED from that: `~/.claude/CLAUDE.md` loads for every
   profile regardless of the alias, so a real file there with empty alias dirs loads
   exactly once (option b). The first execution step re-verifies this live before any
   config is moved; if it no longer holds, fall back to a real canonical file plus
   symlinks from each alias dir to it (option a). Either way the live file is real and
   repo-independent - the symlink-to-repo is gone.

3. **A hook detects, a skill reconciles.** A SessionStart hook is non-interactive: it
   can compare the plugin's recommended CLAUDE.md against a stored sync marker and
   inject a one-line offer, but it cannot merge. The semantic merge (preserve the
   user's unrelated content, flag overlap and duplication, or overwrite) is the model's
   work, in a dedicated skill the user invokes (or triggers from the injected offer).

4. **Non-nag gating via a sync marker.** The hook notifies only when the plugin's
   recommended version has advanced past what the user last reconciled - a marker at
   `~/.claude/.claude-kit-md-version` holding the hash/version last synced. A user who
   customized their CLAUDE.md is never nagged just for differing; they are nudged only
   when the kit's baseline actually changed. Same observable-predicate discipline as
   kaizen.

5. **Author-is-also-user flow stays one-directional.** Daren edits the repo source ->
   it ships in the plugin -> the reconcile pulls it into `~/.claude` on each machine.
   Editing `~/.claude` directly is supported but then the change must be folded back to
   the repo by hand; the documented flow is edit-the-repo.

6. **setup.sh's CLAUDE.md role is retired or slimmed.** First-run install is handled by
   the skill (offered by the hook when no synced version exists), so per-machine setup
   becomes "install the plugin, accept the offer." setup.sh/setup.ps1 keep only what the
   plugin cannot do; the double-load-avoidance becomes part of the new scheme.

7. **The merge skill is behavior-shaping and gets baseline-tested** (writing-skills): a
   merge that silently drops a user's rule is the worst-case failure, so it is tested
   against that, not just authored.

8. **Authoring is main-session** (voice-critical prose, a security-sensitive hook, and
   a live-config migration); all four sections run in `main` mode. Fresh-context
   adversarial review per section; the live-config migration in Section 4 is a
   destructive-ish step done with backups and Daren's explicit go at that point.

## Sections of Work

### 1. Recommended CLAUDE.md as a plugin asset + canonical scheme
Move the recommended CLAUDE.md into the plugin; define the canonical install location,
the loaded-once invariant, and the sync-marker convention; verify the loading behavior
live before relying on it.
Execution mode: main.

Acceptance criteria:
- The recommended CLAUDE.md lives inside the plugin (a plugin asset readable by the
  hook from the plugin cache, e.g. `plugins/claude-kit/assets/CLAUDE.md`), carrying the
  current global-rules content verbatim. It is added here; the repo's existing
  `home/CLAUDE.md` and the live symlinks pointing at it stay in place until Section 4
  cuts over, so the live rules never break mid-effort. `home/CLAUDE.md` is retired in
  Section 4 once the asset is the source.
- The loading behavior is re-verified empirically on this machine and the result
  recorded: whether `~/.claude/CLAUDE.md` loads under an alias `CLAUDE_CONFIG_DIR`. The
  canonical scheme is chosen from the result - option (b) real file at `~/.claude` with
  empty alias dirs, or option (a) real canonical plus alias-dir symlinks to it - such
  that the live CLAUDE.md loads exactly once and depends on no repo path.
- The sync-marker convention is defined: a file at `~/.claude/.claude-kit-md-version`
  holding the hash (or version) of the recommended CLAUDE.md the user last reconciled,
  repo-independent.

### 2. Reconcile skill
A skill that installs, merges, or overwrites the kit's recommended CLAUDE.md into the
user's live file.
Execution mode: main.

Acceptance criteria:
- The skill exists, trigger-style description (an explicit "sync/reconcile my CLAUDE.md"
  request, or accepting the hook's offer). It reads the plugin's recommended CLAUDE.md
  and the user's live CLAUDE.md.
- First run (no live file or no marker): offers to install the recommended verbatim.
- Update run: presents what changed in the kit's baseline and offers **merge** (fold in
  the kit's deltas, preserve the user's unrelated content, flag every overlap or
  duplication for the user to adjudicate, never silently drop a user rule) or
  **overwrite** (replace wholesale).
- Every write makes a timestamped backup of the prior file first, and updates the sync
  marker to the reconciled version afterward.
- Behavior baseline-tested per writing-skills, including the failure case that a merge
  must not drop or mangle a user-authored rule.
- A fresh-session dry read is coherent; no contradiction with the global rules.

### 3. SessionStart hook detection
Extend `session-start.js` to detect a baseline advance and inject a gated offer.
Execution mode: main.

Acceptance criteria:
- On session start, the hook compares the hash of the plugin's recommended CLAUDE.md
  (resolved relative to the hook in the plugin cache) against the sync marker; if they
  differ (or no marker exists), it injects one line offering to run the reconcile skill,
  and otherwise injects nothing about CLAUDE.md.
- It never nags: a user whose live file differs from the recommended but whose marker
  matches the current recommended gets no notice.
- The existing in-progress-plan and kaizen behaviors are unchanged and the kaizen and
  CLAUDE.md checks compose; reads are bounded and fail silent (a missing file/dir is a
  no-op); only a computed flag/version is injected, never file contents.
- `node --check` passes and the plugin validates.

### 4. Install scheme migration + docs
Retire or slim the symlink install; migrate Daren's live config to the new scheme;
update the docs.
Execution mode: main.

Acceptance criteria:
- setup.sh/setup.ps1 no longer symlink the live CLAUDE.md to the repo; their CLAUDE.md
  role is removed or reduced to what the plugin cannot do, and the README documents the
  new plugin-managed scheme (install the plugin, accept the reconcile offer; the repo is
  only the author's edit source).
- Daren's live config is migrated with backups and his explicit go at that step: the
  repo symlinks at the alias dirs are replaced by the chosen canonical scheme from
  Section 1, a real `~/.claude/CLAUDE.md` exists and loads once, and timestamped backups
  of every replaced file are made. Re-running the install is idempotent.
- After migration, removing or moving the repo does not change which global rules load.

## Out of Scope

- The deferred Scott-CLAUDE.md nugget curation (separate pass).
- Any change to how the plugin's skills/agents/hooks are distributed (that already ships
  over the marketplace and is unaffected).
- Auto-applying a reconcile without the user's choice (the skill always offers
  merge-vs-overwrite; the hook only nudges).
- A general dotfiles/sync system; this covers only the kit's recommended CLAUDE.md.

## Open Questions

1. Exact plugin asset path and marker filename - defaulted (`assets/CLAUDE.md`,
   `~/.claude/.claude-kit-md-version`); adjust in execution. Owner: Daren.
2. Whether setup.sh is fully retired or kept as a thin fallback for users who prefer a
   scripted install over the in-session offer. Defaulted to slim-not-delete; revisit in
   Section 4. Owner: Daren.
3. Whether the migration of Daren's own live config happens in this effort or is left
   for him to run deliberately. Defaulted to "in this effort, as the last step, with
   backups and an explicit go." Owner: Daren.

## Chapters
(Appended by executing-work as sections complete. Leave empty at creation.)
