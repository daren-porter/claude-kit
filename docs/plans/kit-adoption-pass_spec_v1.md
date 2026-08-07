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
question. Three tiers, cheapest first:

1. **Candidate list.** The diff of his `docs/README.md`, `docs/backlog.md`, and
   `docs/plans/README.md`, plus a name-only inventory of `skills/`, `agents/`,
   `hooks/`, and `scripts/` in both trees. This produced all eleven candidates above
   for roughly 6 KB. Reading `memq.js` would have cost 5,300 lines for the same verdict.
2. **Adjudicate a survivor.** His `docs/archive/<capability>_spec.md`, Goal and
   Approach only. That is where "deliberate decision versus Scott-specific" is
   actually visible, and it is the adjudication criterion spec_v3 recorded.
3. **Read code.** Only when porting.

The trap sits in tier 1: his `docs/README.md` narrative is his framing of his own work,
written for his readers. It yields **candidates, never verdicts**. Adjudicating off it
is exactly the failure the criterion exists to prevent, so the skill has to say so.

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

### The pass stops at the queue

It never auto-dispatches. Its output is the updated document plus a short queue Daren
picks from; a picked item then enters the kit's existing pipeline, `brainstorming` for
anything needing design and `executing-work` for a settled port. The skill duplicates no
pipeline the kit already has and implements nothing inline.

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
- The three-tier read ladder is stated with its tier-1 command set, and it carries the
  explicit warning that his `docs/` narrative yields candidates and never verdicts.
- Removals are stated as the bounded set intersection with the literal command, plus the
  direction-signal caveat.
- The four-verdict vocabulary matches Section 1's, and "too large to adjudicate here,
  needs its own brainstorm" is named as a legitimate outcome.
- The pass stops at the queue: the skill states that it never auto-dispatches, never
  implements inline, and hands off to `brainstorming` or `executing-work` only on
  Daren's pick.
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
Next: Section 2 (the `kit-adoption-pass` skill)
Commit Model: Commit-and-Push
