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

- **Pin the rest of the session-start surfacing with tests (opened 2026-07-24, updated 2026-08-10,
  closed 2026-09-04).** The hook emits eight blocks and four lacked pins: armed-goal,
  unarchived-Complete, the kaizen count, and the CLAUDE.md sync offer, with plan recovery
  "exercised incidentally by the adoption fixtures rather than pinned on its own". Audited rather
  than taken on trust, since the item's inventory was three weeks old: the kaizen count had since
  gained `test/session-start-kaizen.test.js` (11 tests) and the unarchived block was pinned earlier
  the same day by the plan-status work. **All eight now carry pins**, added to the existing harness
  as the item instructed rather than in a new file.

  **Armed-goal** had genuinely zero coverage in either session-start test file;
  `test/kit-goal-stop.test.js` exercises the Stop hook, which is a different hook. Five pins, and
  the one that matters is sanitization: the block interpolates a plan path read off disk into a
  TRUSTED context channel, so a newline in `goal-state.json` could close the sentence and forge a
  following instruction. Also pinned: the 120-character cap, and that unparseable goal state is
  silence rather than a crash.

  **The CLAUDE.md offer** was only ever kept QUIET - both harnesses write a matching version marker
  on purpose - so nothing asserted it ever fires. Now pinned firing on an absent marker and on a
  stale one, and quiet on a matching one, a BOM-prefixed one and one with trailing newlines.

  **Plan recovery's real gap was the `source === 'compact'` branch, which had no coverage at all.**
  That is the trigger the hook's own header calls critical ("Fires on startup, resume, and -
  critically - after compaction"), so a silent regression there loses the plan on the one event the
  hook exists for. Pinned both ways, plus the read-the-plan-in-full instruction that is the point
  of the block, plus that an unrecognized Commit Model reports as `unknown` rather than echoing
  repo text into the channel.

  **One claim was disproved by writing its test, which is the useful part.** A comment shipped
  earlier the same day said the version marker "used to compare unequal and offer forever" on a
  BOM, because it was the one door here that did not strip one. False: `String.prototype.trim`
  already stripped it, since U+FEFF is ECMAScript WhiteSpace. The test written to pin the fix
  passed against the pre-change hook, which is what exposed it. Both live copies of the claim are
  corrected; the commit message of `1042f68` still carries it and is immutable. The test is kept
  as a guard rather than a fix pin, and now rests on two mechanisms, so it holds if either is
  removed and fails only if both are.

- **The de-naming vocabulary is an invariant nothing checks (opened 2026-08-20, closed
  2026-09-04).** The contract at `archive/kit-denaming_s1-rules.md` defines the vocabulary, and
  nothing mechanical held any of it: the only check was a by-hand grep, and the item's own
  prediction was that "a new skill, a rule ported by `kit-adoption-pass`, or a Chapter written
  from a transcript can put a name or a gendered pronoun back and nothing will say so."

  **It had already happened, which is the finding.** Sixteen sites, none on any of the three
  exhaustive keep-lists, all authored after the sweep and all in `docs/`: eleven gendered-pronoun
  occurrences (misgendering the user in four specs and a ledger entry) and five prose namings of
  the operator. All fixed in the closing commit.

  Closed by `test/denaming.test.js`, a third path the item did not offer. Its two were writing the
  rule into `writing-skills` or recording that habit plus a grep is enough; one of its premises had
  aged, since it says the gate "cannot exercise prose" and `tools/accretion.test.js` has measured
  prose mechanically since 2026-08-16. A test runs on every commit; a rule and a habit did not.

  **Enforcement is split by decidability, which is the design to read before editing it.** The
  operator's name and gendered pronouns are hard-failed, because their legitimate forms are a
  short stable set of mechanical pointers and there are no false positives. The upstream author's
  name is class-allowed and the test says why: the contract's own credit-versus-machinery
  distinction is not mechanically decidable, so that half catches a bare new occurrence in an
  unruled shape and cannot judge an attribution-shaped one. Allowlists are keyed on CONTENT rather
  than location, as the contract keys its own `kit-denaming_spec` sites, so line movement cannot
  rot them.

  **A guard against the guard**, because this kind of check dies by being widened once to clear a
  red build rather than by being deleted: a fourth test asserts no allowlist pattern matches a bare
  name token. Verified firing by adding `/[Dd]aren/g` and watching it report that the pattern
  "would silence the check".

  Every violation class was watched being caught before the test was trusted: a pronoun in prose, a
  prose naming, the all-caps spelling, an unruled upstream form, and the surname alone. `docs/archive/`
  confirmed exempt. And `.githooks/pre-commit` now runs this one test on a PROSE-ONLY commit
  (about 120ms) as well as inside the full gate, because prose is where the drift actually happened
  and a docs-only commit is exactly the shape that introduces it.

  **Deliberately not covered, and now its own backlog item:** the role noun "the operator". The
  contract makes it a one-site exception; the live tree holds 100+ occurrences across 35 files.
  Usage has voted against the contract, and whether that vote should stand is a vocabulary decision
  for the user rather than something a test should force.

