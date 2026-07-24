---
name: kit-goal
description: "Use when Daren types /kit-goal <plan path> to arm a completion leash on a plan run, /kit-goal clear (or stop, off, reset, none, cancel) to release it, or /kit-goal with no argument to see what is armed."
---

# Kit Goal

`/kit-goal docs/plans/<plan>.md` arms a plan run in one line: it writes a
project-scoped goal-state file, and a deterministic kit Stop hook holds the
session working that plan to completion. No LLM judges whether the run is done.
The hook reads the plan's `Status` header and the last assistant message, so
there is nothing to sweet-talk and nothing to reason around.

The state lives in the project, at `.kit/goal-state.json`, rather than inside a
session's transcript, so it survives whatever happens to the session: after a
crash, a `/resume`, or a fresh window in the same repo, the goal is still armed,
`/kit-goal` reports it, and the session-start hook surfaces it. This is the
one-line arming for a plan run under executing-work; native `/goal` remains for
goals that are not plan-based. Arming is Daren's explicit act, never something a
session does for itself.

## Arm

`/kit-goal <plan path>`, where the argument is a repo-relative plan path like
`docs/plans/foo_spec_v1.md`. Run the CLI, which validates the plan and writes the
state atomically:

```
node <plugin-root>/hooks/kit-goal.js arm <plan path>
```

The CLI lives at `hooks/kit-goal.js` under the plugin root; from this skill's
base directory (`<plugin>/skills/kit-goal/`) that is `../../hooks/kit-goal.js`.
Report the one-line result.

The leash binds only to a session whose transcript carries the typed `/kit-goal`
invocation itself. An arm requested in prose ("arm the kit goal for the plan")
still writes the state, but no session ever binds and nothing enforces: a
silently inert leash. When the request arrived that way, say so and have Daren
type `/kit-goal <plan path>` from the session that should hold it. The session
that should hold it is the one executing the plan: a design session that only
wrote the spec and is handing execution off does not arm (the leash would block
its own handoff stop), so arm in the execution session instead. One goal per
project: arming while another goal is armed, for any plan, replaces it and
resets its binding.

Before the first arm in a repo, check that the project's `.gitignore` covers
`.kit/`, and add that line first if it does not. Goal state is machine-local
working state and must never be committed.

The command refuses, with the reason, a plan that does not exist, a plan already
at `Status: Complete`, or a path that resolves outside the repo. Surface that
reason and stop rather than retrying.

## Clear

`/kit-goal clear` (accept the aliases `stop`, `off`, `reset`, `none`, `cancel`)
releases the leash:

```
node <plugin-root>/hooks/kit-goal.js clear
```

It reports whether a goal was armed. If the state file exists but cannot be
deleted, the CLI says so and the goal is still armed and still enforcing; report
that, and do not call it cleared.

## Status

`/kit-goal` with no argument, or `/kit-goal status`, reports what is armed, when
it was armed, and which session holds the leash (or that it is unbound):

```
node <plugin-root>/hooks/kit-goal.js status
```

## How the leash holds

The `kit-goal-stop.js` Stop hook (wired in the plugin's `hooks.json`) fires on
every stop and is a strict no-op unless a goal is armed in the current project
and the stopping session holds the leash.

The leash binds to one session at a time. It arms unbound, and the arming
session claims it at that session's first stop: the claim signal is the
`/kit-goal` invocation's own command arguments (either `/kit-goal` or the
plugin-namespaced `/claude-kit:kit-goal`), so arm from the session that should
hold the leash. Nothing else claims it. A plain prose mention of the plan path,
the assistant's own text echoing it, the session-start armed-goal notice, and
tool output all fail to claim, so a session opened to discuss an armed plan is
never yanked into working it, and two sessions can never both hold one leash.
Once the goal is bound, any session other than the holder is never leashed,
however often it names the plan. Re-arming with `/kit-goal <plan path>` resets
the binding, and that is the recovery move when the bound session died or its
window closed: arm again from the session picking the run up. After any re-arm
the goal sits unbound until a qualifying session's next stop, and a still-open
former holder's original invocation still qualifies, so when moving a live run
deliberately, clear first or close the old session.

When the stopping session holds the leash, the hook allows the stop only when:

- (a) the plan's `Status` is `Complete`, or the plan file is gone (moved to the
  archive), in which case it also auto-clears the goal; or
- (b) the last assistant message opens with `BLOCKED:` as its very first
  characters (a true blocker was surfaced). The match is the literal leading
  prefix: a `BLOCKED:` line mid-message, or one wrapped in bold or a heading,
  does not release.

Otherwise it blocks with a reason naming the plan, so a run cannot quietly stop
with sections left. The conditions re-evaluate on every stop attempt, including
inside a stop-hook continuation, so the leash holds until one is genuinely met;
Claude Code's own consecutive-block cap (eight blocks without progress,
`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) is the loop backstop that releases a
genuinely stuck session with a visible warning. Any error inside the hook allows
the stop: the leash never traps a session.

The canonical condition text is composed and owned by `hooks/kit-goal-lib.js`
(`composeCondition`); this skill does not restate the literal, so the two cannot
drift.
