# Visual Companion

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: none (no delegate-fable sections)
Created: 2026-07-14

## Goal

`brainstorming` can show Daren full-fidelity visual options in his own browser and iterate
on them across pushes, so a question about a colour palette, a theme, a page layout or a
web-page mockup gets answered by looking rather than by reading a description. Nothing
leaves the machine by default, no server runs, and the kit carries one small stylesheet
rather than an HTTP stack.

## Approach

### What the design pass established

Superpowers' visual companion (`skills/brainstorming/visual-companion.md`, MIT, Jesse
Vincent) is a **brainstorming component for visual questions**, not a progress dashboard.
The stub's original guesses at what it renders (plan/Chapter progress, dependency diagrams,
review-finding summaries, live execution state) were all wrong and are now out of scope.

It works by running a zero-dependency localhost HTTP+WebSocket server that serves the
newest HTML file in a watched directory and records browser clicks to a `state_dir/events`
JSONL the agent reads on its next turn. That server exists for two reasons this kit does
not share: superpowers targets Codex, Gemini CLI and Windows, none of which have an
artifact mechanism, and it wants a click-back channel. Its own guide concedes the click
channel is secondary ("The terminal message is the primary feedback").

Daren's inputs, which decided the design:

- The value was **seeing the visual** and **iterating across pushes**. Not clicking.
- The content is **UI mockups and layouts**: okmind theme and colour-palette work (the most
  useful case so far), and mocking up custom web pages for Eleos.
- His answers to a visual question are usually nuanced feedback rather than "that one", so
  the loop is see, describe changes in the terminal, see the revision.
- **"I don't necessarily need live update or click-back, but I want the visual options to be
  the same."** Fidelity and expressive range are the constraint; the delivery mechanism is
  not.

That last point eliminates the server, because auto-serving and click-back are the only
things it buys. It also eliminates `AskUserQuestion`'s `preview` field as a substitute:
monospace ASCII cannot carry a wireframe or a palette honestly.

### The design

**Port the frame, drop the truck.** The valuable artifact is `frame-template.html`: 214
lines of CSS providing `:root` design tokens, a `prefers-color-scheme: dark` block, and the
presentation classes (`options`, `cards`, `split`, `mockup`, `pros-cons`, the `mock-*`
wireframe blocks, typography). It has no `<script>` and no templating, so it stands alone.
That becomes the kit's visual frame. `server.cjs` (11.2KB), `helper.js` (2.7KB),
`start-server.sh` and `stop-server.sh` are not ported: 7.7KB kept against 20KB dropped.

**Link the frame, do not inline it.** Each pushed screen is a small HTML document that
links a sibling `frame.css`. Inlining 7.7KB of CSS on every push costs roughly 2k output
tokens each time, which is the "token-intensive" cost superpowers names in its own consent
prompt. Linking gets identical fidelity at a fraction of the per-push cost. The known
consequence is that a single pushed file is not self-contained, which the sharing path
below handles.

**One stable filename, plus numbered history.** The current screen is always at the same
path, so Daren keeps one browser tab and refreshes it. Each push also leaves a numbered,
semantically-named copy so he can compare back across a session. This deliberately inverts
superpowers' "never reuse filenames" rule, which exists only because their server serves
newest-by-mtime; different delivery, opposite rule.

**Local-only, with sharing as a documented capability.** Everything lives in the project's
gitignored `.kit/` tree. Local-first means Eleos client mockups are safe by construction
rather than by a rule someone has to remember to apply. Sharing a screen with another
person needs a single self-contained file, which means flattening the frame into it: that
is done on request, and an Artifact is one destination for the flattened file. No code path
and no branch in the skill; if sharing turns out to be frequent it earns a real path later,
on evidence.

**Swept at spec-write, with the decision kept instead.** A visual session ends when
brainstorming writes the spec, so that is where the sweep belongs. What persists is the
decision recorded in the spec, which is lossless for the things this is used on (hex values
and layout choices survive prose). The sweep reports what it removed rather than deleting
silently.

