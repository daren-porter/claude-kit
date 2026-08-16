# Runtime Architecture

This document covers what the kit does while a session runs: which processes fire, in what order, what state they read and write, and where record and repo content crosses into model context. The repo's static shape (directory tree, install, workflow doctrine, model tiering) is in the root `README.md` and is not repeated here. The docs library's own taxonomy is in `docs/README.md`.

## Components at runtime

The kit ships as one plugin, `plugins/claude-kit/`, installed from the `daren` marketplace. At runtime it presents four kinds of thing, and only one of them is code the kit controls end to end.

Hooks are short-lived Node processes the harness spawns on an event, registered in `hooks/hooks.json`. They are the kit's only deterministic behavior: no model reads them, no model can decline them. Skills are markdown loaded on description match, so their influence is advisory and depends on the model reading them. Agents are markdown definitions dispatched as subagents with a declared tool grant.

Assets are files the kit ships to be installed somewhere other than the plugin, and there are two of them, at two directory levels and on two different delivery models. `assets/CLAUDE.md` sits at the plugin root and is folded into the user's live `~/.claude/CLAUDE.md` by `reconcile-claude-md`, which offers first and backs up before every write. `skills/brainstorming/assets/frame.css` is the kit's first skill-level asset: a session copies it verbatim into the working tree of whatever project is being brainstormed, at `.kit/visuals/frame.css`, and only when it is absent, so a tweak made there survives later sessions. Nothing merges it and no hook touches it. The reference instructs the session to resolve the source from the skill's own base directory rather than the cwd, since the copy runs from wherever the brainstormed project is; that is the same resolution precedent `reconcile-claude-md` states for the plugin-root asset. `visual-companion.md` covers it.

Hooks and agents load from the installed plugin cache (`~/.claude/plugins/cache`), not from this checkout. An edit in the repo is inert until `/plugin update claude-kit`, which is why no hook can verify its own change in the session that wrote it.

## Hook execution model

Three separate hooks fire on SessionStart, and every block count below belongs to one of them. `session-start.js` emits up to eight blocks inside one JSON object; `branch-reaper-nudge.js` and `take-stock-nudge.js` are their own processes and emit at most one block each. A session start can therefore carry up to ten blocks from three processes, and "the eight blocks" always means `session-start.js`'s, never the session-start total.

`session-start.js` runs on `startup`, `resume`, and `compact`, and is the widest-reach code in the kit: everything it writes lands in trusted context at the top of every session. It emits one JSON object carrying `additionalContext`, built from up to eight blocks joined by blank lines, in this order:

1. In-progress plan recovery, which instructs the session to read the plan docs including Chapters before any work.
2. Plans marked `Status: Complete` still sitting unarchived in `docs/plans/`.
3. Pending kaizen inbox items (kit repo only).
4. The CLAUDE.md reconcile offer, when the shipped asset has advanced past the last synced version.
5. An armed kit goal.
6. Adoption-pass staleness (kit repo only).
7. The cross-project memory decay count.
8. The cross-project memory generated index.

Order is load-bearing in two places. Plan recovery is first because it is the block that must survive everything else. The memory index is last and stands alone rather than joining the nudge stack, because a reference list and a list of asks compete for different attention.

Blocks 2 through 8 are additive by contract: each is computed inside its own `try`, `main()` is wrapped again, and the process is then left to end on its own with status 0 (no hook in the payload calls `process.exit`; the guards set `process.exitCode = 2` instead, so a pending stderr write still flushes). A failure anywhere in the additive set can cost that block and nothing else. An early return keeps the hook silent when no block has anything to say.

File doors in that hook are at three different standards, which matters because a bounded read bounds bytes and not time: `openSync` on a FIFO blocks until a writer appears, and a blocked hook holds up every session start. The memory readers use the atomic form (`O_RDONLY | O_NONBLOCK`, then `fstatSync(fd).isFile()`), the adoption reader stats before opening, and four pre-existing readers (the kaizen notes, the unarchived-Complete scan, the plan scan, and the CLAUDE.md sync offer) check nothing. Closing that gap is an open backlog item; `hooks/memory-lib.js`'s `readCapped` is the form to copy.

