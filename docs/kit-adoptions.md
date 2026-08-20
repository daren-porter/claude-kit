# Kit Adoptions

Last pass: 2026-08-07
Watermark: 09c91a4
Source: `SApplefeld/sapplefeld-claude-kit`, cloned at `~/repos/sapplefeld-claude-kit`

The standing record of what this kit has taken, reshaped, refused, or not yet decided
from Scott Applefeld's kit. claude-kit is a personalized fork of theirs, the two are
compared periodically, and before this file existed each pass re-derived decisions that
earlier passes had already made and buried in archived specs.

The `kit-adoption-pass` skill owns the procedure. This file is its state: a pass reads
it first, and writes back to it before offering the user anything.

**Inbound only.** Nothing here goes back to the upstream. There is no outbound half.

## The `Last pass:` header is a machine contract

`Last pass:` is parsed by the `session-start.js` staleness nudge, which reads only the
head of this file. Four rules follow, all of them about that one line:

- It stays a **bare line at column zero**. Not a heading, not a list item, not indented.
  The predicate is anchored, so `### Last pass` or `- Last pass:` kills it silently, with
  no error anywhere.
- Its date stays in strict `YYYY-MM-DD` form. Nothing else parses.
- It stays at the top, inside the first 2 KB. The hook does a bounded head read and will
  not find a line pushed below it.
- A pass updates it. Nothing else reformats it.

`Watermark:` and `Source:` are for human readers and for the pass itself. Nothing parses
them, and they carry no format contract beyond staying legible.

`Watermark` is the last sha whose window was fully classified. A pass fetches (never
pulls) and diffs `<watermark>..origin/main`.

**When the watermark advances:** when every capability in the window carries a verdict
and the removals check has been run and recorded. **pending** counts as a verdict, so a
window is adjudicated when nothing in it is unclassified, not when nothing in it is
outstanding. Both halves are required: a window whose removals were never intersected is
not classified, however many candidates carry verdicts. Most of the 2026-08-07 pass below
is still pending and the watermark moved to `09c91a4` anyway, because every candidate in
that window carries a verdict and the removals check was run.

**The clone path is confirmed, not trusted.** It has moved once already:
`archive/claude-kit_spec_v3.md` cites `~/repos/claude-kit-scott`, which no longer
exists. Check the path before a pass depends on it.

## Verdict vocabulary

| Verdict | Means |
|---|---|
| **adopted** | Taken, with where it landed in this kit. |
| **adapted** | Taken and reshaped, with what changed and why. |
| **rejected** | Refused, with the reason. Permanent unless the reason stops holding. |
| **pending** | Classified but not yet adjudicated. Real work, not a shrug. |

Verdicts are keyed by **capability, never by commit or sha**. A sha-keyed rejection
silently suppresses a re-look when the upstream author substantially reworks something this kit
already refused. Keyed by capability, a later pass seeing new commits against a rejected
entry asks whether the reason still holds instead of skipping it.

**pending** is what makes this file worth having. One pass over 138 commits produced
more candidates than anyone can adjudicate in a sitting; without a pending state the
next pass re-derives everything the last one ran out of time for. "Too large to
adjudicate inside a pass, needs its own brainstorm" is a legitimate outcome, not a
failure to decide.

Each entry carries: capability, verdict, the date and sha the verdict was made at, and
a one-line reason. Entries predating the watermark convention carry a date only, because
no sha was recorded at the time and none is recoverable; do not invent one to fill the
column.

A candidate is a thing they have that this kit might want. Their **removals** are checked
separately, per pass, as a set intersection against this kit's tree, and that check has
its own outcome rather than a verdict from the table above.

## The adjudication criterion

Recorded by `archive/claude-kit_spec_v3.md` (Approach) and standing since 2026-06-17:

> For each candidate, ask whether it reflects a **deliberate decision** or is
> **upstream-specific**.

