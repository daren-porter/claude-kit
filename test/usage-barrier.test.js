// Tests for plugins/claude-kit/hooks/usage-barrier.js (the PreToolUse usage
// barrier and the Fable ratchet it carries).
//
// Node's built-in test runner, no framework, the usage-autocontinue-nudge
// harness: the hook is spawned as a real child process, fed a PreToolUse
// payload on stdin, and asserted on by its stdout. A deny is exactly one
// {"hookSpecificOutput":{permissionDecision:"deny"}} object; an allow is
// silence. usage-lib.test.js's withUsageEnv shape isolates every case: HOME,
// USERPROFILE and CLAUDE_CONFIG_DIR point at fresh temp directories, which is
// what lets a test write a fake store, config and credentials file without
// touching the operator's real ones.
//
// Hermetic by construction, not by hope: EVERY spawn carries an https stub
// through NODE_OPTIONS --require, so even a case whose guards were all deleted
// could not reach the real endpoint with the synthetic token. The stub also
// appends one byte to a marker file per invocation, which is what lets the
// two-pass staleness cases pin "exactly one re-read" rather than "denied
// eventually".
//
// The canonical deny texts are DUPLICATED here as literals on purpose: the
// wording is a cross-hook contract authored in the main thread, so the test
// holds its own copy and a hook-side paraphrase shows up as an inequality
// rather than passing a substring check.
//
// Threshold choice in the unknown-percent fixtures: the null cases run at a
// threshold of 0, never the default 85, because JavaScript coercion makes
// null >= 85 false by luck while null >= 0 is TRUE, and each null case is
// paired with a percent-0 case proving the zero threshold itself denies, so
// the allow in the null case is attributable to unknown-percent handling
// rather than to the threshold never being reachable. (A test in this effort
// already passed vacuously on exactly this shape at the default threshold.)
//
// Mutation targets verified by hand against this suite (delete or invert,
// watch red, restore): the hook's tool-name guard, the age-within-budget deny
// guard, the strict-< staleness boundary operator, the barrier-only state
// comparison (a warn must allow), and the wouldDeny re-check after the
// re-read. usage-lib's two unknown-never-trips guarantees are pinned red-able
// by that library's own suite; this hook ALSO refuses to emit a non-finite
// number at the door (the canonical interpolation rules require checking
// finiteness where the text is emitted, not trusting the door that decided),
// so the threshold-0 fixtures below are end-to-end pins that stay green when
// either single layer is deleted, by design rather than by oversight: the
// class they insure against, a deny quoting a fabricated percent, is closed
// by the emission guard, and the control-flow mutations above are what this
// suite discriminates.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'usage-barrier.js');
const lib = require('../plugins/claude-kit/hooks/usage-lib.js');

// A pinned clock, fed to the child through the CLAUDE_KIT_USAGE_NOW seam, so
// every cache-age computation is exact arithmetic.
const NOW_ISO = '2026-08-28T12:00:00.000Z';
const NOW_MS = Date.parse(NOW_ISO);
const NOW_SECONDS = Math.floor(NOW_MS / 1000);

// Valid per usage-lib's ISO_TIMESTAMP_RE (zone required), asserted verbatim in
// the deny text.
const RESET_SESSION = '2026-08-28T17:00:00+00:00';
const RESET_WEEKLY = '2026-08-31T07:00:00+00:00';

// Synthetic, never a real credential; the stub keeps it off the wire anyway.
const TOKEN = 'sk-test-synthetic-usage-barrier-token-0123456789';

// Interpolated into every payload's prompt (and never into any fixture the
// hook is allowed to echo): the deny reason must not carry tool_input strings.
const PROMPT_MARKER = 'MARKER_PROMPT_NEVER_ECHOED';

// ---------------------------------------------------------------------------
// Environment and fixtures.
// ---------------------------------------------------------------------------

function withEnv(fn) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-barrier-home-'));
    const config = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-barrier-config-'));
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

// One cached window in the shape usage-lib's own publisher writes.
function win(spec) {
    const s = spec || {};
    return {
        percent: s.percent === undefined ? null : s.percent,
        severity: 'normal',
        resetsAt: s.resetsAt === undefined ? null : s.resetsAt,
        isActive: true,
    };
}

