# What the Arms Can Establish, and What a Fixture Owes

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-08-16 (stub); specced 2026-08-18

## Goal

When this is done, `writing-skills` states the one thing its own testing apparatus cannot
establish, a reader building a fixture can check it against the five failure shapes the record
actually holds, a kaizen pass verifies its own citations before it commits, and kit prose
edited outside `executing-work` gets the same paired review kit prose edited inside it has had
since 2026-07-24. The reason is measured rather than asserted: one effort shipped sixteen
Criticals that thirteen passing arm reps could not see, and every one lived in contradiction
with the file the wording landed in, which is precisely what an isolated arm is built not to
read.

## Why this exists

Two kaizen notes, both filed 2026-08-16 against `writing-skills`, are one subject. The
skill's testing apparatus is now the two largest sections in the kit, and both notes say
the same thing from opposite ends: **it specifies isolation exhaustively and says almost
nothing about what an arm can and cannot establish.**

- **Fixture design is unwritten.** Lines 193-243 are entirely isolation - parallel reps
  sharing a write path, the kaizen inbox, reps reading each other's outputs, the answer
  reachable on disk. The only fixture-*design* content in the file is two fragments: an
  untempted RED tempts nothing (`:86-88`) and a fixture staging the case the rule does not
  cover comes back clean by construction (`:99-100`). The reported failure is neither.
  **Corrected 2026-08-18, see the reconciliation below:** the record holds three confounded
  fixtures rather than four, spread across four efforts rather than one, in at least five
  distinct shapes, and the worst instance is not a confound at all but a disconfirming result
  reclassified as one.
- **The arms are structurally blind to in-file contradiction.** The same leak rules that
  make an arm trustworthy force its fixture to be de-identified and staged outside the
  repo, which guarantees no rep ever reads the file the wording lands in. So an arm cannot
  test whether new wording contradicts its own target. The skill states every rule that
  produces this and never states the consequence.

## The evidence, located

**This is not a discovery. It is a finding already recorded in a Chapter and absent from the
skill**, which is why it reads as friction twice.

- `docs/archive/kaizen-stop-start-continue_spec_v1.md:821` (effort close-out): "**Sixteen
  Criticals across the effort, and reviewers found every one of them.** The structural
  reason is recorded in Chapter 2 and held all the way through: arms run against a
  de-identified isomorph cannot detect a contradiction with the file the wording lands in,
  and that is where the Criticals lived."
- Chapter 2, same file `:686`: "The paired review found five Criticals that 13 arm reps had
  passed... **no rep ever saw `writing-skills` itself**. They could test whether the wording
  is followable under a task; they could not test whether it contradicts the file it lands
  in, and every Critical lived there... the natural next inference, that 13 passing reps
  means the wording was sound, is wrong."
- Chapter 5, same file `:784`: "the paired review found four Criticals, and Chapter 2's
  structural limit is why... A 3/3 GREEN is not evidence against that class, and both
  reviewers said so."
- Commit `1382030f20a113571e4b5038c6683ec06064a684` carries it into a commit message: "the
  reviewers found four Criticals the arms could not, for the reason Chapter 2 recorded."
