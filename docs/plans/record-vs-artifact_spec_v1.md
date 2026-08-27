# When the Record Stops Describing the Work

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-20

## Related

- `archive/arm-boundaries_spec_v1.md` - the effort that produced both findings below, in quantity.
- `plans/enumerations-stop-short_spec_v1.md` - a narrower sibling: an enumeration that stops one
  short is one way a record stops describing its set.
- `archive/document-review-battery_spec_v1.md` - a second effort that produced the class in
  quantity, closed 2026-08-27. It also supplies the case this plan's review-sufficiency question
  turns on: its Chapter 4 recorded a probe as never run when the transcript shows it ran and
  returned, and no review re-read that Chapter, so the correction waited for the next session.

## Why this exists

Two findings from one effort, and they are the same failure seen from two ends.

**1. A paragraph regenerates the same defect for as long as two parts of its spec disagree.**
`arm-boundaries` S1 burned four review rounds on one nine-line paragraph. Rounds 1 and 2 patched
the wording; round 2's adversarial reviewer diagnosed the actual cause, which was that the spec
authorized two incompatible claims at once, so an implementer obeying every instruction produced a
self-contradicting paragraph. S4 repeated it for two more rounds. It then recurred four times inside
the plan doc itself, twice created by fixing one occurrence of a contradiction and not its twin.
**Rewording never reaches a spec-level contradiction**, and nothing in the kit names this.

**2. Fifteen review rounds never checked whether the record's claims matched the work.** The same
effort ran fourteen paired rounds plus one adversarial-only over five sections. Every round found
real defects in the prose. None asked whether the spec still described what shipped.
`finishing-work`'s QA step found nine such on its first run and twenty-one across five runs: stale
acceptance criteria, Goal clauses promising outcomes that were rescoped away, a deviation paragraph
describing a file the effort had deliberately left untouched, an index contradicting the file it
indexed. **The reviewers read prose against the file; QA read claims against the artifact**, and
only the second catches a record that has drifted.

## What a design pass has to settle

- **Whether the cheap fix is enough.** Finding 2 might be closed by one clause telling a per-section
  review to check the section's own acceptance criteria against what shipped. That is cheap and may
  capture most of the value; it is also exactly the kind of clause this repo has repeatedly found
  insufficient on contact.
- **Whether finding 1 needs a mechanism or a habit.** The diagnosis is available to a reviewer who
  reads the spec, since one did reach it. What failed was that two earlier rounds looked at the
  prose because the prose was what changed. A clause telling round 2 of any section to suspect the
  spec would be cheap; whether it fires under pressure is the open question.
- **Whether the plan doc's size is the real variable.** All twenty-one QA findings landed in a
  1,184-line self-referential document and none in the 34 shipped lines. Each repair introduced
  fresh contradictions. That may mean plan docs need a length discipline more than reviews need a
  new check.

## Out of scope until this is decided

Adding a QA-style pass to per-section review. That is finding 2's obvious remedy and doubles
per-section cost, which is the trade this stub exists to weigh rather than assume.

## Open Questions

- Is finding 1 specific to prose-about-prose, where the spec and the artifact are the same kind of
  thing, or does it appear in code efforts too? The corpus for the second half does not exist yet.
