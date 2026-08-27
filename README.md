# claude-kit

A personal Claude Code marketplace. One private repo that every project picks up: workflow skills (brainstorm -> execute -> finish) with per-section model down-selection, fresh-context review agents, discipline skills (systematic debugging, skill authoring, review response, kaizen self-improvement, a multi-lens design council, and cold judgment calls), C# and T-SQL house-style guides, and a compaction-recovery hook - packaged as the `claude-kit` plugin in the `daren` marketplace.

Forked from Scott Applefeld's claude-kit and personalized: same workflow philosophy (autonomous execution with fresh-context agent reviews, plan docs as the single source of truth), different style content and several policy changes (three-valued commit model with branch discipline, delegate-by-default implementation with capable-by-default subagent models, staged-not-committed subagent work, no formatter hook).

## STRUCTURE

```
claude-kit/                          (repo = the marketplace)
  .claude-plugin/
    marketplace.json                 Marketplace catalog (must live here)
  plugins/
    claude-kit/                      (the plugin)
      .claude-plugin/plugin.json     Plugin manifest (no version field - every
                                     commit counts as a new version)
      skills/
        brainstorming/               Design conversation -> spec in docs/plans/ + commit model
          assets/frame.css           Visual companion frame: styles the static screens a session writes to a project's .kit/visuals/
          references/visual-companion.md  The push loop, on-disk conventions, class catalogue and sweep
        executing-work/              Autonomous section loop: implement, verify, review, Chapter
        finishing-work/              QA, security, docs curation, final review, close-out
        systematic-debugging/        Root-cause discipline before proposing fixes
        responding-to-review/        Adjudicate review findings and direct feedback; no performative agreement
        writing-skills/              Author and improve kit skills (match form to failure, baseline-test wording)
          references/ai-tells.md     The machine-prose tells catalog: named tells with rewrites and licensed exceptions
        kaizen/                      Capture kit friction; reflect into briefs; apply as improvements
        design-council/              Opt-in multi-lens pressure-test for a hard-to-reverse design fork
        cold/                        Neutral evidence-first lens for non-code judgment calls
        csharp-style/                The user's C# style + detailed reference (incl. test style)
        sql-style/                   T-SQL house style (Scott-baseline minus vetoes) + reference
        reconcile-claude-md/         Install/merge/overwrite the kit's recommended global CLAUDE.md into the user's live file
        kit-goal/                    /kit-goal <plan> arms a deterministic project-scoped completion leash
        curating-docs/               docs/ taxonomy: plan archival, backlog pruning, index and cross-references
        branch-hygiene/              Reap merged branches, recover stranded ones; the branch-reaper nudge hands off here
        pr-review/                   Azure DevOps PR review: gather via connector, senior-dev-calibrated findings, gated posting under the user's identity
        kit-adoption-pass/           The inbound pass over the upstream kit: watermarked window, cheapest-first read ladder, standing verdicts in docs/kit-adoptions.md
        cross-project-memory/        The kit-owned tier for facts that span projects: the write-time routing ladder, the CLI as the only writer, advisory decay
      agents/
        adversarial-reviewer.md      Fresh-context spec-compliance + code-quality review
        blind-reviewer.md            Diff-only correctness review, dispatched without the spec or intent story
        blind-reader.md              Reader-experience review of a deliverable document, dispatched as a named persona with no intent story
        prose-reviewer.md            Adversarial prose review: claims against the fact base first, then style, tells and presumed knowledge
        pr-reviewer.md               Precision-calibrated incoming-PR review: finding bar, blocker/suggestion/note, comment drafts
        qa-verifier.md               Build, tests, acceptance criteria with evidence; pinned sonnet
        security-reviewer.md         OWASP + SOC 2 review, any production codebase (deep on C#/T-SQL; covers hooks, shell, config)
        docs-curator.md              Updates docs/, returns Drift Report; pinned opus
        implementer-opus.md          Scoped section implementer, Opus tier (delegate-capable)
        implementer-sonnet.md        Scoped section implementer, Sonnet tier (delegate-mechanical)
        implementer-fable.md         Scoped section implementer, top tier (delegate-fable; unpinned: inherits session model or takes the fable override)
        council-member.md            Read-only design-council lens
        design-facilitator.md        Neutral design-council convergence judge
      hooks/
        hooks.json                   Hook registrations (SessionStart + PreToolUse + Stop)
        session-start.js             Re-injects in-progress plans on startup/resume/compaction; nudges on pending kaizen items (kit repo); offers the CLAUDE.md reconcile when the kit's recommended rules advance; surfaces an armed kit goal; nudges on unarchived Complete plans; nudges when the upstream-kit adoption pass has gone stale (kit repo); emits the cross-project memory tier's generated index and its advisory decay count
        kit-goal.js / kit-goal-lib.js / kit-goal-stop.js The /kit-goal leash: arm/clear/status CLI, shared library, deterministic Stop hook
        docs-write-guard.js / stop-docs-hygiene.js Docs-library guards: non-curator subagent writes into docs/ denied; Stop-time scratch-leak flag (unarchived plans are session-start's nudge, never a turn-end block)
        pr-docs-guard.js / merged-pr-push-guard.js / branch-reaper-nudge.js Branch/PR guards: dirty-docs PR block, merged-branch push block, reap/strand nudge
        accretion-lib.js             Shared level-2 section parser (ships in the payload; tools/accretion.js uses it too)
        take-stock-nudge.js          Kit-repo-only SessionStart nudge: how many prose sections changed since the last docs/take-stock.md entry (ranking lives in tools/accretion.js)
        memory.js / memory-lib.js / memory-index.js The cross-project memory tier: authoring CLI, shared library (the record schema lives in its header), generated index sidecar and the [body revised] marker
      assets/
        CLAUDE.md                    Recommended global rules, shipped in the plugin; reconcile-claude-md folds them into the user's live ~/.claude/CLAUDE.md
                                     (assets/ also exists at skill level, for a file a session copies into a project rather than into the user's config: see brainstorming/assets/)
  .githooks/pre-commit               Validates the plugin payload on commits that touch it; wire with git config core.hooksPath .githooks
  settings/settings.recommended.json acceptEdits + curated allow-list starting point
  test/                              Hook test suite (repo-level, not shipped); the gate command is under MAINTAINER TOOLS
  setup.ps1 / setup.sh               Alias CLAUDE_CONFIG_DIR profiles only: create the canonical ~/.claude/CLAUDE.md and link both profiles at it (default setups just accept the reconcile offer)
  docs/                              Curated docs library: README index, architecture.md, security-model.md, cross-project-memory.md, visual-companion.md, prose-accretion.md, take-stock.md, backlog.md, kit-adoptions.md, plans/ (active), archive/ (finished)
```

