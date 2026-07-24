# Kit-Goal Port and the Completion Contract

Status: Complete
Commit Model: Branch-and-PR
Created: 2026-07-24

## Goal

The kit gains a deterministic, project-scoped completion leash for plan runs: `/kit-goal docs/plans/<plan>.md` arms it in one line, a Stop hook holds the armed session to completion (no LLM evaluator, no sweet-talking it), and the executing-work skill gains the completion-contract prose that keeps a long run from pausing at section boundaries, gates, or dispatched agents. Ported from Scott Applefeld's kit (`~/repos/sapplefeld-claude-kit`), where the mechanism survived multiple live-fire hardening rounds and ships with a real test suite, then trimmed to what our platform and philosophy actually use.

## Approach

Port the three-file mechanism (`kit-goal-lib.js` shared library, `kit-goal.js` CLI, `kit-goal-stop.js` Stop hook) plus the `/kit-goal` skill and tests from `~/repos/sapplefeld-claude-kit/plugins/claude-kit/hooks/` and `.../skills/kit-goal/`, with two deliberate trims agreed with Daren:

- **No relay clause.** Scott's clause (c) (a resume-relay handoff releases the boundary stop) exists for his Windows AutoHotkey relay plane, which we are not adopting. Our allow conditions are exactly: (a) the plan's Status is Complete or the plan file is gone (archived), which auto-clears the goal; (b) the last assistant message leads with `BLOCKED:` as its literal first characters.
- **No compaction-ledger genealogy.** Scott's successor-inheritance walk reads a ledger his compaction engine writes; we run no such engine, and on current Claude Code both native context summarization and `/resume` preserve the session identity, so the simple binding model suffices: the goal binds to one session (claimed by the user-typed `/kit-goal` command arguments in the transcript), a session bound elsewhere is never leashed, and re-arming is the documented recovery when a bound session dies.

Everything else ports faithfully, because each piece encodes a defense that failed live in Scott's kit before it was added: the fail-open invariant (any error, unreadable transcript, or indeterminate state allows the stop; a block is reachable only after every allow condition affirmatively evaluated), the command-args-only binding claim (assistant echoes, hook-injected context, attachments, tool results, sidechain turns, and local-command stdout never claim), the `BLOCKED:` leading-prefix match with the mid-append retry schedule, the anchored plan-Status classifier with BOM strip, atomic state writes, and the harness's eight-consecutive-block cap as the loop backstop. Goal state lives at `.kit/goal-state.json` (gitignored, project-scoped).

The executing-work skill gains a completion-contract section adapted from Scott's: the hard prohibition on ending the turn with unblocked work remaining, the rationalization table and red-flags list, the `BLOCKED:` protocol, and the dispatch rule his live fire proved necessary: under an armed leash, a wait is not a stop, so the critical-path implementer is dispatched synchronously (`run_in_background: false`) or polled in-turn, the turn never ends to await a completion notification, and the leash is never cleared to escape a block. The wording forms (prohibition + rationalization table + red flags) match writing-skills' prescription for knows-the-rule-skips-it-under-pressure failures, and carry observed-failure provenance from Scott's production incidents; a from-scratch RED/GREEN baseline is deferred to the backlog rather than re-run here.

Tests port to a repo-level `test/` directory (excluded from the plugin payload by construction, since only `plugins/claude-kit/` ships), gate command `node --test test/*.test.js`, minus the relay-clause and ledger-genealogy tests whose mechanisms we dropped.

## Sections of Work

### 1. Library, CLI, gitignore, and library tests
Port `kit-goal-lib.js` (goal state read/write/clear, `bindSession`, `planHead` with the anchored Status regex and BOM strip, `composeCondition` reworded for Daren and for the two-clause condition) and `kit-goal.js` (arm/clear/status CLI with clear aliases) into `plugins/claude-kit/hooks/`. Create the repo `.gitignore` covering `.kit/` (and the existing untracked local noise it should cover: nothing else today). Port `kit-goal-lib.test.js` into `test/`.
Acceptance: `node --test test/*.test.js` passes; `node plugins/claude-kit/hooks/kit-goal.js arm|status|clear` round-trips in a scratch directory; arming refuses a missing or Complete plan with the reason; the condition text names Daren, not Scott, and contains no relay clause.
Execution mode: delegate-capable.

### 2. Stop hook, wiring, session-start surfacing, and hook tests
Port `kit-goal-stop.js` trimmed to the two-clause allow order (no goal → allow; binding scope per the Approach; Complete/archived → auto-clear and allow; leading `BLOCKED:` with the mid-append retry → allow; else block with a reason naming the plan and the ways out, with no relay wording). Wire a `Stop` entry in `hooks.json`. Add armed-goal surfacing to `session-start.js` as an additive block ("kit goal armed for <plan>", sanitized), so no session is surprised by the hook. Port `kit-goal-stop.test.js` minus relay and ledger tests, keeping binding claims, self-injection resistance, BLOCKED retry/flush-race, auto-clear, and fail-open persistence tests.
Acceptance: full test gate passes; a synthetic mid-plan stop payload is blocked and a `BLOCKED:`-leading one allowed (pinned by tests); `node -e "require(process.argv[1])" ./plugins/claude-kit/hooks/kit-goal-stop.js` exits 0 (the `./` matters: require treats a bare relative path as a package id) (the load-check seam, guarded by `require.main === module`); session-start emits the armed-goal block only when a goal is armed.
Execution mode: delegate-capable.