- **`writing-skills` already half-states it, but not where it first appears to.** The `:693`
  quotation above belongs to the archived Chapter, which says "the file predicts this miss in
  its own text". The prediction is at `writing-skills:158-160`: GREEN carries its wording
  in-prompt, "so in-prompt is mandatory rather than stylistic, and what goes untested **that
  way** is placement, trigger, and whether a real session would read the rule at all."

  **A first reading of this design pass took that three-item list for S1's home, on the
  grounds that it stops one item short. It does not, and the correction changes the claim as
  well as the placement.** "That way" scopes the list to the in-prompt delivery mechanism, and
  the passage it sits in (`:147-160`) is about **baseline staleness**, the plugin cache lagging
  the repo. That passage explicitly permits reps engaging the real file: "Point each rep at an
  explicit repo path, or hand it a fixture copy and diff that copy against the repo file at
  dispatch." So contradiction-blindness is not a consequence of in-prompt delivery, and filing
  it there would put the claim under the wrong mechanism, inside the section about in-file
  wrongness.

  **The real cause is the isomorph, and it is mandated for an unrelated reason.**
  `writing-skills:232-235` requires staging "an isomorph with the specifics changed, or a
  situation the repo has never resolved", and the reason it gives is the **answer-on-disk
  test**: "a fixture asking for a decision this repo already made has one to find". No rep
  reads the target file because the fixture is a de-identified analogue, and it is that to keep
  the answer unreachable, not to isolate anything from the target file. **Contradiction-
  blindness is therefore a cost of a control chosen for a different purpose, not a property of
  arms as such**, which is exactly the tradeoff open question 3 predicted and is why S1 lands
  at `:234-235` rather than at `:160`.

### The count, reconciled 2026-08-18 (the stub owed this and it changes the finding)

**The count is three, not four, and the source contradicts itself.** "Four" traces to
`archive/red-for-rule-changes_spec_v1.md:692-695`, which discloses "Four fixtures had design
flaws ... Reps caught three of the four." The same document retracts one at `:628-631`:
"Chapter 4 filed that as a fourth fixture confound. **That was wrong, and the final review is
right to call it:** a rule that is a directive resting on a factual premise is the production
shape of `ee8be8f` itself, not a staging error." The "four" in the inbox note most likely came
from `:636`, "this effort's judgment about its own fixtures has now been wrong four times",
which is a different claim.

**What the retraction exposes is worse than the miscount**, `:697-700`:

> The worst of it was not a fixture. Arm 6's disconfirming rep was filed as a fixture confound
> when it was pointing at `ee8be8f`'s real shape, and the next fixture was then built so that
> reading could not arise. The final review caught that; the effort did not.

That is not a fixture reverse-engineered from the wanted answer. It is a **disconfirming result
reclassified as a staging error, after which the fixture was rebuilt so the result could not
recur.** Different failure, more dangerous, and invisible from inside the effort. The stub's
one-line characterization of this half was wrong in the direction of the milder defect.

**And the corpus is four efforts, not one.** Confounds are also recorded at
`archive/kaizen-stop-start-continue_spec_v1.md:661` (v1 collapsed the RED's control, so paying
the bar and running the probe were the same act), `archive/cross-project-memory_spec_v1.md:331-336`
(a confounded arm cut before commit rather than shipped), and `archive/visual-companion_spec_v1.md:407`
(one rep's decline confounded by observing a missing file, another discarded for opening the
spec). That is what settles open question 1 below: there are at least five distinct failure
shapes on record, so the answer is a taxonomy and not the single worked example the stub assumed.

## The three findings that should drive the design

**1. The bill splits, and the split is not obvious.** These are two changes wearing one coat.
The *fact* half - an isomorph-based arm cannot detect contradiction with its target file - is
a missing statement of fact with located provenance, which commit `1526456` establishes takes
no RED cycle. The *mandate* half - a paired review is therefore not optional for wording
changes - is a new rule an agent can rationalize around under time pressure, and owes the
arms in full. Shipping them as one paragraph would smuggle the second in on the first's
evidence, which is the failure `writing-skills:435-440` already names.

**Corrected 2026-08-18: "owes the arms in full" is false for half of the mandate, and the
correction is load-bearing.** The split is three ways, not two. S3 (verify your own citations)
is a directive the arms can stage, tempt and measure. S4 (the paired review is not optional)
**cannot be armed at all**, because an arm cannot test a claim about what an arm cannot test.
Its admission runs through review instead, which is what makes running this effort as a planned
`executing-work` spec a requirement rather than a preference. See Approach.

