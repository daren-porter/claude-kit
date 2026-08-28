// Tests for plugins/claude-kit/hooks/usage.js, the kit's read-only usage
// status CLI.
//
// Node's built-in test runner, no framework: the usage-lib.test.js harness for
// isolating the store (HOME, USERPROFILE, which is what os.homedir() reads on
// Windows, and CLAUDE_CONFIG_DIR all redirected to fresh temp directories per
// case, restored in a finally) over the usage-nudge.test.js harness for driving
// the code under test as a real child process, which is how a model or an
// operator actually invokes it. The redirection is what lets a case write a
// fake config and a fake usage cache; without it a test would read, and could
// write, the operator's real store.
//
// Hermetic by construction rather than by hope, the usage-nudge.test.js
// discipline: EVERY spawn preloads an https stub through NODE_OPTIONS
// --require, so even a case whose guards were all deleted could not reach the
// real endpoint. The stub's default canned answer is a transport error, so a
// case that unexpectedly reached for the network fails rather than escapes,
// and it counts its invocations, which is what lets the fetch case pin
// "exactly one request". The clock is pinned through CLAUDE_KIT_USAGE_NOW, so
// the reported age is exact arithmetic rather than a tolerance band.
//
// What these lock, and why:
//   - An unknown window percent prints "unknown", paired in the same fixture
//     with a genuine 0 that prints "0%". This is the invariant most likely to
//     be broken by a later edit and the one that would mislead a reader worst:
//     Math.floor(null) is 0, a zero is a real measurement, and the whole
//     feature's fail-open posture rests on unknown and empty being different
//     answers. The pairing is what makes the assertion meaningful, since
//     "unknown" alone would pass for an implementation that never prints a
//     number at all.
//   - Percentages and thresholds render FAITHFULLY at one decimal, at both
//     doors, and above all that the printed comparison between them always
//     agrees with the verdict the evaluator reached. That property is the
//     invariant every rounding direction tried in this effort failed
//     (Math.round overstated a warn, Math.floor collapsed 95.5-vs-95.9,
//     floor/ceil understated a real barrier), so it is pinned as a table of
//     the reproduced pairs rather than as arithmetic.
//   - A stood-down warn prints "never fires". normWindowThresholds represents
//     an unreachable warn as Infinity deliberately, and neither raw form is
//     fit to print: "Infinity" reads as a number nobody configured and
//     JSON.stringify renders it as null.
//   - A reader failure WITH NO CACHE prints ONE typed line from the reader's
//     fixed reason set, on stdout, at exit 0, and leaks nothing. Exit 0
//     because an orchestrator may run this inside a compound command, where a
//     non-zero exit reads as a broken step rather than as "no reading
//     available". A failure with a usable cache instead serves the block off
//     the cache with the age labelled stale and the failure's reason beside
//     it: under a rate-limit lock the horizon can run to a day, and
//     discarding a good usage.json for that day defeats the ratchet in the
//     case it exists for.
//   - The age line carries the verdict's own staleness budget, and a
//     non-clear verdict older than that budget re-reads exactly once at it,
//     the two-pass protocol both hooks implement: this block's reader is an
//     actor too.
//   - A present config file that readConfig rejected whole is named in the
//     block: `enabled: false` from a rejected file was indistinguishable from
//     no config at all, in the one surface built to diagnose arming.
//   - That `enabled: false` still produces a reading and says the feature is
//     disabled, including the case with no cache at all, which is the one path
//     in this payload that touches the store and the network without the
//     feature being armed. Both hooks return on `enabled: false` before any
//     read; this command deliberately does not, and that difference is what
//     this pins.
//   - That neither `spend` nor anything from readings.log reaches stdout.
//     docs/security-model.md records the invariant that nothing emits the
//     reading log to the model, and the spend figure is account dollars: a
//     model running this before every fable dispatch would otherwise put both
//     into its own context on every invocation.
//   - That an unrecognized argument, a trailing argument and no argument all
//     print the usage line on STDERR at a non-zero exit: a bad argument is a
//     caller bug, not a reader state, and exit 0 on stdout made misuse
//     undetectable by a caller.
//   - The stream contract, both halves: a closed pipe ends the read quietly
//     at exit 0, and a stream failure that is NOT a closed pipe is reported
//     on the opposite channel at exit 1 rather than swallowed (the swallow
//     manufactured zero bytes on both channels at exit 0 under /dev/full).

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const lib = require('../plugins/claude-kit/hooks/usage-lib.js');

