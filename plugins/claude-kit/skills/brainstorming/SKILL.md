---
name: brainstorming
description: Collaborative design conversation for any new feature, project, or non-trivial change. Use when Daren wants to think through a problem before building. Phrases like "let's think through", "help me design", "spec this out", "how should we approach", or any substantial new effort without an existing spec (or with only a parked Proposed-status stub). Produces a spec file in docs/plans/ with an agreed commit model. Skip for trivial fixes and small obvious changes.
---

# Brainstorming

Explore the problem space WITH Daren in conversation, then capture the agreement as a spec that the executing-work skill runs on. This is a conversation, not a gate. The value is the back-and-forth, feeling out all corners of the problem together. Never delegate the conversation itself to a subagent.

## Process

1. **Understand before proposing.** Read the relevant code first (use the built-in Explore subagent for broad reconnaissance so the main context stays lean). Never design against guessed signatures or imagined architecture.

2. **Scope check, and name the forks.** Before drilling into questions, do two passes over the request.

   First, **size it.** If it spans multiple independent subsystems (its own data, its own lifecycle, useful on its own), it is too big for one spec: name the pieces, how they relate, and the order to build them, then split it into sub-project specs. Brainstorm the first through this process; each sub-project gets its own spec and its own execute/finish cycle. Decomposing first beats refining the details of something that should have been three specs.

   Second, **enumerate the forks** and write the list out, even when it is empty: the points where the design could go more than one way and at least one way is hard to undo later (architecture, schema or data-model, build-vs-buy, a migration direction). Size is not the test; a small change can sit on a hard-to-reverse fork and a large one can have a single obvious path. If the list is non-empty, offer the `design-council` here, before the design questions, with a one-line juice-vs-squeeze read: name the fork, say whether independent lenses would likely change the outcome, and make the call (e.g. "one genuine architecture fork, but the choice looks clear enough that the council is probably overkill" vs. "a hard-to-reverse data-model fork with several live options, where the council would likely catch nuances we'd miss"). The council convenes independent lenses to pressure-test the approaches and returns a recommendation or a clean unresolved fork; it never makes the call. It is opt-in and costs real time and tokens (several reviewers, multiple rounds), so name that cost. Make the offer live in this turn and hand the choice to Daren: convene now, convene after a question or two of framing, or skip. Recommend the sequencing when framing facts would sharpen the council, but do not defer the offer itself to a later turn you control; "I'll offer it later if the fork is still open" is precisely how it never gets offered, the failure this step exists to fix. If the fork list is empty, say so in one line and move on; do not offer the council for a single-path change.

3. **One question at a time.** Ask the question whose answer most changes the design. Wait for the answer before asking the next. Do not front-load a questionnaire.

   **Offer the visual companion before you show Daren anything, and wait for his yes.** Offer at the point you first judge that a question would land better shown than described. Making that judgment is yours; acting on it without asking is not, because a screen written into his repo costs tokens he did not agree to spend. Offer at that moment rather than deferring to a later turn you control, for the same reason step 2 gives about the council, and note that a brainstorm can turn visual on its fourth question as easily as its first.

4. **Feel out the corners.** Edge cases, failure modes, integration points, performance characteristics, who consumes the output, what happens on re-run, what already exists that solves a similar shape.

5. **Present options with tradeoffs** when a real decision exists. State a recommendation and the reason. Disagree openly with Daren's framing when warranted; he wants the arguments, not agreement. Hold the position under pushback and move on new facts, not tone. If a genuine fork surfaces only here, one that scope check (step 2) did not see, offer the `design-council` under the same juice-vs-squeeze rule rather than letting it slide.

6. **Plan sketch before full spec.** Present a short sketch first: goal, approach, the sections of work. Cheap to redirect here; expensive after the full write-up. Iterate on the sketch until agreed.

