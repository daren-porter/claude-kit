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

function runGuard(payload) {
    return spawnSync(process.execPath, [GUARD], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
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
