# One Findable Ladder for What a Kit-Prose Change Costs

Status: Abandoned
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-08-16

## Goal

Put the six classes of kit-prose change in one routing table in `writing-skills/SKILL.md`, each
row naming the class, its entry trigger, and the section that owns its bill. **The ladder routes
and does not restate bills.**

**Descriptive only: no trigger widens, narrows or moves.** Daren's decision, 2026-08-16, taken
so the claim inventory reports which bills are incoherent on evidence rather than on the
author's opinion.

**Re-scoped 2026-08-16 after S1's review, from "move the bills" to "route only."** The first
scope had the ladder restate every bill, which put all 73 bill-bearing claims in motion and
made the claim unit load-bearing for whether obligations survived the move. The review found
that unit dropping two claims S4 itself depends on. Routing-only fixes that **by construction
rather than by argument**: S2 removes routing sentences and leaves every other byte alone, so a
claim nobody counted cannot be lost. It also cuts the artifact from 73 rows to 32, of which 5
move. See Chapter 1.

## Why

The pass on 2026-08-16 ran **zero arms** and still took several hours across multiple usage
blocks to make two clause additions. The cost was not the gates. It was deciding which of four
routes the change takes, and the cheapest and most common route - a correction to a statement
of fact, which owes no arms - is reachable only through a door that excludes it (Chapter 1,
incoherence 1). The session settled its classification off a commit message instead, twice in
one day, because the rule governing it cannot be found from outside the section it lives in.

The operator-side symptom is the same defect: Daren reported (2026-08-16) that he cannot tell
what is at stake in a kit change. The answer is not written as a whole anywhere, so nobody can
read it as a whole.

## The six classes, as they stand today

Verified against the file by S1 and corrected there. Row 6 was wrong in both cells: its bill is
not "nothing", and its rung is stated in the file rather than nowhere.

| Class | Bill today | Stated at |
| --- | --- | --- |
| New behavior claim | RED + GREEN + REFACTOR, 3 reps each | `:81-134` |
| Change to a shipped rule | Same, plus a third arm for a narrowing | `:111-122` |
| Ported or Daren-reported evidence | 3 gated artifacts + provenance clause + backlog debt | `:304-457` |
| Compression (adds no claim) | Claim inventory + followability probe, no arms | `:245-303` |
| Counter-case scoping | Scoping + recorded instance, no arms | `:459-504` |
| Correction to a statement of fact | No arms, **but the recorded-instance clause** (`:485-487`, `:498`) | `:493-497`, **reachable only through the counter-case entry at `:468`**, which excludes its own Contradicted branch. Both cells corrected by S1; see Chapter 1 |

## Approach

**Route, do not restate.** The ladder's third column is a pointer to the section that owns the
bill, never a summary of it. A summary would duplicate claims, which is retirement candidate 2's
defect (`docs/take-stock.md`, 2026-08-16) and would disqualify the compression classification.
The bills stay authoritative exactly where they are.

**A claim moves only if its entire content is routing.** In practice that is one paragraph,
`:125-134`, whose whole job is telling a reader which section they belong in. A sentence carrying
routing plus substance STAYs and is cited by the ladder, never paraphrased into it; so does all
branch logic inside a class - the gated path's four answers, the disposal rules,
contradicted-versus-narrower. S1 inventories both kinds and marks each, so the mapping is
complete without putting the stay-rows at risk.

**Everything that is not a marked MOVE row is byte-identical after S2.** That is the check S3
runs, and it is what makes an uncounted claim unlosable.

**This is on the compression path**, which means the entry condition is a finished
two-directional mapping and not an intention. If the mapping fails to close - if any claim ends
up in the ladder with nothing opposite it in the old text, or a trigger reads differently - the
work stops being a compression and routes to the full bill per `writing-skills:293-302`. That is
the designed exit, not a failure.

**The one thing the ladder asserts that no source does is that the set of classes is closed.**
That is the hard case, and S3 decides it: if the enumeration is a restatement of six things all
already stated, the work stays a compression; if it is a claim, the effort takes the full bill
via `:298-299`. The exit is designed and available, and ruling it a restatement *because* ruling
otherwise is expensive is exactly what `:247-248` bars.

