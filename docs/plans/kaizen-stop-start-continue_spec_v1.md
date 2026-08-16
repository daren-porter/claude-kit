# Stop, Start, Continue: giving Kaizen an Input That Is Not Friction

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: S3, finishing reviews
Created: 2026-08-15 (designed 2026-08-16)

## Goal

The kit gets a subtraction channel whose input is its own state rather than captured
friction, and which fires without Daren remembering to start it. When this is done, a
maintainer tool reports which sections of the kit's prose grew by accretion; a
SessionStart nudge surfaces that condition and silences itself once acted on;
`docs/take-stock.md` records what came down and what was spared with the reason; and
`writing-skills` and `kaizen` carry the wording that routes a candidate to compression
or to retirement. The proof the mechanism works is that `writing-skills` ends this
effort shorter than it started, which no markdown file in this kit has ever done.

## Why this exists

The kaizen loop has one input channel and it only ever reports that something is
missing or wrong. Every note in `~/.claude-kaizen/notes.md` is friction by definition;
the capture bar says so explicitly. The fix for a friction report is nearly always more
words.

**The whole-history measurement, taken 2026-08-16, needs no judgment call to read:**

| | |
|---|---|
| Markdown file-events across `plugins/claude-kit/` history | **163** |
| ...net-negative | **0** |
| ...net-zero (one-for-one line swaps) | 44 |
| ...net-positive | 119 |
| JS file-events | 59 |
| ...net-negative | **10** |

No `.md` file in this kit has ever net-shrunk in a commit. Not once, in 163 chances.
Code has, ten times, and one of those ten was itself a kaizen pass (`ae9dc10`,
2026-08-07, minus 38 lines from `stop-docs-hygiene.js`). **So the pass can subtract. It
has never been pointed at prose.**

An earlier framing of this stub said the kit has no subtraction channel at all. That
overstates and the correction sharpens where the new mechanism attaches.
`writing-skills` "ask what already produces the behavior before you write anything" and
the did-not-reproduce branch's "the finding is that the draft is redundant and the
change is to cut it" are both real subtraction rules. Both fire at **admission** time.
The kit cuts readily, and only ever cuts things that were never shipped. **The gap is
post-ship**, and those two clauses are the prior art whose form to copy: each is a
conditional on an observable predicate rather than an exhortation to be lean.

None of the 119 additions was wrong. Each traces to a real observed incident with a
date and a session id, which is the kit's own bar and it was met every time. What was
never assessed is the aggregate, because nothing in the kit assesses aggregates.

**The live inbox demonstrates the mechanism better than any argument.** On 2026-08-16
it holds exactly two notes, and both are requests to add. Neither could have been a
request to remove, because the capture bar admits only friction and an absence is the
only friction a correct rule can produce.

### Where the mass actually is

Churn per section of `writing-skills/SKILL.md`, measured 2026-08-16 with `git log -L`:

| Section | Lines | Commits |
|---|---|---|
| Know it works before you trust it | 168 | **15** |
| When a local RED is not available | 161 | **8** |
| When you meet a counter-case to a rule | 45 | 5 |
| When a skill earns its place | 11 | 1 |
| Anatomy | 13 | 1 |
| The description states the trigger | 14 | 1 |
| Match the form to the failure | 25 | 2 |
| Antipatterns | 10 | 2 |

Four sections were written once and left alone. Two carry 70% of the file and 23
commits of sequential patching between them. That is the accretion signature, and one
command finds it.

The cost is **operator wall clock and reader attention**, not tokens. `docs/backlog.md`
item 22 already settled that cache-read bills at 0.1x, so the token-volume argument
against a large skill is the weak one and should not be reached for.

## Approach

Nine decisions, agreed with Daren 2026-08-16.

