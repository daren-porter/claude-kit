// Tests for plugins/claude-kit/hooks/docs-write-guard.js (the docs/ write guard).
//
// Node's built-in test runner, no framework. The guard is spawned as a real child
// process, fed a PreToolUse payload on stdin, and asserted on by its exit code:
// 2 is a deny, 0 is an allow. These cases pin the guard's access model per agent
// type - main session (no type), the bare "claude" type a background job's main
// session presents, the docs-curator, and every governed named type - so a regex
// edit that widens or re-closes a role fails red here.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('path');

const GUARD = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'docs-write-guard.js');

function runGuard(payload, opts = {}) {
    return spawnSync(process.execPath, [GUARD], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        ...opts,
    });
}

// A real PreToolUse payload carries cwd, and the guard reads it to tell this
// project's docs/ from anyone else's. DOCS_PATH is absolute, so these payloads must
// name the repo it sits in or the guard correctly reads it as somebody else's tree.
function writePayload(agentType, filePath, cwd = '/repo') {
    const p = { tool_name: 'Write', tool_input: { file_path: filePath }, cwd };
    if (agentType !== null) p.agent_type = agentType;
    return p;
}

const DOCS_PATH = '/repo/docs/plans/some_spec_v1.md';

test('main session (no agent type) may write docs/', () => {
    const r = runGuard(writePayload(null, DOCS_PATH));
    assert.strictEqual(r.status, 0);
});

test('bare "claude" (background-job main session) may write docs/', () => {
    const r = runGuard(writePayload('claude', DOCS_PATH));
    assert.strictEqual(r.status, 0);
});

test('bare "claude" matches case-insensitively (fail-open direction)', () => {
    const r = runGuard(writePayload('Claude', DOCS_PATH));
    assert.strictEqual(r.status, 0);
});

test('docs-curator may write docs/, including plugin-namespaced', () => {
    assert.strictEqual(runGuard(writePayload('docs-curator', DOCS_PATH)).status, 0);
    assert.strictEqual(runGuard(writePayload('claude-kit:docs-curator', DOCS_PATH)).status, 0);
});

