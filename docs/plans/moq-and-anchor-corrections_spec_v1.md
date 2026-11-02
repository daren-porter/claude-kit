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
  user's code and adjudications. Nothing in `docs/` records the adjudication. The upstream kit (`~/repos/sapplefeld-claude-kit`) has never
  mentioned Moq, at HEAD or in its history.
- Measurement, 2026-11-02, across `~/repos`: 9 `.csproj` files reference Moq, none reference
  NSubstitute or FakeItEasy; about 900 Moq uses (`new Mock<` plus `Mock.Of<`) across six repos,
  one of which looks like a second checkout of EleosCore. The 23 hand-rolled fakes found (classes
  named Fake, Stub, Spy or Dummy) are all in Eleos MCP Server, where 272 of 273 commits are
  co-authored by Claude, so they most likely reflect this rule rather than the user's practice.
- The incident: 2026-10-28, EleosCore PBI 25858. A test project referencing only Moq
  (`ASR.Eleos.Horizon.Custom.Tests`) collided with the rule, and a reviewer rated the Moq use
  Minor.
- The user's rulings, 2026-11-02. On the library: drop the ban, mocks use whichever library the
  test project already references, never adding a second, "noting that NSubstitute is preferred if
  the library doesn't otherwise use Moq already." On fakes against mocks: "do the simplest thing
  ... Mocks when appropriate, hand-rolled when that's easier or will work in a way that a mock
  can't."

This is a **contradicted** rule, not a narrower-than-written one (`writing-skills`' counter-case
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
- This spec and its index entry are committed before Section 1 starts, so neither lands in a
  section's diff (`~/.claude-kaizen/declined.md`, 2026-11-02).
- An `agents/` change trips the pre-commit hook's hard test gate and the plugin validation; the
  suite was green at `8ff7e58`.

## Sections of Work

### 1. csharp-style: the mocking rule matches the house practice

Edit `plugins/claude-kit/skills/csharp-style/references/csharp-style.md` (the "Fakes first"
bullet in section 11, currently `:186`) and `plugins/claude-kit/skills/csharp-style/SKILL.md`
(the Tests checklist item, currently `:110`).

Acceptance criteria:
- The bullet no longer contains "Moq is not used in new tests", and no wording in either file
  discourages Moq.
- The bullet states the library rule: a mock uses the mocking library the test project already
  references, a second mocking library is never added, and where the project references none,
  NSubstitute is preferred.
- The bullet states the choice rule in the user's terms: do the simplest thing, a mock where a
  mock fits and a hand-rolled `private sealed` fake where that is easier or has to behave in a way
  a mock cannot. "Fakes first" no longer stands as a default.
- The `SKILL.md` checklist item agrees with the bullet and no longer names NSubstitute as the only
  library.
- `SKILL.md:92`'s antipattern ("Mocking simple collaborators with a library when a five-line
  hand-rolled fake is clearer") is unchanged and still consistent with the choice rule, checked
  by reading both.
- `grep -rn -i 'moq\|nsubstitute' plugins/` returns only the new text, and nothing else in
  `csharp-style` changed.

Execution mode: main.

### 2. pr-reviewer: the charter carries the anchor offset convention

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

- Move `~/.claude-kaizen/briefs/csharp-moq-rule.md` to `~/.claude-kaizen/applied/`.
- Mark item 2 done inside `~/.claude-kaizen/briefs/pr-review-batch.md`, which stays in `briefs/`
  for its other five items.
- Tell the user that the charter edit takes effect only after `/plugin update`, because agents
  load from the installed plugin cache.

## Open Questions

None. Every ruling this effort needs was given on 2026-11-02 and is quoted above.

## Chapters
