# Visual Companion

A brainstorming question gets answered faster by looking when the thing in question is
visual: a layout, a colour palette, a theme, a page mockup. This is how to put one in front
of the user.

It is a static HTML file they open in their own browser. There is no server, no port, no
process to manage, and no way for the page to send anything back. Nothing leaves the
machine, which is what makes it safe for client work. They reply in the terminal, as they
would to any other question.

## Where things go

Everything lives in the project being brainstormed, under `.kit/`, which is machine-local
and never committed.

| Path | What it is |
|---|---|
| `.kit/visuals/frame.css` | The theme and layout classes. Copied in once per project. |
| `.kit/visuals/current.html` | The screen the user has open. Overwritten on every push. |
| `.kit/visuals/NNN-<name>.html` | An archive copy per push: `001-palette.html`, `002-palette-warmer.html`. |

Four rules about those paths:

- **The source of `frame.css` is `assets/frame.css` under this skill's base directory**, which
  is the path printed to you when this skill loaded. Resolve it from there, never as a path
  relative to the project you are working in: the copy happens from an arbitrary cwd, and
  `assets/frame.css` on its own resolves against that cwd and is not found.
- **Copy it only when it is absent.** A later session must not overwrite it, because the user may
  have tweaked it and that tweak is the point of keeping it on disk.
- **Always overwrite the same `current.html`.** The user keeps one browser tab open and refreshes
  it. This is the opposite of superpowers' never-reuse-filenames rule, which exists only
  because their server serves newest-by-mtime; a human refreshing a tab wants a stable path.
- **Number the archive copy from what is already there:** the highest existing `NNN` plus one,
  zero-padded to three digits, starting at `001` in an empty directory.

## The loop

0. **First push in a project only.** Confirm the screens will be ignored, with
   `git check-ignore -q .kit/visuals/current.html`. That one command covers a global ignore, a
   nested one, and the narrow case where the project ignores `.kit/goal-state.json` but not the
   directory, which a substring check for `.kit/` would pass wrongly. If it fails, write
   `.kit/.gitignore` containing `*`: it ignores itself, needs no git repo, and touches no file
   the user already tracks, so nothing appears in their staged diff as an unrelated change. Untracked
   is not ignored, and a later `git add -A` would otherwise stage client mockups. Then
   `mkdir -p .kit/visuals` and copy `frame.css` in if it is not already there: on a first push
   the directory does not exist yet, so the copy fails without it.
1. Write `current.html`. Then copy that file to the numbered archive name with `cp`; do not
   write the document a second time, which would double the output tokens this design exists
   to save, and would let the two copies drift.
2. Tell the user in one line what is on screen, and where. First push: give them the absolute path
   or a `file://` URL, since a project-relative path is not something a browser opens. Later
   pushes: tell them to refresh.
3. Ask your question in the terminal and end your turn. The terminal is the only channel they
   can answer on.
4. Their answer is usually a change rather than a choice, so expect to push a revision. Iterate
   on the current question before moving to the next one.

Two things not to do. Do not use `cat` or a heredoc to write the file, because it dumps the
whole document into the terminal; use the Write tool. And do not describe the screen at
length in the terminal as well, since the screen is the description.

**Two hard rules make a screen inert.** They are what turn "nothing leaves the machine" from an
aspiration into a property, so they are stated as an allowlist and a prohibition rather than as a
list of things to avoid, which always has a gap.

