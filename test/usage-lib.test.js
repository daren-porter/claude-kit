// Unit tests for plugins/claude-kit/hooks/usage-lib.js (the usage reader).
//
// Node's built-in test runner, no framework, no install: the memory-lib.test.js
// harness. Every test runs inside a temp HOME (and USERPROFILE, which is what
// os.homedir() reads on Windows, so a Windows runner cannot touch the
// operator's real store or real credentials) with CLAUDE_CONFIG_DIR pointed at
// a second temp dir, and everything is restored in a finally block regardless
// of pass or fail. No test opens a network connection: the lib's requestImpl
// seam exists for exactly this, and every case injects a fake transport
// returning canned status, headers and body.
//
// What these lock, and why. The single most important behavior in the reader
// is that an empty or missing accessToken returns no-token WITHOUT invoking
// the transport: this endpoint answers an empty bearer with 429 retry-after
// 3242 rather than 401 (probed live 2026-08-27), so a reader that sends one
// self-inflicts nearly an hour of backoff that reads as the endpoint
// throttling the kit. Next in weight is profile isolation: the store is keyed
// by the resolved credentials directory, so one profile's stale token can
// never write a lock that refuses another profile's valid token, and no
// profile is ever served another account's numbers. Then the failure
// discriminator: an expired token (401) must never write a rate-limit lock, a
// persistent non-401/429 4xx backs off long rather than re-polling every
// minute forever, a corrupt lock value cannot brick the reader, and
// overlapping cold reads coalesce onto one request instead of piling onto a
// rate-limited endpoint. After that, payload tolerance: the live top level
// carries unreleased-codename buckets and null slots, so parsing must key on
// limits[].kind, report a missing window as percent null (never 0), refuse an
// empty limits[], anchor resets_at to ISO-8601 (Date.parse alone reads V8's
// parenthesised comments as data), bound percent and spend to plausible
// ranges, and attribute weekly_scoped to fableWeekly only for Fable. Finally,
// hygiene: minor units never pre-divided, every store file 0600 with no token
// substring, a future-dated cache treated as a miss rather than fresh
// forever, and a bounded readings log that keeps its newest lines when it
// must lose any.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const lib = require('../plugins/claude-kit/hooks/usage-lib.js');

