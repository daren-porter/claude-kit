# claude-kit Docs

This directory is the working library and project history for the kit itself: the active plans, the living backlog, and the archived record of finished efforts. It is repo-level material, a sibling of `README.md`, `plugins/`, `settings/`, and `test/`. Nothing here ships inside the installable plugin payload (`plugins/claude-kit/`), so none of it loads for someone who installs the plugin.

## Folder map

- **Root (`docs/`)** holds the stable documents about the solution and this index.
- **`plans/`** holds active plans only: `Status: In Progress` and `Status: Proposed` stubs. A plan moves to `archive/` in the close-out that completes or abandons it.
- **`archive/`** holds finished and abandoned plans with their Chapters intact, and dated backlog snapshots. Immutable history; nothing there is live.

## Active plans

- **`plans/appsec-security-reviewer_spec_v1.md`** (Proposed) - whether non-.NET repos with real attack surface warrant a standing appsec reviewer, or a deeper adversarial security bullet suffices. Likely retired: the docs-lifecycle effort generalized `security-reviewer` to any production codebase, substantially answering the question (the stub's Related note has the details); Daren adjudicates.
- **`plans/visual-companion_spec_v1.md`** (Proposed) - what a "visual companion" for this kit would render, in what medium, and whether to build one or adopt the superpowers version.
- **`plans/kit-adoption-pass_spec_v1.md`** (Proposed) - a skill for the recurring inbound pass over Scott Applefeld's kit: classify what changed since the last look, treat his removals as signal, decide take-as-is versus reshape, then hand off to `brainstorming` or `executing-work`.

## Living documents

- **`backlog.md`** - cross-effort next steps, active items only. Finished items move to a dated snapshot in `archive/`.

## Archive

Completed plans, most recent first.

- **`archive/pr-review_spec_v1.md`** - the `/pr-review` capability: connector-first Azure DevOps PR review with a precision-tuned pr-reviewer agent, senior-dev anti-slop calibration, applyable suggestion blocks, and gated posting under Daren's identity.
- **`archive/docs-lifecycle-and-guards_spec_v1.md`** - the curated docs lifecycle (this library's own taxonomy), the branch and PR guard hooks, the blind reviewer paired per section, and the review-layer refinements.
- **`archive/kit-goal-port_spec_v1.md`** - the `/kit-goal` completion leash: a deterministic Stop hook that holds an armed plan run to completion, plus executing-work's completion contract.
- **`archive/orchestration-economics_spec_v1.md`** - session-model-as-mode doctrine, the fable implementation tier above capable and mechanical, the Fable spend wall, and the dispatch-brief upgrades.
- **`archive/token-profiler_spec_v1.md`** - Piece 2 of the token-efficiency work: an operational profiler that attributes cost-weighted spend across a session's full fan-out to the kit's skills and processes.
- **`archive/token-efficiency-audit_spec_v1.md`** - Piece 1 of the token-efficiency work: a maintainer-run audit of the kit's standing per-session context cost, ranked so trim candidates are visible.
- **`archive/worktree-workflow_spec_v1.md`** - working in a git worktree without hand-rebuilding the IDE's local state, via Claude Code's built-in `.worktreeinclude` and executing-work guidance rather than a kit-owned seeder.
- **`archive/claude-md-distribution_spec_v1.md`** - the global CLAUDE.md ships inside the plugin, the live file is repo-independent and loaded once, and the kit offers to reconcile when its recommended version advances.
- **`archive/claude-kit_spec_v3.md`** - Scott-informed adoptions: subagent model down-selection, the opt-in design council, the `cold` evaluation lens, and two operating-discipline rules.
- **`archive/kaizen_spec_v1.md`** - the kit's self-improvement loop: cheap cross-project friction capture, a reflection pass with Daren, and a portable brief a fresh session applies.
- **`archive/claude-kit_spec_v2.md`** - Superpowers-informed improvements: the writing-skills meta-skill, review-response discipline, durable tests as a tracked deliverable, and workflow hardening.
- **`archive/claude-kit_spec_v1.md`** - the original kit: the brainstorm/execute/finish workflow skills, the fresh-context review agents, the C# and T-SQL style skills, and the versioned setup assets.

## How this library is maintained

The `curating-docs` skill owns the mechanics: it archives a plan when it closes, prunes the backlog, cross-references related plans, and refreshes this index. `finishing-work` calls it at close-out, `brainstorming` calls it when a new spec is written, and it can be invoked directly to tidy or retrofit a tree.

Four plugin hooks give the taxonomy mechanical teeth: `docs-write-guard` denies a non-curator subagent any write into `docs/`, `stop-docs-hygiene` flags an unarchived Complete plan or scratch leaked into `docs/` at turn end, a `session-start` nudge repeats the unarchived-Complete flag at session start, and `pr-docs-guard` blocks opening a PR while `docs/` has uncommitted changes.
