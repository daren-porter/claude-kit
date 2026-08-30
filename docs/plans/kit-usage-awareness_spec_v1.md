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

### Two triggers, both usage windows

`limits[].kind=session` percent and `limits[].kind=weekly_all` percent, and nothing else.
Both are **leading** indicators: they let a run stop before the first overage dollar.

**A third, spend-delta trigger was specced, built, and removed on 2026-08-28, and the removal
is worth recording because the addition was a design error rather than a discovery.** The
operator was offered an overage-dollar trigger when the windows were chosen and declined it.
They then asked whether a single generic "overage is on" marker existed, saying explicitly that
it might *simplify* having to check two conditions. The answer to that question was no, and the
correct response was to stop there. Instead a third condition was added as a "backstop", which
is a variant of the option already declined and the opposite of the simplification asked for.

Removing it deleted more than a dead branch: the per-session baseline file, the session-id
path-safety door, and the eight-day reaping obligation existed only to serve it, and each had
been a source of review findings. Spend survives as **observation rather than trigger**: the
reader still reports `spend` and the reading log still records `amountMinor`, which costs
nothing and is what a later effort would need to revisit the question with real data.

The cost of not having it, stated plainly: overage caused by a window this spec does not model
goes uncaught. The payload carries nine unreleased codename buckets and null
`seven_day_opus`/`seven_day_sonnet` slots, any of which could begin binding. The reading log is
what would show that happening.

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
  `<store>/readings.log`, carrying the timestamp, each window's percent and
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
session and weekly-all windows, a single `fableRatchet` percent for the Fable weekly window, and
an `enabled` flag.

Evaluation returns a verdict naming the state (`clear`, `warn` or `barrier`), the window
that produced it, its `resets_at` and its percent. Precedence is fixed: any barrier
outranks any warn, and a weekly barrier outranks a session barrier because its horizon is
longer and its handling differs. A window whose percent is unknown never produces a
barrier.

The Fable window is evaluated separately and never feeds the `clear`/`warn`/`barrier`
state, because its response is a routing cap rather than a pause. Evaluation returns it as
its own boolean plus the percent and reset instant, and an unknown Fable percent never trips
it.

Evaluation also computes the staleness budget the callers pass to the reader: 600s at
`clear`, 120s when any window is within ten points of its barrier. It reports `ageSeconds`
alongside it, the age of the data it actually judged, because the budget is advice for the NEXT
read: a hook that read at 600 and is then handed 120 is holding data that may be older than the
budget it was just given, which is precisely what S4's positive-determination criterion forbids.
Without the age in the verdict S4 would have to re-parse the reader's timestamp itself.

**One defect in this section's own code outlived its review and was found by S4's blind
reviewer, and it is the only place in the effort where the fail-open posture inverted.**
`normThreshold` bounded a configured threshold to `[0, 100]` and replaced anything outside it with
the default. Since the defaults are the strictest values in play, a config written to disable a
window (`barrier: 200`) instead armed it at 95 and denied, with the reason quoting a percentage the
operator never wrote above the sentence "This is a spend control the operator armed". The cause was
a contradiction twenty lines wide: `normThreshold`'s comment justified the bound with "a threshold
set past 100 is one the kit could never act on", while `normPercent` admits `[0, 1000]` precisely
because an overage seat legitimately runs past 100.

**The first fix widened the bound to `[0, 1000]` and only relocated the defect**, which the
verification review reproduced and which is worth recording because the mistake was in the brief
rather than the code: the fix was aimed at the failing example's range instead of at the policy.
Above 1000 an out-of-range threshold still collapsed to the stricter default and still denied, and
`barrier: 999999` is the natural way to write "never fire this window", so the reachable case was
the operator-intent case. The test written alongside that fix pinned `1e300` as correctly
defaulting, so the suite actively asserted the broken behavior.

The policy actually shipped states the invariant rather than a range: **a parseable threshold is
honored as written, and an unusable one never resolves to something stricter.** Any finite value at
or above zero is honored, so `barrier: 999999` simply never fires. Only a non-number, a negative or
a non-finite value falls back to the default, and those are the absence of a policy rather than an
unreachable one. The same inversion lived one line away in `normWindowThresholds`, where a stated
warn above its barrier was replaced by the default warn, so `warn: 96` became 80 and armed a
trigger sixteen points stricter than anything written; an unreachable warn now stands down instead
(represented as `Infinity`, which `percent >= warn` never satisfies), because standing a trigger
down is honest where substituting a stricter one is the policy the operator did not write.

What follows for the operator, and it is not obvious: an out-of-reach **barrier** disables the deny
and nothing else, because the warn is independent and keeps its own value. `{barrier: 200}` alone
still winds a run down at the default warn of 80. Disabling a window means putting **both** out of
reach.

Acceptance criteria:
- A threshold outside `[0, 100]` but inside what a percent can read is honored as written
  rather than replaced by a default, so a barrier set past any reachable percent disables that
  window instead of arming it at the default.
- An absent config file, an unparseable one, or `enabled: false` all return `clear`.
- The precedence table holds for every combination of two windows and three states.
- An unknown window percent cannot produce `barrier` at any threshold.
- The staleness budget tightens to 120s at ten points below a barrier and not before.
(Store cleanup is NOT S2's. The reaper the first draft put here existed to sweep the spend
delta's baseline and went with it; S3's dedupe marker is now the only session-keyed file the
effort creates, so S3 owns reaping it. Recorded because the review found this answered one way
in prose and the other in code, leaving nothing owning cleanup.)

Execution mode: delegate-capable.
Tests: the precedence table, since a weekly barrier mishandled as a session barrier would
arm a resume for a window three days out; and the disabled and absent-config paths, since
they are what keep the feature off by default.

### 3. The wind-down channel

Ships `plugins/claude-kit/hooks/usage-nudge.js`, registered on `PostToolUse`,
emitting `additionalContext` through `hookSpecificOutput`.

At `warn` it emits once per window per session, deduped by a marker keyed on session id,
window and reset instant, so a new window re-arms. The text names the window, its percent
and its reset time, and instructs the model to finish the section in flight, start no new
subagents, write the Chapter, arm the resume for the window's horizon, then surface a
`BLOCKED:` line and stop.

**Both states carry the resume instruction, and the first draft gave it to the barrier alone,
which was a defect rather than a milder response.** The verification review traced it: on the
defaults a gradual burn crosses 80 first, the warn fires, its turn-ending `BLOCKED:` step halts
the run with no resume armed, and the barrier at 95 that would have armed one is then never
reached. So an unattended overnight effort stopped at 80% and stayed stopped, and the warn's own
lead line ("Wind down now rather than at the barrier") is what steered it off the only path that
resumes. The Goal is a single sequence, "winds down at a section boundary, stops, tells the
operator, and on the five-hour window arms its own resume", and the warn is the wind-down in that
sentence. What separates the two states is now step 1 alone: the warn gets to finish the section
in flight, the barrier does not.

**The marker is one append-only file for the whole profile, not one file per session**,
and the difference is a safety property rather than a style choice. A session id arrives
from the harness payload, so putting it in a path needs a strict character-class door, and
Chapter 4 records that this effort deleted exactly that door along with the feature it
served. Keeping the id as a JSON *value* in `<store>/nudged.log` removes the path surface
entirely, so there is no door to reintroduce and none to forget. Reaping becomes a bounded
rewrite of one file rather than a directory sweep, which is the `readings.log` idiom
`usage-lib.js` already carries.

