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
   If it does not fail, there is nothing to fix - stop.
2. **GREEN:** add the minimal guidance addressing that specific failure. Re-run.
   The agent should now comply.
3. **REFACTOR:** if it finds a new loophole, add the counter and re-run until it
   holds. For discipline rules, combine pressures (time + sunk cost + authority);
   single pressures are weak tests.

Run several reps - one sample lies - and read every flagged result yourself, since
template echoes masquerade as both failures and successes. This is the standard
for any change to behavior-shaping content, the kit's own skills included.

**Run RED before you persist the wording, when the test subagent can read the
repo.** Baseline-testing a kit skill edit from inside the kit repo is a trap: a
subagent with repo access can read the SKILL.md you just saved, so an
already-persisted edit leaks into the RED and voids it as a control (a RED rep once
cited the edited file's line numbers). Keep the new wording in the test prompt only
until RED has failed, then persist it for GREEN.

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
does it; no citation apparatus, and nothing at all for wording that is judgment
rather than observation.

## Antipatterns

- A narrative ("the time we fixed X") instead of a reusable technique.
- A description that summarizes the workflow.
- A prohibition aimed at a wrong-shaped-output problem (use a recipe).
- Guidance written from imagination instead of an observed failure.
- A new skill where one paragraph in an existing skill would have done.