const CLI = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'usage.js');

// The pinned clock. Every cache fixture is dated exactly here unless a case
// needs an age, so `age: 0s` is arithmetic rather than a race with the runner.
const NOW = '2026-08-28T12:00:00.000Z';
const NOW_MS = Date.parse(NOW);

const SESSION_RESET = '2026-08-28T15:00:00Z';
const WEEKLY_RESET = '2026-09-01T00:00:00Z';

// Synthetic, and never a real credential: the failure cases assert this exact
// string stays out of everything the CLI prints.
const TOKEN = 'sk-test-synthetic-usage-cli-token-0123456789';

const USAGE_LINE = 'usage: usage.js status   (the only subcommand; prints the current kit usage reading)';

// Temp HOME (and USERPROFILE, the Windows homedir source) plus temp
// CLAUDE_CONFIG_DIR around one test body, restored in a finally regardless of
// pass or fail. Homedir redirection is what isolates the store (the lib roots
// it under ~/.claude-kit-usage), and CLAUDE_CONFIG_DIR is where the lib
// resolves .credentials.json and what keys the store's profile directory.
function withUsageEnv(fn) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-cli-home-'));
    const config = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-cli-config-'));
    const priorHome = process.env.HOME;
    const priorProfile = process.env.USERPROFILE;
    const priorConfig = process.env.CLAUDE_CONFIG_DIR;
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    process.env.CLAUDE_CONFIG_DIR = config;
    try {
        return fn({ home, config });
    } finally {
        if (priorHome === undefined) delete process.env.HOME;
        else process.env.HOME = priorHome;
        if (priorProfile === undefined) delete process.env.USERPROFILE;
        else process.env.USERPROFILE = priorProfile;
        if (priorConfig === undefined) delete process.env.CLAUDE_CONFIG_DIR;
        else process.env.CLAUDE_CONFIG_DIR = priorConfig;
        try { fs.rmSync(home, { recursive: true, force: true }); } catch { /* best effort */ }
        try { fs.rmSync(config, { recursive: true, force: true }); } catch { /* best effort */ }
    }
}

// The async twin, for the one case that must await a spawned child before the
// temp directories are torn down (memory.test.js's withStoreAsync precedent).
async function withUsageEnvAsync(fn) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-cli-home-'));
    const config = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-cli-config-'));
    const priorHome = process.env.HOME;
    const priorProfile = process.env.USERPROFILE;
    const priorConfig = process.env.CLAUDE_CONFIG_DIR;
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    process.env.CLAUDE_CONFIG_DIR = config;
    try {
        return await fn({ home, config });
    } finally {
        if (priorHome === undefined) delete process.env.HOME;
        else process.env.HOME = priorHome;
        if (priorProfile === undefined) delete process.env.USERPROFILE;
        else process.env.USERPROFILE = priorProfile;
        if (priorConfig === undefined) delete process.env.CLAUDE_CONFIG_DIR;
        else process.env.CLAUDE_CONFIG_DIR = priorConfig;
        try { fs.rmSync(home, { recursive: true, force: true }); } catch { /* best effort */ }
        try { fs.rmSync(config, { recursive: true, force: true }); } catch { /* best effort */ }
    }
}

// The threshold config, written verbatim so a case can hand over text that is
// not JSON at all.
function writeConfig(text) {
    fs.mkdirSync(path.dirname(lib.configFilePath()), { recursive: true, mode: 0o700 });
    fs.writeFileSync(lib.configFilePath(), text);
}

