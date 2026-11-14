# A PR Review That Remembers Its Earlier Rounds

Status: Complete
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
of path components, the precedent at `docs/security-model.md:370`. The store root is kept
owner-only (0700), matching the memory tier, because records hold client code excerpts.
*Amended in execution (S1 review):* the org is the bare name lowercased, with the org and id
checked against `[a-z0-9-]` and digits before the path is built, since the org also comes from
outside and arrives in several URL shapes. The root is re-tightened with `chmod 700` before every
write, because `mkdir -m` never tightens a directory a tool already created.

**What the record holds, and what it never holds.** ADO stays the source of truth for thread
status and the vote, re-gathered on every run, and wins any disagreement. The record holds only
what ADO lacks:

- A header: org, project, repo, PR id, title, author, target branch, created and last updated.
- Standing context: rulings and agreements that hold for the rest of the PR ("don't raise X",
  "AC 3 was consciously deferred, per Y"), with the user's reasons. Updated in place when a
  ruling changes.
- Rounds, append-only, one entry per round. Each entry holds:
  - the date
  - the source and target shas reviewed, and the scope (full diff, or delta from which sha)
  - the reviewers dispatched, or that the round was verified inline and why
  - AC coverage
  - every surviving finding: file:line at the reviewed sha, category, provenance verdict,
    rationale, the anchor span and exact text if it was approved to post, and the outcome
    (posted as thread N, edited at the gate, or vetoed with the user's reason)
  - the dropped and demoted findings with their file:line and reasons
  - notes left unpromoted, in full
  - on a re-review, the disposition of each existing thread and the exact text of any reply
  - the vote proposed and the vote cast
  - a status line

*Amended in execution (S1 review):* this spec first said posted comments are referenced by thread
id and never copied. Both reviewers showed that cannot work. The first write happens before
anything posts, so the approved text has to be in it, or a session that dies mid-post leaves the
settle step nothing to re-present. So an approved comment keeps its anchor and exact text and
gains its thread id once posted. The duplicate of ADO's copy is harmless. The session id was
dropped: no harness surface names it reliably, and an agent asked for one would invent it.

**Two write points per round.** Right after the user's go-ahead at the gate, before any write to
the PR, the status is `approved, posting unconfirmed`, or `held, nothing posted` when the user
ends the gate without posting. After posting, thread ids and the vote cast are filled in and the
status becomes `posted`, or `partly posted` naming what did not.

**Main thread only.** The record never goes into any reviewer's dispatch: not pr-reviewer's,
because handing it the dropped list tells it what to ignore and breaks "never pre-judge" (`:38`);
and not the blind pass's, whose contract already bars an earlier round's findings (`:41`). It is
never a substitute for presenting the gate in the terminal. `:83` ("A saved copy is not the
presentation") already names the pull to file a report and point at it, and a mandated record
file strengthens that pull. So the wording has to leave `:83` intact and say outright that the
record is written in addition to the full gate. Round state goes to the record and never to
project auto-memory, which reached a blind seat on PR 458. A ref from the record (the delta's
base sha) may scope a dispatch; no finding, ruling, rationale or drop may.

**How a re-review uses it.**

- **Detection.** A re-review is detected from the record or from the user's prior thread or vote
  (`:23`). A round that posted nothing is invisible to ADO, and only the record shows it.
- **Unsettled rounds first.** When the last round reads anything but `posted`, it is checked
  against the live threads and reviewer votes before anything else. What did post gets its
  thread ids recorded and the status updated to match. What did not goes back to the gate,
  re-verified at this round's head, because nothing posts on a dead session's approval.
  *Amended in execution (S1 review, a Critical from both reviewers):* this first covered only
  `approved, posting unconfirmed`. A `held, nothing posted` round then let the next run review
  only the delta past the held sha, so a held blocker never came back, and the gate could
  propose Approve over it. A held round's surviving findings now come back the same way.
- **The delta** runs from the last round's recorded source sha to this round's `<source-sha>`.
  This replaces the date-against-`git log` heuristic at `:123`. When the recorded sha is not an
  ancestor of the head (a force-push or rebase), or there is no clone to check it in, review the
  full diff, as `:123` already says to do when the point is ambiguous. *Amended in execution
  (S1 review):* this first resolved the head with `git ls-remote` here alone, while Materialize
  still diffed `lastMergeSourceCommit`, so a round could record a head nobody reviewed. The fix
  is in Materialize: `<source-sha>` is the fetched head of `origin/<source-branch>`, never
  `lastMergeSourceCommit` (measured lagging on PR 415, 2026-08-30, in the
  `ado-pr-source-commit-stale` memory record). The diff, the anchors and the recorded sha then
  agree. This is a correction of a wrong premise and owes no arm. It closes only the materialize
  half of `pr-review-batch.md` item 1. Re-resolving the head before posting stays there.
- **The filter's dedup** (`:52`) also checks prior rulings, vetoes, drops and demotions, and
  gives a re-raised finding the same disposition again unless the new code changed its facts.
  Each repeat appears at the gate as one line, so a finding whose facts did change cannot
  vanish silently. *Amended in execution (S1 review):* vetoes and demotions were added, since a
  veto is stored as a finding's outcome and matched neither "ruling" nor "drop".
- **Thread dispositions** draw on the recorded rationale for each thread.

*Amended in execution (S1 review round 2):*
- Settling brings back only what was approved and did not post, plus a held round's findings
  the user did not veto, matched on anchor and substance. Each carried item gets its anchor
  recomputed at the head and joins this round's findings: the dedup, gate item 3, item 4's row,
  and this round's entry. That last part stops a second hold from losing it.
- Held drafts keep their text as the gate left them.
- `<target-sha>` also comes from the fetched branch, since `lastMergeTargetCommit` belongs to
  the same lagging preview. The blind reviewer reproduced merged-in target code entering the
  diff when the two shas were taken at different times.
- A changed target branch or merge base sends the re-review to the full diff, since a retarget
  or a merge from the target passes the ancestor check while making the source-only delta wrong.

**Pruning on observed terminal state, never on a vote.** The user wanted records to be ephemeral
and asked whether a clean final approve should prune. It should not. An approve is not the end
of a PR: another reviewer can still block and the author push again, and where policy resets or
re-requires votes on a push, a later push puts the user back into re-review, which is exactly
when the record is needed. Pruning too early loses the reasoning when it may still matter, and
pruning late costs a few days of a small local file. So a record is deleted when ADO shows its
PR completed, or abandoned for more than 30 days, checked in two places:

1. When the PR being reviewed is already completed or abandoned, the report-and-stop path (`:25`,
   `:133`) prunes its record by the same rule as part of stopping.
2. A sweep on every pr-review run, the no-argument listing included: one status lookup per
   record on disk, deleting those that qualify, and reported in one line. A record whose PR
   cannot be looked up (lost access, deleted repo) is listed in that line and kept, never deleted
   on a guess.

*Amended in execution (S1 review):* this spec first counted an abandoned PR as terminal. ADO can
reactivate an abandoned PR, and the sweep runs on unrelated runs, so one run during the abandoned
window would delete the rulings a reactivated review needs. The same asymmetry that rules out
pruning on a vote applies, so an abandoned PR's record gets 30 days. Completed is final. The
user approved "completed or abandoned" in the sketch; this narrows it in the direction their own
"ephemeral, but not lost while still needed" reasoning points, and is flagged in the close-out.
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

*Amended in execution (S2 review):*
- Both reviewers found that the refresh, as first drafted, fired on a standing Wait for author:
  a -5 voter is never in `lastIterationApprovers`, and resetting one would lift its block
  between the two writes. The refresh now applies only to an approving standing vote matching the
  row, and only where the policy has `requireVoteOnLastIteration` set. The record measured that
  flag with `requireVoteOnEachIteration` also set and `resetOnSourcePush` off; a policy with only
  the each-iteration flag is unmeasured, and the rule proposes no refresh there.
- The command carries `--organization`. Item 4 proposes and names both writes, warns that the
  cast can complete the PR unless another policy is known to block it, and the evaluation is
  re-read a few seconds after casting.
- The dispatch sentence first called all of Dispatch's rules first-review-only, which would
  have released the bar on build and test commands for a blind pass, never pre-judging, and the
  security trigger. It now names only the selection rules. A round-1 suggestion to force the full
  dispatch on every full-diff fallback was applied, then reverted: a routine merge from the
  target triggers that fallback, so it would fire the full dispatch on a four-line author change.
  That is notes 2 and 3 again, against the user's ruling that the delta's content decides.

*Amended in execution (final review):*
- The dispatch sentence kept security-reviewer's trigger "as written" on a re-review. On note
  3's own case, a config delta, every RED rep read that trigger as firing. On a re-review it is
  now weighed by whether the change alters how a trigger surface behaves, not by the kind of
  file the change sits in.
- Under the full-diff fallback, the thing sized is the full diff. It narrows only by comparing
  the three-dot diffs across rounds, never by the author's latest commit, since a merge can
  carry edits no commit of theirs shows.
- The Re-review section is split into ordered paragraphs: settle, threads and delta, reviewers,
  gate items, vote. The vote refresh reads every minimum-reviewers entry carrying the flag, and
  records both writes and the re-read.
- The prune sweep takes each PR's status from the record's path alone and opens no other
  review's record.

## Sections of Work

### 1. The review record in `pr-review/SKILL.md` (complete, Chapter 1)

The store, the record's contents, the two write points, the re-review reads, the filter's dedup
against prior rulings, and pruning, all as stated in Approach. The delta-location sentence at
`:123` is replaced here, because its replacement is the record's recorded sha.

Acceptance:
- The skill names the store as `~/.claude-kit-reviews/<org>/pr-<id>.md`, keyed by the lowercased
  org name and the numeric PR id only, both checked before the path is built, with the root
  re-tightened to owner-only before every write.
- The record's contents match Approach. An approved comment keeps its anchor and exact text and
  gains its thread id, and unposted text is kept in full.
- Both write points are stated with their status values, the first before any write to the PR.
- `<source-sha>` in Materialize is the fetched branch head, never `lastMergeSourceCommit`, with
  the PR 415 provenance stated.
- The record is stated as main-thread only, excluded from every reviewer dispatch, and written in
  addition to the full terminal gate. `:83` is unweakened, and a paired reviewer reading both
  passages finds no reading under which the record carries the gate.
- ADO is stated as authoritative on conflict, and round state is routed to the record, never to
  project auto-memory.
- Re-review detection, the settling of any last round not `posted` (a held round included), the
  recorded-sha delta with its full-diff fallback, the visible dedup (rulings, vetoes, drops and
  demotions), and record-informed dispositions are each stated.
- Pruning is stated for both trigger points. An unresolvable record is reported and kept, an
  abandoned PR's record waits 30 days, and nothing prunes on a vote.
- Evidence: the capability was specified by the user in their own words (note 1 and the
  2026-11-14 brainstorm), so no RED is owed, and the current skill has no record step to fail.
  GREEN is owed, every rep of at least three, wording in-prompt, on isomorph fixtures carrying no
  identifier this disk answers. The reps must cover (a) the write, after a gate with rulings and
  a simulated post, and (b) a re-review from an existing record that holds a vetoed finding a
  reviewer re-raises with unchanged facts, a second one re-raised with changed facts, an
  `approved, posting unconfirmed` round, and a stale record for a completed PR. Fixture writes to
  the real store use a fixture org name and are removed after the arm. Wording revised after the
  paired review owes a fresh REFACTOR arm on what it changed: at least a held last round whose
  blocker survives an unrelated delta, followed through a go-ahead.
- Paired review before commit, Criticals resolved, and the findings recorded in the Chapter.

Execution mode: main.

Tests: none durable. The kit suite covers hooks and tools, never prose, and this section adds no
code. The GREEN arms are the verification.

### 2. Re-review corrections in `pr-review/SKILL.md` (complete, Chapter 2)

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

### 3. Docs: the new store, its security posture, and the egress claim (complete, Chapter 3)

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

*Amended in execution:* the docs shipped the amended rules, not the bullets above as first
written. Abandoned records wait 30 days past `closedDate`, and the root is re-tightened before
every write. The native store's ordinal is "ninth", since it was already off by one before this
effort. The egress section is scoped to destinations outside the project's own systems (Chapter
3). The root README's uninstall checklist also lists the store.

Execution mode: delegate-capable.

## Out of Scope

- Resuming a round that died mid-pipeline (ruled out by the user, 2026-11-14).
- The Post/gate batch brief (`pr-review-batch.md`).
- Measuring or closing the auto-memory channel into blind seats (`plans/blind-seat-memory-channel_spec_v1.md`).
- Amending `cross-project-memory`'s routing test or the global CLAUDE.md's "memory is three
  destinations". pr-review's own clause carries the routing for round state.
- Which changes count as the PR's own when the source branch merges the target in. `:123`'s
  existing scope language is kept as written. (Narrowed in execution: such a round now falls
  back to the full diff instead of taking a source-only delta, which avoids the question rather
  than answering it.)
- Any change to `agents/pr-reviewer.md` or `agents/blind-reviewer.md`. The record is never in
  their inputs.

## Open Questions

None at creation.

## Chapters

### Chapter 1 - 2026-11-14
Completed: 1. The review record in `pr-review/SKILL.md`
Implemented By: main session
Metrics: 3 review rounds (rounds 1 and 2 paired, adversarial + blind; round 3 an adversarial verification read of the round-2 fixes); NEEDS_CONTEXT 0; escalations 0; advisor on, consulted once before the brainstorm's opening position; arms: 9 reps, all through `tools/arm-harness.js`, serial where they shared the real store
Decisions / Surprises:
- **Arms.** No RED owed: the user specified the capability in their own words, and the shipped skill had no record step to fail.
  - GREEN (a), the write: 3/3. Each rep created the root 0700 and keyed the record by org and PR id. The record's birth time preceded `post-calls.md`'s (8s, 6s and 8s), and its status went from `approved, posting unconfirmed` to `posted`. The standing ruling was kept with the user's reason, and the dropped findings and the unpromoted note were kept in full.
  - GREEN (b), the read: 3/3. Each rep settled the unconfirmed round 2 first: the 4410 reply posted, while the 4411 reply, S3 and the vote did not, and those came back for re-approval. Each ran the delta from the recorded sha after an ancestor check, dropped the re-raised divisor and retry-constant findings in one visible line each, re-checked D1 because its facts had changed instead of dropping it on the old reason, kept every record field out of the dispatches, and deleted the completed PR's record while keeping the live one.
  - REFACTOR on the round-1 revisions: 3/3. Each rep brought the held round's blocker back re-verified at the head, proposed Wait for author over the delta-only reviewer's advisory Approve, and matched the re-raised divisor to the round-1 veto. Each lowercased `Tarnwick` to find the record, re-tightened the root from 0775 to 0700, and wrote the round's anchor and exact text before the post call.
- **The round-2 fixes went in without a further arm**, on the review evidence alone. The REFACTOR reps had already done what the clarified text now says: no rep re-presented the veto, all voted -5 over the carried blocker, all recomputed the anchor at the head, and all wrote the carried blocker into round 2's entry. The fixes close literal-reading gaps that capable reps survived, plus two corrections of wrong premises (the target sha, the merge-base fallback).
- **A real-world finding from rep (b)3.** The auto-mode permission classifier denied the prune's `rm` as destructive. The rep surfaced it at the gate as a pending ask. No clause was added, since the rep did the right thing unprompted.
- **A fixture defect the reps caught.** The stubbed pr-reviewer claimed `GetService` returns null. Two reps proved with a throwaway .NET repro that the host registers `IOptions<>` by default, so the real bug is a silent zero cap. Grading was unaffected: what it measured was the D1 re-check.
- **Two reps independently wrote "partially posted"** for a settled round. That became `partly posted` in the wording.
- **Channels open in the arms.** The harness closed auto-memory and the skill listing. Still open:
  - The filesystem. The write reps went looking for a clone and read the scratchpad fixture repo, which held no wording and no grading.
  - The global CLAUDE.md and the org instructions.
  - The real `devops-connector-capabilities` memory record, which the skill tells a session to read.
- **Deviations from the spec**, each marked "Amended in execution" in Approach:
  - an approved comment keeps its text (dropping "never copied")
  - session id dropped
  - every round not `posted` is settled, held rounds included, with carried items joining the new round
  - head resolution moved to Materialize, using the fetched heads for both shas
  - a full-diff fallback on a retarget or a moved merge base
  - abandoned records wait 30 days past `closedDate`
  - org normalization, and `chmod 700` before every write
- **The materialize half of `pr-review-batch.md` item 1 is now done.** Re-resolving the head right before posting stays with that brief.
- **Side effects on the machine.** `~/.claude-kit-reviews` was created and removed around every rep and is absent now. Two rep-written kaizen notes were removed, both from read reps. The section 2 arms wrote none. The .NET repros left VBCSCompiler server processes, `/tmp/dotnet-diagnostic-*` sockets and `/tmp/MSBuildTemp*` directories.
Review Findings:
- **Round 1: both reviewers CHANGES_REQUIRED.**
  - Critical, fixed: a held round lost its findings, and the gate could propose Approve over a held blocker.
  - Majors, fixed:
    - vetoes and demotions were invisible to the dedup
    - no file:line, anchor or approved text in the record, so the settle step had nothing to re-present
    - the head resolved in one place while the diff used another
    - pruning on abandoned
    - the root mode held only if mkdir ran first
    - `<org>` was unnormalized
  - Moot: the ls-remote prefix doubling went away with the head fix.
  - Minors, fixed: the status lifecycle, the ref exemption from the dispatch bar, the unverified auto-memory mechanism, the sweep pointer, the session id, "that memory record", and the failure-mode lines.
  - Minors, accepted:
    - concurrent sessions on one PR, which is `plans/kit-concurrent-sessions_spec_v1.md`'s question
    - a session dying at an unanswered gate writes nothing; under the across-rounds ruling, a dead gate is a rerun
- **Round 2: both CHANGES_REQUIRED, no Criticals.**
  - Majors, fixed:
    - settling brought vetoes back
    - carried items missed the vote row, their anchors, this round's entry and a second hold
    - held drafts lost their text
    - the source and target shas came from different times (reproduced by the blind seat)
    - a source-only delta was wrong after a merge from the target or a retarget (reproduced)
  - Minors, fixed: the write-path-down status, the dispatch exclusion as a closed list, the 30-day clock, standing context at the write point, the ref-name form, the dedup over carried items, and the "stop" ambiguity.
  - Minors, accepted:
    - the no-clone head and the head re-check before posting (both `pr-review-batch.md` item 1)
    - unresolvable records named on every run
    - a reset vote recorded as not cast (re-casting is needed then anyway)
    - ADO Server collection names
    - single-branch clones whose refspec leaves `origin/<branch>` unwritten
    - "verified inline", which section 2 defines
- **Round 3: APPROVED_WITH_CONCERNS.**
  - Fixed: the fallback's wording (the target branch's name, not its moving head) and the promoted-note outcome.
  - Accepted: the no-clone sha pairing (same reasoning as above) and the gate-count wording at `:141`, which section 2 rewrites.
