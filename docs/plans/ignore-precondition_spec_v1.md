# The Ignore Precondition Is Unspecifiable In Prose And Belongs In Code

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-07

## The friction, which is measured rather than argued

`kit-goal` and the visual companion each carry a prose instruction meaning "make sure this
`.kit/` path is gitignored before you write to it". Between 2026-08-14 and 2026-09-07 that
instruction was written four times and reviewed three times, and **every version had a
reachable hole that only execution found**:

| version | the hole, all reproduced in scratch repos |
|---|---|
| substring check for `.kit/` in `.gitignore` | misses a global ignore, a nested one, and a narrower rule; no `.gitignore` at all |
| port of the companion's local-file idiom | drops the committed root rule, so nothing reaches a clone, while two hooks call `.kit/` gitignored in every repo |
| branched remedy (tracked / otherwise) | two branches cannot reach the promised end state: `git rm --cached` alone with no rule present, and exit 128 routed to a remedy needing a repo |
| linear sequence, directory probe | `git check-ignore -q .kit/` exits 0 while `.kit/goal-state.json` is stageable, given `*` then `!*.json` in a nested file; and the terminal `git rm --cached -r -f` fatals on a diagnosis it never verifies |

The shipped wording states the reliable **detection**, then an ordered remedy in which every
branch was made to terminate and every trap above is guarded. It took four drafts and three
paired rounds to get there, which is the argument: prose can be driven to correctness here only
by executing it, and nothing executes it on the way in. `writing-skills` says the mechanical ones get automated and skills keep the
judgment; this is the mechanical one.

## What is already established, so a cold pick-up need not re-measure it

Probing the two artifacts is reliable in every state constructed so far, where probing the
directory is not:

| repo state | `check-ignore .kit/` | `.kit/goal-state.json` | `.tmp.0` sibling |
|---|---|---|---|
| root rule `.kit/` | 0 | 0 | 0 |
| root rule `.kit/goal-state.json` only | 1 | **0** | **1** |
| nested `.kit/.gitignore` = `*` | 0 | 0 | 0 |
| nested `*` then `!*.json` | **0** | **1** | 0 |

Also verified: `check-ignore` consults the index, so a tracked path reports unignored whatever
rules exist and needs `git rm --cached` (`-r -f` survives a HEAD/index/worktree three-way
divergence where the plain form exits 1, and preserves the working file); appending to a
`.gitignore` with no trailing newline welds the new rule onto the last and destroys both; a
bare `*` prepended into `.kit/.gitignore` preserves negations above it but is defeated by any
negation below; exit 128 is git's generic fatal, returned for a bare repo and for dubious
ownership as well as for no repo at all.

## The intent

`kit-goal.js` already runs at arm time and already validates the plan path and refuses a
closed plan, so the seam exists and needs no new surface. Move the precondition there: probe
the artifacts, and on failure report exactly which path is exposed and why, in the CLI's
one-line result the skill already tells the session to relay. A test file pins each row of the
table above, which is the thing prose could not do.

## Open questions for the design session

1. **Refuse or warn.** Refusing makes goal state safe by construction and makes the arm fail
   in repos that are merely untidy. Warning keeps the arm working and depends on the session
   relaying it.
2. **Whose concern is this.** `.kit/` is the kit's scratch destination for every agent in every
   repo (`docs-write-guard.js:262`, `stop-docs-hygiene.js:100`), so goal state is one artifact
   of many and `kit-goal` is an odd owner. `kit-adoption-pass` is a candidate home for a
   one-time per-repo precondition, which would let both prose instructions shrink to a pointer.
3. **Whether the remedy is automated too**, or stays judgment. Writing to a project's
   `.gitignore` is a change to a tracked file, which the kit elsewhere requires be reported
   rather than performed silently.

## Related

- `archive/backlog-2026-Q3.md` carries the closed item this came out of, with the four
  versions and what each review found.
- `backlog.md` carries the residual that neither prose instruction reaches an already-tracked
  path.