**`SubagentStop` was specced alongside `PostToolUse` and dropped at dispatch, on
evidence.** The reasoning for it was sound (a subagent finishing is a natural section
boundary, and a wind-down landing mid-section strands half-built work) but the mechanism
does not do what the spec assumed. The 2.1.248 binary's own schema description for the
SubagentStop event reads "additionalContext is non-error feedback delivered to the
subagent; the subagent continues so it can act on it", where the Stop event's equivalent
says "delivered to the model". So the emission would hand an instruction written for the
orchestrator ("write the section's Chapter, surface `BLOCKED:`, stop the turn") to an
implementer subagent, and encourage that subagent to keep going. `PostToolUse` fires after
the `Agent` tool call returns in the orchestrator's own turn, which is the same boundary
delivered to the right reader, so nothing is lost by dropping it.

**A subagent's tool call is not a nudge-worthy event, and missing that was the second
Critical of S3's review round.** `PostToolUse` fires for tool calls made inside subagents, the
session id on those is the parent's, and while an `Agent` call is in flight every tool call is the
subagent's, so a subagent would normally have consumed the orchestrator's one nudge; and if
`additionalContext` instead lands in the calling loop, an implementer gets told to write a Chapter
and stop the turn. That is the same mis-delivery this section already avoided by dropping
`SubagentStop`, arriving by a second route that the first fix did not close. The hook now returns
early on any payload carrying a subagent identity, copying `docs-write-guard.js`'s
`subagentType`/`isBackgroundMain` pair including the bare-`claude` exemption for a background job's
main session. The guard is fail-open under every harness behavior, which is why it did not wait
on resolving which holds: it prevents consumption if the session id is shared, prevents
mis-delivery if the context lands in the subagent, and is inert if `PostToolUse` does not fire
there at all.

**That enumeration is not exhaustive, and an earlier draft of this paragraph claimed it was.**
The adversarial verification pass caught it, and the shape of the error is the same as this
effort's other retraction. All three arms above presuppose that a subagent's `PostToolUse` payload
carries an agent identity. A fourth behavior exists: the event fires in subagent context and omits
those fields, in which case the gate is inert and BOTH failure modes stay open. The mirror case
exists too: if the orchestrator's own payload for an `Agent` call carries a top-level agent
identity, the nudge is silenced at exactly the boundary that made dropping `SubagentStop` costless.
What is actually established is narrower than the claim was: `docs-write-guard.js`'s live-fire
evidence covers `PreToolUse` only, and "`PostToolUse` rides the same tool loop" is an inference.
The code is fail-open in all four behaviors, so nothing is at risk; what the false claim cost was
the reason to check. **This is the first thing to verify on the first live armed run behind a
`/plugin update`**, and it is recorded here rather than in a Chapter because it is a standing
question about the design, not a fact about one section's execution.

Acceptance criteria:
- A payload carrying a subagent identity emits nothing and consumes no marker, in every
  spelling `docs-write-guard.js` reads, while a bare `claude` background-job type is nudged
  like any other main session.
- The dedupe marker key carries the verdict state as well as the session, window and reset
  instant, so a warn cannot suppress the barrier for the same window. A barrier already
  recorded does suppress a later warn for that same window and instant, because the milder
  instruction after the stronger one tells a winding-down run to wind down less.
- The dedupe marker is the only session-keyed state this effort creates, so this section
  owns reaping it: a marker line older than eight days (the longest window tracked) is
  removed, bounded and silently, touching no other store file. No session id reaches a path
  component.
- The marker's key tolerates a null reset instant. `evaluate` reports `resetsAt: null` on a
  non-clear verdict whenever the producing window's timestamp failed validation, which is
  reachable off the wire from a valid percent with a malformed `resets_at`, so a key that
  assumes non-null would collide across windows instead of deduping within one.
- Emits nothing at `clear`, nothing when the signal is stale or unavailable, and nothing
  when the config is absent or disabled.
- Emits once per window **per verdict state** per reset instant, and re-emits when the reset
  instant changes. The state is load-bearing in that sentence and its absence was one of this
  section's two review Criticals: keyed without it, a warn permanently suppressed the barrier for
  the same window, so the resume instruction the Goal names could never be emitted. The earlier
  wording ("once per window per session") was literally satisfied by that broken behavior, which
  is why it is spelled out here rather than left to be inferred from the criterion above.
- Any internal error exits 0 with no output and never blocks.
- Every value interpolated into the emitted text is an integer, a whitelisted window
  literal, or a parse-validated ISO-8601 timestamp; everything else in it is a hardcoded
  literal. No free text from the payload crosses, `spend.disclaimer` included, since it
  carries a markdown link.

Execution mode: delegate-capable.
Tests: the once-per-window dedupe and its re-arm on a new reset instant, since a nudge on
every tool call would flood a long run; and the emission door, since it is the first
channel in `docs/security-model.md`'s table to carry network-derived values.

### 4. The barrier

Ships `plugins/claude-kit/hooks/usage-barrier.js`, registered `PreToolUse` with matcher
`Agent|Task`, returning `permissionDecision: "deny"` with a `permissionDecisionReason` that
is by itself a sufficient instruction: it names the window, its percent and its reset
instant, says not to retry or route around the deny, and carries the `BLOCKED:` and resume
sequence.

**The `additionalContext` the first draft asked for here was dropped at dispatch**, for two
reasons that both point the same way. Whether `additionalContext` renders to the model on a
DENIED tool call is confirmed only as far as the hook chain (the binary yields it in a
branch independent of the permission decision) and is not verified live, so the
load-bearing instruction belongs in the channel a deny is guaranteed to deliver. And S3
already owns the `additionalContext` channel for this same state, so emitting it here would
put one instruction into a single turn twice. What follows is a constraint rather than a
saving: the deny reason has to be self-sufficient, and its length is therefore budgeted rather
than merely bounded. The first draft of this paragraph claimed a hard harness cap of 2000
characters and 20 lines "read off the binary"; that was over-derived from a normalizer governing a
narrower hook path, was marked CONFIRMED in the dispatch brief on that basis, and was caught by the
security review rather than by me. What is actually true is that nothing this effort could find
caps the field on the local command-hook path, and that the stop instruction sits at the end of the
text, so any future truncation costs precisely the part that matters.

Three further facts from that same read shape the hook. The `permissionDecision` enum is
`["allow","deny","ask","defer"]`, and PreToolUse's `hookSpecificOutput` schema does accept
`additionalContext` even though the binary's own help text for that event omits it.
`updatedInput` is honored only on `allow` and `ask`, never on a `deny`, so rewriting the
dispatch instead of denying it was never available on this path and the choice below is
load-bearing rather than stylistic. And an explicit `permissionDecision: "allow"` is a
positive approval rather than an abstention, so this hook allows by silence like every
other kit guard.

It denies only on a positive determination from data no older than the evaluated staleness
budget. Stale data, any reader failure, an absent or disabled config, and an unknown window
percent all allow. It denies nothing outside `Agent` and `Task` at any threshold.

**The same hook carries the Fable ratchet**, as a second and narrower predicate evaluated
after the barrier. Precedence: a session-or-weekly `barrier` denies every `Agent` dispatch;
failing that, a Fable weekly percent at or above the ratchet denies only a dispatch whose
`tool_input.model` is `fable`, with a reason naming the percent, the reset instant and the
instruction to re-dispatch without the override. A dispatch carrying no fable override is
untouched by the ratchet.

**A dispatch made INSIDE a subagent gets the same deny and a different instruction**, added
after review found the third instance of one mis-delivery class in this effort. `PreToolUse` fires
for tool calls made inside subagents, and some agent types carry the `Agent` tool, so a nested
dispatch reaches this hook. Unlike S3's channel, the answer here is not to return early: the deny
is about stopping spend whoever is spending, and a subagent spends. What is wrong is the
instruction, since a subagent must not write a Chapter, must not arm a resume, and must not surface
`BLOCKED:` to end a turn that is not the effort's. So a payload carrying a subagent identity gets a
shorter form of each reason, saying to stop and report back to whoever dispatched it. Detection
copies `docs-write-guard.js`'s `subagentType`/`isBackgroundMain` pair including the bare-`claude`
exemption, because a user-launched background job presents that way and is the main session of its
job.