## Sections of Work

**S1 - Fix the unit and inventory the routing claims.** Mode: **main** (design-entangled; the
unit governs everything downstream). Fix the unit in writing before inventorying, per
`:275-279`. Inventory every routing claim across the **full** ranges `:81-243`, `:245-303`,
`:304-457` and `:459-504` - not the truncated `:81-134` the first draft used - with four
columns: claim, trigger verbatim, attached content, and **MOVE or STAY**. Publish the rows.
Verify the six-row table above against the file and correct it. Acceptance: a written unit; a
published table covering every routing claim at the four sites, each marked; the six-row table
corrected or confirmed.

**S2 - Write the ladder and delete only the MOVE rows.** Mode: **main** (the wording is the
design). Ladder placed before `## Know it works before you trust it`, so a reader hits routing
before apparatus. Delete each MOVE row's sentence from its old site and nothing else.
Acceptance: every MOVE row appears in the ladder and nowhere else; every STAY row is untouched;
the ladder's third column is a pointer and contains no bill.

**S3 - Prove the mapping and the byte check.** Mode: **main**. Two checks, not one. Map every
MOVE row in both directions per `:293-302`. Then diff the whole file against base and confirm
**every hunk is either a MOVE row's deletion or the ladder's insertion** - any other changed
byte is an unrecorded edit and stops the section. Acceptance: a two-directional mapping with no
unmapped rows; a diff review with no unaccounted hunk; or a recorded decision to leave the path.

**S4 - Followability probe, both directions.** Mode: **main** (dispatch and adjudication). Three
reps minimum per `:281-291`, handed the ladder in the prompt, given a task inside its territory,
with identifiers that do not name the skill, and the pre-change text unreachable for the
duration. Ask whether the rule was applied, never whether an ambiguity can be named. **Also run
the before-probe** `:289-291` requires, since this effort's motive is that the current wording
does not land: a clean before-probe disproves the motive and the change proceeds on
navigability alone. Acceptance: 3 of 3 apply the ladder correctly; both probes' output recorded;
a single failure stops the ship.

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
compression path. Daren authorized dispatch on 2026-08-16 and S1's review used it. Either that
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

1. A reader with no context can identify which of the six classes their change is in, and reach
   that class's bill in one hop, from one table. **Not** "read the cost in the table" - the
   ladder routes and the sections bill, so one hop is the bar.
2. All six classes appear with their entry triggers; the fact-correction rung is explicit, and
   the incoherence in its reachability is recorded rather than fixed.
3. No trigger moved; S3's mapping proves it in both directions, and its diff review proves no
   other byte changed.
4. `writing-skills/SKILL.md` is **no longer** than its current 515 lines. Routing-only will not
   shrink it much - roughly a dozen sentences out against a table in - and claiming a shrink
   was an artifact of the abandoned move-the-bills scope. Navigability is the deliverable; size
   is not.
5. The claim unit, the inventory and the probe output are durably recorded and readable.
6. Nothing in Out of Scope was touched.

## Chapters

### Chapter 1 - S1: the unit, the routing inventory, and two incoherences

Completed: S1, redone after its own review returned CHANGES_REQUIRED with four Criticals.
Implemented By: main session. Metrics: 1 adversarial review rep; 4 Criticals and 6 Majors, all
accepted; scope re-cut mid-section on Daren's call; 32 routing claims inventoried, 5 of them
MOVE.

**What the review killed, recorded because the failure is instructive.** The first S1 inventoried
73 *bill-bearing* claims under a unit that excluded "procedure inside a gate", published none of
the rows, and argued its headline finding from commit `1526456`. All three were wrong. Git
disproves the `1526456` claim outright (that commit is 2026-08-14; the rung it supposedly applied
was written at `6d561f1` on 08-15 and `b220962` on 08-16). The unpublished rows are the exact
failure `writing-skills:261-264` names and this repo already enforced once, at
`archive/kaizen-stop-start-continue_s3-inventory.md:6-13`. And the narrowed unit dropped
`:417-423` and `:284-288`, both of which this spec's own S4 depends on.