**Amended during execution:** this originally said a screen worth keeping is promoted into that
project's committed `docs/`, and Section 2's criteria required that hatch. Review found it
collides with `curating-docs`, whose zone table has no entry for an HTML mockup and whose index
rule makes an unregistered file under `docs/` a defect. Promotion therefore means the screen's
*content* becomes text in the spec, decided during the session. If Daren wants the file itself,
that is his to place; the skill does not invent a docs zone for it. The sweep also keys off the
contents of `.kit/visuals/` rather than whether the current session used the companion, so an
abandoned brainstorm's screens are cleared by the next spec-write instead of never.

**Deliberately not built:** a stale-file nudge for sessions that end without writing a spec.
Leftovers sit in a gitignored directory costing a few KB, and a SessionStart hook for that
is more machinery than the problem.

### The provenance finding that shapes Section 3

Superpowers' browser-versus-terminal decision rule is good wording and worth porting close
to verbatim. Under `writing-skills` that makes it ported evidence, which requires a locator
showing they wrote it against an observed failure. **Searched and not found:**
`docs/plans/2026-01-17-visual-brainstorming.md`,
`docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md`,
`docs/superpowers/specs/2026-03-11-zero-dep-brainstorm-server-design.md` and
`skills/brainstorming/` record the server architecture and a refactor, but nothing records a
failure behind the rule. Their "Available as a tool, not a mode... it does NOT mean every
question goes through the browser" reads like a correction to observed over-use, but that is
inference, and `writing-skills` is explicit that a rule written from imagination reads
exactly like one written from an incident. So the rule falls to the normal bar and needs a
local RED. Recorded here so a later session does not repeat the search.

**Outcome, 2026-08-14: the RED ran, came back clean, and the rule was cut.** This premise
("port the rule, subject to a RED") is the one the RED falsified, and Section 3 records how.
The capability documentation ships; the decision rule does not.

## Sections of Work

### 1. Frame asset

The stylesheet the kit ships and every pushed screen links. The runtime conventions for
where screens land moved to Section 2, which is where they are written down; this section
builds the asset itself.

Acceptance criteria:

- `plugins/claude-kit/skills/brainstorming/assets/frame.css` exists in the kit payload,
  derived from the CSS in superpowers'
  `skills/brainstorming/scripts/frame-template.html` (read it from the installed plugin
  cache at `~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/`),
  carrying an attribution header naming the MIT licence, Jesse Vincent, and the source
  plugin and version it came from.
- The click-dependent rules are removed rather than carried inert: the `.indicator-bar`
  block and the `.option.selected` / `.selected .letter` state rules. The presentation
  classes they sat beside are kept.
- Every custom property the retained rules reference is still defined in the base `:root`
  block, and every token the `prefers-color-scheme: dark` block overrides exists in the base
  block, so deleting the selection rules leaves no dangling variable in either direction.
  (Amended during execution: the original wording asked for every token in *both* blocks,
  which the source does not do and should not, since `--success`, `--warning` and `--error`
  are base-only and the cascade makes that correct.)
- The file is a stylesheet and nothing else: it contains no `<style>`, `<html>` or `<script>`
  markup, and no `http://` or `https://` URL, so a screen linking it makes no network
  request.
- A proof screen exercising every retained class group is rendered to the session scratchpad
  (not committed) as a document that links `frame.css` as a sibling, confirming the
  stylesheet resolves by relative path from disk.

Execution mode: delegate-mechanical.

### 2. Companion guide and brainstorming wiring

Give the skill the capability and keep the skill lean.

Acceptance criteria:

- `plugins/claude-kit/skills/brainstorming/references/visual-companion.md` exists, following
  this kit's `references/` convention as `csharp-style` and `sql-style` do rather than
  superpowers' sibling layout, and is self-sufficient: the push loop, the on-disk
  conventions, the CSS class catalogue with a minimal example per class group, the
  flatten-for-sharing instruction, and the sweep.
