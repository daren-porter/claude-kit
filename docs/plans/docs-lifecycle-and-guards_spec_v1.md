# Docs Lifecycle, Branch Guards, and the Review Layer

Status: In Progress
Commit Model: Branch-and-PR
Fable Spend: Fable-led orchestration session; no delegate-fable sections
Created: 2026-07-24

## Goal

The kit gains a curated documentation lifecycle (plan archival, a pruned-live backlog, a docs index, and the hooks that keep them honest), the branch and PR guard layer that prevents the stranded-commit and dirty-docs traps, a blind reviewer paired with the adversarial reviewer per section, and a batch of smaller review-layer refinements from Scott Applefeld's kit. This effort also retrofits the kit repo itself to the taxonomy it ships (eight Complete plans currently sit unarchived in docs/plans/).

## Approach

**Docs lifecycle.** Adapt Scott's `curating-docs` skill: the four-zone taxonomy (`docs/` root for stable about-the-solution docs plus a README index, `docs/plans/` for active and Proposed plans only, `docs/archive/` for finished or abandoned plans and dated backlog snapshots, `docs/backlog.md` pruned live), the fixed close path (confirm Complete and a final Chapter, `git mv` to archive, cross-reference, prune backlog, refresh index), the create path (index and cross-reference new specs), and the read-only-then-confirm retrofit for existing trees, with "never delete, relocate" as the hard rule. brainstorming's spec step and finishing-work's close step reference it at their integration points. Two enforcement hooks port with it: `stop-docs-hygiene.js` (Stop-time flag for unarchived Complete plans and scratch leaked into `docs/`, honoring the `_spec_v` and plan-header vetoes) and an additive unarchived-Complete nudge block in `session-start.js`. The `docs-write-guard.js` PreToolUse hook ports too (deny non-curator subagent writes into `docs/`, role-keyed on the payload's agent type), which keeps delegated implementers from authoring committed docs; executing-work notes the routing consequence (a section writing under `docs/` runs in the main thread or returns drafted prose for the main thread to place).

**Branch and PR guards.** Port `merged-pr-push-guard.js` (block pushes to a branch whose PR already merged; deletions and integration branches exempt; branch names failing the injection allowlist resolve UNKNOWN and allow), `pr-docs-guard.js` (block PR creation while `docs/` is dirty, chained-commit carve-out preserved), and `branch-reaper-nudge.js` (SessionStart nudge for reapable merged and stranded branches, bounded fetch, protected set). The `branch-hygiene` skill ports as their hand-off target: merged-only auto-delete with restore lines, the stranded-branch recovery procedure, worktrees only under `.claude/worktrees/` and never forced. finishing-work gains the two rules these guards mechanize: docs committed before the PR goes up, and the post-merge strand-check (`git log origin/<integration>..origin/<branch>`) with the PR-branch-frozen rule.