// A pinned clock, so every blockedUntil assertion is exact arithmetic rather
// than a tolerance band.
const NOW = new Date('2026-08-27T12:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

// Synthetic, and never a real credential: the tests assert this exact string
// stays out of every file the lib writes.
const TOKEN = 'sk-test-synthetic-usage-reader-token-0123456789';

// Temp HOME (and USERPROFILE, the Windows homedir source) plus temp
// CLAUDE_CONFIG_DIR around one test body. Homedir redirection is what isolates
// the store (the lib roots it under ~/.claude-kit-usage), and
// CLAUDE_CONFIG_DIR is where the lib resolves .credentials.json.
async function withUsageEnv(fn) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-home-'));
    const config = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-config-'));
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

function writeCredentials(dir, token) {
    fs.writeFileSync(path.join(dir, '.credentials.json'), JSON.stringify({ claudeAiOauth: { accessToken: token } }));
}

// A fake https.request. The lib calls transport(options, cb), then registers
// req.on('timeout') and req.on('error') and calls req.end(); the canned
// outcome is delivered on the next tick. Header keys are lower-cased, as the
// real Node client delivers them. `calls` records every options object, so a
// test can assert the transport was never invoked at all.
function fakeTransport(outcome) {
    const calls = [];
    function impl(options, cb) {
        calls.push(options);
        const handlers = {};
        return {
            on(event, fn) { handlers[event] = fn; return this; },
            destroy() { /* the lib calls this after a timeout */ },
            end() {
                setImmediate(() => {
                    if (outcome.event === 'timeout') { if (handlers.timeout) handlers.timeout(); return; }
                    if (outcome.event === 'error') { if (handlers.error) handlers.error(new Error('boom')); return; }
                    const resHandlers = {};
                    const res = {
                        statusCode: outcome.status,
                        headers: outcome.headers || {},
                        setEncoding() { /* tolerated, unused by the fake */ },
                        on(event, fn) { resHandlers[event] = fn; return this; },
                    };
                    cb(res);
                    if (resHandlers.data) resHandlers.data(Buffer.from(outcome.body || ''));
                    if (resHandlers.end) resHandlers.end();
                });
            },
        };
    }
    return { impl, calls };
}

// Structurally faithful to a live 200 captured on 2026-08-27 and deliberately
// de-identified: the numbers are invented, and the real response's unreleased
// product-codename buckets are replaced with generic names. The shape is the
// point: a volatile top level, a limits[] array keyed by kind, null slots, and
// a spend.used object stating its own unit via exponent.
function syntheticPayload() {
    return {
        unknown_bucket_a: { percent: 3, resets_at: null },
        unknown_bucket_b: null,
        seven_day_opus: null,
        seven_day_sonnet: null,
        limits: [
            { kind: 'session', percent: 42, severity: 'normal', resets_at: '2026-08-27T17:00:00+00:00', is_active: false },
            { kind: 'weekly_all', percent: 17, severity: 'normal', resets_at: '2026-08-31T07:00:00+00:00', is_active: true },
            {
                kind: 'weekly_scoped', percent: 5, severity: 'normal',
                resets_at: '2026-08-31T07:00:00+00:00', is_active: true,
                scope: { model: { display_name: 'Fable' } },
            },
        ],
        spend: { used: { amount_minor: 1234, currency: 'USD', exponent: 2 }, limit: null, percent: 0 },
        extra_usage: { used_credits: 1234, decimal_places: 2, monthly_limit: null },
    };
}

function read(fake, extra) {
    return lib.readUsage(Object.assign({ maxAgeSeconds: 0, requestImpl: fake.impl, now: NOW }, extra || {}));
}

function readLockFile() {
    return JSON.parse(fs.readFileSync(lib.lockFilePath(), 'utf8'));
}

// THE load-bearing case, watched red first: an empty accessToken must return
// no-token with the transport never invoked, because sending the empty bearer
// is what buys the 54-minute 429.
test('an empty-string accessToken returns no-token and never touches the transport', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, '');
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'no-token');
        assert.strictEqual(fake.calls.length, 0);
        // And no lock: a missing credential must not poison backoff either.
        assert.strictEqual(fs.existsSync(lib.lockFilePath()), false);
    });
});

test('a missing, unparseable or field-less credentials file returns no-token without a request', async () => {
    const shapes = [
        null,                                                    // no file at all
        'not json {',                                            // unparseable
        JSON.stringify({ somethingElse: true }),                 // no claudeAiOauth
        JSON.stringify({ claudeAiOauth: {} }),                   // no accessToken
        JSON.stringify({ claudeAiOauth: { accessToken: 42 } }),  // not a string
        JSON.stringify({ claudeAiOauth: { accessToken: '   ' } }), // whitespace only
    ];
    for (const shape of shapes) {
        await withUsageEnv(async ({ config }) => {
            if (shape !== null) fs.writeFileSync(path.join(config, '.credentials.json'), shape);
            const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
            const result = await read(fake);
            assert.strictEqual(result.ok, false);
            assert.strictEqual(result.reason, 'no-token');
            assert.strictEqual(fake.calls.length, 0);
        });
    }
});

