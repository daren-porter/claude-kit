# Kit Adoption Pass

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-07

## Related

- `archive/claude-kit_spec_v3.md` and `archive/kit-goal-port_spec_v1.md` are the two
  prior instances of the pass this stub wants to make a skill. Both were improvised,
  both delivered on the `kit-adoptions` branch, and between them they hold the
  standing decisions and the adjudication criterion a future pass should not have to
  re-derive.

## Why this exists

A kaizen note (2026-08-07) captured Daren's capability wish: no skill owns the
recurring pass of examining Scott Applefeld's kit for anything worth pulling into
this one. claude-kit is a personalized fork of his (`README.md:5`), he and Daren
compare kits periodically, and the pass has been improvised every time it has run.
This stub parks the wish; it needs a design pass before execution.

Source of truth: `SApplefeld/sapplefeld-claude-kit`, cloned locally at
`~/repos/sapplefeld-claude-kit`.

## Scope boundary

**Inbound only.** Daren is explicit that pushing this kit's work back to Scott is out
of scope, so the skill has no outbound half and no packaging step.

Superpowers (`obra/superpowers`) is a **secondary** inbound source: still live, pulled
from less often, no local clone, and the ancestor of `archive/claude-kit_spec_v2.md`
rather than of this kit's fork lineage. Keep the two sources distinct. Whether one
skill serves both, or the design targets Scott's kit and merely tolerates superpowers,
is an open question below.

## The method to encode

Daren already has a working method. The skill's job is to encode it, not invent one:

1. **Fetch his latest.** The local clone goes stale between passes.
2. **Classify against the last look:** new, updated, removed, unchanged.
3. **Treat his removals as signal.** Where he dropped something this kit still
   carries, ask whether his reason applies here too. A diff-only pass misses this
   entirely, and it is the step most likely to be skipped.
4. **Decide what this kit actually wants.** Most things will be neither obviously in
   nor obviously out.
5. **Per wanted item, decide take-as-is or reshape** to this kit's principles. The two
   kits hold real and permanent philosophical differences; reshaping is the normal
   case, not an exception.
6. **Hand off.** The skill's output is a decision plus a dispatch into the kit's
   existing pipeline: `brainstorming` for anything needing design, `executing-work` for
   a settled port. It does not implement inline, and it does not duplicate pipeline the
   kit already has.

## What is already decided (do not re-litigate)

`archive/claude-kit_spec_v3.md` records both of these, and a pass that does not read it
will rediscover them at cost:

- **The adjudication criterion** (spec_v3, Approach): for each candidate, whether it
  reflects a deliberate decision or is Scott-specific.
- **Deliberately not taken:** his full 132-line operating manual wholesale, the
  format-on-edit hook, `scott-writing-style`, the CLAUDE-FOR-FABLE variant, and the
  agent-teams machinery. The `kit-goal` port additionally dropped his Windows relay
  clause and his compaction-ledger genealogy as platform-specific.

Note that spec_v3 cites the clone path as `~/repos/claude-kit-scott`, which has since
moved. A design that depends on a recorded path should expect it to drift.

## What is undefined (the first design work)

- **How a pass knows where the last look left off.** A watermark commit sha is one
  option. Daren's alternative: compare his `docs/` against this kit's and read the date
  intersections, which needs no new state. That only catches work that earned a spec
  doc, so unspecced commits (hook fixes, small changes) need something else or need to
  be accepted as out of reach.
- **Where the standing adopt/adapt/reject decisions live.** Today the criterion and the
  not-taken list are buried in an archived spec, which is why each pass re-derives
  them. A living document, a section in the skill itself, and `docs/backlog.md` are all
  candidates, with different staleness costs.
- **Whether superpowers shares the skill** or stays a separate, manual thing.
- **How the classification is produced.** A subagent survey of his kit, direct reads in
  the main thread, or plain `git` and `diff` against the two trees. This bears directly
  on the pass's token cost, which is the reason to decide it rather than let it happen.

## Adjacent open work

Two inbox notes (2026-07-24, and 2026-08-07 on the RED bar) are sub-problems of this
workflow rather than peers to it: `writing-skills` has no defined path for wording
ported in with someone else's observed-failure provenance.
`archive/kit-goal-port_spec_v1.md` (Approach, final paragraph) is the live instance,
where ported wording was taken on Scott's production-incident provenance with its own
RED/GREEN explicitly deferred. Wording arriving with borrowed provenance is the normal
case for an adoption pass, so design these together with the skill rather than ahead of
it.

## Starting point

Fetch his kit and produce one honest classification by hand before designing anything.
That grounds the design in the real shape and volume of a delta rather than in an
imagined one, and it will show immediately whether step 3 (removals as signal) is cheap
or expensive to answer.

## Chapters

(none yet - Proposed)