### 3. The /kit-goal skill
Adapt `skills/kit-goal/SKILL.md`: arm/clear/status UX, the two-clause condition described in prose that defers to `composeCondition` as the single owner, the binding semantics (arm from the session that should hold the leash; re-arm is the recovery), and a first-arm note that the session must ensure the project's `.gitignore` covers `.kit/` before arming in a repo that lacks it.
Acceptance: the skill file exists with quoted frontmatter description; no relay or chain-mode references; states the recovery move for a dead bound session.
Execution mode: delegate-capable.

### 4. Executing-work completion contract
Add "The completion contract" section to `skills/executing-work/SKILL.md`: run every remaining unblocked section; a section boundary, a running gate, context pressure, and an awaited subagent are not stopping points; the do-not-end-turn list, rationalization table, and red-flags list adapted to our workflow (native summarization handles context; fresh-session timing stays Daren's call per the existing Context discipline section, which this section must not contradict); the `BLOCKED:` protocol (bare leading prefix, recap after, quoting the convention never releases); the under-a-leash dispatch rule (synchronous dispatch or in-turn polling, never end the turn on a completion notification, never clear the leash to escape); a one-line pointer to `/kit-goal` as the optional arming mechanism, with the contract applying leash or no leash; and the handoff line announcing the switch from brainstorming to autonomous execution.
Acceptance: the section exists and reads in the kit's voice; the existing Context discipline section is reconciled, not contradicted; the skill's description frontmatter is unchanged (per writing-skills, no process summaries in descriptions).
Execution mode: delegate-capable.

### 5. README and gate documentation
README gains: `/kit-goal` in STRUCTURE and THE WORKFLOW, the `test/` directory and its gate command under MAINTAINER TOOLS, and the `.kit/` scratch-state convention. Add a backlog note (created in this effort as `docs/backlog.md` only if spec C has not yet created it; otherwise append) to baseline-test the ported completion-contract wording per writing-skills once it has seen real use.
Acceptance: README references resolve to real paths; the backlog note exists.
Execution mode: delegate-mechanical.

## Out of Scope

- The resume relay, compaction engine, chain mode, and ledger (not adopted, by decision).
- Native `/goal` integration or aliasing.
- Arming goals automatically from executing-work (arming stays Daren's explicit act).
- The doctor tool (our install has no doctor; the load-check lives in tests).

## Open Questions

None. Trims and platform assumptions were decided with Daren on 2026-07-24.

## Chapters

### Chapter 1 - 2026-07-24
Completed: 1. Library, CLI, gitignore, and library tests
Implemented By: implementer-opus
Decisions / Surprises: CLI ported byte-identical; lib differs from source in exactly the composeCondition trim plus three comment-only rewrites the implementer flagged (bindSession comments referenced the relay file and genealogy ledger, mechanisms this kit does not adopt; comments now state the accurate stdin-payload rationale). Accepted: comments describing nonexistent mechanisms would be wrong documentation. Source's "Node v24" header claim dropped (this machine runs v20; `node --test <files>` works there). The test file deliberately pins the trim with a negative /relay/i assertion so a future re-port cannot quietly reintroduce clause (c). Fail-first evidence: the ported tests were run against a mirror carrying the source lib and failed on exactly the condition-wording assertion (23/1), proving they pin the change.
Review Findings: APPROVED. 1 Minor fixed inline (inherited vacuous atomicity assertion checked a tmp filename armGoal never creates; now checks the pid-suffixed name). Security surfaces (control-char rejection, path-escape rejection, sanitize-before-print) verified byte-identical to source by the reviewer.
Next: 2. Stop hook, wiring, session-start surfacing, and hook tests
Commit Model: Branch-and-PR

### Chapter 2 - 2026-07-24
Completed: 2. Stop hook, wiring, session-start surfacing, and hook tests
Implemented By: implementer-opus
Decisions / Surprises: Hook ported at 411 lines (source 604); every kept helper byte-identical to source except comments naming trimmed mechanisms. Test suite ported 47 to 33 (16 relay/ledger tests dropped, 7 adapted with each adaptation named in the implementer report), plus 2 added tests the source lacked (transient plan-read keeps the leash, POSIX-only; unreadable transcript on the bound session fails open). Fail-first evidence: the ported suite run against the untrimmed source hook failed on exactly the no-relay reason assertion (32/1). Spec's load-check acceptance wording gained the "./" prefix (require treats a bare relative path as a package id on Node 20). The block reason keeps "/kit-goal clear" although a namespaced install types "/claude-kit:kit-goal clear"; the hook's command-name gate accepts both, and the skill documents invocation.
Review Findings: APPROVED_WITH_CONCERNS. 1 Major fixed: the spec's "load-check lives in tests" decision was unimplemented (no test required the hook); added a require-with-sentinel test that discriminates via the guarded process.exit(0), and aligned the hook comment that had claimed the test existed. Gate now 58/58. 1 Minor justified: the session-start armed-goal block is verified manually (by implementer and reviewer independently) but not test-pinned; the spec scoped tests to the two kit-goal suites, and a session-start test target is parked for the backlog (section 5 writes it).
Next: 3. The /kit-goal skill
Commit Model: Branch-and-PR

### Chapter 3 - 2026-07-24
Completed: 3. The /kit-goal skill
Implemented By: implementer-opus (parallel with section 4; disjoint files)
Decisions / Surprises: The skill deliberately drops the source's claim that native /goal loses state to compaction (false on current Claude Code, where summarization and /resume preserve session identity); the intro instead grounds the value in project-scoped state surviving crashes and fresh windows. Documents both invocation forms (/kit-goal and /claude-kit:kit-goal), the first-arm .gitignore check, and the failed-clear still-armed case.
Review Findings: APPROVED_WITH_CONCERNS. 1 Major fixed: the Arm section had no guard against the inert-leash case (an arm requested in prose writes state but nothing ever binds, since only the typed /kit-goal command-args claim); Arm now says to have Daren type the command from the session that should hold the leash. 2 Minors fixed: arm-replaces-any-armed-goal stated; re-arm snap-back to a still-open former holder named, with clear-first guidance for deliberate handoffs. 1 Minor (staging hygiene note about the parallel section) resolved by committing each section with its own Chapter.
Next: 4. Executing-work completion contract
Commit Model: Branch-and-PR

### Chapter 4 - 2026-07-24
Completed: 4. Executing-work completion contract
Implemented By: implementer-opus (parallel with section 3; disjoint files)
Decisions / Surprises: One pure-insertion section between the intro and Before starting; every other section byte-identical. The source's "run_in_background: true is the Agent-tool default" claim was dropped by the implementer as unverified, then restored by the orchestrator and independently confirmed by the reviewer against the installed Claude Code's tool schema. The handoff line was in the dispatch but not the spec's enumerated content; spec section 4 amended to enumerate it (flagged here per step 5).
Review Findings: APPROVED_WITH_CONCERNS. 1 Major fixed: the intro's four-item interrupt list and the new five-item blocker set disagreed (external-dependency case missing from the intro), an inherited defect from the source; intro list now carries the item and states the two lists are the same list. 2 Minors fixed: "at the tail of" restored to the red-flags list; the in-turn gate-wait wording now names the Monitor-with-until pattern instead of a bare `until` that bounces off the harness's foreground-sleep guard. 1 Minor recorded: the handoff-line spec amendment above.
Next: 5. README and gate documentation
Commit Model: Branch-and-PR

### Chapter 5 - 2026-07-24
Completed: 5. README and gate documentation
Implemented By: implementer-sonnet
Decisions / Surprises: docs/backlog.md created ahead of the docs-lifecycle effort with a minimal header; that effort formalizes the archive-snapshot convention. Both backlog items landed (baseline-test the ported wording; pin the session-start surfacing).
Review Findings: per-section review skipped (trivial, docs-only; the finishing pass covers it). Gate re-verified 58/58 by implementer and orchestrator.
Next: finishing-work
Commit Model: Branch-and-PR

### Chapter 6 (close-out) - 2026-07-24
Completed: finishing pass over the whole effort.
Implemented By: main session (orchestration) + qa-verifier + adversarial-reviewer (final pass)
Decisions / Surprises: QA: PASS on every acceptance criterion across all five sections, gate 58/58 run twice. Security review folded into the adversarial passes per finishing-work (JS/markdown changeset); the final reviewer confirmed the injection defenses intact and test-pinned. Final adversarial: APPROVED, 1 Minor fixed in this close-out (the session-start armed-goal notice read as if it leashed every session in the repo; now says only the bound session is held). docs-curator deferred to the docs-lifecycle effort's finishing pass, which builds the docs library this repo currently lacks; running the curator here would curate a surface the next effort immediately restructures. Branch-and-PR's PR step deferred by design: one PR covers all three adoption efforts and opens at the docs-lifecycle effort's close (recorded substitution; nothing lands on main without Daren's merge).
Review Findings: all per-section findings fixed in their sections; final-pass Minor fixed here; nothing outstanding.
Delivered: commits d50c896..this one on branch kit-adoptions.
Commit Model: Branch-and-PR
