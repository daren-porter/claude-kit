# Corpus Prose Never Reaches the Reviewer Built to Check Its Claims

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- Promoted 2026-09-02 from `~/.claude-kaizen/briefs/measured-claims-cite-their-source.md`, whose
  2026-09-01 triage read "SPEC, not an apply. Built and reverted twice."
- `plans/take-stock-instrument_spec_v1.md` and `plans/kaizen-pass-economics_spec_v1.md` - both
  concern the same review loop from other angles.

## Why this exists

`prose-reviewer` is the only agent in the kit contracted to verify claims against sources: it owes
a `CLAIMS CHECKED` block giving, per claim, "the source it was checked against (a file path, a
command and its output)", plus a `CLAIMS NOT VERIFIED` block whose emptiness is an owned
assertion. Neither code reviewer owes anything like it.

**It was never dispatched over the changeset that shipped seven wrong measured claims.**
Corroborated against session transcript timestamps by a review that went looking: the pass began
17:00:54Z and committed `d9ee478` at 18:18:38Z, and every reviewer dispatched in between was
`adversarial-reviewer` or `blind-reviewer` (17:12, 17:33, 17:53). No `prose-reviewer`, no
`blind-reader`. Both `prose-reviewer` dispatches in that session came after the commit.

## Why this is a spec and not a clause: two attempts were built and reverted

**Attempt 1, a doctrine clause requiring a measured figure to carry its locator.** Killed by its
own reviews on four counts, and the second is the one that matters: the RED inverted when graded
correctly. Three reps were scored on whether they restated a wrong figure, did not, and the run was
filed did-not-reproduce - but the rule mandates an inline locator and all three wrote correct
figures with none, so **locator absence does not predict falsity**. The rule's premise was
unsupported by its own arm. It also miscited its authority in `writing-skills`' form table, and its
recall half already existed at `assets/CLAUDE.md:8`.

**Attempt 2, routing corpus prose to the battery instead of the code pair.** Killed by two false
premises, both checkable on disk and neither checked.

The narrow, defensible change that survives both: a kaizen pass changing corpus prose should **ADD**
the battery to the review it already runs, not replace it. That is the thing to design, and the
reason it needs a design rather than a sentence is that two sentences have already failed.

## What a design pass has to settle

- **Whether adding the battery to every corpus-prose pass is affordable.** It is two more
  dispatches per pass on top of the existing pair, in a loop whose cost is already the subject of
  `plans/kaizen-pass-economics_spec_v1.md`. A conditional trigger would need a predicate, and
  "contains a measured figure" is the obvious one and is exactly what attempt 1's RED falsified as
  a predictor.
- **Whether the fact-base requirement is satisfiable for a kit-prose change.** `prose-reviewer`
  takes a fact-base path; for corpus prose the fact base is the repo itself plus session
  transcripts, and the second is not a path a reviewer can be handed.
- **Why the omission happened, since that is a routing defect rather than a judgment one.** The
  battery has a trigger (`Audience:` on a section) and corpus prose has no `Audience:` line, so the
  battery cannot fire for it by construction. That is the mechanism, and any fix has to give
  corpus prose a trigger of its own or change what the battery keys on.

---

# Evidence: the promoted brief, reproduced whole

# Kaizen brief: corpus prose never reaches the reviewer built to check its claims

**Twice rewritten, after two changes were built, reviewed and reverted (2026-08-31).** Both
attempts are kept below as evidence, because the second one failed on a premise this repo had
already checked and rejected, and that is the most useful thing here.

## The verified finding

`prose-reviewer` was never dispatched over the changeset that shipped seven wrong measured
claims. Corroborated against session transcript timestamps by a review that went looking:
the pass began 17:00:54Z and committed `d9ee478` at 18:18:38Z, and every reviewer dispatched
in between was `adversarial-reviewer` or `blind-reviewer` (17:12, 17:33, 17:53). No
`prose-reviewer`, no `blind-reader`. Both `prose-reviewer` dispatches in that session came
after the commit.

That matters because `prose-reviewer` is the only agent contracted to verify claims against
sources: it must return a `CLAIMS CHECKED` block giving, per claim, "the source it was checked
against (a file path, a command and its output)", plus a `CLAIMS NOT VERIFIED` block whose
emptiness is an owned assertion. Neither code reviewer owes anything like it.

**The narrow, defensible change:** a kaizen pass changing corpus prose should ADD the battery
to the review it already runs. Not replace it. See why below.

## Attempt 1, reverted: a doctrine clause

A rule requiring a measured figure to carry its locator, added to `assets/CLAUDE.md`. Killed by
its own reviews:

- **The form argument miscited its authority.** `writing-skills`' form table maps "knows the
  rule, skips it under pressure" to a prohibition plus rationalization table. The structural
  slot belongs to a different row whose backfire column reads "Prose reminders near the
  template", which is what the clause was.
- **The RED inverted when graded correctly.** Three reps were scored on whether they restated a
  wrong figure. They did not, so it was filed did-not-reproduce. But the rule mandates an inline
  locator and all three wrote correct figures with none, so locator absence does not predict
  falsity.
- **The worked example did not resolve.** `git show c483027:165-171` returns `fatal: path
  '165-171' does not exist`.
- **The recall half already existed** at `assets/CLAUDE.md:8`.

## Attempt 2, reverted: route corpus prose to the battery instead of the code pair

Killed by two false premises, both checkable on disk, neither checked:

