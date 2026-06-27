# Worktree Dev-Environment Workflow

Status: Complete
Commit Model: Commit-and-Push
Created: 2026-06-27

## Goal

Working in a git worktree no longer means hand-rebuilding the IDE setup. When an
effort runs in a worktree, the IDE's gitignored local state (Rider run
configurations, the VCS-root mapping, and similar) is present without manual
steps, and the Rider "worktree `.git` is a pointer file, VCS root not detected"
gotcha is resolved. This is achieved by leaning on Claude Code's built-in
`.worktreeinclude` mechanism, recorded as guidance in `executing-work`. The kit
ships no seeder script, hook, or copy-engine of its own.

## Approach

**The platform already copies gitignored files into worktrees.** Claude Code reads
a `.worktreeinclude` file at the repository root (`.gitignore` syntax) and copies
**matching files that are also gitignored** into every Claude-created worktree.
Tracked files are never duplicated (they arrive via the checkout). This is the
whole engine; the kit's job is to make sure the file exists and is correct, not to
re-implement copying. Verified against the Claude Code worktrees docs this session.

**`executing-work` gains worktree dev-env guidance.** It already says "use a
worktree when isolation from the current workspace is needed" in its Branch-check
step; the new guidance lives next to it. The behavior: **before** creating or
entering a worktree, ensure the main checkout's `.worktreeinclude` covers the
detected IDE's gitignored dev-state, creating or appending if needed. The ordering
is load-bearing: `.worktreeinclude` is read at worktree-creation time, so a file
added after creation does not seed the worktree that already exists.

**Detection to pattern.** Presence of a gitignored IDE-state directory drives the
pattern:
- JetBrains (Rider/IntelliJ): `.idea` present -> add `.idea/`.
- VS Code: `.vscode/` only if it is gitignored (it is usually tracked, in which
  case it already propagates and there is nothing to do).
- Visual Studio: `.vs/`.
- The canonical case (`.env`, `.env.local`, local secrets) is folded in too, since
  that is `.worktreeinclude`'s headline use and the same propagation gap.
- None or ambiguous: ask Daren once rather than guessing.

**Why `.idea/` is the correct universal JetBrains pattern.** Run configurations
live in two places: project-level configs in `.idea/.../runConfigurations/*.xml`
(usually tracked, meant to be shared) and workspace-level configs inside
`workspace.xml` (always gitignored). The `.idea/` pattern covers both: the engine
self-filters to the gitignored subset (so `workspace.xml`, and the whole tree where
a repo ignores `.idea` wholesale, are copied), while tracked files (often
`runConfigurations/` and `vcs.xml`) arrive via the checkout. The pattern matches
`.idea` at any depth, so the nested `.idea/.idea.<Solution>/.idea/` layout and
multi-solution repos (per-project `.idea` dirs) are covered. Evidence gathered this
session: in inspected repos run configs were in `workspace.xml` (none had a
`runConfigurations/` dir), and `vcs.xml` mappings were relative
(`directory=""` or `$PROJECT_DIR$`), never absolute.

**The Rider VCS-root gotcha is resolved by seeding `vcs.xml`.** Because the mapping
is `$PROJECT_DIR$`-relative, a copied `vcs.xml` maps the worktree's own root as a
Git root, giving Rider an explicit mapping instead of relying on auto-detection of
the worktree's `.git` pointer *file* (which is what failed). This is why the gotcha
appears only where `.idea`/`vcs.xml` is wholly gitignored; repos that track
`vcs.xml` already carry the mapping into the worktree.

**Propagation model (the three categories), recorded so intent is unambiguous.**
- Tracked files: present via the worktree checkout itself. No copy needed.
- Gitignored files listed in `.worktreeinclude`: copied by the platform.
- Untracked-and-not-ignored files: propagate via neither (a worktree branches from
  a clean ref). Inherent to worktrees; the answer is commit or stash first. Not a
  kit concern.

**Lifecycle and ownership.** `.worktreeinclude` is created once per repo and left in
the working tree for Daren to commit (team benefit; the patterns are generic) or
gitignore (personal). It is **not** auto-committed by this routine.

**Boundary.** `.worktreeinclude` applies to Claude-created worktrees (`--worktree`,
the `EnterWorktree` tool, and `isolation: worktree` subagents). It does **not**
apply to worktrees made by hand with `git worktree add`; that case is documented,
not automated.

## Sections of Work