**1a. The mandate is already shipped for planned work, and the hole is the kaizen path.**
Checked rather than assumed. `executing-work/SKILL.md:77` step 3 already says "Every section
gets a paired review: one reviewer holding the intent story, one deliberately blind to it",
with exactly two sanctioned exceptions (a docs-only section, and a trivial self-contained
one). So an effort that changes kit wording as a planned Section of Work already gets the
review that catches this class. **A kaizen pass does not run that loop.** `kaizen/SKILL.md`'s
apply path is "read the brief, make the change per `writing-skills`, commit it, then archive
the brief" - no review step, at all. The same is true of a pass that fixes an item directly
because it is already in the kit repo, which is the common case. That is a sharper and much
smaller change than either note proposed: not a new mandate in `writing-skills`, but the
existing mandate reaching the one path that edits kit prose outside `executing-work`. The
trivial-section carve-out also wants a reading here, since a one-clause wording change is
exactly what it appears to license and exactly what the sixteen Criticals were made of.

**2. The obvious home is the worst available.** Both notes point at
`writing-skills/SKILL.md`'s "Know it works before you trust it", which `tools/accretion.js`
ranks first in the kit (164 lines, 17 commits) and which `docs/take-stock.md`'s 2026-08-16
entry found to be at **claim saturation**: 143 claims across two sections at ~172 characters
each, where a hard compression bought 6.5% against the 18.5% wanted, and the entry concluded
"compression is the wrong instrument for this file." A design pass must ask whether this
belongs in that section at all before it writes a line there. Live options: a distinct
section on what an arm establishes and what it does not; a `references/` file, which the kit
already uses for `brainstorming` and `kit-adoption-pass`; or folding the mandate into
`executing-work`'s paired-review step, where the reviewer dispatch already lives.

**Answered 2026-08-18, and neither of the three options won.** S1 needs no new home: the file
already enumerates what GREEN leaves untested at `:158-160` and stops one item short, so the
limit extends an existing list. S2 takes the `references/` option, which keeps the saturated
section at one line of growth. The `executing-work` option is rejected because the mandate's
gap is on the `kaizen` path, and `executing-work` already has the rule.

**3. There is a third finding in the same territory, already recorded and never routed.**
`docs/archive/kaizen-stop-start-continue_spec_v1.md:803`: "**Compression eats the evidence
the spared bar depends on.** The attached-content column protects it inside a compression,
but nothing states the systemic version: a corpus compressed hard enough stops being
verdictable. Recorded for the backlog, not fixed here." That is the same shape as both notes
- a real limit of an instrument, recorded where nobody reading the instrument will find it.
Decide whether it joins this effort or gets its own; do not let it fall through a third time.

**Answered 2026-08-18: it gets a home rather than a section here.** It is an instrument limit
about compression and the spared bar, sharing a shape with this effort but not a subject, and
`plans/take-stock-instrument_spec_v1.md` now exists and is exactly about whether take-stock's
instrument is aimed right. S5 routes it there, which is the disposition that stops the third
fall-through without annexing an unrelated subject into this effort.

## The direction, after the evidence check killed the first one

Two entries, in order, because the sequence is the useful part. Both added 2026-08-16.

### Rejected: invert the default

The first draft of this section proposed demoting the arms - paired review becomes the
mandatory gate, arms become the exception - on the strength of one effort where **the arms
caught none of the sixteen Criticals and the paired review caught all sixteen**
(`archive/kaizen-stop-start-continue_spec_v1.md:821`, `:686`, `:784`).

**The check that section demanded of itself was run, and the proposal did not survive it.**
Across the other efforts that ran both gates, the arms do work no review did:

- `archive/visual-companion_spec_v1.md`, commit `d612315`, "ship the frame and the guide, **and
  cut the rule the RED did not justify**." An arm caused a rule to be removed. That is the only
  demonstrated instance in this repo of a rule subtracted on evidence, which is the capability
  `docs/take-stock.md` was built to supply and has not yet delivered once.
- `archive/red-for-rule-changes_spec_v1.md:388` RED fired 5/5; `:482` a second RED arm fired
  2/3; `:413` an arm's own output falsified a criterion the effort had asserted.
