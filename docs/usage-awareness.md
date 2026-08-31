# Usage awareness

The kit can watch this account's Anthropic usage windows and wind an unattended run down before
it crosses a boundary you choose. It is off until you write a config file, and this document is
how you turn it on, what happens when you do, and what it will not do for you.

It exists because on a Team seat with overage enabled nothing returns 429 at the session limit.
Requests are served and the account spends, so the harness's own `autoContinueAtUsageLimit`
never fires and there was no control at any threshold. So this is a spend control at a threshold
you pick, not a retry control.

## Before you arm it: two prerequisites

**The hooks have to be in the installed plugin, not just in this repository.** A session loads
the payload from the plugin cache, so a hook committed here is inert until the installed plugin is
updated. The kit's own instruction for that is `/plugin update claude-kit`, which is what `README.md`
prescribes and what this document means everywhere it says "the next `/plugin update`". On this
machine the marketplace is named `daren`, so `/plugin marketplace update daren` followed by
`/reload-plugins` does the same job in two steps and is what you want if the marketplace itself has
moved; a blind reader of an earlier draft could not follow that step at all, because it left the
marketplace name as an unfilled placeholder and named three commands for one action. Nothing warns you about the gap, and it is
wide enough to matter: a hook can be committed, tested and documented while every session on the
machine still runs the previous payload. If the behaviour you are reading about here does not
happen, check that before you check anything else.

**The reader needs a credential it can find.** It reads `claudeAiOauth.accessToken` from
`$CLAUDE_CONFIG_DIR/.credentials.json`, falling back to `~/.claude/.credentials.json` only when
that variable is unset. If it finds nothing usable, every hook allows and stays silent, which is
the same outcome as the feature being off. Run the status command once before you rely on it: a
reading with real percentages is the proof that the credential resolved.

## Arming it

Create `~/.claude-kit-usage/` if it does not exist and hand-author `config.json` in it. No kit
code ever writes that file.

```json
{
  "enabled": true,
  "session":   { "warn": 80, "barrier": 95 },
  "weeklyAll": { "warn": 85, "barrier": 95 },
  "fableRatchet": 85
}
```

| Field | Default | What it does |
|---|---|---|
| `enabled` | `false` | Anything other than literal `true` is off, and off is the ordinary case. |
| `session.warn` | `80` | Percent of the 5-hour window at which subagent dispatch starts being refused. The run does not stop; it continues in the main thread. |
| `session.barrier` | `95` | Percent at which subagent dispatch is denied outright. **The refusal itself is identical at both**: what differs is the
instruction the refusal carries, and whether the run is expected to continue. Nothing about the deny
gets stronger at the barrier. |
| `weeklyAll.warn` | `85` | The same, for the weekly all-models window. This is the threshold most worth tuning, because the weekly window is the one with no automatic resume. |
| `weeklyAll.barrier` | `95` | The same. A weekly stop deliberately does not arm a resume. |
| `fableRatchet` | `85` | Percent of the Fable-scoped weekly window above which the kit stops routing work to Fable. |

Every field is optional and defaults are applied one field at a time, so `{"enabled": true}` on
its own is a valid config that uses all the numbers above. A file with one bad value keeps the
values it did state.

**Both hooks read this file on every invocation**, so a session already running picks up a change
at its next tool call, and setting `enabled` back to `false` disarms it the same way. Nothing
caches your policy for the life of a session, and you do not need to restart a run to arm or
disarm it.

The file's own permissions are yours to choose; the reader does not check them. The `0700` and
`0600` modes described under The store below are what kit code sets on the files it creates, and
they are creation-time properties rather than invariants, since `mkdir` does not tighten a
directory that already exists.

## Confirming it is on

`status` prints `enabled: true` when your file is being read, and appends
`[advisory: the feature is disabled, ...]` to its two policy lines when it is not. That marker's
presence or absence is the check. If your file exists but could not be parsed, the command says
so on its own line rather than leaving you to infer it from defaults.

## Three things that will bite you

