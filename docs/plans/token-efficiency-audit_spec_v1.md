# Token-Efficiency Static Audit (Piece 1: Standing-Context Audit)

Status: Complete
Commit Model: Commit-and-Push
Created: 2026-07-09

## Goal

A maintainer-run script that reports the standing (per-session,
task-independent) context cost of the kit, attributes the kit-owned slice
precisely, grounds the real total against a session transcript, and ranks
kit-owned sources so trim candidates are visible - all without adding any
standing footprint or workflow friction to the kit itself. When this is done,
"how much does the kit cost every session, and where does that weight sit" is a
question answered by running one command, and we know whether trimming the kit's
own surface is even worth pursuing before spending effort on it.

This is Piece 1 of two. Piece 2 (an operational per-skill/per-process token
profiler that mines transcripts to rank which skills and subagent dispatches
consume the most tokens) is a separate subsystem with its own brainstorm and
spec, sequenced after this one. Piece 1 measures the fixed floor every session
pays; Piece 2 measures the variable cost of the work above that floor. Piece 1
also establishes the reusable methodology (transcript reading, the char->token
proxy, the report format) that Piece 2 inherits.

## Approach

### Load-bearing constraint: zero standing footprint

A token-efficiency tool that adds standing tokens or workflow friction is
self-defeating. The tool is therefore invisible until deliberately run:

- Not a skill (a skill ships a description into every session's standing
  context - the exact thing being measured).
- Not a hook, and not shipped inside `plugins/claude-kit/` (nothing injected,
  nothing added to what every kit user carries).
- A maintainer script that lives at repo root under `tools/`, outside the
  distributed plugin, so it is never packaged for kit users and never touches a
  normal workflow.
- Node core only, no dependencies, no setup - mirroring the `session-start.js`
  idiom (cross-platform, degrade-silently-on-failure).

Normal kit usage is completely unchanged; the tool has weight only in the moment
it is run.

### Invocation model: on-demand, not automated

- Not automated. A hook or schedule would reintroduce a standing moving part,
  and an occasional maintenance measurement has no natural trigger and would
  mostly produce output nobody reads.
- Primary path (conversational): in a kit-repo session, Daren asks Claude to run
  the audit; Claude runs the script and relays the ranked report. This is the
  path that will actually be used, since efficiency and kaizen passes happen in a
  session anyway. No file hunting.
- Backstop path (direct): `node tools/standing-context-audit.js` from repo root,
  documented in the README. Single line, no deps.
- No slash command / npm script for now: the conversational path is already
  frictionless and definitively zero-footprint, and a custom-command listing may
  not stay out of the model's standing context. Revisit only if the footprint is
  confirmed nil.

### What it measures, and the honest limits (option B)

- Kit-owned, measured precisely from the repo (the portable, controllable
  surface): each skill's `description` frontmatter, each agent's `description`,
  and the shipped `assets/CLAUDE.md`. Broken out per source.
- Real total, from a transcript: the standing-token floor read from a real
  Claude Code session transcript (`*.jsonl`) - the actual tokens the standing
  prompt cost, not a proxy. This is the denominator that makes the kit's slice
  meaningful. Defaults to the most recent transcript for the current project;
  accepts an optional transcript path as the first argument.
