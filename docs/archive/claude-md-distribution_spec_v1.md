# CLAUDE.md distribution: plugin-shipped, self-reconciling, repo-independent

Status: Complete
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

2. **The user's live CLAUDE.md is a real, repo-independent file at `~/.claude/CLAUDE.md`,
   loaded once.** RE-VERIFIED empirically (this machine, claude 2.1.181). Two channels load
   global rules: (A) `$CLAUDE_CONFIG_DIR/CLAUDE.md` loads cwd-independently; (B) `~/.claude/CLAUDE.md`
   loads via the project directory walk when cwd is under `$HOME` (not at all outside `$HOME`).
   A further probe (Section 4 prep) settled the open dedup question: when the config-dir
   `CLAUDE.md` and the walk-reached `CLAUDE.md` resolve to the SAME realpath, Claude Code
   loads the content once (deduped by realpath) - confirmed by enumerating the loaded memory
   set (a distinct cwd CLAUDE.md shows as a second entry; a same-realpath one does not). The
   chosen scheme (Daren's call) uses the conventional location: the canonical real file is
   `~/.claude/CLAUDE.md`, and each alias config dir's `CLAUDE.md` is a symlink to it. Channel A
   (the alias symlink) loads the rules for repos anywhere, including outside `$HOME`, so there
   is no gap; under `$HOME` the walk's copy of `~/.claude/CLAUDE.md` is the same realpath and
   dedupes, so it still loads once. A single-profile user (no alias) has `~/.claude/CLAUDE.md`
   directly as config-dir memory. The symlink-to-repo is gone. (Chapter 1 chose a
   dedicated-canonical variant while dedup was unverified; Chapter 4 records the pivot to this
   conventional scheme after the dedup probe and Daren's choice.)

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
  recorded (see Chapters 1 and 4 for the probe evidence and the two-channel + realpath-dedup
  model). The final canonical scheme (Daren's choice at Section 4, after the dedup probe) is
  the conventional one: the canonical real file is `~/.claude/CLAUDE.md`, each alias config
  dir's `CLAUDE.md` symlinks to it, and because Claude Code dedupes the config-dir and
  walk-reached copies by realpath, the live CLAUDE.md loads exactly once and depends on no
  repo path.
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
- First run (no live file): offers to install the recommended verbatim. A live file
  with a missing marker is treated as a baseline-advanced update (merge/overwrite with
  the base-missing fallback), never a verbatim install over existing content; a
  dangling live symlink stops with a report rather than installing over the canonical.
- Update run: presents what changed in the kit's baseline and offers **merge** (fold in
  the kit's deltas, preserve the user's unrelated content, flag every overlap or
  duplication for the user to adjudicate, never silently drop a user rule) or
  **overwrite** (replace wholesale).
- Every write makes a timestamped backup of the prior file first, then updates both the
  sync marker (`~/.claude/.claude-kit-md-version`, the recommended's SHA-256) and the
  baseline snapshot (`~/.claude/.claude-kit-md-base.md`, the recommended's content - the
  base for the next merge) to the reconciled recommended, never to the merged result.
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
- Daren's live config is migrated with backups and his explicit go at that step: the repo
  symlinks at the alias dirs are replaced so each alias dir's `CLAUDE.md` symlinks to the
  canonical real file `~/.claude/CLAUDE.md` (Daren's chosen scheme), whose walk-reached copy
  dedupes against the config-dir copy by realpath (verified) so the live rules load exactly
  once. Timestamped backups of every replaced file are made, and re-running the install is
  idempotent. The repo's `home/CLAUDE.md` is retired only after the migration repoints the
  live symlinks off it.
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

### Chapter 2 - 2026-06-17
Completed: Section 2 - Reconcile skill.

Decisions / Surprises:
- **Skill added:** `plugins/claude-kit/skills/reconcile-claude-md/SKILL.md` (115 lines,
  kit voice, ASCII-only). Trigger-style quoted description; scopes out project CLAUDE.md
  to avoid colliding with the marketplace `claude-md-management` skills. The merge is
  model-performed prose (per Approach point 3), not executable code.
- **Marker convention extended (refinement, serves the spec's intent):** alongside the
  hash marker `~/.claude/.claude-kit-md-version`, the skill stores
  `~/.claude/.claude-kit-md-base.md` (the recommended content at last sync) so the merge
  has a true base->ours delta - the cleanest way to "fold in kit deltas, preserve unrelated
  user content, never silently drop a user rule." The hook (Section 3) still only needs the
  hash marker; the base snapshot is skill-only. Recorded in Section 2's criteria.
- **Baseline test (writing-skills RED/GREEN, 2 reps each).** Fixture: base -> ours (kit
  reworded a rule, changed the Style rule, added a Testing rule) vs theirs (user kept
  Communication, customized Style differently, added "Never deploy on Fridays"). RED rep 1
  reproduced the worst case (produced a file with the user's rule DROPPED and the user's
  Style silently overwritten, no flag); RED rep 2 happened to preserve it (one sample lies).
  Both GREEN reps preserved the user rule, folded in the kit delta + new section, and FLAGGED
  the Style conflict instead of guessing. Guidance validated; no REFACTOR needed.
- **Install scope:** the skill installs/merges the active profile's live file (resolving
  symlinks to the canonical real file it backs up and writes). Multi-profile symlink fan-out
  to one canonical is the install script's job (Section 4), not the skill's.

Review Findings (adversarial-reviewer, APPROVED_WITH_CONCERNS):
- Major - predicate 1 ("no live file") was ambiguous against a dangling symlink: `readlink -f`
  reports a missing target as absent, which would have sent a broken-canonical state to
  Install and written a fresh recommended over the user's content with no backup (exactly the
  transient Section 4 creates). FIXED: predicate 1 now installs only when the live path is
  neither file nor symlink, and STOPS-and-reports on a dangling symlink.
- Minor - `$CANON` not explicitly bound to the `readlink -f` result before the backup `cp -a`
  (a symlink backup would copy the link, not contents). FIXED: bound `$CANON` in the
  three-files section.
- Minor - shell `$HOME/.claude` vs hook `os.homedir()` anchor: coincide on POSIX. FIXED:
  added a one-clause note that the anchors are intentionally the same so skill-writes and
  hook-reads agree.
- Minor - the skill's first-run bucket is safer than the spec's literal "no live file or no
  marker" (a live file with a missing marker now merges, not installs-verbatim). Spec Section 2
  criterion updated to match the safer behavior.

Next: Section 3 - SessionStart hook detection.
Commit Model: Commit-and-Push.

### Chapter 3 - 2026-06-17
Completed: Section 3 - SessionStart hook detection.

Decisions / Surprises:
- **Hook extended:** `session-start.js` gains `claudeMdSyncOffer()` - hashes the plugin's
  recommended `assets/CLAUDE.md` (resolved via `__dirname/../assets`, so it works from the
  plugin cache or the repo), compares to `~/.claude/.claude-kit-md-version` (read via the
  file's bounded-read idiom, os.homedir()-anchored), and returns true when they differ or
  the marker is absent. Wired into `main()` additively: its own try/catch, an extended
  early-return guard, and a third `blocks.push` after the kaizen block.
- **Universal, not kit-repo-gated:** unlike the kaizen nudge, the CLAUDE.md check runs in
  every project, since the whole point is to nudge on any machine/project when the baseline
  advances.
- **Injection-safe by construction:** the offer is a static string; no asset/marker/stdin/env
  bytes ever reach `additionalContext` (only the boolean gates the push). Asset read bounded
  by a 1MB statSync cap before hashing; marker by a 256-byte bounded read.
- **Verified (evidence):** `node --check` passes; 4-scenario subprocess test with a temp HOME:
  no marker -> offer; marker matches -> silent (the non-nag guarantee, independent of the live
  file); marker differs -> offer; repo cwd + matching marker -> plan block only, no CLAUDE.md
  offer. Confirmed `os.homedir()` honors `$HOME` here, so the skill's `$HOME/.claude` writer and
  the hook's `os.homedir()` reader coincide on POSIX.

Review Findings (adversarial-reviewer with an explicit security lens, APPROVED, no Critical/Major):
- The C#/T-SQL `security-reviewer` agent does not fit a Node hook, so the security review was
  folded into the adversarial-reviewer dispatch (context-channel injection, fail-silent,
  bounded reads, predicate correctness). It re-ran adversarial marker forms (interior junk,
  1000-byte filler past the read window, marker-as-directory, binary stdin) and found no
  content-injection path, no false-silence, all paths exit 0.
- Minor (fd leak: `readSync` without `finally`): left as-is - it is the identical pre-existing
  idiom of the plan-scan and kaizen readers, one fd in an immediately-exiting process; the
  reviewer judged it not worth changing, and refactoring a pre-existing pattern would violate
  surgical-changes.
- Minor (writer/reader coupling): tightened the reconcile skill's Every-write step to pin the
  marker write to a bare hash (`... | cut -d' ' -f1 > marker`) so it always survives the hook's
  `trim()`. Bound `$REC` for the recommended path while there.

Next: Section 4 - Install scheme migration + docs.
Commit Model: Commit-and-Push.

### Chapter 4 - 2026-06-18
Completed: Section 4 - Install scheme migration + docs.

Decisions / Surprises:
- **Scheme finalized as option C (Daren's choice), dedup verified.** Before building, an
  empirical probe settled the question Chapter 1 left open: Claude Code 2.1.181 dedupes
  memory by realpath. Evidence: from `repo/home` (where the alias symlink's realpath and the
  walk's cwd-file realpath coincide) the loaded-memory set showed ONE entry; a distinct cwd
  CLAUDE.md showed as a SECOND entry. So the conventional canonical `~/.claude/CLAUDE.md`
  with alias symlinks pointing to it loads exactly once (walk copy dedupes against the
  config-dir copy) and has no outside-`$HOME` gap (the alias symlink loads it cwd-independently).
  Approach point 2 and Section 1/4 criteria were updated from Chapter 1's dedicated-canonical
  variant to this; Chapter 1 stays as history.
- **Tooling:** setup.sh/setup.ps1 rewritten to the slimmed role - point alias CLAUDE_CONFIG_DIR
  profiles at one canonical `~/.claude/CLAUDE.md` (sourced from the plugin asset). Idempotent,
  collision-safe timestamped backups, never clobbers an existing customized canonical. README
  updated to the plugin-managed scheme (install plugin, accept reconcile offer; repo is only
  the author's edit source).
- **Live migration run with Daren's explicit go (committed tooling first, then ran it).**
  `./setup.sh` against the real `$HOME`: created `~/.claude/CLAUDE.md` (byte-identical to the
  prior rules, same sha256, so no rule changed), backed up and repointed both alias symlinks
  (`~/.claude-work`, `~/.claude-personal`) from `repo/home/CLAUDE.md` to `~/.claude/CLAUDE.md`,
  wrote the marker + baseline. Verified on the live config: content == asset; marker == asset
  hash; single-load probe shows exactly one global-rules entry; both alias dirs resolve to the
  real `~/.claude/CLAUDE.md` (no repo path, so moving/removing the repo cannot change loading);
  re-run is idempotent (no new backups).
- **`home/CLAUDE.md` retired** (git rm) now that nothing live points to it and the asset is the
  source; its README STRUCTURE line removed. The migration `.bak` symlinks (and any prior-run
  backups) still point at the deleted `repo/home/CLAUDE.md` and are therefore now dangling -
  cosmetic only; the prior content is preserved in git history and is byte-identical to the live
  `~/.claude/CLAUDE.md`.
- **Caveat for other machines (close-out item):** any other machine still on the old scheme
  (alias `CLAUDE.md` symlinked to `repo/home/CLAUDE.md`) will have a dangling symlink after it
  pulls this commit, until it runs the new `./setup.sh` or accepts the reconcile offer. The
  rules still reach it via the plugin asset; only the old repo-symlink needs repointing.

Review Findings (adversarial-reviewer on the tooling/docs, APPROVED_WITH_CONCERNS, no Critical/Major):
- The C#/T-SQL security-reviewer does not fit shell/PowerShell setup scripts; the data-safety
  review was folded into the adversarial-reviewer dispatch (it probed the data-loss paths and
  found none unbacked-up).
- Four Minors, all fixed before the live run: same-second backup-name collision (added a
  collision-safe `backup_to`/`Backup-To` helper, unit-tested); setup.ps1 `.Target` idempotency
  comparison normalized + array-safe; setup.ps1 symlink-fallback now copies the canonical (not
  the pristine asset) to avoid divergence; setup.ps1 canonical stray-link check made consistent
  with the alias check (`-eq 'SymbolicLink'`). setup.ps1 changes are unverified on Windows (no
  Windows host); setup.sh fully dry-run and live-run verified.

Next: finishing-work.
Commit Model: Commit-and-Push.

### Chapter 5 - 2026-06-18 (finishing-work, close-out)
Completed: finishing-work pass; effort complete.

Effort summary: the global CLAUDE.md is decoupled from the repo. The recommended rules
ship as a plugin asset (`plugins/claude-kit/assets/CLAUDE.md`); the `reconcile-claude-md`
skill installs/merges/overwrites them into the user's live `~/.claude/CLAUDE.md` with a
backup and a baseline-tested anti-drop discipline; the SessionStart hook offers reconcile
when the kit baseline advances (marker `~/.claude/.claude-kit-md-version`, never nags, never
injects file contents); `setup.sh`/`setup.ps1` are slimmed to alias-profile symlink wiring;
the repo's `home/CLAUDE.md` is retired. Daren's live config was migrated (canonical
`~/.claude/CLAUDE.md`, alias dirs symlinked to it, loads once via realpath dedup,
repo-independent). Final scheme is option C, chosen by Daren after the dedup probe.

Review outcomes:
- QA (qa-verifier): PASS. All four sections' acceptance criteria verified with command/inspection
  evidence (no compiled build/test framework: plugin validate + node --check + hook subprocess
  matrix + setup.sh dry-runs). The S2 writing-skills baseline test is UNVERIFIABLE-by-execution
  (model-performed prose, no re-runnable harness); its RED/GREEN run is recorded in Chapter 2 and
  the guardrail content is present.
- Security: folded into the final adversarial pass (the C#/T-SQL security-reviewer does not fit a
  JS/shell/markdown changeset). No injection path to the SessionStart context channel (static offer
  line only); no secret handling; shell expansions quoted.
- Final adversarial (whole changeset): one MAJOR fixed - `setup.sh` `backup_to` swallowed a failed
  backup before an unconditional `ln -sf`, a data-loss path; now fails loudly so `set -e` aborts
  before the destructive replace (verified). One MINOR fixed - skill Install section now points
  alias-profile first-run users to setup.sh to avoid a divergent second canonical. One MINOR
  rejected with evidence - the flagged "em-dash" at session-start.js:178 is a regular hyphen
  (byte dump 0x2D; ASCII-only grep clean).
- Docs (docs-curator): Drift NONE. Two README doc-lag items corrected (the offer also fires on a
  never-reconciled first machine; the two `~/.claude` reconcile-state files named). No
  spec-vs-implementation disagreement required adjudication.

Durable learning banked to auto memory: the Claude Code 2.1.181 CLAUDE.md loading + realpath-dedup
model (the empirical basis for the canonical scheme).

Commit Model: Commit-and-Push (pushed).
