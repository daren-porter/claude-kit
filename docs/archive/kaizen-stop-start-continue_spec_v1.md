# Stop, Start, Continue: giving Kaizen an Input That Is Not Friction

Status: Complete
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
or to retirement.

**The proof was to be that `writing-skills` ends this effort shorter than it started,
and it is not met: 514 against 467.** See Chapter 3. The bar was also mis-specified,
since 58 of the 68 lines the effort added are the new compression section, which is out
of scope for compression by construction. What the effort did produce is the kit's first
net-negative markdown commit in 165 file-events (`1e5db4e`, S3's compression), four
recorded retirement candidates, and the finding that this file is claim accretion rather
than prose accretion, so retirement and not compression is the lever past it.

## Why this exists

The kaizen loop has one input channel and it only ever reports that something is
missing or wrong. Every note in `~/.claude-kaizen/notes.md` is friction by definition;
the capture bar says so explicitly. The fix for a friction report is nearly always more
words.

**The whole-history measurement, taken 2026-08-16 at `90769cc`, before this effort
landed anything, needs no judgment call to read:**

| | |
|---|---|
| Markdown file-events across `plugins/claude-kit/` history | **163** |
| ...net-negative | **0** |
| ...net-zero (one-for-one line swaps) | 44 |
| ...net-positive | 119 |
| JS file-events | 51 |
| ...net-negative | **10** |

No `.md` file in this kit had ever net-shrunk in a commit. Not once, in 163 chances.
Code had, ten times, and one of those ten was itself a kaizen pass (`ae9dc10`,
2026-08-07, minus 38 lines from `stop-docs-hygiene.js`). **So the pass could subtract. It
had never been pointed at prose.**

**Re-measured at S4's close (`01e3c1b`): 165 markdown file-events, one net-negative.** That
one is `1e5db4e`, S3's compression of `writing-skills` at 229 insertions against 250
deletions, and it is the first in the kit's history. Both reviewers caught a copy of the
stale figure that had reached the shipped `kaizen` wording, which is the second instance
of that class here and the reason the execution notes below carry "re-measure before
quoting".

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

**1. Both halves, compression named first.** *(Amended 2026-08-16 after Chapter 3: the
ordering below is still right for where to look, and its stated reason is now wrong. Measured,
compression is not where the mass is; the two most accreted sections are claim accretion and a
hard pass bought 6.5% against 18.5% wanted. Retirement is the lever, and compression's standing
value is that it generates retirement candidates, which it did, four of them.)* Stop covers two different operations.
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
what makes it worth more than the probe. **A gap in the mapping is what routes the change**,
and the shipped wording splits that by direction, which this decision originally did not: a
claim in the longer text with nothing opposite it is restored and recorded as a retirement
candidate while the rest stays a compression; a claim only in the shorter text is new wording
that is cut or pays what a new rule owes; a trigger that moved is a rule change whatever the
line count says. Either way the boundary is observable rather than a judgment the compressing
session makes about its own work. **Amended 2026-08-16 after both reviewers found the
single-direction remedy was a no-op for an added claim and meant "revert" for a moved
trigger**, so the permissive reading shipped an unarmed rule change under a compression label.

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
- Run over the repo **at S1's close (`4b115c0`)**, it reproduces the `writing-skills`
  figures in the Why section above exactly: 169/15, 162/8, 46/5, 27/2, 15/1, 14/1, 12/1,
  10/2. That table holds the tool's own output rather than the hand measurements it
  corrected, so the criterion is an equality rather than a tolerance. **Sha-stamped after
  the QA pass**, which correctly noted that S3's compression later moved the first two
  rows to 164/17 and 155/10, making an undated "current repo" reading of this criterion
  fail against the effort's own legitimate work.
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
- The claim unit S2 defines is **stated before the compression starts**, and recorded
  durably in git, so the granularity is not chosen by whatever makes the mapping come out
  even.
- A claim inventory mapping **every** claim in the before text to a location in the after
  text, with no unmapped before-claim, likewise recorded durably in git.

  **Amended 2026-08-16 after the QA pass.** Both criteria originally said "in the
  Chapter". The artifacts shipped to `.kit/`, which is gitignored, so neither was durable
  and QA failed both on their literal terms; the shipped `writing-skills` bill says a
  compression does not close until the unit, the inventory and the probe output are
  recorded where the gated path records its own, which makes this a violation of the rule
  this effort itself wrote. They now live at
  `docs/archive/kaizen-stop-start-continue_s3-inventory.md`, committed, with Chapter 3
  pointing at it. 347 lines inline would drown the Chapter, and the rule's purpose is that
  a later reader can check the artifact rather than a description of it, which a committed
  sibling serves. That is a reading of the purpose over the letter and is recorded as such
  rather than presented as compliance. An unmapped claim means the
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

`docs/take-stock.md`: dated entries under a literal `## YYYY-MM-DD - <40-hex sha>`
heading, naming what was compressed with pointers and what was spared with the reason it
is load-bearing. The most recent entry's sha is the nudge's marker. **Amended 2026-08-16,
during S5**: this originally said each entry names the sha *examined*, which both reviewers
showed is the one sha that cannot work. The nudge measures marker-to-HEAD, so naming the
pre-pass sha makes it count the pass's own edits forever, in exactly the case the mechanism
exists for. The heading names the commit holding the prose as the pass left it, which forces
an ordering: prose changes land first, then the record entry follows in a commit touching no
corpus file.

**The predicate, settled in the main thread 2026-08-16 rather than delegated.** The nudge
speaks when **any prose section has been patched since the marker sha**, and reports how
many sections were touched, and nothing else. **Amended 2026-08-16, during S4.** This originally said the block also carries the current top three by rank, and the hook was built that way. It cost 1.69s at every emitting session start, because naming the top three across the kit requires the full 186-section sweep, which decision 4 puts in the tool and not the hook and which criterion 7's under-one-second budget forbids outright. So the ranking came out of the block and the block points at `tools/accretion.js` instead. Runtime went 1.67s to 0.02s, and the emitting and silent paths became indistinguishable because the same single `git diff` decides both. The adversarial reviewer noted a narrower reading was available, top three among the *patched* sections, at roughly 60ms typically but 2.1s in the worst case measured; that is unbounded in the wrong place for a session-start hook, so it was not taken.

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
- A non-kit repo produces no output and exit 0.
- **Amended 2026-08-16, during the finishing pass.** This originally read "a non-kit repo
  and any git failure each produce no output and exit 0", and the docs curator flagged that
  the shipped hook is deliberately better: collapsing every failure into silence made an
  orphaned marker sha after a shallow clone byte-identical to "nothing changed", which the
  blind reviewer caught at S4. The hook now has five states, four of which speak: the count,
  an orphaned-marker line, a failed-measurement line, and a no-marker block that splits
  `ENOENT` from everything else. Git being unable to answer is still silent; git *answering
  that the marker does not exist here* is not. The criterion was amended for the ranking
  removal and not for this, so an audit against its literal text would have flagged working
  code.
- Zero prose sections patched since the marker produces no output and exit 0.
- One or more patched produces exactly one block carrying the touched-section count, and no
  ranked rows. The test that pins this asserts the block's exact line count, so a
  reintroduced ranking fails it in any format.
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
- ~~Whether a file with two or three sections can have an outlier at all, or whether the
  outlier rule needs a minimum section count to mean anything.~~ **Mooted: S1 dropped
  thresholding entirely, so there is no outlier rule for a minimum count to qualify.**
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

### Chapter 2 - 2026-08-16
Completed: Section 2, the compression bill in `writing-skills`
Implemented By: main session (behavior-shaping prose; arms run against fresh `general-purpose` reps)
Metrics: 12 arm reps over 4 arms (1 discarded fixture, RED 3, GREEN 3, boundary 3); NEEDS_CONTEXT 0; escalations 0; advisor on, consulted once before the arm design and its four corrections all adopted

**The fixture had to be rebuilt once, and the first build is recorded because the defect is instructive.** Version 1 gave the isomorph guide a validation bar reading "hand the changed section to two engineers who have not seen it, watch them work, record hesitations." That is a followability probe. So in that fixture, paying the full bar and running the probe were the same act, which collapses the exact distinction the RED exists to test. The real bar's separating feature is its **control half**: RED requires demonstrating the failure *without* the wording. Version 2 gave the bar a paired-trial shape with that control arm, and the harm appeared immediately. This is the confounded-fixture failure the live inbox note of 2026-08-15 describes, met in my own work; it is that note's territory and not a new one.

**RED: 3 of 3 fired**, on the pre-registered outcome that the shipped bar leaves a compression unable to reach a coherent bill. The finding is sharper than the spec predicted. The harm is not that arms are *expensive* for a compression, it is that a compression **cannot satisfy them at all**, because the control arm has nothing to stage: the current wording makes all the same claims, so there is no failure to demonstrate. Verbatim, from the reps' own returned output:

- Rep A: "**If Pair A hits no failures, the change does not proceed** and Section 4 stays as it is. I stated that plainly rather than predicting the trial would pass."
- Rep B: "if pair A does not fail, this rewrite does not proceed, and the finding that ships is that length is not what causes the skipping."
- Rep C: "None of that can be produced from a machine, so the rewrite is written and explicitly not cleared."

Rep A also considered and refused the escape hatch this effort's own draft rests on, recording that it "deliberately avoided the two arguments that would have talked it past the gate: 'it's instruction-preserving so it isn't really a content change' and 'the new version reads better'." That refusal is correct against the shipped bar, which gives no basis for either, and it is why the carve-out has to be written rather than reasoned to.

**The unplanned finding, which changed the wording: an inventory with no stated unit is not an instrument.** All three RED reps built a claim inventory unprompted and each caught a real defect with it. But on identical text they counted **20, 13 and 24** claims. No two were comparable. That settled the spec's open worry that the unit definition might be decoration.

**GREEN: 3 of 3 passed** against the pre-registered bar (inventory at the stated unit rather than an invented one, no blocking on the full arms, the probe specified rather than manufactured). Two reps produced evidence the wording was doing work rather than being recited:

- Green 1 caught itself violating the rule it was following: "I caught myself settling the unit while checking a draft (the exact failure the new section polices), so I re-derived the inventory from the source lines alone, which added an item."
- Green 2 reverted one of its own improvements because "it was the single row a reviewer could use to argue this isn't a shortening, and that risk isn't worth the wording win." That is the routing rule operating.

**Two rep-derived additions were folded in and then tested, rather than shipped on the strength of having been suggested.** Green 3 built a verbatim trigger column on its own reasoning that "this is what actually discriminates a shortening from a rule change; the instruction count does not", which is sharper than the draft's clause. Green 1 wrote a tie-break the draft lacked ("when in doubt, split") and returned 20 where Green 3, lacking it, merged rows and returned 17. Both went into the wording, and the boundary arm carried the augmented text.

**Boundary third arm: 3 of 3 routed correctly.** Per the advisor's correction, the arm was not "a genuine new-claim change still owes arms", which is close to unfalsifiable, but a change that *looks* like a compression and is not: a contractor rewrite claiming "nothing taken out" with one instruction deleted whole and one trigger widened. All three reps built the inventory, found the losses, and routed the change back to the full bar. All three found more than was planted; two independently observed the trigger had moved in **both** directions. Rep 3 produced the strongest followability evidence in the effort by reporting a violation against itself: it "fixed the instruction unit after reading the rewrite, which the guide warns against, as a known weakness in my own artifact."

**A pre-registration I got wrong, recorded rather than quietly dropped.** I predicted the augmented wording would converge counts to 20 +/- 1; the boundary reps returned 22 and 22. The prediction was badly set, because "when in doubt, split" mechanically raises the count by design, so the number should drift up and the meaningful measure is the spread, not the absolute. The spread is the real result: 20/13/24 unguided, 20/20/17 with the unit, 22/22 with the tie-break.

**Isolation, verified rather than assumed.** All 12 reps ran against fixtures staged outside the repo with de-identified content (a fictional logistics company's runbook guide), per Standing Brief Amendment A1, since the committed plan doc now answers the arms' own questions in prose. The kaizen inbox was parked with a self-describing header naming its restore target and closing condition, held empty across every arm and checked after each, and restored afterward: **0 inbox writes across all 12 reps**. Every fixture was byte-identical to base at close, so no rep edited the guide, which is itself part of the RED finding. The repo was clean at every check. RED-side arms (RED and boundary) ran serially; GREEN ran parallel with one fixture copy per rep; GREEN fixtures were quarantined before the boundary arm. One known fixture flaw was left uncorrected mid-arm to keep the three reps comparable: a duplicated `## How this guide is changed` heading from my assembly, which five reps flagged as an aside and none was confused by.

**The paired review found five Criticals that 13 arm reps had passed, and the reason is structural.** The arms ran against a de-identified isomorph, per Standing Brief Amendment A1, so **no rep ever saw `writing-skills` itself**. They could test whether the wording is followable under a task; they could not test whether it contradicts the file it lands in, and every Critical lived there. That is a real limit of isomorph-based arms, and it is the argument for the paired review rather than a criticism of it. Recorded here because the natural next inference, that 13 passing reps means the wording was sound, is wrong.

The five, and what each would have cost:

1. **The probe passed by construction** (blind). Reps load skills from the installed plugin cache. A compression by definition leaves a longer version making *all the same claims* on disk, so a probe rep reaching the section by name applies the old wording correctly and passes whatever the new text does. The reviewer verified a 467-line pre-compression copy in the cache. This invalidated S3's probe as originally specified.
2. **Two routes gave opposite verdicts** (blind). The existing text routes a clean RED into the four answers, where a compression lands on "could not be constructed", which fails the gate without a substitute. Read the arms section first and you are blocked; read the new one first and you proceed.
3. **The wording told the agent to halt** (blind Critical, adversarial Major). "A RED that cannot fire is not a gate, it is a stop" was meant descriptively, but every other bolded "stop" in the file is an imperative to abandon the change. It licensed stopping the very work the section authorizes, and it lifted cleanly out of context.
4. **The narrowing was never made at the rule it narrows** (adversarial Critical, blind Major, found independently by both). Line 133 still read "Two paths lead around it" over a closed set of two, and the word compression appeared nowhere before line 260. The file predicts this miss in its own text: GREEN supplies wording in-prompt, so the arms structurally cannot detect a placement defect.
5. **The claim unit was blind to the loss of provenance** (adversarial Critical, and the worst of the five). "An example, a restatement, and a reason given for a claim already listed are not claims of their own" would have licensed stripping every dated incident, locator and provenance clause, producing a complete inventory with zero unmapped claims while converting properly admitted rules into antipatterns by this file's own definition. Not hypothetical: S3's mandatory target is 169 lines that are largely dated incident narrative.

**REFACTOR arm on the revised wording: 3 of 3.** The fifth Critical's counter is a behavior claim, so it was tested rather than reasoned about. A fresh fixture salted the accreted section with five dated incidents and gave the guide a rule making an incident-stripped requirement unevidenced. All three reps preserved all five, and two named the trap in their own words: "A naive shortening strips INC-4471, INC-4602, INC-4718 and the 2024-08 near miss as flavour", and "Most of Section 4's length is incident narrative, which is exactly what a naive 'make it shorter' pass would cut." Rep 1 also operationalized the probe-isolation Critical better than the shipped wording states it, observing that the longer version stays published until the change ships, so the read-through needs a staged copy with the published one made unreachable for the duration. All three entered the path conditionally on the mapping closing, and one caught its own arithmetic error before delivering.

**A discipline lapse, recorded because it held by luck rather than procedure.** The kaizen inbox was restored after the first four arms and I began the REFACTOR arm without re-parking it, against `writing-skills`' own clear-before-an-arm rule. No damage: the count stayed at exactly the two restored notes throughout, so no rep wrote and there was nothing for a later rep to read. Attribution survived only because the baseline was known exactly.

Arm totals for this section: 13 reps over 5 arms (1 discarded fixture, RED 3, GREEN 3, boundary 3, REFACTOR 3). Fixtures byte-identical to base at every close; repo clean at every check; 0 inbox writes across all 13.

**Round 2 confirmed the three Criticals closed and found one more, plus four Majors, mostly where my own fixes were incomplete.** The new Critical, found by both reviewers independently: **the disposal remedy was direction-blind.** Having mandated mapping both ways, "restore it to the shorter text and record it as a retirement candidate" is a no-op for a claim that is only *in* the shorter text, and means "revert" for a moved trigger, so the permissive reading ships an unarmed rule change under a compression label. Disposal is now split three ways by direction, and only the dropped-claim case stays on the path. The Majors: I amended the pointer routing a compression away from the four answers but never the four-answers list itself, so an agent entering there still got the opposite ruling; I named the branch wrong in two places, calling it a clean RED when a clean RED is did-not-reproduce and this is could-not-be-constructed; the probe's position relative to persisting was unstated, which the isolation rationale depends on; and "every claim was admitted on its own evidence and its RED already ran" is **false for this very file**, since gated-path wording never had a RED fire and counter-case wording owes no arm.

The adversarial reviewer also supplied the fix for round 1's weakest patch at zero net lines: the provenance carve-out was a prohibition with no instrument, and attached content is now a **third column in the inventory row**, so stripping a rule's dated incident shows as an empty cell rather than as nothing.

**A limit on the arms, recorded rather than papered over.** RED, GREEN and the boundary arm carried a claim-unit definition that round 1's fixes then changed, so the 20/13/24 and 20/20/17 and 22/22 spreads characterize a unit superseded after those arms closed. The REFACTOR arm did carry the provenance rule and passed 3/3, so the changed half is tested; the tie-break and trigger-column halves are not re-measured. Accepted as a stated limit rather than re-running four arms.

Review Findings: 6 Critical and 12 Major across two reviewers over two rounds, all addressed. Deliberately not addressed: "cost chooses none of them" at line 134 is contestable for this path, since the spec's own rationale for it is cost; the pre-existing "the obligation appears three times in this section" count was already off before this change; and the `kaizen` skill's commit-message artifact home does not yet mention compression, which is handed to S5.

Next: Section 3, the first compression, on `writing-skills` itself
Commit Model: Commit-and-Push

### Chapter 3 - 2026-08-16
Completed: Section 3, the first compression, on `writing-skills` itself
Implemented By: implementer-fable (compression and inventory); main session (the probe, which an implementer cannot run, having no Agent tool)
Metrics: 1 dispatch, DONE_WITH_CONCERNS; 3 probe reps; NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted this section

**Acceptance criterion 5 fails, and it is the most useful result the effort has produced.** The file went 535 to 514 against a target of under 467. The shortfall is 48 lines and it is structural rather than a matter of effort. Every other criterion passed.

**The finding: the accretion in these sections is claim accretion, not prose accretion.** The measurements behind it:

- Pass 1 cut argumentation only, for 3.4% of section A's characters. Pass 2 cut rationale, framing, restatement and examples much harder: 5.8% on A, 7.3% on B, 6.5% overall. Everything still enumerable as fat totals another 4 to 5%, landing near 490 at best. Clearing 467 needs about **18.5%**.
- The two sections hold **143 claims across 24,598 characters, about 172 characters per claim**, much of that condition and locator rather than prose. A register test bounded the remainder: rewriting the kaizen-inbox paragraph telegraphically saved 55 characters out of 1,020, about half a line, and read worse.
- The file's own disposal rule caps a compression by construction. A claim with nothing opposite it is *restored*, never retired, so once the argument is gone the floor is the claim set.

So compression is the wrong instrument for what ails this file, and the remaining path is retirement, which the file routes to the arms as a separate change.

**The bar was mis-specified by me, and S3 did not miss it.** Of the 68 lines this effort added, **58 are the new `## Compression` section itself**, which is out of scope for compression by construction: it is new, tight, and not accreted. Sections A and B grew about 10 lines net between them. So "end under 467 while keeping the new section" asked S3 to take 69 lines out of the two sections the effort had added ten to, roughly seven times what it put in. The criterion measured the wrong quantity, and the honest version of the thesis is about the *sections* rather than the file.

**What the compression did produce**, and it is not nothing:

- 21 lines out, with **every piece of provenance intact**: whole-file date markers 14 of 14, of which the 13 inside the two compressed sections are unchanged in an identical distribution across four dates (the fourteenth is in the new Compression section, out of scope), and a backtick-locator multiset that diffs byte-identical. The QA pass counted 13 against a claim of 14 and was right about the sections; the figure was a whole-file count that never said so. All nine headings survive in order, and every out-of-scope section is byte-identical.
- A **143-row inventory** built against the longer text before drafting, each row carrying the claim, its trigger verbatim or "unconditional", and its attached content, mapped in both directions. **It is at `docs/archive/kaizen-stop-start-continue_s3-inventory.md`**, with the claim unit stated at its head. It shipped in `.kit/`, which is gitignored, so the artifact this section's own bill requires was not durable and two acceptance criteria failed on their literal terms. The QA pass caught it; that file's header records the fix and why it is a reading of the rule's purpose rather than its letter.
- **The third column earned its place immediately.** It caught two real drops mid-flight: a first draft kept the setups of two claims and cut both conclusions, which were the only halves a reader could act on; and a clause was cut as a restatement when it actually asserts a different fact. Both restored. Six smaller restorations besides.
- **Disposal fired once, in direction 1**, and behaved exactly as the rule says: the claim was restored to the shorter text and recorded as a retirement candidate, and the rest stayed a compression. Directions 2 and 3 never fired.
- **Four retirement candidates recorded and not acted on**, which is design decision 1's prediction coming true: compression is the instrument that generates them.

**A method note worth keeping.** Line counts only compare if wrapping does. The implementer calibrated the original's effective wrap width by unwrapping and re-wrapping each section across a range, then wrapped the compressed text at the conservative end of each bracket, and reported that it did **not** widen the wrap to buy lines, "which would have reached the number without compressing anything." That is the difference between a measurement and a number.

**Probe: 3 of 3.** All three reps reached the two most intricate claims in the compressed section, the rule-change RED ("staging an incident and watching the rep write its fifth confirmation is not a failure, it is compliance with the shipped kit") and the narrowing's third arm in the untouched state. All three also routed correctly *away* from the new compression path, which is the section behaving as a conditional rather than an attractor. The probe fixture was staged outside the repo under a de-identified domain, one copy per rep, and the repo and fixtures were unmodified at close.

**One inherited ambiguity surfaced, and it is not a compression defect.** Rep 2 set the third arm up backwards, then corrected itself by reading further: "it holds the replaced rule in its fixture" reads against the in-prompt mandate that applies to any draft-carrying arm. That clause is original text from `red-for-rule-changes`, untouched by this compression, so the probe passed on its stated bar (the rule was applied and no rep had to ask what it meant) while surfacing a real defect in pre-existing wording. Recorded for the backlog rather than fixed here.

Review Findings: **no paired review ran, and that was an unsanctioned deviation rather than a judgment call.** `executing-work` gives every section a paired review and carves out only a docs-only changeset or a trivial one-line fix; a 250-deletion rewrite of the kit's largest skill is neither, and I treated the inventory and probe as standing in for a review they do not replace. It cost something measurable: the QA pass later failed two of this section's acceptance criteria, the `.kit`-only artifacts, which a review at section close is exactly what catches. Recorded so the precedent is not silently citable. The final adversarial pass caught the skip, and also that the dispatch launching it asserted every section had been reviewed.

Next: Section 4, the take-stock record and the nudge hook
Commit Model: Commit-and-Push

### Chapter 4 - 2026-08-16
Completed: Section 4, the take-stock record and the nudge hook
Implemented By: implementer-opus, three dispatches (build, a cost revision, a review-fix round); main session for `docs/take-stock.md`, the docs updates and the spec amendment, all of which `docs-write-guard` denies an implementer
Metrics: 1 review round, 3 reviewers (adversarial, blind, security); NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted this section

**The design changed mid-section and I failed to record it in the plan doc, which was the review's Critical.** The hook was built to the spec, naming the top three sections by rank in its block, and that cost **1.69s at every emitting session start** because ranking across the kit needs the full 186-section sweep. That contradicts decision 4, which puts diagnosis in the tool and detection in the hook, and it breaks criterion 7's under-one-second budget outright. I removed the ranking and the block now points at `tools/accretion.js`. **Runtime went 1.67s to 0.02s**, with the emitting and silent paths indistinguishable because one `git diff` decides both. I then recorded the deviation in the hook header, `README.md`, `architecture.md` and the tests, and nowhere in the spec, which is the one place the rules make authoritative. Section 4 and its criterion 3 are now amended. The adversarial reviewer supplied the arithmetic rather than a verdict: a narrower reading (top three among the *patched*) would have been ~60ms typically and 2.1s worst case, so it was available and is unbounded in the wrong place for a session-start hook.

**The blind reviewer found the defect that mattered, and it was fatal to the hook's purpose.** A pure deletion produces a zero-length hunk, which the hook attributed to the line *before* the gap. Delete the first section of a file with front matter and that line is front matter, which belongs to no section, so the count came back 0 and the hook stayed silent. **All 33 corpus files have front matter, and cutting prose is exactly what a take-stock pass does**, so the detector was blind to the one change it exists to notice. Verified fixed against a scratch repo: cutting a section now reports 1 where it reported silence. A companion `Math.max(start, 1)` clamp also falsified an invariant the code asserted three lines below it, and is gone.

Six more real defects came out of the same pass: a path containing a space, `"` or `\` silently undercounted (git tab-terminates or C-quotes that header, and `core.quotePath=false` only covers the non-ASCII case the comment anticipated); every failure mode collapsed to silence, making an orphaned marker sha after a shallow clone indistinguishable from "nothing changed"; the first-run sentence asserted two causes where `readMarker` has five; a kit checkout nested inside a larger repo was permanently silent, which needed three changes and not the one flag I briefed; `--no-ext-diff` does not disable textconv, so repo-adjacent config could both execute a command during the diff and empty it; and the stat-then-open idiom was a fresh instance of the superseded form `backlog.md` item 19 tells the sweep not to copy.

**The tests pinned none of those boundaries**, because every fixture path was kebab-case, every fixture change was an insertion, and no fixture began with a heading. The fix round wrote the boundary cases first and **watched seven fail against the old hook**, then ran a 14-mutation battery. Two tests in this section asserted the right sentence for the wrong reason and both were caught by mutation rather than by reasoning, including one where a directory named `take-stock.md` fails at `fstat` rather than `open` so the intended discrimination never ran.

**Accepted and not fixed, recorded as a decision rather than an oversight:** a whole prose file deleted since the marker stays invisible, because the pathspec is HEAD's listing. Counting it means diffing the marker's tree as well, so sections that no longer exist would join a count of current sections and the number would stop meaning one thing. In an effort about subtraction that is the pointed blind spot, and the hook header says so. The narrow case it leaves open is a prose file deleted without a take-stock being recorded; recording one resets the marker anyway.

**Security: CONCERNS, no Critical, nothing exploitable.** The reviewer verified rather than accepted the emission claim, probing the marker regex with U+2028, a lone `\r`, trailing text and a 41-char sha, and confirming a FIFO at `docs/take-stock.md` exits 0 immediately rather than repeating item 19's blocking class. Its highest-ranked finding was documentary and correct: `docs/security-model.md` said "Five surfaces carry kit text to the model" and this makes six, on the artifact later reviews audit against. Fixed, along with the hook lists in `architecture.md` and `README.md`, and with a note that this introduces no sixth sanitizer idiom because it constrains at the parse door instead of scrubbing at emission.

**`docs/take-stock.md` shipped with figures from two revisions, neither of which was the sha it names.** The line counts were the examined text's and the commit counts a third commit's, copied from the spec's stale Why table rather than measured. The adversarial reviewer caught it. Corrected to one reading, stated as such, with both readings given. This is the file whose entire job is to be checkable, so a stale figure there is a broken record rather than a typo, and it is what the plan's own "re-measure before quoting" note exists to prevent.

Evidence: 298 of 298 in `test/*.test.js` (8 new), 15 of 15 in `tools/accretion.test.js`, `tools/accretion.js` output byte-identical to baseline at 186 sections over 33 files, `hooks.json` parses, runtimes 0.02-0.03s emitting / 0.02s silent / 0.01s outside a kit repo / 0.11s on the worst case history offers. The marker is live: with `docs/take-stock.md` recorded at S3's sha, the nudge is silent on this repo, which is the self-silencing property working.

Review Findings: 1 Critical (the unrecorded spec deviation, mine), 8 Major, 12 Minor across three reviewers. All addressed except the deleted-file limit above.

Next: Section 5, the kaizen pass wording
Commit Model: Commit-and-Push

### Chapter 5 - 2026-08-16
Completed: Section 5, the kaizen pass wording
Implemented By: main session (behavior-shaping prose; arms against fresh `general-purpose` reps)
Metrics: 9 arm reps over 3 arms (RED 3, GREEN 3, third arm 3, the last added after QA); 1 review round, 2 reviewers; NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted this section

**RED: 3 of 3, and the cleanest arm of the effort.** Three reps ran an isomorph pass whose gather step reads only friction, with an accreted twelve-rule file sitting in the same directory. All three did careful work: one drafted replacement wording and declined to clear the log with a good reason, one applied a change directly into the accreted file, one added a provenance sentence in that file's own style. **None of them ever considered removing anything.** Two had the file open and were adding to it. That is the harm the spec predicted, and it is not laziness: the pass gave them nowhere to look.

**GREEN: 3 of 3**, against the pre-registered bar (read the agreements as an input, produce a routed verdict, record verdicts including kept). Two reps produced evidence the wording was working rather than being recited. One **resisted a pull my own wording created** and named it: "I did not pad to hit the 'expect removal to be the lever' framing." The other **refused to file eight bulk keeps**, on the grounds that "eight bulk 'well-founded, keep' entries would be the banned close done eight times", and logged them unverdicted instead. A third asked, unprompted, whether an ordinary friction item wanted a *cut* rather than an addition, which is the subtraction question reaching a place I never routed it to. Two reps independently found the Continue-evidence gap from the inside: only 2 of 12 rules record why they exist, which caps what any stocktake can conclude.

**Then the paired review found four Criticals, and Chapter 2's structural limit is why.** The arms ran against an isomorph, so no rep ever saw `kaizen/SKILL.md`. Every Critical was a contradiction with the file the wording lands in, or with the hook it points at. A 3/3 GREEN is not evidence against that class, and both reviewers said so.

1. **The take-stock nudge breaks the file's own inbox invariant.** `kaizen` says "nothing pending means no kaizen, by construction" and calls the SessionStart nudge "the same predicate from the other end". But `take-stock-nudge.js` is a *second* SessionStart hook that reads no inbox and fires in exactly the state the friction predicate calls empty, while telling the session to see the kaizen skill. An agent reading the older section first declines the pass it was just nudged to run. Take-stock is now stated as a second, inbox-independent entry in four places: the inbox section, the run-it line, the offer section, and the frontmatter description, that last because a skill that does not declare the trigger may not load on the occasion the step exists to serve.
2. **The sha rule was backwards and broke the loop it claimed to close.** "The sha examined" and "writing the entry silences the nudge" cannot both hold when the pass changes prose. Reproduced in a clone: setting the marker to the pre-pass sha made the hook report the very sections the pass had just taken stock of. My own live entry already violated my own rule, naming the commit that carried the compression. The heading now names the commit holding the prose as the pass left it, and the wording states the ordering that forces: prose lands first, the record entry follows in a commit touching no corpus file. The spec's Section 4 carried the same defect and is amended.
3. **The bucket had no observable entry condition**, which is the exact failure `writing-skills` names. One disjunct was an unstated threshold, the invented constant S1 had to abandon thresholding over entirely; the other asked the nudge for section identity it is built never to have. Now: the tool's top rows, or a section found changed while reading the ranking, with the nudge's limits stated inline.
4. **The gather paragraph shipped a figure this effort falsified.** It claimed 163 markdown file-events with none net-negative. At the landing sha there are **165, and one is net-negative: `1e5db4e`, S3's own compression**, the first in the kit's history. Stale by two commits, and the second instance of this class here, against a standing execution note that exists to prevent it. The same claim was corrected in `docs/README.md`, the spec's Goal and the spec's Why.

**The sharpest Major, because it inverted a guard into a hazard.** The spared bar asks what was observed to happen because of a rule. **A preventive rule succeeds by producing no event**, so that evidence is unobtainable for every guard in the kit, and the unverdicted escape then quietly becomes a retirement queue for exactly the hard-won guards the spec's Out of Scope rejected a whole mechanism to protect. Now: a preventive rule's spared evidence is the incident that admitted it, and an unverdicted rule is explicitly not a retirement candidate but one nobody has watched yet.

Five further Majors fixed: the compression bill was restated with the claim unit dropped, which Chapter 2 established is the load-bearing artifact; the new sub-steps ran unconditionally although Phase 1 routinely runs outside the kit repo where neither `tools/accretion.js` nor `docs/take-stock.md` exists, and step 4 would have written a stray kit record into a user's project; step 3 enumerated three of four dispositions and the missing one was the new one; "an inbox can only ask for more words" contradicted this file's own capture bar, which invites notes for a step that "added cost without value"; and "a rewrite that keeps every claim is a compression" reintroduced at the triage door the permissive reading Chapter 2's round-2 Critical was about.

**On length, which the reviewer measured rather than asserted:** 12 of the 41 added lines were argumentation rather than instruction, and both false statements lived in those 12. The rewrite moved the evidence to the plan doc and `docs/take-stock.md` and kept instruction in the skill.

**The loop verified by direct invocation, not through the harness.** With the marker at S3's sha the nudge was silent, because S4 touched no corpus prose. Committing S5, which edits `kaizen/SKILL.md`, made it speak: "4 of the kit's current prose section(s) hold lines that differ from the last take-stock." The marker was deliberately not advanced to silence it, because prose has changed and nobody has read it whole since, which is the thing the nudge exists to say. That is also the first time the emit path has run against real data rather than a fixture.

**But it fires in no real session yet, and an earlier draft of this Chapter said "end to end" when it had not.** The final review searched 16 installed plugin-cache versions and none contains `take-stock-nudge.js`: kit hooks load from the cache, so a repo edit is inert until `/plugin update claude-kit` runs on each machine. What was verified is `node <path>` with a SessionStart payload on stdin, which exercises the hook's logic and not the harness path that would invoke it. **`/plugin update claude-kit` is owed before this mechanism exists anywhere but this checkout**, and until it runs the trigger the Goal calls automatic fires nowhere.

**Third arm: 3 of 3, added after the QA pass caught that it was owed and never run.** QA flagged that S5 narrows a shipped claim ("nothing pending means no kaizen, by construction" became "no captured friction to triage") with no third arm and no recorded judgment. Checking which state the arms had staged made it worse than QA said: the change is about what happens when the inbox is **empty**, and RED and GREEN both ran against a log holding two entries, so **both arms staged the untouched state and the case the narrowing actually opens was never tested at all**. The arm staged it: empty log, nudge fired, does a pass run? All three ran one, all three on the clause under test ("an empty log is a reason not to triage friction, it is not a reason to decline a pass"), and one confirmed the RED from the other side by noting its printed pre-revision copy "would have declined this pass". The arm also exercised every clause the S5 review forced in: reps kept rules on the **preventive-incident** basis rather than a sighting, left the rest **unverdicted** and stated in their own words that unverdicted is not a removal candidate, and each considered a shortening and declined it.

**A tension the third arm found that nothing else did.** Rep 3: "the cut on offer is each rule's second sentence, and that sentence is where rules 2 and 12 carry their admitting incident. It is the only evidence anything in the file can be verdicted on today, so a shortening would delete the base the stocktake step runs on." **Compression eats the evidence the spared bar depends on.** The attached-content column protects it inside a compression, but nothing states the systemic version: a corpus compressed hard enough stops being verdictable. Recorded for the backlog, not fixed here.

**Isolation:** inbox parked with a self-describing header before the arms this time rather than after, held at 0 across all 9 reps, restored at close. Fixtures staged outside the repo under a de-identified domain, one copy per rep. RED serial, GREEN parallel. Repo clean at every check.

Review Findings: 4 Critical, 10 Major, 5 Minor across two reviewers, all addressed. Deliberately not addressed: the second clause of "Capture does not change" was aimed at a working session that never loads this skill, so it was cut rather than kept as decoration.

Next: finishing-work
Commit Model: Commit-and-Push

### Chapter 6 - 2026-08-16 (close-out)
Completed: finishing-work
Implemented By: main session; `qa-verifier` twice, `security-reviewer` and `adversarial-reviewer` at Fable per the header, `docs-curator`
Metrics: QA FAIL then PASS; security CLEAR; final adversarial APPROVED_WITH_CONCERNS; 11 drift items; advisor on, consulted twice in design and not during execution

**What shipped.** `tools/accretion.js` and its tests; `plugins/claude-kit/hooks/accretion-lib.js`, the shared parser in the payload; `plugins/claude-kit/hooks/take-stock-nudge.js` with 16 tests; `docs/take-stock.md` as the record and marker; `docs/prose-accretion.md` documenting the loop; the compression path in `writing-skills`; the take-stock bucket and second entry in `kaizen`; the committed S3 claim inventory; two new backlog items; and `docs/plans/kit-concurrent-sessions_spec_v1.md` split out as Proposed. 318 tests pass on a gate widened to reach `tools/`.

**The headline proof failed, and that is the finding.** `writing-skills` ends at 514 against a target of under 467. Those two sections hold 143 claims at about 172 characters each; a hard compression bought 6.5% where 18.5% was wanted. **This is claim accretion, not prose accretion**, so compression is the wrong instrument for it and retirement is the lever past it. The bar was also mis-specified by me: 58 of the 68 lines the effort added are the new Compression section, out of scope for compression by construction, so the criterion asked for seven times what the effort put into the sections it could touch. What did land is the kit's **first net-negative markdown commit in 166 file-events** (`1e5db4e`), four recorded retirement candidates, and an instrument whose first act was to correct, twice, the hand measurements that motivated building it.

**Review outcomes.** Per-section: S1 five Majors; S2 six Criticals and twelve Majors over two rounds; S3 no paired review, which Chapter 3 now marks as an unsanctioned deviation; S4 one Critical and eight Majors; S5 four Criticals and ten Majors. Finishing: QA failed then passed, security CLEAR with three Minors, final adversarial APPROVED_WITH_CONCERNS with three Majors. **Sixteen Criticals across the effort, and reviewers found every one of them.** The structural reason is recorded in Chapter 2 and held all the way through: arms run against a de-identified isomorph cannot detect a contradiction with the file the wording lands in, and that is where the Criticals lived.

**Drift adjudications (11).** Six were docs simply wrong and were corrected: the record file taught the pre-pass sha as the marker, `security-model.md` and `architecture.md` both claimed the hooks always `process.exit(0)` when none does, "the eight session-start blocks" was miscountable as a session-start total, the index understated the library's machine contracts, `README.md` omitted the one maintainer tool with a live trigger, and the new test file's own header miscounted its cases. Two were code better than spec and both criteria were amended in place: the hook's five states against a criterion contemplating two, and a test-harness criterion asking for a shared module that does not exist. One was a real gap, closed: a payload file's only test sat outside the documented gate, now widened. One was resolved by measurement (the JS file-event figure, wrong under every reading). One is D3, where two independent reviewers found the same false sentence in two places.

**The recurring defect this effort could not stop committing** is quoting a figure without re-measuring: four instances, caught by four different reviewers, against a standing execution note written to prevent exactly that. Every surviving figure is now sha-stamped or scoped.

**What is owed before the mechanism is real.** `/plugin update claude-kit` on each machine, and these commits pushed: kit hooks load from the installed plugin cache, so until then the nudge exists only in this checkout. Confirmed during close-out, when a marketplace update pulled a tree without the hook because the work was unpushed.

**Does the effort earn its own additions?** It net-added ~110 lines of prose (`writing-skills` +47, `kaizen` +63) and 513 lines of payload JS shipped to every user for a kit-repo-only nudge, to a kit whose measured problem is that it only grows. The final reviewer's verdict, which I accept: narrowly yes, conditional on the loop actually firing. The indictment is exact and worth keeping in view: **`kaizen`'s "The pass" section now ranks fourth on the effort's own instrument.** The mechanism will report on itself, which is the only honest test of it.

Next: none, effort complete
Commit Model: Commit-and-Push
