# The Kit's Reader-Facing Docs

Status: Complete
Commit Model: Commit-and-Push
Fable Spend: none (cost hold)
Created: 2026-08-27

## Related

- `archive/document-review-battery_spec_v1.md` - built the battery this effort is the first to
  dispatch. That plan closed with the battery unexercised, because its trigger is an `Audience:`
  line and no section of the spec that specifies that field could carry one. This section carries
  one, so the run here is both the work and that debt's discharge.

## Goal

Two documents in this repository are written for someone to read, and nobody has ever read them
as that someone. `README.md` is what a person meets first: it says what the kit is and carries
the per-machine install as numbered steps. `docs/architecture.md` says what actually runs during
a session. Both have been edited many times by sessions that already knew the answers, which is
the condition under which a document quietly stops explaining itself.

The question this section answers is narrow and empirical: can each document's named reader get
what they came for from the page alone, and is every claim on the page true. What follows from
the answer is a separate decision, taken with the user once the findings are in.

## Approach

**Review first, decide second.** This section's output is the adjudicated findings, not a
rewrite. A document that comes back clean gets no edit, and the run still discharged the debt.

**The two documents go to different readers, and that is the point.** `README.md`'s reader does
not hold this repository and meets the install steps with nothing but the page, which is the
reach under which a procedural dry-run reports the first step the reader could not perform.
`docs/architecture.md`'s reader does hold it. Pairing each persona with the document written for
it is deliberate: a persona handed a document never addressed to it files real comprehension gaps
against a correct document.

**`prose-reviewer` takes both at once** so an inconsistency between them stays visible to one
head. The two documents make overlapping claims about hooks, agent counts, and the plugin cache,
and a claim that is true in one and stale in the other is exactly the finding a per-document pass
cannot see.

## Sections of Work

### 1. Read the reader-facing documents as their readers (Complete)

Deliverable: `README.md` and `docs/architecture.md`, reviewed by the document review battery and
the findings adjudicated. No edit is made under this section; a fix that the findings justify is
decided with the user and, if taken, becomes Section 2.

Acceptance criteria:
- Both documents reviewed by the battery: one `blind-reader` per persona, paired with the
  document written for that persona, and one `prose-reviewer` over both.
- Every finding adjudicated per `responding-to-review`, with the ones rejected carrying a reason.
- Any claim the reviewer could not verify is recorded rather than assumed fine.
- The Chapter records what the battery's first live dispatch cost and what it caught, including
  anything the machinery itself got wrong, since this run is the first evidence either charter
  has.

Execution mode: main.

Audience: an engineer evaluating or installing the kit for the first time, comfortable with a
  terminal and with git, has used Claude Code but has never seen this repository and does not
  hold it (reads `README.md`); and an operator who works in this repository regularly, knows the
  workflow skills and has run efforts through them but does not know the hook internals by heart,
  and holds this repository (reads `docs/architecture.md`).
Must answer:
  - Installing engineer, from `README.md`: What is this and why would I install it rather than
    what I already run? Exactly what do I run, in what order, to get it working on a machine?
    What must I remove or change first, and what breaks if I skip that? How do I update it later,
    and how do I know an update took effect?
  - Operator, from `docs/architecture.md`: What actually runs during a session, in what order,
    and what fires it? If I edit a hook, an agent or a skill in this checkout, when does that edit
    take effect? Which of the kit's boundaries are enforced mechanically, and which are only
    declarative and therefore hold only as long as a model cooperates?
Fact base: `plugins/claude-kit/hooks/` (including `hooks.json`), `plugins/claude-kit/agents/`,
  `plugins/claude-kit/skills/`, `plugins/claude-kit/.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`, `settings/settings.recommended.json`, `setup.sh`,
  `setup.ps1`, `test/`, `docs/security-model.md`, `docs/kit-adoptions.md`.
Style authority: none
Disclosure: the installing engineer sits outside the operator, so `README.md` must not carry the
  operator's personal name or email address, an absolute path under the operator's home
  directory (`/home/daren/...`), a machine hostname label (`daren-ubuntu`), a client or customer
  name, or an internal Azure DevOps organization or project identifier. Three things are
  deliberately NOT on this list and are not findings: the GitHub repository identifier
  (`daren-porter/claude-kit`), the upstream attribution to the fork's original author, and a
  configuration directory path named as a generic example. The de-naming contract at
  `archive/kit-denaming_s1-rules.md` carries the keep-lists these three come from.

### 2. Correct what the battery verified (Complete)

