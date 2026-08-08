// Tests for plugins/claude-kit/hooks/stop-docs-hygiene.js (the docs-library Stop hook).
//
// Node's built-in test runner, no framework. The hook is spawned as a real child
// process, fed a Stop payload on stdin, and asserted on by its stdout: a block
// emits {"decision":"block", reason}; an allow emits nothing. Each case builds a
// fresh temp cwd with its own docs/ tree and cleans it up in a finally.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'stop-docs-hygiene.js');

function makeDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmDir(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

function writeFile(full, contents) {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, 'utf8');
}

// Spawn the hook against a fixture cwd; return { blocked, reason }.
function runHook(cwd) {
    const res = spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ cwd, hook_event_name: 'Stop' }),
        env: { ...process.env },
        encoding: 'utf8'
    });
    const out = (res.stdout || '').trim();
    if (!out) return { blocked: false, reason: '' };
    let parsed;
    try { parsed = JSON.parse(out); } catch { return { blocked: false, reason: '' }; }
    return { blocked: parsed.decision === 'block', reason: parsed.reason || '' };
}

const IN_PROGRESS = '# Title\n\nStatus: In Progress\nCommit Model: Commit-and-Push\n';
const COMPLETE = '# Title\n\nStatus: Complete\nCommit Model: Commit-and-Push\n';

// The over-match this hook must not commit: a legitimate plan spec whose project
// or topic name embeds a word from the SCRATCH_NAME set (security, qa, blind, ...).
test('a legit spec whose name embeds a review-ish word is not flagged as scratch', () => {
    const cwd = makeDir('sdh-spec-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_security-packet_spec_v1.md'), IN_PROGRESS);
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, false,
            'a _spec_v file named ..._security-packet_... must not be flagged as scratch; reason was: ' + reason);
    } finally { rmDir(cwd); }
});

test('the spec exemption generalizes across the SCRATCH_NAME set (qa in a spec name)', () => {
    const cwd = makeDir('sdh-qa-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_qa-harness_spec_v1.md'), IN_PROGRESS);
        const { blocked } = runHook(cwd);
        assert.strictEqual(blocked, false);
    } finally { rmDir(cwd); }
});

// The header-contract fallback: a curated doc identified by its plan headers is
// exempt even when its name does not match the _spec_v naming contract.
test('a header-bearing plan doc with a scratch-ish name is exempted via the header contract', () => {
    const cwd = makeDir('sdh-header-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_security_v2.md'), IN_PROGRESS);
        const { blocked } = runHook(cwd);
        assert.strictEqual(blocked, false);
    } finally { rmDir(cwd); }
});

// The _spec_v veto isolated from the header-contract one: a spec file whose
// headers are not written yet (or sit past the head read) is still exempt on its
// name alone, which is the veto's zero-I/O fast path.
test('a header-less _spec_v file with a scratch-ish name is exempted by the naming contract alone', () => {
    const cwd = makeDir('sdh-specname-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_qa-tooling_spec_v1.md'), '# Draft, headers not written yet\n');
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, false,
            'the _spec_v naming contract alone must exempt the file; reason was: ' + reason);
    } finally { rmDir(cwd); }
});

// The detection the exemption must not weaken: a genuine leaked report, and any
// file physically inside a scratch dir, stay caught.
test('a genuine scratch report (no _spec_v) is still flagged', () => {
    const cwd = makeDir('sdh-report-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'phase1_security.md'), '# leaked review\n');
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, true);
        assert.match(reason, /scratch leaked/);
        assert.match(reason, /phase1_security\.md/);
    } finally { rmDir(cwd); }
});

test('a spec-named file physically inside a reviews/ dir is still caught by SCRATCH_DIR', () => {
    const cwd = makeDir('sdh-dir-');
    try {
        writeFile(path.join(cwd, 'docs', 'reviews', 'proj_thing_spec_v1.md'), IN_PROGRESS);
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, true,
            'location-based SCRATCH_DIR detection is independent of the name exemption');
        assert.match(reason, /scratch leaked/);
    } finally { rmDir(cwd); }
});

// The deliberate non-behavior. An unarchived Complete plan is session-start.js's
// non-blocking nudge to give, not this hook's block: the predicate reads repo state
// with no regard for what the session did, so blocking on it interrupted read-only
// Q&A turns with an archiving demand about an unrelated plan. Re-adding the check
// here is a regression, and this test is what catches it.
test('a Complete spec still sitting in docs/plans/ does NOT block the stop', () => {
    const cwd = makeDir('sdh-complete-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_public-api_spec_v1.md'), COMPLETE);
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, false,
            'the unarchived-Complete nudge belongs to session-start.js, not to a turn-end block; reason was: ' + reason);
    } finally { rmDir(cwd); }
});

// The removal must not cost the scratch check its reach: a Complete plan and a
// genuine leak in the same tree still blocks, and says only the leak.
test('scratch still blocks alongside a Complete plan, and the reason names only the leak', () => {
    const cwd = makeDir('sdh-both-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_public-api_spec_v1.md'), COMPLETE);
        writeFile(path.join(cwd, 'docs', 'plans', 'phase2_blind.md'), '# leaked review\n');
        const { blocked, reason } = runHook(cwd);
        assert.strictEqual(blocked, true);
        assert.match(reason, /scratch leaked/);
        assert.doesNotMatch(reason, /unarchived/,
            'the Complete plan must not ride along in the scratch block');
    } finally { rmDir(cwd); }
});

test('a clean docs/ tree (in-progress spec, no scratch) allows the stop', () => {
    const cwd = makeDir('sdh-clean-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_public-api_spec_v1.md'), IN_PROGRESS);
        writeFile(path.join(cwd, 'docs', 'README.md'), '# index\n');
        const { blocked } = runHook(cwd);
        assert.strictEqual(blocked, false);
    } finally { rmDir(cwd); }
});

// The dirty fixture here must be a scratch leak, not a Complete plan: a Complete
// plan no longer blocks at all, so it would pass this case vacuously whether the
// loop guard worked or not.
test('stop_hook_active short-circuits: a dirty tree does not re-block inside a continuation', () => {
    const cwd = makeDir('sdh-active-');
    try {
        writeFile(path.join(cwd, 'docs', 'plans', 'phase1_qa.md'), '# leaked report\n');
        const res = spawnSync(process.execPath, [HOOK], {
            input: JSON.stringify({ cwd, hook_event_name: 'Stop', stop_hook_active: true }),
            encoding: 'utf8'
        });
        assert.strictEqual(res.stdout, '', 'the loop guard must keep the hook silent in a continuation');
        assert.strictEqual(res.status, 0);
    } finally { rmDir(cwd); }
});

test('malformed stdin: empty stdout, exit 0 (never throws)', () => {
    // No payload means no cwd, so the hook falls back to its own process cwd:
    // run it in an empty temp dir rather than the repo, so the case pins the
    // fail-safe rather than this repo's current docs/ state.
    const cwd = makeDir('sdh-malformed-');
    try {
        const res = spawnSync(process.execPath, [HOOK], { input: 'not json', cwd, encoding: 'utf8' });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
    } finally { rmDir(cwd); }
});
