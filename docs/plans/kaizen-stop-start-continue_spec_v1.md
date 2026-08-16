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
| Know it works before you trust it | 169 | **15** |
| When a local RED is not available | 162 | **8** |
| When you meet a counter-case to a rule | 46 | 5 |
| Match the form to the failure | 27 | 2 |
| The description states the trigger, not the workflow | 15 | 1 |
| Anatomy | 14 | 1 |
| When a skill earns its place | 12 | 1 |
| Antipatterns | 10 | 2 |

Three sections were written once and never touched again, and five carry two commits or
fewer. Two carry 70% of the file and 23 commits of sequential patching between them.
That is the accretion signature, and one command finds it.

**These figures are S1's tool output, and they replace two earlier rounds of hand
measurement.** The spec was first written from ranges that excluded each heading line,
inconsistently, and claimed four write-once sections where there are three. Correcting it
from a throwaway probe script fixed most of that and introduced a fresh error on the last
section, counting `Antipatterns` as 11 lines because `split('\n')` yields a trailing empty
element and only a to-end-of-file range is exposed to it. The tool caught that too. So the
instrument's first act was to correct, twice, the numbers that motivated building it,
which is the outcome to want; none of it moves the finding.

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

Corpus: `plugins/claude-kit/skills/*/SKILL.md`, `agents/*.md`, `skills/*/references/*.md`
and `assets/CLAUDE.md`. The last two were an Open Question this spec assigned to S1 and
are answered below.

Method: parse `##` headings into line ranges, run `git log -L <range>:<file>` per
section, and report lines and commits for each, **ranked by their product** and showing
both components plus the span.

**It measures HEAD, not the working tree, and that is a correctness fix rather than a
preference.** `git log -L` silently clamps a range whose end runs past the file's length
at HEAD and exits 0; only an out-of-range start errors. So parsing sections from the
working tree while counting commits against HEAD produces a confident undercount, with no
`n/a` and no note, in exactly the mid-edit state a maintainer is normally in. Taking both
from one snapshot via `git show HEAD:<path>` closes it, and it is the right meaning
anyway, since churn is a property of history. The cost is that reported line counts are
HEAD's and can differ from what an editor shows mid-edit, which the report discloses.

**It ranks; it does not flag.** An earlier draft had it flag outliers on commit count
against the other sections of the same file, mirroring `standing-context-audit.js`. That
was measured before dispatch and is wrong on both halves. Commit count alone cannot tell
accretion from healthy correction: `executing-work`'s "Section loop" has 15 commits in 25
lines and `writing-skills`' "Know it works" has 15 in 169, and only the second is the
condition this effort is about. And every thresholded form of the rule flagged 27 to 65
of the kit's 146 sections, so the only way to reach a readable set was to tune the
constant until it fit, which is what the pre-registered budget existed to prevent.

The product needs no constant, separates cleanly on the real data (2535, 1296, then 507),
and behaves correctly at the edge: a large section written in a single commit ranks low,
which is right, because written-large-once is not accretion. A rank is also a better fit
for the no-judgment rule below than a flag, since a flag is a verdict and a rank is a
measurement.

**S4 must settle its own predicate rather than inherit one from here.** A nudge has to
decide whether to speak at all, which a ranking does not answer, and the invented-constant
hazard is the same one this section just hit.

**The output is counts and locations only.** It carries no recommendation, no ranking by
"should be cut", and no verdict on any section. The adjudication is Daren's at the
section close, and a tool that pre-judges would be handing him its own conclusion to
ratify.

Acceptance criteria:
- Run over the current repo, it reproduces the `writing-skills` figures in the Why
  section above exactly: 169/15, 162/8, 46/5, 27/2, 15/1, 14/1, 12/1, 10/2. That table
  now holds the tool's own output rather than the hand measurements it corrected, so the
  criterion is an equality rather than a tolerance.
