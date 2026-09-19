# The arm harness

A `writing-skills` arm measures what an agent does with a piece of wording. An arm
dispatched from inside this repo cannot control what else reaches its reps, so this
is the machinery for dispatching one that can, plus the measured list of what it
still cannot close.

`tools/arm-harness.js` materializes one directory per rep outside the repo, each an
independent `w-XXXXXX` directly in the system temp dir, each carrying the
`plain-worker` agent definition and a copy of every fixture at its own root:

```
node tools/arm-harness.js <arm-name> <reps> <fixture>...
```

It dispatches nothing. It prints one command per rep, and you run them and read each
reply yourself, because reading every flagged result is the part of an arm that cannot
be automated. **The `--agent plain-worker` in the printed command is load-bearing and
was missing from the first version of this tool.** Without it the command starts an
ordinary top-level session, which receives the injected listing: the top-level
transcript of this harness's own first live use carries `ATTACH skill_listing`, and
only the subagent transcript shows none. That first measurement suppressed the listing
through a hand-typed "Dispatch the plain-worker agent" wrapper the tool never told
anyone to write, so the invocation that produced the result was not the invocation on
offer. Both review seats found it independently.

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

## What it does not close

Stated because a harness oversold is worse than no harness. The first version of this
section was headed "and none of this is fixable from here", asserted without checking
the CLI, and it omitted two of the rows below including the largest. Neither omission
was caught by me.

| Still reaches a rep | Note |
|---|---|
| The filesystem | `plain-worker` holds `Read` and `Bash`, so nothing stops a rep walking to the repo by absolute path, and on the first live arm one did, quoting `accretion.js:489`. Renaming the rep directory did not close this: the directory name was that rep's stated reason for DECLINING one read, not the mechanism of the successful one. Give the fixture identifiers this disk does not answer, and read every rep's own path list. |
| Sibling reps | Every rep runs as the same user, so no permission separates them and `ls /tmp` finds the others. Separate `w-XXXXXX` roots remove the arm-owned parent and the `ls ..` that used to show a rep it was one of N, and they close nothing beyond that. An arm that needs reps not to find each other does not get it from here. |
| The global `CLAUDE.md` | The `instructions` attachment carries exactly one file, the user-level `CLAUDE.md`. A scratch cwd does not shed it. It names kit skills in prose and carries the style rules; a rep quoted the em-dash ban verbatim. |
| The org-level instructions | Reaches a rep through the SYSTEM PROMPT rather than the `instructions` attachment, which is a different channel from the row above; an earlier rep quoted "CRITICAL: The following are organization-level instructions". No managed-settings file exists on this machine. |
| MCP server instructions | Present, and the count is session-dependent rather than constant: one block in a top-level run, three in subagent reps. Their tools are absent from the rep's callable list, which is a property of `tools:` and not of MCP. |
| `advisor` | Injected whatever `tools:` says. A rep can consult it and bring back guidance the arm did not author. |

**A rep's reasoning effort is inherited rather than declared.** `tools/arm-harness/plain-worker.md` carries no `effort:` key, so a rep runs at whatever level its dispatching `claude -p` session resolved, which comes from the `effortLevel` of the config directory that run used and is unset on some profiles. Measured 2026-09-19 on client 2.1.278: a subagent whose definition declares no effort takes its parent session's level. The 13 charters under `plugins/claude-kit/agents/` declare theirs and `test/agent-effort.test.js` pins them; neither that test nor the pre-commit gate that runs it reaches this file, which is outside the directory both enumerate. 

**Why a rep is a subagent and not `claude -p --agent plain-worker`.** The flag form is
simpler and it does suppress the listing, verified with a discriminating control. It also
makes the rep a TOP-LEVEL session, which receives the SessionStart hook injection that a
subagent does not: measured, none of the six recorded arm reps carried
`hook_additional_context`, while a top-level run carries a 2KB preview of the kit's
cross-project memory. **And the truncation is a pointer, not a bound.** The preview
itself contains the absolute path of the untruncated output, and that file holds all
thirty records, among them the two describing the skill-listing mechanism this harness
exists to control. It is one `Read` away for a rep holding `Read`. The only thing
observed stopping a rep was a prompt telling it not to look, and this kit's own rules say
that is not a control. So the tool prints the subagent form, and the flag form is
documented here as the thing not to reach for.

**Two more parts of the printed command are load-bearing, and both were defects a live
arm found.** `< /dev/null` closes stdin: without it every rep of a 2026-09-17 arm wrote
"no stdin data received in 3s" into its own captured output. And the command says "your
entire final output must be that agent reply reproduced verbatim" rather than the older
"then report its reply verbatim and nothing else", because the older phrasing let the
dispatcher relay the reply in one turn and summarize in the next, and `--output-format
text` keeps only the last message. Two of three reps in that arm returned 377 and 157
bytes, one of them entirely "The plain-worker's reply is the message I just posted
above, verbatim", and the run was discarded. Counting these, the invocation this tool
prints has now been wrong five times, which is the reason `dispatchCommand` is one
exported function the test reads rather than a string assembled at the call site.

