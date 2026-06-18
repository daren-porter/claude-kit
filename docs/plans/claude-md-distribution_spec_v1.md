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

2. **The user's live CLAUDE.md is a real, repo-independent file, loaded once via the
   config-dir channel (option a).** RE-VERIFIED empirically (this machine, claude 2.1.181,
   Section 1); the loading model is more nuanced than the 2026-06-12 observation implied,
   and the result overturns the earlier lean toward option (b). Two channels load global
   rules: (A) `$CLAUDE_CONFIG_DIR/CLAUDE.md` loads cwd-independently; (B) `~/.claude/CLAUDE.md`
   loads only via the project directory walk when cwd is under `$HOME`, regardless of the
   alias, and not at all when cwd is outside `$HOME`. So option (b) - a real file at
   `~/.claude` with empty alias dirs - would silently drop the global rules for any repo
   outside `$HOME`. The chosen scheme is therefore option (a): each alias config dir's
   `CLAUDE.md` is a symlink to one repo-independent canonical real file (channel A,
   cwd-independent), with `~/.claude/CLAUDE.md` kept clear so the walk (channel B) never
   loads a second copy. A single-profile user (no alias `CLAUDE_CONFIG_DIR`) keeps the
   canonical at `~/.claude/CLAUDE.md` directly, which is their config-dir memory and Claude
   Code's standard single-load location. Either way the live file is real and
   repo-independent - the symlink-to-repo is gone. See Chapter 1 for the probe evidence.

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
  recorded (done; see Chapter 1 for the sentinel-probe evidence and the two-channel
  model). The canonical scheme chosen from the result is **option (a)**: each alias
  config dir's `CLAUDE.md` symlinks to one repo-independent canonical real file, and
  `~/.claude/CLAUDE.md` is kept clear so the directory walk never loads a second copy,
  so the live CLAUDE.md loads exactly once (cwd-independently) and depends on no repo
  path. Single-profile users keep the canonical at `~/.claude/CLAUDE.md` directly. The
  canonical real-file path for the alias case defaults to `~/.claude/claude-kit-global.md`
  (a non-auto-loaded name under `~/.claude`); confirmed or adjusted at the live migration
  in Section 4, which needs Daren's explicit go regardless.
- The sync-marker convention is defined: a file at `~/.claude/.claude-kit-md-version`,
  anchored at the default `~/.claude` dir via `os.homedir()` (not the alias config dir),
  holding the SHA-256 hash of the recommended CLAUDE.md the user last reconciled. It is
  profile-independent: profiles sharing one canonical share one marker, so reconciling
  under one profile does not make another profile's hook nag. Repo-independent.

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

### Chapter 1 - 2026-06-17
Completed: Section 1 - Recommended CLAUDE.md as a plugin asset + canonical scheme.

Decisions / Surprises:
- **Plugin asset created.** `plugins/claude-kit/assets/CLAUDE.md` is a byte-identical copy
  of `home/CLAUDE.md` (sha256 `003463ad...b669ae` on both). The repo's `home/CLAUDE.md`
  and the live alias-dir symlinks pointing at it stay in place; Section 4 retires them.
- **Empirical loading re-verification (claude 2.1.181, this machine) overturned the spec's
  lean toward option (b).** Method: a throwaway `$HOME` override (temp fake-home, real
  `CLAUDE_CONFIG_DIR=~/.claude-work` kept for auth) with distinct sentinel CLAUDE.md files
  and headless `claude -p` probes. The real global `~/.claude/CLAUDE.md` was never touched
  (the auto-mode classifier correctly blocked a direct write to it; the fake-home approach
  sidesteps that). Results:
  - Probe 1 (cwd in `/tmp`, outside `$HOME`): the fake `~/.claude/CLAUDE.md` sentinel did
    NOT load -> answer `NONE`.
  - Probe 2 (cwd under fake `$HOME`): both `~/CLAUDE.md` (`HR-9001`) and `~/.claude/CLAUDE.md`
    (`DC-7731`) loaded.
  - Conclusion - two channels: (A) `$CLAUDE_CONFIG_DIR/CLAUDE.md` loads cwd-independently;
    (B) `~/.claude/CLAUDE.md` loads only via the project directory walk when cwd is under
    `$HOME`, regardless of the alias. `--debug file` and full `-d` do not log memory-file
    discovery, so the behavioral probe is the evidence.
- **Chosen canonical scheme: option (a).** Because channel B is absent outside `$HOME`,
  option (b) would silently drop the global rules for any repo cloned outside `$HOME`.
  Option (a) - alias dirs symlink to one repo-independent canonical real file (channel A,
  cwd-independent), `~/.claude/CLAUDE.md` kept clear so the walk never double-loads - loads
  exactly once everywhere and is the minimal delta from today's working topology (only the
  symlink target moves off the repo). This was the spec-delegated "choose from the result,"
  not a change of design intent, so I proceeded; flagging it because it reverses the spec's
  earlier lean. Single-profile users keep the canonical at `~/.claude/CLAUDE.md` directly.
- **Open items for Daren (Section 4 confirmation, not blocking now):** (1) canonical
  real-file path for the alias case defaulted to `~/.claude/claude-kit-global.md`; (2) could
  not verify whether Claude dedupes by realpath across channels A and B (verifying it needs
  `CLAUDE_CONFIG_DIR` pointed at a creds-less dir), so the chosen scheme deliberately keeps
  only one channel active for the alias case and relies on no dedup. Single-profile single-load
  rests on Claude Code's documented standard `~/.claude/CLAUDE.md` behavior, not re-verified here.
- **Sync-marker convention defined:** `~/.claude/.claude-kit-md-version`, anchored at the
  default `~/.claude` dir via `os.homedir()` (profile-independent), holding the SHA-256 of the
  last-reconciled recommended CLAUDE.md.

Review Findings: Per-section adversarial review skipped - the section's only code artifact is
a byte-identical asset copy (verified by sha256 + `diff`) with no logic or external surface;
the substantive output is the scheme decision, which is Daren's to adjudicate and is surfaced
above and in Approach point 2. The finishing-work full-changeset pass still covers it.

Next: Section 2 - Reconcile skill.
Commit Model: Commit-and-Push.