`take-stock-nudge.js` also runs on SessionStart (`startup|resume` only), gated to the kit repo by one `existsSync` of the plugin manifest before any git call, so everywhere else it is a stat and an exit. It reports one number, how many of the kit's prose sections hold lines that differ between the sha in the first entry of `docs/take-stock.md` and HEAD, and stays silent when none do. It names no section and ranks nothing: the ranking is `tools/accretion.js`, a maintainer tool outside the payload, and the block points at it rather than paying its cost at a session start. Recording a take-stock resets the marker, so the nudge silences itself. Three further states speak rather than fall silent (an unreadable marker, a marker naming a commit this checkout does not hold, and a measurement that failed part way), because silence there would be byte-identical to "nothing changed". `prose-accretion.md` covers the loop.

`branch-reaper-nudge.js` also runs on SessionStart (`startup|resume` only) and is the one hook that touches the network: a bounded `git fetch --prune` with auth prompts disabled, skipped when the repo was fetched within 10 minutes, failing open on any error. That rests on the workspace-is-trusted premise.

Three PreToolUse guards deny rather than advise, and are the only kit code that can block a tool call: `docs-write-guard.js` on `Write|Edit|MultiEdit|Bash|PowerShell` (a non-curator subagent writing into `docs/`), and `pr-docs-guard.js` and `merged-pr-push-guard.js` on `Bash|PowerShell` (opening a PR with `docs/` dirty, pushing to a merged branch). Two Stop hooks close a turn: `stop-docs-hygiene.js` flags scratch leaked into `docs/`, and `kit-goal-stop.js` holds an armed plan run to completion with no LLM evaluator in the path.

## State, and where it lives

Only one of the kit's five state locations is inside a repo.

| State | Location | Written by |
|---|---|---|
| Plans, Chapters, docs library | `docs/` in each project | Sessions, via the workflow skills |
| Kit working state | `.kit/` per repo | `kit-goal.js` writes `goal-state.json` (read by `kit-goal-stop.js`); a brainstorming session writes `visuals/` |
| Cross-project memory tier | `~/.claude-kit-memory/` | `hooks/memory.js` only |
| Kaizen inbox | `~/.claude-kaizen/notes.md` | Any session, one line at a time |
| CLAUDE.md reconcile state | `~/.claude/.claude-kit-md-version` and `.claude-kit-md-base.md` | `reconcile-claude-md` |

`.kit/` is the kit's designated per-repo scratch zone rather than the leash's private file. `docs-write-guard`'s deny text and `stop-docs-hygiene`'s flag text both route working artifacts there, `kit-goal.js` writes `goal-state.json`, and the visual companion writes `visuals/`, which is the first content in that tree authored by a session rather than by a hook. The ignore is a convention each project acquires, not a property of the location, and the two writers acquire it differently. `kit-goal` checks that the project's `.gitignore` covers `.kit/` and adds the line if not, which leaves two gaps: a project with no `.gitignore`, and a project whose ignores name a narrower path that a substring check passes wrongly. The visual companion resolves both, because a screen can hold project-confidential content where goal state cannot: it confirms with `git check-ignore -q` on the actual path, which honors global, nested and narrow ignores, and when that fails it writes `.kit/.gitignore` containing `*`, which ignores itself, needs no git repo, and touches no file the project already tracks. That idiom is the one worth spreading to `kit-goal`; see `backlog.md`.

Claude Code's native per-project auto-memory is a sixth store the kit reads about but does not own and does not touch. It lives under the active config directory, which on this machine means `~/.claude-work/projects/<encoded-repo-path>/memory/`. The cross-project tier sits beside it, which is why the routing question (which store does this fact belong in) has a documented answer rather than a convention.

Home-rooted state is deliberate for the memory tier and for kaizen: both are cross-project by nature, so a repo-rooted store would strand their contents in whichever project learned them. `~/.claude-kit-memory/` is also outside `~/.claude` and `~/.claude-work` on purpose, since those hold credentials and history, which would force any future sync behind an allowlist.

## Data flow

Two directions, and they meet only through files on disk.

