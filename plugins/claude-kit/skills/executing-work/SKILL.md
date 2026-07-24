---
name: executing-work
description: Autonomous execution of an approved spec or plan from docs/plans/. Use when Daren says to proceed, implement, build, or continue an agreed plan, or when resuming a session that has an In Progress plan doc. Works section by section with adversarial subagent review and Chapter checkpoints, without per-step permission seeking.
---

# Executing Work

The contract: once the spec is approved, proceed autonomously to completion. No per-step check-ins, no "shall I continue?", no gating individual edits. The spec is the agreement; execute it.

Interrupt Daren only for: a contradiction inside the spec, a decision the spec does not cover with material consequences, destructive/irreversible actions, an external dependency only he can satisfy (a credential, a GUI action, a resource to provision), or a debugging dead end reached per the systematic-debugging skill's stop-and-report rules. Everything else is yours to resolve and record. This list and the completion contract's blocker set below are the same list.

## The completion contract

The spec is the goal. Once execution starts, run every remaining unblocked section to completion in this session. A section boundary is not a stopping point. A running build or test gate is not a stopping point. Context pressure is not a stopping point. An awaited subagent is not a stopping point. The only reason to stop mid-spec is a true blocker, and when you hit one you make it impossible to miss. This is the rule that fails most often under the pressure of a long run, so it is stated as a hard prohibition, not a preference.

**Do not end your turn** to:

- report progress between sections ("section 3 done, say the word and start section 4"). Close the section and start the next.
- wait on a build or test gate ("holding for the gate, ~2 min"). Wait on it in-turn: background it and poll a readiness signal (the Monitor tool with an until-condition on a marker file or exit code; foreground sleeps are blocked by the harness), then continue when it returns.
- manage context ("pausing here rather than open section 7 at the tail of a long run"). Summarization is native and automatic, and when to start a fresh session is Daren's call per Context discipline below, never your reason to halt.
- await a dispatched subagent ("holding while the implementer builds section 3"). A background agent (`run_in_background: true`, the Agent-tool default) ends your turn to await its completion notification, and under an armed leash that turn-end is a stop the hook blocks. A wait is not a stop here either: keep the turn alive. Dispatch the critical-path implementer synchronously (`run_in_background: false`) so its whole run is one in-turn call; for a genuine parallel fan-out, poll the agents' output files in-turn exactly as you would a build gate. Never end the turn on a completion notification while a leash is armed, and never clear the leash to escape the block: that abandons the continuity the leash exists to hold.

Rationalization table (the excuse, and why it is wrong):

| The excuse | Why it is wrong |
|---|---|
| "This is a clean boundary to pause at." | Clean boundaries are for resuming, not for stopping with work left. Continue. |
| "Holding for the gate." | A wait is not a stop. Poll the gate in-turn and continue. |
| "It is the tail of a long run, safer to stop." | The Chapter plus the SessionStart resume hook protect you. A fresh session is Daren's call, not a stop condition. |
| "Let me confirm before continuing." | The approved spec is the confirmation. Continue unless a true blocker hits. |
| "I'll end the turn to await the dispatched agent's notification." | Awaiting is a wait, and a wait is not a stop. Dispatch synchronously (`run_in_background: false`) or poll in-turn; do not end the turn, and do not clear the leash to get out of the block. |

Red flags that you are about to stop wrongly: "say the word and continue", "holding for", "paused here", "at the tail of", "ready to continue when you are", "holding while the agent builds", "awaiting the notification". If you are about to write one of these with unblocked work remaining, do not. Keep going.

**Stop only for a true blocker, and make it loud.** The blocker set:

- an external dependency only Daren can satisfy (a GUI action, a cloud resource that must be provisioned, a credential or secret you cannot reach),
- a contradiction inside the spec, or a material decision the spec does not cover,
- a destructive or irreversible action that needs his yes,
- a systematic-debugging dead end.

When you stop, the message's very first characters are `BLOCKED: <exactly what you need>`, so Daren sees it in seconds rather than discovering a silent halt hours later. The bare prefix opens the message: no close-out summary above it, no bold or heading wrapping it; any shipped-work recap goes after the BLOCKED paragraph. The `/kit-goal` Stop hook releases only on that exact leading prefix and deliberately ignores a `BLOCKED:` sitting mid-message (quoting the convention must never release the leash), so a summary-first stop bounces and costs an extra turn. A progress update is not a stop and must not be written as one.