**1. Both halves, compression named first.** Stop covers two different operations.
*Retirement* cuts a rule so the kit no longer says it. *Compression* rewrites an
accreted section shorter with every claim intact. The measurement says compression is
where the mass is and retirement is the case the kit has never once had, so the wording
names both and leads with compression. Compression is also the instrument that
*generates* retirement candidates, since a clause overtaken by a later, more precise
one only shows up when someone reads the section whole.

**2. Compression's bill is a claim inventory plus a followability probe. No arms.**
Both easy answers are wrong. "Claims preserved, so no behavior change, so no bill"
cannot be said inside a file whose whole premise is that phrasing determines whether an
agent obeys under pressure. The full RED/GREEN/third-arm bill asks a question already
answered, because for a compression there is no new wording and no new claim, only a
shorter statement of a rule whose RED already ran when it was admitted. What compression
actually risks is that the shorter version no longer lands, which is followability, and
`writing-skills` already ships that instrument at precondition 3.

The **claim inventory** is the load-bearing half and it is free: enumerate the claims
before and after and map them, checkable by reading. It also does the routing, which is
what makes it worth more than the probe. **A claim in the before column with nothing
opposite it is not a compression, it is a retirement**, and it routes to the arms. That
turns the boundary between the two halves into something observable rather than a
judgment the compressing session makes about its own work.

The cost comparison is the real argument: three probe reps, no fixture staging, no
serial dispatch, no scratchpad quarantine, no third arm. Roughly a tenth of a full arm
cycle, which is the difference between a mechanism that gets run and one that gets
skipped.

**The known objection, carried rather than buried.** The probe is defined inside the
borrowed-evidence gate, and that section warns in as many words that the probe and the
backlog line "belong to that path and are easy to import by accident from next door."
Lifting it out is precisely the move that clause exists to catch. The defence is that
the import is on the merits rather than by proximity, since the claim here genuinely is
about an agent. That means S2's wording must make the probe **explicitly available** on
the compression path rather than leaving it inherited.

**3. Retirement keeps the full bill.** Cutting a shipped rule is a behavior change and
owes arms, including the rule-change RED that stages the state where the rule as it
stands does the damage.

**4. Detection cheap, diagnosis precise.** The nudge answers "is there anything worth
looking at" at file granularity. The precise per-section instrument runs in the pass.
The hook never claims more than it measured.

**5. The nudge is its own hook, not a ninth block in `session-start.js`.**
`session-start.js` spawns zero processes: `fs`, `path`, `os`, `crypto` and three local
requires, nothing else. A git-based measurement would be the first subprocess in that
file. The kit already solved this: `branch-reaper-nudge.js` is a git-using SessionStart
nudge in its own hook file whose header records the reason, "Kept separate from
session-start.js so the resume hook is untouched." Copy that.

Widening the existing kaizen block was considered and rejected. Its "pending items"
predicate is defined in the skill text and gates three separate things (the offer, the
nudge, the pass), so widening it would make that definition wrong everywhere it is
relied on, to save roughly one line of standing text.

**6. The nudge self-silences.** It measures commits per file **since a recorded
marker**, not since the beginning of time. After a take-stock the count resets. That is
what stops it becoming decoration, and it means it never nags about a section already
decided to keep.

**7. The take-stock record is the Continue channel.** One file doing three jobs: it
resets the nudge, it gives a later Stop something written to argue against rather than
silence, and it is the home the backlog's closure event ("a session where the rule was
applied and the record shows what it changed") has never had. Continue therefore inherits
the backlog's bar verbatim: **"it seems to be working" closes nothing.** A spared entry
names the rule and what was observed to happen because of it. No separate collection
channel is built, because a Continue channel with no consumer is decoration.

**8. Capture stays friction-only, and working sessions do not triage.** The inbox works
because jotting costs nothing and loads no skill. Asking a working session to classify
friction as Stop/Start/Continue adds a decision to the one step whose value is that it
has none, and it is the wrong moment besides: whether friction with a rule is a Stop or
a Start is the triage judgment, not the capture one. This also settles the nudge's
contract. It **reports a measurement and nothing else**. It does not classify, nominate,
or recommend. The triage happens in a pass with Daren present.

