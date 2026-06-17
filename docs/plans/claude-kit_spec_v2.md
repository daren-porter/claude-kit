# claude-kit v2 - Superpowers-informed improvements

Status: In Progress
Commit Model: Commit-and-Push
Created: 2026-06-17

## Goal

Fold seven Superpowers-derived improvements into the kit without disturbing its
identity (acceptance-criteria specs, delegate-by-default, capable-by-default
models, anti-dogma voice, lean single-SKILL.md skills). When this is done the kit
has: a meta-skill for authoring and improving its own skills; a discipline for
adjudicating review findings and direct feedback; durable valuable tests as a
tracked deliverable rather than an accident; and several hardening edits to the
existing workflow skills. The meta-skill is also the foundation a later "kaizen"
skill will sit on, so it is built first and to a standard the rest of the kit can
be held to.

## Approach

Studied obra/superpowers end to end (all skills, the contributor CLAUDE.md, the
skill-testing methodology) against this kit's workflow skills and v1 history. The
guiding rule was: take what fills a real gap, mold it to the kit's voice and
size, and reject anything that fights a deliberate v1 decision. Key decisions:

1. **Deliberately NOT imported, and why.** Code-complete bite-sized plans
   (violate acceptance-criteria altitude); test-first-or-delete as an iron law
   (the kit is anti-dogma, and an iron law that does not fit T-SQL deployment
   scripts and integration-shaped .NET gets rationalized away); least-powerful-
   model selection (the kit chose capable-by-default deliberately); the visual
   companion (a browser server, token-heavy, anti-lean); "your human partner"
   language (the kit addresses Daren by name); the progress-ledger file (Chapters
   plus the recovery hook already cover compaction recovery); a standalone
   verification-before-completion skill (covered by the durable-tests work plus
   the existing evidence rules and Honesty section).

2. **Durable valuable tests, not test-first ritual.** v1's Out-of-Scope line
   ("TDD-style test-first discipline") conflated two separable things: test-first
   ordering (rejected) and durable valuable tests as a deliverable (never
   actually rejected, and the thing worth recovering). v1's stated testing
   discipline is a throwaway repro script that is deleted after a fix, which is a
   verification tool for debugging, not a test-authoring discipline; nothing in
   the workflow ever drives a durable test as a deliverable, and csharp-style's
   excellent "tests earn their place / test for value not coverage" philosophy is
   passive (it governs how a test is written, never that one gets written). v2
   amends v1's stance: **mandatory test-first-or-delete stays out of scope;
   durable valuable tests become a tracked deliverable; test-first is encouraged
   where it naturally fits; and "watch it fail for the right reason" applies to
   the tests we do write.** This amendment is recorded here; v1 is left intact as
   the historical record (never-overwrite), superseded by this paragraph.

3. **Two new skills, both lean single SKILL.md files.** `writing-skills` (the
   meta-skill) and `responding-to-review` (the review-response discipline). Both
   sized like the kit's other skills; a reference file is added only if a skill
   genuinely outgrows that size. `responding-to-review` is broader than
   Superpowers' equivalent: it covers both the kit's fresh-context review agents
   (fallible, adjudicated) and Daren's direct feedback (trusted but still
   verified), and it cross-references the anti-sycophancy global rule rather than
   duplicating it.

4. **File-handoff is a documented discipline, not tooling.** Superpowers ships
   `review-package`/`task-brief` bash scripts; the kit states the pattern (hand
   bulky inputs as file paths, have subagents write reports to files and return
   only status plus an evidence summary) and runs the git commands inline. No new
   scripts; the kit still ships exactly one JS file (the hook).

5. **Authoring the kit's own skill prose is main-session work by exception.**
   These deliverables are behavior-shaping prose in the kit's own voice, where the
   shape is discovered in contact with the existing skills and voice consistency
   is load-bearing. That is the delegate-by-default "design-entangled" (and for
   the small edits, "tiny") exception, the same reason brainstorming forbids
   delegating the design conversation. Fresh-context `adversarial-reviewer` passes
   per section are preserved; this is a deviation in who implements, not in
   whether the work is reviewed.

