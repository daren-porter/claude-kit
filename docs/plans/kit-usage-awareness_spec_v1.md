# Kit usage awareness

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: S1 and S4, finishing reviews
Created: 2026-08-27

## Goal

When an unattended kit run approaches a plan usage boundary the operator cares about, the
session winds down at a section boundary, stops, tells the operator, and on the five-hour
window arms its own resume for the reset instant. What exists at the end is a kit-owned
reader of Anthropic's OAuth usage endpoint, a threshold policy the operator configures, a
mid-turn wind-down channel, a hard barrier on subagent dispatch, a Fable routing ratchet
that caps model choice at Opus rather than pausing anything, and a documented credential
path. It matters because on this Team seat with overage enabled nothing 429s at
the session limit: requests are served and the account spends, so the harness's native
`autoContinueAtUsageLimit` never fires and there is no existing control at any threshold.

## Approach

### What this is not

Not a retry control. `docs/kit-adoptions.md` candidate 1 of the 2026-08-26 pass establishes
that the harness already ships pause-and-resume on a 429 and that the 429 never arrives on
this seat. This is a spend control at a threshold we choose, which is the thing that entry
says nothing in its window provides.

Not the upstream kit's Stop-failure recovery machinery. Candidate 2 records that the
upstream author built exactly that and deleted it in the same window as dormant. The
lesson taken here is the shape of the mistake rather than the code: that effort's
end-to-end path never ran once, because it was built before the signal it needed existed.
This spec ships a reader and a consumer of the reader together for that reason.

Not a kit-owned statusline. Candidate 21 stays rejected on composition grounds.

### The signal, established by probe on 2026-08-27

`GET https://api.anthropic.com/api/oauth/usage`, `Authorization: Bearer <token>`,
`anthropic-beta: oauth-2025-04-20`. Called three times from a plain Node script on this
machine: 200 in 290ms with the active profile's token, 401 `authentication_error` with a
well-formed token expired 572 hours, and 429 with `retry-after: 3242` with an empty bearer.
The response carries a `limits[]` array whose entries hold `kind`
(`session` | `weekly_all` | `weekly_scoped`), `percent`, `severity`, `resets_at`, `scope`
and `is_active`, plus a `spend` object holding
`used: {amount_minor, currency, exponent}`.

Six facts from that probe shape the design, and each one corrects or extends the ledger:

- **The overage unit is stated in the payload.** `spend.used.exponent: 2` and
  `extra_usage.decimal_places: 2` both say it, so 8321 is $83.21. The ledger's caution that
  the unit is unstated is retired by S6. `ccstatusline` reads neither field; it divides
  `extra_usage.used_credits` by 100 and reaches the same number by a different route.
- **No overage cap is exposed to this seat.** `spend.limit` and
  `extra_usage.monthly_limit` are both null, with `can_toggle: false`,
  `can_purchase_credits: false` and `member_dashboard_available: false`. This reads as a
  managed seat where the org holds the policy, so a percent-of-budget threshold has no
  denominator and absolute dollars are the only spend figure available. The claim is a
  property of this token's view and rots if the org changes the seat.
- **Three config profiles exist on this machine and only one is live.**
  `CLAUDE_CONFIG_DIR=~/.claude-work` (team, `default_claude_max_5x`) is active,
  `~/.claude-personal` holds a token expired 572 hours, and
  `~/.claude/.credentials.json` holds an **empty** `accessToken`. Usage is per-account, so
  a reader on the wrong profile reports a different account's numbers.
- **An empty bearer returns 429, not 401.** So a reader that resolves the wrong profile
  does not fail loudly; it self-inflicts 54 minutes of backoff that looks exactly like the
  endpoint rate-limiting the kit. An empty token must therefore never be sent.
- **The payload is volatile.** The top level currently carries nine unreleased codename
  buckets (`tangelo`, `nimbus_quill`, `iguana_necktie`, `cinder_cove`, `amber_ladder`,
  `juniper_tide`, `omelette_promotional`, `seven_day_cowork`, `seven_day_omelette`) plus
  null `seven_day_opus` and `seven_day_sonnet` slots. Parsing is by `limits[].kind`, never
  by top-level key.
- **`ccstatusline`'s cache is not a usable source.** It is field-conditional on the
  operator's widget configuration (`extraUsageLimit` and `extraUsageUtilization` are absent
  from the live file because no configured widget requires them) and its private
  normalized schema drops the entire `limits[]` array, so `severity`, `is_active` and the
  Fable scope never reach disk. Reading it costs precisely the signals worth having.

### Three triggers, two leading and one generic

`limits[].kind=session` percent and `limits[].kind=weekly_all` percent are **leading**
indicators: they let a run stop before the first overage dollar. `spend.used.amount_minor`
rising between two reads is a **lagging** generic indicator: it does not care which window
caused the spend, which means it catches overage from a window this spec never modeled.
That is what permits the two percentages to be roughly tuned rather than exactly right.

The generic trigger has one edge case. Whether `used_credits` is a monthly or an all-time
counter is not established, and a month rollover would present as a large negative delta.
A negative delta means no overage, never an error.

### Why the thresholds sit below 100 rather than at it

Waiting for 100% would defeat the feature, for three reasons that compound. On this seat
100% is not a barrier at all, since overage serves the request, so triggering there means
triggering after the first overage dollar rather than before it. Winding down is itself
real work (finishing the section in flight, staging it, writing its Chapter) and that work
consumes window, so a wind-down begun at 100% is paid for entirely in overage. And a
section boundary is not at the kit's disposal, so the gap between warn and barrier has to
be wide enough to reach one.

How wide that is has never been measured against this kit's own work, so the defaults are
deliberately conservative and the observation data is what tightens them: session
**warn 80 / barrier 95**, weekly-all **warn 85 / barrier 95**. A better trigger than a fixed
percentage exists in principle, projecting time-to-barrier from the burn rate between
consecutive readings, and it is out of scope here. S1 records what it would need.

