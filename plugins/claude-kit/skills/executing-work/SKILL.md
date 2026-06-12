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

## Section loop

For each Section of Work, in order:

1. **Confirm the approach against the real code, then implement.** Before writing a section whose mechanism the spec assumed without reading the code, do a quick in-session read of the files it touches and confirm the planned approach actually holds - specs written during brainstorming can be fictional about code nobody had open yet. This is a lightweight read, not a subagent fan-out. If the real shape differs materially, adjust and note it in the Chapter (raise to Daren only if it changes design intent). Then implement - delegated by default, or in the main session per the exceptions below - following the csharp-style and sql-style skills and each skill's stated precedence rule (repo-stated rules - CLAUDE.md, style docs, `.editorconfig` - always win first; the skills state the rest, and they differ on sibling-matching). Surgical changes only; touch what the section requires.

2. **Verify with evidence.** Build must pass; run targeted tests. Claims of "done" or "passing" require the command output that proves it. For delegated work, the implementer produces that evidence per its dispatch prompt; the orchestrator reads the staged diff and spot-checks the reported evidence rather than re-running everything (re-run anything that looks off). For main-session work, run it directly. If no test covers the change, use the temporary repro-script discipline from the global rules. Never mark a criterion met because the code "obviously" satisfies it.

3. **Review.** Dispatch the `adversarial-reviewer` agent with the spec path, the base git ref (or list of changed files), and the name of the section under review; tell it to read the spec's Goal, Approach, that section, and Out of Scope, skipping Chapters except deviations noted against the section (the full-changeset pass in finishing-work reads everything). If the section touched input handling, authentication/authorization, SQL construction, secrets/configuration, or an external boundary, also dispatch the `security-reviewer` agent. Dispatch both in parallel when both apply. For a genuinely trivial, self-contained section (a rename, a comment, a one-line fix with no logic change), the per-section review is optional - the finishing-work pass still covers it; spend review budget where there is real risk.

4. **Address findings.** Critical: must be fixed before the section closes. Major: fix, or record the justification for not fixing in the Chapter. Minor: note in the Chapter; fix only if trivial and in-scope.

5. **Update the plan doc.** Mark the section complete. If the implementation deviated from the spec, update the spec section to match reality and flag the deviation in the Chapter; if the deviation changes design intent, raise it to Daren rather than silently rewriting the spec.

6. **Append a Chapter** (format below).

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

**Write the dispatch prompt at dispatch time, from the actual current code.** Assume a skilled engineer with zero context for this codebase and questionable taste: exact file paths, the signatures and types they will touch, the conventions that apply (or which style skill to follow), what done looks like, what NOT to touch, and how to verify (build command, targeted tests, repro script) - the implementer runs that verification and reports the command output as evidence. Never point a subagent at the plan file to figure it out; curate exactly what the task needs.

**Model selection is capable-by-default.** A subagent runs the most capable model available unless ALL of these hold: the work is mechanical with no design judgment; the instructions are exhaustive; failure is cheaply detectable (build, tests, or the staged diff will catch it); and the blast radius is one or two files touching no shared contracts. When uncertain between two tiers, take the higher one; a wrong cheap-model attempt costs a re-dispatch plus review noise. Review and QA dispatches never downgrade - judgment is their product. When a subagent reports BLOCKED, escalate in order: more context, then a more capable model, then a smaller task, then Daren. Never re-dispatch the same prompt unchanged.

**Subagents stage, never commit.** Implementer subagents leave their work as staged changes, whatever the commit model. Commits happen only in the main session, after review.

## Context discipline

Delegation is the primary lever for keeping the orchestrator lean; the resets below are the fallback. Section boundaries are deliberate reset points: after a Chapter is written, the plan doc carries the full state by construction, so a fresh session is cheap there and recovers automatically via the SessionStart hook. When context usage is high (roughly 50%+) at a section boundary, suggest to Daren closing out and starting a fresh session instead of running toward auto-compaction. This is a suggestion, not a rule; sometimes keeping partial context beats a cold start, and that is Daren's call. Mid-section, prefer finishing the section and writing its Chapter before any reset.

## Chapter format

Append to the `## Chapters` section of the plan doc:

```markdown
### Chapter N - YYYY-MM-DD
Completed: <section name>
Decisions / Surprises: <anything resolved or discovered; "none" is acceptable>
Review Findings: <Critical/Major addressed; Majors justified; Minors noted>
Next: <next section, or "finishing-work">
Commit Model: <Review-Only | Branch-and-PR | Commit-and-Push>
```

Chapters exist so that a compacted or fresh session can recover full working state from the plan doc alone. Write them for that reader.

## When all sections are complete

Invoke the finishing-work skill. Do not declare the effort done without it.