Denying is deliberate rather than rewriting the call through `updatedInput`: a silent
downgrade would leave the orchestrator believing it got Fable and writing a Chapter saying
so. Review then established the stronger form of that point from the binary itself: the hook
chain honors `updatedInput` only on an `allow` or an `ask` and never on a `deny`, so the rewrite
was never available on this path and the choice is load-bearing rather than stylistic. The hook cannot see an inherited Fable model on a Fable-led session, only an explicit
override, and its reason text says so rather than implying full coverage.

Acceptance criteria:
- Denies only at `barrier` on data whose reported `ageSeconds` is within the verdict's own
  `maxAgeSeconds`. Where the budget tightened below the age of the data in hand, the hook
  re-reads before deciding rather than denying on data older than the budget it was handed.
  Watch this red first.
- The ratchet denies a dispatch with `model: "fable"` at or above the Fable threshold, and
  allows the identical dispatch without that override. Watch the first of these red.
- A session-or-weekly barrier outranks the ratchet, so at a barrier every `Agent` dispatch
  is denied regardless of model.
- The ratchet allows everything on stale data, on any reader failure, and when the Fable
  window's percent is unknown.
- Allows on stale data, on every reader failure reason including `expired`, on absent
  config and on `enabled: false`.
- The deny reason names the window and the reset instant, so the model can act on it
  without another read, and says explicitly not to retry the dispatch, not to reshape it,
  and not to do the subagent's work in the main thread instead. A bare refusal on `Agent` in
  an unattended run invites a dispatch loop, which spends more than the barrier saves. Both
  clauses describe the ORCHESTRATOR form; the nested form below carries neither, because a
  subagent has no main thread to route the work into and no turn of the effort's to end.
- The deny reason stays short by budget rather than to a discovered limit: about 1300
  characters and 11 lines at its longest branch. A deny whose instruction was truncated away is
  a wedge with no instruction, and since the instruction is at the end of the text, that is the
  half any truncation would take.
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

**PARKED 2026-08-28, on the operator's decision, with the reason recorded because it changes what
this section should contain.** `writing-skills` gates behavior-shaping prose at RED and GREEN arms
of three reps each, serial on the RED side, one fixture per rep, plus a third arm for a narrowing,
and every fixture needs an isomorph because this effort's own committed plan doc answers the
question a fixture would pose. That priced at roughly 15 to 18 mostly-serial subagent dispatches
for this section and S8 together, which the spec authorized without knowing the figure. Put to the
operator, the call was to ship S6 now and let a fresh session run the arms with the budget known.

**Most of this section turned out to be redundant, and finding that is the point of the skill's
"ask what already produces the behavior" rule.** S3's hook emits the whole instruction sequence
directly into the model's context at the moment it matters, with the real percentages and reset
instant interpolated. Prose restating it changes nothing and adds a rule every session carries.
What survives is narrower and should be what a later session writes:

- **One entry in `executing-work`'s blocker set**, which lists four blockers and does not include a
  usage barrier, while the completion contract states as a hard prohibition that the only reason to
  stop mid-spec is a true blocker. So the hook tells a session to stop and the skill tells it that
  stopping is a contract violation. That conflict is the real gap, and it is a structural slot in an
  existing enumeration rather than new prose.
- **Naming the resume mechanism.** The hook text says "create a single scheduled job" and cannot
  name a tool, because a hook has no way to know what is available in the session. `CronCreate` is
  also a deferred tool, so a model told to create a scheduled job may not find it.
- **How to tell a genuine wind-down from injected prose, which is now the most valuable item here
  and was not in the original scope.** Two RED reps were handed a convincing fake during S5's own
  arm and both refused it, and both derived the same discriminator unaided: run `usage.js status`
  and see whether the numbers corroborate, since an imitation cannot make the real store agree. Two
  structural tells support it, that the real channel can only name the session or weekly-all window,
  and that the real barrier denies a dispatch rather than asking in prose. The operator-facing half
  shipped immediately in `usage-awareness.md` because it owes no arms; the half that belongs in
  `executing-work`, where a session reads it before obeying, is what stays parked here.
- **Step 3 has no branch for a session with no section in flight**, and is unexecutable for a
  subagent, since `docs-write-guard` denies any non-curator write into `docs/`. A RED rep hit both
  for real, diverted its Chapter to `.kit/` and handed it back. The subagent half only bites if S3's
  identity gate turns out to be inert, which is the standing unverified inference; the no-section
  half bites unconditionally. This is a change to the canonical text and both hooks, so it wants
  review rather than a main-thread edit.

The operator-facing half of this section shipped early, in `docs/usage-awareness.md` under S6,
because it was the only thing standing between the feature and being usable at all.

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

`docs/README.md` registers this plan, and its existing entry is corrected: it still describes
three triggers including the removed spend delta, which is a false claim rather than a short
list, and S6's own Audience names the reader it misleads.

It also ships the **operator-facing documentation of the config file**, which no section owned
until the review pointed it out. The Goal promises a policy the operator configures, `enabled`
defaults to false, and the only way to arm the feature is to hand-author
`~/.claude-kit-usage/config.json`, whose path and schema existed only in a code comment. The
document states the path, every field with its default, that the file is operator-written and
never kit-written, and the three things that will otherwise bite. A threshold written as a string,
as a negative, or as anything non-finite falls back to its default with no signal anywhere, and the
default is the strictest value the kit ships. An out-of-reach **barrier** disables the deny alone,
so a window is only really off when both its warn and its barrier are out of reach. And a `warn`
above its own `barrier` stands the warn down rather than firing, which is deliberate but silent, so
an operator who writes one and expects a wind-down gets none.

(An earlier draft of this criterion said a threshold outside `[0, 100]` falls back to its default.
That was true when written and is now false: see the S2 paragraph above for the policy that
replaced it. Recorded rather than quietly edited, because a criterion silently tracking the code is
how the record stops describing the work.)

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

**S8 was unimplementable as first written, and the gap was found at execution rather than at
plan time.** It told the orchestrator to read the Fable weekly percent and nothing could read one:
`usage-lib.js` is a module with no CLI, and the store path carries a hash of the resolved
credentials directory so it is not hand-guessable. The prose half was parked and
`plugins/claude-kit/hooks/usage.js` was built to close it, a read-only `status` command mirroring
`memory.js`'s split from `memory-lib.js`. Two things about that command bind this section's prose
when it is written:

- **`status` evaluates the threshold policy as if the feature were armed**, and marks the two
  policy lines `[advisory: the feature is disabled, so no hook acts on this]` when it is not. The
  alternative was to report `evaluate`'s inert verdict, which is what the library returns whenever
  `enabled` is not true, and that would have printed `state: clear` and `fableRatchet: false` on a
  saturated account: a non-evaluation wearing the clothes of a measurement. The as-if-armed reading
  is also what an operator choosing thresholds for the first time actually needs. What follows for
  the prose is a gating clause: the ratchet rule applies only where the feature is enabled, because
  the operator opts into this whole feature by writing the config file, and a routing cap nobody
  configured would be a surprise.
- **A reading can be unavailable**, and the prose needs a branch for it rather than assuming a
  percent. `usage-lib.js` exports no cache reader, so there is no stale-cache fallback: when the
  backoff lock is held the command reports that no reading is available. The prose must say what to
  do there, and the answer that matches every other door in this feature is to proceed at the
  session model rather than to block.

