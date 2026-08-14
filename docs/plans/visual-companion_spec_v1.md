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
silently. A screen that genuinely deserves to outlive the session is promoted deliberately
into that project's committed `docs/`, as Daren's call during the session.

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
- The skill's step 7 gains the sweep of `.kit/visuals/` at spec-write, reporting in one line
  what was removed, plus the documented escape hatch for promoting a screen into the
  project's committed `docs/`.
- No wording in either file claims live update, click-back, or an events stream.

Execution mode: main.

### 3. Baseline-test the browser-versus-terminal rule, and cut it

The decision rule shapes behavior and had no locator behind it, so it earned a RED before
being written down anywhere. Section 2 deliberately left it out so that ordering held. The RED
ran first, came back clean, and **the rule is cut rather than persisted**; the capability
documentation ships without it.

The criteria as met, with the plan's conditional branch resolved:

- The RED staged the state the rule guards: the companion already accepted AND already used
  successfully for a genuinely visual question, with the next question conceptual (what
  archiving means) on a deliberately UI-adjacent topic, which is superpowers' own counter-case
  shape. It ran in a self-contained scratch project outside the kit repo, so this spec, which
  describes the rule, was not on the reps' path.
- The candidate wording was never in the repo, the scratchpad, or any rep prompt.
- Four reps ran; three were in state and counted. The fourth was discarded on two independent
  grounds: it opened this spec while hunting for `frame.css` (caught by checking what each rep
  actually opened, and self-reported), and it was confounded anyway because the capability did
  not yet exist on disk. Its objection, that a rule about reaching for the browser cannot be
  baselined on an agent with no browser to reach for, was taken and closed by placing a real
  `frame.css` in the fixture for the third counted rep.
- **All three counted reps behaved defensibly**, by two different routes: one declined the
  browser on the merits, and two pushed a consequence visualization while keeping the argument
  and the recommendation in the terminal. Verbatim rationalizations are in the Chapter.
- **The rule is cut, and on a stronger basis than a bare clean run.** Superpowers' version
  routes "what does X mean?" to the terminal; two of three reps pushed anyway, each justifying
  it on the merits and each producing good work. Porting it would have suppressed judgment the
  reps exercised correctly, so the wording would have made behavior worse rather than merely
  failing to improve it.
- `brainstorming/SKILL.md` therefore gains no decision rule. The one retained sentence about
  the offer's scope ("Accepting makes it available for the rest of the session. It does not
  mean later questions go to the browser by default") states what Daren is agreeing to rather
  than instructing the agent, and is behavior all three reps exhibited unprompted.
- Three counted reps was the threshold, named in the plan before any rep ran so it could not be
  chosen after seeing results, because `writing-skills` says only "several" and a threshold the
  agent picks is discharged by whatever it picks.

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
Completed: 3. Baseline-test the browser-versus-terminal rule, and cut it
Implemented By: main session (RED reps dispatched as general-purpose subagents)
Metrics: 1 review round (adversarial alone, changeset is docs-only); 4 RED reps, 3 counted; 0 escalations; advisor on, not consulted during execution
Decisions / Surprises: Run first, ahead of Section 2, because `writing-skills` requires the RED before the wording exists anywhere and Section 2 would have put it in the repo. **Outcome: the rule is cut.** Three in-state reps all behaved defensibly, one declining the browser on the merits and two pushing a consequence visualization while keeping the argument and recommendation in the terminal. Superpowers' rule routes "what does X mean?" to the terminal, so porting it would have forbidden what two independent reps did well: the wording would have made behavior worse, not merely failed to improve it. I briefly called the RED fired on rep 3's behavior before reading its reasoning, and had to correct that: it explicitly refused the A/B/C format and used the browser only for "the one part of the argument prose cannot carry". Verbatim rationalizations, per-rep contamination detection, and the full record are in the scratchpad at `s3-red-record.md`; the decisive quotes are reproduced in the amended Section 3.
Review Findings: (recorded when the review returns)
Next: finishing-work
Commit Model: Commit-and-Push
