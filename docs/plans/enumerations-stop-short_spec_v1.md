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

**At least eight times** now, an enumeration in the kit's own prose has been found stopping short of
its set. In instances 1 to 5 the missing member was the newest one every time; instance 6 is the
variant where nothing is missing and the description has gone false instead; instances 7 and 8 were
committed by the kaizen pass that was writing this file, one of them while repairing the other.
**Eight is a floor rather than a total**, and the reason is itself evidence: a further one surfaced
during the close-out of the very effort that opened this stub, when QA found a six-item list of bars
in `arm-boundaries_spec_v1.md` described as five, after four QA rounds had read past it. It is
deliberately unnumbered because it was never walked against this file's own test. Any count here
should be read as "what has been walked so far", and there is a known backlog behind it:
`docs/archive/kit-usage-awareness_spec_v1.md` records at least four more (`:1051-1057`,
`:1060-1067`, `:1311-1315`, `:1580-1583`), deliberately left unwalked rather than numbered, since a
numbered entry is one more statement every later edit has to keep consistent. Of the eight, **five were caught by review** (one of
them a review of the round repairing the instance before it), two by an author who had just recorded
a prior instance, and one shipped and was hit live.
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

6. **`docs/architecture.md:44` at `a0a6d3d`, the count-held-but-content-stale variant, caught by review inside
   the usage-awareness effort.** `a0a6d3d` (2026-08-30) widened `usage-barrier.js` from denying at
   the barrier to denying from the wind-down threshold upward, and updated only
   `docs/usage-awareness.md` and its plan doc, leaving `README.md`, `docs/README.md` and
   `docs/architecture.md` all stale; `244662c` (same day) repaired all three together. **What makes
   this one the instance rather than the other two is the arithmetic**: `README.md` and
   `docs/README.md` name the behavior in a sentence, so their staleness is readable, while
   `architecture.md` said "Four PreToolUse guards" and still had four, with only the parenthetical
   `(subagent dispatch at a usage barrier)` gone false. **This is the instance that widens the
   class**: nothing is one short, so nothing is countable, and a sweep keyed on member counts
   cannot reach it. See The shared shape below, which instances 1 to 5 stated in terms of a missing
   member.

7. **`docs/security-model.md:134` at `44df066`.** "Five properties, each verified against the code
   rather than intended:" stood above six bullets; repaired to "Six properties" at `f39b1e0`
   (2026-08-28). The plain countable variant in a non-skill file, and it was named in the kaizen
   note this stub's mechanism bullet quotes below, which took that note's uncorroborated figure and
   left this, its corroborated one, on the floor until a review walked it.

8. **This file and `docs/kit-adoptions.md`, both by the kaizen pass of 2026-08-31.** Adding
   instance 6 left six dependent statements short of it, `docs/README.md`'s index entry among them;
   separately, `kit-adoptions.md`'s "Two conventions belong to the file itself" was left at two when
   the same pass added a third. Both were caught by review and neither by the author. **Counted as
   one instance rather than two, deliberately**: three review rounds over an uncommitted changeset
   produced repeated false claims about which round committed and caught what, because nothing can
   separate uncommitted rounds after the fact. What is checkable is that the class was committed
   twice in one pass, in the file specifying it, by an author who had it open.

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

**Instance 6 is the same shape with the count intact.** Where an entry *describes* the set rather
than counting it, a later change can falsify the description while every count in the file stays
correct. The enumeration still stopped short of the current state; what it stopped short of is the
behavior rather than the membership. Any fix keyed on arithmetic covers instances 1 to 5 and none of
instance 6. So a question this stub cannot settle on its own: **is the class the design pass must
serve "an enumeration that no longer describes its set", of which "one member short" is the countable
half?** Instances 1 to 5, 7 and 8 do not distinguish the two framings, because in every one of them
the description and the count went stale together. Instance 6 is the only case that separates them,
and one case is thin ground for widening a class.

## What a design pass has to settle

- **Whether review is sufficient, and instances 5 and 8 both say no.** Instances 1, 5, 6, 7 and 8
  were caught by review; 2 shipped; 3 and 4 were caught by an author primed by a prior instance. But
  in instance 5 review caught the class three times in one section while the author's repairs missed
  it twice, and instance 8 was committed twice over by the pass writing this file, in this file,
  by an author who had the class open in front of them. **Review detects this reliably and does not
  prevent it**, so `arm-boundaries` S4's review mandate is not the whole fix, which is what closing
  this stub on those grounds would have assumed. Instance 8 is the sharpest evidence in the file:
  knowing the class, naming it, numbering its instances and writing its spec prevented nothing.
- **What a mechanism could key on.** A grep cannot tell a complete three-item list from an
  incomplete one, per the rejected candidates above. Anything that works keys on the act of adding a
  member to a named set, which is a human judgment rather than a detector.
- **A reporting obligation may reach what a fix obligation cannot.** This repo's Standing Brief
  Amendment idiom asks the implementer to FIX every enumeration its change invalidates, and on the
  delegated path that obligation lands nowhere: `docs-write-guard` denies a non-curator subagent any
  write into `docs/`, which is where most of the kit's enumerations live. So the obligation has to be
  converted by hand into a reporting one, "list every enumeration your change invalidates that you
  could not reach", and the claim worth testing is that this works better than asking for the fix.

  **The evidence is a kaizen note and is not corroborated by the effort's own record, which is why it
  is stated as a candidate rather than a measurement.** The note, `~/.claude-kaizen/notes.md` as of
  2026-08-28, cleared into this stub by the kaizen pass of 2026-08-31, said: "adding 'list every
  enumeration your change invalidates that you could not reach' to the dispatch ... made two
  implementers hand back ten and twelve items each, including three the orchestrator had missed and
  one that flipped a true claim false in the document the security-reviewer reads first."
  `docs/archive/kit-usage-awareness_spec_v1.md` records something smaller: `:1598` says "one of them
  found an enumeration defect the orchestrator had missed", and `:1580` says "The enumeration class
  landed twice more, both caught by others". Neither states a ten-or-twelve-item handback, and one
  does not reconcile to three without an inference the archive never makes. **Treat the numbers as
  recalled rather than recorded**, and if the mechanism is designed, reproduce the handback before
  leaning on them.

  What survives either way: the ask keys on the implementer's own knowledge of what it touched,
  which is the human judgment the bullet above says any working mechanism has to key on, sited where
  that judgment actually exists. **The ask is in no skill.**
- **Whether the real defect is that vocabularies have no single home.** Every instance involves a
  set (dispositions, verdicts, exits, steps) defined in one place and enumerated in others.
  `take-stock.md` declined pointer-plus-restatement as a deliberate house pattern on 2026-08-18, so
  the tradeoff has been weighed once in the other direction. But it distinguished within-file
  repetition from a cross-file pointer placed at the moment of the action, which it preferred, and
  instance 4 is that cross-file case.

## Open Questions

- Are there instances outside the kit's skills? **Partly answered, against the earlier framing.**
  Instances 1 to 5 all sat in `kaizen` and `writing-skills`, the two most accreted skills, which
  supported reading the pattern as a property of dense prose. Instance 6 is in
  `docs/architecture.md`, instance 7 in this file and `docs/README.md`, and instance 8 in
  `docs/kit-adoptions.md`: none is a skill, and none is covered by the accretion ranking, which
  measures the four corpus globs only. So the class is not confined to skills. What is still open is whether it is *denser* in accreted
  prose or merely easier to see there, and that still means walking the class somewhere the ranking
  does not reach.