- **Nothing in the cross-project tier detects one fact stored under two names (opened 2026-08-10,
  closed 2026-09-05).** `add` publishes with `linkSync` so two writers cannot claim the same
  *name*, but no write path compares bodies, so two sessions naming one fact differently produce
  two records and every later reader sees both. Surfaced unprompted by all three reps of the S7
  RED's first arm.

  **Measured before building anything, and the measurement decided it.** The live store held 31
  records with **no near-duplicate**: the highest Jaccard similarity across all 465 pairs was
  0.172, and the top-scoring pairs were topically related rather than duplicated
  (`ado-ssh-key-expiry` against `sandbox-git-ssh-fetch`; the two ADO SSH records, which carry
  different facts). After roughly two months and 31 records written by many sessions, the predicted
  failure has not once occurred.

  **The reason is structural rather than lucky, and finding it is what closed this differently than
  either offered path.** Every session is handed every record's description in the SessionStart
  block before it could bank a fact, so a session about to write a duplicate has already read the
  original. Nothing detects duplicates because nothing has needed to.

  **That protection had just started failing, which is the live defect this found.** The block is
  capped at 30 lines and the store reached 31. `listRecords` sorts by name, so the drop is
  **deterministic rather than rotating**: `utf16le-sql-breaks-diffs` had gone invisible to every
  session and would have stayed invisible, making it precisely the fact most likely to be
  re-learned and re-banked under a different name. The backlog item's own predicted failure, with a
  specific record already selected for it.

  Closed by having truncation **name** what it drops rather than only counting it, bounded at 40
  names with an explicit "and others" past that, and telling the reader to treat a name there as a
  fact the tier already holds. A name costs a few tokens against roughly forty for a full line, so
  this preserves the duplicate-suppressing property at a fraction of the cost of the similarity
  detector the item contemplated. Three pins, two of them watched failing against the pre-change
  hook. A similarity check at `add` time stays unbuilt and unneeded on this evidence; revisit if a
  duplicate ever appears. The finding and its measurement are recorded in
  `docs/cross-project-memory.md`, since the cap's behavior is not obvious from the cap.

