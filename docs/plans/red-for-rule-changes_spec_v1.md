# RED for a Rule Change, Not Just a New Guard

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-08-15

## Goal

`writing-skills` gives an operator a reading for changing a rule the kit already ships,
which is the shape most kit changes actually take and the one its testing discipline was
never written for. When this is done, a change that narrows, scopes, corrects, or
replaces an existing rule routes on an observable question about what it claims, and
arrives at a stated evidence bill rather than at an improvisation. It matters because
the gap is not idle: three recent commits answered it three different ways, one of them
citing a bound that does not exist, so the cheap path the stub warned about is already
forming by default.

## Why this exists

`writing-skills`' testing discipline is written for **adding** a guard. Step 1 says to
"give a fresh subagent a realistic task that tempts the failure, without the new
guidance", which presumes the absence of guidance. Most real kit changes are not that
shape: they narrow, scope, correct, or replace a rule the kit already documents and
ships.

When the kit already says the opposite of the draft, a rep in the guarded state does
the currently-documented thing. That is obedience to the shipped kit, not a failure.
Counting it as a RED fire would make the arm vacuous, since it would fire for any rule
change whatever; refusing to count it leaves the change with no admissible RED at all.
The section has no reading for either.

## The friction, located

Surfaced by two of three independent probes during the 2026-08-15 kaizen pass (session
`4bdf030e`), each planning a baseline test for a different target skill, neither
prompted about this.

> "RED is written for adding a guard, not for changing a rule that already exists.
> [...] Here `curating-docs` already asserts the opposite timing, so a rep in the
> guarded state does the currently-documented thing. That is obedience to the shipped
> kit, not a failure, and counting it as one makes the RED vacuous: it would fire for
> any timing change whatever. Nothing in the section addresses this, and it collides
> with the four answers, where 'In the state, and the failure appeared' has no reading
> for 'the rep correctly obeyed the rule I am replacing.' I reframed RED as 'stage a
> state where the *current* timing produces the harm, and show the harm' - my
> interpretation, not the text's instruction. It is also the choice that determined
> the fixture, the two-turn structure, and the pressure design, so the section leaves
> the highest-leverage decision unmade."

The second probe reached the same place from a different target skill, and named the
sub-question the first left open: whether to **strip the existing rule sites** so the
draft's contribution is isolated, or **leave production reality standing** and accept
that compliance is over-determined. It chose the latter, flagged the choice as its
own, and noted the two produce different arms and different conclusions.

## What the design pass found (2026-08-15)

The gap is not merely unanswered. It is being answered ad hoc, differently each time,
in commit messages rather than in the skill.

