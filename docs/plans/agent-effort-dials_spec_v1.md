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
running at the session's `xhigh` and this effort holds them there deliberately rather than by
accident. The product is determinacy, and on the two plan-following implementer seats, a small
reduction in spend. **Determinacy cuts both ways and the documents say so:** the field is an
absolute override rather than a floor, so an operator who sets the session above `xhigh` now
gets less on the gate seats than they inherited before.

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

> **Effort follows the failure mode, not the model.** A seat whose failure is silent runs one
> rung above the model's own default. A seat whose failure is loud runs at that default, and
> never below it.

A gate fails silently: the finding it never raises leaves no trace, and the run reports
green either way. A plan-following seat fails loudly, into a review round and a build that
already exist. The second half of that reasoning is taken from the upstream kit, which
states it as the ground for making compensation a reviewer's instrument and never an
implementer's, and adds that surplus effort runs in opposite directions on the two, buying
recall on an open-ended search and buying tangents on a settled plan. The first half is
this kit's own framing at `executing-work:171` ("Review and QA dispatches never downgrade - judgment is their product"), which already puts QA on the gate side of the line.

**The floor clause was earned by review rather than designed in**, and the measurement behind
it is worth stating because it is not obvious: the model's default effort is `high` across the
current fleet, evidenced in the 2.1.278 bundle by 27 model entries carrying
`default_effort:"high"` against 4 at `"xhigh"`, plus a `default_effort??"high"` fallback. The
first draft of this table put the two lower implementer seats at `high` and `medium`, read as
a gentle ladder. It was not one. `medium` sits a rung *below* sonnet's own default, so it
would have reduced every mechanical dispatch on every machine including a default install, in
service of a rationale this spec had already admitted was borrowed and untested. An untested
claim may justify leaving a seat where the model puts it. It may not justify moving one down.

The gate level is `xhigh`, one rung above that default, which is also what these seats
measurably run at on this machine today, so holding them there changes nothing observable here
and makes it deliberate everywhere:

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
| `implementer-opus` | `high` | Plan-following with mild ambiguity inside a clear design. The model default, pinned rather than inherited. |
| `implementer-sonnet` | `high` | Plan-following, clear contract, sibling pattern to mimic, failure cheaply detectable. The model default, pinned rather than inherited. |

Eleven of thirteen land on the same value, and the spec says so rather than dressing the
table up as fine-grained tuning. The product is that all thirteen are pinned rather than
inherited; the differentiation is the two plan-following implementer seats sitting one rung
lower, at the model's own default.

**On this machine those two seats do drop one rung**, from the inherited `xhigh` to `high`,
and that is the only behavior change this effort makes here. The rationale is borrowed from
the upstream kit and nothing in this repo has measured a delegated implementation improving or
degrading with effort, so it is recorded as the reversible half: if a delegated section starts
failing review for reasons that read as thin reasoning rather than a thin brief, raising these
two back to `xhigh` is a one-line edit per file, and the Chapter is where that observation
belongs. What the floor clause buys is that the drop stops at the model's default instead of
going through it, which bounds how wrong an untested rationale can be.

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
`--effort` flag that doubles as a control. **The arm harness deliberately refused that
second route**, and its reason applies here: `docs/arm-harness.md:63` heads its rationale
"Why a rep is a subagent and not `claude -p --agent plain-worker`", because a top-level run
receives SessionStart hook injection that a subagent does not, and `tools/arm-harness.js:116`
prints a nested-session dispatch with no `--agent` flag at all. So the harness is a warning
about this route rather than a precedent for it. The Chapter states which route produced the
numbers.

A pre-existing contradiction in that doc is what made this easy to get backwards, and it is
recorded here rather than fixed, being outside this effort: `docs/arm-harness.md:18` says
"The `--agent plain-worker` in the printed command is load-bearing", which the command
`dispatchCommand` actually emits does not contain. Section 4 files it.

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
- **`docs/backlog.md`** also gains two smaller items, both dated 2026-09-19. First, that the
  kit's Fable ratchet threshold was calibrated when every dispatch inherited the session's
  effort, and standing pins raise per-turn burn against an unchanged threshold; it closes by
  re-reading the threshold against the new floor or by recording that the delta is inside its
  margin. Second, a contradiction this effort tripped over and
  did not fix: `docs/arm-harness.md:18` calls `--agent plain-worker` "load-bearing in the
  printed command" while the command `dispatchCommand` emits at `tools/arm-harness.js:116`
  contains no `--agent` flag, so a living doc describes a command the tool does not produce.
  It closes by correcting the doc or by a recorded decision that the sentence describes an
  intent the tool abandoned.
