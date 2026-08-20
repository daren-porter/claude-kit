# Kit De-naming for Public Release

Status: In Progress
Commit Model: Branch-and-PR
Fable Spend: finishing reviews only
Created: 2026-08-07

## Goal

Every working-tree file outside `docs/archive/` refers to the kit's operator as "the user" and
to the forked-from kit as "the upstream kit" or "the upstream author", carrying no personal
names and no gendered pronouns for either. Attribution to work that is not this kit's, real
identifiers, and the employer and product names stay verbatim, unchanged. Package metadata keeps
its real author name.

What this buys is a kit that reads correctly for anyone at the org who installs it, without
the current prose telling every one of them that the rules are about somebody else. It is not a
generic kit and does not claim to be; the base-kit genericization and any name-token mechanism
belong to `kit-distribution_spec_v1.md`, and this effort deliberately stops short of both.

## Approach

Designed 2026-08-20. The stub this replaces was written 2026-08-07 and amended 2026-08-11; both
are superseded by what follows, and where the stub's reasoning was wrong it is corrected here
rather than left standing, because a plan doc that carries a wrong premise regenerates the defect
every time a session reads it (`plans/record-vs-artifact_spec_v1.md` opens on exactly that).

### The measured surface, remeasured

The stub's "137 occurrences across 25 files" is a 2026-08-07 count and is stale. Measured
2026-08-20 from the repo root. Figures are pattern-match occurrences rather than distinct sites,
and the `Scott|Applefeld|sapplefeld` pattern double-counts "Scott Applefeld", so treat them as an
upper bound on tokens to review, not a count of edits owed.

| Surface | `Daren` | upstream-author pattern | `he/his/him` | files |
|---|---|---|---|---|
| `plugins/` (ships and loads) | 165 | 22 | 72 | 28 |
| `docs/` living root `*.md` | 29 | 21 | 38 | 8 |
| `docs/plans/` (active) | 22 | 16 | 6 | 4 |
| `README.md` | 7 | 6 | 0 | 1 |
| `test/` | 2 | 1 | 0 | 3 |
| package metadata (2 `.json`) | 5 | 0 | 0 | 2 |
| **in scope** | **230** | **66** | **116** | **46** |
| `docs/archive/` (out of scope) | 248 | 93 | 74 | 21 |

### Three modes, and only one of them is a rewording

The stub's central error was treating this as a wording problem with five categories. A name in
this repo appears in one of three modes, and the mode decides the treatment:

1. **Prose.** The bulk. Direct address, possessives, narration, provenance clauses, skill
   frontmatter `description` fields. Rewordable, and this is what the sweep changes.
2. **Identifiers.** Real machine and remote state that cannot be renamed by editing text.
   `docs/kit-adoptions.md:5` records the upstream as `SApplefeld/sapplefeld-claude-kit` cloned at
   `~/repos/sapplefeld-claude-kit`, and `kit-adoption-pass` step 2 runs `test -d <clone>/.git`
   against that exact path and stops the pass when it does not resolve. Same class:
   `~/repos/claude-kit-scott` at `kit-adoptions.md:45`, and `daren-porter/claude-kit` in the
   README's install instructions. These stay byte for byte or the thing they point at breaks.

   **The lower-case form is its own surface, and all of it is this mode.** Twelve occurrences of
   `daren` that the table below does not count, because the table counts the capitalised name:
   the marketplace id (`README.md` five times, `.claude-plugin/marketplace.json:2`, and
   `docs/architecture.md:7`), the author email in both `.json` files, the repo slug, and a real
   memory-store path at `skills/cross-project-memory/SKILL.md:48` that the skill tells the reader
   to open. Not one is prose, so the sweep changes none of them. `docs/architecture.md` is
   therefore in scope and ends the effort unmodified, which section 1 records so a reviewer does
   not read it as a miss.
3. **Attribution.** Credit for work that is not this kit's. The user's ruling, 2026-08-20: names
   are not deleted from things that do not belong to this kit. Stays verbatim.

### The substitution vocabulary

- `Daren` and `Daren's` become **"the user"** and **"the user's"**. It is unambiguous against the
  existing second person, which every skill already spends on the agent, and it matches the
  harness's own vocabulary.
