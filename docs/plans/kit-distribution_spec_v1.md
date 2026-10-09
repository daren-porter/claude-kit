# Kit Distribution: a core others fork into their own kits

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-11

## Why this exists

The user's goal, stated 2026-08-11: turn this kit into something others at their org download and
then effectively **fork into their own personal kits**, with their own styles and philosophies,
and keep building on theirs the way the user has built on this one. A "core" kit keeps being updated;
forkers merge core's changes in and reshape them to preference; there is some path for them to
propose things back to core; and a first-run flow walks them through installation, the CLAUDE.md
setup, and optionally learning their coding and writing style from samples they provide.

Publishing is real but unscheduled, and a lot of other change comes first. This stub parks the
future state so the work already proposed can be sequenced against it rather than colliding
with it.

## Operator ruling, 2026-09-04: kept, on its own content rather than on its ambition

Put up in the 2026-09-04 kaizen triage as a large feature with no observed friction driving it.
The operator's test was explicit: keep it if it carries good initial ideas about how the kit would
change to be more widely distributed, eliminate it if it is only a stub for the idea, since the
idea itself will not be forgotten.

**It passes that test, and the deciding content is the section immediately below.** This is not a
stub for an ambition; it is analysis that would be expensive to re-derive:

- The fork relationship **already exists, implemented once**, so most of the work is parameterizing
  an upstream rather than building fork support. That reframing is what makes the whole thing
  tractable, and nothing else in the repo records it.
- Two concrete pointers that survive independently: per-fork state is already outside the shipped
  payload, and `reconcile-claude-md` is the fork-merge problem solved at one-file scale.
- **Capability 2 is valuable even if distribution never happens.** Deriving a style skill from
  samples a user volunteers turns `csharp-style` and `sql-style` from one person's house style into
  generated artifacts. That is a product idea in its own right and it is the reason this file earns
  its place independent of the aspiration.

Still aspirational as a whole, and explicitly not queued. The ruling is about not discarding the
analysis, not about scheduling the work.

## The finding that reframes this

**The fork relationship already exists, implemented once.** `kit-adoption-pass/SKILL.md:8` opened
"claude-kit is a personalized fork of Scott Applefeld's kit" (quoted as it stood before the
`kit-denaming` sweep de-named that skill; it now says "the upstream kit"), and that skill is already the
merge-upstream-into-my-personalized-fork pass, with a watermark sha, a standing ledger of what
was taken, reshaped, or refused, and a staleness nudge. The user's kit relates to the upstream's exactly
as a future forker's kit would relate to core.

So this is not a new architecture. It is generalizing a relationship the kit runs today, and the
design work is mostly subtraction: find what is specific to *the upstream kit in particular* rather
than to *an upstream*. Two things already point the right way:

- **Per-fork state is already outside the shipped payload.** `kit-adoptions.md` lives in `docs/`,
  and `docs/README.md:3` states nothing there ships inside `plugins/claude-kit/`. A forker's
  ledger of what they declined from core is theirs and never travels. Nothing needs moving.
- **`reconcile-claude-md` is a working model of the merge this needs**, at one-file scale: base,
  ours, theirs, with a version marker and a baseline snapshot, the upstream delta folded onto the
  user's content, every conflict flagged rather than guessed, and a hard rule against dropping a
  user's own rule. That is the whole fork-merge problem in miniature, already solved and tested.

What is genuinely hard-coded is the upstream's identity (the skill's description, its prose, the
clone path, the watermark) and its stance at `:16`, "Inbound only. Nothing goes back to Scott"
(again the pre-sweep wording; that line now names the upstream generically) -
which is exactly the half this proposal adds.

## The four capabilities, and what each actually needs

1. **Install and first run.** A guided path: install the plugin, establish the canonical global
   CLAUDE.md, reconcile it, and explain the workflow skills. Most of the mechanism exists
   (`setup.sh`, `reconcile-claude-md`, the canonical-plus-symlink scheme); what is missing is the
   guided sequence and a first-run state that knows it has not run yet.
