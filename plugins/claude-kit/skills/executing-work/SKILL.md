---
name: executing-work
description: Autonomous execution of an approved spec or plan from docs/plans/. Use when Daren says to proceed, implement, build, or continue an agreed plan, or when resuming a session that has an In Progress plan doc. Works section by section with adversarial subagent review and Chapter checkpoints, without per-step permission seeking.
---

# Executing Work

The contract: once the spec is approved, proceed autonomously to completion. No per-step check-ins, no "shall I continue?", no gating individual edits. The spec is the agreement; execute it.

Interrupt Daren only for: a contradiction inside the spec, a decision the spec does not cover with material consequences, destructive/irreversible actions, or a debugging dead end reached per the systematic-debugging skill's stop-and-report rules. Everything else is yours to resolve and record.

## Before starting (or resuming)

1. **Read the plan doc in full, including all Chapters.** The Chapters are the state: they record what is done, what surprised us, and the commit model in effect. After a compaction, this re-read is mandatory before touching any file.

2. **Branch check.** Nothing is committed to main/master without Daren's explicit permission. Branch-and-PR always works on a feature branch; confirm or create it before the first section (use a worktree when isolation from the current workspace is needed). Commit-and-Push commits to main only where Daren approved that (typically his own greenfield repos); in a shared repo without that permission, treat it as Branch-and-PR and note the substitution in the Chapter. Review-Only work may sit uncommitted on any branch, since nothing is committed.

## Worktree dev-environment

When the effort will run in a worktree (the Branch check chose one, or a section dispatches `isolation: worktree` subagents), set up `.worktreeinclude` **before** the worktree is created. A worktree is a fresh checkout: tracked files arrive with it, but gitignored local dev-state (IDE config, run configurations, the VCS-root mapping, `.env`/secrets) does not. Claude Code copies the gitignored files matching `.worktreeinclude` (a `.gitignore`-syntax file at the repo root) into every worktree it creates, so the job is to make that file correct, not to copy anything by hand.

Ordering is load-bearing: the file is read at creation time, so a pattern added afterward does not seed a worktree that already exists - when you are entering a pre-existing worktree, the file only helps the next one, not the one you are entering. It is set once per repo and then applies to every future worktree. Create it, or append the missing pattern, in the working tree and leave it for Daren to commit (team benefit) or ignore (personal); do not commit it as part of the effort. Do nothing when there is no gitignored dev-state to copy or no IDE is detected; ask once when it is ambiguous (several IDEs in play, or it is unclear which Daren uses). This applies to Claude-created worktrees only (`EnterWorktree`, `--worktree`, `isolation: worktree`), not to worktrees made by hand with `git worktree add`.

Detect what is present and gitignored, and add the matching pattern:

| Present | Add | Notes |
|---|---|---|
| `.idea/` (JetBrains/Rider) | `.idea/` | Copies the gitignored subset (always `workspace.xml`, which holds run configs; the whole tree where `.idea` is ignored wholesale), while tracked parts (shared `runConfigurations/`, `vcs.xml`) arrive via the checkout. Matches `.idea` at any depth, so the `.idea.<Solution>` nesting and multi-solution repos are covered. Seeding `vcs.xml` also gives Rider the VCS-root mapping it cannot auto-detect from a worktree's `.git` pointer file. |
| `.vscode/` (VS Code) | `.vscode/` only if it is gitignored | Usually tracked, so usually nothing to do. |
| `.vs/` + `*.sln` (Visual Studio) | `.vs/` | |
| `.env`, local secrets | the specific paths, only those already gitignored | `.worktreeinclude`'s canonical use. |

## Section loop

For each Section of Work, in order:

1. **Confirm the approach against the real code, then implement.** Before writing a section whose mechanism the spec assumed without reading the code, do a quick in-session read of the files it touches and confirm the planned approach actually holds - specs written during brainstorming can be fictional about code nobody had open yet. This is a lightweight read, not a subagent fan-out. If the real shape differs materially, adjust and note it in the Chapter (raise to Daren only if it changes design intent). Then implement per the section's recorded execution mode (main in this session, or delegate-capable / delegate-mechanical to the matching implementer agent; see below) - following the csharp-style and sql-style skills and each skill's stated precedence rule (repo-stated rules - CLAUDE.md, style docs, `.editorconfig` - always win first; the skills state the rest, and they differ on sibling-matching). Surgical changes only; touch what the section requires.

