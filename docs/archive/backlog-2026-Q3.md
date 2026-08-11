# Backlog snapshot: 2026 Q3

Items closed out of `docs/backlog.md` during this quarter, with what closed them. Immutable
history; nothing here is live. Items accumulate as they close, so this file grows through the
quarter rather than being written once.

## Closed

- **Live-fire the docs-write-guard after the next plugin update (opened 2026-07-24, closed
  2026-08-11).** The guard's deny path rested on the PreToolUse payload carrying a subagent
  identity field, every test synthesized that field, and the hook cannot fire in the session
  that built it, so the one thing the suite structurally could not check was whether the field
  is really there. Closed by a live fire the moment the precondition cleared: the plugin was
  reinstalled and the hooks reloaded, then one throwaway `general-purpose` subagent was pointed
  at a `docs/` write.

  **Observed deny, verbatim:**

  ```
  PreToolUse:Write hook error: [node "${CLAUDE_PLUGIN_ROOT}/hooks/docs-write-guard.js"]:
  Blocked: the general-purpose subagent may not write into docs/. docs/ holds curated content
  only (plans and the docs-curator's docs). A report or scratch file goes to .kit/ (gitignored),
  and the durable record is the plan's Chapter. Write to .kit/ instead, or return the content in
  your final message.
  ```

  Exit code 2, and `ls` confirmed the file was never created, so the block landed at PreToolUse
  rather than being a report over a completed write. **The finding that actually closes the
  item:** the message names `general-purpose`, which it can only do by reading the identity out
  of the live payload, so `hooks/docs-write-guard.js:37-45` is not resting on a field the tests
  invented. That was the open question and it is answered.

  The fire also surfaced something new, jotted to the kaizen inbox rather than fixed here: the
  denial reaches the model as a `PreToolUse:Write hook error`, because all three PreToolUse
  guards deny by writing stderr and exiting 2. The reason text survives, so the block works, but
  the error framing can read as the hook crashing rather than refusing. Acting on it means
  confirming the `permissionDecision` deny shape renders better first, and moving three hooks
  and their tests if it does.

- **Replace `process.exit(0)` after a stdout write with `process.exitCode` (opened 2026-08-07,
  closed 2026-08-11).** All seven sites done. `process.exit()` can discard bytes still in flight
  on a pipe; setting the code instead lets the event loop drain the write. Four stdout sites had
  their forced exit removed (`session-start.js`, `stop-docs-hygiene.js`,
  `branch-reaper-nudge.js`, `kit-goal-stop.js`), and three deny guards now set
  `process.exitCode = 2` (`docs-write-guard.js`, `pr-docs-guard.js`,
  `merged-pr-push-guard.js`). No `process.exit(` remains anywhere in `hooks/`.

  **The item's own prescription was wrong, and following it literally would have disarmed three
  guards.** It recorded that the three guards' trailing `process.exit(0)` "is a clean no-output
  path and needs no change." That held only while the deny used `process.exit(2)`, which
  terminates before reaching the trailing line. Change the deny to `exitCode = 2` and leave the
  trailing `exit(0)` in place, and it runs on the way out and overwrites the deny code, so every
  guarded write is allowed while the stderr reason still prints. Measured rather than reasoned:
  making exactly that naive change failed 6 of 12 `docs-write-guard` tests, each one a write that
  should have been denied and was not. The trailing line had to go in the same edit.

  Verification: 277/277 tests pass, up from 272. Termination is covered rather than assumed,
  since the suite spawns these hooks and waits, so one that stopped exiting would hang the run
  instead of passing it; standalone runs confirm 17-619ms at exit 0. The largest stdout write
  (`session-start.js`, 6573 bytes) was pushed through a real pipe and parsed intact, which is
  past a single pipe-buffer flush and so exercises the case the change was made for.

  Line reference drift worth noting for whoever reads the closed item: the stdout site in
  `session-start.js` was recorded at `:604` and was at `:612` by the time this ran.
