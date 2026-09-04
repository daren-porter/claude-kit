# The Kaizen Inbox's Missing States

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-04

## Why this exists

Two defects sit on the same sentence, and neither is a wording slip. `writing-skills:246`
tells an operator to clear the kaizen inbox before an arm; `kaizen:19` says `notes.md` is
"append-only for capture, rewritten only by a triage pass clearing what it triaged (step 3)".
An operator following `writing-skills` destroys untriaged friction outside a triage pass, and
nothing re-files it. Separately, the same instruction cannot be executed for a **brief**,
because the charter gives a brief no state to be in before its arms run. Both are promoted
here rather than fixed as wording, for three reasons: the second needs an operator decision
among three options that change what the kit is, any fix to `:246` is corpus prose in the
kit's top-ranked section by accretion, and three kit-prose drafts in three days were killed on
review Criticals when drafted without a pre-arm read (`~/.claude-kaizen/notes.md`, 2026-09-04,
now `plans/prose-claim-review_spec_v1.md`).

## Finding 1: the contradiction, verified at HEAD

`writing-skills:246`, inside "The kaizen inbox is that same hazard with no fixture in it":

> Clear the inbox before an arm and read it after, counting whatever is in it as those reps'
> output rather than as inbox items.

Against `kaizen:19`. The purpose of `:246` is **attribution**, and the paragraph says so
itself two sentences later: "That buys attribution and not isolation." Attribution does not
require destruction, which is what makes this cheap to fix in principle. The note's own
candidate is to take attribution from a copy or a byte offset instead of by clearing.

Provenance worth keeping: this was surfaced by a blind reviewer on a kaizen change, **not by
an arm**, and `docs/take-stock.md`'s 2026-09-03 entry files it under "Located defect, which is
neither spared nor retired" while sparing eleven rules in the same section on observed events.

## Finding 2: a brief has no sanctioned pre-arm destination

A charter-created circle rather than operator error. All four anchors verified at HEAD:

- `kaizen:19` makes `notes.md` rewritable only by a triage pass.
- `kaizen:207` sequences the archive to `applied/` **after** the commit.
- `kaizen:25` says of `applied/` that nothing counts it and no pass reads it.
- `kaizen:28` makes any file in `briefs/` a pending item gating the SessionStart count.

So a brief that states its own thesis in its filename, which is the answer key to the arm
about to be run, has nowhere to be that is neither readable by a rep nor counted as pending.
Recorded consequence: three efforts invented three different quarantine destinations
(`/tmp/claude-1000/kaizen-hold-2`, `kaizen-hold-5e985460`,
`~/.local/share/kaizen-hold-20260903`), one of them hedging in a committed spec against its
own address disappearing.

**The brief is held to a stricter bar than the draft it tests**, which is the part no seat
separated: per `writing-skills:272`, "The test is whether the answer is on disk, not whether
the fixture told it to stay away." A draft is wording; a brief carries acceptance criteria and
the verbatim rationalization, so it is an answer. Two artifacts, two bars.

## Finding 3: `:246` says "inbox" where its own paragraph means `notes.md`

The paragraph is entirely about `notes.md`: it opens on the global posture rule telling every
rep to append friction to that file. But `kaizen:16-26` defines the inbox as three
directories, so read against the charter the sentence orders something wider than its context
supports. **This is the smaller finding and it is stated separately on purpose**, because a
2026-09-04 review read the order as literally "unexecutable for two of the three", which is
stronger than the text supports in context and is the kind of premise correction this repo has
had to revert before. The defect is the imprecision, and the imprecision is what made the
stronger reading available.

## The three options, which are the operator's call

From the 2026-09-04 design council record (`docs/archive/prose-claim-review_council-record.md`).
All three change the `kaizen` charter, so none is a brief.

1. **Invert `kaizen:207`**: archive the brief to `applied/` before the arms rather than after
   the commit. Cheapest in lines; costs the archive its meaning as a record of what shipped,
   and `applied/` is unread by construction, so a brief archived pre-arm and then abandoned
   leaves no pending signal anywhere.
2. **Give the inbox a fourth, uncounted pre-arm state.** Most expressive; carries the heaviest
   measured risk, below.
3. **Move or rename `briefs/`.** The facilitator found this cheapest overall. The objection
   against it was "five stable locators"; the facilitator found four, three already dangling:
   three are `Promoted 2026-09-02 from ...` provenance lines in `docs/plans/` naming files that
   exist at neither `briefs/` nor `applied/`, and `applied/` renames on archive anyway with a
   `YYYY-MM-DD-` prefix, so the promoted-from path was never stable. Moving `briefs/` breaks
   **one** live reference, `kaizen/SKILL.md:24`.

## The constraint any new state has to clear, and it is measured

The SessionStart count is not a free surface to add a state to. `hooks/session-start.js` reads
`notes.md` through a bounded 64KB window, and an earlier attempt to teach the counter to skip
`DECLINED` entries **went silent**: 110 declines with one live note behind them reported
nothing pending. Reverted in `24ae5c3` ("Revert the DECLINED counter strip: it made a full
inbox report nothing"), because the skip ran after the bounded read. That is why
`~/.claude-kaizen/declined.md` is a separate file rather than a state inside `notes.md`, and
any fourth state proposed under option 2 inherits the same failure mode.

## Related, and one of these is the same question

- **`plans/kit-concurrent-sessions_spec_v1.md`, finding 1** is this class from the other end:
  the inbox cannot express "parked, restore pending", and a park produces an observed false
  zero in the SessionStart count. Same missing-state-vocabulary question, same counter as the
  binding constraint. That stub carries the bar the user set on it, that the mechanism must
  also help the solo case; **the circle in Finding 2 above is the solo case**, which is the
  strongest argument for designing the two together.
- **`plans/kaizen-decline-store_spec_v1.md`** owns `declined.md`, the one state that was added
  and the reason the constraint above is measured rather than predicted.
- **`plans/prose-claim-review_spec_v1.md`** holds the converged placement criterion, which
  governs where a draft lives. It does not answer where a *brief* lives: its condition (c)
  bars `~/.claude-kaizen/` outright, which is precisely what makes Finding 2 a circle rather
  than a lookup.
- `plugins/claude-kit/skills/writing-skills/SKILL.md:242-254` and
  `plugins/claude-kit/skills/kaizen/SKILL.md:16-28` are the two texts that have to agree.

## Starting point

Decide Finding 2 first, because Finding 1's fix is a sentence and Finding 2's is a charter.
Options 1 and 3 are both small enough to execute in the pass that decides them; option 2 owes
a test against the bounded-read failure above before any wording is written. Then Finding 1
collapses to rewording `:246` around a copy or a byte offset, which is corpus prose and takes
the paired review with the pre-arm read that the three killed drafts establish is needed.

## Chapters

(none yet - Proposed)