2. **Verify with evidence.** Build must pass; run targeted tests. Claims of "done" or "passing" require the command output that proves it. For delegated work, the implementer produces that evidence per its dispatch prompt; the orchestrator reads the staged diff and spot-checks the reported evidence rather than re-running everything (re-run anything that looks off). For main-session work, run it directly. Then settle the test question (set at dispatch for delegated work; confirmed here): did the change earn a durable test? If the behavior is worth locking against regression (a business rule, an edge case, a bug that could recur), leave a retained test and show it passing - and where practical, watch it fail first, so you know it tests the right thing. If it genuinely did not (throwaway exploration, pure plumbing, a change no test could meaningfully pin), say so and why. The judgment is csharp-style's "tests earn their place", not a coverage number; a temporary repro script is for debugging a fix, not the default home for new behavior. Never mark a criterion met because the code "obviously" satisfies it.

3. **Review.** Dispatch the `adversarial-reviewer` agent with the spec path, the base git ref (or list of changed files), and the name of the section under review; tell it to read the spec's Goal, Approach, that section, and Out of Scope, skipping Chapters except deviations noted against the section (the full-changeset pass in finishing-work reads everything). If the section touched input handling, authentication/authorization, SQL construction, secrets/configuration, or an external boundary, also dispatch the `security-reviewer` agent. Dispatch both in parallel when both apply. Never pre-judge the review: do not tell a reviewer what to flag, what to ignore, or how to rate a finding ("treat as Minor at most", "the plan chose this"). Pre-rating findings in the dispatch defeats the review; let the reviewer surface it and adjudicate per responding-to-review. For a genuinely trivial, self-contained section (a rename, a comment, a one-line fix with no logic change), the per-section review is optional - the finishing-work pass still covers it; spend review budget where there is real risk.

4. **Address findings.** Critical: must be fixed before the section closes. Major: fix, or record the justification for not fixing in the Chapter. Minor: note in the Chapter; fix only if trivial and in-scope.

5. **Update the plan doc.** Mark the section complete. If the implementation deviated from the spec, update the spec section to match reality and flag the deviation in the Chapter; if the deviation changes design intent, raise it to Daren rather than silently rewriting the spec.

6. **Append a Chapter** (format below). If a Decision/Surprise traced to the kit itself fighting the work (an ambiguous rule, a contradictory step), also jot it to the kaizen inbox per the global self-monitoring rule: the Chapter records it for this effort, the inbox carries it to a kaizen pass.

7. **Apply the commit model** recorded in the spec header:
   - **Review-Only:** stage the section's changes (git add); never commit. Accumulate a running changed-files summary in the Chapter for the final walkthrough. `git diff --staged` is Daren's review surface.
   - **Branch-and-PR:** commit the section to the feature branch with a descriptive message. The PR happens in finishing-work.
   - **Commit-and-Push:** commit the section and push to origin.

## Delegating to subagents

Implementation is delegated to subagents by default. Tokens absorbed into the main context are re-billed on every subsequent turn of the session; a subagent's churn (file reads, build output, failed attempts) is paid once, and only its report comes back. The orchestrator stays the designer: it writes dispatch prompts, judges review findings, reads staged diffs, and writes Chapters. Keep a task in the main session only when one of these holds:

- **Design-entangled:** the work's shape is still being discovered in contact with the code, and each decision feeds the next.
- **Tiny:** writing the dispatch prompt would cost more than doing the work.
- **Session-state-dependent:** the task needs accumulated state that cannot be cheaply summarized (an in-flight debugging hypothesis chain, for example).

Parallelize when tasks touch non-overlapping files: lock shared contracts first, assign disjoint files, dispatch in one message.

**Write the dispatch prompt at dispatch time, from the actual current code.** Assume a skilled engineer with zero context for this codebase and questionable taste: exact file paths, the signatures and types they will touch, the conventions that apply (or which style skill to follow), what done looks like, whether the change earns a durable test and what behavior that test should lock down, what NOT to touch, and how to verify (build command, targeted tests, repro script) - the implementer runs that verification and reports the command output as evidence. Never point a subagent at the plan file to figure it out; curate exactly what the task needs.