- **`docs/README.md`**: this plan is registered with a one-line hook, and the entry flips to
  its closing state when `curating-docs` runs in the close-out.
- **The five stale citations Section 2's insertion created are repaired.** Adding one line to
  each agent file shifted every body line by one, and five live `file:line` citations into
  agent bodies now land one line short: `test/denaming.test.js:48`,
  `docs/plans/prose-claim-review_spec_v1.md:131`, and
  `docs/plans/report-file-protocol_spec_v1.md:57`, `:62`, `:63` and `:111`. Each is re-read at
  its new line and corrected. **`docs/archive/` is deliberately not swept**: those are dated
  snapshots and editing them would falsify the record, which is the same reason the archive is
  excluded from the de-naming invariant.
- **The `xhigh` choice is stated in both directions.** The Goal says holding the gates at
  `xhigh` "changes no observed behavior", and that is true of this machine only. `max` sits
  above `xhigh`, and Chapter 1's row `f` proves `max` takes effect on a subagent, so on an
  operator machine set to `"effortLevel": "max"` these ten gate seats now run one notch
  **below** what they inherited before. The documents say so rather than letting the
  determinacy framing obscure it.
- Every measured figure in all five documents is traceable to this spec's Approach or a
  Chapter, and nothing states a client version other than the one measured (2.1.278).

Audience: one persona, an operator who works in this repository daily and holds it, reading
to know what the kit's agents now do and what an install on a machine with a different
`effortLevel` will do.
Must answer: what decides each agent's effort now; what changes if the operator's own
`effortLevel` changes, **in both directions, including that a machine set above `xhigh` now
gets less on the gate seats than it did**; what the kit does when a model does not support the
level an agent declares; why the compensation notch is absent and what would close it.
Fact base: `plugins/claude-kit/agents/*.md`, `test/agent-effort.test.js`,
`docs/architecture.md`, this spec's Approach section and Section 1's measured table.
Style authority: none. This kit has no writing-voice skill and has decided against one, so
the style lens does not run and the report says it was unavailable.
Disclosure: the persona is the operator, so nothing is withheld. No absolute home paths in
shipped prose, since the documents travel with the plugin.

Execution mode: main.

Tests: none directly. The claims are checked by the document battery this section's
`Audience:` line triggers.

## Standing Brief Amendments

Every later dispatch in this effort carries these, per `executing-work`'s recurrence rule.
Added 2026-09-19 after Section 1's review found two of them in one round.

- **Open the file before you cite it.** Two claims in this spec about other files in this
  repository were wrong, and both were written from recollection of a doc rather than from the
  file at the cited line: that the arm harness uses the `claude -p --agent` route (it records
  rejecting it), and a quotation of `executing-work:171` that changed the punctuation inside
  quotation marks. Any load-bearing claim about another file is verified by opening that file
  at that line, and the citation carries the line number so the next reader can do the same.
