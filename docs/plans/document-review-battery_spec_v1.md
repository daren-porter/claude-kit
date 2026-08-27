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
refused. The spec records one `Style authority:` field per document section, decided at
plan time and relayed at dispatch:

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

**Every prose section here answers to `writing-skills`, and the spec as first written failed
to say so.** Recorded as an amendment at S1 open rather than discovered per section. Which
bar a section owes is decided per section by whether a local RED can be staged, and that is
not knowable in advance:

- **A local RED that fires puts the section on the normal bar**, RED then GREEN then
  REFACTOR, where GREEN's bar is every rep rather than a majority. None of the ported-wording
  gate's costs attach.
- **Only where no local RED is available** does that skill's "When a local RED is not
  available" section govern, with its three artifacts (attempted RED with prompt and verbatim
  output, a locator into the upstream record, a followability probe over three reps) and its
  three bounding clauses.

**S1 landed on the normal bar.** Its RED fired at the second attempt: the first rep was told
to calibrate against `docs/architecture.md` and so was not in the guarded state, which is a
restage rather than a did-not-reproduce; the second, writing the same subject cold, produced
the catalog's tells plainly, ending all three of its sections on a one-line contrast moral.
Artifacts in the Chapter.

The cost is the reason this is stated up front rather than met per section. S6 is outside
both bars: it updates existing enumerations to name two new agents and asserts nothing new
about behavior.

## Standing Brief Amendments

Binding on every later section's dispatches, added mid-run as review rounds surface them.

- **(S1 review, 2026-08-26) The tells catalog is scoped to prose the author wrote, and never
  to material reproduced verbatim.** Any agent charter that invokes the catalog carries that
  exemption explicitly. Both S1 reviewers reached this independently, and the kit already
  ships the rule with a near-miss behind it: `plugins/claude-kit/skills/pr-review/SKILL.md:53` bars editing a fenced
  `suggestion` body because it is written into the author's file byte for byte, and
  `docs/archive/kit-denaming_s1-rules.md:139` traces it to commit `74adfa9`, where stripping a
  character from a copied body would have written altered code into a teammate's file. A
  reviewer told to hunt tells without this scoping flags an em dash inside a block quote and
  the fix corrupts the quotation.

- **(S3 to S6 review, 2026-08-26) A cross-reference is not written until it has been resolved
  against this tree.** Second instance of one class in this effort, which `executing-work`'s
  recurrence rule prices as an amendment rather than a second fix: Chapter 1 corrected an
  em-dash authority pointing at a file this kit does not carry, and the S3 to S6 round found
  `executing-work` citing a "Dispatch Brief" that exists only in the upstream kit, beside a
  path missing its `plugins/claude-kit/` prefix. Both were lifted from upstream prose where
  they did resolve. Every later dispatch resolves each path and each named section against
  this repository before the wording is written, and the brief says so. The reason this class
  is expensive rather than cosmetic: `prose-reviewer` degrades an unreadable catalog path into
  skipping the by-name tell hunt, so a wrong path silently removes a lens and the report still
  reads as a completed pass.

- **(S3 to S6 review, 2026-08-26) `git commit` with no pathspec sweeps the whole index,
  including files a subagent staged.** `plugins/claude-kit/agents/prose-reviewer.md` shipped
  inside `78ad592`, a commit whose message is entirely about the adoption ledger. Implementers
  stage and never commit, so the index routinely holds work from a section that is still open.
  Every commit in this effort names its paths explicitly.

## Sections of Work

### 1. The machine-prose tells catalog (Complete)

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

### 2. The `blind-reader` agent (Complete)

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

### 3. The `prose-reviewer` agent (Complete)

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

### 4. Spec-template fields (Complete)

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

### 5. The dispatch contract (Complete)

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

### 6. Wiring (Complete)

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

Both are closed; the answers are on disk and are recorded here so the block is not read as
still open.

- **Answered in S4.** Whether tier 2 should name a specific CLAUDE.md heading convention, or
  leave the designation to the dispatching session. It is designated at plan time and relayed
  at dispatch, and nothing downstream re-resolves it
  (`plugins/claude-kit/skills/brainstorming/SKILL.md:133`). No heading convention is named,
  because the kit ships no document-governing CLAUDE.md section to name and `none` is the
  normal value here.
- **Answered in S6.** Whether `finishing-work`'s document pass needs a persona distinct from
  the per-section one. It does not: the close-out dispatches one `blind-reader` per pairing of
  a persona with the document set actually written for it, reusing the personas the sections'
  `Audience:` lines already named (`plugins/claude-kit/skills/finishing-work/SKILL.md:29`).
  The reason a distinct persona was tempting is the reason it is wrong: handing a persona
  documents never addressed to it manufactures findings against correct documents.

