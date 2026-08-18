# What Take-Stock Should Be Asking

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-17

## Why this exists

`kaizen`'s take-stock step tells a pass to read a section whole and **ask what it would lose
by being shorter**. Four independent measurements now suggest that question is aimed at a
problem this corpus does not have, while the same four passes kept producing value on a
different question they were never asked.

This stub is not the redesign. It parks the measurement and the shape of the decision so a
design pass can start from evidence rather than re-derive it.

## The four measurements

Listed with where each is recorded, because the whole point is that no one of them would have
been enough.

1. **`take-stock.md`, 2026-08-16 (`1e5db4e`).** A hard compression of the kit's two most
   accreted sections bought **6.5% against the 18.5% wanted**. Its own conclusion:
   "Compression is the wrong instrument for this file." Measured 143 claims across 24,598
   characters, about 172 characters per claim, "much of it condition and locator rather than
   prose".
2. **`take-stock.md`, 2026-08-16 (`e69eb9e`).** Attempted no compression on `kaizen`'s own
   largest section and recorded why: after reading it whole, "no two-directional mapping
   closes on a shorter text here either."
3. **`archive/writing-skills-ladder_spec_v1.md`.** An effort scoped explicitly as a
   compression died twice, four rounds of Critical findings between them, on the finding that
   the prose is **entangled rather than redundant**: "routing in this file is not separable
   from cost, because the sentences that route state the bill in the same breath."
4. **`take-stock.md`, 2026-08-17.** Two never-examined sections, 18,896 characters. Cut
   nothing. The three candidates it did find totalled about 2% of the examined text and were
   all behavior-shaping motivation, which `writing-skills` routes to the arms as retirements
   rather than compressions.

**The consistent by-product, and one caution added 2026-08-18.** All four passes produced
coherence defects, omissions and retirement candidates instead: a false scope statement at
`writing-skills:468` (the ladder's only shipped output), an enumeration stopping one short of
its own newest disposition (twice), a `Fable Spend` omission, and a pointer-plus-restatement
pattern now at three instances across two files. Those are what the passes were actually good
at, and none of them is what the step asks for.

**The caution: three of those by-products did not survive verification.** On 2026-08-17 a
claimed cross-file contradiction reduced to a one-file omission, and on 2026-08-18 both an
inferred candidate target and a claimed instrument gap died on reading the primary text. A
design pass must not read "the passes produce defects instead" as "the passes produce *good*
defects". The unreviewed rate is the open variable, and `arm-boundaries` owns it.

## The decision this needs

**Whether take-stock's question should change**, and if so to what. The obvious candidate is
something in the shape of "what in this section is wrong, doubled, or unwatched", which
describes what the four passes produced. That is not automatically right and should be
designed rather than adopted.

Three things a design pass has to settle:

- **What replaces compression, without becoming a licence to grow the kit.** `take-stock.md`
  opens by claiming it is "the only channel by which the kit subtracts from itself", because
  every other input is captured friction and "friction can only ever ask for more words". A
  question aimed at defects rather than length has to keep that property or knowingly give it
  up and say what replaces it.
- **Whether the retirement backlog is the real bottleneck. Resolved 2026-08-18, and the answer
  narrows this stub rather than killing it.** The four candidates were not a queue problem. They
  were un-actionable by construction, because a pass that examined them could record no outcome:
  `writing-skills`' disposal rule logs a candidate mechanically, so the list recorded what a
  rewrite declined to drop rather than what anyone judged should go, and kaizen's verdict
  vocabulary had no disposition for a candidate examined and kept. All four are now **declined**
  with reasons, and a `declined` verdict exists (`2408979`). So the flow was never backing up on
  volume, and "changing the question produces more of what is already backing up" no longer
  holds. What survives is the narrower question below, on its own evidence.
- **Whether compression stays available for a section that genuinely wants it.** The four
  measurements are all of `writing-skills`, `kaizen`, `brainstorming` and `executing-work`.
  186 sections are measured and 15 are ranked; nothing establishes that the tail behaves like
  the head, and the ranking selects for exactly the accreted sections most likely to be
  claim-dense.

## Out of scope until this is decided

**Amended 2026-08-18.** This section previously reserved the four parked retirement candidates
for a later effort. They were adjudicated instead, outside this stub and before it starts, and
all four are declined with reasons in `take-stock.md`. That was the right order: the reason
they had not been decided turned out to be the missing verdict rather than anything this stub
is about, so holding them hostage to a design pass would have kept a fixable defect open for
the sake of a tidy boundary.

What stays out of scope is **re-opening them**. A design pass that changes take-stock's
question does not thereby reverse four recorded verdicts; if the new question would have
decided one differently, that is a fresh examination of that claim, recorded as its own entry.

## Open Questions

- Is the claim-density finding a property of the corpus or of the ranking that selected the
  sections? Answering it means measuring a section the ranking does not surface.
- Does `tools/accretion.js` need a companion measurement, given this pass's finding that a
  section's rank is partly an artifact of where a heading sits?
