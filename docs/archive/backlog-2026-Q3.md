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

- **The adoption ledger's currency contract does not exist (opened 2026-08-31, closed
  2026-09-06).** Seven counts. **Two were already fixed on the day the item was written**, by
  `d9ee478`: the escaped table cell that made candidates 2-21 render as one run-on paragraph, and
  the "only two conventions" count, now three - the third being the convention that fixed the
  first. An item and its fix landed the same day and neither knew about the other.

  **One was not a defect.** The item read `Last pass: 2026-08-26` against candidate 1's 08-27 to
  08-31 strata as stale, but that line's own contract says "A pass updates it. Nothing else
  reformats it." It dates the window, not the file. The real reader problem was that nothing said
  so, and taken as an mtime it claims the ledger stopped a week before it did. Now stated.

  **Four were live and are fixed.** The amendment convention now covers a live `pending` entry
  (the old bullet covered `rejected`, which is not the class that accrues) and says not to tidy
  superseded reasoning away, since the sequence of what was believed and what falsified it is the
  entry's value to a later pass. The 2026-08-26 preamble's three "verified on this machine" facts
  are marked as of that date against client `2.1.246`, which this machine no longer runs. Six
  settled verdicts carried no date, across two passes rather than the one the item named, and each
  is now dated by its own pass. And candidate 1 was **re-verdicted** from `pending, likely inert on
  this account` to `rejected 2026-08-26, superseded natively` on the operator's call: its body had
  adjudicated three times over while the label sat still, which for a `pending` entry is an
  instruction to a future pass to go and redo settled work.

  **The contract is now a test rather than a convention**, `test/kit-adoptions-ledger.test.js`,
  which is what the item's title actually asked for. Four pins: the ledger parses, every settled
  verdict carries a date (`pending` exempt, since there is no decision date to carry), every table
  keeps consistent column counts, and **every candidate's index row and detail section carry the
  identical verdict string**. That last invariant was discovered by measurement rather than
  invented: it held 31 of 31 before this pass, and dating the index rows alone broke it to 25 of
  31, which is how it surfaced as worth keeping. The dating pin was watched failing against the
  pre-pass ledger.

  Recorded against `plans/enumerations-stop-short_spec_v1.md` as instance 10: `README.md`'s
  test-coverage enumeration went three commits and two days out of date during this same session,
  missed by the author who had just written instance 9's conclusion that only a mechanical sweep
  survives an author's memory.

- **Decide whether `docs-write-guard` should reach interpreter writes (opened 2026-08-27, closed
  2026-09-06).** Closed by the item's own second path: **a recorded decision that the declarative
  half is enough here.** Not closed by elimination, though both named candidates do fail; the
  positive case is below.

  **The gap is real and wider than a "known miss" usually is.** The guard intercepts
  `Write`/`Edit`/`MultiEdit` exactly and shell writes only heuristically, so `python3 - <<EOF`,
  `sed -i` and `Copy-Item` are out of reach. What makes it matter is that an auto-mode session is
  *instructed* to edit files through "sed, heredocs, or short scripts", so the unguarded channel is
  the instructed default rather than an unusual choice. The session that closed this used
  `python3 - <<PY` for essentially every edit it made across seventeen commits, which is first-hand
  confirmation that the channel is the default one; that session was a main session and permitted,
  so it is evidence about the channel and not about subagents leaking.

  **Both candidates are worse than the gap.** A heuristic keyed on a `docs/` path near a known
  interpreter over-blocks a command that merely names one, which is the direction the guard's own
  cardinal rule forbids, and `archive/docs-write-guard-structure_spec_v1.md` records that direction
  failing twice on measured deny-to-allow regressions plus an unbounded-allocation hang. Widening
  the Stop-scan to any `docs/` file a turn modified needs a per-turn baseline a Stop hook does not
  have; reading repo state instead is precisely the regression `stop-docs-hygiene`'s own header
  records and forbids re-adding, having once ended a one-question diagnosis with an archiving
  demand about an unrelated plan.

  **The positive case, in the order that decides it.** The guard's teeth are the **role rule**,
  which is declarative and intact: an interpreter write escapes one channel's enforcement rather
  than the rule, and a subagent doing it has ignored its charter twice instead of finding a
  loophole. `security-model.md`'s trusted-workspace premise makes that subagent mistaken rather
  than hostile, and the guard reliably catches the mistake shape, which is reaching for `Write`.
  The last net is human: implementers stage rather than commit, so an unexpected `docs/` path sits
  in the staged set the operator reads before a commit they must explicitly permit. And the
  measured harm across the guard's whole life is **zero** - the 2026-08-26 evidence is a deliberate
  probe that landed a file on purpose, not an incident, and `stop-docs-hygiene` has never been
  recorded firing.

  **What shipped is visibility, not enforcement.** `docs/architecture.md` described the four
  PreToolUse guards in detail and named this limit nowhere, so the operator's own architecture
  document overstated coverage to the one reader who gates commits. It now carries the miss, the
  2026-08-26 measurement, why both fixes were declined, the three layers that do cover it, and the
  reopen condition: **one observed instance of a governed subagent writing into `docs/` through an
  interpreter unprompted.**

