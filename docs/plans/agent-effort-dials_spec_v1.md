# The Kit's Agents Declare No Effort, So Their Strength Is a Machine Setting

Status: In Progress
Commit Model: Branch-and-PR (substituted from Commit-and-Push at execution start: main commits need the user's explicit permission and the arming mandate did not grant it; executing-work's branch check owns the substitution)
Fable Spend: finishing reviews only
Created: 2026-09-19

## Related

- `docs/kit-adoptions.md`, candidate 9 of the 2026-08-26 pass ("Reviewer effort
  compensation"), which this effort adjudicates and partly discharges. The candidate's
  premise is falsified below and its entry is amended in place by Section 4.
- `plans/dispatch-determinacy_spec_v1.md`, whose finding 2 is this defect with one noun
  swapped: omitting the model override does not mean "run at the session model", it means
  "resolve to a configured default where one exists". Omitting effort behaves the same way.
  That plan owns the model half and is untouched here.
- `plans/review-round-loop_spec_v1.md`, which owns the dispatch-and-await seam the
  deferred compensation notch would have to change.
- `plans/fable-spend-absence_spec_v1.md`, which owns what an absent `Fable Spend:` header
  does. The compensation notch would fire on the downgrade paths that header governs, which
  is a second reason to defer it until that plan lands.

## Goal

Every agent definition in the payload declares the reasoning effort its seat needs, so the
strength of the kit's 13 subagents stops being a function of a per-machine `effortLevel`
setting the kit does not ship, cannot read, and does not carry to any other operator's
machine. When this is done, a reviewer dispatched on a fresh install behaves the same way
it behaves here, the two plan-following implementer seats stop paying top effort for work
whose failure a review round already catches, and a test pins the assignment so a
fourteenth agent cannot ship without a considered value.

What this is not: a strengthening of the review gate. On this machine the gates are already
running at the session's `xhigh` and this effort holds them there deliberately rather than
by accident. The product is determinacy, and on the two implementer seats, a small
reduction in spend.

## Approach

### The measured situation

Four facts, all established first-hand on 2026-09-19 against client 2.1.278, and each one
load-bearing for a decision below.

1. **`effort:` is a real agent-definition key.** The installed binary carries the schema:
   `effort: [("low"|"medium"|"high"|"xhigh"|"max") | int].optional().describe("Reasoning
   effort level for this agent. Either a named level or an integer")`, sitting in the same
   object as `memory:`, `permissionMode:` and `observer:`. The SDK's agent-definition key
   list in the same binary reads `["name","description","prompt","tools","disallowedTools",
   "model","effort","permissionMode","mcpServers","hooks","maxTurns","skills",
   "initialPrompt","memory","background","omitClaudeMd","isolation"]`. The published
   subagents reference states the same value set and that plugin-shipped agents honor the
   key.
2. **Absent means inherit the session's effort.** Not a fixed default, and not the model's
   own level.
3. **This machine sets `"effortLevel": "xhigh"`**, in both `~/.claude-work/settings.json`
   and `~/.claude-personal/settings.json`. `~/.claude/settings.json` sets none. So the kit's
   agents run at xhigh under the two profiles the user works in and at the client's own
   default under the third, and nothing in the kit says so or chose it.
4. **`claude plugin validate` cannot catch a wrong effort key.** Run with a positive
   control: it accepted `zzzbogus: nonsense` in an agent's frontmatter exactly as readily as
   it accepted `effort: high`, both passing with only the pre-existing "no version
   specified" warning, because it validates the manifest and not the agent files. This is
   why Section 3 exists: the kit's only shipped frontmatter gate has no discriminating power
   here, which `docs/architecture.md:9` already says of agent definitions in general.

### What follows, and what does not

The ledger's own reasoning for candidate 9 says the kit "falls back to the session model at
whatever effort the agent definition happens to pin, which silently weakens the strongest
gate in the system". Fact 3 falsifies both halves on this machine: no definition pins
anything, and the gates inherit the strongest effort the client offers rather than a weak
one. The seats actually mispriced are the opposite ones. `implementer-sonnet` and
`qa-verifier` are pinned to a cheap model and inherit xhigh, which spends top-tier reasoning
on plan-following work whose failure a build, a test run and a review round already catch
loudly.

That inversion does not retire the candidate. It re-aims it: the defect is that agent
strength is undetermined, not that it is low. An operator installing this plugin with no
`effortLevel` set gets a different kit than this one, and nothing anywhere records which.

### The assignment rule

One rule decides every value, stated so a fourteenth agent can be placed without re-arguing:

> **Effort follows the failure mode, not the model.** A seat whose failure is silent runs at
> the gate level. A seat whose failure is loud runs lower.

A gate fails silently: the finding it never raises leaves no trace, and the run reports
green either way. A plan-following seat fails loudly, into a review round and a build that
already exist. The second half of that reasoning is taken from the upstream kit, which
states it as the ground for making compensation a reviewer's instrument and never an
implementer's, and adds that surplus effort runs in opposite directions on the two, buying
recall on an open-ended search and buying tangents on a settled plan. The first half is
this kit's own framing at `executing-work:171` ("Review and QA dispatches never downgrade,
judgment is their product"), which already puts QA on the gate side of the line.

Applied, with the gate level set to `xhigh` because that is what these seats measurably run
at on this machine today, so holding them there changes no observed behavior and only makes
it deliberate:

| Agent | Effort | Why |
|---|---|---|
| `adversarial-reviewer` | `xhigh` | Gate. |
| `blind-reviewer` | `xhigh` | Gate. |
| `blind-reader` | `xhigh` | Gate. |
| `prose-reviewer` | `xhigh` | Gate. |
| `security-reviewer` | `xhigh` | Gate. |
| `pr-reviewer` | `xhigh` | Gate, and its findings reach a real teammate. |
| `qa-verifier` | `xhigh` | Gate. Model-pinned `sonnet`, which Section 1 measures for a silent downgrade. |
| `council-member` | `xhigh` | Gate. A shallow position steers a design with nothing downstream re-asking. |
| `design-facilitator` | `xhigh` | Gate. It owns the convergence verdict. |
| `docs-curator` | `xhigh` | Gate. Drift it fails to name is drift nobody sees. |
| `implementer-fable` | `xhigh` | Plan-following, but its sections are the subtle and cross-cutting correctness a review round is least reliable at catching, so the loud-failure premise does not hold for it. |
| `implementer-opus` | `high` | Plan-following with mild ambiguity inside a clear design. |
| `implementer-sonnet` | `medium` | Plan-following, clear contract, sibling pattern to mimic, failure cheaply detectable. |

Eleven of thirteen land on the same value, and the spec says so rather than dressing the
table up as fine-grained tuning. The product is that the eleven are now pinned rather than
inherited; the differentiation is the two implementer seats, and that is the one behavior
change this effort makes on this machine.

**The two implementer drops carry a borrowed rationale and no local evidence.** Nothing in
this repo has measured a delegated implementation improving or degrading with effort. They
are recorded here as the reversible half: if a delegated section starts failing review for
reasons that read as thin reasoning rather than a thin brief, raising these two values back
is a one-line edit per file, and the Chapter is where that observation belongs.

### What is deferred, and why

The candidate's compensation notch, where a reviewer climbs one effort level to buy back a
model tier it lost, is **not** in this spec. Three reasons, in order of weight:

1. **It needs a different transport.** The Agent tool takes a model override and has no
   effort parameter, confirmed against this session's own tool schema and against the
   published SDK type. Raising effort above an agent's frontmatter value at dispatch time
   therefore has to go through `Workflow`'s `agent()`, whose inline agent-definition key
   list does include `effort`. A `Workflow` round returns a task id and completes
   asynchronously, so adopting it reworks how a review round is dispatched and awaited.
2. **That seam is owned.** `plans/review-round-loop_spec_v1.md` is open against exactly the
   space between dispatching a round and committing.
3. **Its trigger is rare and its governing header is unsettled.** The notch would fire on
   the kit's Fable-downgrade paths, whose semantics `plans/fable-spend-absence_spec_v1.md`
   is still deciding.

Section 4 files it as a backlog item carrying this evidence, so the next session does not
re-derive the transport finding.

## Sections of Work

### 1. Measure what effort actually resolves to (COMPLETE 2026-09-19)

Before any value is assigned, establish by measurement what the client does with the key,
because two of the assignments above rest on assumptions a probe settles cheaply.

The instrument is a PreToolUse hook plus a scratch agent, both **project-local** and neither
in the payload. Project-local definitions load immediately, while the payload's agents and
hooks load from the installed plugin cache and stay inert until `/plugin update`
(`docs/architecture.md:13`), so a payload-based probe would measure the previous build. The
hook's job is to read the `effort` field out of its own stdin payload and append it to a
scratch file: the client's hook-input schema documents `effort: {level}` as "Reasoning
effort applied to the current turn ... Present for hooks that fire within a tool-use context
(PreToolUse, PostToolUse, Stop, SubagentStop, etc.) on a model that supports the effort
parameter", reported after any silent downgrade for the selected model, which is precisely
the reading this section needs.

**Two dispatch routes are available and the section picks whichever works, recording which.**
An agent definition written mid-session may not be visible to the Agent tool, which resolves
its agent types from what was loaded at session start; where it is not, the route is a
top-level `claude -p --agent <name>` run from Bash, which the client supports alongside an
`--effort` flag that doubles as a control. The arm harness already uses that second route
for its own reasons (`docs/arm-harness.md`), and its warning applies here too: a top-level
run receives SessionStart hook injection that a subagent does not. That difference does not
bear on this measurement, which reads one field out of a hook payload, but the Chapter
states which route produced the numbers.

Measure four conditions, each one dispatch of a scratch agent instructed to run one trivial
Bash command:

| # | Scratch agent frontmatter | Question it answers |
|---|---|---|
| a | no `effort:`, no `model:` | Confirms inheritance, and what this session inherits |
| b | `effort: xhigh`, no `model:` | Does the key take effect at all |
| c | `effort: xhigh`, `model: sonnet` | Does a cheap model silently downgrade xhigh |
| d | `effort: medium`, no `model:` | Does the key lower as well as raise |

Acceptance criteria:

- The Chapter carries a four-row table of the reported level for a, b, c and d, quoted from
  the probe's captured output rather than described.
- Condition (c)'s result is stated explicitly as either "xhigh survives on sonnet" or "xhigh
  silently resolves to `<level>` on sonnet", because Section 2's value for `qa-verifier` and
  `implementer-sonnet` depends on it.
- The probe hook, the scratch agent and the capture file are removed at section close, and
  `git status --porcelain` shows nothing left behind from them. `.claude/settings.local.json`
  is covered by a global ignore (`~/.config/git/ignore:1`, verified 2026-09-19) and
  `.claude/` holds nothing tracked, but an agent file under `.claude/agents/` is not covered
  by that rule and would show as untracked, which is the one the removal criterion is really
  about.
- The Chapter names anything changed outside this repository, per the global rule on saying
  what you altered to get the task done, and states that it was reverted.
- **The branch where the payload carries no `effort` field** is recorded rather than worked
  around: if the hook payload does not include it, say so in the Chapter, note that the
  dials then ship on the published reference and the binary schema alone with no local
  measurement, and proceed to Section 2 with the table's values unchanged.

Execution mode: main. The section dispatches subagents, edits live settings outside the
repo's tracked tree, and reads its result out of session-local state, which is not
briefable.

Tests: none. The deliverable is a measurement, and the probe is deleted at section close.

### 2. Put the dials on all thirteen agents

Add one `effort:` line to each of the thirteen agent definitions under
`plugins/claude-kit/agents/`, with the value from the Approach's table, amended only where
Section 1 measured a silent downgrade.

Acceptance criteria:

- All thirteen files carry an `effort:` key in frontmatter, each value drawn from
  `low | medium | high | xhigh | max`.
- The values match the Approach's table, except where Section 1's measurement forced a
  substitution, and every substitution is named in the Chapter with the measured reason.
- No other frontmatter key on any of the thirteen is added, removed or reordered, and no
  agent's body prose changes. The staged diff is thirteen single-line insertions.
- The key is placed on its own line within the existing frontmatter block, after
  `description:` and before `tools:` where both exist, so the thirteen files stay uniform.
- `claude plugin validate ./plugins/claude-kit` passes. Recorded as the shipped gate rather
  than as evidence, per fact 4 above.

Execution mode: delegate-mechanical. Thirteen single-line insertions against a table the
spec states in full, with a sibling pattern in every file and the staged diff catching any
error.

Tests: covered by Section 3, which is where the durable pin belongs.

### 3. Pin the assignment

Add `test/agent-effort.test.js`, joining the suite the README's gate runs
(`node --test test/*.test.js tools/*.test.js` from the repo root, with `< /dev/null`).

`docs/architecture.md:9` records that a new agent charter "fires no hook at runtime and is
pinned by nothing in `test/`", and this closes one slice of that: a fourteenth agent cannot
ship without a considered effort value, because the test enumerates the directory rather
than a hard-coded list of thirteen.

Acceptance criteria:

- The test fails when any agent definition under `plugins/claude-kit/agents/` omits
  `effort:`, and the failure message names the file.
- The test fails when a value is outside the five named levels.
- The test fails when a value diverges from the table the test itself carries, so changing
  an agent's effort is a deliberate two-file edit rather than a drift.
- The test discovers agent files by globbing the directory, so adding a fourteenth agent
  without an effort value fails the suite rather than passing unnoticed.
- Each of the four failures above is **watched failing before the fix**, and the Chapter
  records what was broken to produce each one.
- The full gate passes.

Execution mode: delegate-capable. It is a new test file with four distinct failure modes to
construct, and the glob-rather-than-list requirement is the kind of detail a mechanical
brief loses.

Tests: this section is the test.

### 4. Record it

Four documents, all under `docs/` or the root `README.md`, so this section runs in the main
thread per `executing-work`'s rule that a section writing under `docs/` is never delegated.

Acceptance criteria:

- **`docs/architecture.md`**: the sentence describing agents as "markdown definitions
  dispatched as subagents with a declared tool grant" also names the declared effort, and
  the inheritance fact (absent means inherit the session's effort, which is set by a user
  setting outside the kit) appears once, where a reader meets the agent inventory.
- **`README.md`**: the model-tiering material in THE WORKFLOW names effort alongside model,
  in one clause, without restating the table.
- **`docs/kit-adoptions.md`**: candidate 9 of the 2026-08-26 pass is amended in place per
  that file's own convention, with the amendment dated 2026-09-19 and in bold, the prior
  reasoning left standing rather than tidied, and **the verdict line changed** to record
  that the dials shipped and the compensation notch did not. The amendment states the four
  measured facts, the falsified premise, and what was deferred with its reason. The
  `Last pass:` header is not touched: this is not a pass.
- **`docs/backlog.md`**: a new active item for the compensation notch, titled as a finding
  rather than an imperative, dated 2026-09-19, carrying the transport evidence (no effort
  parameter on the Agent tool, `effort` present in `Workflow`'s inline agent-definition key
  list) and a closure clause naming both exits, which are building the notch and recording a
  decision that reviewers never compensate.
- **`docs/README.md`**: this plan is registered with a one-line hook, and the entry flips to
  its closing state when `curating-docs` runs in the close-out.
- Every measured figure in all five documents is traceable to this spec's Approach or a
  Chapter, and nothing states a client version other than the one measured (2.1.278).

Audience: one persona, an operator who works in this repository daily and holds it, reading
to know what the kit's agents now do and what an install on a machine with a different
`effortLevel` will do.
Must answer: what decides each agent's effort now; what changes if the operator's own
`effortLevel` changes; what the kit does when a model does not support the level an agent
declares; why the compensation notch is absent and what would close it.
Fact base: `plugins/claude-kit/agents/*.md`, `test/agent-effort.test.js`,
`docs/architecture.md`, this spec's Approach section and Section 1's measured table.
Style authority: none. This kit has no writing-voice skill and has decided against one, so
the style lens does not run and the report says it was unavailable.
Disclosure: the persona is the operator, so nothing is withheld. No absolute home paths in
shipped prose, since the documents travel with the plugin.

Execution mode: main.

Tests: none directly. The claims are checked by the document battery this section's
`Audience:` line triggers.

## Out of Scope

- **The compensation notch**, and with it any `Workflow`-route dispatch contract. Deferred
  to the backlog with its evidence, for the three reasons in the Approach.
- **Per-section reviewer model tiering** (the upstream's "every per-section reviewer runs
  one tier up from the section's writer tier"). It is a separate pending candidate, number
  10 of the 2026-08-07 pass, and the upstream's effort table is keyed on it. Nothing here
  imports it.
- **`maxEffortLevel`**, which caps every effort setting including an agent's frontmatter.
  Not set on this machine, so it is a documented trap rather than a thing to build against.
- **Effort for the main session.** The kit deliberately never ties the main thread to a
  model name, and the same restraint applies to effort: the session's level is the
  operator's setting, not the kit's.
- **The other seventeen pending adoption candidates.** This effort adjudicates candidate 9
  and touches no other ledger entry.

## Open Questions

- ~~Whether `xhigh` survives on a `sonnet`-pinned agent.~~ **Answered 2026-09-19 by Section 1's
  probe: it survives, and so does `max`. No silent downgrade at any level this effort uses.
  The table's values stand unamended.**
- Whether the two implementer drops are right. No local evidence either way, and the
  rationale is borrowed. Owner: the user, on the first delegated section that fails review
  for thin reasoning rather than a thin brief.
- Whether the published reference's plugin-agent field list restricts `xhigh` and `max` to
  user-scope agents. One source suggested a narrower list for plugin agents and a direct
  re-read did not confirm it. **Settled for project-scope agents 2026-09-19: both levels took
  effect.** The residue is the payload path specifically, since Section 1's probe agents were
  project-scope, and it is confirmed by the `/plugin update` that follows this effort rather
  than by anything inside it. Owner: the user, at the next plugin update.

## Chapters

### Chapter 1 - 2026-09-19
Completed: Section 1, Measure what effort actually resolves to
Implemented By: main session
Metrics: 0 review rounds at time of writing (the section's own review runs concurrently with Section 2); 0 NEEDS_CONTEXT; 0 escalations; advisor on (Opus), 2 consultations, both answered
Decisions / Surprises: **The route decides whether the key works at all, which the spec did not anticipate and which nearly produced a false negative.** All four spec'd conditions were run first through `claude -p --agent <name>`, and every one of them reported the session's level regardless of what its frontmatter declared, including the variant declaring `effort: medium` against a session at `xhigh`. Read alone that says the key is inert. A control settled it instead: `--effort medium` and `--effort low` on the same route moved the reported level to `medium` and `low`, so the hook reading is live and responsive and it is the frontmatter that route ignores. **A top-level session started with `--agent` does not take that agent's declared effort.** Re-run as real subagents, dispatched from a nested session, the same definitions behave exactly as documented. The kit dispatches subagents and never uses the `--agent` route, so the finding costs the kit nothing and was worth an hour to not get backwards.

Measured, client 2.1.278, quoted from the probe's capture (`effort.level` out of a PreToolUse payload):

| Condition | Frontmatter | Route | Session effort | Reported |
|---|---|---|---|---|
| a | none | `--agent` | xhigh (settings) | `xhigh` |
| b | `effort: xhigh` | `--agent` | xhigh | `xhigh` |
| c | `effort: xhigh`, `model: sonnet` | `--agent` | xhigh | `xhigh` |
| d | `effort: medium` | `--agent` | xhigh | `xhigh` |
| control | none | `--agent`, `--effort medium` | medium | `medium` |
| control | none | plain `-p`, `--effort low` | low | `low` |
| d | `effort: medium` | **subagent** | xhigh | **`medium`** |
| b | `effort: xhigh` | **subagent** | xhigh | `xhigh` |
| b | `effort: xhigh` | **subagent** | low | **`xhigh`** |
| c | `effort: xhigh`, `model: sonnet` | **subagent** | low | **`xhigh`** |
| e | `effort: max`, `model: sonnet` | **subagent** | low | **`max`** |
| f | `effort: max` | **subagent** | low | **`max`** |

What each row buys. The subagent `d` row is the key lowering below the session. The subagent `b` and `c` rows at session `low` are it raising above the session, and `c` is the answer to the section's named question: **`xhigh` survives on a `sonnet`-pinned agent, with no silent downgrade**, and `e` shows `max` survives there too. So the Approach table's provisional values for `qa-verifier` and `implementer-sonnet` stand unamended, and the third Open Question (whether a narrower level set applies to some agents) is answered for every level this effort uses.

Two conditions beyond the spec's four were added while the instrument was standing, `e` and `f`, both pinning `max`. Cheap, same question, and they are what make the no-downgrade claim a ceiling result rather than a single point.

Outside-the-repo changes, all reverted: `.claude/settings.local.json` gained a temporary `PreToolUse` hook and one `Bash(echo *)` allow entry, and was restored byte-identical from a backup (`diff` clean). Seven nested `claude -p` sessions were run. Seven probe agent definitions under `.claude/agents/` and the probe hook and capture file were deleted; `.claude/agents/` no longer exists and `git status --porcelain` shows nothing from the probe.
Review Findings: pending; the section's adversarial review is dispatched alongside Section 2's implementer.
Next: Section 2, Put the dials on all thirteen agents
Commit Model: Branch-and-PR (substituted, see header)
