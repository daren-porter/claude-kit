# What the Arms Can Establish, and What a Fixture Owes

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-16

## Why this exists

Two kaizen notes, both filed 2026-08-16 against `writing-skills`, are one subject. The
skill's testing apparatus is now the two largest sections in the kit, and both notes say
the same thing from opposite ends: **it specifies isolation exhaustively and says almost
nothing about what an arm can and cannot establish.**

- **Fixture design is unwritten.** Lines 193-243 are entirely isolation - parallel reps
  sharing a write path, the kaizen inbox, reps reading each other's outputs, the answer
  reachable on disk. The only fixture-*design* content in the file is two fragments: an
  untempted RED tempts nothing (`:86-88`) and a fixture staging the case the rule does not
  cover comes back clean by construction (`:99-100`). The reported failure is neither: four
  fixtures in one effort were confounded because they were **reverse-engineered from the
  wanted answer** rather than staging a realistic situation. Reps caught three of the four.
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
- The file already half-knows it, at `:693`, about a narrower case: "GREEN supplies wording
  in-prompt, so the arms structurally cannot detect a placement defect."

For the confounded-fixture half, `docs/archive/kaizen-stop-start-continue_spec_v1.md:661`
records one instance in the effort's own work: a fixture whose v1 "collapse[d] the exact
distinction the RED exists to test", rebuilt with a control arm, "the confounded-fixture
failure the live inbox note of 2026-08-15 describes, met in my own work". **Unresolved:**
that Chapter cites a 2026-08-15 note and the note now in the inbox is dated 2026-08-16 and
says four fixtures rather than one. Reconcile them before quoting either forward; the design
pass owes the count, not this stub.

## The three findings that should drive the design

**1. The bill splits, and the split is not obvious.** These are two changes wearing one coat.
The *fact* half - an isomorph-based arm cannot detect contradiction with its target file - is
a missing statement of fact with located provenance, which commit `1526456` establishes takes
no RED cycle. The *mandate* half - a paired review is therefore not optional for wording
changes - is a new rule an agent can rationalize around under time pressure, and owes the
arms in full. Shipping them as one paragraph would smuggle the second in on the first's
evidence, which is the failure `writing-skills:432-437` already names.

**1a. The mandate is already shipped for planned work, and the hole is the kaizen path.**
Checked rather than assumed. `executing-work/SKILL.md:75` step 3 already says "Every section
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

**3. There is a third finding in the same territory, already recorded and never routed.**
`docs/archive/kaizen-stop-start-continue_spec_v1.md:803`: "**Compression eats the evidence
the spared bar depends on.** The attached-content column protects it inside a compression,
but nothing states the systemic version: a corpus compressed hard enough stops being
verdictable. Recorded for the backlog, not fixed here." That is the same shape as both notes
- a real limit of an instrument, recorded where nobody reading the instrument will find it.
Decide whether it joins this effort or gets its own; do not let it fall through a third time.

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

So the direction is **consolidation, not demotion**. Three parts, cheapest first:

1. **State the limit.** An arm cannot detect contradiction with the file the wording lands in.
   Fact, located, no RED owed.
2. **Close the review hole.** The paired review is mandatory for planned work and absent from
   the kaizen apply path, which is where most kit prose is actually edited. See finding 1a.
3. **One findable ladder.** A single decision procedure naming every class of kit-prose change
   and its bill, in one place, replacing four cross-referencing exceptions. Mostly a
   consolidation of text that already exists, which puts it on the compression bill rather
   than the arms - and the claim inventory is what will prove that, since a ladder that
   quietly widens or narrows a trigger is a rule change wearing a compression's clothes.

**Sizing, for whoever picks this up.** `writing-skills` is 515 lines, the largest file in the
kit, against `systematic-debugging`'s 46. `writing-skills` and `kaizen` together are 698 of the
3,251 lines across all eighteen skills (21.5%), and 34 of 140 commit touches. The loop meant to
improve the kit spends a fifth of it on itself. That is the argument for part 3 and not for
cutting anything: none of those lines is unfounded, they are simply unnavigable.

## What this stub is not

It does not decide the wording, the home, or whether the paired-review mandate should ship at
all. Note that the mandate is partly self-defeating as evidence: the arms cannot test a rule
about what the arms cannot test, so its own admission runs through review rather than through
a RED, and the design pass should say so out loud rather than discover it late.

## Open questions for the design pass

1. Does the fixture-design guidance want rules or a worked negative example? The one recorded
   instance is a fixture that collapsed the RED's control, which is a shape, not a checklist.
2. Answered while writing this stub, and kept because it reframes the effort: yes for planned
   work, no for a kaizen pass. See finding 1a. What remains open is the *shape* of the fix -
   whether the kaizen apply path dispatches the pair itself, defers wording changes into an
   `executing-work` run, or scopes the requirement to changes above some observable threshold.
   The first is cheapest and the third needs a predicate that is not a judgment call.
3. What is the smallest true statement of the limit? "Arms cannot catch in-file
   contradiction" may be too strong: a fixture handed the real file would catch it and lose
   its isolation. The tradeoff is the claim, not the blanket.