### The harness's own controls, and why they do not collide

`autoContinueAtUsageLimit` already does pause-and-resume, but it hangs off a **rejection**, so on
an overage-enabled seat nothing is rejected and it never fires. It remains the right mechanism for
a seat where overage is not enabled or is exhausted, which is a real configuration this kit may run
under.

Two claims in this spec's first draft were wrong, both corrected on 2026-08-27 against the 2.1.247
binary after the blind reviewer flagged the first:

- **Turning it off does not stop the session pausing.** The setting's own schema description reads
  "When off, the limit dialog offers the wait as a choice instead", so off removes the *automatic*
  resume and leaves the pause and the wait as a manual choice. Anything the kit emits must say that
  and not more.
- **"Defaults on" is true in effect but not by a literal default, and the `/config` toggle does not
  write a settings file.** The effective value is the settings value where one is defined, and
  otherwise the key being absent from the harness's own `storageV5`. The toggle is `consentGated`
  and persists through an async writer rather than the synchronous local-settings writer its
  neighbouring toggle uses. So a settings-file value does win when present, which is what makes S7
  worth shipping, but the ordinary opt-out never lands in any file S7 reads. S7's reach is
  therefore narrower than this spec first claimed, and its emitted text has to bound itself
  honestly rather than implying it can see the setting.

The two are complementary rather than competing: the kit's barrier fires earlier and at a clean
boundary, so it pre-empts the native flow rather than fighting it. What the kit owes here is a
posture check rather than a mechanism, which is S7.

The harness also carries a wind-down at 95% of the window. On the operator's report it has
never been seen on this seat, which is consistent with it being rejection-gated like
auto-continue. That is an observation and not a proof of the mechanism, and it is recorded
that way deliberately: `kit-adoptions.md` candidate 1 withdrew an absence-of-evidence
argument about this exact flow once already, and the operator's own report is what it
settled on as valid. If the native wind-down ever does appear at 95%, the kit's barrier
must drop below it so the kit's instruction lands first rather than competing.

### The Fable ratchet, which is a different response to a third window

The Fable-scoped weekly window gets a response unlike the other two: not a pause but a
**routing cap**. At or above 85%, the kit stops sending work to Fable and caps at the
session model until that window resets. Nothing stops; the effort continues at Opus.

This is cheap because the kit already has the slot for it. `executing-work` already says to
"downgrade the dispatch to the session model and flag the downgrade in the Chapter" when
Fable headroom runs out, and `finishing-work` carries the metered-Fable authorization rule.
Both have always run on the operator's estimate. What is new is the number, which is the
consumer `kit-adoptions.md` candidate 1 predicted would be the cheapest and most useful.

**The ratchet gates dispatch and never interrupts work in flight.** An `implementer-fable`
already running is left to finish and stage its work. Killing it would throw away everything
it had already spent, strand a half-written file mid-section, and reproduce the
strand-a-section failure the barrier design avoids, while refusing the next dispatch
captures nearly all the saving at no cost.

Its mechanical half lives inside S4's hook rather than in a hook of its own, because both
are the same event and matcher (`PreToolUse` on `Agent`) differing only in predicate and
scope. One file means one cache read per tool call and an explicit precedence rather than
two guards racing.

One limit is structural and belongs in the shipped prose. The hook can only see an
**explicit** `model: "fable"` override, which is what a below-fable session carries. A
Fable-led session inherits Fable with no override at all, so its dispatches are invisible to
the mechanical half and the prose rule is the only control there.

### Why the reader is a second poller

`ccstatusline` already polls this endpoint every 180s. The kit adds its own poll anyway,
at a 600s floor, because coupling to a third party's private normalized schema is the worse
trade (see the sixth fact above) and a spend control does not need three-minute
resolution. The floor tightens to 120s when any window is within ten points of its
barrier, so high burn is not discovered ten minutes late.

### What "pause" can actually mean here

The kit has no lever that stops a session. It has three that matter, all verified against
the 2.1.247 binary's own zod schemas rather than assumed:

- **`additionalContext` is accepted on `PostToolUse`, `SubagentStop`, `PreToolUse`, `Stop`
  and others.** The harness itself emits `{hookEventName:"PostToolUse", additionalContext}`
  for its team-memory notices, so this is an exercised path. It is the kit's only mid-turn
  channel to the model, and it is what makes a wind-down possible at all.
- **`permissionDecision` is `["allow","deny","ask","defer"]` on `PreToolUse`.** Unattended
  is the chosen case, so the barrier denies rather than asks: nobody is present to answer a
  prompt and an `ask` would stall the run indefinitely.
- **`kit-goal-stop.js` already releases on a `BLOCKED:` lead** (the predicate is at
  `lastAssistantLeadsWithBlocked`, and the block reason at line 399 instructs exactly that).
  A usage barrier is a true blocker, so the wind-down text instructs a `BLOCKED:` lead and
  the leash releases through its existing tested path. No change to that hook.

Two honest limits follow, and both belong in the shipped prose rather than only here.
Denying `Agent` stops new expensive dispatch but the main thread keeps spending, so what
actually ends the run is the `BLOCKED:` instruction, which is prose the model follows. The
kit therefore permits and encourages a stop; it cannot force one. And this spec will not
try to force one by denying `Write`, `Edit` or `Bash`, which would wedge the session and
break the fail-open discipline `docs/security-model.md` documents.

### Resume splits by horizon

The session window resets in under five hours, so a paused session arms a one-shot
`CronCreate` at `resets_at`. Cron fires only while the REPL is idle, which is precisely the
paused state, so the mechanism fits. The weekly window resets days out, so there is no
auto-resume: `PushNotification` and stop, because auto-resuming three days later
unattended is not a pause. Both mechanisms are session-scoped model tools rather than
hooks, so the kit instructs rather than arms them, and a `CronCreate` job is in-memory and
dies with the session.

### Two safety defaults