Next: 2. Re-review corrections in `pr-review/SKILL.md`
Commit Model: Commit-and-Push

### Chapter 2 - 2026-11-14
Completed: 2. Re-review corrections in `pr-review/SKILL.md`
Implemented By: main session
Metrics: 2 review rounds (round 1 paired, adversarial + blind; round 2 an adversarial verification read); NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted this section; arms: 12 reps through `tools/arm-harness.js` (3 RED serial, then 9 GREEN-side three at a time)
Decisions / Surprises:
- **RED for the dispatch change: 3/3, run before any draft existed on disk.** On an 11-line, 4-file config delta under standup time pressure, every rep dispatched pr-reviewer, blind-reviewer and security-reviewer, and held the gate for them.
  - Rep 1: "The file count meets the letter, even though three of the four files are one-line JSON edits. I followed the letter."
  - Rep 2: "I followed the letter of the rule even though the change is trivial."
  - Rep 3: "The skill doesn't say whether the threshold applies to the delta or the full PR on a re-review."
  - No inbox writes.
- **GREEN, dispatch: 3/3.** Each rep verified the same delta inline from its content and said so with the reason in gate item 1.
- **Narrowing arm, a first review of a small PR with the draft in place: 3/3.** Each rep still dispatched pr-reviewer ("always runs") and skipped blind on the size bar.
- **GREEN, vote: 3/3**, in a stale-approval state under a last-iteration policy with auto-complete set. Each rep proposed NoVote then Approve, read `lastIterationApprovers` rather than the status, and told the user the approve would complete the PR. All three flagged that the meaning of an empty `context` was underdetermined. The PR 468 measurement answers it (the context stayed `{}` until a vote counted), so "an empty `context` names nobody" was added as a premise fact, owing no arm.
- **Premise-correction proof for the vote rule.** `:125` arrived in `750d8df` (2026-08-15), whose message records that its re-review gate rules came from "probe reps against synthetic fixtures", with no live ADO measurement. The measurement that corrects it is the `ado-same-value-revote-noop` memory record (PR 468 and PR 628, 2026-11-09).
- **The arms ran against section 1's first draft** plus section 2's draft. Section 1's later revisions touched the same paragraph's settle and delta sentences, not the dispatch or vote text, so the results stand on the wording they tested.
- **The review fixes went in without a further arm.** Each narrows the rule, and the GREEN states remain inside the narrowed rules with unchanged outcomes:
  - The refresh now applies only to an approving standing vote under a last-iteration policy, which is the vote GREEN's state.
  - The dispatch sentence now releases only the selection rules, and the dispatch GREEN's reps verified inline either way.
  - The added confirm-after-cast and the fail-safe auto-complete warning are the only new directives. Both act after the measured decision and do not change it.