// Writes the store cache aged `ageSeconds` behind the pinned clock. Resolved
// through the lib's own path functions, which read the redirected env.
function writeCache(spec) {
    const s = spec || {};
    const fetchedAt = new Date(NOW_MS - (s.ageSeconds || 0) * 1000).toISOString();
    const body = {
        fetchedAt,
        kinds: ['session', 'weeklyAll', 'fableWeekly'],
        windows: {
            session: win(s.session),
            weeklyAll: win(s.weeklyAll),
            fableWeekly: win(s.fableWeekly),
        },
        spend: {},
    };
    fs.mkdirSync(path.dirname(lib.usageFilePath()), { recursive: true });
    fs.writeFileSync(lib.usageFilePath(), JSON.stringify(body) + '\n');
}

function writeConfig(cfg) {
    fs.mkdirSync(path.dirname(lib.configFilePath()), { recursive: true });
    fs.writeFileSync(lib.configFilePath(), JSON.stringify(cfg));
}

function writeCredentials(configDir) {
    fs.writeFileSync(path.join(configDir, '.credentials.json'), JSON.stringify({ claudeAiOauth: { accessToken: TOKEN } }));
}

function writeLockFixture() {
    fs.mkdirSync(path.dirname(lib.lockFilePath()), { recursive: true });
    fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: NOW_SECONDS + 300, reason: 'rate-limited' }));
}

// The https stub the child preloads. Replaces https.request before the hook
// (and usage-lib, which resolves the property at call time) loads, appends one
// byte to the marker per invocation, and answers with the canned outcome. The
// interface mirrors what usage-lib's fetchUsage actually touches: transport
// (options, cb) returning { on, destroy, end }, and a response object with
// statusCode, headers, complete and on.
function writeStub(home, mode, body) {
    const marker = path.join(home, 'transport-calls');
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
        "                if (MODE === 'timeout') { if (handlers.timeout) handlers.timeout(); return; }",
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
    const file = path.join(home, 'https-stub.js');
    fs.writeFileSync(file, text);
    return marker;
}

function transportCalls(home) {
    try { return fs.readFileSync(path.join(home, 'transport-calls'), 'utf8').length; } catch { return 0; }
}

// Spawns the hook. opts.mode/opts.body pick the stub's canned answer
// (default: a transport error that could never satisfy a fetch); opts.now
// overrides the pinned clock for the bad-call case.
function runHook(env, payload, opts) {
    const o = opts || {};
    writeStub(env.home, o.mode || 'transport-error', o.body);
    const childEnv = Object.assign({}, process.env, {
        HOME: env.home,
        USERPROFILE: env.home,
        CLAUDE_CONFIG_DIR: env.config,
        CLAUDE_KIT_USAGE_NOW: o.now || NOW_ISO,
        NODE_OPTIONS: '--require ' + path.join(env.home, 'https-stub.js'),
    });
    return spawnSync(process.execPath, [HOOK], {
        input: typeof payload === 'string' ? payload : JSON.stringify(payload),
        env: childEnv,
        encoding: 'utf8',
        timeout: 15000,
    });
}

// subagent_type INSIDE tool_input is the DISPATCH TARGET, never the caller;
// the hook reads caller identity off the payload's top level only. The
// exact-canonical orchestrator-form cases all carry this field, which is what
// pins that it is not misread as a nested dispatch.
function agentPayload(model, overrides) {
    const input = { subagent_type: 'implementer-fable', prompt: PROMPT_MARKER };
    if (model !== undefined) input.model = model;
    return Object.assign({
        tool_name: 'Agent',
        hook_event_name: 'PreToolUse',
        tool_input: input,
    }, overrides || {});
}

// A usable 200 body for the re-read cases, in the wire shape usage-lib parses.
function apiBody(sessionPercent) {
    return JSON.stringify({
        limits: [
            { kind: 'session', percent: sessionPercent, severity: 'normal', resets_at: RESET_SESSION, is_active: true },
            { kind: 'weekly_all', percent: 12, severity: 'normal', resets_at: RESET_WEEKLY, is_active: true },
            { kind: 'weekly_scoped', percent: 5, severity: 'normal', resets_at: RESET_WEEKLY, is_active: true, scope: { model: { display_name: 'Fable' } } },
        ],
        spend: { used: { amount_minor: 100, currency: 'USD', exponent: 2 }, limit: null, percent: 0 },
    });
}

// ---------------------------------------------------------------------------
// Assertion helpers.
// ---------------------------------------------------------------------------

