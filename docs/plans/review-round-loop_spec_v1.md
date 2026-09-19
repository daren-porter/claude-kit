# The Review Loop Has No Repair Cycle And No Changeset Freeze

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-07

Two gaps in the same seam, promoted together because they share it: what happens between
dispatching a review round and committing. `executing-work:81-86` says what each reviewer is
handed and that reviewers "run in the same round as everything else, dispatched in the same
message". `:199`'s Chapter template COUNTS rounds (`Metrics: <review rounds; ...>`). Neither
says what a round is for once one returns findings, and nothing anywhere says the changeset
holds still while a round is open. `kaizen:174` adds only that "no corpus commit lands until
its Criticals are resolved", then delegates the rest to `executing-work`.

## Gap 1: the changeset is not frozen, and reviewers keep catching it

Three instances in one session, 2026-09-06 to 2026-09-07, all in this repo, two of them
reported by the reviewer unprompted:

- An adversarial reviewer opened its report: "the file changed under me mid-review: index
  `be1ecaf..b0a6977` at first read, `be1ecaf..553fc0a` now", after a one-sentence edit landed
  while it ran. Its line numbers then cited a state already replaced.
- A later adversarial reviewer opened: "The worktree changed under me mid-review", naming three
  files, and added that the design its intent note described "is **not** what is on disk now".
  Two of its seven CRITICAL findings were against text that no longer existed.
- A third reviewed a template line that had been rewritten before it returned, so its two
  CRITICALs were already discharged and could not be told apart from live ones without
  re-reading the file.

The cost is not just wasted findings. A stale line reference is indistinguishable from a live
one in the report, so the orchestrator has to re-derive every anchor, and the failure mode that
matters is acting on a finding whose subject is gone. In each case the cause was the same and it
is structural rather than careless: two reviewers are dispatched in one message, the first
returns a CRITICAL, and the orchestrator repairs rather than idling while the second still
reads.

## Gap 2: there is no repair cycle, so each pass invents one

Eight rounds ran across three items in that session, every sequencing decision made on judgment
because nothing states one. The questions each time:

- Does a CHANGES_REQUIRED round owe a fresh round, or is resolving the Criticals enough? `kaizen`
  says the latter, which would have let a pass stop at round 1 and ship compliant. Round 2 found
  the mechanism claim in that draft was false, and round 3 found the fix for it was false too.
- Fresh agents or the same ones? Fresh were used throughout, on the reasoning that the blind seat
  must not carry prior findings, but nothing says so for the adversarial seat.
- May the adversarial half be told which round it is? It was, and used the history well, naming
  which of its own prior findings had been addressed. The blind half must not be, per
  `executing-work:81`'s exclusions.
- Where do findings live across rounds when a pass has no Chapter? `kaizen:174` puts them in the
  commit message, which is written once at the end, so intermediate rounds have no home and the
  final message carries a summary of rounds nobody can read.

## What a design has to settle

1. **The freeze.** Whether it is a stated rule (the changeset is frozen from dispatch until every
   reviewer in the round returns), a dispatch-time convention (review a committed ref or a stashed
   snapshot rather than the worktree), or mechanical. Note the cost of the honest version: it
   serializes repair behind the slowest reviewer in the round, which on measured runs was 10 to 21
   minutes.
2. **Whether a fresh round is owed** after a substantive repair, and what makes a repair
   substantive. The evidence above says yes for a changed mechanism claim and probably not for a
   wording fix, but that boundary is exactly what a pass currently guesses.
3. **The round's own record**, for a pass with no Chapter.
4. **Whether any of this is a rule change owing the arms.** Gap 1's fix is a new directive, so it
   does. Gap 2's may be a premise correction: `executing-work` already implies a loop by counting
   rounds, and stating the loop it counts may be scoping rather than adding.

## Related

- `plans/report-file-protocol_spec_v1.md` - the same seam from the other end, and the reason the
  round record has no durable home: reviewer reports are returned as messages, and the harness
  refuses the file write the convention assumed. A worked cost of that, found 2026-09-07:
  `backlog.md`'s `security-model.md` item names "the two blind-reader reports" as its closure
  input, and neither exists on disk.
- `plans/dispatch-determinacy_spec_v1.md` - dispatch-side determinism, where gap 1's fix would
  land if it becomes a dispatch convention rather than a rule.
- `archive/agent-effort-dials_spec_v1.md` - deferred its compensation notch to this seam. Raising a
  reviewer's effort above its frontmatter value at dispatch time has to go through `Workflow`'s
  `agent()`, since the Agent tool has no effort parameter, and a `Workflow` round returns a task id
  and completes asynchronously, which is this plan's dispatch-and-await question.