- **Correction to Chapter 1.** As first committed in `8a8316a`, Chapter 1 said the section 2 arms left a kaizen note. Their inbox diff was 0 bytes; the note-writing reps were both in section 1's read arm. Chapter 1 now says so.
Review Findings:
- **Round 1: both reviewers CHANGES_REQUIRED.**
  - Critical (both), fixed: the refresh fired on a standing Wait for author, which is never in `lastIterationApprovers`. That meant two pointless writes, and a NoVote that could lift the block under auto-complete.
  - Critical (adversarial), fixed: "the Dispatch rules above are written for a first review" released the bar on build and test commands for a blind pass, plus never-pre-judge and the security trigger.
  - Major (both), fixed: the refresh assumed every minimum-reviewers configuration behaves like the measured one. It is now gated on `requireVoteOnLastIteration`.
  - Major (blind), fixed: the `az devops invoke` call lacked `--organization`, reproduced failing.
  - Major (blind), fixed: nothing confirmed the re-cast landed.
  - Minors, fixed: completion claimed for rows that cannot complete, NoVote missing from the Vote bullet's values, the inline "why" in item 1, the reset phrased as an action rather than a proposal, and `<projectId>`'s source.
  - Minors, deferred:
    - threads posted before the vote (`pr-review-batch.md` item 3)
    - a pre-post re-check of the vote (the same brief's item 1 family)
    - the settle step reading a refresh vote from the payload, which is harmless because the next round's item 4 re-derives the vote from the evaluation
- **Round 2 (adversarial verification): APPROVED_WITH_CONCERNS.** Every Critical and Major resolved.
  - Minors, fixed:
    - the policy setting is read from the evaluation record's `configuration`
    - the refresh requires the standing approval to match the row
    - the re-read waits a few seconds
    - the auto-complete warning is fail-safe
    - the spec amendment names the full measured configuration
  - Reverted: the round-1 clause forcing the full first-review dispatch on every full-diff fallback. A routine merge from the target triggers that fallback, so it would have fired the full dispatch on four-line author changes, against the user's ruling that the delta's content decides.
  - Accepted: a policy with only `requireVoteOnEachIteration` set is unmeasured, and the rule proposes no refresh there.
Next: 3. Docs: the new store, its security posture, and the egress claim
Commit Model: Commit-and-Push

### Chapter 3 - 2026-11-14
Completed: 3. Docs: the new store, its security posture, and the egress claim
Implemented By: main session (`docs/` writes are main-thread only)
Metrics: 1 review round, adversarial alone (the section is docs-only, so a blind seat has no diff to read); NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted this section
Decisions / Surprises:
- **Drafted during section 1's arm window, then parked.** The edits were stashed during sections 1 and 2's blind reviews, so their hunks could not reach those seats. They were unparked after section 2 landed, then corrected to what section 1 shipped: the 30-day abandoned rule, `chmod 700` before every write, the org check.
- **A second exclusivity claim was false too.** `security-model.md` called the visual companion's screens "the only kit surface whose contents can be project-confidential". That now just says the screens can be.
- **The egress claim was false before pr-review existed.** "The only place any kit skill moves project content off the machine" was already contradicted by the commit models' pushes and by `finishing-work`'s PRs. The section is now scoped to destinations outside the project's own systems. One path counts, the visual companion's Artifact. The write-backs to the project's own systems are named as not counted, pr-review's posting among them, each with its gate.
- **Beyond the spec's file list:** the root README's uninstall checklist, and the docs index's descriptions of `architecture.md` and `security-model.md`.
Review Findings:
- **Round 1: CHANGES_REQUIRED.**
  - Majors, fixed:
    - `architecture.md`'s summary still counted one egress path
    - the native store's ordinal is "ninth" (off by one since `ae21f31`, carried forward by every count change since)
    - "Two paths" was still a false closed count
    - the uninstall checklist omitted the new store
  - Minors, fixed:
    - "data, never instruction" stated as a mechanism, and naming the wrong author-originated text
    - retention presented as bounded, when unresolvable or unreached records stay and a classifier can refuse the `rm`
    - "copied byte for byte" for suggestion bodies, which are derived from the file
    - secrets at rest, since a record can quote a committed credential
    - "holds project content" read as exclusive
    - pr-review's instruction-only controls added to "Its own instructions being ignored"
    - "30 days ago"
  - Minors, deferred: the plan's own index entry (still the pre-amendment prune rule) waits for the close flip.
  - Minors, declined: adding the records to `architecture.md`'s data-flow writing paragraph. It is an open list, and the state table and the home-rooted paragraph already name the writer.
- No second round. The finishing pass's Fable adversarial review reads this section with the rest of the changeset.
Next: finishing-work
Commit Model: Commit-and-Push

### Chapter 4 - 2026-11-14 (close-out evidence: REFACTOR on the shipped wording)
Completed: the evidence section 1's criterion requires for wording revised after its paired review
Implemented By: main session
Metrics: one arm, 3 reps, serial through `tools/arm-harness.js`; review rounds 0 (this Chapter changes no corpus text); advisor on, not consulted
Decisions / Surprises:
- **Why this arm exists.** QA failed section 1's evidence bullet ("Wording revised after the paired review owes a fresh REFACTOR arm on what it changed"). Chapter 1 recorded the round-2 and round-3 revisions as shipped on review evidence alone. QA was right that the criterion as written does not allow that, so the arm ran rather than the criterion being argued.
- **The arm.** It ran on `pr-review/SKILL.md` exactly as committed in `2f121f6`, handed to each rep as a fixture copy. The held round 1 holds three findings:
  - an unvetoed blocker B1, with the user's edited draft text and anchor `14:9-14:77`
  - a vetoed suggestion S2
  - a note N2 the user promoted, with anchor `15:25-15:53`

  The new delta adds a header comment that shifts `RateCalculator.cs` down a line, plus a test rename. The org arrives as `Tarnwick` in the URL, and the store root starts at 0775.
- **Result: 3/3.** Every rep:
  - carried B1 and N2 and left S2 out
  - recomputed the anchors to `15:9-15:77` and `16:25-16:53`
  - posted B1's edited text byte for byte
  - posted B1 Active and N2 Closed and voted Wait for author
  - wrote round 2 as `approved, posting unconfirmed` before the post calls, then set it `posted`

  One rep had dispatched pr-reviewer, which re-raised the divisor at its shifted line, and that rep matched it to the round-1 veto in one line. The other two verified the five-line delta inline. That is section 2's dispatch judgment working, and it left them no re-raise to match. No inbox writes.
- **Not armed, by design.** The `<target-sha>` move and the merge-base fallback correct premises about ADO's merge preview and about git ranges, and the blind seat reproduced both failures in a scratch repo. They owe measurement, not arms, by `writing-skills`' "What this costs".
- **Recording gaps QA named, closed here.**
  - Every GREEN and REFACTOR arm in this effort supplied the wording as a fixture copy of the skill in the rep's own directory, never through the installed plugin. That is the arm harness's in-prompt equivalent, so no rep read the repo's copy.
  - The fixtures used identifiers checked absent from this disk before use (`tarnwick`, `Cartage`, `rate-engine`, `Whitcombe`, `Lindqvist`, `Ashworth`, `FuelSurchargeCap`). The only hits were this session's own transcript.
  - Close-out step 7 also banked one record in the cross-project memory tier: `dotnet-ioptions-unbound-default`, from the two reps' .NET repro.
Review Findings: none; no corpus text changed.
Next: finishing-work steps 1 (re-check) and 3
Commit Model: Commit-and-Push

### Chapter 5 - 2026-11-14 (close-out)
Completed: finishing-work
Implemented By: main session; QA by `qa-verifier`; the final review by `adversarial-reviewer` on the `fable` override
Metrics:
- QA: FAIL then PASS on re-check (one criterion, closed by Chapter 4's arm)
- final adversarial review on Fable: CHANGES_REQUIRED, then CHANGES_REQUIRED on its verification read, with the three items it named fixed or armed after that read (below)
- arms at close: 4 more 3-rep arms on the final wording
- security-reviewer: skipped (all-prose changeset; the final adversarial pass was the security read)
- document battery: skipped (no section carries an `Audience:` line)
- docs-curator: skipped (the deliverable is itself documentation, with no code layer beneath it to reconcile)
- Fable spend: the final review ran on `fable` as `Fable Spend: finishing reviews only` authorizes, with the Fable weekly window at 0% against the 85% ratchet
- advisor on, consulted once in the effort
Decisions / Surprises:
- **QA failed the clause this effort wrote for itself:** wording revised after review owes a REFACTOR arm. The arm ran (Chapter 4) rather than the clause being argued down.
- **The final review held section 2 to the same bar and found two real gaps.**
  - Keeping security-reviewer's trigger "as written" still mandated a dispatch on note 3's own config delta, against the user's ruling.
  - The vote fixture's stub carried no `configuration` while the shipped text read the flag from one.
  - Both got fixes and fresh arms on the final text, all 3/3:
    - A1, the RED config-delta state: verified inline, with security weighed by substance
    - A2, a stale approval with `configuration` present: NoVote then Approve, both writes named, completion warned
    - A3, a standing Wait for author over an open blocker: no vote write, no evaluation read
    - A4, the security narrowing's third arm (the state it leaves alone): the same small re-review delta, with one line flipping Production's JWT `RequireHttpsMetadata` to `false`. Every rep still dispatched security-reviewer, because the change "alters how JwtBearer authentication behaves in Production, which is one of its triggers even though the file is JSON"
- **The `:83` check QA marked unverifiable did happen.** Section 1's round-1 adversarial reviewer wrote, of the record against the saved-copy paragraph: "I found no reading under which the record carries the gate." Chapter 1 did not quote it.
- **The memory record naming `FuelSurchargeCap` was banked before Chapter 4's arm ran.** It describes `IOptions<>` defaults, which answers nothing that arm graded, and subagent reps do not receive the memory block.
- **Drift adjudications: none.** The curator did not run, for the reason above. Every deviation from the spec as approved is recorded in Approach as "Amended in execution". The two that change a detail the user approved in the sketch are flagged here for their attention: approved comment text is kept rather than "never copied", and abandoned PRs' records wait 30 days.
- **State changed outside the repo:**
  - the kaizen inbox lost the five notes this effort promoted, and gained one new note (kit-goal with a prose argument)
  - `~/.claude-kaizen/briefs/pr-review-batch.md` gained a block saying which of its items this effort touched
  - the cross-project tier gained `dotnet-ioptions-unbound-default`
  - 36 rep directories under `/tmp` were created and removed
  - `~/.claude-kit-reviews` was created and removed around every rep and is absent
  - two rep-written inbox notes were removed
Review Findings:
- Final review, round 1: no Criticals, four Majors fixed:
  - the security trigger on a re-review
  - section 2's unarmed vote wording
  - the full-diff fallback against delta-sized dispatch
  - the sweep opening other reviews' records
- Minors fixed:
  - refresh writes in the schema, "and why" for dispatched rounds
  - every minimum-reviewers entry, `project=<projectId>`, no refresh when evaluations cannot be read
  - the merge-base wording, the gate-duty list, carried replies
  - a record-write failure mode, edits in place
  - the security-model data/instruction wording and its "stores none of its own" opening
  - delete the records on uninstall
  - the vote refresh as its own paragraph, the Re-review section ordered
  - section 3's bullets amended, `az` named as the only path for two reads
- Declined: a clause telling a session to name a secret by file:line rather than copy it. No observed failure is behind it, which `writing-skills` calls guidance from imagination.
- Deferred to `pr-review-batch.md`: threads ordered before the vote, the pre-post head re-check, no-clone mode's shas, and the vote write dropping an individually required reviewer's flag.
- Verification read on Fable: CHANGES_REQUIRED. All four Majors were resolved in wording, and it named three new items.
  - `git range-diff` skips merge commits, so the narrowing hint failed on the merge case it was written for. The reviewer reproduced this in a scratch repo and the git 2.43 man page says it too. The hint is now the two three-dot diffs compared, a correction of a tool premise owing measurement, which the repro supplies.
  - The security change is a narrowing owing its third arm. A4 above, 3/3.
  - This Chapter.
  - Its Minors fixed:
    - a `notApplicable` minimum-reviewers entry is skipped, an API status value
    - `architecture.md:120`'s closed count dropped
    - the security-model hedge restored
    - a carried reply seeds that thread's reply rather than adding a second one
    - only an un-narrowed full-diff round re-lists AC, and the scope field can say "narrowed"
- No further review round after those fixes. The range-diff wording is the reviewer's own suggested comparison, A4 armed the narrowing, and the rest are one-clause clarifications of points the reviewer itself rated Minor. Not exercised by any rep: the re-read after casting, the evaluations-unreadable clause, and more than one minimum-reviewers entry. The reviewer rated those low risk.
Next: none
Commit Model: Commit-and-Push
