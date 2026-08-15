# RED for a Rule Change, Not Just a New Guard

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-15

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

This is not hypothetical. The `pr-review` change committed in that same pass
(`c13a9ca`) was a scoping of an existing rule, and its arm had exactly this shape: no
rep produced author-facing harm, and what the arm actually caught was a documented
misreading of the rule being scoped rather than a failure of the behavior. That was
defensible on its own evidence, but it was not the RED the section describes.

## What a design pass has to settle

1. **Which arm establishes the need.** For a rule change the interesting question is
   not "does the failure occur without guidance" but "does the current rule produce a
   harm, and does the replacement remove it". That may be two arms, not one.
2. **Whether the existing rule sites are stripped.** Isolation gives a clean read of
   the draft's contribution against a baseline that does not exist in production.
   Leaving them standing tests production reality and over-determines compliance.
   Naming when each is right is the core of the design.
3. **How the four answers extend.** "In the state, and the failure appeared" has no
   entry for a rep that correctly obeyed the rule being replaced. A fifth answer, or a
   re-cut of the four. The did-not-reproduce branch inverts too, and a later probe in
   the same session put it crisply: that branch says to ask what produced the compliance
   and to cut the draft when something already in the kit forces the result, but on a
   rule change **the thing already forcing the result is the rule being replaced**. Read
   literally it concludes every replacement is redundant, which is the same vacuity
   arriving from the other end.
4. **What a correction owes versus what a narrowing owes.** The counter-case section
   already handles a rule contradicted by observation and asks only for a recorded
   instance. Where that section ends and this one begins is currently unmarked, and a
   change can plausibly claim either.
5. **Whether this collapses into the counter-case section instead.** The cheapest good
   outcome is that most rule changes are counter-cases and route there, leaving this
   as a pointer rather than a new procedure. Test that before building anything.

## What it must not become

A third admission path. The kit already has the normal bar and the borrowed-evidence
gate, and the gate exists because a cheap path gets taken. Anything designed here has
to be at least as expensive as the normal bar for the same claim, or it becomes the
route around both.

## Related

- `docs/backlog.md`, the open-instances item, for how unvalidated wording is tracked.
- Commit `c13a9ca` (the `pr-review` marker scoping) as the worked example, and
  `cae8024` for the shared-state leak findings from the same probes.
