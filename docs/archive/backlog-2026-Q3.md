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

- **Live-fire `docs-write-guard` against a real subagent dispatch (opened 2026-08-26, closed
  2026-08-27).** Opened because an `implementer-fable` subagent wrote into `docs/plans/` during
  the document-review-battery effort and the guard did not stop it. The item named two candidate
  causes, a stale plugin cache or a hook payload carrying no agent-type field, the second of which
  would have meant the guard had never enforced against subagents at all. **Both are wrong.**

  The channel was `python3`. The subagent (`agentType: claude-kit:implementer-fable`) wrote
  `fixes4.py` into its scratchpad and ran it; the shell redirect in that command targets `/tmp`
  and the `docs/plans/` path appears only inside the Python source, so `commandWritesDocs` had
  nothing to match. That is the interpreter miss the guard's own header already declared.

  Three-arm probe on the current cache `10e4078df8f5`, dispatched as `claude-kit:implementer-sonnet`:
  the `Write` tool was blocked, `echo probe > docs/.guard-probe-bash.md` was blocked, and
  `python3 - <<EOF` opening the same path was **allowed and the file landed**. Both denials named
  `claude-kit:implementer-sonnet` verbatim, so `subagentType()` resolves a plugin-namespaced id out
  of the live payload, which retires the second hypothesis on its own. A probe run in the original
  session had already returned the first two arms blocked against the *pre-update* cache
  `970827b6dc4f`, naming `claude-kit:implementer-opus`, so the stale-cache hypothesis was falsified
  before it was written down; that session recorded the probe as never run and Chapter 5 of
  `archive/document-review-battery_spec_v1.md` corrects it.

  What the fire also found, and what carries forward as a live item: the guard's header claimed the
  `stop-docs-hygiene` Stop-scan catches these. It catches a leaked scratch file by name or
  directory, and it vetoes any name match on a file carrying the plan-header contract, so an edit
  to an existing curated doc passes both. The comment was corrected in the same close-out. Whether
  the guard should reach interpreter writes at all is the open question and stays in `backlog.md`.

- **Guard the remaining unbounded `openSync` calls in session-start.js (opened 2026-08-07, closed
  2026-09-04).** A bounded read bounds bytes, not time: `openSync` on a FIFO blocks until a writer
  appears, and the S4 security review hung the hook for 5 seconds this way before killing it,
  against a file header promising "Never blocks". S4 had added its `statSync().isFile()` guard to
  one helper only, leaving four readers opening blind: both plan scans, the CLAUDE.md version
  marker, and the shipped asset (whose `statSync` checked size and not `isFile`, so its
  `readFileSync` blocked just as an `openSync` would). Closed by routing **all six** file doors
  through one local `readCapped`, the atomic form the backlog item itself prescribed and
  `hooks/memory-lib.js` already carried: open with `O_RDONLY | O_NONBLOCK`, then check
  `fstatSync(fd).isFile()` on the descriptor already held. That also closes the stat-then-open
  TOCTOU window the finishing security review noted on the two doors that *were* guarded, so the
  fix is strictly better than the item asked for rather than equal to it.

  **Two things the change had to get right and nearly did not.** The CLAUDE.md offer hashes the
  asset's raw bytes and compares against a marker written by the reconcile skill, so hashing the
  helper's BOM-stripped string would have mismatched every existing marker and fired a spurious
  reconcile offer for every user on their next session; the helper returns `raw` alongside `text`
  for exactly that caller. And the adoptions reader compares its raw byte count against its cap to
  refuse a match landing on a filled buffer's edge, so the helper returns `bytes` too rather than
  only a `truncated` flag.

  Three new FIFO pins, on the doors that had none, and **each was watched failing against the
  unguarded hook before being trusted** (they fail as a killed child with a null status rather than
  a bad assertion, since a regression re-introduces a block and not a wrong answer): a FIFO as the
  only entry in `docs/plans/`, a FIFO beside a readable plan (the pin against wrapping the loop in
  one try/catch and losing the good entry with the bad), and a FIFO at the version marker. The two
  pre-existing FIFO pins covered only the two doors that were already guarded.