- The on-disk conventions it specifies: `.kit/visuals/frame.css` copied from the skill's
  `assets/frame.css` only when absent, so a local tweak to it survives a later session; the
  current screen at `.kit/visuals/current.html`, overwritten every push and linking
  `frame.css` as a sibling relative stylesheet; an archive copy per push at
  `.kit/visuals/NNN-<semantic-name>.html`, zero-padded and incrementing from `001`; and the
  project's `.gitignore` carrying `.kit/`, added if missing, per the precedent in
  `kit-goal/SKILL.md`.
- A reader following only that reference can push a screen and iterate without opening
  superpowers.
- `brainstorming/SKILL.md` gains a section carrying the offer (made once, naming the cost
  honestly) and a pointer to the reference. It stays proportionate to an 85-line skill.
- **The browser-versus-terminal decision rule is deliberately not written in this section.**
  It is behavior-shaping wording, so Section 3 owned it and ran its RED first; writing it here
  would have put the candidate in the repo and voided that control. That RED came back clean
  and the rule was cut, so its absence from the shipped skill is a decision rather than an
  oversight.
- The offer is for a tool, not a mode: accepting it does not route later questions through
  the browser by default.
- The skill's step 7 gains the sweep at spec-write, reporting in one line what was removed. It
  deletes `current.html` and the `NNN-*.html` archive and spares `frame.css`, and it is gated on
  what the directory holds rather than on whether this session used the companion. (Amended
  during execution, on review: the original criterion said "the sweep of `.kit/visuals/`", which
  taken literally destroyed the `frame.css` that the copy-only-when-absent rule exists to
  preserve. The promotion hatch it also required moved from a file in `docs/` to content in the
  spec; see the Approach amendment for why.)
- No wording in either file claims live update, click-back, or an events stream.

Execution mode: main.

### 3. Baseline-test the browser-versus-terminal rule

Status: **RED complete, outcome awaiting Daren's call on the predicate.** The rule is not in
`brainstorming/SKILL.md` and does not go in without that call.

The rule shapes behavior and had no locator behind it, so it earned a RED before being written
down anywhere. Section 2 left it out so that ordering held. The candidate wording was never in
the repo, the scratchpad, or any rep prompt; it is recorded verbatim in Chapter 3, because a
conclusion about a text nobody can read is not auditable.

**The fixture.** A scratch project (`red-tideline`) outside the kit repo, with the companion
already accepted AND already used successfully for a genuinely visual question, and the next
question conceptual: what archiving means, offered as three readings, on a deliberately
UI-adjacent surface. That is superpowers' own counter-case shape.

**What the reps did.** Four in-state reps, and the behavior is completely stable: **all four
pushed a browser screen**, all four rendered the UI consequences of each reading rather than
tabling prose, all four kept the recommendation and the argument in the terminal, and all four
argued explicitly that seeing the difference beat reading it. No rep treated the accepted
companion as a mode, and none pushed instead of thinking.

**Why the outcome is not decided here.** The plan pre-registered the tempted failure as
"pushing a browser screen for a question that is conceptual rather than visual". Read literally
that predicate is met by all four reps, so the RED fired and the rule is justified. Read as
what the rule is actually for, whether the browser gets reached for when it does not help, no
rep failed, and porting a rule that routes "what does X mean?" to the terminal would forbid a
judgment four independent reps made and defended. The two readings give opposite outcomes on
identical evidence, the plan does not resolve which governs, and that choice decides what
ships. It is recorded here rather than settled, because an earlier pass of this section resolved
it silently in favour of cutting and a review caught that as a post-hoc predicate change.

**Process failures in this section, recorded because they bound what the evidence supports:**

- A first arm of four reps was run before `frame.css` existed in the fixture. One of those was
  discarded for the capability being absent, and two others were counted despite being in the
  same condition, which is incoherent. Only the isolated fourth rep of that arm was genuinely
  in state. The arm was re-run with the capability present and one identical prompt.
- That first arm also used four hand-paraphrased prompts, so a threshold counted across them
  measured prompt variance as much as behavior.
- One rep in the first arm opened this spec while hunting for the missing `frame.css`. The
  isolation claim ("not on the reps' path") was therefore false, and the two grounds for
  discarding it were not independent: the missing capability caused the leak.
