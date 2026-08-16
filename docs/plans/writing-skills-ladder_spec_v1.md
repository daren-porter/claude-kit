# One Findable Ladder for What a Kit-Prose Change Costs

Status: Proposed
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-08-16

## Goal

Put the six classes of kit-prose change and their bills in one place in
`writing-skills/SKILL.md`, replacing the four cross-referencing sites that carry them today.
**Descriptive only: no trigger widens, narrows or moves.** Daren's decision, 2026-08-16, taken
so the claim inventory can report which bills are incoherent on evidence rather than on the
author's opinion.

## Why

The pass on 2026-08-16 ran **zero arms** and still took several hours across multiple usage
blocks to make two clause additions. The cost was not the gates. It was deciding which of four
routes the change takes, and the cheapest and most common route - a correction to a statement
of fact, which owes no arms - is written down nowhere in the skill. It exists only in commit
`1526456`'s message and had to be recovered by archaeology, twice in one session.

The operator-side symptom is the same defect: Daren reported (2026-08-16) that he cannot tell
what is at stake in a kit change. The answer is not written as a whole anywhere, so nobody can
read it as a whole.

## The six classes, as they stand today

Copied here as the starting map, not as the finished ladder. Section 1 verifies it against the
file and corrects it; the rows below are this pass's reading and may be wrong.

| Class | Bill today | Stated at |
| --- | --- | --- |
| New behavior claim | RED + GREEN + REFACTOR, 3 reps each | `:81-134` |
| Change to a shipped rule | Same, plus a third arm for a narrowing | `:111-122` |
| Ported or Daren-reported evidence | 3 gated artifacts + provenance clause + backlog debt | `:304-457` |
| Compression (adds no claim) | Claim inventory + followability probe, no arms | `:245-303` |
| Counter-case scoping | Scoping + recorded instance, no arms | `:459-504` |
| Correction to a statement of fact | Nothing | Nowhere; commit `1526456` only |

## Approach

**Replace, do not index.** Each bill moves out of its current site into the ladder; the section
it left keeps its substance and loses its cost statement. An index restating the bills in a
second place would duplicate claims, which is retirement candidate 2's defect
(`docs/take-stock.md`, 2026-08-16) and would disqualify the compression classification outright.
Moving them yields the same claims at fewer sites, so the file gets smaller.

**This is on the compression path**, which means the entry condition is a finished
two-directional mapping and not an intention. If the mapping fails to close - if any claim ends
up in the ladder with nothing opposite it in the old text, or a trigger reads differently - the
work stops being a compression and routes to the full bill per `writing-skills:293-302`. That is
the designed exit, not a failure.

**The sixth row is the hard case and the reason for the descriptive-only constraint.** Writing
the fact-correction rung down at all could be read as new wording, since no section states it.
The mapping decides it: if every claim in that rung maps to `1526456`'s established practice and
to the counter-case section's existing "no arm is owed where the claim is about something other
than an agent" (`:493-495`), it is a restatement. If it does not, the rung is a new rule and
this effort has found its first genuine incoherence - which it records and does not fix.

## Sections of Work

**S1 - Fix the claim unit and inventory the four sites.** Mode: **main** (design-entangled;
the unit governs everything downstream). Fix the claim unit in writing before inventorying,
per `:275-279`. Inventory only the bill-bearing claims at `:81-134`, `:245-303`, `:304-457` and
`:459-504`, three columns per `:266-273` (claim, trigger verbatim, attached content). Verify the
six-row table above against the file and correct it. Acceptance: a written unit; an inventory
covering every bill-bearing claim at the four sites; the table corrected or confirmed against
the text.

**S2 - Write the ladder and vacate the four sites.** Mode: **main** (the wording is the design).
Ladder placed after "Know it works before you trust it" opens, so a reader hits routing before
apparatus. Each vacated section keeps its substance and a one-line pointer. Acceptance: every
inventoried claim appears exactly once, in the ladder or its original site and never both; no
trigger differs verbatim from S1's record; the file is shorter than 515 lines.

**S3 - Close the mapping, or exit the path.** Mode: **main**. Map every claim in both
directions per `:293-302`. Any claim in the old text with nothing opposite it is restored and
recorded as a retirement candidate; any claim in the new text with nothing opposite it is cut or
the effort leaves the compression path; any moved trigger is put back. Acceptance: a
two-directional mapping with no unmapped rows, or a recorded decision to leave the path.

**S4 - Followability probe.** Mode: **main** (dispatch and adjudication). Three reps minimum per
`:281-291`, handed the ladder in the prompt, given a task inside its territory, with identifiers
that do not name the skill, and the pre-compression text made unreachable for the duration.
Ask whether the rule was applied, never whether an ambiguity can be named. Acceptance: 3 of 3
apply the ladder correctly; the probe output is recorded; a single failure stops the ship.

## Out of Scope

Parked in `arm-boundaries_spec_v1.md`, which stays `Status: Proposed`, so this effort's close-out
cannot bury them:

- Stating the arms' limit on in-file contradiction. It is a **new** claim, and a compression
  that also adds a claim is not a compression. Keeping it out is what protects the bill.
- Closing the paired-review hole on the kaizen apply path. A new directive, owing an arm.
- Fixture-design guidance.
- Retiring any of the four candidates in `docs/take-stock.md`.

## Risks

**This effort cannot close without dispatching subagents.** S4's probe is mandatory on the
compression path, and the 2026-08-16 session was not authorized to dispatch agents. Either that
authorization is given for this effort or the work stops after S3 with the bill unpaid, which
would be shipping a compression the same way `c4dbe58` shipped untested wording. Settle it before
S1 rather than at S4.

**This spec primes its own probe.** It is a kit-skill spec committed to `docs/plans/`, which
`brainstorming` step 7 now warns lands on the disk this effort's own tests run against. S4's
fixture must be de-identified and its identifiers must not resolve to this file.

**A compression is the one path whose arms are unavailable rather than waived** (`:252-258`), so
the probe and the inventory are the entire evidence base. An inventory nobody can read is the
compressing session's own judgment about its own work, which is what the path exists to replace:
the artifacts go in the commit message per `kaizen`'s home rule, or in a committed file under
`docs/archive/` if they are too large, following `kaizen-stop-start-continue_s3-inventory.md`.

## Acceptance Criteria

1. A reader with no context can answer "I want to change kit prose, what does this cost?" from
   one section.
2. All six classes appear with their bills; the fact-correction rung is explicit or its absence
   is recorded as a found incoherence.
3. No trigger moved; S3's mapping proves it in both directions.
4. `writing-skills/SKILL.md` is shorter than its current 515 lines.
5. The claim unit, the inventory and the probe output are durably recorded and readable.
6. Nothing in Out of Scope was touched.