- In both, reviewers **also** found Criticals the arms could not (`:308-312`: "GREEN could not
  test it. Conceded.").

So the two gates catch different classes and neither substitutes for the other. The 16/16
datum stands but is bounded: that effort was prose-about-prose throughout, where contradiction
is the dominant risk. **Do not demote the arms.** Recorded here rather than deleted, because
the inversion is an intuitive proposal that will be reached for again, and the reason it fails
is not obvious from inside the effort that suggests it.

### The finding that replaces it: the cost is the routing, not the arms

The pass that wrote this stub **ran zero arms and still consumed several hours across multiple
usage blocks** (Daren, 2026-08-16), for two clause additions. The arms were never the expense
for a small change. What cost was determining which of four routes a change takes: reading 515
lines, weighing three sections that "route around" the bar, and reconstructing the governing
precedent by archaeology through commit `1526456`'s message, because no section states it.

**There is no findable answer to "I want to change kit prose - what does this cost me?"** The
routing lives in `writing-skills:126-134`, in the four answers at `:338-383`, in
`## Compression`'s entry condition, and in `## When you meet a counter-case`'s bill, each
written as an exception to the others, with the cheapest lane of all recorded only in a commit
message. That is also the operator-side complaint: Daren cannot tell what a kit change is worth
because the answer is not written down as a whole anywhere.

**Part 3 was attempted and abandoned**, at `archive/writing-skills-ladder_spec_v1.md` (2026-08-17).
Read its Chapter 1a before proposing a ladder again: two scopes and four rounds of Critical
findings established that routing in `writing-skills` is not separable from cost, because the
sentences that route state the bill in the same breath, so a table imposes a structure the prose
does not have. If it is revived, it should be a plain index that moves nothing and pays the arms -
its value is behavioral (does a reader route correctly?), which is what an arm measures and a
claim inventory does not. Parts 1 and 2 below were never in that effort's scope and stay here.

So the direction is **consolidation, not demotion**. Three parts, cheapest first. **Parts 1
and 2 became this spec's five Sections of Work; part 3 is Out of Scope**, abandoned 2026-08-17
and kept here only because the reasoning above is what a future reviver needs:

1. **State the limit.** An arm cannot detect contradiction with the file the wording lands in.
   Fact, located, no RED owed.
2. **Close the review hole.** The paired review is mandatory for planned work and absent from
   the kaizen apply path, which is where most kit prose is actually edited. See finding 1a.
3. **One findable ladder.** A single decision procedure naming every class of kit-prose change
   and its bill, in one place, replacing four cross-referencing exceptions. Mostly a
   consolidation of text that already exists, which puts it on the compression bill rather
   than the arms - and the claim inventory is what will prove that, since a ladder that
   quietly widens or narrows a trigger is a rule change wearing a compression's clothes.

**Sizing, re-measured 2026-08-18 rather than carried forward.** `writing-skills` is 519 lines,
the largest file in the kit, against `systematic-debugging`'s 46. `writing-skills` and `kaizen`
together are 715 of the 3,268 lines across all eighteen skills and their references (21.9%). The
loop meant to improve the kit spends a fifth of it on itself. The stub's figures were 515 and
698 of 3,251; the deltas are this session's own two commits (`2408979` at +13 to `kaizen`,
`60addb9` at +3 to `writing-skills`) and not drift.

**One measurement bears directly on S2's home: `writing-skills` has no `references/` directory
at all.** Every other line it owns is in the one 519-line file, which is why `references/` is
where the taxonomy goes and why S2's growth to `SKILL.md` is capped at a single pointer line.
That sizing was the argument for part 3, which is abandoned; it is not an argument for cutting
anything, since none of those lines is unfounded, they are simply unnavigable.

## Approach

Four decisions, each made against the evidence above rather than from preference.

