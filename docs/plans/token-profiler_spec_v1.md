# Operational Token Profiler (Piece 2 of token-efficiency)

Status: Complete
Commit Model: Commit-and-Push
Created: 2026-07-20

## Goal

A maintainer-run profiler that attributes cost-weighted token spend across a
session's full fan-out (the main orchestrator thread plus every subagent it
spawned) to the kit's skills and processes, aggregated across sessions, and emits
a compact, self-describing ranked report built to be fed back into Claude for
"what should I focus on trimming" reasoning. When this is done, "which parts of
the kit's workflow actually burn tokens, and is the leverage in session length,
fan-out, or a specific skill" is a question answered by running one command over
real transcripts, rather than by extrapolating from one session or reasoning in
the abstract.

This is Piece 2 of the token-efficiency work. Piece 1 (the standing-context
audit, `token-efficiency-audit_spec_v1.md`, Complete) measured the fixed
per-session floor. Piece 2 measures the variable cost of the work above that
floor. It reuses Piece 1's methodology (transcript reading, zero-standing-
footprint maintainer script, report to stdout).

## Approach

### What Piece 1's recon established (the design rests on these)

- Subagent token cost IS captured, in per-session sibling files:
  `<configBase>/projects/<encoded-cwd>/<session-id>/subagents/agent-<agentId>.jsonl`,
  one file per dispatched agent, each with full per-turn `message.usage`. The main
  `<session-id>.jsonl` is main-thread only (`isSidechain` always false).
- Per-skill attribution is feasible: every main-thread turn carries
  `attributionSkill` (observed values include `claude-kit:executing-work`,
  `claude-kit:finishing-work`, `claude-kit:brainstorming`, `claude-kit:kaizen`)
  and `attributionPlugin`. Each dispatch records its `subagent_type`, and the
  dispatch's tool result carries the `agentId` that names the subagent file. So a
  subagent's cost links back to the skill that spawned it. (`slug` is a random
  session-level name, NOT the agent type; do not use it.)
- Cost MUST be weighted, not summed raw. In a long reference session, 74% of the
  raw token sum was cache-read (billed at ~10% of a fresh token). Raw sums make a
  many-turn agent look catastrophic when most of it is cheap re-reads.
- The reframe that shaped this design: in that long session the MAIN orchestrator
  thread was ~80% of the weighted cost and the six subagents only ~20%, because a
  long session re-reads its accumulated context every turn. So the report must
  make the main-vs-fan-out split visible and not assume fan-out is the cost.

### Design decisions

- **Zero standing footprint**, same as Piece 1: `tools/token-profiler.js`, Node
  core only, no dependencies, lives at repo root OUTSIDE `plugins/claude-kit/`,
  on-demand, report to stdout. Not a skill/hook/command.
- **Cost-weighted, per model.** Apply real per-model, per-token-type Anthropic
  pricing (input, output, cache-write, cache-read) using `model` on each turn.
  Prices are a dated constant sourced from the `claude-api` skill at build time.
  The primary displayed unit is estimated cost in USD; the report states the cost
  model and the dated price constant inline. Price drift is handled by updating
  the dated constant and re-running (the tool reads live transcripts), not by
  recomputing from a stale report. As-built note: the engine computes the
  per-token-type counts behind each total per turn, but rendering them in the
  report was dropped to keep the default output compact (see Chapter 4); they are
  available to add to `--detail` as a post-close increment if wanted.
- **Attribution.** Main-thread turns attributed by `attributionSkill`
  (null -> "session base"). Each subagent's whole-file cost rolled into the skill
  active on its dispatching turn, via `subagent_type` + the `agentId` that names
  its file.
- **Primary ranking: per-skill/process, end-to-end** (the triage unit): each
  skill ranked by total cost, each line showing the main-thread-vs-fan-out split
  and which subagent types it spawned, plus a one-word leverage hint
  (accumulation / fan-out / skill) pointing at where the cost concentrates.