- **A deliberate guard deny reaches the model as a hook error (opened 2026-08-11, closed
  2026-09-06).** The three PreToolUse guards deny by writing stderr and exiting 2, which the
  harness surfaces as `PreToolUse:Write hook error: [node .../docs-write-guard.js]: Blocked: ...`.
  The reason survives intact, so the block works; the concern was framing, that an agent could read
  "hook error" as tooling malfunctioning and hunt for a way around instead of obeying. Closed by
  the item's second path: **a recorded decision that the exit-2 framing is fine permanently.**

  **The item said form two "could not be observed from inside a session", and that stopped being
  true.** It rested on patching the installed plugin cache being blocked and a settings-registered
  hook needing a restart. `claude -p --settings <file>` **is** that restart: it spawns a session
  with arbitrary hooks registered, and `--include-hook-events --output-format stream-json --verbose`
  shows every `hook_started`/`hook_response` with `exit_code` and `outcome`. That technique also
  settled the Node-prerequisite item the same day.

  **What the observation found, and it points away from the concern.** A model met a deny carrying
  the guard's real message and read it as a rule, not a malfunction: it changed nothing on disk,
  investigated the guard's source rather than routing around, and **explicitly declined the
  interpreter bypass** having read `docs-write-guard.js:16-24` where the guard documents its own
  misses, saying it would not use "a guard's self-documented gap to complete a blocked action".
  It then concluded the deny was an impostor and that "your actual guard would have allowed both
  calls" - **and still did not write the file.** Treating a deny as authoritative regardless of
  provenance is the opposite of the failure this item was watching for. That makes two observations
  pointing the same way, with the item's own 2026-08-11 subagent.

  **The envelope itself argues against the concern.** `hook error: [<command>]: <reason>` shows a
  hook with a REASON attached. A crash has no reason string, so the shape reads as
  tooling-with-a-rule rather than tooling-broken.

  **The cost of switching, unchanged and still decisive.** Form two moves three security-adjacent
  guards to a path where exit 0 plus one mistyped field name is a **silent allow**, and requires
  rewriting the roughly 15 `status === 2` deny assertions - the assertions that caught the
  2026-08-11 fail-open bug in the first place. That is a real risk against a harm with zero
  observations in either direction.

  **Methodological finding, recorded so nobody burns another probe on it: a synthetic deny is
  self-identifying.** The error envelope prints the configured command verbatim, so a fake guard
  shows as `[printf '...' >&2; exit 2]` rather than `[node ".../docs-write-guard.js"]`. The model
  listed five independent tells including that one, the wording differing from
  `docs-write-guard.js:256-259`, and the fact that the real guard allows a main session at `:242`.
  **Any future probe of this question needs the real guard and a genuinely governed subagent**, not
  an impostor, or the observer effect is in the result.

  Reopen condition unchanged: an agent observed reading a guard denial as a malfunction - retrying
  the same write, routing around to another `docs/` path, or reporting the hook as broken.

