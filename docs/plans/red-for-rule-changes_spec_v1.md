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

**Status: Complete (Chapter 2).**

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

**Status: Complete (Chapter 3).**

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
Metrics: 1 review round (paired, both CHANGES_REQUIRED); 0 NEEDS_CONTEXT; 0 escalations; advisor on, consulted 3 times and each consultation changed the approach; 3 arms over 9 reps (RED 3, GREEN 3, REFACTOR 3). **Corrected in the close-out:** this first read "2 review rounds" and "4 arms, 12 reps total", neither of which reconciles against the artifacts.
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
  Within the leanness bound, which matters more than expected given this file's growth:
  97 lines at `703cded` (2026-06-17), 435 at `8aa426d` (2026-08-15), measured here rather
  than taken on trust. **Corrected in Chapter 3:** this originally cited a
  `kaizen-stop-start-continue` stub seen in `docs/README.md` mid-session, which another
  session then replaced. The measurement was right; the citation resolved to nothing.
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
would violate the answer-leak rules at `:211-225`. **Corrected in the close-out:** this
first claimed the fixtures preserved the hard case, citing the REFACTOR arm's A-versus-C
split. That split exercises the borrowed-evidence tie-breaker, which is a different
discriminator from the one the criterion names. The named hard case is routing on the claim
rather than on the downstream harm it causes, and while the RED/GREEN fixture's Change A did
carry a harm sentence and 3 of 3 reps still routed it to the no-arm bill, no pre-registered
pass condition isolated that as a tested dimension. The criterion is met by incidental
evidence, not by an arm built for it.

**Open state carried forward.** `~/.claude-kaizen/notes.held.md` holds one note of mine,
cleared out of the inbox so the arms could attribute rep writes. It stays held until S2 and
S3's arms finish, then goes back. The inbox was empty before and after all 12 reps.

Next: 2. The rule-change reading in the RED section

### Chapter 2 - 2026-08-15
Completed: 2. The rule-change reading in the RED section
Implemented By: main session
Metrics: 1 review round (paired, both CHANGES_REQUIRED); 0 NEEDS_CONTEXT; 0 escalations; advisor on; 3 GREEN arms over 7 reps, plus a RED that fired incidentally inside S1's arms
Commit Model: Commit-and-Push

**Arms.** Records in `/tmp/claude-1000/kit-arm-artifacts-red-for-rule-changes/`.

- **RED: fired 5/5**, staged incidentally by S1's arms. Every rep asked to plan a baseline
  test for a scoping change produced RED, GREEN and mostly REFACTOR. **Zero produced a
  control arm.** The task had asked for "the arms, what each arm stages, how many reps", so
  a third arm would have been squarely responsive.
- **GREEN arm 1: FAILED on rep 1, arm stopped.** The draft named the third arm's state as
  "the state the scoped rule should no longer reach", which is GREEN's own state, since
  GREEN re-runs RED's task. Rep 1 caught the collision and reasoned around it. That is the
  process working: a rep located a defect in the wording before it shipped.
- **GREEN arm 2: PASSED 3/3** on the revised wording, fresh reps and fixture, no in-prompt
  excerpt so findability was measured.
- **Review: both reviewers CHANGES_REQUIRED**, four findings carrying arm evidence.
- **GREEN arm 3: PASSED 3/3 on all four criteria**, on a two-situation fixture so the new
  qualifier was exercised rather than assumed.

**Decisions / Surprises.**
- My pre-registered criterion for arm 2 was itself internally contradictory: it asked for an
  arm staging "the state the scoped rule should no longer reach" AND one showing "the
  narrowing did not over-reach", which are opposite states. Recorded and corrected before
  arm 2 rather than resolved in favour of whichever reading a result satisfied.
- Net +14 lines on the file across both S2 revisions, held to one paragraph with no heading
  by cutting two recap fragments the reviewer identified.