function assertAllow(res) {
    assert.strictEqual(res.status, 0, 'an allow must exit 0; stderr: ' + (res.stderr || ''));
    assert.strictEqual(res.stdout, '', 'an allow must emit nothing');
}

// The deny envelope, pinned whole: exactly one hookSpecificOutput object,
// exactly the three PreToolUse deny fields (no additionalContext: a sibling
// hook owns that channel for this state), inside the kit's own 2000-character
// and 20-line budget (prudence; an earlier claim that the binary enforces
// those numbers was retracted on review), echoing nothing from tool_input.
function denyReason(res) {
    assert.strictEqual(res.status, 0, 'a JSON deny still exits 0; stderr: ' + (res.stderr || ''));
    assert.notStrictEqual(res.stdout, '', 'expected a deny, got silence');
    const parsed = JSON.parse(res.stdout);
    assert.deepStrictEqual(Object.keys(parsed), ['hookSpecificOutput']);
    const out = parsed.hookSpecificOutput;
    assert.deepStrictEqual(
        Object.keys(out).sort(),
        ['hookEventName', 'permissionDecision', 'permissionDecisionReason'],
    );
    assert.strictEqual(out.hookEventName, 'PreToolUse');
    assert.strictEqual(out.permissionDecision, 'deny');
    const reason = out.permissionDecisionReason;
    assert.ok(typeof reason === 'string' && reason.length > 0, 'a deny with no reason is a wedge with no instruction');
    assert.ok(reason.length <= 2000, 'the kit budgets the reason at 2000 characters');
    assert.ok(reason.split('\n').length <= 20, 'the kit budgets the reason at 20 lines');
    assert.ok(!reason.includes(PROMPT_MARKER), 'no tool_input string may cross into the reason');
    return reason;
}

// The canonical texts, independent copies (see the header).

const BLOCKED_KNOWN = 'Surface a line whose very first characters are `BLOCKED:`, naming this window, its percent and its reset instant, and stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.';

const BLOCKED_UNKNOWN = 'Surface a line whose very first characters are `BLOCKED:`, naming this window and its percent, and saying its reset instant could not be read, then stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.';

function expectedBarrierReason(v) {
    return [
        'Denied by the kit usage barrier: the ' + v.label + ' usage window is at ' + v.percent + '%, at or past the barrier of ' + v.barrier + '%. ' + v.resetClause + ' Subagent dispatch is held until this window resets.',
        '',
        "Do not retry this dispatch, do not reshape it, and do not do the subagent's work in the main thread instead. The barrier exists to stop spending, and every one of those routes around it spends more.",
        '',
        'Stop now, in this order:',
        '1. Stage whatever is already complete.',
        "2. Write the current section's Chapter in the plan doc, naming this barrier as the reason the effort stopped.",
        '3. ' + v.resumeStep,
        '4. ' + v.blockedStep,
        '',
        'This is a spend control the operator armed, not an error and not a rate limit.',
    ].join('\n');
}

function resumeArm(reset) {
    return 'Arm a one-shot resume: create a single scheduled job at ' + reset + ', or immediately if that instant has already passed, whose prompt resumes this effort from the plan doc. That job lives in this session\'s memory and dies with the session, so it resumes only if this session is still open at that instant. Say in the BLOCKED line whether you armed it.';
}

const RESUME_SESSION_UNKNOWN = "Do not arm a resume: this window's reset instant could not be read, and a resume needs one. Say so in the BLOCKED line so the operator knows to restart by hand.";

const RESUME_WEEKLY = 'Do not arm a resume. This window resets days out, and auto-resuming unattended that far ahead is not a pause. Notify the operator that the effort is held on the weekly usage barrier, then stop.';

function expectedRatchetReason(v) {
    return [
        'Held by the kit Fable ratchet: the Fable weekly window is at ' + v.percent + '%, at or past the ratchet of ' + v.ratchet + '%. ' + v.resetClause,
        '',
        'Re-dispatch this agent without the `model: "fable"` override. It runs at the session model until that window resets, and nothing else is held: only a dispatch carrying that override is refused, and work already in flight is untouched. Record the downgrade in the Chapter, naming the percent and the reset instant.',
        '',
        'Nothing is paused by this. The effort continues at the session model.',
    ].join('\n');
}

