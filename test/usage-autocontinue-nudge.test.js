// Tests for plugins/claude-kit/hooks/usage-autocontinue-nudge.js (the SessionStart
// autoContinueAtUsageLimit posture check).
//
// Node's built-in test runner, no framework, the take-stock-nudge.test.js harness:
// the hook is spawned as a real child process, fed a SessionStart payload on
// stdin, and asserted on by its stdout - a nudge emits one
// {"hookSpecificOutput":{additionalContext}} object, silence emits nothing.
//
// HOME and CLAUDE_CONFIG_DIR are redirected to fresh temp directories for every
// spawn, and neither is ever left pointed at the real ones: this hook reads the
// user's own settings files, so a test that forgot the redirect would read (and
// could leak) whatever is actually on the machine running the suite. Each temp
// directory is created fresh per case and removed in a finally.
//
// Coverage, stated as what is actually here:
//   - One nudge case per candidate file (four), plus an empty (not just unset)
//     CLAUDE_CONFIG_DIR, which the hook treats the same as unset.
//   - The silence conditions, which matter most for a hook that runs at every
//     session start in every repo: the key absent, the key true, the string
//     "false" rather than the boolean, a malformed settings file, a missing
//     settings directory (ENOENT), a settings file at chmod 000 (EACCES, skipped
//     when the suite runs as root, where nothing is unreadable), a settings file
//     past the 1MB cap, a settings.json that is a directory rather than a file,
//     and a FIFO at that name, which is the case with teeth: it pins that the
//     open is non-blocking, so a stray FIFO cannot wedge session start.
//   - The precedence bound the hook's own header states rather than resolves: a
//     false in one file still nudges when another file says true, and a
//     malformed file does not stop a later file from being checked.
//   - The two honesty bounds the emitted text has to carry: the file list names
//     what the run actually built (two files with CLAUDE_CONFIG_DIR unset, four
//     with it set) rather than a fixed count, and safePath's strip-and-truncate,
//     which is the only sanitizer on this trusted-channel row, is exercised by a
//     home directory holding a non-ASCII segment and a path past the 300-char
//     cap.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'usage-autocontinue-nudge.js');

// Mirrors the hook's own SAFE_PATH_MAX and safePath transform, so the sanitizer
// case asserts against the shape the hook promises rather than a copy of its
// output.
const SAFE_PATH_MAX = 300;