Before any dispatch carrying a fable model override (a `delegate-fable` section, an
escalation into fable, or finishing-work's reviews), the orchestrator reads the Fable weekly
percent via that command. At or above the ratchet it dispatches at the session model instead and records the
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

### 9. The warn band becomes a working state

Today a warn is a stop. `usage-nudge.js` tells the session to finish, write its Chapter, arm a
resume and end the turn, and `usage-barrier.js` allows every dispatch until the barrier. So the
whole span between the two thresholds is unused: the run ends at the warn and the remaining points
sit idle until someone restarts by hand. On the weekly window that is expensive, because there is no
auto-resume there and the window resets days out. At the operator's observed intensity the default
ten-point gap is roughly a working day of allowance abandoned.

The gap was specced as wind-down runway, room to reach a section boundary before the barrier makes
dispatch impossible. That reasoning holds and it does not need ten points; three is comfortably more
than a section.

**What changes is what a warn means.** It stops being an instruction to stop and becomes an
instruction to keep working more cheaply:

- **Subagent dispatch is refused mechanically at the warn**, not merely discouraged. Dispatches are
  the expensive thing by a wide margin (implementers ran 130k to 290k tokens each in this effort's
  own Chapters, reviewers 100k to 230k), and prose alone leaves the saving to compliance. The deny
  moves down from `barrier` to `warn` in `usage-barrier.js`.
- **The main thread continues.** Documentation, plan and Chapter updates, investigation, staging,
  answering the operator: all of it is far cheaper per unit of progress than a dispatch, and all of
  it stays available.
- **The session does not CLOSE work that would normally take review.** This is the constraint that
  makes the rest safe, and it is not decoration. This kit delegates review as well as implementation,
  so a session that cannot dispatch cannot review, and every Critical and Major in this effort was
  found by a reviewer rather than by the orchestrator. Landing unreviewed sections across a wide band
  while nobody is watching is the worst available trade. So the run may finish and stage the section
  in flight, and must then stop at that boundary rather than opening another.
- **The resume attaches to stopping, not to the threshold.** A warn no longer ends the turn, so there
  is nothing to resume from when it fires. When the run does stop, at the boundary or at the barrier,
  the session window arms a resume because it resets in hours, and the weekly window notifies instead
  because it resets days out. The canonical text's existing "or immediately if that instant has
  already passed" clause covers a run that worked on for hours before stopping.

A barrier is unchanged: stop now, stage what exists, and do not finish the section in flight.

Two consequences worth stating rather than discovering. The deny reason needs a warn-level variant,
since the shipped one says "at or past the barrier" and carries a stop sequence, which is the wrong
instruction here; that variant has an orchestrator and a subagent form like the barrier's. And this
changes what `evaluate`'s `warn` state MEANS to a consumer rather than changing a wording, so it is
a contract change: anything reading that state is reading something new.

It also dissolves a loop this effort hit for real. Repairing the wind-down needs review, review needs
dispatch, and the wind-down forbade dispatch, so two fixes on 2026-08-29 and 2026-08-30 shipped with
no fresh-context review for exactly that reason.

Acceptance criteria:
- At `warn`, an `Agent` or `Task` dispatch is denied, with a reason that names the wind-down rather
  than the barrier and instructs main-thread continuation rather than a stop. Watch this red first.
- At `barrier`, behavior is unchanged, and the barrier reason still outranks the warn reason.
- Both new reasons have a subagent form, on the same rule as the barrier's: the deny stands, and the
  instruction says to report back rather than to write a Chapter or arm a resume.
- The warn text tells the session to continue in the main thread, not to close work that would
  normally take review, and to stop at the next clean boundary rather than immediately.
- The resume instruction moves to the stop rather than the threshold, and still splits by horizon:
  a session window arms one, a weekly window notifies.
- Every fail-open door is unchanged. A stale reading, any reader failure, an absent or disabled
  config and an unknown percent all still allow, and nothing outside `Agent` and `Task` is ever
  denied.

Execution mode: main. This changes the meaning of a state that three files and the canonical text
contract all read, so it is design-entangled rather than briefable, which is what that mode is for.

Tests: that a warn denies and names the wind-down rather than the barrier, watched red; that a
barrier still outranks it; and that every allow-on-doubt branch is untouched, since widening the
deny widens the blast radius of getting one wrong.

## Out of Scope

- A kit-owned statusline, and any replacement of `ccstatusline`. Candidate 21 stays rejected.
- Reading `ccstatusline`'s cache as a data source.
- Pausing or stopping on the Fable-scoped weekly window. That window ratchets model routing
  down to the session model (S4 and S8) and never pauses an effort, because running at Opus
  is a working state rather than a barrier.
- Interrupting, killing or reverting work already in flight, on any window.
- A threshold on **cumulative** overage spend. No cap is exposed to this seat, so there is
  no denominator, and the per-session delta that once stood here was removed on 2026-08-28 (see
  "Two triggers, both usage windows"). Spend is reported and logged as observation only.
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
  with no spend trigger. The Fable figure is the operator's
  decision of 2026-08-27; the rest are a starting point rather than a settled answer.
  What would settle them is how much window one section of a kit effort actually costs,
  which S1's reading log is what measures. Owner: the operator, on real data.
- Whether the harness's native 95% wind-down is rejection-gated. The operator reports never
  having seen it on this seat, which is an observation rather than a mechanism proof. If it
  does appear, the session barrier drops below 95. Owner: observation.
- What `limits[].is_active` means. Observed false on the session window and true on
  weekly-all. Nothing in this spec branches on it. Owner: observation.
- **Answered 2026-08-28, partly.** `severity` does leave `normal`: the weekly all-models window
  reported `warning` at 78% while the session window at 43% and the Fable window at 36% both still
  read `normal`, observed through `usage.js status` on this account. So the field moves, it moves on
  a window rather than only on the spend object, and it moved somewhere between 74% (observed
  `normal` earlier the same day) and 78%. What remains open is the exact boundary, whether a level
  above `warning` exists, and whether the spend object's own severity ever moves given a null
  `spend.limit`. Nothing in this spec branches on it, and the reading log is what would settle the
  boundary. Owner: observation.
- Whether `spend.used.amount_minor` is a monthly or an all-time counter. Nothing branches on it
  now that the spend trigger is gone, so this is purely a question the reading log can answer for
  a later effort. Owner: observation.

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

**Resolved 2026-08-28 by removal.** S2 shipped the spend delta computed but consumed by nothing,
which surfaced the question of what its response should be. Put to the operator, the answer was
that the trigger should never have existed: see "Two triggers, both usage windows" above for the
provenance. The machinery is gone, spend remains as observation, and the verdict shape S3 and S4
build against is now settled.

Next: S2 review (it has had none), then S3 and S4.

### Chapter 4 - 2026-08-28
Completed: S1 and S2 both reviewed and repaired. **S1 and S2 are closed.**
Implemented By: `implementer-opus` for the code and test fixes; main session for the docs half
(the write guard denies a subagent any `docs/` write) and for the two ownership decisions.
Metrics: S2's first review round (adversarial plus blind over the whole changeset), then one fix
round. NEEDS_CONTEXT 0. Escalations 0. Advisor on (opus), not consulted. Gate: 412 pass, 0 fail,
from a 324 baseline.

Decisions / Surprises:
- **The trigger count came back to two, and the provenance is the finding.** Asked where the
  spend delta came from, the answer was that it was scope this session added: an overage-dollar
  trigger had already been declined in the window choice, and the question that produced the
  third trigger asked whether one generic marker could SIMPLIFY two conditions. A third condition
  was the opposite of the answer. Removing it also deleted the per-session baseline file, the
  session-id path-safety door and the eight-day reaping obligation, each of which had generated
  review findings of its own.
- **This round found no Criticals, and the review says the evaluation logic is correct on every
  axis it tested**: all nine precedence cells, the unknown-percent rule including the
  zero-threshold cell where `null >= 0` hides, the Fable ratchet's independence, the staleness
  boundary in both directions, and per-field config degradation. After five rounds this is the
  first with no Critical, which is what convergence looks like here.
- **Two tests passed for the wrong reason and were mutation-proven vacuous.** The Fable ratchet's
  unknown-percent guard could be deleted with the suite green, because every assertion used the
  default 85 where the null coercion agrees by luck; and "a failed read never barriers" passed
  vicariously, because every failure shape fed to it lacked `windows` entirely. Both now
  discriminate. This is the more useful lesson than any single defect: a green suite said nothing
  about either rule.
- **An implementer corrected the brief twice, and was right both times.** I specified `>` for the
  retry-after cap; `>=` was needed, because a header of exactly 86400 still lands one second
  outside the read guard and gets discarded as corruption. And I specified folding short-read
  detection into `truncated`, which would have entered `trimLog`'s fragment-dropping branch and
  published a bare newline over the log, worse than the asymmetry it fixed. Recorded because the
  same thing happened in Chapter 2 with the percent bound: the briefs have been the weak link
  more often than the implementations.
- **The enumeration class recurred a third time.** `config.json` is a new store file and three
  enumerations of the store went short: `architecture.md`, `security-model.md` and the spec's own
  S1 paragraph. Standing Brief Amendment 1 exists for exactly this and still did not prevent it,
  which is evidence for `plans/enumerations-stop-short_spec_v1.md`'s thesis that review detects
  this class reliably and does not prevent it.
- **Two acceptance criteria had no owner and now do.** Store cleanup moved to S3, which creates
  the only session-keyed file the effort still has. Operator-facing documentation of
  `config.json` moved to S6: `enabled` defaults false, so the only way to arm the feature was to
  hand-author a file whose path and schema existed solely in a code comment.
- The verdict now reports `ageSeconds`, because `maxAgeSeconds` is advice for the next read and
  S4's positive-determination criterion had no single-pass way to tell whether the data in hand
  was inside the budget it had just been handed.

Review Findings: adversarial 7 Major and 16 Minor; blind 2 Major and 8 Minor. All Majors fixed.
Fixed Minors included the dead `opts` parameter, an invented filename ("the spend log"), the
reason enum omitting `no-store`, five unpinned guards, an unfrozen exported `DEFAULT_CONFIG`, a
non-positive near-barrier window for a barrier at or below 10, an unvalidated `warn > barrier`
that silently made the wind-down unreachable, and roughly a dozen comments left mid-sentence by
the removal.

Next: S3 and S4. Both were blocked on the verdict shape, which is now settled.
Commit Model: Commit-and-Push, honored. S1 and S7 code, both living docs, and this plan
doc land together, because the docs describe hooks that are now on `main`.

### Chapter 5 - 2026-08-28
Completed: S3 (the wind-down channel) and S4 (the barrier), both built, reviewed and repaired.
**Both are code-complete with a verification pass outstanding**, dispatched at close; anything it
finds lands in Chapter 6.
Implemented By: S3 `implementer-opus` (three dispatches: build, then two fix rounds); S4
`implementer-fable` (two dispatches, explicit fable override on an Opus session per the
`Fable Spend:` header); main session for `hooks.json`, every living-doc edit, the canonical text
contract, and the four spec corrections.
Metrics: one paired review round per section plus one security pass over both, five reviewers in
one parallel dispatch. Three fix rounds total. NEEDS_CONTEXT 0. Escalations 0. Advisor on (opus),
**consulted once and it changed the dispatch materially** (see below), which is the first
successful consultation recorded in this repo's advisor experiment. Gate at close: 485 pass, 0 fail,
from a 412 baseline.

Decisions / Surprises:
- **The advisor earned its line in the Metrics for the first time.** Consulted before dispatch, it
  found that S3 had inherited the eight-day reaping obligation from the removed spend delta but not
  the session-id path-safety door deleted alongside it, so the specced marker would have put a
  harness-supplied string into a filesystem path with its guard gone. Its proposed alternative (one
  append-only file per profile, session id as a JSON value) removed the path surface rather than
  re-guarding it. It also predicted the cross-hook text divergence and named the fix that was taken.
- **Reading the binary changed the design four times, and three of those were spec claims that were
  simply false.** `SubagentStop`'s `additionalContext` is delivered "to the subagent; the subagent
  continues so it can act on it", where `Stop`'s says "to the model", so the registration the spec
  called a natural section boundary would have handed an orchestrator instruction to an implementer:
  dropped. `updatedInput` is honored only on `allow` and `ask`, never on a `deny`. A `PreToolUse`
  chain that yields a stop returns before the tool is called, so a denied call fires **no**
  `PostToolUse`, which is what makes the nudge's unmatched registration load-bearing rather than
  lazy. And the fourth was my own error in the other direction: see the retraction below.
- **Both of S3's review Criticals traced to my spec text, not to the implementation.** The dedupe
  key was specced as "session id, window and reset instant" and omitted the verdict state, so a
  warn permanently suppressed the barrier for the same window and the resume instruction the Goal
  names was unreachable on the ordinary escalation path. Two reviewers reproduced it independently.
  The section's own acceptance criterion ("emits once per window per session, and re-emits after the
  reset instant changes") was *literally satisfied* by the broken behavior while the section's
  preceding sentence was contradicted by it, which is `plans/record-vs-artifact_spec_v1.md`'s thesis
  exactly: the defect lived in the gap between two sentences of one document, and no rewording of
  either would have reached it.
- **One mis-delivery class appeared three times and each fix opened the next.** An instruction
  written for the orchestrator reaching a subagent: closed on `SubagentStop` at dispatch, found open
  on `PostToolUse` by the blind reviewer, then found open on the barrier's deny reason too. The
  three answers differ because the right answer differs (drop the registration, return early, keep
  the deny and swap the text), which is why closing one told me nothing about the others.
- **A defect in closed S1/S2 code survived six earlier review rounds and was found by S4's blind
  reviewer.** `normThreshold` replaced an out-of-range threshold with the stricter default, so a
  config disabling a window armed it and denied. Recorded against S2 above. The lesson is not the
  bug but where it was caught: a reviewer scoped to S4 read the library as context and noticed a
  contradiction between two of its own comments.
- **Nothing in the suite read `hooks.json`.** A wrong event name, stray matcher or typo'd path left
  every test green while the hook never fired, and that now covered a hook that can deny tool calls,
  so the whole feature could have shipped dead. `test/hooks-registration.test.js` pins the inventory
  and, deliberately, pins that the `PostToolUse` entry carries **no** matcher, with the reason:
  narrowing it to `Agent` to cut per-tool-call process spawns is an obvious-looking optimisation
  that would make the barrier text undeliverable exactly when it matters.
- **A retraction, because it is the class this effort keeps producing.** I read 2000-character and
  20-line constants out of a hook-output normalizer in the 2.1.248 binary and generalised them into
  "the harness caps `permissionDecisionReason`", marked it CONFIRMED in a dispatch brief with
  evidence, and wrote it into `security-model.md`, this spec, the hook's header and the canonical
  contract. The security reviewer could not reconfirm it. That normalizer also drops
  `permissionDecision: "allow"`, `"defer"` and `updatedInput` for PreToolUse, which local command
  hooks demonstrably use, so it governs a narrower path; on the local path the `additionalContext`
  handler is a persist-to-disk-above-threshold helper and no line cap on `permissionDecisionReason`
  was found at all. Nothing was at risk (the as-built text is ~1300 characters and 11 lines) and the
  guidance survives, but the confidence was wrong in the one document a reviewer is told to read
  first. The `CONFIRMED`/`INFERRED` marking the brief format requires is only as good as the
  orchestrator's discipline about which it is entitled to.
- **My own canonical text drifted before anyone copied it.** Step 4 of the stop sequence existed as
  four hand-written copies under a header instructing the implementer never to paraphrase, and two
  had already diverged. It is now one named interpolant with two forms, and its null form no longer
  demands the model name a reset instant the same text has just said was unreadable.
- **An implementer's `git checkout` silently reverted an orchestrator edit.** Restoring a mutation
  that way reverts to HEAD rather than to the pre-mutation state, so it destroyed a comment edit
  made to `usage-lib.js` minutes earlier. The implementer reported the incident and verified its
  restore by confirming its own staged diff was "exactly one hunk", which is precisely the check
  that cannot detect the loss. Caught only by re-reading the full file diff. Routed to the kaizen
  inbox with the two fixes that compose.
- **What the reviewers could not fault is worth recording too**, because it is the same split as
  every prior Chapter: both hooks' two-pass staleness protocol (no reachable third read, no deny
  outside the budget handed), the emission door on both channels (no path found for any other
  payload string), precedence across fifteen-plus allow-on-doubt branches, the Fable match breadth,
  and the three credential properties `security-model.md` demanded be re-verified at registration.
  Every defect found was in something written in prose; nothing was found in the logic.