1. **"`executing-work` already routes this case there" is false.** `executing-work:81` scopes
   the battery replacement to "a docs-only section", defined as one whose entire changeset is
   under `docs/`. Corpus prose lives under `plugins/claude-kit/`. And `:87` says the battery
   trigger "only ever adds reviewers". The change contradicted that skill while claiming to
   inherit from it.
2. **"a blind reviewer handed a prose change has no diff to run" is false, and this repo already
   said so.** `agents/blind-reviewer.md:32` gives it an explicit job on prose diffs
   (contradictions between rules, instructions that cannot be executed, references to things
   that do not exist), and `:13` handles the no-commands case. `docs/archive/arm-boundaries_spec_v1.md:722-725`
   adjudicated the identical premise and rejected it, closing: **"The premise was checkable on
   disk and was not checked."** The same error was then made again against the same file.

Its evidence paragraph also carried four false claims, including "a fifteen-row verification
table" (16 rows) and "two adversarial-plus-blind rounds had missed" it (those rounds ran hours
before the thing existed). That paragraph's subject was false measured claims.

## Change, for whoever picks this up

`plugins/claude-kit/skills/kaizen/SKILL.md`, the corpus-prose review paragraph. Corpus prose
**adds** `prose-reviewer` to the review it already takes, which is what `executing-work:87` says
the battery trigger does. Do not frame it as replacing anything.

The battery's trigger is an `Audience:` line on a spec section and a kaizen pass has no spec, so
the pass supplies the inputs by hand. **Supply all of them.** `executing-work`'s Document Review
Brief names seven fields for `prose-reviewer`; a subset is worse than nothing, because a missing
catalog path silently skips the tell hunt and a missing `Style authority:` resolves to `none` and
silently skips the style lens, and the report still comes back looking complete. `blind-reader`
needs the persona, its knowledge level, and the repository-tenure flag; omitting the last reads as
a reader who does not hold the repo, which is the wrong persona for a kit skill.

Do not introduce the term "the code pair" without naming its members. Two reviewers independently
could not resolve it.

## Acceptance

A kaizen pass changing corpus prose dispatches `prose-reviewer` with a complete brief and gets a
`CLAIMS CHECKED` block over its figures. No claim in the change asserts anything about
`executing-work` or `blind-reviewer` that is not quoted from those files.

## Discipline

Follow writing-skills. Note that `writing-skills:543-544` says a rule change's evidence is still
the arms, and both attempts here skipped that on the reasoning that a routing change is not
behavior-shaping. A reviewer called that wrong. Settle it before building, not after.

**Read `docs/archive/arm-boundaries_spec_v1.md:722-725` before writing a word.** It already
answers one of the questions this brief touches, and both prior attempts wasted a full build-and-review
cycle on premises that a single grep would have settled.

## Four more instances, first-person, 2026-08-31 to 2026-09-01

One session working brief #1 and a take-stock produced four wrong counts. All four were
rhetorical reinforcement of claims that stood without them, which is the pattern worth the
brief rather than any single figure.

1. **"The exclusion list went 4, 5, 6" (shipped in draft, caught by review).** Presented to the
   operator as "arithmetic anyone can re-run" that "rests on none of my judgment". The colon-list
   reads four items identically at `b9f7ae1`, `f29f674`, `76b58dd` and `d9ee478`. What was counted
   was six heterogeneous exclusion phrases across the whole paragraph under a unit never stated.
   The change it was supporting did not depend on it.
2. **"docs/take-stock.md's 2026-08-31 entry" (COMMITTED AND PUSHED, corrected at `ce35c3d`).**
   There is no such entry; the file holds four, and the candidate is under 2026-08-17
   (`63cd1609`). The date came from an adversarial reviewer's finding and was restated as the
   author's own without opening the file. This is the brief's existing sub-class, "review agents'
   numbers restated as the author's own measurements", recurring in a session that had this brief
   open.
3. **"1,350 characters downstream" (caught by review before commit).** Measured from
   `and nothing else:` at 586 while the sentence anchored on `never the spec path` at 604. The
   true figure is 1,332.
4. **"13 of the 16 paragraphs were used" (caught by the author before commit).** An eyeball count
   of bolded openers. The section is 15 blank-line-separated blocks, the RED/GREEN/REFACTOR loop
   being one rather than three.

**What generalizes past this brief's existing content.** Every one of the four was a count
offered as corroboration for a claim that already had evidence. Number 1 was the worst because
the surrounding argument was strong and the figure was the only weak part of it. So the
candidate rule is narrower and cheaper than a general locator mandate, which this brief's
attempt 1 already tried and had reverted: **a count is not corroboration, and a claim that needs
one is a claim to re-derive rather than decorate.** Three of the four were caught, two by review
agents and one by the author re-deriving before shipping; the one that shipped was the one nobody
re-derived because a reviewer had supplied it. That asymmetry says the guard belongs at the
moment a figure arrives from someone else, not at the moment the author measures one.

## Triage 2026-09-01

Verdict: **SPEC, not an apply.** Built and reverted twice.
The verified gap stands: `kaizen/SKILL.md` mentions `prose-reviewer` **zero** times.

But the four instances added above (2026-08-31 to 2026-09-01) point at a narrower fix than either
reverted attempt, and it should be settled before anything is built. Three of the four wrong counts
were caught before shipping, two by review agents and one by the author re-deriving. The one that
shipped was the one a reviewer supplied and nobody re-derived. That asymmetry says the guard belongs
where a figure arrives from another agent, not where an author measures one, which is a much smaller
ask than attempt 1's general inline-locator mandate.