**A value the reader cannot use is discarded, and the default takes its place.** A threshold
written as a string (`"95"`), as a negative, or as anything JSON does not parse to a finite
number is treated as though you had written nothing at all, silently. The defaults are more
conservative than most values you would type, so a mistyped relaxation gives you a stricter
threshold than you intended, not a looser one. That is the safe direction, and it is still a
surprise.

**An out-of-reach barrier no longer disables the deny.** `{"session": {"barrier": 999999}}` is
honored exactly as written, so that barrier never fires, but `session.warn` is independent, still
winds runs down at 80, and since the wind-down band shipped it **also refuses subagent dispatch at
that warn**. So raising the barrier alone now changes only which instruction the deny carries, not
whether dispatch is denied. To switch a window off, put both its warn and its barrier out of reach,
or set `enabled: false` to switch the whole feature off. This is the likeliest trap here, because
raising the barrier alone reads like it should turn the window off, and until recently it did
disable the deny.

Watch the size of the number you use for that. JSON parses `1e999` to `Infinity`, and the two
thresholds then take different paths, so write neither of them that way. A **barrier** of `Infinity`
is treated as absent and falls back to 95, which re-arms the window you were trying to switch off. A
**warn** of `Infinity` is admitted deliberately rather than treated as absent, by an explicit door in
the reader, and then stands down because it sits above its barrier. Both outcomes are as described;
what is worth knowing is that they come from two different rules, so you cannot reason from one to
the other. An earlier draft of this paragraph derived the warn's outcome from the non-finite rule,
which would have predicted the opposite (a fall back to the default 80, and an armed wind-down). Something like `999999` is large enough: no
percent can exceed 1000, and `status` prints any threshold past that as `never fires`.

**A warn above its own barrier stands down rather than firing.** The wind-down exists to precede
the deadline and the barrier is tested first, so a warn past it could never be reached. Rather
than substituting a stricter value you did not write, that trigger simply does not fire.
Deliberate, and silent. Note that `warn` is compared against whichever barrier is in force, so
writing `{"warn": 96}` alone stands the warn down against the default barrier of 95.

## What the percentages mean

They are the fraction of each window's allowance consumed, as the endpoint reports it, not the
fraction of the window's time elapsed. The reader passes them through unchanged and renders them
faithfully to one decimal place, so a threshold and a percent printed side by side always compare
the way the underlying numbers do.

Which window's crossing actually costs money is only partly established. That requests are served
on overage rather than rejected was established for the **session** limit. Whether the weekly
all-models limit behaves the same way has not been checked, so treat the weekly thresholds as
protecting against an unknown rather than against a measured cost, and do not read the session
explanation as covering both.

## What happens when it fires

**A warn is not a stop.** From the warn threshold upward the kit refuses subagent dispatch, and
the run carries on in the main thread, which costs a fraction of what a dispatch does. The session
is told to finish and stage the section in flight, keep working on what needs no subagent
(documentation, the plan doc and its Chapters, investigation, staging), and then stop at that
boundary rather than opening another section.

One constraint makes the rest of that safe, and it is the reason the band is bounded rather than
open-ended: **the session must not close work that would normally take review.** This kit dispatches
review as well as implementation, so a session that cannot dispatch cannot review, and landing
unreviewed work across a wide band while nobody is watching is the trade the threshold exists to
avoid.

**A barrier is a stop.** The section in flight is staged rather than finished, and the run ends
there.

Either way, when the run does stop it writes the Chapter and then splits by horizon: the 5-hour
window arms a one-shot resume, and the weekly window notifies instead. The resume attaches to
stopping rather than to the threshold, so a run that worked on for two hours under a warn arms its
resume when it finally stops. If the reset instant has passed by then, the instruction says to
resume immediately.