function expectedSubagentBarrier(v) {
    return [
        'Denied by the kit usage barrier: the ' + v.label + ' usage window is at ' + v.percent + '%, at or past the barrier of ' + v.barrier + '%. ' + v.resetClause + ' Subagent dispatch is held until this window resets.',
        '',
        'Do not retry this dispatch and do not reshape it. Stop the work you are doing, stage anything already complete, and return to whoever dispatched you, reporting that you stopped on the kit usage barrier and naming this window and its percent.',
        '',
        'Do not write a Chapter, do not arm a resume, and do not surface a `BLOCKED:` line. Those belong to the session that dispatched you, and it will act on your report.',
        '',
        'This is a spend control the operator armed, not an error and not a rate limit.',
    ].join('\n');
}

function expectedSubagentRatchet(v) {
    return [
        'Held by the kit Fable ratchet: the Fable weekly window is at ' + v.percent + '%, at or past the ratchet of ' + v.ratchet + '%. ' + v.resetClause,
        '',
        'Re-dispatch this agent without the `model: "fable"` override. It runs at the session model until that window resets, and nothing else is held: only a dispatch carrying that override is refused, and work already in flight is untouched. Report the downgrade to whoever dispatched you, naming the percent and the reset instant, rather than recording it yourself.',
        '',
        'Nothing is paused by this. The effort continues at the session model.',
    ].join('\n');
}

// Fixtures every "hot" case shares: an armed config and a fresh cache whose
// session window is past its barrier.
function armSessionBarrier() {
    writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, weeklyAll: { warn: 85, barrier: 95 }, fableRatchet: 85 });
    writeCache({
        session: { percent: 97.4, resetsAt: RESET_SESSION },
        weeklyAll: { percent: 17, resetsAt: RESET_WEEKLY },
        fableWeekly: { percent: 5, resetsAt: RESET_WEEKLY },
    });
}

// ---------------------------------------------------------------------------
// The barrier, deny side. Watched red before the hook existed.
// ---------------------------------------------------------------------------

test('barrier: an Agent dispatch at a session-window barrier on fresh data is denied with the exact canonical reason', () => {
    withEnv((env) => {
        armSessionBarrier();
        const reason = denyReason(runHook(env, agentPayload()));
        assert.strictEqual(reason, expectedBarrierReason({
            label: 'session (5-hour)',
            percent: 97.4,
            barrier: 95,
            resetClause: 'Resetting at ' + RESET_SESSION + '.',
            resumeStep: resumeArm(RESET_SESSION),
            blockedStep: BLOCKED_KNOWN,
        }));
        assert.strictEqual(reason.split('\n').length, 11);
        assert.ok(reason.includes('at 97.4%'), 'percents render faithfully at one decimal, never floored');
        assert.strictEqual(transportCalls(env.home), 0, 'fresh cache, no fetch');
    });
});

test('barrier: the weekly all-models window names itself and instructs no resume', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, weeklyAll: { warn: 85, barrier: 95 } });
        writeCache({
            session: { percent: 10, resetsAt: RESET_SESSION },
            weeklyAll: { percent: 96.2, resetsAt: RESET_WEEKLY },
        });
        const reason = denyReason(runHook(env, agentPayload()));
        assert.strictEqual(reason, expectedBarrierReason({
            label: 'weekly all-models',
            percent: 96.2,
            barrier: 95,
            resetClause: 'Resetting at ' + RESET_WEEKLY + '.',
            resumeStep: RESUME_WEEKLY,
            blockedStep: BLOCKED_KNOWN,
        }));
    });
});

test('barrier: a reset instant that failed validation renders the could-not-be-read clause, the no-resume step and the no-instant BLOCKED step', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, weeklyAll: { warn: 85, barrier: 95 } });
        // Reachable straight off the wire: a valid percent beside a malformed
        // resets_at. The cache door nulls the timestamp and keeps the window.
        writeCache({ session: { percent: 97.4, resetsAt: 'tomorrow (probably)' } });
        const reason = denyReason(runHook(env, agentPayload()));
        assert.strictEqual(reason, expectedBarrierReason({
            label: 'session (5-hour)',
            percent: 97.4,
            barrier: 95,
            resetClause: 'Its reset instant could not be read.',
            resumeStep: RESUME_SESSION_UNKNOWN,
            blockedStep: BLOCKED_UNKNOWN,
        }));

        // The weekly window with an unreadable instant: the fixed weekly
        // resume step plus the same no-instant BLOCKED form.
        writeCache({ weeklyAll: { percent: 96.2, resetsAt: 'sometime next week' } });
        const weekly = denyReason(runHook(env, agentPayload()));
        assert.strictEqual(weekly, expectedBarrierReason({
            label: 'weekly all-models',
            percent: 96.2,
            barrier: 95,
            resetClause: 'Its reset instant could not be read.',
            resumeStep: RESUME_WEEKLY,
            blockedStep: BLOCKED_UNKNOWN,
        }));
    });
});

