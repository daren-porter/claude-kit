# What Does the Kit Owe a Second Concurrent Session

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-16 (findings observed 2026-08-15, split from the stop-start-continue stub 2026-08-16)

## Why this exists

Every rule in `writing-skills` and `kaizen` about shared state is written for **one
operator running arms against a quiet repo**. Two sessions working the kit on the
afternoon of 2026-08-15 produced three distinct confusions between them, and the kit
offered nothing that would have prevented any of the three.

These findings were carried in `kaizen-stop-start-continue_spec_v1.md` while that stub
was being designed. They are split here so they cannot silently annex an effort about
subtraction, which is what that stub's own text warned against. None of them is filed
in the kaizen inbox, for the reason finding 2 gives.

## The three findings

**1. The inbox cannot express "temporarily parked, restore pending".** A session
following `writing-skills`' "clear the inbox before an arm" rule moved the pending note
to `~/.claude-kaizen/notes.held.md` and intended to restore it when its effort completed.

**Recorded first as a defect, and that was wrong.** This is a deliberate in-flight state,
and reading it as stranded is precisely the error `writing-skills` documents elsewhere,
where a probe took an earlier rep's file for evidence of a dropped rule when the file
simply predated the wording. A concurrent session cannot see the other operator's intent.
The finding is kept because a narrower claim survives and is better evidenced than the
original one:

- **The restore has no durable backing, though it worked.** Verified 2026-08-16:
  `notes.held.md` is gone and `notes.md` carries both the original note and one the
  effort added. The risk was real and did not materialize, which is the correct way to
  record it. The intent lived in one session's context; had that session compacted or
  ended, the note strands and nothing surfaces it, because `hooks/session-start.js`
  reads only `notes.md`.
- **The park produces a false zero, observed.** A session starting at ~19:51 with a note
  pending since 19:45 received **no kaizen count** in its SessionStart context. For the
  duration of any park, the nudge tells every new session there is nothing pending when
  there is.
- **The convention is undocumented**, so a park is indistinguishable from a strand to
  anyone but its author, and the filename is fixed by nothing: the parking session
  referred to it as `notes.parked.md` and the file on disk was `notes.held.md`, which is
  a silent-restore-failure risk in its own right.

The fix may be small: a header line in the parked file, or naming the convention in
`kaizen` so a parking session, a restoring session and an encountering session all read
it the same way. It is a **Start**, not a Stop.

**2. `writing-skills`' inbox-contamination rule assumes a single operator.** Its
rep-versus-rep contamination rules have no reading for a **concurrent operator-driven
session**, whose own global posture rule points it at the same file. Observed live
2026-08-15: one session cleared the inbox at 19:45 for an arm, and a second session in
the same repo twenty-five minutes later was barred from filing its own genuine friction,
because anything it wrote would be read as that arm's rep output.

**3. The single-operator assumption also bites the working tree, and that is the sharper
half.** The stop-start-continue stub was first written to `docs/plans/` while the other
session ran `executing-work` on `writing-skills`. `executing-work` dispatches adversarial
and blind reviewers, which run `git status` to find the changeset, and would have seen
both an untracked plan arguing `writing-skills` should shrink and a modified
`docs/README.md` saying the same. That is exactly the priming hazard `writing-skills`
documents and that `red-for-rule-changes` discounts a rep for. **Declining to commit
bought nothing**, because reps read the working tree rather than git history. The file
was moved out of the repo entirely. Nothing in the kit warns that a second session's
uncommitted working-tree files are a live leak surface into the first session's reviews.

The third is the instructive one, because the misreading in finding 1 was done by the
session doing the auditing, using the kit's own evidence discipline.

## The bar anything built here must clear

Agreed with Daren 2026-08-15. The frequency is low (his words: "I don't often have
simultaneous agents working on the kit"), so the test is **does the mechanism also help
the solo case?**

A convention that pays for itself when one session resumes after compaction earns its
lines. Pure coordination machinery (session registries, locks, an announce-yourself step,
a SessionStart change reporting other sessions) charges every session for a condition hit
a few times a year and does not.

**Reframe the goal as self-describing state rather than multi-agent awareness.** A parked
or in-flight file carrying a header naming what it is and what closes it serves a
compaction-resumed session, a human opening the directory later, and a concurrent agent,
with the same one line.

Note the baseline it must beat: today the failures were caught by Daren relaying state
between sessions, which worked twice, and `docs/backlog.md` item 20 is this kit's
precedent for recording an observed hazard and deliberately not acting while the cost of
acting exceeds the observed failure. **Recording these three and doing nothing is a
legitimate outcome of the design pass.**

## Related

- `plugins/claude-kit/skills/writing-skills/SKILL.md` - the inbox-contamination rule
  (finding 2), the priming-surface rule (finding 3), and the earlier-rep-artifact rule
  the finding-1 misreading walked into.
- `plugins/claude-kit/skills/kaizen/SKILL.md` - the inbox contract, and the likely home
  for a park convention.
- `plugins/claude-kit/hooks/session-start.js` - reads only `notes.md`, which is why a
  park produces a false zero.
- `docs/backlog.md` - item 20, the record-and-decline precedent this pass may well reach.
- `docs/plans/kaizen-stop-start-continue_spec_v1.md` (In Progress) - the effort these
  findings surfaced alongside, and the one they must not annex.

## Chapters

(none yet - Proposed)