**Arming is optional, and it is Daren's.** `/kit-goal docs/plans/<plan>.md` arms a deterministic project-scoped leash on a plan run; the kit-goal skill owns that mechanism and its canonical condition. The hook is a backstop, not the mechanism: this contract holds leash or no leash, and arming stays Daren's explicit act.

**Handoff.** When execution begins inside a conversation that was just brainstorming, say so in one line ("Spec approved, switching to autonomous execution of all N sections") so Daren sees the mode change and can scope it down ("just section 1") if he wants. One exception: on a Fable-led session, the session-model doctrine (Delegating to subagents) makes that switch a handoff instead of an in-place continuation: write the spec, announce the handoff, and execution runs in an Opus-led session.

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

1. **Confirm the approach against the real code, then implement.** Before writing a section whose mechanism the spec assumed without reading the code, do a quick in-session read of the files it touches and confirm the planned approach actually holds - specs written during brainstorming can be fictional about code nobody had open yet. This is a lightweight read, not a subagent fan-out. If the real shape differs materially, adjust and note it in the Chapter (raise to Daren only if it changes design intent). Then implement per the section's recorded execution mode (main in this session, or delegate-fable / delegate-capable / delegate-mechanical to the matching implementer agent; see below) - following the csharp-style and sql-style skills and each skill's stated precedence rule (repo-stated rules - CLAUDE.md, style docs, `.editorconfig` - always win first; the skills state the rest, and they differ on sibling-matching). Surgical changes only; touch what the section requires.

2. **Verify with evidence.** Build must pass; run targeted tests. Claims of "done" or "passing" require the command output that proves it. For delegated work, the implementer produces that evidence per its dispatch prompt; the orchestrator reads the staged diff and spot-checks the reported evidence rather than re-running everything (re-run anything that looks off). For main-session work, run it directly. Then settle the test question (set at dispatch for delegated work; confirmed here): did the change earn a durable test? If the behavior is worth locking against regression (a business rule, an edge case, a bug that could recur), leave a retained test and show it passing - and where practical, watch it fail first, so you know it tests the right thing. If it genuinely did not (throwaway exploration, pure plumbing, a change no test could meaningfully pin), say so and why. The judgment is csharp-style's "tests earn their place", not a coverage number; a temporary repro script is for debugging a fix, not the default home for new behavior. Never mark a criterion met because the code "obviously" satisfies it.

3. **Review.** Dispatch the `adversarial-reviewer` agent with the spec path, the base git ref (or list of changed files), and the name of the section under review; tell it to read the spec's Goal, Approach, that section, and Out of Scope, skipping Chapters except deviations noted against the section (the full-changeset pass in finishing-work reads everything). If the section touched input handling, authentication/authorization, SQL construction, secrets/configuration, or an external boundary, also dispatch the `security-reviewer` agent. Dispatch both in parallel when both apply. Never pre-judge the review: do not tell a reviewer what to flag, what to ignore, or how to rate a finding ("treat as Minor at most", "the plan chose this"). Pre-rating findings in the dispatch defeats the review; let the reviewer surface it and adjudicate per responding-to-review. For a genuinely trivial, self-contained section (a rename, a comment, a one-line fix with no logic change), the per-section review is optional - the finishing-work pass still covers it; spend review budget where there is real risk.

4. **Address findings.** Critical: must be fixed before the section closes. Major: fix, or record the justification for not fixing in the Chapter. Minor: note in the Chapter; fix only if trivial and in-scope. **The recurrence rule:** when a review surfaces a finding of the same class an earlier section's review already surfaced (same defect pattern, different site), do not just fix the new instance: amend a `Standing Brief Amendments` block in the plan doc, which step 1's dispatches fold into every later brief, so every later implementer inherits the guard, and record the amendment in the Chapter. Two instances of a finding class means the workflow is generating the bug, so fix the generator, not only the output.

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