- Both arms ran their reps concurrently against one shared `current.html`, so the reps
  overwrote each other's screens. One re-run rep noticed and audited what it found. That does
  not affect whether a rep chose to push, which is its own act, but it does contaminate any
  judgment of the artifacts, and a future arm needs one fixture copy per rep.
- The earlier claim that the wording "would have made behavior worse" is retracted. Every rep
  ran without the wording, so there was no treatment arm and nothing here can distinguish the
  rule blocking those pushes from the rule's own test permitting them.

**One correction to Section 2's record.** `brainstorming/SKILL.md` does now carry
question-classification wording, at step 3: the offer is triggered "when the question you are
about to ask is about appearance". That clause was added to fix a defect both reviewers blocked
on, the offer having no anchor in the numbered process, and the structural anchor is the form
`writing-skills` prescribes for a missed required element. But the trigger half is behavior-shaping
wording of the same species this section gated, and it has neither a locator nor a RED. It is
recorded as an accepted deviation rather than claimed to be absent, and it is the second thing
needing Daren's call.

Execution mode: main.

Tests: no automated test is worth writing here. The behaviors this effort adds are prose
rules and a stylesheet, and Section 3's RED is the verification that fits them. The one
mechanically testable claim, that `.gitignore` gains `.kit/`, is cheaper to verify by
inspection than to pin.

## Out of Scope

- The localhost HTTP/WebSocket server, the client helper, and the lifecycle scripts.
- Click-back, the events JSONL, and any selection state read back from the browser.
- Live update or auto-refresh of the browser view.
- An Artifact publishing code path or an automatic flatten-and-share command.
- A stale-file nudge, hook, or scheduled sweep for abandoned sessions.
- Progress dashboards, Chapter or plan visualisation, dependency and architecture diagram
  rendering, and review-finding summaries. These were the parked stub's guesses about what
  the companion was, and inspection showed it is none of them.
- Multi-device or phone viewing of a screen.

## Open Questions

- Whether sharing a screen with another person becomes frequent enough to earn a real
  flatten path rather than an on-request instruction. Owner: Daren, on evidence from use.

## Chapters

### Chapter 1 - 2026-08-14
Completed: 1. Frame asset
Implemented By: implementer-sonnet, returned DONE_WITH_CONCERNS; orchestrator applied all review fixes in the main thread
Metrics: 2 review rounds (blind, then adversarial after a re-dispatch); 0 NEEDS_CONTEXT; 0 escalations; advisor on, not consulted during execution
Decisions / Surprises: The spec's criteria described runtime outcomes in a brainstormed project rather than what gets built, so the section was rescoped before dispatch to build the asset (`assets/frame.css`) and move the on-disk conventions to Section 2, which is where they are written down. The implementer's concern was a defect in my brief: my keep-list said `.card*`, which literally retains `.card.selected`, while two greps I mandated and step 4's stated expectation are only satisfiable if it is removed. It removed it and flagged the contradiction rather than picking a side silently. Correct call, my fault. The port is byte-identical for every retained rule, verified independently by diffing the extracted source CSS body (deletions only, no additions or modifications). Criterion 3 was amended during execution: it asked for every token in both `:root` blocks, which the source does not do and should not, since `--success`, `--warning` and `--error` are base-only and the cascade makes that correct.
Review Findings: Blind raised 3 MAJOR, all fixed: the extracted stylesheet's `html, body { overflow: hidden }` turned "content too long" into "content silently unreachable" for any document omitting the `.main` wrapper (reproduced headless), so the viewport lock is now opt-in via `body.framed`; the verbatim MIT port shipped without the permission notice and no repo-root licence covers it, so the full notice is in the file header where it travels with the plugin cache; and `cursor: pointer` plus the card lift promised a click this kit has no channel for. Adversarial then raised 1 MAJOR and 6 MINOR. The MAJOR was mine: the header comment I added documented a plain-body path that renders edge-to-edge unpadded, proved by render, so content is now documented as belonging inside `#claude-content`. Fixed MINORs: the word "MIT" had vanished when the permission notice replaced "Licensed MIT."; my comment's literal angle-bracket `body` tripped the section's own mandated grep; and `.header .status`'s green dot was the source's WebSocket connection light, the same false promise as the cursor, so the dot is removed and `.status` is now a plain caption slot. Noted not fixed: `--accent-hover` and `--warning` unused (documented as an author palette), `.pros-cons` missing upstream's breakpoint, and the retained hover border tint (kept deliberately, now said so in the comment). Both reviewers independently re-established byte fidelity after the fixes.
Next: 2. Companion guide and brainstorming wiring
Commit Model: Commit-and-Push