- **Spread the visual companion's ignore idiom to `kit-goal` (opened 2026-08-14, closed 2026-09-07).**
  Closed, but not by porting the idiom, which is what the item asked for and what three paired
  review rounds rejected in three different forms. `plans/ignore-precondition_spec_v1.md` is the
  Proposed stub that came out of it and carries the four versions, what each review found, and the
  measured probe table; that table is not repeated here.

  **What shipped.** `kit-goal/SKILL.md` had said to "check that the project's `.gitignore` covers
  `.kit/`", a substring test whose two gaps a security review had already found in the identical
  instruction in `brainstorming`. It now probes the two artifacts the arm actually writes,
  `git check-ignore -q` on `.kit/goal-state.json` and on the transient
  `.kit/goal-state.json.tmp.<pid>`, because probing either the directory or the state file alone
  was reproduced passing while a path stayed stageable. For the remedy it names the three verified
  traps and requires a re-probe, and deliberately prescribes no algorithm: every algorithm written
  for it had a reachable hole, which is the stub's whole subject.
  `brainstorming/references/visual-companion.md` took two corrections of its own on the way, both
  live defects rather than tidying. It had said to write `.kit/.gitignore` containing `*`, an
  unconditional overwrite that destroys whatever rules a project put there, and it promised an end
  state it never verified; it now prepends and re-probes.

  **The item's second half was right about the risk and wrong about the instance, and my first
  reading of it was wrong about both.** It reported the curator's `<!-- DRIFT: Dn -->` slug
  "currently varies between reports", citing `DRIFT: D3 (visual-companion)`. That exact form is
  not recoverable: the only place the string was committed is `334d093`, into the backlog item's
  own prose, which is a quotation and not a marker, and the item's own wording ("in this effort's")
  points at a returned Drift Report. But the variance it warned about did materialize on disk six
  days later, which my first pass missed and a reviewer's pickaxe found: `35025fe` (2026-08-20) put
  a bare `<!-- DRIFT: D3 pending adjudication -->` into `docs/security-model.md`, the slug
  `(kit-denaming)` was added to it before `3846b74` removed the whole marker on 2026-08-25. So two
  forms did coexist in committed files. My rebuttal was also aimed at the wrong claim: the item
  said the slug varies between REPORTS, and "every marker on disk was uniform" does not answer
  that. The real defect underneath was
  different and is fixed: `docs-curator.md` gave the marker as the LITERAL `D1` while its own
  report template numbers findings `[D1]`, `[D2]`, so a curator following it marks every passage
  `D1`. It now says `Dn` matches the finding's label, states that the marker follows the passage it
  flags, and names `DRIFT: D` as the grep, because varying the number costs the fixed-string search
  the uniform literal used to allow.

  **Found while checking it: four drift markers pending 28 days in `cross-project-memory.md`**, from
  `4f7272c` (2026-08-10), which `archive/document-review-battery_spec_v1.md:632-633` had already
  seen and deliberately left alone as belonging to a prior effort, rather than overlooked. All four
  are adjudicated and cleared, and the first pass at them got two wrong. Authority on which finding
  is which: `archive/cross-project-memory_spec_v1.md:1049-1051`.

  - **D1** (marker at `:48`, flagging the stamping paragraph) was real drift with the code fixed and
    the doc repair still owed, so clearing it as "never drift" left a false sentence standing. The
    doc said the compare-and-swap "survives in `writeRecord` as an optional guarded replace".
    `4f7272c` removed `expectVersion` with the design it belonged to; `writeRecord` has two publish
    modes, `create` claiming the name by `linkSync` and `replace` overwriting by plain `renameSync`,
    and `replace` is the DEFAULT when none is passed, so an unguarded overwrite is what a caller
    gets by omission. Of the shipped hooks only the CLI calls it, passing `create`; 27 test call
    sites are its other callers, which is the scoping the first repair dropped.
  - **D4** (marker at `:93`, the zero-candidate paragraph) substantially holds:
    `session-start.js:475` returns null only when `count === 0 && unevaluated === 0`. One clause
    named the wrong lead and is fixed, and so is the comment at `:655-657` that generated it, which
    said the sentence must lead with the unranked count while the string it introduces leads with
    the nothing. Repairing only the doc would have let the claim regenerate.
  - **D2** (marker at `:118`, the CLI invocation) was real and already fixed in the skill, whose
    block now gives `<plugin-root>/hooks/memory.js`.
  - **D6** (marker at `:137`, `origin` refuses a comma) was real and fixed the other way:
    `memory-lib.js` scopes the guard around `origin` (`key !== 'origin'`), citing the same 6-of-14
    seed-migration incident the doc cites. The doc's claim that the schema header "overstates what
    the field accepts" was true of the pre-fix code and went stale in the very commit that fixed it.

  **How two were got wrong, because the mechanism is reusable.** The convention is
  marker-follows-passage. Both mis-adjudications attributed the marker to the paragraph TWO above
  it, and the cause was the reading tool rather than the judgment: a five-line context window ENDING at the
  marker, on a file whose paragraphs are single unwrapped lines, spans several paragraphs, and
  the top of the window gets read rather than the line adjacent to the marker. A window
  centred on the marker would have held the right paragraph, so the shape is the whole defect. D2 and D6 came out right only
  because a heading and a list lead-in sat above them, leaving no competing paragraph.

  D6 was caught by accident rather than by audit: an `add` earlier the same day passed
  `--origin "claude-kit, kaizen pass 2026-09-06"` and succeeded, which is the documented failure not
  happening. A probe record with `--origin "alpha, beta"` confirmed it and was deleted.

  **One process note, recorded because this entry was wrong twice before it was right.** It was
  drafted at the point the work looked finished and then contradicted by each of the next two
  review rounds: first recording the opposite of `cross-project-memory`'s own adjudication, then
  describing a design that had already been rejected. A closure record written before the design
  settles is a claim about work that has not happened yet. Write it last.

