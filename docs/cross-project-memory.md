# Cross-Project Memory Tier

A kit-owned memory tier for facts that span projects, so a fact learned in one repo is available in every repo. It sits beside Claude Code's native per-project auto-memory and changes nothing about it. The store lives at `~/.claude-kit-memory/`, outside this repo and outside both `~/.claude` and `~/.claude-work`. Three new hook files implement it, the SessionStart hook is how its contents reach a session, and one skill covers using it.

The failure it exists to prevent is dated. On 2026-08-07 at 16:52 the EleosCore project store recorded that Azure DevOps PR thread anchors need `filePath` with a leading slash, confirmed across five clean posts on PR 398. At 20:58 the claude-kit project store recorded the same form as never established, noting that three review agents had independently stalled on it and guessed. One fact, correct, in a store the sessions that needed it could not see.

The record schema is stated once, in the header of `plugins/claude-kit/hooks/memory-lib.js`, and so is the routing ladder that decides which store a fact belongs in. This document does not restate either. A second copy of a contract is the defect the tier was built to remove, and a summary that has drifted is indistinguishable from one that is current.

## Files and stores

Code, all under `plugins/claude-kit/`:

- `hooks/memory-lib.js` - the schema statement, record parse and serialize, the bounded file doors, the applied-day journal, and `rankDecay`. Every exported function degrades to a typed result and never throws.
- `hooks/memory.js` - the authoring CLI (`add`, `list`, `get`, `stamp`, `decay`). The only writer of records.
- `hooks/memory-index.js` - the derived sidecar (`sync()`) and the generated lines the hook emits (`lines()`), including the `[body revised]` marker.
- `hooks/session-start.js` - two emitted blocks: the generated index, and the advisory decay count.
- `skills/cross-project-memory/SKILL.md` - the operator-facing and session-facing surface: the routing discriminator, three worked examples, the write path, the read path, and the antipatterns.

Store, outside the repo, created on first write at mode 0700:

- `~/.claude-kit-memory/<name>.md` - one file per fact, mode 0600. 14 records as of 2026-08-10.
- `~/.claude-kit-memory/applied.jsonl` - the append-only apply journal, one `{"name","day"}` line per stamp, mode 0600. **Absent in the live store as of 2026-08-10**, because nothing has been stamped yet.
- `~/.claude-kit-memory/.index.json` - the derived sidecar holding two hashes per record, mode 0600, version 1. Present with 14 entries.

The store root was chosen so a later git sync is cheap. Both `~/.claude` and `~/.claude-work` hold `.credentials.json`, `settings.json`, and `history.jsonl`, so a tier nested inside either could only be synced behind an allowlist. Git sync is not built. Two constraints already hold for whoever builds it: `.index.json` is per-machine derived state and must be excluded by name, and `applied.jsonl` is append-only precisely so it merges as a line union rather than conflicting.

## Read path: what a session receives

The SessionStart hook emits two independent blocks per session, on startup, resume, and after every compaction. Both are additive: each is computed inside its own `try`, so a failure in either leaves plan recovery and the other six blocks untouched, and the hook's own `main()` is wrapped again.

The memory block comes last, after all six nudges, because a reference list and a list of asks compete for different attention. It is built from `memory-index.js`'s `lines()`, which generates one line per record from that record's `description:` and stores no line anywhere:

```
- <name> [<kind>] @<machine> [body revised]: <description>
```

The header frames the lines as recorded data rather than instructions, names the tier as separate from the project's own memory, and points at the `cross-project-memory` skill. The block is capped at 30 lines for this tier alone, never a combined cap with the native project index. Past the cap it names the counted remainder and prints the resolved `node "<path>" list` command. Every line is reduced to printable ASCII with whitespace runs collapsed and is capped at 700 characters with truncation announced; the collapse is what stops record content from forging a blank line and with it a block boundary.

The decay nudge joins the nudge stack above the memory block. It is a count and a command, never a list, because the memory block already carries the records themselves.

Bodies never cross into context through the hook. A body is reached by reading the file at its absolute path, the way native project memory already works. `memory.js get <name>` is a convenience and was deliberately not made a gate: `agents/docs-curator.md` grants no Bash under any grant, so a CLI-gated body would be unreachable to the kit's own curator.

## Write path

`memory.js add` is the only way a record is created. It validates the name (kebab-case, 80 characters), requires `--kind` from `machine|platform`, requires `--description` (400 characters, control characters and bidi or zero-width characters refused), bounds every metadata value at 200 characters, generates `created` and `modified`, and publishes the file with `linkSync`, which claims the name in one atomic syscall and returns a duplicate-name refusal on `EEXIST`. A body arrives through `--body`, is normalized from CRLF, and is refused if it carries control characters other than tab and newline or any bidi or zero-width character. That last guard exists because a body is read directly by humans and models, which is the Trojan Source shape.

