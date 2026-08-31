---
name: finishing-work
description: Completion pass for a finished effort. Use when all sections of a plan in docs/plans/ are implemented, or the user says wrap up, finish, close out, or hand off. Runs QA verification, security review, documentation curation with drift report, a final adversarial review, and closes the plan per its commit model.
---

# Finishing Work

An effort is not done when the last section compiles. It is done when behavior is verified, security is reviewed, documentation matches reality, and the plan doc is closed. Run these steps in order; steps 2-4 may be dispatched in parallel after step 1 passes.

When per-section reviews already cleared parts of the changeset, tell the finishing reviewers what those passes covered and what has changed since, so they spend their budget on cross-section cohesion and on deltas rather than re-deep-reviewing unchanged, already-cleared code. `blind-reader` is exempt by name: what a pass covered is exactly the intent story its charter classes as contamination, so its dispatches carry only what the battery's brief names. Eliminate true duplication, not coverage. For a small effort that had no meaningful per-section reviews (a few files, one short pass), a single combined adversarial + security pass is enough; do not manufacture separate passes for a handful of files.

On a session running below Fable, dispatch the security review (step 2) and the final adversarial review (step 3) with the explicit `fable` model override by default: a fresh-eyes verdict from the strongest model over the whole changeset is the highest-leverage Fable spend an execution session makes, because it is the pass that judges the cohesion no per-section review could see. Two things pull it back to the session model. A recorded `Fable Spend: none (cost hold)` holds these two reviews at the session model along with the rest of the effort, while a header that only scopes which sections earn the fable mode leaves this default in force. **A header that is neither of those resolves to the session model, and you say so in the close-out Chapter rather than picking a reading.** The case that forced this: `none (no delegate-fable sections)`, which reads as no authorization and as a statement about sections at the same time, so an effort ran both reviews at the session model and its changeset never got a strongest-model read (2026-08-14). Metered Fable needs the user's explicit per-effort authorization, so an ambiguous header cannot supply it, and the conservative reading is the correct one; the Chapter note is what tells a later pass the read is missing. And when Fable headroom is exhausted mid-close and the user is not present to authorize metered spend, run both at the session model and flag the downgrade in the close-out Chapter, so a later Fable pass knows the changeset never had its strongest-model read. The `Fable Spend:` header authorizes that override; it does not say whether any Fable allowance is left. Read the Fable weekly percent before taking it, per `executing-work`'s ratchet rule, and where that window is at or above the kit's ratchet run both reviews at the session model and record the downgrade in the close-out Chapter with the percent and the reset instant, or the percent alone where no reset instant is available (the Fable window is the one observed publishing a percent with no usable reset instant, so that branch is not hypothetical). Where the feature is not enabled this does not apply and you do not run the command; where it is enabled but no reading comes back, proceed at the session model rather than blocking. On a Fable-led session no override is needed; the reviewers inherit the session model. `qa-verifier` and `docs-curator` never ride this override either way: both are model-pinned by design, so steps 1 and 4 dispatch them as written. `blind-reader` and `prose-reviewer` do not take it either: the default is scoped to the two reviews it names, so step 3's document battery dispatches both at the session model.

## Steps

1. **QA verification.** Dispatch the `qa-verifier` agent with the spec path, and with a named report path to poll any time the turn must stay alive, the same readiness convention `executing-work`'s dispatches use: full build, full test suite, and every acceptance criterion checked with evidence. Any FAIL: fix and re-run before proceeding. Do not rationalize a failing criterion as "close enough".

2. **Security review.** When the changeset touches production code of any kind, dispatch the `security-reviewer` agent over the whole changeset (not just the last section). C#/.NET and T-SQL are its depth, not its boundary: hooks, setup and CLI scripts, JS/Node, and configuration are review targets too, so a changeset of the kit's own hooks earns the pass. Critical findings block completion. Major findings: fix or present to the user with the tradeoff. Skip the dispatch only when the changeset has no production-code surface at all (plan docs, skills, agent prose, README and other documentation); there the adversarial pass (step 3) is the whole security read, and it flags anything security-relevant on sight.