**9. The instrument is a tool, not a grep procedure.** The stub's own killer objection
to a tool is that `standing-context-audit.js` exists, works, flags a live candidate, and
nobody runs it. That objection is about a tool with no trigger. This one has a trigger:
the nudge causes the pass, and the pass's wording names the tool. The reverse evidence
is what settles it, and it is this repo's own: `standing-context-audit.js` has never
been run, while the kaizen count block has produced three applied briefs and the decay
nudge is read every session. Nudges get acted on here; tools do not.

## Sections of Work

### 1. The accretion instrument

A maintainer tool reporting churn per section over the kit's prose, so a pass has the
kit's own state on the table rather than only the friction inbox.

`tools/accretion.js`, at repo root **outside** `plugins/claude-kit/` for the same reason
`standing-context-audit.js` states in its own header: measuring the kit's cost must not
itself add standing cost. Node core only, no dependencies, defensive throughout, always
exits 0, writes no artifact, report to stdout.

Method: parse `##` headings into line ranges, run `git log -L <range>:<file>` per
section, report lines and commits for each, and flag sections whose commit count is an
outlier **against the other sections of the same file**. No absolute threshold is
invented; the form is the one `standing-context-audit.js` already uses for oversized
descriptions.

**The output is counts and locations only.** It carries no recommendation, no ranking by
"should be cut", and no verdict on any section. The adjudication is Daren's at the
section close, and a tool that pre-judges would be handing him its own conclusion to
ratify.

Acceptance criteria:
- Run over the current repo, it reproduces the eight `writing-skills` figures in the Why
  section above (168/15, 161/8, 45/5, and the four sections at 1 to 2 commits).
- A file with no `##` headings, a file absent from git history, and a repo with no git
  at all each produce a degraded report rather than a throw, and the exit code is 0.
- The report text contains no word recommending an action on any section, verified by
  reading it.
- Runtime over the whole kit is under 5 seconds.
- A pure-function unit test pins the heading-to-range parsing, including a file whose
  last section runs to EOF and a file with a `##` inside a fenced code block.
- **Pre-registered before the tool runs**, so it cannot be fitted to the output: the kit
  holds 158 `##` sections across 29 prose files, and the outlier rule must flag **no more
  than 10 of them**. More than that and the rule carries no information and must be
  tightened before S4 depends on it. This is a criterion on the rule, not a verdict on
  the kit.

Execution mode: delegate-capable.
Tests: pin the section parser, which is pure and where the subtle bugs are. The git
integration is exercised by the reproduce-the-figures criterion rather than by a fixture
repo, which would cost more than it pins.

**This section is instrumentation, not a decision point, and the earlier draft of it
pretended otherwise.** It carried a gate whose disjuncts all reduced to "the tool is
correctly implemented", which the acceptance criteria already check, so it read as a
go/no-go and could not decide anything. That is the shape `writing-skills` names about a
gate discharged by restating its own entry condition. The honest statement: **the two
known `writing-skills` sections already justify this effort**, the evidence for them is
in the Why above, and S1 exists to make the measurement repeatable and to find the rest.
The one live stop condition is the pre-registered flag count above, and it stops the
*outlier rule* rather than the effort.

### 2. The compression bill, in `writing-skills`

Wording defining a compression and what it owes, so the two halves of Stop route
differently and observably.

The wording must carry: a compression preserves every claim; its bill is a claim
inventory mapping before to after plus a followability probe on the compressed text; it
owes no arms, because no claim changed; a claim in the before column with nothing
opposite it is a retirement and routes to the normal bar. It must name the probe as
**explicitly available on this path**, per decision 2's objection, rather than leaving it
inherited from the gated path.

