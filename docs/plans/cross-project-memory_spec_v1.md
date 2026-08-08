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
the body's own `description:` is stale too. So the index sidecar stores `hash(description)`
plus the body mtime observed at last sync: the line refreshes silently when the hash
changes, and emits `[body revised]` when mtime advanced while the hash did not. That is
exactly the mcp-bridge signature (body rewritten, description untouched) and it suppresses
the false alarm when the author updated both. Measured over the existing 55 records the
marker fires on 7: two materially false, four true-but-incomplete, one clean false
positive. It is descriptive and must not be renamed `[stale]`; it is not a truth claim.
mtime is trustworthy here, verified: all 25 records carrying a `modified:` stamp match
filesystem mtime within 5 seconds, `~/.claude-work` is not a git repo, and neither
`backups/` nor `file-history/` touches memory files.

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
Acceptance: the root exists with a documented schema; a record written by hand round-trips
through the section 2 CLI; the schema doc states which fields are generated and which are
authored, and states that nothing in this tier is written by the Write tool directly.
Execution mode: main.

### 2. The CLI
Authoring (with lock discipline, since the tier is shared across concurrent sessions of
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
Tests: at minimum lock the lock discipline under concurrent write, duplicate-name refusal,
and that a malformed or absent store yields a typed empty result rather than a throw. The
risk: this CLI is the only authoring path, so a crash here is a lost fact.
Execution mode: delegate-capable.

### 3. Generated index sidecar and the `[body revised]` marker
The sidecar holding `hash(description)` and last-observed body mtime per record, the line
generation from `description:`, and the marker computation. Silent refresh when the hash
changes; `[body revised]` when mtime advanced and the hash did not. Absent sidecar
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
empty or unreadable; truncation announces a counted remainder; the hook never throws and
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
- Whether the tier's generated index file should be human-readable in the same
  `MEMORY.md` shape as the native tier, or a machine format. Section 1 decides; the
  argument for matching the native shape is that Daren can read it without a tool.

## Chapters

(Appended by executing-work as sections complete.)
