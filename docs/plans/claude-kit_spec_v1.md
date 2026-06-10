# Daren's claude-kit

Status: In Progress
Commit Model: Review-Only
Created: 2026-06-10

## Goal

A personal Claude Code plugin marketplace for Daren (daren@asr-solutions.com): one repo, installed at user scope on every machine, providing the brainstorm/execute/finish workflow skills, four fresh-context review agents, C# and T-SQL style skills derived from Daren's actual code, a systematic-debugging skill, the compaction-recovery hook, and versioned machine-setup assets (global CLAUDE.md, recommended settings). When installed, it replaces the superpowers plugin as the workflow layer on Daren's machines. gstack is unaffected.

## Approach

Fork-and-personalize Scott Applefeld's claude-kit (this repo). The repo skeleton, plugin structure, recovery hook, and the three-skill workflow shape carry over; identity, style content, security invariants, and several workflow policies are rebuilt for Daren. Key decisions and reasoning:

1. **Full replacement, not complement.** Daren chose the autonomous-with-agent-reviews working style. Running this kit alongside superpowers would create competing skill triggers (superpowers' session-start routing aggressively claims design work), so superpowers is uninstalled at install time. This is a documented install step, never done silently.

2. **Specs stay at acceptance-criteria altitude.** Plans record goal, approach, sections of work, and verifiable acceptance criteria. They do not contain pre-written code (superpowers' code-complete plans go stale and front-load work better done in contact with the code).

3. **Dispatch-time elaboration for delegated work.** The "zero-context engineer" rigor superpowers puts into plans moves to subagent dispatch prompts, written at dispatch time from the actual current code: exact files, signatures, conventions, definition of done, what not to touch. Model tiering applies: mechanical well-bounded task gets a cheap model with exhaustive instructions; integration or judgment work gets a capable model with goals and constraints. BLOCKED escalation path: more context, then a better model, then a smaller task, then the human.

4. **Main-session implementation by default,** with three delegation triggers: the work is mechanical and self-contained, the work is parallelizable across non-overlapping files, or main context is getting heavy and the task does not need accumulated session state.

5. **Chapters as supervised state, section boundaries as reset points.** Chapters and the SessionStart recovery hook make context loss survivable, not lossless. At a section boundary with context usage high (roughly 50%+), Claude suggests closing the Chapter and starting a fresh session. This is a suggestion, not a prohibition: Daren may prefer auto-compaction to keep partial context, and that is acceptable. Mid-section, prefer finishing the section before any reset.

6. **Three-valued commit model,** recorded in each spec header: Review-Only, Branch-and-PR, or Commit-and-Push. Branch-and-PR is the default for shared repos. Nothing is committed to main/master without explicit permission (Review-Only work may sit uncommitted on any branch, since nothing is committed); use worktrees when isolation is needed. Implementer subagents never commit: they leave work staged, so `git diff --staged` is always the clean review surface for agent work. Commits happen in the main session, after review, per the commit model.

7. **Style skills derived from real code, with a shared-vs-personal distinction.** In shared repos, the agreed repo style wins ("find a sibling and mimic it"); Daren's personal style governs his own and greenfield repos. Rules are extracted from a personal repo and designated files in a shared repo (Open Questions 1 and 2). Conventions are tagged personal vs team; contradictions in the source code are flagged for Daren to adjudicate, never resolved silently.

8. **Evidence before completion claims,** mid-effort and at the end. The executing-work verify step requires command output or direct observation before a section is marked done; the qa-verifier agent enforces the same at effort end and may return UNVERIFIABLE rather than guess.

9. **No format hook.** Daren does not use CSharpier and shared repos own their formatting. The format-on-edit hook and its settings entry are dropped entirely.

## Sections of Work

### 1. Repo skeleton and identity

New repo with this layout: `.claude-plugin/marketplace.json` (marketplace catalog), `plugins/claude-kit/` (the plugin: `.claude-plugin/plugin.json`, `skills/`, `agents/`, `hooks/`), `home/CLAUDE.md`, `settings/settings.recommended.json`, `setup.sh`, `setup.ps1`, `README.md`. Owner/author is Daren (daren@asr-solutions.com) throughout; marketplace name per Open Question 3. `plugin.json` omits the version field so every commit is installable. README rewritten for this kit: structure, install steps (including the superpowers uninstall step), conventions, known tradeoffs.

Acceptance criteria:
- `claude plugin validate .` and `claude plugin validate ./plugins/claude-kit` both pass.
- No Scott identity in manifests, authorship fields, or as the addressee of any skill/agent (no "applefeld" marketplace, no scott@applefeld.com). Provenance attribution in the README and the sql-style "Scott-baseline" naming are allowed and intended.
- README documents the superpowers uninstall as an explicit install step.

### 2. Workflow skills

`brainstorming`, `executing-work`, and `finishing-work` adapted from Scott's versions. Conventions kept: specs in `docs/plans/<project>_spec_v1.md`, versions increment and never overwrite, Chapters appended to the plan doc as the single source of truth, finishing-work mandatory before declaring an effort done. Changes:

- All personal references point to Daren; `scott-writing-style` references removed (docs-curator and prose guidance follow the global CLAUDE.md prose rules instead).
- Commit model is three-valued (Review-Only, Branch-and-PR, Commit-and-Push) in the spec template, skill prose, and finishing-work close-out. Finishing-work absorbs branch mechanics for Branch-and-PR: verify tests, push branch, open PR; merge/keep/discard decisions are presented to Daren, never assumed.
- executing-work adds: branch check before any work (never main/master without explicit permission; worktree when isolation is needed); dispatch-time elaboration and model tiering for delegated tasks (decision 3); the three delegation triggers (decision 4); subagents stage, never commit (decision 6); evidence requirement in the verify step (decision 8); section-boundary reset suggestion with the ~50% heuristic, phrased as a suggestion (decision 5).

Acceptance criteria:
- A dry-read of each skill by a fresh session produces the intended behavior description without contradiction (no reference to removed components, no two rules in conflict).
- The spec template in brainstorming shows all three commit models and the Chapters section.
- executing-work encodes the delegation triggers, dispatch-prompt requirements, staging rule, and reset suggestion, matching decisions 3, 4, 5, 6, and 8 of this spec's Approach.

### 3. Debugging skill

A lean `systematic-debugging` skill ported in spirit from superpowers: reproduce first, isolate root cause before proposing fixes, no fix-by-guess, verify the fix against the original repro. Sized like the kit's other skills (one SKILL.md, no reference file), triggered on bugs, test failures, and unexpected behavior.

Acceptance criteria:
- Skill description triggers on debugging language without naming superpowers.
- Process covers: reproduce, isolate, root-cause, fix, verify-against-repro, and when to stop and report instead of guessing.

### 4. Review agents

All four agents adapted:
- `adversarial-reviewer`: kept structurally (spec compliance pass first, then quality; severity-ranked findings; verdict line). Style references point at this kit's csharp-style and sql-style skills.
- `qa-verifier`: kept structurally (build, full tests, every acceptance criterion with evidence; PASS/FAIL/UNVERIFIABLE; never fixes). Build commands remain dotnet-based.
- `security-reviewer`: OWASP/SOC 2 skeleton and the `docs/security-model.md` convention kept. Daren's shared repo (EleosCore) is the same TMWSuite/ELEOS environment Scott's agent was written for (ELEOS schema, usp_ procedures, TMWSuite/LoadMaster/TL2000 deployment scripts under ASR.Eleos.Database*), so the TMWSuite/ELEOS architecture invariants are kept, verified against the actual EleosCore database scripts rather than carried on faith.
- `docs-curator`: kept (docs/-only writes, Drift Report adjudicated by Daren, never reconciles silently); voice-skill dependency replaced with the global prose rules (direct, no em dashes, no hype).

Acceptance criteria:
- No agent references scott-writing-style.
- security-reviewer's invariants section matches the access architecture actually verified in EleosCore's database scripts.
- Each agent retains its read-only/write-scope constraints from the originals.

### 5. Style skills

Both skills follow Scott's format (short SKILL.md: philosophy, exemplar, antipatterns, completion checklist; plus a detailed reference file) and state the precedence rule explicitly: in shared repos the established repo style wins (EleosCore reads as Scott-style; match siblings there); Daren's style governs his own and greenfield repos.

**csharp-style** is built from analyzed sources and conversation adjudications, not from Scott's rules. Sources: okmind (personal, AI-assisted; known AI-isms excluded), and in EleosCore: ConcurrentCache.cs (excluding most IDictionary interface implementations and the throwing void Add overload, written by others), GeotabHelper.cs (excluding RandomString), ActionRequestBackgroundService.cs. Confirmed rules, binding on the skill content:

- Modern idiomatic .NET: primary constructors, file-scoped namespaces, collection expressions, switch expressions; adopt new language features as they arrive.
- No `#region`, with one sanctioned exception: folding hundreds of lines of mechanical data (the MimeTypeHelper case).
- Self-documenting code. Comments only where they add real value, and they explain why, not what. No section-label comments. No em dashes, including in comments.
- XML docs at BCL quality (nullability semantics, exceptions) on interfaces and reusable/public-leaning surfaces; none on internal plumbing; elsewhere only when genuinely helpful to other developers.
- Returns on their own line, blank line before when following other statements. Never same-line if/return.
- Braceless bodies only when the body is truly one line (a multi-line single statement still gets braces).
- `var` preferred, except when implicit conversion is involved or the type is genuinely unclear.
- Property accessor form is context-dependent; no rule, and existing forms are not "normalized".
- `sealed` when a class won't be extended (nice-to-have, not dogma).
- `ILogger<T>` injection; structured log messages without trailing periods.
- Library code validates and throws (`ArgumentNullException.ThrowIfNull`, real exceptions) and lets exceptions propagate; catch-log-continue belongs at background-loop tops; an empty catch requires a justifying comment.
- BCL library conventions: `Try*`/`out` pairs alongside throwing counterparts, private nested implementation classes, injectable clock (`ISystemClock`) for testable time, options classes with init properties and defaults.
- Null-forgiving `!` sparingly, only with a justifying comment.
- Fire-and-forget Task.Run carries an internal try/catch or a risk-accepting comment (review-adopted rule from the ConcurrentCache analysis Daren endorsed; not churned into older code).

Test style (covered within csharp-style or its reference): xUnit with `[Fact]`; names `Method_DoesSomething_WhenSomeCondition`; Arrange/Act/Assert comments by default; private static `Build()` factories returning tuples; hand-rolled private sealed fakes for simple collaborators with a mocking library acceptable where it genuinely helps; FluentAssertions pinned to the last Apache-licensed major version (7.x), never auto-upgraded to the commercial 8+ line.

**sql-style** is Scott's style as the baseline minus Daren's vetoes (Daren defers to the established T-SQL house style, which is Scott's, in shared repos). Process: distill Scott's 689-line reference into its rule list; present suspected-superfluous candidates for keep/drop votes (leading commas are already vetoed in Daren-authored SQL, replaced by standard trailing commas; candidates include leading semicolons, the @True/@False BIT pair, tab-aligning every list, ordinal-English banner dates, and similar ceremony); encode the result.

Acceptance criteria:
- Every csharp-style rule traces to a source observation or an adjudication listed above; no rule survives from Scott's skill without that backing.
- AI-isms from okmind (same-line if/returns, em dashes in comments, unsealed-by-default) appear in the antipatterns list, not the rules.
- Daren has adjudicated the sql-style veto list before sql-style is finalized.

### 6. Hooks

`session-start.js` carried over unchanged (scans `docs/plans/` for Status: In Progress headers on startup/resume/compaction; injects re-read instruction; never blocks; no dependencies). `hooks.json` registers only SessionStart; the PostToolUse/format-on-edit block and `format-on-edit.js` are removed.

Acceptance criteria:
- A project with an In Progress plan doc gets the injected recovery context on session start; a project without `docs/plans/` gets nothing.
- No reference to CSharpier or format-on-edit remains in the plugin.

### 7. Machine setup assets

- `home/CLAUDE.md`: a merge of Daren's existing rules (anti-sycophancy as written in his current file; no em dashes) with Scott's sections adapted to Daren: Directness, Working Discipline, Autonomy Contract, Code Discipline, Plans/Chapters/Memory, Context Conservation (adapted to .NET: bin/obj, packages.lock.json, large generated files), Subagent Orchestration. The Defaults section is excluded (language/stack defaults come from style skills and repo context, not global rules).
- `settings/settings.recommended.json`: `defaultMode: acceptEdits`; allow-list of `dotnet build/test/format/list` and read-only git (`git status/diff/log`) only. No `csharpier`, no `git add/commit/push`. Documented as a merge-into reference: Daren's existing settings keys (model, hooks, statusLine, voice, enabledPlugins, his read-only tool allow-list) are untouched.
- `setup.sh` / `setup.ps1`: carried over (install home/CLAUDE.md with timestamped backup of any existing file), next-steps text updated for this marketplace.

Acceptance criteria:
- The merged CLAUDE.md contains both of Daren's existing rules verbatim in intent and none of the Defaults section.
- settings.recommended.json contains no write-capable git permission and no formatter entry.
- Running setup.sh on a machine with an existing CLAUDE.md produces a timestamped backup before overwriting.

### 8. Validation and install

Final pass: both plugin validations pass, repo pushed to Daren's GitHub (destination per Open Question 4), marketplace added and plugin installed at user scope on this machine, superpowers uninstalled, a smoke test confirms skills/agents/hook load (new session in a project with an In Progress plan doc shows the recovery injection; skill list shows this kit's skills and not superpowers').

Acceptance criteria:
- `/plugin install` succeeds at user scope from the GitHub marketplace.
- A fresh session lists the kit's skills; superpowers' skills are absent.
- The recovery hook fires in a test project with an In Progress plan.

## Out of Scope

- A personal writing-voice skill (deferred until Daren provides writing samples; the kit ships without one and nothing references one).
- Any change to gstack or its skills.
- CSharpier or any format-on-edit hook.
- `git add`, `git commit`, `git push` in any allow-list.
- Changes to Daren's existing `~/.claude/settings.json` beyond the documented merge keys and the enabledPlugins change at install time.
- TDD-style test-first discipline (the Code Discipline repro-script rule is the kit's testing discipline).

## Open Questions

1. RESOLVED: personal repo is `~/repos/okmind` (AI-assisted; known AI-isms excluded per Section 5).
2. RESOLVED: shared-repo sources are in `~/repos/EleosCore`: ConcurrentCache.cs, GeotabHelper.cs, ActionRequestBackgroundService.cs, with the exclusions noted in Section 5. MimeTypeHelper.cs documents the sanctioned #region exception.
3. RESOLVED: marketplace name is `daren`.
4. RESOLVED: GitHub destination is `daren-porter/claude-kit`, private.
5. RESOLVED: hand-rolled fakes primary; NSubstitute as the sanctioned mocking library; AwesomeAssertions approved as the FluentAssertions 7.x continuation path.

## Chapters

### Chapter 1 - 2026-06-10
Completed: Section 1 (Repo skeleton and identity)
Decisions / Surprises: Spec and plan doc moved into the new repo (docs/plans/ here is now the single source of truth; claude-kit-main keeps no copy). Section 1 acceptance criterion amended: Scott identity is banned from manifests/authorship/addressees, but README provenance attribution and the sql-style "Scott-baseline" naming are allowed. `gh` CLI is not installed; stored HTTPS credentials push to github.com/daren-porter non-interactively, so Section 8 needs Daren to create the empty private repo (or install gh). `claude plugin validate` passes both levels; the no-version warning is the intended design.
Review Findings: 1 Major (setup.sh missing exec bit) fixed; 4 Minors (README step order, README dotnet list wording, setup.sh error message, setup.ps1 ErrorActionPreference + backup -Force) all fixed.
Next: Section 2 (Workflow skills)
Commit Model: Review-Only (work staged, never committed; Daren reviews via git diff --staged)

### Chapter 2 - 2026-06-10
Completed: Section 2 (Workflow skills: brainstorming, executing-work, finishing-work)
Decisions / Surprises: Branch rule made precise and reconciled across skill/spec/README: nothing is COMMITTED to main/master without explicit permission; Review-Only work may sit uncommitted on any branch. Commit-and-Push in a shared repo without main permission degrades to Branch-and-PR with a Chapter note. Pending Daren's veto at review.
Review Findings: 1 Major (three divergent branch-rule statements) fixed by the reconciliation above. 3 Minors fixed: brainstorming's Review-Only review surface aligned to staged diff; Commit-and-Push stranded-branch path closed; forward references to csharp-style/sql-style noted as expected until Section 5 lands.
Next: Section 3 (systematic-debugging skill)
Commit Model: Review-Only

### Chapter 3 - 2026-06-10
Completed: Section 3 (systematic-debugging skill)
Decisions / Surprises: Stop-and-report on debugging dead ends added to executing-work's interrupt list so the two skills state one autonomy contract. "Global rules" repro-script reference is a forward reference until Section 7; cross-check wording when home/CLAUDE.md is written.
Review Findings: 3 Minors, all fixed: irreproducible-bug path no longer dead-ends into a red flag; interrupt-list tension resolved; forward reference Chapter-noted.
Next: Section 4 (Review agents)
Commit Model: Review-Only

### Chapter 4 - 2026-06-10
Completed: Section 4 (Review agents: adversarial-reviewer, qa-verifier, security-reviewer, docs-curator)
Decisions / Surprises: Security invariants verified on disk in EleosCore before writing (WITH EXECUTE AS 'ELEOS', usp_AuditError in 250 files, RESTRICTED role with DENYs, TRUSTWORTHY script, shell-then-ALTER), so TMWSuite/ELEOS specifics kept per amended spec. Two evidence-based additions: security-reviewer exception for projects whose security model (documented or evident) is not procedure-only, and a Random-for-credentials cryptography check (from the GeotabHelper analysis). adversarial-reviewer's style-idiom enumeration replaced by a pointer to the style skills + precedence rule, to avoid duplicating rules that Section 5 owns. docs-curator's prose rules are inlined and self-contained; Section 7 cross-check: ensure no contradiction with home/CLAUDE.md.
Review Findings: 3 Minors, all fixed: EF-exception gate widened to "documented or evident"; docs-curator description aligned to finishing-work's parallelism ("after QA passes"); prose-rules anchor noted as Section 7 cross-check.
Next: Section 5 (Style skills)
Commit Model: Review-Only

### Chapter 5 - 2026-06-10
Completed: Section 5 (csharp-style with reference and test style; sql-style with reference)
Decisions / Surprises: csharp-style frontmatter needed a quoted description (unquoted ": " breaks YAML and silently drops all skill metadata; durable lesson for every future skill). Fire-and-forget Task.Run rule recorded in the spec as review-adopted. SQL veto vote adjudicated by Daren: all seven recommendations accepted (tab alignment, parameter heading rows, leading semicolons except ;WITH, @True/@False, ordinal dates, micro-indent ceremony, measured banner art all dropped; left-hand aliases kept; leading commas already dead). Precedence rule sharpened per Daren: a repo's STATED style (CLAUDE.md/style docs) supersedes first, then siblings. Baseline's inline-TVF template was itself invalid (EXECUTE AS is illegal on inline TVFs); Daren's reference documents the correct split.
Review Findings: csharp-style review: 1 Major (unsealed-by-default missing from antipatterns, a binding criterion) fixed; 4 Minors fixed (eager-adoption wording, options-snippet docs restored, exemplar paren aligned, Task.Run rule sourced). sql-style review (batched with S6/S7): 2 Minors fixed (function subsection restored with corrected EXECUTE AS guidance; TVP-type and job naming rows restored).
Next: Section 6 (Hooks)
Commit Model: Review-Only

### Chapter 6 - 2026-06-10
Completed: Section 6 (Hooks: session-start.js + hooks.json, SessionStart only)
Decisions / Surprises: "Carried over unchanged" interpreted as behaviorally unchanged: five em dashes in Scott's comments and one in the injected context string were localized to regular dashes per the global style rule (verified by diff: punctuation-only; node --check passes).
Review Findings: none beyond the em-dash localization (batched review of S5-S7 found nothing else in scope).
Next: Section 7 (Machine setup assets)
Commit Model: Review-Only

### Chapter 7 - 2026-06-10
Completed: Section 7 (home/CLAUDE.md merge, settings.recommended.json; setup scripts landed in Section 1)
Decisions / Surprises: Scott's "Never fabricate" bullet was retained under a new Honesty section (the spec excluded only the language/stack defaults from the Defaults section, not this). Context Conservation gained the section-boundary reset suggestion so the global rules and executing-work say one thing. Cross-checks from Chapters 3-4 now resolve: systematic-debugging's "global rules" repro-script reference lands on Code Discipline; docs-curator's prose rules do not conflict.
Review Findings: none in scope (batched S5-S7 review); settings verified as exactly acceptEdits + dotnet build/test/format/list + git status/diff/log.
Next: Section 8 (Validation and install)
Commit Model: Review-Only