- **The only URL anywhere in a screen is `href="frame.css"`.** No other `src`, `href`, `url()`,
  `@import`, `srcset`, `action`, or `poster`, in markup or in a style attribute. That covers web
  fonts and CDNs, and it also covers the cases a list would miss: an `<iframe>` of the client's
  live site for a side-by-side comparison (which fetches it from this machine, with this
  machine's cookies, the moment the file opens), a favicon, a `preconnect` hint, remote media, a
  `meta refresh`. It is grep-testable, which a judgment call is not.
- **No script and no form.** No `<script>` element, no inline event-handler attribute
  (`onclick=` and friends), no `<form action=>`. The frame ships no JavaScript, and the claim
  that a screen has no channel back is only true while the screen adds none: a `file://` page
  with inline JS can `fetch`, beacon, submit, or navigate its way off the box, and CORS limits
  reading the response rather than sending the request. An interactive prototype is a reasonable
  thing to want and this is not the tool for it; make the states separate screens instead.

## Writing a screen

A screen is a complete small HTML document that links the frame as a sibling. Content goes
inside `id="claude-content"`, which is where the frame keeps all its padding:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Palette options</title>
  <link rel="stylesheet" href="frame.css">
</head>
<body>
  <div id="claude-content">
    <div class="section">
      <h2>Which palette reads better?</h2>
      <p class="subtitle">Same layout, two accent families</p>
    </div>
    <!-- content -->
  </div>
</body>
</html>
```

**Do not put content straight in the body element.** The frame zeroes all default padding and
puts its own on `#claude-content`, so content outside that wrapper renders flush to both
viewport edges, which misrepresents any layout or palette you are asking about.

Link the frame rather than inlining it. Inlining costs roughly 2k output tokens on every push,
and a session is many pushes.

The page scrolls normally like any document. For the frame's fixed header with its own scroll
region instead, wrap the content div in `.header` plus `.main` and add `class="framed"` to the
body:

```html
<body class="framed">
  <div class="header"><h1>Tideline</h1><div class="status">Palette, take 2</div></div>
  <div class="main"><div id="claude-content"><!-- content --></div></div>
</body>
```

`.header h1` is a title slot and `.status` a right-side caption. Neither reports liveness;
the source's green connection dot is removed, since a static file has nothing to report.
Without `framed` those classes still style correctly, they just do not lock the viewport.

## The class catalogue

Everything below is defined in `frame.css`. It carries a `prefers-color-scheme: dark` block,
so a screen follows the OS theme with no work from you. Custom properties are available to
content as a palette: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`,
`--text-secondary`, `--text-tertiary`, `--border`, `--accent`, `--accent-hover`, `--success`,
`--warning`, `--error`. The dark block overrides nine of those twelve: `--success`, `--warning`
and `--error` are defined only in the light block, so they keep their light values in dark mode.
Give any of those three an explicit value if you use it somewhere dark mode has to look right.
The frame's own `.pros h4` and `.cons h4` already carry that limitation.

**Typography and structure.** `h2` for the screen's question, `h3` for a section heading,
`.subtitle` for the line under it, `.label` for a small uppercase tag, `.section` for a block
with bottom margin:

```html
<div class="section">
  <p class="label">Step 2 of 3</p>
  <h2>Which palette reads better?</h2>
  <p class="subtitle">Same layout, two accent families</p>
</div>
```

**Lettered options**, for A/B/C alternatives. Nothing is clickable, so the letter is how
the user names their answer in the terminal:

```html
<div class="options">
  <div class="option">
    <div class="letter">A</div>
    <div class="content"><h3>Single column</h3><p>One thing at a time</p></div>
  </div>
</div>
```

**Cards**, for a grid of visual candidates:

```html
<div class="cards">
  <div class="card">
    <div class="card-image"><!-- the visual --></div>
    <div class="card-body"><h3>Warm neutrals</h3><p>Sand, clay, ink</p></div>
  </div>
</div>
```

**Mockup**, a framed pane with a caption bar:

```html
<div class="mockup">
  <div class="mockup-header">Settings, current</div>
  <div class="mockup-body"><!-- the mockup --></div>
</div>
```

**Split**, two panes side by side, collapsing to one column at 700px and below:

```html
<div class="split"><div class="mockup">…</div><div class="mockup">…</div></div>
```

**Pros and cons**, for a tradeoff you want read at a glance. Add a `.label` above it when the
pane needs naming. Note it has no responsive collapse, so keep the columns short:

```html
<p class="label">Reading A</p>
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Fewer states</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>No done marker</li></ul></div>
</div>
```

**Wireframe primitives**, for sketching a screen: `.mock-nav`, `.mock-sidebar`,
`.mock-content`, `.mock-button`, `.mock-input`, and `.placeholder` for a blocked-out region.
`.mock-sidebar` and `.mock-content` are sized for a row but the frame supplies no row
container, so wrap that pair yourself:

```html
<div class="mockup"><div class="mockup-body">
  <div class="mock-nav">Logo · Lists · Settings</div>
  <div style="display:flex">
    <div class="mock-sidebar">Tags</div>
    <div class="mock-content">
      <input class="mock-input" placeholder="Search links">
      <div class="placeholder">Results</div>
      <button class="mock-button">Save</button>
    </div>
  </div>
</div></div>
```

## Fidelity

Scale it to the question. A layout question wants a wireframe; a palette or theme question
wants real colours and real type, which here means real hex values and a real font stack built
from what the machine already has, never a downloaded font. Use real content where placeholder
text would hide the problem.

One caveat on "real content", because the local-only design does not license it. The two hard
rules above stop a screen reaching the network; they say nothing about what you put in it. Real
client records rendered into a mockup are still that client's data sitting in a file on this
machine, and the moment anyone flattens that screen to share it, the exposure travels with it.
Realistic beats real: enough shape and length to expose the layout problem, invented values.

Some of this section, and the loop's shape, is reworked from superpowers' own visual companion
guide (MIT, Jesse Vincent), the same source `assets/frame.css` came from.

## Sharing a screen with someone else

A pushed screen is not self-contained: it links `frame.css`, so sending the HTML alone arrives
unstyled. To share one, inline the frame into a copy, which makes a single document that renders
anywhere. Three constraints, because this copy is the only artifact in the design built to
travel and it carries whatever the screen carried:

- **Write it to `.kit/visuals/share-NNN-<name>.html`**, numbered like the archive. Never to the
  project root or anywhere else: outside `.kit/` nothing ignores it, and an implementer
  subagent running `git add` will stage it.
- **Flattening and sending are two separate permissions.** "Flatten this so I can send it" is
  not consent to a destination. Say where it would go and get that answer separately, because an
  Artifact is hosted off-machine and is the only egress of project content anywhere in this
  skill.
- **Treat any repo that is not the user's own as client material**, and do not propose an
  off-machine destination for it at all. That is a test rather than a judgment call, which is
  what "wrong for client work" was missing.

## Cleaning up

The screens are scaffolding for a decision, and the decision is what has to survive. So the
outcome goes into the spec, in a form that does not need the picture: a palette is lossless as
hex values, a layout choice is describable in a sentence, and "option B" means nothing once the
screens are gone. Write the values, not the reference.

**When brainstorming writes the spec, delete `current.html`, the `NNN-*.html` archive, and any
`share-NNN-*.html` flattened copy, and say in one line how many screens went.** Resolve
`.kit/visuals/` from the repo root rather than the cwd, and delete those three name patterns
specifically: never `*.html`, which would take anything else that happens to be in there. Three
constraints on that:

- **Sweep the share copies too, and first.** They are the files that carry inlined content and
  were built to be sent, so leaving them is the worst residue of the three. They match neither of
  the other patterns, which is how an earlier version of this rule missed them entirely.
- **Leave `frame.css` alone.** It is the one file in there that is not scaffolding, it may carry
  a tweak of the user's, and the copy-only-when-absent rule above exists precisely so that tweak
  survives into later sessions. A sweep that takes it makes that rule unobservable.
- **Anything worth keeping is promoted before the sweep, not rescued after.** The files are
  untracked and were never committed, so there is no git object to recover and no undo. When a
  screen looks like it is worth more than the decision it produced, say so at that moment and
  let the user decide. Do not save it up for a confirmation prompt at sweep time: the user asked for
  the cleanup to be automatic, so the sweep does not stop to ask, which is exactly why the
  asking has to happen earlier.

Promotion means the screen's *content* becomes text in the spec, which is the only form
`curating-docs` has a home for: its zone table has no entry for an HTML mockup, and a file
dropped into `docs/` unregistered is a defect by its own index rule. If the user wants the actual
file kept, that is theirs to put somewhere; do not invent a docs zone for it.

A session that ends without writing a spec leaves the screens behind, and the reason to accept
that is not disk cost. Screens can hold client-shaped content, so the residue is confidentiality
rather than kilobytes, and it sits unswept until the next spec-write in that project, which may
never come. It is accepted anyway because the alternative is a hook watching every project for
stale files, because the two hard rules keep a stale screen inert, and because the next
spec-write in that project does sweep it, that sweep being gated on what the directory holds
rather than on whether that session used the companion. So it is a deliberate non-feature rather
than an oversight. One duty follows: if a session ends with screens still on disk and they hold
anything you would not want sitting there, say so on the way out instead of leaving it silent.
