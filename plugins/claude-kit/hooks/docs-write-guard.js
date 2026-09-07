#!/usr/bin/env node
// PreToolUse guard: keep non-curator subagents from writing into docs/.
//
// The kit's access model: only a main session (interactive, or the bare "claude"
// agent type a background job runs as) and the docs-curator agent curate docs/.
// Reviewers, qa, and implementers must not write there; their reports and scratch
// belong in .kit/ (gitignored), and the durable record is the plan's Chapter.
// This enforces that invariant mechanically, as the teeth under the
// executing-work routing wording and the curating-docs taxonomy.
//
// Plugin PreToolUse hooks fire for tool calls made inside subagents, and the
// payload carries the subagent identity, so the guard keys on the writer's role
// rather than on report filenames: a role rule does not have to chase whatever
// docs/ path an improvising subagent invents.
//
// Covers Write/Edit/MultiEdit (exact, by file_path) and shell commands
// (heuristic): a Bash write-redirect/tee into docs/, and a PowerShell Out-File /
// Set-Content / Add-Content / Tee-Object cmdlet targeting docs/. An interpreter
// that opens the file itself (python, sed -i, Copy-Item) is out of reach here, and
// the stop-docs-hygiene Stop-scan backs that up only partway: it catches a LEAKED
// SCRATCH FILE by name or directory, and it exempts anything carrying the
// plan-header contract, so an edit to an existing curated doc passes both.
// Live-fired 2026-08-27, three arms: Write blocked, Bash redirect blocked,
// `python3 - <<EOF` allowed and the file landed.
//
// A command whose docs/-shaped targets are ALL unlocatable is allowed by design:
// where such a target resolves is not knowable from the command text, and the
// containment rule below must not deny what it cannot locate. Unlocatable means the
// target's FIRST path segment carries an expansion, and it is a deliberate
// conservative cut rather than a fact about resolution - `sub/$X/docs/` with $X
// holding a climb does resolve outside the project, and this still denies it. All
// rather than any, because a command carrying one locatable in-project target must
// be denied whatever else it also writes.
//
// `~/`, $PWD, ${PWD}, $(pwd) and `pwd` are resolved instead of screened, since the
// payload carries cwd and the runtime knows homedir. That keeps the spelling a
// subagent reaches by habit governed (`echo x > $PWD/docs/README.md` is denied) and
// judges a tilde path correctly in both directions, including a repo rooted at
// $HOME. Exotic spellings that also resolve to cwd (`~+`, `${PWD%/*}`, `${PWD:?}`)
// are NOT resolved: the first is read as relative and stays denied, the others screen
// as unlocatable and pass. So the bypass is narrowed at its reachable spellings
// rather than closed, and what stays open is any first-segment variable a subagent
// points at its own docs/ tree - narrower than the python3 and sed -i routes above,
// and open for the same reason: the teeth are the role rule, not path spelunking.
//
// A target carrying whitespace (`$(mktemp -d)/docs/a.md`) is out of reach rather
// than allowed by design: the write patterns' path class cannot cross a space, so
// nothing matches and no screen is consulted.
//
// SAFETY: this hook can BLOCK a tool call, so it fails OPEN. Any parse error,
// unrecognized payload, or inability to positively identify a non-curator
// subagent exits 0 (allow). It exits 2 (deny) only when certain. A guard bug
// must never trap legitimate work.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function readStdin() {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// The subagent's type, or null for a main-session call or any case we cannot
// positively identify (null means allow: the safe direction for a blocker).
function subagentType(p) {
    const cand = p.agent_type || p.agentType || p.subagent_type || p.subagentType;
    return (typeof cand === 'string' && cand.trim().length) ? cand.trim() : null;
}

// docs-curator is the one subagent allowed to curate docs/. Match by suffix so a
// plugin-namespaced id (e.g. "claude-kit:docs-curator") still resolves.
function isCurator(t) {
    return /(^|[:/])docs-curator$/i.test(t);
}