**What actually does the arming, since a one-shot that does not fire does not come back.** The
session creates a scheduled job with `CronCreate`, which is a session-scoped tool: the job lives in
that session's memory, fires only while the session is idle (which is exactly the paused state), and
dies with the session. The hooks cannot name that tool themselves, because a hook has no way to know
what a given session holds, so the instruction says "a scheduled job" and `executing-work` carries
the four details that decide whether it fires. Three of those matter to you as the operator. The cron
expression is local time while a reset instant is UTC. A one-shot landing on `:00` or `:30` fires up
to 90 seconds EARLY, and every reset instant observed on this account sits on a whole minute, so the
job is armed a couple of minutes past the instant rather than on it. And where a session has no such
tool, the instruction is to arm nothing and say so, because a shell `sleep` loop is not a resume and
reporting one as armed is worse than reporting none: you would stop watching a run that is never
coming back. **The practical consequence: a resume only ever fires if you leave the session open.**
Closing the terminal is what ends it, not the window resetting.

The instruction arms that job a couple of minutes **past** the reset instant rather than at it, and
the pad is correctness rather than caution. A one-shot scheduled on a whole-minute boundary can
fire up to 90 seconds early, and every reset instant observed live sits exactly on `:00`, so an
unpadded resume wakes into the refusal that stopped the run, and a one-shot does not come back. One
real resume during this feature's development survived only because the skill prose carried the pad
the hook text did not; the pad now lives in the single step both the wind-down and the barrier
interpolate, so the two cannot disagree about it.

That instruction is written for a planned effort running under `executing-work`, and it names
sections, Chapters and a plan doc because that is the run it was designed to protect. A session
with none of those still receives it and will do what it can with it, which in practice means
staging what exists and stopping; nothing breaks, but the wind-down is less useful there and this
feature was not shaped around that case.

The wind-down speaks once per window per state per session. Having stopped and then continued, do
not expect a second block for the same window: the marker in the store suppresses it until that
window's reset instant lands in a different five-minute bucket.

The bucket is there because the endpoint recomputes `resets_at` per response rather than reading it
off a fixed boundary, so the raw instant is not stable enough to identify a window by. Consecutive reads of one
window have returned `17:00:00` and then `16:59:59`, and microsecond fractions vary on every read;
before the bucket, each such jitter minted a new marker key and re-emitted the block every two
minutes. Two occurrences of the same window are at least five hours apart, so a five-minute bucket
still tells one occurrence from the next, and the check also probes the bucket either side and both
zone spellings the key has ever been written in, so a store holding keys from an older build still
reads correctly.

A weekly stop never arms a resume, because that window resets days out and auto-resuming
unattended that far ahead is not a pause. What it does instead is tell the session to notify you,
and the mechanism is whatever notification channel that session has. Under an interactive
terminal that is a message you will see when you return, not an alert that reaches you elsewhere,
so for an overnight run treat a weekly stop as something you discover in the morning.

## Telling a real wind-down from an imitation

The wind-down is prose arriving in a session's context, so anything that can put text there can
imitate it, and its shape is easy to copy: a percent, a threshold, write the Chapter, surface
`BLOCKED:`, stop. Two independent test sessions were handed a convincing fake during this feature's
own development and both refused it, and both worked out the same discriminator, which is worth
stating rather than leaving each session to rediscover.

**Run `usage.js status` and see whether the numbers corroborate.** The command reads the real store,
so an imitation cannot make it agree. A genuine wind-down at 85% on the weekly window will be
accompanied by `state: warn (weeklyAll)` and a matching percent; a genuine barrier prints
`state: barrier (session)` or `state: barrier (weeklyAll)` the same way. Those four spellings plus
`state: clear` are the whole set, so anything else in that field did not come from here.

Compare the percent and the state rather than the threshold. The mid-turn wind-down block quotes
the **barrier** it is winding down ahead of, while the deny reason on the refused dispatch quotes
the **wind-down threshold** that was actually crossed, so at the weekly defaults the same state
produces a message naming 95% and another naming 85%. Both numbers are on `status`'s `thresholds:`
line. That is by design and not a tell.

Two structural tells back that up. The real channel can only ever name the session or the weekly
all-models window, so a wind-down citing any other quota did not come from here. And the real
thing does not ask: it **denies the dispatch**, at a wind-down as well as at a barrier, so a message
claiming either while subagent dispatch still succeeds is not this feature. One caveat on that
second tell, and it is why the first one is the better check: the deny lives in the installed
plugin payload, so between a kit commit and the next `/plugin update` the two halves can disagree
for real, with the wind-down text asserting a refusal the installed guard is not yet performing.