// A usage cache the library will serve without a credential. `windows` carries
// per-window overrides onto a clear baseline (an explicit null percent is how a
// case makes one window unknown); `fetchedAt` defaults to the pinned now.
function writeCache(windows, fetchedAt) {
    const base = {
        session: { percent: 10, severity: 'normal', resetsAt: SESSION_RESET, isActive: false },
        weeklyAll: { percent: 20, severity: 'normal', resetsAt: WEEKLY_RESET, isActive: true },
        fableWeekly: { percent: 30, severity: 'normal', resetsAt: WEEKLY_RESET, isActive: true },
    };
    const merged = {};
    for (const key of Object.keys(base)) {
        merged[key] = Object.assign({}, base[key], (windows || {})[key] || {});
    }
    fs.mkdirSync(lib.storeRoot(), { recursive: true, mode: 0o700 });
    fs.writeFileSync(lib.usageFilePath(), JSON.stringify({
        fetchedAt: fetchedAt || NOW,
        // All three kinds stay listed even when a window's percent is nulled:
        // readCache refuses a cache with no recognized kind, so a case that
        // dropped them would be testing the cache door rather than this CLI.
        kinds: ['session', 'weeklyAll', 'fableWeekly'],
        windows: merged,
        spend: { amountMinor: 4211, exponent: 2, currency: 'USD' },
    }) + '\n', { mode: 0o600 });
}

function writeCredentials(token) {
    fs.writeFileSync(path.join(process.env.CLAUDE_CONFIG_DIR, '.credentials.json'),
        JSON.stringify({ claudeAiOauth: { accessToken: token || TOKEN } }));
}

// The https stub the child preloads. It replaces https.request before the CLI
// (and usage-lib, which resolves the property at call time) loads, appends one
// byte to a marker file per invocation, and answers with the canned outcome.
// The interface mirrors only what usage-lib's fetchUsage actually touches.
// usage-nudge.test.js's stub, same shape for the same reason.
function writeStub(mode, body) {
    const marker = path.join(process.env.HOME, 'transport-calls');
    const text = [
        "'use strict';",
        "const https = require('https');",
        "const fs = require('fs');",
        'const MODE = ' + JSON.stringify(mode) + ';',
        'const BODY = ' + JSON.stringify(body === undefined ? '' : body) + ';',
        'const MARKER = ' + JSON.stringify(marker) + ';',
        'https.request = function (options, cb) {',
        "    try { fs.appendFileSync(MARKER, '1'); } catch { /* observation only */ }",
        '    const handlers = {};',
        '    return {',
        '        on(event, fn) { handlers[event] = fn; return this; },',
        '        destroy() { /* nothing to tear down */ },',
        '        end() {',
        '            setImmediate(() => {',
        "                if (MODE === 'transport-error') { if (handlers.error) handlers.error(new Error('stubbed')); return; }",
        '                const resHandlers = {};',
        '                cb({',
        '                    statusCode: Number(MODE),',
        '                    headers: {},',
        '                    complete: true,',
        '                    on(event, fn) { resHandlers[event] = fn; return this; },',
        '                });',
        '                if (resHandlers.data) resHandlers.data(Buffer.from(BODY));',
        '                if (resHandlers.end) resHandlers.end();',
        '            });',
        '        },',
        '    };',
        '};',
    ].join('\n');
    const file = path.join(process.env.HOME, 'https-stub.js');
    fs.writeFileSync(file, text);
    return file;
}

function transportCalls() {
    try { return fs.readFileSync(path.join(process.env.HOME, 'transport-calls'), 'utf8').length; } catch { return 0; }
}

// One wire payload, as the endpoint shapes it: limits[] keyed on `kind`, which
// is the only parse surface usage-lib recognizes.
function wireBody() {
    return JSON.stringify({
        limits: [
            { kind: 'session', percent: 44, severity: 'normal', resets_at: SESSION_RESET, is_active: false },
            { kind: 'weekly_all', percent: 55, severity: 'normal', resets_at: WEEKLY_RESET, is_active: true },
            {
                kind: 'weekly_scoped',
                percent: 66,
                severity: 'normal',
                resets_at: WEEKLY_RESET,
                is_active: true,
                scope: { model: { display_name: 'Fable' } },
            },
        ],
        spend: { used: { amount_minor: 4211, currency: 'USD', exponent: 2 }, limit: null, percent: 0 },
    });
}

// Spawns the CLI. `opts` picks the stub's canned answer (default: a transport
// error, which could never satisfy a fetch) so every spawn is hermetic whether
// the case expects a request or not. A timeout on every child, because a CLI
// that hangs must fail its own assertion rather than wedge the suite.
function runCli(args, opts) {
    const o = opts || {};
    const stub = writeStub(o.mode || 'transport-error', o.body);
    return spawnSync(process.execPath, [CLI, ...(args || [])], {
        input: '',
        env: Object.assign({}, process.env, {
            CLAUDE_KIT_USAGE_NOW: NOW,
            NODE_OPTIONS: '--require ' + stub,
        }),
        encoding: 'utf8',
        timeout: 15000,
        killSignal: 'SIGKILL',
    });
}