- The ranking places those two sections first and second across the whole kit, and
  `kit-adoption-pass`' "3. The ladder" (84 lines, 2 commits) ranks below both, which is
  the falsifiable check that the measure reads accretion rather than size.
- A file with no `##` headings, a file absent from git history, and a repo with no git
  at all each produce a degraded report rather than a throw, and the exit code is 0.
- The report text contains no word recommending an action on any section, verified by
  reading it.
- Runtime over the whole kit is under 5 seconds.
- A pure-function unit test pins the heading-to-range parsing, including a file whose
  last section runs to EOF and a file with a `##` inside a fenced code block.
- The report shows the top 15 by rank plus the total section count, which is a
  report-length choice rather than a claim about where accretion stops.

**On the pre-registered flag budget, which this section discharged rather than met.** The
spec pre-registered "the outlier rule flags no more than 10 of 158 sections" so the rule
could not be fitted to its own output. Measured before dispatch: the real count is 146
sections, every thresholded rule flagged 27 to 65, and the only factor that fit the budget
was one chosen because it fit. The budget therefore did its job by falsifying the rule
rather than by being satisfied, and the answer was to drop thresholding, not to retune it.
Recorded here because a later reader will otherwise see a pre-registered number that no
shipped criterion mentions and read it as quietly dropped.

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

**The predicate, settled in the main thread 2026-08-16 rather than delegated.** The nudge
speaks when **any prose section has been patched since the marker sha**, and reports how
many sections were touched plus the current top three by rank. Nothing else.

That is the literal statement of the condition this effort exists for, "prose has changed
since anyone last looked at it whole", and it carries no invented constant, which is the
trap S1 walked into and out of. It self-silences by construction, since a take-stock
writes a fresh marker and the count returns to zero. Two rejected alternatives, recorded
because both are tempting. Firing when a section **enters** the top band is quieter and
misses the case that matters most, the already-worst section getting worse, since a
section cannot enter a band it already tops. And any "fires above N commits" form
reintroduces exactly the tuned constant S1 had to abandon.

With no `docs/take-stock.md` at all, there is no marker and the nudge fires saying no
take-stock has ever been recorded. That is the correct first-run behavior, not an edge
case to suppress.

`plugins/claude-kit/hooks/take-stock-nudge.js`: SessionStart, kit-repo gated, git-based,
fail-open. Reads the last sha from `docs/take-stock.md`, counts patched prose sections
since it, and emits one block per the predicate above. Registered in
`hooks.json` under `startup|resume`, matching `branch-reaper-nudge` rather than
`session-start.js`, since a compact resume should not re-nudge. The block reports the
measurement and points at the `kaizen` skill, says nothing about what to cut, and closes
"Reminder, not a blocker."

Acceptance criteria:
- A non-kit repo and any git failure each produce no output and exit 0.
- Zero prose sections patched since the marker produces no output and exit 0.
- One or more patched produces exactly one block carrying the touched-section count and
  the current top three by rank.
- A missing `docs/take-stock.md` produces the first-run block rather than silence.
- The block's text contains no recommendation about what to change, verified by reading.
- `test/take-stock-nudge.test.js` pins all five conditions above, extending the existing
  temp-cwd harness rather than starting a new one.
- The hook completes in under 1 second on this repo, measured and recorded in the
  Chapter, with every git call carrying an explicit timeout.

Execution mode: delegate-capable.
Tests: the five conditions above, as durable tests. `docs/backlog.md` item 18 is about
this hook family shipping unpinned; this one does not.

**The shared parser, and why S4 cannot run beside S1.** The hook and the tool both need
to split a markdown file into level-2 section ranges. The tool lives outside the packaged
payload and the hook inside it, so a plugin user receives `hooks/` and never `tools/`,
which fixes the direction: the shared code lives at
`plugins/claude-kit/hooks/accretion-lib.js` and `tools/accretion.js` requires **inward**
to it, mirroring how `session-start.js` requires `memory-lib.js`. S4 therefore moves the
parser S1 wrote and edits S1's file, so the two sections are not disjoint and S4 runs
after S1 closes rather than inside its review window. Their git queries genuinely differ
(all-time commits per section for the tool, patched-since-marker for the hook) and stay
separate; only the parser is shared.

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