**Write the dispatch prompt at dispatch time, from the actual current code.** Assume a skilled engineer with zero context for this codebase and questionable taste: exact file paths, the signatures and types they will touch, the conventions that apply (or which style skill to follow), what done looks like, whether the change earns a durable test and what behavior that test should lock down, the sibling pattern to mirror when one already handles the failure mode (name it AND require mirrored failure-mode breadth, catch scope and regex generality included, since a generalization gap is what produces a first-round Major), the pin tests and their new expected values when the section changes a counted cross-cutting set (a DI registration, a role grant, anything an exact-count or exact-set pin test enumerates), every entry from the plan doc's `Standing Brief Amendments` block when one exists, what NOT to touch, and how to verify (build command, targeted tests, repro script) - the implementer runs that verification and reports the command output as evidence. Mark every load-bearing technical assertion in the brief confirmed or inferred: a confirmed one names its evidence (file:line, or the command you ran), an inferred one says so and says to verify it before relying on it. An unmarked assertion reads as settled fact and gets obeyed instead of checked, which is how a wrong premise in a brief becomes a wrong implementation that passes its own gate. State the workaround bar too: a workaround that needs a paragraph to justify means fix the code or escalate. Never point a subagent at the plan file to figure it out; curate exactly what the task needs.

**A hand-authored code block plus "match this exactly" silently outranks "follow skill X."** A concrete example in a dispatch prompt beats any abstract "follow csharp-style" instruction the prompt also carries: the implementer mimics what it sees over what it is told. So any code you hand over must itself already conform to the style skill; never pair non-conformant example code with "match it exactly". When you cannot vouch for a snippet's conformance, name the skill and let the implementer produce the code, rather than anchoring it to a flawed example.

**Hand artifacts over as files.** Everything pasted into a dispatch prompt, and everything a subagent prints back inline, stays resident in the orchestrator's context and re-bills on every later turn - the same tax delegation exists to avoid. Hand bulky inputs over as file paths (the spec, a diff captured with `git diff > path`, the interfaces a prior task produced), and tell the implementer to write its full report to a named file and return only its status, the commits or staged files, and a one-line evidence summary. The orchestrator reads the staged diff and the report file rather than absorbing a pasted dump. A reviewer is different: its product is the severity-ranked findings the orchestrator must read to adjudicate, so let it return those inline by default. Send a reviewer's report to a file only for a whole-changeset finishing pass large enough that the inline dump would re-bill every later turn; a per-section review's few findings are cheaper inline than round-tripped through disk. No scripts needed; the git commands and a file path do it.

**Execution mode is chosen per section, capable by default.** Each Section of Work carries an execution mode, assigned at plan time and recorded in the spec: **main**, **delegate-fable**, **delegate-capable**, or **delegate-mechanical**. **main** is the keep-in-session work above (design-entangled, tiny, or session-state-dependent); it runs in the orchestrator session on whatever model you have selected, never tied to a model name - Opus today, Fable whenever you pick it. The delegated modes dispatch the matching agent: **delegate-fable** to `implementer-fable`, **delegate-capable** to `implementer-opus`, **delegate-mechanical** to `implementer-sonnet`. `implementer-fable` carries no model pin: it inherits the session model, so a Fable-led session gets Fable for free, while a below-fable session carries the explicit fable model override on the dispatch. Capable is the default for delegated work. Reach for fable when the section needs the strongest model and is still briefable (novel logic, a security-sensitive surface, subtle or cross-cutting correctness inside a settled design), and assign mechanical only when ALL hold: the work is mechanical with no design judgment, the instructions are exhaustive, failure is cheaply detectable (build, tests, or the staged diff catches it), and the blast radius is one or two files touching no shared contracts. When uncertain between two modes, take the higher one. Review and QA dispatches never downgrade - judgment is their product. Handle the implementer's status: NEEDS_CONTEXT - supply the missing context and re-dispatch at the same mode; BLOCKED - fix the environment and re-dispatch. The escalation ladder: a delegated section that fails review twice with Critical findings, or returns the same NEEDS_CONTEXT twice, escalates one mode (mechanical to capable, capable to fable), with the failed attempt's report and the review findings riding in the escalated brief so the next mode does not rediscover them. A section escalated into delegate-fable gets exactly one dispatch there; if that attempt also fails review, raise the stall to Daren - the two-round allowance belongs to sections the spec assigned fable, never to escalatees. A section the spec assigned **delegate-fable** that fails twice has exhausted its mode: on a Fable-led session, take it into the main thread; on a lower-model session, raise the stall to Daren rather than absorbing it into a weaker main thread. Under a recorded cost hold, stay at the session model and raise the stall to Daren. Never a third dispatch at the same mode unchanged, and never downgrade mid-effort. Repeated escalations mean the section was under-specified - a brainstorming lesson worth a kaizen note, not an implementer failure.