test('barrier outranks the ratchet: at a barrier every Agent dispatch is denied regardless of model', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, fableRatchet: 85 });
        writeCache({
            session: { percent: 97.4, resetsAt: RESET_SESSION },
            fableWeekly: { percent: 99, resetsAt: RESET_WEEKLY },
        });
        const withFable = denyReason(runHook(env, agentPayload('fable')));
        assert.ok(withFable.startsWith('Denied by the kit usage barrier'), 'the barrier reason, not the ratchet reason');
        const withoutModel = denyReason(runHook(env, agentPayload()));
        assert.ok(withoutModel.startsWith('Denied by the kit usage barrier'));
    });
});

test('Task dispatches are guarded like Agent dispatches', () => {
    withEnv((env) => {
        armSessionBarrier();
        const payload = agentPayload();
        payload.tool_name = 'Task';
        const reason = denyReason(runHook(env, payload));
        assert.ok(reason.startsWith('Denied by the kit usage barrier'));
    });
});

test('a warn state allows dispatch: only a barrier denies', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, fableRatchet: 85 });
        // Squarely in the warn band, with a FINITE Fable percent on purpose:
        // a regression widening the barrier comparison to "not clear" would
        // fall through to the ratchet renderer, and a finite percent is what
        // makes that visible as a deny rather than swallowed by the
        // finite-at-the-door guard.
        writeCache({
            session: { percent: 85, resetsAt: RESET_SESSION },
            weeklyAll: { percent: 10, resetsAt: RESET_WEEKLY },
            fableWeekly: { percent: 5, resetsAt: RESET_WEEKLY },
        });
        assertAllow(runHook(env, agentPayload()));
        assertAllow(runHook(env, agentPayload('fable')));
    });
});

// ---------------------------------------------------------------------------
// The ratchet. Watched red before the hook existed.
// ---------------------------------------------------------------------------

test('ratchet: a fable override at or above the Fable threshold is denied; the identical dispatch without it is allowed', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({
            session: { percent: 10, resetsAt: RESET_SESSION },
            weeklyAll: { percent: 10, resetsAt: RESET_WEEKLY },
            fableWeekly: { percent: 92.6, resetsAt: RESET_WEEKLY },
        });
        const reason = denyReason(runHook(env, agentPayload('fable')));
        // 92.6 renders as itself: faithful at one decimal, neither floored
        // (which understates) nor rounded (which could overstate onto the
        // ratchet).
        assert.strictEqual(reason, expectedRatchetReason({
            percent: 92.6,
            ratchet: 85,
            resetClause: 'Resetting at ' + RESET_WEEKLY + '.',
        }));
        assert.strictEqual(reason.split('\n').length, 5);
        assertAllow(runHook(env, agentPayload()));
    });
});

test('ratchet: a Task dispatch carrying the fable override is denied too', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({ fableWeekly: { percent: 92.6, resetsAt: RESET_WEEKLY } });
        const payload = agentPayload('fable');
        payload.tool_name = 'Task';
        const reason = denyReason(runHook(env, payload));
        assert.ok(reason.startsWith('Held by the kit Fable ratchet'));
    });
});

test('ratchet: a Fable reset instant that failed validation renders the could-not-be-read clause', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({ fableWeekly: { percent: 92.6, resetsAt: 'not a timestamp' } });
        const reason = denyReason(runHook(env, agentPayload('fable')));
        assert.ok(reason.includes('Its reset instant could not be read.'));
    });
});

