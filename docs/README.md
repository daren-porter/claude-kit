# claude-kit Docs

This directory is the working library and project history for the kit itself: the active plans, the living documents, and the archived record of finished efforts. It is repo-level material, a sibling of `README.md`, `plugins/`, `settings/`, and `test/`. Nothing here ships inside the installable plugin payload (`plugins/claude-kit/`), so none of it loads for someone who installs the plugin.

## Folder map

- **Root (`docs/`)** holds the stable documents about the solution (`architecture.md`, plus one document per feature area), the living documents (`backlog.md`, `kit-adoptions.md`), and this index.
- **`plans/`** holds active plans only: `Status: In Progress` and `Status: Proposed` stubs. A plan moves to `archive/` in the close-out that completes or abandons it.
- **`archive/`** holds finished and abandoned plans with their Chapters intact, and dated backlog snapshots. Immutable history; nothing there is live.

## Active plans

- **`plans/kit-distribution_spec_v1.md`** (Proposed) - turning the kit into a core others fork into their own personal kits, with a guided first run, style skills generated from their own samples, upstream merges, and a path to propose changes back. Reframed by the finding that the fork relationship already exists once: this kit is itself a personalized fork of Scott's, so the work is mostly parameterizing an upstream rather than building fork support. Carries the trust-boundary consequence, since distribution breaks `security-model.md`'s trusted-workspace premise in both directions.
- **`plans/kit-denaming_spec_v1.md`** (Proposed) - what replaces the 137 personal-name references baked through the kit if it goes public, across five surfaces that want different answers. Amended 2026-08-11: the fork model makes a configured operator identity the favored answer, dissolves the adoption-pass consent blocker (the ledger never ships), and makes running this sweep before the fork model is decided a hazard rather than a head start.
- **`plans/visual-companion_spec_v1.md`** (Proposed) - what a "visual companion" for this kit would render, in what medium, and whether to build one or adopt the superpowers version.
- **`plans/branch-archive_spec_v1.md`** (Proposed) - whether `branch-hygiene` should archive a branch before it is deleted, and by what mechanism. Opened by the leftover third ask of a kaizen note whose other two were measured and discarded. The motivating asymmetry: a reaped branch's restore line is durable because its tip stays reachable from the integration ref, while a squash-landed branch's tip lives only in the local ref and expires with the reflog once that is gone. Leads with the worth question, since the content is safe either way and only the original commit sequence is at risk.

## Solution documents

The stable description of what the kit is and how it behaves. The root `README.md` owns the static shape (directory tree, install, workflow doctrine, model tiering); these cover runtime behavior and feature areas, and point back rather than restating it.

- **`architecture.md`** - runtime architecture: which processes fire on which event, the eight session-start blocks and their order, the five state locations (only one of which is inside a repo), the data flow in each direction, the trust boundaries, and the external integrations.
- **`cross-project-memory.md`** - the kit-owned memory tier for facts that span projects: the store at `~/.claude-kit-memory/`, the two session-start blocks, the generated index line and its `[body revised]` marker, advisory decay, every failure mode, and how to operate it. The record schema and the routing ladder are deliberately not restated here; they live once, in `plugins/claude-kit/hooks/memory-lib.js`'s header.

## Living documents

- **`backlog.md`** - cross-effort next steps, active items only. Finished items move to a dated snapshot in `archive/`; the first is `archive/backlog-2026-Q3.md`.
- **`kit-adoptions.md`** - the standing record of what this kit has taken, reshaped, refused, or not yet decided from Scott Applefeld's kit, plus the watermark a pass diffs from. Written by the `kit-adoption-pass` skill; its `Last pass:` header is parsed by the session-start staleness nudge.

## Archive

Completed plans, most recent first.

- **`archive/cross-project-memory_spec_v1.md`** - the kit-owned tier for facts that span projects, built in seven sections 2026-08-08 to 2026-08-10. Its session-start index is generated from the records rather than maintained beside them, because index currency is a byproduct of creating a memory and never of revising one (measured 15/15 against 0/8). Adapted from Scott's memq work as design input rather than ported. Two findings worth the reread: stamping moved out of the record into an append-only journal after compare-and-swap was measured losing an applied day 8.3% of the time, and S7's RED gate falsified its own section's premise, so the wording it was meant to justify was cut instead of shipped. Live behavior and operation are documented in `cross-project-memory.md`.
- **`archive/appsec-security-reviewer_spec_v1.md`** (Abandoned) - whether non-.NET repos with real attack surface warranted a standing appsec reviewer. Abandoned 2026-08-07: the docs-lifecycle effort had already generalized `security-reviewer` to any production codebase, which was this stub's own option 3, and the friction that opened it (a Python repo needing a dispatch override) no longer occurs.
- **`archive/kit-adoption-pass_spec_v1.md`** - the `kit-adoption-pass` skill and `kit-adoptions.md`, its standing record: a five-step read ladder (orient, new capabilities, changed prose, adjudicate a survivor, read code) that classifies off Scott's docs and diffs rather than his code, a recorded-sha watermark, removals as a bounded set intersection, a ledger written before the pass offers a shortlist and one recommended next move, a `writing-skills` gate for the ported wording such a pass generates, and a kit-repo SessionStart nudge when a pass goes stale.
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

Four plugin hooks give the taxonomy mechanical teeth: `docs-write-guard` denies a non-curator subagent any write into `docs/`, `stop-docs-hygiene` flags scratch leaked into `docs/` at turn end, a `session-start` nudge flags an unarchived Complete plan at session start, and `pr-docs-guard` blocks opening a PR while `docs/` has uncommitted changes.

The split between those middle two is deliberate and load-bearing. Both flags used to fire at turn end, and the unarchived-Complete one keyed on repo state with no regard for what the session did, so a read-only question ended with an archiving demand about a plan the session never touched. A missed close-out is a standing condition, which is a session-start concern; leaked scratch is a pre-commit condition, which is the only one that earns a block. `test/stop-docs-hygiene.test.js` pins the non-behavior, so re-adding the Complete check to the Stop hook fails the suite.

One file here carries a machine contract, so editing it is not purely an editorial act. `kit-adoptions.md`'s `Last pass:` line is parsed by the session-start staleness nudge, which reads the first 2 KB of the file and matches a bare `Last pass: YYYY-MM-DD` line at column zero. Turning it into a heading or a list item, indenting it, appending anything after the date, or pushing it below that head read all kill the nudge silently, with no error anywhere. `test/session-start-adoption.test.js` runs the shipped file through the hook with only its date token rewritten, so a reformat fails the suite instead of going unnoticed until a pass is months overdue.
