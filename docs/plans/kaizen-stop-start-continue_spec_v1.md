# Stop, Start, Continue: giving Kaizen an Input That Is Not Friction

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-15 (measurements refreshed 2026-08-16)

## Why this exists

The kaizen loop has one input channel, and it only ever reports that something is
missing or wrong. Every note in `~/.claude-kaizen/notes.md` is friction by
definition; the capture bar says so explicitly ("worth a note: concrete kit
friction", and "it went fine" is named as not worth one). The fix for a friction
report is nearly always more words.

**An inbox fed only by friction can only grow the kit.** Nothing in the loop takes
the kit's own state as its input, so subtraction has no channel to arrive through.

The measurements, taken 2026-08-15 and refreshed 2026-08-16 after
`red-for-rule-changes` closed:

| | 2026-08-15 | 2026-08-16 |
|---|---|---|
| `writing-skills/SKILL.md` lines (from 97 on 2026-06-17) | 435 | **467** |
| Since 2026-08-07 | +239 / -51 (4.7:1) | **+434 / -71 (6.1:1)** |
| Share of the last 30 commits | 11 | **13** |
| Testing apparatus vs skill-writing craft | 310 / 122 | **331 / 136** |
| Testing share | 71% | **71%** |
| Multiple of the next-largest skill | 1.7x | 1.8x |

(Section split counts the two testing sections against everything else; the
counter-case section is filed as craft in both columns so the comparison holds, though
its 2026-08-16 growth was largely its evidence bill, which is testing content. The
true testing share is therefore slightly understated.)

**The proportion held exactly while the file grew, and the add-to-delete ratio got
worse.** That is the finding, not the absolute size.

None of the individual changes was wrong. Each traces to a real observed incident with
a date and a session id, which is the kit's own bar and it was met every time. The
effort that produced the 2026-08-16 column is, by its own archive entry, unusually
self-critical: it recorded three defective pre-registered predicates against itself,
four flawed fixtures, and a disconfirming rep it had misfiled. **This is not
sloppiness. It is the loop working as designed and still yielding 6:1.** What was never
assessed is the aggregate, because nothing in the kit assesses aggregates.

**The live inbox demonstrates the mechanism better than any argument.** On 2026-08-16 it
holds exactly two notes, and both are requests to add: "nothing routes a spec-writer to
it" and "nothing about fixture design". Neither could have been a request to remove,
because the capture bar admits only friction and an absence is the only friction a
correct rule can produce.

The cost is **operator wall clock and reader attention**, not tokens. `docs/backlog.md`
item 22 already settled that cache-read bills at 0.1x, so the token-volume argument
against a large skill is the weak one and should not be reached for.

## The gap, stated precisely

The kit has rich machinery for **admitting** a rule: RED/GREEN arms, the
borrowed-evidence gate and its three artifacts, provenance clauses, the counter-case
discipline. It has none for **retiring** one.

The nearest existing thing is `docs/backlog.md`'s open-instances item, which does
close on "retiring the wording". That retires a **debt**, not a **rule**, and only for
the handful of instances admitted through the borrowed-evidence gate. A rule that
entered through a normal RED and has since stopped earning its lines has no exit at
all.

The kit already knows how to build the missing half: `cross-project-memory` ships an
advisory decay nudge that ranks idle records without retiring anything. That posture,
advisory and human-adjudicated, is the model.

## The proposed frame

Daren's proposal (2026-08-15) is the retro convention **Stop, Start, Continue**, and
it maps onto the gap cleanly.

- **Stop.** What shipped rule, step, or file is no longer earning its place? This is
  the missing subtraction channel, and it is the reason the frame is worth adopting.
- **Start.** What capability is absent? Partly covered by the existing note category
  ("you wished for a capability the kit does not have"), but extended to the
  higher-level case: things worth considering that no session happened to trip over.
- **Continue.** What is load-bearing and should be protected?

**Continue is not praise, and the design has to keep it from becoming praise**, since
that is precisely what the capture bar already refuses. Two things give it teeth:

1. It is the **counterweight to Stop**. A subtraction step with nothing recorded on
   the other side is a machine that only cuts. A recorded Continue means a later Stop
   pass argues against something written down rather than against silence, which
   mirrors the counter-case section's "the confirmed case stays confirmed".
2. It is the **missing home for evidence the backlog already asks for**. That file's
   open instances close on one of two observable events, one of which is "a session
   where the rule was applied and the record shows what it changed". Nothing currently
   collects that. Continue plugs a new step into starved existing machinery rather
   than inventing a parallel one.

Continue therefore inherits the backlog's bar verbatim: **"it seems to be working"
closes nothing.** A Continue entry names a rule and what was observed to happen
because of it.

## Placement: capture stays friction-only

**Capture stays exactly as it is: note the friction, nothing more.** The inbox works
because jotting costs nothing and loads no skill. Asking a working session to
classify friction as Stop/Start/Continue adds a decision to the one step whose value
is that it has none. It is also the wrong moment: whether friction with a rule is a
Stop (cut it) or a Start (it needs a companion) is the triage judgment, not the
capture one.

That leaves an asymmetry the design must handle. **Continue evidence never arrives as
friction.** A rule that worked produces no note, by construction. So Continue cannot
be fed by the inbox at any cadence, and needs the higher-level pass as its only
source. This is not garnish on the idea; it is the only way that third of the frame
gets input at all.

So SSC belongs in the **pass**, as a step whose input is the kit's own state rather
than the inbox. That is the shape that fixes the measured problem: `+239 / -51` was
not caused by items being routed wrong, it was caused by every input being a friction
report.

## The instrument: read artifacts, do not ask agents

A rejected design is recorded here because it is the intuitive one and a later
session will reach for it again.

**Rejected: have live sessions report which loaded instructions went unused.**
Proposed 2026-08-15, and it fails on four counts:

1. **A guard succeeds by producing no event.** Most kit rules are preventive; they
   work precisely when nothing happens, and would report as unused forever. The kit
   already reached this conclusion in another context at `writing-skills:66-72`: "a
   rep held in line by the existing mechanism looks exactly like a rep that did not
   need the rule."
2. **It is self-report about the model's own cognition.** `writing-skills:176-178`
   already distrusts asking a rep what it *read*, which is an actual event. Asking
   which sentences shaped a decision has no comparable ground truth, so it yields a
   fluent list that arrives looking like data.
3. **The bias runs the wrong way.** Loud rules (steps, formats, templates) leave
   traces and read as used; silent rules (leak hazards, anti-rationalization clauses,
   incident-derived guards) leave none. The instrument would nominate for deletion
   exactly the hard-won guards that constitute the growth in question.
4. **It adds a shared write target**, which is a hazard class this kit has now hit
   three times (see finding 3 below).

**Adopted: retrospective reads of artifacts written for other purposes.** No
introspection, no capture-time cost, no new shared file. `tools/standing-context-audit.js`
already models the posture in its own header: it "edits nothing and writes no
artifact; the report goes to stdout so it can never go stale in the tree."

- **Primary Stop anchor: which rules the kit cites in its own work.** Commit messages,
  Chapters, and review outputs cite rules by line range constantly. That is text on
  disk, so reading it is not self-report. It gives frequency at *rule* granularity.
  It measures quotability rather than value and still under-counts silent guards, so
  it generates candidates for a human, never a verdict.
- **Supplement: what the last few passes shipped.** Bounded and non-ceremonial; the
  finding that opened this stub took four commands.
- **Weak supplement: the backlog's unclosed debts.** Sounds tidier but covers only the
  handful of rules admitted through the borrowed-evidence gate, so it finds a nearly
  empty set. Do not lead with it.

**Not a Stop anchor: skill trigger frequency.** `attributionSkill` is real and
populated in transcripts, so "which skills never load" is cheap to measure, but it
cannot justify a cut. Measured 2026-08-15: all 18 kit skill name+descriptions total
~1,744 estimated tokens against a **48,197-token real standing total**, so skills are
~3.6% of standing context and the median skill is ~85 tokens, or ~0.18%. Cache-read
bills at 0.1x on top of that. **A rarely-used skill is cheap to keep**, and several
are rare because they are rarely useful, which is correct behavior.

Re-aim that measurement at **trigger health** instead. A skill that never loads is
ambiguous between two opposite diagnoses (rarely needed and correctly quiet, versus
needed but the description does not fire) which want opposite fixes, and the
never-loaded fact alone cannot distinguish them. What distinguishes them is a session
that did covered work *without* loading the skill, which is a judgment over artifacts
and therefore a pass activity. This serves the concern `writing-skills:39-53` exists
for.

**The live cost axis is description bloat, not skill count.** Every session pays every
description; no session pays for a skill it does not load. `standing-context-audit.js`
already flags size-outlier descriptions and has a live candidate (`cold` at ~175
tokens, 2x the median). Nobody runs it on a cadence. Note the asymmetry this implies:
the leanness rule as written governs only the *number* of files, and the sharper rule
is about description size.

**Continue's zero-triage slice: rules mechanized enough to leave a trace.** A
`docs-write-guard` denial is an event, not a judgment. A rule observed to have blocked
something is earning its place, free and with no evaluation asked of any session. That
covers only hook-enforced rules; for prose rules Continue stays a pass activity, which
is where the backlog closure event already places it.

## What is undefined (the remaining design work)

- **Does it fold into step 1 or stand as its own step?** Step 1 already gathers two
  things (inbox notes, `Proposed` stubs); this would be a third. Standing alone risks
  ceremony; folding in risks being skipped as the third item in a gathering list.
- **Is the citation instrument a tool or a procedure?** `tools/` already holds two
  maintainer tools outside the packaged plugin, which is the precedent. A grep
  procedure written into the skill is cheaper and rots faster.
- **Cadence.** Running a take-stock step on every pass, against a kit that may have
  changed by three commits, produces nothing most times, and a step that produces
  nothing most times gets skipped and becomes decoration. Prefer the pattern the kit
  already uses ("zero notes is the normal, healthy case") over a counting gate, since
  it costs no machinery.
- **Whether `writing-skills` needs a size counterweight of its own**, given that the
  leanness rule governs file count and the measured problem is intra-file growth.
  Decide in the design, not by reflex.
- **Whether the SessionStart nudge changes at all.** Current lean, per Daren: no. It
  reports pending friction and should keep doing only that.

## Three adjacent findings from the same pass

All three are real, none is filed in the inbox, for the reason finding 2 gives.

1. **The inbox cannot express "temporarily parked, restore pending".** A session
   following `writing-skills`' "clear the inbox before an arm" rule (`:191-203`) moved
   the pending note to `~/.claude-kaizen/notes.held.md` and intends to restore it when
   its effort completes.

   **Recorded first as a defect, and that was wrong**: this is a deliberate in-flight
   state, and reading it as stranded is precisely the error `writing-skills:206-209`
   documents (a probe took an earlier rep's file for evidence of a dropped rule when
   the file simply predated the wording). A concurrent session cannot see the other
   operator's intent. Kept here because the narrower finding survives and is better
   evidenced than the original claim:

   - **The restore has no durable backing**, though it worked. Verified 2026-08-16:
     `notes.held.md` is gone and `notes.md` carries both the original note and one the
     effort added. The risk was real and did not materialize, which is the correct way
     to record it. It lives in one session's context; if that session compacts or ends,
     the note strands and nothing surfaces it, because `hooks/session-start.js:38`
     reads only `notes.md`.
   - **The park produces a false zero, observed.** This session started at ~19:51 with
     a note pending since 19:45 and received **no kaizen count** in its SessionStart
     context. For the duration of any park, the nudge tells every new session there is
     nothing pending when there is.
   - **The convention is undocumented**, so a park is indistinguishable from a strand
     to anyone but its author, and the filename is not fixed by anything (the parking
     session referred to it as `notes.parked.md`; the file on disk is `notes.held.md`,
     which is a silent-restore-failure risk in its own right).

   The fix may be small: a header line in the parked file, or naming the convention in
   `kaizen` so the parking session, a restoring session, and an encountering session
   all read it the same way. It is a **Start**, not a Stop.

2. **`writing-skills`' inbox-contamination rule assumes a single operator.** Lines
   191-203 handle rep-versus-rep contamination of the shared inbox. They have no
   reading for a **concurrent operator-driven session**, whose own posture rule points
   it at the same file. Observed live 2026-08-15: one session cleared the inbox at
   19:45 for an arm, and a second session in the same repo twenty-five minutes later
   was barred from filing its own genuine friction, because anything it wrote would be
   read as that arm's rep output.

3. **The single-operator assumption also bites the working tree, and that is the
   sharper half.** This stub was first written to `docs/plans/` while the other
   session ran `executing-work` on `writing-skills`. `executing-work` dispatches
   adversarial and blind reviewers, which run `git status` to find the changeset and
   would have seen both an untracked plan arguing `writing-skills` should shrink and a
   modified `docs/README.md` saying the same. That is precisely the priming hazard
   `writing-skills:227-233` documents, and `red-for-rule-changes:138-139` discounts a
   rep that reads `docs/plans/`. **Declining to commit bought nothing**, because reps
   read the working tree rather than git history. The file was moved out of the repo
   entirely. Nothing in the kit warns that a second session's uncommitted working-tree
   files are a live leak surface into the first session's reviews.

All three are the same root: every rule in `writing-skills` and `kaizen` about shared
state is written for **one operator running arms against a quiet repo**. Two sessions
produced three distinct confusions in a single afternoon: contaminated inbox
attribution (2), a working-tree leak into the other's reviews (3), and a deliberate
in-flight state misread as a defect (1). The third is the instructive one, because the
misreading was done by the session doing the auditing, using the kit's own evidence
discipline, and the kit offered nothing that would have prevented it.

That suggests the design question is broader than an SSC step: **what does the kit owe
a second concurrent session?** Worth deciding whether that belongs here or in its own
stub. Do not let it silently annex this one.

**The bar for anything built there, agreed with Daren 2026-08-15:** the frequency is
low (his words: "I don't often have simultaneous agents working on the kit"), so the
test is **does the mechanism also help the solo case?** A convention that pays for
itself when one session resumes after compaction earns its lines; pure coordination
machinery (session registries, locks, an announce-yourself step, a SessionStart change
reporting other sessions) charges every session for a condition hit a few times a year
and does not. Reframe the goal as **self-describing state** rather than multi-agent
awareness: a parked or in-flight file carrying a header naming what it is and what
closes it serves a compaction-resumed session, a human opening the directory later,
and a concurrent agent, with the same one line. Note the baseline it must beat: today
the failures were caught by Daren relaying state between sessions, which worked twice,
and `backlog.md` item 20 is the kit's precedent for recording an observed hazard and
deliberately not acting while the cost of acting exceeds the observed failure.

## Execution notes

The concurrency block is **cleared**: `red-for-rule-changes` closed 2026-08-16 at
`90769cc` and is archived, the tree is clean, and the inbox is restored. This stub was
written and held outside the repo for the duration; measurements were refreshed against
the post-effort file before landing.

What still binds when this is designed:

- **It owes arms.** This is behavior-shaping wording in a kit skill. It is also a
  **rule change rather than a new guard** for the parts that alter kaizen's existing
  step 1, so it routes through the discipline `red-for-rule-changes` just shipped
  (`writing-skills` 2026-08-16: the rule-change RED, the narrowing's third arm, and the
  counter-case section's stated evidence bill). Read that first; this stub predates it.
- **Route each change on the claim it makes.** The Stop/Start/Continue step is a
  behavior claim and owes the arms. The citation instrument, if built as a tool, is a
  world claim checked against the world and owes none.
- **Do not run arms against a repo another session is working.** Findings 2 and 3.
- **Re-measure before quoting.** These numbers move fast: they changed materially in
  the twenty-six hours this stub sat parked.

## Related

- `plugins/claude-kit/skills/kaizen/SKILL.md` - the pass this extends. Last touched
  2026-08-11.
- `docs/backlog.md` - item 11 (open instances) for the closure event Continue would
  feed, and item 22 for why the cost argument is wall clock rather than tokens.
- `plugins/claude-kit/skills/cross-project-memory/SKILL.md` and its decay nudge - the
  advisory, human-adjudicated posture this should copy.
- `tools/standing-context-audit.js` - the measurement posture to copy, the source of
  the standing-cost figures, and an existing unrun description-bloat check.
- `plugins/claude-kit/skills/writing-skills/SKILL.md` - the measured subject, and the
  file whose growth is the evidence.
- `docs/plans/design-skill_spec_v1.md` (Proposed, 2026-08-16) - independent arrival at
  an adjacent worry, from the other direction. It predicts "a design corpus accreting
  behavior claims among the taste rules unnoticed" and finds that `csharp-style`
  already ships gated-shape wording unmarked. That is this stub's problem inside a
  style skill, and it is also a **fourth skill** proposed while nothing retires a
  third. Neither stub should absorb the other; note the overlap when either is
  designed.

## Chapters

(none yet - Proposed)