**Review layer.** Port the `blind-reviewer` agent near-verbatim (diff-only correctness review, never given the spec or intent story, docs excluded from its diff, contamination marked in output; recall over precision; forbidden from style and spec-compliance findings). executing-work's review step becomes a paired dispatch: adversarial (with spec) plus blind (without), in parallel, with security added on risk surfaces as today, and the existing trivial-section skip applying to the pair. Smaller refinements ride along: adversarial-reviewer gains the recall-over-precision posture paragraph and the workaround bar; security-reviewer generalizes to any production codebase (JS/Node including the kit's own hooks, shell, config) while keeping the procedure-only model conditional on the project's `docs/security-model.md` and keeping our EF Core carve-out; qa-verifier gains the gates-run-in-turn paragraph; finishing-work's drift step gains the mistake-versus-deviation classing (a likely mistake stops for Daren's call, a deliberate deviation rides in the Chapter and PR record; nothing silently reconciled); systematic-debugging gains the stack-specific root-cause checklist (deployment drift via sys.sql_modules, EXECUTE AS context, actual data shape, isolation level).

**Repo mechanics.** A `.githooks/pre-commit` running `claude plugin validate ./plugins/claude-kit` when a commit touches the plugin (skips with a stderr note when the CLI is absent rather than failing the commit; the CI-less repo prefers a soft gate to a commit that cannot run anywhere), wired via `git config core.hooksPath .githooks` documented in the README. Tests for every ported hook land in `test/` beside spec A's, same gate.

**Retrofit of this repo.** Apply curating-docs to the kit repo itself: create `docs/README.md` (index), `docs/backlog.md` (carrying the baseline-test note from spec A and any items this effort parks), `docs/archive/`, and move the eight Complete plans there with cross-references. The two Proposed stubs stay in `docs/plans/`.

## Sections of Work

### 1. curating-docs skill and the repo retrofit
Adapt `skills/curating-docs/SKILL.md` (taxonomy, close path with the excuse table, create path, retrofit protocol, never-delete rule) in the kit's voice. Then run its retrofit on this repo: `docs/README.md` index, `docs/backlog.md`, `docs/archive/`, `git mv` the eight Complete plans, cross-references where plans supersede each other (the claude-kit_spec v1/v2/v3 chain). Update brainstorming's spec-writing step and finishing-work's close step to invoke the create and close paths.
Acceptance: skill file exists; `docs/plans/` holds only In Progress and Proposed docs; the index lists every doc with one-line hooks; the v1/v2/v3 chain is cross-referenced; brainstorming and finishing-work name the skill at their integration points.
Execution mode: delegate-capable, except the retrofit's `git mv` batch and the index, which the main session verifies before commit (the docs-write-guard, once wired, denies subagent docs writes; sequence this section's hook wiring after the retrofit, or run the retrofit from the main thread).

### 2. blind-reviewer and the paired review step
Port `agents/blind-reviewer.md` (adapting only names and repo conventions). Update executing-work step 3 to the paired dispatch: adversarial with the spec path; blind with the base ref or changed-file list only, docs paths excluded, never the spec, plan, or section name; parallel; security added on the existing trigger; the trivial-section skip covers the pair; findings adjudicated per responding-to-review as today. Add blind-reviewer to responding-to-review's fallible-agents list.
Acceptance: agent file exists with the contamination rule and docs-exclusion diff commands; executing-work states the paired dispatch and what the blind dispatch must omit; responding-to-review updated.
Execution mode: delegate-capable.

### 3. Write guards: docs-write-guard, stop-docs-hygiene, session-start nudge
Port `docs-write-guard.js` and `stop-docs-hygiene.js` with their tests; add the unarchived-Complete additive block to `session-start.js`; wire both hooks in `hooks.json` (PreToolUse write-shaped tools; Stop, ordered before kit-goal-stop so hygiene flags surface even when the leash blocks). Executing-work gains the docs routing note.
Acceptance: test gate passes including the ported guard tests; docs-curator (namespaced) allowed, other subagents denied on a synthetic `docs/` write payload; main session allowed; stop hygiene flags a synthetic unarchived-Complete tree and stays silent on a clean one.
Execution mode: delegate-capable.

### 4. Branch guards and branch-hygiene
Port `merged-pr-push-guard.js`, `pr-docs-guard.js`, `branch-reaper-nudge.js` with tests (including the injection-allowlist and `gh` shim tests), wire in `hooks.json`, and adapt `skills/branch-hygiene/SKILL.md`. finishing-work gains docs-before-PR and the strand-check with the PR-branch-frozen rule.
Acceptance: test gate passes; a synthetic push to a merged-PR branch blocks and a deletion push passes (pinned); branch-hygiene states merged-only deletion, restore lines, and the recovery procedure; finishing-work carries both rules.
Execution mode: delegate-capable.