function sanitized(value) {
    return value.replace(/[^\x20-\x7E]|`/g, '').slice(0, SAFE_PATH_MAX);
}

function makeDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmDir(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

function write(file, text) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
}

// Spawns the hook against a redirected HOME (and, when given, a redirected
// CLAUDE_CONFIG_DIR), fed a minimal SessionStart payload. Returns
// { status, signal, stdout }. timeoutMs is only passed by the FIFO case, where a
// shorter wait is what a hang costs.
function runHook(home, configDir, timeoutMs) {
    const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home });
    if (configDir === undefined) {
        delete env.CLAUDE_CONFIG_DIR;
    } else {
        env.CLAUDE_CONFIG_DIR = configDir;
    }
    return spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ cwd: home, source: 'startup', hook_event_name: 'SessionStart' }),
        env,
        encoding: 'utf8',
        timeout: timeoutMs || 15000
    });
}

// The emitted block, or null for silence. Asserts the envelope on the way
// through: stdout is exactly one JSON object of the shape every kit nudge emits.
function block(result) {
    assert.strictEqual(result.status, 0);
    if (result.stdout === '') return null;
    const parsed = JSON.parse(result.stdout);
    assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.deepStrictEqual(Object.keys(parsed), ['hookSpecificOutput']);
    return parsed.hookSpecificOutput.additionalContext;
}

// Every emitted block must carry all four things the spec's acceptance criteria
// require: the file, the consequence stated accurately (the automatic resume
// goes, the pause does not), the list of files the check actually looks at, and
// the two-directional honesty bound including the /config toggle that persists
// where this hook cannot see it. Folded into one assert so every nudge case
// below enforces the full contract rather than each picking a different subset
// of it - a later edit that dropped the consequence sentence (the entire reason
// the nudge exists), or that re-asserted an effective-state claim the hook has
// not established, would otherwise pass any case that only checked the path.
//
// `expectedPath` is what the emitted text should carry, which is the sanitized
// form rather than the path on disk: for ordinary temp paths the two are equal,
// and the sanitizer case passes the stripped and truncated form deliberately.
function assertNudgeContract(text, expectedPath) {
    assert.ok(text.includes(expectedPath), 'expected the file path in the nudge');
    assert.match(text, /autoContinueAtUsageLimit.*false/);
    assert.match(text, /automatic resume, not the pause/i);
    assert.match(text, /overage is absent or exhausted/i);
    assert.match(text, /the only files this check looks at/i);
    assert.match(text, /not a claim about the setting this session resolved/i);
    assert.ok(text.includes('`/config` toggle'), 'expected the /config bound in the nudge');
}

// The file list the emitted text names, split off the line that carries it.
function listedFiles(text) {
    const line = text.split('\n').find((l) => l.startsWith('The only files this check looks at'));
    assert.ok(line, 'expected the enumerated file list in the nudge');
    return line.replace(/^[^:]*:\s*/, '').replace(/\.$/, '').split(', ');
}

test('false in $CLAUDE_CONFIG_DIR/settings.json nudges, naming that file', () => {
    const home = makeDir('uacn-home-');
    const configDir = makeDir('uacn-config-');
    try {
        write(path.join(configDir, 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, configDir));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(configDir, 'settings.json'));
    } finally {
        rmDir(home);
        rmDir(configDir);
    }
});

test('false in $CLAUDE_CONFIG_DIR/settings.local.json nudges, naming that file', () => {
    const home = makeDir('uacn-home-');
    const configDir = makeDir('uacn-config-');
    try {
        write(path.join(configDir, 'settings.local.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, configDir));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(configDir, 'settings.local.json'));
    } finally {
        rmDir(home);
        rmDir(configDir);
    }
});

test('false in ~/.claude/settings.json nudges, naming that file', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, undefined));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(home, '.claude', 'settings.json'));
    } finally {
        rmDir(home);
    }
});

test('false in ~/.claude/settings.local.json nudges, naming that file', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.local.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, undefined));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(home, '.claude', 'settings.local.json'));
    } finally {
        rmDir(home);
    }
});

test('an empty CLAUDE_CONFIG_DIR resolves to the home dir, not a relative path', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: '' });
        const result = spawnSync(process.execPath, [HOOK], {
            input: JSON.stringify({ cwd: home, source: 'startup', hook_event_name: 'SessionStart' }),
            env,
            encoding: 'utf8',
            timeout: 15000
        });
        const text = block(result);
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(home, '.claude', 'settings.json'));
    } finally {
        rmDir(home);
    }
});

test('the emitted list names the two files a run with CLAUDE_CONFIG_DIR unset builds', () => {
    // The count is the point: a fixed "four files were checked" sentence would be
    // wrong here, since the CLAUDE_CONFIG_DIR pair is never built at all.
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, undefined));
        assert.ok(text, 'expected a nudge');
        assert.deepStrictEqual(listedFiles(text), [
            path.join(home, '.claude', 'settings.json'),
            path.join(home, '.claude', 'settings.local.json')
        ]);
        assert.ok(!text.includes('CLAUDE_CONFIG_DIR'), 'no unbuilt CLAUDE_CONFIG_DIR path should be listed');
    } finally {
        rmDir(home);
    }
});

test('the emitted list names all four files when CLAUDE_CONFIG_DIR points elsewhere', () => {
    const home = makeDir('uacn-home-');
    const configDir = makeDir('uacn-config-');
    try {
        write(path.join(configDir, 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, configDir));
        assert.ok(text, 'expected a nudge');
        assert.deepStrictEqual(listedFiles(text), [
            path.join(configDir, 'settings.json'),
            path.join(configDir, 'settings.local.json'),
            path.join(home, '.claude', 'settings.json'),
            path.join(home, '.claude', 'settings.local.json')
        ]);
    } finally {
        rmDir(home);
        rmDir(configDir);
    }
});

test('a non-ASCII, over-long path is stripped and truncated before it reaches the channel', () => {
    // safePath is the only sanitizer on this row of the trusted-channel table,
    // and every other case here builds a short ASCII mkdtemp path, so without
    // this one the sanitizer could be deleted outright and the suite would stay
    // green. Nested ~60-char segments rather than one long segment: a single
    // path component is capped at 255 bytes by the filesystem.
    const base = makeDir('uacn-home-');
    const segment = 'seg-' + 'a'.repeat(56);
    const home = path.join(base, 'café-' + 'b'.repeat(52), segment, segment, segment, segment);
    try {
        const file = path.join(home, '.claude', 'settings.json');
        assert.ok(file.length > SAFE_PATH_MAX, 'the fixture path must exceed the cap to test truncation');
        write(file, JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, undefined));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, sanitized(file));
        assert.ok(!text.includes('é'), 'the non-ASCII byte must not reach the channel');
        assert.ok(!text.includes(file), 'the full over-cap path must not reach the channel');
    } finally {
        rmDir(base);
    }
});

test('key absent everywhere is silent', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ someOtherKey: true }));
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('true is silent (the default-on case)', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: true }));
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('the string "false" is silent, since it is not the boolean', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), '{"autoContinueAtUsageLimit": "false"}');
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('a malformed JSON settings file is silent', () => {
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), '{ this is not json');
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('a missing settings directory is silent', () => {
    // home is created but nothing under it, so ~/.claude does not exist at all.
    const home = makeDir('uacn-home-');
    try {
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('an unreadable settings file is silent, not a warning', () => {
    // The spec names this case by hand. EACCES on the open is a different branch
    // input from the ENOENT above, and the file holds a real false: if the
    // failure were reported rather than swallowed, or the read succeeded, this
    // case would emit.
    //
    // Skipped as root, where chmod 000 does not make a file unreadable, and on
    // win32, where the mode bits do not mean this (the idiom is
    // test/memory-lib.test.js and test/kit-goal-stop.test.js).
    if (process.platform === 'win32' || (process.getuid && process.getuid() === 0)) return;
    const home = makeDir('uacn-home-');
    const file = path.join(home, '.claude', 'settings.json');
    try {
        write(file, JSON.stringify({ autoContinueAtUsageLimit: false }));
        fs.chmodSync(file, 0o000);
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        try { fs.chmodSync(file, 0o600); } catch { /* already gone */ }
        rmDir(home);
    }
});

test('a settings file past the size cap is silent', () => {
    // Valid JSON holding a real false, padded past SETTINGS_MAX_BYTES: the cap is
    // what keeps this silent, so removing it turns this case into a nudge.
    const home = makeDir('uacn-home-');
    try {
        const padded = '{"autoContinueAtUsageLimit": false, "pad": "' + 'a'.repeat(1024 * 1024) + '"}';
        write(path.join(home, '.claude', 'settings.json'), padded);
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('a settings.json that is a directory is silent', () => {
    // Pins the outcome rather than the guard: the !isFile() gate is what states
    // the intent, and on Linux the read of a directory descriptor would also
    // fail, so this case does not distinguish the two. What it does hold is that
    // a directory in the candidate path emits nothing and exits 0.
    const home = makeDir('uacn-home-');
    try {
        fs.mkdirSync(path.join(home, '.claude', 'settings.json'), { recursive: true });
        assert.strictEqual(block(runHook(home, undefined)), null);
    } finally {
        rmDir(home);
    }
});

test('a FIFO in place of a settings file does not hang session start', () => {
    // The non-regular-file case with teeth, and the reason readSettings opens
    // with O_NONBLOCK and fstats the descriptor rather than statting the name:
    // a plain openSync on a FIFO blocks until a writer arrives, and this hook
    // carries no time bound, so a stray FIFO at this name would wedge every
    // session start on the box. The idiom is test/session-start-adoption.test.js.
    const home = makeDir('uacn-home-');
    try {
        fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
        const made = spawnSync('mkfifo', [path.join(home, '.claude', 'settings.json')], { encoding: 'utf8' });
        // No mkfifo (Windows, or a stripped image): nothing to pin here.
        if (made.error || made.status !== 0) return;
        const result = runHook(home, undefined, 5000);
        assert.strictEqual(result.signal, null, 'a FIFO must be refused before the read, not blocked on');
        assert.strictEqual(block(result), null);
    } finally {
        rmDir(home);
    }
});

test('false in one file still nudges even when another file says true', () => {
    // Two of the candidate files disagree. Which one the harness would actually
    // pick is the merge this hook declines to model (its own header comment
    // states the bound), so the assertion here is only that a false in either
    // file is reported rather than silently deferred to the true sitting beside
    // it.
    const home = makeDir('uacn-home-');
    try {
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        write(path.join(home, '.claude', 'settings.local.json'), JSON.stringify({ autoContinueAtUsageLimit: true }));
        const text = block(runHook(home, undefined));
        assert.ok(text, 'expected a nudge');
        assertNudgeContract(text, path.join(home, '.claude', 'settings.json'));
    } finally {
        rmDir(home);
    }
});

test('a malformed file does not stop a later file from being checked', () => {
    const home = makeDir('uacn-home-');
    const configDir = makeDir('uacn-config-');
    try {
        write(path.join(configDir, 'settings.json'), '{ not valid json at all');
        write(path.join(home, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const text = block(runHook(home, configDir));
        assert.ok(text, 'expected a nudge from the later, valid file');
        assertNudgeContract(text, path.join(home, '.claude', 'settings.json'));
    } finally {
        rmDir(home);
        rmDir(configDir);
    }
});

// Two locks added after the second review round.

test('a backtick in the path is stripped, because the value lands inside a code span', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'autocont-tick-'));
    try {
        const cfg = path.join(home, 'cfg`dir');
        fs.mkdirSync(cfg, { recursive: true });
        fs.writeFileSync(path.join(cfg, 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const res = runHook(home, cfg);
        assert.strictEqual(res.status, 0);
        const ctx = JSON.parse(res.stdout).hookSpecificOutput.additionalContext;
        // A surviving backtick would close the markdown span early and leave
        // the rest of the path reading as prose in a trusted channel.
        assert.strictEqual(ctx.includes('cfg`dir'), false);
        assert.strictEqual(ctx.includes('cfgdir'), true);
    } finally {
        fs.rmSync(home, { recursive: true, force: true });
    }
});

test('a symlinked CLAUDE_CONFIG_DIR pointing at the home config dir is deduped, not listed twice', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'autocont-link-'));
    try {
        const real = path.join(home, '.claude');
        fs.mkdirSync(real, { recursive: true });
        fs.writeFileSync(path.join(real, 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const link = path.join(home, 'link-to-config');
        fs.symlinkSync(real, link, 'dir');
        const res = runHook(home, link);
        assert.strictEqual(res.status, 0);
        const ctx = JSON.parse(res.stdout).hookSpecificOutput.additionalContext;
        // Two directories, one real: the emitted list must name two files, not
        // four, or the channel states something untrue.
        const listed = (ctx.match(/settings(\.local)?\.json/g) || []).length;
        assert.strictEqual(listed, 3, 'one named file plus a two-file list: ' + ctx);
    } finally {
        fs.rmSync(home, { recursive: true, force: true });
    }
});

test('a relative CLAUDE_CONFIG_DIR is ignored, so a clone cannot make this hook speak', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'autocont-rel-'));
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'autocont-repo-'));
    try {
        fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
        // The planted repo-local settings a clone would carry.
        fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });
        fs.writeFileSync(path.join(repo, '.claude', 'settings.json'), JSON.stringify({ autoContinueAtUsageLimit: false }));
        const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: '.claude' });
        const res = spawnSync(process.execPath, [HOOK], {
            input: JSON.stringify({ cwd: repo, source: 'startup', hook_event_name: 'SessionStart' }),
            env, encoding: 'utf8', timeout: 15000, cwd: repo,
        });
        assert.strictEqual(res.status, 0);
        // Honoring it would let the clone decide both that the hook speaks and
        // which paths it names in the trusted context channel.
        assert.strictEqual(res.stdout.trim(), '');
    } finally {
        fs.rmSync(home, { recursive: true, force: true });
        fs.rmSync(repo, { recursive: true, force: true });
    }
});
