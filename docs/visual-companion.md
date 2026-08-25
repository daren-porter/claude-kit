# Visual Companion

The `brainstorming` skill's way of answering a visual question by showing it: a static HTML file written into the project being brainstormed, opened in the user's own browser, answered in the terminal. There is no server, no port, no process, and no code. The whole capability is one stylesheet plus prose in two files, so nothing here runs, fires on an event, or holds state between turns.

The authoring surface (the push loop, the class catalogue, the worked examples, the sweep) lives once, in `plugins/claude-kit/skills/brainstorming/references/visual-companion.md`, and this document does not restate it. What is here instead is the maintainer's half: what shipped, where the port came from and what was changed in it, how it behaves at the edges, and how to verify a change to it.

## What ships

All three under `plugins/claude-kit/`, and all three are payload, so they reach a session through the plugin cache rather than this checkout:

- `skills/brainstorming/assets/frame.css` (207 lines, of which the first 49 are the licence and author notes). The stylesheet every screen links. The kit's first skill-level `assets/` directory; the only other one is the plugin-level `assets/CLAUDE.md`, which is a different kind of asset entirely (see `architecture.md`).
- `skills/brainstorming/references/visual-companion.md` (249 lines). The self-sufficient guide. A reader following it alone can push a screen without opening superpowers.
- `skills/brainstorming/SKILL.md` (107 lines; the spec described it as an 85-line skill before this effort). Three additions: the consent clause in step 3, the offer wording and reference pointer in "The visual companion", and the sweep in step 7.

## Runtime footprint in a project

Everything the companion writes goes under `.kit/visuals/` in the project being brainstormed, which is the same tree the kit-goal leash uses and the same tree two hooks name as the place for scratch.

| Path | Written when | Lifetime |
|---|---|---|
| `.kit/visuals/frame.css` | first push, only if absent | survives every later session and every sweep |
| `.kit/visuals/current.html` | every push, overwritten | deleted at the next spec-write |
| `.kit/visuals/NNN-<name>.html` | every push, `cp` of `current.html` | deleted at the next spec-write |

Three properties of that layout carry the design. The stable `current.html` path lets the user keep one browser tab and refresh it, which is the deliberate inverse of superpowers' never-reuse-filenames rule (theirs exists because their server serves newest-by-mtime). `frame.css` is copied only when absent, so a tweak the user makes to it survives into later sessions, and the sweep spares it for the same reason. And a screen links `frame.css` by relative href, so the copy in `.kit/visuals/` is what makes a screen render at all; the same file moved elsewhere arrives unstyled, which is why sharing means flattening the CSS into a copy of the document.

The sweep runs at spec-write (step 7), deletes `current.html` and the `NNN-*.html` archive, spares `frame.css`, and reports the count in one line. It is gated on what the directory holds rather than on whether this session used the companion, so screens left by an abandoned brainstorm are cleared by the next spec-write in that project instead of never. Nothing else cleans up: a session that ends without writing a spec leaves its screens in place, which is a recorded non-feature rather than an oversight.

## The port, and how to re-sync it

`frame.css` is derived from `skills/brainstorming/scripts/frame-template.html` in the superpowers plugin, version 5.1.0, MIT, Jesse Vincent. The server (`server.cjs`), the client helper, and the lifecycle scripts were deliberately not ported, on the finding that the server buys only auto-refresh and click-back, neither of which this kit uses. By the port's own accounting that is roughly 7.7KB kept against 20KB dropped.

The full MIT permission notice sits in that file's own header (lines 5 to 25) because the repo root has no `LICENSE` and no `NOTICE`, so the header is the only place the attribution obligation is discharged, and it travels with the plugin cache. Anything that splits, minifies, or relocates this CSS has to carry the notice with every part.

The changes from the source, verified line by line against the 5.1.0 file rather than taken from the Chapter, all in the direction of "no click channel, no server":

- Deleted: the `.indicator-bar` block and its two child rules; `.option.selected`; `.option.selected .letter`; `.card.selected`; `.header .status::before` (the green WebSocket connection dot); the `--selected-bg` and `--selected-border` tokens from both `:root` blocks.
- Modified: `.header .status` recoloured from `var(--success)` to `var(--text-secondary)`, making it a plain caption slot; `cursor: pointer` removed from `.option` and `.card`; `transform` and `box-shadow` removed from `.card:hover`, which keeps its border tint.
- Added: `body.framed { height: 100vh; overflow: hidden; }`, which has no upstream equivalent. It replaces the source's unconditional `html, body { height: 100%; overflow: hidden; }`, so the fixed-header layout is now opt-in.