### 5. Review-layer refinements batch
adversarial-reviewer: recall-over-precision posture and the workaround bar. security-reviewer: generalize scope to any production codebase (its OWASP framing extended to JS/Node/shell/config), procedure-only model stays conditional on `docs/security-model.md`, EF Core carve-out kept; finishing-work's step 2 non-.NET skip narrows accordingly (dispatch security-reviewer on hook/script changesets too). qa-verifier: gates-run-in-turn paragraph. finishing-work: mistake-versus-deviation drift classing in step 4. systematic-debugging: the stack-specific root-cause checklist.
Acceptance: each file carries its change; finishing-work step 2 and security-reviewer scope agree; no contradictions with responding-to-review.
Execution mode: delegate-capable.

### 6. Pre-commit validation and README
Add `.githooks/pre-commit` (plugin validate when the CLI is present, skip with a note otherwise), document `git config core.hooksPath .githooks` in the README, and update README STRUCTURE/WORKFLOW/CONVENTIONS for everything this effort added (curating-docs, blind-reviewer, guards, branch-hygiene, backlog and archive conventions).
Acceptance: hook is executable and behaves both with and without a `claude` CLI on PATH (manual check recorded); README references resolve.
Execution mode: delegate-mechanical.

## Out of Scope

- The compaction engine, relay, chain mode, kit-doctor, doctrine-refresh, format-on-edit, kit-version-nudge (not adopted, by decision).
- scott-writing-style and any style-skill changes.
- Rewriting existing Complete plans' content during the retrofit (moves and cross-references only).
- CI for the test gate (local `node --test` remains the gate).

## Open Questions

None. Decisions taken with Daren on 2026-07-24; per-file adaptation judgment is recorded in Chapters.

## Related

One of three specs adapting Scott Applefeld's kit into this one, designed together on 2026-07-24: `kit-goal-port_spec_v1.md` (the `/kit-goal` completion leash and the completion contract) and `orchestration-economics_spec_v1.md` (session-model-as-mode doctrine, the fable implementation tier, dispatch-brief upgrades), both Complete and in `../archive/`.

## Chapters

### Chapter 1 - 2026-07-24
Completed: Sections 1-2 (curating-docs + repo retrofit; blind-reviewer + paired review) as a parallel wave over disjoint files
Implemented By: implementer-opus x2 (parallel)
Metrics: 1 review round (parallel adversarial reviews per section); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Decisions / Surprises: The retrofit moved ten Complete plans (the spec said eight; kit-goal-port and orchestration-economics closed on this branch after the spec was written and were archived in the same pass; spec Goal's count left as written since the Approach's "every Status: Complete plan" governs). curating-docs folded the source's templates into the SKILL.md body per writing-skills (no references/ file). blind-reviewer ported byte-identical: the source carried nothing kit-specific to adapt. C1's implementer added the close-path-runs-in-main-session sentence (grounded in docs-curator's no-Bash design); kept.
Review Findings: C1 APPROVED, 4 Minors, all fixed: create-path sentence repositioned after the spend paragraph and extended to cover the Proposed-stub index flip; kaizen's deferred-promote stubs now register in the index (one-line integration, a deliberate half-step past the section's enumerated integration points, recorded here as a spec deviation); finishing-work's close enumeration gained cross-referencing. C2 APPROVED_WITH_CONCERNS, 1 Major fixed: step 3's paired dispatch had no leash-safe execution path (inline reviewer returns mean no output file to poll; background dispatch trips the leash); step 3 now states the mechanism, synchronous dispatches in one message run concurrently in-turn. 3 Minors fixed: blind-reviewer's git show now passes --format= so commit messages stay unread (the one deviation from byte-identity with the source, deliberate); responding-to-review's trigger enumeration gained blind; the DONE_WITH_CONCERNS hand-off now names the adversarial reviewer and excludes the blind one. Judged inherent, not fixed: a changed-file list necessarily reveals feature-area paths to the blind reviewer; the contract withholds the intent story, which paths do not carry.
Next: 3. Write guards: docs-write-guard, stop-docs-hygiene, session-start nudge
Commit Model: Branch-and-PR
