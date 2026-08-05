# PR Review Skill (Azure DevOps)

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: in-session only (all sections main-thread; review dispatches inherit the session model); no delegate-fable sections
Created: 2026-08-05

## Goal

A `pr-review` skill plus a `pr-reviewer` agent in the kit that reviews an Azure DevOps pull request end to end: gather the PR, its linked PBI acceptance criteria, and its discussion via the DevOps connector; produce a senior-dev-calibrated review with findings categorized as blockers, suggestions, and notes; present the drafted review at a gate; and on Daren's single go-ahead post the comment threads, cast the vote, and adjust auto-complete under his identity. Daren does these reviews with Claude's help frequently today; making it a kit capability buys consistency across sessions and lets it link into the kit's existing review machinery.

## Approach

The decisions that shape the build, with reasoning:

- **Connector-first, verified fallback.** The DevOps MCP connector is the primary transport for both reads and writes. `az` CLI or REST is used only for gaps S1 verifies (auto-complete toggling is the suspected one).
- **Main thread gathers; agents read disk.** Kit agents declare closed tool allowlists and cannot call MCP tools. The skill's main thread therefore fetches everything and materializes it locally before any dispatch: when the repo is cloned locally, `git fetch` and review via `git diff target...source` and `git show` at refs with no checkout and no working-tree disturbance; otherwise pull changed files via the connector into the scratchpad and flag the reduced context in the report.
- **Anti-slop precision is owned here, in two layers.** The kit's existing reviewers are deliberately recall-tuned because an internal adjudication step filters them; PR comments reach teammates, so that license does not transfer. The `pr-reviewer` agent is precision-tuned at the source, and the main thread filters again before the gate. The finding bar, enforced per finding: it names a concrete failure scenario, or a violated practice with its source (a repo-committed doc, or a cited convention precedent in the codebase). Claimed absences are verified against the code before flagging. Works-correctly-but-not-preferred is at most a suggestion, usually nothing.
- **Practice bar.** Repo-committed docs (CLAUDE.md, committed style docs, .editorconfig) outrank prevailing codebase conventions, which are the fallback. The kit's C#/SQL house-style skills are explicitly not a bar for teammates' code. The agent's input contract names an optional practices-doc path so a future team-practices artifact can slot in without redesign.
- **Category to action mapping.**

  | Verdict | Vote | Threads | Auto-complete |
  |---|---|---|---|
  | Clean | Approve (10) | none | untouched |
  | Suggestions | Approve with suggestions (5) | unresolved, one per suggestion | canceled if set |
  | Blockers | Wait for author (-5) | unresolved, one per blocker | canceled if set |

  Reject (-10) is never proposed automatically; it is Daren's call at the gate. Notes are terminal-only by default and promotable to posted comments at the gate.
- **Gated posting.** One approval per PR, not per comment. The gate shows AC coverage, categorized findings with file:line and short rationale, the proposed vote and auto-complete action, and the exact comment text that would post. Comments post under Daren's identity with no AI-disclosure tag; once vetted at the gate they are his comments (decision made deliberately; a separate identity was judged not worth the setup).
- **Acceptance criteria evaluation.** When a PBI is linked, the PR is evaluated against its acceptance criteria and work item discussion. An unmet criterion defaults to a blocker unless the discussion shows the gap was consciously deferred or split, in which case it is a note. Full coverage is reported to Daren only; no checklist comment on the PR.
- **Existing threads are context.** The reviewer never re-raises a point a teammate already made, and reads discussion for agreed deferrals. On re-review (the PR came back with new iterations), the skill verifies each of Daren's existing unresolved threads against the new code, proposes resolving addressed ones with a short reply, and reviews only the delta plus anything the fixes regressed.
- **Pairing with existing kit reviewers.** On substantive PRs, `blind-reviewer` runs in parallel, intent-stripped per its contract (refs only; no PR description, work items, or commit messages). `security-reviewer` is added on its existing observable predicate. Their severity ladders map to categories in the main-thread filter, where every finding still faces the finding bar.
- **Draft PRs** get comments but no vote by default.
- **Plugin cache lag** (known kit quirk): repo edits are inert until the plugin cache updates, so S4's replay must brief the new agent inline or update the plugin first.

## Sections of Work

