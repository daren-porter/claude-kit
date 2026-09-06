// Tests for plugins/claude-kit/hooks/node-probe.sh, the one kit hook that is not
// a Node script.
//
// WHY IT EXISTS. Every other hook runs as `node "${CLAUDE_PLUGIN_ROOT}/hooks/*.js"`
// and Claude Code bundles no Node on any install path, so a machine without Node
// has a completely dead mechanical layer: the docs/ and push guards fail open,
// compaction recovery never fires, the kit-goal leash never holds, and the plugin
// still lists its skills and looks installed.
//
// THAT THE FAILURE IS SILENT WAS MEASURED, not inferred from the docs word
// "non-blocking". On 2026-09-06 a deliberately unspawnable SessionStart hook was
// registered through `claude -p --settings`; the session printed only its answer,
// while `--output-format stream-json --verbose` carried
// `"stderr":"/bin/sh: 1: <cmd>: not found","exit_code":127,"outcome":"error"`.
// The same measurement showed hook commands run through /bin/sh on POSIX, which is
// what makes a shell probe registrable at all.
//
// The probe is silent on Windows, where no `sh` is on PATH, and that is deliberate:
// per the measurement above an unspawnable hook costs nothing visible, so the
// Windows half is a gap rather than noise. hooks-registration.test.js pins it as
// the only `sh` registration so that gap cannot spread.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROBE = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'node-probe.sh');

// A PATH holding a shell and provably NOT node. Built by copying the shell into an
// empty dir: an earlier version of this used PATH="$D:/bin" and silently tested
// nothing, because /bin is a symlink to /usr/bin on this distro and node was still
// reachable. The reachability assert below is what makes the test honest.
function nodelessRun() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'np-'));
    try {
        fs.copyFileSync('/bin/sh', path.join(dir, 'sh'));
        fs.chmodSync(path.join(dir, 'sh'), 0o755);
        const reach = spawnSync(path.join(dir, 'sh'), ['-c', 'command -v node >/dev/null 2>&1 && echo yes || echo no'],
            { env: { PATH: dir }, encoding: 'utf8' });
        assert.strictEqual(reach.stdout.trim(), 'no',
            'test setup: node must be unreachable or this case proves nothing');
        return spawnSync(path.join(dir, 'sh'), [PROBE], { env: { PATH: dir }, encoding: 'utf8' });
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

test('with node present the probe is silent and exits 0', () => {
    const r = spawnSync('sh', [PROBE], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0);
    assert.strictEqual(r.stdout, '', 'silence is success: this runs on every session start');
    assert.strictEqual(r.stderr, '', 'nothing on stderr either, which the harness would capture');
});

test('with node absent the probe emits valid SessionStart JSON and still exits 0', () => {
    const r = nodelessRun();
    assert.strictEqual(r.status, 0, 'exit 0: a non-zero exit is itself the silent failure mode');
    const parsed = JSON.parse(r.stdout);
    assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.ok(parsed.hookSpecificOutput.additionalContext.length > 100);
});

// The message is the entire deliverable: it is the only channel by which a
// Node-less install can be reported, so it has to say what is broken, that it is
// silent, and what to do. A message that merely said "node not found" would leave
// the reader with no reason to think anything was wrong with the kit.
test('the warning names the failure, its silence, and the fix', () => {
    const ctx = JSON.parse(nodelessRun().stdout).hookSpecificOutput.additionalContext;
    assert.match(ctx, /not on PATH/, 'names the condition');
    assert.match(ctx, /EVERY kit hook is dead/, 'names the blast radius');
    assert.match(ctx, /silently/, 'says the failure is silent, which is why nothing else reports it');
    assert.match(ctx, /guards fail open/, 'names the security-relevant consequence specifically');
    assert.match(ctx, /README\.md step 6/, 'points at the end-to-end check');
    assert.match(ctx, /Tell the user/, 'the model is the only reader, so it must be told to relay this');
});

// A stray newline or shell banner would make the harness read the output as
// malformed rather than as context, which would restore the silence this exists to
// break. printf without a trailing newline is deliberate.
test('the warning is exactly one JSON object with no trailing newline', () => {
    const out = nodelessRun().stdout;
    assert.doesNotMatch(out, /\n$/, 'printf, not echo: a trailing newline is not part of the contract');
    assert.strictEqual(out.trim(), out);
    assert.doesNotThrow(() => JSON.parse(out));
});
