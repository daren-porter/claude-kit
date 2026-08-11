---
name: writing-skills
description: "Use when creating a skill for this kit, editing one, or deciding whether a wording change to a behavior-shaping skill will actually change behavior. Triggers: adding a new SKILL.md, reworking a skill's rules, a skill that reads well but agents ignore under pressure, or a kaizen change to the kit's own skills."
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

Two rules govern any rule you write, not just the four forms above:
- **No nuance clauses.** "Don't X unless it matters" reopens the negotiation.
  Express a real exception as its own conditional on something observable.
- **Exemption clauses do not scope.** "This limit excludes code blocks" still
  suppresses code blocks. If part of the output must be exempt, restructure so the
  rule cannot reach it.

## Know it works before you trust it

A skill you wrote and never tested is a guess. The honest test is to watch an
agent's behavior with and without the wording:

1. **RED:** give a fresh subagent a realistic task that tempts the failure,
   without the new guidance. Watch it fail; record the rationalization verbatim.
   If it does not fail, or you could not build a task that would, there is nothing to fix
   - stop. The one exception is evidence that is real but not yours to re-run, ported or
   reported, and it costs three recorded artifacts rather than a claim: see "When a local
   RED is not available".
2. **GREEN:** add the minimal guidance addressing that specific failure. Re-run.
   The agent should now comply.
3. **REFACTOR:** if it finds a new loophole, add the counter and re-run until it
   holds. For discipline rules, combine pressures (time + sunk cost + authority);
   single pressures are weak tests.

Run several reps - one sample lies - and read every flagged result yourself, since
template echoes masquerade as both failures and successes. This is the standard
for any change to behavior-shaping content, the kit's own skills included. The one
path around it is the gated one below, for evidence that is real but not yours to
re-run, and it substitutes different work rather than less.