`memory.js stamp <name>` appends one line to `applied.jsonl` and never rewrites the record, so the record file is byte-identical after a stamp and a test pins that. That is the tier's whole concurrency story for stamping. The earlier design rewrote the record under a compare-and-swap on its content hash, and was measured losing an applied day 8.3% of the time with two concurrent stampers, every process reporting success. The append-only form was verified at 20 concurrent stampers over five runs and 40 two-stamper trials with zero losses. The compare-and-swap survives in `writeRecord` as an optional guarded replace, and nothing calls it, in the shipped hooks or in the tests.
<!-- DRIFT: D1 pending adjudication -->

Both writes refresh `.index.json` best-effort afterwards. A sidecar that could not be written costs one marker, and a derived cache must never veto an authoring act.

There is no `update` and no `delete` verb, and that is deliberate. Correcting a record is a direct edit of the file, which the `[body revised]` marker exists to surface. Retiring one is a human deleting the file, decided against the body. A hand edit gets none of the CLI's validation, so it has to stay inside the schema.

## The generated line and the `[body revised]` marker

Generating the line rather than maintaining a copy of it is the tier's central decision. Measured across the native store, index currency is a byproduct of creating a record (15 of 15 sessions) and never an act of revising one (0 of 8), so a hand-maintained line drifts from its record as a matter of course.

Generation alone does not cover a body whose own `description:` went stale with it, so `.index.json` stores a hash of the description and a hash of the body per record. The marker fires when the body hash changed while the description hash did not. When both changed, the line refreshes silently and no marker appears, because the author did the right thing. Change detection is by content hash, never mtime: a record file can be rewritten without its text changing.

The marker is descriptive and is not a truth claim. A body edit can leave the description accurate. It says what was observed, and it is deliberately not named `[stale]`. Measured fire rate over the seeded set was 2 of 20 records, against 7 of 55 on the live native store as the calibration reference. A marker that fires on everything is a marker nobody reads, so the tests pin the rate and not just the fire.

The hook names marked records from `lines()`'s `markedNames`, which comes from validated filenames. It never asks the model to grep the emitted text for the marker token. A `description` may legitimately contain that token, so a token-triggered instruction to go read a body would let a laundered record turn its bounded 400-character description into an unbounded body read, pre-legitimized by the hook's own voice.

## Advisory decay

Nothing retires, rewrites, or removes a record automatically. `rankDecay` in `memory-lib.js` is the single source of the ranking, read by both `memory.js decay` and the hook, so the count in the nudge and the list it points at cannot disagree.

A record's idle days are counted from its most recent applied day, or from `created` when it has never been applied. Recorded use buys time rather than immunity: `threshold = 30 + min(distinctAppliedDays * 7, 60)` days, and a record is a candidate when its idle days exceed its threshold. Candidates sort most-idle first, then by name.

The nudge is silent at zero candidates only when nothing was left unranked. A store with no candidates but one or more records the ranking could not evaluate (an unusable `created` or `applied` date) emits a line that leads with the unranked count instead, because a store where nothing could be ranked saying nothing at all is the same silent drop in a different costume.
<!-- DRIFT: D4 pending adjudication -->

The ranking is advisory because its input signal is weakly produced. Scott Applefeld's own store showed 23 decay candidates against one recorded usage stamp, which is why automatic retirement was refused. This store demonstrates the same weakness right now: `applied.jsonl` does not exist, so all 14 records rank from `created` alone. Chapter 8 recorded 5 candidates at 33 to 44 idle days on the tier's first real day, and those numbers are measured from migration-era creation dates with no use data behind them at all.

Stamping is what turns the ranking into a measurement rather than an artifact of when records were written. The first `memory.js stamp <name>` creates the journal at mode 0600, and from then on a fact in real use both climbs down the ranking and earns 7 more days of runway per distinct day it was applied. Until a session stamps something, every candidate in that list is only telling you how long ago its record was created.

## How it fails

Every failure mode below was reproduced during the effort rather than reasoned about. The governing rule is that a silent drop is a defect: where this tier cannot read or parse something, it either recovers deliberately or reports it in a count a caller surfaces.