6. **Validation standard for behavior-shaping content.** The meta-skill documents
   baseline-testing skills with subagents (run the scenario without the skill,
   watch the agent fail, write the minimal skill, close loopholes). This effort
   authors-and-reviews the new skills rather than running a full pressure-test
   campaign per skill; full baseline-testing is available as a follow-up (Open
   Questions) and is the standard the kaizen skill will lean on.

## Sections of Work

### 1. writing-skills meta-skill

New skill at `plugins/claude-kit/skills/writing-skills/SKILL.md`. Single SKILL.md
in the kit's voice and size. Covers: when a skill earns existence and when it does
not; the kit's SKILL.md anatomy (quoted YAML frontmatter, trigger-style
description, lean body); "match the form to the failure" (rule skipped under
pressure -> prohibition plus rationalization table; wrong-shaped output ->
positive recipe; omitted element -> structural slot; conditional behavior ->
predicate); "description states the trigger, never a workflow summary" with a
kit-grounded example; and the baseline-test-with-a-subagent method (RED-GREEN-
REFACTOR adapted to skills) as the way to know a behavior-shaping change actually
works.

Acceptance criteria:
- The skill file exists with valid quoted YAML frontmatter; the description is a
  trigger ("Use when..."), not a workflow summary.
- The body covers all six topics above and names the four failure->form mappings
  explicitly.
- It does not depend on a TDD-for-code skill (the kit has none) and does not
  import the eval-submodule or persuasion-principles apparatus.
- It is a single SKILL.md sized comparably to the kit's other skills (a reference
  file is added only if the body genuinely outgrows that size, with the
  reference-gating convention the kit uses for csharp/sql).
- A fresh-session dry read produces the intended behavior with no internal
  contradiction and no reference to removed components.

### 2. responding-to-review discipline skill

New skill at `plugins/claude-kit/skills/responding-to-review/SKILL.md` (name per
decision D1). Governs how the orchestrator (and Daren-facing replies) handle
review findings and feedback.

Acceptance criteria:
- The skill file exists with valid quoted frontmatter and a trigger-style
  description that names both sources: findings from the kit's review agents, and
  direct feedback from Daren.
- Encodes: evaluate-don't-obey; verify against the actual code before
  implementing; no performative agreement (cross-references the anti-sycophancy
  global rule, does not duplicate it); push back with technical reasoning and hold
  under pushback, moving on facts not tone; YAGNI-check "do it properly"
  suggestions; and a fix/justify/note triage consistent with executing-work's
  Critical/Major/Minor handling.
- Distinguishes the two sources: Daren's feedback is trusted but still verified
  when scope is unclear; agent findings are fallible and adjudicated, and pushing
  back on a wrong finding is explicitly allowed.
- No contradiction with executing-work's "Address findings" step or with
  finishing-work; the skills cross-reference rather than restate each other.
- A fresh-session dry read is coherent.

### 3. brainstorming edits

Edit `plugins/claude-kit/skills/brainstorming/SKILL.md` to add two steps that
match the existing voice and process numbering.

Acceptance criteria:
- A scope-decomposition check: when a request spans multiple independent
  subsystems, flag it and split into sub-project specs before designing the first.
- A spec self-review pass after the spec is written: scan for placeholders,
  internal contradictions, ambiguity, and scope; fix inline before handoff.
- Neither addition contradicts the rest of the skill; the one-question-at-a-time
  and plan-sketch-first steps are preserved.

### 4. executing-work edits

Edit `plugins/claude-kit/skills/executing-work/SKILL.md`.

Acceptance criteria:
- **File-handoff discipline:** dispatch prompts hand bulky inputs (briefs, diffs,
  prior-task interfaces) as file paths; implementers and reviewers write their
  full report to a file and return only status plus a short evidence summary; the
  orchestrator reads the staged diff or report file rather than absorbing pasted
  dumps. Stated as a rule, no scripts.
- **Never pre-judge a reviewer's findings:** no "don't flag X", no pre-rating a
  finding's severity in the dispatch; if a finding seems wrong, let it surface and
  adjudicate it (per responding-to-review).
- **DONE_WITH_CONCERNS implementer status:** an implementer may report completion
  while flagging doubts; the orchestrator reads the concerns before review,
  resolves correctness/scope ones, and notes observations. Added alongside the
  existing BLOCKED escalation.