The feature is **off** unless the operator's config says otherwise: a component that can
deny a dispatch does not arm itself at install. And every deny requires a positive
determination on fresh data, so stale, unreadable, expired-token and disabled states all
allow. That keeps the kit's stated invariant that no hook fails closed.

## Sections of Work

### 1. The usage reader

Ships `plugins/claude-kit/hooks/usage-lib.js` with a never-throws contract in the shape of
`memory-lib.js`: every function degrades to a typed failure rather than raising.

Exports a read returning either a success carrying per-window `{percent, severity,
resetsAt}` keyed `session` / `weeklyAll` / `fableWeekly`, plus `spend` as
`{amountMinor, exponent, currency}` and a `fetchedAt`, or a typed failure whose reason is
one of `no-token`, `expired`, `rate-limited`, `timeout`, `parse`, `locked`, `no-store` or
`bad-call`.

`no-store` was added in S1's third review round: a store that cannot be written cannot hold the
backoff the module is about to decide on, so fetching anyway means every failure refetches
immediately, which is exactly what earns a 429 carrying a ~54 minute `retry-after`. Refusing the
request typed is the only way to honor a decision the module cannot persist.

`bad-call` was added during S1 rather than at plan time, and it is kept: it reports
kit-internal misuse (an unusable `maxAgeSeconds` or clock) and every other reason is a
statement about the endpoint or the credential, so folding a caller bug into one of them
would misreport. Consumers branch on `ok` first, so the addition is additive.

Token resolution reads `$CLAUDE_CONFIG_DIR/.credentials.json`, falling back to
`~/.claude/.credentials.json`, at every call. The token is never cached, never logged and
never written to any file.

**The store is keyed per config profile, not per machine.** This corrects the plan: the first
draft named a single `~/.claude-kit-usage/` root while also requiring per-profile token
resolution, and the blind reviewer reproduced what that combination does. A stale token in one
profile writes a backoff lock that refuses a *valid* token in another, which defeats this
section's own stated invariant that a stale profile cannot poison backoff; and the cache serves one
account's percentages to another, while the reading log interleaves several accounts with no way to
separate them afterwards. So every store file lives under a subdirectory keyed by the **resolved
credentials directory**, legible rather than opaque, and each reading-log line carries the same
discriminator.

**A relative `CLAUDE_CONFIG_DIR` is refused rather than resolved**, and reported as `no-token`.
Resolving one would resolve it against the hook's cwd, which is the project directory, so a single
configured value would mean a different account per repo and a `.claude/.credentials.json` arriving
in a clone would become the Bearer token. Refusing costs nothing a consumer notices, since
`no-token` already allows everywhere.

The key is the directory path and never the token or a hash of it, which keeps "no token material
reaches any file" absolutely true. The residual limit, accepted and recorded: re-authenticating the
same config directory as a different account mixes that directory's readings until the window
rolls.

Cache at `<store>/usage.json`, directory 0700 and file 0600, with a
`usage.lock` carrying a `blockedUntil`, a `reason`, and for an auth-class lock the credential
file's mtime **as of the lock**. The `locked` check honors the reason class, so an auth-class lock
stops gating once the credential has been rewritten since it was taken. Comparing the credential
against the lock file's own mtime instead would be defeated permanently by a credentials file
stamped ahead of the wall clock, so the question asked is "did this file change since the lock"
rather than "is this file newer than that one".

**Request coalescing was built and removed, and the removal is the decision worth recording.** A
second review round reproduced two ways an in-flight lease bricks the store permanently: an
uncapped horizon that is never reaped, and an acquire that fails closed on a write error where its
own contract demands fail-open. Coalescing inherently requires the loser to wait or to go without,
so every variant adds a failure mode, and the mechanism built to avoid one rate-limit response
introduced two ways to stop reading entirely. Without it a burst of concurrent session starts costs
one request each, once per staleness window, against an endpoint a third-party tool already polls
every 180s. The token resolution now also precedes the lock check, so a missing credential reports
`no-token` rather than being masked as a transient `locked` that never self-clears. Backoff is per failure class: 401 marks `expired`
and goes quiet for 900s without writing a rate-limit lock, 429 honors `retry-after` and
defaults to 300s, timeout and transport errors take 60s.

Acceptance criteria:
- An empty or missing `accessToken` returns `no-token` and makes **no** network call.
- An expired token returns `expired` and writes no rate-limit lock, so a stale profile
  cannot poison backoff.
- A payload carrying unknown top-level keys and no `session` entry in `limits[]` parses
  without throwing and reports the session window as unknown, never as zero.
- `spend` is reported as minor units plus exponent and is never pre-divided.
- The cache file is 0600 and contains no token material.
- A `limits[]` entry of kind `weekly_scoped` is attributed to `fableWeekly` only when
  `scope.model.display_name` is `Fable`.
- Every successful read appends one line to a bounded, self-truncating observation log at
  `~/.claude-kit-usage/readings.log`, carrying the timestamp, each window's percent and
  `severity`, `is_active`, and `spend.amountMinor`. This is what answers the three
  observation-owned Open Questions and what a later burn-rate projection would need. It
  holds no token material and is never emitted to the model.

Execution mode: delegate-fable.
Tests: the `no-token` / `expired` / `rate-limited` discrimination, since conflating them
either sends an empty bearer or poisons backoff for an hour; tolerance of a payload with
unknown keys and missing kinds, since the observed payload already carries nine buckets
that did not exist when the endpoint was documented; and that no token reaches the cache
or any emitted string, which is the worst outcome available in this changeset. Watch the
first of these red before fixing.

### 2. Threshold policy and evaluation

Adds threshold evaluation to `usage-lib.js`, reading
`~/.claude-kit-usage/config.json` with a `warn` and `barrier` percent for each of the
session and weekly-all windows, a single `ratchet` percent for the Fable weekly window, an
absolute overage-dollar delta for the generic trigger, and an `enabled` flag.

