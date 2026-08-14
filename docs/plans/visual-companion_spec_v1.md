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

## Sections of Work

### 1. Frame asset and render path

Establish the stylesheet and the on-disk convention the loop writes into.

Acceptance criteria:

- `.kit/visuals/frame.css` exists in the project being brainstormed, derived from the CSS in
  superpowers' `skills/brainstorming/scripts/frame-template.html` (read it from the installed
  plugin cache, e.g.
  `~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/`), carrying an
  attribution header naming the MIT licence, Jesse Vincent, and the source plugin and version
  it came from.
- The click-dependent rules are removed rather than carried inert: the `.indicator-bar`
  block and the `.option.selected` / `.selected .letter` state rules. The presentation
  classes they sat beside are kept.
- The frame is written only when absent, so a local tweak to it survives a later session.
- The project's `.gitignore` contains `.kit/`, added if missing, following the precedent in
  `kit-goal/SKILL.md`.
- The current screen is written to `.kit/visuals/current.html`, overwritten on every push,
  and links `frame.css` as a sibling relative stylesheet.
- Each push also writes an archive copy alongside it as
  `.kit/visuals/NNN-<semantic-name>.html`, zero-padded and incrementing from `001`, so the
  session's sequence is readable in directory order.
- Verifiable by opening the current screen from disk in a browser: the frame's typography
  and presentation classes render, the dark variant applies under a dark OS theme, and no
  request leaves the machine.

Execution mode: delegate-mechanical.

### 2. Companion guide and brainstorming wiring

Give the skill the capability and keep the skill lean.

Acceptance criteria:

- A `visual-companion.md` reference sits beside `brainstorming/SKILL.md` and is
  self-sufficient: the push loop, the file paths, the CSS class catalogue with a minimal
  example per class group, the flatten-for-sharing instruction, and the sweep.
- A reader following only that reference can push a screen and iterate without opening
  superpowers.
- `brainstorming/SKILL.md` gains a section carrying the offer (made once, naming the cost
  honestly), the per-question browser-versus-terminal rule, and a pointer to the reference.
  It stays proportionate to an 85-line skill.
- The offer is for a tool, not a mode: accepting it does not route later questions through
  the browser by default.
- The skill's step 7 gains the sweep of `.kit/visuals/` at spec-write, reporting in one line
  what was removed, plus the documented escape hatch for promoting a screen into the
  project's committed `docs/`.
- No wording in either file claims live update, click-back, or an events stream.

Execution mode: main.

### 3. Baseline-test the browser-versus-terminal rule

The decision rule shapes behavior, has no locator behind it, and therefore earns a RED.

Acceptance criteria:

- A RED is attempted with a fixture that tempts the failure the rule guards: pushing a
  browser screen for a question that is conceptual rather than visual. Superpowers' own
  counter-case ("what kind of wizard do you want?" is conceptual; "which of these wizard
  layouts feels right?" is visual) is the shape to stage.
- The candidate wording is kept out of the repo, out of the session scratchpad, and out of
  the RED prompt until the arm is complete, per `writing-skills`.
- Every rep's output is recorded verbatim, and each rep is checked for whether it entered
  the guarded state before its result is counted.
- If the RED fires, GREEN and REFACTOR follow until the rule holds.
- If it does not reproduce across three in-state reps, the behavior wording is cut rather
  than shipped unverified, while the reference's capability documentation still ships. The
  spec premise that the rule is needed is amended in the Chapter rather than left standing.
  Three is named here on this repo's precedent rather than left to the implementer, because
  `writing-skills` says only "several" and a threshold the agent picks is discharged by
  whatever it picks.

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

(none yet)
