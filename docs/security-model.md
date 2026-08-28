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

**Same uid.** Every store the kit owns (`~/.claude-kit-memory/`, `~/.claude-kaizen/`,
`~/.claude-kit-usage/`, the plan docs, and `.kit/goal-state.json` in the repo) is writable by exactly the account that can also edit `~/.claude/settings.json`
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

**Nine surfaces carry kit text to the model, not one.** An earlier draft of this section claimed
`session-start.js`'s `additionalContext` was the only one, which would have told a later review to
audit one door out of nine. The two newest are also the first two that are not
session-lifecycle: `usage-nudge.js` speaks mid-turn and `usage-barrier.js` speaks on a refusal,
so a reader who has internalized "kit text arrives at session start" is now wrong about both.

| Surface | Written by | Reaches the model as |
|---|---|---|
| `additionalContext` | `session-start.js` | trusted session context |
| `additionalContext` | `branch-reaper-nudge.js` | trusted session context (two integers plus a branch name from a fixed three-literal set) |
| `additionalContext` | `take-stock-nudge.js` | trusted session context (one integer, plus a date and 40-hex sha) |
| `additionalContext` | `usage-autocontinue-nudge.js` | trusted session context (settings-file paths only, each non-ASCII deleted at a 300 cap: the one path found to hold `autoContinueAtUsageLimit: false`, plus the list of up to four candidate paths the run built. Settings *content* never crosses, and no field of the SessionStart payload is read at all) |
| `additionalContext` | `usage-nudge.js` | trusted session context, **mid-turn** on `PostToolUse`, and the orchestrator's wherever the harness puts an agent identity on a subagent's payload, which is an inference rather than a verified fact: the hook returns before this channel on any payload carrying one, and if a subagent's payload omits those fields instead then this row's audience is wider than it says: a window label from a two-literal whitelist, two FLOORED integers, and one ISO-8601 timestamp `usage-lib.js` already validated against an anchored pattern that requires the zone. Every other character is a hardcoded literal. No string from the endpoint payload crosses, `spend.disclaimer` included, because it carries a markdown link |
| Stop `reason` | `stop-docs-hygiene.js` | instruction text the harness replays (interpolates `docs/` paths from a filesystem walk; non-ASCII deleted, 160 cap) |
| Stop `reason` | `kit-goal-stop.js` | the same (interpolates the armed plan path; non-ASCII deleted, 120 cap) |
| stderr on a deny | `docs-write-guard.js`, `pr-docs-guard.js`, `merged-pr-push-guard.js` | the deny reason the model reads (the first interpolates the payload's subagent type, the third the allowlisted branch, and `pr-docs-guard.js` interpolates nothing at all, its text being entirely hardcoded literals). `pr-docs-guard.js` was missing from this row until 2026-08-28; it hid no unsanitized site, but this row's job is to be an exhaustive door list, so an omission in it is a defect regardless of what the omitted door turned out to carry |
| `permissionDecisionReason` on a deny | `usage-barrier.js` | the deny reason the model reads. Same constrained values as the `usage-nudge.js` row, and nothing from `tool_input` crosses either, so the reason never echoes the agent type, the prompt or the model value it saw. It is the first kit deny that is JSON on stdout rather than exit 2 plus stderr, and the first whose text is a complete instruction rather than an explanation, which is why its length is budgeted (about 1300 characters and 11 lines at its longest branch, measured rather than estimated) rather than merely bounded |

`take-stock-nudge.js` answers the same question a different way, and it is worth naming because a
reviewer looking for a sixth sanitizer idiom will not find one. Nothing repo-controlled reaches its
channel at all: the only repo-derived values are a date and a sha, and both are constrained at the
**parse** door by an anchored `^(\d{4}-\d{2}-\d{2}) - ([0-9a-fA-F]{40})$` rather than scrubbed at
emission. An entry that does not match is not sanitized, it is not a marker. Everything else in the
block is a hardcoded literal plus a non-negative integer. Constrain-at-source is a stronger answer
than the delete-and-truncate doors above, not a new instance of them.

`usage-nudge.js` and `usage-barrier.js` answer it the same way, which is why the sanitizer ledger
below still counts six sites after two channels were added. Both interpolate only a floored
integer, a window label from a fixed two-literal map, and a timestamp `usage-lib.js` validated at
its own parse door. Floored rather than rounded, and the difference was a defect rather than a
detail: rounding the percent and its threshold independently let a WARN print a first line whose
numbers assert a barrier (94.6 against a barrier of 95 rendered both as 95), above text telling the
model to wind down before the barrier. Flooring cannot overstate usage. There is no scrubbing step in either hook because there is nothing arriving
that could need one: a value that fails the library's door is `null`, and `null` makes the hook
silent rather than sanitized. That is the property to re-check first if either hook ever grows a
new interpolated value, because the design has no fallback door to catch one.

One property is new and worth naming rather than leaving for a later pass to re-derive: that
block's closing sentence tells the model to run `node tools/accretion.js`, so it is the first
kit nudge whose emitted text asks the model to **execute a repo-controlled file** rather than
doing bounded work itself. The channel text stays literal, so the row above holds; the
referent does not, and it sits on the trusted-workspace premise like every other repo read.

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

**Recorded divergence, three idioms across six FILES and three cap values** (files rather than
call sites, since two of those files carry the idiom at more than one door).** Delete-and-truncate-silently at 120
(`session-start.js` three filename doors, `kit-goal-stop.js`'s plan path); delete-and-truncate-
silently at 160 (`stop-docs-hygiene.js`, two sites); delete-and-truncate-silently at 300
(`usage-autocontinue-nudge.js`'s `safePath`, one site, the wider cap because a `CLAUDE_CONFIG_DIR`
path has a plausible claim on more room than a filename); and substitute-a-space-collapse-and-announce
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

## The one credential the kit reads

`hooks/usage-lib.js` is the only component that touches a credential, and it is the newest thing
in this document, so what it does is stated rather than left to be inferred.

It reads `claudeAiOauth.accessToken` from `<CLAUDE_CONFIG_DIR>/.credentials.json`, falling back to
`~/.claude/.credentials.json` only when the variable is unset (never when the named file is
absent, because a wrong-profile read reports a different account's numbers), and sends it as a
bearer to `https://api.anthropic.com/api/oauth/usage`. The host, path and beta header are module
constants; the transport is a code-level seam for tests with no environment path to it.

Six properties, each verified against the code rather than intended:

- **Resolved per call, never held.** The token goes into one local and from there only into the
  `Authorization` header. It is never cached across calls, never returned in any result, and never
  written to any file.
- **It cannot reach an error string.** Every transport and status failure collapses to a typed
  reason from a fixed set plus an integer. The response body is discarded, and the only
  `sanitize`d error text in the module comes from filesystem failures, which carry store paths.
- **An anchored `^[\x21-\x7E]+$` test on the trimmed value is doing two jobs.** It is the
  header-injection barrier against a doctored `.credentials.json`, and it is also the door that
  refuses an empty bearer. That second job matters operationally: this machine's
  `~/.claude/.credentials.json` holds an empty `accessToken`, and the endpoint answers an empty
  bearer with 429 and a ~54 minute `retry-after` rather than 401, so sending one would look
  exactly like the endpoint throttling the kit.
- **A relative `CLAUDE_CONFIG_DIR` is refused, not resolved.** Resolving one would resolve it
  against the hook's cwd, making a repo-local `.claude/.credentials.json` the bearer token and
  scattering the store one per repo. The refusal reports `no-token`, which every consumer treats
  as allow.
- **Wire trust rests on the ambient Node and TLS environment.** `NODE_EXTRA_CA_CERTS` and
  `NODE_OPTIONS=--require` are already total-compromise levers against every hook in this kit, so
  this adds no new exposure. Recorded so a later pass does not read it as one.
- **It is live as of S3 and S4, and this is the paragraph that said to re-verify at that point.**
  `hooks.json` now wires two consumers: `usage-nudge.js` on `PostToolUse` and `usage-barrier.js`
  on `PreToolUse` for `Agent|Task`. So the credential read and the network call happen in ordinary
  sessions rather than sitting latent in the payload, and the first three properties above were
  re-verified against the as-built hooks rather than carried forward. Two consequences a reviewer
  should hold. Both HOOK consumers read `readConfig()` before anything else and return on
  `enabled: false`, which is the default, so an unarmed machine makes no network call **from a
  hook**, and the store is never created. What was actually observed on 2026-08-28 is narrower than
  a verification and is stated as observed: the installed plugin cache at HEAD carries and registers
  `usage-nudge.js`, a full session ran, and `~/.claude-kit-usage/` was still absent afterwards. An
  absent store is equally consistent with the hook firing and returning early and with the hook
  never firing at all, so it corroborates the config gate rather than proving the hook ran. The
  gate itself is checkable in the code, which is where the claim rests. The store
  does exist on this machine now, created a few minutes later by `usage.js status` run by hand,
  which is the exception below behaving exactly as documented rather than a counter-example to the
  sentence above. The
  payload carries one deliberate exception, `hooks/usage.js status`, an operator-invoked read-only
  command that answers whether or not the feature is armed, because refusing to say what the usage
  is while the control is disarmed would be useless. It is the only path here that reaches the
  credential and the network without `enabled` being true, and it is reached only by someone typing
  it. And
  `usage-nudge.js` runs on **every tool call**, so when disarmed it costs one capped read of a
  small JSON file plus a Node process start, per tool call, and when armed it additionally pays the
  reader's 6-second request deadline in-turn on the one tool call per staleness window that misses
  cache. Both were accepted rather than overlooked.
Three more properties belong to the two consumers rather than to the credential, and they are
kept in this section because they are what a reviewer arriving at the credential path next needs:

- **`usage-nudge.js`'s `PostToolUse` registration carries no matcher, and that is load-bearing
  rather than lazy.** Confirmed against the 2.1.248 binary: in the tool-call path a `PreToolUse`
  chain that yields a stop returns immediately with the deny message, before the tool is called, so
  **the `PostToolUse` chain never runs for a denied call**. At a barrier `usage-barrier.js` denies
  every `Agent` dispatch, so had the nudge been matched to `Agent` its barrier text would have been
  undeliverable at precisely the moment it matters. Narrowing that matcher to cut process spawns is
  an obvious-looking optimisation and it would silently break the wind-down channel, which is why
  the reason is recorded here and in the hook's own header rather than left to be rediscovered. It
  is also why `permissionDecisionReason` on the barrier is written to be self-sufficient: the deny
  cannot rely on the nudge arriving in the same turn.
- **Both hooks fire for tool calls made INSIDE subagents, and both had to answer for it.** This is
  the other consequence of an unmatched registration, and the first draft of the bullet above
  taught "do not narrow this" while saying nothing about whose context the text lands in.
  `docs-write-guard.js`'s header already records that plugin PreToolUse hooks fire inside subagents
  and that the payload carries the subagent identity. **That `PostToolUse` rides that same tool loop
  is an inference and not an observation**, and it is marked here because this is the third time in
  one effort that an inference about harness behavior was written into this document as settled
  fact, the previous two having been retracted after review. The live-fire evidence in
  `docs-write-guard.js` covers `PreToolUse` only. Two
  failures followed, and the second is the one worth remembering. A subagent's tool call would have
  consumed the orchestrator's one nudge, because the session id on a subagent's entries is the
  PARENT's, and because while an `Agent` call is in flight *every* tool call is the subagent's, so
  this was the normal case rather than an edge. And an orchestrator-shaped instruction ("write the
  section's Chapter", "surface `BLOCKED:` and stop the turn") would have landed on an implementer,
  which `docs-write-guard` would then have denied. The two hooks answer differently and the
  difference is the point: **`usage-nudge.js` returns early**, because a wind-down aimed at the
  orchestrator has no meaning for a subagent, while **`usage-barrier.js` still denies** and swaps
  the reason text for a shorter form that says to stop and report back rather than to write a
  Chapter or arm a resume, because the deny is about stopping spend whoever is spending. Both copy
  `docs-write-guard.js`'s `subagentType`/`isBackgroundMain` pair including its bare-`claude`
  exemption, since a user-launched background job presents that way and is the main session of its
  job. That pair now exists in three hooks: the kit has no shared hook-payload module and
  inventing one for four lines would be the worse trade, but a fourth copy is the point to stop and
  build one.
- **The kit is deliberately a SECOND poller against this endpoint, and chose that over reading a
  third party's cache.** `ccstatusline` already polls the same path every 180 seconds on this
  machine, so the kit could have read its cache instead of adding traffic of its own. It does not,
  and the reason is evidence rather than preference: that cache is field-conditional on the
  operator's widget configuration, so fields absent from the live file are absent because no
  configured widget needs them, and its private normalized schema drops the entire `limits[]` array,
  which is where `severity`, `is_active` and the Fable scope live. Reading it would have cost
  precisely the signals worth having, and coupled the kit to a third party's undocumented internal
  shape. The kit polls at a 600-second floor instead, tightening to 120 near a barrier, which is
  deliberate under-sampling: a spend control does not need three-minute resolution.
- **The kit deliberately has no request coalescing here, and the cost is worth stating in its
  sharpest form.** Several concurrent `Agent` dispatches on a cold cache each issue their own
  request, and a 429 then locks the reader for its retry-after, which on this endpoint has been
  observed at roughly 54 minutes. So the spend control can go dark exactly when spend is highest.
  This is an accepted cost rather than an oversight: coalescing was built earlier in this effort and
  removed after it was reproduced bricking the store two separate ways, and every variant of it
  makes the loser either wait or go without. Both consumers fail open when the reader is locked, so
  the failure is a silent absence of control, never a wedge.

`~/.claude-kit-usage/` is its store, and it has two levels. A per-profile subdirectory keyed by
the resolved credentials directory holds four files: a cache of the normalized response, a
backoff lock, an append-only reading log bounded at 5000 lines, and `nudged.log`, the
append-only marker `usage-nudge.js` dedupes against. The reading log accumulates this account's
usage percentages and overage spend over time, which is why it is 0600 and why the store is named
in the same-uid store list, but it holds no credential and no third-party data. `nudged.log` holds
session ids, which is the one place in this effort a harness-supplied string is persisted, and it
is persisted as a JSON **value** rather than as a path component on purpose: an earlier design put
a session id in a filename and needed a strict character-class door to make that safe, so the
shape that needs the door was removed rather than the door re-added. Nothing reads either log back
to the model, and `readings.log` is the one to watch: it is the file a later burn-rate
projection would want to consume, which makes that effort both the natural consumer of this data
and the one positioned to break the invariant without noticing. The shared parent
holds one more file, `config.json`, carrying the operator's thresholds. That one sits outside the
profile subdirectory deliberately, because thresholds are a policy preference rather than an
account fact, and it is the only file in this store **no kit code ever writes**: the operator
hand-authors it, and the kit reads it through the same capped reader it uses for everything else.

## Every hook fails open. There is no fail-closed hook in this kit.

This is the single most important thing to know before rating a finding, and it is easy to get
backwards.

- All four SessionStart hooks (`session-start.js`, `branch-reaper-nudge.js`,
  `take-stock-nudge.js`, `usage-autocontinue-nudge.js`) wrap `main()` in a bare catch and then let the process end on its own
  with status 0. None of them calls `process.exit()`; that idiom was swept out of the payload and
  a re-added `process.exit(0)` is a change worth questioning rather than the invariant. A hook must
  never break a session. `take-stock-nudge.js` adds a second bound of the same kind, a 6-second
  budget for its whole run on top of a 5-second timeout per git call, and a failed measurement is
  reported as a failure rather than rounded down to a smaller number.
- The four PreToolUse guards deny **only on a positive determination**, and they now span two
  mechanisms. `docs-write-guard`, `pr-docs-guard` and `merged-pr-push-guard` exit 2 with the reason
  on stderr. `usage-barrier` writes `permissionDecision: "deny"` as JSON on stdout and exits 0,
  because its reason has to be a complete instruction for an unattended run rather than an error
  line. Each of the four ends in
  `try { main(); } catch { /* fail open */ }` and each has explicit allow-on-doubt branches: an
  unidentifiable subagent type is `null` and allowed, a `docs/` dirtiness it could not determine is
  allowed, a PR state that is not confirmed `MERGED` is allowed.
- `usage-barrier` is the first kit guard that denies on a **network-derived** signal, so its
  allow-on-doubt set is wider than any other guard's and is worth reading as the interesting case
  rather than as more of the same. It allows on a stale reading, on every one of the reader's eight
  failure reasons including `expired`, on an absent or disabled config, on a window whose percent
  the endpoint did not report, and on any tool that is not `Agent` or `Task`. It denies only from a
  positive determination on data inside the staleness budget the evaluator handed it, and it
  re-reads once rather than deciding on data older than the budget it was given. A wrong deny here
  wedges an unattended run with nobody present to clear it, which is why every branch points the
  allowing way.
- `usage-nudge` is the kit's first `PostToolUse` hook and its first mid-turn channel. It blocks
  nothing: it can only add context, and any internal error leaves it silent.
- **Two hooks now swallow through a promise rather than a bare catch**, which matters only because
  the paragraph above asserts the idiom rather than the outcome. `usage-nudge.js` and
  `usage-barrier.js` both have an `async main()`, so their guard is a catch on the returned promise
  instead of `try { main(); } catch {}`. The effect is the same and slightly wider: a synchronous
  throw inside an `async` function arrives as a rejection, so the catch still covers the whole of
  `main`, and it additionally covers a rejection from the `await`ed reader. What a reviewer should
  check on either file is that nothing runs outside that promise chain, since a throw there would
  escape the guard the sync form cannot leak past.
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
explanation it needs to comply. `usage-barrier.js` denies through JSON rather than exit 2, so the
equivalent defect there is an empty or a **truncated** `permissionDecisionReason`. No cap on that
field has been established by this kit, so the risk there is not a known limit but an unknown one: the stop instruction sits at the END of the reason, so whatever does eventually
truncate it costs exactly the part the model needs, and costs it silently. A change that lengthens
that text is therefore worth the same scrutiny as one that removes it.

**A retraction worth reading, because it is the kind of error this document exists to prevent.**
An earlier version of this section stated that the harness caps `permissionDecisionReason` at 2000
characters and 20 lines, "read off the 2.1.248 binary". Those constants are real and do sit in a
hook-output normalizer in that binary, but the same normalizer also DROPS
`permissionDecision: "allow"`, `"defer"` and `updatedInput` for PreToolUse, which local command
hooks demonstrably use, so it governs a narrower path than this kit's, most plausibly hooks
forwarded from another machine. On the local command-hook path the handler for `additionalContext`
is a persist-to-disk-above-threshold helper rather than a line truncator, and no line cap on
`permissionDecisionReason` was found at all. One sanitizer's constants were generalised into a
harness-wide guarantee and then written here as verified fact. The practical guidance did not
change and the as-built text is far inside any plausible limit, so nothing was ever at risk; what
was wrong was the confidence, in the one document a reviewer is told to read first.

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

## Operator-initiated egress that moves project content

One path, and it is the only place any kit skill moves project content off the machine.
`brainstorming` can flatten a screen into a single self-contained file to share, and an Artifact
is one destination for that file. It is gated three ways in `references/visual-companion.md`:
flattening and sending are separate permissions, the destination is named as off-machine when
consent is asked, and any repo that is not the operator's own is treated as client material for which no
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
- Secrets at rest. The kit stores none, and that still holds literally now that one component
  reads a credential: `usage-lib.js` sends the token and persists none of it (see the credential
  section above, which also names the store it does write). `~/.claude-kit-memory/` is 0700 with 0600 records because
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