**Run RED before you persist the wording, when the test subagent can read the
repo.** Baseline-testing a kit skill edit from inside the kit repo is a trap: a
subagent with repo access can read the SKILL.md you just saved, so an
already-persisted edit leaks into the RED and voids it as a control (a RED rep once
cited the edited file's line numbers). Keep the new wording in the test prompt only
until RED has failed, then persist it for GREEN. On the gated path below, where RED by
construction never fails, the hold releases once that path's first two preconditions have
been **done and their artifacts recorded**, never on the writing-up alone.

**The wording is not the only thing that leaks; so does the answer.** A fixture restaging a
situation this repo has already resolved leaves a second route to the conclusion open: the
commit, the archived plan, the Chapter that recorded the decision. One RED lost all three of
its reps that way (2026-08-10), each reaching the recorded answer rather than deriving it,
one through `git show <sha>:docs/plans/...`, one through a `docs/archive/` grep, one by
reading the commit. Instructing the subagent not to look is not a control, and a fresh agent
that checks its premises will look and is right to. The test is whether the answer is on
disk, not whether the fixture told it to stay away: a fixture asking for a decision this
repo already made has one to find, and a fixture asking for a behavior has none. Stage an
isomorph with the specifics changed, or a situation the repo has never resolved, and read
what the rep actually opened before you count it.

## When a local RED is not available

Sometimes the evidence for a rule is real but not yours to re-run: wording **ported** from
another kit that wrote it against a failure it observed, or a failure **Daren reports** from
a live session that a synthetic RED will not reproduce. Dropping that wording because your
own RED came back clean discards real evidence.

This is a gated path, not a judgment call. Three preconditions. **Each one is discharged by
an artifact, never by your description of one** - a summary of work nobody can see is the
walk this gate exists to block, and the RED bar above already sets the standard by
demanding the rationalization verbatim.

**The artifacts live in the effort's Chapter, and the backlog carries the one-line debt
plus a pointer to it.** Per-effort history belongs in Chapters, which is what
`curating-docs` says and what `docs/backlog.md` is not shaped for: quoted subagent output
pasted into a one-line active-items file gets truncated to fit, which is the
description-instead-of-artifact walk this gate exists to block. It also keeps the record
writable on the default delegated path, where `docs-write-guard` denies an implementer any
`docs/` write. A delegated run parks the artifacts in `.kit/` and the main thread folds
them into the Chapter at section close. The Chapter carries the first two artifacts before
the wording is persisted and the third after; **the section does not close until it carries
all three**, and a debt pointer that resolves to a Chapter missing any of them is an open
gate, not a closed one.

**A change with no plan doc has no Chapter, and there the home is the commit that carries
the wording.** That is the `kaizen` case, and it is a home rather than an exception: a
commit message has no line budget to truncate quoted output, it is atomic with the wording
it evidences, and a sha in the debt line resolves on any machine and in any clone, which a
path into someone's home directory does not. Two things follow, and they are the Chapter's
ordering rules in the only form a change without sections can take them. **Before the
wording is persisted, "recorded" means captured as verbatim text you could commit right
then** - a drafted message body, or a `.kit/` file folded in at commit time - and never a
summary you mean to write up afterward from memory, which is the walk this gate exists to
block. Neither home witnesses the ordering, the Chapter no more than the commit, which is
why precondition 1 demands the prompt as well: what shows a rep ran before the edit is the
prompt carrying the wording, not any timestamp. And **the commit is not made until its
message carries all three artifacts**, the probe included, which is the
section-does-not-close rule for a change that has no sections.

1. **You attempted a local RED.** Artifact: the fresh subagent's actual output, quoted, not
   a report of it. **Which outcome you are on turns on whether your rep entered the state the
   rule guards**, never on whether it came back clean: a fixture staging the case the rule does
   NOT guard produces a clean run by construction, which is not evidence of anything. So ask
   what state the rule is about, then ask whether the rep was in it, and only then read the
   result. Four answers; only the last two are this section's, and they carry different bars:

   - **In the state, and the failure appeared.** Your RED fired, so you are on the normal bar
     above with a real local RED and none of this section's costs attach. The easiest answer
     to walk past, because a rep that read as fine overall can still carry the defect in its
     output, which is why you read the output rather than the rep's summary of itself.
   - **Not in the state, and the state is stageable.** You have not attempted the RED yet.
     Restage it, and do not file the clean run under either branch below: a rep that was never
     in the guarded state cannot speak to what happens inside it.
   - **Did not reproduce.** The rep was in that state and behaved correctly anyway. Several
     reps, and the entry carries their output, so a clean run is as checkable as a failing
     one.
   - **Could not be constructed.** You could not stage that state at all. Name the element you
     cannot stage **and the substitute you tried**, with the substitute's output and where it
     fell short: "I compressed the
     session to forty turns of synthetic context, and here is what came back." Naming the
     element alone is never enough, because "their harness", "their platform", and "a long
     live session" are the entry conditions restated, and a gate discharged by restating its
     own entry condition is paperwork. Without a substitute that actually ran, this branch
     **fails the gate**; it is the cheap branch, so it is the strict one.

   Attempt it **first**, and record the prompt alongside the output, since the prompt is the
   only thing that can show either of the two things a later reader has to check. On a rep
   carrying the new wording, it shows the wording was supplied in-prompt rather than read off
   the repo, which is what the leak mechanism above cares about; output alone proves the rep
   ran, not that it ran before the edit, and the record and the edit land in the same commit
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

3. **A followability probe on the persisted wording.** Artifact: the probe subagent's
   output, in the same Chapter. This is the precondition most easily skipped, because it falls
   due after the work looks finished; with no recorded output, a skipped probe and a passing
   one are indistinguishable to every later reader, so **an entry without the probe's output
   records a gate that was not passed.**

   This is not GREEN as defined above: re-running the RED task proves nothing here, because
   on this path that task either does not exist or already passed without the wording.
   Instead hand a fresh subagent the persisted wording and a realistic task **inside the
   rule's territory**, which is all the task has to be. It does not have to stage the
   failure, so the could-not-be-constructed branch can always run this. Check that it
   applies the rule correctly; it fails if the subagent misapplies the rule or has to ask
   what it means. Several reps for a pass, since one clean run tells you little. A single
   failure is enough to act on.

   **A failed probe is not a regret, it is a stop.** Revert the wording, or fix it and
   re-probe, before the work closes. Unfollowable prose that shipped with a note saying it
   should not have is the worst of both.

   The probe proves followability and nothing else: it does not validate the claim and it
   does not discharge the debt below.

Bound what you claim:

- **Every claim in the persisted wording maps to a specific sentence in the source record,
  or it is cut.** That is the checkable form of "narrowing and restating are admitted,
  extending is not": adaptation to this kit's vocabulary and harness is expected and fine,
  but a claim with no sentence behind it asserts something the source never observed, so it
  is held to the normal bar like any other belief. It does not get to ride in on the ported
  half's evidence just because it was written in the same sentence.
- **Mark the provenance, not the coverage**, as a clause in the wording itself, and carry
  the locator into it: this rule's evidence is that source's incident or that session,
  rather than a local rep. Do not try to label which half of a sentence is covered. What a
  later session needs is to know the evidence is borrowed and to be able to go and read it,
  so it can weigh the rule against its own observations instead of treating it as locally
  proven; a marker naming no source sends it hunting through an archived backlog. This is
  the one place the "nothing at all for judgment wording" rule below yields.
- **Record the debt in `docs/backlog.md`**: one line, naming the wording and pointing at
  whichever of the two homes above holds the artifacts, the Chapter or the commit sha. This
  clause holds the rule, that home holds the evidence, and the backlog holds the open
  instances. A sha pointer costs one ordering: the line cannot sit in the commit it cites,
  so it lands in a second commit after it, and amending the first to fold the line in
  rewrites the sha the line just cited. The debt closes on one of two
  observable events: a session where the failure the wording guards actually occurs, or a
  session where the rule was applied and the record shows what it changed. "It seems to be
  working" closes nothing, and neither does time. Retiring the wording also closes it.

Marking wording as unverified is **not** itself an admission path. A claim you simply
believe, with no port and no report behind it, is not admitted by labelling it honestly; it
is either cut or held to the normal bar. Scoping a rule you already had against a
counter-case is the separate discipline below.

## When you meet a counter-case to a rule

A kit rule asserting a factual property of an external system - an editor's anchor
behavior, an API's accepted values, what a renderer emits - was usually written
from having tried it. One trial is enough to write the rule and not enough to bound
it, so the wording ends up reading as a property of the system when it is a report
of one instance.

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

## Antipatterns

- A narrative ("the time we fixed X") instead of a reusable technique.
- A description that summarizes the workflow.
- A prohibition aimed at a wrong-shaped-output problem (use a recipe).
- Guidance written from imagination instead of an observed failure. A failure observed
  elsewhere counts, if it came through the gated path above and carries that path's
  provenance clause. A belief you simply labelled as unverified does not, and neither does
  an extension past what the source actually saw.
- A new skill where one paragraph in an existing skill would have done.