**The bill splits three ways, not two.** Finding 1 called it fact versus mandate. The fact half
(S1, S2) is a missing statement about an instrument, with located provenance, which `1526456`
establishes takes no RED cycle. The mandate half divides again: **S3 is armable and S4 is not.**
A rule telling an author to re-open every citation before committing can be staged, tempted and
measured. A rule saying the arms cannot be trusted alone cannot be, because the arms cannot test
a claim about what the arms cannot test. S4's own admission therefore runs through review, which
is why this effort runs as a planned `executing-work` spec rather than as a kaizen pass: **the
effort about the missing review must not ship through the path that is missing it.**

**S1 opens no new section, and it lands at the control that causes the blindness.** The claim
goes beside the isomorph mandate at `writing-skills:232-235`, because that is where a reader
chooses the control whose cost this is, and a cost stated anywhere else is a cost nobody meets
at the moment of paying it. An earlier reading of this pass put it at `:158-160` instead and
was wrong on both the mechanism and the placement; the record is in the evidence section above,
because it is the fifth attractive structural reading in two days to die on re-reading the
primary text, and that rate is itself part of this effort's case.

**S2 goes to `references/`, so the saturated section does not grow.** Five failure shapes with
five located instances is reference material, consulted when building a fixture rather than
read every time. `SKILL.md` gains one pointer line. Three take-stock passes have now tried to
keep that section from growing; this is the first change that could have grown it and does not.

**S4 scopes by path, not by judgment.** A kaizen pass that has changed any file in
`tools/accretion.js`'s globs dispatches one paired review over the whole prose diff before
committing. Path membership is observable, needs no predicate an author can argue with, and
costs one dispatch per pass rather than one per clause. The tempting alternative, scoping to
"changes that owe arms", is rejected on this session's own evidence: the changes that produced
errors on 2026-08-18 were a fact correction and two `docs/` entries, none of which owes arms.

## Sections of Work

### 1. The limit, stated at the control that causes it
Add the limit beside the isomorph mandate at `writing-skills:232-235`, and add one sentence
where GREEN's every-rep bar is stated (`:105-107`) on what a passing GREEN therefore does not
establish.
**The claim is conditional and the condition is the whole point** (open question 3, answered).
It is an arm staged as a **de-identified isomorph** that cannot detect contradiction with the
target file, because no rep reads that file. The isomorph is mandated by the answer-on-disk
test, not by the target file, so this is **the cost of a control chosen for another purpose**
and not a property of arms. Do not write the blanket "arms cannot catch in-file contradiction":
`:156-157` already permits pointing a rep at an explicit repo path, so the blanket is false as
written and would contradict a line two paragraphs up.
Whether a GREEN arm could be pointed at the real file to test contradiction, paying reachability
for it, is named as a consequence and **not answered here**; answering it is a rule change.
Acceptance criteria, all verifiable: the limit sits within the isomorph passage and names the
isomorph as its cause; it does not assert the unconditional form; the GREEN-bar sentence names
what a pass does not establish; provenance cites `archive/kaizen-stop-start-continue_spec_v1.md:821`
and `:686`; a claim inventory over both touched spans shows no trigger moved; `:156-160` is
re-read at implementation time and the new text checked against it for contradiction, since
that is the exact failure class this section is about.
Execution mode: main.
Tests: none. Fact statements with located provenance; the risk is miscitation, which S3 covers.

### 2. The fixture-failure taxonomy
New `plugins/claude-kit/skills/writing-skills/references/fixture-failures.md`, carrying the five
shapes the record holds, each with its instance quoted and located:
1. **The fixture collapses the control** so paying the bar and running the probe are one act
   (`kaizen-stop-start-continue:661`).
2. **A side-by-side contrast that primes discrimination** (`red-for-rule-changes:693`).
3. **A catch-all line that neutralises the harm** (same).
4. **A mechanism that dominates**, so the ambiguity is never exercised (`red-for-rule-changes:563`).
5. **A disconfirming result reclassified as a staging error, then engineered around**
   (`red-for-rule-changes:628-631`, `:697-700`). Recorded as the worst shape, because the effort
   did not catch it and its own review did.
