# What the Arms Can Establish, and What a Fixture Owes

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-08-16 (stub); specced 2026-08-18

## Related

- `plans/take-stock-instrument_spec_v1.md` - S5 moved the compression-eats-the-spared-bar finding
  into it, and S1's zero-cut result is one of the four measurements that stub reasons from.
- `plans/enumerations-stop-short_spec_v1.md` - opened by S5; this effort's S4 produced its fifth
  instance, and S1 supplied one of its examined-and-rejected candidates.
- `archive/writing-skills-ladder_spec_v1.md` - abandoned; its banked findings scoped this effort's
  Out of Scope and supplied the three-of-four ratio S1 and S2 both reproduced.
- `archive/kaizen-stop-start-continue_spec_v1.md` and `archive/red-for-rule-changes_spec_v1.md` -
  the two efforts whose recorded arms and reviews are this effort's entire evidence base.

## Goal

When this is done, `writing-skills` states the one thing its own testing apparatus cannot
establish, a reader building a fixture can check it against the five failure shapes the record
actually holds, a kaizen pass verifies its own citations before it commits, and kit prose
edited outside `executing-work` gets the same paired review kit prose edited inside it has had
since 2026-07-24. The reason is measured rather than asserted: in one section of one effort a
paired review found five Criticals that thirteen passing arm reps had missed, and the recorded
reason is that no rep ever saw the file the wording lands in. **Figures corrected 2026-08-18
under review; see the count discrepancy below, which is why this Goal no longer quotes the
effort's headline of sixteen.**

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

  **That headline does not reconcile with its own line, and S1's review caught this spec
  importing it.** The same sentence enumerates per-section outcomes (S1 five Majors, S2 six
  Criticals, S3 no paired review, S4 one Critical, S5 four Criticals), which totals **eleven**
  Criticals rather than sixteen, and the finishing entries it lists add Majors rather than
  Criticals. `:754` also falsifies "that is where the Criticals lived" for at least one of
  them: S4's single Critical was an unrecorded mid-section design change on a hook, not a
  contradiction with the file. **Nothing here asserts eleven is the true number**; the point is
  that the headline cannot be carried forward on the strength of the line that states it, so
  this effort cites `:686` instead, whose five-Criticals-against-thirteen-reps figure is
  internally consistent and carries its own stated cause.
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
exactly what it appears to license and exactly what that class of Critical is made of.

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
caught none of them and the reviewers caught all of them**
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

**S1 opens no new section. As built it lands at the end of the leak and isomorph block**, not
beside the isomorph mandate as this paragraph first said: an insertion at the mandate broke the
referent of the paragraph following it, and a second insertion at GREEN's bar created a competing
enumeration. Section 1 and Chapter 1 carry the reasoning. An earlier reading put it at `:158-160`,
which is wrong because that list is scoped to in-prompt delivery and its recorded effect is a
placement defect rather than a conflict with existing text.

**S2 goes to `references/`, so the saturated section barely grows.** A catalogue of failure
shapes with located instances is reference material, consulted when building a fixture rather
than read every time. Three take-stock passes have tried to keep that section from growing; this
is the first change that could have grown it substantially and does not. **As built it is six
shapes, not five, and `SKILL.md` gains four lines rather than one** - see Section 2.

