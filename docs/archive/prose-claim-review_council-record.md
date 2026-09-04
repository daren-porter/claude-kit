# Kaizen brief: the paired review's position relative to the arms

DRAFTED 2026-09-04. **No change persisted. Nothing committed. The repo is untouched.**
The draft this brief records was killed by its own pre-arm review before any rep was spent,
which is the outcome the rule it proposes exists to produce.

## Friction (verified against the records, not summarized from memory)

`kaizen:173` states the paired review as a deadline ("before it is committed"), which permits it
to land after the arms are spent. `writing-skills:285` says outright that **no arm can test
whether new wording conflicts with what the skill file already says.** Nothing states the
review's position relative to the arms, so the one check that answers that question runs after
the reps that could not.

Three kit-prose drafts in three days cleared their arms and were then killed on Criticals no arm
could reach. **Two distinct classes, and the note that opened this brief named only one:**

1. **Conflict class.** New wording contradicts what the file already says. Decided the
   2026-09-04 pr-review revert: `pr-review:64` ("**Newly broken.** ... the anchor goes on that
   change rather than the older line") against the drafted `:98`, reached independently by both
   reviewers (`briefs/pr-review-anchoring-both-ends.md:77-84`).
2. **Claims class.** The wording itself asserts something false. An arm measures whether a rep
   follows wording; it never checks whether the wording is true. Decided the 2026-09-03
   fixture-staging revert outright: "**the diff introducing 'enumerate every falsifiable claim
   and count the list' itself shipped unwalked false claims.** Both reviewers said so"
   (`briefs/fixture-staging.md:265-267`), followed by three items headed "Verified false, not
   merely disputed".

**Corrected here, because the note had it wrong:** the note originally said both reverts turned
on Criticals that were "purely conflicts with neighbouring rules", and paired `writing-skills`'
three-places rule against its clear-the-inbox rule. Both false. `fixture-staging.md:333-339`
files the clear-the-inbox item under "Two PRE-EXISTING kit defects the review surfaced,
**independent of this change**", and the real conflict in that change was four-places at `:163`
against `:230`'s "Those three are where that bites".

## The evidence from the third draft, which is this one

Drafted the fix, then dispatched `adversarial-reviewer` + `prose-reviewer` on the unpersisted
draft before any arm. **Six Criticals, zero arm reps, two dispatches.** The adversarial half
found the conflict class (2); the prose half found the claims class (5, overlapping). Both
returned CHANGES_REQUIRED. Full findings below.

That is the cost comparison the rule rests on: three drafts, three deaths, all three caught by a
review, none by an arm. About twelve arm reps went to the first two (strict attribution:
`fixture-staging.md:253-261` and `pr-review-anchoring-both-ends.md:56,:72`; an earlier claim of
"about twenty" wrongly annexed eight dispatches belonging to the freeze arm, which closed as
answered rather than being reverted).

## The design as the two reviews left it

**Two review moments, not one moved moment.** The killed draft relocated the review, which
removed the only read of what actually gets committed.

- **Pre-arm:** the halves that can read an unpersisted draft. `adversarial-reviewer` for the
  conflict class, `prose-reviewer` for the claims class.
- **Pre-commit:** the full pair on the staged change, unchanged from today. Required because
  `writing-skills:126-127` makes REFACTOR revision the expected path, so wording revised after
  GREEN would otherwise be committed having been reviewed only in its pre-revision form.

**Trigger is "before any arm or probe is dispatched", not "before any arm".** A compression has
no arms at all (`writing-skills:301-304`); what it spends reps on is the followability probe, as
does the borrowed-evidence path. Worded as "arm" the prohibition never fires on either, which
are the two rep-spending paths a kaizen pass most often takes.

**The blind halves stay at the commit, and this is forced rather than chosen.**
`executing-work:81` dispatches `blind-reviewer` with "the base git ref ... and nothing else",
and rules the case outright: a changeset with nothing for it to read means "there is no pair to
run". An unpersisted draft is not a ref.

## Five sites, found by a sweep that itself had to be corrected

1. `kaizen:173-185` - the prohibition, appended to the canonical paragraph.
2. `kaizen:201` - the brief template's `Discipline:` line, which orders baseline-testing and is
   handed to a fresh session as a self-contained directive. **The original sweep missed it**,
   because the sweep grepped `paired review` and that line says `baseline-test`: it swept for the
   mechanism being moved, not for the mechanism it was being moved relative to.
3. `kaizen:204-207` - the Phase 2 step list, which enumerates the steps and places the review
   after baseline-testing. Not a restated deadline: an independent ordering statement that the
   fix contradicts. Note the range is **204-207**, not 204-206; line 207 carries a trailing
   clause that is retained.
4. `agents/adversarial-reviewer.md:13` - "You will be given a spec/plan path (in docs/plans/) and
   a base git ref or a list of changed files." It degrades gracefully for a missing spec and has
   **no shape at all for a missing diff**, so this session invented one ad hoc and the next
   session would reinvent it.
5. `writing-skills:285-292` - one clause, so a session running a `docs/plans/` spec under
   `executing-work` reaches the rule without loading `kaizen`. Two archived specs
   (`docs/archive/red-for-rule-changes_spec_v1.md`, `.../writing-skills-ladder_spec_v1.md`) ran
   arms on kit prose that way, and `executing-work`'s section loop reviews at step 3, after
   implementation, which for prose means after the arms.

## What is settled, and by what

**Composition was never the problem; position was.** Both prior changes took
`adversarial-reviewer` + `blind-reviewer`, and between them that pair caught **both** classes:
the claims class on 2026-09-03 ("Both reviewers said so", `fixture-staging.md:267`, followed by
three items headed "Verified false, not merely disputed") and the conflict class on 2026-09-04
(one Critical, both reviewers independently, `pr-review-anchoring-both-ends.md:77`).

**Corrected here.** An earlier version of this brief said both prior changes "missed the claims
class". False. That is the fourth false claim caught in this pass's own writing, after the
note's "purely conflicts", its fused rule pairing, and "GREEN held at 3 of 3". The pattern is
the finding: **the claims class is what this operator produces, repeatedly, and a review is
what catches it.**

So the pair the kit already mandates worked on these two changesets when it ran.

**Bounded, after a facilitator pass rejected the general form.** "Composition was never the
problem; position was" is not supported as a general claim: `kaizen/SKILL.md` mentions
`prose-reviewer` **zero** times, and `docs/plans/prose-claim-review_spec_v1.md` records a
changeset that shipped seven wrong measured claims with no `prose-reviewer` dispatched before the
commit. Both are true of different changesets. What is supported is the narrow version: **on these
two changesets the code pair caught both classes, and it caught them after the arms.** That is
enough to make position the fork here and not enough to close the composition question, which
belongs to that registered spec.

## Unresolved and in the way

1. **Which halves are dispatchable on an unpersisted draft.** `blind-reviewer` is ruled out by
   charter: `executing-work:81` hands it "the base git ref ... and nothing else" and rules that
   nothing to read means "there is no pair to run". `adversarial-reviewer` has no shape for a
   missing diff (`agents/adversarial-reviewer.md:13` gives it "a spec/plan path (in docs/plans/)
   and a base git ref or a list of changed files"), and this session invented one ad hoc.
   `prose-reviewer` takes document paths and works as-is. `blind-reader` also takes document
   paths and could plausibly read a whole-file draft copy, which is **untested**.
2. **Where the draft lives so a reviewer can read it and a later RED rep cannot.** A pre-arm
   review structurally requires a readable draft, and `writing-skills:171-172` says "out of the
   repo" is the wrong test, with the scratchpad "**the worst of the three**". The available
   answer is arm-scoping (`:189-197`): no RED rep is alive yet when the pre-arm review runs.
   That is reasoning, not evidence, and getting it wrong voids a later RED silently.
3. **Whether the pre-arm review recurs per arm or runs once per draft.** REFACTOR revision is
   the expected path (`writing-skills:126-127`) and a narrowing owes a third arm (`:143-149`).
   Unbounded, "before any arm" demands a review before each of them. Unpriced either way.
4. **Nothing proposed here catches a false claim in the arm record.** The `bay` case: a rep
   dispatched, its result never recorded (empty cell, `record/pr-fixture-enumeration.md:288`),
   and "GREEN held at 3 of 3" then asserted downstream from that artifact and reported to the
   user as a result. A pre-arm review reads the draft; it never reads the arm record. Any option
   has to survive an operator who does this, and no candidate addresses recording discipline.
5. **`kaizen` still never says which pair "the paired review" means.** `kaizen:178-179` defers to
   `executing-work`, whose document battery triggers on an `Audience:` line in a spec section a
   kaizen pass has not got. Less consequential than it looked, since both compositions catch both
   classes, but still unstated.

## What it owes

Behavior-shaping corpus prose, so it owes the arms, and **neither has run.** RED must stage the
state where the current rule does the damage, per `writing-skills:141-142`: a rep holding the
current `:173` deadline wording with a kit-prose change to make, read for **whether it dispatches
arms before any review, and for its reasoning off the transcript rather than its output alone**
(`:141-144`), since a rep can reach a defensible outcome while documenting a misreading of the
rule being replaced.

The three rationalizations the killed draft listed were **written from expectation, not
observed**: a grep across the inbox and the hold directory finds none of them uttered by any rep
or operator. `writing-skills:108` requires the rationalization verbatim and `:564` bars guidance
written from imagination. They must be filled from the RED when it runs, or dropped.

## Findings from the two reviews that any redraft must answer

**Adversarial (CHANGES_REQUIRED), beyond the two Criticals above:**
- The dispatch payload sentence collapsed `kaizen:180-183`'s three admissible artifacts (the
  brief, the drafted take-stock entry, an intent note) onto the one that is wrong for both paths
  the same file defines: a Phase 2 session holds a brief, a take-stock pass holds a drafted entry.
- ~17 lines added to the kit's rank-4 measured section (`kaizen:65-190`, product 1512), five
  sentences of it incident narrative, which `writing-skills:561` lists as an antipattern. The
  house form for this content is the eight-line dated-clause shape at `writing-skills:285-292`.
  Discharges by compressing, not by argument.
- Row 1's form is "prohibition + rationalization table + red-flags list"; the draft delivered
  both as inline prose in a 63-word sentence. The house specimen is `executing-work:23`.
- No persist step survived the Phase 2 reorder.

**Prose (CHANGES_REQUIRED), beyond the claims corrections above:**
- "the draft goes in the prompt rather than the repo" restates the exact test
  `writing-skills:171-172` declares insufficient **in those words**: "so 'out of the repo' is the
  wrong test and passing it is no comfort", against an incident where the operator "deliberately
  kept the draft out of the repo and put it there instead". `:168` calls the scratchpad the worst
  of the three, and the scratchpad is where this draft sat. Reached independently by both
  reviewers.
- Empirical refutation from this session's own conduct: **this review was handed two scratchpad
  file paths, not prompt-carried text**, so the pass dogfooding the rule did not follow the rule
  as drafted.
- "the one this paragraph used to license" is false twice over: a new paragraph licensed nothing,
  and the licensing deadline wording is still live at `:98-99`, `:168` and `:173`, which the
  draft deliberately left standing.
- The draft's red flag ("the draft has not been put beside the rules whose triggers it touches")
  makes the sweep a precondition **in the wording the intent note had just rejected**, with no
  procedure attached. Pick one.
- The third-arm argument used to reject a conditional trigger does not hold:
  `writing-skills:143-149` is scoped to a **narrowing** of a shipped rule, and a new prohibition
  narrows nothing. The unconditional form stands on the classification risk alone.
- The "trigger restatement" argument runs backwards. `record/pr-fixture-enumeration.md:242,:277`
  applies that label and classifies the change as a rule change in the same breath, so the label
  is evidence **for** a conditional predicate, not an escape from it.
- "had read `writing-skills:285` and armed first anyway, **twice**" is documented **once**
  (2026-09-04). The 2026-09-03 record does not cite `:285`.
- An 18-line insertion at `kaizen:185` shifts every anchor below it and breaks two live locators
  in a pending brief (`fixture-staging.md:321` cites `kaizen/SKILL.md:197-201` and `:210-212`).
  That brief's own closing item already warns of exactly this. **Any application owes an anchor
  sweep.**
- The last take-stock did not spare the whole rank-1 section: it recorded a **located defect** at
  `writing-skills:242-254`, left `:138-150` unverdicted, and named `:233-260` (a 28-line
  sub-range) as the compression candidate, then **declined** it.

Discipline: follow writing-skills; the arms are owed and unbanked. Take the pre-arm review this
brief proposes before spending them, which is the only part of the rule already tested.

---

# COUNCIL VERDICT 2026-09-04: CONVERGED

Design council, 4 seats (failure-coverage/charter, cost-and-incentives, leak-mechanics, and a
steelman assigned against the favored answer), 2 rounds, 2 facilitator passes. **Every candidate
on the ballot was withdrawn by the seat that held it, each citing a distinct fact.** The
facilitator checked all four moves for a cited reason and reproduced the load-bearing ones
first-person, so this is cross-examination rather than agreeable drift.

## The converged recommendation: a property, not an address

Three seats independently concluded the deliverable is **a derivation, not an address**, because
both eliminations were measurements of mutable stores and `.kit/` is the worked example of an
address going bad. Placement belongs at `writing-skills:163`, where the three-places rule lives,
with `:193`'s re-bind restated for the reviewer copy.

> **The pre-persistence draft, and any artifact carrying that wording or the review's verdict on
> it, lives at a path satisfying all five. The effort records the check.**
>
> **(a) Not under the repo working tree, `.kit/` included.** Gitignored but on disk and readable
> by any rep with repo access, and two shipped clauses send artifacts there (`writing-skills:370`,
> `:384`).
> **(b) Not under any session's scratchpad.** The harness injects the **root** session's
> scratchpad into every subagent's prompt with the instruction to use it for "ALL temporary file
> needs", so **no fixture is required for a rep to be standing in it.**
> **(c) Not under `~/.claude-kaizen/`.** `assets/CLAUDE.md:35` replicates `notes.md` into every
> project's posture rule, so everything in that directory is one `ls` from a handed path.
> **(d) Sharing no ancestor with any fixture path dispatched for the effort.** The only condition
> mechanically checkable before dispatch, and the one the current hold violates.
> **(e) No path segment naming the change's subject** (`writing-skills:220-231`).
>
> The bar is **"no ancestor a rep has reason to enumerate", where a reason includes a path handed
> by a standing posture rule or by the harness, not only a fixture path.** Absolute absence is not
> available (`:199-204`).
>
> Checkability: one recorded pre-dispatch assertion that (d) holds for the fixture set actually
> dispatched, plus the existing transcript instrument at `:209-217` after.

**The "handed by a standing rule" sharpening is required, not stylistic.** Strike it and both
demonstrated non-fixture leaks pass the screen: `~/.claude-kaizen/notes.md` (three-way leak at
`writing-skills:242-254`, closing "every rep involved followed a standing rule correctly and the
shared file is kit-owned rather than something the fixture pointed at") and `.kit/`
(`arm-record.md:37-38`, a rep pointed there in this very effort). It is also why three distance
metrics failed before the leak lens fell back to inference.

## Why each candidate died, with the fact that killed it

- **A (scratchpad).** The harness injects the **root** session's scratchpad into every subagent.
  A council seat confirmed it on its own prompt: it was handed this session's scratchpad path and
  found `prearm/draft.md` one `ls` inside, having written nothing there. `writing-skills:169`
  states a weaker mechanism ("fixtures point subagents into it by construction"); the real one is
  stronger and unconditional. Withdrawn by all three seats that voted it.
- **B (prompt-only).** No reviewer charter has a branch for a missing document path, and
  `:199-204` makes "nothing on disk" false by construction.
- **C (persist to repo).** The write must precede GREEN and cannot be un-persisted, so it
  necessarily overlaps a RED-side arm. `take-stock.md:72-76` already records the pinning remedy
  failing: "the copy nominates which text is authoritative and does not limit what the rep reads."
- **D (no rule owed).** Self-killed on `arm-boundaries_spec_v1.md:742-743`: the author leaked
  "which this effort had already quoted three times." Confirmed: `writing-skills` has **zero** hits
  for "working directory" or "outside the rep", and `quarantin` appears **exactly once tree-wide**
  (`:193`) with no location, while three efforts invented three different addresses.

## Artifact 2 (the review output): a rule is owed, but not by this change

Adjudicated SPLIT on evidence the holding seat produced itself. A dispatched reviewer **cannot**
write the report file: the harness injects "Do NOT Write report/summary/findings/analysis .md
files" into every subagent prompt, confirmed first-hand by two council seats this session, and
`report-file-protocol_spec_v1.md:80-88` records the probe (Write refuses at the tool layer, Bash
heredoc succeeds). Inline is compelled, not chosen. `executing-work:81` already has the orchestrator
materialize the file from the return value, and that materialized copy carries the draft wording,
so it must satisfy the same criterion. **That gap is already registered:** `docs/backlog.md`'s
first active item is that path, `executing-work:81` names it unsettled in shipped text, and
`report-file-protocol_spec_v1.md` retains it with acceptance already reading "a blind seat receives
a path naming neither section, round, nor role." It leaves this change's scope with the constraint
attached, not dropped.

**Side effect worth harvesting:** `docs/backlog.md` says of the framework-injected line "Verify
that before designing." **Two council seats verified it first-hand this session.** That item's
verification step is discharged.

## The one thing that is NOT satisfiable, and it is the sharpest result

**The brief itself, the answer key, has no sanctioned pre-arm destination.** It exists on disk now,
states its thesis in its filename, and:

- `kaizen:19` makes `notes.md` rewritable only by a triage pass;
- `kaizen:207` sequences the archive to `applied/` **after the commit**;
- `kaizen:25-26` says of `applied/` "Nothing counts it and no pass reads it";
- `kaizen:28` makes any file in `briefs/` a pending item gating the session-start count;
- `writing-skills:246` orders "Clear the inbox before an arm" while `kaizen:16-26` defines the
  inbox as three directories, so **the instruction is unexecutable for two of the three.**

A charter-created circle, not operator error. It is what forced three invented destinations and
one classifier denial (`deny` is `[]` globally and absent in the repo, so that denial was runtime
judgment, not policy).

**And the brief is held to a stricter bar than the draft, which no seat separated:**
`writing-skills:272`, "The test is whether the answer is on disk, not whether the fixture told it
to stay away." The brief carries acceptance criteria and the verbatim rationalization, so it is an
**answer**, not merely wording. Two artifacts, two bars.

**Three options, all requiring a `kaizen` charter change. This is the user's call.**
1. Invert `kaizen:207`: archive the brief before the arms rather than after the commit.
2. Give the inbox a fourth, uncounted pre-arm state.
3. **Move or rename `briefs/`, which the facilitator established is the cheapest.** The cost lens
   rejected this on "five stable locators"; the facilitator found **four, three of them dangling
   already**: three are `Promoted 2026-09-02 from ...` provenance lines in `docs/plans/` naming
   files that exist at neither `briefs/` nor `applied/`, and `applied/` renames on archive anyway
   (`YYYY-MM-DD-` prefix), so the promoted-from path was never stable. Moving `briefs/` breaks
   **one** live reference, `kaizen/SKILL.md:24`.

## The bill: the RED is mandatory and cannot be bought out

`writing-skills:358-360` scopes the borrowed-evidence path to wording **ported** from another kit
or a failure **the user reports**. The recorded failure here is the operator's own conduct, so
precondition 2's locator bar at `:444-448` ("a locator another person could follow") cannot be
discharged, and `:395` confirms only the last two of the four answers are that section's.
**This change pays the full three-arm bill or does not ship.** That is what makes the leak price
decisive rather than decorative: the unit of loss is a **rep** (`cedar` cost 1 of 3;
`arm-boundaries` cycle 1 lost all three), so one leak bills 1 to 3 dispatches plus the re-run
against 2 dispatches per pass.

## The premise no seat adjudicated, which must travel with the change

The shipped sequence is arms then paired review then commit (`kaizen:206`). **Ship the placement
criterion alone and nothing changes, because there is no pre-arm draft to place.** And note
precisely what is novel: `kaizen:181` already sanctions handing a reviewer "an intent note written
before dispatch," and this pass built exactly that. What is new is the reviewer being handed **the
draft wording itself**, which is what creates the second copy needing placement. That is a tighter
statement of the problem than the fork was framed on.

## Scoping: split, and neither half is a new spec

- **Artifact 2** to `docs/plans/report-file-protocol_spec_v1.md`, which already owns it and already
  carries the constraint in its acceptance. Nothing to move.
- **The placement criterion** to `docs/plans/prose-claim-review_spec_v1.md` (Status: Proposed), as
  a fourth bullet in its "What a design pass has to settle". Its existing bullet already carries the
  adjacent constraint: "`prose-reviewer` takes a fact-base path; for corpus prose the fact base is
  the repo itself plus session transcripts, and the second is not a path a reviewer can be handed."
  The placement criterion **is** the answer to how that fact base is handed over without leaking.
  That spec's "two sentences have already failed" record is also the correct warning label.

## Corrections the council forced, recorded because the pattern is the finding

- **Mine, the `ls ../..` depth: off by one.** Two levels up from `f/<fixture>/<project>` is `f/`,
  which lists only fixtures; reaching `record/` takes three. The reachability survives; the depth
  was wrong.
- **Mine, a filed kaizen note claiming the 08-20 mechanism escapes the three-places rule.** It does
  not: `:206-208` covers it and those reps were pointed at that directory. The seat that found the
  specimen conceded it against its own interest. Note corrected.
- **Mine, "Composition was never the problem; position was."** Withdrawn as a general claim.
- **Steelman's `writing-skills:169` for "inline is the default": wrong file.** `writing-skills`
  contains zero occurrences of "inline"; the substance is at `executing-work:81`, reached for
  corpus prose by `kaizen:178-179`'s own delegation. Conclusion upheld on correct authority.
- **Cost lens's "five stable locators": four, three dangling.** Consequence above.
- **Parked, not counted as convergence:** the cost lens's compliance split. The charter lens
  adopted it with no reason of its own cited while its author was mid-repair on its mechanism.
  Nothing in the criterion depends on it, so it travels as that seat's standing finding rather than
  a council conclusion.
