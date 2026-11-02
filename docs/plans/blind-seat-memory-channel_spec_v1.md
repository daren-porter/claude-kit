# A Blind Seat Inherits Project Memory Its Dispatch Never Gave It

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-11-02

## Related

- `plans/report-file-protocol_spec_v1.md` - the other blind-seat leak route on record, a report
  path that names the section and the round. That stub bounds a path the orchestrator chooses;
  this one is a channel no dispatch text controls.
- `plans/prose-claim-review_spec_v1.md` - its 2026-09-04 design council found the harness injects
  the root session's scratchpad into every subagent unconditionally. This is a second
  harness-side channel of the same kind, and that council's placement criterion is the nearest
  precedent for a remedy.
- `plans/kit-concurrent-sessions_spec_v1.md` - its third finding, a second session's uncommitted
  files priming the first session's reviewers, is the working-tree version of this channel.

## Why this exists

Promoted 2026-11-02 from one inbox note (2026-10-09, Platform Science, PR 458): "pr-review blind
dispatch on a re-review is contaminated through the project auto-memory channel: a project memory
written earlier in the same effort (an out-of-repo caller tied to a posted finding) loads into the
blind-reviewer because its cwd is the repo, and pr-review's blind contract only polices the
dispatch text."

Every blind contract in the kit is a rule about what the dispatch may say:
`agents/blind-reviewer.md:12` takes a base ref or file list plus build and test commands and
nothing else, `pr-review:31` keeps digests out of the directory the blind pass reads, and
`executing-work:81` withholds the spec. This incident is the first recorded case of intent
reaching a blind seat through a channel the orchestrator never wrote into any dispatch.

It is promoted rather than briefed for two reasons. It reaches every blind seat in the kit, not
only `pr-review`'s: `blind-reviewer` under `executing-work` and `finishing-work`, and
`blind-reader`. And the remedy depends on harness behavior nobody here has measured.

## What is not established

- Which memory stores load into a dispatched subagent, and what decides it. The note attributes
  the load to the subagent's cwd being the repo; this pass did not verify that.
- Whether dispatching the blind seat from a directory outside the repo closes the channel.
  `pr-review` already has a no-clone path that materializes sources into a scratchpad `code/`
  directory (`:29-31`), but if memory follows the root session rather than the subagent's cwd,
  that changes nothing.
- Whether the kit's cross-project tier, delivered by a SessionStart hook, reaches subagents too.

## What a design pass has to settle

1. **Measure the channel first**, one store at a time, before choosing a remedy. The remedy
   space is different for each answer.
2. **Which remedy**: the blind seat's working directory; a discipline on what a review effort may
   write to project memory before its last blind dispatch; or a charter line telling a blind seat
   to disregard loaded memory, which is the weakest, since it asks the seat to un-read something.
3. **Whether `executing-work`'s blind seats share the exposure in practice.** A project memory
   recording a finding or an intent is rarer mid-effort there than on a re-review, where the
   first review's findings are exactly what gets banked.