Fold in by pointer, never by moving, the two fragments already in `SKILL.md` (`:86-88`,
`:99-100`). `SKILL.md` gains exactly one line pointing at the reference.
Acceptance criteria: five shapes, each with a file:line and a quotation; the `SKILL.md` pointer
present; `SKILL.md` net growth is one line; no existing fixture rule is moved or reworded.
Execution mode: main.
Tests: none. Descriptive taxonomy; adding a directive to it would change the bill and is barred
by Out of Scope.

### 3. The self-verification discipline (the one section the arms can test)
Add to `kaizen`'s apply path: before committing prose, re-open every `file:line` citation, every
quotation, and every assertion about a commit, and confirm each against its source. **Scope is
all prose the pass writes, `docs/` included**, because the 2026-08-18 pass's four stale citations
were in `docs/take-stock.md`, which S4's corpus scope does not reach.
**Checked before assigning the bill: this is a new directive, not a widened trigger.** The
only instance of the discipline in the corpus is a *plan note* quoted at `docs/take-stock.md:368`
("the plan's own 're-measure before quoting' note"), which never shipped into a skill;
`writing-skills`' verbatim-artifact rules bind arm outputs, not citations in prose. So this
section **owes the arms in full** per `writing-skills`. Two constraints on the fixture,
both from this repo's own record: it must not be reverse-engineered from the wanted answer, and
the RED must be de-identified and kept away from `docs/plans/`, since this spec is on disk and
committed and `brainstorming:34` records a probe primed by exactly that.
Acceptance criteria: RED demonstrates a rep shipping an unverified citation under combined
pressure, with the rationalization quoted verbatim; GREEN holds every rep; the unit, prompts and
rep outputs recorded per the gated path's bar; the Chapter carries all three artifacts.
Execution mode: main.
Tests: the arms are the test.

### 4. The review the kaizen path never had
Add to `kaizen`'s apply path: a pass that has changed any file matched by `tools/accretion.js`'s
globs dispatches the paired review (`adversarial-reviewer` and `blind-reviewer`) over the whole
prose diff before committing, one dispatch per pass. Give the adversarial half the brief or the
take-stock entry as its intent story; give the blind half the diff and nothing else, per
`executing-work:77`'s existing contract.
**Clarify the trivial carve-out for prose in the same section**: `executing-work:77` licenses
skipping the pair for "a one-line fix with no logic change", and for prose the analogue of a
logic change is a rule change, so a one-clause edit that adds or alters a rule is not trivial.
Left unread, that carve-out licenses exactly the changes the sixteen Criticals were made of.
**This section cannot be armed and must not pretend otherwise.** Its admission evidence is this
effort's own paired review of this section, quoted in the Chapter.
Acceptance criteria: the dispatch clause names the path predicate rather than a judgment; the
carve-out reading is stated; the Chapter quotes the reviewers' findings on this section as the
admission evidence; `kaizen`'s apply path reads correctly end to end after the insertion.
Execution mode: main.
Tests: none possible; see above.