Evaluation returns a verdict naming the state (`clear`, `warn` or `barrier`), the window
that produced it, its `resets_at` and its percent. Precedence is fixed: any barrier
outranks any warn, and a weekly barrier outranks a session barrier because its horizon is
longer and its handling differs. A window whose percent is unknown never produces a
barrier.

The generic spend-delta trigger compares the current `spend.amountMinor` against a
per-session baseline, which is the **first successful read in this session**, persisted
under `~/.claude-kit-usage/baseline-<session-id>.json`. No SessionStart hook is involved:
whichever of the two consumer hooks reads first establishes the baseline, and until one
has, the generic trigger reports `clear` rather than a failure. A negative delta is read as
no overage.

The Fable window is evaluated separately and never feeds the `clear`/`warn`/`barrier`
state, because its response is a routing cap rather than a pause. Evaluation returns it as
its own boolean plus the percent and reset instant, and an unknown Fable percent never trips
it.

Evaluation also computes the staleness budget the callers pass to the reader: 600s at
`clear`, 120s when any window is within ten points of its barrier.

Acceptance criteria:
- An absent config file, an unparseable one, or `enabled: false` all return `clear`.
- The precedence table holds for every combination of two windows and three states.
- An unknown window percent cannot produce `barrier` at any threshold.
- A negative spend delta returns `clear` for that trigger rather than a failure.
- The staleness budget tightens to 120s at ten points below a barrier and not before.
- Both session-keyed files, the per-session baseline here and S3's dedupe marker, are
  reaped when older than the longest window this spec tracks (eight days). Nothing else in
  the effort owns cleanup, so without this the store grows one file per session forever.

Execution mode: delegate-capable.
Tests: the precedence table, since a weekly barrier mishandled as a session barrier would
arm a resume for a window three days out; and the disabled and absent-config paths, since
they are what keep the feature off by default.

### 3. The wind-down channel

Ships `plugins/claude-kit/hooks/usage-nudge.js`, registered on `PostToolUse` and
`SubagentStop`, emitting `additionalContext` through `hookSpecificOutput`.

At `warn` it emits once per window per session, deduped by a marker keyed on session id,
window and reset instant, so a new window re-arms. The text names the window, its percent
and its reset time, and instructs the model to finish the section in flight, start no new
subagents, then surface a `BLOCKED:` line and stop. At `barrier` the text additionally
carries the resume instruction for the window's horizon.

`SubagentStop` is registered alongside `PostToolUse` specifically because it is a natural
section boundary: a wind-down that lands mid-section strands half-built work.

Acceptance criteria:
- Emits nothing at `clear`, nothing when the signal is stale or unavailable, and nothing
  when the config is absent or disabled.
- Emits once per window per session, and re-emits after the reset instant changes.
- Any internal error exits 0 with no output and never blocks.
- Every value interpolated into the emitted text is an integer, a whitelisted window
  literal, or a parse-validated ISO-8601 timestamp; everything else in it is a hardcoded
  literal. No free text from the payload crosses, `spend.disclaimer` included, since it
  carries a markdown link.

Execution mode: delegate-capable.
Tests: the once-per-window dedupe and its re-arm on a new reset instant, since a nudge on
every tool call would flood a long run; and the emission door, since it is the sixth
trusted channel in `docs/security-model.md`'s table and the first carrying network-derived
values.

### 4. The barrier

Ships `plugins/claude-kit/hooks/usage-barrier.js`, registered `PreToolUse` with matcher
`Agent|Task`, returning `permissionDecision: "deny"` with a reason naming the window, its
percent and its reset instant, plus `additionalContext` carrying the `BLOCKED:` and resume
instruction.

It denies only on a positive determination from data no older than the evaluated staleness
budget. Stale data, any reader failure, an absent or disabled config, and an unknown window
percent all allow. It denies nothing outside `Agent` and `Task` at any threshold.

**The same hook carries the Fable ratchet**, as a second and narrower predicate evaluated
after the barrier. Precedence: a session-or-weekly `barrier` denies every `Agent` dispatch;
failing that, a Fable weekly percent at or above the ratchet denies only a dispatch whose
`tool_input.model` is `fable`, with a reason naming the percent, the reset instant and the
instruction to re-dispatch without the override. A dispatch carrying no fable override is
untouched by the ratchet.

Denying is deliberate rather than rewriting the call through `updatedInput`: a silent
downgrade would leave the orchestrator believing it got Fable and writing a Chapter saying
so. The hook cannot see an inherited Fable model on a Fable-led session, only an explicit
override, and its reason text says so rather than implying full coverage.

Acceptance criteria:
- Denies only at `barrier` on data inside the staleness budget. Watch this red first.
- The ratchet denies a dispatch with `model: "fable"` at or above the Fable threshold, and
  allows the identical dispatch without that override. Watch the first of these red.
- A session-or-weekly barrier outranks the ratchet, so at a barrier every `Agent` dispatch
  is denied regardless of model.
- The ratchet allows everything on stale data, on any reader failure, and when the Fable
  window's percent is unknown.
- Allows on stale data, on every reader failure reason including `expired`, on absent
  config and on `enabled: false`.
- The deny reason names the window and the reset instant, so the model can act on it
  without another read.
- No tool other than `Agent` or `Task` is ever denied.

Execution mode: delegate-fable.
Tests: every allow-on-doubt branch, because this is the only hook in the kit that denies on
a network-derived signal and a wrong deny wedges an unattended run with no operator present
to clear it; and that the deny fires at all, watched red, since a barrier that silently
never fires is the failure mode candidate 2 records.

### 5. Resume and the shipped prose

Adds the operator-facing and model-facing prose: how a session responds at a warn and at a
barrier, how it arms a one-shot `CronCreate` at `resets_at` for a session-window barrier,
why a weekly-window barrier notifies and stops instead, and the two honest limits (the kit
cannot force a stop, and a `CronCreate` job dies with the session).