// Every READER path of this command exits 0 and prints on stdout only, so
// both are asserted on the way through rather than case by case: on those
// paths the exit code carries no signal, which is exactly why silence on
// stdout must never be an answer. The argument-misuse and stream-failure
// cases assert their own non-zero contracts instead of coming through here.
function stdout(res) {
    assert.strictEqual(res.signal, null, 'the CLI was killed, which means it hung');
    assert.strictEqual(res.status, 0, 'a reader state exits 0');
    assert.strictEqual(res.stderr, '', 'every reader answer goes to stdout, including a failure');
    return res.stdout;
}

// The block as a field map, `key: value` per line. The leading title line has
// no colon and is asserted separately.
function fields(res) {
    const lines = stdout(res).split('\n').filter((line) => line !== '');
    assert.strictEqual(lines[0], 'kit usage status');
    const map = {};
    for (const line of lines.slice(1)) {
        const at = line.indexOf(': ');
        assert.notStrictEqual(at, -1, 'every line after the title is a labelled field: ' + line);
        map[line.slice(0, at)] = line.slice(at + 2);
    }
    return map;
}

test('an unknown window percent prints unknown, and a genuine zero prints 0%', () => {
    withUsageEnv(() => {
        // The pairing is the test. A percent of 0 is a real measurement and an
        // absent one is not, and Math.floor(null) is 0, so an implementation
        // that dropped the finite check would report an unmeasured window as
        // an empty one.
        writeCache({ session: { percent: 0 }, weeklyAll: { percent: null } });
        const map = fields(runCli(['status']));
        assert.strictEqual(map.session, '0%, severity normal, resets ' + SESSION_RESET);
        assert.strictEqual(map.weeklyAll, 'unknown, severity normal, resets ' + WEEKLY_RESET);
        assert.ok(!map.weeklyAll.includes('0%'), 'an unknown percent must never print as a zero');
    });
});

test('an unknown severity and an unreadable reset instant print unknown too', () => {
    withUsageEnv(() => {
        // A reset instant without a zone is the realistic malformation:
        // Date.parse would read it as LOCAL time, so the library nulls it.
        writeCache({ session: { severity: null, resetsAt: '2026-08-28T15:00:00' } });
        const map = fields(runCli(['status']));
        assert.strictEqual(map.session, '10%, severity unknown, resets unknown');
    });
});

test('a fractional percent renders faithfully at one decimal, float noise trimmed', () => {
    withUsageEnv(() => {
        // 94.6 must print as itself: floored it collapsed onto neighbouring
        // readings and rounded it asserted the default barrier. The noise
        // fixture is the shape float arithmetic actually produces for 84.6,
        // and it must render as the one decimal that is really there.
        writeCache({ session: { percent: 94.6 }, fableWeekly: { percent: 84.60000000000001 } });
        const map = fields(runCli(['status']));
        assert.ok(map.session.startsWith('94.6%,'), 'expected a faithful 94.6%, got: ' + map.session);
        assert.ok(!map.session.includes('95%'), 'rounding up would assert a barrier that has not been reached');
        assert.ok(map.fableWeekly.startsWith('84.6%,'), 'expected a noise-trimmed 84.6%, got: ' + map.fableWeekly);
        assert.strictEqual(map.fableRatchet, 'false [advisory: the feature is disabled, so nothing enforces this; treat it as advice]');
    });
});

test('a threshold past any reachable percent prints never fires, not exponential notation', () => {
    withUsageEnv(() => {
        // normPercent nulls any percent above 1000, so neither of these can
        // ever fire, and 1e21 is where toFixed turns exponential: "1e+21%"
        // printed as a percentage was the reproduced defect.
        writeConfig(JSON.stringify({ enabled: true, session: { warn: 80, barrier: 1e21 }, fableRatchet: 999999 }));
        writeCache({});
        const res = runCli(['status']);
        const map = fields(res);
        assert.strictEqual(map.thresholds,
            'session warn 80% barrier never fires, weeklyAll warn 85% barrier 95%, fableRatchet never fires');
        assert.ok(!res.stdout.includes('e+'), 'no exponential notation anywhere in the block');
    });
});

