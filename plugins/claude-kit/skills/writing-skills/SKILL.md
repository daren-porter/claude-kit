---
name: writing-skills
description: "Use when creating a skill for this kit, editing one, or deciding whether a wording change to a behavior-shaping skill will actually change behavior. Triggers: adding a new SKILL.md, reworking a skill's rules, a skill that reads well but agents ignore under pressure, a section that has grown by accretion and wants shortening, or a kaizen change to the kit's own skills."
---

# Writing Skills

A skill is behavior-shaping prose, not documentation. One that reads well but does
not change what an agent does under pressure is decoration. Treat a skill change
like a code change: name the failure it fixes, pick the form that fixes that
failure, and confirm it works before trusting it.

## When a skill earns its place

- **Create when:** the technique is non-obvious, recurs across efforts, and is
  general. A single project's convention is not a skill; it goes in that project's
  CLAUDE.md.
- **Do not create when:** it is a one-off, a restatement of standard practice, or
  something a hook or regex can enforce mechanically. Automate the mechanical
  ones; reserve skills for judgment.
- **The kit stays lean.** Every skill is paid for in every session's skill list. A
  new skill must beat the alternative of one more paragraph in an existing skill.
  When in doubt, fold it in rather than add a file.

## Anatomy

- One SKILL.md, in the kit's voice: direct, opinionated, anti-dogma, no em dashes.
  Add a reference file only when the body genuinely outgrows the size of the kit's
  other skills, and then gate it the way csharp-style and sql-style do: the
  SKILL.md covers routine work, and it names the territories that need the
  reference.
- **Frontmatter: always quote the description.** An unquoted `": "` silently
  breaks the YAML and drops all skill metadata (learned the hard way on
  csharp-style). `name` and `description` are the two that matter.
- Body: the principle, the rules that carry judgment, the antipatterns. Tables and
  lists for what gets scanned; prose for the why. A flowchart only for a decision
  where the agent might genuinely go wrong, never for linear steps.

## The description states the trigger, not the workflow

The description is how a future session decides whether to load the skill. Write
it as "Use when..." plus the symptoms that pull it in, and stop. Do not summarize
the skill's process there: an agent that reads a process summary acts on the
summary and skips the body, so a step the body insists on gets dropped.

The kit has a live specimen. executing-work's description ends with "Works section
by section with adversarial subagent review and Chapter checkpoints" - a process
recap a loading agent can act on in place of the seven-step section loop the body
actually defines. (Superpowers reports measuring this kind of drift: a description
that summarized "code review between tasks" yielded one review where the body
specified two. Treat that as a caution, not a citation.) Name when the skill
applies; let the body say what to do.

## Match the form to the failure

Name the failure first, then pick the form that fixes it. The form that
bulletproofs one failure backfires on another:

| The failure | The form that fixes it | The form that backfires |
|---|---|---|
| Knows the rule, skips it under pressure | Prohibition + rationalization table + red-flags list | Soft "prefer..." guidance |
| Complies, but the output is wrong-shaped (bloated, buried, restated) | A positive recipe: state what the output IS, its parts in order | A prohibition list ("don't restate", "never narrate") |
| Omits a required element from something it already produces | A structural slot: a REQUIRED field in the template it fills | Prose reminders near the template |
| Behavior should depend on a condition | A conditional on an observable predicate ("if the brief exists, reference it") | An unconditional rule plus exemption clauses |

**Ask what already produces the behavior before you write anything.** The structural-slot row
is a form to reach for and also a question to ask first: when a template the agent fills, a
hook that rejects the bad output, or an earlier step in the same skill already forces the
element, prose repeating it changes nothing and adds a rule every session then carries. The
kit stays lean by subtraction here as much as by declining new files, and a baseline test will
not tell you this on its own, since a rep held in line by the existing mechanism looks exactly
like a rep that did not need the rule.

Two rules govern any rule you write, not just the four forms above:
- **No nuance clauses.** "Don't X unless it matters" reopens the negotiation.
  Express a real exception as its own conditional on something observable.
- **Exemption clauses do not scope.** "This limit excludes code blocks" still
  suppresses code blocks. If part of the output must be exempt, restructure so the
  rule cannot reach it.

## Know it works before you trust it

A skill you wrote and never tested is a guess. The honest test is to watch an agent's behavior
with and without the wording:

1. **RED:** give a fresh subagent a realistic task that tempts the failure, without the new
   guidance. Tempting it takes combined pressure (time + sunk cost + authority); a single
   pressure is a weak test, and an untempted RED tempts nothing, which bites hardest on the
   did-not-reproduce branch below, where a clean run from an unpressured rep is the weakest
   ground for calling a rule redundant. Watch it fail; record the rationalization verbatim. A
   silent omission leaves none to quote, so the artifact is the end state on disk plus a
   verbatim list of what the rep created, read and deleted; ask for that list in the dispatch,
   because a deleted file leaves no trace and the list cannot be reconstructed afterward. One
   rep failing in the guarded state is a reproduction, so record the ratio rather than needing
   a majority: RED asks whether the failure can happen, which one instance settles, where
   GREEN's every-rep bar is stricter, asking whether the rule reliably holds, which no instance
   settles. If it does not fail, or you could not build a task that would, there is nothing to
   fix - stop. **Before you read a clean run that way, check the rep was in the state the rule
   guards, and then what produced its compliance.** A fixture staging the case the rule does
   not cover comes back clean by construction, so that run says the RED has not been attempted
   yet rather than that there is nothing to fix; and a rep that was in the state can comply
   because something else in the kit already forces the behavior, which is a finding about the
   draft rather than about the rule. Both live in the four answers under "When a local RED is
   not available", which read any clean run, not only that section's.
2. **GREEN:** add the minimal guidance addressing that specific failure. Re-run, under the same
   pressure RED carried, and the bar is every rep: a rule that holds two times in three is not
   a rule, it is a coin the next session flips.
3. **REFACTOR:** if it finds a new loophole, add the counter and re-run until it holds, each
   revision a fresh arm against reps that have not seen a prior version.

**A behavior-claim rule change asks RED a different question, and a narrowing takes a third
arm.** Changing a rule the kit already ships asks whether the rule as it stands produces the
harm, since a rep obeying the current rule is complying with the shipped kit rather than
failing, and counting that fires the RED for any rule change whatever. So stage the state where
the current rule does the damage, and read the rep's reasoning and not only its output: a rep
can reach a defensible outcome while documenting a misreading of the rule being replaced, and
that misreading is the finding. Take it off the rep's transcript rather than asking, since
asking tells it which line is graded. RED and GREEN share that one state, GREEN re-running
RED's task, which is why a narrowing owes a third arm in the state the change leaves alone,
read for the rule still doing there what it always did: one that quietly took the untouched
case with it looks exactly like one that worked. That arm carries the draft and can fail, so it
holds the replaced rule in its fixture and dispatches serially like RED.

Run three reps at least - one sample lies - and read every flagged result yourself, since
template echoes masquerade as both failures and successes. This is the standard for any change
to behavior-shaping content, the kit's own skills included. Three sections route around it, and
cost chooses none of them. Evidence that is real but not yours to re-run, ported or reported,
costs three recorded artifacts rather than a claim: "When a local RED is not available"
substitutes different work rather than less. A rewrite that adds no claim cannot stage a RED at
all, so it goes to "Compression: rewriting a section shorter" rather than to any of the four
answers; that section says how to tell, keeps every claim the section already makes on a bill
of an inventory and a probe, and opens on a finished two-directional mapping and never on an
intention to shorten. And "When you meet a counter-case to a rule" states its own bill and when
it is available.