A deliberate decision is portable and worth weighing on its merits. Upstream-specific means
it serves their machine, their platform, their team, or their voice, and taking it imports a
constraint this kit does not have. The two kits hold real and permanent philosophical
differences, so **reshaping is the normal case and taking as-is is the exception.**

## Standing rejections

Refused in earlier passes. Each holds until its reason stops holding.

| Capability | Decided | Reason |
|---|---|---|
| Their full operating manual (132 lines) wholesale | 2026-06-17 | Reverses v2's deliberate slimming and duplicates what this kit's skills already own. Individual nuggets remain separable; see the pending entry below. |
| `format-on-edit` hook | 2026-06-17 | Upstream-specific. |
| `scott-writing-style` | 2026-06-17 | Their voice, by definition. |
| The CLAUDE-FOR-FABLE variant | 2026-06-17 | This kit deliberately never ties the main thread to a model name; a per-model CLAUDE.md reverses that. |
| The agent-teams harness | 2026-06-17 | The design council runs on stable Claude Code without it. |
| Their Windows relay clause | 2026-07-24 | Platform-specific; this is a Linux workstation. |
| Their compaction-ledger genealogy | 2026-07-24 | This kit runs no such engine, and session identity already survives native summarization and `/resume` without it. The upstream author has since removed the route themselves, on the additional ground that it let a user-writable file drive a leash rebind. |

## Already taken

So a later pass does not re-propose them. All of these were **adapted** rather than
adopted as-is, which is the normal case.

