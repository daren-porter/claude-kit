# Cross-Project Memory Tier

Status: In Progress
Commit Model: Commit-and-Push
Fable Spend: none (cost hold)
Created: 2026-08-08

## Goal

A kit-owned memory tier for facts that span projects, so a fact learned in one repo is
available in every repo. It is rooted outside any credential-bearing config directory,
its session-start index is **generated from the records rather than maintained beside
them**, and its decay is advisory: nothing ever retires without a human call. When this
is done, the failure that happened on 2026-08-07 cannot happen the same way: the
`filePath` leading-slash form was confirmed at 16:52 in the EleosCore store and recorded
as "never recorded" at 20:58 in the claude-kit store, after "three separate review agents
independently stalled on this and had to guess."

Claude Code's native project-tier auto-memory is untouched and keeps working exactly as it
does today. This tier sits beside it, not over it.

## Approach

Adapted from Scott Applefeld's memq work (`docs/kit-adoptions.md` candidate 1) as **design
input, not a port**. His engine is ~7.2k lines of production JS plus ~14k of tests against
this whole kit's ~7.9k lines; the portable core is decay, stamps, tier routing, and a
session-start index. The design below was settled in a design council (three lenses, two
rounds, converged 2026-08-08) plus four decisions from Daren.

**Facts only; rules graduate out (Daren, 2026-08-08).** The tier holds learned facts:
machine/environment (netplan drops NM VPN secrets; sandboxed Bash cannot reach the SSH
agent; the ADO SSH key expires annually) and org/platform (ELEOS deployment conventions,
client-branch nesting, connector capabilities). Recurring working preferences are doctrine
and graduate to the global CLAUDE.md through `reconcile-claude-md`. The worked example of
skipping this: `EleosCore/memory/feedback_stage_dont_commit.md` duplicates a rule the
global CLAUDE.md already carries, and the memory never retired.

**Decay is advisory (Daren, 2026-08-08).** Nothing auto-retires. A ranked candidate list
rides the existing session-start nudge surface. The reason is evidence, not caution:
Scott's own store showed 23 decay candidates against one recorded usage stamp, so
automatic retirement would rest on a signal his instrumentation shows is weakly produced.
Reinforcement still works, because a heavily-used record simply never rises up the list.

**Root is `~/.claude-kit-memory/`,** following the `~/.claude-kaizen/` precedent at
`hooks/session-start.js:33`. This is the decision that makes later git sync trivial. Both
`~/.claude` and `~/.claude-work` hold `.credentials.json`, `settings.json`, and
`history.jsonl`, which is why Scott's sync repo needs an allowlist plus four probes plus
drift detection; his own words are that the allowlist "is the only barrier between 'sync
memories' and 'publish credentials'." A tier the kit owns can choose a clean root and
inherit none of that.

**The emitted line is generated from each record's `description:` frontmatter, never
hand-maintained.** This is the council's central finding and it fixes a measured defect.
Across the 23 main sessions that author memory the split is perfect: sessions that
**create** a record touch `MEMORY.md` 15/15; sessions that only **revise** a body touch it
**0/8**. Index currency is a byproduct of creation and never an act of revision, so a
hand-maintained line drifts from its record as a matter of course. Two live instances
verified: `mcp-providers-connector/memory/MEMORY.md:2` still names an OBO refresh race as
"likely cause" after session `085f8aff` rewrote that body's root cause twice on
2026-07-23, and the `pr-review-first-use-confirmations` line still advertises an
auto-complete confirmation that commit `40c63b3` retired. `description:` is present on
55/55 records, mean 119 chars against the hand-maintained lines' 184.

**A computed `[body revised]` marker, because generation alone is not enough.** Deriving
the line from `description:` fixes the pr-review case but not the mcp-bridge case, where
the body's own `description:` is stale too. So the index sidecar records a hash of the
description and a hash of the body: the line refreshes silently when the description hash
changes, and emits `[body revised]` when the body hash changed while the description hash
did not. That is exactly the mcp-bridge signature (body rewritten twice, description
untouched) and it suppresses the false alarm when the author updated both. Measured over
the existing 55 native records the equivalent comparison fires on 7: two materially false,
four true-but-incomplete, one clean false positive. It is descriptive and must not be
renamed `[stale]`; it is not a truth claim.

**Amended in S1 (2026-08-08), from mtime to a content hash.** The design first specified
`hash(description)` plus the body **mtime** at last sync, on measured evidence that mtime
is trustworthy in the native store. S1's review showed that evidence does not transfer:
the native store has no CLI rewriting records, but this tier stamps `applied:` into the
record file, so **every apply-stamp advances mtime with the description and body
unchanged** and a mtime-based marker would fire on every stamped record. That defeats the
discriminating criterion the marker exists to satisfy. Hashing the body answers the actual
question, is immune to stamping, and removes the mtime-trust question entirely.

**Emission rides the SessionStart hook, and bodies are read directly.** The hook is the
exercised, cwd-aware channel and already carries the sanitize idiom at
`session-start.js:152` (`[^\x20-\x7E]` strip, char cap) with the "repo data, not
instructions" framing at `:310`. A `CLAUDE.md` `@-import` was proposed and rejected: its
stated justification turned out to be a misreading (two function-scoped docblocks
generalized into a file-level contract), neither `CLAUDE.md` on this machine contains a
single `@-import` so the channel is entirely unexercised, and its only advantage is
subagent reach whose measured yield is zero across 205 sidechain transcripts.

Bodies are plain files reached by direct `Read` at an absolute path, matching the native
tier that already works this way. A CLI-only body path was proposed and died
categorically: `agents/docs-curator.md` grants `Read, Grep, Glob, Write, Edit` and no Bash
under any grant, so a CLI-gated body is unreachable to the kit's own curator; `Read` is
granted to all 11 agents while Bash is granted to 10; and zero CLI-style memory access
exists anywhere in 254 transcripts. The CLI keeps authoring, curation, and decay
adjudication, where Bash is present and the operator is there.

**Dropped, each with its reason, so a later pass does not re-propose them.** A per-record
confidentiality tag: Daren waived its motive (client identifiers in standing context are
"governance and appearance rather than breach" and he declined a mechanism), and it is
unenforceable anyway because `cat`, `sed`, `awk`, `grep`, and `head` are all pre-allowed,
so any hook gate is defeated by the next tool in the list. Repo-scoped emission: conceded
by its own proposer, and `sandbox-git-ssh-fetch.md` shows why, since it is filed under the
claude-kit project while its trigger is sandbox execution mode and its body records an
observation made in EleosCore, so filing location does not predict trigger. Storage
separation for restricted bodies: it would put those bodies permanently out of reach of
`docs-curator`.