2. **Learn the forker's style, optionally.** The sharpest product idea in the set, and the one
   worth designing first because it is valuable even if publishing never happens: `csharp-style`
   and `sql-style` are today statements of one person's house style. Under this model they are
   *derived artifacts*, generated from samples a forker volunteers. That is a different skill
   shape (a generator plus a generated skill) and it wants its own design pass. It is also the
   honest answer to "not required": a fork with no samples gets a neutral style skill, not a
   broken one.
3. **Merge core's updates.** `kit-adoption-pass` with a parameterized upstream. Decide whether one
   skill serves both relationships (the user's kit reads the upstream *and* a forker reads core) or
   whether they diverge, and note that a fork of a fork is then possible and probably fine.
4. **Propose changes back.** The hardest, and it is governance rather than code. See below.

## The decisions a design pass must make first

- **What is core, and what is fork-local?** The payload/`docs/` split already answers most of it,
  but not all: the `cold` and `responding-to-review` skills encode a philosophy, not a mechanism,
  and a forker who disagrees should be able to reshape them without that reading as drift from
  core. Which parts of core are "mechanism you inherit" versus "opinion you are expected to
  overwrite" needs stating, because the merge pass has to treat them differently.
- **What does a contribution owe?** The kit's quality bar is `writing-skills`' RED/GREEN gate with
  recorded artifacts. A contributor proposing a skill change owes that bar, so either they run the
  gate and submit the artifacts, or core's maintainer re-runs it on their behalf. The first
  scales and is easy to fake; the second does not scale and is the only one that actually
  verifies. That tradeoff decides whether contribution is realistic at all, and it should be
  settled before any contribution mechanism is built.
- **Does core carry a name at all?** `kit-denaming_spec_v1.md` is no longer a stub and no longer
  waiting on this one. Its 2026-08-20 design pass settled the in-place sweep and handed two things
  back here, with a constraint attached. The two: genericizing the upstream-specific and
  org-specific content so a truly generic core carries no identity at all, and deciding how a fork
  names its own user. The constraint is that **install-time substitution is not available**,
  verified rather than assumed: the plugin cache is keyed by commit sha and `/plugin update` pulls
  a fresh tree into a new directory, so anything a setup script rewrote is discarded on every
  update; `SKILL.md` has no interpolation; and skills cannot read environment variables, only
  hooks can. A token scheme rewritten at install is therefore dead on arrival, and whatever
  mechanism this plan designs has to survive an update that replaces the entire payload. The
  cheap answer already in the kit is a role noun in the prose plus an identity line in the user's
  own `~/.claude/CLAUDE.md`, which `reconcile-claude-md` already merges.

## The part most likely to be underestimated: the trust boundary moves

`docs/security-model.md:29` states the premise the whole kit rests on: "The workspace is
trusted." That holds for one person running their own kit in their own repos. Distribution breaks
it in both directions, and neither is a wording problem:

- **Inbound to a forker.** Installing the kit means installing hooks, which are executable code
  that runs at every session start, plus PreToolUse guards that see every tool call. A forker
  installing core is running someone else's code with that reach. Today the author and the whole
  audience are the same person; under distribution that is a supply chain. `security-model.md:143`
  currently
  discharges supply chain on the grounds that there is no `package.json`, no lockfile and no
  dependency - true, and it answers a different question than this one.
- **Inbound to core.** Accepting a contributed hook means shipping code, to everyone who installs
  core, that core's maintainer did not write. That is the same exposure pointed the other way, and
  it is the reason the contribution question above is a security question and not just a
  scaling one.

A design pass must extend `security-model.md` with a distribution section rather than leave the
trusted-workspace premise standing unqualified, because that premise is currently load-bearing
for the `security-reviewer` agent's judgment.

## What a mechanical approach provably misses

Recorded so a later pass does not learn it the expensive way. The kit's own history says a sweep
that greps for names finds prose and misses generated output (see the de-naming stub's category
3). The distribution analogue: what makes this kit effective is not only its files but its
*recorded reasoning* - archived Chapters, the adoptions ledger, the backlog's closure conditions.
None of that ships in the payload, all of it is what lets a session pick up work cold, and a fork
that starts with an empty history starts without the thing that makes the kit compound. Whether
a fork inherits any of core's reasoning, and in what form, is an open question this stub will not
answer.

## Evidence: the first fork run, 2026-10-09

A colleague forked the kit at `91ff385` with a paste-in setup guide kept outside the repo (the
user's home directory, `claude-kit-colleague-setup-2026-10-09.md`), on Windows 11 through the
Claude desktop app, and returned a friction log of about 30 entries. The fork ended renamed,
pushed, installed with its hooks firing, and with its suite at 0 failing. The raw log stays outside
the repo because it records the colleague's account names and credential-store contents; this
section carries its substance. **Verified** marks a claim checked against this repo; everything
else is the log's report, not re-measured here. Five entries were defects in the kit as it stands
and were fixed in `d55ff23` instead of being recorded here.

One observation bears on the open question in the section above: offered the choice, the forker
kept this kit's backlog and parked plans as their starting point, because the backlog describes
known gaps in code they now own.

### Windows and the desktop app (capability 1)

- **The suite is not portable.** From Git Bash, 25 of 642 tests fail:
  - 2 are line endings. Git for Windows checks out CRLF, and a `.gitattributes` with
    `* text=auto eol=lf` fixes both.
  - 18 are setups that only work on Linux or macOS: symlinks, Unix mode bits, FIFOs, copying
    `/bin/sh`, a `"` in a filename, and a read-only directory.
  - 5 are other: two `docs-write-guard` fixtures pair a POSIX cwd with a drive-letter path, one
    test overrides `HOME`, which Windows ignores in favor of `USERPROFILE`, and three were not
    examined.

  `.githooks/pre-commit` runs the suite as a hard gate, so a Windows forker's first gated commit
  is blocked. The forker made the suite pass in their own fork (23 edits across 9 test files plus
  the `.gitattributes`: 622 pass, 0 fail, 20 skipped). Ask for that patch when this work starts.
- **The FIFO guard does not hold on Windows.** The FIFO tests return early when `mkfifo` fails
  (verified: `session-start-kaizen.test.js:181`). Git Bash ships an `mkfifo` that exits 0 but makes
  something Node does not treat as a FIFO, so the early return never fires.
- **The memory nudge never prints a runnable command on Windows** (verified:
  `session-start.js:331-336`). `memoryCommand()` refuses any path containing `\`. Printing the
  path with forward slashes on win32 would pass that guard (suggested, untested).
- **`node-probe.sh` is probably not silent on Windows.** README INSTALL step 6 says it is silent
  there, "where no `sh` is on PATH". The forker read the Claude Code docs as saying shell-form
  hooks run in Git Bash when it is installed, and Git Bash supplies `sh`. If so, the README claim
  holds only for the PowerShell fallback. Unverified.
- **The desktop app is a different install path.**
  - It ships no Node.
  - It bundles its own CLI at a versioned path that is not on PATH.
  - It documents no in-app way to add a marketplace, and has no in-session `/plugin update`.
  - Its restart is a sidebar click, not `claude --continue`.

  The CLI installer (`install.ps1`) put `claude.exe` in `%USERPROFILE%\.local\bin` and did not
  add that folder to the saved PATH. Without `claude` on PATH, `.githooks/pre-commit` skips
  validation and only prints a note. What worked was installing the CLI and using it for the
  marketplace add, the install and the restart. A desktop session's transcript resumes from a
  terminal `claude --continue`.
- **GitHub identity is ambiguous.** "Repository not found" is GitHub's answer both for no access
  and for the wrong signed-in account. On a machine with two GitHub identities in Git Credential
  Manager, putting the account in the URL (`https://<user>@github.com/...`) worked for push,
  clone, and as a marketplace source, which the Claude Code docs do not cover. The first push's
  sign-in also changed which account plain GitHub URLs use on that machine.
- **`merged-pr-push-guard.js` needs `gh` or `az` signed in to ever block** (verified;
  `architecture.md` now says so). The README lists Node as a prerequisite and neither CLI.
- **Superpowers interferes from the first turn.** Its SessionStart injection was live in the fork
  session and pulled against the guide's interview-first instruction. Uninstalling it leaves its
  marketplace registered.

### What a fork changes by hand (capabilities 1 and 3)

- **The de-naming test guards the wrong name.** `test/denaming.test.js` hard-fails the upstream
  author's name, so in a fork it keeps protecting a name the fork never writes, and it checks no
  name the fork's own sessions might write. This lands on "Does core carry a name at all?" above.
- **The ledger test's floors are sized to this kit's ledger** (at least 25 candidate rows, at least
  5 tables). A fork's fresh ledger fails exactly those two, as predicted and confirmed. Lowering
  the row floor to 0 makes that assertion vacuous until a pass raises it. A conditional floor,
  requiring rows once any pass section exists, would hold in both repos.
- **`kit-adoption-pass` assumes this kit's own upstream layout twice** (verified):
  - step 1's `ls-tree` lists `plugins/claude-kit/scripts/` and treats a missing directory as a
    moved layout, a false stop when the upstream is this kit;
  - the index diff reads `docs/plans/README.md`, which this kit does not have.

  Both are right for this kit's upstream and wrong for a fork of it: capability 3's
  parameterized upstream, in concrete form.
- **`kit-adoption-pass` cannot tell "nothing upstream" from "nothing reachable".** A reference
  clone whose `origin` is a bundle file fetches successfully, pins the watermark, and reports an
  empty window. The forker's clone works that way until its `origin` is repointed. A check that `origin`
  is a network remote, or a prompt to confirm an empty window, would close it.
- **Moving the ledger to `archive/` leaves stale citations.** Six citations of specific upstream
  entries by line ended up pointing at the fresh ledger: in `docs/README.md`, `architecture.md`,
  `usage-awareness.md`, `hooks/usage-autocontinue-nudge.js`, and a plan. The forker redirected
  them.
- **Docs speak in the first person about this machine and account** (verified):
  - "on this machine means `~/.claude-work/...`" (`architecture.md:93`);
  - "this Team seat with overage enabled" (`docs/README.md:15`);
  - "this account's Anthropic usage windows" (`usage-awareness.md:3`, `docs/README.md:42`).

  De-naming removed the name and kept the first person. For a forker these statements are false.
- **The kit's prose calls itself `claude-kit` where it means "this kit"** (verified):
  `kit-adoption-pass/SKILL.md:8` and `kaizen/SKILL.md:224`, plus the session-start and take-stock
  nudge text. That is ambiguous in a fork whose upstream is also claude-kit, and wrong after a
  rename. The memory nudge's fallback text names a cache directory `claude-kit`, which a renamed
  plugin's cache is not.
- **A rename touches more than the guide listed:** the pre-commit hook's reserved-name tolerance
  block, `tools/token-profiler.js`'s prefix strip, and the README's STRUCTURE tree, which then
  needs a line on why the directory keeps the old name.
- **A deleted style skill can break a reference the repo cannot see.** An org-provisioned skill
  outside the repo (ASR's `freshdesk-kb-article`) names `sql-style`.

### What the setup guide must change before the next colleague (capability 1)

- **Missing upstream access should be a warning, not a stop.** Nothing before section 1E needs
  it, and a clone of the bundle works as the reference copy until access arrives;
  `remote set-url` then converts it.
- **Make the `claude` CLI an explicit prerequisite,** with the Windows PATH caveat. Also add a
  desktop-app branch, or a note that the plugin commands and the restart need the terminal.
- **Check the DevOps connector by tool-name suffix.** In the desktop app its prefix is a UUID, not
  `mcp__claude_ai_DevOps__`.
- **Uninstall superpowers before starting,** not in Phase 2.
- **Fix a contradiction between 1A and 1B.** 1A says the backlog's uninstall command stays, and
  1B deletes the item that contains it on the rename path.
- **Widen the rename instructions.** A rename also replaces the pre-commit tolerance block, and the
  search must look for bare `claude-kit` in prose, not only the id forms.
- **Say that a same-org fork keeping the defaults has an empty third commit.**
- **Explain GitHub identities:** how to tell which account git is presenting, and how to pin the
  account in URLs.
- **Settle the Windows baseline.** Either make the suite portable first, or have the guide predict
  the failures and order the forker's Windows commit before the others.

## Out of scope

Licensing, contribution legal terms, and repo or marketplace renaming. Whether the upstream kit is
credited publicly, which is their consent question and not a packaging one. Any actual publishing
decision or date.

## Chapters

(none yet - Proposed)