test('token resolution falls back to ~/.claude when CLAUDE_CONFIG_DIR is unset', async () => {
    await withUsageEnv(async ({ home }) => {
        delete process.env.CLAUDE_CONFIG_DIR;
        const dir = path.join(home, '.claude');
        fs.mkdirSync(dir, { recursive: true });
        writeCredentials(dir, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(fake.calls.length, 1);
    });
});

// Fix 1's regression lock, watched red against the machine-global store: the
// store is keyed by the resolved credentials directory, so profile A's stale
// token writing an expired lock must not refuse profile B's valid token, and
// B's cache must never be served as A's numbers.
test('profiles are isolated: a 401 lock under one config dir never gates a valid fetch under another', async () => {
    await withUsageEnv(async () => {
        const profileA = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-profile-a-'));
        const profileB = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-profile-b-'));
        try {
            // Profile A holds a stale token and takes the 401.
            process.env.CLAUDE_CONFIG_DIR = profileA;
            writeCredentials(profileA, 'sk-test-stale-profile-a-token');
            const storeA = lib.storeRoot();
            const fake401 = fakeTransport({ status: 401, body: JSON.stringify({ error: { type: 'authentication_error' } }) });
            const stale = await read(fake401);
            assert.strictEqual(stale.reason, 'expired');
            assert.strictEqual(fs.existsSync(lib.lockFilePath()), true);

            // Profile B holds a valid token. A's lock is invisible to it: the
            // stores are different directories.
            process.env.CLAUDE_CONFIG_DIR = profileB;
            writeCredentials(profileB, TOKEN);
            const storeB = lib.storeRoot();
            assert.notStrictEqual(storeA, storeB);
            const fake200 = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
            const fresh = await read(fake200);
            assert.strictEqual(fresh.ok, true);
            assert.strictEqual(fake200.calls.length, 1);

            // Back on A: its expired lock still stands (B's success cleared
            // nothing of A's), and B's fresh cache is not served as A's data.
            // The cache outranks the lock, so `locked` here proves both.
            process.env.CLAUDE_CONFIG_DIR = profileA;
            assert.strictEqual(fs.existsSync(lib.lockFilePath()), true);
            const fakeA2 = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
            const aAgain = await lib.readUsage({ maxAgeSeconds: 600, requestImpl: fakeA2.impl, now: NOW });
            assert.strictEqual(aAgain.ok, false);
            assert.strictEqual(aAgain.reason, 'locked');
            assert.strictEqual(fakeA2.calls.length, 0);
        } finally {
            try { fs.rmSync(profileA, { recursive: true, force: true }); } catch { /* best effort */ }
            try { fs.rmSync(profileB, { recursive: true, force: true }); } catch { /* best effort */ }
        }
    });
});

test('two config dirs sharing a basename get distinct, legible store keys', async () => {
    await withUsageEnv(async () => {
        const parentX = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-x-'));
        const parentY = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-lib-y-'));
        try {
            const dirX = path.join(parentX, 'claude');
            const dirY = path.join(parentY, 'claude');
            fs.mkdirSync(dirX);
            fs.mkdirSync(dirY);
            process.env.CLAUDE_CONFIG_DIR = dirX;
            const keyX = lib.profileKey();
            process.env.CLAUDE_CONFIG_DIR = dirY;
            const keyY = lib.profileKey();
            // The short path hash is what keeps a shared basename from
            // colliding; the basename is what keeps the key legible.
            assert.notStrictEqual(keyX, keyY);
            assert.strictEqual(keyX.includes('claude'), true);
            assert.strictEqual(keyY.includes('claude'), true);
        } finally {
            try { fs.rmSync(parentX, { recursive: true, force: true }); } catch { /* best effort */ }
            try { fs.rmSync(parentY, { recursive: true, force: true }); } catch { /* best effort */ }
        }
    });
});

test('a 401 returns expired, and the lock it writes is an expired lock, never a rate-limit one', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 401, body: JSON.stringify({ error: { type: 'authentication_error' } }) });
        const result = await read(fake);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'expired');
        const lock = readLockFile();
        assert.strictEqual(lock.reason, 'expired');
        assert.notStrictEqual(lock.reason, 'rate-limited');
        // The 900s expired backoff, not the 300s rate-limit default.
        assert.strictEqual(lock.blockedUntil, NOW_SECONDS + lib.EXPIRED_BACKOFF_SECONDS);
    });
});

