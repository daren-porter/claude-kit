# Neither Findings Nor AC Verdicts Can Say the Change Accomplishes Its Intent

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-17

## Related

- Promoted 2026-09-16 from one inbox note dated 2026-09-10 (EleosCore, PR 433). The same pass
  applied the note's two siblings as prose, so this is the one of the three that outgrew a brief.
- `plans/record-vs-artifact_spec_v1.md` - the same failure one layer up: fifteen review rounds
  never checked whether a record's claims matched the work. This stub is that question asked of an
  acceptance criterion rather than of a Chapter.
- `plans/prose-claim-review_spec_v1.md` - both concern a verdict nobody is contracted to produce.
  There the gap is routing (no `Audience:` line, so the claim-checking reviewer cannot fire); here
  it is shape (no slot the verdict could occupy even when the right reader is present).

## Provenance, stated because it bounds what is settled

Everything under "The evidence" comes from the inbox note, which is the user's own record of the
PR 433 review. **It was not re-verified against the live PR by the pass that promoted it**, which
did verify the sibling note's PR 432 claims and found the note's diagnosis wrong there. So the
shape of the failure is the load-bearing part and the particulars are worth re-reading against
PR 433 before anything is built.

## Why this exists

`pr-review` produces two output shapes: findings (blocker, suggestion, note) and acceptance-
criterion verdicts. Neither can carry "this change accomplishes what it set out to do". A finding
says something is wrong with the code. An AC verdict says a criterion is met or unmet. A change
can clear both and still not work.

## The evidence

PR 433 carried a migration whose acceptance criterion was that prior behavior moved into a new
background service. **All three reviewers marked that criterion Met by assertion**, in the shape
"the prior bodies moved verbatim". Nobody checked:

- that the new background service is **registered**, so that anything ever calls it
- that the moved logic is **equivalent**, rather than merely present

The user had to ask. That is the failure: read-only AC verification cannot distinguish **written**
from **reachable**, and nothing in the current output shape requires it to try.

## The remedy the note proposes, and why its shape is the argument

**A gate verdict, not a step and not a fourth dispatch.** Extend gate item 2 with an intent read
returning one of three values: **holds**, **gap**, or **cannot verify from reading**. Produced by
the main thread in the filter, where the findings already converge.

**It must be REQUIRED to cite its evidence**, or it decays into exactly the rubber stamp the AC5
assertion already was. That is the load-bearing constraint and the reason this is a design
question rather than a clause: a verdict with three values and no evidence bar reproduces the
defect it was added to fix, one level up, and the pass that adds it will not be able to tell.

**Scope it to what reading settles**, which is the second constraint and the one that keeps it
honest:

- is the new code **reachable** (does anything resolve, register or call it)
- for a **behavior-preserving** change, is the moved logic equivalent

Anything beyond that is the `cannot verify from reading` value, which is why the value exists.

## The second finding, smaller and possibly separable

**Fit findings arrive directionless.** On the same PR, all three reviewers flagged the table and
procs layer split. The one reviewer that picked a direction cited a sibling table in the base
layer, pointed the wrong way, and lost to the CLAUDE.md guardrail it had already been handed.

Two rules fall out, and neither is obviously the same change as the one above:

1. **A committed practices doc outranks an inferred sibling precedent.** The reviewer had the
   guardrail and reasoned around it from a neighbouring file.
2. **A fit finding resolves in the doc's direction, or says it needs the user's call.** A fit
   finding that names no direction is work handed back to the user in the shape of a question
   they have to re-derive.

Whether this ships with the intent verdict or on its own is open. It is recorded here rather than
left in the inbox because it came from the same six-reviewer observation and splitting it there
would have lost the context.

## What a design has to settle

1. Does the intent read belong in gate item 2, or is item 2 already carrying more than one job?
2. What discharges "cite its evidence" so that a reviewer cannot satisfy it with the same kind of
   assertion that failed on AC5? Naming a file and a symbol is a candidate; naming a criterion is
   not.
3. Is `cannot verify from reading` a verdict or an escalation? If a PR routinely returns it, the
   gate has learned nothing and the user is back where they started.
4. Does this fire on every PR or only where the change claims to preserve behavior? A migration
   and a greenfield feature are not the same read.
5. Is the fit-direction rule part of this or its own change?