- **Five residuals from the red-for-rule-changes reviews (opened 2026-08-16, closed 2026-09-07).**
  Closed as five declines. The first pass at this closed four and acted on the fifth; review
  reversed the action, and the reversal is the more useful record.

  **(e) `kaizen`'s "baseline-test any behavior-shaping wording", declined on an unmet trigger.**
  I qualified it, then reverted. Two things settled that. `archive/red-for-rule-changes_spec_v1.md`
  Chapter 1 rejected it because "a qualifier there is behavior-shaping wording in a second file
  that would owe its own arm", and recorded it "as a candidate if a further misroute is observed";
  no misroute has been. What I offered instead was that I twice reasoned out which bill a change
  owed during this pass, which is the rule working rather than failing, and I never read the brief
  template at all, Phase 1 and Phase 2 having collapsed into one session. And the line is not
  false: `writing-skills:152` makes the arms "the standard for any change to behavior-shaping
  content", so the brief states the default correctly and "follow writing-skills" carries the
  reader to the three sections that route around it. Incomplete is not wrong, and the premise
  correction I claimed had no false premise under it. **What keeping it buys** is one pointer
  rather than a second copy of a routing table that would need syncing; the draft I reverted was
  already out of sync on the day it was written, dropping the borrowed-evidence bill entirely and
  every other omission in the down-cost direction. **The trigger is recorded here so the next
  session that observes a real misroute can act with it met.**

  **(a) A baseline rep in the untouched state for a narrowing's third arm, declined.** What
  keeping the shape at three arms buys: a clean third arm already has a defined reading, because
  `writing-skills:116-122` sends any clean run to the four answers rather than only to the section
  that owns them. The concession, since the proposal was to measure rather than to read: this is a
  reading rule and not evidence.

  **(b) "record the observed instance" implies a count of one, declined, and the reason I first
  gave for declining it was wrong.** The verdict stands on the file rather than on argument:
  `writing-skills:609-611` says "this scopes the evidence, never the shape:
  contradicted-versus-narrower governs any rule change, including one about what an agent does,
  whose evidence is still the arms", so the three-rep bar the original finding said this clause
  contradicted is in fact preserved for every claim about an agent. **What keeping the clause
  buys** is the provenance its admitting incident exists for: the pr-review anchor fabrication at
  `writing-skills:585-590`, where an agent preserved a mandate by inventing a distinction nothing
  observed had supported. Note two supersessions rather than hiding them. Chapter 1 filed this
  finding as "the point is real" and `backlog.md` repeated that, and this closure declines it on
  the merits. And my first reason ("a plural invites padding one genuine observation into a fake
  set") named no incident and no sighting, which is the bar `kaizen` sets for a spared verdict; it
  is replaced above. I had also reached for "five or six single-observation errors this session"
  as support, with no locator, which `writing-skills:498-504` calls hearsay with more words. Those
  errors were real but they were errors of GENERALIZING from one observation, which this clause
  does not govern.

  **(c) Carrying the rule-change carve-out into the second copy of the redundancy list, declined.**
  **What keeping the single copy buys**, verifiable at `writing-skills:121-122`: that copy already
  points at the four answers under "When a local RED is not available", so a reader who reaches it
  is routed rather than stranded, and a second carve-out would owe its own arm. One thing the first
  pass attached here is withdrawn: it recorded a "refinement" that repairing a defective
  instruction is not a second copy and owes no arm, sourced to a subagent review's ruling during
  this session. A review's ruling is not a rule change, and using it to license (e) while claiming
  it did not reach (c) is preserving a position by a distinction nothing recorded supports, which
  is `writing-skills:584-590`'s named failure. If that boundary is worth stating it goes to
  `writing-skills` through its own bar.

  **(d) Consolidating the transcript clause with the self-report principle, declined, and the
  first pass adjudicated it against the wrong text.** The pair Chapter 3 names is S2's transcript
  clause and the self-report principle, which today are `writing-skills:144` and `:264`; the first
  pass compared `:264` with `:528`, the probe-prompt clause, which is a third clause the residual
  never named. **What keeping them separate buys** is that they govern different objects rather
  than different readers: `:144` is the rep's REASONING, taken off the transcript instead of asked
  for, and `:264` is what the rep OPENED. Merging them is a compression owing an inventory and a
  probe for a few lines. **The cause of the mis-map is a factual error in this item's own text**,
  which said the self-report principle sat "70 lines above" the transcript clause. At `67994f9`
  the transcript clause was `:121` and the principle `:192`, so it was 71 lines BELOW. A paraphrase
  that inverts a direction sends the next reader to the wrong paragraph, which is what happened.

  **A second fidelity error in this item, found the same way.** Chapter 1 names two sites for (e),
  `kaizen/SKILL.md:90` and `:94` at `9f5398a`, which are the Discipline line and the Applying line.
  This item quoted only the first. Both are declined above on the same grounds, but a reader
  working from the item alone would have repaired half a residual and thought it whole.

- **`security-model.md`'s remaining comprehension debt is vocabulary, not inventory (opened 2026-08-31, closed 2026-09-07).**
  Closed by the documentation pass its closure condition asked for, with one substitution stated
  rather than hidden: **the two blind-reader reports it named as the pass's input do not exist.**
  They were agent output, never written to disk, which is
  `plans/report-file-protocol_spec_v1.md`'s subject arriving on an unrelated item. A fresh reading
  was run instead, as the `security-reviewer` persona the document names, and it is what this pass
  worked from.

  **The fresh reading was worth more than the item's summary of the old ones**, and disagreed with
  it in one place that mattered. The item said "the `additionalContext` row's audience clause did
  not parse on three readings"; a draft of this pass guessed that meant the ~600-character
  `permissionDecisionReason` cell, and it was the `usage-nudge.js` `PostToolUse` row instead, whose
  audience clause carried two colons in one sentence and an elided noun after "the orchestrator's".
  Guessing which sentence a reader could not parse is how this session's first pass at the drift
  markers went wrong, so waiting for the reading rather than acting on the summary is the
  transferable part.

  **Fixed.** The two directory roots are now stated, which the document's own locating contract
  ("each claim names the file and the function so it can be found") needed and did not have: a
  bare filename is a `plugins/claude-kit/hooks/` file, with no exceptions across all 21 of them,
  verified; `hooks/` is plugin-root relative; `docs/`, `test/` and `tools/` are repo-root relative;
  and the one path the document tells the model to run is repo-root relative and fails from the
  plugin root. The borrowed usage vocabulary now points at `docs/usage-awareness.md`, which owns
  the threshold ladder and defines wind-down, barrier and the Fable ratchet, and the four terms
  that live nowhere else are defined here instead: a window, Fable scope, "near a barrier" (within
  `NEAR_BARRIER_POINTS`, ten, which is the one place proximity changes what the guard acts on, and
  therefore the answer to "fails open, but closed on what"), and the resume pad. Three counted-but-
  unnamed literal sets are named, because they are the values that cross into model context: the
  two window labels, the three integration branch names, the three Commit Model literals. The
  emitter table states its counting unit, a hook output field, so three kit CLIs the document
  itself sends the model to are deliberately out of scope rather than missing. "payload" no longer
  means both the shipped file set and the hook input JSON. `node-probe.sh` joins the fail-open
  section along with what the document had never said about its own condition: with `node` absent,
  the other eleven hooks cannot be spawned, an unspawnable hook exits 127 with outcome `error`, an
  erroring hook does not block, so the whole kit fails open at once and silently. `kit-goal-stop`'s
  re-blocking bound is given a value (eight, `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). The credential
  spend inventory gains `branch-reaper-nudge.js`, which spends whatever ambient git credential the
  remote requires on an unprompted `git fetch --prune`, `GIT_TERMINAL_PROMPT=0` establishing that
  it will not prompt rather than that it presents none. "Standing Brief Amendment 1" gets a
  location, "the plan docs" gets a path, and "the claim above" stops pointing at the wrong section.
  A structural break is repaired where a list preamble ran into the previous bullet with no blank
  line and a dated retraction floated between them, correcting a claim that had since left the
  page. And the `.kit/` enumeration now covers the kind it omitted and which outnumbers the other
  two by an order of magnitude: session scratch and review reports, 95 files in this repository
  against the two the section named, routed there by `docs-write-guard.js` and
  `stop-docs-hygiene.js` rather than written by any one component.

  **Two findings came out of the reading and are now their own items**, because neither is
  vocabulary. `docs-write-guard.js` interpolates the harness payload's subagent type with no
  sanitizer while its three siblings cap theirs, which is the document's own tripwire firing. And
  the sanitizer ledger's file and cap counts reconcile under no rule: the shipped version said
  seven files and three caps, the reader could reach eight or six but never seven, and a probe
  found four definers and seven cap values. Those counts are removed rather than guessed, and the
  tripwire now stands on the five listed behaviors, which are checkable without them.

  One number in this pass was wrong before it shipped and is recorded because the class recurs: the
  `.kit/` count was written as 82 from arithmetic over a truncated `uniq -c` listing, and the
  actual `find` count is 95.
