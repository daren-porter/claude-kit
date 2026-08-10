---
name: pr-review
description: "Use when Daren asks to review an Azure DevOps pull request: /pr-review <id or URL>, 'review PR 123', a PR link pasted with a review ask, or 'what PRs are waiting on me'. Covers first reviews and re-reviews of teammates' PRs."
---

# PR Review (Azure DevOps)

Review an incoming pull request the way a senior dev would: few findings, each one defensible, none of them pedantry. The pipeline gathers via the DevOps connector, reviews through fresh-context agents, filters hard, and posts nothing until Daren approves the exact output at the gate. Everything posted lands under Daren's identity; once he has vetted it at the gate, it is his comment.

Two rules are absolute: **no write to the PR before the gate**, and **the filter owns precision**. The kit's reviewers are licensed to over-report because an orchestrator adjudicates them; a PR thread has no such filter downstream, the author just reads it.

## Resolve and gather

Input is a PR id or URL. A URL carries org/project/repo; a bare id resolves org-wide with `az repos pr show --id <n> --organization <org-url>` (the connector's get-by-id needs a repositoryId; az does not, and az needs `--organization` explicitly since no default is configured). The org comes from the current repo's ADO remote; when there is none, ask. No argument: list active PRs where Daren is a reviewer (`repo_list_pull_requests_by_repo_or_project` with `i_am_reviewer`, verified live) in the project of the current repo's ADO remote, asking for the project when there is no ADO remote. The scope is deliberately that one project; say so when answering "what PRs are waiting on me".

Gather via the connector, treating errors as retryable once before falling back to az:

- `repo_get_pull_request_by_id` with `includeWorkItemRefs: true`: description, author, refs, `isDraft`, status, reviewers/votes, merge commits.
- `wit_get_work_item` per linked item (fields including `Microsoft.VSTS.Common.AcceptanceCriteria`; PBIs and Bugs carry AC, Tasks rarely do) and `wit_list_work_item_comments` on the AC-bearing item(s). Both return HTML, sometimes enormous; digest, never carry raw.
- `repo_list_pull_request_threads`: filter out system housekeeping by author (`Microsoft.VisualStudio.Services.TFS`) and content (vote, auto-complete, policy, join events), never by a null anchor: human PR-level comments also carry `threadContext: null`. Keep thread ids, file anchors, statuses, and who said what. Any prior thread or vote of Daren's own means this is a re-review.

A PR that is already completed or abandoned gets a status report and a stop; there is nothing to review.

## Materialize locally

Kit agents cannot call MCP tools, so the main thread makes everything reviewable from disk before any dispatch:

- **Local clone exists** (an ADO remote matching the PR's repo): `git fetch origin <source-branch> <target-branch>`, review `git diff <target-sha>...<source-sha>` using the PR's merge commits. No checkout; the working tree stays untouched.
- **No local clone:** pull the changed-file list (`repo_get_pull_request_changes`, `includeDiffs: false`) and file contents at the source ref into the scratchpad; paginated `includeDiffs: true` supplies hunks. changeType is a flags enum (add=1, edit=2, rename=8, delete=16, combining: 10 is renamed-and-edited); mask it, never equality-match. A deleted file has no source-ref content: represent it by its removed hunks and say it was deleted. Provenance needs base-ref content as well: fetch it with `repo_get_file_content` (`version: <target-sha>`, `versionType: Commit`) per file a candidate finding lands in, never for the whole changed-file list, and keep it in a `base/` sibling of `code/` so the blind pass cannot see it. An added file has no base version to fetch. No-clone mode cannot compute a merge base, so `<target-sha>` is the PR's merge target commit and the provenance verdict is weaker for it. Flag the reduced context in the gate report; the reviewers' caller-tracing duties shrink to what was materialized.

Keep the scratchpad split: materialized sources under a `code/` subdirectory that holds nothing else, digests under `digests/`; the blind pass is pointed only at `code/`, because one stray digest beside the sources is the intent story arriving through a side door. Digests to write: PR context (title, description, author, refs, draft status), AC and work-item discussion, human threads, and the path to a committed practices doc when the repo has one (CLAUDE.md, committed style docs). The practice bar is the repo's own docs and conventions; the kit's house-style skills are not a standard for teammates' code.

## Dispatch reviewers

All applicable reviewers are dispatched in one message, in parallel: no sequential dribble, and no reviewer waiting on another's result. Backgrounding them is fine and usually better, since reviewers take minutes and the main thread can spend that time on its own verification. Never pre-judge: no reviewer is told what to flag, what to ignore, or how severe anything is. In particular, no reviewer is told to screen out defects that predate the PR: recall is its product, and provenance is adjudicated below.

- **pr-reviewer, always:** repo path and refs (or scratchpad), plus every digest file path and the practices doc if present. It owns AC coverage and returns categorized findings with comment drafts.
- **blind-reviewer, when the diff is substantive** (more than 3 files or more than 150 changed lines): refs or changed-file list ONLY. Its contamination contract is the dispatch's whole discipline: never the PR description, work items, commit messages, or any intent summary, and no docs/ paths in the list.
- **security-reviewer, when the diff touches** input handling, authentication/authorization, SQL construction, secrets/configuration, shell or process execution, or an external boundary. It gets the same refs or changed-file list (the `code/` scratchpad in no-clone mode); there is no spec path for an incoming PR.

A PR too large for one dispatch (the diff will not fit a reviewer's context alongside its digests) splits by directory or component into parallel dispatches per slice (the blind pass splits by the same slices), each pr-reviewer getting the full digests, merged in the filter. AC verdicts merge Met-wins across slices: a criterion is a Gap only when no slice met it.

## Filter

Every candidate finding is adjudicated in the main thread before Daren sees it:

- Apply the finding bar: a named, reachable failure scenario, or a practice violation with its source (committed doc, or the codebase's own prevailing convention). Neither: dropped, or demoted to a note if genuinely worth Daren's awareness.
- Map the paired reviewers' ladders: their CRITICAL/MAJOR are blocker candidates, MINOR are suggestion/note candidates, and every one still faces the bar; blind-reviewer's correctness findings usually survive, its style-adjacent ones usually do not.
- Dedup across reviewers and against the existing human threads: a point a teammate already made is not raised again.
- A claimed absence ("no error handling") without evidence the reviewer looked: verify it in the code yourself, or drop it.
- Borderline calls default to dropping. A senior dev raises fewer, better points; the cost of a pedantic comment recurs on every PR the author brings.
- Draft comments must read like a dev typed them into the review pane; strip assistant-prose tells ("Net effect:", "In essence,", "It's worth noting", "This ensures") before the gate. The same standard, backtick code spans for code included, covers text the main thread drafts itself: re-review replies and promoted notes.
- Assume the reader knows this codebase. Explaining their own system back to them ("that proc is TLC's, not ours") reads as condescension even when it is accurate, and it survives the tells check above because it is not assistant prose. The test is whether cutting the sentence weakens the case: "line 129 already excludes NULLs by comparison" stays, because it is why the reader can tell local rows are safe; ownership and orientation go.

**Provenance, before the bar.** A finding that names a defect in code is not this PR's just because a reviewer found it at the source ref. Read the file as it stood at the PR's base (`git show $(git merge-base <target-sha> <source-sha>):<path>`, path relative to the repo root; the `base/` scratchpad copy in no-clone mode) and work out whether the failure scenario the finding names also happens there. An unmet acceptance criterion is outside this: the PR is what was supposed to add the behavior, so its absence at the base ref is expected and decides nothing.

Reproduce the scenario, do not locate the line. `git blame`, `git log -L`, and grepping the diff's `+` side all answer "was this line written in this PR", a different question that gets the verdict backwards whenever the PR breaks code it never touched: a predicate the diff left alone becomes a defect the moment the diff repoints the value it guards, byte-identical at both refs and introduced all the same. Base and head line numbers do not agree, so read the base file rather than indexing the finding's line number into it. Take added and renamed files from `git diff --name-status -M <target-sha>...<source-sha>`: an `A` file is wholly the PR's and has no base version, an `R` file's base content sits at its old path, and a failed `git show` distinguishes neither on its own.

| At the base ref | The finding |
|---|---|
| The scenario cannot happen | **Introduced.** A normal finding at its normal severity. |
| The scenario happens, and the PR changed what reaches that code | **Newly broken.** Still the PR's. The comment names the change that broke it, and the anchor goes on that change rather than the older line. |
| The scenario happens, untouched and unaffected by the PR | **Predates the PR.** A note, never a blocker or a suggestion however well it clears the bar. |

The verdict is a fact about the code, not a way to shed findings: the same base read that demotes a pre-existing gripe sharpens a real one, by establishing exactly what the PR replaced.

## The gate (required; no posting path skips it)

Present to Daren, in the terminal:

1. One line of PR context and any reduced-context or split-dispatch flags.
2. AC coverage per criterion (met / gap / cannot verify), Daren's eyes only; the PR never gets a checklist comment.
3. Findings by category, each with file:line, the base-ref verdict for any finding naming a code defect (introduced / newly broken / predates the PR), the rationale, scaled per the agent's depth rule (a self-evident miss earns a clause, a subtle mechanism earns sentences, and the analysis behind either runs full depth regardless), the exact comment text that would post, and the anchor span whenever the comment ends in a suggestion block: the span is what Apply overwrites.
4. The proposed vote per the table below.

Daren edits, vetoes, promotes notes to comments, or overrides the vote. Only his explicit go-ahead unlocks posting, one approval for the whole PR. A clean approve still waits here: a vote is an outward-facing act.

| Verdict | Vote | Threads |
|---|---|---|
| Clean | Approve (10) | none |
| Suggestions | Approve with suggestions (5) | unresolved, one per suggestion |
| Blockers | Wait for author (-5) | unresolved, one per blocker |

**Auto-complete is left alone, deliberately.** The kit used to cancel it whenever unresolved threads posted, so the author would see feedback before the merge. The branch policies already guarantee that: completion needs all comments resolved plus an approving vote, so a Wait-for-author vote blocks the merge outright, and an Approve-with-suggestions cannot complete while threads are open. Cancelling bought nothing, and spent an outward-facing write stripping a convenience the author deliberately set. This one rests on a policy fact rather than a principle, so name the dependency: if a repo turns out to lack the comments-resolved or minimum-approval policy, the question reopens for that repo and nowhere else.

A mixed verdict takes the severest row's vote and posts threads for the blockers and every surviving suggestion, with the suggestions marked per the Post section. Reject (-10) is never proposed; it is Daren's escalation at the gate. An unmet acceptance criterion is a blocker unless the work-item discussion shows it was consciously deferred, which makes it a note. Draft PRs get comments but no vote by default.

The Threads column counts blockers and suggestions only. Predates-the-PR threads and promoted notes are orthogonal to every row: they set no vote and bar no Clean approve, so a clean PR carrying three pre-existing-finding threads is an ordinary outcome, not a contradiction of the first row.

## Post (only after the gate)

- **Threads:** `repo_create_pull_request_thread` with `filePath` plus all four of rightFileStartLine/rightFileStartOffset/rightFileEndLine/rightFileEndOffset, anchored per Anchors below. Line numbers are new-side; a finding on deleted code anchors to the nearest surviving line or file-level (filePath alone, verified); a finding with no file at all (an AC gap) posts as a PR-level thread (no filePath, verified). Whether `filePath` wants a leading slash was never recorded on the confirmed threads, so read the form off an existing thread on the same PR (`repo_list_pull_request_threads`) and reuse it verbatim instead of reconstructing it; record the form the first time a thread of yours posts cleanly, in the CROSS-PROJECT tier (`hooks/memory.js add --kind platform`) and not in the project store: it is a property of the Azure DevOps API, and the recorded instance of getting this exact routing wrong is the reason that tier exists.
- **Anchors.** Offsets are character-exact and 1-based, computed from the file at the source ref (`git show <source-sha>:<path>`, or the scratchpad copy), and the end offset is one past the last character covered, so a 1..2 span highlights one character rather than a line. A full-line span therefore runs offset 1 through the line's length plus 1 (verified at that granularity: thread 2717, confirmed by Daren 2026-08-05). Two decisions follow, in this order; collapsing them is what produced the old full-line mandate.
    1. *Choose the span for legibility.* Anchor the smallest span that still reads as a complete thought on its own: an expression, a predicate, one projection item, a statement, or a whole block when the block is what the finding is about. That yields one of two shapes. A **fragment** anchor starts at the fragment's first character, so leading indentation is left out, and ends one past its last character, whether or not it crosses lines. A **block** anchor covers whole lines and runs offset 1 through the last line's length plus 1, indentation included: the intermediate lines carry theirs regardless, so shaving the first buys no legibility. Do not reflexively take the whole line, and do not shrink to the minimal edit either: for a `D.` to `K.` alias fix the anchor is the whole projection item `,D.[DispatchDate]`, never the single character `D`. The span's shape owes nothing to the finding's severity or category.
    2. *Match the body to the span.* When the comment ends in a fenced `suggestion` block, Apply overwrites exactly the anchored span, so produce the body by copying that substring out of the file at the source ref and editing it. That is the same procedure at every granularity and the only one that verifies, so it is no argument for taking whole lines. The anchor is chosen first, by step 1; never pick a span to suit a body already written. A span that left indentation out needs none in the body, which is the second reason to leave it out; a span that included it reproduces it byte for byte, tabs as tabs.
- **Worked anchors,** all from PR 395. `133:5-133:25` over `AND D.[PostedTo] = 0`, four leading tabs left out, body carrying no indentation: the model form. `245:7-245:24` over `,D.[DispatchDate]` with body `,K.[DispatchDate]`, preferred over the `245:1-245:24` full-line form that actually posted with its six tabs reproduced, since Apply is correct either way and the full-line form only adds whitespace you have to get exactly right. `260:1-295:80`, a plain comment on a 36-line cursor block, where the block is the smallest complete unit. Evidence scope: full-line spans render and Apply correctly (thread 2717) and so do sub-line spans (2725, and 2727 with a working suggestion block); both forms work, and step 1 is about which to choose, not which the editor accepts. A span with both ends mid-line on different lines follows from the same two-point model but has not been exercised.
- **Suggestion blocks.** End a comment with a fenced `suggestion` block when the fix is small, unambiguous, and confined to one location. That is a property of the fix and not of the severity: a soft-posted correctness bug earns one (Daren's 2727 did), and a blocker whose fix spans three files does not. Use prose when the fix is large, crosses files, or needs the author's judgment.
- **Status at creation.** Blockers and suggestions post Active. A promoted note posts `Closed` (verified): visible, not demanded. A predates-the-PR finding posts `Fixed`, which renders "Resolved": visible on the line, blocking nothing, demanding nothing. Post one only when it is specific, anchorable, and consequential, and fold same-class findings into a single thread to control volume. Its comment opens by saying the finding predates the PR and is not for this changeset, and never says who wrote the code: "this predates the PR" carries everything the author needs, and naming the author is exactly the orienting context the drafting bar cuts. A Resolved thread is not a backlog, so a finding that matters also becomes a work item.
- **Status vocabulary.** The enum offers more values than the web UI can render. Use `Active`, `Pending`, `Fixed` (renders "Resolved"), `WontFix` (renders "Won't Fix"), and `Closed`. `ByDesign` and `Unknown` are accepted by the API and then render as "Unknown" on the live PR; never send either. Closing a thread where the author was right and nothing changed is `Closed`, not `Fixed` (nothing was fixed) and not `WontFix` (nothing was declined).
- **Vote:** `repo_vote_pull_request` (Approved | ApprovedWithSuggestions | WaitingForAuthor; Rejected only as Daren's gate escalation). Fallback: `az repos pr set-vote`. Dry-verified: confirm on first live use and record the confirmation in the cross-project tier (`--kind platform`), since it is connector behavior rather than a fact about any one repo.
- **Marking suggestions on a mixed verdict.** When blockers and suggestions post together under one Wait-for-author vote, every thread arrives Active and reads identically. The vote says something in the review blocks the merge and never says which thread, and Active carries no severity, so nothing on the PR distinguishes the two of five the author must act on from the three they may ignore. Open each suggestion's comment with a marker, then the finding: **Suggestion, not a blocker** - implementing it is your call, but the thread still needs a reply, since the policy clears on resolution rather than on agreement. Four parts of that shape are deliberate.
    - **Mark the suggestions, never the blockers.** The failure modes are not symmetric. A marker you forget leaves a suggestion reading as required, and the author does work they did not owe; a scheme that tagged blockers instead would leave a forgotten blocker reading as optional, which is how required work gets skipped. Take the failure that errs toward doing more.
    - **Say the reply is still owed.** Without that clause the marker contradicts the PR's own behavior: the author reads "optional", then finds the PR will not complete until the thread is resolved. Optional means optional to *implement*, and the marker has to say so, or it reads as either a lie or a mistake.
    - **Every thread still posts Active.** The marker changes what the comment says, not what the thread is. Posting a suggestion `Closed` to signal optionality drops it out of the author's resolution sweep and reads as already handled.
    - **Not on an Approve-with-suggestions verdict.** There the vote already says every thread is optional, so a per-thread marker is noise. The asymmetry is the point: mark only where a mixed verdict has made the threads ambiguous.

  The marker is fixed boilerplate and sits outside the depth scaling the reviewer applies: it is not explanation, so it neither counts toward a finding's depth nor licenses padding one. A one-clause finding stays one clause under it.
- Report back exactly what posted, with thread ids.

If the connector's write path is down, present the gate output as a manual checklist instead of silently half-posting.

## Re-review

When Daren already has threads or a vote on the PR: verify each unresolved thread against the new code, and propose a short reply plus `repo_update_pull_request_thread` status `Fixed` (verified) for the addressed ones. Review the delta since his last review, plus anything the fixes could have regressed, not the unchanged code already reviewed: locate the prior-review point by his last thread or vote date against `git log` on the fetched source ref, and when that is ambiguous, review the full diff rather than guess. The same gate covers replies, resolutions, new findings, and the vote change.

## Failure modes

- **No linked work item:** review code and description only; tell Daren AC evaluation was impossible. Whether a missing link is itself worth a comment is his call, not an automatic one.
- **Repo not cloned locally:** scratchpad path, reduced-context flag in the gate.
- **Connector lacks a capability:** reach for `az` or the REST API and get on with it. That is normal operation, not degradation, and a missing tool is never a reason to hand Daren a manual workaround. The gap worth knowing: the connector has no PR-comment edit or delete, so both go through `az devops invoke`.
- **Connector write path down:** the one genuinely degraded case. The gate output doubles as a manual posting checklist rather than half-posting silently, and re-review detection is named as degraded. az still covers the PR-metadata reads and the vote; thread listing and creation need raw `az devops invoke`.
- **PR already completed/abandoned:** report and stop.