test('governed named agents are denied docs/ writes', () => {
    for (const t of ['claude-kit:adversarial-reviewer', 'claude-kit:implementer-opus', 'general-purpose', 'Explore']) {
        const r = runGuard(writePayload(t, DOCS_PATH));
        assert.strictEqual(r.status, 2, `expected deny for agent type ${t}`);
        assert.match(r.stderr, /may not write into docs\//);
    }
});

test('a Windows-separator docs path is denied too (the kit runs on both platforms)', () => {
    const r = runGuard(writePayload('claude-kit:implementer-opus', 'D:\\repo\\docs\\plans\\some_spec_v1.md'));
    assert.strictEqual(r.status, 2);
});

test('a namespaced id ending in "claude" does not ride the bare-claude allowance', () => {
    const r = runGuard(writePayload('some-plugin:claude', DOCS_PATH));
    assert.strictEqual(r.status, 2);
});

test('governed agents may still write outside docs/', () => {
    const r = runGuard(writePayload('claude-kit:implementer-opus', '/repo/.kit/report.md'));
    assert.strictEqual(r.status, 0);
});

test('governed agents are denied shell redirects into docs/', () => {
    const r = runGuard({
        tool_name: 'Bash',
        agent_type: 'claude-kit:implementer-opus',
        tool_input: { command: 'echo hi > docs/notes.md' },
    });
    assert.strictEqual(r.status, 2);
});

test('governed agents are denied a positional PowerShell cmdlet write into docs/', () => {
    const r = runGuard({
        tool_name: 'PowerShell',
        agent_type: 'claude-kit:implementer-opus',
        tool_input: { command: 'Set-Content docs/notes.md "hi"' },
    });
    assert.strictEqual(r.status, 2);
});

test('governed agents are denied a -Path: cmdlet write into docs/', () => {
    const r = runGuard({
        tool_name: 'PowerShell',
        agent_type: 'claude-kit:implementer-opus',
        tool_input: { command: 'Out-File -Encoding utf8 -FilePath: docs/notes.md' },
    });
    assert.strictEqual(r.status, 2);
});

test('unparseable payload fails open', () => {
    const r = spawnSync(process.execPath, [GUARD], { input: 'not json', encoding: 'utf8' });
    assert.strictEqual(r.status, 0);
});

// The guard protects THIS project's curated docs/, not every directory named docs/
// on the filesystem. It used to match both, which trapped a subagent building a test
// fixture under /tmp - the "must never trap legitimate work" case in the hook's own
// header. These pin the narrowing in both directions, so re-widening fails red.

test('a docs/ path outside the project is not this repo\'s curated tree', () => {
    const r = runGuard(writePayload('claude-kit:implementer-opus', '/tmp/fixture/docs/readme.md'));
    assert.strictEqual(r.status, 0);
});

test('a relative docs/ path is still denied, since it resolves under cwd', () => {
    const r = runGuard(writePayload('claude-kit:implementer-opus', 'docs/plans/x_spec_v1.md'));
    assert.strictEqual(r.status, 2);
});

test('a sibling checkout sharing a name prefix is not inside the project', () => {
    const r = runGuard(writePayload('claude-kit:implementer-opus', '/repo-other/docs/x.md'));
    assert.strictEqual(r.status, 0);
});

test('a shell redirect into an out-of-project docs/ is allowed', () => {
    const r = runGuard({
        tool_name: 'Bash',
        agent_type: 'claude-kit:implementer-opus',
        cwd: '/repo',
        tool_input: { command: 'echo hi > /tmp/fixture/docs/notes.md' },
    });
    assert.strictEqual(r.status, 0);
});

test('a shell redirect into the project\'s own docs/ is still denied', () => {
    const r = runGuard({
        tool_name: 'Bash',
        agent_type: 'claude-kit:implementer-opus',
        cwd: '/repo',
        tool_input: { command: 'echo hi > /repo/docs/notes.md' },
    });
    assert.strictEqual(r.status, 2);
});

// Containment is judged against the project's git root, not against the payload
// cwd. A subagent routinely runs with cwd at a subdirectory (a plugin dir, a
// package under a monorepo), and judging against cwd alone let an absolute path
// to the project's own docs/ resolve "outside the project" and pass. These use a
// real throwaway git repo, because the rule turns on finding a .git.

const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

function mkRepo() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dwg-repo-'));
    // A real .git is what repoRoot walks up to find. `git init` rather than a
    // hand-made directory, so the fixture matches what a session actually runs in.
    execSync('git init -q', { cwd: dir, stdio: 'ignore' });
    fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'plugins', 'deep'), { recursive: true });
    return fs.realpathSync(dir);
}

function rmrf(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* best effort */ }
}

test('an absolute write to the project docs/ is denied from a subdirectory cwd', () => {
    const repo = mkRepo();
    try {
        const target = path.join(repo, 'docs', 'x.md');
        // Positive control first: the same payload from the repo root must deny,
        // so a red on the subdirectory case is about cwd and nothing else.
        assert.strictEqual(
            runGuard(writePayload('claude-kit:implementer-opus', target, repo)).status, 2,
            'control: repo-root cwd should deny'
        );
        assert.strictEqual(
            runGuard(writePayload('claude-kit:implementer-opus', target, path.join(repo, 'plugins'))).status, 2,
            'subdirectory cwd should deny'
        );
        assert.strictEqual(
            runGuard(writePayload('claude-kit:implementer-opus', target, path.join(repo, 'plugins', 'deep'))).status, 2,
            'nested subdirectory cwd should deny'
        );
    } finally { rmrf(repo); }
});