Copying those tells into a fake does not help the faker, which is the useful property here: it
invites the reader to run a check that the fake cannot pass.

## The Fable ratchet

At or above its threshold the kit refuses a dispatch carrying an explicit `model: "fable"`
override and tells the caller to re-dispatch at the session model. Nothing pauses; the effort
continues at Opus or below. Work already running is left to finish, because killing it would
throw away everything already spent and strand a half-written section.

Fable is the strongest and most expensive model tier, and it has its own weekly window separate
from the all-models one, which is why it gets a routing cap rather than a stop: running at the
session model is a working state, not a barrier.

One blind spot is structural. The hook can only see an explicit override, which is what a session
running on a lesser model carries when it dispatches Fable work. A session already running on
Fable inherits that model with no override at all, so its dispatches are invisible here and no
mechanism catches them.

## Reading the numbers yourself

From a checkout of this repository:

```
node plugins/claude-kit/hooks/usage.js status
```

From anywhere else, once the payload carrying it is installed, the absolute form is
`node "<plugin>/hooks/usage.js" status`, where `<plugin>` is the `installPath` recorded for this
plugin in `<configBase>/plugins/installed_plugins.json`. That is the same placeholder convention
the memory tier's CLI uses.

```
kit usage status
enabled: true
age: 0s, freshly fetched, poll cadence 600s, deny budget 120s (window states only; the Fable ratchet rides the cadence)
session: 44.6%, severity normal, resets 2026-08-28T15:00:00Z
weeklyAll: 55%, severity normal, resets 2026-09-01T00:00:00Z
fableWeekly: 66.2%, severity normal, resets 2026-09-01T00:00:00Z
thresholds: session warn 80% barrier 95%, weeklyAll warn 85% barrier 95%, fableRatchet 85%
state: clear
fableRatchet: false
```

Three numbers ride the `age` line and each is told what it governs, because they answer different
questions: the age is what the block stands on, the poll cadence is the reader's advice for its next
fetch and is also the freshness the Fable ratchet acts on, and the deny budget is the freshness the
two window states require of a refusal. What it costs below carries why those two differ.

When a fresh read fails but a cached one exists, it serves the cache and says so rather than
refusing to answer:

```
age: 4500s, stale cache (fresh read failed: timeout), poll cadence 600s, deny budget 120s (window states only; the Fable ratchet rides the cadence)
```

When there is neither, it prints one line, `usage: no reading available (<reason>)`, and exits 0
so a compound command does not read a missing reading as a broken step. A bad argument is
different: that goes to stderr and exits non-zero, because it is a caller's mistake rather than an
answer.

Two deliberate omissions. It does not print the overage spend figure, and it does not print the
reading log, because a model running this mid-effort would put account dollars and a usage history
into its own context on every invocation. Read the store directly for those.

`status` also answers whether or not the feature is armed, which is the one path in the shipped
plugin that reaches the credential and the network without `enabled` being true. Refusing to say
what your usage is because the control is disarmed would be useless.

**It is no longer reached only by someone typing it, and that changed on 2026-08-30.** The Fable
ratchet rule in `executing-work` now sends the orchestrator to this command before any dispatch that
will carry Fable, so on an **armed** install the credential path is exercised during an ordinary run
rather than only on demand. On a **disabled** install nothing changes: that rule does not apply and
the session does not run the command, so a default install still reaches the endpoint only when you
ask it to. The distinction is worth knowing precisely, because arming the feature is also the moment
the kit starts reaching your credential on its own schedule rather than on yours.

## The store

`~/.claude-kit-usage/`, two levels. Kit code creates directories `0700` and files `0600`.

