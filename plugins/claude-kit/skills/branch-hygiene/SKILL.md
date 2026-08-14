---
name: branch-hygiene
description: "Use when local branches or worktrees left over from Branch-and-PR efforts need cleaning up, or when the SessionStart branch-reaper nudge flags reapable or stranded branches. Symptoms: merged branches nobody swept, a branch whose remote is gone and whose work may or may not have landed, post-merge work that never reached the trunk, a squash-merge repo where the reap set comes back near-empty, leftover worktrees under .claude/worktrees/, too many local branches sitting around."
---

# Branch Hygiene

Local branches and worktrees from finished Branch-and-PR efforts pile up, because the merge lands on the platform after the session ends and finishing-work never reaches a teardown. This sweeps the ones whose work has already landed and leaves everything else alone. It removes only what it can verify is merged, and never force-deletes an unmerged branch or a dirty worktree.

Two conditions bring you here, and the SessionStart branch-reaper nudge flags both: **reapable** branches (merged in, safe to sweep) and **stranded** branches (the remote is gone because the PR merged, but the branch still holds commits that never reached the trunk). Stranded branches are a data-loss risk and take priority: recover them before sweeping anything. The nudge flags candidates, not conclusions, and stranding in particular has to be established by content rather than inferred from the shape of the history.

## The safe set

A local branch is auto-deleted only when it is **verified merged into the integration ref**, meaning it appears in `git branch --merged <integration-ref>`. That membership is the only auto-delete trigger there is. The integration ref is the first of `origin/develop`, `origin/main`, `origin/master` that exists (in most repos here that resolves to `origin/main`); regular merges leave a landed branch's tip reachable from it.

**`--merged` is a regular-merge test, and a squash-merge repo defeats it by construction.** A squash merge replays the branch's content as one new commit on the integration ref, so the branch's own commits are never ancestors of it and the branch never joins that set however completely its work landed. On a 41-branch fixture where 35 branches had landed, `--merged` returned the 5 that landed by regular merge and none of the 30 squash merges. So in a squash-merge repo a near-empty reap set is the expected result and not a sign that nothing landed, and the sweep alone will never shrink the backlog there. Resolve the rest by content, below.

