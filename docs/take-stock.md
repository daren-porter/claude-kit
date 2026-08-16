# Take stock

What the kit's own prose was examined for, what came down, and what was spared with the
reason. **Newest entry first.** The first `## YYYY-MM-DD - <sha>` heading in file order is
the marker `hooks/take-stock-nudge.js` measures HEAD against. **That sha names the commit
holding the prose as the pass left it, never the commit the pass read.** The hook measures
marker to HEAD, so a pre-pass sha makes it count the pass's own edits against the pass,
forever. That forces an ordering: the prose changes land first, then this entry follows in a
commit touching no corpus file, which is safe by construction because `docs/` is outside the
measured corpus.

**The sha must be the full 40 hex characters**, and an abbreviated one fails quietly rather
than loudly. The reader takes the first entry that parses, so a malformed newest entry falls
through to an older one and the nudge measures against a stale marker while reporting a
perfectly ordinary count. Only when no entry parses does it say a marker could not be read
from this file, and only when the file is absent altogether does it say no take-stock was
ever recorded.

This file is the only channel by which the kit subtracts from itself. Every other input to
the kaizen loop is captured friction, and friction can only ever ask for more words. A
spared entry is not praise: it names a rule and what was observed to happen because of it,
which is the closure event `docs/backlog.md` has always asked for and nothing collected.

## 2026-08-16 - e69eb9edc1658e915cac33fd5b3bca3db707e838

Examined `kaizen/SKILL.md`, "The pass (the reflect half)", which `tools/accretion.js` ranks
third in the kit. **Figures are of the text as examined**, at `40434d0`: 85 lines over 6
commits, spanning 54-138. The pass left it at 86.

**Read with no distance, and that is stated rather than worked around.** The whole diff since
the last marker is this section (+87/-11) and one line of `writing-skills`, so the section
examined is one day old and is the previous pass's own work. The ranking named it anyway, and
the alternative was to skip a section the ranking names. What follows is worth less than it
would be in a month.

**Came down: nothing. Went up: one line.** No compression was attempted and the reason is not
cost. The section is triage vocabulary almost all of which this pass used within the hour, and
the entry below's finding on the neighbouring file predicts the rest: this is claim accretion,
where a hard compression bought 6.5% against the 18.5% wanted and the conclusion was that
compression is the wrong instrument. After reading it whole, no two-directional mapping closes
on a shorter text here either. Recorded rather than manufactured, per this step's own "does
not promise a cut".

**The defect found was an omission, not accretion, and it is a recurrence.** The gather
sub-step told a pass to read this file "for what the last pass examined, cut and spared" -
three of the four things it carries. The fourth is a retirement candidate recorded and not
acted on, which is the only class here that is pending work, and nothing else resurfaces it.
This was hit live: the pass ran that sub-step, read this file, and did not surface the four
candidates below until prompted. Same shape as the defect the stop-start-continue effort
recorded against itself at `archive/kaizen-stop-start-continue_spec_v1.md:793`, "step 3
enumerated three of four dispositions and the missing one was the new one". Two instances of
an enumeration stopping one short of the disposition the same effort introduced.

**Spared, with the reason. Each names what was observed here, today.**

- **The Proposed-stub enumeration (`:60-65`).** Five parked stubs surfaced that nothing else
  would have; the SessionStart nudge named none of them. Its claim "Nothing else resurfaces
  those" held exactly as written.
- **The kit's-own-state sub-step (`:67-74`).** The accretion ranking chose this pass's
  take-stock target, and this file supplied the saturation finding that reframed the promote
  away from its obvious home. Neither came from the inbox, which is the sub-step's stated
  purpose doing the stated thing.
- **The promote-to-stub disposition (`:81-87`).** Two notes became one stub rather than two
  briefs, registered in `docs/README.md` per the clause's own instruction.
- **"The step asks the question; it does not promise a cut" (`:108-112`).** Preventive, and
  load-bearing today: this pass cut nothing, and that clause is what makes that a recorded
  outcome instead of a failed pass. Spared on its admitting incident, the compression below
  that fell twelve points short of its target.
- **The sha ordering rule (`:127-133`).** Exercised here: this entry sits in a commit after
  the prose commit and names it. Its admitting incident is the backwards rule the entry below
  records against itself.

**Unverdicted, and named rather than counted as spared.**

- **The "route elsewhere" bucket (`:88-90`).** No item this pass went to auto memory or a
  project CLAUDE.md. Nobody has watched it.
- **The compression and retirement verdict definitions (`:96-106`).** This pass produced
  spared and unverdicted verdicts and reached neither of the other two, so half the vocabulary
  is exercised and half is not.