- Reconciliation and proportion: kit-owned chars are converted to tokens via a
  stated proxy ratio and expressed as a fraction of the real total. The
  remainder (total minus kit-owned) is reported as non-kit / harness / MCP /
  system overhead, and the connected MCP servers are named (best-effort,
  enumerated from the transcript's `mcp__<server>__` tool references) so the
  remainder is not a black box. These servers are connected via claude.ai and are
  absent from local config, so the transcript is the reliable enumeration source.

Honest limits, stated in the report itself:

- Real total, proxy per-source. The transcript gives a real total but not a
  per-source breakdown (the standing prompt is one assembled blob). Kit-owned
  sources are therefore a char-based proxy; the total is real tokens. The report
  labels measured vs. estimated and reconciles the two.
- The non-kit remainder is unattributed by size. The script cannot see the text
  of harness tool schemas or MCP payloads (not on disk), so it reports their
  combined size as the remainder and names the contributors it can identify.
- The total is environment-specific. It reflects whatever MCP servers/plugins
  were connected in the measured session, not a fixed property of the kit. The
  kit-owned slice is the portable part. The report says so.

### Standing-token isolation (methodology Piece 2 inherits)

The standing floor is read from the first request of a session, before
conversation accumulates: the total input for that request (uncached input plus
cache-creation plus cache-read), which is the task-independent prefix (system +
tools + skills + agents + CLAUDE.md + MEMORY) plus the session's first user
message. Cold vs. warm cache splits the same tokens between creation and read, so
summing all three input components (not cache-creation alone) is the robust
measure. The first user message is typically small and is disclosed as a caveat
in the report rather than subtracted. The exact method was finalized against the
real transcript during implementation and is documented in the script header,
because Piece 2 depends on it.

### Output

A ranked markdown report to stdout (no committed artifact, so it never goes
stale): kit-owned sources largest-first, size-outlier descriptions flagged as
review candidates, the real total and its source session cited, the kit slice as
a proportion, and the transparency caveats in the header. The tool never edits
any file - trimming is a separate downstream effort.

## Sections of Work

### 1. The standing-context audit script
Build `tools/standing-context-audit.js` (repo root, outside `plugins/claude-kit/`),
Node core only, no dependencies.

Acceptance criteria:
- Running `node tools/standing-context-audit.js` from the repo root prints a
  markdown report to stdout and exits 0.
- Kit-owned per-source numbers match the recon figures within rounding: skill
  descriptions total ~4.75 KB across 12 skills; agent descriptions total
  ~3.13 KB across 8 agents; shipped `assets/CLAUDE.md` ~4.76 KB. Each is broken
  out per skill/agent, largest-first.
- The report shows a real standing-token total read from a session transcript
  and names which session/transcript it used.
- The report expresses the kit-owned slice as a proportion of the real total,
  clearly labels measured vs. estimated figures, and lists connected MCP servers
  by name (or states it could not determine them).
- The report flags the largest-outlier descriptions as trim candidates and edits
  no file.
- No dependencies beyond Node core; runs on a clean checkout. Missing inputs (no
  transcript found, no MCP references in the transcript) degrade gracefully with a
  stated caveat rather than crashing; the script never throws unhandled.
- The script's header comment documents the standing-token isolation method used.

Execution mode: delegate-capable.

### 2. Discoverability
Add one maintainer-tools note to the repo `README.md` pointing at the script:
what it measures, when to run it (efficiency / kaizen passes), and the
`node tools/standing-context-audit.js` invocation.

Acceptance criteria:
- The README references the tool and the invocation command.
- A maintainer reading the README can find and run the tool without prior
  context from this effort.

Execution mode: delegate-mechanical.

## Out of Scope

- Trimming any skill/agent description or CLAUDE.md. Descriptions are the trigger
  surface that makes skills/agents activate; trimming is behavior-shaping and
  belongs in a separate, writing-skills-disciplined, baseline-tested effort
  informed by this report.
- Piece 2, the operational per-skill/per-process token profiler (its own
  brainstorm and spec).
- The variable-cost workflow discipline (dropping large external docs mid-session
  instead of carrying them turn after turn) - depends on Piece 2's findings.
- Automated or scheduled invocation, a slash command, or an npm script.
- Per-source real token counts (unavailable; the transcript yields the total
  only).

## Open Questions

- Exact standing-token isolation from the transcript (which input components on
  the first request best represent the task-independent prefix). Owner: resolved
  during implementation against the real transcript, then documented in the
  script header. Starting method is in Approach.
- Whether connected MCP servers are reliably enumerable from config in this
  environment. Resolved: they are claude.ai-connected and absent from local
  config, so the tool enumerates them from the transcript's `mcp__<server>__`
  references (best-effort, graceful degradation when none are present).

## Test Discipline

No durable automated test. The output is a deterministic report over inputs that
change as the kit evolves; a golden-file test would be brittle and low-value.
Verification is a single run reconciled against the known source sizes measured
during recon (skill descriptions ~4.75 KB, agent descriptions ~3.13 KB, shipped
CLAUDE.md ~4.76 KB), confirming the numbers line up and the report renders.

## Chapters

### Chapter 1 - 2026-07-20
Completed: Section 1 - The standing-context audit script (`tools/standing-context-audit.js`)
Implemented By: implementer-opus (review fixes applied in main session)
Decisions / Surprises:
- Standing-token isolation confirmed against real transcripts: first non-sidechain
  assistant message, summing input + cache_creation + cache_read (robust to
  warm/cold prompt cache). Reference run: real total 38,752 tokens; kit-owned
  ~3,159 estimated tokens = 8.15% of standing context. The kit is a minority
  slice, as predicted - trimming kit descriptions is low-leverage vs. the ~92%
  remainder (harness tool schemas + connected MCP servers).
- MCP servers are claude.ai-connected and absent from local config, so they are
  enumerated from the transcript's `mcp__<server>__` references (11 found). Spec
  Approach and Open Question updated to match the as-built.
- Quote-stripping added to description parsing: 6 skill descriptions are YAML
  double-quoted scalars; excluding the quotes (as the YAML parser does) yields the
  accurate 4,738 chars vs. the raw 4,750 my recon counted.
- Notable for Piece 2: transcript entries carry `attributionSkill` and
  `attributionPlugin` fields. Per-skill/per-process token attribution is far more
  tractable than feared - the harness already tags turns by skill/plugin.
Review Findings: adversarial-reviewer returned CHANGES_REQUIRED.
- Major (fixed): `encodeCwd` replaced only `/`, silently breaking default
  transcript discovery for any dotted path - including the `.claude-worktrees`
  workflow the kit itself promotes. Fixed to replace every non-alphanumeric char;
  proven to reproduce the real on-disk dir name.
- Minor (fixed): division-by-zero producing `Infinity%` on a zero-usage
  transcript; now gated on a positive total with a correct fallback message.
- Minor (resolved via spec): MCP "from config" doc-drift; spec updated.
- Minor (fixed): `extractDescription` now strips quoted scalars.
- Accepted limitation (noted, not fixed): folded/block YAML scalars and
  BOM-prefixed frontmatter are not handled; no kit description uses them.
Next: Section 2 - Discoverability (README pointer)
Commit Model: Commit-and-Push (commit and push HELD pending Daren's explicit approval; changes staged only)

### Chapter 2 - 2026-07-20
Completed: Section 2 - Discoverability (README pointer)
Implemented By: implementer-sonnet
Decisions / Surprises: none. Added a `## MAINTAINER TOOLS` section matching the README's all-caps heading convention, placed before the closing END RESULT line.
Review Findings: per-section adversarial review skipped (trivial, self-contained doc addition; finishing-work covers it). Spot-checked the staged diff: surgical (only the new section added), exact `node tools/standing-context-audit.js` command present, no em dashes.
Next: finishing-work
Commit Model: Commit-and-Push (commit and push HELD pending Daren's explicit approval; changes staged only)

### Chapter 3 - 2026-07-20 (finishing-work)
Completed: Effort close-out - QA, security posture, docs decision, final adversarial review, spec reconciliation.
Implemented By: main session (orchestrator); qa-verifier and adversarial-reviewer dispatched.
QA: qa-verifier PASS on all 10 acceptance criteria (build via `node --check`, behavioral runs, per-source reconciliation, graceful degradation, exit codes, no-writes, out-of-plugin location, README pointer). It flagged one data-quality issue, fixed below.
Security: security-reviewer NOT dispatched - the changeset is entirely JS + markdown (non-.NET). Non-.NET security folded into the adversarial pass, which found no meaningful surface (no shell/child_process/eval/network; per-line try/caught JSON.parse; read-only maintainer-trusted paths).
Docs curation: docs-curator NOT run. Justification: tiny effort whose only documentation is the README MAINTAINER TOOLS pointer (authored and reviewed within this effort) plus the script's self-documenting header; no separate docs/ layer describes kit tools, and the spec is already reconciled to the as-built. The finishing adversarial pass verified the README against the as-built. No drift report to adjudicate.
Post-QA fix: MCP enumeration regex tightened to `/mcp__([A-Za-z0-9_]+?)__[A-Za-z0-9]/g` (require a tool char after the server), eliminating a phantom `server` captured from `mcp__server__` placeholder text in the transcript; verified the 11 real servers still enumerate.
Final adversarial review: APPROVED. The four post-review fixes (encodeCwd, zero-total gate, quote-strip, MCP regex) verified sound against real on-disk data; Out of Scope fully honored; no security defect. Findings: two Minor spec-prose drifts, both FIXED (isolation-method wording now matches the as-built; "no MCP config" -> "no MCP references in the transcript"). Two code caveats rated acceptable-to-leave and ACCEPTED (not fixed): a contrived quote-strip mis-strip case that no kit description triggers, and cosmetic rendering of an unsanitized sessionId in the maintainer's own-file report.
Commit Model: Commit-and-Push - commit and push HELD pending Daren's explicit approval; the full changeset is staged as the review surface.
Result: Piece 1 complete. Reference run: standing total 38,752 tokens, kit-owned ~3,159 est. tokens (8.15%) - the kit is a minority slice, so trimming kit descriptions is low-leverage against the ~92% harness/MCP remainder. Piece 2 (operational per-skill/process token profiler) is the next brainstorm, materially de-risked by the finding that transcript entries carry `attributionSkill`/`attributionPlugin`.
