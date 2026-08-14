# Security model

This document exists so a security review verifies preconditions instead of re-deriving them.
The `security-reviewer` agent reads it first when present, and until now the kit's trust
architecture lived only in code comments, so every pass paid to rediscover the same premises
before it could rate anything.

It is a description of what the kit actually does, not what it aspires to. Every claim here was
read out of the code rather than remembered, and where the code and this document disagree, the
code wins and this document is the bug. Line references are omitted deliberately: they rot, and
each claim names the file and the function so it can be found.

## What the kit is, in security terms

A set of hooks, skills, and agent definitions that run inside Claude Code, on the operator's own
machine, under the operator's own uid. It has no server, no network listener, no credential of
its own, and no privilege the operator does not already have. Its whole attack surface is text
that reaches the model, plus files it reads and writes under `$HOME` and the current repo.

## Two premises that bound almost every finding

**Same uid.** Every store the kit owns (`~/.claude-kit-memory/`, `~/.claude-kaizen/`, the plan
docs, and `.kit/goal-state.json` in the repo) is writable by exactly the account that can also edit `~/.claude/settings.json`
and register an arbitrary hook. So "an attacker who can write to the store can make the model do
X" describes a precondition that already grants strictly more than X. This is the ceiling on a
whole class of findings, and naming it is not a dismissal: it is the difference between a Critical
and a defense-in-depth Minor, and a review should say which side of it a finding sits on.

**The workspace is trusted.** The kit assumes the repo you are standing in is not hostile. It
reads repo files (plan docs, `docs/kit-adoptions.md`) and injects derived values into model
context, and `branch-reaper-nudge.js` runs `git fetch --prune` automatically at session start.
That fetch is bounded and auth-safe (6-second timeout, `GIT_TERMINAL_PROMPT=0`, output discarded,
skipped when a fetch landed within ten minutes) but it is still an automatic network operation
against a remote the repo names. Opening a hostile repo is outside what the kit defends against.
If that premise ever stops holding, the fetch and every repo-file read become live findings rather
than accepted ones.

## Trusted channels: what is instruction and what is data

**Five surfaces carry kit text to the model, not one.** An earlier draft of this section claimed
`session-start.js`'s `additionalContext` was the only one, which would have told a later review to
audit one door out of five:

