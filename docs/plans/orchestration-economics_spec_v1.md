# Orchestration Economics: Fable Plans, Cheaper Models Build

Status: In Progress
Commit Model: Branch-and-PR
Created: 2026-07-24

## Goal

The kit's workflow skills encode the session-model-as-mode doctrine: a Fable-led session is for design (brainstorming, specs, adjudication, the finishing pass of a high-stakes effort), an Opus-led session executes approved specs, and Fable enters execution only by explicit per-dispatch model override at named judgment moments. Implementation gains a fable tier above the existing capable/mechanical split, spend on Fable is governed by a near-hard wall at the plan-included allotment, and dispatch briefs gain the upgrades that measurably prevented review rounds in the source kit. Adapted from Scott Applefeld's kit with Daren's decisions applied: no haiku tier, an Opus (not Fable) advisor experiment, principles rather than volatile billing numbers, and our staging contract kept intact.

## Approach

**Session model is the mode.** The economic insight (measured in Scott's transcript study, held here as principle): an execution session's main chain is almost entirely context re-read, and most usage rides at high context, so the orchestrator's model dominates cost, not the implementers'. Quality is protected by spec precision, fresh-context strong-model review, and the finishing pass, none of which requires the strongest model to write the bulk of the code. So: Fable-led sessions design; Opus-led sessions execute; a Fable-led session asked to execute a spec hands off rather than "just doing this small one" (the meter runs on every call of the session that follows, not on the plan's size).

**Fable enters execution at exactly three moments,** each by explicit `model` override on the Agent dispatch: (1) a section the spec tiered `delegate-fable` (the approved spec's tier assignment is the standing authorization; the spec's `Fable Spend:` header is the visibility surface, and a spec predating the header stays authorized by its tiers, gaining the header on first touch); (2) the escalation after a below-fable section fails review twice (one re-dispatch to `implementer-fable`, then the stall is raised); (3) the finishing-pass adversarial and security reviews, which default to the fable override on below-fable sessions.

**The spend wall.** Fable is included in Daren's Team plan up to a capped share of weekly usage and metered past it. Policy: the included allotment is the budget, and crossing into metered Fable requires Daren's explicit authorization for that specific effort, recorded in the spec's `Fable Spend:` header; it is never a silent judgment call. When Fable headroom is exhausted mid-effort and Daren is not present to authorize, downgrade the dispatch to the session model and flag the downgrade in the Chapter so a later Fable pass knows where to look. `Fable Spend: none (cost hold)` is the explicit opt-out that holds the whole effort at the session model. Opus and below are plan-covered and carry no wall. Billing terms are volatile (they changed materially inside July 2026), so the skills state the policy, never current prices or multipliers.

**Tiers extend, not replace, our modes.** The per-section execution mode becomes: `main` (design-entangled, tiny, or session-state-bound; runs on whatever the session model is), `delegate-fable` (needs the strongest model but is briefable: novel logic, security-sensitive surfaces, subtle cross-cutting correctness), `delegate-capable` (implementer-opus, the delegated default), `delegate-mechanical` (implementer-sonnet, only when mechanical, exhaustively specified, cheaply detectable failure, one-or-two-file blast radius). No haiku tier: Scott's own corpus recorded zero haiku dispatches, so the band is unproven; revisit if a genuinely transcription-shaped backlog appears. A new `implementer-fable` agent carries no model pin by design: it inherits a Fable session's model for free and takes the explicit `fable` override from a below-fable session, so the top tier always runs the strongest model available. It follows OUR contracts: stages its work, never commits.

**Escalation ladder** (replacing the current "bump it up or take it over" wording): a delegated section that fails review twice with Critical findings, or returns the same NEEDS_CONTEXT twice, escalates one tier (mechanical to capable, capable to fable) with the failure evidence riding in the escalated brief; a fable-tier failure is taken over in the main thread on a Fable-led session, and raised to Daren on a lower-model session rather than absorbed into a weaker main thread. Never a third dispatch at the same tier unchanged; never a downgrade mid-effort. Under a recorded cost hold, stay at the session model and raise the stall.

**Brief upgrades and the recurrence rule.** The dispatch-prompt requirements gain: every load-bearing technical assertion marked confirmed (with its evidence) or inferred (with "verify before relying on it"), because an unmarked assertion reads as settled fact and gets obeyed; the sibling-breadth line (when a sibling handles the failure mode, name it AND require mirrored breadth: catch scope, regex generality); pin tests and their new expected values when the section changes a counted cross-cutting set; and the workaround bar (a workaround needing a paragraph to justify means fix the code or escalate). The recurrence rule lands in the findings step: when a review surfaces a finding of a class an earlier section's review already surfaced, amend a `Standing Brief Amendments` block in the plan doc that every later dispatch folds in, and record the amendment in the Chapter; two instances of a finding class means the workflow is generating the bug, so fix the generator.

**Scout banding.** Read-only recon dispatches are banded by question shape: a closed fact-check rides the cheap default (a wrong answer is self-surfacing at confirmation time, since scout leads are confirmed before anyone designs on them); open discovery gets an explicit sonnet override (the failure confirmation cannot catch is the miss). Top-model recon is pure burn. Every scout dispatch states its return contract: file:line leads with one-sentence facts, never pasted file contents.

**The advisor experiment (Opus, not Fable).** Daren's variant of Scott's advisor default: `/advisor opus` on execution sessions, valuable mainly because dispatched below-opus subagents inherit it. It is an experiment, not doctrine: Scott's Fable advisor never successfully answered a consultation in his measured corpus, so ours starts unproven too. Verify consultations actually succeed before leaning on it, record the advisor state in each Chapter's Metrics line, and never let it substitute for NEEDS_CONTEXT (consulting an advisor does not transfer the authority to decide) or for the fresh-context reviewers (it shares the session's blind spots).

**Supporting changes.** Brainstorming's spec format gains the `Fable Spend:` header and an optional per-section `Tests:` line (intent never design, a floor never a ceiling, amendable on contact with the code). The Chapter format gains a `Metrics:` line (review rounds; NEEDS_CONTEXT count; escalations; advisor state) as the data feed for the kit's open experiments. `qa-verifier` pins to sonnet (its evidence-per-criterion contract makes a false PASS hard) and `docs-curator` to opus (drift classification gates the finishing run), so neither rides a Fable-led session up to Fable prices; reviewers stay deliberately unpinned and pick up the finishing-pass override.

## Sections of Work

### 1. implementer-fable agent
New `agents/implementer-fable.md` adapted from Scott's: unpinned frontmatter (deliberate, with the reason in a comment or prose), same body contract as our implementer-opus (brief intake, style-skill reading, surgical scope, verify with evidence, status protocol) plus the top-tier framing (novel logic, security surfaces, subtle correctness, still brief-buildable) and the advisor caveat (a missing decision is still NEEDS_CONTEXT even when an advisor would confidently guess). Stages, never commits, matching our contract, not Scott's unstaged one.
Acceptance: file exists, no `model:` key in frontmatter, description distinguishes it from `fable`-tier-inline work; staging language matches implementer-opus verbatim.
Execution mode: delegate-capable.

### 2. executing-work orchestration update
Update `skills/executing-work/SKILL.md`: the execution-mode paragraph gains `delegate-fable` and the session-model-as-mode doctrine (Fable-led designs, Opus-led executes, the three entry moments, the spend wall with unattended-downgrade-with-flag, cost-hold semantics); the escalation ladder per the Approach; the dispatch-prompt paragraph gains the four brief upgrades; a new short recurrence-rule addition in the findings step with the `Standing Brief Amendments` mechanism; a scout-banding paragraph in the delegation section; a short "The advisor" subsection framed as an experiment; the Chapter format gains the `Metrics:` line.
Acceptance: all seven changes present; the existing staging contract, review-never-downgrades rule, and Context discipline section are unchanged; no billing numbers appear; description frontmatter unchanged.
Execution mode: delegate-capable.

### 3. brainstorming update
Update `skills/brainstorming/SKILL.md`: step 7's execution-mode assignment covers the four modes with the fable band and the precision test (a section only earns a cheaper tier if a context-free implementer can build it from the section text alone; the same test one level up separates delegate-fable from main); the spec format gains `Fable Spend:` in the header and the optional `Tests:` line with its three constraints; a sentence making a `delegate-fable` assignment double as spend authorization within the included allotment, with metered crossing requiring Daren's explicit line in the header.
Acceptance: spec-format block updated; mode guidance consistent with executing-work's (same tier names, same default); no billing numbers.
Execution mode: delegate-capable.

### 4. finishing-work update
Update `skills/finishing-work/SKILL.md`: steps 2 and 3 dispatch with the `fable` model override by default when the session model is below Fable, honoring a recorded `Fable Spend: none (cost hold)` and the unattended-downgrade-with-flag rule.
Acceptance: one coherent paragraph before or within the Steps covering both reviews; cost-hold and unattended cases stated.
Execution mode: delegate-capable.

### 5. Agent pins and brief-section alignment
Add `model: sonnet` to `agents/qa-verifier.md` and `model: opus` to `agents/docs-curator.md` frontmatter. Align the "Your brief" sections of `implementer-opus.md` and `implementer-sonnet.md` with the upgraded dispatch contract (confirmed-vs-inferred assertions treated as unverified until checked, sibling-breadth expectation, pin tests, workaround bar), keeping the staging contract as is.
Acceptance: pins present; the two implementer briefs and executing-work's dispatch-prompt paragraph name the same items; no other frontmatter changes.
Execution mode: delegate-mechanical.

### 6. README MODEL TIERING section
Add a MODEL TIERING section to the README stating the mode doctrine, the four execution modes, the three Fable entry moments, the spend wall, and the pins, at README altitude (a paragraph or two, not the skills' full text).
Acceptance: section present, consistent with the skills, no billing numbers.
Execution mode: delegate-mechanical.

## Out of Scope

- A haiku tier (unproven in the source kit; revisit on demand).
- Automated advisor configuration (setting `/advisor opus` is Daren's action; the skills describe it).
- Any billing-number claims in skills or README.
- Changing the staging contract (ours: implementers stage, never commit).
- Re-running Scott's transcript study on our data (the token-profiler exists for a later pass).

## Open Questions

- Whether Opus advisor consultations actually succeed at orchestrator context sizes (owner: the experiment; record per-Chapter in Metrics).

## Chapters

(Appended by executing-work as sections complete. Leave empty at creation.)
