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

## The direction this should probably take: invert the default

Added 2026-08-16, after the pass that wrote this stub measured the kit. **Recorded as a
recommendation with its evidence, not as a settled design** - it is the thing to argue with
first, and a design pass is free to reject it.

The two notes read as "the arms have a blind spot, so add a review." The measurement says
something stronger. **In the one effort where both gates ran and the outcomes were counted,
the arms caught none of the sixteen Criticals and the paired review caught all sixteen**
(`archive/kaizen-stop-start-continue_spec_v1.md:821`, `:686`, `:784`). Thirty-plus arm reps
passed wording that had sixteen Criticals in it, and every Critical was a contradiction with
the target file.

That is not the arms failing at their own job. Arms test followability under a task, and they
did that. It is that **followability is the rarer failure in kit prose.** The common one is
contradiction with the file the wording lands in, and the arms are structurally blind to it
while the review is built for it. So the kit currently spends its expensive gate on the rare
failure and leaves the common one to a gate that is optional on the planned path and absent on
the kaizen path.

The inversion: **paired review becomes the mandatory gate for any kit-prose change, and the
arms become the exception reserved for a genuinely new behavior claim** - a rule an agent could
rationalize around, where what is in question is whether the wording changes conduct at all.
Fact corrections, cross-references, deduplications and compressions take the review and stop
there, which is roughly what commit `1526456` already does in practice without saying so.

**Why this is worth more than the wording fix the notes asked for.** The current default costs
a multi-hour arm run for a two-word change, which has three observed effects: small fixes do
not get made, the ones that do consume whole sessions, and those sessions generate fresh
friction about the apparatus, which grows the apparatus. `writing-skills` is now 515 lines,
the largest file in the kit, against `systematic-debugging`'s 46. `writing-skills` and `kaizen`
together are 698 of the 3,251 lines across all eighteen skills, 21.5%, and 34 of 140 commit
touches. The loop that is supposed to improve the kit is spending a fifth of it on itself.

**The bar this proposal has to clear, and it is not a low one.** Retiring or demoting a gate is
the highest-blast change in this repo, and the argument above rests on a single effort's
counted outcomes. Before acting, check whether the pattern holds in the other efforts that ran
both gates (`red-for-rule-changes`, `visual-companion`, `docs-lifecycle-and-guards`), since one
effort is enough to raise the question and not enough to settle it - which is this file's own
rule at `writing-skills:461-466`, applied to a claim about the kit rather than about a system.

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