The hover border tint on `.option` and `.card` was kept on purpose: it aids scanning and promises nothing a static file cannot deliver. `--accent-hover` and `--warning` are defined and unused, as upstream, and are an author palette for inline styles rather than dead tokens.

## How it fails

- **A project with no `.gitignore`, or not a git repo.** Handled, and deliberately not by editing the project's own ignores. The first push confirms with `git check-ignore -q` on the screen's actual path, which honors a global ignore, a nested one, and the narrow case where a project ignores `.kit/goal-state.json` but not the directory. When that check fails it writes `.kit/.gitignore` containing `*`: self-ignoring, no git repo required, and it touches nothing the project already tracks, so it never lands in the user's staged diff as an unrelated change. This is what makes "safe by construction" hold in every branch rather than in the common one. `kit-goal`'s arming check still has the older, weaker shape, which is a backlog item rather than a defect in this feature.
- **Content placed directly in `<body>`.** The frame zeroes all default padding and puts its own on `#claude-content`, so content outside that wrapper renders flush to both viewport edges, misrepresenting the layout or palette being asked about.
- **`.main` used without `body.framed`, or the reverse.** Neither breaks. Without `framed` the document scrolls normally, which is the safe default; the source's unconditional viewport lock turned "content too long" into "content silently unreachable" for any document omitting the `.main` wrapper, reproduced headless during the port.
- **Dark mode and the three base-only tokens.** The `prefers-color-scheme: dark` block overrides nine of the twelve custom properties. `--success`, `--warning`, and `--error` are defined only in the base block and keep their light values in dark mode, which the frame's own `.pros h4` and `.cons h4` inherit.
- **Two layout classes with no safety net.** `.pros-cons` is a fixed two-column grid with no breakpoint, unlike `.split`, which collapses at 700px; and `.mock-sidebar` with `.mock-content` is sized for a flex row the frame does not supply.
- **A remote resource in a screen.** Banned outright rather than discouraged. A linked web font or CDN stylesheet sends the machine's IP, user agent, and referrer off the box, which falsifies the local-only premise the client-work case rests on, and it breaks the flattened single-file copy.
- **Sharing.** Flattening the frame into a copy is on request, per screen, with no code path. An Artifact is one destination and the only path here that puts content off-machine, so it needs the user's say-so and is wrong for client work.

## Operating and verifying it

There is nothing to deploy, configure, or schedule. Two operating facts matter anyway.

Edits in this repo are inert until `/plugin update claude-kit`, because the skill, the reference, and the asset all load from the installed plugin cache. A session cannot see a change it just made to `frame.css`.

No automated test covers any of this, deliberately: the behaviors are prose rules and a stylesheet. `.githooks/pre-commit` runs `claude plugin validate ./plugins/claude-kit` when a commit touches the payload, which checks the manifest and skill frontmatter and says nothing about CSS or reference prose. So the verification for a change to `frame.css` is the one the effort used: write a screen to a scratch directory that links the modified `frame.css` as a sibling, exercise every retained class group in it, open it from disk, and confirm it renders in both colour schemes. Four mechanical checks belong with it, all four mandated by the section's own acceptance criteria: no `<style>`, `<html>`, or `<script>` markup in the stylesheet; no `http://` or `https://` URL anywhere in it; every custom property a retained rule references still defined in the base `:root` block; and every token the dark block overrides present in the base block. The markup grep is deliberately literal enough to trip on an angle bracket inside a comment, which it did during the port, so keep prose in the header free of them.

## Why there is no browser-versus-terminal rule

Superpowers' guide carries a "When to Use" table routing question categories to the browser or the terminal. This kit ships no equivalent, and that absence is a measured decision rather than an omission.

The wording shapes behavior and had no incident behind it, so it was baseline-tested before being written anywhere. Seven in-state reps ran with no rule present, across two fixtures chosen to pull in opposite directions: on a question where the browser adds fidelity (list views under three archiving semantics) four of four pushed a screen and argued why; on a question where it subtracts fidelity (what a CLI should print to stdout, a terminal artifact) three of three declined, two of them noting unprompted that a browser page would flatter one option with an arbitrary width. Perfect discrimination in both directions, on exactly the axis a rule would encode, so the failure the wording guards does not occur here and the rule was cut. Chapter 3 of `visual-companion_spec_v1.md` records the candidate wording verbatim, both arms, and the method failures that bound the evidence; read it before adding a routing rule back.

What the skill does mandate is the part the reps could not do for themselves: getting consent before writing into the user's repo. Step 3 offers the companion at the moment the agent first judges a question would land better shown, names the token cost, and waits. Accepting makes it available for the session and does not route later questions through the browser.