// A user-launched background session presents as the bare catch-all "claude"
// agent type. It is the main session of its job, not a dispatched subagent, so
// it authors plan docs like any main session. Exact match only: namespaced ids
// ("claude-kit:adversarial-reviewer") and named types stay governed. Tradeoff,
// accepted: a deliberately dispatched catch-all "claude" agent shares the type
// and therefore also passes.
function isBackgroundMain(t) {
    return /^claude$/i.test(t);
}

// A filesystem path that points inside a docs/ directory. Absolute or relative,
// Windows or POSIX separators. "mydocs/" does not match (separator required).
function targetsDocs(s) {
    return /(^|[\\/])docs[\\/]/i.test(String(s || ''));
}

// The project root at or above `dir`: the nearest ancestor holding a .git entry,
// or `dir` itself when there is none. A worktree carries a .git FILE rather than a
// directory and existsSync covers both, so a session running in a worktree is
// judged against that worktree. The walk is bounded because a symlink loop or an
// exotic mount must not hang a hook that gates every tool call.
function repoRoot(dir) {
    let cur = dir;
    for (let i = 0; i < 64; i++) {
        try { if (fs.existsSync(path.join(cur, '.git'))) return cur; } catch { return dir; }
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
    }
    return dir;
}

// Whether a docs/ target is the curated tree of the repo this session is working
// in. The invariant is about THIS project's docs/, so an absolute path resolving
// outside the project is somebody else's: a fixture under /tmp, a vendored package,
// a sibling checkout. A path this predicate reads as relative resolves under cwd and
// stays blocked, which is why the shell caller screens an all-unlocatable command out
// before it reaches here: `$M/fixture/docs/a.md` is not a relative path, and reading
// it as one blocked the very out-of-project fixture write this rule was added to
// allow (live-fired 2026-09-02, exit 2 through the variable against exit 0 for the
// identical literal path). A Windows-style path seen by a POSIX runtime reads as
// relative here and stays blocked, which is the safe direction and is not what that
// screen covers: `%TEMP%\docs\a.md` from a cmd.exe session is a standing false
// block. Added 2026-08-15 after the guard blocked a subagent
// building a test fixture under /tmp, which is the "must never trap legitimate work"
// case in this file's own header.
//
// Containment is judged against the PROJECT ROOT above cwd, not against cwd. A
// subagent routinely runs with cwd at a subdirectory, and judging against cwd let
// an absolute path to the project's own docs/ read as outside the project and pass:
// the whole guard was escapable by working one directory down. Live-fired
// 2026-08-26 against this repo, identical payloads, cwd the only variable.
function insideProject(target, cwd) {
    const t = String(target || '');
    if (!path.isAbsolute(t)) return true;
    try {
        return (path.resolve(t) + path.sep).startsWith(path.resolve(repoRoot(cwd)) + path.sep);
    } catch { return false; }  // cannot resolve: allow, per this file's fail-open doctrine
}

// The expansions this runtime can resolve, so they are judged rather than screened:
// a leading `~/` against homedir, and the four plain spellings of cwd, which the
// payload carries. `${PWD}/../elsewhere/docs/` needs no special case - it substitutes
// and then resolves outside the project on its own, correctly.
//
// FUNCTION REPLACEMENTS, not strings: a string replacement interprets `$&`, ``$` ``,
// `$'` and `$$` in the REPLACEMENT, so a project path holding any of them produced a
// path that was not cwd and silently resolved out of the project. Measured: cwd
// `/tmp/we$&rd` yielded `/tmp/we$PWDrd/docs/`, and cwd `/tmp/a$'b` yielded
// `/tmp/a/docs/b/docs/`, each turning a deny into an allow.
function resolveKnownExpansions(s, cwd) {
    return String(s || '')
        .replace(/^~(?=[\\/])/, () => os.homedir())
        .replace(/\$\{PWD\}|\$PWD\b|\$\(pwd\)|`pwd`/g, () => String(cwd || ''));
}

