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
- **No local clone:** pull the changed-file list (`repo_get_pull_request_changes`, `includeDiffs: false`) and file contents at the source ref into the scratchpad; paginated `includeDiffs: true` supplies hunks. changeType is a flags enum (add=1, edit=2, rename=8, delete=16, combining: 10 is renamed-and-edited); mask it, never equality-match. A deleted file has no source-ref content: represent it by its removed hunks and say it was deleted. Flag the reduced context in the gate report; the reviewers' caller-tracing duties shrink to what was materialized.

Keep the scratchpad split: materialized sources under a `code/` subdirectory that holds nothing else, digests under `digests/`; the blind pass is pointed only at `code/`, because one stray digest beside the sources is the intent story arriving through a side door. Digests to write: PR context (title, description, author, refs, draft status), AC and work-item discussion, human threads, and the path to a committed practices doc when the repo has one (CLAUDE.md, committed style docs). The practice bar is the repo's own docs and conventions; the kit's house-style skills are not a standard for teammates' code.

## Dispatch reviewers

All applicable reviewers go out in one message, synchronously, in parallel. Never pre-judge: no reviewer is told what to flag, what to ignore, or how severe anything is.

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
- Draft comments must read like a dev typed them into the review pane; strip assistant-prose tells ("Net effect:", "In essence,", "It's worth noting", "This ensures") before the gate.

## The gate (required; no posting path skips it)

Present to Daren, in the terminal:

1. One line of PR context and any reduced-context or split-dispatch flags.
2. AC coverage per criterion (met / gap / cannot verify), Daren's eyes only; the PR never gets a checklist comment.
3. Findings by category, each with file:line, the one-to-three-sentence rationale, the exact comment text that would post, and the anchor span whenever the comment ends in a suggestion block: the span is what Apply overwrites.
4. The proposed vote and auto-complete action per the table below.

Daren edits, vetoes, promotes notes to comments, or overrides the vote. Only his explicit go-ahead unlocks posting, one approval for the whole PR. A clean approve still waits here: a vote is an outward-facing act.

| Verdict | Vote | Threads | Auto-complete |
|---|---|---|---|
| Clean | Approve (10) | none | untouched |
| Suggestions | Approve with suggestions (5) | unresolved, one per suggestion | canceled if set |
| Blockers | Wait for author (-5) | unresolved, one per blocker | canceled if set |

A mixed verdict takes the severest row's vote and posts threads for the blockers and every surviving suggestion. Reject (-10) is never proposed; it is Daren's escalation at the gate. An unmet acceptance criterion is a blocker unless the work-item discussion shows it was consciously deferred, which makes it a note. Draft PRs get comments but no vote by default.

## Post (only after the gate)

- **Threads:** `repo_create_pull_request_thread` with `filePath` plus all four of rightFileStartLine/rightFileStartOffset/rightFileEndLine/rightFileEndOffset, spanning the finding's Anchor. When the comment ends in a fenced `suggestion` block, span the full replaced lines (offset 1 through last-line length plus 1): ADO renders the block as an applyable change and Apply replaces the anchored span (posting verified, thread 2717; confirm the Apply rendering on first real use like the vote, recorded in auto memory). Line numbers are new-side; a finding on deleted code anchors to the nearest surviving line or file-level (filePath alone, verified); a finding with no file at all (an AC gap) posts as a PR-level thread (no filePath, verified). Blockers and suggestions post Active; promoted notes post with `status: Closed` at creation (verified): visible, not demanded.
- **Vote:** `repo_vote_pull_request` (Approved | ApprovedWithSuggestions | WaitingForAuthor; Rejected only as Daren's gate escalation). Fallback: `az repos pr set-vote`. Dry-verified: confirm on first live use and record the confirmation in auto memory.
- **Auto-complete:** when posting unresolved threads and the PR has auto-complete set (check `autoCompleteSetBy`; an inferred field, unobservable on a completed PR), cancel it with `repo_update_pull_request` `autoComplete: false` so the author sees the feedback before merge. Fallback: `az repos pr update --auto-complete false`. Dry-verified like the vote: confirm on first live use and record it in auto memory.
- Report back exactly what posted, with thread ids.

If the connector's write path is down, present the gate output as a manual checklist instead of silently half-posting.

## Re-review

When Daren already has threads or a vote on the PR: verify each unresolved thread against the new code, and propose a short reply plus `repo_update_pull_request_thread` status `Fixed` (verified) for the addressed ones. Review the delta since his last review, plus anything the fixes could have regressed, not the unchanged code already reviewed: locate the prior-review point by his last thread or vote date against `git log` on the fetched source ref, and when that is ambiguous, review the full diff rather than guess. The same gate covers replies, resolutions, new findings, and the vote change.

## Failure modes

- **No linked work item:** review code and description only; tell Daren AC evaluation was impossible. Whether a missing link is itself worth a comment is his call, not an automatic one.
- **Repo not cloned locally:** scratchpad path, reduced-context flag in the gate.
- **Connector unavailable:** az covers the PR-metadata reads and the vote, but not thread listing or creation (only raw `az devops invoke` reaches those). The chosen degradation: the gate output doubles as a manual posting checklist, and re-review detection is named as degraded.
- **PR already completed/abandoned:** report and stop.