- **A declared key is not a measured one.** Section 1's own headline finding is that a
  frontmatter key can be silently ignored depending on how the agent is started. So nothing in
  this effort concludes anything about a `model:` or `effort:` value from the fact that a
  definition declared it; the value is confirmed from an independent reading (the resolved
  level via `$CLAUDE_EFFORT` or the hook payload, the model via the session's `modelUsage`).

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
  probe: `xhigh` survives on a `sonnet`-pinned agent, and so do `max` and `medium`. The pin
  itself is confirmed rather than assumed, by the dispatching session's `modelUsage` recording
  `claude-sonnet-5` alongside its own Opus. No silent downgrade was observed at any level this
  effort ships. The table's values stand unamended.**
- Whether the two implementer seats belong at the model default rather than at the gate level.
  No local evidence either way, and the rationale is borrowed; the floor clause bounds the
  downside but does not test the claim. Owner: the user, on the first delegated section that
  fails review for thin reasoning rather than a thin brief.
- ~~Whether the published reference's plugin-agent field list restricts `xhigh` and `max` to
  user-scope agents, and whether the plugin load path honors the key at all.~~ **Closed
  2026-09-19, measured on the plugin path itself rather than inferred from the project-scope
  probe.** A throwaway plugin (a `.claude-plugin/plugin.json` plus one agent declaring
  `effort: medium`) loaded with `--plugin-dir` produced a subagent reporting
  `CLAUDE_EFFORT=medium` under a parent session at `xhigh`. So a plugin-shipped definition
  honors the key, which is the path this kit actually ships on. Reached independently by
  Section 2's blind reviewer and then re-run here.

## Chapters

### Chapter 1 - 2026-09-19
Completed: Section 1, Measure what effort actually resolves to
Implemented By: main session
Metrics: 2 review rounds (round 1 returned CHANGES_REQUIRED with 5 Major and 8 Minor; round 2 below); 0 NEEDS_CONTEXT; 0 escalations; advisor on (Opus), 2 consultations, both answered
Decisions / Surprises: **The route decides whether the key works at all, which the spec did not anticipate and which nearly produced a false negative.** All four spec'd conditions were run first through `claude -p --agent <name>`, and every one reported the session's level regardless of what its frontmatter declared, including the variant declaring `effort: medium` against a session at `xhigh`. Read alone that says the key is inert. A control settled it instead: `--effort medium` on the same route, and `--effort low` on a plain `-p` run, moved the reported level to `medium` and `low`, so the reading is live and responsive and it is the frontmatter that route ignores. Stated at the width of the evidence, which round 1's review was right to insist on: **frontmatter effort had no effect on the `--agent` route, and whether the definition loaded at all on that route was never confirmed.** Re-run as real subagents, the definitions behave exactly as documented. The kit dispatches subagents and never uses the `--agent` route, so the finding costs the kit nothing.

**The section was reviewed twice and the second probe round exists because of the first review.** Round 1 found that the deliverable had no subagent-route row for the inheritance condition, and that the two `model: sonnet` rows concluded something about sonnet from agents that merely *declared* sonnet, which is the section's own headline failure mode used as evidence about itself. Both were right. Round 2 re-probed with a cheaper instrument the review itself named: the client exposes the resolved level to Bash as `$CLAUDE_EFFORT`, so each agent reports its own effort with no hook needed, and the hook was kept only to capture the transcript path.

Measured, client 2.1.278. Round 2 rows carry two independent readings that agree, the PreToolUse payload's `effort.level` and the agent's own `$CLAUDE_EFFORT`:

| # | Frontmatter | Route | Session effort | Reported | Round |
|---|---|---|---|---|---|
| a | none | `--agent` | xhigh (settings) | `xhigh` | 1 |
| b | `effort: xhigh` | `--agent` | xhigh | `xhigh` | 1 |
| c | `effort: xhigh`, `model: sonnet` | `--agent` | xhigh | `xhigh` | 1 |
| d | `effort: medium` | `--agent` | xhigh | `xhigh` | 1 |
| control | none | `--agent`, `--effort medium` | medium | `medium` | 1 |
| control | none | plain `-p`, `--effort low` | low | `low` | 1 |
| d | `effort: medium` | **subagent** | xhigh | **`medium`** | 1 |
| b | `effort: xhigh` | **subagent** | xhigh | `xhigh` | 1 |
| b | `effort: xhigh` | **subagent** | low | **`xhigh`** | 1 |
| c | `effort: xhigh`, `model: sonnet` | **subagent** | low | **`xhigh`** | 1 |
| e | `effort: max`, `model: sonnet` | **subagent** | low | **`max`** | 1 |
| f | `effort: max` | **subagent** | low | **`max`** | 1 |
| control | (the dispatching parent itself) | plain `-p`, `--effort low` | low | **`low`** | 2 |
| a | none | **subagent** | low | **`low`** | 2 |
| c | `effort: xhigh`, `model: sonnet` | **subagent** | low | **`xhigh`** | 2 |
| g | `effort: medium`, `model: sonnet` | **subagent** | low | **`medium`** | 2 |

What each row buys. Round 2's parent control is the in-route proof that the dispatching session really sat at `low`, so every "raises above the session" row below it is a comparison against a measured level rather than against a flag that was passed. Round 2's `a` row is inheritance measured on the route the kit actually uses: no key, and the subagent took the parent's `low`. The `d` row is the key lowering below a session at `xhigh`; the `b`, `c` and `g` rows are it raising above a session at `low`. Row `g` is `implementer-sonnet`'s exact shipped combination, which round 1 never ran.

**The `model: sonnet` pin is confirmed rather than assumed**, which is what makes the sonnet rows evidence. The round-2 dispatching session's transcript records `modelUsage` across two models, `claude-opus-5[1m]` and `claude-sonnet-5`, and the only sonnet-pinned dispatches in that session were the two probes that declared it. So `xhigh` and `medium` both survived on an agent genuinely running sonnet, with no silent downgrade at any level this effort ships.

Conditions beyond the spec's four were added while each instrument stood: `e` and `f` in round 1 (both pinning `max`, which is what makes the no-downgrade result a ceiling rather than a point), and `g` in round 2. Cheap, same question.

**The capture is archived rather than deleted**, at `docs/archive/agent-effort-dials_s1-probe/capture.md`. The section's original acceptance criterion said to delete it, and round 1's review was right that this left twelve numbers with no on-disk corroboration, which is exactly what made its own two Major findings unrecoverable instead of re-checkable. The criterion was wrong and the record is the thing worth keeping.

**Process deviation, recorded rather than smoothed over.** Section 1 was committed at `6e07421` with `Review Findings: pending`, before its review returned. `executing-work`'s section loop binds its seven steps in sequence and its concurrency allowance covers starting a *later* section inside a review window, not closing the earlier one. Round 1 flagged it and the flag is correct. The cost was real rather than theoretical: Section 2's implementer was dispatched against a sonnet premise that round 1 then put in doubt, and only round 2 rescued it. What a later session should take from this is that the review window is for starting disjoint work, never for closing the section under review.

Outside-the-repo changes, all reverted. `.claude/settings.local.json` gained a temporary `PreToolUse` hook and one `Bash(echo *)` allow entry in each round, and was restored byte-identical from a backup after each (`diff` clean both times). Eleven `claude -p` invocations in all: round 1 ran six on the `--agent` route (four variants plus two controls) and two nested dispatching sessions covering six subagent runs, and round 2 ran one nested dispatching session covering three subagent runs. Ten probe agent definitions were written under `.claude/agents/` across the two rounds (seven in round 1, three in round 2) and all were deleted; `.claude/agents/` no longer exists, and `git status --porcelain` shows nothing from either probe.
Review Findings: Round 1, adversarial, CHANGES_REQUIRED. Five Major, four accepted and one rejected. Accepted and fixed: the missing subagent-route inheritance row and the missing in-route parent control (round 2 measures both); the unconfirmed `model: sonnet` pin (round 2 confirms it by `modelUsage`); the false claim that the arm harness uses the `--agent` route, when `docs/arm-harness.md:63` records it rejecting that route and `tools/arm-harness.js:116` prints no such flag; and Open Question 3 having no closing criterion, now given one in Section 4. Accepted: committing with findings pending, recorded above. **Rejected:** that the raise-above-session rows had no in-route control, on the ground that the `--effort low` control sat on the invalidated `--agent` route. It did not; that control was a plain `-p` run with no `--agent`, the same route as the dispatching session. Round 2 measures the parent directly anyway, so the gap the finding pointed at is closed even though its stated reason was wrong. Minors: fixed the overbroad "no silent downgrade at any level", the unsupported "a top-level `--agent` session does not take the declared effort" (softened to what was observed), the missing docs-only justification (below), the unreconciled run counts, a `docs/README.md` blank line splitting the plan list, and a misquotation of `executing-work:171` inside quotation marks. Noted and not acted on: that the three sibling `Related` back-references were outside the section's deliverable, which is rejected as a finding because `brainstorming` step 7 mandates that cross-referencing through `curating-docs`' create path.
Docs-only: this section's entire changeset is under `docs/`, so it took the adversarial review without a blind pair, per the docs-only rule. Its deliverable is a record rather than a document for a named reader, so the document battery does not apply either.
Next: Section 2, Put the dials on all thirteen agents
Commit Model: Branch-and-PR (substituted, see header)

### Chapter 2 - 2026-09-19
Completed: Section 2, Put the dials on all thirteen agents
Implemented By: implementer-sonnet (delegate-mechanical), returned DONE_WITH_CONCERNS; one value changed afterwards by the main session on review
Metrics: 1 review round (adversarial APPROVED_WITH_CONCERNS, 2 Minor; blind APPROVED_WITH_CONCERNS, 1 Major and 5 Minor); 0 NEEDS_CONTEXT; 0 escalations; advisor on (Opus)
Decisions / Surprises: **The blind reviewer changed a value, and it found the thing the sighted pair could not.** Reviewing the diff with no intent story, it went and measured what the client's own per-model default effort is, and reported `default_effort:"high"` across the current fleet. Re-verified here in the 2.1.278 bundle: 27 model entries carry `default_effort:"high"` against 4 at `"xhigh"`, with a `default_effort??"high"` fallback. That reframes the table. The draft's `implementer-sonnet: medium` was not a gentle rung on a ladder, it sat one rung **below** the model's own default, so it would have reduced every mechanical dispatch on every machine including a default install. The rationale for lowering it was borrowed from the upstream kit and this spec had already recorded that no local evidence supports it. An untested claim can justify leaving a seat where the model puts it; it cannot justify moving one down. `implementer-sonnet` is now `high`, and the assignment rule gained a floor clause: a plan-following seat runs at the model default **and never below it**.

The sighted reviewer read the same diff against the spec and correctly found it compliant, because it *was* compliant: the defect was in the spec's table, not in the implementation of it. That is the pair working as designed rather than one of them failing.

**The blind reviewer also closed an Open Question by building a throwaway plugin**, loading it with `--plugin-dir` and watching a plugin-scope agent honor `effort: medium` under a parent at `xhigh`. Re-run here before acting on it, per this plan's own Standing Brief Amendment that a declared key is not a measured one: same result. Open Question 3 is closed, and it closed on the payload path rather than by generalizing from a project-scope probe.

Three more measured facts came out of the round and are recorded because a later session will want them. An **invalid level is silently ignored**: an agent declaring `effort: ultrahigh` loads without error, dispatches without error, and runs at the inherited effort. That is Section 3's whole justification, promoted from "the shipped gate has no discriminating power" to a demonstrated silent failure. An **unsupported level falls back to `high`**, not to the next rung down: the bundle path reads `if(o==="max"&&!w2(n))o="high"; if(o==="xhigh"&&!t6(n))o="high"`. And the **field is an absolute override rather than a floor**, so a session set above `xhigh` now gets *less* on the gate seats than it inherited; the Goal and Section 4 both say so now rather than letting the determinacy framing hide it.
Review Findings: Blind, 1 Major accepted and fixed (the sub-default `medium`, above). Blind Minors: the `implementer-opus: high` no-op-on-a-default-session observation is accepted as accurate and is now stated in the table as "the model default, pinned rather than inherited"; the cap-not-floor point is accepted and documented in the Goal; the invalid-value and no-test points are accepted and feed Section 3; the `xhigh`-degrades-on-older-models point is accepted and recorded above; the Fable-ratchet spend point is accepted and becomes a backlog item in Section 4. The `qa-verifier` inversion point (pinned to sonnet for cheapness, now raised to the most expensive rung) is noted and **not acted on**: model and effort are orthogonal levers and a cheap model reasoning harder is a coherent seat, which the documents will say. Adversarial, 2 Minor, both accepted and routed to Section 4: five `file:line` citations into agent bodies went stale when the insertion shifted every body line by one, and the `xhigh` choice needs stating in both directions.
Verification: `node --test test/*.test.js tools/*.test.js < /dev/null` passes; `claude plugin validate ./plugins/claude-kit` passes with only the pre-existing no-version warning; the staged diff is 13 files, 13 insertions, 0 deletions.
Next: Section 3, Pin the assignment
Commit Model: Branch-and-PR (substituted, see header)