This is behavior-shaping prose, so `writing-skills` gates it and its bar applies.

Acceptance criteria:
- A session reaching a session-window barrier has an unambiguous instruction sequence:
  checkpoint, notify, arm the resume, surface `BLOCKED:`, stop.
- A session reaching a weekly-window barrier is told explicitly not to arm a resume.
- Both honest limits appear in the shipped prose, not only in this spec.
- The prose passes the `writing-skills` gate for a behavior-shaping change.

Execution mode: main.

### 6. Security model, ledger corrections, docs

Ships three document updates.

`docs/security-model.md` gains a section covering the credential path (which file, resolved
when, never cached or logged, sent only to `api.anthropic.com`), the new trusted channel and
its constrain-at-source emission door, the deliberate second-poller decision, and the
429-on-empty-bearer trap as the reason an empty token is never sent. It also records that
`usage-barrier.js` denies on a network-derived signal, which no prior guard does, and that
it still fails open.

It also records one invariant rather than leaving it as an S1 acceptance line: nothing
emits `readings.log` to the model. It holds every window's history and exists for the
operator and for a later burn-rate effort, which is precisely the effort that would consume
it and could break the invariant without noticing. S6 is what the next reviewer reads, so
the constraint belongs there.

`docs/kit-adoptions.md` corrects candidate 1 of the 2026-08-26 pass. The overage unit is
stated in the payload. The endpoint answers a caller other than `ccstatusline` on this
machine, in 290ms, which narrows "never been called from a kit hook" without retiring it:
the probe was a plain Node script, and hook context (the timeout budget, fail-open
behavior, the harness's process environment) is untested until S1 runs live behind a
`/plugin update`. The correction claims only what the probe established. Also: `limits[]`,
`severity` and `is_active` exist and are the parse surface; the three-profile stakes; and
the 401-versus-429 discrimination. The `Last pass:` line is not touched.

`docs/README.md` registers this plan.

Audience: the `security-reviewer` agent, which holds this repository and reads
`security-model.md` first; and a future kit session with no memory of this effort, which
holds the repository and reads the ledger entry to decide whether the question is settled.
Must answer: for the reviewer, which file the token comes from, whether it is ever
persisted or emitted, what crosses the new trusted channel, and whether the new guard fails
open. For the future session, whether the endpoint works, what its failure modes are, which
claims in candidate 1 have been superseded and which still stand.
Fact base: `plugins/claude-kit/hooks/usage-lib.js`, `usage-nudge.js`, `usage-barrier.js`
as built; `docs/security-model.md`'s existing trusted-channel table and fail-open section;
`docs/kit-adoptions.md` candidates 1, 2 and 21 of the 2026-08-26 pass.
Style authority: none.
Disclosure: no persona sits outside the operator, so nothing is withheld. The absolute
constraint is unrelated to audience: no token, token fragment or token hash appears in any
document, and no organization or workspace id from the probe response.

Execution mode: main.

### 7. The `autoContinueAtUsageLimit` posture check

The native setting is the right mechanism for a seat where overage is not enabled or is
exhausted, and it defaults on, so the only failure worth catching is someone having turned
it off. This section adds that check and nothing else: no kit setting shadows it, and the
kit never writes it.

Where the check lives is the implementer's call between the existing SessionStart nudge and
the usage hooks, decided in contact with the code, on one constraint: it costs no network
call and no measurable latency.

**The scope of the check is bounded deliberately, and the bound is not a shortcut.** The
harness resolves an effective setting by merging five tiers of private minified code, and
`kit-adoptions.md` candidate 1 of the 2026-08-07 pass records the upstream abandoning
harness detection outright for a sibling setting after two review rounds each found another
layer. That was auto-memory rather than this key, so it is precedent and not proof, but the
mechanism is the same and this section does not re-fight it. The check therefore reads only
the four files the kit can name (`~/.claude/settings.json`,
`$CLAUDE_CONFIG_DIR/settings.json`, and the `settings.local.json` beside each) and reports
what it found in those. A value set anywhere else is invisible to it, and the emitted line
says so rather than implying full coverage.

Acceptance criteria:
- When the setting is explicitly `false` in one of those files, one line reaches the operator
  naming which file holds it and stating the consequence **accurately**: that a seat whose overage
  is absent or exhausted loses the automatic resume, not the pause.
- The emitted text names the files the run actually consulted rather than a fixed count, since with
  `CLAUDE_CONFIG_DIR` unset only two are read.
- The emitted text says the `/config` toggle persists outside these files, so an operator cannot
  read the nudge as a claim about the session's effective setting.
- When it is absent or `true`, nothing is emitted. The default-on case is silent.
- The kit never writes, patches or suggests patching a settings file itself.
- A settings file that cannot be read or parsed emits nothing rather than a warning.

Execution mode: delegate-mechanical.
Tests: the silence cases, since a nudge that fires on the default-on configuration would
fire in every session forever; and that an unreadable settings file stays silent.

### 8. The Fable ratchet's prose half

Adds the rule that gives the kit's existing Fable-downgrade path a number, in
`plugins/claude-kit/skills/executing-work/SKILL.md` and
`plugins/claude-kit/skills/finishing-work/SKILL.md`.

Before any dispatch carrying a fable model override (a `delegate-fable` section, an
escalation into fable, or finishing-work's reviews), the orchestrator reads the Fable weekly
percent. At or above the ratchet it dispatches at the session model instead and records the
downgrade in the Chapter, naming the percent and the reset instant. Work already in flight is
left alone. The rule states the structural limit: on a Fable-led session the mechanical
backstop in S4 sees nothing, so this prose is the only control.

This is behavior-shaping prose in two of the kit's load-bearing skills, so `writing-skills`
gates it and its bar applies. It also governs this very effort, whose own S1 and S4 are
`delegate-fable`.

Acceptance criteria:
- Both skills name the ratchet at the point where each already decides a fable dispatch,
  rather than as a new standalone section bolted on.
- The rule says explicitly that in-flight work is not interrupted.
- The rule says explicitly that a Fable-led session's inherited model is invisible to the
  hook, so the prose is the only control there.
- The Chapter-recording obligation names both the percent and the reset instant, so a later
  session reading a downgraded Chapter can tell whether the window has since reset.
- The prose passes the `writing-skills` gate for a behavior-shaping change.

Execution mode: main.

## Out of Scope

- A kit-owned statusline, and any replacement of `ccstatusline`. Candidate 21 stays rejected.
- Reading `ccstatusline`'s cache as a data source.
- Pausing or stopping on the Fable-scoped weekly window. That window ratchets model routing
  down to the session model (S4 and S8) and never pauses an effort, because running at Opus
  is a working state rather than a barrier.
- Interrupting, killing or reverting work already in flight, on any window.
- A threshold on **cumulative** overage spend. No cap is exposed to this seat, so there is
  no denominator; only the per-session delta described in S2 is used.
- Any attempt to refresh the OAuth token. The kit reads a credential it does not own.
- Denying any tool other than `Agent` and `Task`.
- Acting on `severity`. Every read records it so a later effort can replace hand-picked
  percentages, but nothing in this spec branches on it.
- Burn-rate projection. Triggering on projected time-to-barrier rather than on a fixed
  percentage is the better design and needs data that does not exist yet. S1's reading log
  is the groundwork; the projection itself is a later effort.
- Writing, patching or shadowing `autoContinueAtUsageLimit`. S7 reads it and reports; it
  never changes it.
- Any resume mechanism that survives session exit.

## Open Questions

- Threshold defaults are set at session 80/95, weekly-all 85/95, the Fable ratchet at 85,
  and the spend-delta trigger at the first dollar. The Fable figure is the operator's
  decision of 2026-08-27; the rest are a starting point rather than a settled answer.
  What would settle them is how much window one section of a kit effort actually costs,
  which S1's reading log is what measures. Owner: the operator, on real data.
- Whether the harness's native 95% wind-down is rejection-gated. The operator reports never
  having seen it on this seat, which is an observation rather than a mechanism proof. If it
  does appear, the session barrier drops below 95. Owner: observation.
- What `limits[].is_active` means. Observed false on the session window and true on
  weekly-all. Nothing in this spec branches on it. Owner: observation.
- Whether `severity` ever leaves `normal`, and at what percent. With `spend.limit` null and
  `spend.percent` 0 it may never move on the spend object. Owner: observation, recorded by
  S1 on every read.
- Whether `spend.used.amount_minor` is a monthly or an all-time counter. S2 handles a
  negative delta either way. Owner: observation.

## Standing Brief Amendments

Folded into every later section's dispatch brief. Each entry exists because a defect of its
class was already found once in this effort, so the guard travels rather than the fix.

1. **Enumerations in the kit's own docs stop short of the newest member.** Raised by S7,
   which added a fourth SessionStart hook while `docs/architecture.md` and
   `docs/security-model.md` each still enumerate exactly three, and neither the count nor the
   trusted-channel table was updated. This effort adds hooks and trusted channels in S3, S4
   and S7, so any section that adds one must update every enumeration that counts them, and
   S6 must sweep all of them. `docs/plans/enumerations-stop-short_spec_v1.md` records at
   least five prior instances of this exact class in this repo, which is why it is a standing
   amendment on first occurrence here rather than on the second.

   **Broadened 2026-08-27 after the class recurred inside this effort, in this spec itself.**
   S1's fix round added a fourth store file (the in-flight lease) and a second cause of the
   `locked` reason, while S1's own store paragraph still enumerated two files and one cause.
   The first draft of this amendment scoped the travelling guard to hooks and trusted channels,
   which is exactly why it did not catch a spec-internal enumeration. The guard now covers
   **every enumeration this effort owns, in code comments, in this spec, and in the living
   docs**: any section adding a store file, a failure reason, a hook, a trusted channel or a
   sanitizer site updates every list that counts them, lists inside this plan included.

## Chapters

### Chapter 1 - 2026-08-27
Completed: **none closed.** S7 is review-clean and holding; S1 is stalled at its mode ceiling.
Implemented By: S1 `implementer-fable` (explicit fable override, 2 dispatches); S7
`implementer-sonnet`, then `implementer-opus` for its fix round.
Metrics: S1 two review rounds, both CHANGES_REQUIRED; S7 one round plus a clean fix round.
NEEDS_CONTEXT 0. Escalations: S7 mechanical to capable for its fix round, the orchestrator's
call rather than a ladder escalation since S7 never failed twice. Advisor on (opus), not
consulted this Chapter. Reviewers dispatched: 6 (adversarial x3, blind x2, security x1).
Gate at Chapter close: 375 pass, 0 fail, from a 324 baseline.

Decisions / Surprises:
- **Two spec errors of mine, both found by review rather than by me.** The store was specced
  machine-global while the credential resolves per profile; the blind reviewer reproduced one
  profile's stale token refusing another profile's valid one, and one account's percentages
  being served to another. And the spec claimed a seat without overage "will not pause"
  without `autoContinueAtUsageLimit`, where the binary's own schema description says off
  removes the *automatic resume* and leaves the pause as a manual choice. Both corrected.
- **The `/config` toggle for `autoContinueAtUsageLimit` writes no settings file.** It is
  `consentGated` and persists through an async writer. S7 therefore catches a hand-edited
  settings value, which does win when present, but not the ordinary opt-out. Its reach is
  narrower than specced and its emitted text now says so.
- **The two reviewers disagreed once and the blind one was right.** Adversarial rated the
  mtime lock-supersession a self-limiting Minor; blind reproduced it defeating the 900s
  backoff permanently whenever the credentials mtime sits ahead of the wall clock. A
  reproduction beat a chain of reasoning, which is the argument for keeping the pair.
- **An implementer argued against my brief and won.** I specified a `[0, 100]` percent bound;
  it shipped `[0, 1000]` because an overage seat legitimately exceeds 100, and nulling a real
  130 would make the window "unknown" exactly when a barrier is due, turning S2's
  unknown-never-barriers rule into silence at the worst moment. Accepted, and the premise is
  now an Open Question for the reading log to settle.
- **A reviewer's repro script overwrote the orchestrator's own file in the session
  scratchpad.** No warning; noticed only when the tool stopped working. Routed to the kaizen
  inbox rather than fixed here.

Review Findings:
- S1 round 1: 2 Critical (a machine-global store defeating this section's own stale-profile
  invariant; the same collision on the cache and the reading log) plus 3 Major. All fixed.
- S1 round 2: 3 Critical (an uncapped lease horizon that bricks the store where the sibling
  lock correctly caps; a lease acquire that fails CLOSED on a write error its own contract
  says must fail open; an unresolved relative `CLAUDE_CONFIG_DIR` making a repo-local
  `.credentials.json` the Bearer token) plus 6 Major. **None fixed. This is the stall.**
- S7 round 1: 4 Major, all fixed, fix round clean.
- Security over the whole changeset: 1 Major (the living docs no longer described the kit) and
  8 Minor. The Major is fixed in this Chapter's docs work.

Docs work done here under Standing Brief Amendment 1 rather than deferred to S6, because that
amendment puts an enumeration on the section that broke it: `architecture.md` and
`security-model.md` SessionStart hook counts, the state-location count and table, the
trusted-channel count and table row, the sanitizer site count and its new 300 cap group, the
same-uid store list, a new credential-path section, and the secrets-at-rest qualification.

Next: **BLOCKED on a user decision about S1's execution mode.** S7 is ready to close as soon
as S1 lands, since the two share one gate. Nothing else can start: S2 edits S1's file, and
S3, S4 and S8 all need S2's policy API.

Commit Model: Commit-and-Push, deliberately deviated this Chapter. Only this plan doc is
committed and pushed. All five code files and both living docs stay staged and uncommitted,
because putting code with three open Criticals on `main`, or docs describing hooks that are
not on `main`, is worse than a staged pause. `git diff --staged` is the review surface until
S1 closes.

### Chapter 2 - 2026-08-27
Completed: S1 (The usage reader) and S7 (the `autoContinueAtUsageLimit` posture check).
Implemented By: main session. The stall raised in Chapter 1 was resolved by the operator
narrowing S1 rather than by another dispatch, and the ladder bars a mid-effort downgrade to a
cheaper agent, so the remaining work ran here.
Metrics: two further review rounds on S1 (blind, rounds 3 and 4). NEEDS_CONTEXT 0. Escalations 0.
Advisor on (opus), not consulted. Gate: 394 pass, 0 fail, from a 324 baseline.

Decisions / Surprises:
- **The operator's call was to delete rather than to fix.** The in-flight lease came out
  entirely. It was never in the spec (I added it to a fix brief after round 1), and it was the
  source of two Criticals in round 2. Coalescing inherently makes the loser wait or go without,
  so every variant of it adds a failure mode, and the thing built to avoid one rate-limit
  response had introduced two ways to stop reading permanently.
- **The mtime supersession was kept with a better mechanism than either reviewer proposed.**
  Rather than patching the clock-direction hole, the credential's mtime is snapshotted into the
  lock, so the test asks "did this file change since the lock" instead of "is this file newer
  than that one". Clock direction stops mattering rather than being guarded against.
- **Round 3 then found that snapshot in the wrong place, which was my error.** It was taken
  inside `writeLock`, after the 401 returned. A 401 is exactly when the harness renews a
  credential, so a refresh landing mid-flight recorded itself as its own cause and a fresh valid
  token would have served the full 900s. Moved beside the token read and pinned by a test that
  fails when moved back.
- **Two more of my own main-thread errors, both found by review.** I fixed the relative
  `CLAUDE_CONFIG_DIR` door in `usage-lib.js` and not in the sibling hook reading the same
  variable, where a cloned repo could otherwise decide both whether the hook speaks and which
  paths it names in trusted context. And my first attempt at that fix resolved the path rather
  than refusing it, which restored consistency while leaving the repo-local file as the
  credential source; the test caught it immediately.
- **A deletion left an orphaned contract.** The module header still promised that `locked`
  covered an in-flight fetch after the lease that produced that state was gone. That is Standing
  Brief Amendment 1's class pointing the other way, a list that went long rather than short.
- **Reproducing beat reasoning again.** Round 3's five Majors were four reproductions and one
  argument, and every reproduction stood.
- One process note worth the line: I reproduced a reviewer's own Minor on myself, hanging a
  command by `require()`ing a hook that reads stdin.

Review Findings: round 3, 5 Major (the mtime snapshot placement; an unwritable store silently
losing every backoff so a 429 is refetched immediately; the sibling hook missing the relative
config-dir door; a non-empty `limits[]` with no recognized kind caching as an all-null success
that reads to the evaluator as a clear account while it may be saturated; the orphaned in-flight
clause) plus 8 Minor. All Majors fixed, and the Minors worth fixing were: the config-dir door
moved ahead of the cache, `res.complete` so a truncated body is transport rather than a complete
200, `req.destroy` on the throw path, `trimLog` keeping a whole boundary line and refusing to
rewrite a bare newline, and the test whose name said "resolves" where it asserted refusal.
A new failure reason, `no-store`, was added and enumerated in the header and the spec per the
broadened amendment.

Tests: 45 in `usage-lib`, 22 in the nudge suite. Nine locks added across rounds 3 and 4 for
behaviors a later edit could have broken with a green suite, each mutation-verified: the
relative config-dir refusal, the exponent and amount bounds, the required ISO zone, the
token-before-lock ordering, the CRLF header-injection door, the mtime snapshot placement, the
unwritable-store refusal, the unrecognized-kind parse failure, and the two nudge fixes. One
mutation (M5, the token/lock ordering) was malformed and broke 36 tests rather than swapping
cleanly, so that lock rests on weaker evidence than the other eight.

Round 4 then found one Critical and four Majors, all of them in code the round-3 fixes had just
added, which is the honest signal to record about this section: it did not converge quickly, and
each round found real defects in the previous round's repairs. The Critical was mine and it is the
instructive one. My `no-store` gate called `ensureStore()`, and `mkdirSync` with `recursive`
succeeds on an EXISTING directory whatever its mode, so the gate proved creatability and never
writability. A read-only store therefore lost every backoff and refetched a 429 immediately, which
is the precise amplification the gate had been added to prevent. It probe-writes now.

The other four: the cache door never got the wire door's new all-unknown refusal, so identical
bytes were accepted from disk and rejected off the wire, reachable without tampering from any
`usage.json` a pre-change build wrote; a payload whose kinds have all been renamed server-side sat
on the 60-second transient class though it cannot self-heal; `trimLog`'s new boundary handling
filtered the empty leading element away before its slice, so a window opening exactly on a newline
ate a whole record; and the header still promised `locked` covered an in-flight fetch, along with a
coalescing guarantee the deletion had removed. That last is fixed by stating what is true, that
concurrent readers each fetch once per staleness window, as an accepted and named cost.

Left unfixed and noted, all Minor, routed to `finishing-work`'s full-changeset pass: `profileKey`
hashing the realpath so an unresolvable symlink relocates the store, `configDirUsable`'s asymmetry
with `credentialsDir`, and three stale comments in the nudge hook and the test headers.

**Correction to Chapter 1's commit record.** That Chapter states only the plan doc was committed.
That is false, and the commit message of `05ee720` repeats it. `git add <plan doc>` followed by a
`git commit` with no pathspec commits the whole index, and the implementer agents had already
staged their five files, so the code landed on `main` with three open Criticals. The living docs
were the only things genuinely held back, which inverted the intent exactly: `main` briefly carried
the new hooks without the documents describing them. Superseded by this Chapter's commit, recorded
because the history now carries a message that misstates what it did.

Next: S2 (threshold policy and evaluation), which edits this same file.
Commit Model: Commit-and-Push, honored.

### Chapter 3 - 2026-08-27
Completed: S2 (Threshold policy and evaluation), plus repair of two Criticals that Chapter 2's own
fixes introduced.
Implemented By: S2 `implementer-opus`; the Critical repair in the main session.
Metrics: S2 one dispatch, DONE_WITH_CONCERNS, no review round of its own yet. NEEDS_CONTEXT 0.
Escalations 0. Advisor on (opus), not consulted. Gate: 409 pass, 0 fail.

Decisions / Surprises:
- **Round 4's full report landed after Chapter 2 was already committed, and it found that two of
  my own main-thread fixes had introduced Criticals.** This is the finding of the Chapter and it
  is about process rather than about the code. Fixing quickly in the main thread, under a
  reviewer that was still running, produced defects at close to the rate it removed them.
- **The cache door I added asked a different question from the wire door.** The wire refuses when
  no `limits[].kind` is recognized; my cache refusal tested whether every percent was null. A
  payload with recognized kinds and unknown percents therefore passed the wire, was cached, and
  was then discarded on every subsequent read, and because a 200 clears the lock nothing
  throttled the refetch: ten reads inside a 600-second budget made ten requests. That is worse
  than the bug it replaced. Both doors now ask the same question, by persisting the recognized
  kinds into the cache.
- **My `ensureStore` write probe used `flag: 'w'`, which follows a symlink and truncates its
  target**, twenty lines from a `publishText` that uses `'wx'` for precisely that reason. A
  planted symlink left an unrelated file at zero bytes while the probe reported the store
  writable. Now `'wx'` with a bounded EEXIST retry, and pinned by a test.
- Two doors to the same non-self-healing condition were still on the transient class (an empty
  `limits[]`, and a renamed top-level `limits` key). All three now take the long backoff, which
  changed an existing test's expectation rather than breaking it.
- S2's own decisions, taken at dispatch and worth recording: operator config is machine-global
  (thresholds are a policy preference, one set per operator) while the spend baseline is
  per-profile (spend is an account fact), and a session id is refused as a path component unless
  it matches a strict character class, since it arrives from the harness payload.

Review Findings: S2 has had NO review round yet, which is the open item this Chapter carries
forward. The round-4 findings against S1 are addressed apart from the Minors already listed in
Chapter 2, plus three more noted and not fixed: `trimLog`'s concurrency comment, written when the
lease made concurrent successful fetches impossible; `ensureStore` now writing on the read path
including where it is about to report `locked`; and the `res.complete` branch shipping with no
coverage because the test fake cannot produce it.

**Open and unresolved, raised by S2 and owed to the design rather than to the implementer: the
generic spend trigger is inert.** `spendDeltaMinor` is read, validated and the delta computed, but
no rule consumes it, so the effort currently has two triggers and a number rather than the three
this spec describes. The cause is the verdict shape in S2's dispatch brief, which carries `state`,
`window` and a separate `fableRatchet` boolean and leaves the spend delta nowhere to produce a
state. The implementer's reason for not inventing one holds: S3 may interpolate only a whitelisted
window literal and S4's deny reason must name a window, so a spend-triggered state carrying
`window: null` cannot be rendered by either consumer. Resolving it means deciding what the spend
delta's response IS, and the options are not equivalent: a fourth window literal (`spend`) that
both consumers learn to render, a separate boolean beside `fableRatchet` on the grounds that its
response differs from a pause, or dropping it and saying so. **This blocks S3 and S4**, because
both would otherwise be built against a verdict shape that is about to change.

Next: resolve the spend-delta shape, then S2 review, then S3 and S4.
Commit Model: Commit-and-Push, honored. S1 and S7 code, both living docs, and this plan doc
land together, because the docs describe hooks that are now on `main`.
