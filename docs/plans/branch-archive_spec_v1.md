# Branch Archive Before Delete

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-14

## Why this exists

A kaizen note (2026-08-14) asked for three things in `branch-hygiene`. Two were
settled in the pass that followed, and this one was not. The note proposed a
patch-id (`git cherry`) path and a PR-grep path for telling a squash-merged branch
from a stranded one; both were measured and neither works, and the skill now uses a
content comparison instead. Its third ask, a **tag-archive-then-delete step**, is a
new capability rather than a correction, so it was left out of a fix whose whole
scope was retracting false statements. This stub parks it; it needs a design pass
before execution.

## The finding that motivates it

The pass turned up the fact that makes this worth considering, and it is not the one
the note had in mind. **A restore line is not equally durable across the two kinds of
branch the sweep hands back.**

- A **reaped** branch is in `git branch --merged`, so its tip is an ancestor of the
  integration ref. The SHA stays reachable forever and `git branch <name> <sha>`
  keeps working indefinitely.
- A **squash-landed** branch's tip is reachable only through the local ref, because a
  squash merge replays the content as a new commit and never carries the original
  commits onto the trunk. Delete that ref and the commits become unreachable and
  expire with the reflog, default 90 days.

`branch-hygiene` now states this caveat where it hands a branch back, which is
honest but passive: it tells you the restore line will rot rather than stopping the
rot. In a squash-merge repo the second category is most of the backlog, which is
exactly where the sweep is least able to help today.

## What is undefined (the first design work)

- **Is it worth building at all?** This is the first question, not a formality. The
  *content* of a squash-landed branch is permanently safe in the integration ref;
  only the original commit sequence is at risk, and 90 days is a long window in
  which to notice. A standing archive mechanism must beat "delete it, and accept
  that the granular history of already-landed work is not worth keeping." That may
  well be the right answer.
- **What is worth preserving, if anything?** The commit sequence, the authorship and
  dates, the branch name as a label on the squash commit, or nothing beyond a list
  of SHAs written into the sweep report.
- **What is the mechanism?** A real tag (`archive/<branch>`) ships the objects to
  anyone who fetches tags and grows the ref namespace permanently. A local-only
  tag, a `refs/archive/*` namespace, a bundle file, or a written record in the
  report each trade durability against clutter differently.
- **When does an archive expire?** An archive with no pruning story is a leak that
  looks tidy. If a tag is created per swept branch, something has to retire them, or
  the namespace becomes the new backlog.
- **Whose call is it?** Automatic on every delete, offered per branch, or opt-in per
  repo. The kit's existing posture is that the sweep deletes only what it can verify
  and reports the rest, so an automatic archive of things it declined to delete
  would be a departure.

## Starting point

Decide the worth question before the mechanism question. Concretely: find a case
where someone actually wanted the original commits of a squash-landed branch after
deleting it. If that case does not exist, the honest outcome is to close this stub
Abandoned and leave `branch-hygiene`'s caveat sentence as the whole answer, which
costs nothing and already tells the truth.

## Related

- `plugins/claude-kit/skills/branch-hygiene/SKILL.md` - the sweep this would extend,
  and the source of the reachability asymmetry above.

## Chapters

(none yet - Proposed)
