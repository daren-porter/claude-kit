# Document Review Battery

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: S2, S3, finishing reviews
Created: 2026-08-26

## Goal

A section whose deliverable is a document for a named reader gets reviewed the way code is:
two fresh-context agents whose lenses are chosen for prose rather than diffs. Today such a
section skips the blind lens entirely (the `blind-reviewer` reads a diff and a docs-only
section has none worth reading) and hands the `adversarial-reviewer` a document it was never
chartered to judge. Nothing reads a deliverable as its reader would, and nothing checks
whether it presumes knowledge that reader lacks.

The secondary effect is deliberate rather than incidental, and is half the reason for the
effort: the spec fields that feed the battery force the author to name the reader and the
questions the document must answer for them, before the document exists. A spec is itself a
procedural document for a named reader, so the same fields sharpen plans, and plans are what
dispatch briefs are built from.

Adapted from the upstream kit's `document-review-battery` effort. What changes here is
recorded in Approach; the largest is that this kit has no writing-voice skill and does not
want one, so the voice lens becomes a resolution ladder that degrades to silence.

## Approach

**Two agents, because the two lenses cannot share a head.** `blind-reader` receives the
documents and a persona and nothing about intent, because a reader who has read the spec
fills the document's gaps from it and stops being able to see them. `prose-reviewer` receives
everything, and runs two passes in a fixed order: every claim against the fact base first,
then style and audience. The order is load-bearing rather than tidy, and is taken as-is from
upstream: a style fix can loosen a precise claim, and a style reviewer that never read the
fact base cannot know it did.

**Pass 1 is kept inside the prose reviewer rather than delegated to the `adversarial-reviewer`,
which already checks claims against code.** The duplication is real and accepted. Splitting
them would put the style pass in a head that never verified the claims, which is the exact
failure the ordering exists to prevent; the cost is a second read of the same documents.

**The fact base is named paths plus a required unverifiable class.** Upstream's brief carries
a "canonical numbers table" this kit does not have, so the reviewer is only as good as the
dispatching session's guess at what the claims rest on. The repair is not a new artifact: the
reviewer must list every load-bearing claim it could not check and why, so a gap becomes
visible rather than passing silently. Absence from a `CLAIMS CHECKED` block currently reads as
"fine" when it means "never looked".

**Style resolves through a three-tier ladder, and the bottom tier is silence.** This is the
largest departure from upstream, whose `Voice: scott` branch points at a skill this kit
refused. The dispatching session resolves one `Style authority:` field:

| Tier | Value | Reviewer behavior |
|---|---|---|
| 1 | Path to a writing-style skill | Full `[style]` checking against it |
| 2 | A designated document-governing section of a CLAUDE.md | `[style]` advisory only, capped at Minor, every finding quotes the rule verbatim |
| 3 | `none` | `[style]` unavailable; the tag is not emitted and the report says the lens was unavailable |

Tier 1 is empty in this kit today and becomes populated if a guided install ever generates a
writing-style skill from a user's own samples; nothing needs building now for that to work
later. Tier 2 is capped because a CLAUDE.md states how an agent should behave in conversation
("skip the preamble", "lead with the answer"), not how a document for a third party should
read, and an uncapped reviewer pointed at it will flag a document for breaking a
conversational rule. Requiring a verbatim quote keeps the transferable guidance usable
without licensing invented conventions. Tier 3 states the lens was unavailable because
silence must not read as clean.

**The tells catalog is a negative standard and is not a voice.** `references/ai-tells.md`
lands under `writing-skills`, which already owns the bar for behavior-shaping prose here and
is the skill an author loads before writing any. It is reachable by path, the way the
`csharp-style` and `sql-style` paths already reach implementers, so no skill has to load
`writing-skills` to use it.

**Neither agent claims a mechanism this kit does not have.** Upstream's charters both assert
that "a kit hook enforces the no-write half of this mechanically", which is true only
alongside `readonly-agent-guard`. That guard stays a separate pending candidate on its own
merits, and the sentence is dropped rather than ported, per the coupling rule in
`docs/kit-adoptions.md`.

## Sections of Work

### 1. The machine-prose tells catalog

`plugins/claude-kit/skills/writing-skills/references/ai-tells.md`, adapted from upstream's
167-line catalog under `scott-writing-style`.

Acceptance criteria:
- Every tell is retained with its Tell / Rewrite pair and its licensed exception, since the
  exception is what stops a reviewer flagging correct usage.
- Every cross-reference to an upstream skill section ("Section 6", "Section 8") is re-homed
  against an authority this kit has, or removed where none exists. No reference resolves to a
  file this kit does not carry.
- The catalog's own framing survives: none of these is wrong in isolation, the finding is
  frequency and uniformity, and a reviewer must say which.
- The em-dash prohibition is stated in the catalog rather than left to the retired
  cross-reference, since it is the one house rule that transfers intact.
- `writing-skills/SKILL.md` gains a pointer to the reference, read in both directions: an
  author reads it before finishing a draft, a reviewer hunts by name.

