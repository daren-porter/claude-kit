# Wiring the Decline Store Into the Kaizen Pass

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- Promoted 2026-09-02 from `~/.claude-kaizen/briefs/kaizen-wire-in-declined-md.md`. Written as a
  brief on the operator's own specification, then found to carry one Critical and ten Majors after
  a paired review, which is more design than a brief holds.
- `plans/kaizen-pass-economics_spec_v1.md` - its fourth open question is "where a declined brief's
  evidence lives", which is this. That stub asks whether the loop closes; this one asks how the
  store works.
- `plans/enumerations-stop-short_spec_v1.md` - `docs/architecture.md:55` inventories the inbox as
  notes/briefs/applied and goes false the moment a fourth member lands. That file is instance 6 of
  that class, and this change is the one that would create instance 9.

## Why this exists, and why it is not a proposal to argue

`~/.claude-kaizen/declined.md` exists, holds three real declines, and is referenced NOWHERE, which
makes it `applied/` again - the store the kaizen skill itself says nothing reads. A decline nobody
can find does not stop the next session re-litigating what an earlier pass settled or re-running
the arm behind it.

**The operator asked for it in his own words on 2026-09-02:** "noting declined
proposals/frictions/whatever, especially if it keeps us from re-hashing things we've already tested
and determined aren't worth doing or aren't actual problems." He also chose the shape - capture
stays unchanged at zero cost, triage gains the check - and endorsed tallying recurrences so a
decline is not permanent by inertia. **So no RED is owed. What is owed is GREEN**, showing the
wording produces that state, every rep, plus the design decisions below that a first attempt got
wrong.

## Why it is a spec: an attempt was built, reviewed and reverted on 2026-09-02

Five edits went in and GREEN passed 3 of 3 on the pre-label wording. The paired review then
returned one Critical from both halves and ten Majors, and the change was reverted rather than
repaired under session budget. Nothing of it is in the repo; `24ae5c3` is the last commit that
touched this ground. **Every finding is checked and reproduced in the evidence section below - do
not re-derive any of it.** The Critical is the one to read first: the justification written for
`declined.md`'s existence was FALSE against the shipped counter, and it is exactly the sentence a
later pass would check before moving declines back.

## What a design pass has to settle

The ten Majors below are design constraints rather than a fix list. The load-bearing ones:

- **A recurrence tally that no step reads is not a tally.** The threshold needs an operative
  consequence, and the threshold VALUE is itself unsettled: `executing-work:136` fires at two
  instances of a class and the note that produced a decline is the first, so the FIRST `RECURRED`
  already meets the cited bar.
- **A reopened entry needs an exit**, or its satisfied condition matches forever and a re-decline
  writes a second entry for one friction.
- **Take-stock declines and inbox declines are two things sharing one word**, and `docs/take-stock.md`
  contains zero occurrences of "reopen", so a mandated reopen-condition test is unrunnable against
  half its input.
- **Bound the read or bound the file.** Once gather reads it in full it is a per-pass context cost,
  and it would be the only inbox member with a write path and no exit.
- **The date basis owes three reps.** Two of three reps dated a recurrence from the pass unprompted
  and the reverted text mandated the minority behavior: a behavioral instruction with a measured
  2-in-3 miss rate against it.

## One hazard this change creates for its own future arms

Gather would point a rep at the real `~/.claude-kaizen`, and `declined.md`'s header states this
design's rationale verbatim. The next arm on this clause is the one it voids.

---

# Evidence: the promoted brief, reproduced whole

# Kaizen brief: wire declined.md into the pass, properly

Friction: `~/.claude-kaizen/declined.md` exists, holds real declines, and is referenced
NOWHERE, which makes it `applied/` again - the store the skill itself says nothing reads. A
decline nobody can find does not stop the next session re-litigating what an earlier pass
settled or re-running the arm behind it.

**This is a specified design, not a proposal to argue.** The operator asked for it in his own
words on 2026-09-02: "noting declined proposals/frictions/whatever, especially if it keeps us
from re-hashing things we've already tested and determined aren't worth doing or aren't actual
problems." He also chose the shape (capture stays unchanged at zero cost; triage gains the
check) and endorsed tallying recurrences so a decline is not permanent by inertia. So no RED is
owed: what is owed is GREEN, showing the wording produces that state, every rep.

## An attempt was made on 2026-09-02, reviewed, and REVERTED. Start from its findings.