**What was tried on the residuals, since the first version claimed impossibility.**
`claude --bare` skips hooks, auto-memory and `CLAUDE.md` auto-discovery, which reaches
three rows. It is unusable on this seat for two independent reasons, both observed: it
demands a login this profile does not have, and it drops project-agent discovery, so
`--agent plain-worker` comes back "not found". Supplying the agent inline with `--agents`
does not rescue it, the blocker being auth.

**So an arm through the harness is cleaner, not clean, and that has a duty attached.**
Where the wording under test overlaps the global rules or a skill named in them, say so
in the arm's record rather than claiming isolation. And an arm that does NOT use the
harness owes its record a sentence naming which of the rows above were open, because a
result whose contamination is unstated cannot be re-read later by anyone.

## Three cues the harness itself leaked

All three are fixed and all three are pinned by `test/arm-harness.test.js`, and they are
recorded because the class recurs rather than because these instances are still live.
The third is the evidence for that: it sat in the tool for the whole life of the first
two fixes, in a test file that banned the same token six lines further down.

**The rep directory named the arm.** It was `arm-<name>-<random>`, so every rep's cwd
announced the experiment. Rep 01 of the first arm wrote that it declined to read this
very document because "the directory name says this is a probe", and the same rep then
went to the real repo and quoted `accretion.js:489`. Directories are now `w-XXXXXX`.

**The agent was called `arm-rep`.** A rep enumerating its own `.claude/agents/` saw
`arm-rep.md`. It is now `plain-worker`, which is also what the charter actually
describes.

**The rep directory was an ordinal, `w-XXXXXX/rep-01`.** The first two fixes took the
cues that named the ARM and left the one that numbers the REP. `writing-skills`' own
fixture-path leak records where the tell actually sat in its recorded instance: not the
fixture directory but `red` and `r4`, "ancestor segments the arm's author had added for
bookkeeping". `rep-01` is that segment. Reps read it and quote it back, twenty such
paths in one 2026-09-17 arm's saved output ("Source file read at
`/tmp/w-OjmdCK/rep-02/DocumentNotifier.cs`"), and no rep can decline to read its own
cwd. Meanwhile `test/arm-harness.test.js` asserted the leaf must match `/^rep-\d\d$/`
and, six lines below, that the agent filename must not match `/arm|probe|rep\b/i`: the
same file banning the token and mandating it. Each rep now gets its own `w-XXXXXX` root
and the assertion is inverted rather than deleted. No rep was observed acting on it,
which is what the leak rule predicts, since detection by what a rep opened cannot see a
path it never opened.

Two of three reps under the leaky harness tried to reach the real kit and one
succeeded, so this was not a theoretical exposure. `writing-skills` already records the
mechanism, a fixture path reaching every rep with nothing walked, and the harness
walked into it.

## Three things that leak through the harness itself

**A rep writes outside its own cwd.** One wrote a scratch file one level above it, into
the arm-owned parent its two siblings shared, and it was caught only because the
operator listed that directory by hand between serial reps; a parallel arm would not
have caught it. Separate roots retire that particular surface, and they do not make a
rep's writes bounded. Read what a rep says it wrote rather than assuming its cwd bounds
it, which is the same instrument the leak rules already ask for.

**Do not put the dispatch prompt, notes or scoring in a rep directory.** A rep reads
what is in its cwd. One did exactly that, reporting that it had read the dispatcher's
own `p.txt` and correctly noting it was "the parent's dispatch prompt, not an input to
my answer". The tool passes the prompt inline for this reason.

**The rep does not see the agent definition's `description`,** only its body:
asked to quote any description of its own role, a rep returned the generic SDK
preamble rather than the `plain-worker` description. So the description is
dispatcher-facing. The body is not, which is why `plain-worker`'s body says
nothing about being a test, an arm, or a measured rep: `writing-skills` holds
that a rep told it is comparing two drafts will find a difference because it was
asked to.

## Re-verifying it

The isolation is a property of the harness plus the harness's environment, so it is
worth re-checking after a Claude Code upgrade or a config change rather than trusting
this page. Materialize a one-rep arm whose fixture asks the rep to report, from
context alone, whether it has a `Skill` tool, a skills listing, a project memory
index, and the two memory entries named above. Four noes and the style rule is the
expected result. `test/arm-harness.test.js` holds what a unit test can reach without
dispatching a rep: the tool's input refusals, one directory per rep, the `tools: Read,
Bash` line that is the suppression mechanism, the permission grant the printed dispatch
needs, all three leaked cues, the two invocation clauses above against the real
`dispatchCommand` string, that reps share no parent but the system temp dir, and the one
that matters most, that a rep directory is never created inside this repo, which would
silently restore the auto-memory channel with nothing in the output looking different.
