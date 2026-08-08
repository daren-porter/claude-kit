---
name: curating-docs
description: "Use when a plan reaches Complete or is abandoned, when brainstorming writes a new spec, when docs/ needs organizing, or when Daren asks for a docs tidy-up or retrofit. Symptoms: Complete plans still sitting in docs/plans/, a backlog that only grows, plans that never reference each other, a docs/ tree with no index."
---

# Curating Docs

A project's `docs/` is a curated library plus one live backlog, not an attic where finished plans pile up. The failure this skill exists to stop: a plan is closed in place, `docs/plans/` fills with completed work, the backlog grows without bound, and the library stops being navigable. Closing a plan is not finishing it. A plan is finished when it has moved to the archive, the backlog is pruned, related plans point at each other, and the index tells the truth.

## The taxonomy

Four zones, each with one job.

| Location | Holds | Discipline |
|---|---|---|
| `docs/` root | Stable about-the-solution docs (architecture, security model) and the `README.md` index | Updated in place as the solution changes |
| `docs/plans/` | Active work only: `Status: In Progress` plans and `Status: Proposed` stubs | A plan leaves the moment it is Complete or abandoned |
| `docs/archive/` | Finished and abandoned plans with their Chapters intact, and dated backlog snapshots (`archive/backlog-YYYY-QN.md`) | Immutable history; nothing here is live |
| `docs/backlog.md` | Cross-effort next steps, active items only | Pruned-live: a finished item moves to the quarter's snapshot |

`Proposed` counts as active. A parked stub is work waiting to be designed, brainstorming reads it in place, and archiving it hides it.

Two append disciplines stay separate. A plan's Chapters are append-only history: they travel with the plan into the archive, and they keep accruing there when a post-close increment adds one. The backlog is pruned-live. Conflating the two is what produces the endless-append doc nobody reads.

**Never delete a file; relocate it.** Every step below moves files. None of them removes one, and a doc that fits no zone goes to `docs/archive/` with a line in the report rather than to the bin.

## Close a plan (the close path)

Part of finishing-work's close-out, in this order. It runs in the main session: `docs-curator` has no Bash and never moves plan docs, so at most it flags a gap for you to act on.

1. **Confirm.** `Status: Complete` (or abandoned, and the doc says which) and the final Chapter written. If the work is not actually done, stop; this is not the step.
2. **Move.** `git mv docs/plans/<file> docs/archive/<file>`. The Chapters travel untouched and git keeps the file's history.
3. **Cross-reference.** If the plan built on, superseded, or was superseded by another, both files carry a short `## Related` section naming the other file and the relationship. Both directions, or the link is only findable from the end that already knows.
4. **Prune the backlog.** Items this effort finished move out of `docs/backlog.md` into `docs/archive/backlog-YYYY-QN.md` (create it if absent, append within the quarter). Items the effort surfaced go in.
5. **Refresh the index.** `docs/README.md` drops the plan from the active list and carries it under the archive with its one-line hook.

This is the rule that dies most often, so here it is with the excuses that defeat it:

| The excuse | Why it is wrong |
|---|---|
| "It is Complete, the status says so, that is enough." | Status is not location. A Complete plan left in `plans/` still pollutes the active set and the resume scan's signal. Move it. |
| "I will archive it later, or in a batch with the others." | Later is where this rule died before. Archive in the same close-out that finished the work. |
| "Moving it loses the history." | `git mv` preserves history and the Chapters move with the file. Nothing is lost. |

## Register a new plan (the create path)

When brainstorming writes a spec, before executing-work starts on it:

1. Add it to the active-plans list in `docs/README.md` with a one-line hook.
2. If it builds on or supersedes another plan, add a `## Related` section to both files, in both directions. A superseding version says what it replaces; the superseded one says what replaced it. An archived plan accepts appends only, of exactly two kinds: a `## Related` block, and a post-close increment Chapter (finishing-work owns when an increment qualifies and appends it to the plan where it now lives, in the archive). Never rewrite an archived plan's content to reflect new work.
3. Cross-effort next steps that surfaced during the design conversation go to `docs/backlog.md`, not into the new spec as scope it does not own.

## Retrofit an existing tree

When asked to tidy or retrofit a `docs/` that predates this taxonomy:

