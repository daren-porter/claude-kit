# Kit Adoptions

Last pass: 2026-08-26
Watermark: a1ada6f
Source: `SApplefeld/sapplefeld-claude-kit`, cloned at `~/repos/sapplefeld-claude-kit`

The standing record of what this kit has taken, reshaped, refused, or not yet decided
from Scott Applefeld's kit. claude-kit is a personalized fork of theirs, the two are
compared periodically, and before this file existed each pass re-derived decisions that
earlier passes had already made and buried in archived specs.

The `kit-adoption-pass` skill owns the procedure. This file is its state: a pass reads
it first, and writes back to it before offering the user anything.

**Inbound only.** Nothing here goes back to the upstream. There is no outbound half.

## The `Last pass:` header is a machine contract

`Last pass:` is parsed by the `session-start.js` staleness nudge, which reads only the
head of this file. Four rules follow, all of them about that one line:

- It stays a **bare line at column zero**. Not a heading, not a list item, not indented.
  The predicate is anchored, so `### Last pass` or `- Last pass:` kills it silently, with
  no error anywhere.
- Its date stays in strict `YYYY-MM-DD` form. Nothing else parses.
- It stays at the top, inside the first 2 KB. The hook does a bounded head read and will
  not find a line pushed below it.
- A pass updates it. Nothing else reformats it.

**So `Last pass:` dates the last PASS, never the last edit to this file, and the difference is
visible rather than theoretical.** A live entry keeps accruing dated amendments between passes:
the 2026-08-26 candidate 1 entry carries strata dated 08-27, 08-28, 08-29, 08-30 and 08-31, all
of them later than the header above them and none of them a pass. A reader who takes the header
as a file mtime concludes the ledger stopped a week before it did. **The newest date inside an
entry is that entry's currency; the header is the window's.**

`Watermark:` and `Source:` are for human readers and for the pass itself. Nothing parses
them, and they carry no format contract beyond staying legible.

`Watermark` is the last sha whose window was fully classified. A pass fetches (never
pulls) and diffs `<watermark>..origin/main`.

**When the watermark advances:** when every capability in the window carries a verdict
and the removals check has been run and recorded. **pending** counts as a verdict, so a
window is adjudicated when nothing in it is unclassified, not when nothing in it is
outstanding. Both halves are required: a window whose removals were never intersected is
not classified, however many candidates carry verdicts. Most of the 2026-08-07 pass below
is still pending and the watermark moved to `09c91a4` anyway, because every candidate in
that window carries a verdict and the removals check was run.

**The clone path is confirmed, not trusted.** It has moved once already:
`archive/claude-kit_spec_v3.md` cites `~/repos/claude-kit-scott`, which no longer
exists. Check the path before a pass depends on it.

## Verdict vocabulary

| Verdict | Means |
|---|---|
| **adopted** | Taken, with where it landed in this kit. |
| **adapted** | Taken and reshaped, with what changed and why. |
| **rejected** | Refused, with the reason. Permanent unless the reason stops holding. |
| **pending** | Classified but not yet adjudicated. Real work, not a shrug. |

Verdicts are keyed by **capability, never by commit or sha**. A sha-keyed rejection
silently suppresses a re-look when the upstream author substantially reworks something this kit
already refused. Keyed by capability, a later pass seeing new commits against a rejected
entry asks whether the reason still holds instead of skipping it.

**pending** is what makes this file worth having. One pass over 138 commits produced
more candidates than anyone can adjudicate in a sitting; without a pending state the
next pass re-derives everything the last one ran out of time for. "Too large to
adjudicate inside a pass, needs its own brainstorm" is a legitimate outcome, not a
failure to decide.

Each entry carries: capability, verdict, the date and sha the verdict was made at, and its
reasoning. Entries predating the watermark convention carry a date only, because no sha was
recorded at the time and none is recoverable; do not invent one to fill the field.

A candidate is a thing they have that this kit might want. Their **removals** are checked
separately, per pass, as a set intersection against this kit's tree, and that check has
its own outcome rather than a verdict from the table above.

## The adjudication criterion

Recorded by `archive/claude-kit_spec_v3.md` (Approach) and standing since 2026-06-17:

> For each candidate, ask whether it reflects a **deliberate decision** or is
> **upstream-specific**.

A deliberate decision is portable and worth weighing on its merits. Upstream-specific means
it serves their machine, their platform, their team, or their voice, and taking it imports a
constraint this kit does not have. The two kits hold real and permanent philosophical
differences, so **reshaping is the normal case and taking as-is is the exception.**

## Standing rejections

Refused in earlier passes. Each holds until its reason stops holding.

| Capability | Decided | Reason |
|---|---|---|
| Their full operating manual (132 lines) wholesale | 2026-06-17, re-checked 2026-08-26 | Reverses v2's deliberate slimming and duplicates what this kit's skills already own. Individual nuggets remain separable; see the pending entry below, and candidates 11 to 13 of the 2026-08-26 pass. |
| `format-on-edit` hook | 2026-06-17 | Upstream-specific. |
| `scott-writing-style` | 2026-06-17, re-checked 2026-08-26 | Their voice, by definition, and that still holds for SKILL.md. Its `references/ai-tells.md`, added 2026-08, is not voice and is tracked separately as candidate 7 of the 2026-08-26 pass. |
| The CLAUDE-FOR-FABLE variant | 2026-06-17 | This kit deliberately never ties the main thread to a model name; a per-model CLAUDE.md reverses that. |
| The agent-teams harness | 2026-06-17 | The design council runs on stable Claude Code without it. |
| Their Windows relay clause | 2026-07-24 | Platform-specific; this is a Linux workstation. |
| Their compaction-ledger genealogy | 2026-07-24, re-checked 2026-08-26 | This kit runs no such engine, and session identity already survives native summarization and `/resume` without it. The upstream author has since removed the route themselves, on the additional ground that it let a user-writable file drive a leash rebind. |

## Already taken

So a later pass does not re-propose them. All of these were **adapted** rather than
adopted as-is, which is the normal case.