Five edits went in (declined.md as the inbox's fourth member; gather reads it on the stubs' own
grounds; "List all three" to four; a fifth **Declined** disposition plus a reopen-condition
test with fixed `REOPENED`/`RECURRED` labels; step 3's clearing list). GREEN passed 3 of 3 on
the pre-label wording. The paired review then returned one Critical from both halves and ten
Majors, and the change was reverted rather than repaired under session budget. Nothing of it is
in the repo; `24ae5c3` is the last commit that touched this ground.

**Do not re-derive any of the following. It is checked.**

**CRITICAL, both halves.** The justification written for declined.md's existence was false
against the shipped counter. It claimed declines in `notes.md` make the nudge "go silent". They
do not: `session-start.js:83` is `count += entries || (text.trim().length > 0 ? 1 : 0)`, so a
non-empty file can never report zero. A `DECLINED <date>` form fails the anchor and floors at
one; a date-anchored form is counted as pending and inflates the count (a reviewer reproduced
"at least 107"). Silence required the counter strip that `24ae5c3` reverted. The design decision
survives, the stated cause does not, and the sentence exists precisely so a later pass does not
move declines back - so a pass checking it against the counter would correctly call the hazard
imaginary and reintroduce the regression. The true argument: any in-notes design has to teach
the counter to skip declines, and a skip running after a bounded read is what went silent.

**Majors to design against, not just fix:**
- **The `RECURRED` tally is read by no step.** Gather is told to surface a matching decline,
  never its recurrence count, and the not-met branch clears the note however many annotations
  the entry carries. Friction re-filed five times is cleared five times. The threshold needs an
  operative consequence, e.g. a decline already carrying a `RECURRED` reopens regardless of its
  condition.
- **A reopened entry is never closed**, so its satisfied condition matches forever and the
  RECURRED arm becomes unreachable for it. A re-decline then writes a second entry for one
  friction, making "that decline's reopen condition" ambiguous.
- **No ordering guard.** Nothing requires the matched note to post-date the decline, so a note
  captured earlier is counted as a recurrence and stamps a date before the entry's own.
- **The reopen-condition test is partly unrunnable.** Gather also feeds in take-stock declines,
  and `docs/take-stock.md` contains zero occurrences of "reopen"; its bar is "what keeping it
  buys" and it permits declining on judgment. The clause mandates a test against something
  those declines do not have, forbids the similarity fallback, and names no behavior for the
  absent case - which drives a rep back to similarity matching.
- **"Grows without bound harmlessly" is false** once gather reads the file in full: that is a
  per-pass context cost, and declined.md would be the only inbox member with a write path and
  no exit. Bound the read or give reopened entries an exit.
- **The Declined disposition was written for notes only**, but triage also receives parked
  stubs, retirement candidates and un-jotted session friction. Declining a stub is the likeliest
  use and is unspecified, including whether its `docs/README.md` "(Proposed)" entry is removed.
- **Take-stock declines and inbox declines are two things sharing one word.** Step 3's
  enumeration would route the former into declined.md, where step 1 resurfaces them against a
  rule that says they are closed.
- **`docs/architecture.md:55` still inventories the store as notes.md/briefs/applied/**, so it
  goes false the moment a fourth member lands. That file is instance 6 of
  `docs/plans/enumerations-stop-short_spec_v1.md`, which tracks this class at eight.
- **Two enumerations need re-walking, not just incrementing:** step 1's list omits `briefs/`
  (which the pending predicate counts) and is four classes inside the kit repo but three
  outside it, since a pass outside covers "the inbox and the stubs only".
- **Give declined.md a fenced entry template.** The skill templates the brief and would leave
  this format to invention: entry header with a `YYYY-MM-DD` date, tested / rested-on / reopen
  lines, and a slot for both annotations. That closes the format, the annotation placement and
  the orphaned-continuation hazard together.

**The label question, ruled on by the adversarial half:** do NOT revert to the GREEN-passed
wording, which knowingly restores three spellings for a label whose only purpose is
countability. `REOPENED` and `RECURRED` are low risk (three reps converged on the first
unprompted and the second was already in their vocabulary). **The date basis is not:** two of
three reps dated a recurrence from the pass unprompted and the new text mandates the minority
behavior, so it is a behavioral instruction with a measured 2-in-3 miss rate against it. That
delta owes three reps on the existing GREEN fixture, reading which label and which date they
write. `writing-skills` names cost as the one justification it does not accept.

**Threshold value to settle before writing:** `executing-work:136` fires at two instances of a
class, and the note that produced the decline is the first, so the FIRST `RECURRED` already meets
the cited bar. The reverted text said "a second `RECURRED`", which is three.

**One leak the change creates for its own future arms:** gather now points a rep at the real
`~/.claude-kaizen`, and declined.md's header states this design's rationale verbatim. The next
arm on this clause is the one it voids.

Acceptance: a pass handed a note matching a decline whose reopen condition is not met clears the
note, annotates the decline in the fixed form, and does not re-argue the merits; one whose
condition IS met reopens it and sorts it fresh; and neither is matched on similarity of wording.
The GREEN fixture that showed this (three notes, two declines, both branches) is described in
`/tmp/claude-1000/kaizen-hold-2/criteria-green-decline.md` while that path survives; rebuild it
from this brief otherwise.

Discipline: follow writing-skills. Corpus prose, so it takes the paired review before it
commits, and both halves earned their keep here - the Critical came from both and neither was
findable without reading the hook.