- **Decide whether "the operator" is still the wrong role noun (opened 2026-09-04, closed
  2026-09-05).** Filed a day earlier while closing the de-naming-invariant item, on the reading
  that the contract makes "the operator" a one-site exception while the live tree holds 100+
  occurrences, so "usage has voted against the contract". **Ruled: no sweep, no change. The premise
  was false**, and the correction is worth more than the ruling.

  **The substitution table never mentions "operator."** `archive/kit-denaming_s1-rules.md:75-83`
  replaces the NAME `Daren` with `the user` and the pronouns with they/them. That is all it does.
  The sweep's scope was "all 47 match-bearing files", meaning files matching the name and pronoun
  patterns, so prose that never contained the name was never in scope. The exception at
  `agents/security-reviewer.md:29` is an exception to the REPLACEMENT TOKEN at one swept site,
  chosen because "user" already carries the adversarial sense on that line ("any user-influenced
  value"), which would have made one noun name both the attacker and the operator inside the clause
  that downgrades a finding. The contract's "not a licence to vary it elsewhere" bars using `the
  operator` as the replacement for `Daren` at OTHER swept sites. It never prohibited the word.

  **The raw count was also inflated by a homonym.** Of 233 occurrences of "operator", roughly seven
  are shell redirect and comparison operators (`docs-write-guard.js`'s "ONE TARGET PER OPERATOR",
  `merged-pr-push-guard.js`'s "standalone shell operator", a staleness boundary operator in a
  test), which is a different word.

  **Measured over the corpus, the word earns its place.** Of 15 occurrences in the four measured
  globs, **12 do not share a referent with "the user"**, carrying four distinct senses: the
  disclosure boundary (a document persona sits "outside the operator"), a persona archetype ("an
  operator, an engineer who works in it daily"), the operator of software the kit is helping WRITE
  (`csharp-style`, `ai-tells`), and the sanctioned security exception. The contract's own rationale
  for that exception is ambiguity, and it generalizes: in each of those senses "the user" would
  undo the disambiguation rather than restore consistency.

  **Residue, recorded rather than swept.** Three corpus sites use it for the same referent the
  surrounding prose calls "the user": `executing-work:46` and `:175`, and `writing-skills:171`. The
  first sits two lines from a `:48` saying "the user" for the identical person, so the
  inconsistency is real but small. Left alone deliberately, and the reason is a trade rather than
  an oversight: three words with no behavioral consequence do not earn a paired review of the kit's
  most-read prose, and corpus-prose changes have died on that review four times in the last week.
  Fold them in for free if an effort is already editing those files. Recorded in
  `test/denaming.test.js`, which is where anyone asking "should I sweep operator?" will look.

- **`README.md` still fails its first-time reader on eight counts (opened 2026-08-27, closed
  2026-09-05).** Closed by the item's own second path, **a recorded decision that the kit's README
  is for its author and the outside-reader lens does not apply to it**, ruled by the operator on
  2026-09-05. The item itself called that "a real answer given the repo is private", and the repo
  is still private with `plans/kit-distribution_spec_v1.md` explicitly aspirational.

  **Two of the eight shipped first, and deliberately not as a compromise.** A post-install
  verification step and an uninstall path (`README.md` steps 6 and 7) were chosen precisely because
  they serve the author on a private repo and so did not depend on this ruling either way. The
  verification step is also the practical half of the unbuilt first-run check in the
  Node-prerequisite item, which stays open.

  **The six declined, each an outside-reader finding and nothing else.** Three load-bearing terms
  undefined at first use (`Fable`, sixteen uses across MODEL TIERING; `Chapter`; "the document
  battery"); the advisor sentence at MODEL TIERING's foot that resolved for neither reader who met
  it; THE WORKFLOW's ~330-word opening paragraph carrying three commit models, the section loop,
  five review agents, four execution modes and the whole finishing sequence; and the missing case
  against the reader's actual status quo, plain Claude Code. Every one of them is a cost paid only
  by someone who does not already hold the kit's vocabulary. The author does.

  **What the ruling does NOT undo.** `archive/reader-facing-docs_spec_v1.md`'s accuracy work
  stands: false claims and the broken install path were fixed there and are not reopened by this.
  The declined six were always the audience-and-structure residue that pass deliberately scoped
  out. A README may be written for one reader and still be required to be true.

  **Reopens if the repo goes public or the kit is ever forked by someone else**, which is exactly
  what `plans/kit-distribution_spec_v1.md` contemplates: its capability 1 is a guided first run,
  and a guided first run for a stranger is this item under another name. One consequence is already
  recorded against `plans/config-surface_spec_v1.md`, whose reader is a new user and whose
  discoverability test can no longer assume the README orients a newcomer.

- **The kit's only mechanical layer has an unenforceable prerequisite (opened 2026-08-27, closed
  2026-09-06).** Every hook runs as `node "${CLAUDE_PLUGIN_ROOT}/hooks/<file>.js"` and Claude Code
  bundles no Node on any install path, so on a Node-less machine the guards fail open, compaction
  recovery never fires, the leash never holds, and the plugin still lists its skills. The item held
  that the kit "cannot detect this itself, because any hook written to warn would also be a Node
  script", and left both options **unpriced**.

  **Pricing them is what settled it, and the decisive fact was never verified before.** The item's
  premise that the failure is SILENT was an inference from the docs word "non-blocking", which
  describes only whether the action proceeds. Measured instead: a deliberately unspawnable
  SessionStart hook registered through `claude -p --settings` produced
  `"stderr":"/bin/sh: 1: <cmd>: not found","exit_code":127,"outcome":"error"` in the hook_response
  event, and that event is visible **only** under `--output-format stream-json --verbose`. The
  ordinary session printed nothing but its answer. The premise holds.

  **The same measurement dissolved the objection that had kept this unbuilt.** The item priced a
  shell probe as "not free" because it works on POSIX and not on Windows. But the error text
  `/bin/sh: 1:` proves hook commands are run through `/bin/sh` on POSIX, so a shell probe is
  registrable; and since an unspawnable hook is silent, the Windows half costs **nothing visible**
  rather than adding noise. A gap, not a regression. That is what turned a judgment call into an
  easy build.

  Closed by `hooks/node-probe.sh`, registered on SessionStart for `startup|resume`: silent and exit
  0 when Node is present, a warning naming the blast radius when it is not. **Verified end to end,
  not composed from unit results** - a real session run with a `/usr/bin` symlink farm minus `node`
  had the model quote the warning back and conclude "every kit hook is dead here".

  **The exception is gated.** This is the kit's only non-Node registration, and
  `hooks-registration.test.js` now pins `sh` at exactly one registration and asserts it is this
  probe, because a shell hook carries a Windows blind spot that is acceptable for a probe and not
  for anything anyone relies on. Four behavioral tests cover the probe itself, including one that
  asserts its own node-unreachable setup actually holds - an earlier draft used
  `PATH="$D:/bin"` and silently tested nothing, since `/bin` symlinks to `/usr/bin` here.

  What it does not cover, stated rather than implied: a `node` on PATH is not proof the Node
  Claude Code spawns is the same one or is usable, and the probe is silent on Windows. `README.md`
  step 6's two checks remain the platform-complete answer, and its claim that nothing in the kit
  could report this is corrected there.
