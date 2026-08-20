# Take stock

What the kit's own prose was examined for, what came down, and what was spared, declined or
left unverdicted, each with the reason. **Newest entry first.** The first
`## YYYY-MM-DD - <sha>` heading in file order is the marker `hooks/take-stock-nudge.js`
measures HEAD against. **That sha names the commit
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

## 2026-08-18 - 60addb93948b8fe54b2a03b2551f4b893dfb0202

Examined no section. This pass read the **four retirement candidates** the 2026-08-16
compression parked, from the source artifact rather than from the summaries that had been
re-parked twice: `archive/kaizen-stop-start-continue_s3-inventory.md:304-315`. All four are
**declined**, and the verdict itself is new, added to `kaizen/SKILL.md` at `2408979`.

**This entry's heading sha moved once, which is the ordering rule working rather than failing.**
The pass first recorded `2408979`, then found a second prose defect and fixed it at `60addb9`.
The heading names `60addb9` because the rule is that the sha holds the prose **as the pass left
it**, and a pass is not over when its first prose commit lands. Leaving the earlier sha would
have made the nudge count this pass's own second edit against it forever, in exactly the case
the mechanism exists for.

**Why they cycled, which is mechanical rather than anyone's neglect.** `writing-skills`'
disposal rule fires whenever a compression finds a claim with no counterpart in the shorter
text, so the list records what a rewrite **declined to drop**, never a judgment that the claim
should go. Read as a backlog of pending retirements it was un-actionable by construction:
retiring owes the arms, which cost far more than the roughly forty words the four are worth
between them; spared demands an observed event or an admitting incident; and unverdicted is
defined in this file as one nobody has watched, which these had been, three times. Nothing
could be recorded, so each pass re-parked them and said so.

**Declined, each naming what keeping it buys.** That is the bar the new verdict carries, and
"not worth the arms" is explicitly not it.

1. **B55** (`writing-skills:446-447`), "This clause holds the rule, that home holds the
   evidence, and the backlog holds the open instances". Keeping it buys the only statement of
   the three-home split **as a split**. The three homes are introduced separately and far
   apart, the Chapter at `:316`, the commit message at `:327` and the backlog line at `:444`,
   and no other sentence sets them against each other. Declined on judgment rather than
   evidence, and it is the weakest of the four: no incident is nameable for it.
2. **The doubled routing** into the gated path and into `## Compression`. Keeping it buys a
   working access path for a reader who arrives at the section directly instead of through the
   routing block, which is how agents read these files. Both restatements were verified
   accurate against their sources this pass, not assumed: the routing block's "three recorded
   artifacts" against `:311-312`'s "Three preconditions. Each one is discharged by an
   artifact".
3. **A59** (`:189-191`), the persist-hold release on the gated path, against B8 and B11.
   Keeping it buys the **named-exception framing that B never supplies**, which the inventory
   itself recorded at its own `:312-313` as the reason A59 survives. That reason was written
   down when the candidate was created and then never used to close it, which is the clearest
   single illustration of the missing verdict.