**Run RED before you persist the wording, and keep it out of three places: the repo, the
scratchpad, and the RED prompt.** Baseline-testing a kit skill edit from inside the kit repo is
a trap: a subagent with repo access can read the SKILL.md you just saved, so an
already-persisted edit leaks into the RED and voids it as a control (a RED rep once cited the
edited file's line numbers). The RED prompt is barred because the prompt that carries the
wording is GREEN's, and RED's whole job is to fail without it. **The scratchpad is the worst of
the three**, because fixtures point subagents into it by construction. A rep once found the
candidate wording beside its own fixture, read it, and reported the contamination itself
(2026-08-11, the operator having deliberately kept the draft out of the repo and put it there
instead), so "out of the repo" is the wrong test and passing it is no comfort.

**The arm controls which copy of the skill the rep reads, and the repo is not it.** Reps load
skills through the harness from the installed plugin cache, which lags. Resolve the live one
from `<configBase>/plugins/installed_plugins.json`, which names its `installPath`, because
neither guessing the tree nor sorting by mtime finds it: a second cache tree sat under
`~/.claude/` on 2026-08-15 holding a build with whole skills missing, sibling versions tie on
mtime, 13 versions sat under the live tree alone, and the active one was behind the repo on
`executing-work` and `finishing-work` by content nothing to do with the edit under test. So a
rep that reaches a skill by name reads text you are not editing, and a RED firing against a
stale baseline licenses wording the live file may already make redundant, the redundancy
finding above arriving inverted. Point each rep at an explicit repo path, or hand it a fixture
copy and diff that copy against the repo file at dispatch. That is also why GREEN carries its
wording in the prompt rather than the file: persisting to the repo does not change what a rep
loads, so in-prompt is mandatory rather than stylistic, and what goes untested that way is
placement, trigger, and whether a real session would read the rule at all.

**The scratchpad bar is arm-scoped, not absolute for the effort.** It exists so a RED rep
cannot read the draft, so it binds through every RED-side arm and lifts once you are running
GREEN, whose reps are supposed to have the wording: a GREEN fixture copy in the scratchpad is
the mechanism working, not a leak. So run the arms serially, with no RED rep alive while a
GREEN fixture holding the draft exists, and quarantine the spent GREEN fixtures before any
REFACTOR arm, which is RED-side again for the revised wording. And **persist when the arm is
done, not when the first rep fails**: the three reps make an arm, and a repo written to after
rep 1 contaminates reps 2 and 3. Until then the wording lives in your own context and in no
file you wrote.

Absolute absence is not the bar, because it is not available: the harness records prompts and
tool results alike into this session's transcript and a per-subagent transcript at
`<configBase>/projects/<project>/<session-id>/subagents/agent-<agentId>.jsonl`, owned by the
same user the reps run as, so the wording is on readable disk from the moment you draft it
(verified 2026-08-11; path corrected 2026-08-15, the earlier "sibling under `projects/`" being
two levels too shallow, which matters because the detection rule below sends you to that file).
What you control is which paths a rep has reason to walk, and a rep working a fixture has every
reason to open the skill file and none to open a transcript directory. Those three are where
that bites in practice rather than an exhaustive list, since any other directory you point a
fixture into inherits the same property; past them what is left is detection: read what each
rep actually opened before you count it. That transcript is the instrument: recover a rep's
agentId by grepping its `toolUseId` across the `.meta.json` sidecars beside those transcripts,
which carry the dispatch `description` and `spawnDepth` too, then read the paths its transcript
records. Nested reps land in the **root** session's `subagents/` rather than their
dispatcher's, so that is the one directory to search (both verified 2026-08-15, after a first
draft sent you joining `tool_use` to `tool_result` in your own transcript, which works and is
two steps longer). Do not ask the rep: that is self-report, and a rep that read what it should
not have is the one least likely to volunteer it. On the gated path below, where RED by
construction never fails, the hold releases once that path's first two preconditions have been
**done and their artifacts recorded**, never on the writing-up alone.

**Reps that run in parallel need one fixture each.** The leak rules are about what a rep can
read; this one is about what two reps can write. Three reps dispatched at once against a
fixture holding a single output path overwrote each other, and the tell was a rep reporting
that "the file was rewritten on disk by an outside process twice while I worked", then auditing
what it found and keeping the better version, so its artifact was partly another rep's
(2026-08-14). Whether a rep took the action under test survives this; any judgment of what it
produced does not. Copy the fixture once per rep and point each rep at its own copy; the
failure is silent unless a rep happens to mention it, so do not rely on noticing.

**The kaizen inbox is that same hazard with no fixture in it.** The global posture rule tells
every rep to append kit friction to `~/.claude-kaizen/notes.md`, so a rep testing a kit skill
files a note about the very gap under test and a concurrent rep reads it as prior art, one
opening with "the kaizen notes for both frictions are already filed from earlier in this pass"
(2026-08-15). Clear the inbox before an arm and read it after, counting whatever is in it as
those reps' output rather than as inbox items. That buys attribution and not isolation:
clearing beforehand does nothing about rep 2 reading rep 1's note mid-arm, and mid-arm is when
it happened. Isolation costs serial dispatch with a clear between reps, and the arm that earns
it is RED: of five arms run on 2026-08-15, only RED produced inbox writes, because the rep the
wording fails is the rep with something to file. Scoped any wider the exception swallows the
parallel default, since the posture rule points every rep at that same file. Nothing about this
announces itself, because every rep involved followed a standing rule correctly and the shared
file is kit-owned rather than something the fixture pointed at.

