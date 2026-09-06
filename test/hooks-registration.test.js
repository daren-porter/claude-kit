// Tests for plugins/claude-kit/hooks/hooks.json: the registration inventory.
//
// This file exists because nothing in the suite read hooks.json at all, and a
// registration is the one part of a hook that no amount of testing the hook
// itself can reach. A wrong event name, a stray matcher, or a typo in a path
// leaves every other test in this suite green while the hook never fires: the
// whole feature ships dead and the gate says nothing. That now covers a hook
// that can deny tool calls, which is the point at which the gap stopped being
// theoretical.
//
// Deliberately inventory rather than either hook's business, and deliberately
// NOT an enumeration of what is currently registered: the assertions below are
// either universal (the file parses, every command names a file that exists) or
// scoped to one named hook, so adding an unrelated registration later cannot
// fail this file. Counting the registrations here is exactly the pattern this
// repo keeps having to fix.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks');
const HOOKS_JSON = path.join(HOOKS_DIR, 'hooks.json');

// The command form every kit hook is registered with. Captured so the script
// name can be checked against the directory: a path typo is the failure this
// whole file exists to catch, and it is invisible from anywhere else.
// The kit's registration forms. `node` is the rule and covers every hook that can
// assume Node exists. `sh` is the single deliberate exception, for the one probe
// whose whole job is to report that Node does NOT exist and which therefore cannot
// be a Node script; the test below pins it at exactly one so the exception cannot
// quietly become a second convention.
const COMMAND_RE = /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/([A-Za-z0-9._-]+\.js)"$/;
const SH_COMMAND_RE = /^sh "\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/([A-Za-z0-9._-]+\.sh)"$/;

// Every registration flattened to one row per command, carrying the event, the
// entry's matcher (and whether it declared one at all, which is a different
// question from what its value is) and the script the command names.
function registrations() {
    const parsed = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
    assert.ok(parsed && typeof parsed.hooks === 'object' && parsed.hooks !== null, 'hooks.json must carry a hooks object');
    const rows = [];
    for (const [event, entries] of Object.entries(parsed.hooks)) {
        assert.ok(Array.isArray(entries), `${event} must map to an array of entries`);
        for (const entry of entries) {
            assert.ok(entry && Array.isArray(entry.hooks), `every ${event} entry must carry a hooks array`);
            for (const hook of entry.hooks) {
                assert.strictEqual(hook.type, 'command', `every ${event} hook must be a command hook`);
                const match = COMMAND_RE.exec(hook.command) || SH_COMMAND_RE.exec(hook.command);
                rows.push({
                    event,
                    hasMatcher: Object.prototype.hasOwnProperty.call(entry, 'matcher'),
                    matcher: entry.matcher,
                    command: hook.command,
                    script: match === null ? null : match[1],
                    interp: COMMAND_RE.test(hook.command) ? 'node' : (SH_COMMAND_RE.test(hook.command) ? 'sh' : null),
                });
            }
        }
    }
    return rows;
}

function rowsFor(event, script) {
    return registrations().filter((row) => row.event === event && row.script === script);
}

test('hooks.json parses and every registered command names a hook file that exists', () => {
    const rows = registrations();
    assert.ok(rows.length > 0, 'hooks.json registers nothing at all');
    for (const row of rows) {
        assert.notStrictEqual(row.script, null, `command is not the kit's registration form: ${row.command}`);
        assert.ok(fs.existsSync(path.join(HOOKS_DIR, row.script)),
            `${row.event} registers ${row.script}, which does not exist in hooks/`);
    }
});

test('usage-nudge.js is registered on PostToolUse', () => {
    const rows = rowsFor('PostToolUse', 'usage-nudge.js');
    assert.strictEqual(rows.length, 1, 'the wind-down channel must be registered exactly once on PostToolUse');
});