**The re-scope those findings forced**, on Daren's call: the ladder routes and does not restate
bills. That removes the unit's load-bearing role, because nothing outside a marked MOVE row is
edited at all.

**The unit, fixed in writing before the inventory** (per `:275-279`):

> **One routing claim is one thing the text asserts about which class a change falls into**, that
> a reader could act on differently if it were absent. **A claim MOVEs only if its entire content
> is routing.** A sentence carrying routing plus substance STAYs and is cited by the ladder, never
> paraphrased into it. Branch logic inside a class - the gated path's four answers, the disposal
> rules, contradicted-versus-narrower - is routing and always STAYs. When it is unclear whether
> something is one claim or two, split, per `:275-276`.

**The MOVE set is one paragraph, and it is already a routing block.** `:125-134` does nothing but
route; it is the only prose in the file whose whole job is telling a reader which section they
belong in. Turning that block into a table in place is a compression of one paragraph, which is a
far smaller and more checkable claim than the abandoned scope made.

| ID | Claim | Trigger, verbatim | Disp. |
| --- | --- | --- | --- |
| R1 | The arms bar governs any change to behavior-shaping content, kit skills included | "This is the standard for any change to behavior-shaping content, the kit's own skills included" (`:125-126`) | MOVE |
| R2 | Exactly three sections route around the bar, and cost is not a reason to take one | "Three sections route around it, and cost chooses none of them" (`:126-127`) | MOVE |
| R3 | Ported or reported evidence routes to the gated path | "Evidence that is real but not yours to re-run, ported or reported" (`:127-128`) | MOVE |
| R4 | A rewrite adding no claim routes to Compression, gated on a finished mapping | "A rewrite that adds no claim cannot stage a RED at all" (`:129-130`) | MOVE |
| R5 | The counter-case section states its own bill and when it is available | "And \"When you meet a counter-case to a rule\" states its own bill and when it is available" (`:133-134`) | MOVE |
| R6 | A change to a shipped rule asks RED a different question; a narrowing takes a third arm | "Changing a rule the kit already ships" (`:112-113`) | STAY, cited |
| R7 | Compression is entered on a finished two-directional mapping, not an intention | "The entry condition is a finished mapping, not an intention" (`:247`) | STAY, cited |
| R8 | The gated path is entered on evidence real but not yours to re-run | "Sometimes the evidence for a rule is real but not yours to re-run" (`:306`) | STAY, cited |
| R9 | The counter-case section is entered on hitting a case the rule does not cover | "That gap surfaces later, when you hit a case the rule does not cover" (`:468`) | STAY, cited |
| R10 | No arm is owed where the claim is about something other than an agent | "No arm is owed where the claim is about something other than an agent" (`:493-494`) | STAY, cited |
| R11 | Route on the claim repaired, not the sentence's form: a premise is the system, what the agent does with it is not | "Most rules are a directive resting on a premise" (`:495-496`) | STAY, cited |
| R12-R32 | Branch-internal routing: the four answers and their four dispositions (`:343-376`), the three disposal directions (`:293-302`), contradicted-versus-narrower (`:471-476`), the two bounds (`:501-504`), the unverified-marking exclusion (`:454-456`), the unlocatable-provenance fall-back (`:396-398`), the clean-run redirect (`:103-104`) | each stated at its own line, unchanged | STAY, uncited |

**Incoherence 1: the cheapest rung is behind a door that excludes it.** R10 and R11 are reachable
only through R9's entry, "a case the rule does not cover". But `:471-473` - the section's own
first branch - is **Contradicted**: "You observed the very thing the rule asserts, and it came out
differently." A contradicted case is one the rule *does* cover and gets wrong, which R9's wording
excludes. A plain fact correction (the rule says X, the system does not-X) lands exactly there. So
the rung that costs no arms is entered through a condition that does not admit it. In-file,
checkable, and needing no claim about how the rung has been used.

