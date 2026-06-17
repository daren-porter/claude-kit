# claude-kit v3 - Scott-informed adoptions

Status: In Progress
Commit Model: Commit-and-Push
Created: 2026-06-17

## Goal

Adopt three capabilities from Scott's updated fork, molded to this kit's lean,
anti-dogma, Daren-addressed style, plus two adjacent global-rule fixes. When done
the kit has: real subagent model down-selection (a Sonnet escape hatch under
capable-by-default, decoupled from which model the human runs in the main
session); an opt-in multi-lens design council for genuine architecture forks; a
`cold` neutral-evaluation lens for non-code judgment calls; the broken
context-reset heuristic removed (kaizen candidate 2 closed); and two high-
confidence operating-discipline bullets that help even ad-hoc work.

## Approach

Studied `~/repos/claude-kit-scott` (Scott's updated fork) against this kit. Took
what fills a real gap, molded it to the kit's idioms, rejected what fights a
deliberate decision or is Scott-specific. Key decisions:

1. **Model down-selection without hard-coding the main-thread model.** Scott
   records a per-section model tier (`fable`/`sonnet`/`opus`) and hard-codes
   "fable or untiered = main thread," which assumes the human runs Fable. We
   record an **execution mode** instead, with three values: **main** (done in the
   orchestrator session, on whatever model the human selected for it - never
   named, so Opus today and Fable whenever Daren picks it both just work),
   **delegate-capable** (a fresh-context Opus implementer), **delegate-mechanical**
   (a fresh-context Sonnet implementer). These map onto the kit's existing structure,
   not over it: **main** is the keep-in-session exception (design-entangled / tiny /
   session-state work, which runs the session model - a context-isolation choice,
   not a model choice), and the two delegated tiers are the default path. Delegation
   stays default; the new part is choosing the tier. The only place a model name
   appears for the mapping is the two implementer agents' frontmatter; nothing ties
   the main thread to a model. This keeps capable-by-default but finally gives it the
   Sonnet escape hatch it lacked (today every delegated task runs Opus because the
   kit has no Sonnet implementer at all). The downgrade conditions, round-up-when-
   uncertain, and reviewers-never-downgrade are unchanged; the mode is now a
   positive per-section assignment made at plan time (the whole-effort view), with
   a fail-twice-at-a-tier escalation that takes the section over in the session.

2. **Design council: adopt, opt-in, cost-bounded.** It fills a real gap - the kit's
   brainstorming is a single-lens conversation (Daren + the orchestrator). The
   council adds independent multi-lens design-stage adversariality with explicit
   false-convergence defenses (the design-stage twin of the anti-sycophancy rule).
   It is heavier, so it never auto-runs: offered only at genuine material/hard-to-
   reverse forks, opt-in, with the cost named before the spend. It informs the
   call; Daren makes it.

3. **`cold`: adopt.** A neutral evidence-first lens for non-code go/no-go and
   judgment calls where Daren's own preference or ownership is baked into the
   framing - the anti-sycophancy rule pointed at the decisions with no compiler to
   contradict an agreeable answer. Lightweight (one SKILL.md, no agents).

4. **Global-rule fixes.** Remove the context-reset heuristic (it asks the model to
   judge context usage it cannot reliably perceive; Scott dropped it too) from
   executing-work, the global CLAUDE.md, and the README. Add two high-confidence
   operating-discipline bullets that Scott's rich CLAUDE.md has and this kit lacks,
   chosen because they are general, low-risk, and help every turn including ad-hoc
   work: match-effort-to-blast-radius and name-what-you-changed-outside-the-code.

5. **Deliberately NOT taken.** Scott's full 132-line operating manual wholesale
   (it reverses v2's deliberate slimming and duplicates the kit's skills); the rest
   of its nuggets (confirmed-vs-inferred sharpening, finding-is-a-hypothesis,
   close-with-state, the before-you-send re-read) are reserved for a dedicated
   curation pass, not snap-included here. Also not taken: the format-on-edit hook,
   scott-writing-style, the Fable-specific CLAUDE.md variant, and the agent-teams
   harness (the council runs on stable Claude Code). Capable-by-default is kept as
   the default; this adds the mechanism, it does not reverse the policy.

6. **Authoring is main-session by exception**, as in v2 and kaizen: behavior-
   shaping prose and agent definitions in the kit's own voice, design-entangled and
   voice-critical. Fresh-context adversarial-reviewer passes per section preserved.

## Sections of Work

### 1. Model down-selection

Two new implementer agents and the executing-work / brainstorming rework that
drives them.

Acceptance criteria:
- `implementer-sonnet` (frontmatter `model: sonnet`) and `implementer-opus`
  (frontmatter `model: opus`) exist: scoped single-section implementers, fresh
  context, that read the spec section + Approach and the style-skill file paths
  named in the brief (subagents inherit no skills), make surgical changes, verify
  with the build plus targeted tests plus the kit's durable-test checkpoint, stage
  but never commit, and end with one of DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT
  / BLOCKED.
- executing-work's model/delegation section records the three execution modes;
  **main** is defined model-agnostically (the orchestrator session on the human's
  selected model, never named); delegate-capable -> implementer-opus,
  delegate-mechanical -> implementer-sonnet.
- The only place a model name appears for the mapping is the two agents'
  frontmatter; no skill or rule hard-codes the main-thread model. Selecting Fable
  (or any model) as the session model requires zero instruction changes.
- Capable-by-default for delegated work, round-up-when-uncertain, reviewers-never-
  downgrade, and a fail-twice-at-a-tier -> take-over-in-session escalation (never
  downgrade mid-effort) are all stated. The execution mode is assigned per section
  at brainstorming time and recorded.
- brainstorming gains a step assigning an execution mode per section of work; the
  executing-work Chapter format gains an "Implemented By" line.
- A fresh-session dry read is coherent and contradicts neither the delegate-by-
  default policy nor the global Subagent Orchestration anchor (which already defers
  model selection to executing-work).

### 2. Design council

A molded `design-council` skill plus `council-member` and `design-facilitator`
agents.

Acceptance criteria:
- `design-council` skill exists, addressed to Daren, opt-in: it never auto-runs,
  confirms opt-in before dispatching, and names the cost (seats x round cap) before
  the spend. It frames the fork as an outcome plus candidate approaches, runs
  blind Round 1 positions, facilitator passes, and cross-examination rounds to a
  cap, then delivers a converged recommendation or a cleanly-stated unresolved fork
  to Daren - it informs, never decides.
- `council-member` (read-only, one per lens, blind in Round 1, engages objections
  honestly in cross-exam: concede / rebut-with-evidence / revise) and
  `design-facilitator` (neutral, a separate seat from the orchestrator, owns the
  convergence verdict, classifies each agreement as evidence-resolved vs
  capitulation, emits CONVERGED / ANOTHER_ROUND / DEADLOCK) agents exist.
- The false-convergence defenses are present: blind Round 1, separate facilitator,
  capitulation flagged not accepted, value trade-offs escalate to Daren, a round
  cap, every load-bearing claim grounded in evidence the member actually read.
- brainstorming offers the council at a genuine material/hard-to-reverse fork; the
  offer names the cost and is declinable. The council never replaces the Daren
  conversation.
- Provenance recorded (the blind-then-converge protocol's origin); no agent-teams
  dependency. Dry read coherent; no overlap conflict with adversarial-reviewer
  (council weighs approaches pre-code; adversarial-reviewer weighs diffs).

### 3. cold skill

A molded `cold` skill for non-code judgment calls.

Acceptance criteria:
- `cold` skill exists, addressed to Daren, with a trigger-style description for
  non-code go/no-go and "is this a good idea / am I being rational / are you sure"
  asked with no new evidence; and an explicit when-not-to-use (code/diffs/specs ->
  adversarial-reviewer; agreed work -> executing-work; neutral lookups -> just
  answer).
- It encodes: strip the evaluative framing (preference, ownership, the wanted
  answer) but keep every factual anchor; answer the de-framed question; revise only
  on a new fact and name it; name the strongest objection to what Daren wants to
  hear; do not manufacture objections (an over-firing skeptic is as miscalibrated
  as a yes-man); scale the output to the stakes.
- Cross-references the global anti-sycophancy rule rather than duplicating it; dry
  read coherent.

### 4. Global-rule fixes

Remove the context-reset heuristic; add two operating-discipline bullets.

Acceptance criteria:
- The context-reset suggestion (suggest a fresh session "when context usage runs
  high, roughly 50%+") is removed from executing-work's Context discipline section,
  home/CLAUDE.md, and the README. What remains in executing-work is the true,
  useful framing - delegation keeps the orchestrator lean, section boundaries are
  clean recovery points because the plan doc carries state - with the unobservable-
  self-assessment nudge gone. No "suggest a reset at ~50%" wording survives
  anywhere.
- home/CLAUDE.md gains two bullets in Daren's voice, lean, no em dashes: **match
  effort to blast radius** (a one-phrase stakes read; shallow check for low-blast
  reversible work, the full machinery only when it is earned) under Code
  Discipline; and **name what you changed outside the code** (a swapped credential,
  a reset password, a reaped database, altered shared/local state - say so in the
  close-out) under Honesty.
- The deferred nuggets are not touched here; they are reserved for the dedicated
  CLAUDE.md curation pass.

## Out of Scope

- Scott's full operating-manual CLAUDE.md and its remaining nuggets (dedicated
  curation pass: confirmed-vs-inferred sharpening, finding-is-a-hypothesis,
  close-with-state, before-you-send re-read, and the rest).
- The format-on-edit hook, scott-writing-style, the CLAUDE-FOR-FABLE variant, the
  agent-teams harness.
- Reversing capable-by-default (this adds the down-selection mechanism; the default
  stays capable).
- Acting on kaizen candidate 1 (the durable-test vs no-new-test-infra precedence);
  that remains a kaizen item.

## Open Questions

1. Council defaults (lens roster, round cap). Defaulted to Scott's three lenses /
   three rounds, adjustable per fork. Owner: Daren.
2. Whether brainstorming auto-offers the council or only on a flagged fork.
   Defaulted to offer-at-a-genuine-fork plus direct invocation. Owner: Daren.

## Chapters

### Chapter 1 - 2026-06-17
Completed: Section 1 (Model down-selection)
Implemented By: main session (Approach decision 6 - voice-critical agent and skill authoring)
Decisions / Surprises: Two model-pinned implementer agents (implementer-opus model:opus, implementer-sonnet model:sonnet) carrying the kit's verify discipline (build + durable-test checkpoint, the four-status protocol, stage-never-commit, read the style-skill paths since subagents inherit no skills). executing-work reworked to three execution modes - main (orchestrator session on the selected model, never named), delegate-capable -> implementer-opus, delegate-mechanical -> implementer-sonnet. The main-thread model is never hard-coded, so selecting Fable as main needs zero instruction changes (the decoupling Daren asked for). brainstorming assigns a mode per section; the Chapter format gained "Implemented By" (in use as of this Chapter). Capable-by-default and reviewers-never-downgrade preserved; the global Subagent Orchestration anchor already defers model selection to executing-work, so no CLAUDE.md change was needed.
Review Findings: APPROVED_WITH_CONCERNS, 4 Minors, all fixed: the escalation paragraph reworked so a first NEEDS_CONTEXT is answered and re-dispatched at the same tier (distinct from BLOCKED), and the fail-twice trigger broadened to "two failures of any kind at the tier"; brainstorming's mode list reordered capable-first to match the default; the "brainstorming lesson" on repeated escalation now routes to a kaizen note (dogfooding the loop).
Next: Section 2 (Design council)
Commit Model: Commit-and-Push
