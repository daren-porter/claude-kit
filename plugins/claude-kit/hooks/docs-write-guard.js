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
// that opens the file itself (python, sed -i, Copy-Item, a path passed through a
// variable) is out of reach here, and the stop-docs-hygiene Stop-scan backs that
// up only partway: it catches a LEAKED SCRATCH FILE by name or directory, and it
// exempts anything carrying the plan-header contract, so an edit to an existing
// curated doc passes both. Live-fired 2026-08-27, three arms: Write blocked,
// Bash redirect blocked, `python3 - <<EOF` allowed and the file landed.
//
// SAFETY: this hook can BLOCK a tool call, so it fails OPEN. Any parse error,
// unrecognized payload, or inability to positively identify a non-curator
// subagent exits 0 (allow). It exits 2 (deny) only when certain. A guard bug
// must never trap legitimate work.

'use strict';

const fs = require('fs');
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
// a sibling checkout. A relative path always resolves under cwd, so this only ever
// narrows and never opens a path that used to be blocked. A Windows-style path seen
// by a POSIX runtime reads as relative here and stays blocked, which is the safe
// direction. Added 2026-08-15 after the guard blocked a subagent building a test
// fixture under /tmp, which is the "must never trap legitimate work" case in this
// file's own header.
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
    } catch { return true; }   // cannot resolve: block, the safe direction
}

// A shell command that writes into a docs/ path. Two heuristics, either a hit:
//   Bash: a >, >>, tee, or heredoc redirect into docs/ (cat > docs/x <<EOF).
//   PowerShell: an Out-File / Set-Content / Add-Content / Tee-Object cmdlet, in
//   command position, with a docs/ path that is positional or reached across a
//   short bounded run of parameters, including -FilePath / -Path / -LiteralPath
//   joined by a space or a colon (-Path docs/x or -FilePath:docs/x).
// Both require a separator before docs (so "mydocs/" does not match). Known misses,
// all backstopped by the Stop-scan: non-redirect writers (python, sed -i,
// Copy-Item, a path passed through a variable), and, in the other direction, a
// residual false hit on a cmdlet name sitting in command position inside a quoted
// string (a docs path merely named in prose, e.g. a commit message). The
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
    for (const re of [redirect, cmdlet]) {
        let m;
        while ((m = re.exec(c)) !== null) {
            if (insideProject(m[1], cwd)) return true;
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
    const cwd = p.cwd || process.cwd();

    let hit = false;
    if (fp) hit = targetsDocs(fp) && insideProject(fp, cwd);
    if (!hit && input.command) hit = commandWritesDocs(input.command, cwd);
    if (!hit) return;          // not a docs/ write: allow

    process.stderr.write(
        `Blocked: the ${t} subagent may not write into docs/. docs/ holds curated content only `
        + `(plans and the docs-curator's docs). A report or scratch file goes to .kit/ (gitignored), `
        + `and the durable record is the plan's Chapter. Write to .kit/ instead, or return the content `
        + `in your final message.\n`
    );
    process.exitCode = 2;      // deny: set rather than forced, so the stderr write flushes
}

try { main(); } catch { /* fail open */ }