### 1. Connector write-path verification
Completed: 2026-08-05 (Chapter 1).
Probe the connector's write surface on PR #321 (an old PR of Daren's), comment surface only: create a thread anchored to file and line (correct file, line, and iteration context), reply, and update thread status, closing the test threads as cleanup. Do not re-open the PR, do not vote, do not touch auto-complete; nothing that changes the PR's actual status. Vote and auto-complete are verified dry instead: identify the connector tool or `az`/REST fallback and exact parameters, with live confirmation deferred to the first real gated use (safe because the gate has Daren approving the action). Verify the read side where shape is uncertain: acceptance-criteria field retrieval from a real PBI, work item discussion, PR iterations/changes. Record each capability, each gap, and the chosen fallback with exact tool names and quirks; the results feed S2/S3 text.
Acceptance:
- Thread create, reply, and status-update demonstrated live on PR #321, comment-only, test threads closed afterward.
- Vote and auto-complete each have a documented mechanism (connector tool or named fallback) verified dry, marked for live confirmation on first real gated use.
- AC and work item discussion retrieval verified against a real PBI.
- Findings recorded in this plan's Chapter for S3 to consume.
Execution mode: main (requires MCP access, which subagents lack).

### 2. pr-reviewer agent
Completed: 2026-08-05 (Chapter 2).
New agent at `plugins/claude-kit/agents/pr-reviewer.md`, read-only tools (Read, Grep, Glob, Bash), model unpinned. Precision-tuned, unlike the kit's recall-tuned reviewers, carrying the finding bar. Input contract: paths to materialized context (diff refs or changed-file list, PR description, AC text, existing-threads digest, optional practices doc). Output contract: findings in blocker/suggestion/note categories, each with file:line, what and why, fix direction, and its justification type (failure scenario, or practice violation with source). Anti-slop rules as prohibitions where writing-skills' failure-to-form table calls for them: verify absence before flagging it, no style nits absent a committed standard, no re-raising existing thread points, no praise or padding.
Acceptance:
- Passes `claude plugin validate`.
- Input and output contracts stated in the agent file.
- The finding bar and anti-slop prohibitions present in the agent text.
Execution mode: main (behavior-shaping prose at the core of the design; evolves in contact with S4).

### 3. pr-review skill
Completed: 2026-08-05 (Chapter 3).
New skill at `plugins/claude-kit/skills/pr-review/SKILL.md` covering: invocation (`/pr-review <id or URL>`; no argument lists open PRs where Daren is a reviewer), the gather list, the materialization procedure (local refs preferred, scratchpad fallback with a reduced-context flag), dispatch briefs (pr-reviewer always; blind-reviewer intent-stripped on substantive PRs, with the substantive-PR predicate stated observably, e.g. by diff size; security-reviewer on its predicate; severity-to-category mapping in the filter), the main-thread filter bar, the gate report format, posting mechanics as verified by S1, the re-review flow, draft-PR handling, a large-PR strategy (split dispatches, merged in the filter), and failure modes (no linked PBI, repo not cloned locally, PR already completed or abandoned, connector unavailable).
Acceptance:
- Description frontmatter is trigger-only and quoted.
- Passes `claude plugin validate`; body at kit altitude (single SKILL.md unless it genuinely outgrows siblings).
- Category table present; the blind-reviewer dispatch instructions honor its contamination contract (refs only; no PR description, work items, or commit messages).
- The gate is a REQUIRED structural step: no posting path exists in the skill text that skips Daren's go-ahead.
Execution mode: main (design-entangled with S2; the pipeline text is the design).