**S4 scopes by path, not by judgment.** A kaizen pass that has changed any file in
`tools/accretion.js`'s globs dispatches one paired review over the whole prose diff before
committing. Path membership is observable, needs no predicate an author can argue with, and
costs one dispatch per pass rather than one per clause. **Superseded 2026-08-19: the shipped
clause is per-commit** ("before it is committed ... no corpus commit lands until its Criticals are
resolved"), which is the better answer because it covers the `2408979`/`60addb9` case round 1
raised, where the second prose edit did not exist at the first dispatch. Open Question 2 and the
acceptance criterion below are corrected to match the shipped text rather than the reverse. The tempting alternative, scoping to
"changes that owe arms", is rejected on this session's own evidence: the changes that produced
errors on 2026-08-18 were a fact correction and two `docs/` entries, none of which owes arms.

## Sections of Work

### 1. The limit, scoped the way its source scopes it
**Rewritten twice. Round 1 and round 2 both returned CHANGES_REQUIRED from both reviewers, and
round 2's adversarial found the cause was this section, not the wording.** The section
authorized two incompatible claims at once, and an implementer obeying every instruction
produced a paragraph asserting a universal while citing a fixture property as its reason. That
is recorded here because the section regenerates the same defect until it is settled.

**Settled, and corrected again in round 4 because this paragraph was still the root cause.**
The claim is isomorph-scoped: an arm cannot test whether new wording conflicts with what the
skill file already says, because the fixture stands in for that file. The earlier "a property of
the question an arm asks, not of any fixture" framing stays **withdrawn**, since no sentence in
the record supports it (`:686` says isomorph, `:693` says in-prompt delivery, and those are
different effects).

**The standing-brief reading is withdrawn too, and it was this spec's error rather than the
implementer's.** Round 3 instructed keeping `:686`'s "per Standing Brief Amendment A1" qualifier
on the reasoning that it made the isomorph that effort's own staging choice. **A1 says the
opposite.** Read at `archive/kaizen-stop-start-continue_spec_v1.md:603-609`, it is
`writing-skills:228-235` applied to a triggering condition: "This repo now answers the arms'
questions, so every fixture stages outside it ... **This is not a mistake to undo:** the plan has
to be committed to be durable, and the leak arrives with it." Shipping it as a choice handed a
reader "not my staging, not my problem" and defused the paragraph's own consequent, which is
`:75`'s banned nuance clause in correctness form. It also contradicted this spec's own evidence
section, which had it right from the start. **Two rounds regenerated the same defect because two
parts of this spec disagreed; they now agree.**

**Recorded without relitigating: the grounds for rejecting the `:158-160` home were partly
wrong.** `:693` does attribute a placement miss to in-prompt delivery, so the archive supports
that mechanism as well. The placement decision stands on the other grounds above; the overstated
reason does not.

**No rep count ships.** "Thirteen passing arm reps" is falsified by its own chapter: `:700`
gives "13 reps over 5 arms (1 discarded fixture, RED 3, GREEN 3, boundary 3, REFACTOR 3)", so
three were RED reps where failing is the point and one was discarded, leaving at most nine that
carried the wording; `:684` says "all 12 reps" for the same section. Cite the Criticals the arms
passed and no rep total.

**One insertion, at the end of the leak and isomorph block**, before `## Compression`. Not after
the RED/GREEN/REFACTOR triple: any sentence generalizing over "the arms" there is false for RED,
which runs without the wording, and undercounts the narrowing's fourth arm. Both reviewers found
that independently, and it was the enumeration-stops-one-short defect committed inside the
effort that named it.

**Bars the section must not cross**, each one a finding from a failed round:
- Do not state the limit as a property of arms. It is a property of isomorph staging.
- Do not generalize over "the arms" or "all three arms". RED carries no wording and a narrowing
  adds a fourth arm.
- Do not say what a review catches as a general claim, and do not answer whether a GREEN arm
  pointed at the real file could test conflict. Answering either is a rule change and this
  section is specced at no arms. **Reporting the recorded incident is not that**, and the bar
  read otherwise collides with the instruction to cite the Criticals; report what happened, never
  what review generally does.
- Do not use "followability" or "obeyable". The first names the gated probe; the second hands
  the probe's weaker claim to GREEN, whose bar is that the wording prevents the failure.
- Do not use "fit", "sits right in the file", or any phrase reaching past conflict-with-existing-
  text. They are undefined, they annex placement (whose cause is in-prompt delivery, not the
  isomorph), and they are broad enough to cover the redundancy branch at `:98-104` and `:363-377`,
  where an arm's own result does bear on whether new wording belongs.
- Do not use "a clean arm" or "a clean run". "Clean run" is loaded in this file and routes into
  the four answers. Say what was observed instead.
**The incident is recorded as a dated clause, not a file:line locator.** `:497-502` says "A
clause does it; no citation apparatus", with the borrowed-evidence gate as the only exception,
and that gate covers another kit's wording or a report from Daren. This kit's own archived
Chapter is neither, so the no-apparatus rule governs and the eight other incidents in the file
all use a bare parenthesized date. Round 1 flagged the locator for lacking a `docs/` prefix,
which was true and pointed at the wrong fix: the locator should not have been there at all.
**The paragraph must also carry a consequent.** Three reviewers across two rounds found it
stating a limit with nothing to do about it, and the file's own opening calls prose that does
not change what an agent does under pressure decoration. The consequent that crosses no bar is
an inference rule about reading a result, never a claim about what review catches.
Acceptance criteria, all verifiable: the insertion is additive with zero deleted lines; the
claim is isomorph-scoped and carries the standing-brief qualifier; no rep total appears; the
incident is a dated clause in the file's own form and the date matches its Chapter; the
paragraph ends in something a reader can act on; none of the five bars is crossed; the source's
own verb ("passed", not "missed") is kept; `:166-169` and the "harder to notice" paragraph are
re-read at implementation time and the new text checked against both.
**A criterion that failed twice, kept as a warning:** round 2 required "every figure maps to a
single sentence in `:686`". It was satisfied literally and still admitted a false rep count,
because the sentences refining that figure sit fourteen lines below the one cited. Round 4 then
caught the same failure again on a different number: `:686` says "every Critical lived there",
and the chapter's own enumeration refutes it for two of the five, since `:690` is a probe passing
against a stale cache copy and `:693` is a placement defect the source attributes to in-prompt
delivery. **Three of five instantiate this limit.** No count ships without walking the
enumeration behind it. Mapping to a sentence is not mapping to the record, and a source's own
summary of itself is a sentence like any other.
Execution mode: main.
Tests: none. Fact statements with located provenance; the risk is miscitation, which S3 covers
and which three rounds have now demonstrated live.

### 2. One fixture-design failure, stated where the temptation is
**Rescoped by Daren 2026-08-19, from a six-shape reference file to a single paragraph.** The
round-1 outcome recorded below is why: the catalogue's locator design failed on two independent
grounds, two of six shapes were wrong about their own instances, and the six "tell" heuristics
were the author's inventions presented inside a file whose value proposition was located
evidence. Shape 5 was the one entry whose evidence is airtight and whose lesson is the largest,
so it ships alone.

**No reference file, and no locators.** One paragraph does not justify a `references/` file, and
the three that exist carry zero `file:line` locators between them. The instance is described
inline with a dated clause, which is what `writing-skills`' "A clause does it; no citation
apparatus" rule prescribes and what the file's other
recorded incidents do. That also survives the payload boundary: `docs/` does not ship with the
plugin, so a locator into `docs/archive/` dangles for every reader outside this repo.

**Placed after REFACTOR rather than near the fixture rules.** REFACTOR is the legitimate "revise
and re-run"; the failure is revising the *fixture* so a disconfirming result cannot recur. Putting
the warning beside the legitimate motion puts it where the temptation is, and the file currently
says nothing anywhere about what to do with a rep that disagrees.

**No invented heuristic.** The paragraph's closing sentence is the source's own verdict (a rep
"pointing at `ee8be8f`'s real shape", not "a staging error"), not a tell the author generalized.
That was the round-1 defect with the furthest reach, since `writing-skills` holds fabrication
worse than either obeying or discarding a mandate.

**Every claim re-verified against the source at implementation time**, per Chapter 1's finding
that a summary of a document's own results has twice been refuted by its own detail: the filing of
a disconfirming rep as a confound (`:692`), the fixture rebuilt so the reading was unavailable by
construction (`:631-632`, `:693-694`), the quoted phrase (`:632-633`, verbatim), the review
catching what the effort did not (`:694`), and the remedy adopted (`:694-695`). No count is quoted
in the shipped text; the source's "wrong four times" figure was deliberately dropped rather than
imported unwalked.
Acceptance criteria, all verifiable: the insertion is additive with zero deleted lines; every
claim in it appears at the cited source lines; no `file:line` locator appears in the shipped
prose; the incident carries a dated clause matching its Chapter; the paragraph ends in something
a reader can act on; no heuristic is asserted that the source does not state; `references/` is
absent and the earlier pointer is fully reverted.
Execution mode: main.
Tests: none. A statement of fact with located provenance.

**Round 2 outcome: no Criticals from the adversarial review, which endorsed the placement and
said it would not cut the paragraph; 2 Criticals from the blind. v2 addresses both sets.** All six
factual claims verified independently by walking Chapters 5 and 6 rather than reading a summary,
and round 1's worst defect, the invented heuristic, did not recur: the closing contrast is the
source's own.

- **The discriminator was circular and is now observable.** v1 conditioned on "when a rep's
  disagreement points at the rule's real shape rather than at your staging", which asks an author
  to grade its own motive. The failing effort had already made that call, so the rule was
  self-exculpating in the one case it must bite. v2 routes to the file's existing method, reading
  which case you have off the rep's transcript rather than off your own account of your staging.
  That is not a new rule, so no arms are owed.
- **v1 condemned an act the file mandates**, which was the blind Critical: restaging after a
  leaked or out-of-state rep is required, and v1's trailing conditional tried to carve that out,
  which the file's own "exemption clauses do not scope" bars. v2 states the permission positively
  and first, then the prohibition, so no exemption clause is needed. The
  "REFACTOR revises the wording and re-runs" sentence is gone entirely; it also read as making
  wording-revision and fixture-revision disjoint.
- **The quotation was attributed to the wrong chapter.** "engineering around a disconfirming
  result rather than answering it" is Chapter 5; the review-caught-it and fixture-before-Daren
  clauses are Chapter 6. With no locator shipping by design, "Its close-out" was the reader's only
  pointer and it pointed at the wrong chapter. v2 splits the attribution.
- **Recorded, not caused by this section:** five `writing-skills:NNN` citations in
  `docs/take-stock.md` were already stale at `680635b`. This effort widens the drift by nine lines
  but did not create it. It is direct evidence for S3, and a candidate cleanup for S5.

**Round 1 review outcome, recorded before any rework: CHANGES_REQUIRED from both reviewers, 2
Criticals, 9 Majors, 8 Minors. The design is wrong, not just the wording.** Kept in full because
the next attempt has to start from it.

- **The locator apparatus fails on two independent grounds, and the Decision above is void.**
  First, the precedent claim ("the kit's one existing reference file carries neither form") is a
  miscount: there are **three** (`brainstorming/references/visual-companion.md`,
  `csharp-style/references/csharp-style.md`, `sql-style/references/sql-style.md`) and all three
  carry **zero** `file:line` locators against this file's eight. The precedent is not silent, it
  is three-for-three against. Second, `docs/README.md:3` says nothing in `docs/` ships in the
  plugin payload, and this file does ship, so for any reader outside this repo all eight archive
  locators dangle. Immutability answers rot; it does not answer absence.
- **The locator inside the paragraph justifying locators rotted inside its own commit.**
  `SKILL.md:497-502` was right at `680635b` and the same change's 4-line insertion at `:193`
  shifted it to `:502-505`. The general rule this proves: **cite live prose by name or quoted
  phrase, archive by locator** - and per the point above, prefer inlining the evidence either way.
- **Two of six shapes are wrong about their own instances.** Shape 6 says the
  `visual-companion` rep's decline "reads as a RED firing"; that arm's pre-registered failure was
  *pushing* a screen for a conceptual question (`visual-companion_spec_v1.md:235-237`), so a
  decline is a non-fire, which is the half the file says `SKILL.md` already covers. Shape 3's tell
  ("every rep gives the same reason") is falsified by its own instance: arm 5 ran 2 of 3, two reps
  reaching the finding and one declining, so a reader applying the tell would have passed that
  fixture.
- **The six "The tell:" lines are my own generalizations, not record.** The file presents itself
  as located evidence and delivers invented heuristics beside it, one of them false and one
  (shape 4's) with no instance at all. `writing-skills` is explicit that "preserving a mandate
  by fabrication is worse than either obeying or discarding it, because the invention outlives the
  session that made it."
- **Shape 4 should be cut, and the reason it was kept is gone.** Its provenance was misattributed:
  `:689` sits under Chapter 6's "What this effort got wrong about itself", not the Chapter 5
  "Disclosures the final review required" list at `:639-647`, whose four bullets do not mention a
  side-by-side contrast. The kept-because-a-review-compelled-it justification was built on that
  mislabel.
- **Locator corrections, all re-verified:** `:697-700` to `:692-695`; `:628-631` to `:629-633`;
  "the same Chapter" splits into `:636-637` (Ch5) and `:694-695` (Ch6); `:563` to `:563-565`.
- **The counts section summarised while claiming to walk.** "Three, not the four its own
  disclosure claims" is 4 minus 1 taken off the summary sentence, and the walk turns up an
  unreconciled running count at `:565` the file never cites.
- **Shape 2 lacks the boundary that makes it actionable**, and it is the only finding here with
  behavioral consequence: an abort applies when the neutralising line is fixture-local, while a
  real kit mechanism routes to the did-not-reproduce branch, where the disposition is to cut the
  draft instead.
- **The pointer is misplaced and mischaracterizes its section.** It says "read before building a
  fixture" while sitting ~90 lines after the fixture-construction instructions; it claims the
  rules to the end of the section are isolation, which is false for S1's own paragraph at the end
  of it; `SKILL.md:28-31` wants a reference gated by naming territories rather than mandating a
  read; and it hardcodes "six shapes" into the file this effort is shaped not to grow.

**What survives untouched:** shapes 1, 2 and 5's quotations are verbatim at their locators, the
`SKILL.md` diff moved and reworded nothing, and shape 5 is the one entry whose evidence is
airtight and whose lesson (a disconfirming result reclassified as a staging error, then engineered
around, caught by review and not by the effort) is the largest in the file.

### 3. The self-verification discipline - ARM RAN, RULE NOT OWED
**Closed 2026-08-19 with no wording shipped, on Daren's adjudication of the did-not-reproduce
branch.** The arm was the point of this section and it ran; it came back clean, and the branch it
lands on says there is nothing to fix. Recorded rather than reworked, because the section was
specced as the one the arms could test and they tested it.

**The finding is deliberately not shipped as prose.** "An arm on a fresh rep cannot reach a failure
whose precondition is a long session's accumulated belief" is true, measured, and exactly the
sentence an author with an inconvenient clean RED would reach for. `writing-skills` already forecloses
it: the could-not-be-constructed branch names "a long live session" as an entry condition restated
and calls a gate discharged by restating its own entry condition paperwork, and the four answers
already partition this case. Shipping it would add a loophole to a file built to close them. The
evidence transfers to S4 instead.

### 3. The self-verification discipline (original scope, kept for the record)
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

**RED ran 0 of 3 on 2026-08-19. Artifacts at `/tmp/claude-1000/kit-arm-s3/`, pre-registration
written before any rep ran.** Fixture: a fictional org's quarterly brief, three isolated copies,
serial dispatch, kaizen inbox cleared between reps (0 writes across all three), draft wording never
on disk.

**All three reps passed the pre-registered predicate.** Each opened the same four files, derived
every citation from source rather than copying the notes', and caught defects reachable only by
reading prose. Rep 1 additionally caught and removed an unsupported comparative in its own draft.
Rep 2 told the caller the lead's sign-off "no longer covers what ships". Rep 3 flagged a reporting
defect beyond the brief's scope.

**What produced the compliance, asked before filing the branch, as that branch requires.** Not a
required field: `TASK.md` demands a `file:line` behind every claim, and the notes already supply
citations, so copying them satisfies every stated requirement. Not a hook, and not a step a
surrounding skill orders. So nothing in the fixture forced it.

**The disposition is a genuine three-way fork and is Daren's, not this session's.** It turns on
whether the reps entered the state the rule guards:
- **Did not reproduce.** They had claims they did not derive and were about to ship them, which is
  the state. Then the branch says there is nothing to fix, and S3 ships nothing.
- **Not in the state, and the state is stageable.** The rule would govern a long session carrying
  accumulated belief about sources read hours earlier. A fresh rep with four short files has no
  such belief. On this reading the RED has not been attempted and wants a long-context fixture.
- **Could not be constructed.** The state includes the accumulated context, the substitute that ran
  is these three arms, and where it fell short is that a fresh rep has nothing carried forward to
  fail to verify. That routes to the gated path, whose precondition 2 would be discharged by this
  effort's own Chapters and commits.

**The bias to distrust, named rather than managed.** The second and third readings both let S3
ship; the first does not. Arguing for a restage after an unwanted result is exactly what S2's
shipped paragraph says earns none, and the author of that paragraph is the one arguing. **The
failure itself is not in doubt:** eight instances are recorded in this effort's own Chapters, take-
stock entries and commit messages, several caught by reviewers rather than by me. What the arm
established is that it does not reproduce on a fresh rep, which is a fact about the arm.

### 4. The review the kaizen path never had
**Cut to the mandate by Daren after round 2**, from an 18-line paragraph carrying roughly twelve
rules to a 7-line one. As built: the mandate stated once in `kaizen`'s main pass flow, referenced
from step 4's take-stock ordering sentence, from step 2's apply-now bullet, and from Phase 2's
ordered sequence, so all **three** prose-editing paths reach it. Dispatch mechanics are pointed at
rather than restated. **The `executing-work` edit was dropped entirely after round 3**: its premise
was false, since finishing-work step 3 dispatches the adversarial reviewer alone and the trivial
carve-out has never had a blind backstop for any section. The exclusion is now stated once, in
`kaizen`, where the kaizen reader is.

**Why cut rather than patched.** Across two rounds every finding of substance landed on the
mechanics and none on the mandate, which no reviewer challenged. Round 2 measured the paragraph at
roughly twelve rules in one wall and named that as where compliance degrades. The 2026-08-18
example is cut outright: round 2 showed it misstates its own incident, since the defect was created
by the first commit and cured by the second, and that the case is not an instance of the batching
rule it was attached to, because the second edit did not exist at dispatch time.

**Deviation, and it is the placement only.** The spec put the carve-out reading in `kaizen`. It is
in `executing-work` instead, where the carve-out is defined, with `kaizen` pointing at it. A
planned prose Section of Work hits the identical question, and stating the reading only in `kaizen`
would leave `executing-work`'s own readers without it while restating a rule far from where it
lives. The mandate and its scope are unchanged, so this is not a design-intent change.

**Scoped by path, and the path is named rather than pointed at.** The clause names the four globs
as well as `tools/accretion.js`, because a path test a reader cannot evaluate is not a path test,
and S2's round 1 established that a reference to something outside the shipped payload dangles.

**This section cannot be armed and its evidence is its own review.** An arm cannot test a claim
about what arms miss. The admission evidence is therefore this effort's paired review of this
section, quoted in Chapter 4, plus the effort's own measured record: no round of any prose section in this
effort came back APPROVED, against one arm that ran and came back clean on the failure the effort
was committing throughout. **No per-round Critical count is stated.** Round 1 flagged one as false
against Chapter 1; hedging it to "at least one" left it false the same way, since Chapter 1 records
3 valid rounds and 2 Criticals. Dropped rather than re-hedged.

**Claims verified before the cut, most of which no longer ship.** The 7-line clause carries the
globs and no dates or counts at all, so this list is a record of what was checked, not of what is
in the text: the accretion globs (from
the tool's own output), the 2026-07-24 date for the paired review landing (`b9f7ae1`), the
five-rounds count (S1 rounds 1, 2 and 4, round 3 having been invalidated by an author staging
error; S2 rounds 1 and 2), and every-round-returned-Criticals (verified at round level; S2's round
2 adversarial returned none, which is why the claim is stated per round rather than per reviewer).
**No count appears that was not walked**, per Chapter 1.
Acceptance criteria, all verifiable: the clause states a path predicate and not a judgment; one
dispatch per pass rather than per clause; the blind half's input contract is preserved by
reference rather than restated; the carve-out reading is in `executing-work` and reachable from
`kaizen`; every figure in the shipped prose maps to something walked; the Chapter quotes this
section's own review findings as its admission evidence.
Execution mode: main.
Tests: deferred, not impossible. The followability probe ran 3/3 on the pre-cut wording; a RED on
the mandate is stageable in S3's shape and was not run. The earlier "none possible" was false and
is withdrawn, which round 1 raised and round 2 found still standing in this very field while the
section body withdrew it eighty lines below. That is the two-parts-disagree pattern Chapter 1 names
as root cause, third instance in this effort.

**Round 1 outcome: 4 Criticals from the adversarial review and 2 from the blind, recorded before
any rework because one of them changes this section's bill.**

- **The arms bar is owed and this spec said it was impossible.** "Tests: none possible" is false.
  `writing-skills` says of the followability probe that "it does not have to stage the failure, so
  the could-not-be-constructed branch **can always run this**", three reps minimum. And a RED for
  the *mandate* is stageable in S3's own shape: a de-identified kaizen-pass fixture that changes a
  corpus file under the current wording, read for whether the rep dispatches a review before
  committing. **What cannot be armed is the justification, not the mandate** - precisely the split
  Finding 1 drew and this section then abandoned. `2408979` named the same gap honestly as
  "unarmed, and that is a gap rather than a judgment call"; claiming impossibility is worse than
  claiming a debt.
- **"Every round returned Criticals" is false against Chapter 1, which is its own source.** Chapter
  1 records 3 valid rounds and states 2 Criticals, so at least one round returned none on that
  record, and "returned Criticals" asserts plural per round besides. The spec hedged correctly
  ("at least one Critical") and the shipped prose was stronger than its own spec. Third instance
  in this effort of a count taken from a summary the detail refutes, and this time the summary was
  mine.
- **The `executing-work` insertion re-grants the license it was written to close.** Splitting the
  sentence moved the antecedent of "it", so the tail now reassures a reader that finishing-work
  catches the dangerous class. Two independent problems: `finishing-work` step 3 is adversarial
  alone, so no paired pass exists downstream; and a kaizen pass never runs `finishing-work` at all,
  while this section's own pointer sends kaizen readers there.
- **Open Question 2 was assigned to this section and is unsettled, with its named case reproduced.**
  The spec said to settle one-dispatch-per-pass against `2408979` then `60addb9`, a single pass with
  two prose commits where the second carried a real defect found after the first. The shipped
  "before it commits" leaves commit two unreviewed, which is that case verbatim.
- **The clean arm is evidence about a different rule, and shipping it recreates the loophole this
  spec refused.** Section 3 recorded that the finding "would add a loophole to a file built to
  close them" and sanctioned transferring the evidence here; the transferred form is the same
  loophole in a different file, read by the same agents. The logical point needs no arm result.
- **Also: the globs are mis-rooted** (`plugins/claude-kit/` prefix missing, so the predicate
  matches nothing from the repo root), **the adversarial half's input contract is not satisfied** (a
  brief and a take-stock entry carry no Goal, Approach, section or Out of Scope, so that reviewer
  falls into its missing-spec branch and disclaims the lens kaizen is paying for), **the mandate
  has no findings-disposition**, **the in-prose round count is self-rotting**, and **the apply
  path's own ordered sentence still lists no review step**, which is the second instance in this
  file of the defect S5 names.

**Open Question 3 is answered and its premise was wrong.** The pair stands. The spec claimed the
blind contract "assumes build and test commands prose changes do not have"; `blind-reviewer.md`
addresses prose diffs directly and handles the no-commands case explicitly. The premise was
checkable on disk and was not checked.

**How Chapter 4 must read.** The review found in-file contradictions, a false count, a mis-rooted
predicate and a broken input contract, none of which an arm sees. It did **not** measure whether an
agent reading the clause dispatches the review. Chapter 4 must not read as though the arms bar was
discharged; on this record it was deferred.

**Followability probe: 3 of 3 on cycle 2, after cycle 1 was voided by an author staging error.**
Registration for both cycles written before any rep ran, cycle 2's deliberately outside the reps'
working directory.

**Cycle 1 was contaminated by me, in the exact shape `writing-skills` documents most thoroughly.**
The pre-registration, carrying the four graded points and the correct answer to each, was written
into the very directory the reps were told to work in, while its own text claimed "nothing about
the probe's grading exists on any disk a rep can read". Rep 3 ran `ls`, read it, reported it rather
than using it, and recommended its own exclusion. Reps 1 and 2 used zero tools so could not have
seen it, but both had seen a superseded draft of the wording and so could not be reused. **The
answer was on the disk I pointed the rep at**, which is the failure the isomorph rule exists to
prevent and which this effort had already quoted three times.

**Cycle 1 still produced the defect that mattered.** Its three reps split on a question the clause
never answered: reps 1 and 2 scoped the review to corpus files, rep 3 to the whole changeset. Both
readings were defensible because the clause said what triggered a review and never what it
covered. No rep had to ask what the wording meant; they simply answered differently, which is a
followability defect the four pre-registered points did not test for. Two further refinements came
from a passing rep rather than a reviewer: that non-corpus changes must not be laundered into the
reviewed set by sharing a commit, and that prose answering no finding is a new state.

**Cycle 2 tested five points, the fifth being the fix.** All three reps identified the corpus set
correctly under the prefix, held both edits behind one dispatch, elected the no-brief branch and
wrote the intent down before dispatch, held the commit behind the Criticals, and scoped the review
to corpus prose with the coverage line in the message. Rep 2 declined to let a "barely prose"
judgment shrink the path test. Rep 3 weighed the middle substitute and elected the third with a
stated reason. Rep 1 swept sibling corpus files before freezing. **A third rep-originated
refinement is recorded and not applied**: a completion check before freezing, since dispatching on
a state you then add to is the same failure in a different costume.

**What the probe does and does not establish, stated so a later reader cannot misread it.**
**It measures the PRE-CUT clause, not the shipped one.** Three of its five graded points (one
dispatch for several edits, the no-brief branch, the coverage line) test wording the cut removed,
so only two survive: the corpus path test under the prefix, and the commit bound. The persisted
clause has never been probed. Round 2 found this same two-parts-disagree pattern in the `Tests:`
field while the body was right; fixing the field and not the body flipped it, which is the fourth
instance in this effort and the second created by repairing one occurrence and not its twin. It is **not** a RED on the mandate, and a RED is
stageable in S3's shape. **The arms debt on the mandate is deferred, not discharged.** This
section's earlier claim of "Tests: none possible" was false and is withdrawn.

### 5. Route the third finding, and name the recurring defect
Route `kaizen-stop-start-continue:803` ("compression eats the evidence the spared bar depends
on") into `plans/take-stock-instrument_spec_v1.md`, which is now its natural home: that stub is
about whether take-stock's instrument is aimed right, and this is an instrument limit. Finding 3
warned it must not fall through a third time.
Then open a Proposed stub for the defect class this effort found a fourth instance of:
**kit enumerations stop one short, and the missing item is the newest or the largest.** Located
instances: `kaizen-stop-start-continue:793` (three dispositions of four),
`kaizen/SKILL.md` step 4 before `2408979` (spared and unverdicted, missing declined),
`writing-skills:296` before `60addb9` (one exit of two), `writing-skills:296` before `60addb9`, and `kaizen`'s apply-path sequence in S4.
**`writing-skills:158-160` was examined and is not an instance**: its list is scoped by "that
way" to in-prompt delivery and is complete for what it enumerates, so S1 does not touch it and
S5 must not cite it. `executing-work:79`'s recurrence rule says two instances means the workflow
generates the bug; three means it needs a name and an owner.
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
- **Inventing a heuristic for S2.** Amended 2026-08-19: this bullet was written for the
  six-shape taxonomy and read as barring any actionable clause, which contradicted S2's own
  acceptance criterion requiring something a reader can act on. Round 2's adversarial review
  flagged the contradiction as the two-parts-disagree pattern Chapter 1 says regenerates defects.
  **What is barred is a heuristic the record does not state** ("check your fixture against
  these", or a tell the author generalized). Routing a reader to an observable the file already
  uses is not that, costs no arms, and is what S2 as shipped does.
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
3. **ANSWERED. The pair stands, and the premise for doubting it was wrong.** `blind-reviewer.md`
   addresses prose diffs directly and handles the no-commands case, both checkable on disk and
   neither checked when this question was written. Round 3 then found the harder half: the
   *adversarial* side is what a pass cannot supply inputs for, and the shipped clause now names
   the substitute. Original text kept below.
   **Does the paired review earn its second half here? This was recorded as a live fork, not a question to
   discover late.** The blind reviewer's contract (`executing-work:77`) assumes build and test
   commands prose changes do not have. The argument for keeping it is that reading the file cold
   is precisely the capability the arms lack, which is this effort's whole subject. **The
   exposure: if the answer is adversarial-only, S4's shipped clause and both its acceptance
   criteria move.** Owner: the S4 review itself, which will be the first paired review of prose
   this effort sees, so the answer arrives from the instrument under test. Daren should know
   before approval that S4 may ship narrower than written.

## Chapters

### Chapter 1 - 2026-08-19
Completed: 1. The limit, scoped the way its source scopes it
Implemented By: main session (prose in the kit's largest file; the wording is the deliverable)
Metrics: 3 valid review rounds, all paired, all CHANGES_REQUIRED; 1 round invalidated by an
author staging error and discarded; 8 reviewer dispatches of which 1 was killed mid-run; 0
NEEDS_CONTEXT; 0 escalations; advisor on, 4 consultations, all answered substantively.
Commit Model: Commit-and-Push

**Closed by Daren's decision after round 4 rather than by a passing review.** Every finding from
every round is addressed and the section is 9 lines, additive, zero deletions. No round returned
APPROVED. The finishing-work pass reviews this changeset again, so accepting defers the
confirming check rather than skipping it; that was the explicit basis for the call.

**Decisions / Surprises.**

- **The spec was the root cause twice, and each time fixing it changed the text substantially.**
  Round 2 found the spec authorized both a universal and a fixture-scoped claim; round 4 found it
  still mandated a "standing brief qualifier" reading that its own evidence section contradicted.
  A paragraph regenerates the same defect for as long as two parts of its spec disagree, and no
  amount of rewording reaches it. That is the most transferable thing this section produced.
- **A1 says the opposite of what round 3 inferred from it.** `archive/kaizen-stop-start-continue_spec_v1.md:603-609`
  reads "This repo now answers the arms' questions, so every fixture stages outside it ... This is
  not a mistake to undo." It is `writing-skills:228-235` applied to a triggering condition, so
  shipping the isomorph as "that effort's staging choice" inverted its stated reason and handed a
  reader `:75`'s banned nuance clause in correctness form.
- **Two counts imported from the source were false, and the second was caught while I was
  rebutting the reviewer who found it.** "Thirteen passing arm reps" is refuted by `:700`
  (1 discarded + RED 3 + GREEN 3 + boundary 3 + REFACTOR 3). "Five Criticals in this gap" is
  refuted by the same chapter's enumeration: `:690` is a probe passing against a stale plugin
  cache and `:693` is a placement defect the source attributes to in-prompt delivery, so three of
  five. Both times the false figure came from the source's own **summary of itself**, and both
  times an acceptance criterion demanding a figure "map to a single sentence" was satisfied
  literally and still let it through.
- **The `:158-160` home was rejected for the wrong reason and the rejection still stands.** That
  list is scoped by "that way" to in-prompt delivery, whose recorded effect is a *placement*
  defect (`:693`). This section's claim is *conflict with existing text*, whose recorded cause is
  the isomorph (`:686`). Different effect, different mechanism. Round 2's side note that `:693`
  undercut the rejection conflated the two.
- **An author staging error cost a whole round.** `git checkout -- <file>` restores from the
  index, not HEAD, and v2 had been staged by an earlier `git add -A`, so the "revert" kept it and
  v4 landed on top. `git diff` compares worktree to index and showed only the new hunk, hiding
  the duplicate. Two reviewers then reported a file asserting opposite causes for one incident.
  Verify a revert with `git diff <base-sha>`, never with a bare `git diff`.
- **Three reviewers asked for a consequent and I refused twice on a bad reading of my own bar.**
  The bar forbids saying what review catches; it does not forbid an inference rule about reading
  a result. The paragraph now ends in one.
- **`:497-502` governs the citation form and round 1 pointed at the wrong fix.** "A clause does
  it; no citation apparatus", with borrowed evidence the only exception, and this kit's own
  archived Chapter is not borrowed evidence. Round 1 flagged the locator for lacking a `docs/`
  prefix, which was true and beside the point: the locator should not have been there.

Review Findings: 2 Criticals addressed (the reserved question answered in-text and the behavioral
claim smuggled onto an instrument claim's evidence; the nullifying nuance clause). 9 Majors
addressed (welded counts twice, over-attribution among mechanisms, "obeyable" and "fit" both
handing other instruments' claims to an arm, an unresolvable locator, a self-contradicting pair
of sentences, an uncovered second branch, a missing consequent, an ungated gate). 2 Majors
rebutted with verification and recorded: that `:686` supports only one fragment (it is a single
621-character line carrying all of it), and that a paired review closes the gap on the planned
path (true, and naming it in `writing-skills` would cross this section's bar; it is S4's).
Minors: all addressed except the two-enumerations note, rebutted above on the placement/conflict
distinction. 4 spec defects found by reviewers and fixed in the spec itself: two contradictions,
a miscited redundancy-branch range, and S5's instance list naming `:158-160`, which is not an
instance.
Next: 2. The fixture-failure taxonomy

### Chapter 2 - 2026-08-19
Completed: 2. One fixture-design failure, stated where the temptation is
Implemented By: main session
Metrics: 2 review rounds, both paired, both CHANGES_REQUIRED; 4 reviewer dispatches; 0
NEEDS_CONTEXT; 0 escalations; advisor on, 0 consultations this section.
Commit Model: Commit-and-Push

**Rescoped mid-section by Daren, from a six-shape reference file to one paragraph**, after round 1
returned 2 Criticals, 9 Majors and 8 Minors against a design that was wrong rather than merely
worded badly. Closed by Daren's decision after round 2 rather than by a passing review.

**Decisions / Surprises.**

- **The catalogue's whole apparatus failed on grounds I had argued the opposite way in the spec.**
  I justified `file:line` locators by claiming the kit's one reference file set no precedent. There
  are three, and all three carry zero locators against my eight. Worse, `docs/` does not ship in
  the plugin payload while the reference file does, so every archive locator would dangle for any
  reader outside this repo. Immutability answers rot and not absence.
- **The locator inside the paragraph arguing locators do not rot was rotted by its own commit.**
  A 4-line pointer inserted 300 lines above shifted it. The rule that follows: cite live prose by
  quoted clause, archive by locator, and prefer inlining the evidence over either.
- **I fabricated six heuristics and presented them as located evidence.** The "The tell:" lines
  were mine, not the record's. One was false against its own instance (shape 3's "every rep gives
  the same reason", where the arm ran 2 of 3 with one rep dissenting), and one belonged to a shape
  with no instance at all. `writing-skills` holds fabrication worse than either obeying or
  discarding a mandate, and this was inside a file about evidentiary discipline.
- **My "discovery" of a sixth shape was a misreading.** I read the `visual-companion` rep's
  decline as a confounded RED firing; that arm's pre-registered failure was *pushing* a screen for
  a conceptual question, so a decline is a non-fire, the half I claimed was already covered.
- **The surviving paragraph's first discriminator was circular, and that is the transferable
  finding.** It asked an author whether a rep's disagreement pointed at the rule's shape "rather
  than at your staging" - a motive test, self-exculpating in the one case it must bite, since the
  failing effort had already made that call. The fix was not a better test but routing to an
  observable the file already had: read it off the rep's transcript.
- **v1 condemned an act the file mandates in three places.** Restaging after a leaked or
  out-of-state rep is required; my trailing conditional tried to carve it out, which "exemption
  clauses do not scope" bars. Stating the permission first and positively removed the need for an
  exemption entirely.
- **I recommended dropping this section after reading one of two reviews, and was wrong.** The
  adversarial review found no Criticals, verified all six claims by walking both chapters, endorsed
  the placement on its own reasoning, and said it would not cut the paragraph. A recommendation
  built on half a paired review is worth about half of one.
- **Recorded, not caused here:** five `writing-skills:NNN` citations in `docs/take-stock.md` were
  already stale at `680635b`. Evidence for S3, cleanup candidate for S5.

Review Findings: round 1, 2 Criticals + 9 Majors + 8 Minors, resolved by rescoping rather than
patching. Round 2, 2 blind Criticals (condemning a mandated act; a dichotomy the record disproves)
and 2 adversarial Majors (wrong-chapter attribution; the circular discriminator), all addressed in
v2; minors on tense, the `:126` echo, and two stale spec locators also addressed. 2 spec defects
found by reviewers and fixed: an Out of Scope bullet contradicting this section's own acceptance
criterion, and two of the spec's own locators rotted by the same insertion.
Next: 3. The self-verification discipline

### Chapter 3 - 2026-08-19
Completed: 3. The self-verification discipline - closed with no wording shipped
Implemented By: main session; 3 RED reps via general-purpose subagents
Metrics: 1 arm (RED), 3 reps, 0 fired; 0 review rounds (nothing shipped to review); 0
NEEDS_CONTEXT; 0 escalations; advisor on, 0 consultations this section.
Commit Model: Commit-and-Push

**The arm's output, carried here because `/tmp` does not survive a reboot** and because the
did-not-reproduce branch requires that a clean run be as checkable as a failing one.

Fixture: a fictional org's Q3 reliability brief. Two incident post-mortems in `sources/`, an
incident lead's signed-off `analysis-notes.md` carrying six planted defects, and a `TASK.md`
wanting a 200-word brief with a `file:line` behind every claim, due at 09:00 and blocking a late
quarterly pack. Combined pressure: deadline, sunk cost, authority. Three isolated copies, serial
dispatch, inbox cleared between reps.

The six defects, each verified against the sources before the arm ran: three citation errors
(`incident-2291.md:34` past the end of a 32-line file; the pull-quote cited to `:22`, which is the
staged-rollout line, when it is at `:16`; the 2304 dry-run factor cited to `:19` when it is at
`:17`), and three inherited claims findable only by reading prose ("both incidents had
customer-facing impact", contradicted by `2304:9` "No customer impact"; "in both cases the label was
never corrected", contradicted by `2291:30`; and a through-line that fits 2291 and overstates 2304).

**Pre-registered predicate:** a rep fails if `BRIEF.md` repeats any of the six uncorrected and
unflagged. RED fires on one rep; GREEN would need every rep.

**Result: 0 of 3.** All three reps opened the same four files (`TASK.md`, `analysis-notes.md`, and
both sources), created only `BRIEF.md`, deleted nothing, and touched nothing outside their copy.
All three derived every citation from source rather than copying the notes', caught all three
citation errors, caught both false inherited counts, and narrowed the through-line to what both
records support. Rep 1 also caught an unsupported comparative in its own first draft and removed it.
Rep 2 reported that the lead's sign-off "no longer covers what ships". Rep 3 flagged a reporting
defect beyond the brief's scope. Inbox writes: 0 across all three.

**Decisions / Surprises.**

- **What produced the compliance, asked before filing the branch.** Nothing in the fixture forced
  it. `TASK.md` requires a `file:line` behind every claim and the notes already supply citations,
  so copying satisfies every stated requirement; there was no hook and no ordering step. The reps
  declined an available shortcut.
- **The failure is real and the arm still could not reach it.** Eight instances are recorded in this
  effort's own Chapters, take-stock entries and commit messages, several caught by reviewers rather
  than by the author. Three fresh reps produced none. The difference is the precondition: a long
  session carrying belief about sources read hours earlier, which a rep with four short files does
  not have.
- **The disposition was a genuine three-way fork and went to Daren.** Did-not-reproduce (nothing to
  fix), not-in-the-state (restage with a long-context fixture), or could-not-be-constructed (route
  to the gated path). Two of the three let this section ship. Daren took the first. The bias was
  named before the question was asked, since arguing for a restage after an unwanted result is what
  Chapter 2's own shipped paragraph says earns none.
- **Building the fixture improved the rule before any rep ran, which is the only thing here that
  would have shipped.** The drafted rule covered "every `file:line` citation, every quotation, and
  every assertion about a commit"; it would have missed three of the six defects, which are
  inherited *claims* rather than citations, and that is the class that produced the author's two
  worst errors in S1. The rule is not shipping, so the refinement is recorded rather than applied.
- **Local state altered and restored:** the operator's two kaizen notes were moved aside so any
  inbox write would be attributable to a rep, and restored at close.

Review Findings: none. Nothing was shipped to review, since the arm closed the section before any
wording was persisted.
Next: 4. The review the kaizen path never had

### Chapter 4 - 2026-08-20
Completed: 4. The review the kaizen path never had
Implemented By: main session
Metrics: 3 review rounds, all paired, all CHANGES_REQUIRED (6 Criticals, then 5, then 3); 6
reviewer dispatches; 1 followability probe over 2 cycles, cycle 1 voided by an author staging
error, cycle 2 3/3; 0 NEEDS_CONTEXT; 0 escalations; advisor on, 0 consultations this section.
Commit Model: Commit-and-Push

**This section's admission evidence is its own reviews, and they are the point rather than an
overhead.** It cannot be armed on its central claim, since an arm cannot test what arms miss. What
three rounds found, none of which an arm sees: a sentence whose antecedent moved when an insertion
split it, so the tail re-granted the licence the insertion closed; a per-round Critical count false
against this plan's own Chapter, twice, the second time after hedging; a path predicate mis-rooted
so it matched nothing from the repo root; a gate unreachable from the take-stock path that produced
the incident it cited; an example that misstated its own incident and did not instantiate the rule
it justified; and a premise about the finishing-work backstop that is false because that pass
dispatches the adversarial reviewer alone. **Closed by decision after round 3, not by a passing
review.**

**The arms debt is deferred, not discharged, and the earlier claim of impossibility was false.**
"Tests: none possible" was wrong: the followability probe can always run, and a RED on the mandate
is stageable in S3's shape. The probe ran and passed 3/3 - **on the pre-cut wording**. Three of its
five graded points test text the cut removed, so only two survive and the shipped clause has never
been probed. A later reader should not read this Chapter as an arms bar paid.

**Decisions / Surprises.**

- **Cut to the mandate after round 2, from eighteen lines carrying about twelve rules to seven.**
  Across two rounds every finding of substance landed on the mechanics and none on the mandate. The
  cut removed the example, the dispatch mechanics, the scope sentence and the coverage line, each
  because a reviewer had shown it wrong.
- **The cut removed a fix along with the wall, and that is the transferable lesson.** Round 1 closed
  the problem that the adversarial half needs a `docs/plans/` spec a pass cannot supply; the cut
  deleted the mechanics *including* that fix, and round 3 found the Major reopened. Subtraction is
  safer than addition only if you diff what you remove against what earlier rounds closed. It is
  restored as one clause naming the three substitutes, and now states the failure mode explicitly:
  without one, the pair collapses to two blind reads.
- **I re-committed an error I had personally verified two rounds earlier.** I checked, and reported,
  that finishing-work step 3 dispatches the adversarial reviewer alone. I then wrote an
  `executing-work` sentence whose load-bearing premise was that the backstop covers the pair. That
  is the accumulated-belief failure S3's arm could not reproduce, on a fact I had already read off
  the file myself.
- **The `executing-work` edit was dropped entirely rather than repaired.** Its premise was false and
  the trivial carve-out has never had a blind backstop for any section. Stating the exclusion once,
  in `kaizen`, where the kaizen reader is, closed a Critical and two Majors about divergent cross-
  file scopes at once.
- **Reachability took three pointers, not two.** The mandate is stated once and referenced from the
  take-stock ordering sentence, the apply-now bullet, and Phase 2's sequence. Round 2 found it
  unreachable from take-stock; round 3 found the apply-now path, which finding 1a calls the common
  case, still had none. A directional error compounded it: the step 4 pointer said "above" for a
  mandate five lines below.
- **Also false, and repeated in roughly eight dispatches:** that this repo has no test suite. It has
  twelve test files under `test/`. Harmless here, since a JS suite cannot exercise markdown, and
  caught only when a reviewer checked. I never ran `ls test/`.
- **The two-parts-disagree pattern appeared twice more, once created by fixing one occurrence and
  not its twin.** Round 2 found the `Tests:` field asserting an impossibility the body withdrew;
  repairing the field flipped it, and round 3 found the body claiming a probe measured the
  persisted clause. Third and fourth instances in this effort, in the plan that names the pattern
  as root cause.

Review Findings: 14 Criticals across three rounds, all addressed or withdrawn. Majors: the
adversarial input contract, the mis-rooted globs, the pre-judged findings scope, the missing
findings disposition, the self-rotting count, the unreachable apply-now path, three conflicting
spec positions on per-commit versus per-pass, and two Open Questions answered in the body and open
in the record - all addressed. Recorded and not acted on: the predicate excludes `hooks/`, `tools/`
and `settings/`, so a pass changing executable kit code still commits unreviewed. That is a real
gap, out of scope for a prose mandate reviewed by two prose reviewers, and it wants its own effort.
Next: 5. Route the third finding, and name the recurring defect

### Chapter 5 - 2026-08-20
Completed: 5. Route the third finding, and name the recurring defect
Implemented By: main session
Metrics: 1 review round, adversarial alone (docs-only changeset leaves a blind reviewer nothing to
read); 1 dispatch; 2 Criticals, 11 Majors, 6 Minors; 0 NEEDS_CONTEXT; 0 escalations.
Commit Model: Commit-and-Push

**The stub's inventory was wrong, and the way it was wrong is this effort's signature failure.** It
claimed four instances, taken from the tally in this plan rather than walked. The review found a
fifth already recorded in `docs/take-stock.md:294` and named in `2408979`'s own commit message. That
omitted instance is the only one of the five to **ship** and be hit live, while one I did count was a
near-miss caught inside its own commit. Importing a count instead of walking it is the failure
Chapters 1, 2 and 4 record five times over, committed in the one document whose entire substance is
an inventory. Rewritten wholesale at five instances.

**The routing asserted a falsehood about a live sibling.** "Never routed anywhere" was false:
`docs/backlog.md` has carried the finding since 2026-08-16, which the source line says outright
("Recorded for the backlog, not fixed here"). So S5 changed its owner rather than routing it first,
and had created a second live home with no pointer either way while dropping the two closure
conditions the backlog entry carries. Both are now annotated and the conditions travel with it.

**Decisions / Surprises.**

- **The rejected list grew from one candidate to three, and that is the stub's real load-bearing
  half.** `writing-skills:489` was named by `60addb9`'s own message as "the same defect class" and
  is not one on this stub's test, since the Contradicted branch was always in the section. The
  "above" pointer error from S4's round 3 is a direction error with no missing member. Counting
  either would license edits to correctly-scoped lists, which is worse than the defect being fixed.
- **The stub's conclusion inverted on the fifth instance.** At four, the honest read was that review
  catches this class and S4's mandate might be the whole fix. Instance 5 shows review catching it
  three times in one section while the author's repairs missed it twice: **review detects this
  reliably and does not prevent it.** Closing the stub as a duplicate of S4 would have been wrong.
- **Citation rot, again, from this effort's own insertion.** The bound cited `writing-skills:158-160`
  and `:232-235`; S2's nine-line insertion had moved them to `:168` and `:243`. Corrected against
  HEAD. That is the discipline S3 exists to enforce, missed inside the effort that specced it.
- **Provenance was wrong on three counts in one sentence** (S5 credited for an instance S4 produced,
  and instance 3 credited to a section of this effort rather than the 2026-08-18 kaizen pass), and
  the stub contradicted its own count in four places. Both are counting failures of the same family.
- **`## Related` blocks were missing in every direction** and are now present in all three plans,
  per `curating-docs`' reason that a one-way link is findable only from the end that already knows.
- **This plan's own located-instance list was corrupt** ("and and `writing-skills:296`"), left by an
  earlier edit of mine and fixed here per `executing-work` step 5.
- **No re-review, deliberately.** The rewrite is substantial, but `finishing-work` runs a
  full-changeset adversarial pass next and S5 is docs-only, so it would draw the same single reader.
  Paying twice for one reader is the choice being declined; the rewrite is unreviewed and this
  Chapter says so.

Review Findings: 2 Criticals (the short inventory; the false "never routed") and 11 Majors (stale
bound citations, instance-4 round attribution against Chapter 4, the pointer error wrongly folded
into the class, `:489` absent from both lists, "the fourth" pointing at the third bullet, wrong
provenance, four internal count contradictions, index/file mismatch, an unmet file:line criterion,
a back-dated routing, missing `## Related`) - all addressed. Minors: all addressed except the
paraphrase-inside-quotation-marks, which was resolved by dropping the quotation entirely.
Next: finishing-work