**It must also define what counts as one claim**, and that is the part most likely to be
skipped. The inventory is the load-bearing half of the bill and the whole routing
mechanism between the two halves, and none of it survives an undefined unit: the same
168-line section can be enumerated as twenty claims or sixty, the granularity decides
whether the mapping is checkable or theatre, and a compressing session left to pick the
unit will pick the one its own work passes. The wording states the unit and requires it
be **fixed before the compression starts**, never derived from the finished text.

This narrows a shipped rule. `writing-skills`' "This is the standard for any change to
behavior-shaping content, the kit's own skills included" currently reads as covering
everything, and this carves compression out of it. So it takes the rule-change RED (stage
the state where the current wording does the damage: a rep facing a compression task under
the current bar either pays the full arm cycle or walks past the bar entirely) and the
narrowing's third arm in the state the change leaves alone (a genuine new-claim change
still routes to full arms).

Acceptance criteria:
- RED reproduces on at least one of three reps, with the rationalization recorded
  verbatim, or the failure's end state on disk where it is a silent omission.
- GREEN holds three of three under the same pressure RED carried, with the wording
  supplied in-prompt rather than read off the repo.
- The third arm shows a genuine new-claim change still routing to the full arms.
- The wording names the probe on this path in its own text, not by cross-reference alone.
- All three arms' artifacts land in this section's Chapter.

Execution mode: main.
Tests: the arms are the test. No durable test applies to prose.

### 3. The first compression, on `writing-skills` itself

The effort proves its own mechanism, on the file whose growth is the evidence.

Target the two outlier sections S1 confirms. **"Know it works before you trust it" (168
lines, 15 commits) is mandatory**; "When a local RED is not available" (161 lines, 8
commits) is in scope and may be deferred. Naming one as mandatory closes a loophole in
the whole-file line criterion below, which either section could satisfy on its own,
leaving the sharper outlier untouched. Run S2's bill against them.

**Ordering against S2, which the arms rules make binding.** S2 runs arms on wording about
compression, and its reps read `writing-skills`. So no S3 edit lands while any S2 arm is
live, or S3's own edits become the leak S2's RED must not see. And S2's GREEN wording
lands *in* `writing-skills`, so **S3 snapshots its before-text at S2's close**, not at
effort start. The whole-file line criterion below still measures against effort start;
those are two different baselines on purpose, and the section records both numbers.

Acceptance criteria:
- The claim unit S2 defines is **stated before the compression starts** and recorded in
  the Chapter, so the granularity is not chosen by whatever makes the mapping come out
  even.
- A claim inventory in the Chapter mapping **every** claim in the before text to a
  location in the after text, with no unmapped before-claim. An unmapped claim means the
  section attempted a retirement, and it is recorded as a candidate rather than taken.
- A followability probe of at least three reps, all three applying the rule correctly.
  A single failure is a stop: revert or fix and re-probe before the section closes.
- The probe carries the compressed wording **in-prompt or by explicit repo path**. Reps
  load skills from the installed plugin cache, which lags the repo, so a rep reaching
  `writing-skills` by name reads text this section is not editing.
- `wc -l plugins/claude-kit/skills/writing-skills/SKILL.md` is **lower at section close
  than at effort start**. This is the whole-file number on purpose, so S2's additions
  count against it.
- If compression alone cannot clear that number without dropping a claim, the section
  reports that as its finding and does not drop a claim to hit it.

Execution mode: delegate-fable.
Tests: the probe is the test.

### 4. The take-stock record and the nudge hook

The trigger that does not depend on anyone remembering, and the record that resets it.

`docs/take-stock.md`: dated entries, each naming the sha examined, what was compressed
with pointers, and what was spared with the reason it is load-bearing. The most recent
entry's sha is the nudge's marker.

`plugins/claude-kit/hooks/take-stock-nudge.js`: SessionStart, kit-repo gated, git-based,
fail-open. Reads the last sha from `docs/take-stock.md`, counts commits per prose file
since it, and emits one line when a file is an outlier against the others. Registered in
`hooks.json` under `startup|resume`, matching `branch-reaper-nudge` rather than
`session-start.js`, since a compact resume should not re-nudge. The block reports the
measurement and points at the `kaizen` skill, says nothing about what to cut, and closes
"Reminder, not a blocker."