**Reps' own outputs travel the same way.** A probe this session opened a gate file an earlier
rep had written to the shared scratchpad under a near-identical fixture, took its pre-fix
wording for a prior pass having dropped the rule, and reported that as a finding; the file
simply predated the wording (2026-08-15). So sweep both directions: clear what a rep could find
before an arm, and attribute what you find after it.

**The wording is not the only thing that leaks; so does the answer.** A fixture restaging a
situation this repo has already resolved leaves a second route to the conclusion open: the
commit, the archived plan, the Chapter that recorded the decision. Nor are those routes all
in-repo, which matters when the fixture imitates real work rather than a decision: other
sessions' scratchpads persist on the machine, so a rep sent to review a fictional PR found a
real gate report for the very PR the fixture was modelled on (2026-08-11) and reasoned from it.
Give the fixture identifiers nothing on this disk already answers. One RED lost all three of
its reps that way (2026-08-10), each reaching the recorded answer rather than deriving it, one
through `git show <sha>:docs/plans/...`, one through a `docs/archive/` grep, one by reading the
commit. Instructing the subagent not to look is not a control, and a fresh agent that checks
its premises will look and is right to. The test is whether the answer is on disk, not whether
the fixture told it to stay away: a fixture asking for a decision this repo already made has
one to find, a fixture asking for a behavior has none. Stage an isomorph with the specifics
changed, or a situation the repo has never resolved.

An **open** question the repo documents primes rather than answers, which is harder to notice
and is a surface the kaizen loop creates for itself: a probe on 2026-08-15 read a `docs/plans/`
stub committed hours earlier in that same pass and reported its framing as primed rather than
independent. The finding survived, being checkable against the skill text; the claim to have
reached it independently did not. So when an arm's territory is a question this repo has
parked, discount what a rep reports having found on its own, and expect a promoted note to be
exactly where its territory got documented.

## Compression: rewriting a section shorter

**The entry condition is a finished mapping, not an intention.** You are on this path once the
inventory below maps every claim in both directions. "I am only shortening it" is the thing to
be shown, never the reason for not showing it. The mapping needs a draft to map against, so
expect to settle which path you are on last rather than first.

For a rewrite that clears that bar the arms are unavailable rather than waived, and the branch
is **could not be constructed** rather than a clean run. RED would have to stage a state where
the current wording lacks something the new wording adds, and a compression adds nothing; no
substitute reaches a state that does not exist, so this is the one case on that branch owing no
substitute. Three reps given an accreted section and told to shorten it without dropping
anything each built the inventory unprompted, found the arm unstageable, and halted rather than
ship (2026-08-16).

What a compression risks instead is that the shorter wording no longer lands, and that is what
it pays for. **The plan section does not close, or the commit is not made, until the unit, the
inventory and the probe output are recorded where the gated path records its own.** An
inventory nobody can read is the compressing session's own judgment about its own work, which
is the thing this path exists to replace.

**A claim inventory**, mapped in both directions. **One claim is one thing the section asserts
that a reader could act on differently if it were absent**: a directive, a bar, a permission, a
named exception, or an assertion about how something behaves. An example and a restatement are
not claims. **Every row carries three things: the claim, its trigger verbatim, and its attached
content** - the provenance clause, locator or recorded instance this file mandates elsewhere.
Attached content is not a claim and is not droppable, and giving it a column is what makes a
drop visible, since a rewrite that strips the dated incident from a rule it belongs to leaves
an otherwise complete inventory and one empty cell. An unconditional claim records
"unconditional" in the trigger column, and inventing a condition to fill it is itself the rule
change. **When you cannot tell whether something is one claim or two, split it**; where the
fine split then maps to one survivor, say so and carry on. Fix the unit and write it down
before you rewrite, because a unit settled afterwards is settled to make the mapping come out
even. Three reps inventorying one section with no stated unit returned 20, 13 and 24 claims,
which argues for stating a unit rather than for this one.

