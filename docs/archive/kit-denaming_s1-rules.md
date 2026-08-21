# De-naming rules and file dispositions

Section 1 artifact for `docs/plans/kit-denaming_spec_v1.md`. Sections 3, 4 and 5 execute against
this file; it is the contract, not a summary of one. Promoted to
`docs/archive/kit-denaming_s1-rules.md` at close-out.

Branch `kit-denaming`, base ref `74adfa9`, spec committed at `df880e6`.

**Revision 2, 2026-08-20.** Revision 1 failed adversarial review with three Critical findings. All
thirteen findings are fixed here; the three that changed the shape of this document are called
out where they land, because a contract that hides its own repairs invites the same mistake twice.

## How to use this

1. Read the substitution rules, then the carve-out. The carve-out is the rule most likely to be
   broken by a fast sweep and the one that cost revision 1 a Critical.
2. Find your file in the disposition table. Every row names its owning section and its verdict.
3. Check every occurrence in your file against the **three** exhaustive lists: identifiers,
   attribution, and verbatim quotations. Anything on any of them is byte-identical when you are
   done.
4. Everything else that matches a pattern is prose. Apply the substitutions.

## Search patterns

Run all of these **case-insensitively**, over the tracked tree excluding `docs/archive/`:

```
daren        porter        scott        applefeld        sapplefeld
```

and this one, which must match both cases explicitly:

```
\b([Hh]e|[Hh]is|[Hh]im|[Hh]imself)\b
```

**Case-insensitivity on the name patterns is not optional, and neither is keeping `porter`.**
Revision 1 dropped `porter` from the set and declared the name patterns case-sensitive. Either
alone is harmless, because every `Porter` in the tree is preceded by a `Daren`. Together they made
`DAREN PORTER` unreachable by every grep this contract mandates, including the reconciliation
greps sections 3 and 5 close on, and two occurrences of it in generated deployment-script output
went unlisted. See the generated-artifact pass below.

Verified 2026-08-20: no name token appears inside another word anywhere in the in-scope tree, so
case-insensitive matching costs no false positives here. `porter` never occurs inside `reporter`
or similar in this repo.

## Measurements

Working tree at revision 2, case-insensitive:

| Pattern | Occurrences |
|---|---|
| `daren` | 239 |
| `porter` | 19 |
| `scott` / `applefeld` / `sapplefeld` | 73 |
| `\b([Hh]e\|[Hh]is\|[Hh]im\|[Hh]imself)\b` | 146 |
| match-bearing files | 47 |

These drift as the effort runs, because this spec and this rules file are themselves in scope.
Treat them as a basis for reconciliation at the moment each section runs, not as fixed targets,
and re-measure rather than asserting a stale number.

**The pronoun correction, stated correctly.** The spec's original table said 116 and the working
figure is 146. Revision 1 attributed the whole gap to case-sensitivity and was wrong. Measured at
`df880e6`: the lowercase-only pattern yields **126** and the `[Hh]` pattern yields **144**, so the
pattern error accounts for **18**. The remaining **10** is drift from this spec's own new prose,
the same cause the table already attributes to its `Daren` row. A sweeper told to hunt 28
capitalised pronouns will find 18 and go looking for ten that never existed.

## Substitution rules

Apply to **prose only**: text this kit wrote about the operator or the upstream, including direct
address, possessives, narration, provenance clauses, and skill frontmatter `description` fields.

| Find | Replace with |
|---|---|
| `Daren` | `the user` |
| `Daren's` | `the user's` |
| `He` / `he` (the user or the upstream author) | `They` / `they` |
| `His` / `his` | `Their` / `their` |
| `Him` / `him` | `Them` / `them` |
| `Himself` / `himself` | `Themselves` / `themselves` |
| operational reference to the upstream kit | `the upstream kit` |
| operational reference to the upstream's author | `the upstream author` |

> **ERRATUM, added at close-out 2026-08-20.** The table above maps `his` to `their`
> unconditionally, and that is wrong for the **absolute possessive**, where the correct form is
> `theirs`. Applied literally it produced two ungrammatical sites that shipped and were caught by
> QA: "their is hand-maintained" and "adapted from their" (`docs/kit-adoptions.md:139` and `:148`,
> fixed in `8f88684`). The rule should read: `his` becomes `their` before a noun and `theirs` when
> it stands alone. Corrected here rather than left in a commit message, because this effort's own
> doctrine is that an uncorrected record regenerates the defect.

