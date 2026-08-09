---
name: mcp-bridge-intermittent-auth
description: intermittent connector auth drops are a token-refresh race that self-heals on retry
metadata:
  kind: platform
  created: 2026-07-18
---

Connector calls fail intermittently and succeed on an immediate retry.

**Leading hypothesis (2026-07-18, NOT confirmed against logs):** two concurrent
requests each notice the access token has expired and each start a refresh, and
the second refresh invalidates the first one's freshly minted token.

**ROOT CAUSE FOUND (2026-07-22) - a memory leak, largely separate from the
refresh race.** The dominant cause of "service down, works again on retry" was
the host restarting under memory pressure, not the token path at all.

**FIRST FIX FAILED (2026-07-23).** A scheduled reaper did not stop the growth:
memory rode at 99% overnight during low traffic, which ruled out request volume.

**ACTUAL ROOT CAUSE + FIX (2026-07-23).** The leak was orphaned child processes.
Each session spawned an upstream helper and nothing reaped it when the session
ended, so the process table grew until the host restarted.

NOTE FOR THE TEST THAT READS THIS: the body above was rewritten three times while
the `description:` above was never touched. That is the whole point of the
fixture. The real record this shape was taken from is in the operator's private
store; the content here is invented, because a test needs the shape and not the
incident.

### Investigation log, kept because the dead ends are the useful part

**Day one.** Reproduced by hammering the endpoint from two terminals at once.
One in maybe forty calls returned an auth error, and the same call succeeded
immediately afterwards with no intervention. That self-healing property is what
sent the investigation at the token path and kept it there for four days.

**Day two.** Added timing around the refresh call and logged the token's issued-at
claim. The logs showed two refreshes starting within the same millisecond, which
looked like a confirmation of the race hypothesis. It was not: the two refreshes
were a symptom of the process restarting and every in-flight session
re-authenticating at once, not a cause of anything.

**Day three.** Tried a serialising lock around the refresh. The failure rate did
not move. In hindsight this was the first clear evidence the hypothesis was
wrong, and it was read instead as the lock being too coarse.

**Day four.** Looked at host metrics for the first time. Memory climbed steadily
from restart, reached the ceiling in roughly eleven hours regardless of traffic,
and the host restarted. Every auth failure lined up with a restart window.

**Day five.** Counted child processes. One per session, none ever reaped. The
helper was spawned on session open and the handle was dropped without a wait, so
each finished helper stayed as a zombie holding its parent's memory mapping.

**What to carry forward.** A failure that self-heals on retry is evidence about
the recovery path, not about the failing call. Four days went into the token flow
because the retry succeeded, when the retry succeeded merely because it landed on
a freshly restarted host. Check host-level metrics before instrumenting a code
path, especially when the failure rate is insensitive to every code change tried.

**Counter-case worth keeping.** The refresh race is real and was independently
worth fixing; it just was not this. Removing the serialising lock reintroduced a
much rarer failure with a different signature (a hard error rather than a
self-healing one), so the lock stayed.

### Timeline detail, retained deliberately

The record is long on purpose: it is the fixture that exercises the full-record
read path rather than the bounded frontmatter prefix, so its size is part of what
it tests. Everything below is invented padding that keeps the shape honest.

- 2026-07-18 09:12 first report, one call in forty, self-healing on retry.
- 2026-07-18 14:40 reproduced locally under two concurrent clients.
- 2026-07-19 10:05 added issued-at logging to the refresh path.
- 2026-07-19 16:22 observed two refreshes inside one millisecond; read as the race.
- 2026-07-20 11:30 serialising lock added around the refresh.
- 2026-07-20 17:55 failure rate unchanged; lock assumed too coarse.
- 2026-07-21 09:40 added request-level timing to the relay path.
- 2026-07-21 15:10 timing showed nothing anomalous on the failing calls.
- 2026-07-22 08:15 host metrics reviewed for the first time.
- 2026-07-22 08:50 memory climb confirmed, independent of traffic volume.
- 2026-07-22 13:05 restarts correlated one-to-one with the auth failures.
- 2026-07-23 09:20 scheduled reaper deployed as a first fix.
- 2026-07-23 21:00 memory still at 99% overnight during low traffic.
- 2026-07-23 22:40 child process count found growing monotonically.
- 2026-07-24 10:00 helper handles reaped on session close; growth stopped.
- 2026-07-25 09:00 twenty-four hours flat; the failure did not recur.