- **Absent or empty store.** Both blocks are silent, `list` prints "no records" at exit 0, and nothing is created. A read-shaped hook never creates the store root.
- **Store exists but cannot be listed** (permissions, a regular file at the root, an I/O error). The memory block emits one sentence saying the tier is unavailable this session and that this must not be read as "there are no cross-project facts". The decay nudge stays silent, since a nudge whose whole content is a count has no count to give. `list` and `decay` exit 1 with the same distinction.
- **Every record fails to parse.** The block still emits, with a header saying records could not be read and a note counting them. Emitting nothing there would report "no cross-project facts" about a store that has them.
- **The applied journal is unreadable** (a FIFO, a dangling symlink, a directory, a character device). The decay nudge goes silent, because with every stamp gone the count is not a high estimate, it is unrelated to idleness. The memory block is unaffected, since it never reads the journal. `memory.js decay` refuses at exit 1 and names the journal path, and that command is the only place this condition is loud. Every file door in the tier opens with `O_NONBLOCK` and checks `isFile()` on the descriptor: before that fix a FIFO at `applied.jsonl` hung every session start indefinitely and a symlink to `/dev/zero` reached 13.5GB of RSS before the kernel killed it. Post-fix measurements were 24ms and 42MB.
- **The journal is truncated past 2MB, or a line is torn.** Reading is capped from the front, so truncation drops the newest stamps and inflates idleness. Both the nudge and `decay` say the count is an upper bound rather than presenting it as exact.
- **A record larger than the 256KB read cap.** It is flagged `partial`, its body is withheld rather than handed back at a truncated length, `writeRecord` refuses to write it back, and no body hash is offered so the marker makes no claim. `get` prints a body-withheld marker plus the path and exits 1. The block counts it so a missing marker is explained.
- **A corrupt, oversized, or foreign-version `.index.json`.** It rebuilds from an empty set. Every record then reads as new and no marker fires that session, which is correct: a comparison with nothing to compare against makes no claim. The block surfaces the reason only when a sidecar existed and could not be used, so a never-synced store does not nag.
- **A record that vanished from the listing but is still on disk.** Its sidecar entry is retained, not dropped. Only `ENOENT` counts as a deletion, because discarding hashes on a transient error would make a revision made during that window invisible forever.
- **A closed pipe.** `memory.js list | head` ends cleanly. EPIPE on either channel is a normal end to a read, not a stack trace.

Status is set through `process.exitCode` in all three memory files and no `process.exit()` appears in any of them, so a write still in flight on a pipe is never discarded. Seven older sites in this kit still carry that defect and are tracked in the backlog.

## Operating it

The invocation that resolves from anywhere is the absolute one. The session-start memory block prints exactly that form, `node "<plugin>/hooks/memory.js" list`, and `finishing-work` step 7 names the CLI as `<plugin>/hooks/memory.js`. The skill's copy-pasteable block gives the path relative to the skill's own base directory instead (`node ../../hooks/memory.js add ...`), which a reader has to join against that base directory rather than against the session's cwd. The `kit-goal` skill it cites as precedent carries the same explanatory sentence but puts `<plugin-root>/hooks/kit-goal.js` in its block.
<!-- DRIFT: D2 pending adjudication -->

```
memory.js add <name> --kind <machine|platform> --description "<text>"
                     [--machine <label>] [--origin <label>] [--body "<text>"]
memory.js list [--kind <machine|platform>]
memory.js get <name>
memory.js stamp <name>
memory.js decay
```

Two environment seams, both real operating levers:

- `CLAUDE_KIT_MEMORY_DIR` relocates the store root. It is trimmed and resolved to an absolute path, because a relative value would make the store cwd-dependent, which is the one property this tier exists to avoid. The test suite uses it to point every case at a store that does not exist.
- `CLAUDE_KIT_MEMORY_NOW` moves the clock for `add`, `stamp`, and `decay` alike, resolved once in `memory-lib.js` so the CLI and the hook can never measure idleness against two different todays. An unparsable value is a typed refusal, not a silent fall back to the wall clock. Chapter 8 used this seam to backfill each migrated record's real `created` date, which spans 2026-06-27 to 2026-08-07.

Gotchas worth knowing before you author:

- **`origin` refuses a comma** even though the schema header calls it a free label. The comma guard exists for the inline list fields and is applied to every metadata value, `origin` included. Six of 14 `add` calls during the migration failed on values like "EleosCore, PR 395" and were reworded. Left as a finding rather than a code change, so the authoritative schema statement currently overstates what the field accepts.
<!-- DRIFT: D6 pending adjudication -->
- **`--description` is the field to slow down for.** It generates the emitted line and is capped at 400 characters. It carries the correction, not a topic label. Four of the 14 migrated records bundle more than one correction in a description (mean 363 characters against the 119 measured on the native store) because their source records did; the cost is that a stamp on a multi-fact record cannot say which fact was used.
- **The hook sweeps the store twice per session start**, once for the index and once for the ranking. That was measured at 48ms and 60 to 70ms and kept deliberately. The residual is a two-snapshot window inherent to any hook that reads twice. Do not "fix" it without reading Chapter 6.

## Trust boundary

Record content crosses into trusted model context at one door, the SessionStart memory block, and that door is narrow by construction. Only the generated line crosses, never a body. Each line is reduced to printable ASCII with whitespace collapsed, capped at 700 characters with truncation announced, and the block is capped at 30 lines. `description` is last on every line so nothing in it can displace a field after it, and every value ahead of it has `[`, `]`, `@`, and `:` neutralized at both the write door and the render door. Marked records are named from validated filenames rather than from record text.