Review Findings: S3 adversarial 1 Critical + 3 Minor; S3 blind 2 Critical + 3 Minor; S4 adversarial
0 Critical + 5 Minor (APPROVED_WITH_CONCERNS); S4 blind 1 Major + 8 Minor; security over both
0 Critical + 1 Major + 3 Minor (CONCERNS). Both Criticals and both Majors fixed. Minors fixed:
the marker reader's two-directions-for-one-condition (a chmod-0200 store was a reproduced flood),
`hasOwnProperty` at the barrier's label door, `Number.isFinite` before every rendered percent, floor
rather than round (rounding let a warn print numbers asserting a barrier), the past-instant resume
clause, `pr-docs-guard.js` missing from the trusted-channel deny row, and five test pins where a
one-token mutation passed the suite green. Minors accepted with reasons recorded: the read-then-
append TOCTOU, the over-cap silence needing a foreign writer, the parked-barrier re-read cost, the
absent request coalescing (removed earlier in this effort after being reproduced bricking the store
two ways, and now documented in its sharpest framing, that the spend control can go dark exactly
when spend is highest), and the `subagentType` pair existing in three hooks (no shared
hook-payload module exists; a fourth copy is the point to build one).

Mutation verification: twelve mutations across the two fix rounds, each watched red and restored.
The ones worth naming are the four that had passed the suite green before they were pinned: the
verdict state removed from the marker key, `state === 'barrier'` widened to `state !== 'clear'`
(which would deny every dispatch at the warn threshold), the post-re-read `wouldDeny` check deleted
(which emitted a deny naming a fabricated "0%"), and the staleness boundary operator flipped.

