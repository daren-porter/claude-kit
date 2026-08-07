# Kit Adoption Pass

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only; no delegate-fable sections
Created: 2026-08-07

## Goal

A `kit-adoption-pass` skill that runs the recurring inbound pass over Scott Applefeld's
kit repeatably instead of improvising it, plus `docs/kit-adoptions.md`, a standing
record of adopt/adapt/reject/pending verdicts that survives between passes. When this
is done, a pass starts by reading what was already decided, produces a bounded
candidate list for a few KB rather than by reading his whole tree, hands Daren a queue
of verdicts, and stops. The two prior passes (`archive/claude-kit_spec_v3.md`,
`archive/kit-goal-port_spec_v1.md`) were improvised, and their standing decisions are
buried in archived specs where every later pass re-derives them.

## Related

- `archive/claude-kit_spec_v3.md` and `archive/kit-goal-port_spec_v1.md` are the two
  prior instances of this pass. Both were improvised, both delivered on the
  `kit-adoptions` branch, and between them they hold the adjudication criterion and the
  deliberately-not-taken list that Section 1 lifts into the living document.
- `../backlog.md` carries three items this pass's own classification bears on: the
  security-model.md item (candidate 7 below), the docs-write-guard live-fire item
  (candidate 3), and the ported-wording baseline item (Section 3).

## Approach

Source of truth is `SApplefeld/sapplefeld-claude-kit`, cloned locally at
`~/repos/sapplefeld-claude-kit`. **Inbound only**: pushing this kit's work back to
Scott is out of scope, so the skill has no outbound half and no packaging step.

### Grounded in a real pass, not an imagined one

The design was settled by running the pass by hand on 2026-08-07 rather than by
reasoning about it. The clone sat at `8880eb7` (2026-07-24); origin was at `09c91a4`
(2026-08-06): **138 commits, 129 files, +34k/-9.5k**. That run produced the eleven
verdicts below, which are both this spec's evidence and Section 1's seed content.