3. **Final adversarial review.** Dispatch the `adversarial-reviewer` agent over the entire changeset against the spec. Per-section reviews catch local issues; this pass catches cross-section cohesion problems, leftover debris (dead code, stale TODOs, orphaned files), and spec items that fell through the cracks.

   **Where the effort shipped a document for a named reader, the document review battery runs
   here too, over every such document at once.** The trigger is the same one executing-work uses,
   an `Audience:` line on the section that produced it; the reason is whole-effort cohesion,
   since a document that read cleanly on its own may contradict a sibling written three sections
   later, and only a whole-effort pass sees that. The per-section Document Review Brief does not
   stretch to this pass, because five of its fields are per-section by construction, so build
   the close-out brief from the plan doc instead, giving every field the charters' Inputs name a
   whole-effort source:
   - `blind-reader`: one dispatch per pairing of a persona with the document set written for it,
     the documents whose sections named that persona in their `Audience:` line. Name the pairing
     explicitly in each dispatch: a blind reader cannot infer it, and a persona handed a document
     never written for it files real comprehension gaps against a correct document.
   - `prose-reviewer`: one dispatch over the full document set, kept whole so cross-document
     inconsistency stays visible to a single head. The spec path is the plan doc, and the
     document paths are the full set. `Audience:` is the union of the sections' `Audience:`
     lines, each persona at its stated knowledge level. The must-answer questions are the
     union of the sections' `Must answer:` lines per persona, each question naming its source
     section. The fact-base paths are the union of the sections' `Fact base:` lines.
     `Disclosure:` is the union of the sections' `Disclosure:` lists; where no section carried
     one, no list rides, and the reviewer's report states that the disclosure lens did not run.
     The catalog path rides exactly as in the per-section brief, resolved and confirmed readable
     the same way. `Style authority:` is stated per document, at the value the document's own
     section recorded, and the charter applies its ladder document by document; where sections
     left one document with conflicting values, relay `none` for that document and name the
     conflict beside it, because `none` is a value whose behavior the charter defines (the lens
     does not run there and the report says so) rather than a wording it has no rule to parse.
   Dispatch both in the same message as the reviews above. An effort that shipped no such
   document skips this and says so in the close-out Chapter, the same as any other skipped gate.

4. **Documentation curation.** Dispatch the `docs-curator` agent with the spec path. It updates the project's docs/ from the as-built code and returns a Drift Report. **Present every drift item to the user for adjudication; never silently reconcile.** Drift is signal: either the docs were wrong, the spec was wrong, or the implementation diverged from their mental model. The user decides which.

   Class each item before you present it, and present the class with it. A **likely mistake** is drift where the implementation contradicts what the spec intended: it stops the close, and the user makes the call before the remaining steps run. A **deliberate deviation** is a choice already made and recorded in a Chapter with its trade-off: it rides into the final Chapter and the PR record as a decision, so the reader of the history sees why the code and the original intent differ. The classing sharpens the presentation, it never shortens it: every item still reaches the user, and neither class is ever reconciled silently.

   When the effort's deliverable is itself documentation - a docs or knowledge repo whose changed files are the prose, with no separate code layer beneath for the curator to reconcile against - the drift model has nothing to compare: spec, as-built, and docs are one artifact. Skip the curator here as step 2 skips security on an all-prose changeset, and say so in close-out; the adversarial pass (step 3) already reviews the prose against the spec.

   The curator writes docs but does not stage or commit them (no Bash, by design); the orchestrator owns what happens to its output, because whether docs are committed is a per-repo decision. Honor a docs-commit stance recorded in the repo's CLAUDE.md: some repos never commit curator output, so run the curator for the Drift Report's signal, then leave the writes uncommitted and say so in close-out. Where the repo has no stated stance, ask before docs ride along in any commit rather than assuming. Where docs are committed, the orchestrator stages them so they appear in the review surface.

5. **Close the plan doc.** Set `Status: Complete`, append a final Chapter summarizing the effort, the review outcomes, and the drift adjudications. Closing includes the `curating-docs` close path in this same close-out: archive the plan to `docs/archive/`, cross-reference, prune the backlog, and refresh the index.