### 5. Route the third finding, and name the recurring defect
Route `kaizen-stop-start-continue:803` ("compression eats the evidence the spared bar depends
on") into `plans/take-stock-instrument_spec_v1.md`, which is now its natural home: that stub is
about whether take-stock's instrument is aimed right, and this is an instrument limit. Finding 3
warned it must not fall through a third time.
Then open a Proposed stub for the defect class this effort found a fourth instance of:
**kit enumerations stop one short, and the missing item is the newest or the largest.** Located
instances: `kaizen-stop-start-continue:793` (three dispositions of four),
`kaizen/SKILL.md` step 4 before `2408979` (spared and unverdicted, missing declined),
`writing-skills:296` before `60addb9` (one exit of two), and `writing-skills:158-160` (three
untested things of four, fixed by S1). `executing-work:79`'s recurrence rule says two instances
means the workflow generates the bug; four means it needs a name and an owner.
**This section's entire changeset is under `docs/`, so it takes the adversarial review alone**
per `executing-work:77`, which states that a docs-only section leaves a blind reviewer nothing
to read. Recorded here rather than derived at run time, which is what that clause asks for.
Acceptance criteria: the routing lands in the target stub with its quotation; the new stub is
registered in `docs/README.md` per `curating-docs`; all four instances carry a file:line; the
Chapter says the section was docs-only.
Execution mode: main.
Tests: none. Routing and records.

## Cost, and the one lever for scaling it down

Named before approval rather than discovered in section three, because the stub's own finding
was that a pass running **zero** arms still cost hours.

- **S1, S2, S4, S5** are prose plus review. Four sections, seven review dispatches (S5 takes the
  adversarial half alone). No arms. This is the cheap two-thirds of the effort and it delivers
  the limit, the taxonomy, the review mandate and the routing.
- **S3 is the expensive one and it is separable.** It owes a full RED/GREEN cycle: a fixture
  built to this repo's own standard, three reps minimum per arm, a REFACTOR arm if the first
  wording leaks, plus the gated path's artifact recording. Everything else in this spec is about
  what the arms cannot do; S3 is about a different failure (unverified citations) and is the one
  section they can test.
- **finishing-work** adds QA, docs curation and a final adversarial review at the fable
  override per the `Fable Spend:` header. The security review is skippable under that skill's
  all-prose rule.

**The lever: S3 can be split into its own spec and this effort shipped without it.** The two
subjects are independent, and S3's evidence (four stale citations on 2026-08-18) is recorded and
will keep. Splitting drops the only armed section and roughly halves the effort. **Recommended
only if the cost matters**, since S3 addresses the failure this session actually produced,
whereas S1 addresses the one another effort produced.

## Out of Scope

- **Part 3, the routing ladder.** Abandoned 2026-08-17 after two scopes and four rounds of
  Critical findings. Do not revive it inside this effort; read
  `archive/writing-skills-ladder_spec_v1.md` Chapter 1a first if it is ever revived at all.
- **Demoting the arms.** The evidence check killed it and the record is kept above so the
  inversion is not reached for a second time.
- **Any compression of `writing-skills`.** Four measurements say the file is claim-dense; S1
  and S2 are additions, and S2 is deliberately shaped so the saturated section does not grow.
- **Adding a directive to the S2 taxonomy.** Descriptive costs no arms; "check your fixture
  against these" is a rule and would change S2's bill mid-effort.
- **Widening S3 beyond `kaizen`.** Whether `executing-work` Chapters want the same discipline
  is a real question and is parked in Open Questions, not answered here.

## Open Questions

Three of the stub's questions are answered in Approach and Sections above (taxonomy over worked
example; kaizen dispatches the pair itself, scoped by path; the limit is conditional on the
isolation). What remains:

1. **Does S3's discipline belong in `executing-work` too?** Chapters make citation-bearing
   claims and get no such check. Deferred deliberately: S3 should be armed once, in its
   smallest scope, before anyone widens it.
2. **One dispatch per pass, or per prose commit?** A pass that lands two prose commits in
   sequence (as 2026-08-18 did, at `2408979` then `60addb9`) would review only once under the
   current wording, and the second commit was a real defect found after the first. Settle this
   in S4 against that specific case.
3. **Does the paired review earn its second half here? This is a live fork, not a question to
   discover late.** The blind reviewer's contract (`executing-work:77`) assumes build and test
   commands prose changes do not have. The argument for keeping it is that reading the file cold
   is precisely the capability the arms lack, which is this effort's whole subject. **The
   exposure: if the answer is adversarial-only, S4's shipped clause and both its acceptance
   criteria move.** Owner: the S4 review itself, which will be the first paired review of prose
   this effort sees, so the answer arrives from the instrument under test. Daren should know
   before approval that S4 may ship narrower than written.

## Chapters

(Appended by executing-work as sections complete. Leave empty at creation.)