Five constraints on applying them:

- **Fix verb agreement wherever a pronoun changed number.** "he has" becomes "they have", "he is"
  becomes "they are". A pronoun swap that leaves a singular verb behind is an incomplete edit.
- **Every pronoun goes, including those for the upstream author, and including in files where the
  upstream's name is kept.** Nobody in this repo has stated their pronouns and a name does not
  imply them. `docs/kit-adoptions.md` is the case that matters: it keeps one credit by name and
  still de-genders all 45 of its pronouns.
- **Provenance clauses keep their evidentiary content. The name is replaced, never deleted.**
  `docs/take-stock.md:334` ("were surfaced to Daren this pass and he had nothing to add, which is
  not an adjudication of...") becomes "were surfaced to the user this pass and they had nothing to
  add". Dropping the clause destroys the evidence `docs/backlog.md` and `docs/take-stock.md`
  verdict against. This rule was in the spec and missing from revision 1.
- **Trigger phrasing in a frontmatter `description` survives the substitution.** A description is
  what the harness selects the skill on, so trigger words stay and only the referent moves. A
  description that reads better and fires worse is a regression and nothing in the test suite
  catches it. The one description whose trigger *is* the name being removed has its literal
  replacement written out below.
- **One site takes `the operator` instead, by exception.** `agents/security-reviewer.md:29` is the
  only line in the payload where "user" already carries the adversarial sense ("any user-influenced
  value is concatenated into the text"), so "the user's personal EF Core projects" would make one
  noun name both the attacker and the operator inside the clause that downgrades a finding. That
  site reads "the operator's own EF Core projects". Added 2026-08-20 after the S3/S4 adversarial
  review; it is an exception to the vocabulary and not a licence to vary it elsewhere.
- **`the user` is not always the right reading of a possessive.** "Daren's review surface" becomes
  "the user's review surface", but "Daren-authored SQL" reads better as "the user's own SQL".
  Preserve meaning over a mechanical token swap.

**Not `the kit's original author`** for the upstream. They authored the upstream kit, not this one.

## The carve-out (read this before editing)

**Never edit a name that is (a) a verbatim quotation of text from somewhere else, or (b) part of
an identifier.** Everything else is prose and is swept.

Revision 1 keyed this rule on **code fences** and that was wrong, which review caught as a
Critical. `README.md`'s directory tree is a single fence spanning `:9-:66`, and it contains five
prose descriptions that must be swept. A fence-keyed carve-out told one sweeper to skip exactly
the lines the disposition table told another sweeper to change, and left three fenced sites with
no ruling at all. Fencing is a formatting choice; being a quotation or an identifier is what
actually makes a name untouchable.

So the test is not "is it fenced" but:

- **Is this text reproduced from somewhere else, where the point is that it says what it says?**
  A quotation of another file's current wording, an example of pre-sweep output, someone's actual
  words. Never edited: editing it makes the quotation false. This is the em-dash lesson from
  commit `74adfa9`, where stripping a character from a **copied** body would have written altered
  code into a teammate's file. What made that untouchable was that it was copied, not that it was
  fenced.
- **Is this a path, URL, repo slug, package id, marketplace id, email, or the real name of an
  external artifact?** Never edited: the text is a pointer and rewriting it breaks what it points
  at.
- **Otherwise it is prose**, fenced or not, and it is swept.

The three sites revision 1 left unruled, now ruled: `README.md:29` (`Daren's C# style`),
`README.md:35` (`under Daren's identity`) and `plugins/claude-kit/agents/pr-reviewer.md:71`
(`worth Daren's attention`) are all **prose inside a fence** and are all **swept**.

## List 1: identifiers (exhaustive, never changed)

Real machine or remote state. Editing the text does not rename the thing, it breaks the pointer.

| Site | Value | What breaks |
|---|---|---|
| `docs/kit-adoptions.md:5` | `SApplefeld/sapplefeld-claude-kit` | The recorded upstream remote. |
| `docs/kit-adoptions.md:5` | `~/repos/sapplefeld-claude-kit` | `kit-adoption-pass` step 2 runs `test -d <clone>/.git` against this exact path and stops the pass when it does not resolve. |
| `docs/kit-adoptions.md:45` | `~/repos/claude-kit-scott` | The record that this path already drifted once. Rewriting it destroys the evidence the note carries. |
| `docs/kit-adoptions.md:97` | `scott-writing-style` | The real name of an upstream skill, in a rejection ledger row. Lower case, so the revision-1 pattern could not see it, and "de-name everything else" would have renamed a real artifact and falsified the row. |
| `README.md:3` | `` `daren` `` | The marketplace id, backticked. **The id only. The prose on that line is swept.** |
| `README.md:78` | `daren-porter/claude-kit` | The GitHub push target. |
| `README.md:84` | `daren-porter/claude-kit` | `/plugin marketplace add` argument. |
| `README.md:85` | `claude-kit@daren` | `/plugin install` argument. |
| `README.md:87` | `daren` | `/plugin marketplace update` argument. |
| `docs/architecture.md:7` | `` `daren` `` | The marketplace id. This file's only match. |
| `.claude-plugin/marketplace.json:2` | `"name": "daren"` | The marketplace id every install path keys off (`~/.claude-work/plugins/cache/daren/claude-kit/<sha>/`). Renaming breaks every existing install. |
| `.claude-plugin/marketplace.json:5` | `"email": "daren@asr-solutions.com"` | Attribution metadata, kept by decision. |
| `.claude-plugin/marketplace.json:15` | `"email": "daren@asr-solutions.com"` | Same. |
| `plugins/claude-kit/.claude-plugin/plugin.json:6` | `"email": "daren@asr-solutions.com"` | Same. |
| `plugins/claude-kit/skills/cross-project-memory/SKILL.md:48` | `~/.claude-work/projects/-home-daren-repos-EleosCore/memory/feedback_stage_dont_commit.md` | A real file the skill instructs the reader to open. This file's only match. |
| `docs/plans/kit-denaming_spec_v1.md` | `daren-porter/claude-kit`, and the quoted pattern strings naming `sapplefeld` | This spec quotes both while describing them. Located by content at execution time, since this file's line numbers move as the effort runs. |

## List 2: attribution (exhaustive, name kept verbatim)

The ruling, 2026-08-20: names are not deleted from things that do not belong to this kit.

**The rule, stated because revision 1 applied it inconsistently and review caught it:** crediting
*authorship of work outside this kit* is attribution and is kept, **wherever it appears, payload
or `docs/`**. Describing *this kit's own machinery* is operational and is de-named, even when the
upstream's name appears in the description. Revision 1 kept `design-council/SKILL.md:113` as
plagiarism-adjacent-to-remove while sweeping `docs/README.md:47`, which is the identical act, with
no stated reason for the asymmetry. There is no payload/docs asymmetry; there is only the
credit/machinery distinction.

| Site | What is credited |
|---|---|
| `plugins/claude-kit/skills/design-council/SKILL.md:113` | The upstream design-council skill this one was adapted from, and through it the Converge concept in `DheerG/swarms` (MIT). |
| `plugins/claude-kit/skills/sql-style/SKILL.md:8` | The named house style used as this style's functional baseline. |
| `plugins/claude-kit/skills/sql-style/SKILL.md:12` | "the full Scott style" as the convention in EleosCore and sibling team repos. Operational for an ASR reader: "the upstream author's style" names nothing they can find in `ASR.Eleos.Database*`. |
| `plugins/claude-kit/skills/sql-style/references/sql-style.md:3` | The same baseline credit. |
| `plugins/claude-kit/skills/sql-style/references/sql-style.md:107` | "Scott-style repos use leading commas", naming a real convention. |
| `plugins/claude-kit/skills/csharp-style/references/csharp-style.md:7` | The retired "match Scott-style siblings" default, a historical fact about a named convention. |
| `README.md:5` | The fork credit. One of exactly two places the upstream is named as this kit's origin. |
| `README.md:30` | "Scott-baseline" in the `sql-style` line, matching the skill it describes. |
| `docs/kit-adoptions.md:8` | The other fork credit. This file keeps this one and de-names the rest. |
| `docs/README.md:47` | "Adapted from Scott's memq work as design input rather than ported." Adaptation credit. **Added in revision 2.** |
| `docs/README.md:58` | "Scott-informed adoptions", crediting the source of four adopted items. **Added in revision 2.** |
| `plugins/claude-kit/.claude-plugin/plugin.json:5` | `"name": "Daren Porter"`, the package author. Kept by decision. |
| `.claude-plugin/marketplace.json:4` | `"name": "Daren Porter"`, the marketplace owner. Same. |
| `.claude-plugin/marketplace.json:14` | `"name": "Daren Porter"`, the plugin author. Same. |

Explicitly **not** attribution, and therefore de-named: `docs/README.md:16`, `:35` and `:49`,
which describe this kit's ledger and adoption skill rather than crediting authored work.

## List 3: verbatim quotations (exhaustive, never changed)

**New in revision 2.** Review found that a third surviving class existed on neither list, which
made S1's exhaustiveness criterion and S3/S5's reconciliation criterion mutually unsatisfiable:
the reconciliation greps demand that every surviving occurrence be an identifier or attribution,
and these are neither.

Each of these reproduces text from elsewhere, and editing it would make the quotation false.

| Site | What is quoted |
|---|---|
| `docs/plans/kit-denaming_spec_v1.md` | `"He decides which"`, quoting `finishing-work/SKILL.md:22`'s current text. The pronoun is the entire point of the sentence quoting it. |
| `docs/plans/kit-denaming_spec_v1.md` | `AUTHOR:  Daren Porter / ASR Solutions`, the pre-sweep template being specified for replacement. |
| `docs/plans/kit-denaming_spec_v1.md` | `"Daren Porter's C# house style"`, the pre-sweep description quoted in S3's trigger rule. |
| `docs/plans/kit-denaming_spec_v1.md` | `"Daren Porter's personal Claude Code kit"`, the pre-sweep `plugin.json` description. |
| `docs/plans/kit-distribution_spec_v1.md:23` | `"claude-kit is a personalized fork of Scott Applefeld's kit,"`, quoting `kit-adoption-pass/SKILL.md:8`. |
| `docs/plans/kit-distribution_spec_v1.md:41` | `"Inbound only. Nothing goes back to Scott"`, quoting that skill's `:16`. |

Sites in `kit-denaming_spec_v1.md` are located by content rather than line number, because that
file's lines move as the effort runs.

**Consequence for sections 3 and 5:** their reconciliation criterion reads "a fresh grep returns
only occurrences on section 1's identifier and attribution lists". It must be read as **all three
lists**. The spec is amended to say so.

## File dispositions

All 47 match-bearing files, plus one file with no matches that is in scope and must end unchanged.
Every row names its owning section, which revision 1 omitted for 11 rows while S3, S4 and S5 each
close on "every file matches the disposition section 1 assigned it".

NAME counts are case-insensitive `daren` plus `porter`, so they include the ALL-CAPS forms
revision 1 could not see. UP is case-insensitive upstream. PRO is pronouns.

### Swept, with named exceptions

| S | File | NAME | UP | PRO | Exceptions |
|---|---|---|---|---|---|
| 5 | `README.md` | 15 | 6 | 0 | Keep `:5` and `:30` (attribution) and the identifier tokens on `:3`, `:78`, `:84`, `:85`, `:87`. **On `:3`, keep only the backticked `daren`; the prose on that line is swept.** Sweep `:29`, `:35`, `:36`, `:52` (all prose, all inside the `:9-:66` fence). |
| 5 | `docs/kit-adoptions.md` | 6 | 14 | 45 | Keep `:5`, `:45`, `:97` byte for byte; keep the `:8` credit. De-name all other prose; all 45 pronouns go. |
| 5 | `docs/README.md` | 5 | 6 | 1 | Keep `:47` and `:58` (attribution). De-name `:16`, `:35`, `:49`. |
| 4 | `.claude-plugin/marketplace.json` | 9 | 0 | 0 | Sweep `description` (`:7`) only. Keep `:2` id, `:4`/`:14` names, `:5`/`:15` emails. |
| 4 | `plugins/claude-kit/.claude-plugin/plugin.json` | 5 | 0 | 0 | Sweep `description` (`:3`) only. Keep `:5` name, `:6` email. |
| 3 | `plugins/claude-kit/skills/sql-style/SKILL.md` | 8 | 3 | 1 | Keep `:8`, `:12` (attribution). Sweep `:3`. Apply the generated-artifact replacements to `:41` **and `:44`**. |
| 3 | `plugins/claude-kit/skills/sql-style/references/sql-style.md` | 6 | 3 | 0 | Keep `:3`, `:107` (attribution). Apply the generated-artifact replacements to `:180` **and `:183`**. |
| 3 | `plugins/claude-kit/skills/csharp-style/references/csharp-style.md` | 3 | 1 | 2 | Keep `:7` (attribution). Sweep the rest. |
| 3 | `plugins/claude-kit/skills/design-council/SKILL.md` | 13 | 2 | 3 | Keep the whole `:113` Provenance sentence. Sweep the rest. |
| 3 | `plugins/claude-kit/skills/kit-adoption-pass/SKILL.md` | 9 | 10 | 24 | Sweep everything, including the frontmatter `description`, whose literal replacement is written out below. |

### Swept fully

| S | File | NAME | UP | PRO |
|---|---|---|---|---|
| 2 | `plugins/claude-kit/skills/cold/SKILL.md` | 6 | 0 | 6 |
| 2 | `plugins/claude-kit/skills/responding-to-review/SKILL.md` | 5 | 0 | 1 |
| 3 | `plugins/claude-kit/skills/pr-review/SKILL.md` | 25 | 0 | 7 |
| 3 | `plugins/claude-kit/skills/executing-work/SKILL.md` | 24 | 0 | 4 |
| 3 | `plugins/claude-kit/skills/brainstorming/SKILL.md` | 11 | 0 | 5 |
| 3 | `plugins/claude-kit/skills/brainstorming/references/visual-companion.md` | 11 | 0 | 12 |
| 3 | `plugins/claude-kit/skills/finishing-work/SKILL.md` | 9 | 0 | 2 |
| 3 | `plugins/claude-kit/skills/kaizen/SKILL.md` | 7 | 0 | 5 |
| 3 | `plugins/claude-kit/skills/curating-docs/SKILL.md` | 5 | 0 | 7 |
| 3 | `plugins/claude-kit/skills/csharp-style/SKILL.md` | 4 | 0 | 1 |
| 3 | `plugins/claude-kit/skills/kit-goal/SKILL.md` | 3 | 0 | 0 |
| 3 | `plugins/claude-kit/skills/writing-skills/SKILL.md` | 2 | 0 | 0 |
| 3 | `plugins/claude-kit/skills/branch-hygiene/SKILL.md` | 1 | 0 | 0 |
| 3 | `plugins/claude-kit/skills/systematic-debugging/SKILL.md` | 1 | 0 | 0 |
| 4 | `plugins/claude-kit/agents/pr-reviewer.md` | 7 | 0 | 0 |
| 4 | `plugins/claude-kit/agents/design-facilitator.md` | 4 | 0 | 0 |
| 4 | `plugins/claude-kit/agents/docs-curator.md` | 2 | 0 | 0 |
| 4 | `plugins/claude-kit/agents/council-member.md` | 1 | 0 | 0 |
| 4 | `plugins/claude-kit/agents/security-reviewer.md` | 1 | 0 | 0 |
| 4 | `plugins/claude-kit/hooks/session-start.js` | 1 | 3 | 0 |
| 4 | `plugins/claude-kit/hooks/kit-goal-lib.js` | 1 | 0 | 0 |
| 4 | `plugins/claude-kit/hooks/memory-lib.js` | 1 | 0 | 0 |
| 4 | `test/session-start-adoption.test.js` | 0 | 1 | 0 |
| 4 | `test/kit-goal-lib.test.js` | 1 | 0 | 0 |
| 4 | `test/kit-goal-stop.test.js` | 1 | 0 | 0 |
| 5 | `docs/visual-companion.md` | 6 | 0 | 0 |
| 5 | `docs/take-stock.md` | 5 | 0 | 1 |
| 5 | `docs/backlog.md` | 4 | 1 | 0 |
| 5 | `docs/cross-project-memory.md` | 1 | 2 | 0 |
| 5 | `docs/prose-accretion.md` | 1 | 0 | 0 |
| 5 | `docs/security-model.md` | 1 | 0 | 0 |
| 5 | `docs/plans/design-skill_spec_v1.md` | 5 | 1 | 0 |
| 5 | `docs/plans/kit-distribution_spec_v1.md` | 3 | 7 | 4 |
| 5 | `docs/plans/kit-concurrent-sessions_spec_v1.md` | 2 | 0 | 1 |

`docs/backlog.md:12` reads "ported from the sapplefeld kit" in **bare prose**, with no enclosing
identifier. It is swept to "the upstream kit". Revision 1 claimed `sapplefeld` only ever appears
inside a larger identifier; that was false and is struck.

### Swept, count measured at execution time

| S | File | Why not pinned |
|---|---|---|
| 5 | `docs/plans/kit-denaming_spec_v1.md` | This spec is edited by sections 1 through 5 as they run, so any pinned count is stale before S5 reads it. Measure it when S5 starts. Apply list 3 (verbatim quotations) carefully here: this file quotes more pre-sweep text than any other. |

### In scope, must end unmodified

Record as verified-unchanged rather than skipped, so the reconciliation grep closes and a reviewer
can tell a deliberate no-op from a miss.

| S | File | Why |
|---|---|---|
| 5 | `docs/architecture.md` | Its one match is the `daren` marketplace id at `:7`. Identifier. |
| 3 | `plugins/claude-kit/skills/cross-project-memory/SKILL.md` | Its one match is the memory-store path at `:48`. Identifier. |
| 4 | `plugins/claude-kit/assets/CLAUDE.md` | Zero name and zero pronoun matches across all 46 lines, verified 2026-08-20. It is also written in the first person **from** the user to the agent ("If my plan or code is wrong", "without my explicit permission", "so I know what is different on my machine"), a voice this sweep has no business touching. |

## Coupled edits

Two pairs must change in the same commit or the gate breaks:

1. `plugins/claude-kit/hooks/session-start.js:535` emits
   `the last adoption pass over Scott's kit was N days ago`, and
   `test/session-start-adoption.test.js:50` asserts on it with
   `/the last adoption pass over Scott's kit was (\d+) days ago/`.
2. `plugins/claude-kit/hooks/kit-goal-lib.js:89` builds a condition string containing `Daren`, and
   `test/kit-goal-lib.test.js:274` asserts `cond.includes('Daren')`.
   `test/kit-goal-stop.test.js:192` uses `Daren` inside a fixture's BLOCKED message, which is test
   data rather than an assertion on the library, and can move independently.

The gate is `node --test test/*.test.js tools/*.test.js` from the repo root, per `README.md:159`.
318 tests, green at `74adfa9`. The narrower `test/*.test.js` form is **not** the gate: it misses
`tools/accretion.test.js`, the only coverage for the payload file `hooks/accretion-lib.js`.

## The generated-artifact pass

A name grep reads a fenced template as example output rather than as prose about a person, which
is how the original stub missed this category and how revision 1 missed half of it. There are
**two** lines, not one, and they sit three lines apart in the same template.

`plugins/claude-kit/skills/sql-style/SKILL.md:41` and
`plugins/claude-kit/skills/sql-style/references/sql-style.md:180`:

```
        AUTHOR:  Daren Porter / ASR Solutions
```

becomes, literally:

```
        AUTHOR:  ASR Solutions
```

`plugins/claude-kit/skills/sql-style/SKILL.md:44` and
`plugins/claude-kit/skills/sql-style/references/sql-style.md:183`:

```
        NOTES:   v1.0 - 2026-06-10 - DAREN PORTER - ASR SOLUTIONS
```

becomes, literally:

```
        NOTES:   v1.0 - 2026-06-10 - ASR SOLUTIONS
```

The org half stays in both: employer and product names are out of scope for this effort. A
rewording such as `AUTHOR:  the user / ASR Solutions` is **wrong**. This is generated output that
lands in real deployment scripts, not prose about a person.

## The one description whose trigger is the name

`plugins/claude-kit/skills/kit-adoption-pass/SKILL.md:3`. Its selection trigger *is* the name being
removed, so the replacement is written out rather than left to a sweeper. Every trigger phrase in
the original survives; only the referent moves.

Current:

```
description: "Use when running the inbound pass over Scott Applefeld's kit: Daren asks what Scott has changed, wants the two kits compared, wants something pulled across, or accepts the session-start nudge that the last pass has gone stale. Also when a prior pass left a pending candidate Daren now wants adjudicated."
```

Replacement:

```
description: "Use when running the inbound pass over the upstream kit this one is forked from: the user asks what the upstream has changed, wants the two kits compared, wants something pulled across, or accepts the session-start nudge that the last pass has gone stale. Also when a prior pass left a pending candidate the user now wants adjudicated."
```
