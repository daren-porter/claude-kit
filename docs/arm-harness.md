# The arm harness

A `writing-skills` arm measures what an agent does with a piece of wording. An arm
dispatched from inside this repo cannot control what else reaches its reps, so this
is the machinery for dispatching one that can, plus the measured list of what it
still cannot close.

`tools/arm-harness.js` materializes one directory per rep outside the repo, each
carrying the `arm-rep` agent definition and a copy of every fixture:

```
node tools/arm-harness.js <arm-name> <reps> <fixture>...
```

It dispatches nothing. It prints one `claude -p` command per rep, and you run them
and read each reply yourself, because reading every flagged result is the part of an
arm that cannot be automated.

## Why not just dispatch a subagent from here

Because two channels put the answer in front of the rep, both measured 2026-09-07.

**The project auto-memory.** A rep dispatched inside this repo quoted, from context
alone and with no tool call, the project memory index, three of its titles, and the
entries "Premise corrections need verifying ... prove it against the sentence's git
history" and "Size a wording change by its readers ... grep every skill that WRITES
the field". For an arm about prose rules that is an answer key. The auto-memory is
keyed to the repo path, so a rep whose cwd is a scratch directory has none: the same
questions asked from `/tmp` came back no, no, no.

**The skill listing.** A general-purpose rep carries an injected `skill_listing`
holding the name and description of every installed skill. Where an arm's treated
text IS a description, both versions are then in front of every rep, which is what
voided the `kit-denaming` S2 arm. A rep whose agent definition omits `Skill` from
`tools:` gets no listing at all, reported by the rep as "no list of available skills
with names and descriptions anywhere in my context", and no `Skill` tool with which
to pull a body.

## What it does not close, and none of this is fixable from here

Stated because a harness oversold is worse than no harness.

| Still reaches every rep | Note |
|---|---|
| The global `CLAUDE.md` | User-level, so a scratch cwd does not shed it. It names kit skills in prose (`executing-work`, `brainstorming`, `kaizen`, `cross-project-memory`) and carries the style rules; a rep quoted the em-dash ban verbatim. |
| MCP server instructions | Present for three servers whose tools are not even callable. |
| `advisor` | Injected whatever `tools:` says. A rep can consult it and bring back guidance the arm did not author. |
| The org-level instructions | Same channel as the global rules. |

So an arm through the harness is **cleaner, not clean**. Where the wording under test
overlaps the global rules or a skill named in them, say so in the arm's record rather
than claiming isolation.

**And isolation is not discriminating power.** The arm this harness came out of was
void for two reasons, and the harness fixes one. Its criteria were also satisfiable
by any competent rep, so a control cell scored the same ceiling as both treatments.
A harness cannot make a fixture discriminate; only a fixture whose criteria a
competent rep can fail does that.

## Two cues the harness itself leaked, found on its first live use

Both are fixed and both are pinned by `test/arm-harness.test.js`, and they are recorded
because the class recurs rather than because these two instances are still live.

**The rep directory named the arm.** It was `arm-<name>-<random>`, so every rep's cwd
announced the experiment. Rep 01 of the first arm wrote that it declined to read this
very document because "the directory name says this is a probe", and the same rep then
went to the real repo and quoted `accretion.js:489`. Directories are now `w-XXXXXX`.

**The agent was called `arm-rep`.** A rep enumerating its own `.claude/agents/` saw
`arm-rep.md`. It is now `plain-worker`, which is also what the charter actually
describes.

Two of three reps under the leaky harness tried to reach the real kit and one
succeeded, so this was not a theoretical exposure. `writing-skills` already records the
mechanism, a fixture path reaching every rep with nothing walked, and the harness
walked into it.

## Two things that leak through the harness itself

**Do not put the dispatch prompt, notes or scoring in a rep directory.** A rep reads
what is in its cwd. One did exactly that, reporting that it had read the dispatcher's
own `p.txt` and correctly noting it was "the parent's dispatch prompt, not an input to
my answer". The tool passes the prompt inline for this reason.

**The rep does not see the agent definition's `description`,** only its body: asked
to quote any description of its own role, a rep returned the generic SDK preamble
rather than the `arm-rep` description. So the description is dispatcher-facing. The
body is not, which is why `arm-rep`'s body says nothing about being a test, an arm, or
a measured rep: `writing-skills` holds that a rep told it is comparing two drafts will
find a difference because it was asked to.

## Re-verifying it

The isolation is a property of the harness plus the harness's environment, so it is
worth re-checking after a Claude Code upgrade or a config change rather than trusting
this page. Materialize a one-rep arm whose fixture asks the rep to report, from
context alone, whether it has a `Skill` tool, a skills listing, a project memory
index, and the two memory entries named above. Four noes and the style rule is the
expected result. `test/arm-harness.test.js` holds the one property a unit test can:
that a rep directory is never created inside this repo, which would silently restore
the memory channel with nothing in the output looking different.