| Surface | Written by | Reaches the model as |
|---|---|---|
| `additionalContext` | `session-start.js` | trusted session context |
| `additionalContext` | `branch-reaper-nudge.js` | trusted session context (two integers plus a branch name from a fixed three-literal set) |
| Stop `reason` | `stop-docs-hygiene.js` | instruction text the harness replays (interpolates `docs/` paths from a filesystem walk; non-ASCII deleted, 160 cap) |
| Stop `reason` | `kit-goal-stop.js` | the same (interpolates the armed plan path; non-ASCII deleted, 120 cap) |
| stderr on a deny | `docs-write-guard.js`, `merged-pr-push-guard.js` | the deny reason the model reads (the first interpolates the payload's subagent type, the second the allowlisted branch) |

Values entering `session-start.js`'s channel, and what neutralizes each:

| Value | Origin | Treatment |
|---|---|---|
| In-progress plan filenames | repo | non-ASCII deleted, truncated to 120 chars |
| Unarchived Complete plan filenames | repo | same |
| Armed goal's plan path | `.kit/goal-state.json` in the repo | same on emission; guarded at the WRITE door by `normalizePlanArg` (control characters and cwd escape refused) and `bindSession` in `kit-goal-lib.js` |
| Adoption-pass staleness | `docs/kit-adoptions.md` | parsed to an integer; no file text is emitted |
| Pending kaizen count | `~/.claude-kaizen/notes.md` | counted only; no note text is emitted |
| Cross-project memory lines | `~/.claude-kit-memory/` records | `safeContext`: non-ASCII to a space, whitespace collapsed, capped with truncation announced |
| Decay counts | derived from the same records | integers via `safeCount` |
| Plan header's Commit Model | repo | whitelisted to three literals or `unknown` |
| Memory failure reason | store path plus filesystem error text | `safeContext` at 200 |
| The emitted `memory.js` command path | `__dirname` | refused entirely if it contains `"`, a backtick, `\`, or `$`, or if it would truncate |

Two properties of the memory block are load-bearing and worth a reviewer knowing rather than
rediscovering. Only a generated line ever crosses, never a record body. And `description` is last
on every generated line, with `[`, `]`, `@`, and `:` neutralized in every value ahead of it at both
the write door and the render door, so a record cannot forge the fields that precede its own text.
The marked-record note names records from validated filenames rather than from record text, which
is the fix for a real laundering path (a record could otherwise trigger a kit instruction by
carrying its token).

**Recorded divergence, three idioms across five sites.** Delete-and-truncate-silently at 120
(`session-start.js` three filename doors, `kit-goal-stop.js`'s plan path); delete-and-truncate-
silently at 160 (`stop-docs-hygiene.js`, two sites); and substitute-a-space-collapse-and-announce
(`session-start.js`'s `safeContext`, `memory-lib.js`'s `sanitize`, `memory-index.js`). All are safe
and none is identical to another. Unifying them would mean editing doors no effort has had reason
to touch, so the divergence is a recorded choice rather than a new oversight. A SIXTH idiom, or an
unsanitized site, is worth reporting.

**A record body passes no emission door at all.** Bodies are plain files read directly at their
absolute path, which is deliberate (the CLI must not become a gate on reading). The guards against
control characters, bidi overrides, and zero-width characters therefore sit at the CLI's write
door, and a hand edit bypasses them. `memory.js reindex` is the door that re-checks the store
afterwards, and it applies the same three guard classes `add` does (control characters, the
invisible set, and the line delimiters for values ahead of the description) to the authored
frontmatter fields as well as the body. It does NOT check permissions, and it does not re-check
anything the write door does not check either. This matters more than it looks: when the `[body revised]` marker fires, the emitted
block tells the session to read that record at the source, so the kit itself orders a body read.
Acceptable under the same-uid premise; not acceptable if bodies ever arrive from another machine,
which is the inbound half of the deferred git-sync question.

**The kit's one command-injection barrier, which most needs re-verifying on any change.**
`merged-pr-push-guard.js` fires on any Bash or PowerShell call matching `git push`, parses a branch
name out of the model's own command, and interpolates it into `execSync` strings that reach the host
API with the operator's credentials (`gh pr view <branch> ...`, `az repos pr list --source-branch
refs/heads/<branch>`). The sole barrier is an allowlist regex, `/^[A-Za-z0-9][A-Za-z0-9._\/-]*$/`,
applied before either call; the file's own comment states that interpolating any raw payload field
there reopens the injection class. So: any relaxation of that pattern, or any new interpolated
value in those commands, is a live finding rather than a defense-in-depth note. This is the one row
in this document where the premise is a regex rather than an environmental assumption.

## Every hook fails open. There is no fail-closed hook in this kit.

This is the single most important thing to know before rating a finding, and it is easy to get
backwards.

- `session-start.js` and `branch-reaper-nudge.js` wrap `main()` in a bare catch and always
  `process.exit(0)`. A hook must never break a session.
- The three PreToolUse guards (`docs-write-guard`, `pr-docs-guard`, `merged-pr-push-guard`) exit 2
  to deny, but **only on a positive determination**. Each one also ends in
  `try { main(); } catch { /* fail open */ }` and each has explicit allow-on-doubt branches: an
  unidentifiable subagent type is `null` and allowed, a `docs/` dirtiness it could not determine is
  allowed, a PR state that is not confirmed `MERGED` is allowed.
- The two Stop hooks (`stop-docs-hygiene`, `kit-goal-stop`) block by writing
  `{"decision":"block","reason":...}` to stdout and still exiting 0, never by exit 2, and any
  internal error allows the stop.
- `memory-lib.js` states and holds a never-throws contract: every function touching the filesystem
  or parsing data degrades to a null, an empty, or a typed failure.

The consequence a review should apply directly: **these guards are workflow controls, not security
controls.** They exist to catch the model's own mistakes, not to resist an adversary, and they are
trivially bypassable by design (a guard that fails open cannot be otherwise). So "this guard can be
circumvented" is not a vulnerability in this kit; it is the stated design. What *is* worth
reporting is a guard that fails **closed** by accident, because that can wedge a session, and a
guard whose deny path is silent, because exit 2 without a reason on stderr costs the model the
explanation it needs to comply.

One availability exception to know before rating a stop-hook finding: `kit-goal-stop` deliberately
omits a `stop_hook_active` loop guard, so it re-blocks every stop until an allow condition is met.
That is the completion leash working as designed, and it is bounded by the harness's consecutive-
block cap rather than by anything the kit controls. `stop-docs-hygiene` does carry the loop guard.

## Project write surfaces the kit creates

Two, both under `.kit/` per repo and both machine-local. `.kit/goal-state.json` is the goal
leash, written by `kit-goal.js` and guarded at the write door (see the trusted-channel table).
`.kit/visuals/` is the visual companion's screens, written by a session following
`brainstorming`, and it is the only kit surface whose contents can be project-confidential:
screens are mockups of the thing under design. Three properties bound it. A screen is inert by
rule, the only URL in one being its stylesheet and script and form elements barred, so opening
one makes no request. The directory is confirmed ignored before the first write, with
`.kit/.gitignore` containing `*` when the project's own ignores do not cover it, so a later
`git add -A` cannot stage a mockup. And the screens are swept at spec-write. None of the three
is enforced by a hook; all three are skill instructions, so they hold to the extent the model
follows them, which is the general caveat in the fail-open section below.

## Operator-initiated egress

One path, and it is the only place any kit skill moves project content off the machine.
`brainstorming` can flatten a screen into a single self-contained file to share, and an Artifact
is one destination for that file. It is gated three ways in `references/visual-companion.md`:
flattening and sending are separate permissions, the destination is named as off-machine when
consent is asked, and any repo that is not Daren's own is treated as client material for which no
off-machine destination is proposed. Gating by instruction rather than by mechanism, so it is a
discipline, not a control.

## What the kit does not defend against

- A hostile local user, or any attacker who already has the operator's uid. See the same-uid
  premise; the kit cannot be a boundary against the account it runs as.
- Its own instructions being ignored. The two sections above are the clearest case: a screen's
  inertness, the ignore check, and the sharing gates are prose a model follows, with no hook
  behind any of them. A pre-existing `.kit/visuals/frame.css` is also trusted unverified on the
  copy-only-when-absent rule, and CSS alone can exfiltrate through `url()` and attribute
  selectors. That sits on the trusted-workspace side of the premise above, so it is recorded
  rather than mitigated.
- A hostile repository. See the trusted-workspace premise.
- A hostile MCP server or connector. Tool results are treated as data, but the kit has no
  mechanism to validate a connector's honesty.
- Supply chain. There is no `package.json`, no lockfile, and no dependency anywhere: Node core
  only, CommonJS, in every hook. That is a deliberate property worth preserving, and it is why
  `npm audit` has no target here.
- Secrets at rest. The kit stores none. `~/.claude-kit-memory/` is 0700 with 0600 records because
  its content can describe production configuration, not because it holds credentials; an
  independent audit of the seeded set confirmed no credential or key material. Note that 0700/0600
  is a **creation-time** property, not a verified invariant: `ensureStore` sets 0700 only when it
  creates the root and `mkdirSync`'s mode is umask-masked, record writes pass 0600 explicitly, and
  nothing re-checks afterwards, `reindex` included. A store restored or synced with looser modes
  would satisfy neither and no surface would say so.

## Open

`docs/cross-project-memory.md` carries the memory tier's own trust boundary in more detail than
the summary above, and is the place to look for that surface specifically. The deferred git-sync
decision has a backlog item naming the three records whose exposure changes if the store ever
leaves this machine.