Reading happens at session start. `session-start.js` scans the cwd's `docs/plans/`, the kit-repo markers, home-rooted state, and the memory store, reduces everything it found to bounded text, and hands one context block to the harness. The two nudge hooks read git instead of files, each under its own timeouts: `branch-reaper-nudge.js` fetches and inspects branch state, and `take-stock-nudge.js` reads one sha out of `docs/take-stock.md` and then asks git which corpus sections differ between that sha and HEAD. No hook holds a process open past its event, so there is no daemon, no cache in memory, and no ordering dependency between hooks beyond the harness's own.

Writing happens during a turn, from a session following a skill. Plans and Chapters are written by the model with the Write and Edit tools. The kit goal is armed by `kit-goal.js`. Memory records go through `memory.js` and nothing else, which is what makes the field validation, the generated stamps, and the append-only apply journal hold. The kaizen inbox takes a plain appended line.

The one derived artifact is the memory tier's `.index.json`, refreshed best-effort by the CLI after a successful `add` or `stamp`. The reading hook deliberately does not refresh it: a read-shaped hook that wrote would create the store root as a side effect of starting a session, and syncing after an emission would clear a `[body revised]` marker before the session that could act on it ever saw it.

## Trust boundaries

Two boundaries matter, and they are asymmetric.

Anything a hook writes into `additionalContext` is trusted context: the model reads it as part of the system's own voice at the top of the session. So every value from disk that reaches that text is bounded and neutralized first, and the framing says out loud which parts are data rather than instructions. Filenames are stripped and truncated. Memory lines are reduced to printable ASCII with whitespace runs collapsed (which is what prevents forging a blank line and with it a block boundary), capped per line and per block, with truncation announced. Counts are coerced through one helper so a NaN can never be interpolated into a sentence that claims it. Where a block names records, it names them from validated filenames rather than asking the model to grep emitted text for a token, because record content can carry that token.

The second boundary is the tool grant on subagents. It is declarative except where a hook makes it mechanical: `docs-write-guard` is the one enforced case, denying a non-curator subagent any write into `docs/`. Seven agents that are read-only by intent still grant Bash, which is a known gap tracked in `kit-adoptions.md`.

The kit's trust architecture is written down in `docs/security-model.md`, which the generalized `security-reviewer` agent reads first. It carries the two bounding premises, the trusted-channel table, the project write surfaces the kit creates, the one operator-initiated egress path, and what the kit does not defend against.

## External integrations

The kit reaches four things outside itself. The Claude Code harness, through the hook payload on stdin and JSON on stdout. Git, through `git` invocations in the branch and PR guards and the reaper nudge. Azure DevOps, through the MCP connector the `pr-review` skill drives, with `az` CLI calls as the documented fallback; nothing in `hooks/` talks to Azure DevOps. And the GitHub-hosted marketplace repo, which is how the plugin updates.

No hook depends on a network call succeeding. `branch-reaper-nudge.js`'s bounded fetch is the only one, and it fails open with its skip window and its short timeout. `pr-docs-guard.js` and `merged-pr-push-guard.js` read local git state only (`git status --porcelain`, `git rev-parse`, `git symbolic-ref`, `git remote get-url`), and both fail open on any error they cannot interpret. Reading remote-tracking refs locally is exactly why the reaper's fetch exists: without it those refs go stale and the merged-branch check answers from old state.

## Feature documents

- `cross-project-memory.md` - the kit-owned tier for facts that span projects: store layout, the two session-start blocks, the generated line and its `[body revised]` marker, advisory decay, failure modes, and how to operate it.
- `prose-accretion.md` - the take-stock loop over the kit's own prose: the four-glob corpus and why it is defined twice, `tools/accretion.js`'s HEAD-snapshot method and its ranking, the shared section parser, the nudge hook's five states and its structural blind spots, the record's machine contract, and what the first compression proved and failed to prove.
- `visual-companion.md` - `brainstorming`'s browser-viewed screens: the three shipped files, the `.kit/visuals/` footprint and its sweep, the superpowers port with its licence obligation and every change from the source, the failure modes, and why no browser-versus-terminal rule ships. No code runs in this feature, so it appears nowhere in the hook execution model above.