test('the usage-nudge.js registration carries NO matcher, and that is load-bearing', () => {
    // Counterintuitive, so it is pinned rather than left to a reader's
    // judgement. This hook now runs after EVERY tool call, so narrowing the
    // matcher to Agent to cut per-tool-call process spawns looks like an
    // obvious optimisation. It is not: at a barrier the kit's own PreToolUse
    // barrier denies every Agent dispatch, and a PreToolUse deny returns before
    // the tool is called, so it fires no PostToolUse. An Agent-narrowed matcher
    // would therefore make the barrier wind-down undeliverable at exactly the
    // moment it matters, while leaving the warn text working, which is the
    // shape of bug that ships. Anyone who still wants to narrow it has to
    // re-derive that first, and this test is what makes them.
    const rows = rowsFor('PostToolUse', 'usage-nudge.js');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].hasMatcher, false, 'a matcher on this registration can silence the barrier text');
});

test('usage-autocontinue-nudge.js is registered on SessionStart for startup|resume', () => {
    // Section 7's posture check, and the only usage hook this file did not pin
    // by name until the close-out review noticed. The universal file-exists
    // sweep would pass with this hook mis-evented or dropped, which ships the
    // check dead with the suite green: exactly the failure this file exists to
    // catch, one hook short.
    const rows = rowsFor('SessionStart', 'usage-autocontinue-nudge.js');
    assert.strictEqual(rows.length, 1, 'the posture check must be registered exactly once on SessionStart');
    assert.strictEqual(rows[0].matcher, 'startup|resume',
        'a compact-only or missing matcher silences the check on the runs that start a session');
});

test('usage-barrier.js is registered on PreToolUse for Agent|Task', () => {
    // Both names on purpose: this session's subagent tool is Agent, and Task is
    // the name older harnesses used. A matcher naming only one of them leaves
    // the barrier bypassable by whichever the running harness happens to use.
    const rows = rowsFor('PreToolUse', 'usage-barrier.js');
    assert.strictEqual(rows.length, 1, 'the dispatch barrier must be registered exactly once on PreToolUse');
    assert.strictEqual(rows[0].matcher, 'Agent|Task');
});

// The Node probe, and the guard that keeps its exception an exception.
//
// Every other hook runs as `node <script>.js`, so on a machine without Node the
// entire mechanical layer is dead: guards fail open, compaction recovery never
// fires, the leash never holds, and the plugin still lists its skills. Verified
// 2026-09-06 rather than assumed: a deliberately unspawnable SessionStart hook
// registered through `claude -p --settings` produced exit_code 127 and outcome
// "error" in the hook_response event, and that event is visible ONLY under
// `--output-format stream-json --verbose`. The ordinary session printed nothing.
//
// So the failure is silent, and nothing written in Node can report it.
test('node-probe.sh is registered on SessionStart for startup|resume', () => {
    const rows = rowsFor('SessionStart', 'node-probe.sh');
    assert.strictEqual(rows.length, 1, 'the Node probe must be registered exactly once');
    assert.strictEqual(rows[0].matcher, 'startup|resume',
        'startup and resume are when someone would act on it; compact would be noise mid-run');
    assert.strictEqual(rows[0].interp, 'sh', 'the probe cannot be a Node script: that is its whole point');
});

// THE ANTI-WIDENING GUARD. A shell registration is a real exception - it is silent
// on Windows, where no `sh` is on PATH, which is acceptable for a probe and is NOT
// acceptable for a hook anyone relies on. Left ungated, `sh` would drift into a
// second convention and take that Windows blind spot with it.
test('sh is used by exactly one registration, and it is the probe', () => {
    const sh = registrations().filter((r) => r.interp === 'sh');
    assert.strictEqual(sh.length, 1,
        'sh registrations found: ' + sh.map((r) => r.script).join(', ')
        + ' - every hook that CAN be Node must be Node, because sh is silent on Windows');
    assert.strictEqual(sh[0].script, 'node-probe.sh');
});