Deliverable: `README.md` and `docs/architecture.md`, with the Critical and accuracy-Major
findings from Section 1 fixed. Scope decided with the user: the false claims and the broken
install path, not the audience and structure findings (`Fable` undefined, `Chapter` undefined,
the case against the reader's status quo), which are a separate pass.

Acceptance criteria:
- Every fix is anchored to the source that proved the claim false, and that source is re-read
  after the edit rather than trusted from the finding.
- The install sequence is performable end to end by the persona Section 1 named: no step
  requires state an earlier step never establishes.
- No fix introduces a new claim that its own source does not support. This is the failure the
  battery exists to catch and the one a correction pass is most likely to commit.
- `docs/architecture.md` is edited in the main session. It sits under `docs/`, which
  `docs-write-guard` closes to every subagent but `docs-curator`, so this section cannot be
  delegated to an implementer. Recorded because it is a property of the kit rather than a
  preference: a document-deliverable section whose document lives under `docs/` is
  main-session work by construction.

Execution mode: main.

Audience: unchanged from Section 1, and the same two personas read the same two documents.
Must answer: unchanged from Section 1.
Fact base: unchanged from Section 1, plus `plugins/claude-kit/skills/reconcile-claude-md/SKILL.md`,
  `plugins/claude-kit/skills/executing-work/SKILL.md`, `plugins/claude-kit/skills/kit-goal/SKILL.md`,
  `plugins/claude-kit/hooks/session-start.js`, and `docs/prose-accretion.md`, each of which
  settled a Section 1 finding.
Style authority: none
Disclosure: unchanged from Section 1.

## Out of Scope

- The audience and structure findings: `Fable` and `Chapter` undefined at first use, the case
  against the reader's status quo, the missing update-took-effect check, and the unstated Node
  prerequisite (which the reviewer could not verify and which turns on harness behavior). Scoped
  out of Section 2 by the user's decision; they go to the backlog.
- Every other document in `docs/`. The two here are the reader-facing surface; the rest are
  working records for sessions.
- Re-testing the five spec fields against `writing-skills`' bar. That debt is separate and stays
  on its backlog line; this section exercises the battery, not the fields' admissibility.

## Open Questions

- **Answered 2026-08-27.** Whether the run closes the battery's never-dispatched backlog debt.
  It does. The run exercised both charters, both branches of the reach predicate, all four of
  `prose-reviewer`'s lenses including the two that report themselves unavailable, and produced
  two Critical and eleven verified Major findings, so the line has the evidence it asked for.

## Chapters

### Chapter 1 - 2026-08-27
Completed: 1. Read the reader-facing documents as their readers
Implemented By: main session; three agent dispatches (2x `blind-reader`, 1x `prose-reviewer`)
Metrics: 1 battery round, ~240k subagent tokens, 58 tool calls, 2 Critical and 11 verified Major;
0 escalations; advisor consulted once before the run
Commit Model: Commit-and-Push

**This is the document review battery's first live dispatch.** It shipped on 2026-08-26 and had
never run, because its trigger is an `Audience:` line and the spec that introduced that field
predated it. This section carries one, so the debt recorded on `backlog.md` closes here.

**What it caught, verified against disk rather than taken on report.** Two Critical: `README.md`
claimed "the kit's 33 prose files" where `tools/accretion.js` measures 36, and the INSTALL list
opened with two maintainer actions while never establishing the checkout three of its own steps
need (`clone` appeared only at `:126` and in the closing summary, never as a step). Eleven Major
followed, of which the sharpest were a structure-tree line handing the reader the exact test gate
`README.md:162` says was retired for leaving a payload file untested; `docs/architecture.md:48`
claiming one of five state locations sits inside a repo directly above a table listing two; and
`kit-goal`'s ignore step described in the same voice as real code when it is skill prose
(`skills/kit-goal/SKILL.md:47-48`), inside the one document whose job is separating mechanical
from declarative.

**One of the Majors was written in this session.** `docs/architecture.md:80` said the adoption
ledger "has not been re-counted"; `kit-adoptions.md:174` says "nine rather than seven" outright.
That sentence came in with the `docs-curator`'s writes committed in `c37e273` an hour earlier,
and the whole-changeset adversarial pass in `document-review-battery`'s Chapter 4 read past it.

Decisions / Surprises:
- **The charters behaved as designed on the points that cost the most to get right.** Both blind
  readers ran the contamination test and passed the dispatch rather than treating every sentence
  as a leak. Both noticed commit subjects they had not asked for, disclosed them, and declined to
  reason from them. The insider used existence-only reach and reported `docs/` referents as
  unverifiable rather than unperformable, which is the distinction that would otherwise have
  manufactured findings against correct prose. `prose-reviewer` declared the style lens
  unavailable instead of going quiet, ran the disclosure lens and correctly spared all three
  keep-list items, and labelled its single tell finding as an isolated instance rather than a
  frequency one while invoking the conflict rule against thinning a construction the document
  depends on.
- **`blind-reader`'s part 4 has a gap.** The charter defines the dry-run for procedural
  documents. `docs/architecture.md` is descriptive, so the insider found part 4 undefined and
  substituted an existence-only check of the document's referents. Sensible, and unbriefed.
- **Cost is real.** ~240k subagent tokens for two documents totalling 258 lines.
- The two blind dispatches carried exactly the three bullets the shipped template lists and
  nothing else. Neither reader asked for more, and both produced a full four-part report, so the
  minimal-by-construction rule survives its first contact.

Next: Section 2

### Chapter 2 - 2026-08-27
Completed: 2. Correct what the battery verified
Implemented By: main session (delegation unavailable, see below)
Metrics: 13 anchored edits then 12 corrections; 1 re-review round (`prose-reviewer` plus the
outside `blind-reader`), 3 Critical and 6 Major, of which most were introduced by the pass itself;
324 pass / 0 fail throughout
Commit Model: Commit-and-Push

**The correction pass committed the failure its own acceptance criterion named, three times.**
Criterion 3 said a fix must not introduce a claim its source does not support, and it was written
before the edits precisely because that is the likely failure. It happened anyway. My replacement
for the stale corpus count claimed the tool reports "every level-2 section", where
`tools/accretion.js:111` sets `TOP_N = 15` and `:464-466` prints "Rows 16-N are not printed". My
rewrite of the `setup.sh` instruction said to run it "instead of the reconcile, not after it",
which is false whenever a canonical `~/.claude/CLAUDE.md` already exists: `setup.sh:73-82` writes
the sync marker only when that run created the canonical, and otherwise prints "Left the sync
marker as-is; run the reconcile-claude-md skill to reconcile". For the named persona, who has used
Claude Code and therefore probably has a CLAUDE.md, following that sentence would have left the
kit's rules never folded in. And a pointer I added sent the reader to CONVENTIONS for a gate
command that lives under MAINTAINER TOOLS.

**A provenance claim made without checking, and corrected by the review.** The `take-stock-nudge.js`
tree line ended up at 4-space indent against its siblings' 8, placing it outside the plugin. I
reported it to the user as pre-existing. `git show c37e273:README.md` shows it at 8: my own anchor
matched a substring of the correctly-indented line and ate four spaces. The reviewer attributed it
to this pass and was right.

**Delegation was unavailable, and that is a property of the kit rather than a preference.** This
section's deliverable includes `docs/architecture.md`. `docs-write-guard` denies every subagent but
`docs-curator` any write under `docs/`, and the live fire earlier the same day confirmed it holds
for both the `Write` tool and a Bash redirect. So a document-deliverable section whose document
lives under `docs/` is main-session work, and three of the four execution modes cannot be used for
it. Neither `executing-work`'s execution-mode wording nor the battery's dispatch section says so.
Jotted to the kaizen inbox.

Decisions / Surprises:
- **The re-review was narrowed to two of three dispatches, deliberately.** The resident-operator
  blind read was skipped: `docs/architecture.md` took four sentence-level accuracy fixes and no
  structural change, so a comprehension re-read had little to find, while the restructured install
  sequence was the risky change and got its reader back.
- Both re-review agents independently reached the missing clone command, which
  `responding-to-review` prices above either finding's own severity.
- Nine findings were scoped out by the user's decision and went to `backlog.md` rather than being
  quietly dropped: `Fable`, `Chapter` and "the document battery" undefined at first use, the
  advisor sentence that resolves to nothing, THE WORKFLOW's 330-word paragraph, the absent
  case against the reader's status quo, no post-install verification, no uninstall path, and the
  unstated Node prerequisite (which the reviewer could not settle, since it turns on harness
  behavior).
- **`prose-reviewer`'s frequency tell finding was not acted on**, and its own conflict-rule note is
  why: "rather than" appears 13 times in 95 lines, and most instances carry a real contrast, two of
  them a verified claim. Thinning the count would trade those for smoother sentences. Style
  findings were out of scope for this section in any case.

Evidence: `node --test test/*.test.js tools/*.test.js` at 324 pass / 0 fail, unchanged. Both
documents pure ASCII. Every fix re-read against the source that proved the original claim false;
the four reports are in `.kit/battery/` (gitignored, so the findings are summarized here rather
than pointed at).

Next: finishing-work