| Path | Holds | Written by |
|---|---|---|
| `<profile>/usage.json` | the cached normalized reading | `usage-lib.js` |
| `<profile>/usage.lock` | the per-failure-class backoff | `usage-lib.js` |
| `<profile>/readings.log` | one line per successful fetch, bounded at 5000 lines | `usage-lib.js` |
| `<profile>/nudged.log` | the wind-down dedupe marker, reaped at 8 days and capped at 5000 lines | `usage-nudge.js` |
| `config.json` | your thresholds, in the shared parent | you, by hand |

`<profile>` is keyed on the resolved credentials directory (a sanitized directory
basename plus the first eight characters of a sha256 of the resolved path, so it looks like
`<config-dir-name>-<8 hex characters>`; list `~/.claude-kit-usage/` rather than trying to construct it), because usage is per-account and a
machine running several `CLAUDE_CONFIG_DIR` profiles would otherwise serve one account's
percentages as another's. Your `config.json` sits in the shared parent instead, since thresholds
are a policy preference rather than an account fact and switching profiles should not switch your
policy with them.

`readings.log` accumulates this account's percentages and overage spend over time, and nothing
emits it to the model. That invariant matters most to the effort most likely to break it, a later
burn-rate projection, which is exactly the work that would want to consume this file.

`nudged.log` is the only file here keyed on anything the harness supplies, and it holds the session
id as a JSON value rather than as a path component, so no session id ever reaches a filename. It is
reaped only on the tool call that actually emits a block, which keeps the ordinary silent path down
to one config read.

## What it costs

One cost belongs at the top because this document introduced it and an earlier draft left it out.
**On an armed install, `executing-work` sends the orchestrator to `usage.js status` before any
dispatch that will carry Fable.** That is a process start, a credential read, a network round trip
and about ten lines into the session's context, once per such dispatch. On a disabled install that
rule does not apply and the command is not run. The barrier hook's own per-dispatch cost sits
alongside it: at or above a wind-down threshold it re-reads before refusing, so a refused dispatch
can carry one fetch of its own.

Disarmed, the wind-down hook still runs after every tool call, so you pay one Node process start,
one small capped file read, and the realpath plus hash that key the store, per tool call. That was
accepted rather than overlooked: narrowing the matcher would let a read-heavy stretch of a run pass
a barrier unnoticed. No cache read, no credential and no network on that path.

Armed, one tool call per staleness window also absorbs the reader's request deadline, up to 6
seconds. The staleness window is 600 seconds, tightening to 120 within ten points of a
barrier, so that cost lands about once every ten minutes and more often near a deadline.
**A refusal on a window state is held to a stricter standard than the poll cadence. The Fable
ratchet is not, and the asymmetry is deliberate.** A dispatch refused by the wind-down or the
barrier is never decided on a reading more than 120 seconds old: the guard fetches once more before
it refuses if it has to, which costs almost nothing because it is paid only when a dispatch is
about to be refused, and it is what stops the guard refusing work for minutes off a cache that
predates the window's own reset. A ratchet refusal is held out of that clamp and rides the
600-second poll cadence instead, so a dispatch carrying a fable override can be downgraded on a
reading up to ten minutes old. The reason is that the Fable window has no barrier, so no proximity
arm ever tightens its cadence, and holding the cheapest predicate to 120 seconds forced a live
fetch on every override dispatch whose cache was over two minutes old: a 429 earned there locks the
reader for its retry-after, a held lock reads as a reader failure, and every reader failure allows,
so the cheap predicate's polling can blind the expensive ones. The trade is also weighed by what
being wrong costs, since a wrong ratchet deny costs one model downgrade while a wrong barrier deny
wedges an unattended run. `usage.js status` prints both numbers and says in the line which governs
which. Worth knowing before you rely on it: the plan record for this effort still describes the
120-second clamp as covering every refusal uniformly, and names the ratchet refusing on
599-second-old data as a reproduced defect the clamp closed. As built it does not cover the ratchet,
and the suite pins that on purpose: a ratchet refusal on a 300-second-old cache, with no network
call made to reach it, and an allow only once the cache passes the reader's own 600-second budget
and there is nothing left to serve.