- **Durable-test checkpoint in the verify step:** every change answers "did this
  earn a durable test?" with either a retained test plus evidence or an explicit
  "no test worth writing, because X" (judgment per csharp-style "tests earn their
  place"); the throwaway repro is named as a debugging tool, not the default for
  new behavior.
- **Dispatch contract states test expectations:** whether a durable test is
  expected and what behavior it should lock down.
- No contradiction with the delegate-by-default / capable-by-default sections or
  with responding-to-review.

### 5. Durable-tests wiring (the rest)

Wire the durable-tests stance into the remaining surfaces.

Acceptance criteria:
- `home/CLAUDE.md` Test discipline bullet reframed: throwaway repro for debugging
  a fix; promote to a retained test when the change earns regression cover;
  watch-it-fail for tests you write; the anti-coverage-padding judgment preserved.
- The `adversarial-reviewer` agent gains a test lens consistent with csharp-style
  section 11 (tests present where the change earned one; behavior not mocks; no
  coverage padding).
- README and any other kit doc that describes the testing stance are checked and
  left consistent with the reframed rule (no contradictory "delete the script"
  framing left standing as the universal discipline).
- The v1 Out-of-Scope correction is carried by this spec's Approach (decision 2);
  v1 is not edited.

## Out of Scope

- Worktree / finishing-branch hardening (was not in the agreed worth-taking list).
- A standalone verification-before-completion skill.
- Importing Superpowers' code-complete plans, iron-law TDD, least-powerful-model
  selection, visual companion, progress-ledger file, or "your human partner"
  language.
- Helper scripts for file handoff (the pattern is documented, not tooled).
- Editing the v1 spec file (the amendment is recorded in v2's Approach instead).
- A kaizen skill (the next effort; this one builds its foundation).

## Open Questions

1. Should the "description states the trigger, not a workflow summary" lesson be
   applied to existing skill descriptions (executing-work's ends with a workflow
   summary)? Deferred: it is behavior-shaping and the meta-skill says baseline-
   test first, so it is a follow-up, not bundled here. Owner: Daren.
2. Run full subagent baseline-testing campaigns on the two new skills, or accept
   author-and-review for this effort? Defaulted to author-and-review; revisit when
   the kaizen skill lands. Owner: Daren.

## Chapters

### Chapter 1 - 2026-06-17
Completed: Section 1 (writing-skills meta-skill)
Decisions / Surprises: Authored in the main session per Approach decision 5 (voice-critical, design-entangled). The skill's own description is kept a pure trigger to dogfood its "description states the trigger, not the workflow" rule. Plugin validates (the no-version warning is the kit's intended design).
Review Findings: 1 Major fixed - the required "kit-grounded example" for description=trigger was sourced from Superpowers; now leads with executing-work's own workflow-summary description as the in-repo specimen (the case Open Question 1 flags). 3 Minors fixed - uncited Superpowers measurement reframed as a caution, not data; the "two rules" block given a lead-in marking it universal, not scoped to the form table; the duplicate kaizen forward-reference trimmed to the description trigger alone.
Next: Section 2 (responding-to-review)
Commit Model: Commit-and-Push

### Chapter 2 - 2026-06-17
Completed: Section 2 (responding-to-review discipline skill)
Decisions / Surprises: Main-session authoring per Approach decision 5. The skill covers both review-agent findings (fallible, adjudicated) and Daren's feedback (trusted but still verified), and cross-references the global anti-sycophancy rule rather than duplicating it.
Review Findings: 1 Major fixed - the skill asserted executing-work "owns" a never-pre-judge-the-reviewer rule that Section 4 has not landed yet, making the cross-reference false-on-disk during the section-by-section window; reworded to state the receiving-side discipline directly with no dependency on the unlanded rule (Section 4 carries the dispatch-side rule independently; the two can cross-reference once both exist). 4 Minors, all note-only per the reviewer, none fixed: the four-agent enumeration is slightly broad since qa-verifier/docs-curator run in finishing-work (discipline still applies uniformly); the YAGNI and verify steps are recipe-shaped, which is correct for procedure not discipline; the "do it properly" temptation gets a one-line test rather than a rationalization table (revisit if a baseline test shows agents fold); the "usually right" vs "trusted" lines sit near a tension that "silence reads as agreement" resolves.
Next: Section 3 (brainstorming edits)
Commit Model: Commit-and-Push
