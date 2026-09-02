# Kaizen Passes Generate As Much Friction As They Clear

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- `plans/take-stock-instrument_spec_v1.md` - the closest sibling, asking whether take-stock is
  measuring the wrong thing. This stub asks the adjacent question about the friction half of the
  same skill: whether a pass's capture is measuring the kit or measuring the pass.
- Opened by the operator during the 2026-09-01 pass that applied `finishing-work-drift-autonomy`
  and parked `finishing-work-tree-freeze`, on the observation that "kaizen passes themselves have
  been hard lately, or generate as much or more feedback as they clear out."

## Why this exists

**A pass that clears two briefs and files ten notes has not reduced the inbox.** Measured on the
2026-09-01 pass, which is the instance that opened this stub:

| | Start | End |
|---|---:|---:|
| Notes | 4 | 14, pruned same-session to 8 |
| Briefs | 10 | 8 |

Two briefs left the inbox (one applied as `39cd1ef`, one declined with its arms recorded). Ten
notes went in. Six of the ten did not survive a same-session prune once each was held to the bar
the pass had itself just applied to a brief, which leaves a net of four notes against two briefs
cleared. The pass's own cost was roughly **41 subagent dispatches** (RED and GREEN arms for two
rules, three of them re-run as review repaired the wording, plus two pilots, five review agents,
and the nested reviewers two reps dispatched) for one shipped paragraph.

**Two of the sources manufacture friction rather than observe it, and both are specific to doing
kaizen work.**

1. **A reviewer dispatched to critique prose will always find adjacent edges.** Three paired
   review rounds on one two-paragraph change returned 4 Criticals and 15 Majors, most of them
   about pre-existing text the change sat next to rather than about the change. Those edges are
   real, and none of them had ever been hit by a session doing work.
2. **A rep working a fixture the pass built will find the defects the pass put there.** One
   dropped note recorded that a spec clause outside any Section of Work is invisible to QA - true
   of the kit, and discovered only because the fixture author had placed such a clause there
   deliberately.

**The kit has already recorded this failure once, from the other end.** `writing-skills` notes
three probes on 2026-08-15 returning twelve inbox notes against wording all three of them had
applied correctly, "and the count was then read as a measure of the kit rather than of the
prompt." That is the same confusion at the capture step rather than the probe step.

**The counter-case the pass should take seriously.** A high note count may be correct rather than
inflated. The four notes that survived the prune include a live defect nothing else would have
found: `docs-write-guard` denies a dispatched agent every write under `docs/` while
`finishing-work` step 5 is nothing but `docs/` writes, so a close-out cannot be dispatched at all
and no skill says so. Four of five reps hit it cold. Adversarial reading of the kit is how that
surfaced, so the answer is unlikely to be "capture less".

## What a pass on this would have to decide

- **Whether the capture bar should distinguish observed friction from predicted gaps**, the way
  `writing-skills`' gated path already distinguishes a locatable incident from a detailed account
  with no locator. A note from a reviewer reading prose under edit, or from a rep on an
  author-built fixture, is a prediction. Deliberately not filed as a note during the opening pass,
  because filing it would have been the loop eating itself.
- **Whether the inbox is a queue or a debt.** Nothing decays and nothing expires, so the count only
  falls when a pass promotes or declines. If notes are cheap to file and expensive to triage, the
  arithmetic never closes.
- **Whether a pass owes a net-reduction accounting at all**, or whether "hard lately" is the cost
  of the arms discipline rather than of capture. The 41-dispatch figure above belongs to
  `writing-skills`' RED/GREEN bar, not to the kaizen skill, and a pass cannot cut it without
  weakening the evidence rule that keeps unevidenced prose out.
- **Where a declined brief's evidence lives.** `applied/` is explicitly unread by any pass, so a
  four-rep decline is invisible to the next session that notices the same friction. Dropped as a
  note during the opening pass for lack of an instance; it belongs here as a design question.

## Not in scope

Changing `writing-skills`' arm bar. If the cost of a pass is the arms rather than the capture, that
is a separate and much larger question, and the arms are what stop unevidenced rules shipping.