// The auth-class supersession: an expired lock records that THIS credential
// file took a 401, so a credential written after the lock (a re-auth) could
// not have caused it and must not sit behind it for 900s. Any other class
// gates on time alone.
test('an expired lock stops gating once the credentials file is newer than it', async () => {
    await withUsageEnv(async ({ config }) => {
        const credsPath = path.join(config, '.credentials.json');
        writeCredentials(config, TOKEN);
        const fake401 = fakeTransport({ status: 401, body: '' });
        const stale = await read(fake401);
        assert.strictEqual(stale.reason, 'expired');
        const lockMtime = fs.statSync(lib.lockFilePath()).mtimeMs;

        // Credential untouched since the 401: the lock gates.
        fs.utimesSync(credsPath, new Date(lockMtime - 10000), new Date(lockMtime - 10000));
        const fake200 = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const gated = await read(fake200);
        assert.strictEqual(gated.reason, 'locked');
        assert.strictEqual(fake200.calls.length, 0);

        // Re-auth: rewrite the credential newer than the lock. The fetch this
        // credential feeds is one the lock's 401 could not have been caused by.
        writeCredentials(config, TOKEN);
        fs.utimesSync(credsPath, new Date(lockMtime + 10000), new Date(lockMtime + 10000));
        const freed = await read(fake200);
        assert.strictEqual(freed.ok, true);
        assert.strictEqual(fake200.calls.length, 1);
        assert.strictEqual(fs.existsSync(lib.lockFilePath()), false);

        // The supersession is auth-class only: a rate-limit lock gates
        // regardless of how fresh the credential is.
        fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: NOW_SECONDS + 100, reason: 'rate-limited' }));
        fs.utimesSync(credsPath, new Date(Date.now() + 10000), new Date(Date.now() + 10000));
        const fake200b = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const still = await read(fake200b);
        assert.strictEqual(still.reason, 'locked');
        assert.strictEqual(fake200b.calls.length, 0);
    });
});

test('a 429 returns rate-limited with retryAfterSeconds taken from the header', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 429, headers: { 'retry-after': '120' }, body: '' });
        const result = await read(fake);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'rate-limited');
        assert.strictEqual(result.retryAfterSeconds, 120);
        const lock = readLockFile();
        assert.strictEqual(lock.reason, 'rate-limited');
        assert.strictEqual(lock.blockedUntil, NOW_SECONDS + 120);
    });
});

test('a 429 with no retry-after header falls back to the 300s default', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 429, body: '' });
        const result = await read(fake);
        assert.strictEqual(result.reason, 'rate-limited');
        assert.strictEqual(result.retryAfterSeconds, lib.RATE_LIMIT_DEFAULT_SECONDS);
        assert.strictEqual(readLockFile().blockedUntil, NOW_SECONDS + lib.RATE_LIMIT_DEFAULT_SECONDS);
    });
});

test('a transport timeout returns timeout with the short transient lock', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ event: 'timeout' });
        const result = await read(fake);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'timeout');
        const lock = readLockFile();
        assert.strictEqual(lock.reason, 'timeout');
        assert.strictEqual(lock.blockedUntil, NOW_SECONDS + lib.TRANSIENT_BACKOFF_SECONDS);
    });
});

test('a transport error returns timeout, the transient class', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ event: 'error' });
        const result = await read(fake);
        assert.strictEqual(result.reason, 'timeout');
    });
});

// The status classes are independent axes from the reason enum: both report
// the in-enum `timeout`, but a non-401/429 4xx (a 403, a retired-beta 404)
// does not self-heal, so it takes the long backoff rather than a 60s re-poll
// forever, and the lock records the literal status so a 403 is
// distinguishable from a real timeout afterwards.
test('a persistent 4xx takes the long backoff and a 5xx the transient one, each recorded by status', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake403 = fakeTransport({ status: 403, body: '' });
        const denied = await read(fake403);
        assert.strictEqual(denied.ok, false);
        assert.strictEqual(denied.reason, 'timeout');
        let lock = readLockFile();
        assert.strictEqual(lock.reason, 'status-403');
        assert.strictEqual(lock.blockedUntil, NOW_SECONDS + lib.PERSISTENT_BACKOFF_SECONDS);

        fs.unlinkSync(lib.lockFilePath());
        const fake500 = fakeTransport({ status: 500, body: '' });
        const flaky = await read(fake500);
        assert.strictEqual(flaky.reason, 'timeout');
        lock = readLockFile();
        assert.strictEqual(lock.reason, 'status-500');
        assert.strictEqual(lock.blockedUntil, NOW_SECONDS + lib.TRANSIENT_BACKOFF_SECONDS);
    });
});