test('a git worktree root is its own project root', () => {
    const repo = mkRepo();
    try {
        // A worktree carries a .git FILE rather than a directory, and it is the
        // project tree for a session running in it, so the walk stops there.
        const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'dwg-wt-'));
        fs.writeFileSync(path.join(wt, '.git'), 'gitdir: ' + path.join(repo, '.git', 'worktrees', 'w') + '\n');
        fs.mkdirSync(path.join(wt, 'docs'), { recursive: true });
        fs.mkdirSync(path.join(wt, 'sub'), { recursive: true });
        try {
            const real = fs.realpathSync(wt);
            assert.strictEqual(
                runGuard(writePayload('claude-kit:implementer-opus', path.join(real, 'docs', 'x.md'), path.join(real, 'sub'))).status, 2
            );
        } finally { rmrf(wt); }
    } finally { rmrf(repo); }
});

test('another checkout\'s docs/ stays allowed from a subdirectory cwd', () => {
    const repo = mkRepo();
    const other = mkRepo();
    try {
        // The narrowing this guard gained in 2026-08 must survive the fix: a
        // sibling checkout is still somebody else's tree.
        assert.strictEqual(
            runGuard(writePayload('claude-kit:implementer-opus', path.join(other, 'docs', 'x.md'), path.join(repo, 'plugins'))).status, 0
        );
    } finally { rmrf(repo); rmrf(other); }
});

test('every writer in a command is judged, not just the first', () => {
    const repo = mkRepo();
    const other = mkRepo();
    try {
        const inProject = path.join(repo, 'docs', 'b.md');
        const outside = path.join(other, 'docs', 'a.md');
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        // Controls: each writer alone behaves as expected.
        assert.strictEqual(runGuard(cmd('echo y > ' + inProject)).status, 2, 'control: in-project writer alone denies');
        assert.strictEqual(runGuard(cmd('echo x > ' + outside)).status, 0, 'control: out-of-project writer alone allows');
        // The defect: an out-of-project writer first made the in-project one invisible.
        assert.strictEqual(
            runGuard(cmd('echo x > ' + outside + ' && echo y > ' + inProject)).status, 2,
            'an in-project writer after an out-of-project one must still deny'
        );
    } finally { rmrf(repo); rmrf(other); }
});

// A redirect target carrying a shell expansion is not a relative path, and the
// guard read it as one: `$M/fixture/docs/a.md` resolved nowhere it could see, so
// containment called it in-project and DENIED a fixture write under /tmp. That is
// the case the 2026-08-15 containment change was added to stop, and the case the
// hook's own header calls the one a guard bug must never cause. Live-fired
// 2026-09-02: exit 2 through the variable against exit 0 for the identical literal
// path. These pin the screen in both directions, because the deny half is the
// whole invariant and the allow half is a documented bypass.
test('a redirect through a shell variable is allowed, since its target cannot be located', () => {
    const repo = mkRepo();
    try {
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        // Control: the same destination spelled literally is allowed, which is what
        // makes the variable form a false block rather than a policy choice.
        assert.strictEqual(runGuard(cmd('echo x > /tmp/fixture/docs/a.md')).status, 0, 'control: literal out-of-project path allows');
        assert.strictEqual(runGuard(cmd('echo x > $M/fixture/docs/a.md')).status, 0, '$VAR');
        assert.strictEqual(runGuard(cmd('echo x > ${M}/fixture/docs/a.md')).status, 0, '${VAR}');
        assert.strictEqual(runGuard(cmd('echo x > $(hostname)/docs/a.md')).status, 0, '$(cmd)');
        assert.strictEqual(runGuard(cmd('echo x > `hostname`/docs/a.md')).status, 0, 'backtick substitution');
        assert.strictEqual(runGuard(cmd('Out-File -FilePath $env:TEMP/docs/a.md')).status, 0, 'cmdlet path through $env:');
        assert.strictEqual(runGuard(cmd('Set-Content $M/fixture/docs/a.md')).status, 0, 'cmdlet path through $VAR');
        // NOT a case this screen handles: a substitution carrying whitespace never
        // matches the redirect pattern at all, so asserting it here would pass with
        // the screen deleted.
    } finally { rmrf(repo); }
});