A record body passes no emission door at all, so the guards against control characters, bidi overrides, and zero-width characters sit at the CLI's write door. Two qualifications matter, and an earlier draft of this section got both wrong.

That door is no longer the only one a body enters through: correcting a record is a hand edit, which is the sanctioned path since the CLI has no update verb, and a hand edit is subject to no validation at all. `memory.js reindex` is the door that re-checks every record against the write-door validators afterwards, covering the authored frontmatter fields as well as the body, and running it after a hand edit is part of the procedure rather than optional. It does not check file permissions.

And a body does not reach context only when a human chooses to read it. When the `[body revised]` marker fires, the emitted block tells the session to read that record at the source, so the kit itself orders the read. The marker is triggered from validated filenames rather than from record text, so a record cannot nominate itself, but the consequence stands: a body planted at the write door and then hand-edited is content the kit will point a model at. That is acceptable today because writing to the store requires the same access that would let you edit `~/.claude/settings.json` directly. It stops being acceptable if bodies ever arrive from somewhere other than this machine, which is the inbound half of the git-sync question and a reason `reindex` exists.

The kit's trust architecture as a whole is in `docs/security-model.md`, which the `security-reviewer` agent reads first; this section is the memory tier's own surface in more detail than that document's summary.

## Tests

Gate: `node --test test/*.test.js` from the repo root, after any change under `plugins/claude-kit/hooks/`.

- `test/memory-lib.test.js` pins the schema round trip, the parse recoveries, the injection refusals, the journal doors, and `rankDecay`.
- `test/memory.test.js` pins the CLI: duplicate-name refusal, concurrency under real contention, the typed empty and unreadable results, and the exploit shapes reviewers demonstrated.
- `test/memory-index.test.js` pins the sidecar lifecycle across its corruption modes, the marker in every state, and the marker's fire **rate** over a seeded set, which is what catches an inverted comparison that fires on everything.
- `test/session-start-adoption.test.js` pins the memory block and the decay nudge inside the hook, using its reusable harness: a temp cwd, redirected `HOME` and `USERPROFILE` with a matching CLAUDE.md version marker, and `CLAUDE_KIT_MEMORY_DIR` pointed at a path that does not exist unless a case asks for a store. Extend that file rather than starting a new one.

Test fixtures are synthesized, never copied from a real store. One implementer staged two real records as fixtures, one of which was 8KB of live client incident detail; a test needs the hash relationship, not the incident.

## Migration state

The tier was seeded from existing project stores rather than starting empty. 12 source records became 14 tier records: 10 moved whole, one split into a generalizable half that moved and connection parameters that stayed, and one split three ways with both of its sensitive passages staying behind. `~/.claude-work/projects/*/memory/` stores were edited as part of that move, which is work outside this repo. Three records carrying client production configuration were adjudicated one at a time by Daren; those adjudications and the full loss-and-leakage audit are recorded in Chapter 8 of `plans/cross-project-memory_spec_v1.md`, which is their durable home.

The Goal's own test passes: a claude-kit session now receives the ADO `filePath` leading-slash fact that only EleosCore's store held on 2026-08-07, and the claude-kit record that called it unrecorded now agrees with it.

## Where the doctrine lives

Routing is a write-time decision and the only surface that can prevent a misfile. Three doors carry it, and they were made consistent deliberately:

- `hooks/memory-lib.js`'s header states the ladder itself. It is the authoritative copy.
- `skills/cross-project-memory/SKILL.md` carries the discriminator for applying it (if you cannot state the fact without naming something that exists only in the repo you are standing in, it is a project fact) plus three worked examples, and points at the header rather than restating it.
- `finishing-work` step 7 names the three destinations at the bank-the-learnings moment. `assets/CLAUDE.md` and the root `README.md` conventions carry the same three destinations, since the asset loads in every session while a skill loads on description match.

Doctrine, meaning a recurring working preference, is not a fact and belongs in none of the stores. Its home is `plugins/claude-kit/assets/CLAUDE.md` in this repo, which `reconcile-claude-md` then distributes. That skill applies the baseline and cannot author a rule, so from another repo a preference is recorded as owed rather than filed in a store to get it written down.

One measured finding is worth carrying, because it contradicts the spec's premise for the routing trigger. Across ten fair reps a fresh session handed a cross-project fact at a bank-the-learnings moment routed it correctly every time, citing the library header's line numbers, including under an eleven-hour time-pressured close-out with six mixed learnings. The misfile reproduced only in a fixture that contained no CLI at all. The live failure mode is reachability, not judgment, so the guard to protect is that the CLI resolves from wherever a session is standing.