Execution mode: delegate-capable.

### 2. The `blind-reader` agent

`plugins/claude-kit/agents/blind-reader.md`.

Acceptance criteria:
- Takes document paths and a `Reader:` line naming a persona and its knowledge level, and
  nothing describing intent.
- States the contamination test as a property rather than a list: a sentence that would change
  with the section fails, a standing repository property passes. A spec or plan path arriving
  alongside the documents is contamination, reported and not opened.
- Reach is set by whether the persona holds this repository, not by its job title. A persona
  who holds it may read it read-only to attempt what the document instructs; a persona from
  outside opens the documents and nothing else, because a strong model with the code open
  reconstructs what the document failed to say.
- Output is four parts in a fixed order: summary-back written before any finding, questions,
  comprehension gaps, and a dry-run for procedural documents naming the first step it could
  not perform and what was missing.
- No verdict line, and no proposed prose. It reports the experience of reading; judging is the
  orchestrator's job, and a reader that starts drafting fixes stops reporting.
- Carries no claim that a hook enforces its read-only contract.
- A clean read is stated as a clean read.

Execution mode: delegate-fable.

### 3. The `prose-reviewer` agent

`plugins/claude-kit/agents/prose-reviewer.md`.

Acceptance criteria:
- Two passes in the stated order, with the reason for the order in the charter, since a later
  editor who reorders them reintroduces the defect.
- Pass 1 checks each document against the spec's must-answer questions, every claim against
  the fact base, and the documents against one another. A false claim is Critical; an
  unanswered must-answer question and a cross-document inconsistency are Major.
- Pass 2 runs the tells hunt and the presumed-knowledge check unconditionally, and the
  `[style]` lens only per the tier ladder in Approach.
- Findings carry severity, a lens tag, a confidence rating, and the quoted passage. Confidence
  is independent of severity, and severity is never downgraded to hedge low confidence.
- A `CLAIMS CHECKED` block lists each verified claim and the source it was checked against,
  **and** a companion list of load-bearing claims that could not be verified, each with the
  reason. An empty unverifiable list is an assertion that none exists, not an omission.
- The conflict rule: where a style or tell fix would change what a sentence claims, the finding
  says so and names the claim rather than resolving it toward the looser wording.
- Carries no claim that a hook enforces its read-only contract.

Execution mode: delegate-fable.

### 4. Spec-template fields

`plugins/claude-kit/skills/brainstorming/SKILL.md`.

Acceptance criteria:
- The spec format gains, for sections whose deliverable is a document: an `Audience:` line
  naming each persona and its knowledge level, the must-answer questions per persona, the
  fact-base paths, a `Style authority:` value resolved per the ladder, and a `Disclosure:` list
  where any persona sits outside the operator.
- The fields are stated as required only for document-deliverable sections, so an ordinary code
  section gains no ceremony.
- The skill states who resolves `Style authority:` and how, including that tier 3 is a normal
  outcome in this kit rather than a gap to be filled.

Execution mode: main.

### 5. The dispatch contract

`plugins/claude-kit/skills/executing-work/SKILL.md`.

Acceptance criteria:
- A Document Review Brief template carrying exactly what the two agents' input contracts name,
  with the blind side minimal by construction: a field added to the blind-reader's dispatch is
  a contamination risk and the template says so.
- The trigger is stated: a section whose deliverable is a document for a named reader gets the
  pair, one blind-reader dispatch per persona.
- What a docs-only section does with the existing code reviewers is settled explicitly, since
  today it silently gets a blind reviewer with no diff to read.
- The two dispatches run in the same round as the code reviewers rather than as a second round.

Execution mode: main.

### 6. Wiring

Acceptance criteria:
- `responding-to-review`'s list of fallible review agents includes both new agents, so their
  findings are adjudicated under the same rules rather than obeyed.
- `finishing-work` dispatches the pair over the effort's documents in its close-out pass, on
  the same trigger as the per-section case.
- `docs/README.md` and any skill listing the kit's agents reflect the two additions.

Execution mode: delegate-capable.

## Out of Scope

- `readonly-agent-guard`. It stays a separate candidate in `docs/kit-adoptions.md`; nothing
  here depends on it and no ported sentence asserts it.
- A writing-voice skill for this kit. Tier 1 of the ladder is deliberately empty.
- A canonical numbers table. The unverifiable-claims list is the answer instead.
- Upstream's reviewer effort-compensation table and its `Workflow`-route dispatch contract.
  Real, portable, and its own candidate; folding it in here would double the effort.
- The security `Disclosure:` sweep's interaction with the prose-only review waiver beyond
  carrying the list into the brief.

## Open Questions

- Whether tier 2 should name a specific CLAUDE.md heading convention, or leave the designation
  to the dispatching session. Owner: settle in S4 against the actual file.
- Whether `finishing-work`'s document pass needs a persona distinct from the per-section one.
  Owner: settle in S6.

## Chapters

(Appended by executing-work as sections complete.)
