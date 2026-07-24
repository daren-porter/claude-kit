---
name: branch-hygiene
description: "Use when local branches or worktrees left over from Branch-and-PR efforts need cleaning up, or when the SessionStart branch-reaper nudge flags reapable or stranded branches. Symptoms: merged branches nobody swept, a branch whose remote is gone that still holds commits, post-merge work that never reached the trunk, leftover worktrees under .claude/worktrees/, too many local branches sitting around."
---

# Branch Hygiene

Local branches and worktrees from finished Branch-and-PR efforts pile up, because the merge lands on the platform after the session ends and finishing-work never reaches a teardown. This sweeps the ones whose work has already landed and leaves everything else alone. It removes only what it can verify is merged, and never force-deletes an unmerged branch or a dirty worktree.

Two conditions bring you here, and the SessionStart branch-reaper nudge flags both: **reapable** branches (merged in, safe to sweep) and **stranded** branches (the remote is gone because the PR merged, but the branch still holds commits that never reached the trunk). Stranded branches are a data-loss risk and take priority: recover them before sweeping anything.

## The safe set

A local branch is auto-deleted only when it is **verified merged into the integration ref**, meaning it appears in `git branch --merged <integration-ref>`. That membership is the only auto-delete trigger there is. The integration ref is the first of `origin/develop`, `origin/main`, `origin/master` that exists (in most repos here that resolves to `origin/main`); regular merges leave a landed branch's tip reachable from it.

A worktree is removed only when all three hold: it lives under `.claude/worktrees/` (Claude Code's managed worktrees), it sits on a reapable branch, and its working tree is clean.

Protected, never touched no matter what: `develop`, `main`, `master`, the current branch, and the repo's default branch (`origin/HEAD`).

## Procedure

1. `git fetch --prune`, so the integration ref and the remote-tracking refs are current. If the fetch fails or no integration ref resolves, stop and report; never delete on stale information. (When the branch-reaper nudge just ran, this is a fast no-op.)
2. Resolve the integration ref: the first of `origin/develop`, `origin/main`, `origin/master` that exists.
3. Compute the merged set with `git branch --merged <integration-ref>`, then drop the protected names and the current branch (the `*` line). What remains is verified merged.
4. For each merged branch, capture its tip SHA first (`git rev-parse <name>`), before anything is deleted, so the report can offer the restore command. If it has a worktree under `.claude/worktrees/` and that tree is clean (`git -C <path> status --porcelain` is empty), `git worktree remove <path>` without `--force`. Then `git branch -D <name>`, which is safe here precisely because the branch is verified merged into the integration ref.
5. Report in two parts:
   - **Reaped:** each branch and worktree removed, each with its restore line: `restore: git branch <name> <sha>`. Every removal gets one; a reaped branch's commits are already in the integration ref, so the SHA is all it takes to bring the label back.
   - **Left for you, with the reason:** a branch whose upstream is gone but that is not merged into the integration ref (squash-merged elsewhere, or abandoned, your call); a branch ahead of the integration ref whose PR has already merged (likely stranded, recover it below); any unmerged branch; any dirty worktree; any reapable-looking worktree outside `.claude/worktrees/`. List them, do not delete them.

## Recovering a stranded branch

A stranded branch holds commits the merged PR never carried to the trunk, which is exactly the post-merge doc work the kit keeps writing late. Recover before deleting:

1. **Confirm the stranded commits:** `git log --oneline <integration-ref>..<branch>`. These are the ones at risk. An empty result means nothing is stranded and the branch is just unmerged history.
2. **Branch fresh off the integration ref:** `git switch <integration-ref> && git switch -c <branch>-recover`. Never reuse the original: once its PR merged it is frozen, and pushing to it strands the work again.
3. **Bring the commits over:** `git cherry-pick <integration-ref>..<branch>` for the range, or `git cherry-pick <sha>` per commit when the range picks up noise.
4. **Push the recovery branch and open a new PR** against the integration branch. The merged-pr-push-guard allows this push (the recovery branch has no merged PR) and would have blocked a re-push to the original.
5. **Only then delete the frozen original.** A deletion cannot strand anything, so it is allowed once the commits are safely on the recovery branch, and ideally once that branch has merged.

## Hard rules

- The only auto-delete trigger is membership in `git branch --merged <integration-ref>`. Never `git branch -D` a branch outside that set.
- **"Upstream gone" alone is a report, not a delete.** A gone remote says the PR merged or someone deleted the branch; it says nothing about whether this branch's commits landed.
- Never `git worktree remove --force`. A dirty worktree is reported, never removed.
- Never touch `develop`, `main`, `master`, the current branch, or a worktree outside `.claude/worktrees/`.
- Every removal prints its restore line from the tip SHA captured before deletion. No SHA, no delete.

## Companion

To keep the remote side tidy too, enable "auto-delete head branch on merge" in the repo settings. It is optional (regular merges make `--merged` reliable on its own), but it removes merged remote branches and gives the branch-reaper nudge a second signal.