**Incoherence 2: row 6's bill was understated in this spec, twice.** The fact-correction bill is
not "nothing": `:485-487` requires the observed instance recorded beside the generalized claim,
and `:498` bills the class as "the scoping plus that recorded instance, and nothing else". The
exemption at `:487-488` covers only "wording that is plainly judgment", which a fact correction is
not. Practice agrees - `1526456`'s own `writing-skills` hunk carries its dated instance. Both
table cells now corrected.

**Both recorded, neither fixed.** Widening R9 to admit Contradicted is a moved trigger, which
`:300-302` calls a rule change in a compression's clothes. It is the obvious next effort and it
owes the arms.

**The open question S3 must answer, stated now so it cannot be settled conveniently later.** The
ladder asserts one thing its sources do not: **that the set of classes is closed and complete**.
If S3's mapping finds that enumeration is a claim rather than a restatement, this effort is not a
compression and takes the full bill via `:298-299`. That exit is designed and available, and the
temptation to rule it a restatement because ruling otherwise is expensive is precisely what
`:247-248` means by "the thing to be shown, never the reason for not showing it".

**Reconciliation with the prior inventory.** `archive/kaizen-stop-start-continue_s3-inventory.md`
already inventoried two of these four sections (85 and 59 claims) under the parent unit, for the
compression at `1e5db4e`. Its IDs are namespaced A/B; this one uses R to avoid the collision the
reviewer found in the first draft. Its four open retirement candidates (`:299-315`) are carried
here so S3 disposes of them deliberately: **candidate 3** (`:190-191` duplicating the gated path's
ordering) and **candidate 2** (doubled routing into the gated path and Compression) both sit in
territory this ladder touches, and S3 must state whether the ladder resolves them, leaves them, or
worsens them.

Decisions / Surprises: S1 was redone rather than patched, because three of its four Criticals were
in the unit and the evidence rather than the presentation. The review caught what no arm could -
every Critical was a contradiction with a file the reviewer read and a fixture could not, which is
the thesis of `arm-boundaries_spec_v1.md` demonstrated on this effort's own first section.
`writing-skills/SKILL.md` remains untouched at 515 lines.

### Chapter 1a - S1 round 2: the re-scope failed too, and why that is structural

Round 2: **6 Criticals, 9 Majors, 4 Minors.** Round 1's Criticals 1, 3 and 4 confirmed closed;
Critical 2 (publish the rows) reduced but not closed, since the inventory buckets 21 claims into
one unenumerated row and misses at least five cross-section routing claims.

**The re-scope's own load-bearing claim is false against the file.** Chapter 1 asserted
`:125-134` is a pure routing block that can move wholesale. The paragraph is `:124-134` and it
opens "Run three reps at least - one sample lies - and read every flagged result yourself" - the
three-reps bar, substantive and STAY. The asserted block begins mid-sentence.

**And three of the five MOVE rows carry bills the ladder is barred from holding.** R3 carries
"costs three recorded artifacts rather than a claim"; R4 carries "keeps every claim the section
already makes on a bill of an inventory and a probe"; R2 carries the normative "cost chooses none
of them". S2's two acceptance bullets - move each row wholesale, and hold no bill in the ladder -
are therefore mutually unsatisfiable. Deleting those sentences drops claims the ladder may not
restate, which `writing-skills:295-297` makes a retirement, not a compression.

**Two further structural findings, either of which sinks the six-row framing on its own.**

1. **The classes are not a partition.** Rows 5 and 6 share one entry trigger, `:468`. AC2 wants
   six rows each with an entry trigger; either two rows carry the same verbatim trigger, which
   defeats AC1's "identify which class you are in", or class 6 gets an invented trigger, which
   the descriptive-only scope and `:300-302` both bar.
2. **Row 5's bill is wrong, the same way row 6's was.** "Scoping + recorded instance, no arms" is
   unconditional; `:493-495` conditions no-arms on the claim being about something other than an
   agent, and `:502-504` says contradicted-versus-narrower "governs any rule change, including one
   about what an agent does, whose evidence is still the arms." A reader routed by that row
   underpays. Found in a table S1 claimed to have verified, one round after the identical defect
   was found in the row below it.