- ~~Whether the instrument covers `references/` files and `assets/CLAUDE.md`.~~
  **Answered in S1, 2026-08-16: yes, both are in.** Measured cost is 39 more sections over
  792 lines for roughly +0.3s, so the deciding factor the question named is negligible.
  The tempting defence, that a `references/` file is on-demand rather than standing
  context, is refuted by this spec's own cost model above: the cost is reader attention
  and operator wall clock, not tokens, and a 251-line accreted style reference costs a
  reader exactly what a 251-line SKILL.md section costs. `assets/CLAUDE.md` is the
  stronger case still, being the shipped global rules file that loads in every session in
  every repo. The first pass resolved this in the negative by omission, because the
  dispatch brief did not carry the question; the adversarial review caught it.
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

## Standing Brief Amendments

Folded into every later dispatch in this effort.

**A1. This repo now answers the arms' questions, so every fixture stages outside it.**
Verified 2026-08-16 after the plan landed: `docs/plans/kaizen-stop-start-continue_spec_v1.md`
and `docs/README.md` both carry "claim inventory", "followability probe", and the whole
compression design in prose. A rep handed a compression task with repo access can grep
its way to the conclusion it was supposed to derive, which is the priming hazard
`writing-skills` documents for an open question this repo has parked. This is not a
mistake to undo: the plan has to be committed to be durable, and the leak arrives with
it. So every RED, GREEN, third-arm and probe rep in S2 and S3 gets a fixture **staged
outside this repo, with identifiers nothing on this disk already answers**, and what each
rep actually opened is read before its result is counted.

Note that the live kaizen inbox already holds this exact friction, filed 2026-08-15
against `brainstorming` step 7. This effort hitting it live is confirming evidence for
that note, not a new one, and it is not this effort's to fix.

**A2. No arm runs while an implementer is live in the tree.** A dispatched implementer's
untracked and staged files show up in any rep's `git status`, and in this effort those
files are themselves about measuring accretion. Serialize: implementer, then arms.

**A3. A header comment that states a guarantee gets held to the code, not to the
intent.** S1's first round drew three separate findings of one class: "every git call
carries this timeout, so a hung git can never hang the tool" (true of the calls, false of
the tool, whose file read was unbounded), "two runs over an unchanged tree print
byte-identical output" (false, the report carries a fresh timestamp), and "lives at repo
root" (it lives in `tools/`, and the root resolution depends on that nesting). Three
instances in one section is the workflow generating the defect rather than an implementer
slip, so every later dispatch carries the rule: **a comment asserting a property must be
one you have checked against the code as written, and a scope word like "every" or
"never" is the part to check.** The kit's own security model already says that where code
and comment disagree, the comment is the bug.

## Chapters

### Chapter 1 - 2026-08-16
Completed: Section 1, The accretion instrument
Implemented By: implementer-opus, two dispatches (build, then one consolidated review-fix round)
Metrics: 1 review round, 3 reviewers (adversarial, blind, security); NEEDS_CONTEXT 0; escalations 0; advisor on, consulted twice during design and not during execution