test('an unlocatable target does not mask a locatable in-project writer', () => {
    const repo = mkRepo();
    try {
        const inProject = path.join(repo, 'docs', 'b.md');
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        assert.strictEqual(
            runGuard(cmd('echo x > $M/docs/a.md && echo y > ' + inProject)).status, 2,
            'unlocatable first must not allow the whole command'
        );
        assert.strictEqual(
            runGuard(cmd('echo y > ' + inProject + ' && echo x > $M/docs/a.md')).status, 2,
            'unlocatable last, the other operator order'
        );
        // The arms that matter, and the reason the screen judges the whole command
        // rather than one match inside the loop: the write patterns find ONE TARGET PER
        // OPERATOR, so the second word here is never matched at all. Skipping the first
        // in-loop took each of these from deny to allow on the project's own docs/ root.
        assert.strictEqual(runGuard(cmd('tee $M/docs/a.md docs/b.md')).status, 2, 'second tee target, relative');
        assert.strictEqual(runGuard(cmd('tee -a $M/docs/a.md docs/b.md')).status, 2, 'tee -a, same shape');
        assert.strictEqual(runGuard(cmd('tee $M/docs/a.md ' + inProject)).status, 2, 'second tee target, absolute');
        assert.strictEqual(runGuard(cmd('Set-Content -Path $M/docs/a.md,docs/b.md')).status, 2, 'comma-separated -Path list');
        // And the converse: with nothing locatable anywhere in it, the command passes.
        assert.strictEqual(runGuard(cmd('echo x > $M/docs/a.md && echo y > $N/docs/b.md')).status, 0, 'all targets unlocatable');
    } finally { rmrf(repo); }
});

test('a Write file_path holding a $VAR is still denied, since Write does not expand it', () => {
    // The screen is the shell caller's, not the path predicate's: a Write/Edit
    // file_path is taken literally, so `$M/docs/a.md` names a directory called
    // "$M" under cwd and really is this project's docs/ tree.
    const r = runGuard(writePayload('claude-kit:implementer-opus', '$M/fixture/docs/a.md', '/repo'));
    assert.strictEqual(r.status, 2);
});

// The screen is anchored to the target's FIRST path segment, and the anchor is the
// whole predicate. An expansion in a later segment leaves the word locatable enough
// to judge. It is a conservative cut rather than a claim about resolution: an $X
// holding a climb really would resolve elsewhere, and these still deny. What the
// anchor buys is that an unanchored screen gave away the in-project side of the class
// while changing nothing about the out-of-project side. Caught by blind review of the
// first attempt at this fix, then live-fired:
// `sub/$X/docs/a.md` and `<repo>/$X/docs/a.md` went from deny to allow while
// `/tmp/$X/docs/a.md` was allowed either way. Every arm below passes against an
// unanchored screen's ancestor too, which is why they exist.
test('an expansion in a later path segment is still denied, since the word is locatable', () => {
    const repo = mkRepo();
    try {
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        assert.strictEqual(runGuard(cmd('echo x > sub/$X/docs/a.md')).status, 2, 'literal first segment, relative');
        assert.strictEqual(runGuard(cmd('echo x > ./$X/docs/a.md')).status, 2, 'dot first segment');
        assert.strictEqual(runGuard(cmd('echo x > ' + repo + '/$X/docs/a.md')).status, 2, 'absolute, rooted in the project');
        assert.strictEqual(runGuard(cmd('tee ' + repo + '/$X/docs/a.md')).status, 2, 'tee, same shape');
        assert.strictEqual(runGuard(cmd('Set-Content ' + repo + '/$X/docs/a.md')).status, 2, 'cmdlet, same shape');
        // Tilde expands only in the first position, so a literal one later is governed.
        assert.strictEqual(runGuard(cmd('echo x > sub~1/docs/a.md')).status, 2, 'tilde inside a segment is a literal name');
        // Control: absolute and outside the project, allowed whatever the variable holds.
        assert.strictEqual(runGuard(cmd('echo x > /tmp/$X/docs/a.md')).status, 0, 'control: out-of-project prefix');
    } finally { rmrf(repo); }
});