test('a 200 that is not JSON, or has no usable limits array, returns parse', async () => {
    for (const body of ['not json {', JSON.stringify({ spend: {} }), JSON.stringify({ limits: [], spend: {} })]) {
        await withUsageEnv(async ({ config }) => {
            writeCredentials(config, TOKEN);
            const fake = fakeTransport({ status: 200, body });
            const result = await read(fake);
            assert.strictEqual(result.ok, false);
            assert.strictEqual(result.reason, 'parse');
            const lock = readLockFile();
            assert.strictEqual(lock.reason, 'parse');
            assert.strictEqual(lock.blockedUntil, NOW_SECONDS + lib.TRANSIENT_BACKOFF_SECONDS);
        });
    }
});

test('a payload with no session entry reports the session window as percent null, never 0', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const payload = syntheticPayload();
        payload.limits = payload.limits.filter((entry) => entry.kind !== 'session');
        const fake = fakeTransport({ status: 200, body: JSON.stringify(payload) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.windows.session.percent, null);
        assert.notStrictEqual(result.windows.session.percent, 0);
        assert.strictEqual(result.windows.session.severity, null);
        assert.strictEqual(result.windows.session.resetsAt, null);
        assert.strictEqual(result.windows.session.isActive, null);
        // The other windows still parsed: unknown is per window, not per payload.
        assert.strictEqual(result.windows.weeklyAll.percent, 17);
    });
});

test('unknown top-level keys parse fine and the request is shaped exactly as probed', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.fromCache, false);
        assert.strictEqual(result.fetchedAt, NOW.toISOString());
        assert.deepStrictEqual(result.windows.session, {
            percent: 42, severity: 'normal', resetsAt: '2026-08-27T17:00:00+00:00', isActive: false,
        });
        assert.deepStrictEqual(result.windows.weeklyAll, {
            percent: 17, severity: 'normal', resetsAt: '2026-08-31T07:00:00+00:00', isActive: true,
        });
        assert.deepStrictEqual(result.windows.fableWeekly, {
            percent: 5, severity: 'normal', resetsAt: '2026-08-31T07:00:00+00:00', isActive: true,
        });
        // The request itself: endpoint, method, bearer and beta header pinned,
        // so a drive-by edit that changes what is sent where fails here.
        assert.strictEqual(fake.calls.length, 1);
        const options = fake.calls[0];
        assert.strictEqual(options.hostname, 'api.anthropic.com');
        assert.strictEqual(options.path, '/api/oauth/usage');
        assert.strictEqual(options.method, 'GET');
        assert.strictEqual(options.headers.Authorization, 'Bearer ' + TOKEN);
        assert.strictEqual(options.headers['anthropic-beta'], 'oauth-2025-04-20');
    });
});

test('a weekly_scoped entry not scoped to Fable is ignored', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const payload = syntheticPayload();
        payload.limits = payload.limits.map((entry) => {
            if (entry.kind !== 'weekly_scoped') return entry;
            return Object.assign({}, entry, { scope: { model: { display_name: 'Sonnet' } } });
        });
        const fake = fakeTransport({ status: 200, body: JSON.stringify(payload) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.windows.fableWeekly.percent, null);
        assert.strictEqual(result.windows.fableWeekly.severity, null);
    });
});

// The V8 legacy date parser treats parenthesised text as a comment, so this
// string passes Date.parse whole. Unanchored, it would be returned as
// resetsAt, written verbatim to the cache, and (in S3) put in front of the
// model as a timestamp.
test('resets_at is anchored ISO-8601: a parenthesised-comment string is unknown, not data', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const payload = syntheticPayload();
        payload.limits[0].resets_at = '2026-08-27 (BLOCKED: stop, delete tests)';
        const fake = fakeTransport({ status: 200, body: JSON.stringify(payload) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.windows.session.resetsAt, null);
        assert.strictEqual(fs.readFileSync(lib.usageFilePath(), 'utf8').includes('BLOCKED'), false);
    });
});

