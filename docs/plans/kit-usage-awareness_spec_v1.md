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
mid-turn wind-down channel, a hard barrier on subagent dispatch, and a documented
credential path. It matters because on this Team seat with overage enabled nothing 429s at
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

`autoContinueAtUsageLimit` defaults on and already does pause-and-resume, but it hangs off
a **rejection**, so on an overage-enabled seat nothing is rejected and it never fires. It
remains the right mechanism for a seat where overage is not enabled or is exhausted, which
is a real configuration this kit may run under. The two are complementary rather than
competing: the kit's barrier fires earlier and at a clean boundary, so it pre-empts the
native flow rather than fighting it. What the kit owes here is a posture check rather than a
mechanism, which is S7.

The harness also carries a wind-down at 95% of the window. On the operator's report it has
never been seen on this seat, which is consistent with it being rejection-gated like
auto-continue. That is an observation and not a proof of the mechanism, and it is recorded
that way deliberately: `kit-adoptions.md` candidate 1 withdrew an absence-of-evidence
argument about this exact flow once already, and the operator's own report is what it
settled on as valid. If the native wind-down ever does appear at 95%, the kit's barrier
must drop below it so the kit's instruction lands first rather than competing.

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
one of `no-token`, `expired`, `rate-limited`, `timeout`, `parse` or `locked`.

Token resolution reads `$CLAUDE_CONFIG_DIR/.credentials.json`, falling back to
`~/.claude/.credentials.json`, at every call. The token is never cached, never logged and
never written to any file.

Cache at `~/.claude-kit-usage/usage.json`, directory 0700 and file 0600, with a
`usage.lock` carrying a `blockedUntil`. Backoff is per failure class: 401 marks `expired`
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
session and weekly-all windows, an absolute overage-dollar delta for the generic trigger,
and an `enabled` flag.

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

Evaluation also computes the staleness budget the callers pass to the reader: 600s at
`clear`, 120s when any window is within ten points of its barrier.

Acceptance criteria:
- An absent config file, an unparseable one, or `enabled: false` all return `clear`.
- The precedence table holds for every combination of two windows and three states.
- An unknown window percent cannot produce `barrier` at any threshold.
- A negative spend delta returns `clear` for that trigger rather than a failure.
- The staleness budget tightens to 120s at ten points below a barrier and not before.

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

Acceptance criteria:
- Denies only at `barrier` on data inside the staleness budget. Watch this red first.
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

`docs/kit-adoptions.md` corrects candidate 1 of the 2026-08-26 pass: the overage unit is
stated in the payload; the endpoint has now been called successfully from a plain Node
caller on this machine, retiring "never been called from a kit hook"; `limits[]`,
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
call and no measurable latency, since resolving the effective value means reading settings
files rather than asking the harness.

Acceptance criteria:
- When the setting is explicitly `false` in any settings tier the kit can read, one line
  reaches the operator naming which file holds it and that a seat without overage will not
  pause at the limit without it.
- When it is absent or `true`, nothing is emitted. The default-on case is silent.
- The kit never writes, patches or suggests patching a settings file itself.
- A settings file that cannot be read or parsed emits nothing rather than a warning.

Execution mode: delegate-mechanical.
Tests: the silence cases, since a nudge that fires on the default-on configuration would
fire in every session forever; and that an unreadable settings file stays silent.

## Out of Scope

- A kit-owned statusline, and any replacement of `ccstatusline`. Candidate 21 stays rejected.
- Reading `ccstatusline`'s cache as a data source.
- Triggering on the Fable-scoped weekly window, and wiring the Fable number into
  `finishing-work`'s metered-Fable authorization decision. The reader exposes
  `fableWeekly` so a later effort can consume it; this one does not.
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

- Threshold defaults are set at session 80/95 and weekly-all 85/95 with the spend-delta
  trigger at the first dollar, and they are a starting point rather than a settled answer.
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

## Chapters

(Appended by executing-work as sections complete.)