test('ratchet: the fable family is matched case-insensitively across payload spellings, and unrecognized models never count as fable', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({ fableWeekly: { percent: 92.6, resetsAt: RESET_WEEKLY } });

        const full = denyReason(runHook(env, agentPayload('Claude-Fable-5')));
        assert.ok(!full.includes('Claude-Fable-5'), 'the model value from tool_input never crosses into the reason');
        denyReason(runHook(env, agentPayload(' FABLE ')));

        // The 2.1.248 payload schema emits only tool_input; these two
        // spellings cannot arrive from this harness version and are kept as
        // defensive parity with docs-write-guard.js, which reads all three.
        const viaToolInput = { tool_name: 'Agent', hook_event_name: 'PreToolUse', toolInput: { model: 'fable', prompt: PROMPT_MARKER } };
        denyReason(runHook(env, viaToolInput));
        const viaToolDotInput = { tool_name: 'Agent', hook_event_name: 'PreToolUse', tool: { input: { model: 'fable', prompt: PROMPT_MARKER } } };
        denyReason(runHook(env, viaToolDotInput));

        assertAllow(runHook(env, agentPayload('sonnet')));
        assertAllow(runHook(env, agentPayload('fable5')));
        assertAllow(runHook(env, agentPayload('affable')));
    });
});

test('ratchet: an unknown Fable percent never trips a ratchet a zero percent would', () => {
    withEnv((env) => {
        // Threshold 0, not the default 85: null >= 0 coerces true, so this is
        // the one threshold where broken unknown-percent handling becomes a
        // visible deny.
        writeConfig({ enabled: true, fableRatchet: 0 });
        writeCache({ fableWeekly: { percent: 0, resetsAt: RESET_WEEKLY } });
        const reason = denyReason(runHook(env, agentPayload('fable')));
        assert.ok(reason.includes('at 0%, at or past the ratchet of 0%'), 'the zero threshold is live');

        writeCache({ fableWeekly: { resetsAt: RESET_WEEKLY } }); // percent unknown
        assertAllow(runHook(env, agentPayload('fable')));
    });
});

test('barrier: an unknown window percent never barriers at a threshold a zero percent would trip', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 0, barrier: 0 }, weeklyAll: { warn: 0, barrier: 0 } });
        writeCache({ session: { percent: 0, resetsAt: RESET_SESSION } });
        const reason = denyReason(runHook(env, agentPayload()));
        assert.ok(reason.includes('at 0%, at or past the barrier of 0%'), 'the zero threshold is live');

        writeCache({ session: { resetsAt: RESET_SESSION }, weeklyAll: { resetsAt: RESET_WEEKLY } }); // percents unknown
        assertAllow(runHook(env, agentPayload()));
    });
});

// ---------------------------------------------------------------------------
// A dispatch made INSIDE a subagent: denied the same, instructed differently.
// The caller's identity is the payload's TOP-LEVEL agent type, read with
// docs-write-guard.js's breadth; the tool_input.subagent_type every ordinary
// case above carries is the dispatch target and must not trip this.
// ---------------------------------------------------------------------------

test('a barrier deny inside a subagent gets the subagent form: no Chapter, no resume, no BLOCKED', () => {
    withEnv((env) => {
        armSessionBarrier();
        const expected = expectedSubagentBarrier({
            label: 'session (5-hour)',
            percent: 97.4,
            barrier: 95,
            resetClause: 'Resetting at ' + RESET_SESSION + '.',
        });
        const reason = denyReason(runHook(env, agentPayload(undefined, { agent_type: 'implementer-opus' })));
        assert.strictEqual(reason, expected);
        assert.strictEqual(reason.split('\n').length, 7);
        assert.ok(!reason.includes('Stop now, in this order:'), 'no orchestrator step sequence for a subagent');
        assert.ok(!reason.includes('Arm a one-shot resume'), 'a subagent never arms a resume');

        // The identity spellings docs-write-guard reads, one alternate each
        // way, plus a namespaced id: all get the subagent form.
        assert.strictEqual(denyReason(runHook(env, agentPayload(undefined, { subagentType: 'qa-verifier' }))), expected);
        assert.strictEqual(denyReason(runHook(env, agentPayload(undefined, { agentType: 'claude-kit:adversarial-reviewer' }))), expected);
    });
});

test('a ratchet deny inside a subagent reports the downgrade upward instead of recording it', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({ fableWeekly: { percent: 92.6, resetsAt: RESET_WEEKLY } });
        const reason = denyReason(runHook(env, agentPayload('fable', { agent_type: 'implementer-sonnet' })));
        assert.strictEqual(reason, expectedSubagentRatchet({
            percent: 92.6,
            ratchet: 85,
            resetClause: 'Resetting at ' + RESET_WEEKLY + '.',
        }));
        assert.strictEqual(reason.split('\n').length, 5);
        assert.ok(!reason.includes('Record the downgrade in the Chapter'), 'no Chapter bookkeeping for a subagent');
    });
});