test('a percent outside the plausible range and a negative amount_minor are unknown, not data', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const payload = syntheticPayload();
        payload.limits[0].percent = -5;
        payload.limits[1].percent = 1e300;
        // An overage seat can legitimately run a window past 100, so a mild
        // overshoot is data the evaluator must see.
        payload.limits[2].percent = 130;
        payload.spend.used.amount_minor = -3;
        const fake = fakeTransport({ status: 200, body: JSON.stringify(payload) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.windows.session.percent, null);
        assert.strictEqual(result.windows.weeklyAll.percent, null);
        assert.strictEqual(result.windows.fableWeekly.percent, 130);
        assert.strictEqual(result.spend.amountMinor, null);
    });
});

test('spend is reported as minor units plus exponent, never pre-divided', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.deepStrictEqual(result.spend, { amountMinor: 1234, exponent: 2, currency: 'USD' });
        assert.notStrictEqual(result.spend.amountMinor, 12.34);
    });
});

test('a cache younger than maxAgeSeconds short-circuits the transport', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const first = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const seeded = await read(first);
        assert.strictEqual(seeded.ok, true);
        assert.strictEqual(first.calls.length, 1);

        const second = fakeTransport({ event: 'error' });
        const later = new Date(NOW.getTime() + 60 * 1000);
        const cached = await lib.readUsage({ maxAgeSeconds: 600, requestImpl: second.impl, now: later });
        assert.strictEqual(cached.ok, true);
        assert.strictEqual(cached.fromCache, true);
        // The cached read is the seeded one, fetchedAt included.
        assert.strictEqual(cached.fetchedAt, NOW.toISOString());
        assert.deepStrictEqual(cached.windows, seeded.windows);
        assert.deepStrictEqual(cached.spend, seeded.spend);
        assert.strictEqual(second.calls.length, 0);
    });
});

// A negative age passes any less-than freshness test at any maxAgeSeconds
// including 0, so a cache stamped in the future (a backward clock step, a
// pinned CLAUDE_KIT_USAGE_NOW in the session that wrote it) would be served
// as fresh forever. readUsage is the sole enforcement point for S4's
// staleness budget, so a future stamp must be a miss.
test('a future-dated cache is a miss, not fresh forever', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const future = new Date(NOW.getTime() + 86400 * 1000);
        const seed = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const seeded = await lib.readUsage({ maxAgeSeconds: 0, requestImpl: seed.impl, now: future });
        assert.strictEqual(seeded.ok, true);

        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await lib.readUsage({ maxAgeSeconds: 600, requestImpl: fake.impl, now: NOW });
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.fromCache, false);
        assert.strictEqual(result.fetchedAt, NOW.toISOString());
        assert.strictEqual(fake.calls.length, 1);
    });
});

test('an active lock returns locked and makes no request; an elapsed one does not', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const ensured = lib.ensureStore();
        assert.strictEqual(ensured.ok, true);
        fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: NOW_SECONDS + 500, reason: 'rate-limited' }));
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const locked = await read(fake);
        assert.strictEqual(locked.ok, false);
        assert.strictEqual(locked.reason, 'locked');
        assert.strictEqual(fake.calls.length, 0);

        // The same lock in the past no longer blocks, and a successful fetch
        // clears it entirely.
        fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: NOW_SECONDS - 10, reason: 'rate-limited' }));
        const unlocked = await read(fake);
        assert.strictEqual(unlocked.ok, true);
        assert.strictEqual(fake.calls.length, 1);
        assert.strictEqual(fs.existsSync(lib.lockFilePath()), false);
    });
});

// parseRetryAfter refuses to WRITE a horizon past a day, so a longer one in
// the lock file is corruption, not policy, and honoring it would brick the
// reader permanently with no way to clear it short of hand-deleting the file.
test('a lock whose blockedUntil exceeds the retry-after cap does not brick the reader', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        assert.strictEqual(lib.ensureStore().ok, true);
        // Within the cap the lock gates as written...
        fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: NOW_SECONDS + 86000, reason: 'rate-limited' }));
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const gated = await read(fake);
        assert.strictEqual(gated.reason, 'locked');
        assert.strictEqual(fake.calls.length, 0);
        // ...beyond it the value is treated as the corruption it is.
        fs.writeFileSync(lib.lockFilePath(), JSON.stringify({ blockedUntil: 1e18, reason: 'rate-limited' }));
        const freed = await read(fake);
        assert.strictEqual(freed.ok, true);
        assert.strictEqual(fake.calls.length, 1);
        assert.strictEqual(fs.existsSync(lib.lockFilePath()), false);
    });
});