test('a fractional threshold renders faithfully at one decimal', () => {
    withUsageEnv(() => {
        writeConfig(JSON.stringify({
            enabled: true,
            session: { warn: 80.5, barrier: 95.9 },
            weeklyAll: { warn: 85.2, barrier: 95 },
            fableRatchet: 85.7,
        }));
        writeCache({});
        const map = fields(runCli(['status']));
        assert.strictEqual(map.thresholds,
            'session warn 80.5% barrier 95.9%, weeklyAll warn 85.2% barrier 95%, fableRatchet 85.7%');
    });
});

test('a stood-down warn prints never fires rather than Infinity or null', () => {
    withUsageEnv(() => {
        // A warn above its own barrier cannot fire as written, so
        // normWindowThresholds stands it down to Infinity rather than
        // substituting the stricter default.
        writeConfig(JSON.stringify({ enabled: true, session: { warn: 96, barrier: 95 } }));
        writeCache({});
        const out = stdout(runCli(['status']));
        assert.ok(out.includes('session warn never fires barrier 95%'),
            'expected a stood-down warn to say so, got: ' + out);
        assert.ok(!out.includes('Infinity'), 'Infinity reads as a number nobody configured');
        assert.ok(!out.includes('null'), 'JSON.stringify renders Infinity as null, which is no better');
    });
});

test('a reader failure prints one typed line, exits 0, and leaks nothing', () => {
    withUsageEnv(() => {
        // No credential and no cache: the reader reports no-token without
        // touching the transport.
        const res = runCli(['status']);
        assert.strictEqual(stdout(res), 'usage: no reading available (no-token)\n');
        assert.strictEqual(transportCalls(), 0, 'no-token must never reach the network');
    });
});

test('a failed request reports its typed reason and never the token', () => {
    withUsageEnv(() => {
        writeCredentials();
        const res = runCli(['status'], { mode: 'transport-error' });
        const out = stdout(res);
        assert.strictEqual(out, 'usage: no reading available (timeout)\n');
        assert.ok(!out.includes(TOKEN), 'no token material, ever');
        assert.ok(!out.includes('Error'), 'a failure prints a reason, never an error object');
        assert.strictEqual(transportCalls(), 1);
    });
});

test('enabled false still produces a reading and says the feature is disabled', () => {
    withUsageEnv(() => {
        writeCache({ session: { percent: 96 }, fableWeekly: { percent: 91 } });
        const map = fields(runCli(['status']));
        assert.strictEqual(map.enabled, 'false');
        assert.strictEqual(map.session, '96%, severity normal, resets ' + SESSION_RESET);
        // The verdict is evaluated as if armed, so the two policy fields are
        // readings rather than the constants a disabled config would force,
        // and both carry the advisory marker that says nothing acts on them.
        assert.strictEqual(map.state, 'barrier (session) [advisory: the feature is disabled, so nothing enforces this; treat it as advice]');
        assert.strictEqual(map.fableRatchet, 'true [advisory: the feature is disabled, so nothing enforces this; treat it as advice]');
    });
});

test('an armed config drops the advisory marker', () => {
    withUsageEnv(() => {
        writeConfig(JSON.stringify({ enabled: true }));
        writeCache({ session: { percent: 96 }, fableWeekly: { percent: 91 } });
        const map = fields(runCli(['status']));
        assert.strictEqual(map.enabled, 'true');
        assert.strictEqual(map.state, 'barrier (session)');
        assert.strictEqual(map.fableRatchet, 'true');
    });
});

test('with no cache and the feature disabled, status still fetches and reports the reading', () => {
    withUsageEnv(() => {
        // The one deliberate difference from the hooks, pinned: both of them
        // read the config first and return on `enabled: false`, so an unarmed
        // machine makes no request and never creates the store. An explicit
        // request for a reading gets one either way.
        writeCredentials();
        const map = fields(runCli(['status'], { mode: '200', body: wireBody() }));
        assert.strictEqual(transportCalls(), 1);
        assert.strictEqual(map.enabled, 'false');
        assert.strictEqual(map.age, '0s, freshly fetched, staleness budget 600s');
        assert.strictEqual(map.session, '44%, severity normal, resets ' + SESSION_RESET);
        assert.strictEqual(map.fableWeekly, '66%, severity normal, resets ' + WEEKLY_RESET);
        assert.ok(fs.existsSync(lib.usageFilePath()), 'the reader caches what it fetched');
    });
});