| # | Capability | Verdict | Reason |
|---|---|---|---|
| 1 | Semantic memory system (`memq.js` ~5.3k lines, `memory-index`/`memory-session`/`memq-shim`/`memq-grant`/`memory-usage-stamp`, `memory-system` skill, 6 specs, ~14k lines of tests, PowerShell installers) | **pending** | Too large to adjudicate inside a pass; needs its own brainstorm. He replaced Claude Code's native auto-memory and turned it off; Daren uses the native one. The installer half is PowerShell against a Linux workstation. |
| 2 | `readonly-agent-guard` (PreToolUse Bash guard, ~969 lines) | **pending, strong** | Same exposure here, verified 2026-08-07: seven agents that are read-only by intent grant `Bash` (`adversarial-reviewer`, `blind-reviewer`, `council-member`, `design-facilitator`, `pr-reviewer`, `qa-verifier`, `security-reviewer`), so their read-only contract is declarative only. `docs-curator` and the three implementers hold write tools by design and are not in scope. |
| 3 | `hook-canary` (SessionStart known-answer probes over the installed plugin cache) | **pending, strong** | Answers the live backlog item "Live-fire the docs-write-guard after the next plugin update" and the standing plugin-cache-lag problem. |
| 4 | `kit-version-nudge` | **pending, small** | Same family as candidate 3. |
| 5 | Doctrine rightsizing (26% trim against the Claude 5-generation harness baseline) plus `doctrine-refresh.js` | **pending, method only** | Auditing always-on rules against what the current harness now owns is portable and cheap; his specific cuts are his file. Adjacent to `reconcile-claude-md`. |
| 6 | `output-styles/kit.md` (force-applied style re-asserting the communication register late in a session, byte-parity tested against the doctrine) | **pending, mechanism only** | The mechanism addresses real register decay. The content (teaching posture, the Insight and Decision block marks) is Scott's voice and fails this kit's lean/anti-dogma line. |
| 7 | `docs/security-model.md` | **pending, shape only** | This kit has a backlog item of that exact title open since 2026-07-24. Take the document's shape, not his contents. |
| 8 | Fleet integration / external-engine standdown | **rejected** | Scott-specific: it is a contract with an external engine (Spine's Dispatch) that Daren does not run. |
| 9 | `operating-instructions` skill changes | **rejected** | The spec_v3 standing rejection of the full operating manual holds. Rightsizing (candidate 5) is the part worth re-reading, and it is tracked there. |
| 10 | Backlog-sweep batch: subagent `effort` frontmatter dials on six agents; reviewer-one-tier-above-the-writer; the exit-after-stdout-write truncation fix across six SessionStart/Stop hooks | **pending, split** | The truncation fix may be a latent bug in this kit's shared-lineage hooks and warrants a direct check. The effort dials are a cheap capability this kit lacks. The reviewer-tier rule needs adjudication against this kit's own Fable spend wall. |
| 11 | His removals: the compact-session skill and its vendored engine, `context-tripwire`, the relay machinery | **removals check, not a candidate** | 25 files deleted in the window; this kit carries none of them, so the intersection is empty. Not vacuous, though: abandoning the compaction direction (on zero usage by his own account) and, earlier, the tripwire and relay machinery is negative signal on the 2026-07-20 kaizen note about fresh-session nudges at Chapter boundaries. |

### The read ladder is the skill's economic core

A pass that reads his code to classify it costs a fortune and answers the wrong
question. Four steps, cheapest first:

0. **Orient.** `git diff --name-status`, `git log --oneline`, and
   `git diff --numstat | sort -rn` over the window. Shape and biggest movers, for
   almost nothing.
1. **New capabilities.** The diff of his `docs/README.md`, `docs/backlog.md`, and
   `docs/plans/README.md`, plus a name-only inventory of `skills/`, `agents/`,
   `hooks/`, and `scripts/` in both trees. Roughly 6 KB, and reading `memq.js` would
   have cost 5,300 lines for the same verdict.
2. **Changed prose.** Added-lines-only diffs over `skills/`, `agents/`, and `hooks/`:
   `git diff -U0 <sha>..origin/main -- <path> | grep '^+' | cut -c1-300`.
3. **Adjudicate a survivor.** His `docs/archive/<capability>_spec.md`, Goal and
   Approach only. That is where "deliberate decision versus Scott-specific" is
   actually visible, and it is the adjudication criterion spec_v3 recorded.
4. **Read code.** Only when porting.

**Step 2 exists because step 1 provably misses things, and this was measured, not
assumed.** A fresh agent given the real task with no ladder never opened his `docs/`
index or a single archive spec. It went straight from orientation to added-lines diffs
and produced a *better* classification than the hand pass, finding ten portable items
step 1 had missed entirely, one of them a confirmed defect in this kit's own hooks. The
reason is structural: his `docs/` index is organized by effort, so it describes new
capabilities well and changes to existing files not at all. A one-line fix applied
across six hooks is invisible there. Steps 1 and 2 answer different questions and the
pass needs both.

That run also showed what the ladder must forbid. Unbounded `git diff` over a directory
produced repeated 30 to 75 KB outputs the agent could only read previews of, which is
where a pass actually burns its budget. The `-U0 | grep '^+' | cut -c1-300` idiom is the
rule, not a suggestion.

The trap in step 1 stands, but it is now a smaller claim than the original design made:
his `docs/README.md` narrative is his framing of his own work, written for his readers,
so it yields **candidates, never verdicts**. The measured run did not fail this way (it
never read the narrative at all), so the warning is retained as reasoning rather than as
an observed failure, and the skill states it as such.

### The watermark needs no new machinery

`docs/kit-adoptions.md` records the last-adjudicated sha. A pass runs `git fetch` (never
`pull`) and diffs `<recorded-sha>..origin/main`, then advances the recorded sha when the
classification is written. This works whether or not the clone is pulled between passes,
and it catches unspecced commits (hook fixes, small changes) that the alternative,
comparing the two `docs/` trees by date, structurally cannot see. That alternative is
dead. Seed sha: `8880eb7` was where the clone sat and matches the last real pass;
after this effort the recorded sha is `09c91a4`.

Recorded paths drift: spec_v3 cites the clone as `~/repos/claude-kit-scott`, which has
since moved. The skill states the current path but instructs a pass to confirm it rather
than trust it.

### Removals are a set intersection, not a judgment call

The stub predicted "treat his removals as signal" would be the expensive step most
likely to be skipped. The hand run says otherwise. Removals only matter where the two
kits overlap, and that overlap is one command:
`git diff --diff-filter=D --name-only <sha>..origin/main` intersected against this
kit's tree. Today it returns empty. Stating it as a bounded set intersection converts a
vague instruction into a mechanical step nobody skips.

One caveat rides with it, because the intersection is necessary but not sufficient: a
removal can be signal about a **direction this kit is contemplating**, not only about
code it holds. Candidate 11 is the worked example.

### Verdicts are keyed by capability, and pending is load-bearing

Keying standing decisions to a sha silently suppresses a re-look when Scott
substantially reworks something this kit said no to. Each entry carries a capability
name, a verdict, a one-line reason, and the date and sha the verdict was made at. A
later pass seeing new commits against a rejected capability then asks whether the reason
still holds, instead of skipping it.

Four verdicts: **adopted** (with where it landed here), **adapted** (with what changed
and why), **rejected** (with the reason), **pending** (classified, not yet
adjudicated). Pending is the one that makes the document worth having. One pass over
138 commits produced a portfolio that cannot be adjudicated in a sitting, and without a
pending state the next pass re-derives everything this one ran out of time for, which is
the precise failure the stub exists to kill. "Too large to adjudicate inside a pass,
needs its own brainstorm" is a first-class outcome, not a failure to decide.

### The pass ends with an offer, not a wall

Its output is the updated document plus a short queue, and then a concrete offer: a
recommended next move Daren can accept in the same breath, routing into `brainstorming`
for anything needing design or `executing-work` for a settled port. Most passes will end
that way, since the usual case is that he agrees with the read and wants it built.

What the skill still may not do is decide for him or fan out. One pass over 138 commits
produced twenty candidates; dispatching a portfolio on its own initiative is the failure
worth preventing, and that is a prohibition on **auto**-dispatch, not on offering. It
also implements nothing inline and duplicates no pipeline the kit already has.

Ordering is load-bearing: **the ledger is written before any handoff.** A pass that
offers first and records second loses its whole classification if the accepted work runs
long, which is the exact failure this document exists to prevent.

### Where the document lives

`docs/kit-adoptions.md`, a living document beside `backlog.md`. Not a section inside the
SKILL.md: it grows without bound and the skill ships in the plugin payload, so every
invocation would pay for the whole history. Not `backlog.md` either: that file holds
active items only and prunes what completes, while rejections are permanent standing
decisions whose whole value is that they persist. The skill reads the document as step
one of every pass, so it has a guaranteed reader and cannot rot unnoticed.

### Trigger

Manual invocation, backed by a gentle SessionStart nudge in the kit repo. The evidence
that settled it: the clone went 138 commits and six weeks stale with nothing to prompt a
pass, so manual-only had already failed once.

The nudge's job follows from how Daren actually uses the repo. He is in claude-kit
because he has something of his own to bring, and that something is usually unrelated to
Scott's kit. So the nudge is not a reminder of an intention he already holds; it catches
drift he was not thinking about, while he is already in the one place he can act on it.

It gates on **elapsed time, not on git state**. The doc records the date of the last
pass; the hook reads it and nudges past a threshold. No fetch, no network, no remote
auth in a SessionStart path, and no dependence on whether anyone has fetched the clone
lately. Counting commits ahead would be a more precise signal and a worse instrument: it
needs a network call on the startup path to be accurate, and it reports confidently
stale numbers when it skips one.

## Sections of Work

### 1. The standing-decisions document

Create `docs/kit-adoptions.md` and seed it with the 2026-08-07 pass.

Acceptance criteria:
- The file exists at `docs/kit-adoptions.md` with a stated purpose, the four-verdict
  vocabulary defined (adopted / adapted / rejected / pending), and the entry format:
  capability name, verdict, one-line reason, date, and the sha the verdict was made at.
- It records the watermark: last-adjudicated sha, its date, and the clone path, with an
  explicit note that the path is confirmed rather than trusted. The recorded sha is
  `09c91a4`, and the file states the rule that lets it advance: the sha moves when every
  capability in the window has a verdict, and **pending** counts as one. A window is
  adjudicated when nothing in it is unclassified, not when nothing in it is outstanding.
- The pass date is carried on its own anchored header line, `Last pass: 2026-08-07`, in
  strict `YYYY-MM-DD` form. Section 4's hook parses this line, so it is a machine
  contract: a pass updates it, and nothing reformats it. Say so in the file.
- The ten candidate verdicts from the Approach table are present, each with its reason,
  plus the removals-check outcome. Row 11 of that table is the removals check, not an
  adoption candidate, so it is recorded as its own outcome rather than as a fifth verdict
  in the vocabulary. This keeps Section 2's "four-verdict vocabulary" target unambiguous.
- The two standing decisions currently buried in `archive/claude-kit_spec_v3.md` are
  lifted in and attributed: the adjudication criterion (deliberate decision versus
  Scott-specific), and the deliberately-not-taken list (the full 132-line operating
  manual wholesale, the format-on-edit hook, `scott-writing-style`, the CLAUDE-FOR-FABLE
  variant, the agent-teams machinery, plus the kit-goal port's rejection of his Windows
  relay clause and his compaction-ledger genealogy as platform-specific).
- Reading only this file, with no access to either archived spec, is enough to know what
  has been decided and what is outstanding.
- Registered in `docs/README.md` under Living documents with a one-line hook.

Execution mode: main. It is this conversation's output and writes under `docs/`, which
executing-work holds in the main thread regardless of recorded mode.

### 2. The `kit-adoption-pass` skill

A new skill under `plugins/claude-kit/skills/kit-adoption-pass/SKILL.md`.

Acceptance criteria:
- The skill exists with a trigger-shaped `description` naming the recurring inbound pass
  over Scott's kit, and it is addressed to Daren in the kit's voice.
- It opens by reading `docs/kit-adoptions.md` before touching either tree, so prior
  verdicts are known before new candidates are generated.
- It states the fetch-not-pull rule and the `<recorded-sha>..origin/main` diff, and it
  advances the recorded sha only when the classification has been written down.
- The read ladder is stated as five steps (orient, new capabilities, changed prose,
  adjudicate, code) with the literal command set for each of the first three. Step 2
  carries the `-U0 | grep '^+' | cut -c1-300` idiom and an explicit prohibition on
  unbounded `git diff` over a directory, which is where a pass burns its budget.
- The skill says why steps 1 and 2 are both required: an index organized by effort
  cannot show a change to an existing file, so a docs-only pass systematically misses
  small portable wins. This is the ladder's load-bearing claim and it is the one grounded
  in a measured run.
- The warning that his `docs/` narrative yields candidates and never verdicts is present
  and marked as reasoning rather than as an observed failure, per `writing-skills`'
  counter-case discipline. The RED did not reproduce it.
- Removals are stated as the bounded set intersection with the literal command, plus the
  direction-signal caveat.
- The four-verdict vocabulary matches Section 1's, and "too large to adjudicate here,
  needs its own brainstorm" is named as a legitimate outcome.
- The pass ends with an offer: the skill states that it writes the ledger first, then
  presents the queue with a recommended next move Daren can accept immediately, routing
  to `brainstorming` or `executing-work`. It never dispatches without his pick, never
  dispatches more than what he picked, and never implements inline.
- It routes ported behavior-shaping wording to Section 3's clause in `writing-skills`
  rather than restating the evidence bar.
- A fresh-session dry read is coherent and contradicts no existing skill; in particular
  it does not duplicate `curating-docs`, `kaizen`, or `reconcile-claude-md`, and it says
  in one line where each boundary sits.
- Registered in the root `README.md`'s skill inventory (the repo README, not `docs/README.md`).

Execution mode: main. Behavior-shaping prose in the kit's own voice, design-entangled
and voice-critical, per the standing authoring-is-main-by-exception decision.

Tests: this skill's wording is behavior-shaping, so `writing-skills`' evidence bar
applies to it. The failure worth locking is a pass that adjudicates off his `docs/`
narrative instead of dropping to his spec docs, since that is the cheap-and-wrong path
the ladder exists to block.

### 3. The ported-wording clause in `writing-skills`

Amend `writing-skills` to define what evidence is admissible when a local synthetic RED
is unavailable.

Acceptance criteria:
- `writing-skills` gains a clause covering both open cases, which are one problem:
  wording **ported** from a source carrying its own observed-failure provenance
  (2026-07-24 kaizen note; the live instance is `archive/kit-goal-port_spec_v1.md`), and
  a failure **Daren reports from a real session** that a synthetic RED does not
  reproduce (2026-08-07 kaizen note).
- The clause states what the borrowed or reported evidence does and does not license:
  it admits the wording, and it bounds which parts of it are actually validated, rather
  than granting a blanket pass.
- It names the follow-up obligation, so ported wording carries a recorded debt rather
  than an assumed baseline. The division is explicit and one-way: **the clause holds the
  rule, `backlog.md` holds the instances.** The clause says a debt is recorded in the
  backlog; it never enumerates the open ones, so the two do not point at each other.
- The existing RED bar ("if it does not fail, there is nothing to fix, stop") still
  reads coherently alongside it; the clause is an admissible-evidence path, not a
  loophole that retires the bar.
- The `backlog.md` ported-wording item is updated to reference the clause rather than
  re-describing the problem.

Execution mode: main. `writing-skills` is the kit's most behavior-critical prose and the
clause will move in contact with the existing text.

Tests: the clause is itself an instance of the case it defines, so hold it to its own
bar and record honestly which parts are validated and which rest on the two reported
failures.

### 4. The staleness nudge

A new additive block in `plugins/claude-kit/hooks/session-start.js`, plus its tests.

Acceptance criteria:
- A new helper follows the `countPendingKaizen` pattern exactly: gated on the kit-repo
  marker (`plugins/claude-kit/.claude-plugin/plugin.json` under `cwd`) so it is silent
  in every other project, bounded head read, BOM-tolerant, and returning a
  no-nudge value on any failure.
- It reads the pass date from `docs/kit-adoptions.md` via an anchored, case-insensitive
  header predicate over a `Last pass: YYYY-MM-DD` line, matching the anchored-header
  idiom the plan scans already use. A missing file, a missing header, or a date that is
  not strictly `YYYY-MM-DD` yields silence, never a nudge and never a crash.
- The threshold is **30 days**, stated as a named constant. It sits just inside the
  observed pass cadence (2026-06-17 to 2026-07-24 was five weeks), so it fires before
  the drift that motivated it rather than after.
- The emitted block names the elapsed whole days, points at the `kit-adoption-pass`
  skill, and closes with "Reminder, not a blocker." like its siblings. **Only a computed
  integer crosses from the file into the context channel**, never any string read out of
  it, so the block needs no sanitization and cannot carry injected text.
- The block is additive in the established sense: wrapped in its own try/catch, unable
  to affect plan recovery or any other block, and included in the early-return guard so
  a session with nothing else to say still emits it when the pass is stale.
- Tests pin four cases: fresh pass (silent), stale pass (block emitted, correct day
  count), malformed or absent header (silent), and non-kit repo (silent). This is a
  down payment on the backlog's "Pin the session-start surfacing with tests" item, which
  is updated to record which blocks remain unpinned.
- Verification is by test only. The hook loads from the installed plugin cache, so it
  cannot fire in the session that writes it; do not report a live observation.

Execution mode: delegate-capable. The contract is tight and `countPendingKaizen` is a
sibling to copy, but session-start.js is fail-open-critical on every session in every
project and is the test gate's one untested file, so this does not get the mechanical
tier.

Tests: the four cases above are the deliverable, not a suggestion. The risk driving them
is that a nudge which throws takes down plan recovery for every project on the machine,
and the existing blocks have no pins to catch a regression.

## Out of Scope

- **Adopting any of the eleven candidates.** This effort classifies and records; each
  adoption is its own follow-on effort off the queue. Candidates 2, 3, and 7 are the
  strongest and close live backlog items, but taking them here turns a skill spec into a
  Scott-kit adoption effort.
- **Superpowers (`obra/superpowers`) as a second source.** No local clone, no
  spec-doc tier to adjudicate against, and a different lineage: it is the ancestor of
  `archive/claude-kit_spec_v2.md` rather than of this kit's fork. The read ladder does
  not apply to it, and claiming one skill serves both buys a caveat that has to be
  written twice. Revisit once the Scott pass has run twice under the skill.
- **Any outbound half.** Nothing goes back to Scott.
- **Any trigger beyond the Section 4 nudge.** No scheduled run, no auto-invocation, and
  no nudge outside the kit repo. The nudge informs; it never starts a pass.
- **The `docs/security-model.md` backlog item itself.** Candidate 7 records that his
  version is worth taking the shape of; writing this kit's own remains its own item.

## Open Questions

None blocking. Two carried forward as queue entries rather than spec questions: whether
candidate 1 (the memory system) is worth a brainstorm at all given the native auto-memory
Daren already runs, and whether candidate 10's reviewer-tier rule survives contact with
this kit's Fable spend wall. Owner: Daren, at queue-pick time.

## Chapters

### Chapter 1 - 2026-08-07
Completed: 1. The standing-decisions document
Implemented By: main session (writes under `docs/`, which executing-work holds in the main thread regardless of mode)
Metrics: 2 review rounds; 0 NEEDS_CONTEXT; 0 escalations; advisor on, and it answered substantively twice during design (the kit's standing note treats the advisor as unproven until consultations are observed succeeding; these two count as observations, one of which caught the missing precondition that this section's whole classification rested on)
Decisions / Surprises:
- **Row 11 restructured out of the verdicts table.** The Approach table's eleventh row is his removals, which was never an adoption candidate. Leaving it in the table forced a fifth verdict (`no overlap`) that the vocabulary did not define, and Section 2's acceptance criterion requires a closed four-verdict vocabulary. It now lives as a `Removals checked` block under the pass. Spec deviation: Section 1's criterion amended from "the eleven verdicts" to "the ten candidate verdicts plus the removals-check outcome". Intent unchanged, so not raised to Daren.
- **Added a pending entry the spec did not name.** `archive/claude-kit_spec_v3.md` reserved four operating-manual nuggets for "a dedicated curation pass" on 2026-06-17 (its Chapter 3 adds a fifth, "match my precision"), and nothing has tracked them since. They are outstanding prior-pass work, and the section's self-sufficiency criterion cannot hold with them invisible. Recorded as a carried pending entry.
- **The removals check is now an explicit watermark-advance precondition.** Moving removals out of the table made the check skippable without the rule noticing. The advance rule names both halves.
Review Findings:
- Round 1, CHANGES_REQUIRED: 1 Critical, 4 Major, 8 Minor. All fixed. The Critical is worth naming because it is the exact failure this file exists to prevent: the classification asserted that Scott's kit has no Fable spend wall. He has `claude-kit_fable-metering_spec_v1.md`, this kit's wall was adapted from his, and his `claude-kit_backlog-sweep_spec_v1.md` section 1 already adjudicates the reviewer-tier rule against it. A wrong reason in a standing record propagates to whoever acts on it. Verified against his clone before editing rather than taken on the reviewer's word. The Majors: `kit-version-nudge` misdescribed (it pins a build hash at first SessionStart to catch a build moving under a live session, never reads the repo, and needs a `build-info.json` this kit does not produce, so its verdict moved to "pending, blocked on a prerequisite"); a wrong pending count; the undefined fifth verdict; and no statement that pre-watermark entries carry no sha.
- Round 2, APPROVED_WITH_CONCERNS: 1 Major (the spec deviation above, unrecorded at the time), 5 Minor. All fixed.
- Blind reviewer not dispatched: this section's changeset is entirely under `docs/`, and the blind dispatch contract requires a changed-file list with `docs/` paths omitted, which leaves nothing to review. Jotted to the kaizen inbox, since the skill does not define the docs-only case.
Next: Section 4 ran next, out of order and in parallel; see Chapter 2
Commit Model: Commit-and-Push

### Chapter 2 - 2026-08-07
Completed: 4. The staleness nudge
Implemented By: implementer-opus (delegate-capable, as assigned); the `docs/` and `README.md` edits taken in the main thread, since the docs-write-guard denies a subagent those writes
Metrics: 2 review rounds; 0 NEEDS_CONTEXT; 0 escalations; advisor on
Decisions / Surprises:
- **Run out of order, in parallel with Sections 2 and 3.** Section 4 touches only `session-start.js` and `test/`, disjoint from the prose sections, and its one shared contract (Section 1's `Last pass:` header) was already committed. Sanctioned by executing-work's parallelize-on-non-overlapping-files rule. The cost showed up at commit time: `docs/backlog.md` and `README.md` ended up carrying content from three sections at once, so strict per-section commits were not possible on those two files.
- **Daren's design change arrived mid-section** and landed on Section 2, not this one: the pass now offers a next move rather than hard-stopping at the queue. Recorded in the Approach and Section 2's criteria.
- **The implementer corrected my own stated rationale, by mutation rather than inspection.** I asked for plan-recovery fixtures on the grounds that they would distinguish silence-by-return from silence-by-throw. They do not: the helper's inner try/catch absorbs a throw at the parse site, and the implementer proved it by mutating the code (M1, M2) and watching all tests stay green. What the fixtures actually pin is the stronger property that a throw escaping `main()`'s wrapper takes the whole hook silent (M4 turns 14 cases red). The file comment now states the real property. Accepted its correction over my brief.
- **Accepted two additions past the fix list:** a FIFO regression test, and a 15-second timeout on every spawn in the file. The FIFO case is the durable pin for a hazard the security reviewer demonstrated live. Both carry a stated caveat: the FIFO test degrades to a silent pass where `mkfifo` is unavailable.
Review Findings:
- Round 1: adversarial CHANGES_REQUIRED (1 Critical, 2 Major, 5 Minor), blind CHANGES_REQUIRED (3 Major, 4 Minor), security CLEAR. All addressed.
- **Both reviewers independently found the same Major and both verified it empirically:** the one test guarding the shipped `Last pass:` header rewrote the entire line, so any reformat was canonicalized into the fixture and the test passed green while the real file would have gone silent. Now replaces the date token only.
- The Critical was an unimplemented acceptance criterion, the `docs/backlog.md` update, which the implementer correctly refused because its brief forbade `docs/` writes. Taken in the main thread.
- A second Major, also found twice: `openSync` on a fixed path with no `isFile` guard. The security reviewer replaced the file with a FIFO and hung the hook until it killed the process at five seconds, against a file header that promises "Never blocks". Guarded in the new helper only; the three pre-existing call sites with the same exposure are backlogged rather than fixed, to keep the section in scope.
- Security review CLEAR on the section's stated property: it spawned the hook against prompt-injection bodies, a JSON-breakout attempt, and a symlink to a secret-bearing file, and confirmed only the computed integer crosses. Regex is not ReDoS-prone.
- Blind reviewer flagged that the emitted block points at a `kit-adoption-pass` skill that did not exist. Correct at the time; Section 2 created it.
- No third review round: every finding was addressed, the implementer supplied mutation evidence (M1 through M6) that each guard actually pins rather than passing vacuously, and I ran the gate independently. Spot-checked the four load-bearing fixes in the tree by hand.
Evidence: `node --test test/*.test.js`, 158 pass / 0 fail (baseline before this section: 142). Verified by test only; the hook loads from the installed plugin cache, so nothing fired live.
Next: Section 2 (the `kit-adoption-pass` skill)
Commit Model: Commit-and-Push

### Chapter 3 - 2026-08-07
Completed: 2. The `kit-adoption-pass` skill
Implemented By: main session (behavior-shaping prose in the kit's voice, per the standing authoring-is-main-by-exception decision)
Metrics: 3 review rounds; 0 NEEDS_CONTEXT; 0 escalations; advisor on
Decisions / Surprises:
- **The spec's ladder was wrong, and a RED proved it.** `writing-skills` requires RED before persisting, so two were run before the skill was written. Neither reproduced the failure the spec hypothesized (adjudicating off Scott's docs narrative). RED 1, given three named capabilities, read his archive specs unprompted. RED 2, given the real unguided task, never opened his `docs/` at all and worked from raw diffs, and its classification was **better than the hand pass**: it found ten portable items the docs-first sweep had missed, including a confirmed defect in this kit's own hooks (`process.exit(0)` after a stdout write, in four hooks; on `kit-goal-stop.js` a truncated write reads as no-block and silently releases the leash). The Approach's three-tier ladder was replaced with a five-step one whose new step 2 diffs changed prose, and the reason is now recorded as measured rather than assumed. The ten items were added to `docs/kit-adoptions.md`, and the hook defect was backlogged rather than fixed, since adoption is out of scope.
- **The skill's honest value turned out to be continuity, not technique.** Since no RED showed an unguided agent classifying badly, the skill is written around what the state file buys (not re-deriving standing decisions) rather than around correcting behavior. The narrative warning is retained but marked as reasoning, not observation, and the debt is recorded in the backlog per Section 3's new clause. This section is that clause's first live instance.
- **Daren reframed the ending mid-section.** The pass no longer hard-stops at the queue; it writes the ledger, then offers a recommended next move he can accept in one word. The prohibition narrowed from "never dispatches" to "never without his pick, never more than he picked", which preserves what the hard stop was actually protecting (no self-directed fan-out across a twenty-candidate window) and drops the round-trip it was costing. Spec Approach and criterion amended.
- Deviation from the spec's Approach, minor: the spec said the skill "states the current path but instructs a pass to confirm it"; the skill instead reads the path from `docs/kit-adoptions.md` and confirms it there, so the path is not duplicated into shipped prose where it would drift again. Reviewer agreed the implementation is the better call.
- **Length accepted at 226 lines against a 143-line previous maximum.** The leanness bar in `writing-skills` is standing per-session cost, which is the description alone; the body loads only when a pass runs, during an operation that reads far more than this from someone else's repo. Reviewer made the argument and I agree with it.
Review Findings:
- Round 1: adversarial CHANGES_REQUIRED (1 Critical, 4 Major, 8 Minor), blind CHANGES_REQUIRED (2 Critical, 5 Major, 5 Minor). Rewritten rather than patched.
- **The finding that would have shipped a broken skill:** the draft said `cd <clone>`, and its ledger write used a relative `docs/kit-adoptions.md`. Every pass would have written its entire classification into Scott's checkout while the kit's watermark never advanced. Found by the blind reviewer. Fixed by making every upstream command `git -C <clone>` so the working directory never leaves the kit repo.
- Other Criticals: the orient commands carried no revision range (bare `git diff` compares worktree to index, and run from the kit repo would have classified Daren's own uncommitted files as Scott's inbound candidates); and the directory paths were wrong for both trees.
- Round 2 and 3 findings were largely defects the previous round's fixes introduced, which is the honest cost of rewriting under review: an anchor rule that declared the documented quiet-index case a layout failure, and a settled-port route into `brainstorming`, whose own first rule bounces trivial work. Both fixed; the route now branches on size.
- Reviewers verified the commands empirically against the real clone rather than reading them: `--diff-filter=MR` was proven necessary in a scratch repo (a rename-plus-edit reports as `R`, and `M` alone drops it), and `--diff-filter=M` on his `skills/` was measured at 208 `+` lines against 396 unfiltered.
Next: Section 3 (the ported-wording clause in `writing-skills`)
Commit Model: Commit-and-Push

### Chapter 4 - 2026-08-07
Completed: 3. The ported-wording clause in `writing-skills`
Implemented By: main session (the kit's most behavior-critical prose, and the clause moved in contact with the surrounding text exactly as the spec predicted)
Metrics: 3 review rounds; 0 NEEDS_CONTEXT; 0 escalations; advisor on
Decisions / Surprises:
- **The first two drafts were walkable, and both reviewers proved it independently.** The clause began as "the source's provenance admits the wording, persist it", which is a loophole wearing a rule's clothes. Three separate defects: persisting first forecloses the very control the clause presumes was attempted (and `writing-skills:93-98` already said so); the ported case admitted wording on *assumed* provenance with nothing to check; and the closing disclaimer was an exemption clause trying to scope itself, the exact form this skill's own table says backfires.
- **The blind reviewer's reframe did the most work: GREEN survives even when RED does not.** RED is what a borrowed-evidence case loses; whether a fresh subagent handed the wording actually complies is a different question and is still answerable. That became a third precondition. It then found that precondition decorative as written, since GREEN-as-defined re-runs the RED task, which on this path either does not exist or already passed. It is now a distinct followability probe with a stated failure signature.
- **Final shape: a gated path with three observable preconditions**, two before persisting and one necessarily after, rather than a judgment call. Recorded attempt with a re-runnable description; provenance located at where the failure was *recorded*, not who mentioned it; then a followability probe. The cheap branch ("could not be constructed") is the strict one, and fails the gate unless the specific unstageable element is named.
- **Coherence repairs the clause forced elsewhere in the file:** the RED bar's terminal "stop" now carries the conditional inline at the decision point rather than 18 lines downstream; the persistence-hold paragraph gained its own release for this path, since its trigger ("until RED has failed") by construction never fires here; the counter-case section's "nothing at all for judgment wording" gained the marked-uncovered exception; and the antipatterns list was qualified so a final scan does not strip the very marker the clause requires.
- **Transit-widening bounded**, which was the last real hole: narrowing or restating the source's claim is covered and marked, but an extension asserting something the source never observed has no port behind it and is cut or held to the normal bar. Without that, an unevidenced belief could ship marked simply by being written in the same sentence as ported prose.
- **Four review rounds, and the fourth found the root.** Rounds 1 to 3 fixed wording: the loophole, the unexecutable ordering, the incoherent covered/cut split. Round 4 named what was underneath all of them: every precondition was discharged by *the persisting agent's own prose about work nobody could see*. The RED bar one page above already solves this by demanding the rationalization verbatim, and the gate had not inherited that standard. It now does: each precondition names an artifact (the subagent's quoted output, a locator another person can follow, the probe's output), all three land in one backlog entry, and an entry missing any of them is not openable. That single change collapsed most of round 4's other findings.
- **Stopping point, chosen deliberately.** The gate now demands exactly what the primary RED bar demands. Pushing further would require more evidence of the borrowed-evidence path than of the path it sits beside, which is backwards. Any self-reported gate is walkable by an agent willing to lie, including the original RED bar; parity with the neighbouring standard is the right bar, not perfection.
Review Findings:
- Round 1: adversarial CHANGES_REQUIRED (7 Major, 2 Minor), blind CHANGES_REQUIRED (1 Critical, 6 Major, 1 Minor).
- Round 2: adversarial APPROVED_WITH_CONCERNS ("the criterion is met", 1 Major on an internal ordering contradiction, fixed); blind CHANGES_REQUIRED with the deeper set.
- Round 3: blind CHANGES_REQUIRED (4 Major, 2 Minor) on branches that self-discharged and a marking category the previous round's fix had emptied.
- Round 4: blind CHANGES_REQUIRED (1 Critical, 5 Major, 5 Minor), the artifacts finding above.
- Round 5: blind CHANGES_REQUIRED, narrowly, on where the round-4 fix put the artifacts. Routing them into `docs/backlog.md` collided with two kit rules at once: `docs-write-guard` denies an implementer any `docs/` write, which is the default execution path, and `curating-docs` defines the backlog as one-line active items with per-effort history explicitly belonging in Chapters. Pasting subagent transcripts there would have been truncated to fit, reintroducing the description-instead-of-artifact walk the round-4 fix removed. Artifacts now live in the effort's Chapter (`.kit/` for a delegated run, folded in at section close) with the backlog carrying a one-line debt and a pointer. Also fixed: "attempt it first" named no way an entry could show it, so the record now carries the RED prompt alongside its output, which is what actually demonstrates the wording was supplied in-prompt rather than read from the repo.
- Closed here rather than running a sixth round. The rounds converged: 4 found the root, 5 found where that fix landed wrong, and both are corrected. finishing-work's full-changeset adversarial pass is the next real check.
- **The two reviewers disagreed at round 2 and the blind one was right**, catching that the persistence hold still forbade what the clause required and that the new GREEN precondition could not fail on either of its entry branches. Taking the harsher read was correct: a standards document with a walkable gate is worse than no clause, because it launders unevidenced wording as gated.
- Round 4 also caught the companion `kit-adoption-pass` skill restating this gate as three steps while dropping the provenance clause, the backlog debt, and the stop-on-failed-probe. That is the summary-replaces-body drift `writing-skills` warns about, appearing in the same effort that wrote the warning. Cut to a pointer.
- Not acted on, recorded so they are not mistaken for oversights: the whole path is structurally an absolute plus an annex, the form the file's own table names as backfiring; and whether the marking rule is general or scoped to the counter-case section. Both argue for restructuring the RED bar itself, which is outside this section.
Next: finishing-work
Commit Model: Commit-and-Push
