# Two Kit Corrections: the Mocking Rule and the Anchor Convention

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: finishing reviews only
Created: 2026-11-02

## Goal

Two kit texts state something false about the world they describe, and each costs real work.
`csharp-style` tells every C# test task that "Moq is not used in new tests" when Moq is the house
mocking library, and a reviewer has already enforced that against a real PBI. `pr-reviewer`'s
charter gives the anchor format without the offset convention, so its end offsets come back one
character short and the orchestrator recomputes every one on every PR. When this is done, both
texts agree with the measured facts and the user's rulings, and nothing else in the kit
contradicts them. Chosen 2026-11-02 as the first run under `/kit-goal`, for being valuable and
completable without twists.

## Approach

**Neither section owes baseline arms, and the reason is recorded here so reviewers judge against
evidence rather than assertion.** `writing-skills`' "What this costs" says no arm is owed where
the claim being repaired is about something other than an agent: measure the system instead. The
project memory on premise corrections adds that the claim has to be proved against the sentence's
git history before it is relied on. Both proofs follow.

**Section 1's claim is about the user's codebase and house practice.**
- Provenance: the sentence has been in `csharp-style/references/csharp-style.md` since the kit's
  first commit (`a1bb6f7`, 2026-06-10), whose message says the style guides were derived from the
  user's code and adjudications. **Corrected in Section 1:** this spec first said nothing in
  `docs/` records the adjudication, which was false. The kit's first spec records the user's June
  ruling twice, without ever naming Moq: Open Question 5, "RESOLVED: hand-rolled fakes primary;
  NSubstitute as the sanctioned mocking library" (`archive/claude-kit_spec_v1.md:189`), and "a
  mocking library acceptable where it genuinely helps" (`:101`). The literal ban overstated that
  ruling; the ruling itself was the user's. The search that missed it looked for the banned term
  rather than for what the ruling sanctioned. The upstream kit
  (`~/repos/sapplefeld-claude-kit`) has never mentioned Moq, at HEAD or in its history.
- Measurement, 2026-11-02, across `~/repos`: 9 `.csproj` files reference Moq, none reference
  NSubstitute or FakeItEasy; about 900 Moq uses (`new Mock<` plus `Mock.Of<`) across six repos,
  one of which looks like a second checkout of EleosCore. The 23 hand-rolled fakes found (classes
  named Fake, Stub, Spy or Dummy) are all in Eleos MCP Server, where 272 of 273 commits are
  co-authored by Claude, so they reflect the June ruling as Claude applied it, not the practice
  in the repos the user wrote.
- The incident: 2026-10-28, EleosCore PBI 25858. A test project referencing only Moq
  (`ASR.Eleos.Horizon.Custom.Tests`) collided with the rule, and a reviewer rated the Moq use
  Minor.
- The user's rulings, 2026-11-02, which supersede the June ruling above, pending the user's
  confirmation: they were given before the June ruling was surfaced (Close-out, first bullet). On the library: drop the ban and never add a
  second library, choosing the option "mocks use whichever library the test project already
  references", "but noting that NSubstitute is preferred if the library doesn't otherwise use Moq
  already." That clause ("doesn't otherwise use") is why the criterion below keys on what the
  existing tests use, nearest first, rather than on the test project's own references. On fakes
  against mocks: "do the simplest thing
  ... Mocks when appropriate, hand-rolled when that's easier or will work in a way that a mock
  can't."

As a claim about house practice this is a **contradicted** rule, not a narrower-than-written one (`writing-skills`' counter-case
section), so it is fixed rather than scoped. The new wording is the user's preference, which is
judgment rather than a claim about how something behaves, so the skill text carries no citation;
the commit message carries the provenance and measurement as the recorded instance.