test('a cached reading reports its age in seconds and says it came from cache', () => {
    withUsageEnv(() => {
        writeCache({}, new Date(NOW_MS - 240 * 1000).toISOString());
        const map = fields(runCli(['status']));
        assert.strictEqual(map.age, '240s, from cache, staleness budget 600s');
        assert.strictEqual(transportCalls(), 0, 'a cache inside the staleness budget serves without a request');
    });
});

test('neither spend nor the readings log reaches stdout', () => {
    withUsageEnv(() => {
        writeCache({});
        // A distinctive line in the log the operator reads directly. Nothing
        // emits it to the model, and this command is the one that would be run
        // most often, so the invariant is pinned here rather than assumed.
        fs.writeFileSync(lib.logFilePath(),
            JSON.stringify({ fetchedAt: NOW, marker: 'READINGS-LOG-CANARY' }) + '\n', { mode: 0o600 });
        const out = stdout(runCli(['status']));
        assert.ok(!out.includes('READINGS-LOG-CANARY'), 'the reading log never reaches the model');
        assert.ok(!out.includes('4211'), 'the spend figure is account dollars and stays out of the block');
        assert.ok(!out.toLowerCase().includes('spend'), 'not the figure and not the label');
        assert.ok(!out.includes('USD'), 'nor its currency');
    });
});

test('argument misuse prints the usage line on stderr and exits non-zero', () => {
    withUsageEnv(() => {
        writeCache({});
        // A bad argument is a caller bug, not a reader state: the usage line
        // at exit 0 on stdout made `status --json` and a typo of `status`
        // undetectable by the caller whose question went unanswered.
        for (const args of [[], ['STATUS'], ['sttaus'], ['spend'], ['--json'], ['status', '--json'], ['status', 'extra']]) {
            const res = runCli(args);
            assert.strictEqual(res.status, 1, 'misuse exits non-zero, for argv: ' + JSON.stringify(args));
            assert.strictEqual(res.stdout, '', 'nothing on the answer channel, for argv: ' + JSON.stringify(args));
            assert.strictEqual(res.stderr, USAGE_LINE + '\n', 'for argv: ' + JSON.stringify(args));
        }
    });
});

test('the printed percent-versus-barrier comparison always agrees with the verdict', () => {
    // The invariant all three prior formatting rules failed, pinned as pairs
    // rather than as arithmetic. Math.round let a warn print 94.6-vs-95 as
    // "95% ... 95%" (reads as reached); Math.floor let a warn print
    // 95.5-vs-95.9 the same way; floor-the-percent/ceil-the-threshold let a
    // BARRIER print 95.95-vs-95.9 as "95% ... 96%" (reads as not reached).
    // Faithful one-decimal rendering survives all of them because rounding to
    // nearest is monotone: a >= b can never print as below, and at one-decimal
    // resolution the rendering is the identity.
    const pairs = [
        [94.6, 95],
        [95.5, 95.9],
        [95.95, 95.9],
        [94.60000000000001, 95],
        [95.9, 95.9],
        [95.55, 95.6],
    ];
    for (const [percent, barrier] of pairs) {
        withUsageEnv(() => {
            // weeklyAll is parked out of reach so the session window alone
            // decides the state (it outranks session at the same level).
            writeConfig(JSON.stringify({
                enabled: true,
                session: { warn: barrier, barrier },
                weeklyAll: { warn: 1000, barrier: 1000 },
            }));
            writeCache({ session: { percent } });
            const map = fields(runCli(['status']));
            const printedPercent = parseFloat(map.session);
            const barrierMatch = map.thresholds.match(/^session warn \S+ barrier (\S+)%/);
            assert.ok(barrierMatch, 'the session barrier is legible in: ' + map.thresholds);
            const printedBarrier = parseFloat(barrierMatch[1]);
            const atOrPast = percent >= barrier;
            assert.strictEqual(map.state.startsWith('barrier'), atOrPast,
                'verdict sanity for ' + percent + ' vs ' + barrier + ': ' + map.state);
            assert.strictEqual(printedPercent >= printedBarrier, atOrPast,
                'printed ' + map.session.split(',')[0] + ' against printed barrier ' + printedBarrier
                + '% must compare the way the evaluator decided for ' + percent + ' vs ' + barrier);
        });
    }
});