The catalog at `.claude-plugin/marketplace.json` points to the plugin with `"source": "./plugins/claude-kit"` - relative paths resolve against the repo root and work because the marketplace is added via git. Additional plugins later: add a folder under `plugins/` and a second entry in the catalog.

## INSTALL (per machine)

1. Clone the repo. It is private, so this and step 3 both need GitHub access already working
   for your account (an SSH key on the account, or `gh auth login`, or a PAT your git
   credential helper serves).
   ```
   git clone git@github.com:daren-porter/claude-kit.git
   ```
   Steps 4 and 5 read two files that ship outside the plugin (`settings/settings.recommended.json`,
   and `setup.sh` on alias-profile machines), so the checkout is a prerequisite rather than a
   convenience. Repo-relative paths below are from the clone root; paths beginning
   `plugins/claude-kit/` are inside the plugin and also reachable from the installed cache.

2. **Uninstall superpowers first.** This kit replaces superpowers' workflow skills; running both creates competing skill triggers (superpowers' session-start routing claims design work before this kit's skills can). In Claude Code: `/plugin uninstall superpowers`, or disable it in settings. This is deliberate - see THE WORKFLOW below for what replaces it.

3. In Claude Code (the marketplace is `daren`, which is what the repo registers; the plugin
   inside it is `claude-kit`):
   ```
   /plugin marketplace add daren-porter/claude-kit
   /plugin install claude-kit@daren
   ```
   Default scope is user, so every project picks it up. If the marketplace was added before a structure fix, refresh it first: `/plugin marketplace update daren` (or remove and re-add).