**A followability probe on the compressed text**, run per the gated path's definition below,
persisted first as that definition requires, and carrying its rule that you ask whether the
rule was applied and never whether an ambiguity can be named in it. **It needs one control that
path does not: the rep must not reach the pre-compression text.** Persisting leaves the longer
version in git history and in every installed plugin cache, which is where a rep resolving a
skill by name reads it, and it makes all the same claims, so that rep applies the old wording
correctly and passes whatever the new text does. Hand it the compressed section in the prompt,
give the task identifiers that do not name the skill, and read what it opened before counting
the pass. Where the compression's own motive is that the current wording does not land, probe
the before text under the same task as well; a before-probe that comes back clean disproves the
motive and the compression proceeds on length alone.

**Disposal turns on which direction the gap runs, and only the first stays on this path.**

- **A claim in the longer text with nothing opposite it** is restored to the shorter text and
  recorded as a retirement candidate. The rest of the rewrite is still a compression. Retiring
  it is a separate change owing the arms a rule change owes.
- **A claim in the shorter text with nothing opposite it** is new wording, whatever it was
  meant to be. Cut it, or take it to the bar above and pay what a new rule owes.
- **A trigger that moved** is a rule change in a compression's clothes: if the shorter text
  binds cases the longer did not, or stops binding cases it did, a claim moved whatever the
  line count says. Put the trigger back, or leave this path.
## When a local RED is not available

Sometimes the evidence for a rule is real but not yours to re-run: wording **ported** from
another kit that wrote it against a failure it observed, or a failure **Daren reports** from
a live session that a synthetic RED will not reproduce. Dropping that wording because your
own RED came back clean discards real evidence.

This is a gated path, not a judgment call. Three preconditions. **Each one is discharged by
an artifact, never by your description of one** - a summary of work nobody can see is the
walk this gate exists to block, and the RED bar above already sets the standard by demanding
the rationalization verbatim.

**The artifacts live in the effort's Chapter, and the backlog carries the one-line debt plus
a pointer to it.** Per-effort history belongs in Chapters, which is what `curating-docs` says
and what `docs/backlog.md` is not shaped for: quoted subagent output pasted into a one-line
active-items file gets truncated to fit, which is that same walk. It also keeps the record
writable on the default delegated path, where `docs-write-guard` denies an implementer any
`docs/` write; a delegated run parks the artifacts in `.kit/` and the main thread folds them
into the Chapter at section close. The Chapter carries the first two artifacts before the
wording is persisted and the third after; **the section does not close until it carries all
three**, and a debt pointer that resolves to a Chapter missing any of them is an open gate,
not a closed one.

**A change with no plan doc has no Chapter, and there the home is the commit that carries the
wording.** That is the `kaizen` case, and it is a home rather than an exception: a commit
message has no line budget to truncate quoted output, it is atomic with the wording it
evidences, and a sha in the debt line resolves on any machine and in any clone. **Before the
wording is persisted, "recorded" means captured as verbatim text you could commit right
then** - a drafted message body, or a `.kit/` file folded in at commit time - never a summary
you mean to write up afterward from memory. Neither home witnesses the ordering, which is why
precondition 1 demands the prompt as well: what shows a rep ran before the edit is the prompt
carrying the wording, not any timestamp. And **the commit is not made until its message
carries all three artifacts**, the probe included.