Acceptance criteria:
- No `docs/take-stock.md`, no outlier, a non-kit repo, and any git failure each produce
  no output and exit 0.
- An outlier present produces exactly one block naming the file and its commit count.
- The block's text contains no recommendation about what to change, verified by reading.
- `test/take-stock-nudge.test.js` pins all five conditions above, extending the existing
  temp-cwd harness rather than starting a new one.
- The hook completes in under 1 second on this repo, measured and recorded in the
  Chapter, with every git call carrying an explicit timeout.

Execution mode: delegate-capable.
Tests: the five conditions above, as durable tests. `docs/backlog.md` item 18 is about
this hook family shipping unpinned; this one does not.

**Placement, decided rather than left open.** The hook goes in
`plugins/claude-kit/hooks/`, inside the packaged payload that ships to plugin users, even
though it measures the kit's own prose and is useless to anyone else. Two reasons. There
is no maintainer-side hook path to use instead: `settings/settings.recommended.json`
registers no hooks at all, so a maintainer-only channel would be new machinery built for
one file. And the precedent is already set inside the payload, since `session-start.js`'s
kaizen block is equally kit-repo-only and ships to everyone. This is not free, so pay the
smallest version of it: **the kit-repo gate is an `fs` check that runs before any git
call**, making the non-kit path a stat and an exit. The `tools/` placement in S1 is the
opposite call for the opposite reason, and both are deliberate: the instrument is
maintainer-only and heavy, the trigger is light and needs the harness to fire it.

**Guard note for dispatch:** `docs/take-stock.md` is a `docs/` write, which
`docs-write-guard` denies any implementer subagent. The implementer builds the hook, the
tests, and a `.kit/` sample of the record format; the main thread creates the real file
at section close.

### 5. The kaizen pass wording

The pass gains the third input, and the routing.

Step 1 gathers a third thing beside the inbox notes and the `Proposed` stubs: the kit's
own state, via S1's tool. Triage routes each candidate to compression (S2's bill), to
retirement (arms), or to spared. Every take-stock records its verdict in
`docs/take-stock.md`, spared entries included, which is Continue.

The wording must also state what does **not** change, since that is the decision most
likely to erode: the capture bar stays friction-only, and a working session records
friction without triaging it.

This alters shipped step 1, so it takes the rule-change RED: stage a pass whose inbox
holds only requests to add, and read whether the rep ever reaches for subtraction. Build
that fixture as an **isomorph** with the specifics changed, never from the live inbox's
own two notes, both because a fixture must give a rep nothing this disk already answers
and because the arm clears that file anyway.

Acceptance criteria:
- RED reproduces on at least one of three reps, artifacts recorded verbatim.
- GREEN holds three of three, wording supplied in-prompt.
- Whether the change narrows anything is settled in contact with the text; if it does,
  the third arm runs and its artifact lands in the Chapter.
- The capture bar's text is unchanged, verified by diff.
- The arms run against a repo no other session is working, and the inbox is cleared
  before each arm and read after it, per `writing-skills`' inbox-contamination rule.

Execution mode: main.
Tests: the arms are the test.

## Out of Scope

- **Asking live sessions which loaded instructions went unused.** Recorded here because
  it is the intuitive design and a later session will reach for it again. It fails on
  four counts. A guard succeeds by producing no event, so preventive rules report as
  unused forever. It is self-report about the model's own cognition, which
  `writing-skills` already distrusts for the far easier question of what a rep *read*.
  The bias runs the wrong way, since loud rules leave traces and silent guards do not, so
  it would nominate for deletion exactly the hard-won guards that constitute the growth.
  And it adds a shared write target, a hazard class this kit has hit three times.