**Section 2's claim is an Azure DevOps fact the kit already verified.**
- `pr-review/SKILL.md:99`: offsets are character-exact and 1-based, computed from the file at the
  source ref, and the end offset is one past the last character covered, so a full-line span runs
  offset 1 through the line's length plus 1. Verified on thread 2717 and confirmed by the user
  2026-08-05; sub-line spans verified on threads 2725 and 2727.
- `agents/pr-reviewer.md:70`'s `Anchor:` line, traced with `git log -L`: written as `<line> or
  <first>-<last>` in `301e956`, reshaped in `3ad9e8d` and `721483e`, and given its
  `<line>:<start>-<line>:<end>` form in `647f941` (2026-08-07). No version has ever stated the
  offset convention. The agent was handed a format and never the ADO fact that fills it.
- The incident: 2026-10-12, EleosCore PR 460. Suggested anchors ended one character short (41:161
  for a 161-character span, 246:35 for a 35-character span), the agent using the last
  character's offset.

So the charter is missing a premise the skill holds, and the directive (produce an anchor) is
unchanged. The fix carries the whole convention rather than the end offset alone, because adding
one member of a set is exactly the shape `plans/enumerations-stop-short_spec_v1.md` predicts gets
caught short.

**Mechanics.**
- Both sections run in the main session: each is a few lines of prose, so writing a dispatch
  costs more than the edit (`executing-work`'s "tiny").
- The sections run serially, never concurrently: three instances of concurrent sections
  colliding in one tree were filed on 2026-11-02.
- Each section takes the paired review (`adversarial-reviewer` with this spec,
  `blind-reviewer` with the diff only), because both edit corpus prose.
- This spec and its index entry are committed before Section 1 starts, so their creation lands in no
  section's diff (`~/.claude-kaizen/declined.md`, 2026-11-02).
- An `agents/` change trips the pre-commit hook's hard test gate and the plugin validation; the
  suite was green at `8ff7e58`.

## Sections of Work

### 1. csharp-style: the mocking rule matches the house practice (complete, Chapter 1)

Edit `plugins/claude-kit/skills/csharp-style/references/csharp-style.md` (the "Fakes first"
bullet in section 11, currently `:186`) and `plugins/claude-kit/skills/csharp-style/SKILL.md`
(the Tests checklist item, currently `:110`).

Acceptance criteria:
- The bullet no longer contains "Moq is not used in new tests", and no wording in either file
  discourages Moq.
- The library rule: a mock uses the mocking library the existing tests already use, judged by
  the tests rather than by one project file and looking nearest first (the tests around the
  change, the same test project, then the repository); a second mocking library is never added;
  where no test in the repository uses one, NSubstitute is preferred (the user's verb; a round-1
  repair that read "the library to add" was reverted in round 2). (Amended in
  Section 1 from "the test project already references", on review; see Chapter 1.)
- The choice rule in the user's terms: do the simplest thing, a mock where a mock fits and a
  hand-rolled `private sealed` fake where that is easier or has to behave in a way a mock cannot.
  "Fakes first" no longer stands as a default, and the mock branch carries no leftover conditions
  from the old NSubstitute exception.
- The `SKILL.md` checklist item agrees with the bullet and no longer names NSubstitute as the only
  library.
- `SKILL.md:92`'s antipattern ("Mocking simple collaborators with a library when a five-line
  hand-rolled fake is clearer") is unchanged and still consistent with the choice rule, checked
  by reading both.
- `grep -rn -i 'moq\|nsubstitute' plugins/` returns only the new text, and nothing else in
  `csharp-style` changed.

Execution mode: main.

### 2. pr-reviewer: the charter carries the anchor offset convention (complete, Chapter 2)

Edit `plugins/claude-kit/agents/pr-reviewer.md` (the suggestion-block paragraph at `:60` and the
`Anchor:` line in Output format at `:70`).

Acceptance criteria:
- The charter states the convention as `pr-review/SKILL.md:99` does: offsets are character-exact
  and 1-based, computed from the file at the source ref; the end offset is one past the last
  character covered; a full-line span runs offset 1 through the line's length plus 1.
- The `Anchor:` line carries or points at that convention, so an agent filling
  `<line>:<start>-<line>:<end>` cannot read `<end>` as the last character's offset.
- One worked example taken from the skill, `245:7-245:24` over `,D.[DispatchDate]` (17
  characters), with arithmetic that checks.
- Nothing in the charter contradicts `pr-review/SKILL.md:99-101`'s fragment and block rules,
  checked by reading both.
- The test suite passes and plugin validation reports nothing beyond the tolerated reserved-name
  error.

Execution mode: main.

## Out of Scope

- The other five items in the `pr-review-batch` kaizen brief, and the `branch-no-track` brief.
- Every other `csharp-style` rule from `a1bb6f7`. Their provenance is equally unrecorded, but
  nothing measured says they are wrong, and auditing them is a separate effort.
- Existing tests anywhere, in any repo.

## Close-out, beyond finishing-work

- Open the close-out message with the provenance correction and a yes/no: the user's 2026-11-02
  rulings reverse their recorded June ruling ("hand-rolled fakes primary; NSubstitute as the
  sanctioned mocking library"), which they were not shown before ruling. Keep 11-02, or restore
  fakes-first? Added on the final review.
- Move `~/.claude-kaizen/briefs/csharp-moq-rule.md` to `~/.claude-kaizen/applied/`.
- Mark item 2 done inside `~/.claude-kaizen/briefs/pr-review-batch.md`, which stays in `briefs/`
  for its other five items.
- Tell the user that the charter edit takes effect only after `/plugin update`, because agents
  load from the installed plugin cache.

## Open Questions

None. Every ruling this effort needs was given on 2026-11-02 and is quoted above.

## Chapters

### Chapter 1 - 2026-11-02
Completed: 1. csharp-style: the mocking rule matches the house practice
Implemented By: main session
Metrics: 2 review rounds, each paired (adversarial + blind); NEEDS_CONTEXT 0; escalations 0; advisor on, consulted once mid-section (whether the provenance error blocked the run)
Decisions / Surprises:
- **The spec's provenance premise was false, and the user was told it.** The triage told the user nothing in `docs/` records why the Moq rule exists; `archive/claude-kit_spec_v1.md:189` records their June ruling ("hand-rolled fakes primary; NSubstitute as the sanctioned mocking library") and `:101` says "a mocking library acceptable where it genuinely helps". The grep looked for the banned term, which that ruling never uses. Found by the round-2 adversarial reviewer. Corrected in the spec, `docs/README.md` and the kaizen brief. Not treated as a blocker: the 2026-11-02 rulings are the user's latest explicit word, they rest on evidence the error does not touch, and the library half agrees with June. The close-out still opens with the correction and asks the user to confirm, because they ruled after hearing the false account.
- **The library criterion was amended on review.** As specced it keyed on what "the test project already references". A new test project in a repo that pins Moq centrally (EleosCore's `ASR.Eleos/Directory.Packages.props`, DataBroker Hub) would read that as "references none" and add NSubstitute as a second library, the outcome the rule exists to prevent. The user's own clause, "if the library doesn't otherwise use Moq already", supports keying on what the existing tests use, nearest first, so the criterion and the Approach were both updated. Recorded rather than raised: it settles an ambiguity in the direction of the user's own words and the rule's stated purpose.
- The single bullet became two, the choice rule and the library rule.
- Neither reviewer wrote the report file the dispatch offered; both cited their charters. Findings came back as hand-backs, and the only in-turn wait available was a background until-loop. That is `plans/report-file-protocol_spec_v1.md`'s friction again, so no new note was filed.
Review Findings:
- Round 1, fixed. Major: the checklist (`SKILL.md:110`) was silent on a project with no mocking library, contradicting the reference. Major: the library rule was scoped to the test project. Minor: "(Moq or NSubstitute)" read as a complete list. Minor: no tie-break for a project using two libraries. Minor: detection keyed on a project file that `Directory.Build.props` or central package management can bypass. Minor: the mock clause carried the old NSubstitute exception's conditions.
- Round 1, declined. Minor: requiring the user's go-ahead before adding NSubstitute. The user ruled the preference directly.
- Round 2, fixed. Major: the false provenance premise, as above. Major: the amended criterion disagreed with the Approach; the Approach now quotes the user's clause. Three items the round-1 repair had introduced or worsened: the example "a call the test has to verify" (it overlapped the template's hand-rolled counter), the checklist dropping "nearest first", and "is NSubstitute the library to add", which read as an order and went back to the user's verb, "preferred".
- Round 2, declined, with reasons:
  - Blind Major: `SKILL.md:92`'s antipattern pulls toward fakes. Its "is clearer" qualifier is the user's "hand-rolled when that's easier" branch, both adversarial rounds read it as consistent, and the spec keeps it unchanged.
  - A matching over-faking antipattern. The user never ruled it, and it adds text.
  - A precedence-exception clause. The specific bullet outranks the general rule, and `adversarial-reviewer.md:31` defers to "each skill's stated precedence".
  - The referenced-but-unused case and a tie-break at repository level. No measured repo uses two libraries.
- Round 2, recorded and left. Minor: whether adding a package counts as "new test infrastructure" under `SKILL.md:111`. It predates this change.
- No third paired round. There are no Criticals, every Major is fixed or justified, and finishing-work's whole-changeset Fable adversarial review is the backstop.
Next: Section 2
Commit Model: Commit-and-Push

### Chapter 2 - 2026-11-02
Completed: 2. pr-reviewer: the charter carries the anchor offset convention
Implemented By: main session
Metrics: 1 review round, paired (adversarial + blind); NEEDS_CONTEXT 0; escalations 0; advisor on, not consulted during this section
Decisions / Surprises:
- **Premise check widened before editing,** after Section 1's narrow search failed. A sweep of all 10 commits touching `pr-reviewer.md`, for both the convention's names ("offset", "1-based", "one past", "exclusive", "inclusive") and the language it would use ("character", "past the", "end", "column"), confirmed that no version has ever said how offsets are counted.
- **A contradiction already in the charter was fixed in the same edit.** "with leading indentation left out" covered every anchor, including the whole-block case that `pr-review/SKILL.md:100` says keeps its indentation. The new full-line sentence would have sat next to it. It is now scoped to **fragment** anchors, as criterion 4 requires.
Review Findings:
- Fixed, Major (adversarial; the blind reviewer rated it Minor): the convention named the source ref but not how to read it, while the charter's Inputs say to read the touched files and pr-review's local-clone mode leaves the working tree unchecked-out. The parenthetical now carries `git show <source-sha>:<path>`, or the scratchpad copy, never the working tree.
- Fixed, Minor:
  - The anchor grammar had no multi-line slot. It is now `<startLine>:<start>-<endLine>:<end>`, and a fragment "may cross lines", per `SKILL.md:100`.
  - "1-2 span" collided with the line-range form and now reads `1..2`, as the skill writes it.
  - The worked example now names its six leading tabs.
  - **fragment** and **block** are bolded, so the anchor shape stops sharing a name with the suggestion block.
  - The dangling "Worked from the skill" is now "Worked example".
- Declined, Minor (both reviewers, both calling it speculative): whether "the line's length" counts a CRLF terminator or a byte-order mark. `SKILL.md:99` has the same gap, so the fix belongs in the skill first, and it needs a live Azure DevOps thread to settle. The verified `245:1-245:24` implies the terminator is excluded.
- No second round: there are no Criticals, the one Major is fixed with the parenthetical both reviewers proposed, and finishing-work's whole-changeset Fable review is the backstop.
- Criterion 5: the suite passes with the change in place; the pre-commit hook runs it again along with plugin validation.
Next: finishing-work
Commit Model: Commit-and-Push