// ---------------------------------------------------------------------------
// The stale-cache fallback: a failed fresh read must not discard a usable
// cache. Under a rate-limit lock the horizon can run to a day, and an
// orchestrator deciding whether to downgrade a fable dispatch would get
// nothing for that day while the store held the answer.
// ---------------------------------------------------------------------------

const NOW_SECONDS = Math.floor(NOW_MS / 1000);

test('a failed fresh read serves the stale cache, labelled stale and carrying the failure', () => {
    withUsageEnv(() => {
        writeCredentials();
        writeCache({ session: { percent: 42 } }, new Date(NOW_MS - 700 * 1000).toISOString());
        const map = fields(runCli(['status'], { mode: 'transport-error' }));
        assert.strictEqual(transportCalls(), 1, 'one failed fetch; the fallback serves the cache without another');
        assert.strictEqual(map.age, '700s, stale cache (fresh read failed: timeout), staleness budget 600s');
        assert.ok(map.session.startsWith('42%,'), 'the numbers still arrive: ' + map.session);
    });
});

test('a backoff lock does not blind the reader: the cache is served with the lock named', () => {
    withUsageEnv(() => {
        writeCredentials();
        writeCache({ session: { percent: 42 } }, new Date(NOW_MS - 700 * 1000).toISOString());
        fs.writeFileSync(lib.lockFilePath(),
            JSON.stringify({ blockedUntil: NOW_SECONDS + 3000, reason: 'rate-limited' }) + '\n', { mode: 0o600 });
        const map = fields(runCli(['status']));
        assert.strictEqual(transportCalls(), 0, 'a lock in force means no request, fallback included');
        assert.strictEqual(map.age, '700s, stale cache (fresh read failed: locked), staleness budget 600s');
        assert.ok(map.session.startsWith('42%,'));
    });
});

test('a rate-limited read names its backoff, with and without a cache to fall back on', () => {
    withUsageEnv(() => {
        // Without a cache: the one-line failure, carrying retryAfterSeconds
        // (the stub sends no retry-after header, so the reader's 300s default
        // is the value in play). Dropping it left a reader unable to tell a
        // 300s backoff from a 54-minute one.
        writeCredentials();
        const res = runCli(['status'], { mode: '429' });
        assert.strictEqual(stdout(res), 'usage: no reading available (rate-limited, retry after 300s)\n');
    });
    withUsageEnv(() => {
        // With a cache: the same detail rides the stale label.
        writeCredentials();
        writeCache({}, new Date(NOW_MS - 700 * 1000).toISOString());
        const map = fields(runCli(['status'], { mode: '429' }));
        assert.strictEqual(map.age, '700s, stale cache (fresh read failed: rate-limited, retry after 300s), staleness budget 600s');
    });
});

// ---------------------------------------------------------------------------
// The two-pass staleness protocol, mirrored from the hooks: a non-clear
// verdict judging data older than its own tightened budget re-reads once at
// that budget before the block is printed.
// ---------------------------------------------------------------------------

test('a non-clear verdict outside its budget re-reads once and reports the fresh verdict', () => {
    withUsageEnv(() => {
        writeCredentials();
        // Age 300 is inside the 600s first-read budget but outside the 120s
        // budget a barrier verdict hands back; the stubbed endpoint answers
        // the re-read with a clear 44%.
        writeCache({ session: { percent: 96 } }, new Date(NOW_MS - 300 * 1000).toISOString());
        const map = fields(runCli(['status'], { mode: '200', body: wireBody() }));
        assert.strictEqual(transportCalls(), 1, 'exactly one re-read, never a loop');
        assert.ok(map.session.startsWith('44%,'), 'the block reflects the re-read, not the stale barrier: ' + map.session);
        assert.strictEqual(map.age, '0s, freshly fetched, staleness budget 600s');
    });
});

test('a failed re-read keeps the first reading, with age and budget beside it', () => {
    withUsageEnv(() => {
        writeCredentials();
        writeCache({ session: { percent: 96 } }, new Date(NOW_MS - 300 * 1000).toISOString());
        const map = fields(runCli(['status'], { mode: 'transport-error' }));
        assert.strictEqual(transportCalls(), 1, 'the re-read was attempted');
        assert.ok(map.session.startsWith('96%,'), 'this command reports what it holds rather than withholding');
        // 300s against a printed budget of 120s is the reader's cue that the
        // basis is stale; the block does not present it as anything else.
        assert.strictEqual(map.age, '300s, from cache, staleness budget 120s');
        assert.ok(map.state.startsWith('barrier (session)'), 'the verdict is the first reading\'s: ' + map.state);
    });
});