// A target whose destination cannot be located, because its FIRST path segment
// carries an expansion this runtime did not resolve. `insideProject` would read such
// a word as relative and so as in-project, which denies it; this file's header
// forbids exactly that, and the containment rule exists to let such a write through.
//
// The first-segment anchor is a conservative cut, not a claim about resolution. A
// later-segment expansion CAN change where a word resolves (`sub/$X/docs/` with $X
// holding a climb), and this denies it anyway, because what precedes the expansion is
// enough to judge it in every case anyone has hit. An unanchored screen, by contrast,
// gave away the in-project half of the class while changing nothing about the
// out-of-project half (live-fired 2026-09-02: `sub/$X/docs/a.md` and
// `<repo>/$X/docs/a.md` went 2 to 0, `/tmp/$X/docs/a.md` was already 0 because it is
// absolute and outside the project whatever $X holds).
//
// A literal that only looks like an expansion is misread as one and allowed: a
// directory really named `a$` or `~nosuchuser`, or a single-quoted `'$M/docs/a.md'`
// that the shell does not expand either. All three resolve under cwd and are this
// project's tree, and all three require someone to have created a directory with that
// name. Accepted, and the quoting-aware matcher the inbox carries subsumes the third.
function unlocatableTarget(s) {
    return /^[^\\/]*[$`]/.test(String(s || ''));
}

// Every docs/-shaped word in a command, split on whitespace and commas with quotes
// stripped. Deliberately coarser than the two write patterns below, and used ONLY to
// decide whether the screen above may speak - never to deny anything. A docs/ word
// that is not a write target at all (a path named in a commit message, a comment)
// therefore silences the screen rather than causing a denial, which is the
// conservative direction.
//
// This is what keeps the screen from widening the write patterns' own multi-target
// gap. They find one target per operator, so `tee $M/docs/a.md docs/b.md` never
// judges the second word: skipping the first INSIDE the loop turned that command from
// deny into allow on this project's own docs/ root. Screening the whole command
// instead cannot, because one locatable target anywhere in it silences the screen.
// The underlying gap predates this rule (`tee /tmp/x/docs/a.md docs/b.md` was already
// allowed) and the inbox carries it.
function docsTargets(c) {
    return String(c || '')
        .split(/[\s,]+/)
        .map((w) => w.replace(/^["']+|["']+$/g, ''))
        .filter(targetsDocs);
}

// A shell command that writes into a docs/ path. Two heuristics, either a hit:
//   Bash: a >, >>, tee, or heredoc redirect into docs/ (cat > docs/x <<EOF).
//   PowerShell: an Out-File / Set-Content / Add-Content / Tee-Object cmdlet, in
//   command position, with a docs/ path that is positional or reached across a
//   short bounded run of parameters, including -FilePath / -Path / -LiteralPath
//   joined by a space or a colon (-Path docs/x or -FilePath:docs/x).
// Both require a separator before docs (so "mydocs/" does not match). Known misses,
// all backstopped by the Stop-scan: non-redirect writers (python, sed -i,
// Copy-Item), and ONE TARGET PER OPERATOR, so a second word sharing a `tee` or a
// `-Path` list is never judged. In the other direction BOTH branches carry a false hit
// on text that only mentions a write rather than performing one, because neither reads
// quoting or heredoc bodies: `git commit -m 'wrote > docs/a.md today'` is denied, and
// so is a heredoc whose body happens to contain a redirect into docs/ (observed
// 2026-09-02 blocking a reviewer's own harness file). A project path holding a space,
// a quote, or one of `&;|` blinds both patterns outright, since the path class
// excludes those. The false hits trip this file's cardinal rule and are not fixed here
// - a quoting-aware matcher is its own change, examined twice and declined both
// times (docs/archive/docs-write-guard-structure_spec_v1.md carries both measured
// disproofs, the mechanism that would work, and the revival condition). What IS done
// about them is the denial text: a command-matcher hit says the false-positive class
// out loud, so a caught-in-the-crossfire reader need not read this file to tell a
// legitimate rephrase from evasion. The
// command-position anchor keeps an embedded name (Reset-Content) from matching.
//
// EVERY writer in the command is judged, not just the first. A non-global match
// stopped at the first docs/-shaped target, so one out-of-project writer ahead of
// an in-project one hid it and the command passed
// (`echo x > /tmp/docs/a.md && echo y > docs/README.md`). Live-fired 2026-08-26.
function commandWritesDocs(cmd, cwd) {
    const c = String(cmd || '');
    const redirect = /(?:>>?|tee(?:\s+-a)?\s)\s*["']?((?:[^\s"'|;&><]*[\\/])?docs[\\/])/gi;
    const cmdlet = /(?:^|[\s;|&(])(?:Out-File|Set-Content|Add-Content|Tee-Object)\b\s+(?:-\w+(?::\S+)?(?:\s+(?!-)[^\s"';|&]+)?\s+){0,4}(?:-(?:FilePath|Path|LiteralPath)[:\s]\s*)?["']?((?:[^\s"']*[\\/])?docs[\\/])/gi;
    const targets = docsTargets(c).map((t) => resolveKnownExpansions(t, cwd));
    if (targets.length && targets.every(unlocatableTarget)) return false;   // nothing locatable: allow
    for (const re of [redirect, cmdlet]) {
        let m;
        while ((m = re.exec(c)) !== null) {
            if (insideProject(resolveKnownExpansions(m[1], cwd), cwd)) return true;
        }
    }
    return false;
}

function main() {
    let p = {};
    try { p = JSON.parse(readStdin() || '{}'); } catch { return; } // parse fail: allow

    const t = subagentType(p);
    if (!t) return;                    // main session or undetermined: allow
    if (isBackgroundMain(t)) return;   // background job's main session: allow
    if (isCurator(t)) return;          // docs-curator curates docs/: allow

    const input = p.tool_input || p.toolInput || (p.tool && p.tool.input) || {};
    const fp = input.file_path || input.path;
    const cwd = (typeof p.cwd === 'string' && p.cwd) ? p.cwd : process.cwd();

    let hit = false;
    let viaCommand = false;    // the shell matcher is the only path that can false-hit
    if (fp) hit = targetsDocs(fp) && insideProject(fp, cwd);
    if (!hit && input.command) hit = viaCommand = commandWritesDocs(input.command, cwd);
    if (!hit) return;          // not a docs/ write: allow

    // The agent type is harness-supplied and reaches the model verbatim in the
    // deny text below, so it takes the same door its siblings give their own
    // interpolations: delete anything outside printable ASCII, then truncate.
    // Applied HERE rather than in subagentType(), because that value also feeds
    // the isCurator and isBackgroundMain gates above and sanitizing it there
    // would change which dispatches are allowed. This is display only.
    const safeType = t.replace(/[^\x20-\x7E]/g, '').slice(0, 120);

    process.stderr.write(
        `Blocked: the ${safeType} subagent may not write into docs/. docs/ holds curated content only `
        + `(plans and the docs-curator's docs). A report or scratch file goes to .kit/ (gitignored), `
        + `and the durable record is the plan's Chapter. Write to .kit/ instead, or return the content `
        + `in your final message.\n`
        + (viaCommand
            ? `\nIf this command only MENTIONS a docs/ path rather than writing to one - a path `
              + `inside a commit message, a quoted string, or a heredoc body - this is a known false `
              + `positive: the shell matcher reads command text, not command structure. Rephrasing `
              + `to avoid the literal string is legitimate and is not an attempt to evade this guard.\n`
            : '')
    );
    process.exitCode = 2;      // deny: set rather than forced, so the stderr write flushes
}

try { main(); } catch { /* fail open */ }
