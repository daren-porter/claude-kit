# Enumerations in the Kit Stop One Short

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-20

## Related

- Opened by `archive/arm-boundaries_spec_v1.md` S5. Its S4 produced instance 5.
- Instances 3 and 4 came from the kaizen pass of 2026-08-18 (`2408979`, `60addb9`).
- `plans/take-stock-instrument_spec_v1.md` - a sibling defect-class stub from the same effort, which
  links here; this is the return link that was missing when Chapter 5 claimed all three plans were
  cross-referenced in every direction.

## Why this exists

**At least five times** now, an enumeration in the kit's own prose has been found listing every
member of a set except one, and the missing member has been the newest one every time. **Five is a
floor rather than a total**, and the reason is itself evidence: a sixth surfaced during the close-out
of the very effort that opened this stub, when QA found a six-item list of bars in
`arm-boundaries_spec_v1.md` described as five, after four QA rounds had read past it. Any count here
should be read as "what has been walked so far". Two were caught by review,
two by an author who had just recorded a prior instance, and one shipped and was hit live.
`executing-work:79` says two instances means the workflow generates the bug and the fix belongs at
the generator.

**The count was wrong when this stub was first drafted, and how it was wrong matters.** It said
four, taken from the tally in `arm-boundaries_spec_v1.md` rather than walked. The review that
caught it found a fifth already recorded in `docs/take-stock.md` and named in `2408979`'s own
commit message. Importing a count instead of walking it is the failure that effort documented five
separate times, committed here in the one document whose entire substance is an inventory.

## The instances, each verified against the file or commit

1. **`archive/kaizen-stop-start-continue_spec_v1.md:793`**, a Major the paired review found: "step 3
   enumerated three of four dispositions and the missing one was the new one." The effort that
   introduced the new disposition wrote the enumeration without it.
2. **`kaizen`'s gather sub-step, fixed at `e69eb9e`. This one shipped.** It told a pass to read
   `docs/take-stock.md` "for what the last pass examined, cut and spared", three of the four things
   that file carries; the fourth is a retirement candidate recorded and not acted on, the only class
   in it that is pending work. `docs/take-stock.md`'s 2026-08-16 entry records it being hit live,
   in the passage beginning "The defect found was an omission, not accretion, and it is a
   recurrence" (**cited by phrase: that file grows from the top, so a line number there rots on the
   next entry**): the pass ran that
   sub-step, read the file, and did not surface the parked candidates until prompted. **The only
   instance so far to reach a released state**, which makes it the strongest evidence here and the
   one the first draft of this stub omitted.
3. **`kaizen/SKILL.md:127` at `2408979^`.** Step 4 read "spared and unverdicted entries included",
   naming the two verdicts easiest to omit, while the same commit was adding **declined** as a
   third. Caught inside that commit, and only because the take-stock entry then being written had
   just recorded instance 1.
4. **`writing-skills:296` at `60addb9^`.** The disposal rule named retirement as the only exit for a
   restored claim at a moment when `2408979` had just created a second one. The cross-file version:
   the enumeration and the new member lived in different skills, and the commit adding the member
   did not look outside its own file.
5. **`kaizen`'s apply-path ordered sequence, `arm-boundaries` S4.** The sequence listed no review
   step while S4 was adding one that belongs between the change and the commit. S4's round 1 found
   it, recorded in that plan as "the apply path's own ordered sentence still lists no review
   step". **Cited by phrase and not by line**: two successive attempts to give this a line number
   were both wrong, the second because the same uncommitted diff had shifted the file under the
   fix. A live plan doc takes a quoted phrase; only the archive takes locators. Per Chapter 4, the class then recurred twice more in the
   same section at other sites: round 2 found the mandate unreachable from the take-stock path, and
   round 3 found the apply-now bullet, which finding 1a calls the common case, still without a
   pointer. **Three rounds, three sites, one class** - which is what makes this the instance showing
   the class survives a first repair.

## Examined and rejected, which is what keeps the pattern from licensing bad edits

A rule predicting "any short-looking list is missing an item" would authorize edits to
correctly-scoped lists, a worse defect than the one it fixes. These three are the guard.

- **`writing-skills:168`** enumerates what GREEN leaves untested as "placement, trigger, and whether
  a real session would read the rule at all". **Not an instance:** "that way" scopes it to in-prompt
  delivery, and contradiction-blindness has a different cause, the isomorph requirement at `:243`.
  Complete for what it enumerates. `arm-boundaries` S1 nearly shipped a fix here before checking the
  scoping.
- **`writing-skills:489`**, the counter-case section's introduction, which `63cd160` corrected from
  "a case the rule does not cover" to "a case the rule as written does not fit". `60addb9`'s message
  calls it "the same defect class". **Not an instance on this stub's own test:** the Contradicted
  branch was always in the section, so the missing member was not the newest one. A false statement
  of scope, which is a neighbouring class.
- **The "above" pointer S4's round 3 found**, naming a mandate five lines below it. **Not an
  instance:** a direction error with no missing member at all. Counting it would be exactly the
  over-generalization this section exists to bar.

## The shared shape

An enumeration is written when the set has N members. A later change adds member N+1. The
enumeration is not revisited, because nothing points from the new member back to the places that
list the old ones. The missing item is therefore always the newest, which is also the one a reader
is least likely to supply from memory.

## What a design pass has to settle

- **Whether review is sufficient, and instance 5 says no.** Instances 1 and 5 were caught by review;
  2 shipped; 3 and 4 were caught by an author primed by a prior instance. But in instance 5 review
  caught the class three times in one section while the author's repairs missed it twice. **Review
  detects this reliably and does not prevent it**, so `arm-boundaries` S4's review mandate is not
  the whole fix, which is what closing this stub on those grounds would have assumed.
- **What a mechanism could key on.** A grep cannot tell a complete three-item list from an
  incomplete one, per the rejected candidates above. Anything that works keys on the act of adding a
  member to a named set, which is a human judgment rather than a detector.
- **Whether the real defect is that vocabularies have no single home.** Every instance involves a
  set (dispositions, verdicts, exits, steps) defined in one place and enumerated in others.
  `take-stock.md` declined pointer-plus-restatement as a deliberate house pattern on 2026-08-18, so
  the tradeoff has been weighed once in the other direction. But it distinguished within-file
  repetition from a cross-file pointer placed at the moment of the action, which it preferred, and
  instance 4 is that cross-file case.

## Open Questions

- Are there instances outside `kaizen` and `writing-skills`? All five are in the two most accreted
  skills, which may mean the pattern is real everywhere and visible only where prose is dense, or
  may mean it is a property of those two files. Answering it means walking the class over a skill
  the accretion ranking does not surface.