**The diagnosis, which is worth more than the ladder was.** Routing in this file is not separable
from cost, because the sentences that route state the bill in the same breath - deliberately, and
it reads well that way. A table separating the two imposes a structure the prose does not have.
That is why two different scopes both died on the same rock, and it is a better answer to "why is
this file hard to navigate" than the ladder would have been.

**Stopped here rather than re-scoped a third time.** Twice now a framing has been chosen, and
twice a reviewer has shown the framing was wrong in the direction of a cheaper bill. A third
attempt by the same author in the same session is not evidence-gathering, it is bargaining. The
effort is **blocked pending Daren's decision**, with the four findings below banked either way.

**Banked findings, re-verified against the file before any were applied - and three of the four
were mine, not the kit's.** The verification is the point: all four were first found *in this
spec's own six-row table*, and carrying them across as kit defects would have edited the kit's
largest file to fix this document's bookkeeping.

1. **Not a kit defect.** `:493-498` states the agent/non-agent condition explicitly and `:502-504`
   closes it with the bound. The only other mention of this bill in the kit is `:133-134`, which
   is a pointer ("states its own bill"), not a summary of it. **This spec's row 5 was wrong; the
   kit is right.**
2. **Not a kit defect.** `:485-487` states the recorded-instance clause plainly: "record the
   observed instance beside the generalized claim. A clause does it." **This spec's row 6 said
   "Nothing"; the kit is right.**
3. **A real kit defect, and the only one applied.** `:468` introduced the section as "a case the
   rule does not cover", while the branch immediately below it is **Contradicted** - "You observed
   the very thing the rule asserts, and it came out differently" - which is a case the rule *does*
   cover. The section's own discipline decides its own defect: this is Contradicted, not Narrower,
   so "The rule is wrong; fix it." Fixed to "a case the rule as written does not fit: one it
   covers and gets wrong, or one it never tested", which names the two branches that follow it. A
   correction to a false scope statement, not a widening: the Contradicted branch was always
   reachable and always in the section: only the introduction misdescribed it. No arms, per
   `1526456`.
4. **Not a kit defect.** "Six classes" was this spec's model. The kit never claims a partition,
   so classes 5 and 6 sharing an entry is a defect in the model, which dies with it.

**That ratio is the effort's most useful output.** Three of four "kit findings" were artifacts of
the map this effort drew, discovered only because applying them meant re-reading the territory.
A pass that had trusted its own inventory would have made three unnecessary edits to the kit's
most accreted file, each defensible, each traceable to a document that no longer exists.

Decisions / Surprises: `writing-skills/SKILL.md` remains untouched at 515 lines. Nothing in Out
of Scope was touched; both rounds verified this independently.

### Chapter 2 - Close-out: abandoned, with one fix shipped

Status: **Abandoned** 2026-08-17. The ladder is not buildable descriptively, for the reason
Chapter 1a records: routing in `writing-skills` is not separable from cost, because the sentences
that route state the bill in the same breath. Two scopes died on that rock, four rounds of
Critical findings between them.

**Shipped:** one edit, to `writing-skills:468`, per banked finding 3.

**Not shipped:** the ladder, and three findings that turned out to be defects in this document
rather than in the kit.

**What a later effort should take from this.** The navigation problem is real and unsolved: a
reader still cannot answer "what does this change cost me" without reading four sections. But the
instrument was wrong twice over. The compression path was wrong because nothing here compresses -
the prose is not redundant, it is entangled. And if the ladder is ever built, it should be a plain
index that moves nothing and pays the arms, because its whole value is behavioral (does a reader
route correctly?), which is the one thing an arm measures well and a claim inventory does not.
That is the inverse of this effort's premise.

**Cost, recorded because it is the kind of thing nobody writes down.** Two review rounds, ten
Criticals, a full re-scope, and the durable output is a three-line wording fix plus the finding
that the file resists tabulation. Whether that was worth it is Daren's call; the record is here so
the call can be made on evidence next time.