### Chapter 2 - 2026-08-14
Completed: 2. Companion guide and brainstorming wiring
Implemented By: main session
Metrics: 1 review round (adversarial and blind in parallel); 0 NEEDS_CONTEXT; 0 escalations; advisor on, not consulted during execution
Decisions / Surprises: Started inside Section 1's review window, which the section loop allows for a disjoint later section, and its one dependency (the class catalogue) was re-verified against the final asset before closing. The reference follows this kit's `references/` convention rather than superpowers' sibling layout. No durable test: no kit test pins any skill's pointer to its support files, `csharp-style`'s included, so adding the first one here to guard a rename is not worth the inconsistency. Section 1's MAJOR propagated here and neither reviewer could have known it: my canonical screen template used the unpadded plain-body path, so the documented recipe would have produced flush-to-the-edge screens on a tool whose whole job is visual fidelity.
Review Findings: Both reviewers independently returned CRITICAL on the same defect, which is the strongest signal in this effort: the sweep deleted all of `.kit/visuals/`, destroying the `frame.css` a rule 26 lines earlier said must survive, and it deleted gitignored never-committed files with a keep-predicate that could not fire before the delete. The sweep is rewritten in both files: scoped to `current.html` and the `NNN-*.html` archive, `frame.css` explicitly spared, promotion required before the sweep rather than rescued after, and promotion routed to text in the spec because `curating-docs` has no zone for an HTML mockup and an unregistered file in `docs/` is a defect by its own index rule. Other MAJORs fixed: my dark-mode claim was false and actively misleading (`--success`, `--warning` and `--error` are all base-only, not just `--warning`); a screen could reference remote fonts or CDNs, which would falsify the "nothing leaves the machine" rationale by leaking a client machine's IP and referrer, now a hard rule; `assets/frame.css` was unresolvable at runtime from an arbitrary cwd, now resolved from the skill's base directory per the `reconcile-claude-md` precedent; the loop omitted its first-push prerequisites, now a step 0; the archive copy read as a second Write of the same document, doubling the per-push tokens this design exists to save, now a `cp`; and the offer had no anchor in the numbered process, now a conditional at step 3 on an observable trigger (the question in front of you is about appearance) following the design-council precedent in the same file. MINORs fixed: archive numbering rule, `.label` example, the 700px boundary, the absolute-path instruction, the missing-`.gitignore` branch, the non-existent "end-of-session" sweep trigger, attribution for guidance reworked from superpowers, and a duplicated opening paragraph trimmed for leanness. Both reviewers confirmed no decision rule was smuggled back in.
Next: 3. Baseline-test the browser-versus-terminal rule, and cut it
Commit Model: Commit-and-Push

### Chapter 3 - 2026-08-14
Completed: 3. Baseline-test the browser-versus-terminal rule (RED complete; outcome open, see below)
Implemented By: main session (RED reps dispatched as general-purpose subagents)
Metrics: 2 review rounds (adversarial alone both times, changeset is docs-only); 7 RED reps across two arms, 4 counted; 0 escalations; advisor on, not consulted during execution
Decisions / Surprises: Run first, ahead of Section 2, because `writing-skills` requires the RED before the wording exists anywhere. The second arm's result is unambiguous and stable: four in-state reps, four pushes, every one reasoned. What is NOT settled is whether that counts as the failure, because the pre-registered predicate and the rule's actual purpose disagree; Section 3 states the fork. Three self-inflicted method failures, all mine and all now recorded in Section 3: I counted two first-arm reps that were in the same capability-absent condition I used to disqualify a third; I reinterpreted the pass/fail predicate after seeing results and flagged a far smaller amendment in the same document while leaving that one silent; and I ran reps concurrently against one shared output path so they overwrote each other. I also called the RED "fired" mid-effort on a rep's behavior before reading its reasoning, then retracted that.