**A hand-authored code block plus "match this exactly" silently outranks "follow skill X."** A concrete example in a dispatch prompt beats any abstract "follow csharp-style" instruction the prompt also carries: the implementer mimics what it sees over what it is told. So any code you hand over must itself already conform to the style skill; never pair non-conformant example code with "match it exactly". When you cannot vouch for a snippet's conformance, name the skill and let the implementer produce the code, rather than anchoring it to a flawed example.

**Hand artifacts over as files.** Everything pasted into a dispatch prompt, and everything a subagent prints back inline, stays resident in the orchestrator's context and re-bills on every later turn - the same tax delegation exists to avoid. Hand bulky inputs over as file paths (the spec, a diff captured with `git diff > path`, the interfaces a prior task produced), and tell the implementer or reviewer to write its full report to a named file and return only its status, the commits or staged files, and a one-line evidence summary. The orchestrator reads the staged diff and the report file rather than absorbing a pasted dump. No scripts needed; the git commands and a file path do it.

**Execution mode is chosen per section, capable by default.** Each Section of Work carries an execution mode, assigned at plan time and recorded in the spec: **main**, **delegate-capable**, or **delegate-mechanical**. **main** is the keep-in-session work above (design-entangled, tiny, or session-state-dependent); it runs in the orchestrator session on whatever model you have selected, never tied to a model name - Opus today, Fable whenever you pick it. The delegated tiers dispatch the matching agent: **delegate-capable** to `implementer-opus`, **delegate-mechanical** to `implementer-sonnet`. Capable is the default for delegated work; assign mechanical only when ALL hold: the work is mechanical with no design judgment, the instructions are exhaustive, failure is cheaply detectable (build, tests, or the staged diff catches it), and the blast radius is one or two files touching no shared contracts. When uncertain between two tiers, take the higher one. Review and QA dispatches never downgrade - judgment is their product. Handle the implementer's status: NEEDS_CONTEXT - supply the missing context and re-dispatch at the same tier; BLOCKED - fix the environment and re-dispatch. If a tier cannot converge - two reviews with Critical findings, the same NEEDS_CONTEXT twice, or two failures of any kind at that tier - it was mis-assessed: bump it up or take it over in the session. Never re-dispatch a third time at the same tier unchanged, and never downgrade a tier mid-effort. Repeated escalations mean the section was under-specified - a brainstorming lesson worth a kaizen note, not an implementer failure.

**An implementer can finish with concerns.** Besides DONE and BLOCKED, accept DONE_WITH_CONCERNS: the work is complete but the implementer flagged a doubt - a scope question, a shape it disliked, a risk it could not resolve. Read the concern before you review: resolve a correctness or scope concern yourself or hand it to the reviewer as a question to check (not a pre-rated finding); record a bare observation ("this file is getting large") in the Chapter. A flagged concern never disappears silently into a DONE.

**Subagents stage, never commit.** Implementer subagents leave their work as staged changes, whatever the commit model. Commits happen only in the main session, after review.

## Context discipline

Delegation is the primary lever for keeping the orchestrator lean. Section boundaries are clean recovery points by construction: after a Chapter is written, the plan doc carries the full state, so a fresh session resumes from it automatically via the SessionStart hook with nothing lost. Mid-section, prefer finishing the section and writing its Chapter before any reset, so the recovery point is a real boundary. When to start that fresh session is Daren's call, not a context-usage threshold you try to estimate.

## Chapter format

Append to the `## Chapters` section of the plan doc:

```markdown
### Chapter N - YYYY-MM-DD
Completed: <section name>
Implemented By: <main session | implementer-sonnet | implementer-opus, plus any escalation>
Decisions / Surprises: <anything resolved or discovered; "none" is acceptable>
Review Findings: <Critical/Major addressed; Majors justified; Minors noted>
Next: <next section, or "finishing-work">
Commit Model: <Review-Only | Branch-and-PR | Commit-and-Push>
```

Chapters exist so that a compacted or fresh session can recover full working state from the plan doc alone. Write them for that reader.

## When all sections are complete

Invoke the finishing-work skill. Do not declare the effort done without it.