**Two commits cite the same section, the same branch of it, and pay opposite evidence
bills.** `c13a9ca` (scoping the `pr-review` suggestion marker) cited the counter-case
section's narrower-than-written path and ran thirteen reps across four arms.
`ee8be8f` (scoping `branch-hygiene`'s landed check) cited the same discipline in the
same words and ran zero. Both were correct. The counter-case section is silent on
testing, so it licenses both readings and settles neither.

**A cheap path is already accreting by default.** `8aa426d` skipped arms on two
changes, justifying it as "corrections rather than new judgment rules, which is the
bound added in `3f9d67e`". That bound does not exist: `3f9d67e` added 48 lines to
`writing-skills`, none of which draw a correction-versus-new-rule distinction, and the
word "correction" appears nowhere in the skill. What was actually cited is a precedent
from `3f9d67e`'s own commit message. This is the third admission path the stub warned
about, arriving by default rather than by design, because there is no documented
reading and the operator reaches for the nearest-looking thing.

**The counter-case section's opening scope is narrower than its own use.** It opens
scoped to "a kit rule asserting a factual property of an external system" (`:395`),
yet its closing recording rule carves out "wording that is plainly judgment"
(`:420-421`), which presupposes judgment wording arrives, and `c13a9ca` routed a
judgment rule through it. That is narrower-than-written, applied to itself.

**The shape that worked is three arms, not two.** The stub guessed two. `c13a9ca` ran
RED against the current rule, a **control** arm outside the new scope, and GREEN on the
replacement, each answering a different question. Its RED produced no author-facing
harm at all and still fired, on two of four reps documenting the same misreading of the
rule being scoped. The observable was the rep's **reasoning**, not its output, which is
the thing step 1 has no language for.

## Approach

**A rule change asks two separate questions, and the kit currently answers only one of
them.** Keeping them apart is the design.

- **The shape question: fix it or scope it?** The counter-case section already owns
  this, for both kinds of change, and answers it well (contradicted, so reverse it;
  narrower than written, so scope it). Both `c13a9ca` and `ee8be8f` reached for it and
  both used it correctly. Nothing here is broken except its opening scope sentence.
- **The evidence question: what does the change owe?** Nothing answers this, which is
  why the same section licensed thirteen reps and zero.

**The evidence question splits by what the change claims, not by how big it feels.**
That is the one boundary an operator in a hurry cannot argue with, and it is the
property that keeps the cheap path from being reachable by preference.

- **A claim about the world** (what a command outputs, what a path resolves to, what a
  renderer emits) is checked against the world. No arm is owed, because the claim is
  not about an agent. Already the practice in `ee8be8f` and `a64f8a3`; it needs stating,
  not building.
- **A claim about behavior** (what an agent will do under pressure) needs agents. This
  is the three-arm shape, written down from the worked example rather than invented.

A behavior-claim change therefore uses **both**: the counter-case section for its
shape, and the three arms for its evidence. That is what `c13a9ca` did, and the design
should make it legible rather than leave it as an improvisation that happened to work.

The design is deliberately mostly **correction of existing text**. `writing-skills` is
435 lines and its own rule says a new rule must beat one more paragraph elsewhere. The
size constraint is stated as a check rather than a line count, because a count reads
precise and is not: **each section's output is a clause or a paragraph folded into
existing prose. If a section's draft wants its own heading, the design overreached, and
the response is to cut rather than to proceed.**

### The constraint that shapes how this effort is executed

This plan doc is itself a leak surface, and `writing-skills:227-233` was written about
this very file: a probe read it as a Proposed stub and reported its framing as primed
rather than independent. Flipping it to In Progress makes it the draft answer sitting
in the repo at a path reps have every reason to open.

Two rules follow, and they bind every section:

1. **No candidate wording goes in this document.** It names what each section must
   decide and how to know the result is right. The wording itself lives in the
   operator's context until its arm closes, per `writing-skills:121-131` and `:155-157`.
2. **No fixture points a rep at `docs/plans/`**, and each rep is checked against its
   transcript for having read this file before its result is counted. A rep that read
   this spec is discounted, not silently kept.

The sections run in the **main thread**, and not because delegation is forbidden:
`writing-skills:251-257` explicitly contemplates a delegated arm-carrying run that
parks artifacts in `.kit/` for the main thread to fold in. The reason is that the work
here *is* the judgment. The operator dispatches each rep, controls which copy of the
skill it reads, audits its transcript for what it opened, and reshapes the wording
against what comes back, which is what REFACTOR means. That is a section whose text
keeps evolving in contact with the results, which is brainstorming's own test for main.

## Sections of Work

### 1. The boundary, and the counter-case section's evidence bill

**Status: Complete (Chapter 1).**

Establish the world-claim versus behavior-claim boundary as the test that routes the
**evidence** question for any change to a rule the kit already ships, and place it
where an operator meets it. Make the counter-case section state the evidence it wants,
and correct its opening scope sentence so it covers the cases it is already being used
for. The section's shape guidance (contradicted versus narrower) is not in scope to
change; it works.

Acceptance criteria:

- The counter-case section states its evidence bill explicitly: the check against the
  world is the artifact, the observed instance is recorded beside the claim, and no arm
  is owed.
- Its opening scope no longer excludes judgment wording that the section's own closing
  clause and its live use both admit.
- Handed the changes as situations, with each commit message's routing citation
  withheld, a fresh reader routes `a64f8a3` (a transcript path either resolves or it
  does not) to the no-arm bill and `c13a9ca` to the three-arm bill. That is the clean
  pair. `ee8be8f` is the hard third case and the better test: its claim is about what
  `git diff` renders, so it is a world-claim, but its commit argues the fix matters
  because a false reading leads an operator to open a recovery PR. A reader who routes
  it on that second sentence gets it wrong, so the boundary has to be stated tightly
  enough that the claim under repair, not the harm it causes, is what routes.
- The boundary is stated as an observable question about the change's claim, not as a
  judgment about the change's size or importance.

Execution mode: main.

Tests: lock that the two-commit pair routes to different bills, since the whole defect
is that the current text routes them identically. Lock that a behavior-claim change
cannot reach the no-arm path, since that is the third-admission-path risk and the one
failure mode that makes this change net-negative if it lands wrong.

### 2. The rule-change reading in the RED section

Give step 1 a reading for a change to a rule that already ships. Two things it lacks:
which arms establish the need, and what counts as the observable.

Acceptance criteria:

- The three arms are named with the question each answers: RED against the current
  rule, a control outside the new scope, GREEN on the replacement.
- The text states that on a rule change the observable may be the rep's reasoning
  rather than its output, and what artifact that implies.
- The vacuity trap is closed in both directions: a rep obeying the rule being replaced
  is not automatically a RED fire, and a change is not left with no admissible RED
  because of it.
- A fresh reader planning a baseline test for a scoping change produces the three arms
  without being told the number.
- The stub's open sub-question is resolved either way and the resolution is stated:
  whether the existing rule sites are stripped so the draft's contribution is isolated,
  or left standing so production reality is tested. If the answer is "it depends", the
  observable that decides it is named rather than left to judgment.

Execution mode: main.

Tests: lock that a reader plans a control arm, since that is the arm the current text
omits entirely and the one a narrowing needs most. Lock that a rep's correct obedience
to the rule being replaced is not counted as a RED fire, since that is the vacuity the
stub opened on.

### 3. The did-not-reproduce inversion

The gated section's did-not-reproduce branch says to ask what produced the compliance,
and to cut the draft when something already in the kit forces the result. On a rule
change the thing already forcing the result is the rule being replaced, so read
literally it concludes every replacement is redundant.

Acceptance criteria:

- The branch names the rule-change case and does not conclude redundancy from the
  replaced rule's own effect.
- The genuine redundancy finding it exists to catch still fires, and is still
  distinguishable from this case by something observable.
- A fresh reader handed a did-not-reproduce result on a rule change reaches the right
  conclusion, and does not read the branch as licensing the cut.

Execution mode: main.

Tests: lock that the redundancy finding survives, since weakening it to fix the
inversion would trade a documented gap for a real loss; the branch caught a live
redundancy in `c13a9ca` (the dropped companion rule, seven reps).

## Out of Scope

- **The entailed-repair case.** A third shape exists: a behavior claim whose answer is
  forced by an existing rule's stated purpose, so an arm would measure nothing the text
  does not already settle. `8aa426d`'s scratchpad-bar scoping is one, and it is the
  commit that cited a bound that does not exist. Deliberately left out on Daren's call
  (2026-08-15): documenting a cheap path off a single instance is the bar this skill
  refuses everywhere else, and a cheap path is precisely what the stub warned against.
  It accumulates instances first. Revisit when there are several.
- A new section in `writing-skills`. The stub's own hazard: anything designed here must
  be at least as expensive as the normal bar for the same claim, or it becomes the route
  around both. Three corrections to existing sections, not a fourth section.
- Retrofitting the finding to already-shipped commits. `8aa426d` skipped arms on a
  reading that turns out to be unsupported; that is evidence for this design, not a
  defect to reverse.
- Any change to the borrowed-evidence gate's three preconditions.

## Open Questions

- ~~Whether the boundary belongs in one place both sections point at, or is stated once
  in each.~~ **Resolved in S1 (Chapter 1), on evidence rather than by construction.** The
  bill is stated once, in the counter-case section, with a pointer to it from the sweep
  sentence. The REFACTOR arm dispatched no in-prompt excerpt, so findability was measured:
  3 of 3 reps followed the pointer across roughly 300 lines and quoted both of the bill's
  bounds, and none decided from the sweep sentence alone.
- Whether S3's fix is a clause in the existing branch or a re-cut of the four answers.
  Owner: executing session, S3 drafting. A re-cut is the more invasive answer and needs
  the leanness constraint applied against it.

## Related

- `plugins/claude-kit/skills/writing-skills/SKILL.md` - the file this effort edits.
  S1's "place it where an operator meets it" may also want a pointer from `kaizen`'s
  brief format, whose Discipline line already says to baseline-test behavior-shaping
  wording. Verify at drafting rather than assuming; a second file is a cost.
- `docs/backlog.md`, the open-instances item, for how unvalidated wording is tracked.
  This effort should open no instance there: its evidence is local, not borrowed.
- Commit `c13a9ca` as the worked example the three-arm shape is drawn from, `ee8be8f`
  and `a64f8a3` as the world-claim cases, `8aa426d` as the improvisation, and `cae8024`
  for the shared-state leak findings that constrain how the arms are run.

## Chapters

### Chapter 1 - 2026-08-15
Completed: 1. The boundary, and the counter-case section's evidence bill
Implemented By: main session (wording is design-entangled and reshapes against arm results)
Metrics: 2 review rounds (paired, both CHANGES_REQUIRED on round 1); 0 NEEDS_CONTEXT; 0 escalations; advisor on, consulted 3 times and each consultation changed the approach; 4 arms, 12 reps total
Commit Model: Commit-and-Push

**Arms.** Artifacts at `/tmp/claude-1000/kit-arm-artifacts-red-for-rule-changes/`, copied
out of the session scratchpad so they outlive the session.

- **RED: fired, 2-1.** Fixture: a fictional kit, two rule changes (a world-claim about a
  changelog generator, a behavior-claim about incident summaries) under combined pressure.
  3 reps, serial, one fixture copy each, byte-identical to the repo file. All three agreed
  the behavior-claim owes arms; they **split 2-1 on the world-claim**, reps 1 and 3 saying
  no arms, rep 2 saying a full arm. The divergence is the reproduction: identical text,
  three capable readers, two incompatible bills. It reproduces under control what production
  already showed, `c13a9ca` (13 reps across 4 arms), `9f5398a` (probe only, no RED) and
  `ee8be8f` (zero) all citing the same section.
- The divergent rep located the blocker precisely, and it was **not** where the spec
  predicted: not the counter-case section but the sweep sentence at `:117-118`. "'Any change
  to behavior-shaping content' with exactly one named exemption [...] the only question left
  is whether either qualifies for the one exemption. Neither does."
- **GREEN: passed 3/3**, then superseded. Review showed it could not test what it was used
  to justify, since the fixture's world-claim is exactly what the narrow opening already
  admits, so no rep was ever handed judgment wording routed through that section.
- **Review round 1: both reviewers CHANGES_REQUIRED, two Criticals each.** The one that
  mattered: the shipped sentence scoped the counter-case *section* rather than its *bill*,
  which reads as an exclusive exit and contradicts this spec's own "uses both" design. That
  imprecision was spotted during drafting and argued away on the grounds that GREEN passed;
  GREEN could not test it. Conceded. Second Critical, from the blind side: a ported claim
  about an external system satisfies both path predicates at once with no tie-breaker.
- **REFACTOR: passed 3/3 on all four criteria.** Fresh fixture, three situations including a
  behavior-rule counter-case and a genuine borrowed/unreachable collision. **No in-prompt
  excerpt**, so findability was measured rather than bypassed: all 3 reps followed the
  pointer to the bill and quoted both bounds.

**Decisions / Surprises.**
- The fix site moved on evidence. The spec front-loaded the counter-case section; the reps
  front-loaded the sweep sentence. Following the evidence made S1 *smaller*, and moving the
  bill into the counter-case section made it smaller again while satisfying acceptance
  criterion 1 more literally than the first attempt did.
- Net +12 lines (435 to 447): one paragraph plus three sentence-level fixes, no new heading.
  Within the leanness bound, which matters more than expected given the concurrent
  `kaizen-stop-start-continue` finding that this file went 97 to 435 lines in eight weeks.
- S2's RED fired incidentally inside these arms: **0 of 5 reps** asked to plan a baseline
  test for a scoping change produced a control arm. Recorded in `S2-RED-RESULT.md`.

**Review findings: addressed.**
- Critical (section-vs-bill scoping): fixed; bill moved into the counter-case section and
  scoped to the bill.
- Critical (routing collision, no tie-breaker): fixed; the gate wins, stated as a bound.
- Critical (opening scope unmet, justification unsound): conceded and fixed; `:399` now
  admits a rule about what an agent should do.
- Major (universal "a rep is not the instrument at all" falsified by the file's own
  history): fixed; conditioned on the system not being reachable from inside an arm.
- Major (`:106` still counts one exception): fixed, one phrase.
- Major (counter-case section stated no bill, no back-pointer): fixed; that is where the
  bill now lives.
- Major (GREEN prompt-salience confound): conceded, not re-run. The REFACTOR arm drops the
  excerpt instead, which converts the criticism into a measurement.
- Major (no GREEN result artifact): fixed; `GREEN-RESULT.md` written and paired with its
  pre-registration.

**Review findings: rejected, with reasons.**
- Blind Major, "require the followability probe on this path too." Rejected. The probe is
  precondition 3 of the borrowed-evidence gate, and importing it onto the counter-case path
  is exactly what `9f5398a` did in production. A GREEN rep named this failure mode
  unprompted, and the shipped bill now warns against it by name. Adding the probe would
  install the bug.
- Blind Major, "implied evidence count of one." Out of scope: "record the observed instance"
  is the counter-case section's pre-existing bar, not this change's. The point is real and
  goes to the backlog rather than being fixed under S1.
- Adversarial Major, qualify `kaizen/SKILL.md:90` and `:94`. Not changed. `:90` already
  routes to writing-skills first, writing-skills is now self-consistent on the routing, and
  a qualifier there is behavior-shaping wording in a second file that would owe its own arm.
  Recorded as a candidate if a further misroute is observed.

**Deviation from the spec.** Acceptance criterion 3 names `a64f8a3`/`c13a9ca`/`ee8be8f`
literally. It was exercised on isomorphs instead, because handing reps the real commits
would violate the answer-leak rules at `:211-225`. The fixtures preserve the hard case: in
the REFACTOR arm, situations A and C are the same shape and diverge only on provenance, and
3 of 3 reps split them correctly.

**Open state carried forward.** `~/.claude-kaizen/notes.held.md` holds one note of mine,
cleared out of the inbox so the arms could attribute rep writes. It stays held until S2 and
S3's arms finish, then goes back. The inbox was empty before and after all 12 reps.

Next: 2. The rule-change reading in the RED section