- **Nothing runs the test gate automatically (opened 2026-08-07, closed 2026-09-04).** No CI, no
  `package.json`, and no runner beyond a command in the README, so every guard the suite pins was
  only as good as someone remembering. Surfaced by the S4 security review as change-management
  hygiene. Closed by adding the gate to `.githooks/pre-commit`, which already existed and was
  already wired, keyed on staged paths under `plugins/claude-kit/hooks/`, `tools/` or `test/` the
  same way its plugin validation keys on `plugins/claude-kit/`. It runs BEFORE the validation
  branch, because that branch exits early when no plugin path is staged and the suite also covers
  `tools/` and `test/`.

  **Chosen over a CI job** because this repo has no CI and adding one is a larger decision than
  this item, **and over leaving it a documented runner** because that is precisely what existed
  and had failed. Unlike the validation it is a HARD gate: node is always present since it runs
  the hooks, so there is no absent-tool case to be soft about, and a red suite means a shipped
  guard is broken. A docs-only commit skips it deliberately, since most commits here are docs and
  the suite costs about 4.5 seconds. It inherits the validation's known limitation, keying on
  staged paths while running against the working tree, accepted for the same reason.

- **Extract a shared plan-status helper (opened 2026-07-24, closed 2026-09-04).** The anchored
  Status-header classifier lived in three copies, `kit-goal-lib`'s `planHead` and `session-start.js`
  twice, kept in step by comments asserting they were identical. The item was **conditional**, not
  imperative: "if the classifier gains nuance (an Abandoned status, say), single-source those three
  rather than editing three copies." Closed because the condition fired, and it fired on a real
  defect rather than on a wish.

  **The defect, measured before anything was touched.** `docs/README.md` says `docs/plans/` "holds
  active plans only" and that a plan moves to `archive/` "in the close-out that completes **or
  abandons** it". The unarchived-close-out nudge only ever looked for `Status: Complete`, so an
  Abandoned doc left in `plans/` was a silently-missed close-out. A four-status probe against the
  shipped hook: `Complete` nudged, `Abandoned` did not, `In Progress` was recovered as active, and
  `Proposed` correctly raised nothing. That nudge had **no direct test coverage at all**, which is
  why the gap survived from its introduction; it was mentioned in `test/stop-docs-hygiene.test.js`
  only as a deliberate non-behavior of a different hook.

  Now `classifyPlanStatus(head)` in `kit-goal-lib.js`, pure and I/O-free, returning
  `in progress` | `complete` | `abandoned` | `proposed` | `unknown`, with `isClosedPlanStatus`
  beside it. **In Progress still wins over every other value**, preserving the original
  `complete && !inProgress` rule, because a doc naming two statuses is live until its close-out
  says otherwise and the alternative releases a leash on work still running. `stop-docs-hygiene.js`
  was deliberately NOT folded in, per this item's own instruction: its regex asks only whether a
  Status header exists at all, a different and simpler question.

  **Three consumers gained the nuance, and the leash half was the non-obvious part.** The nudge now
  reports closed docs and names which close-out each one is, since Complete and Abandoned are not
  interchangeable to a reader about to move a file. `armGoal` refuses a closed plan rather than only
  a Complete one: before this, an Abandoned plan classified as `unknown` and a completion leash
  armed on it successfully. And `kit-goal-stop`'s clause (a) releases on closed, so a leash cannot
  hold a session to an abandoned plan; a correctly archived one already released through the
  file-is-gone branch, and this covers the window where the status changed and the move has not
  happened yet, which is precisely the state the nudge now flags.

  **The over-broadening guard is the pin to keep.** The tempting fix is "anything not In Progress",
  which sweeps every `Status: Proposed` stub, and this repo keeps 14 in `docs/plans/` on purpose.
  Three pins fail that fix while passing the two Abandoned ones: a Proposed stub raises nothing, it
  still arms a leash, and the leash still holds on it. Ten of the new pins were watched failing
  against the pre-change code before being trusted.

  Also fixed in passing: a comment added to `readCapped` earlier the same day claimed
  `session-start.js` "stays dependency-free by design". False, and the change disproved it: that
  hook already lazily requires three sibling libs, and the header's "no dependencies" means no npm
  packages.