One more armed cost, and it is a delay rather than a fetch. Once the wind-down has spoken for a
window and state, a session parked in that band stops paying the 120-second re-read for it, because
the emission it would confirm is already on record and cannot be repeated. What that costs is
timeliness of the stronger message: an escalation from wind-down to barrier is discovered when the
600-second cadence refreshes rather than at 120 seconds. The mechanical protection is unaffected,
since the barrier guard still re-reads before any refusal; only the advisory text is late, and it
arrives at a run already told to wind down.

## Limits worth knowing before you rely on it

The kit cannot force a stop. Denying subagent dispatch stops new expensive work, but the main
thread keeps spending, and what actually ends a run is the `BLOCKED:` instruction, which is prose
a model follows. This feature permits and encourages a stop; it cannot compel one. It also
deliberately does not try by denying `Write`, `Edit` or `Bash`, which would wedge the session.

A resume dies with the session. The one-shot job that a warn or a barrier arms lives in that
session's memory, so closing the terminal takes the resume with it.

Every hook here fails open, and the cost of that is that the control is silently absent rather
than wrong. Stale data, an unreadable credential, an expired token, a rate limit, an unparseable
config and any internal error all allow, and a window whose percent the endpoint did not report
can never produce a barrier. A wrong deny would wedge an unattended run with nobody present to
clear it, so every branch points the allowing way.

The control can go dark exactly when spend is highest. There is no request coalescing, so several
concurrent subagent dispatches on a cold cache each issue their own request, and a 429 then locks
the reader for its retry-after, observed at roughly 54 minutes. Coalescing was built during this
effort and removed after it was reproduced bricking the store two separate ways.

Nothing alerts you to a dark period. The evidence after the fact is a gap in `readings.log`, which
records only successful fetches, and the presence of `usage.lock` while a backoff is in force.
`status` reports the age of the reading it used, which helps only if someone is at the keyboard.

Deleting `<profile>/usage.lock` clears a backoff, since the reader treats a missing or unreadable
lock as absent by design rather than waiting for someone to repair it. That is the one manual
recovery here, and it is worth using sparingly: the horizon a rate-limit lock holds is what the
endpoint itself asked for, so clearing it early asks a throttled endpoint the same question again
and can earn a longer one.

The endpoint is an undocumented path and `anthropic-beta: oauth-2025-04-20` is a date-stamped beta
header whose stability is not established. Its own rate limits are unknown. An empty bearer token
answers 429 with a long retry-after rather than 401, so a reader pointed at a profile whose token
is empty does not fail loudly, it self-inflicts backoff that looks exactly like throttling. That
is why an empty token is never sent.

One inference has not been verified, and it is not entirely fail-open. Both hooks assume a
subagent's tool call carries an agent identity in its payload. `usage-nudge.js` uses that to
return early, so if the assumption is wrong it either speaks to a subagent or lets a subagent
consume the orchestrator's one wind-down. `usage-barrier.js` uses it to choose between two
instruction texts rather than to stay silent, so if the assumption is wrong a nested dispatch gets
an instruction written for the orchestrator, telling it to write a Chapter and arm a resume that
are not its to write. The deny itself stays correct either way; the instruction may not. The
evidence for the assumption covers `PreToolUse` only, in `docs-write-guard.js`; that `PostToolUse`
behaves the same way is inference.

The armed runs have now happened (2026-08-29 onward) and settled half of it: the wind-down fired in
the orchestrator's own context on a main-thread tool call. The subagent half is what remains. To
settle that: after a run that dispatched subagents, check whether
`<profile>/nudged.log` gained a line whose key holds the session id you expect, and whether the
wind-down text appeared in the orchestrator's own transcript rather than a subagent's. A line
keyed to the session with the text in the orchestrator is the assumption holding.

## Where the rest lives

- `security-model.md` for the credential path, the trusted channels these hooks write into, and
  why every one of them fails open.
- `plans/kit-usage-awareness_spec_v1.md` for the design record, including several mechanisms that
  were built and deliberately removed, and the claims this effort had to retract.
- `kit-adoptions.md`, candidate 1 of the 2026-08-26 pass, for how the problem was originally
  framed and which parts of that framing no longer hold.