Next: the verification pass, then S5 (resume and shipped prose), S6 (security model, ledger
corrections, docs) and S8 (the Fable ratchet's prose half). S5 documents behavior that wants one
live observation behind a `/plugin update`, which the payload has never had.
Commit Model: Commit-and-Push, honored. `hooks.json` is staged explicitly this time: a reviewer
noted it was modified-unstaged while both hooks were staged, and committing the index alone would
have shipped both hooks unregistered and inert with the suite green.

### Chapter 6 - 2026-08-28
Completed: **S3 and S4 are closed**, after a two-reviewer verification round and a third fix round
each. `finishing-work`'s full-changeset pass is the remaining net over them.
Implemented By: `implementer-opus` (S3, third round), `implementer-fable` (S4, third round, which
also carried the `usage-lib.js` threshold policy); main session for every doc and spec correction
and for the canonical contract's fifth and sixth amendments.
Metrics: one verification round (blind plus adversarial, both over the committed changeset at
`f39b1e0`), two fix rounds. NEEDS_CONTEXT 0. Escalations 0. Advisor on (opus), not consulted this
Chapter. Gate at close: 489 pass, 0 fail, from a 412 baseline.

Decisions / Surprises:
- **Running a verification round after the fixes was the right call and it is the transferable
  lesson.** It found five Majors in code and prose that had just passed a five-reviewer round, which
  is the pattern Chapters 2 and 3 already recorded and the reason the round was dispatched at all.
  Two were design defects, not polish.
- **The warn stopped the run without arming a resume, which made the feature counterproductive
  rather than merely incomplete.** The canonical text gave `resumeStep` to the barrier alone while
  giving the warn the same turn-ending `blockedStep`. On the defaults a gradual burn crosses 80
  first, so the warn halted the run with no resume armed and the barrier at 95 that would have armed
  one was never reached: an unattended overnight effort stopped at 80% and stayed stopped. The
  warn's own lead line, "Wind down now rather than at the barrier", is what steered it off the only
  path that resumes. The Goal is a single sequence and the warn is the wind-down in it, so both
  states now arm, and step 1 alone separates them.
- **My threshold fix pinned the example instead of the policy, and the test I briefed pinned the
  broken behavior as correct.** I asked for the bound to be widened from `[0, 100]` to `[0, 1000]`
  "matching normPercent", which relocated the inversion rather than removing it: above 1000 an
  out-of-range threshold still collapsed to the stricter default and denied. `test/usage-lib.test.js`
  then asserted `1e300` correctly defaulting. The shipped policy states the invariant instead of a
  range, and the same inversion turned out to live one line away in `normWindowThresholds` where an
  unreachable warn was replaced by a stricter default.
- **A second false-exhaustiveness claim, retracted.** After Chapter 5's caps retraction I had an
  implementer write that the subagent gate "is correct under every version of the harness behavior",
  over a three-way enumeration whose every arm presupposes the payload carries an agent identity. A
  fourth behavior exists (the event fires in subagent context and omits those fields) under which
  the gate is inert and both failure modes stay open. The code is fail-open in all four, so nothing
  was at risk; what the claim cost was the reason to check. It is now the named first thing to verify
  on the first live armed run.
- **The cause distribution across this effort is now too consistent to read as noise.** S3 and S4
  took three fix rounds each. Every Critical and every Major traced to spec prose, a dispatch brief,
  or a main-thread fix of mine. Not one originated in an implementer's code. Meanwhile implementers
  corrected the brief five times across the effort and were right every time, and this Chapter's
  reviewers again confirmed every piece of logic they were asked to doubt: both hooks' staleness
  protocol, both emission doors, the text contract byte-for-byte across ten branches, the shared
  interpolants identical between the two files, and no fourth route into the mis-delivery class.
- I introduced a typo into the canonical contract while amending it ("session's Chapter" for
  "section's") and caught it in the same turn. Noted because that file is a no-paraphrase contract
  two hooks reproduce verbatim, so an uncaught typo there propagates into model-facing text.
- **A degenerate case judged rather than changed**, on the implementer's reasoning: at `barrier: 0`
  the verdict is percent-independent, so `nearBarrier`'s floor of 1 leaves that one config able to
  deny on 599-second-old data. Closing it would put every low-barrier config on the permanent fast
  poll, a trade the floor deliberately refuses. Recorded as degenerate.
- One latent note for a later effort: `JSON.stringify` renders a stood-down warn (`Infinity`) as
  `null`. No live path round-trips a normalized config today, so nothing is wrong; a future
  serializer needs the same awareness.

Review Findings: verification blind 2 Major + 5 Minor (APPROVED_WITH_CONCERNS); verification
adversarial 3 Major + 3 Minor (CHANGES_REQUIRED). All five Majors fixed, two of them in code and
three in prose. Minors fixed: the finite check on both interpolated thresholds at the barrier's
emission door (the header claimed it and the sibling did it), the `additionalContext` justification
scoped per predicate since the Fable ratchet has no sibling channel, an exemption assertion that
could not fail for its stated reason in either hook, the stale length figures in two documents, and
`security-model.md` describing rounded interpolation where both hooks floor. Minors accepted with
reasons recorded: the read-then-append race (reproduced at two duplicate emissions in one of three
six-process runs, bounded by batch width, and the obvious fix would put a session id back into a
path), and the `barrier: 0` staleness edge above.

Mutation verification: five more, each restored from a file copy rather than with `git checkout`
after Chapter 5's data-loss incident. The two that matter are the warn's resume step removed (which
reddened all four warn renderings) and the threshold upper bound reintroduced (which reddened the
new class test). No mutation was claimed for the barrier's finite-threshold door, because the branch
is unreachable through `main` and the implementer judged a fixture there would be vacuous rather
than manufacturing one.

Next: S5 (resume and the shipped prose), S6 (security model, ledger corrections, docs) and S8 (the
Fable ratchet's prose half). S5 and S6 both want one live observation behind a `/plugin update`,
which the payload has never had, and the standing question named in S3 above is the first thing that
run should answer.
Commit Model: Commit-and-Push, honored.

### Chapter 7 - 2026-08-28
Completed: S6 (security model, ledger corrections, docs), plus `plugins/claude-kit/hooks/usage.js`,
the read CLI that S8's prose needs. **S5 and S8 are PARKED** by the operator's decision, recorded
against S5 above. The effort is not complete and `finishing-work` has not run.
Implemented By: main session for every document; `implementer-opus` for the CLI; `implementer-fable`
for the combined formatting and CLI fix round.
Metrics: one document review battery (prose-reviewer plus one blind-reader persona) and one blind
code review, three reviewers in one dispatch. Two implementer dispatches, one fix round.
NEEDS_CONTEXT 0. Escalations 0. Advisor on (opus), not consulted this Chapter. Gate at close: 515
pass, 0 fail, from a 412 baseline at the effort's start.

Decisions / Surprises:
- **S8 was unimplementable as specced and nobody noticed until execution.** It told the orchestrator
  to read the Fable weekly percent and nothing could: `usage-lib.js` is a module with no CLI and the
  store path carries a hash of the resolved credentials directory. The operator's call was to build
  the read path, so `usage.js status` now exists, mirroring `memory.js`'s split from `memory-lib.js`.
- **Running that CLI made kit code answer the endpoint for the first time**, which also created the
  store on this machine and, fourteen minutes after I had written into the ledger that the store did
  not exist, falsified my own claim. The prose reviewer caught the contradiction between two
  documents in one changeset. Both now rest the claim on the config gate in the code, which is
  checkable, rather than on an absence.
- **The blind reader could not run the document's only self-check command.** I had written
  `node "$CLAUDE_PLUGIN_ROOT/hooks/usage.js" status`, a hook-context variable that is unset in a
  shell, so the section sold as "pick thresholds by seeing what the current ones would do" was
  unrunnable by its reader. Worse for a later session: it is unset in a model's Bash tool
  specifically, so S8 would have inherited a dead command. A further check found `usage.js` is
  absent from the installed plugin cache, so the command genuinely cannot run from the installed
  payload until the next `/plugin update`, which is the activation boundary the document never
  stated and now does.
- **The numeric rendering rule was wrong three times, in three directions.** `Math.round()`
  reproduced a warn printing numbers that asserted a barrier. `Math.floor()` fixed that case and
  left the class open. A reviewer then proposed flooring the percent and ceiling the threshold,
  which I verified repairs both and breaks the opposite direction: percent 95.95 against barrier
  95.9 IS a barrier and would print "at 95%, at or past the barrier of 96%". No rounding direction
  survives, because two independently rounded numbers cannot be relied on to compare the way their
  originals do, and the text puts both in one sentence and invites exactly that comparison. The fix
  is faithful one-decimal rendering, and it is now **one exported function in `usage-lib.js`** rather
  than three hand-copies, because a hand-copied contract in this same effort had already drifted.
  The property test pins the invariant all three rules failed rather than pinning the arithmetic.
- **A reviewer's proposed fix being wrong is worth recording alongside the reviews that were right.**
  Nine reviewers across this effort found real defects; this is the first whose remedy would have
  introduced one, and it was caught by testing the proposal rather than by reading it.
- **The confidence-overclaim class recurred a third time, after two retractions of it.** I wrote
  "PostToolUse rides the same tool loop" into `security-model.md` as settled fact while the hook's
  own header, the spec and `usage-awareness.md` all correctly call it an inference. Marked as
  inference now, in the document a reviewer reads first.
- **One epistemic error I would have defended.** I wrote "verified live, with `usage-nudge.js` firing
  on every tool call and the store still absent". An absent store is equally consistent with the hook
  firing and returning early and with the hook never firing, so the observation corroborates the
  config gate rather than establishing what "verified" claimed. Restated as observed.
- **Two spec-enumerated S6 deliverables were simply missing** from the section I wrote: the
  deliberate second-poller decision, and the three-profile stakes in the ledger correction. Both were
  named in the spec's own list.
- **`severity` was observed leaving `normal` for the first time**, which answers an Open Question
  above: weekly all-models read `warning` at 78% while two other windows at 43% and 36% read
  `normal`. Recorded because nothing in this spec branches on it and a later burn-rate effort might.
- The enumeration class landed twice more, both caught by others: `architecture.md` said the kit
  reaches four things outside itself while the next paragraph, edited by this effort, named the
  fifth; and `README.md`'s payload inventory omitted `usage.js` while its test-suite sentence,
  edited in the same changeset, counted five components.

Review Findings: prose review 1 Critical, 12 Major, 13 Minor (CHANGES_REQUIRED); blind-reader 1
Critical, 4 Major, 4 Minor plus five comprehension gaps; blind code review 5 Major, 6 Minor
(CHANGES_REQUIRED). All Criticals and Majors addressed. The document was rewritten whole rather
than patched, both because the fix list reached twenty items on one file and because the prose
reviewer flagged bolded lead-ins on twelve of roughly twenty paragraphs as a machine-prose tell of
frequency rather than of any single line. Minors accepted with reasons recorded: per-field config
fallbacks are not flagged by `status` (that is `normConfig`'s stated policy), and the `barrier: 0`
staleness edge from Chapter 6.

**The cause distribution over the whole effort, stated once because it is the most useful thing in
these Chapters.** Across S1 through S8, nineteen reviewer dispatches found every Critical and every
Major in spec prose, dispatch briefs, living-doc claims, or main-thread fixes. Not one originated in
an implementer's code. Implementers corrected the brief six times and were right every time, and one
of them found an enumeration defect the orchestrator had missed. Three claims asserted as verified
against the binary were retracted, the third written after the first two had already been retracted.
The reviewers confirmed, unprompted and repeatedly, that the hard parts were right first time: both
staleness protocols, both emission doors, precedence across fifteen-plus allow-on-doubt branches, the
credential properties, and the text contract byte-for-byte.

Next: S5 and S8, in a fresh session with the `writing-skills` arms budgeted, then `finishing-work`
over the whole effort. The first armed run should answer the standing question recorded in S3 and in
`usage-awareness.md`, and that document names the concrete check.
Commit Model: Commit-and-Push, honored.

### Chapter 8 - 2026-08-29
Completed: no section. **The feature was armed for the first time and fired for real**, which found
a live defect no review had; that defect is fixed here. S5's arm was attempted and abandoned, and
what it produced is recorded because it is worth more than the rule it was testing.
Implemented By: main session throughout. **No fresh-context review ran on this Chapter's code
change**, because the wind-down instructs against further subagent dispatch and the operator chose
to spend the remaining window on findings rather than arms. Named here per `executing-work`'s rule
that a session which cannot dispatch says which checks went without fresh context.
Metrics: two RED reps, both discarded as out-of-state. NEEDS_CONTEXT 0. Escalations 0. Advisor on
(opus), not consulted. Gate: 516 pass, 0 fail.

Decisions / Surprises:
- **The first armed run found a flood defect in about ninety seconds, and it is the kind of thing
  no amount of review reaches.** The endpoint returns `resets_at` at microsecond precision that
  VARIES between reads of the same window: `.171560`, then `.211728`, then `.100701` for one
  2026-08-30T17:00:00 instant. `usage-nudge.js` keys its once-per-window dedupe on that string, so
  every cache refresh minted a new key and re-emitted the wind-down. Near a barrier the poll floor
  is 120 seconds, so it would have fired every two minutes for as long as the window stayed warm,
  which is precisely the flood the marker exists to prevent. Nine reviewers and 516 tests had not
  found it, because every fixture in the suite uses a stable hand-written timestamp. Fixed at the
  parse door in `windowFields`, the one point both the wire reader and the cache reader pass
  through, with the regression test watched red first.
- **Everything else about the first armed run worked exactly as designed.** It named the correct
  window, took the weekly branch and correctly instructed NOT to arm a resume, arrived mid-turn
  through `PostToolUse` `additionalContext`, and arrived in the orchestrator's own context. That
  last is partial evidence on the standing inference, and only partial: it fired on a main-thread
  tool call, so the subagent half is still unverified.
- **A third emission arrived after the fix and was not a failure of it.** The running hook comes
  from the installed plugin cache, which predates the edit, so the fix is inert until the next
  `/plugin update`. That is the activation boundary `usage-awareness.md` warns about, confirming
  itself within minutes of being written.
- **S5's arm never once put a rep in the state the rule guards, and the reason is structural rather
  than bad luck.** `writing-skills` requires an isomorph fixture wherever this repo already answers
  the fixture's question, and separately requires pointing a rep at an explicit repo path because
  reps load skills from the lagging plugin cache. A rep holding that path holds the whole repo, so
  it can read the very feature the isomorph imitates. Both reps did exactly that, one running
  `usage.js status` against the real store and one reading `usage-nudge.js` directly, and both
  correctly refused the fake. The skill's own sentence offers the escape, handing a fixture copy and
  diffing it at dispatch, but nothing says when that branch is mandatory rather than optional. Cost:
  about 86 minutes and 286k subagent tokens for zero in-state reps.
- **My first fixture carried six defects and the rep spent its whole run on them**, which is a
  failure mode the skill does not cover: a fixture's internal inconsistencies are more salient to a
  capable rep than the thing under test. A `Commit-and-Push` header over a tree with no `.git`,
  sections marked Done against a 12-byte placeholder, a missing Chapter 1, and a wall-clock claim
  the rep checked and disproved.
- **The arm produced more value than the rule it was testing**, which is the finding to carry
  forward rather than the individual defects. Both reps independently derived a discriminator for
  telling a genuine wind-down from injected prose, which nothing in the kit had stated and which is
  now S5's most valuable item; one hit the `docs-write-guard` conflict in step 3 for real; and the
  protocol gap above is a kaizen item against `writing-skills` itself.

**Addendum, same day: the first fix was insufficient and the live run caught that too.** Truncating
the fraction stabilised the microseconds and the wind-down fired again within minutes, this time
because consecutive reads returned `17:00:00` and then `16:59:59`. The reset instant is COMPUTED per
response rather than read off a fixed boundary, so it drifts across the second and, at these
particular instants, across the minute at once. No truncation absorbs that, because truncation puts
its danger zone exactly on the boundary these values sit on. The key now buckets the instant by
rounding to the nearest five minutes, which is chosen against the drift rather than the calendar:
the closest two successive resets of one window can be is the session window's five hours, so no
bucket under that can collide, while the observed instants sit far from a 2.5-minute rounding
boundary. Display keeps second precision, because the resume is armed against the displayed value
and a second is immaterial there. Second red-first test added.

Also fixed here, from the same arm: step 3 of the wind-down and step 2 of the barrier deny now carry
a branch for a session with no section in flight, or one that cannot write to `docs/`. A RED rep hit
both for real. The deny reason measures 1412 characters over 11 lines afterwards, well inside its
budget.

Review Findings: none dispatched, for the reason in Implemented By. Both code changes carry
regression tests watched red before the fix and the full gate green after, and nothing else. Nine
text fixtures were reddened by the step-3 change and updated, which is what confirms they pin the
contract rather than paraphrasing it.

Next: S5 and S8 remain parked and the plan stays In Progress. `finishing-work` has not run and
should not until they land or are formally descoped. Four kaizen notes are queued, two of them
against `writing-skills`' own arm protocol.
Commit Model: Commit-and-Push, honored.

### Chapter 9 - 2026-08-30
Completed: **S9 (the warn band becomes a working state)**, specced and built in one pass at the
operator's request.
Implemented By: main session. Execution mode `main` as specced, because this changes the MEANING of
a state that three files and the text contract all read, which is design-entangled rather than
briefable. **No review ran, at the operator's explicit instruction**, which is the second Chapter in
a row to ship code that way and is named here rather than left to be inferred.
Metrics: no dispatches. NEEDS_CONTEXT 0. Escalations 0. Advisor on (opus), not consulted. Gate at
close: 517 pass, 0 fail.

Decisions / Surprises:
- **The design came from the operator, and it corrected a wrong turn of mine.** I had reached for
  the Fable ratchet as the model, capping model tier. That conflates two different things: the Fable
  window is about WHICH model, and this is about HOW MUCH work. The operator rejected that and
  proposed the right shape instead, that a warn should let work continue on the main thread and only
  refuse the expensive part.
- **The deny moved down from `barrier` to `warn` mechanically, not just in prose.** Dispatches are
  the expensive thing by a wide margin (this effort's own Chapters record implementers at 130k to
  290k tokens and reviewers at 100k to 230k), so leaving the saving to compliance would have left
  most of it on the table. A warn now denies `Agent` and `Task` with its own reason, and the barrier
  still outranks it.
- **The constraint that makes the band safe is the one worth remembering:** a session in the warn
  band must not CLOSE work that would normally take review. Review is dispatched too, so it is
  unavailable exactly then, and every Critical and Major in this effort was found by a reviewer
  rather than by the orchestrator. Without that clause the change would trade tokens for unreviewed
  work while nobody is watching.
- **The resume attaches to stopping rather than to the threshold**, which is the operator's question
  and the right answer. A warn no longer ends the turn, so there is nothing to resume from when it
  fires; the run stops later, at a boundary, and arms then. The session window arms because it
  resets in hours; the weekly window notifies because it does not. The "or immediately if that
  instant has already passed" clause added earlier covers a run that worked on for hours first, and
  it turned out to be load-bearing for this design rather than the edge case it was written for.
- **A test the blind reviewer made me add in Chapter 6 caught this change**, which is the most
  satisfying thing in this Chapter. "A warn state allows dispatch: only a barrier denies" failed the
  moment the predicate widened. That is a pin doing its job on a deliberate change rather than a
  regression, so it was rewritten to pin the new behavior with a comment saying what it used to
  assert and why that inverted.
- Nine warn fixtures reddened on the text change and were updated. The barrier fixtures use different
  step numbers, so the renumbering could not reach them.

Review Findings: none, per Implemented By. What stands in for it: the widened deny was watched red
first, every allow-on-doubt branch still passes untouched, and the new deny reason was driven
end-to-end through the real hook against a temp store rather than asserted from the source.

**What this Chapter does not settle.** The warn band's whole value rests on a session actually
continuing usefully in the main thread rather than treating the deny as a stop, and nothing here
tests that: it is model behavior under an instruction, which is what `writing-skills` arms exist to
measure and what S5's abandoned arm failed to stage. The first run that hits a warn with real work
outstanding is the evidence, the same way the first armed run found two defects review had not.

Next: S5 and S8 remain parked. The plan stays In Progress and `finishing-work` has not run.
Commit Model: Commit-and-Push, honored.