test('a background-main "claude" caller is the main session of its job and gets the orchestrator form', () => {
    withEnv((env) => {
        armSessionBarrier();
        const reason = denyReason(runHook(env, agentPayload(undefined, { agent_type: 'claude' })));
        assert.ok(reason.includes('Stop now, in this order:'), 'the orchestrator form, not the subagent form');
        assert.strictEqual(reason.split('\n').length, 11);

        // The exemption's case-insensitivity, observed through an EMISSION
        // rather than through silence: a bare CLAUDE must get the 11-line
        // orchestrator form, where dropping the /i flag would send the 7-line
        // subagent form. Both branches deny, so the difference a regression
        // makes is in the text, and a silence-based assertion here could
        // never fail.
        const upper = denyReason(runHook(env, agentPayload(undefined, { agent_type: 'CLAUDE' })));
        assert.ok(upper.includes('Stop now, in this order:'), 'CLAUDE is the same background main as claude');
        assert.strictEqual(upper.split('\n').length, 11);
    });
});

// ---------------------------------------------------------------------------
// Allow on doubt: every branch its own case.
// ---------------------------------------------------------------------------

test('no tool other than Agent or Task is ever denied, at any threshold', () => {
    withEnv((env) => {
        armSessionBarrier();
        assertAllow(runHook(env, { tool_name: 'Bash', hook_event_name: 'PreToolUse', tool_input: { command: 'echo hi' } }));
        assertAllow(runHook(env, { hook_event_name: 'PreToolUse', tool_input: { prompt: PROMPT_MARKER } }));
        assertAllow(runHook(env, agentPayload(undefined, { tool_name: 'agent' })));
        assertAllow(runHook(env, agentPayload(undefined, { tool_name: 'AgentX' })));
    });
});

test('absent config allows at any percent', () => {
    withEnv((env) => {
        writeCache({ session: { percent: 99, resetsAt: RESET_SESSION } });
        assertAllow(runHook(env, agentPayload()));
    });
});

test('a config that does not say enabled true allows', () => {
    withEnv((env) => {
        writeCache({ session: { percent: 99, resetsAt: RESET_SESSION } });
        writeConfig({ enabled: false, session: { warn: 80, barrier: 95 } });
        assertAllow(runHook(env, agentPayload()));
        writeConfig({ enabled: 'true', session: { warn: 80, barrier: 95 } });
        assertAllow(runHook(env, agentPayload()));
    });
});

test('reader failure no-token (no credentials, no cache) allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        assertAllow(runHook(env, agentPayload()));
        assert.strictEqual(transportCalls(env.home), 0);
    });
});

test('reader failure no-token with a stale hot cache allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        assertAllow(runHook(env, agentPayload()));
        assert.strictEqual(transportCalls(env.home), 0);
    });
});

test('reader failure locked allows without touching the transport', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        writeLockFixture();
        assertAllow(runHook(env, agentPayload()));
        assert.strictEqual(transportCalls(env.home), 0, 'a lock in force means no request');
    });
});

test('reader failure expired (401) allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        assertAllow(runHook(env, agentPayload(), { mode: '401' }));
        assert.strictEqual(transportCalls(env.home), 1);
    });
});

test('reader failure rate-limited (429) allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        assertAllow(runHook(env, agentPayload(), { mode: '429' }));
    });
});

test('reader failure timeout allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        assertAllow(runHook(env, agentPayload(), { mode: 'timeout' }));
    });
});

test('reader failure parse (unusable 200) allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        assertAllow(runHook(env, agentPayload(), { mode: '200', body: 'not json at all' }));
    });
});

test('reader failure bad-call (unparsable clock seam) allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ session: { percent: 97.4, resetsAt: RESET_SESSION } });
        assertAllow(runHook(env, agentPayload(), { now: 'not-a-date' }));
    });
});

test('reader failure no-store (unwritable store) allows', (t) => {
    if (typeof process.getuid === 'function' && process.getuid() === 0) {
        t.skip('root writes everywhere, the chmod cannot bite');
        return;
    }
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        writeCache({ ageSeconds: 3000, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        const store = path.dirname(lib.usageFilePath());
        fs.chmodSync(store, 0o555);
        try {
            assertAllow(runHook(env, agentPayload()));
            assert.strictEqual(transportCalls(env.home), 0, 'no store, no request');
        } finally {
            fs.chmodSync(store, 0o700);
        }
    });
});