7. **Write the spec** to `docs/plans/<project>_spec_v1.md`. If a file already exists under that name, branch on its status:
   - **`Status: Proposed`** (a kaizen deferred-promote stub parked here): flesh it out in place - fill in Goal, Approach, and Sections of Work, flip `Status:` to `In Progress`, reset Chapters to empty. Completing a stub is not overwriting a prior version.
   - **`In Progress` or `Complete`** (real prior work): increment the version (`_v2`, `_v3`, ...); never overwrite a prior version.

   Assign each Section of Work an execution mode per executing-work's model policy: **delegate-capable** for delegated work by default, **delegate-mechanical** only for a genuinely mechanical, well-bounded section, **delegate-fable** for a section that needs the strongest model but is still briefable (novel logic, a security-sensitive surface, subtle or cross-cutting correctness inside a settled design), **main** for the design-entangled, tiny, or session-state-bound sections. A section only earns a cheaper mode if its spec text is precise enough that an implementer with no conversation context can build it from the section text alone; write to that standard or assign the higher mode. The same test one level up separates **delegate-fable** from **main**: a strongest-model section whose spec will keep evolving in contact with the code stays main. When unsure between two, take the higher.

   A **delegate-fable** assignment doubles as Fable spend authorization within the plan-included allotment, so name the expected Fable surface in the spec's `Fable Spend:` header where Daren sees it at approval time. Crossing into metered Fable is never authorized by a mode assignment alone: that takes Daren's explicit line in the same header, for this specific effort. `Fable Spend: none (cost hold)` holds the whole effort at the session model regardless of what the sections' modes say.

   Then run the `curating-docs` create path: register the new file in `docs/README.md` with a one-line hook, or update its existing entry when fleshing a Proposed stub (the index marker flips to In Progress), and cross-reference in both directions any plan it builds on or supersedes.

   Then sweep the visual companion's screens: if `.kit/visuals/` holds a `current.html` or any `NNN-*.html`, delete those and say in one line how many went, leaving `frame.css` in place. Gate this on what is in the directory rather than on whether this session used the companion, so a brainstorm that was abandoned before its spec does not leave screens nobody ever clears. What the spec you just wrote has to carry is the decision itself, as values rather than a reference to a picture that no longer exists. Anything worth keeping is promoted while the session is running, not rescued here: these files are untracked and never committed, so there is nothing to recover from.

8. **Agree on the commit model** and record it in the spec header:
   - **Review-Only**: changes accumulate uncommitted; sections are staged as they complete, and the staged diff (git diff --staged) is Daren's review surface before anything is committed. Common for smaller changesets in big existing projects.
   - **Branch-and-PR**: work happens on a feature branch; sections are committed there and finishing-work opens a pull request. The default for shared repos.
   - **Commit-and-Push**: commit and push to origin as sections complete. For greenfield or personal projects where Claude authors most of the work and Daren has said main is fine.

9. **Spec self-review.** Before handing the spec to executing-work, read it once with fresh eyes and fix inline: placeholders (TBD, TODO, "handle appropriately"), sections that contradict each other, requirements that could be read two ways (pick one, make it explicit), and scope that drifted past the goal. A defect caught here is a sentence to fix; the same defect found mid-execution is rework. Fix and move on; no re-review ceremony.

## The visual companion

A static HTML file in Daren's own browser, styled by a frame this skill ships. Nothing leaves
the machine, which is what makes it usable for client work, and he answers in the terminal.

Offer it in its own message rather than bolted onto a question, and be straight about the cost:

> "Some of this might be easier to settle if I show you rather than describe it. I can put
> mockups, palettes and comparisons in your browser as we go, as static files on your machine.
> Rendering them costs tokens. Want it available?"

Accepting makes it available for the rest of the session. It does not mean later questions go to
the browser by default.

The mechanics, the on-disk paths, the class catalogue and the spec-write sweep are in
`references/visual-companion.md`. Read it before the first push.

## Spec format

```markdown
# <Title>

Status: In Progress
Commit Model: Review-Only | Branch-and-PR | Commit-and-Push
Fable Spend: <expected Fable surface, e.g. "S2, finishing reviews"> | none (cost hold)
Created: YYYY-MM-DD

## Goal
One paragraph. What exists when this is done, and why it matters.

## Approach
The agreed design. Key decisions and the reasoning behind them, so future
sessions (and post-compaction recovery) understand intent, not just steps.

## Sections of Work
### 1. <Section name>
What gets built. Acceptance criteria as verifiable statements.
Execution mode: main | delegate-fable | delegate-capable | delegate-mechanical.
Tests: <optional> the behaviors this section must lock and the risk driving each.
### 2. ...

## Out of Scope
Explicitly excluded items, so drift is detectable.

## Open Questions
Unresolved items and who owns the answer.

## Chapters
(Appended by executing-work as sections complete. Leave empty at creation.)
```

Specs stay at acceptance-criteria altitude: goal, approach, sections, verifiable criteria. Do not pre-write implementation code into the spec; detailed direction for delegated tasks is generated at dispatch time by executing-work, in contact with the actual code.

Give a section the optional `Tests:` line where it carries real behavioral risk, and hold it to three constraints so it orients the implementer instead of confining one. It states **intent, never design**: what to lock and the risk driving each, never fixtures, seams, or structure, which are implementation knowledge the plan does not have. It is a **floor, never a ceiling**: the implementer's duty to settle the test question runs past whatever the line names. And it is **amendable on contact with the code** like any other spec claim, with the delta flagged in the Chapter.

## When not to use

A trivial fix or a small obvious change does not need a spec; just fix it under the global rules. If Daren asks to brainstorm something that turns out to be trivial, say so and offer to just do it.
