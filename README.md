# claude-kit

Daren Porter's personal Claude Code marketplace. One private repo that every project picks up: workflow skills (brainstorm → execute → finish) with per-section model down-selection, fresh-context review agents, discipline skills (systematic debugging, skill authoring, review response, kaizen self-improvement, a multi-lens design council, and cold judgment calls), C# and T-SQL house-style guides, and a compaction-recovery hook - packaged as the `claude-kit` plugin in the `daren` marketplace.

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
        brainstorming/               Design conversation → spec in docs/plans/ + commit model
        executing-work/              Autonomous section loop: implement, verify, review, Chapter
        finishing-work/              QA, security, docs curation, final review, close-out
        systematic-debugging/        Root-cause discipline before proposing fixes
        responding-to-review/        Adjudicate review findings and direct feedback; no performative agreement
        writing-skills/              Author and improve kit skills (match form to failure, baseline-test wording)
        kaizen/                      Capture kit friction; reflect into briefs; apply as improvements
        design-council/              Opt-in multi-lens pressure-test for a hard-to-reverse design fork
        cold/                        Neutral evidence-first lens for non-code judgment calls
        csharp-style/                Daren's C# style + detailed reference (incl. test style)
        sql-style/                   T-SQL house style (Scott-baseline minus vetoes) + reference
        reconcile-claude-md/         Install/merge/overwrite the kit's recommended global CLAUDE.md into the user's live file
      agents/
        adversarial-reviewer.md      Fresh-context spec-compliance + code-quality review
        qa-verifier.md               Build, tests, acceptance criteria with evidence
        security-reviewer.md         OWASP + SOC 2 review tuned to the procedure-only model
        docs-curator.md              Updates docs/, returns Drift Report
        implementer-opus.md          Scoped section implementer, Opus tier (delegate-capable)
        implementer-sonnet.md        Scoped section implementer, Sonnet tier (delegate-mechanical)
        council-member.md            Read-only design-council lens
        design-facilitator.md        Neutral design-council convergence judge
      hooks/
        hooks.json                   Hook registrations (SessionStart only)
        session-start.js             Re-injects in-progress plans on startup/resume/compaction; nudges on pending kaizen items (kit repo); offers the CLAUDE.md reconcile when the kit's recommended rules advance
      assets/
        CLAUDE.md                    Recommended global rules, shipped in the plugin; reconcile-claude-md folds them into the user's live ~/.claude/CLAUDE.md
  home/CLAUDE.md                     Legacy user-level source, superseded by assets/CLAUDE.md; removed once the live config is migrated
  settings/settings.recommended.json acceptEdits + curated allow-list starting point
  setup.ps1 / setup.sh               Optional: point alias CLAUDE_CONFIG_DIR profiles at one canonical ~/.claude/CLAUDE.md (most users just accept the reconcile offer)
  docs/plans/                        Plan docs for work on this repo itself