- **Skill trigger frequency as a Stop anchor.** `attributionSkill` is real and populated,
  so "which skills never load" is cheap to measure and cannot justify a cut: all 18 kit
  skill name+descriptions are ~3.6% of a 48,197-token standing total, the median skill is
  ~0.18%, and cache-read bills at 0.1x on top. A rarely-used skill is cheap to keep, and
  several are rare because they are rarely useful, which is correct. A skill that never
  loads is also ambiguous between two opposite diagnoses wanting opposite fixes.
- **Description-size trimming.** The live standing cost is description bloat rather than
  skill count, `standing-context-audit.js` already flags it, and it has a live candidate
  (`cold` at ~175 tokens, 2x the median). Real, adjacent, and not this effort.
- **Taking any retirement this effort surfaces.** S2 defines the route and S3 may find a
  candidate. Recording it is in scope; cutting it is not. This effort proves compression.
- **What the kit owes a second concurrent session.** Split to
  `docs/plans/kit-concurrent-sessions_spec_v1.md` (Proposed) so it cannot silently annex
  this one.
- **Changing the capture bar, the kaizen SessionStart block, or the pass-offer predicate.**

## Open Questions

- Whether the instrument covers `references/` files and `assets/CLAUDE.md` as well as
  `skills/*/SKILL.md` and `agents/*.md`. Decide in S1 on what the sweep costs. Owner: S1.
- Whether a file with two or three sections can have an outlier at all, or whether the
  outlier rule needs a minimum section count to mean anything. Owner: S1.
- Whether `docs/take-stock.md` needs a `curating-docs` archive path once it grows.
  Deferred until it has more than a handful of entries. Owner: deferred.

## Execution notes

- **Do not run arms against a repo another session is working.** Two sessions on
  2026-08-15 produced three distinct confusions in an afternoon, and the working tree is
  the leak surface rather than git history, since reviewers run `git status`.
- **Clear the inbox before each arm and read it after**, counting whatever is in it as
  those reps' output. The global posture rule points every rep at that same file. The
  inbox currently holds two notes; they are untriaged friction and are not this effort's.
- **Keep the draft wording out of the repo, the scratchpad, and the RED prompt** until
  the arm is done. The scratchpad is the worst of the three, because fixtures point
  subagents into it by construction.
- **Re-measure before quoting.** The figures in the Why section moved materially in the
  twenty-six hours the stub sat parked.

## Related

- `plugins/claude-kit/skills/kaizen/SKILL.md` - the pass this extends.
- `plugins/claude-kit/skills/writing-skills/SKILL.md` - the measured subject, the file
  whose growth is the evidence, and the target of S3.
- `docs/backlog.md` - item 11 for the closure event Continue feeds, item 18 for the
  session-start test debt S4 must not add to, item 20 for the record-and-decline posture
  S1's gate uses, item 22 for why the cost argument is wall clock rather than tokens.
- `plugins/claude-kit/skills/cross-project-memory/SKILL.md` and its decay nudge - the
  advisory, human-adjudicated posture the take-stock nudge copies.
- `plugins/claude-kit/hooks/branch-reaper-nudge.js` - the git-using SessionStart nudge in
  its own hook file, and the precedent decision 5 rests on.
- `tools/standing-context-audit.js` - the measurement posture S1 copies, the source of
  the standing-cost figures, and the unrun tool that decision 9 argues from.
- `docs/plans/kit-concurrent-sessions_spec_v1.md` (Proposed) - the concurrency findings
  split out of this stub.
- `docs/plans/design-skill_spec_v1.md` (Proposed) - independent arrival at an adjacent
  worry from the other direction, predicting "a design corpus accreting behavior claims
  among the taste rules unnoticed". That is this spec's problem inside a style skill, and
  it is also a fourth skill proposed while nothing retires a third. Note the overlap when
  either is executed; neither absorbs the other.

## Chapters

(none yet)
