---
name: brainstorming
description: Collaborative design conversation for any new feature, project, or non-trivial change. Use when Daren wants to think through a problem before building. Phrases like "let's think through", "help me design", "spec this out", "how should we approach", or any substantial new effort without an existing spec. Produces a spec file in docs/plans/ with an agreed commit model. Skip for trivial fixes and small obvious changes.
---

# Brainstorming

Explore the problem space WITH Daren in conversation, then capture the agreement as a spec that the executing-work skill runs on. This is a conversation, not a gate. The value is the back-and-forth, feeling out all corners of the problem together. Never delegate the conversation itself to a subagent.

## Process

1. **Understand before proposing.** Read the relevant code first (use the built-in Explore subagent for broad reconnaissance so the main context stays lean). Never design against guessed signatures or imagined architecture.

2. **Scope check.** Before drilling into questions, gauge the size of the request. If it spans multiple independent subsystems (its own data, its own lifecycle, useful on its own), it is too big for one spec: name the pieces, how they relate, and the order to build them, then split it into sub-project specs. Brainstorm the first through this process; each sub-project gets its own spec and its own execute/finish cycle. Decomposing first beats refining the details of something that should have been three specs.

3. **One question at a time.** Ask the question whose answer most changes the design. Wait for the answer before asking the next. Do not front-load a questionnaire.

4. **Feel out the corners.** Edge cases, failure modes, integration points, performance characteristics, who consumes the output, what happens on re-run, what already exists that solves a similar shape.

5. **Present options with tradeoffs** when a real decision exists. State a recommendation and the reason. Disagree openly with Daren's framing when warranted; he wants the arguments, not agreement. Hold the position under pushback and move on new facts, not tone.

6. **Plan sketch before full spec.** Present a short sketch first: goal, approach, the sections of work. Cheap to redirect here; expensive after the full write-up. Iterate on the sketch until agreed.

7. **Write the spec** to `docs/plans/<project>_spec_v1.md` (increment the version if the name exists; never overwrite a prior version). Assign each Section of Work an execution mode per executing-work's model policy: **delegate-capable** for delegated work by default, **delegate-mechanical** only for a genuinely mechanical, well-bounded section, **main** for the design-entangled, tiny, or session-state-bound sections. When unsure between two, take the higher.

8. **Agree on the commit model** and record it in the spec header:
   - **Review-Only**: changes accumulate uncommitted; sections are staged as they complete, and the staged diff (git diff --staged) is Daren's review surface before anything is committed. Common for smaller changesets in big existing projects.
   - **Branch-and-PR**: work happens on a feature branch; sections are committed there and finishing-work opens a pull request. The default for shared repos.
   - **Commit-and-Push**: commit and push to origin as sections complete. For greenfield or personal projects where Claude authors most of the work and Daren has said main is fine.

9. **Spec self-review.** Before handing the spec to executing-work, read it once with fresh eyes and fix inline: placeholders (TBD, TODO, "handle appropriately"), sections that contradict each other, requirements that could be read two ways (pick one, make it explicit), and scope that drifted past the goal. A defect caught here is a sentence to fix; the same defect found mid-execution is rework. Fix and move on; no re-review ceremony.

## Spec format

```markdown
# <Title>

Status: In Progress
Commit Model: Review-Only | Branch-and-PR | Commit-and-Push
Created: YYYY-MM-DD

## Goal
One paragraph. What exists when this is done, and why it matters.

## Approach
The agreed design. Key decisions and the reasoning behind them, so future
sessions (and post-compaction recovery) understand intent, not just steps.

## Sections of Work
### 1. <Section name>
What gets built. Acceptance criteria as verifiable statements.
Execution mode: main | delegate-capable | delegate-mechanical.
### 2. ...

## Out of Scope
Explicitly excluded items, so drift is detectable.

## Open Questions
Unresolved items and who owns the answer.

## Chapters
(Appended by executing-work as sections complete. Leave empty at creation.)
```

Specs stay at acceptance-criteria altitude: goal, approach, sections, verifiable criteria. Do not pre-write implementation code into the spec; detailed direction for delegated tasks is generated at dispatch time by executing-work, in contact with the actual code.

## When not to use

A trivial fix or a small obvious change does not need a spec; just fix it under the global rules. If Daren asks to brainstorm something that turns out to be trivial, say so and offer to just do it.