| Capability | Decided | Landed as, and what changed | Detail in |
|---|---|---|---|
| Subagent model down-selection | 2026-06-17 | Execution modes in `executing-work`. Their per-section model tier hard-codes "fable or untiered = main thread", assuming the human runs Fable; this kit records **main / delegate-capable / delegate-mechanical** instead, so the main thread is never tied to a model name. Later extended with `delegate-fable`. | `archive/claude-kit_spec_v3.md` |
| Design council | 2026-06-17 | `design-council` skill plus the `council-member` and `design-facilitator` agents. Made opt-in and cost-named, and cut loose from their agent-teams harness. | `archive/claude-kit_spec_v3.md` |
| `cold` evaluation lens | 2026-06-17 | `cold` skill. Reshaped to the user and cross-referenced to the global anti-sycophancy rule rather than restating it. | `archive/claude-kit_spec_v3.md` |
| Two operating-discipline rules | 2026-06-17 | `match effort to blast radius` and `name what you changed outside the code`, in the global CLAUDE.md. Taken as two bullets out of their 132-line manual, which was refused wholesale. | `archive/claude-kit_spec_v3.md` |
| The `/kit-goal` completion leash | 2026-07-24 | `kit-goal` skill, `kit-goal.js` (the arming CLI), `kit-goal-stop.js`, `kit-goal-lib.js`, and executing-work's completion contract. Dropped their Windows relay clause and compaction-ledger genealogy; comments rewritten where they described mechanisms this kit does not carry. | `archive/kit-goal-port_spec_v1.md` |
| Session-model-as-mode and the Fable spend wall | 2026-07-24 | `executing-work`'s session-model doctrine, the `implementer-fable` tier and agent, and the `Fable Spend:` spec header. Adapted from their fable-metering work with the user's decisions applied. | `archive/orchestration-economics_spec_v1.md` |
| Cross-project memory tier, and advisory decay with use-reinforcement | 2026-08-08 | The two separable ideas out of their semantic memory system, which was refused as an engine (~7.2k lines of production JS plus ~14k of tests, against this kit's ~7.9k total). Reshaped hard: the index line is generated from each record's `description:` rather than hand-maintained, a computed `[body revised]` marker covers what generation cannot, bodies stay directly readable rather than CLI-gated, decay is advisory rather than automatic, and a clean kit-owned root drops their allowlist and its four probes entirely. Embedder, git sync, and the fleet half all stay out. **All seven sections are built** (2026-08-08 to 2026-08-10: `hooks/memory-lib.js`, `hooks/memory.js`, `hooks/memory-index.js`, the `cross-project-memory` skill, two SessionStart blocks, and 14 seeded records under `~/.claude-kit-memory/`), with the effort's close-out still pending. | `plans/cross-project-memory_spec_v1.md`, and candidate 1 of the 2026-08-07 pass below |
| The curated docs lifecycle and the guard hooks | 2026-07-24 | This library's taxonomy and the `curating-docs` skill; `docs-write-guard`, `stop-docs-hygiene`, `pr-docs-guard`, `merged-pr-push-guard`, and `branch-reaper-nudge` hooks; the `branch-hygiene` skill; and the `blind-reviewer` agent. | `archive/docs-lifecycle-and-guards_spec_v1.md` |

## Verdicts

### Pending-queue working session, 2026-08-07 (no new window)

A second run the same day. `origin/main` was still `09c91a4`, so the window was empty and
there was nothing to classify; no pass section is recorded for a zero-commit window, and
neither header moved. **That last clause is not the rule.** This run fell on the same day
at the same sha, so both headers already held the right values and leaving them alone
decided nothing. `kit-adoption-pass` step 6 now carries the empty-window branch, under
which `Watermark:` is the no-op and `Last pass:` still advances; a later zero-commit pass
follows the skill rather than this sentence. What the run did instead was work the pending queue, and four
entries below gained evidence they did not have. Each is marked `verified 2026-08-07 (2nd
run)` in place rather than restated here.

### Pass of 2026-08-07 (`8880eb7..09c91a4`)

138 commits, 129 files, +34k/-9.5k, spanning 2026-07-24 to 2026-08-06.

| # | Capability | Verdict | Reason |
|---|---|---|---|
| 1 | Semantic memory system: `memq.js` (5,337 lines), `memory-index.js` (1,092), `memory-session.js` (772), the `memory-system` skill, `memq-shim`, `memq-grant`, `memory-usage-stamp`, ~14k lines of tests, PowerShell doctor sections, 6 specs | **adapted** | **Adjudicated 2026-08-08 in a design council; the effort is `plans/cross-project-memory_spec_v1.md`.** The engine is not taken. Two separable ideas are: a kit-owned cross-project tier, and advisory decay with use-reinforcement. Both reshaped hard against this kit's evidence rather than ported. What the council changed versus their design: the emitted index line is **generated from each record's `description:`** rather than hand-maintained (their is hand-maintained, and this store shows index currency is a byproduct of creating a record 15/15 and never of revising one 0/8); a computed `[body revised]` marker covers the residue that generation cannot; bodies stay directly `Read`-able rather than CLI-gated (`docs-curator` grants no Bash under any grant, so a CLI-gated body is unreachable to this kit's own curator); decay is advisory rather than automatic; and the root is a clean kit-owned directory, which drops their allowlist, four probes, and drift detection entirely. The embedder, git sync, and the whole fleet half stay out. The classification reasoning that led here follows. **Measured 2026-08-07 (2nd run):** the engine is ~7.2k lines of production JS plus ~14k of tests, against this whole kit's ~7.9k lines total, so adopting it wholesale is a >3.5x codebase increase for one subsystem. Two framing corrections from reading their specs. First, `automemory-off_spec_v1` shows the design **does not require turning native off**: they abandoned harness detection outright (the harness decides auto-memory through private minified code merging five settings tiers, and two review rounds each found another layer), so the kit emits its own index unconditionally and the cost of native being on is a redundant few-hundred-token duplicate index, not a conflict. Second, the embedder is a **later addition, not the core**: `memory-recall-and-reinforcement_spec_v1` settled recall with embeddings explicitly out of scope, using a no-query digest the model itself scores, and their design council rejected lexical scoring in favour of that. The vector layer arrived only in `synced-semantic-memory_spec_v2`. **The size argument against embeddings here:** the native store holds 62 records across all projects (8 in this one), while their own recall digest budgets 200 lines, so this store is at ~31% of a budget built to be generous. Brute-force cosine over 62 records, bought with a several-hundred-MB `onnxruntime-node` install, is a vector index over a shoebox; the digest the model reads with the task in view is both cheaper and the better scorer at this corpus size. The separable ideas worth a brainstorm are the two native genuinely lacks: **decay with use-reinforcement**, and a **cross-project tier** (their journal → project → type → operator → doctrine ladder) for facts that today strand in whichever project store learned them. Two cautions to carry in: they report a real store showing **23 decay candidates against one recorded stamp**, so the usage signal the whole reinforcement model feeds on is weakly produced in practice; and their `~/.claude`-as-git-repo sync, allowlisted and pushed to a private GitHub remote, is the highest-risk piece by a distance (their own words: the allowlist "is the only barrier between 'sync memories' and 'publish credentials'"), is motivated by their four machines, and should not come across for a single Linux workstation. |
| 2 | `readonly-agent-guard`: PreToolUse Bash guard making the read-only agent contract mechanical (~969 lines) | **pending, strong** | Same exposure here, verified 2026-08-07: seven agents that are read-only by intent grant `Bash` (`adversarial-reviewer`, `blind-reviewer`, `council-member`, `design-facilitator`, `pr-reviewer`, `qa-verifier`, `security-reviewer`), so their read-only contract is declarative only. `docs-curator` and the three implementers hold write tools by design and are out of scope. |
| 3 | `hook-canary`: SessionStart known-answer probes over the installed plugin cache's enforcement hooks | **pending, strong** | Answers the live backlog item "Live-fire the docs-write-guard after the next plugin update" and the standing plugin-cache-lag problem, where a repo edit is inert until `/plugin update` and no hook can verify itself in the session that wrote it. |
| 4 | `kit-version-nudge` | **pending, blocked on a prerequisite** | Same family as candidate 3. It warns when a long-lived session is running an older build than the one now installed: it pins the installed build hash at a session's first SessionStart and compares on every later one, so a guard installed mid-session cannot go unnoticed. It never reads the repo. The prerequisite is the catch: it reads a build-stamped `.claude-plugin/build-info.json`, which this kit does not produce (no build script, only `setup.sh` and `setup.ps1`). Adopting it means adopting a build stamp first, so this is not the small win it looks like. |
| 5 | Doctrine rightsizing: a 26% trim of the always-on doctrine against the Claude 5-generation harness baseline, plus `doctrine-refresh.js` | **pending, method only** | Auditing always-on rules against what the current harness now owns is portable and cheap. Their specific cuts are their file, not the user's. `reconcile-claude-md` is the adjacent machinery; whether the audit lands there is the adoption effort's call, not this classification's. |
| 6 | `output-styles/kit.md`: a force-applied output style re-asserting the communication register late in a session, whose register core rides byte-identical with the doctrine under a parity gate | **pending, mechanism only** | The mechanism addresses real register decay deep in a session, and the parity gate is the interesting part. Note its scope: only the register core (their doctrine's communication bullets plus the before-you-send checklist) is held byte-identical, not the style-owned shell. The content (teaching posture, the Insight and Decision block marks) is their voice and fails this kit's lean, anti-dogma line. |
| 7 | `docs/security-model.md` | **pending, shape only** | This kit has a backlog item of that exact title open since 2026-07-24, and the generalized `security-reviewer` reads such a doc first when present. Take the document's shape; the contents are this kit's own to write. |
| 8 | Fleet integration and the external-engine standdown: `KIT_EXTERNAL_ENGINE`, run-scoped memory tiers, the memq grant, the frozen plan-doc machine contract | **rejected** | Upstream-specific. It is a contract with an external engine (Spine's Dispatch) that the user does not run. Revisit only if this kit ever gets spawned by an orchestrator. |
| 9 | `operating-instructions` skill changes | **rejected** | The 2026-06-17 rejection of the full operating manual holds. Rightsizing is the separable part worth reading, and it is tracked as candidate 5. |
| 10 | Backlog-sweep batch: subagent `effort` frontmatter dials on six agents; the reviewer-one-tier-above-the-writer rule; the exit-after-stdout-write truncation fix across six SessionStart/Stop hooks | **pending, split** | Three separable things. The truncation fix may be a latent bug in this kit's shared-lineage hooks and warrants a direct check before anything else here. The effort dials are a cheap capability this kit lacks. The reviewer-tier rule already carries their own adjudication against the Fable spend wall (their `claude-kit_backlog-sweep_spec_v1.md`, section 1: a below-fable session's reviewer override is Fable spend under the existing header semantics, and `none (cost hold)` caps it at the session model); this kit's wall was adapted from their, so start from that reasoning rather than re-deriving it. |

**Removals checked.** Removals only matter where the two kits overlap, so the check is a
set intersection, not a judgment call:
`git diff --diff-filter=D --name-only 8880eb7..origin/main` against this kit's tree.
They deleted 25 files in the window, all of them the `compact-session` skill and its
vendored ~2,280-line engine, `context-tripwire`, and the relay machinery (`relay-ready`,
`relay-refresh`, the AutoHotkey watcher). **The intersection is empty**: this kit carries
none of them, so there is nothing here to reconsider holding.

Not vacuous, though. The intersection is necessary and not sufficient, because a removal
can be signal about a direction this kit is **contemplating** rather than about code it
holds. They abandoned deliberate compaction outright, on zero usage by their own account,
and had already removed the context tripwire and relay machinery in an earlier unwind
that records no usage figure. That is negative signal on the 2026-07-20 kaizen note
about nudging a fresh session at Chapter boundaries, with the zero-usage evidence
attaching to the compaction half only.

**Found on the second sweep.** The first sweep classified off their `docs/` index, which is
organized by effort and therefore describes **new capabilities** well and **changes to
existing files** not at all. A second sweep over added-lines-only diffs of `skills/`,
`agents/`, and `hooks/` found ten more items, all of them small, portable, and invisible
to the first. This is why the skill's ladder carries both steps; the evidence is in the
`kit-adoption-pass` spec (in `plans/` while the effort is open, `archive/` after).

| Capability | Verdict | Reason |
|---|---|---|
| `process.exitCode = 0` replacing `process.exit(0)` after a stdout write | **pending, confirmed defect here** | Not a preference. Forcing the exit can discard a write still in flight on a pipe. Verified 2026-08-07: four hooks have the stdout shape (`session-start`, `stop-docs-hygiene`, `branch-reaper-nudge`, `kit-goal-stop`). `kit-goal-stop` is the serious one, where a truncated write reads as no-block and silently releases the leash. **Re-verified 2026-08-07 (2nd run): the site count is seven, not four.** The three PreToolUse guards (`docs-write-guard`, `pr-docs-guard`, `merged-pr-push-guard`) carry the same shape on the deny path, `process.stderr.write` then `process.exit(2)`; the consequence there is milder but real, since exit 2 still denies while the truncated stderr costs the model the deny *reason*. Their trailing `exit(0)` is a clean no-output path and is harmless. `kit-goal.js` already uses `process.exitCode` throughout and is the in-repo precedent. Backlogged (the backlog entry still says four). |
| `qa-verifier`: sandbox `HOME`/`USERPROFILE` to a temp dir **before** the first probe, and split `UNVERIFIABLE` into `environment` versus `operator-only` | **pending, strong** | The sandbox rule is the exact hazard this effort's own Section 4 hit: `claudeMdSyncOffer` is not repo-gated, so an unsandboxed probe reads the real home. Learned here independently, which is the best argument for taking it. |
| `docs-curator`: sweep by claim rather than by changed file (counts, enumerations, justifications, renamed paths), a required `CLAIMS SWEPT` block even at zero drift, `file:line` on every drift entry, and a ban on writing drift markers into shipped docs | **pending, strong** | Pure prose, drops straight in, and aimed at a failure this kit's curator can have today. |
| `executing-work`: wait-is-not-a-stop, the `WAITING:` stop shape the leash allows without releasing, and capacity explicitly excluded from the blocker set | **pending, strong** | This kit runs the same leash with the same failure mode. Its completion contract already carries wait-is-not-a-stop; the `WAITING:` shape and the capacity exclusion are the new parts. |
| `writing-skills`: close every enumeration with its class | **pending** | A list of instances reads as exhaustive the moment it ships, so an unlisted variant presents itself as licensed. One rule, high leverage on this kit's own authoring. |
| `kaizen`: state the lesson, not the incident; and never write a note into the plugin cache | **pending** | The second half pairs with this kit's existing plugin-cache-lag knowledge. |
| Style-skill path resolution ladder (`CLAUDE_PLUGIN_ROOT`, else the skill's own base directory's grandparent) replacing hardcoded literals in dispatch briefs | **pending** | Aimed squarely at the plugin-cache-lag problem this kit documents. |
| `finishing-work`: bracket the review rounds with `git status --porcelain` captured before and compared after | **pending** | Catches a reviewer mutating the tree. Ten lines of prose, no platform coupling, and it is the general-case check that does not need the guard hook below. |
| Reviewer per-finding `[confidence: high\|medium\|low]` alongside severity, with an explicit rule not to downgrade severity to hedge low confidence | **pending, separable here** | The rating itself is standalone and good. The same commit adds sentences to five of their agents claiming "a kit hook enforces the no-write half mechanically", which is only true alongside `readonly-agent-guard`. **Verified 2026-08-07 (2nd run): this kit's agents carry no such sentence** (`grep 'hook enforc\|enforced by a hook\|kit hook' plugins/claude-kit/agents/` is empty), so the coupling is a hazard in *their prose* rather than an entanglement here. Port the rating without those sentences and nothing is owed to `readonly-agent-guard`. |
| `curating-docs`: a "the header is a machine contract" section with a frozen table of exactly what an external parser reads from a plan doc | **pending, partial** | The table's contents are their engine's contract and do not apply. The idea of freezing and documenting a machine-read header does. **Verified 2026-08-07 (2nd run):** the idea is already in force here, in this file's own "The `Last pass:` header is a machine contract" section, which states the four rules the `session-start.js` staleness nudge depends on. That is convergence rather than adoption, so the verdict stays `pending` pending the user's call: closing it as satisfied is proposed, not taken, because closing removes the re-ask that capability-keyed verdicts exist to preserve. |

### Carried from the pass of 2026-06-17

| Capability | Verdict | Reason |
|---|---|---|
| Four operating-manual nuggets held back for a dedicated curation pass: confirmed-versus-inferred sharpening, finding-is-a-hypothesis, close-with-state, the before-you-send re-read. `archive/claude-kit_spec_v3.md` Chapter 3 adds a fifth, "match my precision" | **pending** | Separable from the wholesale rejection above and judged worth having, but reserved rather than snap-included. Reserved 2026-06-17; nothing has tracked them since, which is the failure this file exists to end. |

## Editing this file

The `kit-adoption-pass` skill owns the procedure; it is the single source for how a pass
runs, and nothing here restates it. Two conventions belong to the file itself:

- **New pass sections go directly under `## Verdicts`, above the previous pass.** The
  ordering is newest-first, so a literal append would put the newest pass at the bottom.
- **A `rejected` entry the new window touched gets re-checked**, since verdicts are keyed
  by capability and a substantial rework can outdate the reason. Update the entry in
  place and re-date it.
