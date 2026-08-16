# Take stock

What the kit's own prose was examined for, what came down, and what was spared with the
reason. **Newest entry first.** The first `## YYYY-MM-DD - <sha>` heading in file order is
the marker `hooks/take-stock-nudge.js` measures against, so the sha in that heading is the
commit at which the prose was last read whole. **The sha must be the full 40 hex characters**;
an abbreviated one does not parse, and the hook then reports that no take-stock has ever been
recorded, forever.

This file is the only channel by which the kit subtracts from itself. Every other input to
the kaizen loop is captured friction, and friction can only ever ask for more words. A
spared entry is not praise: it names a rule and what was observed to happen because of it,
which is the closure event `docs/backlog.md` has always asked for and nothing collected.

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