Decisions / Surprises:
- **The pre-registered flag budget falsified the rule before any code was dispatched.** The spec had the tool flag commit-count outliers per file. Measured first: commit count alone cannot separate accretion from healthy correction (`executing-work :: Section loop` is 15 commits in 25 lines against `writing-skills :: Know it works` at 15 in 169), and every thresholded form flagged 27 to 65 of 146 sections. The only factor that fit the budget of 10 was one chosen because it fit. **The tool now ranks by lines x commits and does not flag at all**, which needs no constant and serves the no-judgment rule better, since a rank is a measurement and a flag is a verdict. The budget did its job by falsifying the rule rather than by being met.
- **The corpus Open Question was resolved in the negative by omission.** The spec assigned "does this cover `references/` and `assets/CLAUDE.md`" to S1; the dispatch brief did not carry it, so the first build simply excluded them. The adversarial reviewer caught it and measured the answer: 39 more sections over 792 lines for about +0.3s. Both are now in. `assets/CLAUDE.md` is the strongest case in the whole corpus, being the shipped global rules file that loads in every session in every repo. **The defect was in my dispatch, not the implementation.**
- **`git log -L` silently clamps a range whose end runs past HEAD** and exits 0; only an out-of-range start errors. Ranges were parsed from the working tree while commits were counted against HEAD, so any uncommitted edit produced a confident undercount with no `n/a` and no note, in the mid-edit state a maintainer is normally in. Found by the blind reviewer alone and reproduced in a scratch repo. The tool now takes ranges and history from one snapshot via `git show HEAD:<path>`, which is also the right meaning for a churn tool.
- **A git config could silently zero the entire report.** `%h` with a `/^[0-9a-f]{7,}$/` counter means `core.abbrev = 4` in a user's `~/.gitconfig` yields every row at 0 commits, ranked by line count alone, with the header still claiming a product. Found independently by the blind and security reviewers. Fixed at the class with `%H` and a null (not zero) on a total miss, so "no answer" and "zero commits" stay distinguishable.
- **The instrument corrected the measurements that motivated building it, twice.** The spec's original table used heading-exclusive ranges inconsistently and claimed four write-once sections where there are three. Correcting it from a throwaway probe fixed that and introduced a fresh off-by-one on the last section only (`split('\n')` leaves a trailing empty element, which only a to-EOF range is exposed to), reported back as a DONE_WITH_CONCERNS. The Why table now holds tool output. None of it moved the finding.
- **Degradation evidence is manual, not durable.** The spec deliberately declined a fixture git repo as costing more than it pins, so the four degradation paths were verified by hand runs and nothing in the suite will catch a later regression in them. Recorded so the criterion's evidence is traceable rather than assumed.

Review Findings: 5 Major, all fixed. Adversarial: corpus scope (above), honest-limits naming the easy exclusions and not the contested ones, and acceptance criterion 1 not literally passing against a stale spec table. Blind: the silent clamp and the abbrev zeroing. Security verdict CLEAR with 4 Minors, all trusted-workspace bounded and all fixed (unguarded `readFileSync` that a FIFO wedges, `killSignal` defaulting to SIGTERM so the timeout was advisory, an `*.md` symlink followed out of the repo, raw heading interpolation). Roughly a dozen further Minors fixed: pipe escaping in table cells, a silently dropped skill directory, the creating-commit floor now disclosed, the 15-row cutoff now disclosed as a report-length choice, a line-span column so the report gives locations, git stderr captured into the `n/a` note, the top-level catch writing `err.stack` to stderr, `process.exit(0)` removed, three comment overclaims corrected, a tautological CRLF test replaced with literal expectations, and `rank()` exported and pinned. **Accepted and not fixed:** no aggregate wall-clock budget across the git calls (worst case is theoretical at 146 x 15s; observed runtime is 1.66s on a manually invoked CLI where a hang costs a Ctrl-C), and no heading sanitization beyond the pipe escape (the content is the kit's own prose, already verbatim in model context).

Evidence: 15/15 tests pass, both new tests watched failing first. 185 sections across 33 of 33 files in 1.66s. `Know it works` 169/15 and `When a local RED` 162/8 hold ranks 1 and 2. Under `core.abbrev=4`, git emits 4-char shas while the tool's output is unchanged. Judgment-vocabulary scan of the emitted report returns only the "edits nothing and recommends nothing" disclaimer.

Next: Section 2, the compression bill in `writing-skills`
Commit Model: Commit-and-Push