- **Cross-session.** Aggregate across a set of sessions (default: the current
  project's sessions; a flag narrows to a time window). One session is not
  representative, so cross-session is required for trustworthy ranking.
- **Output built to feed back to Claude.** Compact and self-describing by
  default: an actionable ranked summary first, the cost model and units stated
  inline, small enough that pasting it back to Claude costs little. Full
  per-session / per-agent detail is behind an opt-in `--detail` flag so the
  default stays lean.

## Sections of Work

### 1. Core engine: transcript + subagent reading and the cost model
Read a session's main transcript and its `subagents/agent-*.jsonl` files; produce
per-turn cost records weighted by a per-model, per-token-type price table.

Acceptance criteria:
- Given a session id (or the latest in the current project by default), the engine
  reads the main `*.jsonl` and every `<session>/subagents/agent-*.jsonl`, skipping
  meta lines and lines without `message.usage`.
- Each turn yields an estimated USD cost plus the underlying per-token-type token
  counts (input, output, cache-write, cache-read) and its `model`, computed from
  `input_tokens`, `output_tokens`, `cache_creation_input_tokens`,
  `cache_read_input_tokens` using a dated price constant, so totals are both
  rankable (in USD) and recomputable under new prices.
- The price table covers the models actually present in the transcripts (at least
  the current Opus, Sonnet, and Haiku); an unknown model degrades gracefully (uses
  a documented fallback and flags it) rather than crashing.
- The cost-weighting function is pure and unit-tested (see Test Discipline).
- Node core only, no dependencies; never throws unhandled.

Execution mode: delegate-capable.

### 2. Attribution, cross-session rollup, and the report
Link subagents to spawning skills, aggregate per-skill end-to-end and across
sessions, and render the compact feed-back-friendly ranked report.

Acceptance criteria:
- Main-thread turns are attributed to their `attributionSkill` (null -> "session
  base"); each subagent's cost is attributed to the skill active on its
  dispatching turn, resolved via `subagent_type` + `agentId`.
- The default report is a markdown document to stdout: an actionable summary
  first, then skills/processes ranked by total cost, each line showing the
  main-vs-fan-out split, the subagent types spawned, and a leverage hint
  (accumulation / fan-out / skill). The cost model, units, and the price-constant
  date are stated inline.
- Aggregation spans multiple sessions (default: the current project); a flag
  narrows to a time window.
- A `--detail` flag emits the full per-session / per-agent breakdown; without it
  the report stays compact enough to feed back to Claude cheaply.
- Reads are read-only; a currently-running (partial) session transcript is handled
  without error and noted as partial.
- The report edits nothing and writes no committed artifact.

Execution mode: delegate-capable.

### 3. Discoverability
Add a pointer in the README `MAINTAINER TOOLS` section for `tools/token-profiler.js`:
what it measures, when to run it, and the invocation.

Acceptance criteria:
- The README references the profiler and its command alongside the Piece 1 audit.
- A maintainer can find and run it without prior context.

Execution mode: delegate-mechanical.

## Out of Scope

- Acting on findings. The two kaizen items this recon produced (nudging a fresh
  session at Chapter boundaries; disabling the Workflow feature in the kit's
  recommended settings) are separate, inbox-parked decisions, not this effort.
- Modifying Piece 1's `standing-context-audit.js`.
- Live/real-time monitoring. This is on-demand, post-hoc analysis of transcripts
  already on disk.
- Automated invocation, a hook, a slash command, or an npm script.
- Sizing the standing floor's schema text (Piece 1 established it is not in the
  transcript; the profiler works from usage totals, which already include it).
- Dollar precision as prices drift. The tool uses a dated price constant; a stale
  dollar figure is acceptable because the input-equivalent-token ranking is
  price-independent.

## Open Questions

- Exact per-model prices (current Opus, Sonnet, Haiku, and their cache-write /
  cache-read multipliers). Owner: implementation, sourced from the `claude-api`
  skill and recorded as a dated constant.
- Cross-session default scope (current project's sessions vs a time window vs all
  projects). Owner: implementation; start with the current project plus a
  time-window flag, finalize against real directory contents.
- Robust dispatch-to-subagent linking when a dispatch fails or an agentId is
  missing. Owner: implementation; attribute an unlinkable subagent to "unattributed"
  rather than dropping it, and surface the count.

## Test Discipline

Unlike Piece 1, one part here earns a durable test: the cost-weighting function is
a pure business rule whose error is silent and corrupts every ranking. It gets a
small durable unit test (using Node's built-in `node:test`, no dependencies):
known usage counts + a fixed price table assert an expected cost, including the
cache-read and output multipliers and the per-model rates. Watch it fail first. The rest (transcript/subagent reading, attribution, report rendering)
stays verification-by-run reconciled against a real session, as in Piece 1 - a
golden-file test over changing transcripts would be brittle and low-value.

## Chapters

### Chapter 1 - 2026-07-20
Completed: Section 1 - Core engine and cost model (`tools/token-profiler.js` + `token-profiler.test.js`)
Implemented By: implementer-opus
Decisions / Surprises:
- Reused Piece 1's `encodeCwd` + config-base search (copied, not shared - the two sibling tools deliberately do not share a module).
- The transcript exposes cache-creation split by TTL (`usage.cache_creation.ephemeral_5m/1h_input_tokens`), so the cost model weights 5m (1.25x) vs 1h (2x) writes precisely.
- Subagent dir also holds `agent-<id>.meta.json` siblings; the reader matches `agent-*.jsonl` only.
- Model resolution is lenient longest-prefix (handles `claude-opus-4-8[1m]`, dated Haiku variants); unknown models fall back to the Opus rate and are flagged.
Review Findings: Per-section adversarial review deferred and folded into the Section 2 / whole-Piece-2 pass (rationale: the load-bearing cost function is pure, unit-tested with a watched fail-first, and orchestrator-spot-checked; Section 2 extends the same file and its review exercises the engine, so one combined pass avoids re-reviewing the engine twice and re-paying a reviewer's standing floor).
Verification: `node --check` clean; `node --test` = 5/5 pass; fail-first confirmed (broke cache-read mult 0.1->1.0, tests failed, restored, passed); CLI smoke reconciles; `/nonexistent` path degrades, exits 0.
Next: Section 2 - attribution, cross-session rollup, report
Commit Model: Commit-and-Push (commit and push HELD pending Daren's explicit approval; changes staged only)

### Chapter 2 - 2026-07-20
Completed: Section 2 - Attribution, cross-session rollup, and the report (extends `tools/token-profiler.js`)
Implemented By: implementer-opus (combined-pass review fixes applied by the same agent via follow-up)
Decisions / Surprises:
- Linkage: the dispatch `tool_use` (with `subagent_type`) and its turn's `attributionSkill` are in billable (assistant) `mainTurns`, but the matching `tool_result` carrying `agentId` is in a USER turn WITHOUT `message.usage`, so it is absent from the engine's billable turns. Section 2 reads dispatches from `mainTurns` and the `agentId`->`tool_use_id` result map from a targeted raw read of the same transcript, joined on `tool_use_id`. (The original dispatch brief wrongly said to read results from `mainTurns`; the implementer caught and corrected it - a DONE_WITH_CONCERNS that was the right call.)
- Leverage is measured in DOLLARS, not tokens: accumulation = cache-read $ (billed 0.1x), own-work = input+output+cache-write $, fan-out = subagents' $. Because cache-read bills at 0.1x, the earlier "accumulation dominates" reading (true of token VOLUME) does NOT hold in dollars - most skills show "skill" (own generation) leverage. This corrected a parked hypothesis: in money, orchestrator/skill output (5x) is the bigger lever, not context re-reading. Worth carrying into the two kaizen items.
- Cross-session finding (5 sessions this project): ~$155 total, 88% main-orchestrator vs 12% subagent fan-out; the un-skilled "session base" bucket is the single largest.
Review Findings: Combined adversarial pass over BOTH sections (Section 1's review folded in per Chapter 1). APPROVED_WITH_CONCERNS. Verified correct against real transcripts: cost model, TTL split, model resolution, the two-read attribution join, cross-session enumeration (non-recursive, deduped), leverage math (components sum to total), graceful degradation, non-.NET security (read-only, agentId regex has no ReDoS).
- Major (FIXED): the unknown-model fallback flag was computed but never surfaced, so a transcript with a model outside the price table would be silently Opus-priced. Now counted and shown in an "Estimation caveats" header block (only when > 0).
- Minor (FIXED): `cacheWriteAssumed5m` computed-but-unread -> surfaced in the same caveats block; stale Section-1 "smoke test" comments/catch message reworded; `module.exports` trimmed to the 3 the test uses (8 speculative engine-API exports removed); synthetic buckets (`session base` / `unattributed`) no longer get skill-framed "trim the prompts" advice.
- Minor (ACCEPTED, not fixed): the `partial` = newest-by-mtime heuristic and its always-on "may be partial" caveat (reasonable for a maintainer estimate tool); dispatches whose subagent files are absent (cleaned up or still-running) are omitted from spawned counts + fan-out (acceptable undercount for an estimate tool).
Verification: `node --test` = 5/5 pass; default / `--detail` / single-session / `--days 1` / `/nonexistent` all exit 0; corrected headline wording and trimmed exports confirmed.
Next: Section 3 - Discoverability (README pointer)
Commit Model: Commit-and-Push (commit and push HELD pending Daren's explicit approval; changes staged only)

### Chapter 3 - 2026-07-20
Completed: Section 3 - Discoverability (README pointer)
Implemented By: main session. Deviation: speced as delegate-mechanical, done in-session because it is a 3-line doc addition - spawning a subagent would cost more than the edit, and this effort's own data argues against paying a subagent's standing floor for a trivial doc change. Does not change design intent.
Decisions / Surprises: none. Added a `tools/token-profiler.js` paragraph to the existing README MAINTAINER TOOLS section, matching the standing-context-audit entry's format; no em dashes.
Review Findings: per-section review skipped (trivial, self-contained doc addition; finishing-work covers it). Spot-checked: surgical, exact `node tools/token-profiler.js` command present, no em dashes.
Next: finishing-work
Commit Model: Commit-and-Push (commit and push HELD pending Daren's explicit approval; changes staged only)

### Chapter 4 - 2026-07-20 (finishing-work)
Completed: Effort close-out - QA, security posture, adversarial coverage, docs decision, spec reconciliation.
Implemented By: main session; qa-verifier dispatched.
QA: qa-verifier PASS on all 11 acceptance criteria (node --check clean, node --test 5/5 including the cache-read/output-multiplier and unknown-model-fallback assertions, all CLI modes exit 0, read-only footprint confirmed, the unknown-model + assumed-5m "Estimation caveats" block verified firing via a synthetic transcript and staying hidden on all-known-model real data). Non-blocking: totals drift run-to-run because the live session is running and correctly flagged `partial` - by design.
Security: security-reviewer NOT dispatched - the changeset is entirely JS + markdown (non-.NET). Non-.NET security folded into the adversarial coverage: read-only, no shell/eval/writes, the agentId regex has disjoint classes (no ReDoS), worst case mis-links to "unattributed".
Adversarial coverage: NO separate finishing adversarial dispatch. Justification: the entire Piece 2 changeset (both code sections) already had a combined whole-changeset adversarial pass this session (APPROVED_WITH_CONCERNS); the only changes since were that review's own 5 fixes (1 Major + 4 Minor) plus the 3-line Section 3 README, each small and re-verified by QA (all 11 criteria, including the synthetic-transcript check of the Major fix) and orchestrator spot-check. Re-dispatching a full reviewer for those deltas is the duplicate "manufactured pass" finishing-work warns against and re-pays a reviewer's standing floor for near-zero marginal coverage. Recorded so a fresh session can re-dispatch if it disagrees.
Docs curation: docs-curator NOT run. Same justification as Piece 1: the deliverable's only documentation is the README MAINTAINER TOOLS pointer (authored and reviewed in-effort) plus the self-documenting code; no separate docs/ layer describes kit tools, and the spec is reconciled to as-built. No drift report to adjudicate.
Spec reconciliation: the Approach's claim that the report "exposes per-token-type counts for recomputation" overreached - the engine computes them per turn but the report renders dollars only, keeping the default compact (a stated requirement). Reconciled the Approach text; price drift is handled by updating the dated price constant and re-running. Optional post-close increment: render the counts under `--detail`. Raised to Daren.
Result: Piece 2 complete. Cross-session finding (5 sessions this project): ~$155-177 estimated (varies as the live session grows), ~88%/12% main-orchestrator vs subagent fan-out. In DOLLARS the dominant lever is skills' own generation (output at 5x), NOT context accumulation - accumulation dominates token VOLUME but bills at 0.1x, so it is a minor dollar cost. This corrects the parked "sessions run too long -> accumulation" hypothesis and should temper the two kaizen efficiency notes (revisit them with dollar-weighted, not token-weighted, evidence).
Commit Model: Commit-and-Push - commit and push HELD pending Daren's explicit approval; the full changeset is staged as the review surface.