// $PWD and $(pwd) are not unlocatable at all: the payload carries cwd. Leaving them
// to the screen made `echo x > $PWD/docs/README.md` a two-character bypass of the
// sole mechanical enforcer, reachable by habit rather than by evasion.
test('$PWD and $(pwd) are resolved from the payload, so they stay denied', () => {
    const repo = mkRepo();
    try {
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        assert.strictEqual(runGuard(cmd('echo x > $PWD/docs/README.md')).status, 2, '$PWD');
        assert.strictEqual(runGuard(cmd('echo x > ${PWD}/docs/README.md')).status, 2, '${PWD}');
        assert.strictEqual(runGuard(cmd('echo x > $(pwd)/docs/README.md')).status, 2, '$(pwd)');
        assert.strictEqual(runGuard(cmd('echo x > `pwd`/docs/README.md')).status, 2, '`pwd`');
        // The substitution is word-bounded: $PWDX is a different variable and unlocatable.
        assert.strictEqual(runGuard(cmd('echo x > $PWDX/docs/a.md')).status, 0, '$PWDX is not $PWD');
        // And it substitutes rather than special-casing, so a climb out resolves out.
        assert.strictEqual(runGuard(cmd('echo x > ${PWD}/../elsewhere/docs/a.md')).status, 0, '${PWD}/.. leaves the project');
    } finally { rmrf(repo); }
});

// `~/` is resolved against homedir rather than screened, because the runtime knows
// where it points. Screening it was wrong in a way no fixture caught: a repository
// rooted at $HOME - a dotfiles checkout - makes `~/docs/a.md` this project's curated
// tree, and a blanket allow hands it over. Both directions, one fixture, HOME the
// only variable.
test('a leading tilde is resolved, so it is judged rather than waved through', () => {
    const repo = mkRepo();
    try {
        const cmd = (c) => ({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: c },
        });
        const withHome = (home) => ({ env: { ...process.env, HOME: home } });
        assert.strictEqual(
            runGuard(cmd('echo x > ~/scratch/docs/a.md'), withHome('/home/nobody-here')).status, 0,
            'homedir outside the project: allowed'
        );
        assert.strictEqual(
            runGuard(cmd('echo x > ~/docs/a.md'), withHome(repo)).status, 2,
            'repo rooted at homedir: this IS the curated tree'
        );
        // `~+` is cwd, and stays denied by reading as relative rather than by resolution.
        assert.strictEqual(runGuard(cmd('echo x > ~+/docs/README.md')).status, 2, '~+ is cwd');
    } finally { rmrf(repo); }
});

// String.prototype.replace interprets `$&`, `` $` ``, `$'` and `$$` in the REPLACEMENT,
// so resolving $PWD with a string replacement mangled any project path containing one,
// and the mangled path resolved outside the repo - turning a deny into an allow.
// Measured on the string version: cwd `/tmp/we$&rd` produced `/tmp/we$PWDrd/docs/`.
test('a project path containing $& is still resolved correctly', () => {
    const outer = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-odd-'));
    const repo = path.join(outer, 'x$&y');
    fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
    fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
    try {
        assert.strictEqual(runGuard({
            tool_name: 'Bash',
            agent_type: 'claude-kit:implementer-opus',
            cwd: repo,
            tool_input: { command: 'echo x > $PWD/docs/a.md' },
        }).status, 2);
    } finally { rmrf(outer); }
});

// A non-string cwd made `repoRoot` and `path.resolve` throw, which reached the
// fail-open catch in `insideProject` and disabled the guard for that call. cwd is
// normalized at the entry point instead, taking the same fallback an absent cwd does.
test('a non-string cwd does not disable the guard', () => {
    const repo = mkRepo();
    try {
        for (const bad of [{}, 12345, null, []]) {
            const r = runGuard({
                tool_name: 'Write',
                agent_type: 'claude-kit:implementer-opus',
                cwd: bad,
                tool_input: { file_path: path.join(repo, 'docs', 'x.md') },
            }, { cwd: repo });
            assert.strictEqual(r.status, 2, 'cwd ' + JSON.stringify(bad));
        }
    } finally { rmrf(repo); }
});