1. **Survey, read-only.** List every doc, read each plan's `Status` header (read it; do not infer status from the filename, the version number, or the mtime), and classify each as active plan, completed or abandoned plan, about-the-solution doc, or stray. Note which cross-references are missing while you read.
2. **Propose, then stop.** State which files move where, what the index and backlog will contain, and which `## Related` blocks are missing. Present it and wait. A batch of moves across a library Daren has been reading for months earns a confirmation, and a status you misread is cheap to correct here and annoying to correct after the moves.
3. **Execute on approval.** Create the zones, `git mv` the completed and abandoned plans, seed the index and backlog, add the missing `## Related` blocks, and report what moved as a short list. Content stays as written: a retrofit is moves, cross-references, and an index, not a rewrite.

A status that contradicts the doc's own Chapters is a question for Daren, not a judgment call to make silently.

## How much to say about it

Curation is almost entirely mechanical, and the mechanical part is not news. Git history already records what moved, so **the depth of the report scales with whether curation was the turn's work or an aside**, and the aside is the common case:

- **Curation was the ask** (a retrofit Daren approved, a tidy-up he requested): the report is the deliverable. The short list above is right.
- **Curation rode along with a close-out**: one line. "Archived `foo_spec_v1.md`, pruned two backlog items, refreshed the index."
- **Curation rode along with a question about something else**: nothing at all. Do it and stop. A paragraph about which files went where, appended to an answer about a connector error, buries the answer the session existed to give.

Three things genuinely need Daren, and they are the only things worth taking his attention for: a retrofit across a library he has been reading for months, a `Status` header that contradicts its own doc's Chapters, and a `docs-curator` Drift Report where as-built diverged from the spec. Everything else in this skill (the moves, the index, the backlog prune, the `## Related` blocks) has no decision in it and needs no permission, so asking for one just moves the noise from a report into a question.

**When you do need him, nudge, do not survey.** One sentence naming that a decision is waiting, and the offer: "`docs/` has no index or backlog: want me to retrofit it?" The classification of each file, the moves table, and the missing cross-references are what he reads after he says yes. Listing the tree's problems inline while he is looking for the answer to an unrelated question is the same failure as narrating the moves, one step earlier and easier to excuse because none of it is technically a report.

## Skeletons

Seed a new or retrofitted library from these shapes so every project's `docs/` reads the same way.

`docs/README.md`, the index:

```markdown
# <project> Docs

One paragraph: what this library holds and what it is not (for a repo that ships a
payload, say that these docs are repo-level material and not part of it).

## Folder map

- **Root (`docs/`)** holds the stable documents about the solution and this index.
- **`plans/`** holds active plans only: In Progress and Proposed. A plan moves to
  `archive/` in the close-out that completes or abandons it.
- **`archive/`** holds finished and abandoned plans with their Chapters, and dated
  backlog snapshots. Immutable history.

## Active plans

- **`plans/<file>.md`** (In Progress) - one-line hook: what the effort delivers.
- **`plans/<file>.md`** (Proposed) - one-line hook: the itch it would scratch.

## Living documents

- **`backlog.md`** - cross-effort next steps, active items only.

## Archive

- **`archive/<file>.md`** - one-line hook, written in the past tense.
```

`docs/backlog.md`:

```markdown
# Backlog

The living next-steps doc for <project>. Active items only; a finished item moves to
a dated snapshot in `archive/` (`backlog-YYYY-QN.md`) rather than being struck
through in place. Per-effort history lives in each plan's Chapters, not here.

## Active

- **<Item> (YYYY-MM-DD).** What it is and why it is parked.

## Snapshots

Completed items are archived to `archive/backlog-YYYY-QN.md`. (None yet.)
```

`docs/archive/backlog-YYYY-QN.md`, the snapshot: a title line, one sentence saying it holds items pruned from `../backlog.md` during the quarter, and one dated line per item with its outcome. Append-only within the quarter.

## Antipatterns

- Closing a plan in place: status flipped to Complete, file never moved.
- A backlog that only grows because finished items are struck through instead of moved to a snapshot.
- Rewriting an archived plan's content, or growing its recorded scope with new sections. New work gets a new plan, cross-referenced to the one it builds on. Appending a Chapter or a `## Related` block is a different act: both add history at the end and leave what was written intact.
- A one-directional cross-reference, findable only from the newer file.
- Forking a parallel copy of a doc instead of updating it in place.
- An index that lists a file that no longer exists at that path, or omits one that does.