// ---------------------------------------------------------------------------
// Config diagnostics: a present file readConfig rejected whole is named,
// because `enabled: false` plus the shipped defaults is otherwise
// indistinguishable from no config at all.
// ---------------------------------------------------------------------------

test('a rejected config file is named in the block, and a usable or absent one is not', () => {
    withUsageEnv(() => {
        writeCache({});
        // Absent: nothing to diagnose.
        assert.ok(!('config' in fields(runCli(['status']))), 'no config line without a config file');
        // A trailing comma, the reproduced operator mistake.
        writeConfig('{ "enabled": true, }');
        let map = fields(runCli(['status']));
        assert.strictEqual(map.enabled, 'false');
        assert.strictEqual(map.config,
            'config.json exists but was rejected (not valid JSON); the enabled flag and thresholds shown are the shipped defaults');
        // Over the read cap, the other reproduced rejection.
        writeConfig('{ "enabled": true, "pad": "' + 'x'.repeat(17000) + '" }');
        map = fields(runCli(['status']));
        assert.match(map.config, /rejected \(over the read cap\)/);
        // Valid JSON that is not an object at all.
        writeConfig('[]');
        map = fields(runCli(['status']));
        assert.match(map.config, /rejected \(not a JSON object\)/);
        // A usable file, enabled or not, draws no line.
        writeConfig('{ "enabled": true }');
        assert.ok(!('config' in fields(runCli(['status']))), 'a parsed config is not an issue');
    });
});

// ---------------------------------------------------------------------------
// The stream contract, both halves.
// ---------------------------------------------------------------------------

test('a closed pipe ends the read quietly instead of printing a stack trace', async () => {
    await withUsageEnvAsync(async () => {
        writeCache({});
        const stub = writeStub('transport-error');
        const { code, stderr } = await new Promise((resolve) => {
            const child = spawn(process.execPath, [CLI, 'status'], {
                env: Object.assign({}, process.env, {
                    CLAUDE_KIT_USAGE_NOW: NOW,
                    NODE_OPTIONS: '--require ' + stub,
                }),
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let collected = '';
            child.stderr.on('data', (chunk) => { collected += chunk; });
            // What `| head -0` does at its promptest: the read end is gone
            // before the block is written, so the write lands on a closed
            // pipe. Destroyed immediately rather than on first data because
            // the whole block arrives in one write.
            child.stdout.destroy();
            child.on('close', (c) => resolve({ code: c, stderr: collected }));
        });
        assert.ok(!/\n\s+at /.test(stderr), 'threw a stack trace: ' + stderr);
        assert.doesNotMatch(stderr, /EPIPE/);
        assert.strictEqual(code, 0, 'a reader that stopped reading is not a failed command');
    });
});

test('a stream failure that is not a closed pipe is reported on the other channel', (t) => {
    // /dev/full is the Linux fixture for a write that fails with ENOSPC; the
    // swallow-all handler this pins against exited 0 with zero bytes on BOTH
    // channels under exactly this redirect.
    if (!fs.existsSync('/dev/full')) {
        t.skip('/dev/full is a Linux fixture');
        return;
    }
    withUsageEnv(() => {
        writeCache({});
        const stub = writeStub('transport-error');
        const fd = fs.openSync('/dev/full', 'w');
        try {
            const res = spawnSync(process.execPath, [CLI, 'status'], {
                input: '',
                env: Object.assign({}, process.env, {
                    CLAUDE_KIT_USAGE_NOW: NOW,
                    NODE_OPTIONS: '--require ' + stub,
                }),
                stdio: ['pipe', fd, 'pipe'],
                encoding: 'utf8',
                timeout: 15000,
                killSignal: 'SIGKILL',
            });
            assert.strictEqual(res.status, 1, 'a dead answer channel is not exit 0');
            assert.strictEqual(res.stderr, 'usage: output stream failed: ENOSPC\n');
        } finally {
            fs.closeSync(fd);
        }
    });
});