4. **A63/A69**, "the failure is silent unless a rep happens to mention it" against "nothing
   about this announces itself". Keeping both buys **two different detection strategies**, and
   this is a disagreement with the inventory rather than an application of it. The inventory
   called them "Same claim, two hazards, two reasons". They are not the same claim: A63
   describes an unreliable tell, and a rep did in fact produce it ("the file was rewritten on
   disk by an outside process twice while I worked"), where A69 describes no tell and says why
   none can exist, "every rep involved followed a standing rule correctly". Reading rep output
   can catch A63's hazard and can never catch A69's, which is why A69's rule prescribes
   clearing the inbox and counting after instead.

**The vocabulary gap was narrower than four items suggest, and that is worth recording against
the new verdict rather than for it.** A63 and A69 each carry a dated incident in their own text
(2026-08-14, 2026-08-15), so candidate 4 could have closed as **spared** under the existing bar
with no new verdict at all. Only candidates 1, 2 and 3 were genuinely homeless. A pass reaching
for `declined` should check `spared` first.

**Two claims this pass made and then lost on verification, recorded because of the pattern.**

- **The candidate-1 target was inferred and wrong.** Working from the summary alone, this pass
  identified B55 as `writing-skills:102-104`, the RED/GREEN division of labour, and had begun
  building a position on it. The inventory names B55 as an entirely different sentence about
  where evidence lives. A sentence-boundary check killed the reading independently: `:101-104`
  is one sentence whose contrast clause is the justification for "record the ratio rather than
  needing a majority", not a free-standing restatement beside an independent one.
- **A claimed instrument gap dissolved.** This pass was going to argue that a claim inventory
  cannot express one claim entailed by two survivors. `:274-275` permits non-bijective mapping
  outright: "When you cannot tell whether something is one claim or two, split it; where the
  fine split then maps to one survivor, say so and carry on."

Both were attractive structural findings that did not survive reading the primary text, in a
pass whose own 2026-08-17 entry had recorded the identical failure that morning, and in the
file whose ratio is that three of four such findings are artifacts of the reader's map. **Three
instances in two days is no longer a coincidence and is the strongest argument in this file for
`archive/arm-boundaries_spec_v1.md`**, whose subject is that the kaizen apply path has no review
step.

**A second prose defect, found by re-examining an earlier decision in this same pass.** Adding
the `declined` verdict left `writing-skills:296` naming one exit for a candidate when there are
now two. Earlier in this pass that sentence was deliberately left alone, on the grounds that
"retiring it is a separate change owing the arms" stays true and never claimed retirement was
the only outcome, and that adding a cross-reference would be growth for tidiness. That was
correct when made and wrong once the second exit existed. **The decision was not wrong; the
fact underneath it changed, and nothing in this pass would have re-examined it on its own.**
Naming one disposition of two is a false statement of scope, the same class as the `:468`
introduction the ladder shipped its single fix for, and it is where the reading that stalled
these four candidates gets manufactured: a list whose only stated exit is retirement reads as a
backlog of pending retirements. Fixed at `60addb9`, no arms, on `1526456`'s basis.

**Unarmed, and named as a gap rather than a judgment call.** The evidence for the problem is
real and recorded in git across three entries, but nothing tests whether the new wording fixes
it without opening the escape hatch the clause itself warns about. `writing-skills:454-456` is
explicit that labelling wording unverified is not an admission path, so this is a debt and not
a disclosure. It goes to Daren with `arm-boundaries`.

## 2026-08-17 - 63cd1609e9208561d511f21ea2b23ff93d130937

Examined two sections rather than one: `brainstorming/SKILL.md` "Process" and
`executing-work/SKILL.md` "Section loop", which `tools/accretion.js` ranks fourth and fifth.
**Figures are of the text as examined**, at `63cd160`, which is also the state the pass left
behind because it changed no prose: Process at 41 lines and 9,159 characters over 14 commits,
spanning 10-50; Section loop at 25 lines and 9,737 characters over 15 commits, spanning 69-93.

**Why these two, recorded so the next pass does not re-derive it.** Rows 1 and 2 were examined
2026-08-16 and row 3 the same day. The nudge's count of 2 resolves to row 3 (via `c4dbe58`) and
row 6, `writing-skills` "When you meet a counter-case to a rule" (via `63cd160`, one day old),
so both changed sections are either just-examined or freshly self-authored, and examining either
would repeat verbatim the distance problem the entry below flagged against itself. Rows 4 and 5
have never been examined and together run shorter than one `writing-skills` section. The
discriminator that chose them was **never examined and not freshly self-authored**, not rank
alone. (An earlier draft called them "the densest churn-per-line rows in the top 15". Computed
rather than asserted, row 5 is the densest at 15 commits over 25 lines, but rows 9 and 8 sit
between it and row 4, which is fourth. The claim was dropped rather than repaired because the
discriminator above carries the selection without it.)

**Distance is partial and stated rather than worked around.** One paragraph of Process,
`:34`, is the previous pass's own work from 2026-08-16. The other 40 lines date 2026-06-10
through 2026-08-14, and Section loop is clean at three days. So 1 line of the 66 examined was
read with no distance and the other 65 with real distance, which is a better position than the
entry below had and worse than a month would give.

**Came down: nothing. Went up: nothing.** No prose changed, which is why this entry's heading
sha is the commit the pass read as well as the one it left.

**The corpus finding, which is the reason and is now bigger than this pass.** Both sections
are claim-dense rather than word-dense, and that is the fourth independent measurement saying
so. The entry below measured `writing-skills` at 143 claims across 24,598 characters and got
6.5% from a hard compression against 18.5% wanted. `archive/writing-skills-ladder_spec_v1.md`
found the same file's prose "entangled rather than redundant" and died twice on it. And here,
`executing-work:77` alone is 3,681 characters, 38% of its section, in one unbroken paragraph
that enumerates conservatively to more than thirty distinct instructions, at least eight of
which name a specific reason or incident. `brainstorming` step 7 is 4,131 characters, 45% of
its section, doing six unrelated jobs under one heading.

**No chars-per-claim figure is quoted here on purpose.** The entry below's 172 came from a
claim unit that pass defined; this pass did not define a matching one, and a finer unit
produces a smaller number that would read as a comparison while being an artifact of the
counting. Recording the raw character counts and declining the ratio is the honest version.

**Nothing was cut, and three candidates were found rather than manufactured.** Enumerating
`executing-work:77` turned up roughly seventy words of motivation and restatement out of six
hundred: the blind-dispatch rationale ("A blind reviewer that has been told the intent is just
a second adversarial pass"), the meta-clause explaining why the docs-only carve-out is written
down at all, and the inline-default restatement treated below. That is about 4% of one section
and 2% of the two, every piece of it behavior-shaping motivation, which `writing-skills` routes
to the arms as a retirement rather than a compression. So they go to Daren, not into a brief,
and the pass records a zero cut per "the step asks the question; it does not promise a cut".

**Retirement candidate 2 is now a three-instance pattern in two files, which reframes it.** It
was recorded below as doubled routing inside `writing-skills`. Two further instances, both
verified by re-opening the spans rather than trusted from this pass's notes:

- `executing-work:90` - "the same disjointness test the delegation rules below apply to tasks
  ... : lock shared contracts first, and never overlap two sections that touch the same file",
  which points at `:102` and then restates what `:102` says.
- `executing-work:77` - "A reviewer's findings still come back inline by default, per the
  artifacts rule below", which points at `:108` and then restates what `:108` says.

Both point forward to the same section of the same file and both restate the rule they point
at. With the original that is three instances of pointer-plus-restatement, so the question is
no longer whether `writing-skills` has a defect but whether this is a house pattern the kit
should keep. The counter-case is real and should be adjudicated with it: a reader at `:77`
dispatching a reviewer does not want to jump to `:108`, and the one-clause restatement is a
convenience the pointer alone does not give. **That is Daren's call and it is now three times
as well evidenced as when it was parked.**

**One omission found, narrower than the version this pass first wrote down.** `brainstorming`
never teaches that an in-session Fable spend is recordable in the `Fable Spend:` header, or
how. `executing-work:46` and `:112` both gate continue-versus-hand-off on "a header recording
an authorized in-session spend", and every form `brainstorming:38` and the `:79` template teach
records a delegated or review surface instead. A Fable-led brainstorm that should execute in
place therefore produces a header reading as hand-off by default.

**The first version of that finding was wrong and is recorded because of how it was wrong.**
It claimed `brainstorming:38` closes the enumeration at two forms against a third form
`executing-work` requires, making it a contradiction between two files. Re-reading the sentence
whole kills that: the colon and "never a bare `none`" make its job the ban on unqualified
`none`, `:79` says "e.g.", and the paragraph supplies a third example itself. What survives is
an omission in one file whose consequence is conservative, defaulting to the cost-safe
direction. This is the ratio `archive/writing-skills-ladder_spec_v1.md` banked - three of its
four "kit defects" were artifacts of the map that effort drew - reproducing inside a pass that
had read the warning that morning.

**An honest limit on `tools/accretion.js`, of the kind that file already collects.** Moving
`brainstorming` step 7's last two paragraphs - the `curating-docs` registration and the
`.kit/visuals/` sweep, neither of which is about a design conversation - out from under
"Process" would take 2 lines and 1,065 characters with them, 5% of the section's lines and 12%
of its characters, and change nothing whatsoever about the kit. A section's rank is partly an
artifact of where a heading sits. Recorded rather than acted on, because acting on it is gaming
the instrument. (An earlier draft of this paragraph said "about a fifth", which was estimated
rather than measured. The figures above are `sed -n '40p;42p' | wc -lc` at `63cd160`.)

**Spared, with the reason. Each names what was observed here, today.**

- **The paired-review dispatch contract (`executing-work:77`).** The longest paragraph examined
  and the one a compression would target first. Every clause survived because each names its
  own trigger or incident: the blind reviewer's input contract, the sha-not-branch-name rule,
  the `docs/` omission, the docs-only carve-out. It is the section's whole cost and none of it
  is fat.
- **`executing-work:90-92`, the "in order" pair.** `:92`'s argument about which misreading is
  easier to make reads as pure motivation, which is what the entry below cut 21 lines of. Spared
  on a located admitting incident rather than on its own text: `ae9dc10` (2026-08-07) brought
  both paragraphs in at once to clear a captured inbox note reading "'in order' binds a section's
  own steps, not the whole plan into single file", so a session had already made the serial
  misreading the paragraph warns about. `git log -L90,92` returns that one commit and nothing
  since, so the motivation has never been separated from the rule it shipped with, and cutting it
  from a rule agents demonstrably resist is a retirement that owes the arms.
  (An earlier draft spared this on "the admitting incident in its own text: holding sections
  serial 'looks like discipline'". That is the rule naming its own hazard, which is the sighting
  this file's bar rejects, and the entry below demoted a clause to unverdicted for exactly it.)
- **`brainstorming:18`'s "write the list out, even when it is empty" and its anti-deferral
  clause.** Preventive, and spared on the strongest evidence in this entry, which is an arm
  rather than a sighting. `abec5ed` admitted it on a real failure - "the council never fired
  for Daren: its offer was a soft step-5 clause that the agent skipped under momentum" - and
  baseline-tested the fix: 0/2 live offers on the original wording, still 0/2 when fork
  enumeration alone was added, 2/2 once the anti-deferral counter went in, with a negative case
  that correctly declined. The middle rep is the point: enumeration without the counter changed
  nothing, so both halves are load-bearing and neither can be cut on the other's evidence.

**Unverdicted, and named rather than counted as spared.**

- **`brainstorming:22`, the visual-companion offer timing.** No brainstorm in this pass's view
  reached the point where a question would land better shown. Nobody has watched it.
- **`brainstorming:31`, the Proposed-stub branch of step 7.** Six stubs are parked and none has
  been fleshed, so the branch that distinguishes completing a stub from overwriting a version
  has never been taken.
- **`executing-work:73`'s docs-write-guard clause and `:79`'s recurrence rule.** Both are
  preventive and neither has a locatable admitting incident in this pass's reading. Per the
  spared bar that is not enough to credit them, and per the same bar neither is a retirement
  candidate: they are rules nobody has watched.

**The promote this pass produces, and it is about this step rather than the kit's prose.** Four
measurements now say the corpus is claim-dense, and take-stock's compression question keeps
coming back empty while the same passes keep producing coherence defects and retirement
candidates that go unadjudicated. If that holds, the instrument is aimed at a problem this
corpus does not have. Parked as `plans/take-stock-instrument_spec_v1.md` and registered in
`docs/README.md`, rather than recorded here only: a finding about this step being reachable
solely by the next run of this step is the same unadjudicated-forever shape the finding is
about.

**Not reviewed, same gap as the entry below.** `archive/arm-boundaries_spec_v1.md` records that
the kaizen apply path has no review step. The only check this entry got was re-reading it
against the files it cites, which caught the Fable Spend finding being wrong in the direction
of a more dramatic claim.

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
agents. `archive/arm-boundaries_spec_v1.md` records exactly that hole. A later reader should not
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