### 1. Worktree dev-env guidance in executing-work
Status: Complete (Chapter 1).
Add the guidance inline in `executing-work`, next to the existing branch/worktree
note (no new skill and no separate reference file unless the pattern list outgrows
inline; writing-skills' lean bar applies). The wording is behavior-shaping and is
baseline-tested before it is trusted.

Acceptance criteria:
- The platform assumption is empirically confirmed first: a gitignored file listed
  in a repo's `.worktreeinclude` is present in a Claude-created worktree of that
  repo (the documented subagent-isolation path is sufficient evidence; `EnterWorktree`
  is the same machinery). If it is NOT confirmed, stop and revisit the approach
  before writing guidance that assumes it.
- `executing-work` instructs the agent, before creating or entering a worktree, to
  ensure the main checkout's `.worktreeinclude` covers the detected IDE's gitignored
  dev-state, creating or appending if missing, and to do nothing when there is no
  gitignored IDE state or no IDE is detected.
- The pattern mapping is stated: JetBrains -> `.idea/`; VS Code -> `.vscode/` only
  if gitignored; Visual Studio -> `.vs/`; `.env`/local secrets folded in; ask once
  if ambiguous or none detected.
- The guidance records: the load-bearing ordering (set up before creation), the
  set-once-per-repo nature, that the file is left uncommitted for Daren to decide,
  the `vcs.xml`/Rider VCS-root resolution, and the raw-`git worktree add` boundary.
- A RED/GREEN baseline test demonstrates the wording changes behavior: without it, a
  fresh agent asked to start work in a worktree creates the worktree without setting
  up `.worktreeinclude`; with it, the agent sets up `.worktreeinclude` (correct
  pattern, correct ordering) and no-ops when there is no gitignored IDE state.

Execution mode: main.

## Out of Scope

- Any kit-shipped seeder script, hook, or copy-engine (the platform's
  `.worktreeinclude` is the engine).
- Auto-committing `.worktreeinclude` into the user's repo.
- Non-git version control (`WorktreeCreate`/`WorktreeRemove` hooks).
- Dependency/build/runtime setup inside worktrees (install steps, virtualenvs).
- Proactively seeding `.worktreeinclude` into Daren's existing repos: by his call,
  the next worktree triggers it per-repo.

## Open Questions

- Definitive confirmation that the in-session `EnterWorktree` tool (not only
  `--worktree`/subagent isolation, which the docs name explicitly) honors
  `.worktreeinclude`. Owner: the Section 1 empirical check; a one-time manual
  `EnterWorktree` test by Daren would fully close it. Confidence is high
  (same machinery), so this is a confirm-not-discover item.

## Chapters

### Chapter 1 - 2026-06-27
Completed: Worktree dev-env guidance in executing-work
Implemented By: main session
Decisions / Surprises: Empirically confirmed `.worktreeinclude` seeds Claude-created worktrees via the subagent-isolation path - a gitignored marker was copied into the worktree with matching content, `.git` was a pointer file as expected, and an uncommitted `.worktreeinclude` worked (read from the working tree, not the commit). Investigation of real Rider repos found run configs live in `workspace.xml` (no `runConfigurations/` dir present) and `vcs.xml` mappings are relative (`directory=""` / `$PROJECT_DIR$`), confirming `.idea/` as the correct universal pattern and that seeding `vcs.xml` resolves the VCS-root gotcha. The gitignore policy varies (okmind ignores `.idea/` wholesale; EleosIntegration/HorizonLegacy track most of `.idea` but ignore `workspace.xml`), and `.idea/` is correct either way because the engine self-filters to the gitignored subset.
Review Findings: Baseline RED/GREEN passed. Clean RED (no file reads) improvised a manual post-creation `cp` of `.idea/` with absolute-path anxiety and no `.worktreeinclude`; GREEN reps used `.worktreeinclude` with `.idea/` before creation, left it uncommitted, and no-opped when nothing was gitignored; the negative case (tracked `.vscode/`) correctly did nothing. Methodology note: the skill file was edited before the RED reps ran, so one RED rep read the on-disk guidance and is void as a control; RED rep1 (no file reads) is the clean control. Adversarial/security review deferred to the finishing-work combined pass (one-section effort).
Next: finishing-work.
Commit Model: Commit-and-Push.

### Chapter 2 - 2026-06-27 (finishing-work)
Completed: Effort close-out
Implemented By: main session
Decisions / Surprises: QA was folded into the adversarial spec-compliance pass - there is no build/test surface for a skill-prose change, and the one behavioral criterion was already verified out-of-band (the marker copy test plus the baseline RED/GREEN). Docs: checked README directly; no drift (its STRUCTURE and WORKFLOW summaries sit above the altitude of this internal executing-work behavior, so the one-liners stay accurate). No docs-curator dispatch (the kit has no architecture/feature docs beyond README and plan docs).
Review Findings: Combined adversarial + security pass (non-.NET, security folded in): APPROVED_WITH_CONCERNS - 0 Critical, 0 Major, 3 Minor. All three fixed in-section: (1) defined "ambiguous" with a correct example (several IDEs in play, or unclear which Daren uses); (2) added the enter-a-pre-existing-worktree ordering clause; (3) added the "only those already gitignored" guard to the `.env` row. Security: nothing above Minor - gitignored local files copied into a sibling worktree on the same machine and user, no new trust boundary, and `.worktreeinclude` is left uncommitted.
Next: Complete.
Commit Model: Commit-and-Push (push pending Daren's confirmation).