1. **You attempted a local RED.** Artifact: the fresh subagent's actual output, quoted, not a
   report of it. **Which outcome you are on turns on whether your rep entered the state the
   rule guards**, never on whether it came back clean: a fixture staging the case the rule
   does NOT guard produces a clean run by construction, which is not evidence of anything. So
   ask what state the rule is about, then whether the rep was in it, and only then read the
   result. Four answers; only the last two are this section's, and they carry different bars:

   - **In the state, and the failure appeared.** Your RED fired, so you are on the normal bar
     above with a real local RED and none of this section's costs attach. The easiest answer
     to walk past, because a rep that read as fine overall can still carry the defect in its
     output.
   - **Not in the state, and the state is stageable.** You have not attempted the RED yet.
     Restage it, and do not file the clean run under either branch below: a rep that was
     never in the guarded state cannot speak to what happens inside it.
   - **Did not reproduce.** The rep was in that state and behaved correctly anyway. Three
     reps at least, and the entry carries their output, so a clean run is as checkable as a
     failing one. **Then ask what produced the compliance before you file it here**, since
     these four answers classify the rep's state and not the cause of its behavior. When
     something already in the kit forces the result - a REQUIRED field in the template the
     rep fills, a hook that rejects the bad output, a step the surrounding skill already
     orders - the finding is that the draft is redundant and the change is to cut it, a
     better outcome than admitting it and one this branch otherwise buries. Where the change
     forecloses a reading the current wording still allows, the rule being replaced is not
     one of those things: a clean run shows that wording can be read the intended way, never
     that it will be, and the reading you are removing is the one no rep happened to take.
     Take that to the fall-through below, not to the cut. When nothing does, and the rep
     simply worked the problem well enough to route around wording that was wrong, that is a
     real did-not-reproduce, and the wording may still be worth fixing on its own evidence:
     prose that only capable readers survive is a defect whether or not a rep trips on it.
   - **Could not be constructed.** You could not stage that state at all. Name the element
     you cannot stage **and the substitute you tried**, with its output and where it fell
     short: a forty-turn synthetic-context compression, say, and what came back. Naming the
     element alone is never enough, because "their harness" and "a long live session" are the
     entry conditions restated, and a gate discharged by restating its own entry condition is
     paperwork. Without a substitute that actually ran, this branch **fails the gate**; it is
     the cheap branch, so it is the strict one. **One case owes no substitute**, because no
     substitute could reach its state: a rewrite that adds no claim, which "Compression:
     rewriting a section shorter" above routes and gates on a finished two-directional
     mapping. Nothing else here is excused by resembling it.

   The two branches want different amounts of evidence on purpose. Did-not-reproduce asserts
   a behavioral negative, which one clean sample barely supports, so it takes the three reps.
   A substitute measures no behavior at all, so reps add nothing, and what it has to
   establish is that you reached for the element rather than what happened when you did. Do
   not read the single substitute as the lower bar and file a single clean in-state rep
   beside it.

   Attempt it **first**, and record the prompt alongside the output. On a rep carrying the
   new wording, the prompt shows the wording was supplied in-prompt rather than read off the
   repo, which is what the leak mechanism above cares about; output alone proves the rep ran,
   not that it ran before the edit, and the record and the edit land in the same commit
   either way, so git witnesses nothing. On a substitute, which carries no new wording at
   all, it shows instead **which state the substitute actually staged**, so the branch you
   claimed above is checkable rather than asserted.
2. **You can locate the failure someone else recorded.** Artifact: a locator another person
   could follow. For a port, the file and section of their spec, Chapter, or incident
   write-up. For a report, a date or a transcript path. **A detailed account with no locator
   does not qualify**: it is hearsay with more words, and it is the disjunct an agent in a
   hurry reaches for. A preference or a hunch is not a report, and wording whose provenance
   you cannot locate is unevidenced prose that goes back to the normal bar. A rule the other
   kit wrote from imagination reads exactly like one it wrote from an incident.

Then persist, and run the third:

3. **A followability probe on the persisted wording.** Artifact: the probe subagent's output,
   in the same Chapter. This is the precondition most easily skipped, because it falls due
   after the work looks finished; with no recorded output a skipped probe and a passing one
   are indistinguishable to every later reader, so **an entry without the probe's output
   records a gate that was not passed.**

   This is not GREEN as defined above: re-running the RED task proves nothing here, because
   on this path that task either does not exist or already passed without the wording.
   Instead hand a fresh subagent the persisted wording and a realistic task **inside the
   rule's territory**, which is all the task has to be. It does not have to stage the
   failure, so the could-not-be-constructed branch can always run this. Check that it applies
   the rule correctly; it fails if the subagent misapplies the rule or has to ask what it
   means. Three reps at least for a pass, since one clean run tells you little. A single
   failure is enough to act on.

   **Ask whether the rule was applied, not whether an ambiguity can be named in it.** A
   capable reader can answer the second about any prose, so a prompt that asks for it gets a
   list however good the wording is, and that list reads as friction without being any. Three
   probes phrased that way on 2026-08-15 returned twelve inbox notes against wording all
   three of them had applied correctly, and the count was then read as a measure of the kit
   rather than of the prompt. Keep the self-report to what the rep had to interpret in order
   to act.

   **A failed probe is not a regret, it is a stop.** Revert the wording, or fix it and
   re-probe, before the work closes. Unfollowable prose that shipped with a note saying it
   should not have is the worst of both. The probe proves followability and nothing else: it
   does not validate the claim and it does not discharge the debt below.

Bound what you claim:

- **Every claim in the persisted wording maps to a specific sentence in the source record, or
  it is cut.** That is the checkable form of "narrowing and restating are admitted, extending
  is not": adaptation to this kit's vocabulary and harness is expected and fine, but a claim
  with no sentence behind it asserts something the source never observed, so it is held to
  the normal bar like any other belief rather than riding in on the ported half's evidence
  because it was written in the same sentence.
- **Mark the provenance, not the coverage**, as a clause in the wording itself, and carry the
  locator into it: this rule's evidence is that source's incident or that session, rather
  than a local rep. Do not try to label which half of a sentence is covered. What a later
  session needs is to know the evidence is borrowed and to be able to go and read it; a
  marker naming no source sends it hunting through an archived backlog. This is the one place
  the "nothing at all for judgment wording" rule below yields.
- **Record the debt in `docs/backlog.md`**: one line, naming the wording and pointing at
  whichever of the two homes above holds the artifacts, the Chapter or the commit sha. This
  clause holds the rule, that home holds the evidence, and the backlog holds the open
  instances. A sha pointer costs one ordering: the line cannot sit in the commit it cites, so
  it lands in a second commit after it, and amending the first to fold the line in rewrites
  the sha the line just cited. The debt closes on one of two observable events: a session
  where the failure the wording guards actually occurs, or a session where the rule was
  applied and the record shows what it changed. "It seems to be working" closes nothing, and
  neither does time. Retiring the wording also closes it.

Marking wording as unverified is **not** itself an admission path. A claim you simply
believe, with no port and no report behind it, is not admitted by labelling it honestly; it
is either cut or held to the normal bar. Scoping a rule you already had against a
counter-case is the separate discipline below.

## When you meet a counter-case to a rule

A kit rule was usually written from the one case its author had in front of them.
That shows plainest where the rule asserts a factual property of an external system -
an editor's anchor behavior, an API's accepted values, what a renderer emits - and it
is no less true of a rule about what an agent should do. One trial is enough to write
the rule and not enough to bound it, so the wording ends up reading as a property of
the system when it is a report of one instance.

That gap surfaces later, when you hit a case the rule does not cover. Decide which
situation you are in before you either obey the rule or discard it:

- **Contradicted.** You observed the very thing the rule asserts, and it came out
  differently. The rule is wrong; fix it.
- **Narrower than written.** You observed something the rule never tested. Both can
  be true at once, so scope the rule rather than reversing it, and the confirmed
  case stays confirmed.

Do not resolve it by inventing a distinction the evidence never supported. That is
the failure with teeth. Handed pr-review's old full-line anchor mandate alongside
live sub-line anchors that demonstrably worked, a fresh agent reconciled the two by
deciding full-line spans are what an agent computes and sub-line spans are what a
human drags in the diff viewer. Nothing observed had said that. Preserving a
mandate by fabrication is worse than either obeying or discarding it, because the
invention outlives the session that made it.

When you do fix the rule, record the observed instance beside the generalized
claim, so the next session decides on evidence instead of repeating this. A clause
does it; no citation apparatus, and nothing at all for wording that is plainly
judgment rather than a claim about how something behaves. The exception is the
borrowed-evidence case above: a rule admitted through that gate carries a clause
naming where its evidence came from, so the next session knows it was never proven
here.

**What this costs, and when it stands in for an arm.** No arm is owed where the claim is
about something other than an agent, because an arm measures what an agent does and that is not
the evidence: go and measure the system instead. Most rules are a directive resting on a
premise, so route on the claim you are repairing rather than on the sentence's form:
correcting the premise is about the system, and changing what the agent does with it is not.
The bill is then the scoping plus that recorded instance, and nothing else: the gated path's
backlog line belongs to that path and is easy to import by accident from
next door. Its probe travels one step further, to "Compression: rewriting a section shorter"
and nowhere else. Two bounds. Where the evidence is also someone else's to re-run, the gate
above wins, being the stricter of the two. And this scopes the evidence, never the
shape: contradicted-versus-narrower governs any rule change, including one about what
an agent does, whose evidence is still the arms.

## Antipatterns

- A narrative ("the time we fixed X") instead of a reusable technique.
- A description that summarizes the workflow.
- A prohibition aimed at a wrong-shaped-output problem (use a recipe).
- Guidance written from imagination instead of an observed failure. A failure observed
  elsewhere counts, if it came through the gated path above and carries that path's
  provenance clause. A belief you simply labelled as unverified does not, and neither does
  an extension past what the source actually saw.
- A new skill where one paragraph in an existing skill would have done.