### 4. Calibration replay
Replay run 2026-08-05 to the gate; awaiting Daren's sign-off (Chapter 4).
Replay at least one real past PR Daren already reviewed (he picks which): run the pipeline to the gate, no posting, and diff the output against his actual review. Judge on: no slop findings (every posted-candidate names its failure or practice), catches what he caught or the misses are defensible, comment text senior-dev-grade in tone and length. Tune S2/S3 wording on divergence; if a specific anti-slop rule demonstrably failed, run the writing-skills RED/GREEN loop on that rule. Brief the agent inline or update the plugin cache first (cache lag).
Acceptance:
- At least one replay run to the gate.
- Daren signs off on output quality.
- Wording adjustments applied and the divergences noted in the Chapter.
Execution mode: main (orchestration, MCP access, and Daren's adjudication).

### 5. Registration
Completed: 2026-08-05 (Chapter 4).
Add `pr-review` to the kit README's skill listing with a one-line description consistent with its siblings; confirm the docs index entry for this plan is accurate.
Acceptance:
- README lists the skill; `docs/README.md` entry verified.
Execution mode: main (trivial, and touches the same files as the effort's close-out).

## Out of Scope

- The future team-practices artifact (the input seam is named in S2; building the artifact is a backlog item).
- GitHub or any non-ADO PR review.
- A separate posting identity or AI-disclosure tagging on comments.
- Unattended posting (no path around the gate).
- Reviewing our own outbound PRs (finishing-work owns those).
- Wiki-sourced team practices (not where this team's practices live).

## Open Questions

- S4 replays PR #321 to the gate (Daren designated it as the test vehicle for the effort). Since #321 is Daren's own PR and its reviewer approved without substantive comments, there is no past-review transcript to diff against; Daren judges the gate report directly. He may name an additional past PR if a comparison replay proves worth it.

## Chapters

### Chapter 1 - 2026-08-05
Completed: 1. Connector write-path verification
Implemented By: main session
Metrics: review rounds 0; NEEDS_CONTEXT 0; escalations 0; advisor not observed this session
Decisions / Surprises: All probes ran against PR #321 (EleosCore, EleosIntegration project, org asr-solutions), comment-only per Daren. Findings for S2/S3:
- **Resolving a bare PR id:** connector `repo_get_pull_request_by_id` requires repositoryId; `az repos pr show --id N --organization https://dev.azure.com/asr-solutions` resolves org-wide without repo/project (confirmed live). az is logged in via AAD but has no default org configured; every az command needs `--organization`.
- **PR read shape (confirmed):** `repo_get_pull_request_by_id` with `includeWorkItemRefs: true` returns linked work item ids; description, reviewers with votes, isDraft, status, source/target refs, lastMergeSourceCommit/lastMergeTargetCommit (the refs local git diffs against), and completionOptions all present.
- **Changes (confirmed):** `repo_get_pull_request_changes` with `includeDiffs: false` returns paths + changeType (1=add, 2=edit); with `includeDiffs: true` returns lineDiffBlocks with full original/modified line content and nextTop/nextSkip pagination. Verbose; remote-only fallback, prefer local git.
- **Threads (confirmed):** `repo_list_pull_request_threads` includes system housekeeping threads (votes, auto-complete set/cancel, policy updates, "X joined as reviewer") with `threadContext: null`; the thread digest must filter author "Microsoft.VisualStudio.Services.TFS" and vote/auto-complete/policy system texts. Human file-anchored threads carry threadContext.
- **Thread writes (confirmed live, thread 2713):** `repo_create_pull_request_thread` anchors with filePath + all four of rightFileStartLine/rightFileStartOffset/rightFileEndLine/rightFileEndOffset; response threadContext echoes the anchor. Right-file anchoring only, no left-file params: findings on deleted lines must anchor to a nearby surviving line or go file-level (filePath with no line params, inferred valid since position params are optional; verify on first use). `repo_reply_to_comment` (threadId) and `repo_update_pull_request_thread` (status; Closed=4) both confirmed.
- **Vote (dry):** `repo_vote_pull_request` enum Approved/ApprovedWithSuggestions/NoVote/WaitingForAuthor/Rejected; auto-adds caller as reviewer. Fallback: `az repos pr set-vote --id N --vote approve|approve-with-suggestions|reject|reset|wait-for-author`. Live confirmation on first real gated use.
- **Auto-complete (dry):** `repo_update_pull_request` has autoComplete boolean plus mergeStrategy/deleteSourceBranch/transitionWorkItems/bypassReason. Fallback: `az repos pr update --id N --auto-complete false`. Detection of current auto-complete state on an active PR is via autoCompleteSetBy (inferred from REST docs, not observable on a completed PR; verify on first use). Live confirmation on first real gated use.
- **Work items (confirmed):** `wit_get_work_item` with a fields list returns Microsoft.VSTS.Common.AcceptanceCriteria as HTML (populated on PBI 21103); Tasks lack AC. The project param need not be the work item's home project (repo project worked; items actually live in "ASR Development - Scrum"). `wit_list_work_item_comments` returns HTML comments, sometimes enormous (embedded tables); digest, never inline raw.
- **Ops note:** the MCP permission classifier had a transient outage mid-probe; a short retry recovered. The skill should treat connector errors as retryable before falling back to az.
- Spec amendments this section: S1 rescoped to comment-only per Daren (no votes, no auto-complete, no reopen); S4 open question resolved to judging the gate report on #321 directly.
Review Findings: per-section review skipped under the trivial carve-out (no code artifacts; changes are probe results plus this plan doc). The finishing pass covers the effort end to end.
Next: 2. pr-reviewer agent
Commit Model: Commit-and-Push

### Chapter 2 - 2026-08-05
Completed: 2. pr-reviewer agent
Implemented By: main session
Metrics: review rounds 1 (paired adversarial + blind, both APPROVED_WITH_CONCERNS); NEEDS_CONTEXT 0; escalations 0; advisor not observed this session
Decisions / Surprises: The agent's core inversion is stated against the kit's other reviewers explicitly: their recall-over-precision license rests on an internal adjudication filter, and this agent's output reaches a teammate, so precision is the calibration and the finding bar (failure scenario, or practice violation with source) is the mechanism. Notes got their own bar (specific observation worth Daren's attention beyond the PR) after blind review showed the two-type bar strictly read made the category empty. The agent proposes an advisory vote; the orchestrator derives the posted vote from surviving findings.
Review Findings: Adversarial Major fixed (committed docs now explicitly outrank prevailing conventions in the practice bar). Blind Major adjudicated no-change: the agent names the pr-review skill as its dispatcher one section before that skill lands; sequencing artifact under Commit-and-Push, closed by S3. Minors fixed: scratchpad-mode degradation policy added; --format= contamination hygiene dropped (commit messages are legitimate context for this agent); cannot-verify AC disposition stated; right-side line-number rule added; report-level no-padding prohibition added; NOTE split out of the comment-draft template; description overpromise corrected. No Minors left unaddressed.
Next: 3. pr-review skill
Commit Model: Commit-and-Push

### Chapter 3 - 2026-08-05
Completed: 3. pr-review skill
Implemented By: main session
Metrics: review rounds 1 (adversarial APPROVED_WITH_CONCERNS, blind CHANGES_REQUIRED); NEEDS_CONTEXT 0; escalations 0; advisor not observed this session
Decisions / Surprises: Three review findings were answered with live probes instead of caveats, all comment-only on PR #321 (threads 2714/2715, created and closed): `repo_list_pull_requests_by_repo_or_project` with `i_am_reviewer` verified live (also surfaced active PR #394 awaiting Daren's review); PR-level threads (no filePath, threadContext null) verified; file-level anchoring (filePath alone) verified; create-with-status Closed verified; thread status `Fixed` (=2) verified. Remaining dry-verified mechanics are now exactly two: casting a vote and toggling auto-complete, both marked confirm-on-first-live-use with the confirmation recorded to auto memory. changeType documented as a flags enum (delete=16, rename=8, combinations) after both reviewers caught the incomplete legend; the no-clone scratchpad is split code/ vs digests/ so the blind pass cannot trip over the intent story; AC-gap blockers post as PR-level threads; mixed blocker+suggestion verdicts post both sets of threads; re-review keys on any prior Daren thread or vote, not just unresolved threads.
Review Findings: All three adversarial Majors fixed (unverified listing tool: probed live; auto-complete caveat restored; scratchpad contamination: directory split). All three blind Majors fixed (flags-enum masking with deleted-file representation; the same directory split; PR-level thread path for anchorless findings). All Minors from both fixed except none outstanding; notable Minors: system-thread filtering no longer keys on null threadContext (human PR-level comments share it), description parenthetical dropped to keep the frontmatter trigger-only, az read-coverage claim narrowed (no thread listing outside `az devops invoke`).
Next: 4. Calibration replay
Commit Model: Commit-and-Push

### Chapter 4 - 2026-08-05
Completed: 5. Registration
Implemented By: main session
Metrics: review rounds 0 (trivial carve-out: two listing lines); NEEDS_CONTEXT 0; escalations 0; advisor not observed this session
Decisions / Surprises: pr-review registered under skills/ and pr-reviewer under agents/ in the kit README; the docs index entry from spec creation is still accurate. S4's replay also ran this session (its one open acceptance item is Daren's sign-off, so S5 closes first). Replay facts for the record: the local-clone path needed no fetch at all, because a squash-merged PR's net diff is the squash commit against its single parent (9736ed0^..9736ed0 here), and that is the preferred materialization for completed PRs since sandbox SSH fetch fails without agent keys. The reviewer trio (pr-reviewer inline-briefed per the plugin-cache-lag memory, blind, security) independently converged on the same top finding, the DeleteRetries NULL migration gap. The filter caught a real calibration hazard: security-reviewer sourced two findings to ASR.Eleos/docs/security-model.md, which postdates the PR (2026-07-14 vs. merge 2026-05-11) and is absent at the PR ref; both demoted from author-facing suggestions to Daren-facing notes after the ref check. Gate report delivered in-session; no posting (replay-only, PR completed).
Review Findings: none (registration lines).
Next: 4. Calibration replay sign-off (Daren), then finishing-work
Commit Model: Commit-and-Push