**The session model is the mode.** A Fable-led session is for design: brainstorming, specs, adjudication, and the finishing pass of a high-stakes effort. An Opus-led session executes approved specs. A Fable-led session asked to execute a spec hands it off to an execution session rather than absorbing it, because the meter runs on every call of the session that follows, not on the plan's size - "this one is small" describes the plan, not the cost. Fable enters execution at exactly three moments, each by an explicit `model` override on the dispatch: a **delegate-fable** section (the approved spec's mode assignment is the standing authorization, and the spec's `Fable Spend:` header is the visibility surface; a spec predating that header stays authorized by its assignments and gains the header the first time you touch it), the escalation ladder just above, and finishing-work's reviews (that skill owns the details). The spend wall: Fable's plan-included allotment is the budget, and crossing into metered Fable takes Daren's explicit authorization for that specific effort, recorded in the `Fable Spend:` header, never a silent judgment call. When Fable headroom runs out mid-effort and Daren is not present to authorize the crossing, downgrade the dispatch to the session model and flag the downgrade in the Chapter, so a later Fable pass knows where to look. `Fable Spend: none (cost hold)` holds the whole effort at the session model. Opus and below are plan-covered and carry no wall.

**An implementer can finish with concerns.** Besides DONE and BLOCKED, accept DONE_WITH_CONCERNS: the work is complete but the implementer flagged a doubt - a scope question, a shape it disliked, a risk it could not resolve. Read the concern before you review: resolve a correctness or scope concern yourself or hand it to the reviewer as a question to check (not a pre-rated finding); record a bare observation ("this file is getting large") in the Chapter. A flagged concern never disappears silently into a DONE.

**Subagents stage, never commit.** Implementer subagents leave their work as staged changes, whatever the commit model. Commits happen only in the main session, after review.

**Band read-only recon by question shape.** A closed fact-check (does this file contain X, confirm this value, which overload is actually called) rides the harness's default scout model (dispatch with no model override): a scout's leads are confirmed before anyone designs on them, so a wrong answer surfaces itself. Open discovery (map this surface, find every call site) gets an explicit `sonnet` override, because the failure confirmation cannot catch is the miss. Top-model recon is pure burn. Either way the dispatch states its return contract: file:line leads with a one-sentence fact each, never pasted file contents. And a "simple check" that comes back with more than a couple of leads was mis-banded; re-run it as discovery.

## The advisor

An Opus advisor (`/advisor opus`, set by Daren, persisting in settings) is a standing experiment on execution sessions, not doctrine. Its main value is inheritance: the below-opus subagents this session dispatches pick it up, so the cheaper modes get an Opus check at their own decision points. Treat it as absent until consultations are observed succeeding - the source kit's advisor never successfully answered one in its measured corpus, so ours starts unproven. It never substitutes for NEEDS_CONTEXT (consulting an advisor does not transfer the authority to decide) and never for the fresh-context reviewers (it shares the session's conversation, and therefore its blind spots). Record the advisor state in each Chapter's Metrics line.

## Context discipline

Delegation is the primary lever for keeping the orchestrator lean. Section boundaries are clean recovery points by construction: after a Chapter is written, the plan doc carries the full state, so a fresh session resumes from it automatically via the SessionStart hook with nothing lost. Mid-section, prefer finishing the section and writing its Chapter before any reset, so the recovery point is a real boundary. When to start that fresh session is Daren's call, not a context-usage threshold you try to estimate.

## Chapter format

Append to the `## Chapters` section of the plan doc:

```markdown
### Chapter N - YYYY-MM-DD
Completed: <section name>
Implemented By: <main session | implementer-sonnet | implementer-opus | implementer-fable, plus any escalation>
Metrics: <review rounds; NEEDS_CONTEXT count; escalations; advisor <state or off>>
Decisions / Surprises: <anything resolved or discovered; "none" is acceptable>
Review Findings: <Critical/Major addressed; Majors justified; Minors noted>
Next: <next section, or "finishing-work">
Commit Model: <Review-Only | Branch-and-PR | Commit-and-Push>
```

Chapters exist so that a compacted or fresh session can recover full working state from the plan doc alone. Write them for that reader. The Metrics line is the data feed for the kit's open experiments (the mode-band and advisor questions), so record it even when every count is zero.

## When all sections are complete

Invoke the finishing-work skill. Do not declare the effort done without it.