| Capability | Decided | Landed as, and what changed | Detail in |
|---|---|---|---|
| Subagent model down-selection | 2026-06-17 | Execution modes in `executing-work`. Their per-section model tier hard-codes "fable or untiered = main thread", assuming the human runs Fable; this kit records **main / delegate-capable / delegate-mechanical** instead, so the main thread is never tied to a model name. Later extended with `delegate-fable`. | `archive/claude-kit_spec_v3.md` |
| Design council | 2026-06-17 | `design-council` skill plus the `council-member` and `design-facilitator` agents. Made opt-in and cost-named, and cut loose from their agent-teams harness. | `archive/claude-kit_spec_v3.md` |
| `cold` evaluation lens | 2026-06-17 | `cold` skill. Reshaped to the user and cross-referenced to the global anti-sycophancy rule rather than restating it. | `archive/claude-kit_spec_v3.md` |
| Two operating-discipline rules | 2026-06-17 | `match effort to blast radius` and `name what you changed outside the code`, in the global CLAUDE.md. Taken as two bullets out of their 132-line manual, which was refused wholesale. | `archive/claude-kit_spec_v3.md` |
| The `/kit-goal` completion leash | 2026-07-24 | `kit-goal` skill, `kit-goal.js` (the arming CLI), `kit-goal-stop.js`, `kit-goal-lib.js`, and executing-work's completion contract. Dropped their Windows relay clause and compaction-ledger genealogy; comments rewritten where they described mechanisms this kit does not carry. | `archive/kit-goal-port_spec_v1.md` |
| Session-model-as-mode and the Fable spend wall | 2026-07-24 | `executing-work`'s session-model doctrine, the `implementer-fable` tier and agent, and the `Fable Spend:` spec header. Adapted from their fable-metering work with the user's decisions applied. **Upstream has since retired the `Fable Spend:` header and its cost-hold machinery kit-wide (2026-08, in their `consult` effort), on the ground that Fable is included in plan allotments rather than metered; see the rejection re-checks in the 2026-08-26 pass.** | `archive/orchestration-economics_spec_v1.md` |
| Cross-project memory tier, and advisory decay with use-reinforcement | 2026-08-08 | The two separable ideas out of their semantic memory system, which was refused as an engine (~7.2k lines of production JS plus ~14k of tests, against this kit's ~7.9k total). Reshaped hard: the index line is generated from each record's `description:` rather than hand-maintained, a computed `[body revised]` marker covers what generation cannot, bodies stay directly readable rather than CLI-gated, decay is advisory rather than automatic, and a clean kit-owned root drops their allowlist and its four probes entirely. Embedder, git sync, and the fleet half all stay out. **All seven sections are built** (2026-08-08 to 2026-08-10: `hooks/memory-lib.js`, `hooks/memory.js`, `hooks/memory-index.js`, the `cross-project-memory` skill, two SessionStart blocks, and 14 seeded records under `~/.claude-kit-memory/`), with the effort's close-out still pending. | `plans/cross-project-memory_spec_v1.md`, and candidate 1 of the 2026-08-07 pass below |
| The curated docs lifecycle and the guard hooks | 2026-07-24 | This library's taxonomy and the `curating-docs` skill; `docs-write-guard`, `stop-docs-hygiene`, `pr-docs-guard`, `merged-pr-push-guard`, and `branch-reaper-nudge` hooks; the `branch-hygiene` skill; and the `blind-reviewer` agent. | `archive/docs-lifecycle-and-guards_spec_v1.md` |

## Verdicts

### Pass of 2026-08-26 (`09c91a4..a1ada6f`)

255 commits, 153 files, +61k/-8.2k, spanning 2026-08-07 to 2026-08-26. The largest window
these two kits have ever been compared across, and it lands squarely on the three things
the user named going in: document prose and structure, compaction quality, and
session-limit awareness. All three have answers below. Two of them cost less than a port,
and the third is the largest single candidate ever recorded here.

**Three facts were verified on this machine rather than taken from their specs**, because
each one decides a candidate. **Read all three as of 2026-08-26 against client `2.1.246`**,
which this machine no longer runs (2.1.261 as of 2026-09-06): they are findings with a date and
a version, not standing facts about the current client, and the third describes two
`docs-write-guard.js` defects **this same pass then fixed**.

- **`CLAUDE_CODE_RETRY_WATCHDOG` is real and live on this box.** Confirmed against
  `~/.local/share/claude/versions/2.1.246` (an unstripped ELF, so `strings` reads it):
  `function KR(){return V.CLAUDE_CODE_RETRY_WATCHDOG}` sits immediately beside
  `function bYn(e){return py(e)||e instanceof Mn&&e.status===429}`, a 429 predicate with no
  session-limit exclusion, which matches their reading of `uYe`/`xbp` exactly.
  `anthropic-ratelimit-unified-reset` is present. A block setting
  `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE:"self_hosted"` also sets
  `CLAUDE_CODE_RETRY_WATCHDOG:"1"`, which confirms their claim that Anthropic's own remote
  runner sets it. **One fact is newer than their evidence:** a 2.1.246 changelog string
  reads "Persistent retry mode (`CLAUDE_CODE_RETRY_WATCHDOG`) now fails immediately on
  organization spend-limit and out-of-credits errors instead of waiting indefinitely for a
  reset", so the park-forever-on-a-billing-failure hazard their design worried about has
  since been closed upstream of both kits.
- **`autoCompactWindow` exists locally and its units are thousands of tokens.** 33
  occurrences in the same binary, and the discriminating string is a diagnostic:
  "CLAUDE_CODE_DISABLE_1M_CONTEXT is set, but the <N>K limit isn't enforced for <model>, so
  this session can grow past it. To enforce it, set `CLAUDE_CODE_AUTO_COMPACT_WINDOW=<N>`
  (or the autoCompactWindow setting)". So the knob is a K-token context bound with both an
  env-var and a settings spelling, not a percentage and not a turn count.
- **Two defects in this kit's own `docs-write-guard.js`, both live-fired with a positive
  control.** Identical payloads, one variable changed each time. (a) Containment is judged
  against the payload `cwd` rather than against the git root above it, so an
  `adversarial-reviewer` writing `/home/daren/repos/claude-kit/docs/README.md` is denied
  (exit 2) with `cwd` at the repo root and **allowed (exit 0)** with `cwd` at
  `plugins/`: any subagent working from a subdirectory walks through the guard. (b)
  `commandWritesDocs` uses a non-global `c.match(re)`, so only the first docs-shaped writer
  in a command is judged: `echo x > /tmp/docs/a.md && echo y > docs/README.md` is
  **allowed (exit 0)** while the second writer alone is denied. Their fix is
  `repoRoot(cwd)` plus global regexes returning every hit for the caller to judge, and
  their `2026-08-16-docs-write-guard-containment.md` kaizen note is the trail.

| # | Capability | Verdict |
|---|---|---|
| 1 | `CLAUDE_CODE_RETRY_WATCHDOG=1` | **rejected 2026-08-26, superseded natively** |
| 2 | Stop-failure recovery | **rejected 2026-08-26** |
| 3 | The post-compaction re-load block | **rejected 2026-08-26, premise falsified on this harness** |
| 4 | `docs-write-guard` git-root containment | **adopted 2026-08-26** |
| 5 | The boundary-gated compaction engine | **pending, too large to adjudicate in a pass** |
| 6 | The document review battery | **adapted, shipped 2026-08-26** |
| 7 | `references/ai-tells.md` | **adapted, shipped 2026-08-26** |
| 8 | `writing-skills` | **pending, strong** |
| 9 | Reviewer effort compensation | **split 2026-09-19. The effort dials are adapted and shipped; the compensation notch stays pending.** |
| 10 | `responding-to-review` | **pending, cheap prose** |
| 11 | The intake gap check | **pending** |
| 12 | Outline before you read | **pending, unusually cheap here** |
| 13 | Doctrine additions worth separating from the wholesale rejection | **pending** |
| 14 | Backlog visibility | **pending** |
| 15 | The `consult` read-only judge | **pending** |
| 16 | `peer-sessions` | **pending** |
| 17 | `coordinator`, `standing-watch`, `dispatch-authority` | **rejected 2026-08-26** |
| 18 | Memory `supersedes:` frontmatter | **pending** |
| 19 | `kit-goal` queue and arm-time binding | **pending, arm-time binding confirmed live here** |
| 20 | Positive controls on absence-proving checks | **pending, cheap prose, and this skill needs it** |
| 21 | `kit-statusline.js` and `kit-goal-statusline.js` | **rejected 2026-08-26** |

Each candidate's reasoning follows below, one section apiece.

#### 2026-08-26 candidate 1: `CLAUDE_CODE_RETRY_WATCHDOG=1`

*`CLAUDE_CODE_RETRY_WATCHDOG=1`: the harness's own session-limit park, which supersedes any hand-built watcher.* **Verdict: rejected 2026-08-26, superseded natively**

This is the whole answer to session-limit awareness, and it is a settings change rather than a port. With it set, a 429 (a session limit is one) stops counting against the retry budget and the client sleeps to the instant in the response's own `anthropic-ratelimit-unified-reset`, capped at six hours, falling back to exponential backoff capped at five minutes. Their RED/GREEN against a fake API is the cleanest experiment in the window: without the variable a run exhausted retries and died in 187 seconds with `error: "rate_limit"`; with it, same server and same 429s, it was still retrying past ten minutes. Verified independently in this machine's binary (above). **The tradeoff, stated in their own close-out:** an interactive session at the limit then parks alive rather than erroring, which is what you want unattended and may not be what you want at a keyboard. Their spec calls that an operator decision, not a blocker. **Downgraded 2026-08-26 on an operator fact that probably takes the whole candidate out.** On this Team plan with overage spending enabled, the operator reports never seeing a use-credits prompt at the session limit: the account simply starts spending against the configured monthly overage, with little or no indication. The binary corroborates the mechanism. The pre-watchdog 429 branch reads a header named `anthropic-ratelimit-unified-overage-disabled-reason`, a reason overage is **off**, and the string table carries `overageConsentRequired`, `overage_consent_prompt` and `overage_dialog_shown` as conditional surfaces. Read together with the operator's observation, the inference is that an account with overage enabled is served rather than 429'd at the session limit, so the 429 this variable exists to catch never fires and setting it changes nothing. **Superseded natively, and a piece of this entry's own evidence is withdrawn.** Two corrections, in order of importance.

**(a) The harness already ships what this candidate was reaching for.** 2.1.246 carries a settings key `autoContinueAtUsageLimit`, described in the binary as "When a claude.ai usage limit stops your session, wait for the limit to reset and continue the task automatically. When off, the limit dialog offers the wait as a choice instead." It defaults on (`?? !0`), is toggleable from `/config`, and drives a full state machine: "Usage limit reached, continuing automatically when it resets, esc to cancel", `quota_auto_resume_fired`, a `quota_auto_resume_disabled` path when the reset is more than 24 hours out, and `/rate-limit-options` to wait anyway. It also carries a graceful wind-down at 95% of the window (constant `0.95`): the model is sent "[Usage limit approaching. Checkpoint now: finish the current step, then list up to 3 short bullets of the most impactful remaining work. Don't start subagents or long-running work.]" while the operator sees "Approaching your 5-hour usage limit, Claude will wrap up the current step." That is close to what the upstream author built by hand, native and on by default, and its off position is exactly the keyboard-versus-unattended discriminator this entry went looking for. **The kit has nothing to build here.**

**(b) The transcript evidence offered earlier in this entry is withdrawn as invalid.** It rested on the absence of a synthetic "You've hit your session limit" message across the work profile, with a single 2026-06-17 instance on the personal profile as the positive control. That control was version-mismatched: the string does not exist in 2.1.246 at all (`grep -c` returns 0), so its absence from recent transcripts says nothing about whether a limit was hit. A positive control drawn from a two-month-older client is not a control. The operator's own report stands as the evidence, and the mechanism above explains it: with org overage enabled nothing blocks, so no limit "stops the session", so auto-continue never fires and the account simply spends. **What stands between this operator and pausing at the limit is the org overage setting, not any kit feature.** **The header set settles why, 2026-08-26.** The client reads `anthropic-ratelimit-unified-status`, `anthropic-ratelimit-unified-overage-status`, `anthropic-ratelimit-unified-overage-disabled-reason` and, decisively, `anthropic-ratelimit-unified-overage-in-use`. The rejection path sets `status = "rejected"` together with an overage status and, where overage is off, a disabled reason; `overage-in-use` is the contrasting case of a request **served** on overage. The auto-continue flow hangs off the rejection, so on a plan with overage approved and budget remaining the request succeeds, nothing is rejected, and neither the "Usage limit reached, continuing automatically" dialog nor the auto-resume ever appears. It fires only when overage is disabled for the seat, exhausted, or the limit type is not covered. That reconciles the two operators on one Team account: where the upstream author's runs do stop and resume at session limits, overage was not covering them at that moment, and their own words credit "the harness pausing and resuming" rather than their kit. That case is a `service_spend_limit_reached`, which the 2.1.246 changelog says the watchdog now **fails fast** on rather than parking. Two consequences worth carrying forward. First, the upstream author's whole session-limit effort was designed against a plan that stops at the limit, so it may be upstream-specific in a way neither kit noticed. Second, the behavior the operator actually wants for unattended batches (pause at the boundary, resume at the reset) is a **spend** control rather than a retry control on this plan, and nothing in this window provides one. **The spend SIGNAL is readable after all, 2026-08-27, which makes that closing claim too strong in one half.** Nothing provides the control, which stands. But the signal such a control would run on is reachable by any process on this machine, and a statusline is not required to get at it. Found by reading the bundled source of `ccstatusline` 2.2.27 in the npx cache (`~/.npm/_npx/1432d6096563609a/node_modules/ccstatusline/dist/`) plus the live cache file that tool writes, not by experiment. The call is `GET https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>` and `anthropic-beta: oauth-2025-04-20`, 5s timeout. The token comes on Linux from `<claudeConfigDir>/.credentials.json` (`readUsageTokenFromCredentialsFile`), and on macOS from the Keychain first. The response is cached to `~/.cache/ccstatusline/usage.json` behind `usage.lock`, with a separate error-cache age so a failed call does not hammer the endpoint. The live cache here on 2026-08-27 carried `sessionUsage`, `sessionResetAt`, `weeklyUsage`, `weeklyResetAt`, `fableUsage`, `fableResetAt`, `extraUsageEnabled`, `extraUsageUsed` and `extraUsageCurrency`. **Two of those bear directly on this entry.** `extraUsageUsed` is the overage spend this entry describes as arriving with "little or no indication": it is not unindicated, it is queryable, and it read 8321 at the time of inspection (the payload states no unit and the unit is **not** established, so it must not be read as cents without checking). And `fableUsage` with `fableResetAt` is the figure the kit's whole `Fable Spend:` policy is operated on by hand, through the per-effort header, `finishing-work`'s rule that metered Fable needs explicit per-effort authorization, and the ambiguous-header case that silently downgraded an effort's finishing reviews. That policy has never had access to the number. **What is NOT established, and none of it is small.** The endpoint has never been called from a kit hook here, only observed being called by a third-party tool. `oauth-2025-04-20` is an unversioned beta header on an undocumented path and can change without notice. The endpoint's own rate limits are unknown. A caller handles a live OAuth access token, which `docs/security-model.md` does not currently cover. **The constraint that shapes any build.** `hooks/session-start.js` promises "Never blocks" in its own header, so a 5s network call cannot sit in a SessionStart hook. The separation that works is the one ccstatusline arrived at: one process refreshes a disk cache and everything else only reads it. That leaves open what does the refreshing, which is where a statusline re-enters, not as the data source but as the only thing running often enough to keep a cache warm for free; a hook could refresh it instead on a staleness check with a bounded timeout and a fail-open path. **Consequence for candidate 21:** that rejection was on composition grounds and is unaffected as written, but the reason to revisit it is no longer only a display surface for the goal state. **Built, 2026-08-28, and four of the claims above no longer hold.** The kit now ships the spend control this entry says nothing in its window provides: `usage-lib.js` reads the endpoint behind a per-profile store and a per-failure-class backoff, `usage-nudge.js` winds a run down mid-turn on `PostToolUse`, and `usage-barrier.js` denies subagent dispatch from the wind-down threshold upward (it denied only at a barrier when this was written; S9 moved it down on 2026-08-30) and caps Fable routing at its own ratchet. `usage-awareness.md` is the operator's document and `plans/kit-usage-awareness_spec_v1.md` the design record; what follows is only what this entry got wrong, and the detail lives in those two rather than here. **(1) The overage unit IS stated in the payload.** `spend.used.exponent` and `extra_usage.decimal_places` both read 2, so 8321 is $83.21, and the caution above against reading it as cents is retired. **(2) The field names above are `ccstatusline`'s private normalized cache, not the API's.** The response carries a `limits[]` array whose entries hold `kind` (`session` | `weekly_all` | `weekly_scoped`), `percent`, `severity`, `resets_at`, `scope` and `is_active`, and parsing is by `kind` rather than by top-level key because the payload also carries nine unreleased codename buckets. That array is exactly what `ccstatusline`'s cache drops, which is why reading its cache was rejected on evidence rather than on composition. **(3) The security-model gap is closed.** `security-model.md` now carries "The one credential the kit reads" with six verified properties, and the two hooks are in its trusted-channel table. **(4) The statusline-as-cache-warmer reasoning is superseded.** The kit polls itself at a 600s floor from its own hooks, tightening to 120s near a barrier, so nothing has to run often enough to keep a cache warm and candidate 21 stays rejected on its original grounds. **(5) "Never called from a kit hook" still stands, and that is the honest surprise.** **RETIRED 2026-08-31, and it was the last claim in this entry still reading as current when it had stopped being true.** It said the endpoint had never been answered from hook context, resting on `enabled: false` being the default with no `config.json` on this machine. The operator armed the feature on 2026-08-29 and hook context has been exercised continuously since: `~/.claude-kit-usage/config.json` holds `enabled: true`, and that profile's `nudged.log` carries eight dedupe markers written by `usage-nudge.js` between 2026-08-29T16:06Z and 2026-08-30T20:27Z, each of which requires a successful hook-context read. Chapters 8 and 10 of the plan record what those runs found: two live defects no review had reached, a microsecond-jitter flood in the dedupe key and a reset instant that drifts across the minute, plus the wind-down firing on the session that built it at 83% and again at 89%. So hook context is no longer untested; it is the thing that found what review could not.

Three hooks were registered, not two, and an earlier draft of this correction wrote "both hooks" as a closed count: `usage-nudge.js` on `PostToolUse`, `usage-barrier.js` on `PreToolUse` for `Agent|Task`, and `usage-autocontinue-nudge.js` on `SessionStart`, the last being section 7's posture check. **The `enabled` gate describes the first two only.** The posture check reads settings files for `autoContinueAtUsageLimit`, never calls `readConfig`, and never touches the endpoint or a credential, so what keeps it off the network is that it has no reason to go there rather than any usage config. An earlier draft of this correction rested it on the store being absent instead and was falsified within the hour by this effort's own `usage.js status`, which created `~/.claude-kit-usage/` and answered the endpoint at 17:47Z; the store exists now and that is why. So the endpoint has been answered three ways, by a plain Node probe (200 in 290ms), by the third-party tool, and by the kit's own read CLI, and by no kit hook. Hook context stays untested until someone arms it. **Usage is per-account, which is the stake behind the profile detail:** three `CLAUDE_CONFIG_DIR` profiles exist on this machine and one is live, so a reader resolving the wrong one does not fail loudly, it reports another account's percentages as this one's, which is why the store is keyed on the resolved credentials directory rather than on the machine. `oauth-2025-04-20`'s stability is likewise still unestablished, and one further trap was found by probe rather than reasoning, an empty bearer answering 429 with a ~54 minute retry-after rather than 401, so a reader on the wrong profile self-inflicts backoff that looks exactly like throttling.

**Re-verdicted 2026-09-06, from `pending, likely inert on this account` to `rejected 2026-08-26,
superseded natively`. Nothing above changed; only the verdict line caught up with it.** The body
had adjudicated this three times over and the verdict had not moved: the harness ships
`autoContinueAtUsageLimit` natively with the keyboard-versus-unattended discriminator this entry
went looking for, so "The kit has nothing to build here"; on this account with overage enabled the
429 the variable exists to catch never fires, so setting it changes nothing; and what the kit
actually built on 2026-08-28 is a **spend** control, which is a different capability rather than
this one adopted. The rejection is dated **08-26** because that is when the reasoning that decides
it landed, not today, which is only when the label was corrected.

Two things a later pass should not have to re-derive. **This entry is why the amendment convention
now exists**: a `pending` verdict is an instruction to a future pass to go and adjudicate, so an
entry whose body has concluded and whose label has not costs that pass the whole re-read, which is
exactly the failure the persona in the currency item met. And per this file's own vocabulary a
rejection is "permanent unless the reason stops holding", so the reasons are named separately
above rather than bundled: the native supersession would survive an overage change, while the
never-fires-on-this-account half would not.

#### 2026-08-26 candidate 2: Stop-failure recovery

*Stop-failure recovery: the durable `StopFailure` marker, the scheduled watcher, the incident budget, the resume-and-re-arm.* **Verdict: rejected 2026-08-26**

Built in this window and **removed in the same window** as dormant, on the ground that candidate 1 supersedes it: with the watchdog set, no `StopFailure` ever fires and the watcher never engages. The end-to-end path never ran once. This is the strongest removals-as-signal reading this file has recorded: the upstream author spent a whole effort on the feature the user asked about and then deleted it in favour of an environment variable. Take the variable, not the machinery.

#### 2026-08-26 candidate 3: The post-compaction re-load block

*The post-compaction re-load block: a SessionStart block on `source === 'compact'` telling the session that skill bodies and deferred tool schemas did not survive, and to re-load before continuing.* **Verdict: rejected 2026-08-26, premise falsified on this harness**

The cheapest real answer to compaction quality in the window, and the gap is verbatim ours: `hooks/session-start.js:508` carries the same `source === 'compact'` branch emitting the same `'Context was just compacted.'` string they replaced. The harness re-injects the doctrine and the SessionStart output and drops everything a tool call loaded, so a compacted session runs whatever half of a skill its summary kept. Their incident is the argument: a 12-hour two-plan run executed a compaction-truncated copy of `executing-work` for four sections and never knew (the checkpoint clear at step 0 but never the open at step 8, reviewers a tier low, no security pass on an external-boundary section). This session's own shape makes it worse here rather than better: this kit's sessions load skills through the Skill tool and carry a large deferred-tool roster reached through `ToolSearch`, which is exactly what a compaction drops. Pairs with a prose half in `executing-work` (re-invoke the skill through the Skill tool after a compaction, not just re-read the plan doc). **Rejected on inspection, 2026-08-26, before any spec was written: the harness fixed this upstream of both kits.** On 2.1.246 a compaction re-injects the skill bodies in full. The binary carries the injection verbatim: each entry rendered as `Path: <path>` followed by the skill's own content, under the header "The following skills were invoked EARLIER in this session (before the conversation was compacted), not on the current turn. They are shown here for context only so you remain aware of their guidelines", followed by "IMPORTANT: Do NOT re-execute these skills or perform their one-time setup actions". So the silent failure the whole feature exists to prevent, a session running half a skill it cannot tell is truncated, does not occur here, and their `executing-work` sentence advising a re-invoke would prescribe a redundant and token-expensive action against an explicit harness instruction not to. The deferred-tool half is weaker in the same direction and its failure is self-correcting rather than silent: the reminder that lists them is a generated system-reminder built from live session state (it also renders "available again (MCP server reconnected)" and "no longer available (MCP server disconnected)"), so it is regenerated rather than carried in the conversation, and a schema that is genuinely missing fails loudly on the next call. **Correction to this entry's first draft: the claim that their finding is "stale" was an overreach and is withdrawn.** The re-injection string is present in every binary installed on this machine (2.1.237 through 2.1.247, built 2026-08-20 to 2026-08-26), and 2.1.237 is the oldest available here, so nothing dates the behavior relative to their 2026-08-17 work. It may predate it. What is established is only that it holds on the versions this kit actually runs. **One qualification found on a second look:** the re-injection is not always the whole body. A truncation path exists, carrying the notice `[... skill content truncated for compaction; use Read on the skill path if you need the full text]`. That narrows the failure mode rather than removing it, and the operator's reading is right: being told a skill came back partial is not the same as acting on it, so a session can carry on against a truncated skill anyway. The difference from their incident is degree, not kind. What survives is therefore much smaller than their block: a one-line behavioral rule (act on an announced truncation, `Read` the named path before continuing) rather than a SessionStart hook that re-states information the harness already supplies. Marked **inferred** on one point: that a fetched schema survives a compaction is reasoned from the reminder being state-generated, not observed across an actual compaction. Nothing is owed unless a real compaction here shows otherwise. **And the ground fact under the whole theme: no session on this machine has ever been compacted.** Across 672 transcripts in all three config profiles, the harness's own continuation marker ("This session is being continued from a previous conversation that ran out of context") appears zero times. This kit runs a 1M-context model, so compaction is a condition it has not yet met, which bears on candidate 5 at least as much as on this entry.

#### 2026-08-26 candidate 4: `docs-write-guard` git-root containment

*`docs-write-guard` containment against the git root, and all-writers rather than first-writer judgment.* **Verdict: adopted 2026-08-26**

Both live-fired above with positive controls. (a) is the serious one: this kit's `docs-write-guard` is the mechanical half of the curated-docs boundary and a subagent whose cwd is any subdirectory of the project escapes it silently. Neither defect exists in their tree any more. Small, code not prose. **Landed 2026-08-26** in `hooks/docs-write-guard.js`: a bounded `repoRoot(dir)` walk that `insideProject` judges against instead of the bare cwd, and global regexes in `commandWritesDocs` iterated with `exec` so every writer is judged. Reshaped rather than copied: their Windows path normalization (`\\?\` extended-length prefixes, the Git-Bash `/c/` form) and their unresolvable-path fallback were dropped as platform surface this kit does not carry, and the existing capture shape was kept rather than widened to the full path, since containment only needs the prefix. Four tests added to `test/docs-write-guard.test.js` against a real throwaway git repo (the rule turns on finding a `.git`), three of them watched red first, each carrying its own positive control; a worktree case pins that a `.git` FILE stops the walk, which this kit needs and theirs does not state. **The class did not stop at one guard.** Generalizing the defect (a cwd-relative resolution that under-reports in silence) found the same shape in `pr-docs-guard.js`, which is this kit's own code and not an upstream candidate: its dirty check ran `git status --porcelain -- docs`, and a git pathspec resolves against cwd, so from a subdirectory it looked for `<subdir>/docs`, found nothing, and let a PR through with `docs/` uncommitted. Live-fired against this repo with `docs/kit-adoptions.md` modified: repo-root cwd denies, `plugins/` cwd allows. Fixed to the root-relative pathspec `:/docs`, which stays anchored from any cwd and still does not match a nested `sub/docs/`; two tests added to `test/guards.test.js`, one watched red. `merged-pr-push-guard.js` was checked and is clean: it uses cwd only to run repo-wide git commands and carries no pathspec at all, so the class stops at two. Gate: 324 pass, 0 fail, from a 318-pass baseline.

#### 2026-08-26 candidate 5: The boundary-gated compaction engine

*The boundary-gated compaction engine: `kit-compact-lib.js` (2,334 lines), `kit-compact-gate.js` (749), `kit-compact-checkpoint.js` (596), `compact-deferral-nudge.js` (377), `chapter-boundary-nudge.js`, a PreCompact `auto` matcher, `install-compact-window.ps1`, `.kit/compact-gate.jsonl`, plus `kit-compact-gate.test.js` (5,170 lines).* **Verdict: pending, too large to adjudicate in a pass**

**The setting and the hook are a matched pair and neither is takeable alone**: `autoCompactWindow` lowered without the veto makes the harness compact earlier AND still arbitrarily, which is strictly worse than today. The design is genuinely interesting: a veto plus a low `autoCompactWindow` is a scheduler, so the harness is made to offer compaction early and often while a PreCompact hook denies mid-chapter and stands aside once a chapter has closed, landing every compaction on a freshly-banked context. What makes it `pending` rather than a recommendation is its own repair history, all of it inside this one window: seven follow-on specs (`compact-gate-binding`, `compaction-window-retune`, `compaction-deferral-signal`, `boundary-cadence-and-spec-scope`, `boundary-ritual-reinforcement`, `compact-boundaries`, `interactive-compact-deferral`), on top of the parent, because the first shipped version denied every offer for roughly nine hours on a live run while eight Chapters closed by hand, then let the safety valve land the compaction at the worst possible point. Counted honestly that is the parent plus seven follow-ons, of which roughly four are repairs and three are extensions to session types the first version did not cover, so the record is a design that needed real repair rather than one that failed. A ~4.5k-line port still earns a brainstorm rather than an adoption. **But the "does this kit even have the problem" objection raised earlier in this pass measured the wrong thing and is withdrawn.** It counted compactions (672 transcripts, zero instances of the harness continuation marker, because this kit runs a 1M-context model) when the target is not the window ceiling: 250K is a performance and cost threshold, not a limit. Re-measured against peak context per session over 586 work sessions with usage data: median 129K, p75 219K, p95 463K, max 914K. **171 sessions (29%) peak above 200K and 109 (19%) above 250K**, with 21 above 500K and 3 above 800K. So roughly one session in five runs past the threshold the upstream design targets, and never compacts. The cost side concentrates the same way: of 6.27 billion cache-read tokens across all work sessions, **82% come from the 109 sessions that peak above 250K**, because context is re-transmitted every turn and a long high-context session pays for its whole history on each one. The condition is real, recurring and measurable here; what stays open is the design, not the need. **Two separable halves worth naming.** First, `interactive-compact-deferral`: defer auto-compaction on an interactive session (no armed goal, no `/goal`, no `/loop`) to the 800k safety ceiling so a brainstorm runs roughly 3x longer before anything is summarized. Second, the two nudge hooks' shared harness fact, which is portable on its own: a PreCompact hook's stderr reaches the operator and never the model, so a gate that defers silently cannot tell the session why, and the feedback has to arrive as `PostToolUse` `hookSpecificOutput.additionalContext` (they also record that a **top-level** `additionalContext` key is inert on this harness despite appearing in the hooks documentation, which is worth confirming here before relying on either shape).

#### 2026-08-26 candidate 6: The document review battery

*The document review battery: the `prose-reviewer` agent (adversarial, two-pass: accuracy against a fact base first, then style and audience), the `blind-reader` agent (dispatched as a named reader persona, summary-back then questions then comprehension gaps then a procedural dry-run), the `Audience:`/`Voice:`/`Disclosure:` spec fields that feed them, and the Document Review Brief.* **Verdict: adapted, shipped 2026-08-26**

Directly answers the prose-and-structure interest, and it is the structural half rather than the wording half: this kit reviews code with a sighted/blind pair and reviews a document with the code reviewer, which was never chartered to judge prose. The blind-reader's own charter is the sharpest idea in it: a persona from outside the repository may open the documents and nothing else, because a strong model with the code open reconstructs what the document failed to say. Two couplings to cut before porting. Both agents claim "a kit hook enforces the no-write half of this mechanically", which is only true alongside `readonly-agent-guard` (still pending here as candidate 2 of 2026-08-07); and `prose-reviewer`'s `Voice: scott` branch and its `references/ai-tells.md` path point into a standing rejection, so the voice authority has to be re-homed. Not the small route whatever its size: this is behavior-shaping prose and `writing-skills` gates it. **Landed 2026-08-26** as `archive/document-review-battery_spec_v1.md`, six sections across five commits. Reshaped in three ways beyond what this entry anticipated: the voice lens became a three-tier `Style authority:` ladder whose bottom rung declares itself unavailable rather than silent, since a `[style]` tag with no authority behind it invites invented conventions; upstream's canonical numbers table became a required list of claims the reviewer could not verify; and the battery is **additive** rather than a replacement, after both reviewers found the first carve-out dropped both code reviewers from any section shipping a document alongside code. Both charters ship without the hook-enforcement sentence, so nothing is owed to `readonly-agent-guard`, which stays candidate 2 of the 2026-08-07 pass and is now **two agents further behind**: nine agents that are read-only by intent grant `Bash`, not seven, and both new charters carry a permitted-write carve-out no other read-only charter has.

#### 2026-08-26 candidate 7: `references/ai-tells.md`

*`references/ai-tells.md`: a 167-line catalog of machine-prose tells, each with a Tell, a Rewrite, and the licensed exception.* **Verdict: adapted, shipped 2026-08-26**

Recorded as its own entry deliberately. It ships *under* `scott-writing-style`, refused 2026-06-17 as "their voice, by definition", and a later pass reading only that rejection would skip it. Its content is substantially voice-neutral: triadic rhythm as the default cadence, "it is not X, it is Y" contrast framing against a straw position, uniform sentence length, a bolded lead-in on every bullet, signposting, the closing paragraph that restates the body, every section ending on a portable maxim, over-parallel headers, trailing participial benefit-clauses, the non-committal verdict, bullets restating the paragraph above them, weightless intensifiers. It also has the right posture, which is the part worth keeping: none of these is wrong in isolation, the finding is frequency and uniformity, and a reviewer must say which. This kit already carries the same concern in its `no-assistant-prose-tells` memory and nowhere else, and it currently has **no** writing-voice skill at all, so the port needs a home before it needs an edit. Every cross-reference in it points at "Section 6"/"Section 8" of their SKILL.md, so the port is a rewrite against this kit's own style authority (the global CLAUDE.md style rules), not a copy. **Landed 2026-08-26** as `skills/writing-skills/references/ai-tells.md`, 17 entries. Two things the port had to add that the upstream file does not carry: the whole catalog is scoped to prose the author wrote and exempts material reproduced verbatim, which both reviewers reached independently because this kit already ships that rule with a near-miss behind it; and the entries are level-2 headings so the kit's own prose instrument can measure and subtract them individually, where one wrapper heading had collapsed 181 lines into a single indivisible row. Provenance pins upstream `ba1060b` rather than `a5fce80`, because the catalog landed at the latter and their finishing pass fixed it at the former.

#### 2026-08-26 candidate 8: `writing-skills`

*`writing-skills`: state facts the reader can check and correct; a fact base drawn from observed instances states its lists as open unless a contract closes them; a doctrine edit is invisible to same-session subagents; doctrine-adjacent rules have a contaminated RED.* **Verdict: pending, strong**

This kit's `writing-skills` owns exactly this bar and these four are all about evidence rather than voice. The contaminated-RED point is the load-bearing one and it is a genuine hole in this kit's own gate: a test subagent that inherits the global CLAUDE.md already complies with doctrine, so a rule restating or sharpening doctrine can show no RED failure for a reason that has nothing to do with the rule's quality. Pairs with the existing `red-gate-clean-still-ships` cross-project memory.

#### 2026-08-26 candidate 9: Reviewer effort compensation

*Reviewer effort compensation: an effort chosen for the model and for whether that model is the intended tier or a stand-in (Fable `high`, Opus `xhigh` with tier headroom, Opus `max` when covering for an absent Fable), plus the `Workflow`-route dispatch contract for any effort above an agent's frontmatter default.* **Verdict: split 2026-09-19. The effort dials are adapted and shipped; the compensation notch stays pending.**

Answers a real hole this kit shares: it falls back to the session model at whatever effort the agent definition happens to pin, which silently weakens the strongest gate in the system. Two portable observations ride with it, both about the Agent tool: it takes a model override but no effort parameter, so an effort override has to go through `Workflow`'s `agent()`; and an unnamed effort has been observed resolving to `xhigh` on a session whose agents were expected at medium, which makes "named explicitly, never left to inherit" a rule rather than a preference. The `effort:` frontmatter dials themselves are already tracked as candidate 10 of 2026-08-07.

**Adjudicated and half-shipped 2026-09-19 by `plans/agent-effort-dials_spec_v1.md`, and the
paragraph above is wrong about this kit in both of its halves.** It says the kit "falls back to
the session model at whatever effort the agent definition happens to pin, which silently weakens
the strongest gate in the system". Measured here: no agent definition pinned anything, and an
absent key inherits the *session's* effort rather than the model's, which on both profiles the
user runs is `effortLevel: "xhigh"`. So the gates were already running at the strongest effort
the client offers and the mispriced seats were the opposite ones, the cheap model-pinned
implementer and verifier burning top-tier reasoning on plan-following work. The candidate stands
re-aimed rather than retired: the defect is that agent strength was **undetermined**, set by a
per-machine setting the kit does not ship, and an operator installing this plugin with no
`effortLevel` got a different kit.

**What shipped** is the dials alone, on all 13 agents, under a rule stated locally rather than
ported: effort follows the failure mode, not the model, so a seat whose failure is silent runs one
rung above the model's own default and a seat whose failure is loud runs at that default and never
below it. Eleven gate seats at `xhigh`, the two plan-following implementer seats at `high`. The
upstream's table is NOT taken, because it is keyed on their per-section reviewer tiering, which is
a separate pending candidate (number 10 of the 2026-08-07 pass); taking the table would have
imported that tiering by the back door.

**Four facts were established first-hand against client 2.1.278**, and they are recorded here
because the next pass should not re-derive them. `effort:` is a real agent-definition key taking
`low | medium | high | xhigh | max`, honored on the **plugin** load path (measured with a
throwaway plugin, not inferred from a project-scope probe). An **invalid level loads silently**
and runs at the inherited effort, and `claude plugin validate` accepts a bogus frontmatter key as
readily as a real one, which together are why `test/agent-effort.test.js` now exists. The current
model fleet defaults to `high` (27 bundle entries against 4 at `xhigh`, plus a `??"high"`
fallback). And the field is an **absolute override rather than a floor**, so a pin cuts a session
set above it.

**The compensation notch is what stays pending, and the reason is now concrete rather than a
size judgment.** The Agent tool takes a model override and has no effort parameter, confirmed
against the live tool schema and the published SDK type, so raising a reviewer above its
frontmatter value at dispatch time has to go through `Workflow`'s `agent()`, whose inline
agent-definition key list does include `effort`. A `Workflow` round returns a task id and
completes asynchronously, so adopting it reworks the dispatch-and-await seam that
`plans/review-round-loop_spec_v1.md` already owns, and the notch's own trigger sits on Fable
downgrade paths whose header semantics `plans/fable-spend-absence_spec_v1.md` is still deciding.
`docs/backlog.md` carries it with those two dependencies named.

#### 2026-08-26 candidate 10: `responding-to-review`

*`responding-to-review`: corroboration across independent lenses outranks severity, with the independence test stated.* **Verdict: pending, cheap prose**

Ten lines, no coupling, and it fits this kit's existing sighted/blind pair exactly. The discriminator is the useful half: two findings from the same lens, a second reviewer handed the first one's output, or two agents given the same contaminating framing are one observation reported twice, not corroboration.

#### 2026-08-26 candidate 11: The intake gap check

*The intake gap check: enumerate what an input does not state before building on it, route each gap three ways (resolve from an existing source, default when low-blast and reversible, ask when material and the operator's), and declare the ones you filled on a surface the operator reads.* **Verdict: pending**

A doctrine bullet plus a spec `## Assumptions` block in a fixed form (`- assumed YYYY-MM-DD (<route>): <the assumption>; reversal: <what changing it costs>`) plus an `Assumptions made during execution` block in the close-out. Portable, and it is the separable answer to a failure this kit has: an assumption that lives only in a Chapter is one the user never sees. Their freeze rule on the block is upstream-specific (it exists because an external engine fingerprints everything above `## Chapters`).

#### 2026-08-26 candidate 12: Outline before you read

*Outline before you read: a doctrine bullet plus concrete grep ladders in `csharp-style` and `sql-style` for files past roughly 1,000 lines.* **Verdict: pending, unusually cheap here**

This kit carries both style skills, so the ladders drop in against surfaces that already exist. Their write-up is honest about the failure modes in a way that makes it worth taking rather than re-deriving: the member pattern needs `\b` or `publicKey.Validate(id);` matches, an interface's members carry no access modifier so the member grep returns nothing at all on an interface file, and the T-SQL pattern needs a leading `;?` because this house style's defensive leading semicolon defeats a `^CREATE` anchor.

#### 2026-08-26 candidate 13: Doctrine additions worth separating from the wholesale rejection

*Doctrine additions worth separating from the wholesale rejection: documents ship the current state and the journey lives in git; mark every load-bearing claim confirmed, inferred or reported; when the source that would answer is down the answer is "cannot measure"; a recalled memory contradicted by evidence gets fixed in the same turn; a background task's completion notification reports the wrapper's exit, not the run's.* **Verdict: pending**

The 2026-06-17 rejection of the 132-line manual holds (see the re-check below), and these are the window's new separable nuggets, in the same family as the four already parked from 2026-06-17. The confirmed/inferred/reported marking is the one with the widest reach and it already half-exists in the user's global rules ("flag memory vs. a file you just read"); their version extends it to a third state for what a peer session reported.

#### 2026-08-26 candidate 14: Backlog visibility

*Backlog visibility: every active item carries the date it was parked, a session-start block naming the count and the age of the oldest item, a 90-day aging check at the prune pass forcing a promote/retire/keep call, and retirement to a dated snapshot naming the effort that retired it.* **Verdict: pending**

This kit has a backlog and a `curating-docs` prune pass, so the mechanism has somewhere to land. Their motivation is partly upstream-specific (they steer sessions from Discord and read close-outs on a phone, so the backlog is a pull surface in a push workflow), but the failure it fixes is not: an item parked in a file nobody opens rots until it resurfaces by accident.

#### 2026-08-26 candidate 15: The `consult` read-only judge

*The `consult`: one read-only fresh-context judge (the `consultant` agent) convened at a counted trigger floor (a second failed attempt at the same problem, any BLOCKED that turns on a decision, a debugging dead end, a general hard-to-reverse license), with the built-in `/advisor` decommissioned in its favour.* **Verdict: pending**

The trigger floor is the good part and it is portable reasoning: stuck sessions do not feel stuck, they feel almost done, so the triggers are counted rather than felt. The decommission half needs a decision rather than a port, because this kit's sessions carry an `advisor` tool that sees the whole transcript, and their `consultant` is deliberately blind to it. Those are different instruments (the advisor catches a drifting approach, a blind judge breaks a bad frame) and the interesting question is whether this kit wants both, not which one wins.

#### 2026-08-26 candidate 16: `peer-sessions`

*`peer-sessions`: house rules for the `ListAgents`/`SendMessage` cross-session surface, plus one doctrine bullet anchoring it.* **Verdict: pending**

The capability postdates model knowledge, which is their whole argument for announcing it: without a rule the first session to discover the roster improvises authority, record-keeping and etiquette. Both tools are present in this kit's sessions, so the gap is real here. Their framing ("a coordination surface, not a record") is the part that transfers.

#### 2026-08-26 candidate 17: `coordinator`, `standing-watch`, `dispatch-authority`

*`coordinator` (a machine-wide seat with a committed board), `standing-watch` (a skill for attended loops watching a system the session does not own), `dispatch-authority` (a plan doc carrying a Dispatch Authorization section a receiving session arms on without a confirmation round-trip).* **Verdict: rejected 2026-08-26**

Upstream-specific as a set: they serve a multi-machine fleet with a planner/executor mesh across sessions, named machines (NEO-CLAUDE, SCOTT-CLAUDE, SCOTT-DEVELOP) and an operator steering from Discord. `standing-watch` is the closest to portable and could be revisited if this kit ever grows an attended-loop use case; `coordinator` and `dispatch-authority` presuppose the mesh.

#### 2026-08-26 candidate 18: Memory `supersedes:` frontmatter

*Memory: `supersedes: <name>` frontmatter demoting a record that was right when written and has been overtaken, `anchors:` letting a record say when the file it describes has changed, and a frontmatter guard validating hand-written records.* **Verdict: pending**

The `supersedes` case is a real hole in this kit's store too: today a correction is a fresh record beside the old one, both answering recall and disagreeing, with nothing saying which to trust. `anchors:` pairs with this kit's own accretion tooling. One of their findings does **not** apply here and is worth recording so nobody re-derives it: they found the harness rewrites a hand-written project memory into its own frontmatter shape (`name: ""` over a `metadata:` map) within the same second, which silently inerted every top-level field they read. This kit's memory records are already authored in that `metadata:` shape, and its cross-project tier lives outside the harness's project path entirely, so neither half bites.

#### 2026-08-26 candidate 19: `kit-goal` queue and arm-time binding

*`kit-goal` queue and arm-time binding: `/kit-goal <plan1> <plan2> ...` arming an ordered queue that advances on each plan's terminal state, and a claim predicate that binds an arming the harness never parsed as a slash command.* **Verdict: pending, arm-time binding confirmed live here**

This kit carries `kit-goal`, `kit-goal-lib.js`, `kit-goal-stop.js` from the same lineage, so the surfaces exist. The arm-time-binding defect is the one to check for here rather than port blind: an arming whose plan path never reached a `<command-args>` span arms the goal and can never bind it, silently and permanently. **Reproduced live 2026-08-26, and it is present in this kit unchanged.** The operator asked for a run to be armed in a sentence that ended with the literal text `/kit-goal docs/plans/document-review-battery_spec_v1.md` rather than opening with it, so the harness wrote no slash-command markup. `kit-goal.js arm` succeeded and `status` reported the goal armed and **unbound**. `kit-goal-stop.js:154` requires a user entry whose `<command-name>` is exactly `/kit-goal` or ends `:kit-goal`, with the plan path inside that same entry's `<command-args>` span; the session transcript's only `<command-name>` was `/claude-kit:kit-adoption-pass`, so nothing could ever claim the leash. Nothing in the arm path warns: the CLI reports success and the word "unbound" in `status` is the only signal, and it reads as a normal pre-claim state rather than a permanent one. The upstream fix is therefore worth more here than its size suggests, and the cheap half is a warning at arm time rather than the binding change itself.

#### 2026-08-26 candidate 20: Positive controls on absence-proving checks

*Positive controls on absence-proving checks: any check that leans on a hand-authored pattern, path or scope, not only a test, runs once against a tree where it should hit before its silence is trusted.* **Verdict: pending, cheap prose, and this skill needs it**

Adopted by them from a third-party evaluation, and it indicts a step of `kit-adoption-pass` itself: step 1's four-directory `ls-tree` anchor exists precisely because a wrong path prints nothing and exits 0, which is this rule discovered independently and stated narrowly. Generalizing it is a one-paragraph edit with unusual reach.

#### 2026-08-26 candidate 21: `kit-statusline.js` and `kit-goal-statusline.js`

*`kit-statusline.js` and `kit-goal-statusline.js`.* **Verdict: rejected 2026-08-26**

The user runs `ccstatusline` (`~/.claude/settings.json`), and a kit-owned statusline would replace it rather than compose with it. Revisit only if the goal state ever needs a display surface the session-start block cannot give it. **A second reason to revisit appeared 2026-08-27, and candidate 1 of this same pass has since retired it (see its point (4)): the kit polls itself from its own hooks, so nothing needs to run often enough to keep a cache warm, and 21 stays rejected on its original composition grounds. Left in place with this marker rather than deleted, because a reader who opens 21 alone was getting a live reason to reopen it.** The usage and spend signal documented in candidate 1 of this pass reaches the disk through whatever refreshes its cache, and a statusline is the only surface that runs often enough to keep one warm at no scheduling cost. So a kit-owned statusline would be carrying a data duty rather than a display duty. The composition objection above is unchanged and still decides it: replacing `ccstatusline` means owning its usage fetch, its lock, its error caching and its git and skills caches, not just its rendering. The operator's stated interest, 2026-08-27, is exactly that replacement, both to drop the third-party dependency and to build usage-limit behavior on top. That is a spec rather than a port, and it belongs to this kit rather than to the upstream one.

#### 2026-08-26 pass-level checks

**Removals checked.** `git diff --diff-filter=D --name-only 09c91a4..a1ada6f` returns
exactly one path: `tools/hook-tests/guards.test.js`. **The intersection is effectively
already resolved here.** They deleted it as an orphan test harness after consolidating it
into `test/`, because it held the only coverage of the live `pr-docs-guard.js` hook; this
kit already keeps that coverage in `test/guards.test.js`, which exercises all three guards
(`docs-write-guard`, `pr-docs-guard`, `merged-pr-push-guard`). Nothing to reconsider.

Read for signal rather than for overlap, the window's real removal is not in that list at
all: **the stop-failure recovery feature, built and deleted inside the same window**, which
is candidate 2 above and the reason candidate 1 is a settings change instead of a port.

**Rejection re-checks.** Verdicts are keyed by capability, so a window this large gets the
touched rejections re-read rather than skipped.

- **Their full operating manual, wholesale** (2026-06-17): **holds.** The window added
  roughly twenty new bullets to it, which strengthens rather than weakens the reason. The
  separable nuggets are candidates 11, 12 and 13.
- **`scott-writing-style`** (2026-06-17): **holds for the voice.** The rejection was "their
  voice, by definition" and that is still exactly right for SKILL.md. The window added
  `references/ai-tells.md` under it, whose content is not voice, and that file is tracked
  separately as candidate 7 so a later pass does not read the parent rejection and skip it.
- **Their compaction-ledger genealogy** (2026-07-24): **holds.** That refusal was about a
  user-writable ledger driving a leash rebind. This window's compaction work is scheduling
  rather than genealogy and is a different capability, tracked as candidate 5.
- **The Fable spend wall, which this kit took** (adapted 2026-07-24): the upstream author
  has now **retired** the `Fable Spend:` header and its cost-hold machinery kit-wide, on
  the ground that Fable is included in plan allotments rather than metered, so an exhausted
  allotment blocks rather than bills. That is signal against something this kit adopted and
  is worth a look, but it is a question about this user's own account semantics, not a
  candidate to port. Recorded so the next pass does not read it as new.

### Pending-queue working session, 2026-08-07 (no new window)

A second run the same day. `origin/main` was still `09c91a4`, so the window was empty and
there was nothing to classify; no pass section is recorded for a zero-commit window, and
neither header moved. **That last clause is not the rule.** This run fell on the same day
at the same sha, so both headers already held the right values and leaving them alone
decided nothing. `kit-adoption-pass` step 6 now carries the empty-window branch, under
which `Watermark:` is the no-op and `Last pass:` still advances; a later zero-commit pass
follows the skill rather than this sentence. What the run did instead was work the pending queue, and four
entries below gained evidence they did not have. Each is marked `verified 2026-08-07 (2nd
run)` in place rather than restated here.

### Pass of 2026-08-07 (`8880eb7..09c91a4`)

138 commits, 129 files, +34k/-9.5k, spanning 2026-07-24 to 2026-08-06.

| # | Capability | Verdict |
|---|---|---|
| 1 | Semantic memory system | **adapted 2026-08-07** |
| 2 | `readonly-agent-guard` | **pending, strong** |
| 3 | `hook-canary` | **pending, strong** |
| 4 | `kit-version-nudge` | **pending, blocked on a prerequisite** |
| 5 | Doctrine rightsizing | **pending, method only** |
| 6 | `output-styles/kit.md` | **pending, mechanism only** |
| 7 | `docs/security-model.md` | **pending, shape only** |
| 8 | Fleet integration and the external-engine standdown | **rejected 2026-08-07** |
| 9 | `operating-instructions` skill changes | **rejected 2026-08-07** |
| 10 | Backlog-sweep batch | **pending, split** |

Each candidate's reasoning follows below, one section apiece.

#### 2026-08-07 candidate 1: Semantic memory system

*Semantic memory system: `memq.js` (5,337 lines), `memory-index.js` (1,092), `memory-session.js` (772), the `memory-system` skill, `memq-shim`, `memq-grant`, `memory-usage-stamp`, ~14k lines of tests, PowerShell doctor sections, 6 specs.* **Verdict: adapted 2026-08-07**

**Adjudicated 2026-08-08 in a design council; the effort is `plans/cross-project-memory_spec_v1.md`.** The engine is not taken. Two separable ideas are: a kit-owned cross-project tier, and advisory decay with use-reinforcement. Both reshaped hard against this kit's evidence rather than ported. What the council changed versus their design: the emitted index line is **generated from each record's `description:`** rather than hand-maintained (theirs is hand-maintained, and this store shows index currency is a byproduct of creating a record 15/15 and never of revising one 0/8); a computed `[body revised]` marker covers the residue that generation cannot; bodies stay directly `Read`-able rather than CLI-gated (`docs-curator` grants no Bash under any grant, so a CLI-gated body is unreachable to this kit's own curator); decay is advisory rather than automatic; and the root is a clean kit-owned directory, which drops their allowlist, four probes, and drift detection entirely. The embedder, git sync, and the whole fleet half stay out. The classification reasoning that led here follows. **Measured 2026-08-07 (2nd run):** the engine is ~7.2k lines of production JS plus ~14k of tests, against this whole kit's ~7.9k lines total, so adopting it wholesale is a >3.5x codebase increase for one subsystem. Two framing corrections from reading their specs. First, `automemory-off_spec_v1` shows the design **does not require turning native off**: they abandoned harness detection outright (the harness decides auto-memory through private minified code merging five settings tiers, and two review rounds each found another layer), so the kit emits its own index unconditionally and the cost of native being on is a redundant few-hundred-token duplicate index, not a conflict. Second, the embedder is a **later addition, not the core**: `memory-recall-and-reinforcement_spec_v1` settled recall with embeddings explicitly out of scope, using a no-query digest the model itself scores, and their design council rejected lexical scoring in favour of that. The vector layer arrived only in `synced-semantic-memory_spec_v2`. **The size argument against embeddings here:** the native store holds 62 records across all projects (8 in this one), while their own recall digest budgets 200 lines, so this store is at ~31% of a budget built to be generous. Brute-force cosine over 62 records, bought with a several-hundred-MB `onnxruntime-node` install, is a vector index over a shoebox; the digest the model reads with the task in view is both cheaper and the better scorer at this corpus size. The separable ideas worth a brainstorm are the two native genuinely lacks: **decay with use-reinforcement**, and a **cross-project tier** (their journal → project → type → operator → doctrine ladder) for facts that today strand in whichever project store learned them. Two cautions to carry in: they report a real store showing **23 decay candidates against one recorded stamp**, so the usage signal the whole reinforcement model feeds on is weakly produced in practice; and their `~/.claude`-as-git-repo sync, allowlisted and pushed to a private GitHub remote, is the highest-risk piece by a distance (their own words: the allowlist "is the only barrier between 'sync memories' and 'publish credentials'"), is motivated by their four machines, and should not come across for a single Linux workstation.

#### 2026-08-07 candidate 2: `readonly-agent-guard`

*`readonly-agent-guard`: PreToolUse Bash guard making the read-only agent contract mechanical (~969 lines).* **Verdict: pending, strong**

Same exposure here, verified 2026-08-07: seven agents that are read-only by intent grant `Bash` (`adversarial-reviewer`, `blind-reviewer`, `council-member`, `design-facilitator`, `pr-reviewer`, `qa-verifier`, `security-reviewer`), so their read-only contract is declarative only. `docs-curator` and the three implementers hold write tools by design and are out of scope.

#### 2026-08-07 candidate 3: `hook-canary`

*`hook-canary`: SessionStart known-answer probes over the installed plugin cache's enforcement hooks.* **Verdict: pending, strong**

Answers the live backlog item "Live-fire the docs-write-guard after the next plugin update" and the standing plugin-cache-lag problem, where a repo edit is inert until `/plugin update` and no hook can verify itself in the session that wrote it.

#### 2026-08-07 candidate 4: `kit-version-nudge`

*`kit-version-nudge`.* **Verdict: pending, blocked on a prerequisite**

Same family as candidate 3. It warns when a long-lived session is running an older build than the one now installed: it pins the installed build hash at a session's first SessionStart and compares on every later one, so a guard installed mid-session cannot go unnoticed. It never reads the repo. The prerequisite is the catch: it reads a build-stamped `.claude-plugin/build-info.json`, which this kit does not produce (no build script, only `setup.sh` and `setup.ps1`). Adopting it means adopting a build stamp first, so this is not the small win it looks like.

#### 2026-08-07 candidate 5: Doctrine rightsizing

*Doctrine rightsizing: a 26% trim of the always-on doctrine against the Claude 5-generation harness baseline, plus `doctrine-refresh.js`.* **Verdict: pending, method only**

Auditing always-on rules against what the current harness now owns is portable and cheap. Their specific cuts are their file, not the user's. `reconcile-claude-md` is the adjacent machinery; whether the audit lands there is the adoption effort's call, not this classification's.

#### 2026-08-07 candidate 6: `output-styles/kit.md`

*`output-styles/kit.md`: a force-applied output style re-asserting the communication register late in a session, whose register core rides byte-identical with the doctrine under a parity gate.* **Verdict: pending, mechanism only**

The mechanism addresses real register decay deep in a session, and the parity gate is the interesting part. Note its scope: only the register core (their doctrine's communication bullets plus the before-you-send checklist) is held byte-identical, not the style-owned shell. The content (teaching posture, the Insight and Decision block marks) is their voice and fails this kit's lean, anti-dogma line.

#### 2026-08-07 candidate 7: `docs/security-model.md`

*`docs/security-model.md`.* **Verdict: pending, shape only**

This kit has a backlog item of that exact title open since 2026-07-24, and the generalized `security-reviewer` reads such a doc first when present. Take the document's shape; the contents are this kit's own to write.

#### 2026-08-07 candidate 8: Fleet integration and the external-engine standdown

*Fleet integration and the external-engine standdown: `KIT_EXTERNAL_ENGINE`, run-scoped memory tiers, the memq grant, the frozen plan-doc machine contract.* **Verdict: rejected 2026-08-07**

Upstream-specific. It is a contract with an external engine (Spine's Dispatch) that the user does not run. Revisit only if this kit ever gets spawned by an orchestrator.

#### 2026-08-07 candidate 9: `operating-instructions` skill changes

*`operating-instructions` skill changes.* **Verdict: rejected 2026-08-07**

The 2026-06-17 rejection of the full operating manual holds. Rightsizing is the separable part worth reading, and it is tracked as candidate 5.

#### 2026-08-07 candidate 10: Backlog-sweep batch

*Backlog-sweep batch: subagent `effort` frontmatter dials on six agents; the reviewer-one-tier-above-the-writer rule; the exit-after-stdout-write truncation fix across six SessionStart/Stop hooks.* **Verdict: pending, split**

Three separable things. The truncation fix may be a latent bug in this kit's shared-lineage hooks and warrants a direct check before anything else here. The effort dials are a cheap capability this kit lacks. The reviewer-tier rule already carries their own adjudication against the Fable spend wall (their `claude-kit_backlog-sweep_spec_v1.md`, section 1: a below-fable session's reviewer override is Fable spend under the existing header semantics, and `none (cost hold)` caps it at the session model); this kit's wall was adapted from theirs, so start from that reasoning rather than re-deriving it.

#### 2026-08-07 pass-level checks

**Removals checked.** Removals only matter where the two kits overlap, so the check is a
set intersection, not a judgment call:
`git diff --diff-filter=D --name-only 8880eb7..origin/main` against this kit's tree.
They deleted 25 files in the window, all of them the `compact-session` skill and its
vendored ~2,280-line engine, `context-tripwire`, and the relay machinery (`relay-ready`,
`relay-refresh`, the AutoHotkey watcher). **The intersection is empty**: this kit carries
none of them, so there is nothing here to reconsider holding.

Not vacuous, though. The intersection is necessary and not sufficient, because a removal
can be signal about a direction this kit is **contemplating** rather than about code it
holds. They abandoned deliberate compaction outright, on zero usage by their own account,
and had already removed the context tripwire and relay machinery in an earlier unwind
that records no usage figure. That is negative signal on the 2026-07-20 kaizen note
about nudging a fresh session at Chapter boundaries, with the zero-usage evidence
attaching to the compaction half only.

**Found on the second sweep.** The first sweep classified off their `docs/` index, which is
organized by effort and therefore describes **new capabilities** well and **changes to
existing files** not at all. A second sweep over added-lines-only diffs of `skills/`,
`agents/`, and `hooks/` found ten more items, all of them small, portable, and invisible
to the first. This is why the skill's ladder carries both steps; the evidence is in the
`kit-adoption-pass` spec (in `plans/` while the effort is open, `archive/` after).

| Capability | Verdict |
|---|---|
| `process.exitCode = 0` replacing `process.exit(0)` after a stdout write | **adopted, closed 2026-08-26** |
| `qa-verifier` | **pending, strong** |
| `docs-curator` | **pending, strong** |
| `executing-work` | **pending, strong** |
| `writing-skills` | **pending** |
| `kaizen` | **pending** |
| Style-skill path resolution ladder | **pending** |
| `finishing-work` | **pending** |
| Reviewer per-finding confidence rating | **pending, separable here** |
| `curating-docs` | **pending, partial** |

##### second sweep: `process.exitCode = 0` replacing `process.exit(0)` after a stdout write

*`process.exitCode = 0` replacing `process.exit(0)` after a stdout write.* **Verdict: adopted, closed 2026-08-26**

Not a preference. Forcing the exit can discard a write still in flight on a pipe. Verified 2026-08-07: four hooks have the stdout shape (`session-start`, `stop-docs-hygiene`, `branch-reaper-nudge`, `kit-goal-stop`). `kit-goal-stop` is the serious one, where a truncated write reads as no-block and silently releases the leash. **Re-verified 2026-08-07 (2nd run): the site count is seven, not four.** The three PreToolUse guards (`docs-write-guard`, `pr-docs-guard`, `merged-pr-push-guard`) carry the same shape on the deny path, `process.stderr.write` then `process.exit(2)`; the consequence there is milder but real, since exit 2 still denies while the truncated stderr costs the model the deny *reason*. Their trailing `exit(0)` is a clean no-output path and is harmless. `kit-goal.js` already uses `process.exitCode` throughout and was the in-repo precedent. **Closed 2026-08-26: already fixed here.** Commit `5954011` ("hooks: live-fire the docs-write-guard, then drop the forced exits it shares with six siblings") landed it across all seven sites; `grep -rn 'process\.exit(' plugins/claude-kit/hooks/` now returns only a comment in `memory.js`, and the backlog entry is gone. Nothing owed.

##### second sweep: `qa-verifier`

*`qa-verifier`: sandbox `HOME`/`USERPROFILE` to a temp dir **before** the first probe, and split `UNVERIFIABLE` into `environment` versus `operator-only`.* **Verdict: pending, strong**

The sandbox rule is the exact hazard this effort's own Section 4 hit: `claudeMdSyncOffer` is not repo-gated, so an unsandboxed probe reads the real home. Learned here independently, which is the best argument for taking it.

##### second sweep: `docs-curator`

*`docs-curator`: sweep by claim rather than by changed file (counts, enumerations, justifications, renamed paths), a required `CLAIMS SWEPT` block even at zero drift, `file:line` on every drift entry, and a ban on writing drift markers into shipped docs.* **Verdict: pending, strong**

Pure prose, drops straight in, and aimed at a failure this kit's curator can have today.

##### second sweep: `executing-work`

*`executing-work`: wait-is-not-a-stop, the `WAITING:` stop shape the leash allows without releasing, and capacity explicitly excluded from the blocker set.* **Verdict: pending, strong**

This kit runs the same leash with the same failure mode. Its completion contract already carries wait-is-not-a-stop; the `WAITING:` shape and the capacity exclusion are the new parts.

##### second sweep: `writing-skills`

*`writing-skills`: close every enumeration with its class.* **Verdict: pending**

A list of instances reads as exhaustive the moment it ships, so an unlisted variant presents itself as licensed. One rule, high leverage on this kit's own authoring.

##### second sweep: `kaizen`

*`kaizen`: state the lesson, not the incident; and never write a note into the plugin cache.* **Verdict: pending**

The second half pairs with this kit's existing plugin-cache-lag knowledge.

##### second sweep: Style-skill path resolution ladder

*Style-skill path resolution ladder (`CLAUDE_PLUGIN_ROOT`, else the skill's own base directory's grandparent) replacing hardcoded literals in dispatch briefs.* **Verdict: pending**

Aimed squarely at the plugin-cache-lag problem this kit documents.

##### second sweep: `finishing-work`

*`finishing-work`: bracket the review rounds with `git status --porcelain` captured before and compared after.* **Verdict: pending**

Catches a reviewer mutating the tree. Ten lines of prose, no platform coupling, and it is the general-case check that does not need the guard hook below.

##### second sweep: Reviewer per-finding confidence rating

*Reviewer per-finding `[confidence: high\|medium\|low]` alongside severity, with an explicit rule not to downgrade severity to hedge low confidence.* **Verdict: pending, separable here**

The rating itself is standalone and good. The same commit adds sentences to five of their agents claiming "a kit hook enforces the no-write half mechanically", which is only true alongside `readonly-agent-guard`. **Verified 2026-08-07 (2nd run): this kit's agents carry no such sentence** (`grep 'hook enforc\|enforced by a hook\|kit hook' plugins/claude-kit/agents/` is empty), so the coupling is a hazard in *their prose* rather than an entanglement here. Port the rating without those sentences and nothing is owed to `readonly-agent-guard`.

##### second sweep: `curating-docs`

*`curating-docs`: a "the header is a machine contract" section with a frozen table of exactly what an external parser reads from a plan doc.* **Verdict: pending, partial**

The table's contents are their engine's contract and do not apply. The idea of freezing and documenting a machine-read header does. **Verified 2026-08-07 (2nd run):** the idea is already in force here, in this file's own "The `Last pass:` header is a machine contract" section, which states the four rules the `session-start.js` staleness nudge depends on. That is convergence rather than adoption, so the verdict stays `pending` pending the user's call: closing it as satisfied is proposed, not taken, because closing removes the re-ask that capability-keyed verdicts exist to preserve.

#### Carried from the pass of 2026-06-17

| Capability | Verdict |
|---|---|
| Four operating-manual nuggets held back for a dedicated curation pass | **pending** |

##### carried 2026-06-17: Four operating-manual nuggets held back for a dedicated curation pass

*Four operating-manual nuggets held back for a dedicated curation pass: confirmed-versus-inferred sharpening, finding-is-a-hypothesis, close-with-state, the before-you-send re-read. `archive/claude-kit_spec_v3.md` Chapter 3 adds a fifth, "match my precision".* **Verdict: pending**

Separable from the wholesale rejection above and judged worth having, but reserved rather than snap-included. Reserved 2026-06-17; nothing has tracked them since, which is the failure this file exists to end.

## Editing this file

The `kit-adoption-pass` skill owns the procedure; it is the single source for how a pass
runs, and nothing here restates it. Three conventions belong to the file itself:

- **New pass sections go directly under `## Verdicts`, above the previous pass.** The
  ordering is newest-first, so a literal append would put the newest pass at the bottom.
- **A `rejected` entry the new window touched gets re-checked**, since verdicts are keyed
  by capability and a substantial rework can outdate the reason. Update the entry in
  place and re-date it.
- **A live entry is amended in place and the amendment carries its own date**, in bold, at the
  point the new evidence lands: "**Built, 2026-08-28, and four of the claims above no longer
  hold.**" The rule above covers `rejected`; this covers the class that actually accrues, since
  a `pending` entry is by definition waiting for evidence and gets it in strata. Never rewrite
  the superseded reasoning to match the new finding: the entry's value to a later pass is the
  sequence of what was believed and what falsified it, and a tidied entry destroys exactly that.
  **When an amendment changes the verdict, change the verdict line too** - an entry whose body
  has concluded and whose verdict has not is the one failure this convention exists to prevent.
- **A pass section is an index table plus one `####` section per candidate**, never a table
  carrying the reasoning in its cells. The index is `| # | Capability | Verdict |` with a short
  capability label; the section is `#### <pass date> candidate <n>: <short label>`, carrying the
  full capability, the verdict, and however much reasoning the candidate has earned. The number
  in the heading is what the index column indexes into. Pass-level material (the removals check,
  the rejection re-checks) takes its own `####` heading so it does not read as the last
  candidate's reasoning. **A sub-list nested inside a pass takes the same shape one level down
  and drops the numbering**: the 2026-08-07 second sweep and the items carried from 2026-06-17
  are indexed `| Capability | Verdict |` with `#####` sections, because their items are not
  numbered candidates of the pass and numbering them would collide with the pass's own.
  **The reason is that a candidate's reasoning grows after the pass that opened it**, as later passes add evidence to a `pending` entry, and a cell has nowhere to put
  structure: the longest single row reached 4,601 characters, and the 2026-08-26 candidate 1 entry
  had already burst its cell altogether, its sub-headed `(a)`/`(b)` arguments sitting as loose prose
  between two table rows and splitting the table in two, 13,595 characters in all
  (its row plus that prose, `c483027:165-171`). Reading one took
  a grep and a script where a section takes a `sed` range (2026-08-31). **Known debt:** the sections
  converted from cells that day carry their prose as single unwrapped lines, the longest 8,526
  characters, because that is how a table cell had to hold it. A `sed` range reads them, which was
  the friction; they are still hard to read in a terminal. Wrap a section as you touch it rather
  than reflowing the file, which is a bulk edit nobody has a reason to review.