## Chapters

### Chapter 1 - 2026-08-26
Completed: 1. The machine-prose tells catalog
Implemented By: implementer-opus (two rounds; no escalation)
Metrics: 1 review round (paired, both CHANGES_REQUIRED); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Commit Model: Commit-and-Push

**The bar this section landed on, and the evidence for it.** The normal RED/GREEN bar, not the
ported-wording gate. `.kit/` is gitignored, so the artifacts are folded here rather than pointed at.

RED, attempt 1: not in the guarded state, so restaged rather than filed. The rep was told to
calibrate against `docs/architecture.md`, which supplies by imitation much of what the catalog
supplies by rule; a fixture staging the case the rule does not guard comes back clean by
construction.

RED, attempt 2: fired. Same subject written cold, no file reading, no calibration. All three of
its sections closed on a one-line contrast moral, which is the catalog's own named tell:
"It is a guard against accidents, not a lock: you can still edit `docs/` yourself." /
"This is not a machine-wide rule about the word \"docs\"." /
"It is not a defense against a path that deliberately leaves the project."
Plus dense not-X-but-Y framing and signposting ("The substantive question is", "The consequence
worth carrying around is", "One limit follows from that scoping").

GREEN: three reps, same task and same pressure, catalog supplied by path. Bar is every rep and
every rep cleared it. None closes a section on a portable maxim; contrast-framing density drops
sharply; sentence and paragraph length vary. Not tell-free, which the catalog's own framing does
not ask for, since the finding is frequency and uniformity.

Decisions / Surprises:
- **The spec understated the effort and was amended twice at S1 open.** First to record that
  `writing-skills` governs every prose section here, which the spec as written omitted entirely;
  then to correct that amendment, since which bar a section owes is decided per section by
  whether a local RED can be staged, and S1's fired.
- The upstream "Already prohibited in SKILL.md" section had to dissolve: it cross-references a
  skill this kit refused, and this kit's only equivalent authority is one em-dash bullet. Its
  five items were promoted to full entries or folded into existing ones; nothing was dropped.
- `tools/accretion.js` measures at HEAD, so it cannot see a staged-but-uncommitted file and says
  so. The heading fix was verified by running the shared parser (`hooks/accretion-lib.js`) over
  the working tree instead.

Review Findings:
- **2 Critical, both the same defect, reached independently by both reviewers.** The catalog
  scoped nothing to authored prose, so it licensed a reviewer to flag an em dash inside a
  quotation or a fenced `suggestion` body. The kit already ships the opposite rule with a
  near-miss behind it (`pr-review/SKILL.md:53`, traced by `archive/kit-denaming_s1-rules.md:139`
  to commit `74adfa9`, where stripping a character from a copied body would have written altered
  code into a teammate's file). Fixed in the framing paragraph and locally in the em-dash entry.
  Independent convergence outranks either finding's severity, per `responding-to-review`.
- 9 Major addressed: the em-dash authority pointed at the user's live global CLAUDE.md rather
  than the shipped `assets/CLAUDE.md` that carries the identical bullet; the new SKILL.md section
  contradicted the Anatomy bullet fifteen lines above it; the bolded-lead-in entry's Rewrite
  rewrote a different Tell; one level-2 heading collapsed 181 lines into a single indivisible row
  for the kit's only subtraction channel (now 17 headings, largest row 18 lines); the catalog
  omitted two tells that `pr-reviewer.md:55` and `pr-review/SKILL.md:53` both enumerate; SKILL.md
  overclaimed that every entry carries an exception; one entry both banned and licensed "that
  said"; the uniform-length exemplar's stated word counts were false (26-31 claimed, 23/23/17
  actual, now 23/23/22 with the label matching); and the bolded-lead-in exception did not license
  the kit's own pervasive convention.
- 4 Minor addressed: the self-answer exception had drifted looser than its source; the
  bullets-restate entry contradicted its own example; the provenance locator resolved to nothing;
  and the catalog is now cited from a path that exists.
- 2 Major routed to Section 6 rather than fixed here: the skill's frontmatter description is
  scoped to skill authoring, so the reviewing half of the new pointer is unreachable through the
  load path the skill itself defines; and `README.md`'s STRUCTURE tree gains no entry for the new
  reference.
- 1 Minor accepted, not fixed: `writing-skills/SKILL.md` uses bolded lead-ins on ~33 lines, some
  carrying arguments. The exception was sharpened to license the convention on an observable
  predicate rather than the tell being weakened. Recorded so the decision is deliberate.
- The implementer made one un-briefed change and disclosed it: line 3's "negative standard rather
  than a voice" was false about the file's own contents and was itself the "X rather than Y"
  construction the same commit removes elsewhere.

Evidence: both files pure ASCII (no dash variant of any kind), 17 level-2 headings, `node --test
test/*.test.js tools/*.test.js` at 324 pass / 0 fail, unchanged from the pre-edit baseline. No
durable test: nothing in the harness reads markdown for register or completeness, and all three
of the implementer and both reviewers reached that independently.

Next: finishing-work

### Chapter 3 - 2026-08-26
Completed: 3, 4, 5 and 6, reviewed as one round
Implemented By: implementer-fable for S3 and the fix round (fable override per the header); main session for S4, S5 and S6
Metrics: 1 review round (paired, both CHANGES_REQUIRED, 6 Critical between them); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Commit Model: Commit-and-Push

**Reviewed as one round, which is a deviation.** S4, S5 and S6 are one coherent prose change
across four files and were implemented concurrently; reviewing them separately would have read
each half of a contradiction without the other. Recorded so it is deliberate.

**Bars.** S3 took the normal RED/GREEN bar on a local arm: two reps given the tells catalog and
told to de-tell a fixture, of which one went to the source, drafted a close whose style-driven
shape contradicted the document's opening accuracy claim, and by its own account "was about to
edit paragraph 1 to fit". What stopped it was an advisor consult rather than any ordering rule,
and `executing-work` explicitly does not let the kit rely on that. So the ordering Pass 1 before
Pass 2 guards a failure observed here, at one rep in two.

S5 is a **narrowing** of a rule the kit already ships (`executing-work`'s docs-only rule), which
`writing-skills` prices at a third arm in the state the change leaves alone. Run: three reps read
the amended step and dispatched reviewers for three scenarios. All three gave a docs-only section
with no `Audience:` line the adversarial review alone, so the narrowing did not take the untouched
case with it; all three gave a code-plus-document section the full additive set. Two flagged one
genuinely undecided call, whether that section also earns `security-reviewer`, which turns on
facts the fixture did not supply rather than on the wording.

**S4's bar is not discharged and is recorded as debt.** It adds five required spec fields. The
judgment made was that a template slot is a structural mechanism rather than a rule, which
`writing-skills` itself ranks above a prose reminder, so no arm was run. The adversarial reviewer
called that new claims at the normal bar and it is right that nothing on disk records the
decision. A backlog line carries it.

Decisions / Surprises:
- **The battery is additive, decided at the fix round.** Both reviewers found the first carve-out
  undecidable for a section shipping a document and code: one reading dropped both code reviewers
  from any section carrying an `Audience:` line. A section now takes the battery on that line and
  takes whatever code review its changeset warrants, unchanged.
- **`Disclosure:` had no consumer and now has one.** The field was specified in S4 and read by
  nothing: `prose-reviewer` had a closed tag set without it, `security-reviewer` says nothing
  about disclosure, and `finishing-work` waives the security dispatch entirely for an all-prose
  changeset. A `[disclosure]` lens was added to `prose-reviewer` rather than dropping the field.
- **`executing-work` cited a "Dispatch Brief" that exists only in the upstream kit.** Lifted from
  upstream prose where it resolves. The failure was silent by construction, since `prose-reviewer`
  degrades an unreadable catalog path into skipping the by-name tell hunt, so a wrong path removes
  a lens and the report still reads complete. Second instance of the resolves-to-nothing class in
  this effort, so it became a Standing Brief Amendment rather than a second fix.
- **The `writing-skills` description edit was reverted whole.** It broke that file's own rule
  fifty lines below it, that a description states the trigger and not the workflow. Restored
  byte-identical.
- **`prose-reviewer.md` shipped inside `78ad592`, a commit about the adoption ledger.** An
  implementer had staged it and a pathspec-less `git commit` swept the index. Already pushed, so
  it is recorded rather than rewritten, and a Standing Brief Amendment now requires every commit
  in this effort to name its paths.
- An implementer wrote into `docs/` without the docs-write-guard blocking it. The installed plugin
  cache still holds the pre-fix guard, since `/plugin update` has not run since the fix landed.
  Worth a live-fire once it has.

Review Findings:
- 6 Critical addressed across the two reviews: the dangling Dispatch Brief and unresolvable
  catalog path; `Disclosure:` with no consumer; the undecidable mixed section; `finishing-work`
  reusing a per-section brief whose persona pairing, must-answer questions and style authority
  have no whole-effort value; the `README.md` STRUCTURE entry Chapter 1 routed here and was not
  done; and the unrecorded bars for S4 and S5.
- 13 Major addressed, including the three-way disagreement on who resolves `Style authority:`,
  four of five fields having no template slot, the missing tenure predicate in the `Audience:`
  line, no severity slot for a frequency-level `[tell]` finding, no degradation for a missing
  `Audience:` line, `finishing-work`'s fable-override enumeration leaving an unauthorized-spend
  path, and its unqualified instruction to tell finishing reviewers what earlier passes covered,
  which reaches `blind-reader` and is contamination by that charter's own definition.
- 1 Major corrected against the orchestrator: the dated finding's denominator. The brief said one
  in three; the claim-checking arm used a different fixture and tested a different question, so
  only two reps ran the guarded task.

Evidence: all seven touched files pure ASCII, `grep -rn "Dispatch Brief" plugins/ README.md`
empty, `writing-skills/SKILL.md` byte-identical to its post-S1 state: the S6 description edit
was reverted whole, and only S1's pointer section separates the file from the effort's base
`5f23707`. 324 pass / 0 fail. No durable test: nothing in the harness reads a skill or a
charter.

### Chapter 2 - 2026-08-26
Completed: 2. The `blind-reader` agent
Implemented By: implementer-fable (fable override, per the `Fable Spend:` header; two rounds, no escalation)
Metrics: 1 review round (paired, both CHANGES_REQUIRED); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Commit Model: Commit-and-Push

**Bar: normal RED/GREEN.** A local RED was stageable and fired.

RED: a rep dispatched as an outside reader with no charter, on a fixture guide carrying planted
gaps, opened the script a step named and grepped the README. Its own disclosure: reading them was
"more than the guide gives a reader" (verbatim, hard-wrapped in the record). It led with the
reader's finding and labelled what it appended as verification, but the label did not hold the
lens: the appended note ends "it is a step for a program that is not in this repository", a claim
about the program rather than about the read.

**GREEN was run twice, because the first arm was invalid and the adversarial reviewer caught it.**
That failure is the orchestrator's, not the implementer's. The first arm's persona ("handed this
repository by a colleague") is exactly the case the charter's reach predicate did not decide, so
either the outsider clause was never staged or all three reps breached it; either way the arm
could not establish the clause it was run for. This is the same "not in the guarded state" branch
correctly applied to Section 1's first rep and then not applied to this one.

Second arm, against the round-2 charter, persona unambiguously outside (a non-technical operations
manager at a customer, emailed the document): the guarded behavior, opening source to resolve a
gap the document left, occurred in none of the three. Rep 3 explicitly page-only. Rep 1 page-only
on the document, plus one `git status` self-check after writing, which it disclosed and declined to
reason from, exercising the decline-to-reason rule ported in round 2. Rep 2 is page-only in
substance but carries no process record, so its compliance is recorded as inferred.

Decisions / Surprises:
- **The charter's inline dated finding shipped an overstatement in round 1, and the orchestrator
  wrote it.** The dispatch brief characterized the RED rep's step-4 entry as having "become" an
  auditor's finding. The record shows it led with the reader's finding and appended a labelled
  parenthetical. Corrected in round 2 to what the record supports, with both quoted phrases
  verified verbatim against the source.
- No `effort:` frontmatter: none of this kit's twelve agent charters carries that field, and
  upstream's does. Adding one is a separate candidate, not this effort's.
- The Standing Brief Amendment about scoping the tells catalog has no bearing on this charter,
  which never invokes the catalog. The implementer said so rather than inserting a sentence to
  look compliant, which is the right answer.

Review Findings:
- 2 Critical addressed: the invalid GREEN arm (re-run, above) and the overstated inline finding.
- 11 Major addressed: the reach predicate had no default (now defaults to outside, with the
  asymmetry stated: an outsider read that should have been insider loses a dry-run and is
  re-dispatched, while the reverse destroys the findings the seat exists to produce); the two
  insider bounds contradicted each other (now four bullets, existence never contents); an outside
  persona could not produce the mandatory part 4 (now defined as a page-only walk); a referent
  under `docs/` was reported as a step the persona could not perform, manufacturing a Major
  against a correct document; the contamination test had three incompatible forms; there was no
  counterpart to the sibling's decline-to-reason rule; the spec-as-subject carve-out had no
  single-document restriction; the charter forbade writing and named no delivery channel while
  3/3 validation reps wrote into the tree; plus de-duplication, missing-input behavior, and the
  singular-versus-plural summary-back.
- **2 Major deliberately not fixed, and this is a consequence of the section order rather than a
  defect.** Both reviewers found that nothing dispatches this agent and that its description
  contradicts `executing-work/SKILL.md:77`, which says a docs-only section gets the adversarial
  review alone. Document deliverables land in `docs/`. Section 5 owns the dispatcher and the
  carve-out, and will be written against this charter's wording. Every review of Sections 2 and 3
  will legitimately raise this until S5 lands; recorded here so it is adjudicated once.

Evidence: pure ASCII, no `effort:` field, no enforcement claim, 324 pass / 0 fail unchanged. No
durable test: nothing in the harness reads an agent charter.