```

The catalog at `.claude-plugin/marketplace.json` points to the plugin with `"source": "./plugins/claude-kit"` - relative paths resolve against the repo root and work because the marketplace is added via git. Additional plugins later: add a folder under `plugins/` and a second entry in the catalog.

## INSTALL (per machine)

1. Validate before pushing (catches structure/schema mistakes):
   ```
   claude plugin validate .
   claude plugin validate ./plugins/claude-kit
   ```

2. Push this repo to GitHub (`daren-porter/claude-kit`, private).

3. **Uninstall superpowers first.** This kit replaces superpowers' workflow skills; running both creates competing skill triggers (superpowers' session-start routing claims design work before this kit's skills can). In Claude Code: `/plugin uninstall superpowers`, or disable it in settings. This is deliberate - see THE WORKFLOW below for what replaces it.

4. In Claude Code:
   ```
   /plugin marketplace add daren-porter/claude-kit
   /plugin install claude-kit@daren
   ```
   Default scope is user, so every project picks it up. If the marketplace was added before a structure fix, refresh it first: `/plugin marketplace update daren` (or remove and re-add).

5. Install the user-level CLAUDE.md. The recommended rules ship inside the plugin (`assets/CLAUDE.md`), so per-machine setup is just: accept the SessionStart offer to reconcile (it fires when the kit's baseline has advanced past your last sync), or run the `reconcile-claude-md` skill explicitly. On first run it installs the recommended verbatim to `~/.claude/CLAUDE.md`; later it offers merge (keep your customizations) or overwrite, always backing up first.
   - Only if you use alias config dirs (`CLAUDE_CONFIG_DIR` profiles like `~/.claude-work`, `~/.claude-personal`): run `./setup.sh` (or `.\setup.ps1` on Windows) once to symlink each profile's `CLAUDE.md` to the single canonical `~/.claude/CLAUDE.md`. Claude Code dedupes the directory-walk copy against the config-dir copy by realpath, so the rules load exactly once. The repo is only the author's edit source; nothing at runtime depends on the checkout.

   The old double-load workaround (removing `~/.claude/CLAUDE.md`) is gone: `~/.claude/CLAUDE.md` is now the canonical file itself, and Claude Code dedupes it by realpath against the directory-walk copy, so it loads once.

6. Merge `settings/settings.recommended.json` into each config dir's `settings.json` (`~/.claude-personal/settings.json`, `~/.claude-work/settings.json`, or `~/.claude/settings.json`). It sets `acceptEdits` and allow-lists read-only git plus `dotnet build/test/format/list` (which execute or rewrite project code; an accepted dev-machine tradeoff) - no `git add/commit/push` (commits always prompt; pushes always prompt).

Updating: commit and push here, then `/plugin update claude-kit` on each machine. Because `plugin.json` omits `version`, every commit is a new version - no version bumping required. For private-repo background auto-updates, set `GITHUB_TOKEN` in your environment. When a kit update changes the recommended CLAUDE.md, the SessionStart hook offers to reconcile it into your live file (or run the `reconcile-claude-md` skill).

## THE WORKFLOW

Brainstorming produces a spec in `docs/plans/<project>_spec_v1.md` with a recorded commit model: **Review-Only** (changes accumulate uncommitted/staged for review), **Branch-and-PR** (work on a branch, finish with a PR - the default for shared repos), or **Commit-and-Push** (commit and push as sections complete - greenfield/personal repos). Executing-work runs the spec section by section - implement, verify with evidence, adversarial review (plus security review on sensitive surfaces), update the plan, append a Chapter, apply the commit model. Implementation runs per a per-section execution mode (main-context tokens re-bill every turn, so the orchestrator stays the designer): **main** in the session on whatever model is selected, **delegate-capable** to the implementer-opus agent, or **delegate-mechanical** to the implementer-sonnet agent - capable by default, mechanical only for genuinely well-bounded sections, reviewers never downgrading. The main-thread model is never hard-coded, so it tracks whatever you run. Nothing is committed to main/master without explicit permission. Implementer subagents stage their work but never commit; `git diff --staged` is always the review surface for agent output. Finishing-work closes the effort: qa-verifier, security-reviewer, final adversarial-reviewer pass, docs-curator with Drift Report, plan closed, changes presented / PR opened / pushed per the model.

Compaction recovery is deterministic: the SessionStart hook fires on startup, resume, and after every compaction, finds in-progress plans, and instructs the session to re-read them - Chapters included - before any work proceeds. Section boundaries are clean recovery points by construction: once a Chapter is written, the plan doc carries the full state, so a fresh session - whenever Daren chooses to start one - resumes with nothing lost.

Kaizen keeps the kit improving itself. Concrete friction with the kit (an ambiguous rule, a step that fought the work, a missing capability) is captured cheaply to a home-level inbox (`~/.claude-kaizen`) from any project; a kaizen pass reflects the notes into briefs, and a fresh kit-repo session applies them per writing-skills. It is offered only when the inbox has pending items (finishing-work's close-out, or the SessionStart nudge in the kit repo), so it never prompts on an uneventful session.

## CONVENTIONS

- Specs and plans: `docs/plans/` in each project, named `<project>_<content-type>_v1.md`, versions increment, never overwrite.
- Chapters are appended to the plan doc, not kept in a separate file. The plan doc is the single source of truth for intent and state.
- Durable learnings go to Claude Code auto memory (curate with `/memory`), not into plan docs or CLAUDE.md.
- Project CLAUDE.md files carry only project-specific facts (build commands, architecture pointers); global rules live in the kit's recommended `assets/CLAUDE.md`, reconciled into the live `~/.claude/CLAUDE.md`.
- Style precedence: a repo's stated rules (CLAUDE.md, style docs, `.editorconfig`) win; otherwise the style skills govern. C# treats a legacy sibling as last resort, not authority; SQL keeps sibling-matching in shared repos, where the established team SQL style is the target.
- Each project with a non-obvious access architecture documents it and its accepted risks in `docs/security-model.md`. The security-reviewer agent reads it first, verifies the code upholds it, and re-checks accepted-risk preconditions instead of re-flagging them.

## NOTES AND KNOWN TRADEOFFS

- Plugin skills are namespaced: explicit invocation is `/claude-kit:brainstorming`. Automatic (model-invoked) triggering is unaffected.
- Plugins are copied to a cache at install (`~/.claude/plugins/cache`); the plugin cannot reference files outside `plugins/claude-kit/`. The recommended CLAUDE.md therefore lives *inside* the plugin (`assets/CLAUDE.md`), so the hook and skill can read it from the cache. `settings/` stays outside the plugin - it is a machine-setup asset, not a plugin component.
- Plugin-shipped agents cannot declare their own hooks, MCP servers, or permissionMode (Claude Code security restriction). None of these agents need them.
- There is deliberately no format-on-edit hook: shared repos own their formatting, and a formatter rewriting files after every edit causes edit-mismatch churn.
- `settings.recommended.json` reflects the settings schema as of June 2026; verify key names against current docs if something is ignored: https://code.claude.com/docs/en/settings

END RESULT: clone, install, and every project on every machine has the same rules, the same workflow, the same reviewers, and the same recovery behavior - maintained in one place.
