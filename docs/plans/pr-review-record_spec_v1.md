# A PR Review That Remembers Its Earlier Rounds

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-11-14

## Related

- `archive/pr-review_spec_v1.md` - the capability this builds on. Its re-review design (verify
  the user's unresolved threads, review the delta, one gate for everything) is unchanged in
  shape. What changes is that the delta, the prior rulings and the reasoning behind each thread
  now survive the session that produced them.
- `plans/blind-seat-memory-channel_spec_v1.md` - on a PR 458 re-review, a project memory written
  during the first review reached `blind-reviewer` through the auto-memory channel. One cause is
  that a review had nowhere durable to put round state except project memory. This spec gives
  that state a home outside every channel a subagent inherits, and says round state goes there
  and never to project memory. That removes pr-review's main reason to write there. It does not
  measure or close the channel itself, which stays that stub's question.
- `~/.claude-kaizen/briefs/pr-review-batch.md` - the pending Post/gate batch against the same
  skill. Deliberately not folded: it lands in the Post section and gate, and this effort lands
  in the Re-review section, the filter's dedup and the resolve and gather steps.

## Provenance

Promoted from the kaizen inbox on 2026-11-14 in a pass scoped by the user to the first note
below, with the other four folded in because they land in the same paragraph or the same doc
file this effort edits. Quoted verbatim, since the inbox is cleared and this spec becomes their
durable home.

1. `2026-11-14  pr-review leaves no durable review record: the gate's rationale, provenance
   verdicts, dropped/demoted findings and the user's gate decisions live only in the session
   (scratchpad is /tmp and session-scoped), so the user /resumes old sessions to re-review; a
   fresh session gets only the posted threads and vote  (repo: EleosCore, PR 645)` with the
   continuation `candidate: write a per-PR record (refs reviewed, findings + rationale + thread
   ids, dropped list with reasons, unposted notes, user rulings) to a stable non-/tmp path keyed
   org/repo/PR, read by Re-review when present; main thread only, never handed to
   blind-reviewer`
2. `2026-11-09  pr-review mandates pr-reviewer (and blind-reviewer past 3 files) on every
   re-review pass, even when the PR-authored delta is a verified byte-for-byte revert to the
   target branch plus a 12-line test helper; skipped dispatch and verified inline, disclosed at
   the gate  (repo: EleosCore, PR 630 third pass)`
3. `2026-11-13  pr-review Re-review section is silent on whether the Dispatch rules
   (pr-reviewer always, blind-reviewer on >3 files) apply to the delta; read literally they fire
   two or three agents on an 8-line, 4-file config delta that is fully verifiable inline  (repo:
   EleosCore, PR 643)`
4. `2026-11-09  pr-review re-review vote rule says to re-cast the same value when a push
   invalidated the standing vote; on ADO a same-value re-vote is a no-op (no vote event,
   requireVoteOnLastIteration policy stays queued), so the rule prescribes a write that does
   nothing  (repo: EleosCore PR 468)`
5. `2026-11-02  security-model.md:513 says the visual companion's Artifact path is "the only
   place any kit skill moves project content off the machine", but pr-review posts comment text
   and suggestion bodies copied from PR files to Azure DevOps; arguably false as worded, and
   security-reviewer reads this file first  (repo: claude-kit, surfaced by the docs curator
   closing moq-and-anchor-corrections)`

## Goal

A fresh session can pick up a PR review that runs over several rounds of feedback without the
user resuming the old conversation. It starts with everything earlier rounds decided: which refs
were reviewed, what was found and why, what was dropped and why, what the user ruled at the gate,
and which thread carries which finding. The records are machine-local and clean themselves up
once the PR is completed or abandoned. Riding along: the Re-review section stops mandating a
first-review dispatch on every delta, its vote rule stops prescribing a re-cast that ADO ignores,
and `security-model.md` stops claiming pr-review moves nothing off the machine.

## Approach

**Resume across rounds, not within one.** The user ruled this on 2026-11-14: a session that dies
mid-pipeline is rare, and rerunning its round is cheaper than checkpointing gather, reviewer
outputs and filter state. So the record is written at round boundaries only.

**Where it lives: `~/.claude-kit-reviews/<org>/pr-<id>.md`.** One markdown file per PR, readable
by the user. The location was settled with the user against three alternatives:

- *The reviewed repo's `.kit/`* fails three ways the skill already states. No-clone mode
  (`pr-review/SKILL.md:32`) has no repo to put it in. A PR resolves org-wide (`:14`), so the
  session's cwd need not be the PR's repo, and a record keyed to the cwd goes missing when the
  user starts somewhere else. And `blind-reviewer` reads and greps the clone, so a record there
  sits within reach of the one reviewer the skill keeps away from prior findings (`:41`).
- *Native project auto-memory* is keyed by the cwd, exists once per config profile, loads its
  index into every session, and is the channel that leaked into a blind seat on PR 458. The kit
  also deliberately does not write there (`docs/architecture.md:93`).
- *Inside the cross-project tier* (`~/.claude-kit-memory/pr-reviews/`) is mechanically possible,
  since `listRecords` skips everything that is not a top-level `.md` file
  (`hooks/memory-lib.js:417`). But PR records need the opposite of three of the tier's rules:
  only `memory.js` writes the tier (`architecture.md:85`), nothing in it is removed
  automatically (`docs/cross-project-memory.md:51`, `:65`), and it is laid out for a future git
  sync with client detail deliberately kept out (`:25`, `:158`, `:162`). The sync carve-out
  would hold only if whoever builds sync remembers to exclude the directory, and forgetting
  sends client code to a remote. A sibling store cannot fail that way. The kaizen inbox is the
  precedent: kit memory in spirit, with its own home and its own lifecycle.

**Keyed by org and PR id alone.** ADO PR ids are unique within an organization, which the skill
already relies on when a bare id resolves org-wide (`:14`). The project, repo and title go in
the record's header rather than its path. That keeps strings that come from outside the kit out
of path components, the precedent at `docs/security-model.md:370`. The store root is created
owner-only (0700), matching the memory tier, because records hold client code excerpts.

**What the record holds, and what it never holds.** ADO stays the source of truth for thread
status and the vote, re-gathered on every run, and wins any disagreement. The record holds only
what ADO lacks:

- A header: org, project, repo, PR id, title, author, target branch, created and last updated.
- Standing context: rulings and agreements that hold for the rest of the PR ("don't raise X",
  "AC 3 was consciously deferred, per Y"), with the user's reasons. Updated in place when a
  ruling changes.
- Rounds, append-only, one entry per round. Each entry holds:
  - the date and session id
  - the source and target shas reviewed, and the scope (full diff, or delta from which sha)
  - the reviewers dispatched, or that the round was verified inline and why
  - AC coverage
  - every surviving finding: category, provenance verdict, rationale and outcome (posted as
    thread N, edited at the gate, or vetoed with the user's reason)
  - the dropped and demoted findings with their reasons
  - notes left unpromoted, in full
  - on a re-review, the disposition of each existing thread
  - the vote proposed and the vote cast
  - a status line

Posted comments are referenced by thread id, never copied. Text that never posted is kept in
full, because nowhere else holds it.

**Two write points per round.** Right after the user's go-ahead at the gate, before any write to
the PR, the status is `approved, posting unconfirmed`, or `held, nothing posted` when the user
ends the gate without posting. After posting, thread ids are filled in and the status becomes
`posted`.

**Main thread only.** The record never goes into any reviewer's dispatch: not pr-reviewer's,
because handing it the dropped list tells it what to ignore and breaks "never pre-judge" (`:38`);
and not the blind pass's, whose contract already bars an earlier round's findings (`:41`). It is
never a substitute for presenting the gate in the terminal. `:83` ("A saved copy is not the
presentation") already names the pull to file a report and point at it, and a mandated record
file strengthens that pull. So the wording has to leave `:83` intact and say outright that the
record is written in addition to the full gate. Round state goes to the record and never to
project auto-memory, which loads into blind seats.

**How a re-review uses it.**

- **Detection.** A re-review is detected from the record or from the user's prior thread or vote
  (`:23`). A round that posted nothing is invisible to ADO, and only the record shows it.
- **Unconfirmed posts first.** When the last round reads `approved, posting unconfirmed`, it is
  checked against the live threads and reviewer votes before anything else. What did post gets
  its thread ids recorded. What did not goes back to the gate, because nothing posts on a dead
  session's approval.
- **The delta** runs from the last round's recorded source sha to the current head, resolved
  with `git ls-remote` per the `ado-pr-source-commit-stale` memory record. This replaces the
  date-against-`git log` heuristic at `:123`. When the recorded sha is not an ancestor of the
  head (a force-push or rebase), review the full diff, as `:123` already says to do when the
  point is ambiguous.
- **The filter's dedup** (`:52`) also checks prior rulings and prior drops, and drops a
  re-raised finding unless the new code changed its facts. Each such drop appears at the gate
  as one line, so a finding whose facts did change cannot vanish silently.
- **Thread dispositions** draw on the recorded rationale for each thread.

**Pruning on observed terminal state, never on a vote.** The user wanted records to be ephemeral
and asked whether a clean final approve should prune. It should not. An approve is not the end
of a PR: another reviewer can still block and the author push again, and where policy resets or
re-requires votes on a push, a later push puts the user back into re-review, which is exactly
when the record is needed. Pruning too early loses the reasoning when it may still matter, and
pruning late costs a few days of a small local file. So a record is deleted when ADO shows its
PR completed or abandoned, checked in two places:

1. When the PR being reviewed is already completed or abandoned, the report-and-stop path (`:25`,
   `:133`) deletes its record as part of stopping.
2. A sweep on every pr-review run, the no-argument listing included: one status lookup per
   record on disk, deleting the terminal ones, and reported in one line. A record whose PR
   cannot be looked up (lost access, deleted repo) is listed in that line and kept, never deleted
   on a guess.

An abandoned PR counts as terminal. If it is reactivated, the next review starts a fresh record.
The sweep lives in the skill, not in a SessionStart hook, because a status lookup needs the
connector or `az` over the network, and that does not belong in a hook that runs at every session
start.

**Dispatch on a re-review is judgment, disclosed.** The user ruled against a size threshold on
2026-11-14: in practice the session judges from what the delta contains, sometimes a full
re-review and sometimes an inline check. The defect is that `:40` ("pr-reviewer, always") and
`:41` (blind-reviewer past 3 files or 150 lines) are written for a first review, and nothing
says they stop there. Notes 2 and 3 are two sessions working against that text. So on a
re-review the main thread chooses reviewers from the delta's content, anywhere from inline
verification up to the full first-review dispatch, and the gate says which ran and why. The
record carries that into the next round. First-review dispatch is unchanged, and any blind
dispatch keeps its contamination contract unchanged.

**The vote rule is a premise correction.** `:125` was written in `750d8df` (2026-08-15) from
synthetic probe reps, with no live ADO measurement. It assumes that when a push invalidates the
standing vote, the reviewers payload shows it and re-casting the same value restores it. Both
halves were measured false on EleosCore PR 468 and PR 628 on 2026-11-09, banked as the
`ado-same-value-revote-noop` memory record. Under requireVoteOnLastIteration with no reset on
push, the payload still shows the vote while the policy no longer counts it, and a same-value
re-cast registers nothing. NoVote followed by the re-cast registers, which was tested. Whether
the vote counts is read from the minimum-reviewers evaluation's `context.lastIterationApprovers`,
not from the payload or the evaluation status. With auto-complete set, the re-cast that counts is
also the merge. The corrected rule diagnoses from the evaluation and refreshes with NoVote then
re-cast. That procedure is safe whether or not the policy reset the vote, so the rule does not
need to claim anything about the unmeasured reset-on-push case.

## Sections of Work

### 1. The review record in `pr-review/SKILL.md`

The store, the record's contents, the two write points, the re-review reads, the filter's dedup
against prior rulings, and pruning, all as stated in Approach. The delta-location sentence at
`:123` is replaced here, because its replacement is the record's recorded sha.

Acceptance:
- The skill names the store as `~/.claude-kit-reviews/<org>/pr-<id>.md`, keyed by org and PR id
  only, with the root created owner-only on first write.
- The record's contents match Approach. Posted comments are referenced by thread id, and unposted
  text is kept in full.
- Both write points are stated with their status values, the first before any write to the PR.
- The record is stated as main-thread only, excluded from every reviewer dispatch, and written in
  addition to the full terminal gate. `:83` is unweakened, and a paired reviewer reading both
  passages finds no reading under which the record carries the gate.
- ADO is stated as authoritative on conflict, and round state is routed to the record, never to
  project auto-memory.
- Re-review detection, the unconfirmed-post reconcile, the recorded-sha delta with its full-diff
  fallback, the visible dedup, and record-informed dispositions are each stated.
- Pruning is stated for both trigger points. An unresolvable record is reported and kept, an
  abandoned PR counts as terminal, and nothing prunes on a vote.
- Evidence: the capability was specified by the user in their own words (note 1 and the
  2026-11-14 brainstorm), so no RED is owed, and the current skill has no record step to fail.
  GREEN is owed, every rep of at least three, wording in-prompt, on isomorph fixtures carrying no
  identifier this disk answers. The reps must cover (a) the write, after a gate with rulings and
  a simulated post, and (b) a re-review from an existing record that holds a vetoed finding a
  reviewer re-raises with unchanged facts, a second one re-raised with changed facts, an
  `approved, posting unconfirmed` round, and a stale record for a completed PR. Fixture writes to
  the real store use a fixture org name and are removed after the arm.
- Paired review before commit, Criticals resolved, and the findings recorded in the Chapter.

Execution mode: main.

Tests: none durable. The kit suite covers hooks and tools, never prose, and this section adds no
code. The GREEN arms are the verification.

### 2. Re-review corrections in `pr-review/SKILL.md`

Two changes to the Re-review section, as stated in Approach: dispatch on a re-review delta
becomes the main thread's call from the delta's content, disclosed at the gate; and the vote rule
at `:125` is corrected.

Acceptance:
- **Dispatch.** The Re-review section says the main thread chooses reviewers from the delta's
  content, anywhere from inline verification to the full first-review dispatch, and that the gate
  states which ran and why. The text states no size threshold. First-review dispatch (`:40-42`)
  reads exactly as before for a first review, and the blind contract at `:41` still governs any
  blind dispatch on a re-review.
- **Dispatch evidence.** This is a behavior-claim rule change, so RED is staged in the state
  where the current text bites (a re-review with a small, inline-verifiable delta across more than
  three files), and the rep's reasoning about `:40-41` is read off its transcript. GREEN runs the
  same state with the wording in-prompt, every rep. A third arm runs a first review with the draft
  in place and confirms pr-reviewer is still dispatched, since this is a narrowing. If the local
  RED does not reproduce, the gated path in `writing-skills` ("When a local RED is not available")
  applies, with notes 2 and 3 above as the locators, quoted here verbatim because the inbox is
  cleared.
- **Vote.** The rule reads whether the vote counts from `context.lastIterationApprovers`, refreshes
  a stale vote with NoVote then re-cast, says at the gate when auto-complete makes that re-cast
  the merge, and carries a provenance clause naming PR 468 and PR 628 (2026-11-09). It makes no
  claim about the reset-on-push case beyond the procedure being safe there.
- **Vote evidence.** The premise-correction classification is proven against `:125`'s history
  (`750d8df`, written from synthetic probes) and recorded in the Chapter. The banked measurement
  is the evidence. The gate-disclosure clause is an agent directive, so it gets a GREEN of three
  reps in a re-review state with a stale vote under a last-iteration policy and auto-complete set.
- Paired review before commit, Criticals resolved, and the findings recorded in the Chapter.

Execution mode: main.

Tests: none durable, for the same reason as section 1.

### 3. Docs: the new store, its security posture, and the egress claim

- `docs/architecture.md`: the state table (`:80-89`) gains a row for `~/.claude-kit-reviews/`,
  written by the pr-review main thread and pruned by pr-review when ADO shows the PR completed or
  abandoned. The counts that row changes are corrected: "seven state locations ... five
  home-rooted" at `:78`, and the native store as "a seventh store" at `:93`. The home-rooted
  paragraph at `:95` says why this store is home-rooted (org-wide PR identity, cwd independence,
  no-clone mode) and why it sits outside the memory tier (opposite lifecycle, never synced).
- `docs/security-model.md`:
  - The same-uid store list at `:30` gains the store.
  - The store's confidentiality is stated where the doc discusses what the kit writes: it holds
    client code excerpts and candid review rationale, the root is owner-only at creation, and it
    is machine-local, never synced and never posted.
  - The record is read back by a skill-ordered read, not by a hook, so it gets **no**
    trusted-channel row. That table's counting unit is a hook output field (`:63-80`). The doc
    states that its text, part of which originates with the PR author, is data and never
    instruction.
  - `:513`'s claim that the visual companion's Artifact path is "the only place any kit skill
    moves project content off the machine" is corrected to account for pr-review posting comment
    text and suggestion bodies to Azure DevOps under the user's identity, gated by pr-review's
    gate.
- `docs/README.md`: this spec's index entry, added at creation, flipped at close.

Acceptance: every location above is updated, no count anywhere in either file is left stale by
the new store, and no trusted-channel row is added.

Execution mode: delegate-capable.

## Out of Scope

- Resuming a round that died mid-pipeline (ruled out by the user, 2026-11-14).
- The Post/gate batch brief (`pr-review-batch.md`).
- Measuring or closing the auto-memory channel into blind seats (`plans/blind-seat-memory-channel_spec_v1.md`).
- Amending `cross-project-memory`'s routing test or the global CLAUDE.md's "memory is three
  destinations". pr-review's own clause carries the routing for round state.
- Which changes count as the PR's own when the source branch merges the target in. `:123`'s
  existing scope language is kept as written.
- Any change to `agents/pr-reviewer.md` or `agents/blind-reviewer.md`. The record is never in
  their inputs.

## Open Questions

None at creation.

## Chapters