**The candidate wording under test, verbatim** (superpowers 5.1.0, `skills/brainstorming/visual-companion.md`, "When to Use"): "Decide per-question, not per-session. The test: **would the user understand this better by seeing it than reading it?**" It routes to the browser for "UI mockups", "Architecture diagrams", "Side-by-side visual comparisons", "Design polish", "Spatial relationships"; and to the terminal for "Requirements and scope questions, 'what does X mean?'", "Conceptual A/B/C choices", "Tradeoff lists", "Technical decisions", "Clarifying questions". It closes: "A question *about* a UI topic is not automatically a visual question."

**Second arm, three identical prompts, capability present.** All three pushed. Verbatim:
- Rerun A: "pushed a new visual companion screen framing the archiving decision as three options, each rendered as a paired mockup showing the same three lists in both surfaces a list appears in [...] It states a recommendation rather than presenting a neutral menu." Its message: "so you can see what actually differs rather than reading me describe it."
- Rerun B: "I didn't give you three neutral choices, because they aren't peers. My pick is A, with the reasoning sitting next to each mockup rather than in prose here."
- Rerun C: "Three candidates, each labelled by the job it does rather than the mechanism, plus a matrix of what actually differs between them [...] I'd pick **A** [...] To be straight with you, A is the *more* expensive build, not the cheaper one."

**First arm (four reps, capability absent for reps 1 to 3; only rep 4 in state).** Rep 1 declined the browser: "I'm not pushing a visual for this one. The unsettled thing isn't what archiving looks like, it's which operations stay legal [...] Reusing it here would have been momentum, not fit." Its transcript shows it observed the missing `frame.css` before deciding, so the decline is confounded. Rep 3 pushed and refused the ballot format: "I deliberately did not use the `options` A/B/C format [...] The visual uses `split` for the main-view contrast, which is the one part of the argument prose cannot carry." Rep 2 was discarded, having opened this spec while hunting for `frame.css` and self-reporting it: "Its Section 3 stages a baseline test whose fixture is exactly this shape [...] so do not score this as a rep." Rep 4, the one in-state rep of that arm, pushed.

**Contamination detection method**, kept because it is the only control available once the wording exists on disk: every rep's transcript was grepped for the files it actually opened before its result was counted. Reps 1, 3, 4 and all three reruns touched only fixture paths; rep 2 opened `docs/plans/visual-companion_spec_v1.md`.

**Incidental validation.** Rerun C had only `frame.css`, never the reference file, and still placed content inside `#claude-content` and used no remote resources, choosing a system font stack. That is evidence the Section 1 header-comment fix for the unpadded-render MAJOR works on an agent that reads the stylesheet.
Review Findings: Adversarial (job 1) returned 2 CRITICAL, 3 MAJOR, 3 MINOR against this section's first recorded outcome, and all were valid. The two CRITICALs (counted reps that were out of state, and a post-hoc predicate change) are why the arm was re-run and why the outcome is now open rather than decided. Fixed from the same review: the untestable "would have made behavior worse" claim is retracted, the candidate wording is recorded verbatim above, the evidence now lives in this Chapter rather than an ephemeral scratchpad path, the false isolation and "independent grounds" claims are corrected, and the "gains no decision rule" claim is corrected because step 3's trigger clause is exactly that. Job 2 of the same review confirmed the sweep rewrite genuinely resolves both earlier CRITICALs rather than moving them, and raised 2 MAJOR plus 2 MINOR on it, all fixed: the sweep trigger contradicted the reference and left abandoned-session screens permanent, the `docs/` promotion hatch contradicted the spec unrecorded, "gitignored" was false in the no-gitignore branch, and one justification asserted a false impossibility.
Next: BLOCKED on Daren's call on the predicate and on the step-3 trigger clause; then finishing-work.
Commit Model: Commit-and-Push