- **"Capture does not change" (`:135-137`).** Preventive, and no event. Unlike the entries
  above I cannot locate an admitting *incident* for the surviving clause, only the design
  decision in `d0cd605` that capture stays friction-only. Per the spared bar that is not
  enough, so it stays here rather than being credited.

**The four retirement candidates from the entry below: re-parked, still unadjudicated.** They
were surfaced to Daren this pass and he had nothing to add, which is not an adjudication of
them. They stay recorded and unacted-on. What changed is that they are now reachable by
instruction rather than by luck: the gather sub-step names the class as of the prose commit in
this entry's heading, so the next pass reads them out of this file rather than missing them the
way this one did.

**Candidate 2 was weighed against this pass's own change and left standing.** Candidate 2 is
doubled routing - the same routing stated a second and third time inside one file. This pass
added a routing pointer to `brainstorming` step 7, aimed at `writing-skills`' answer-leak
rules. Judged different in kind: candidate 2 is repetition within a file, this is a cross-file
pointer placed at the moment of the action, which is the shape `writing-skills`' antipattern
list prefers ("a new skill where one paragraph in an existing skill would have done").
Recorded so the next pass can disagree with a record instead of re-deriving the question.

**Neither prose change in this pass was reviewed, and that is the gap it just documented.** The
kaizen apply path has no review step, and this session was not authorized to dispatch review
agents. `plans/arm-boundaries_spec_v1.md` records exactly that hole. A later reader should not
read these two edits as review-backed; the only check they got was the author re-reading them
against their own files, which caught one - a claim about a 2026-08-15 probe that had the
finding backwards against `writing-skills:238-241`.

## 2026-08-16 - 1e5db4e70647db43d4997007f650764702bd688f

Examined `writing-skills/SKILL.md`, the two sections `tools/accretion.js` ranks first and
second across the whole kit. **Figures are of the text as examined**, at `bbf6405`, which is
the state this pass read: "Know it works before you trust it" at 175 lines and 16 commits,
and "When a local RED is not available" at 165 and 9. At the sha in this entry's heading,
which is the state the pass left behind, the same two read 164/17 and 155/10. Four other
sections of that file were written once and never touched again, so the ranking is reading a
real difference rather than file size.

(An earlier draft of this entry quoted 175/15 and 165/8, which is no revision at all: the
line counts came from the examined text and the commit counts from a third commit, copied out
of the spec's Why table instead of re-measured. The adversarial reviewer caught it. That is
what the plan's own "re-measure before quoting" note exists to prevent, and this file is the
one place in the kit where a stale figure is not a typo but a broken record.)

**Came down: 21 lines**, from 535 to 514. All of it argumentation, framing, restatement and
one worked example. No dated incident, locator or provenance clause was touched: the 13
date markers inside these two sections survive in an identical distribution across four
dates (14 across the whole file, the extra one being in the out-of-scope Compression
section), and the backtick-locator multiset diffs byte-identical.

**Spared, with the reason.** These are Continue entries and each names what was observed:

- **Every piece of provenance in both sections.** A first draft cut two claims' conclusions
  while keeping their setups, and cut one clause as a restatement when it actually asserts a
  different fact. The inventory's attached-content column is what made all three visible; a
  two-column inventory would have shown a complete mapping. Six smaller restorations besides.
- **The claim restored under the disposal rule.** One claim in the longer text had nothing
  opposite it. Per the rule it went back into the shorter text and became a retirement
  candidate rather than a cut, and the rest of the rewrite stayed a compression.
- **The whole line target.** The pass stopped 48 lines short of its goal rather than drop a
  claim to reach it. That is the finding below, not a failure to try.

**The finding: this is claim accretion, not prose accretion.** The two sections hold 143
claims across 24,598 characters, about 172 characters per claim, much of it condition and
locator rather than prose. A hard second pass cut 6.5%; everything still enumerable as fat is
another 4 to 5%; the target needed 18.5%. A register test bounded the remainder, saving half
a line out of a paragraph and reading worse. **Compression is the wrong instrument for this
file.** What is left is retirement, which `writing-skills` routes to the arms as a separate
change.

**Retirement candidates, recorded and not acted on.** Retiring any of these owes what a rule
change owes.

1. The restored claim, which restates a division of labour three other clauses already set.
2. The doubled routing into the gated path and into the compression section, now stated once
   in the first section's routing block but a third time in the second section's opening.
3. The persist-hold release clause, against the two clauses carrying the same ordering from
   the gated path's side.
4. "The failure is silent unless a rep happens to mention it" against "nothing about this
   announces itself": one claim, two hazards, two reasons.

**Also recorded: an inherited ambiguity, not a compression defect.** A probe rep set the
narrowing's third arm up backwards before correcting itself, because "it holds the replaced
rule in its fixture" reads against the in-prompt mandate that binds any draft-carrying arm.
That clause is original `red-for-rule-changes` wording, untouched here.