4. Install the user-level CLAUDE.md. The recommended rules ship inside the plugin (`assets/CLAUDE.md`), so per-machine setup is just: accept the SessionStart offer to reconcile (it fires when the kit's baseline has advanced past your last sync, including the first machine where you have never reconciled), or run the `reconcile-claude-md` skill explicitly. It works on the active config dir's `CLAUDE.md` (`~/.claude/CLAUDE.md` by default, the profile's under `CLAUDE_CONFIG_DIR`). With no live file it installs the recommended verbatim; with one already there it compares against the sync marker and either reports it in sync and stops, or offers merge (keep your customizations) or overwrite. It backs up before every write that could lose content, so an existing file is never overwritten unbacked. Reconcile state lives in two files at `~/.claude`: `.claude-kit-md-version` (the SHA-256 of the recommended you last synced, which the hook compares against) and `.claude-kit-md-base.md` (that recommended's content, the base the next merge diffs against).
   - **If you use alias config dirs, do this before the reconcile above.** The scripts link exactly two profiles, `~/.claude-personal` and `~/.claude-work`, skipping either one that is absent; any other profile directory is not handled. Run `./setup.sh` (or `.\setup.ps1` on Windows) once. It points both profiles' `CLAUDE.md` at the single canonical `~/.claude/CLAUDE.md`, creating that canonical from the shipped asset if it does not exist; they are symlinks, so Claude Code's realpath dedup collapses the directory-walk copy against the config-dir copy and the rules load exactly once. What happens next depends on which case you were in. If the script created the canonical, it also writes the sync marker and you are done, and reconciling the active profile alone here would have left the canonical empty. If a canonical already existed, the script leaves the marker alone and says so, and you then run the reconcile above to fold the kit's rules in. On Windows, symlinks need Developer Mode or an elevated shell; `setup.ps1` falls back to copying and warns when it does, and copies neither dedupe by realpath nor track later rule changes, so re-run it after the rules change. Once setup has run, nothing at session time reads the checkout: it is needed for the two files in steps 1 and 5, and after that only for maintaining the kit.

   The old double-load workaround (removing `~/.claude/CLAUDE.md`) is gone: `~/.claude/CLAUDE.md` is now the canonical file itself, and Claude Code dedupes it by realpath against the directory-walk copy, so it loads once.

5. Merge `settings/settings.recommended.json` (from the clone in step 1) into each config dir's `settings.json` (`~/.claude-personal/settings.json`, `~/.claude-work/settings.json`, or `~/.claude/settings.json`). It sets `acceptEdits` and allow-lists read-only git plus `dotnet build/test/format/list` (which execute or rewrite project code; an accepted dev-machine tradeoff) - no `git add/commit/push` (commits always prompt; pushes always prompt).

Updating: run `/plugin update claude-kit` on each machine. (Publishing the change in the first place is the maintainer half, under PUBLISHING below.) Because `plugin.json` omits `version`, every commit is a new version - no version bumping required. For private-repo background auto-updates, set `GITHUB_TOKEN` in your environment. When a kit update changes the recommended CLAUDE.md, the SessionStart hook offers to reconcile it into your live file (or run the `reconcile-claude-md` skill).

## THE WORKFLOW

Brainstorming produces a spec in `docs/plans/<project>_spec_v1.md` with a recorded commit model: **Review-Only** (changes accumulate uncommitted/staged for review), **Branch-and-PR** (work on a branch, finish with a PR - the default for shared repos), or **Commit-and-Push** (commit and push as sections complete - greenfield/personal repos). Executing-work runs the spec section by section - implement, verify with evidence, adversarial review paired with a blind diff-only review (plus security review on sensitive surfaces, and, where the section's deliverable is a document for a named reader, a pair chosen for prose instead: `blind-reader` per persona and `prose-reviewer`, which replace the code pair when the whole changeset is under `docs/` and sit on top of it when the section ships code as well), update the plan, append a Chapter, apply the commit model. Implementation runs per a per-section execution mode (main-context tokens re-bill every turn, so the orchestrator stays the designer): **main** in the session on whatever model is selected, **delegate-fable** to the implementer-fable agent for sections needing the strongest model that are still briefable, **delegate-capable** to the implementer-opus agent (the delegated default), or **delegate-mechanical** to the implementer-sonnet agent - capable by default, mechanical only for genuinely well-bounded sections, reviewers never downgrading. The main-thread model is never hard-coded, so it tracks whatever you run. Nothing is committed to main/master without explicit permission. Implementer subagents stage their work but never commit; `git diff --staged` is always the review surface for agent output. Finishing-work closes the effort: qa-verifier, security-reviewer, final adversarial-reviewer pass, the document battery over any reader-facing documents the effort shipped, docs-curator with Drift Report, plan closed, changes presented / PR opened / pushed per the model.

Compaction recovery is deterministic: the SessionStart hook fires on startup, resume, and after every compaction, finds in-progress plans, and instructs the session to re-read them - Chapters included - before any work proceeds. Section boundaries are clean recovery points by construction: once a Chapter is written, the plan doc carries the full state, so a fresh session - whenever the user chooses to start one - resumes with nothing lost.

Kaizen keeps the kit improving itself. Concrete friction with the kit (an ambiguous rule, a step that fought the work, a missing capability) is captured cheaply to a home-level inbox (`~/.claude-kaizen`) from any project; a kaizen pass reflects the notes into briefs, and a fresh kit-repo session applies them per writing-skills. It is offered only when the inbox has pending items (finishing-work's close-out, or the SessionStart nudge in the kit repo), so it never prompts on an uneventful session.

`/kit-goal docs/plans/<plan>.md` arms a project-scoped completion leash for a plan run, enforced by a deterministic Stop hook (no LLM evaluator) whose state lives in `.kit/` (gitignored) and so survives crashes, /resume, and fresh windows. The hook allows a stop only when the plan is Complete or archived, or the last message leads with `BLOCKED:`; otherwise it blocks with a reason naming the plan. Clear with `/kit-goal clear`. The executing-work skill's completion contract holds leash or no leash; arming is the user's explicit act.

## MODEL TIERING

The cost profile inverts the naive approach: the expensive model writes specs, reads diffs, and adjudicates, while cheaper models write the bulk of the code. The session model is the mode: a Fable-led session is for design (brainstorming, specs, adjudication, and the finishing passes of a high-stakes effort); an Opus-led session executes approved specs. Fable enters execution only by an explicit per-dispatch model override, at three moments: a **delegate-fable** section (the spec's mode assignment is the standing authorization, surfaced in the spec's `Fable Spend:` header), the escalation ladder's top rung, after a capable-level section fails review twice (one fable dispatch, then the stall is raised to the user), and finishing-work's security and final adversarial reviews. Quality is protected by spec precision, fresh-context strong-model review, and the finishing pass, not by the implementer's model.

The spend wall governs how far Fable reaches: its plan-included allotment is the budget, crossing into metered Fable takes the user's explicit authorization recorded in the spec's `Fable Spend:` header, and `Fable Spend: none (cost hold)` holds an effort at the session model. Opus and below are plan-covered, with no wall. `qa-verifier` pins to sonnet and `docs-curator` to opus so neither rides a Fable-led session up into the top tier; reviewers stay unpinned deliberately, and the adversarial and security reviews pick up the finishing-pass override. The document battery does not: `blind-reader` and `prose-reviewer` are named out of it in `finishing-work`, so a document deliverable is reviewed at the session model unless you authorize otherwise. An Opus advisor on execution sessions is a standing experiment, its value mainly the inheritance below-opus dispatched subagents get from it, treated as absent until consultations are observed succeeding.

## CONVENTIONS

- Specs and plans: `docs/plans/` in each project, named `<project>_<content-type>_v1.md`, versions increment, never overwrite.
- docs/ follows the curating-docs taxonomy: plans/ holds active work, archive/ holds finished plans and dated backlog snapshots, backlog.md stays pruned-live, README.md is the index.
- Chapters are appended to the plan doc, not kept in a separate file. The plan doc is the single source of truth for intent and state.
- Durable learnings go to memory, not into plan docs: a repo-specific fact to Claude Code's project auto memory (curate with `/memory`), a fact about a machine or a hosted platform or a vendor API to the kit-owned cross-project tier, and a recurring working preference to the global rules as doctrine.
- Project CLAUDE.md files carry only project-specific facts (build commands, architecture pointers); global rules live in the kit's recommended `assets/CLAUDE.md`, reconciled into the live `~/.claude/CLAUDE.md`.
- Style precedence: a repo's stated rules (CLAUDE.md, style docs, `.editorconfig`) win; otherwise the style skills govern. C# treats a legacy sibling as last resort, not authority; SQL keeps sibling-matching in shared repos, where the established team SQL style is the target.
- Each project with a non-obvious access architecture documents it and its accepted risks in `docs/security-model.md`. The security-reviewer agent reads it first, verifies the code upholds it, and re-checks accepted-risk preconditions instead of re-flagging them.
- Wire the repo's git hooks once per clone: `git config core.hooksPath .githooks`.

## NOTES AND KNOWN TRADEOFFS

- Plugin skills are namespaced: explicit invocation is `/claude-kit:brainstorming`. Automatic (model-invoked) triggering is unaffected.
- Plugins are copied to a cache at install, under the active config directory (`~/.claude/plugins/cache` by default, `$CLAUDE_CONFIG_DIR/plugins/cache` under an alias profile, so a machine running profiles has one cache per profile); the plugin cannot reference files outside `plugins/claude-kit/`. The recommended CLAUDE.md therefore lives *inside* the plugin (`assets/CLAUDE.md`), so the hook and skill can read it from the cache. `settings/` stays outside the plugin - it is a machine-setup asset, not a plugin component.
- Plugin-shipped agents cannot declare their own hooks, MCP servers, or permissionMode (Claude Code security restriction). None of these agents need them.
- There is deliberately no format-on-edit hook: shared repos own their formatting, and a formatter rewriting files after every edit causes edit-mismatch churn.
- `settings.recommended.json` reflects the settings schema as of June 2026; verify key names against current docs if something is ignored: https://code.claude.com/docs/en/settings

## PUBLISHING (maintainer)

Validate before pushing: `claude plugin validate` catches structure and schema mistakes.
`.githooks/pre-commit` runs the payload check below on any commit touching `plugins/claude-kit/`,
but only in a clone where `git config core.hooksPath .githooks` has been wired, and it skips
itself with a note when the `claude` CLI is not on PATH.

```
claude plugin validate .
claude plugin validate ./plugins/claude-kit
```

Then push to GitHub (`daren-porter/claude-kit`, private). Consumers pick the change up with
`/plugin update claude-kit`.

## MAINTAINER TOOLS

`tools/standing-context-audit.js` is a dependency-free Node script for maintainers: it reports the kit's standing (per-session, task-independent) context cost - the kit-owned slice (skill and agent descriptions, shipped CLAUDE.md) measured precisely, grounded against the real standing-token total from a session transcript, with size-outlier descriptions flagged as trim candidates. Run it during a token-efficiency pass or kaizen pass, when deciding whether the kit's standing footprint is worth trimming:

```
node tools/standing-context-audit.js
```

It also accepts an optional transcript path as its first argument. It lives outside the distributed plugin, adds zero standing footprint, and is not something kit end-users need to run.

`tools/accretion.js` is the other one, and it is the tool with a live trigger: it measures lines, commits and span for every level-2 section of the plugin's prose payload (skills, references, agents and the recommended CLAUDE.md; `docs/` and this file are outside its globs) and prints the top 15 by lines x commits, measuring HEAD rather than the working tree. It edits nothing and recommends nothing. `hooks/take-stock-nudge.js` points a kaizen pass at it whenever the kit's prose has changed since the last `docs/take-stock.md` entry, and `docs/prose-accretion.md` covers the loop.

```
node tools/accretion.js
```

Its section parser is shared with the hook and ships in the payload at `hooks/accretion-lib.js`, so the test gate below was widened to cover `tools/*.test.js` too.

`tools/token-profiler.js` is its companion: it attributes estimated USD cost across a session's full fan-out (the main thread plus every subagent it spawned) to the kit's skills and processes, aggregated across the project's sessions, so you can see which parts of the workflow cost the most and where the lever is (session length, subagent fan-out, or a skill's own output). Run it during the same token-efficiency or kaizen pass:

```
node tools/token-profiler.js
```

Add `--detail` for a per-session and per-subagent breakdown, or pass a session id to profile a single session. Like the audit, it reads transcripts only, edits nothing, and adds zero standing footprint.

The hook test suite lives in `test/` (repo-level, excluded from the plugin payload) and covers the kit-goal leash, the docs guards, and the branch guards on one gate. `session-start.js` is partly covered: its adoption-staleness nudge, the cross-project memory block, and the decay nudge are pinned, and plan recovery is exercised alongside them, leaving four of its eight blocks verified manually (pinning the rest is a backlog item). Gate: `node --test test/*.test.js tools/*.test.js` from the repo root, widened 2026-08-16 because `hooks/accretion-lib.js` ships in the payload and its only coverage is `tools/accretion.test.js`, so the narrower gate left a payload file untested by the thing called the gate. Run it after any change to `plugins/claude-kit/hooks/`.

END RESULT: clone, install, and every project on every machine has the same rules, the same workflow, the same reviewers, and the same recovery behavior - maintained in one place.