6. **Apply the commit model:**
   - **Review-Only:** present a consolidated walkthrough: every changed file, what changed and why, organized by section, with a diff summary (staged changes are the review surface). Then stop; the user reviews before anything is committed.
   - **Branch-and-PR:** verify the branch builds and tests green, push the feature branch, and open the pull request (title, summary of what changed by section, test evidence). **Probe the PR tool for capability, not presence, and never let the probe be what fails.** On a GitHub remote `gh auth status` settles it and `which gh` does not: an installed but unauthenticated gh passes the presence check and then fails the create, which was the live state of this machine on 2026-08-27. Authenticated, open the PR with gh. Absent or unauthenticated, push the branch and hand over the compare URL git prints on push (`https://github.com/<owner>/<repo>/pull/new/<branch>`) with the title and body ready to paste, or ask permission to merge locally. An Azure DevOps remote takes the DevOps connector or `az repos pr create` on the same footing. **Name which rung you landed on.** An effort reported as finished when no PR was opened is the failure this ladder exists to prevent, and it costs nothing to say. Then present the options: merge, keep the branch for iteration, or discard. Never merge without the user's explicit choice.
     - **Commit the records before the PR goes up.** Every record this change needs is in the branch first: the closed plan doc with its final Chapter, the archive move, the backlog prune, the index refresh. Documentation ships in the same PR as the code, never as a follow-up PR. The `pr-docs-guard` hook mechanizes it by blocking a `pr create` while `docs/` is dirty.
     - **Strand-check after the merge.** Run `git log origin/<integration>..origin/<branch>`. Anything it lists is work the merge never carried to the trunk; recovering it is the `branch-hygiene` skill's job, not a re-push. And know the shape of the trap: once the PR is up, a later push to that branch strands the moment the merge lands, so a post-merge follow-up goes on a new branch with its own PR rather than onto the merged one (the `merged-pr-push-guard` hook blocks that push).
   - **Commit-and-Push:** final commit and push; report what was pushed.

7. **Bank the learnings.** Anything durable discovered during the effort (build quirks, conventions, gotchas, environmental facts) belongs in memory, not the plan doc. Save it now, while it is fresh. "Memory" is three destinations, not one, so name which one as you save each: this project's native auto-memory; the kit-owned cross-project tier, created with the CLI at `<plugin>/hooks/memory.js` and never the Write tool; or the kit's recommended global rules for a recurring working preference, which is doctrine rather than a fact and is written by editing `assets/CLAUDE.md` in the kit repo (unreachable from another project, so record it as owed instead). The cross-project-memory skill carries the test for which.

8. **Kaizen check.** First make sure any kit friction from this effort (captured along the way, or a Chapter Surprise that traced to the kit) is in the kaizen inbox. Then offer a kaizen pass in one line only if the inbox has pending items; on a clean effort the inbox is empty and you say nothing. The predicate, not your read of the session, gates the offer.

## Post-close increments

Live use after `Status: Complete` often surfaces small follow-ons: a fix from real testing, a v1.1 refinement. Reopening the full finishing ceremony for each is too heavy, and improvising ad-hoc Chapters and reviews leaves you re-deciding the process every time. Run a defined post-close increment instead:

1. Implement the change per the executing-work section loop (delegate or main as its size warrants).
2. Scope the review to the delta: an adversarial pass over just the changed files, and a security pass only if the change touched a security surface. Skip the full-changeset re-review; the effort already had one.
3. Re-run QA only on the acceptance criteria the change could have affected, and append a Chapter marked as a post-close increment. The plan is in `docs/archive/` by now, and that is where the Chapter goes: appending it there is sanctioned (curating-docs, Register a new plan), not the archived-plan edit that skill prohibits.
4. Apply the plan's commit model.

The plan stays `Status: Complete`; increments accumulate as Chapters beneath it. Escalate back to a full finishing pass only when an increment grows into a body of work in its own right - several sections, or a design change - at which point it is a new effort with its own spec, not an increment.