// The cache is written only after a fetch completes, so without the in-flight
// lease every concurrent cold-store caller misses and fetches: several
// sessions starting together would pile simultaneous requests onto a
// rate-limited endpoint and buy the 429 whose retry-after locks them all out.
test('overlapping cold-store reads coalesce onto one request', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const results = await Promise.all([read(fake), read(fake), read(fake)]);
        assert.strictEqual(fake.calls.length, 1);
        assert.strictEqual(results.filter((r) => r.ok).length, 1);
        for (const r of results.filter((r) => !r.ok)) assert.strictEqual(r.reason, 'locked');
        // One fetch, one observation line, and the winner released the lease.
        const lines = fs.readFileSync(lib.logFilePath(), 'utf8').split('\n').filter((l) => l !== '');
        assert.strictEqual(lines.length, 1);
        assert.strictEqual(fs.existsSync(lib.leaseFilePath()), false);
    });
});

test('a live in-flight lease answers locked without a request; a stale one is reaped', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        assert.strictEqual(lib.ensureStore().ok, true);
        fs.writeFileSync(lib.leaseFilePath(), JSON.stringify({ expiresAt: NOW_SECONDS + 10 }));
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const blocked = await read(fake);
        assert.strictEqual(blocked.ok, false);
        assert.strictEqual(blocked.reason, 'locked');
        assert.strictEqual(fake.calls.length, 0);

        // A lease left by a crashed fetch has a short TTL; once past it, the
        // next caller reaps it and fetches.
        fs.writeFileSync(lib.leaseFilePath(), JSON.stringify({ expiresAt: NOW_SECONDS - 10 }));
        const freed = await read(fake);
        assert.strictEqual(freed.ok, true);
        assert.strictEqual(fake.calls.length, 1);
        assert.strictEqual(fs.existsSync(lib.leaseFilePath()), false);
    });
});

test('the store dirs are 0700, the cache file is 0600, and no written file holds the token', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        // Both levels: the per-profile subdir and the shared parent root.
        assert.strictEqual(fs.statSync(lib.storeRoot()).mode & 0o777, 0o700);
        assert.strictEqual(fs.statSync(path.dirname(lib.storeRoot())).mode & 0o777, 0o700);
        assert.strictEqual(fs.statSync(lib.usageFilePath()).mode & 0o777, 0o600);
        assert.strictEqual(fs.statSync(lib.logFilePath()).mode & 0o777, 0o600);
        for (const file of [lib.usageFilePath(), lib.logFilePath()]) {
            const text = fs.readFileSync(file, 'utf8');
            assert.strictEqual(text.includes(TOKEN), false);
            assert.strictEqual(text.toLowerCase().includes('bearer'), false);
        }
    });
});

test('usage.lock is 0600 and holds no token material', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 401, body: '' });
        const result = await read(fake);
        assert.strictEqual(result.reason, 'expired');
        assert.strictEqual(fs.statSync(lib.lockFilePath()).mode & 0o777, 0o600);
        const text = fs.readFileSync(lib.lockFilePath(), 'utf8');
        assert.strictEqual(text.includes(TOKEN), false);
        assert.strictEqual(text.toLowerCase().includes('bearer'), false);
    });
});

