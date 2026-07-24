---
name: finishing-work
description: Completion pass for a finished effort. Use when all sections of a plan in docs/plans/ are implemented, or Daren says wrap up, finish, close out, or hand off. Runs QA verification, security review, documentation curation with drift report, a final adversarial review, and closes the plan per its commit model.
---

# Finishing Work

An effort is not done when the last section compiles. It is done when behavior is verified, security is reviewed, documentation matches reality, and the plan doc is closed. Run these steps in order; steps 2-4 may be dispatched in parallel after step 1 passes.

When per-section reviews already cleared parts of the changeset, tell the finishing reviewers what those passes covered and what has changed since, so they spend their budget on cross-section cohesion and on deltas rather than re-deep-reviewing unchanged, already-cleared code. Eliminate true duplication, not coverage. For a small effort that had no meaningful per-section reviews (a few files, one short pass), a single combined adversarial + security pass is enough; do not manufacture separate passes for a handful of files.

On a session running below Fable, dispatch the security review (step 2) and the final adversarial review (step 3) with the explicit `fable` model override by default: a fresh-eyes verdict from the strongest model over the whole changeset is the highest-leverage Fable spend an execution session makes, because it is the pass that judges the cohesion no per-section review could see. Two things pull it back to the session model. A recorded `Fable Spend: none (cost hold)` holds these two reviews at the session model along with the rest of the effort, while a header that only scopes which sections earn the fable mode leaves this default in force. And when Fable headroom is exhausted mid-close and Daren is not present to authorize metered spend, run both at the session model and flag the downgrade in the close-out Chapter, so a later Fable pass knows the changeset never had its strongest-model read. On a Fable-led session no override is needed; the reviewers inherit the session model. `qa-verifier` and `docs-curator` never ride this override either way: both are model-pinned by design, so steps 1 and 4 dispatch them as written.

## Steps

1. **QA verification.** Dispatch the `qa-verifier` agent with the spec path: full build, full test suite, and every acceptance criterion checked with evidence. Any FAIL: fix and re-run before proceeding. Do not rationalize a failing criterion as "close enough".

2. **Security review.** When the changeset has C#/.NET or T-SQL surface, dispatch the `security-reviewer` agent over the whole changeset (not just the last section). Critical findings block completion. Major findings: fix or present to Daren with the tradeoff. When the changeset is entirely outside that scope (the kit's own JS/shell/markdown, or any non-.NET project), do not dispatch `security-reviewer` against code it was not built to review; security folds into the adversarial pass (step 3), which carries non-.NET security defects in scope.

3. **Final adversarial review.** Dispatch the `adversarial-reviewer` agent over the entire changeset against the spec. Per-section reviews catch local issues; this pass catches cross-section cohesion problems, leftover debris (dead code, stale TODOs, orphaned files), and spec items that fell through the cracks.

4. **Documentation curation.** Dispatch the `docs-curator` agent with the spec path. It updates the project's docs/ from the as-built code and returns a Drift Report. **Present every drift item to Daren for adjudication; never silently reconcile.** Drift is signal: either the docs were wrong, the spec was wrong, or the implementation diverged from his mental model. He decides which.

   When the effort's deliverable is itself documentation - a docs or knowledge repo whose changed files are the prose, with no separate code layer beneath for the curator to reconcile against - the drift model has nothing to compare: spec, as-built, and docs are one artifact. Skip the curator here as step 2 skips security on a non-.NET changeset, and say so in close-out; the adversarial pass (step 3) already reviews the prose against the spec.

   The curator writes docs but does not stage or commit them (no Bash, by design); the orchestrator owns what happens to its output, because whether docs are committed is a per-repo decision. Honor a docs-commit stance recorded in the repo's CLAUDE.md: some repos never commit curator output, so run the curator for the Drift Report's signal, then leave the writes uncommitted and say so in close-out. Where the repo has no stated stance, ask before docs ride along in any commit rather than assuming. Where docs are committed, the orchestrator stages them so they appear in the review surface.

5. **Close the plan doc.** Set `Status: Complete`, append a final Chapter summarizing the effort, the review outcomes, and the drift adjudications.

6. **Apply the commit model:**
   - **Review-Only:** present a consolidated walkthrough: every changed file, what changed and why, organized by section, with a diff summary (staged changes are the review surface). Then stop; Daren reviews before anything is committed.
   - **Branch-and-PR:** verify the branch builds and tests green, push the feature branch, and open the pull request (title, summary of what changed by section, test evidence). Then present the options: merge, keep the branch for iteration, or discard. Never merge without Daren's explicit choice.
   - **Commit-and-Push:** final commit and push; report what was pushed.

7. **Bank the learnings.** Anything durable discovered during the effort (build quirks, conventions, gotchas, environmental facts) belongs in auto memory, not the plan doc. Save it now, while it is fresh.

8. **Kaizen check.** First make sure any kit friction from this effort (captured along the way, or a Chapter Surprise that traced to the kit) is in the kaizen inbox. Then offer a kaizen pass in one line only if the inbox has pending items; on a clean effort the inbox is empty and you say nothing. The predicate, not your read of the session, gates the offer.

## Post-close increments

Live use after `Status: Complete` often surfaces small follow-ons: a fix from real testing, a v1.1 refinement. Reopening the full finishing ceremony for each is too heavy, and improvising ad-hoc Chapters and reviews leaves you re-deciding the process every time. Run a defined post-close increment instead:

1. Implement the change per the executing-work section loop (delegate or main as its size warrants).
2. Scope the review to the delta: an adversarial pass over just the changed files, and a security pass only if the change touched a security surface. Skip the full-changeset re-review; the effort already had one.
3. Re-run QA only on the acceptance criteria the change could have affected, and append a Chapter marked as a post-close increment.
4. Apply the plan's commit model.

The plan stays `Status: Complete`; increments accumulate as Chapters beneath it. Escalate back to a full finishing pass only when an increment grows into a body of work in its own right - several sections, or a design change - at which point it is a new effort with its own spec, not an increment.