- `he`, `his`, `him`, `himself` referring to the user or the upstream author become
  **`they`, `their`, `them`, `themselves`**, with verb agreement fixed. This is co-equal with the
  name sweep, not a follow-up to it: replacing the name and leaving "He decides which"
  (`finishing-work/SKILL.md:22`) both leaks the identity and misgenders every other reader. It is
  also compliance rather than polish, since the payload's current prose contradicts the they/them
  rule in force in every session the kit runs under.
- Operational references to the upstream become **"the upstream kit"** and **"the upstream
  author"**. Not "the kit's original author", which is wrong on the facts: they authored the
  upstream kit, not this one.

### What is de-named and what is kept, for the upstream half

Adjudicated 2026-08-20. Of the 22 payload occurrences, roughly 13 are de-named and 9 are kept:

- **De-named (operational machinery):** `skills/kit-adoption-pass/SKILL.md` (10, frontmatter
  `description` included, which loads into every session's context) and
  `hooks/session-start.js` (3: two comments plus the emitted staleness nudge at `:535`).
- **Kept (attribution):** `skills/design-council/SKILL.md`'s Provenance block, which credits the
  adapted skill and the third-party MIT concept behind it; `skills/sql-style/SKILL.md` and its
  reference, where the named house style is both a credit and an operational instruction, since
  "the upstream author's style" tells nobody what they are looking at in `ASR.Eleos.Database*`;
  and `skills/csharp-style/references/csharp-style.md`'s retired-default note.

The consequence is that the skill becomes generic machinery while the fact of who the upstream is
keeps living in exactly two honest places, `docs/kit-adoptions.md:5`'s source record and
`README.md:5`'s fork credit. That is also the shape `kit-distribution` will need: generic skill,
fork-local record.

This corrects the stub's 2026-08-11 amendment, which claimed the upstream-consent question was
"dissolved by architecture" because the adoption ledger lives in `docs/` and never ships. That is
true of the ledger and of nothing else: 22 occurrences ship, in six payload files. What actually
settles the question is the user's instruction to de-name the operational half and keep the
attribution, not the payload boundary.

### The mechanism question is closed by the update path

The stub asked what replaces direct address and floated a configured operator name; the user
asked whether a replacement token or environment variable could carry a real name through the
docs. Verified 2026-08-20, and the answer is that install-time substitution is not available:

- The plugin cache is keyed by commit sha (`~/.claude-work/plugins/cache/<marketplace>/claude-kit/74adfa99a5b5/`,
  matching `HEAD`), and `installed_plugins.json` records an `installPath` per version. A
  `/plugin update` pulls a fresh tree into a new directory, so anything a setup script rewrote in
  the old one is discarded, on every update, forever.
- `SKILL.md` has no interpolation. The `$ARGUMENTS` append is per-invocation and carries no
  identity.
- Skills cannot read environment variables. Only hooks can, and the kit already does
  (`CLAUDE_KIT_MEMORY_DIR`, `KIT_GOAL_STOP_RETRY_MS`), so an env var could only ever reach
  hook-emitted text such as `session-start.js:535`.

So the token idea collapses to something cheaper and already built: a role noun in the prose, plus
an optional identity line in a surface the user owns. `assets/CLAUDE.md` becomes
`~/.claude/CLAUDE.md`, and `reconcile-claude-md` already merges it. This effort adds no
configuration surface. Designing a real name mechanism is `kit-distribution`'s, and it now has a
constraint to design against rather than an open question.

### Pilot before bulk, because the stub's own hazard is real

The stub warns that picking the wrong replacement costs the whole sweep twice. That warning
survives even though its reasoning about the fork model does not, so the ordering honors it:
`cold` and `responding-to-review` are swept and validated first, and the vocabulary is revisable
at that gate. The two skills are chosen because the stub names them as the ones whose force leans
hardest on direct address. That claim is asserted and has never been measured.

Nothing else can measure it. The JS gate (`node --test test/*.test.js tools/*.test.js`, 318
tests, green at the branch point) cannot exercise prose, so a 296-occurrence rewrite
of behavior-shaping skills otherwise ships with no signal at all, which is how the backlog's
unvalidated-wording item got most of its entries.

### The sweep's main hazard has a local precedent

Commit `74adfa9` (2026-08-20) records a mechanical character sweep, the em-dash ban, that two
review findings had to reshape: stripping an em dash from a **copied** body would have written
altered code into a teammate's file byte for byte, under the user's identity, with nothing naming
it. The rule that survived is scoped to prose the reviewer wrote and explicitly not to a fenced
suggestion body or a quotation.

The same scoping binds here, and it is why section 1 exists as its own section. A name inside a
quoted line of session evidence, a fenced example, a file path, or a remote slug is not prose the
sweep may touch. This is the third instance of the stub's own "what a mechanical sweep provably
misses" lesson, which named only one category and undercounted its own by three.

## Sections of Work

### 1. Substitution rules and file dispositions

Write the contract that sections 3 through 5 execute against, to
`.kit/denaming-rules.md`, promoted to `docs/archive/kit-denaming_s1-rules.md` at close-out per the
precedent of `docs/archive/kaizen-stop-start-continue_s3-inventory.md`.

**Not a row per occurrence.** A 296-row table is a document nobody reads, and its totals would be
checked by re-running grep rather than by reading it. What sections 3 through 5 actually need is
four things:

1. **The substitution rules**, as stated in the Approach, plus the carve-out that no name inside a
   quotation, a fenced block, a file path, or a remote slug is touched. That carve-out is the
   em-dash lesson and it is the rule most likely to be violated by a fast sweep.
2. **The complete identifier list**, every occurrence, with what breaks if the value changes.
   This list must be exhaustive because it is a deny-list, and a missed entry is a broken thing
   rather than a missed edit.
3. **The complete attribution list**, every occurrence, with what is being credited. Exhaustive
   for the same reason, pointed the other way.
4. **A per-file expected disposition** for all 46 in-scope files: swept, identifier-only,
   attribution-only, or untouched. This is what makes the sweep reviewable, because it lets a
   reviewer tell a file that was deliberately left alone from one that was missed.

Search patterns are `Daren`, `Porter`, `Scott`, `Applefeld`, `sapplefeld` and the pronoun set
`\b(he|his|him|himself)\b`, run case-insensitively over the in-scope tree, plus a separate pass
over generated-artifact templates and fenced blocks, since a name grep reads those as example
output rather than as prose and that is how the stub missed its own category 3.

Acceptance criteria:
- The identifier and attribution lists are exhaustive: every match of every pattern is either on
  one of them or falls under the prose rules, with no occurrence unaccounted for. Verified by a
  fresh grep at review time.
- All 46 in-scope files carry an expected disposition. `docs/architecture.md` is
  identifier-only and `plugins/claude-kit/assets/CLAUDE.md` is untouched, both already established
  in the Approach.
- The `AUTHOR:  Daren Porter / ASR Solutions` template at `skills/sql-style/SKILL.md:41` and
  `skills/sql-style/references/sql-style.md:180` resolves to the literal line
  `AUTHOR:  ASR Solutions`, written out in the rules as the exact replacement text. It is
  generated output rather than prose about a person, so a rewording such as
  `AUTHOR:  the user / ASR Solutions` is wrong and the rules must say so.
- `test/session-start-adoption.test.js:50`'s regex is recorded against the
  `hooks/session-start.js:535` string it asserts on, so section 4 changes them together.

Execution mode: main.

Tests: none. This section produces a document, not behavior. The exhaustiveness criterion is its
own check.

### 2. Pilot and validate on the two load-bearing skills

Apply section 1's rules to `skills/cold/SKILL.md` and `skills/responding-to-review/SKILL.md`
only, then test whether the substitution degrades the behavior those two skills exist to produce.

The test is an A/B arm rather than a RED: nothing new is being ruled, so the question is
regression, not admissibility. `writing-skills` owns the mechanics of arming and reading an arm;
follow it for dispatch discipline and leak rules even though the shape differs.

**The two variants.** Variant A is the skill's wording as at the branch point, captured with
`git show <base>:<path>` before the edit. Variant B is the swept file. They differ by the whole
substitution (name, pronouns, verb agreement), because that package is the treatment under test,
not the name alone.

**Delivery, and the one thing that makes the arm readable.** Each rep receives one variant's full
text plus the fixture, in-prompt, and nothing else: no repo access to this kit, no plan doc, no
skill file on disk, and no indication that a second variant exists or that any file is mid-edit.
That last part is what the arm rests on. A rep that can see a half-swept tree is measuring its own
suspicion rather than the wording, and a rep told it is comparing two drafts will find a
difference because it was asked to.

**The fixtures are self-contained by construction**, which is what lets the no-repo-access rule
hold without making them unrealistic. For `cold`: a decision stated entirely in the prompt, with
its facts inline and a visible preferred answer baked into the framing. For
`responding-to-review`: a review finding plus the code it concerns, both quoted inline, where the
finding is wrong in a way the prompt contains enough information to establish. Neither fixture
needs a file read, so neither needs the repo.

**Read on behavior, not on prose quality.** For `cold`, whether the rep strips the evaluative
framing and names the strongest objection to the wanted answer. For `responding-to-review`,
whether the rep pushes back rather than complying with the wrong finding. Both are observable in
the output and neither requires judging whether the text reads flatter.

**Cost.** At least three reps per variant per skill, so twelve dispatches minimum, and a gate
failure buys a vocabulary revision plus a full re-run of the post-sweep half. This is the effort's
long pole and its only test signal; the alternative is shipping a 296-occurrence rewrite of
behavior-shaping skills with nothing checking it.

Leak hazard specific to this section: this spec is a `docs/plans/` file naming the substitution and
the claim under test, and `writing-skills`' answer-leak rules count that as a route to the
conclusion. The in-prompt-only delivery above is what closes it.

**This section is a gate.** If the post-sweep arm is worse than the pre-sweep arm, the vocabulary
is revised and this section re-runs before section 3 starts. Record the revision and the reason in
the Chapter.

Acceptance criteria:
- Both skills carry no personal name and no gendered pronoun, and read as intended prose rather
  than mechanical substitution.
- Both arms are run at the same rep count, and the pre-sweep arm is run against the wording as it
  stands at this section's start, captured before the edit.
- The Chapter records both arms' outputs, the comparison, and the gate decision. A "no observable
  difference" result is a pass and is recorded as such.
- If the gate fails, the revised vocabulary is written back into section 1's rules before
  section 3 begins.

Execution mode: main.

Tests: the A/B arm above is this section's test, and it is the only test signal the whole effort
gets. Its risk is that a 296-occurrence prose rewrite of behavior-shaping skills silently flattens
the two skills whose force comes from direct address.

### 3. Bulk payload skill sweep

Apply section 1's rules to the remaining files under `plugins/claude-kit/skills/`, roughly 24 files
holding the bulk of the prose surface.

Acceptance criteria:
- Every file matches the disposition section 1 assigned it, and every occurrence on the
  identifier and attribution lists is byte-identical.
- No edit the substitution rules do not call for. Adjacent rewording, tightening, and reflowing
  are out; this is a substitution, and the em-dash precedent above is why.
- Frontmatter `description` fields are swept along with bodies. They load into every session's
  context, so they are the highest-visibility prose in the payload.
- **Trigger phrasing in a `description` survives the substitution.** A description is not a
  summary, it is what the harness selects the skill on, so the trigger words stay and only the
  referent moves: `csharp-style`'s "Daren Porter's C# house style" becomes "The user's C# house
  style" and keeps every "Trigger on any C# work even when style isn't named" clause intact. A
  description that reads better and fires worse is a regression, and nothing in the test suite
  would catch it.
- Verb agreement is corrected wherever a pronoun changed number.
- A fresh grep over `plugins/claude-kit/skills/` returns only occurrences on section 1's
  identifier and attribution lists.

Execution mode: delegate-capable.

Tests: none available. Section 2's arm is the effort's only behavioral signal, and it is spent
before this section begins.

### 4. Payload non-prose surfaces

Sweep `plugins/claude-kit/agents/`, `plugins/claude-kit/hooks/`, the `description` and `author`
blocks in `plugins/claude-kit/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`,
and the coupled test.

**`plugins/claude-kit/assets/CLAUDE.md` is excluded, on evidence rather than judgment.** Measured
2026-08-20: zero name matches and zero gendered pronouns in all 46 lines. It is also written in
the **first person from the user to the agent** ("If my plan or code is wrong", "Nothing is
committed to main/master without my explicit permission", "so I know what is different on my
machine"), which is a fourth voice mode this sweep has no business touching. Rewriting "my
explicit permission" to "the user's explicit permission" would break the voice of the one file in
the payload that speaks as the user rather than about them. Leave it alone.

The metadata decision, made 2026-08-20: the real author name and email stay in both `.json`
files. Attribution is a different act from direct address, and a shared package having a named
author is honest. The `description` fields lose their possessive framing ("Daren Porter's personal
Claude Code kit" becomes a plain description of what the kit is), because those are prose.

Acceptance criteria:
- Agent prose and hook comments carry no personal name and no gendered pronoun.
- `hooks/session-start.js:535`'s emitted nudge names the upstream generically, and
  `test/session-start-adoption.test.js:50`'s regex is updated in the same commit.
- The full documented gate passes: `node --test test/*.test.js tools/*.test.js` from the repo
  root, per `README.md:159`. The narrower `test/*.test.js` form is not the gate and misses
  `tools/accretion.test.js`, which is the only coverage for a payload file.
- `author` and `owner` name and email fields in both `.json` files are unchanged.
- Both `description` fields are de-named without losing what they describe.
- `assets/CLAUDE.md` is byte-identical at the end of this section, verified by `git status`.

Execution mode: delegate-capable.

Tests: `test/session-start-adoption.test.js` must pass with the updated regex. Its risk is that
the hook string and its assertion drift apart and the staleness nudge silently stops being
covered.

### 5. Repo-level files and living docs

Sweep `README.md`, the nine living root documents in `docs/`, and the eight active plans in
`docs/plans/`, this spec among them. Eight of the nine root documents and four of the eight plans
carry a proper name; the rest are in scope and expected to come back unchanged, which is a result
to record rather than a file to skip.

Acceptance criteria:
- `README.md`'s opening line and its skill and hook descriptions are de-named, while its fork
  credit at `:5`, its install instructions, and every repo and marketplace slug are unchanged.
- `docs/kit-adoptions.md` is de-named in its prose while `:5`'s source record and `:45`'s second
  clone path stay byte for byte, and the file still credits the upstream once.
- The plans that carry names are de-named, and their recorded provenance survives it: a clause that
  says who decided what and when keeps its evidentiary content with the name replaced, never
  deleted. `docs/backlog.md` and `docs/take-stock.md` depend on those clauses.
- `docs/archive/` is untouched, verified by `git status`.
- A fresh grep over the whole in-scope tree returns only occurrences on section 1's identifier
  and attribution lists, and every file matches its assigned disposition.

Execution mode: delegate-capable.

Tests: none. The final grep reconciliation is the check.

## Out of Scope

- **`docs/archive/`.** 248 plus 93 name occurrences across 21 files. `docs/README.md:3` states the
  archive is immutable history, and its Chapters are the evidence base that `kaizen`'s take-stock
  and the backlog's closure conditions verdict against. Rewriting quoted session evidence to say
  "the user said" falsifies the record it exists to preserve, and none of it ships or loads.
- **Git history.** De-naming in place produces a name-free working tree, not a name-free artifact.
  Every name stays in `git log`. The fresh-repo port the user has parked is the only instrument
  that fixes that, and it is deliberately not this effort.
- **Renaming the repo, the plugin, the marketplace, or any recorded clone path.** The marketplace
  id and repo slug are load-bearing for every existing install.
- **Employer and product names.** `EleosCore`, `Eleos`, `ASR`, `ASR Solutions`, `asr-solutions`,
  `ASR.Eleos.Database*` and `usp_AuditError` stay. Decided 2026-08-20 on the grounds that the kit
  is distributed only within the org for now.
- **The base-kit genericization and any name-token mechanism.** Deferred rather than declined. The
  user's stated intent, 2026-08-20, is to eventually genericize even the upstream-specific and
  org-specific content, so that a truly generic base kit (skills, agents, instructions, the
  CLAUDE.md baseline) carries no identity at all, and to settle then how a fork names its own
  user. Both belong to `kit-distribution_spec_v1.md`, which this spec cross-references. Recorded
  here so a later session finds "not now" rather than re-opening it as an unanswered question.
- **Licensing and contribution guidelines.** Real questions a wider release raises, and not this.

## Open Questions

- Whether section 2's gate can fail cleanly. If the pre-sweep and post-sweep arms are
  indistinguishable, that is a pass and the stub's flattening claim is answered. If the arm cannot
  be made to discriminate at all, the section records that the claim is untestable at this scale
  rather than reporting a pass it did not earn. Owner: the section 2 run.

## Chapters

(none yet)