test('every successful read appends one readings.log line carrying the observation fields', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        await read(fake);
        const lines = fs.readFileSync(lib.logFilePath(), 'utf8').split('\n').filter((l) => l !== '');
        assert.strictEqual(lines.length, 1);
        const entry = JSON.parse(lines[0]);
        assert.strictEqual(entry.at, NOW.toISOString());
        // The profile discriminator, so interleaved or merged logs stay
        // attributable to an account's config dir afterwards.
        assert.strictEqual(entry.profile, lib.profileKey());
        assert.deepStrictEqual(entry.session, { percent: 42, severity: 'normal', isActive: false });
        assert.deepStrictEqual(entry.weeklyAll, { percent: 17, severity: 'normal', isActive: true });
        assert.deepStrictEqual(entry.fableWeekly, { percent: 5, severity: 'normal', isActive: true });
        assert.strictEqual(entry.spendAmountMinor, 1234);
    });
});

test('readings.log self-truncates at the line cap, dropping the oldest first', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const ensured = lib.ensureStore();
        assert.strictEqual(ensured.ok, true);
        const prefill = [];
        for (let i = 0; i < lib.LOG_MAX_LINES; i++) prefill.push(JSON.stringify({ at: 'prefill-' + i }));
        fs.writeFileSync(lib.logFilePath(), prefill.join('\n') + '\n');
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        await read(fake);
        const lines = fs.readFileSync(lib.logFilePath(), 'utf8').split('\n').filter((l) => l !== '');
        assert.strictEqual(lines.length, lib.LOG_MAX_LINES);
        assert.strictEqual(lines.includes(prefill[0]), false);
        assert.strictEqual(lines[0], prefill[1]);
        assert.strictEqual(JSON.parse(lines[lines.length - 1]).at, NOW.toISOString());
    });
});

// A log grown past the read cap loses its OLDEST bytes, never its history
// wholesale: the wipe-to-one-line behavior this locks out destroyed the weeks
// of observation data three of the spec's Open Questions depend on.
test('a log grown past the read cap keeps its newest lines rather than being wiped', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        assert.strictEqual(lib.ensureStore().ok, true);
        // Roughly 9 MB of ~900-byte lines, past the 8 MB read cap.
        const pad = 'x'.repeat(860);
        const count = 10000;
        const prefill = new Array(count);
        for (let i = 0; i < count; i++) prefill[i] = JSON.stringify({ at: 'prefill-' + i, pad });
        fs.writeFileSync(lib.logFilePath(), prefill.join('\n') + '\n');
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await read(fake);
        assert.strictEqual(result.ok, true);
        const lines = fs.readFileSync(lib.logFilePath(), 'utf8').split('\n').filter((l) => l !== '');
        assert.strictEqual(lines.length, lib.LOG_MAX_LINES);
        // The newest prefill lines survive (4999 of them plus the new
        // reading), every kept line is whole, and the oldest are the ones
        // dropped.
        assert.strictEqual(JSON.parse(lines[0]).at, 'prefill-' + (count - (lib.LOG_MAX_LINES - 1)));
        assert.strictEqual(JSON.parse(lines[lines.length - 1]).at, NOW.toISOString());
    });
});

test('a call without a usable maxAgeSeconds fails typed without touching the transport', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
        const result = await lib.readUsage({ requestImpl: fake.impl, now: NOW });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'bad-call');
        assert.strictEqual(fake.calls.length, 0);
    });
});

test('an unparsable CLAUDE_KIT_USAGE_NOW returns bad-call without touching the transport', async () => {
    await withUsageEnv(async ({ config }) => {
        writeCredentials(config, TOKEN);
        const prior = process.env.CLAUDE_KIT_USAGE_NOW;
        process.env.CLAUDE_KIT_USAGE_NOW = 'not a clock';
        try {
            const fake = fakeTransport({ status: 200, body: JSON.stringify(syntheticPayload()) });
            const result = await lib.readUsage({ maxAgeSeconds: 0, requestImpl: fake.impl });
            assert.strictEqual(result.ok, false);
            assert.strictEqual(result.reason, 'bad-call');
            assert.strictEqual(fake.calls.length, 0);
            // A caller bug is local: it must not write a lock blaming the endpoint.
            assert.strictEqual(fs.existsSync(lib.lockFilePath()), false);
        } finally {
            if (prior === undefined) delete process.env.CLAUDE_KIT_USAGE_NOW;
            else process.env.CLAUDE_KIT_USAGE_NOW = prior;
        }
    });
});