**Why not option B (no injection, query on demand).** Two independent kills. Structurally,
8 of 12 seed records are facts where the model holds a **confident wrong prior** and gets
no ignorance signal at all ("not nmcli-modify", "`ssh -T` lies about it", "`search_code`
empty is not absent"), so a "query when you hit unfamiliar ground" trigger cannot fire on
the majority of the tier's own content. Empirically, every one of the 30 observed body
retrievals began from an injected index and none began from a search; in two clean
sessions (`4411daac`, `f4a5e902`, both pr-review runs whose prompts never mentioned
memory) the model reached a body by exact filename mid-task with no lookup step, and the
only possible source of that filename was the injected index.

## Standing Brief Amendments

Folded into every later dispatch brief. Each entry earned its place by a review finding
recurring across sites, so the guard travels with the workflow rather than being
rediscovered per section.

- **A guard applied at one door must be applied at every door.** S1's review surfaced this
  twice in one changeset: the control-character refusal covered `description` but not
  metadata values (exploitable through the sanctioned writer, forging the very field that
  generates emitted context), and name validation covered the filename but not the parsed
  frontmatter `name`. When you add a validation, sanitization, or bound, enumerate every
  field and every entry point that reaches the same sink and cover all of them, then say in
  your report which doors you enumerated.

  **This recurred in S2 despite the amendment being in that brief, so enumerate against
  code rather than against intent.** S1 fixed "a truncated body must not be written back"
  on the prefix-read path; `readRecord`'s full-read path, eleven lines away in the same
  function, kept the defect, and S2's `stamp` rewrote a 307KB record down to 262KB with a
  success message. A second instance: the CLI chose `lstatSync` at the record door with an
  explicit comment about dangling symlinks, then used `statSync` at the lock door two
  functions away. The enumeration that works is mechanical, "grep every call site of this
  function and every branch of this condition", not "think about where else this applies".

  **S5's late review found the fifth instance, and it names an axis the first four missed:
  a guard belongs at every door of its KIND, including doors the section did not write.**
  S5 added no file reads at all. It routed the SessionStart hook through
  `readAppliedJournal`, which had always used a plain `readFileSync` while every other file
  door in this tier opens `O_NONBLOCK` and checks the descriptor. A FIFO at `applied.jsonl`
  then hung every session start on the box indefinitely, and `/dev/zero` there took 13.5GB
  of RSS before the kernel killed it. So the enumeration also runs over the doors a change
  newly EXPOSES: when a section puts an existing reader on a new path, that reader's
  guarantees become the new path's guarantees, and they have to be checked against the
  contract of the surface it just joined rather than the one it was written for.
- **A silent drop is a defect, not a degradation.** Several S1 findings shared this shape: a
  4-space-indented metadata block, a kebab-case metadata key, a bracket-less `applied:`
  value, and a record whose frontmatter exceeded the read cap all vanished with `ok: true`
  and no diagnostic. Where this tier cannot parse or cannot read something, it either
  recovers deliberately or reports it in a count a caller can surface. Never both accept
  and discard.

## Sections of Work

### 1. Tier, schema, and root
Establish `~/.claude-kit-memory/` with the file-per-fact format and the frontmatter
contract. `description:` becomes load-bearing, since it generates the emitted line: the
schema must state that it carries the **correction**, not a topic label ("netplan drops NM
VPN secrets, use a native keyfile, not nmcli-modify" rather than "dev box VPN gotcha").
Define the frontmatter fields, the `MEMORY.md`-equivalent index file's role (a generated
artifact, not a hand-maintained one), and the directory's relationship to the native tier.
This is the migration-costly decision in the whole effort: stamps and fields cannot be
backfilled onto records that never carried them.
Acceptance: the store root resolves and is created on first write, private to the operator
(0700/0600, since S6 migrates records describing client production configuration into it);
the schema is stated in full where the implementers of S2 through S4 will read it, naming
which fields are authored and which are generated, and stating that the CLI is the only
writer; a hand-authored record round-trips without losing metadata; the Open Question on
the index file's shape is decided and recorded.

Two acceptance clauses moved, recorded here rather than dropped. The original "round-trips
through the section 2 CLI" belongs to S2, which does not exist yet; S1 satisfies the
testable half by round-tripping hand-authored records through the library. The
operator-facing schema documentation belongs to S7's skill, which is the surface a session
actually reads; duplicating it in `docs/` now would create a second copy to drift, which is
the defect this whole tier is built against. S1's obligation is that the schema is stated
completely and in one place, which it is, in the library header.
Execution mode: main.

### 2. The CLI
Authoring (with the concurrency guarantees below, since the tier is shared across concurrent sessions of
every project), listing, retrieval by name as a **convenience and never the only path**
(bodies stay directly `Read`-able per Approach; the CLI must not become a gate), and the
ranked decay-candidate query that section 5 surfaces. Lives under `hooks/` per the
`kit-goal.js` precedent and resolves via `$CLAUDE_PLUGIN_ROOT` with the
skill-base-directory fallback. Node core only, CommonJS, zero dependencies, and every
filesystem function wrapped so it degrades to a null or default rather than throwing, per
`hooks/kit-goal-lib.js:10-14`.

Use `process.exitCode` and let the process end naturally; never `process.exit()` after
writing to stdout or stderr. Forcing the exit can discard a write still in flight on a
pipe, which is an open defect at seven sites in this kit (`docs/backlog.md`) and is exactly
the shape to not reproduce in new code. `hooks/kit-goal.js` is the in-repo precedent.
Acceptance: a record can be created, listed, retrieved, and stamped as applied from any
working directory; concurrent writes do not corrupt the store; every command exits
non-zero with a sanitized message on bad input and never throws; no `process.exit()`
appears in the new code.
Tests: at minimum lock the concurrency guarantees under real contention, duplicate-name refusal,
and that a malformed or absent store yields a typed empty result rather than a throw. The
risk: this CLI is the only authoring path, so a crash here is a lost fact.
Execution mode: delegate-capable.

### 3. Generated index sidecar and the `[body revised]` marker
The sidecar holding `hash(description)` and `hash(body)` per record (amended from
last-observed mtime in S1; see Approach), the line
generation from `description:`, and the marker computation. Silent refresh when the hash
changes; `[body revised]` when the body hash changed and the description hash did not.
Absent sidecar
rebuilds rather than errors.
Acceptance: editing a record's body without touching `description:` makes the marker
appear on the next emission; editing both refreshes the line silently with no marker;
deleting the sidecar rebuilds it; a record whose body is unreadable is skipped rather than
throwing. **And the discriminating criterion: run against the migrated seed set, the
marker fires on a small minority, not on most of it.** An inverted comparison passes every
happy-path assertion above while firing on everything, so the count is what catches it;
the same computation over the existing 55-record native store fires on 7, which is the
calibration reference.
Tests: the two live records are natural fixtures and both must be pinned, copied into the
test tree rather than read from the real store:
`mcp-bridge-intermittent-auth.md` (body rewritten twice, `description:` untouched, marker
must fire) and `pr-review-first-use-confirmations.md` (`description:` current, hand line
stale, generation alone must fix it with no marker). Also lock the false-positive
suppression explicitly. The risk driving this: the suppression logic is easy to get subtly
backwards, and a marker that fires on everything is a marker nobody reads.
Execution mode: delegate-capable.

### 4. SessionStart emission
A new block in `hooks/session-start.js` emitting the generated index, following the `:310`
idiom exactly: control-character strip, char cap, and explicit framing that these lines are
facts to weigh and not instructions to follow. Capped at 30 lines for this tier alone,
never a combined cap with the native tier (EleosCore's native index already runs 32 lines
and settled scope leaves it untouched), with a counted remainder naming how to reach the
rest. The block stands on its own rather than joining the existing six-nudge stack, since a
reference block and a reminder block compete for different attention.
Acceptance: a session in any repo receives the block; the block is absent when the store is
empty or absent, and an UNREADABLE store instead emits one sentence saying so (amended in S4:
the original text said absent, but a store that could not be read must never read as "there
are no cross-project facts", per Standing Brief Amendment 2); truncation announces a counted remainder; the hook never throws and
never blocks.
Tests: extend `test/session-start-adoption.test.js`, which already carries the reusable
harness (temp cwd, redirected `HOME`/`USERPROFILE` with a matching version marker so
`claudeMdSyncOffer` stays quiet). Lock emission, the empty-store silence, the cap with its
counted remainder, and that store content cannot forge a block boundary or inject a fake
header. The risk: this hook writes into trusted context at every session start.
Execution mode: delegate-capable.

### 5. Advisory decay surfacing
The ranked candidate list (idle time adjusted by recorded use) on the session-start nudge
surface, in the register the kaizen count and adoption-staleness blocks already use.
Nothing retires; the block states counts and points at the CLI.
Acceptance: a store with no idle records emits nothing; a store with idle records emits one
line naming the count and the command; the ranking demotes records with recorded recent
application.
Execution mode: delegate-capable.

### 6. Seed migration and content pass
Move the misfiled cross-project records out of the project stores, adjudicated one at a
time, not in bulk. The identified set: `reference_dev_box_vpn_netplan`,
`reference_azure_devops_ssh_over_gcm`, `reference_devops_connector_capabilities`,
`reference_client_branches_origin_authoritative`,
`reference_client_branch_asr_eleos_nesting`, `reference_eleos_db_deployment_convention`,
`reference_eleos_dataaccess_gotchas`, `reference_tl2000_as400_tms`,
`reference_eleos_settings_enablement_surface` (all EleosCore),
`claude-kit/sandbox-git-ssh-fetch`, and `-home-daren/ado-ssh-key-expiry`.

Three records need a body-level content review before they move, because they carry client
production security configuration: `eleos-platform-connector.md:16-19` (a token with
maintainer Write/Delete/Rollback across ~51 environments including production),
`reference_eleos_db_deployment_convention.md:24-26` (client TMS databases marked
TRUSTWORTHY with `owner=sa` plus a broad `dbo` grant), and `reference_dev_box_vpn_netplan.md`
(gateway IP and account name). Adjudicate each: move as-is, split into a generalizable half
and a client-specific half that stays in the project store, or hold back. Index lines are
not at issue; all 15 candidate lines were checked and carry zero credentials, IPs,
usernames, grants, or DDL. Client identifiers in index lines stay as written, per Daren's
2026-08-08 decision.

Fix the two live data-quality bugs while here: `mcp-providers-connector/memory/MEMORY.md:2`
still names a superseded root cause, and the `pr-review-first-use-confirmations` /
`reference_devops_connector_capabilities` pair holds contradictory state about the
`filePath` leading-slash form (the connector record confirms it; the pr-review record says
it was never recorded).
Acceptance: each moved record resolves from the new tier and no longer appears in its
project store's index; each of the three sensitive records carries a recorded adjudication;
both data-quality bugs are corrected.
Execution mode: main.

### 7. Skill, routing rule, and docs
**Reordered ahead of S6 (2026-08-09).** S6 cannot proceed without Daren's adjudication of
its three sensitive records, and it edits records in his live project memory stores. S7
needs nothing from him. Beyond the gate, the order is better on merits: S7 writes the
routing doctrine that says what belongs in this tier, and S6 is that doctrine applied to
eleven records, so making the eleven calls against a written rule beats making them ad hoc
and then writing the rule to match. S7 also runs in the **main thread** rather than its
recorded delegate-capable mode: it writes under `docs/`, which the docs-write-guard denies a
non-curator subagent, and its prose is behavior-shaping, so `writing-skills`' bar and the
RED gate below are judgment the brief cannot carry.

A skill stating how sessions write to this tier and, critically, the routing ladder: a
learned fact that spans projects goes here, a project-specific fact stays in the native
project store, and a recurring working preference is doctrine that graduates to the global
CLAUDE.md through `reconcile-claude-md`.

**The routing rule needs a procedural trigger, not just a statement.** Section 6 cleans up
the eight cross-project records currently misfiled in EleosCore's store; nothing in
sections 1 through 6 prevents the ninth, because misfiling is a **write-time** miss and
every other surface in this effort is read-time. Hang the routing check on the existing
bank-the-learnings step in `finishing-work`, which is already the procedural moment where
a session decides what to record and where. That is an observable moment in a skill the
kit owns, rather than a rule that depends on a session noticing mid-work that a fact it is
about to write is cross-project.

**Amended in S7 (2026-08-09): the second sentence above is falsified, and the RED gate is what
falsified it.** S1's library header states the routing ladder, and agents read it and apply it.
Across ten fair reps a fresh session handed a cross-project fact at a bank-the-learnings moment
routed it correctly every time: with both stores named, with the CLI present but unadvertised,
and under an eleven-hour time-and-authority-pressured close-out carrying six mixed learnings
including a decoy preference. Several explicitly overrode the old step-7 wording to do it ("the
project tier is the default reading of that step, and I went against it deliberately"). The
misfile reproduced only in a confounded arm whose fixture contained no CLI at all, where the
agents' "there is no promotion path available to me here" was literally true of the sandbox. So
sections 1 through 6 DO prevent the ninth, the live failure mode is **reachability** rather than
judgment, and S7's trigger edit is justified as an accuracy fix to prose that named one
destination out of three, not as a behavior guard. Every behavior claim written against the
confounded arm was cut before commit rather than shipped on evidence that did not survive. The
artifacts are in Chapter 7.

This is behavior-shaping prose, so `writing-skills`' bar applies in full. **The RED is
available locally and should be used rather than invoking the "When a local RED is not
available" clause:** the `filePath` leading-slash case is a recorded, dated, attributed
instance of exactly the failure this routing rule guards. On 2026-08-07 at 16:52 the
EleosCore store recorded the form as confirmed by five clean posts on PR 398; at 20:58 the
claude-kit store recorded it as "never recorded," noting "three separate review agents
independently stalled on this and had to guess." A cross-project fact sat in a project
store where the sessions that needed it could not see it. Record the gate's artifacts in
this effort's Chapter; do not add a fourth instance to the backlog's open
unvalidated-wording item while citing the clause that exists to prevent it.
Acceptance: the routing rule names an observable predicate rather than a judgment call
where it can; the trigger point in `finishing-work` is edited, not merely referenced; the
skill states the tier's write path is the CLI and not the Write tool; the docs index
carries the new entries.
Execution mode: delegate-capable.

## Out of Scope

- **Subagent reach.** Deferred to v2 per Daren's 2026-08-08 call. SessionStart output does
  not cross the subagent boundary (verified three ways: 0 of 41 subagent transcripts for
  session `542e8c96` carry a marker the main transcript carries 3 times). The cheap v2 path
  is a required, explicitly `none`-valued field in the agent definitions' `## Your brief`
  enumeration, not the `@-import`. Note the open counter-evidence: native auto-memory
  already reaches subagents and its measured body-consultation yield there is zero across
  205 sidechain transcripts, so v2 should start by settling whether that is "no occasion"
  or "injected and ignored."
- **Semantic/vector index.** Deferred on the reasoning that it is a derived, rebuildable
  sidecar addable later at zero migration cost. The trigger to revisit is observable: when
  the tier's emission starts hitting its 30-line cap regularly.
- **Git sync across machines.** The root choice in section 1 is what makes it cheap later.
  Not built here.
- **Confidentiality tags, repo-scoped emission, storage separation.** Dropped with reasons
  recorded in Approach.
- **Any change to native project-tier auto-memory.**

## Open Questions

- Section 3's execution mode. Assigned delegate-capable on the strength of a precise brief
  plus two real fixtures. Daren was offered the argument for raising it and did not take
  it; revisit if the implementer escalates.
- ~~Whether the tier's generated index file should be human-readable in the same
  `MEMORY.md` shape as the native tier, or a machine format.~~ **Decided in S1
  (2026-08-08): a machine-readable sidecar, not a `MEMORY.md`-shape file.** The sidecar
  holds hashes and is regenerated on demand, and a second human-readable index file is
  precisely the artifact that drifts from its records: shipping one would rebuild the
  defect this tier exists to remove. The human-readable views are the session-start
  emission (S4) and the CLI's list command (S2), both generated at read time from the
  records themselves.

## Chapters

### Chapter 1 - 2026-08-08
Completed: 1. Tier, schema, and root
Implemented By: main session (design-entangled: the schema is the effort's migration-costly decision)
Metrics: 2 review rounds; 0 NEEDS_CONTEXT; 0 escalations; advisor off for this section
Decisions / Surprises:
- **The change signal moved from mtime to a content hash, and this is the round's real
  find.** The adversarial reviewer showed the spec's mtime design was self-defeating *in
  this tier*: `applied:` stamps live in the record file, so every stamp rewrites it and
  advances mtime with description and body unchanged, which is exactly the condition S3
  emits `[body revised]` on. The marker would have fired on every stamped record and
  defeated its own discriminating criterion. The measured mtime-trust evidence came from
  the native store, where nothing rewrites records, so it never transferred. Hashing
  description and body separately answers the actual question and is immune to stamping.
  Approach amended in place; S3's brief inherits it.
- **Index shape decided (Open Question closed): a machine-readable sidecar, not a
  `MEMORY.md`-shape file.** A second human-readable index is the artifact that drifts from
  its records, which is the defect this tier exists to remove. Human-readable views are
  generated at read time by S4's emission and S2's list command.
- Two S1 acceptance clauses moved rather than dropped, both recorded in the section: the
  CLI round-trip belongs to S2 (which does not exist yet), and the operator-facing schema
  doc belongs to S7's skill, because duplicating the schema into `docs/` now would create
  the second copy this design is built against. The schema is stated in full in the
  library header, which is where S2 through S4's implementers read it.
- Acceptance amended from "the root exists" to created-on-first-write. `ensureStore()` is
  lazy at 0700, proven by a test that deletes the store and asserts recreation. Nothing
  outside the repo was changed by this section.
- Store and records are created 0700/0600 rather than inheriting the umask, because S6
  migrates records describing client production configuration into this store.
- Deferred to S7: `memory-lib.js` is missing from the repo tree listing in `README.md`.
  S7's acceptance already covers the docs surfaces.
Review Findings: paired review plus security, all three returning CHANGES_REQUIRED or
CONCERNS on the first round. Three findings were reproduced independently by all three
reviewers, each confirmed by running the code rather than reading it.
- **Critical, fixed and proven closed.** The control-character refusal covered
  `description` only while `serializeRecord` wrote metadata raw, so a newline in `origin:`
  forged a `description:` line through the sanctioned writer, and `description` is what
  generates emitted context. Chained, it also forged the frontmatter `name`, which
  `recordPath()` would then join outside the store. All three demonstrated exploits now
  return `ok:false` with nothing written; the transcript of that check is in the section's
  verification.
- **Critical, fixed.** A `frontmatterOnly` read returned a truncated `body` unmarked, and
  writing that object back persisted the truncation (~2KB destroyed silently). Partial
  reads are now flagged, the body is withheld, and `writeRecord` refuses a partial record.
- **Critical, fixed.** The record `name` came from unvalidated frontmatter rather than the
  validated filename. It is now taken from the filename, and a disagreeing frontmatter
  name is reported rather than trusted or silently dropped.
- **Major, fixed.** Silent drops: 4-space metadata indent, kebab-case metadata keys, a
  bracket-less `applied:` value, and a record whose frontmatter exceeded the prefix cap all
  parsed `ok:true` while losing data or becoming invisible to `listRecords`. Each now
  either parses correctly or is counted in `skipped`.
- **Major, fixed.** Fixed tmp path replaced with the pid-suffixed form `kit-goal-lib.js:150`
  established, since this tier is shared across concurrent sessions; `unquote` no longer
  strips quotes that are content; `kind` is validated against `KINDS`; `created`/`modified`
  are generated in `writeRecord` rather than left to a caller; `applied` dates are format-
  checked.
- **Minor, fixed:** env override trimmed and resolved absolute, `recordPath` validates
  rather than trusting callers, null/false metadata handled, comma-in-list-element refused,
  symlinks counted consistently by both APIs, mtime read from the same descriptor as the
  bytes.
- **Recurrence rule applied.** "A guard at one door but not all doors" appeared twice in
  one changeset (control chars on `description` only; validation on the filename only), and
  "a silent drop" appeared four times. Both are now `Standing Brief Amendments`, so every
  later dispatch inherits them instead of rediscovering them.
Verification: `node --test test/memory-lib.test.js` 26/26; `node --test test/*.test.js`
185/185, no regressions. One test was watched failing first and fixed a real gap (the
bracket-less `applied:` normalization). One test from the first round was found **vacuous**
by probing it and was rewritten: the colon-in-description case could not fail, because a
top-level key match already takes the rest of the line. Probing it surfaced the newline
hazard that was real and unguarded, which is how the injection class was found before the
reviewers confirmed it.
Next: 2. The CLI
Commit Model: Commit-and-Push

### Chapter 2 - 2026-08-08
Completed: 2. The CLI
Implemented By: implementer-opus (build, then a fix round), with the concurrency redesign and the library changes in the main session
Metrics: 3 review rounds; 0 NEEDS_CONTEXT; 0 mode escalations (the ladder pointed at delegate-fable after round 2, the cost hold blocked it, and the stall went to Daren as the skill directs); 2 dispatches lost to API stalls, re-dispatched at the same mode since infrastructure failure is not a review failure; advisor off
Decisions / Surprises:
- **The concurrency primitive was replaced twice, and the second replacement is the one that
  holds.** A store-wide lockfile was built first, per the spec. Rounds 1 and 2 produced
  Criticals that were all lock-lifecycle failures: a stale lock stolen with no grace period,
  a reused pid wedging every write from every project until a human deleted the file, an
  unbreakable lock spinning at 100% CPU. Daren approved replacing it with optimistic
  concurrency. Stress testing my own replacement then found it losing an applied day
  silently, and round 3 measured the rate properly: **8.3% with two concurrent stampers,
  every process reporting success.** Compare-and-swap on a plain file cannot close a
  multi-process read-modify-write, because two writers can both pass the swap before either
  publishes. The answer was to remove the shared mutable state rather than guard it: `stamp`
  now appends one line to `applied.jsonl` and never rewrites the record. Verified at 20
  concurrent stampers over five runs (20 of 20 days each) and 40 two-stamper trials (zero
  losses). It is also the git-sync shape, an append-only file merging as a line union.
- **I accepted a documented data-loss residual and the reviewer was right to refuse it.** I
  had written twenty lines justifying the CAS window on "realistic use is one or two
  stampers, where the window is microseconds". The measurement refuted both halves: the
  losing window is rename-to-verify-read, which includes a 256KB buffer allocation and a
  full parse, so milliseconds, and two stampers is where 8.3% was measured. Standing Brief
  Amendment 2 carries no probability qualifier, and a workaround needing a paragraph of
  justification is the signal the code is wrong. Recorded because the failure mode was mine,
  not the implementer's.
- Moving `applied` out of the record and into a journal is a schema change to S1's
  migration-costly decision. It cost nothing because the store has no production records
  yet, which made this the cheapest possible moment to make it. Hand-written `applied:`
  frontmatter is still honored on read, unioned with the journal, so a migrated or
  hand-authored record needs no conversion.
- Two capabilities improved as a side effect: a record past `RECORD_READ_CAP` and a record
  with an unparsable hand-written date can both be stamped now, because nothing rewrites
  them. Both previously had to be refused.
- `[body revised]`'s change detection also moved from mtime to a content hash, for the same
  reason in reverse (S1 Chapter 1), so the two are now consistent.
Review Findings: three rounds, every one returning CHANGES_REQUIRED or CONCERNS, and every
round's Criticals reproduced with measurements rather than asserted.
- **Round 1 (2 Critical, 8 Major).** `stamp` silently truncated any record past 256KB
  (measured 307KB in, 262KB out, exit 0) because S1's truncated-body guard covered the
  prefix read and not its sibling full read; `writeRecord` silently overwrote an unparsable
  authored `created`, destroying it and resetting the decay clock; the lock acquire loop
  spun forever on a lock it could not unlink; `listRecords` reported "no records" at exit 0
  for a store it could not open; a failed pid write leaked the lock; EPIPE dumped 1245 bytes
  of stack trace on `list | head`; `--machine` could forge the structure of a generated
  line through the sanctioned writer.
- **Round 2 (2 Critical, 5 Major).** The pid-liveness gate I asked for *replaced* the age
  rule instead of joining it, so a dead-looking pid stole a fresh lock instantly and a
  reused live pid wedged the store permanently. Also: my own S1 fix had over-corrected,
  refusing unmodelled top-level frontmatter keys at the read door, which made a perfectly
  legible record invisible to `get`, `list`, and `decay` at once. Those keys are now carried
  through instead.
- **Round 3 (2 Critical, 5 Major).** The measured CAS loss above; a test asserting an
  invariant the same changeset documented as unattainable (18% flaky); a BOM'd record that
  could never pass the CAS because the two sides hashed differently-normalized bytes; and
  unvalidated, unbounded keys and values in the new `extraTop` path, where a newline in a
  KEY forged the `description` line. All fixed and each verified closed by running the
  reviewer's own reproduction.
- **Recurrence rule applied twice.** Amendment 1 ("a guard at one door must be applied at
  every door") recurred in round 1 despite already being in the brief, so it was sharpened
  to demand a *mechanical* enumeration (grep every call site and every branch) rather than
  reasoning about where else a guard applies. Amendment 2 ("a silent drop is a defect")
  is what round 3 used to refuse my accepted residual, which is the amendment working.
Verification: `node --test test/*.test.js` 225/225. Stress: 20 concurrent stampers x 5 runs
all 20/20; 40 two-stamper trials, 0 losses. The four exploit shapes reviewers demonstrated
(metadata-key newline forgery, extraTop-key forgery, oversized extraTop, unknown write
mode) all refused with nothing written.
Next: 3. Generated index sidecar and the `[body revised]` marker
Commit Model: Commit-and-Push

### Chapter 3 - 2026-08-08
Completed: 3. Generated index sidecar and the `[body revised]` marker
Implemented By: implementer-opus, with the test fixtures replaced in the main session
Metrics: 1 review round pending at commit time (the implementer ran nine mutation checks of its own); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Decisions / Surprises:
- **A security warning fired on this section and it was correct.** The implementer copied
  two REAL memory records into `test/fixtures/memory/` as fixtures and staged them. One was
  8KB of live client incident detail from the mcp-providers-connector engagement: commit
  SHAs, Azure Container App revision identifiers, internal service architecture, an Entra
  OBO token flow. This repo has an open plan for going public (`plans/kit-denaming`), and
  the council's risk lens had already established that real records carry client-sensitive
  content. Both fixtures were removed and replaced with synthesized records that carry the
  same STRUCTURE (one whose body was rewritten while its description was never touched, one
  whose description is current) and none of the content. A test needs the hash relationship,
  not the incident. The implementer flagged the exposure itself in its report, which is the
  right instinct; the fix was simply not its call to make from inside `docs/`-denied scope.
- The synthesized fixture had to be padded past `FRONTMATTER_READ_CAP`, because one
  assertion deliberately exercises the full-record read path rather than the bounded prefix.
  That size is part of what the fixture tests, so the padding is real content rather than
  filler.
- Marker fire rate over the seeded set: 2 of 20, 10%, against the 7 of 55 (13%) calibration
  measured on the live native store. The rate assertion is what catches the fires-on-
  everything inversion, which reports 12 of 20.
- Spec section 3 still described the sidecar as storing body mtime; corrected in place to
  the content hash the S1 Chapter already amended the Approach to.
Review Findings: the paired review ran AFTER the section commit rather than before, which
inverts the section loop; the fixes landed in a follow-up commit and the deviation is
recorded here rather than smoothed over. Both reviewers independently found the same MAJOR.
- **`constructor` is a legal record name.** It passes the kebab-case pattern, and the
  sidecar's maps were plain `{}` literals, so a lookup returned `Object.prototype`'s member
  and the entry was dropped from the sidecar **uncounted** — Amendment 2 verbatim. Its
  second face skipped the removal branch, so a deleted entry survived indefinitely with
  `removed` never incremented. Fixed with `Object.create(null)` at all five construction
  sites, including the four early-return rebuild paths I missed on the first pass. Pinned by
  two tests that bite when the literals are restored.
- **`exists()` recorded "I could not tell" as "it was deleted"** (blind reviewer). Any
  `lstat` error, not just ENOENT, dropped the entry, discarding exactly the hashes the
  retention branch exists to preserve; on a store designed to sync across machines, a
  transient EIO on a child with a healthy parent is ordinary. Only ENOENT is a deletion now.
  **My first attempt at this fix silently did not apply** (the match string omitted a
  comment inside the `try`), and the suite stayed green because nothing covered it. Caught
  by writing the test first and finding it still failed. Pinned with a stubbed `lstatSync`,
  since there is no portable way to provoke EIO on a real path and an unpinned fix is one
  that regresses quietly.
- Minor, fixed: `lines()` read the store before the index, so a concurrent sync produced a
  FALSE marker; reversed, so the same race now produces a missed one, which is the direction
  the module argues for. `lines()`'s catch omitted the `unreadable` flag its own contract
  promises. A hand-written `kind: []` parses to an empty array, which is truthy, so
  truthiness was the wrong test at a render door.
- Both reviewers confirmed the marker logic itself correct in every state, the partial-record
  third state genuinely three-valued, and the sidecar lifecycle rebuilding rather than
  erroring on all six corruption modes.
Verification: `node --test test/memory-index.test.js` 19/19; `node --test test/*.test.js`
244/244.
Next: 4. SessionStart emission
Commit Model: Commit-and-Push

### Chapter 4 - 2026-08-08
Completed: 4. SessionStart emission
Implemented By: implementer-opus, with the review fixes in the main session
Metrics: 1 review round (adversarial + security; **blind was deliberately skipped**, recorded below); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Decisions / Surprises:
- **The tier is live.** A session in any repo now receives its cross-project facts at
  session start, framed as data. This is the effort's payoff and it is verified against a
  real store, not just in tests.
- **The security review found the laundering amplification this whole tier was reviewed
  against, and it was real.** The block's framing ended with "a line marked [body revised]
  ... so read that record at the source". That instruction was triggered by a literal token
  in record text, and a description can carry that token through the sanctioned writer,
  because `memory.js` exempts `description` from its delimiter refusal by design (the field
  is last on the line, so it cannot forge structure). A record BODY passes no emission door
  anywhere: no cap, no sanitization, no framing. So a laundered record could turn its
  bounded 400-character description into an unbounded body read, pre-legitimized by the
  kit's own voice. Fixed by moving the trigger into authoritative data: `lines()` now
  returns `markedNames` (validated filenames, unforgeable) and the hook names the marked
  records itself. The framing no longer mentions the token at all, so a forged one is inert
  text. Verified end to end.
- **Nothing in production called `sync()`, so the marker could never fire.** The hook only
  reads, `memory.js` did not require the index module, and the only `.sync()` call sites in
  the repo were in tests. `.index.json` was never written, every comparison had no stored
  hash, and the block told the model in trusted context what a marker means, every session,
  when one structurally could not appear. This also left S3's acceptance unmet end to end.
  Fixed by making the writer maintain the index: `memory.js` syncs after a successful `add`
  or `stamp`, best-effort, because a derived cache must never veto an authoring act.
  Verified: the sidecar is written, a body edited without its description now yields
  `markedNames: ["drift-fact"]`.
- A store whose records ALL fail to parse emitted nothing at all, dropping its skipped count
  and index reason. The guard it relied on (`unusable`) was structurally always zero, since
  a rendered line always begins with a validated name and can never sanitize away to
  nothing. That is Amendment 1 recurring a fourth time and Amendment 2 verbatim; the
  reviewer's phrasing is worth keeping, that the enumeration "was mechanical over the wrong
  axis" — complete over values reaching emitted text, blind to conditions suppressing the
  block.
- Spec acceptance amended in place: an unreadable store emits one sentence rather than
  nothing. The implementer raised this as a spec-versus-amendment tension rather than
  silently picking one, which is the right instinct; Amendment 2 is the stronger rule.
- Recorded divergence, not a defect: this file now carries two sanitizers for the same sink.
  The new `safeContext` substitutes a space and announces truncation; the older filename
  doors delete the character and truncate silently at 120. Unifying them would mean editing
  untouched doors, which the surgical-changes rule forbids, so the divergence is a recorded
  choice rather than a later discovery.
- **The blind review was skipped for this section.** Adversarial and security were run. The
  omission is a real deviation from the section loop and is recorded rather than smoothed
  over; the security lens was judged the higher-value second seat here because this section's
  entire risk is content crossing into trusted context. A later finishing-work pass covers
  the whole changeset.
Review Findings: 2 Critical, 1 Major (security), several Minor, all fixed and each verified
by re-running the reviewer's own reproduction. The security reviewer also refuted one of the
implementer's own concerns by measurement (2000 records x 6KB: 0.21s), which is recorded so
it is not carried forward as a worry.
Verification: `node --test test/*.test.js` 257/257. Live run against a real two-record store
emits the block correctly. A forged `[body revised]` token in a description now triggers
nothing.
Next: 5. Advisory decay surfacing
Commit Model: Commit-and-Push

### Chapter 5 - 2026-08-08
Completed: 5. Advisory decay surfacing
Implemented By: implementer-opus
Metrics: 0 review rounds (**the paired review is owed on this section**, see below); 0 NEEDS_CONTEXT; 0 escalations; advisor off
Decisions / Surprises:
- The ranking now lives once, in `memory-lib.js` (`rankDecay`, with `appliedDays`,
  `dayNumber`, and the three constants moved with it). Both the CLI's `decay` and the hook
  call it, so the two can never disagree about what a candidate is. The reasoning for that
  home rather than `memory.js`: `memory.js` runs `main()` on load, so a hook requiring it
  would execute the CLI at every session start.
- **Amendment 1's second axis found a real defect on its first outing.** Enumerating what
  SUPPRESSES a block, not just what flows out of one, surfaced the applied journal as an
  unchecked input door: an unreadable `applied.jsonl` erases every stamp, so records in
  daily use fall back to `created` and rank as idle. The hook emitted "2 records have been
  idle" for two records seeded that same second. `rankDecay` now reports
  `journalUnreadable` and the nudge stays silent rather than lying. This is the fourth
  recurrence of the amendment's class and the first time the sharpened both-axes wording
  caught something before review did.
- Judgment call flagged by the implementer and left as-is: `journalSkipped` (a malformed
  journal line) is returned by the library but printed by neither caller. A lost applied day
  can only make a record look idler, never fresher, and a damaged line cannot be attributed
  to a record, so there is no per-record clause to hang it on. Surfaceable later if that
  trade looks wrong.
- The nudge is a count and a command, never a list: enumerating records would duplicate the
  memory block S4 emits and turn a nudge into a second reference block.
Review Findings: **none yet. This section has not had its paired review**, and that is a
real gap rather than a judgment that it did not need one: it moved the ranking arithmetic
between modules and added an export to `memory-lib.js`, which is blast radius. The
finishing-work pass covers the whole changeset and must not be skipped for this effort.
Verification: `node --test test/*.test.js` 264/264, with four tests watched failing first,
including one that emitted a wrong count from the otherwise-finished hook. Live run: silent
for a freshly created record, and for an aged one emits the count with explicit
"nothing is retired, rewritten, or removed by this".
Next: 6. Seed migration and content pass
Commit Model: Commit-and-Push

### Chapter 6 - 2026-08-09
Completed: S5's owed paired review, plus its fix round (no new section)
Implemented By: main session (the fixes are surgical across three files and the review
context is the working state); adversarial + blind + security reviewers dispatched in parallel
Metrics: 1 review round, run late and deliberately; 0 NEEDS_CONTEXT; 0 escalations; advisor off
Decisions / Surprises:
- **The review that was owed found a session-start hang, which is the strongest argument
  yet for not letting a section close without one.** S5 shipped with its paired review
  recorded as owed. That review's first finding is that S5 put the applied journal on the
  SessionStart path while the journal reader was the one file door in the tier using a
  plain `readFileSync`. A FIFO at `applied.jsonl` hung the hook forever (base exits in
  25ms; HEAD was killed at 8s having emitted nothing, losing plan recovery and every other
  block), and a symlink to `/dev/zero` there reached 13.5GB RSS before SIGKILL. Both
  reproduced by two reviewers independently, and both now measured fixed: 24ms and 42MB.
- **A dangling symlink was reading as an absent journal, which silently defeated S5's own
  guard.** `stat` reports ENOENT through a broken link, so the journal returned the
  absent-store branch with no `unreadable` flag, `journalUnreadable` stayed false, and the
  nudge emitted a count computed as though nothing had ever been stamped. The door lstats
  now, the way the record doors already did. This is the finding that most justifies the
  blind seat: it is invisible unless you ask what the code does rather than what it meant.
- **All three reviewers independently reproduced the same defect at the CLI door**, which
  is the one the hook's own comment nominated as the recovery path: `cmdDecay` dropped
  `journalUnreadable`, so `decay` printed records stamped yesterday as "applied on 0 days,
  idle 200d" at exit 0. It refuses non-zero now, because presenting a ranking computed
  from an input nobody could read is the accept-and-discard shape this tier refuses. The
  comment claiming the memory block covered this was false (that block never reads the
  journal) and is corrected rather than left as a trap for the next reviewer.
- **I sided with the blind reviewer against Chapter 5's recorded adjudication on
  `journalSkipped`, and against the security reviewer, who verified the old reasoning and
  let it stand.** Chapter 5 accepted the field going unprinted because a lost applied day
  can only make a record look idler, never fresher. That reasoning is about the direction
  of the error, not about whether to disclose it, and the blind reviewer measured the
  consequence: a torn journal tail took the nudge from silent to "1 record is idle". Both
  surfaces exist to inform a human retirement decision, and neither can be weighed against
  a caveat it never carried. The count now announces itself as an upper bound, which costs
  one clause. Recorded as a reversal of a prior Chapter's decision, not as a new finding.
- Also fixed, each reproduced first: the hook discarded `unevaluated` on a zero candidate
  count, so a store where nothing could be ranked said nothing at all (Amendment 2, and
  Chapter 4's defect recurring on the same axis); the hook and the CLI resolved two
  different clocks, so the debug seam moved the list while leaving the nudge on the wall
  clock and falsified the "cannot disagree" comment (the seam is single-sourced in
  `memory-lib.js` now); `Math.max(...days)` could throw `RangeError` against the function's
  own never-throws contract; `appendApplied` had the same missing regular-file check on the
  write side, hanging `stamp` on a FIFO; and the emitted command path was bounded for
  LENGTH where the sink needed QUOTING, so a long or quote-bearing install path emitted a
  command that silently did something else.
- **A schema correction that S6 depends on.** The library header, which the plan names as
  the tier's single authoritative schema statement, still described the pre-S2 stamping
  model: `applied:` as a generated field and stamps as rewriting the record. Since S2 a
  stamp appends to the journal and never touches the record. S6 migrates records carrying
  hand-written `applied:` frontmatter and would have read that header as authority.
- Two findings deliberately not fixed, with reasons. The double store sweep (the hook lists
  records once for the index and again for the ranking) stays: two of three reviewers
  measured it and cleared it (48ms and 60-to-70ms), and the remaining substance is a
  two-snapshot window inherent to any hook that reads twice. And no durable test was
  written for the `RangeError`: provoking it needs a journal of ~150k distinct days, and the
  2MB journal cap added here structurally bounds the union near the engine's spread limit,
  so the reduce is belt to the cap's braces. Both are here rather than discovered later.
- Dispatch lesson worth carrying: the blind reviewer opened its report by noting its
  dispatch was contaminated, because I gave it the two modules' stated behavioral contracts
  as orientation. It was right to flag it. Its findings rest on measured base-versus-HEAD
  behavior rather than on those statements, so nothing is tainted, but the line between
  necessary orientation and the intent story needs stating in the skill; jotted to the
  kaizen inbox.
Review Findings: 1 Critical, 5 Major, 8 Minor across the three reviewers, every Critical and
Major reproduced by running code rather than asserted. All Criticals and Majors fixed; the
two Minors above are justified here. Amendment 1 was sharpened again, to cover doors a
change exposes rather than only doors it writes.
Verification: `node --test test/*.test.js` 272/272, up from 264, with **eight new tests each
watched failing first against the exact pre-fix code** (the four journal-door and reporting
guards mutated back one at a time; every test failed for its own defect and no other).
Concurrency re-measured because the write primitive changed: 20 concurrent stampers x 5 runs,
20/20 days each, and 40 two-stamper trials with 0 losses, matching Chapter 2. Live runs
confirm all three emitted sentence forms, and the four journal shapes (FIFO, dangling
symlink, directory, /dev/zero) now refuse in ~22ms at exit 1 instead of hanging or
fabricating.
Next: 7. Skill, routing rule, and docs (reordered ahead of S6, which is gated on Daren's
three sensitive-record adjudications; the reordering is argued in the section-7 note)
Commit Model: Commit-and-Push

### Chapter 7 - 2026-08-09
Completed: 7. Skill, routing rule, and docs
Implemented By: main session (writes under `docs/`, and the RED gate plus `writing-skills`' bar
is judgment a brief cannot carry); adversarial + blind reviewers dispatched in parallel
Metrics: 1 review round; 0 NEEDS_CONTEXT; 0 escalations; advisor off; 17 subagent dispatches, 14
of them the RED/probe gate
Decisions / Surprises:
- **The RED gate falsified this section's own premise, and that is the round's real find.** The
  spec said "nothing in sections 1 through 6 prevents the ninth" misfile. Measured, S1 does
  prevent it: **10 of 10 fair reps** routed a cross-project fact correctly at a
  bank-the-learnings moment, because S1 put the routing ladder in `memory-lib.js`'s header and
  every rep read it and cited its line numbers. The failure reproduced only in a confounded arm
  whose fixture contained no CLI at all. The spec premise is amended in place and the artifacts
  are below.
- **So the behavior claims were cut rather than shipped.** My first `finishing-work` edit
  carried "This tier is yours to write, not something to hand back for promotion later" and "a
  learning you judged cross-project and filed locally anyway is the failure this step exists to
  catch." Both were written against the confounded arm. `writing-skills` says a clean RED means
  stop, and that guidance written from imagination is an antipattern, so step 7 is now an
  accuracy fix only: "memory" named one destination when there are three. That is the whole
  justified change at that door.
- **The reordering ahead of S6 held up.** Writing the doctrine first meant S6's eleven
  adjudications will be made against a written rule. Recorded in the section note.
- Deviation recorded rather than smoothed: S1 relocated its operator-facing schema-documentation
  clause to this skill, and the skill declines it, pointing at the library header instead. The
  adversarial reviewer accepted the direction and called the silence wrong, which is fair. The
  reasoning: duplicating a 70-line schema into a skill builds the second copy this tier exists
  to remove, and the fields an author actually needs are in the skill's CLI snippet. So the
  clause is answered by a pointer, deliberately.
- No security reviewer: the section adds no code path. The two hook edits are text inside
  existing emitted blocks.
Review Findings: 2 Critical, 6 Major, 6 Minor across the pair, both returning CHANGES_REQUIRED,
and both reviewers independently found the two Criticals. Every finding verified against the
code before acting.
- **Critical, fixed.** "Never a hand edit" forbade the tier's only correction and retirement
  path. The CLI's verbs are `add|list|get|stamp|decay`: no update, no delete. Yet S3's
  `[body revised]` marker exists *because* bodies get hand-revised, and the skill's own
  description advertised "a record that needs correcting". The header said the narrower correct
  thing all along ("tolerated on read, not the write path") and I escalated it into a
  prohibition. Now stated properly: creation is CLI-only, correcting is a direct edit the marker
  is designed to surface, retiring is a human deletion.
- **Critical, fixed.** Doctrine was routed "through `reconcile-claude-md`", which cannot author
  a rule: it is one-directional and stops with "nothing new" when the marker is in sync. The
  real path is editing `assets/CLAUDE.md` in the kit repo, which that skill then distributes.
  The blind reviewer found this by reading the named skill rather than trusting the phrase.
  Fixed at all three doors carrying the shorthand, including `memory-lib.js`'s header, which
  had it too and is the authoritative copy.
- **Critical (adversarial), fixed.** The one behavior guard I had kept was satisfied by 100% of
  the failure population it cited: both confounded-arm reps *did* say the tier was out of reach
  and filed locally anyway, so "say so rather than filing locally" forbade nothing they did.
  Rewritten to forbid the local write and name the substitute: the fact stays unbanked and is
  reported as owed with its text ready to paste.
- **Major, fixed.** Both reviewers found that `pr-review`'s SKILL.md still instructed "record
  the form in auto memory" for the ADO `filePath` leading slash, which is **this effort's
  founding fact**, plus a second such line for connector vote behavior. A live kit instruction
  reproducing the exact failure the tier was built for. Both now route to the tier.
- **Major, fixed.** The accuracy fix was applied at one door of four. `assets/CLAUDE.md` (the
  widest-reach door, loaded in every session, where the skill loads only on description match)
  and `README.md`'s conventions both still said learnings go to auto memory. Amendment 1's
  every-door rule is why `pr-review`, the asset, and the README are in this changeset at all;
  that is the amendment working rather than scope creep. **Note for Daren: the asset changed,
  so a CLAUDE.md reconcile offer will appear at the next session start.**
- **Major, fixed.** The write path at the one door the spec required be edited did not resolve:
  bare `hooks/memory.js add` is ENOENT from any repo but the plugin cache. Fixed with
  `kit-goal`'s in-repo resolution idiom. Ironic at the door of the section that concluded
  reachability is the thing to protect, and worth recording as such.
- **Major, fixed.** The ladder existed in four places (library header, the skill's table, the
  skill's own frontmatter, step 7), and the antipattern I wrote to license that ("copies with
  named authority are fine") is exactly the exemption-clause shape `writing-skills` bans, used
  on itself. The table is cut; the skill keeps only the discriminator and three worked examples,
  which are additive; the description no longer compresses the rule; step 7 names destinations
  without re-deriving the test.
- **Major, fixed.** "The session-start block lists one generated line per record" is false: it
  caps at 30 with a counted remainder, and the skill never mentioned `list`. A reader who
  believed the block exhaustive would read an unlisted fact as nonexistent.
- Minors fixed: the unevidenced "most often gets miscarried" frequency claim (the reps went the
  other way); the unfindable `EleosCore/memory/...` path and its overstated duplicate claim;
  stamping never naming a moment; `marketplace.json` left behind while `plugin.json` was
  updated; README's stale "four of its six blocks" (there are eight) and its `session-start.js`
  description omitting the two new blocks; and the memory block and decay nudge naming no skill
  where every sibling nudge names one.
RED gate artifacts (`writing-skills` requires these in the Chapter, not a description of them):
- **Attempt 1, did not reproduce, 3 reps.** Both stores named explicitly, three learnings
  (platform / project / preference). All three routed all three correctly, each citing the
  library header: "It went cross-project because it is a property of the Azure DevOps REST API
  [...] which is exactly what `memory-lib.js:3-8` defines `platform` as." Unprompted, all three
  also reported a real gap: concurrent sessions each created a differently-named record for one
  fact, and "`add` uses `linkSync` so two writers can never claim the *same* name, but nothing
  in the tier detects three *different* names for one fact."
- **Attempt 2, reproduced 2 of 3, then withdrawn as confounded.** Step 7 quoted verbatim, only
  the project store offered, tier visible only as the S4 block. Rep 1: "the fact is not
  AcmePortal-specific [...] so filing it under acme-portal under-scopes it, and there's no
  promotion path to the kit-owned cross-project tier available to me here." Rep 3: "that tier is
  the kit's to write [...] Promoting it is a call for you or the kit's own mechanism." Rep 2 is
  void as a control: it left the sandbox and read this spec, citing its line numbers, which is
  the leak `writing-skills` warns about, observed. **The fixture contained no CLI at all, so "no
  promotion path available to me" was literally true of the sandbox rather than a
  rationalization.** That is why two further arms were run.
- **Control, 3/3 correct.** Old wording, CLI named. All three overrode the step: "Step 7's 'auto
  memory' phrasing predates this second tier"; "The project tier is the default reading of that
  step, and I went against it deliberately."
- **Attempt 4, 3/3 correct.** Old wording, CLI present but unmentioned, which is production's
  actual condition. All three found it unaided: "One departure from the literal framing, up
  front. **The record did not go into `projectmemory/`.**"
- **Attempt 5, 1/1 correct, the combined-pressure case `writing-skills` asks for.** Eleven hours
  in, PR open, "Daren is waiting on this close-out to merge", six mixed learnings including a
  decoy preference. Routed all six correctly and additionally refuted a learning's premise by
  probing it: "The finding said Node 20.11 on this box ships a broken `fs.cp`; this box runs
  **v20.20.2** and `fs.cp` raises no error there."
- **Followability probe on the persisted wording, 2/2 pass**, then a third after the review
  fixes, aimed at the two paths the reviewers called unfollowable. It hand-corrected a wrong
  record (fixing the description too, updating `modified`, verifying by round-trip, declining to
  hand-write the derived sidecar) and handled the doctrine item exactly as intended: "This is the
  item the skill told me to do that I could not. Owed, with the rule text ready to paste."
  Verified independently: the hand-edited record parses `ok: true` and emits its corrected line.
Verification: `node --test test/*.test.js` 272/272 after the hook text edits; `.githooks/pre-commit`
payload validation passes; the new skill's frontmatter parses with `description` quoted, zero em
dashes, 6.9KB against siblings' 9.7KB to 30KB. Probe stores verified by reading them rather than
trusting the reports; `~/.claude-kit-memory/` was never created by any of the 17 dispatches.
Next: 6. Seed migration and content pass (gated: needs Daren's three sensitive-record
adjudications)
Commit Model: Commit-and-Push