// ---------------------------------------------------------------------------
// The two-pass staleness protocol.
// ---------------------------------------------------------------------------

test('two-pass staleness: data older than the tightened budget allows when the re-read cannot produce fresher', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        // Age 300: fresh under the 600s read budget, stale under the 120s
        // budget the near-barrier verdict hands back. No credentials, so the
        // one permitted re-read fails and the hook must allow rather than
        // deny on data older than the budget it was handed.
        writeCache({ ageSeconds: 300, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        assertAllow(runHook(env, agentPayload()));
        assert.strictEqual(transportCalls(env.home), 0);
    });
});

test('two-pass staleness: the boundary errs stale, so data aged exactly the tightened budget does not deny', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        // Age exactly 120 against the 120s near-barrier budget: "within" is
        // strict less-than, mirroring readUsageInner's own freshness door, so
        // this must re-read (and, with no credentials, allow), never deny.
        writeCache({ ageSeconds: 120, session: { percent: 97.4, resetsAt: RESET_SESSION } });
        assertAllow(runHook(env, agentPayload()));
        assert.strictEqual(transportCalls(env.home), 0);
    });
});

test('two-pass staleness: the hook re-reads exactly once at the tighter budget and denies on the fresh verdict', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 } });
        // First pass holds age-300 data reading 99.4; the stubbed endpoint
        // answers the re-read with 96.8. A deny naming 96.8 rather than 99.4
        // is the proof the decision came from the re-read.
        writeCache({ ageSeconds: 300, session: { percent: 99.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        const reason = denyReason(runHook(env, agentPayload(), { mode: '200', body: apiBody(96.8) }));
        assert.ok(reason.includes('at 96.8%'), 'the deny reflects the re-read verdict, rendered faithfully');
        assert.ok(!reason.includes('at 99.4%'), 'not the stale first verdict');
        assert.strictEqual(transportCalls(env.home), 1, 'exactly one re-read, never a loop');
    });
});

test('two-pass staleness: a re-read that clears the deny allows', () => {
    withEnv((env) => {
        writeConfig({ enabled: true, session: { warn: 80, barrier: 95 }, fableRatchet: 85 });
        // Stale-for-the-tight-budget data says barrier; the re-read says 50.
        // The hook must re-decide on the fresh verdict and emit nothing. The
        // re-read body carries a FINITE Fable percent (5) so a regression
        // that skips the re-decision falls through to a visible ratchet deny
        // rather than being swallowed by the finite-at-the-door guard.
        writeCache({ ageSeconds: 300, session: { percent: 99.4, resetsAt: RESET_SESSION } });
        writeCredentials(env.config);
        assertAllow(runHook(env, agentPayload(), { mode: '200', body: apiBody(50) }));
        assert.strictEqual(transportCalls(env.home), 1, 'the allow came from the re-read, not from skipping it');
    });
});

// ---------------------------------------------------------------------------
// Never break a dispatch over a hook bug.
// ---------------------------------------------------------------------------

test('internal errors and malformed payloads exit 0 with no output', () => {
    withEnv((env) => {
        armSessionBarrier();
        assertAllow(runHook(env, 'this is not json {{{'));
        assertAllow(runHook(env, ''));
        assertAllow(runHook(env, '"a bare string"'));
        // tool_input as a string: the override is unreadable, so the ratchet
        // cannot fire; the barrier still can, so use a ratchet-only store.
        writeConfig({ enabled: true, fableRatchet: 85 });
        writeCache({ fableWeekly: { percent: 92.6, resetsAt: RESET_WEEKLY } });
        assertAllow(runHook(env, { tool_name: 'Agent', tool_input: 'fable' }));
    });
});

test('fractional percents and thresholds render faithfully at one decimal in the reason text', () => {
    withEnv((env) => {
        // 90.6 prints as itself. Floored it became 90 (and let 95.5-vs-95.9
        // print as reached); rounded it became 91 and overstated; the
        // faithful rule is usage-lib's formatOneDecimal, whose comment
        // carries all three reproduced defects.
        writeConfig({ enabled: true, session: { warn: 80, barrier: 90.6 } });
        writeCache({ session: { percent: 91, resetsAt: RESET_SESSION } });
        const reason = denyReason(runHook(env, agentPayload()));
        assert.ok(reason.includes('at 91%, at or past the barrier of 90.6%'));
        assert.ok(!reason.includes('at 90%'), 'the threshold is never floored away from what the operator wrote');
    });
});
