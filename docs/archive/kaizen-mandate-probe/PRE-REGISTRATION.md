# Pre-registration: followability probe on kaizen's corpus-prose review mandate
# Written 2026-09-07 BEFORE any rep was dispatched. Nothing below is edited after.

## What is under test

The shipped clause in `kaizen/SKILL.md`, verbatim, beginning "Corpus prose takes the
paired review before it is committed, and no corpus commit lands until its Criticals
are resolved. Corpus is a path test rather than a judgment: the four globs
`tools/accretion.js` measures, ..."

Backlog item: "`kaizen`'s corpus-prose review mandate has never been armed
(2026-08-20)", which closes on either arm being run against the shipped clause. This
is the followability probe, not the RED.

## Probe design

Per `writing-skills`: hand a fresh rep the persisted wording plus a realistic task
INSIDE the rule's territory; it need not stage the failure. Ask whether the rule was
APPLIED, never whether an ambiguity can be named in it, because a capable reader can
answer the second about any prose. Three reps minimum. A single failure is enough to
act on. It fails if a rep misapplies the rule or has to ask what it means.

The task gives the rep two changed files, one inside the corpus globs and one
outside, so the rule has to be applied rather than guessed at. A rep that has not
read the rule, or reads it as a judgment call, has two plausible wrong answers
available: review both, or review neither.

## Graded points, fixed now

1. **Requires the paired review for `skills/cold-open/references/tone.md`**, which
   matches the corpus glob `skills/*/references/*.md`.
2. **Does NOT require it for `docs/rollout-notes.md`**, which matches no corpus glob.
3. **Names the path test as the reason**, rather than reasoning from how important or
   behavior-shaping the file looks.
4. **Holds the commit** until Criticals are resolved, rather than committing and
   reviewing after.

Pass = 4/4 on all three reps, and no rep asking what the rule means. Any rep scoring
0 on point 1 or point 2 is a misapplication and fails the probe outright.

## Isolation

Dispatched through `tools/arm-harness.js`, so no rep carries the installed skill
listing or this project's auto-memory. Residuals per `docs/arm-harness.md`: the global
CLAUDE.md is present and names `kaizen` and `executing-work` in prose, which is a real
cue for this territory and is recorded here rather than claimed away. Each rep is
asked to list every path it read, so a rep that went to the real repo is detectable.

## The fixture is de-identified except for the clause itself

The clause names real files (`tools/accretion.js`) and real skills. The SCENARIO does
not: a fictional kit, fictional skill names, a fictional pass. So a rep has no reason
to go looking for this repo, and if one does, the read list shows it.