A worktree is removed only when all three hold: it lives under `.claude/worktrees/` (Claude Code's managed worktrees), it sits on a reapable branch, and its working tree is clean.

Protected, never touched no matter what: `develop`, `main`, `master`, the current branch, and the repo's default branch (`origin/HEAD`).

## Procedure

1. `git fetch --prune`, so the integration ref and the remote-tracking refs are current. If the fetch fails or no integration ref resolves, stop and report; never delete on stale information. (When the branch-reaper nudge just ran, this is a fast no-op.)
2. Resolve the integration ref: the first of `origin/develop`, `origin/main`, `origin/master` that exists.
3. Compute the merged set with `git branch --merged <integration-ref>`, then drop the protected names and the current branch (the `*` line). What remains is verified merged.
4. For each merged branch, capture its tip SHA first (`git rev-parse <name>`), before anything is deleted, so the report can offer the restore command. If it has a worktree under `.claude/worktrees/` and that tree is clean (`git -C <path> status --porcelain` is empty), `git worktree remove <path>` without `--force`. Then `git branch -D <name>`, which is safe here precisely because the branch is verified merged into the integration ref.
5. Report in two parts:
   - **Reaped:** each branch and worktree removed, each with its restore line: `restore: git branch <name> <sha>`. Every removal gets one; a reaped branch's commits are already in the integration ref, so the SHA is all it takes to bring the label back.
   - **Left for you, with the reason:** everything outside the reap set, each with what is actually known about it. A gone upstream plus commits ahead of the integration ref is **undetermined**, not stranded: under squash merge that description fits every branch whose work landed in full, so on its own it says nothing either way. Report it as undetermined and run the content check below when you need it resolved, rather than picking one reading. **A branch the check clears is reported as verified landed, and that is its end state here:** the auto-delete trigger does not widen to cover it, so it is safe for Daren to delete and still not yours to sweep. In a squash-merge repo most of the backlog ends there, and naming it as verified rather than undetermined is the useful half of the output, even though the sweep itself still removes little. Also here: any unmerged branch, any dirty worktree, any reapable-looking worktree outside `.claude/worktrees/`. List them, delete none of them, and open no recovery PRs off this list.

   A restore line offered for anything outside the reap set carries a caveat the reaped ones do not. A reaped branch's tip stays reachable from the integration ref, so its restore line keeps working; a squash-landed branch's tip is reachable only through the local ref, so once that is deleted the line expires with the reflog. The content is safe in the integration ref either way, the original commits are not, and that is the difference to state when you hand one over.

## Recovering a stranded branch

A stranded branch holds commits the merged PR never carried to the trunk, which is exactly the post-merge doc work the kit keeps writing late. Establish that a branch is stranded before recovering it: re-landing work that already landed is not a harmless extra PR, because a cherry-pick onto a file the integration ref has since extended conflicts, and resolving that toward the branch drops what the integration ref added.

1. **Establish that the content is actually absent.** Two commonly-reached-for tests cannot do this. `git log --oneline <integration-ref>..<branch>` is non-empty for every squash-merged branch whose work landed in full, since a squash leaves the original commits unreachable, so a non-empty range is not evidence of anything. `git cherry` is wrong in both directions: it matches a single-commit branch against its squash commit but scores a multi-commit branch's commits as absent, because the squash commit's patch id is the union of theirs rather than equal to any one. Compare content instead:

   ```
   git diff <integration-ref> <branch>                                # A
   git diff $(git merge-base <integration-ref> <branch>)..<branch>    # B
   ```

   The branch's work is already in the integration ref when **A has no `+` lines and B has no `-` lines**. Read only the `+` lines of A: a `-` line there means the integration ref moved on since the branch forked, which says nothing about this branch, and on a branch that is far behind it will say it loudly. B is what makes A mean anything, because a branch whose whole contribution was a deletion satisfies A trivially while having landed nothing.

2. **A check that does not come back clean has not established stranding, only failed to rule it out.** It comes back unclean whenever the integration ref later edited a line the branch also touched, which is ordinary on any branch more than a few weeks old. Confirm on the platform that the PR merged and what it carried, or read the files. **If you cannot confirm either way, report it as undetermined and stop.** A branch left in place costs nothing; a recovery PR off a wrong guess costs review time and can regress the trunk.
3. **Branch fresh off the integration ref:** `git switch -c <branch>-recover --no-track <integration-ref>`. Never reuse the original: once its PR merged it is frozen, and pushing to it strands the work again. The two-step form `git switch <integration-ref> && git switch -c <branch>-recover` does not work, because `git switch` refuses a remote-tracking ref (`fatal: a branch is expected, got remote branch 'origin/develop'`) and the `&&` then skips the create. `--no-track` keeps the recovery branch from taking the integration ref as its upstream.
4. **Bring the commits over:** `git cherry-pick <integration-ref>..<branch>` for the range, or `git cherry-pick <sha>` per commit when the range picks up noise. A conflict here is a signal to stop and re-check step 1, not a merge to resolve: on a branch whose work landed, the conflicting side is usually what the integration ref added afterward.
5. **Push the recovery branch and open a new PR** against the integration branch. The merged-pr-push-guard allows this push (the recovery branch has no merged PR) and would have blocked a re-push to the original.
6. **Only then delete the frozen original.** A deletion cannot strand anything, so it is allowed once the commits are safely on the recovery branch, and ideally once that branch has merged.

## Hard rules

- The only auto-delete trigger is membership in `git branch --merged <integration-ref>`. Never `git branch -D` a branch outside that set.
- **"Upstream gone" alone is a report, not a delete.** A gone remote says the PR merged or someone deleted the branch; it says nothing about whether this branch's commits landed.
- **"Ahead of the integration ref" is not evidence of stranding**, and neither is the two together. Under squash merge every branch that landed is ahead of it and has a gone upstream. Establish stranding by content, or report it as undetermined and stop.
- Never `git worktree remove --force`. A dirty worktree is reported, never removed.
- Never touch `develop`, `main`, `master`, the current branch, or a worktree outside `.claude/worktrees/`.
- Every removal prints its restore line from the tip SHA captured before deletion. No SHA, no delete.

## Companion

To keep the remote side tidy too, enable "auto-delete head branch on merge" in the repo settings. In a regular-merge repo it is optional, since `--merged` is reliable there on its own. In a squash-merge repo it earns more: `--merged` cannot see a landed branch at all, so the gone upstream is most of what the branch-reaper nudge has to go on, and it is a prompt to check rather than a verdict.