**Review findings: addressed.**
- Critical (no leak posture for the third arm; parallel dispatch with RED would void the
  control): fixed. The arm is named as carrying the draft and dispatching serially like RED.
- Critical (criterion 5 unmet, and the justification falsified by the arm's own outputs):
  conceded and fixed. See below.
- Major (the reasoning criterion under-determined; arm 2's reps split 2-1, one naming the
  others' approach as producing a coached rep): fixed. The text now says to take it off the
  rep's transcript rather than asking.
- Major/Minor (the bold lead over-claimed twice, contradicting S1's shipped bill and its own
  body): fixed with two qualifiers, "behavior-claim" and "narrowing".
- Minor ("counting that as the fire would fire" subject confusion): fixed.
- Minor (spent fixture unquarantined before S3; arm-1 prereg unpaired in the durable set):
  both done.

**Review findings: rejected, with reasons.**
- Blind Major, require a baseline rep in the untouched state. Rejected: `writing-skills`'
  did-not-reproduce branch already governs a clean third arm ("ask what produced the
  compliance"), and mandating a baseline makes this four arms on a file already mostly
  testing apparatus. Backlog candidate.
- Blind Major, state that the current rule must be in force for a rule-change RED. Rejected:
  6 of 6 reps across arms 2 and 3 staged RED against a byte-identical copy of the current
  rule unprompted, so the wording would be unevidenced.
- Blind Major, no mapping onto the four answers for a rule-change RED. Deferred to S3, which
  is exactly that territory.

**Criterion 5 resolved, and recorded here because nothing else survives the session.**
The stub's strip-versus-leave sub-question: **leave the existing rule standing.** Across
arms 2 and 3, 6 of 6 reps staged RED against a byte-identical copy of the current rule and
none proposed stripping it; the shipped text presupposes it ("stage the state where the
current rule does the damage"). The observable that decides the question is **which text
each arm's fixture carries**, and the shipped clause now names it for the third arm, which
was the one place reps actually diverged (arm 2's rep 1 gave the third arm the old rule
while its prompt carried the new one, a contradicted rep). No further SKILL.md prose is
owed. The earlier justification offered for this, that S1's arms left the rule standing and
still fired, was wrong and is withdrawn: S1's reps were planners, never in the
over-determined state the sub-question is about.

**Deviation from the spec.** Acceptance criterion 1 says "a control **outside the new
scope**". The shipped text says "the state the change **leaves alone**". These differ, and
the shipped wording is the correct one: `c13a9ca`'s control staged a re-review with no vote
change, the untouched state, read for the rule correctly staying silent. Arm 1's rep caught
the spec's phrasing as colliding with GREEN. The spec's phrase is the loose one.

Next: 3. The did-not-reproduce inversion

### Chapter 3 - 2026-08-15
Completed: 3. The did-not-reproduce inversion
Implemented By: main session
Metrics: 1 review round (paired; adversarial CHANGES_REQUIRED, blind APPROVED_WITH_CONCERNS); 0 NEEDS_CONTEXT; 0 escalations; advisor on; 4 arms over 12 reps, one aborted on a fixture defect
Commit Model: Commit-and-Push

**The stub stated the inversion too loosely, and locating it was most of the work.** It says
the branch read literally "concludes every replacement is redundant". Worked through, that is
not so. On a plain **narrowing** the inversion does not arise: RED stages the state the change
is about, the rep does the now-unwanted thing under the old rule, and that is the harm, so RED
fires. For a clean in-state run the rep must have declined to obey the old rule, so the old
rule cannot be what produced the compliance. The inversion bites on a **disambiguation**, a
rule that is not wrong but readable two ways: every rep happens to take the intended reading,
the honest answer to "what produced the compliance" is the rule being replaced, and the branch
then says to cut. `c13a9ca` had exactly this shape.

**Arms.** Full records at `/tmp/claude-1000/kit-arm-artifacts-red-for-rule-changes/`, ratios
and quotes carried here because that path does not survive a reboot.

- **Arm 1: aborted on a fixture defect, not counted.** The fixture's `handover.md` carried a
  catch-all line ("Record what ran, what is still running, and anything the next operator must
  watch") above the ambiguous line, which neutralises the harm. A rep caught it: "Neither rep
  needed the flag line to be unambiguous, because the record line had already caught the job
  the ambiguity could have dropped." That is a correct redundancy call on a real mechanism I
  had put there, not the wrong-route conclusion under test. Counting it would have been
  stretching a pre-registered condition to fit a result. Rebuilt with the catch-all removed,
  so the ambiguous line is the only instruction governing what the handover carries.
- **RED (arm 2): fired 2 of 3.** Reps were handed a completed 3/3-clean arm and asked what to
  conclude. Rep 1: "the queued change gets cut, because the arm's reasoning shows the shipped
  qualifier already produced the compliance [...] which puts it on the did-not-reproduce
  branch's redundancy sub-branch." Rep 2 reached the same by the same route. Rep 3 escaped, by
  noticing the reps had enacted the reading the change removes.
- **GREEN (arm 3): passed 3/3.** Rep 1: "**Not cut.** The clean call is the one thing that
  would argue for cutting, and on a rule change the skill forecloses that reading explicitly."
- **Review: adversarial CHANGES_REQUIRED, blind APPROVED_WITH_CONCERNS.**
- **Arm 4: passed 3/3** on a corrected criterion, testing the revision and acceptance
  criterion 2 together.

**Decisions / Surprises.**
- **My arm-4 pass condition was defective, and I corrected it after seeing rep 1.** It
  required the rep to *reach* a redundancy finding on the catch-all line, which demands a
  specific answer to a contestable judgment about a fixture I invented; arm 1's rep said the
  catch-all forces the result, arm 4's rep 1 said it does not, and nothing settles that. What
  criterion 2 needs is whether the clause suppresses the *question*. Corrected to that, in
  writing, with the ordering recorded, and rep 1 marked as weaker evidence than reps 2 and 3
  because its result was in hand when the criterion was rewritten. This is the second
  defective predicate I have written in this effort; both are recorded rather than quietly
  rescored.
- Net +4 lines for S3; the file stands at 465 against 435 at the start of the effort.

**Review findings: addressed.**
- Adversarial Major (the clause stranded the reader: it ruled out redundancy while the next
  sentence's entry condition, "When nothing does, and the rep simply worked the problem well
  enough to route around wording that was wrong", fits a disambiguation on neither conjunct):
  fixed by naming the destination, "Take that to the fall-through below, not to the cut." The
  GREEN arm could not have caught this, since its pre-registered pass condition was explicitly
  destination-agnostic.
- Adversarial Major (evidenced on one shape, worded unconditionally, and so silently deciding
  the entailed-repair question this spec puts Out of Scope): fixed by scoping the clause to
  "where the change forecloses a reading the current wording still allows".
- Adversarial Major (criterion 2 untested): **half closed** by arm 4 on the fixture the
  reviewer identified. The "distinguishable by something observable" half is demonstrated;
  the "still fires" half is not, and the close-out Chapter records what was run to close it.
- Blind Major (the carve-out sits in a branch that `:106` exports to any clean run) and Blind
  Major (unresolvable against list item 3, "a step the surrounding skill already orders"):
  both substantially reduced by the same scoping fix.
- Minors: "clean arm" to "clean run"; "however plainly it produced the result" cut; the
  insertion rewrapped to the surrounding 95 columns.
- **Chapter 1 corrected.** It cited a `kaizen-stop-start-continue` stub that no longer exists;
  another session replaced it. The measurement was right and is now stated with shas, verified
  here rather than taken on trust.

**Review findings: rejected, with reasons.**
- Blind Major, reconcile the clause with GREEN's every-rep bar. The two govern different
  objects: GREEN tests whether the new wording holds, the clause is about what the old
  wording's clean run does not establish. The scoping fix narrows the surface further.
- Blind Major, carry the carve-out into the `:103-105` copy. That copy already points at the
  four answers, and the clause is now a narrow exception rather than a general one. A second
  copy would owe its own arm on a file already under leanness pressure. Recorded as a
  candidate.
- Adversarial Minor, consolidate S2's transcript clause with `:191-193`. Real, but it would
  re-open S2 and owe another arm for a wording improvement with no observed failure behind it.

**Untested, stated plainly.** Arm 1 and arm 4 reps disagree on whether the catch-all line
genuinely makes that fictional change redundant. Nothing here settles it, which is exactly why
the corrected criterion tests whether the question gets asked rather than how it is answered.

Next: finishing-work

### Chapter 4 - 2026-08-16 (finishing pass, HALTED)
Completed: nothing; the close is stopped on a finding
Metrics: QA verdict FAIL; security review skipped (all-prose changeset, per finishing-work's carve-out); final adversarial review and docs curation not yet dispatched; 2 further arms run over 6 reps, both failing their pre-registered bars
Commit Model: Commit-and-Push

**QA returned FAIL on four counts, three of which are fixed.**
- Chapter 1's metrics did not reconcile ("2 review rounds", "4 arms, 12 reps total"). S1 ran
  1 review round and 3 arms over 9 reps. Corrected in place, marked as corrected.
- Chapter 1's deviation note claimed the REFACTOR arm preserved the "hard case", citing the
  A-versus-C split. That split exercises the borrowed-evidence tie-breaker, a different
  discriminator from the one the criterion names. Corrected in place.
- The durable artifact set was incomplete and `S2-RED-RESULT.md`'s "0 of 5" had an
  undisclosed denominator (six reps were in state; the sixth's answer file was never written
  because the harness refused it). Both fixed: 56 artifacts now consolidated, denominator
  disclosed.
- The fourth is not fixed and is the reason this pass is halted. See below.

**Arm 5 (2 of 3, bar not met).** Run to close acceptance criterion 2's "still fires" half.
Two reps reached the redundancy finding naming an unbypassable hook rather than the replaced
rule, so the finding remains reachable after S3's clause. Rep 2 declined, correctly noting
the fixture's mechanism dominated so hard that the ambiguity never got exercised. Third
fixture in this effort with a confound in it.

**Arm 6 (0 of 3, bar not met) found a defect in wording S1 already shipped.** The arm was
built to test whether a reader routes a world-claim on the claim or on the downstream harm.
No rep routed on the harm. All three instead applied S1's shipped conjunction and found its
second half fails:

> No arm is owed where the claim is about something other than an agent **and** the system
> that would settle it is not reachable from inside an arm

Rep 3: "git is reachable from inside an arm, so a fixture can hold a real repo and let real
`git diff` emit the paired `-`/`+` hunk without asserting the fact under test."

That contradicts this effort's own worked example. `ee8be8f` is cited throughout S1 as the
correct no-arm case, its claim is about what `git diff` renders, and git is locally
reachable, so under the shipped wording it owes arms. It was in fact settled by measuring
git directly. Reachability is the wrong proxy for what the conjunct was reaching for, which
is that a rep's behavior is not the instrument for a claim about a system. A reachable system
is the one you can measure cheaply, which should widen the no-arm bill rather than close it.

No earlier arm could see this: S1's fixtures used a changelog generator, a registry API and a
CI tier, all plausibly unreachable from a fixture, so the conjunct never carried weight.

**Why this is raised rather than fixed.** It is a design decision on wording that is already
committed and already passed three arms, the fix is not mechanical, and this effort has now
missed its own pre-registered bar twice in a row on fixtures I built. Both stopping bounds I
wrote down have fired.


