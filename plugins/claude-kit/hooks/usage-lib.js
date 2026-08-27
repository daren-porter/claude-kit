// Shared library for the kit's usage awareness: the reader half.
//
// Reads Anthropic's OAuth usage endpoint (GET api.anthropic.com/api/oauth/usage
// with the harness's own OAuth bearer, probed live 2026-08-27) and normalizes
// the answer to the three windows the kit acts on (session, weeklyAll,
// fableWeekly) plus overage spend. Threshold policy and evaluation land in this
// same file in S2 of the kit-usage-awareness spec; this half only reads, caches
// and records.
//
// Token discipline. The token is resolved from the credentials directory (see
// credentialsDir for the resolution rule) at every call, never cached in
// memory across calls, never written to any file this module owns, and never
// included in a returned value or a reason string. An absent, unparseable or
// EMPTY token returns no-token without touching the network, and the empty
// case is the load-bearing one: this endpoint answers an empty bearer with
// 429 retry-after 3242 rather than 401, so a reader that sends one
// self-inflicts nearly an hour of backoff that looks exactly like the
// endpoint rate-limiting the kit. On this machine one of the three config
// profiles carries exactly that empty token, so the trap is live, not
// hypothetical.
//
// Parse discipline. The payload's top level is volatile: the live response
// carries nine buckets named for unreleased products plus null slots, so
// nothing here keys on a top-level name. The limits[] array's `kind` field is
// the parse surface (session | weekly_all | weekly_scoped, the last attributed
// to fableWeekly only when scoped to Fable), and a window with no matching
// entry reports percent null, never 0: "unknown" and "empty" are different
// answers, and a threshold evaluator that read unknown as 0 could never see a
// barrier there.
//
// Failure discipline. The reason set is a contract with the consumer hooks:
// no-token, expired, rate-limited, timeout, parse, locked, bad-call. Every
// failure is typed by what actually happened, because the classes back off
// differently and conflating them poisons the wrong thing: 401 is `expired`
// (900s quiet, never a rate-limit lock, so a stale token cannot poison
// backoff), 429 is `rate-limited` (retry-after honored, 300s default),
// transport trouble and 5xx are `timeout` (60s), an unusable 200 is `parse`
// (60s). Any other 4xx also reports the in-enum `timeout` but takes the LONG
// backoff with the literal status recorded in the lock: the reason enum and
// the backoff horizon are independent axes, and a 403 or a retired-beta 404
// does not self-heal, so re-polling it every 60s forever would hammer the
// endpoint for nothing. `locked` reports that no request was made because a
// backoff lock is in force or another caller's fetch is in flight. `bad-call`
// is the one reason outside the operational set: kit-internal misuse (no
// usable maxAgeSeconds, an unparsable clock) or an unmodeled internal error,
// returned typed rather than folded into a class that would blame the
// endpoint or the credential for a kit bug.
//
// Store. ~/.claude-kit-usage/<profile>/, where <profile> is a legible key
// derived from the RESOLVED credentials directory: its sanitized basename
// plus a short hash of the full path, so two profiles sharing a basename
// cannot collide (see profileKey). The store is per profile because the
// credential is: a machine-global store would let one profile's stale token
// write a backoff lock that refuses another profile's valid token, serve one
// account's percentages to another, and interleave several accounts in one
// log with no way to separate them afterwards. The key is the directory path
// and never the token or a hash of it, which keeps "no token material reaches
// any file" literally true; the accepted residual is that re-authenticating
// one directory as a different account mixes that directory's readings until
// the window rolls. Files: usage.json (the cached normalized read),
// usage.lock (the backoff), usage.fetching (the in-flight lease),
// readings.log (one JSON line per successful read, bounded and
// self-truncating, each line carrying the profile key as its discriminator).
// Directories are created 0700 and files 0600; as docs/security-model.md
// records for the sibling memory store, those are creation-time properties
// rather than invariants, since mkdir does not tighten an existing directory
// and open's mode is ignored for an existing file. The log exists for the
// operator and a later burn-rate projection; nothing emits it to the model,
// and it holds no token material.
//
// Node core modules only, CommonJS, zero dependencies. memory-lib.js's
// never-throws contract: every exported function degrades to a typed
// { ok: false, reason } rather than raising. A hook must never crash a session
// over a usage read.

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');

// The request, exactly as probed: 200 in ~290ms with a live token, 401 with an
// expired one, 429 with an empty bearer.
const API_HOSTNAME = 'api.anthropic.com';
const API_PATH = '/api/oauth/usage';
const OAUTH_BETA = 'oauth-2025-04-20';

// Two request bounds, because they bound different things. The socket timeout
// is INACTIVITY: it catches a dead connection but a response trickling a byte
// every few seconds keeps the socket active forever. The deadline is the
// wall-clock bound on the whole request (take-stock-nudge's RUN_BUDGET_MS
// precedent), settled as transport with the request destroyed, so a hook
// process cannot be held alive past its budget by a slow drip.
const REQUEST_TIMEOUT_MS = 5000;
const REQUEST_DEADLINE_MS = 6000;

// The live payload is a few KB; refuse to buffer a pathological response.
const RESPONSE_BODY_CAP = 512 * 1024;

// Read caps for the store's own files and the credentials file, same rationale
// as memory-lib's: bounded reads at every door.
const CREDENTIALS_READ_CAP = 64 * 1024;
const CACHE_READ_CAP = 64 * 1024;
const LOCK_READ_CAP = 4 * 1024;
const LOG_READ_CAP = 8 * 1024 * 1024;

// Backoff per failure class. The discriminator is the point: an expired token
// goes quiet for 15 minutes on its own class, and never on the rate-limit
// one. The persistent class is a non-401/429 4xx, which will not self-heal (a
// 403 needs intervention; a 404 from a retired oauth beta never comes back),
// so it backs off as long as an expired token rather than re-polling every
// minute indefinitely; 5xx and transport trouble stay on the short transient
// class because they routinely do self-heal.
const EXPIRED_BACKOFF_SECONDS = 900;
const PERSISTENT_BACKOFF_SECONDS = 900;
const RATE_LIMIT_DEFAULT_SECONDS = 300;
const TRANSIENT_BACKOFF_SECONDS = 60;
// A retry-after beyond a day is treated as a broken header rather than honored:
// a day already exceeds every window this feature watches, and an absurd value
// must not brick the reader for longer.
const RATE_LIMIT_CAP_SECONDS = 86400;

// The in-flight lease's horizon: comfortably past the request deadline, and
// short enough that a lease orphaned by a crashed fetch parks the store for
// seconds rather than minutes.
const FETCH_LEASE_TTL_SECONDS = 15;

// The observation log's bound. At one line per successful fetch on a 120-600s
// floor this is weeks of history, which is what the spec's open questions need.
const LOG_MAX_LINES = 5000;

const WINDOW_KEYS = ['session', 'weeklyAll', 'fableWeekly'];

// ---------------------------------------------------------------------------
// The store, keyed per config profile. credentialsDir and profileKey live in
// the token section below; function hoisting makes the forward use fine.
// ---------------------------------------------------------------------------

// Store root for the ACTIVE profile. Deliberately outside ~/.claude and
// ~/.claude-work for the reason memory-lib.js documents (those directories
// hold credentials); tests isolate it by pointing HOME at a temp dir.
function storeRoot() {
    return path.join(os.homedir(), '.claude-kit-usage', profileKey());
}

function usageFilePath() {
    return path.join(storeRoot(), 'usage.json');
}

function lockFilePath() {
    return path.join(storeRoot(), 'usage.lock');
}

function leaseFilePath() {
    return path.join(storeRoot(), 'usage.fetching');
}

function logFilePath() {
    return path.join(storeRoot(), 'readings.log');
}

// Create the store root (both levels) if absent, private to the operator:
// usage percentages and spend are account data, so 0700/0600 rather than
// inheriting the umask. memory-lib.js's ensureStore, same shape for the same
// reason.
function ensureStore() {
    try {
        fs.mkdirSync(storeRoot(), { recursive: true, mode: 0o700 });
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: 'cannot create store: ' + sanitize(err && err.message, 120) };
    }
}

// The clock, memory-lib's resolveNow seam under this feature's own variable so
// tests can pin time without disturbing the memory tier. An unparsable value is
// a typed failure rather than a silent fallback to the wall clock: falling back
// would answer a question nobody asked with today's date.
function resolveNow() {
    const raw = process.env.CLAUDE_KIT_USAGE_NOW;
    if (!raw || !String(raw).trim()) return { ok: true, now: new Date() };
    const parsed = new Date(String(raw).trim());
    if (Number.isNaN(parsed.getTime())) {
        return { ok: false, reason: 'CLAUDE_KIT_USAGE_NOW is not a parsable date' };
    }
    return { ok: true, now: parsed };
}

// Reduce a string to bounded printable ASCII for a reason string. Error
// messages here carry paths at most, never token material, but bounding them
// anyway is the house rule.
function sanitize(value, cap) {
    if (typeof value !== 'string') return '';
    const stripped = value.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    return cap && stripped.length > cap ? stripped.slice(0, cap) : stripped;
}

// Read a bounded prefix of a file. memory-lib's readCapped door, duplicated
// rather than required from there because that module does not export it and a
// usage reader coupling itself to the memory tier's internals would rot with
// them: open with O_NONBLOCK so a planted FIFO cannot hang a hook, confirm
// regular-file-ness on the descriptor itself (stat-then-open leaves a TOCTOU
// window), read at most `cap` bytes. The buffer is sized to the file, not the
// cap, so a small file does not cost a cap-sized zero-fill. Returns null on
// any failure.
function readCapped(file, cap) {
    let fd;
    try {
        fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch {
        return null;
    }
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile()) return null;
        const buf = Buffer.alloc(Math.min(cap, stat.size));
        const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
        let text = buf.toString('utf8', 0, bytes);
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        return { text, truncated: stat.size > bytes };
    } catch {
        return null;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Read a bounded SUFFIX of a file, newest bytes last. The observation log
// keeps its newest lines when it must lose any, so its reader takes the tail;
// memory-lib's journal reads a prefix instead because truncation THERE must be
// reported rather than absorbed, while this log absorbs it by design (the
// tail is the data worth keeping). Same descriptor discipline as readCapped.
// Returns null on any failure.
function readTailCapped(file, cap) {
    let fd;
    try {
        fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch {
        return null;
    }
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile()) return null;
        const start = Math.max(0, stat.size - cap);
        const buf = Buffer.alloc(Math.min(cap, stat.size));
        const bytes = fs.readSync(fd, buf, 0, buf.length, start);
        return { text: buf.toString('utf8', 0, bytes), truncated: start > 0 };
    } catch {
        return null;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Publish text atomically at 0600. The tmp path carries the pid, kit-goal-lib's
// idiom via memory-lib: this store is shared by every concurrent session on the
// box, so two writers must never collide on one tmp path, and 'wx' refuses a
// planted file so nothing can donate its permissions through the rename.
function publishText(file, text) {
    const ensured = ensureStore();
    if (!ensured.ok) return ensured;
    const tmp = file + '.tmp.' + process.pid;
    try {
        fs.writeFileSync(tmp, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
        fs.renameSync(tmp, file);
        return { ok: true };
    } catch (err) {
        try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
        return { ok: false, reason: 'write failed: ' + sanitize(err && err.message, 120) };
    }
}

// ---------------------------------------------------------------------------
// Token resolution. Resolved at every call, held in a local, returned to
// nobody: the caller gets a boolean-shaped answer (a string to send or null),
// and null is the no-token door that keeps the empty bearer off the wire.
// ---------------------------------------------------------------------------

// The credentials directory: $CLAUDE_CONFIG_DIR when the variable is set,
// otherwise ~/.claude. The fallback fires ONLY when the variable is unset,
// never when the named directory lacks a credentials file. The spec's phrase
// "falling back" leaves that ambiguous and this is the deliberate resolution:
// usage is per account, so falling back PAST an explicit CLAUDE_CONFIG_DIR
// would read another profile's credential and report another account's
// numbers as this one's. The cost, accepted, is that a misconfigured
// CLAUDE_CONFIG_DIR leaves the feature silently inert (every reason allows).
function credentialsDir() {
    const dir = process.env.CLAUDE_CONFIG_DIR;
    if (dir && String(dir).trim()) return String(dir).trim();
    return path.join(os.homedir(), '.claude');
}

// The store key for the active profile: the resolved credentials directory
// made legible (its basename, sanitized) and collision-proof (a short hash of
// the full resolved path, so two dirs sharing a basename cannot share a
// store). The key is derived from the directory PATH and never from the token
// or a hash of it: "no token material reaches any file" is a documented
// property in docs/security-model.md and the key lands in every store path.
function profileKey() {
    const resolved = path.resolve(credentialsDir());
    const base = path.basename(resolved)
        .replace(/^\.+/, '')
        .replace(/[^A-Za-z0-9._-]/g, '-')
        .slice(0, 40);
    const hash = crypto.createHash('sha256').update(resolved, 'utf8').digest('hex').slice(0, 8);
    return (base || 'profile') + '-' + hash;
}

function credentialsFilePath() {
    return path.join(credentialsDir(), '.credentials.json');
}

function resolveToken() {
    const read = readCapped(credentialsFilePath(), CREDENTIALS_READ_CAP);
    if (read === null || read.truncated) return null;
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    } catch {
        return null;
    }
    const token = parsed && parsed.claudeAiOauth && parsed.claudeAiOauth.accessToken;
    if (typeof token !== 'string') return null;
    const trimmed = token.trim();
    // Printable ASCII with no spaces, or it is not a token this module will put
    // in a header: beyond the empty-bearer trap, a control character in a
    // doctored credentials file must not become a header injection.
    if (!trimmed || !/^[\x21-\x7E]+$/.test(trimmed)) return null;
    return trimmed;
}

// ---------------------------------------------------------------------------
// Normalization. Field constraints applied at every door the data can enter
// by, the fetch parse and the cache read alike, so a tampered cache is held to
// the same shape as a live payload.
// ---------------------------------------------------------------------------

function normNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// A window percentage, or null. Range-bounded because finite is not the same
// as plausible: 1e300 is not "unknown", so it would sail past S2's
// unknown-never-barriers rule and trip every threshold, and -5 would read as
// clear. The upper bound is 1000 rather than 100 deliberately: an overage
// seat keeps serving past its limit, so a window can legitimately run past
// 100, and nulling a real 130 would blind the evaluator at exactly the moment
// a barrier is due.
function normPercent(value) {
    const n = normNumber(value);
    if (n === null || n < 0 || n > 1000) return null;
    return n;
}

// Spend in minor units, or null. Negative spend is not a number this feature
// can act on (S2 reads a negative DELTA as no overage, but a negative level
// is nonsense at the source).
function normAmountMinor(value) {
    const n = normNumber(value);
    if (n === null || n < 0) return null;
    return n;
}

// Bounded printable ASCII or null. severity and currency ride into the cache
// and the readings log, and S3 interpolates window values into model-facing
// text, so they are constrained at this source as well as at that door.
function normShortString(value, cap) {
    if (typeof value !== 'string' || !value || value.length > cap) return null;
    return /^[\x20-\x7E]+$/.test(value) ? value : null;
}

// An ISO-8601 timestamp or null, anchored BEFORE Date.parse: V8's legacy date
// parser treats parenthesised text as a comment, so Date.parse alone accepts
// "2026-08-27 (any free text here)" whole, and resets_at is what S3 and S4
// put in front of the model and what a resume is armed against. The anchor
// admits only date, time, optional seconds and fraction, optional zone;
// Date.parse then rejects the shapes the anchor cannot (a 60th second, a
// 13th month).
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

function normTimestamp(value) {
    const s = normShortString(value, 40);
    if (s === null || !ISO_TIMESTAMP_RE.test(s) || Number.isNaN(Date.parse(s))) return null;
    return s;
}

function windowFields(percent, severity, resetsAt, isActive) {
    return {
        percent: normPercent(percent),
        severity: normShortString(severity, 40),
        resetsAt: normTimestamp(resetsAt),
        isActive: typeof isActive === 'boolean' ? isActive : null,
    };
}

function emptyWindow() {
    return { percent: null, severity: null, resetsAt: null, isActive: null };
}

// Which window a limits[] entry feeds, or null for one this module does not
// model. kind is the whole decision, never a top-level key, and weekly_scoped
// counts only when scoped to Fable: any other scope is some other model's
// window and reporting it as Fable's would misdirect a later metered-Fable
// consumer.
function windowKeyFor(entry) {
    if (entry.kind === 'session') return 'session';
    if (entry.kind === 'weekly_all') return 'weeklyAll';
    if (entry.kind === 'weekly_scoped') {
        const name = entry.scope && entry.scope.model && entry.scope.model.display_name;
        if (name === 'Fable') return 'fableWeekly';
    }
    return null;
}

// A 200 body to { ok, windows, spend }, or { ok: false } when the body is not
// JSON or holds no usable limits array. An EMPTY limits[] is refused too: a
// 200 carrying zero windows would otherwise cache as a "successful" all-null
// read, suppress real fetches for maxAgeSeconds and pollute the observation
// log this feature exists to build. Spend is minor units plus the payload's
// own exponent, never pre-divided: the unit is stated in the data and dividing
// here would bake in an assumption the payload already answers.
function normalizeBody(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { ok: false };
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.limits) || parsed.limits.length === 0) {
        return { ok: false };
    }
    const windows = { session: emptyWindow(), weeklyAll: emptyWindow(), fableWeekly: emptyWindow() };
    for (const entry of parsed.limits) {
        if (!entry || typeof entry !== 'object') continue;
        const key = windowKeyFor(entry);
        if (!key) continue;
        windows[key] = windowFields(entry.percent, entry.severity, entry.resets_at, entry.is_active);
    }
    const spendObj = parsed.spend && typeof parsed.spend === 'object' ? parsed.spend : {};
    const used = spendObj.used && typeof spendObj.used === 'object' ? spendObj.used : {};
    const spend = {
        amountMinor: normAmountMinor(used.amount_minor),
        exponent: normNumber(used.exponent),
        currency: normShortString(used.currency, 10),
    };
    return { ok: true, windows, spend };
}

// ---------------------------------------------------------------------------
// The store's files.
// ---------------------------------------------------------------------------

// The cached read, or null when there is none worth serving. A cache that is
// missing, unparseable or misshapen is a miss, never a failure: the next fetch
// simply rewrites it.
function readCache() {
    const read = readCapped(usageFilePath(), CACHE_READ_CAP);
    if (read === null || read.truncated) return null;
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;
    if (normTimestamp(parsed.fetchedAt) === null) return null;
    const raw = parsed.windows && typeof parsed.windows === 'object' ? parsed.windows : null;
    if (!raw) return null;
    const windows = {};
    for (const key of WINDOW_KEYS) {
        const w = raw[key] && typeof raw[key] === 'object' ? raw[key] : {};
        windows[key] = windowFields(w.percent, w.severity, w.resetsAt, w.isActive);
    }
    const rawSpend = parsed.spend && typeof parsed.spend === 'object' ? parsed.spend : {};
    const spend = {
        amountMinor: normAmountMinor(rawSpend.amountMinor),
        exponent: normNumber(rawSpend.exponent),
        currency: normShortString(rawSpend.currency, 10),
    };
    return { fetchedAt: parsed.fetchedAt, windows, spend };
}

// The lock, or null when there is none in force worth honoring. A lock that
// cannot be read or parsed is treated as absent: a corrupt lock must not
// block reads until someone hand-deletes it, and the worst case of ignoring
// one is a fetch the endpoint would have refused anyway. A blockedUntil
// beyond now plus the retry-after cap is the same corruption in a different
// field: parseRetryAfter refuses to WRITE a horizon past a day, so a longer
// one was never this module's policy, and honoring it would brick the reader
// permanently. (Clamping it against the current clock instead would re-derive
// a fresh day of blockage on every read and so never expire; absent is the
// bound that heals.)
function readLock(nowSeconds) {
    const read = readCapped(lockFilePath(), LOCK_READ_CAP);
    if (read === null || read.truncated) return null;
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;
    const blockedUntil = normNumber(parsed.blockedUntil);
    if (blockedUntil === null) return null;
    if (blockedUntil > nowSeconds + RATE_LIMIT_CAP_SECONDS) return null;
    return { blockedUntil, reason: normShortString(parsed.reason, 40) };
}

// Whether an auth-class lock has been superseded by a re-auth. An `expired`
// lock records that this profile's credential took a 401 at the moment the
// lock was written; a credentials file modified AFTER that cannot have caused
// the 401, so the lock must not gate the fetch it feeds (a valid new token
// sitting out a 900s backoff it did not earn). File mtimes carry that
// ordering with no token material involved. Any stat failure keeps the lock:
// the cost of honoring a stale auth lock is bounded at 900s, and this check
// must never throw.
function authLockSuperseded() {
    try {
        const lockMtime = fs.statSync(lockFilePath()).mtimeMs;
        const credsMtime = fs.statSync(credentialsFilePath()).mtimeMs;
        return credsMtime > lockMtime;
    } catch {
        return false;
    }
}

function writeLock(blockedUntil, reason) {
    // Best effort: a lock that cannot be written costs an extra fetch on the
    // next call, which the endpoint itself will refuse if it must.
    publishText(lockFilePath(), JSON.stringify({ blockedUntil, reason }) + '\n');
}

function clearLock() {
    try {
        fs.unlinkSync(lockFilePath());
    } catch { /* absent already, which is the goal */ }
}

// The in-flight lease. The cache is written only after a fetch completes, so
// without a lease every concurrent cold-store caller misses and fetches:
// several sessions starting together (these hooks run on session-start and
// per-tool-call paths) would pile simultaneous requests onto a rate-limited
// endpoint and buy the 429 whose retry-after then locks them all out. One
// caller takes the lease ('wx' refuses an existing file, which is the whole
// mechanism), the rest report locked and serve nothing, and the short TTL
// means a lease orphaned by a crashed fetch parks the store for seconds. A
// store that cannot be created yields the lease-less fetch rather than a
// refusal: coalescing is an optimization and must not fail a read closed.
function acquireLease(nowSeconds) {
    if (!ensureStore().ok) return 'acquired';
    const file = leaseFilePath();
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            fs.writeFileSync(file, JSON.stringify({ expiresAt: nowSeconds + FETCH_LEASE_TTL_SECONDS }) + '\n', {
                encoding: 'utf8', mode: 0o600, flag: 'wx',
            });
            return 'acquired';
        } catch { /* exists (held) or unwritable; inspect below */ }
        const read = readCapped(file, LOCK_READ_CAP);
        if (read === null) return 'busy';
        let parsed = null;
        try {
            parsed = JSON.parse(read.text);
        } catch { /* corrupt lease, reaped below */ }
        const expiresAt = parsed && typeof parsed === 'object' ? normNumber(parsed.expiresAt) : null;
        if (expiresAt !== null && expiresAt > nowSeconds) return 'busy';
        // Expired or corrupt: a crashed fetch left it. Reap and retry once.
        try {
            fs.unlinkSync(file);
        } catch {
            return 'busy';
        }
    }
    return 'busy';
}

function releaseLease() {
    try {
        fs.unlinkSync(leaseFilePath());
    } catch { /* already gone */ }
}

function logWindow(w) {
    return { percent: w.percent, severity: w.severity, isActive: w.isActive };
}

// One observation line per successful read, carrying the profile key so
// interleaved or merged logs stay attributable to an account's config dir.
// O_APPEND with O_NONBLOCK and a regular-file check on the descriptor:
// memory-lib's appendApplied door, for the same reasons (whole-line appends
// are atomic under concurrency, and a planted FIFO cannot hang a hook). Best
// effort throughout: the log is observational and must never fail the read
// that fed it.
function appendReading(fetchedAt, windows, spend) {
    if (!ensureStore().ok) return;
    const line = JSON.stringify({
        at: fetchedAt,
        profile: profileKey(),
        session: logWindow(windows.session),
        weeklyAll: logWindow(windows.weeklyAll),
        fableWeekly: logWindow(windows.fableWeekly),
        spendAmountMinor: spend.amountMinor,
    });
    let fd;
    try {
        fd = fs.openSync(
            logFilePath(),
            fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NONBLOCK,
            0o600,
        );
    } catch {
        return;
    }
    try {
        if (!fs.fstatSync(fd).isFile()) return;
        fs.writeSync(fd, line + '\n');
    } catch {
        return;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
    trimLog();
}

// Bound the log after every append rather than behind a size gate: a
// successful fetch happens at most every couple of minutes, re-reading a
// megabyte-scale file is cheap at that cadence, and one unconditional path
// cannot rot behind a gate nothing exercises. The read takes the TAIL, so a
// file grown past the cap loses its oldest bytes and keeps its newest: the
// first line of a mid-file tail may be a fragment and is dropped, and the
// newest LOG_MAX_LINES survive. (The prior draft restarted a past-cap file
// from the single just-appended line, which wiped the weeks of observation
// history three of the spec's Open Questions depend on.) An append landing
// between this read and the rename is lost; the log is observational and that
// trade is taken knowingly.
function trimLog() {
    const read = readTailCapped(logFilePath(), LOG_READ_CAP);
    if (read === null) return;
    let lines = read.text.split('\n').filter((l) => l !== '');
    if (read.truncated) {
        lines = lines.slice(1);
        publishText(logFilePath(), lines.slice(-LOG_MAX_LINES).join('\n') + '\n');
        return;
    }
    if (lines.length <= LOG_MAX_LINES) return;
    publishText(logFilePath(), lines.slice(-LOG_MAX_LINES).join('\n') + '\n');
}

// ---------------------------------------------------------------------------
// The fetch. requestImpl is the injectable transport (https.request's shape)
// so tests exercise every failure class with no network; the default is the
// real thing. Resolves to { kind: 'response', status, headers, body } or
// { kind: 'transport' }, and never rejects.
// ---------------------------------------------------------------------------

function fetchUsage(token, transport) {
    return new Promise((resolve) => {
        let settled = false;
        let deadline = null;
        const done = (outcome) => {
            if (settled) return;
            settled = true;
            if (deadline !== null) clearTimeout(deadline);
            resolve(outcome);
        };
        let req;
        try {
            req = transport({
                hostname: API_HOSTNAME,
                path: API_PATH,
                method: 'GET',
                headers: { Authorization: 'Bearer ' + token, 'anthropic-beta': OAUTH_BETA },
                timeout: REQUEST_TIMEOUT_MS,
            }, (res) => {
                const chunks = [];
                let size = 0;
                res.on('data', (chunk) => {
                    if (settled) return;
                    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
                    size += buf.length;
                    if (size > RESPONSE_BODY_CAP) {
                        // A response this large is not the usage payload;
                        // refusing to buffer it is a transport-class failure.
                        done({ kind: 'transport' });
                        try { req.destroy(); } catch { /* already gone */ }
                        return;
                    }
                    chunks.push(buf);
                });
                res.on('end', () => done({
                    kind: 'response',
                    status: res.statusCode,
                    headers: res.headers || {},
                    body: Buffer.concat(chunks).toString('utf8'),
                }));
                res.on('error', () => done({ kind: 'transport' }));
            });
        } catch {
            return done({ kind: 'transport' });
        }
        if (!settled) {
            // The whole-request deadline; the socket timeout below only
            // catches inactivity. unref so the timer alone cannot hold the
            // hook's process alive.
            deadline = setTimeout(() => {
                done({ kind: 'transport' });
                try { req.destroy(); } catch { /* already gone */ }
            }, REQUEST_DEADLINE_MS);
            if (typeof deadline.unref === 'function') deadline.unref();
        }
        try {
            req.on('timeout', () => {
                done({ kind: 'transport' });
                // The timeout event does not destroy the socket on its own; a
                // request left open would hold the hook's process alive.
                try { req.destroy(); } catch { /* already gone */ }
            });
            req.on('error', () => done({ kind: 'transport' }));
            req.end();
        } catch {
            done({ kind: 'transport' });
        }
    });
}

// retry-after in whole seconds, defaulted when absent or unparseable and
// capped at a day. A zero or negative value takes the default too: "retry
// immediately" from a 429 is a header this module does not believe.
function parseRetryAfter(headers) {
    const raw = headers && headers['retry-after'];
    if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return RATE_LIMIT_DEFAULT_SECONDS;
    const seconds = Number(raw.trim());
    if (!Number.isFinite(seconds) || seconds <= 0) return RATE_LIMIT_DEFAULT_SECONDS;
    return Math.min(seconds, RATE_LIMIT_CAP_SECONDS);
}

// ---------------------------------------------------------------------------
// The read.
// ---------------------------------------------------------------------------

// Read current usage, from cache when it is fresh enough and from the endpoint
// otherwise. Options:
//   maxAgeSeconds  required; a cache younger than this is served with no
//                  request made
//   requestImpl    injectable transport, defaulting to https.request
//   now            optional Date, overriding the CLAUDE_KIT_USAGE_NOW seam
// Returns { ok: true, fetchedAt, fromCache, windows, spend } or { ok: false,
// reason } with retryAfterSeconds present only for 'rate-limited'. Never
// throws.
async function readUsage(opts) {
    try {
        return await readUsageInner(opts || {});
    } catch {
        // Unreachable by design (every operation above degrades typed), but
        // the contract is never-throws. An internal throw is a kit bug, not a
        // statement about the endpoint or the credential, so it takes
        // bad-call like every other kit-internal misreport; folding it into
        // timeout would blame the network for local code. No lock: the
        // failure is local.
        return { ok: false, reason: 'bad-call' };
    }
}

async function readUsageInner(opts) {
    if (typeof opts.maxAgeSeconds !== 'number' || !Number.isFinite(opts.maxAgeSeconds) || opts.maxAgeSeconds < 0) {
        return { ok: false, reason: 'bad-call' };
    }
    let now;
    if (opts.now !== undefined) {
        if (!(opts.now instanceof Date) || Number.isNaN(opts.now.getTime())) return { ok: false, reason: 'bad-call' };
        now = opts.now;
    } else {
        const clock = resolveNow();
        if (!clock.ok) return { ok: false, reason: 'bad-call' };
        now = clock.now;
    }
    const nowSeconds = Math.floor(now.getTime() / 1000);

    // The cache outranks the lock: a fresh cache with a lock in force serves
    // the data it has, because the lock only says "do not fetch". A NEGATIVE
    // age is a miss, not freshness: a future-dated fetchedAt (a backward
    // clock step, a pinned test clock in the session that wrote it) passes
    // any less-than check at any maxAgeSeconds including 0, and this line is
    // the sole enforcement point for S4's staleness budget.
    const cached = readCache();
    if (cached) {
        const ageMs = now.getTime() - Date.parse(cached.fetchedAt);
        if (ageMs >= 0 && ageMs < opts.maxAgeSeconds * 1000) {
            return { ok: true, fetchedAt: cached.fetchedAt, fromCache: true, windows: cached.windows, spend: cached.spend };
        }
    }

    const lock = readLock(nowSeconds);
    if (lock && lock.blockedUntil > nowSeconds) {
        // The reason class matters: an expired (auth-class) lock does not
        // gate a fetch it could not have caused, which is any fetch fed by a
        // credential written after the lock. Every other class gates on time
        // alone.
        if (!(lock.reason === 'expired' && authLockSuperseded())) {
            return { ok: false, reason: 'locked' };
        }
    }

    // Resolved here, after the cache short-circuit, and held only in this
    // local: a fresh cache needs no credential at all.
    const token = resolveToken();
    if (token === null) return { ok: false, reason: 'no-token' };

    if (acquireLease(nowSeconds) !== 'acquired') return { ok: false, reason: 'locked' };
    try {
        const transport = opts.requestImpl || https.request;
        const outcome = await fetchUsage(token, transport);

        if (outcome.kind !== 'response') {
            writeLock(nowSeconds + TRANSIENT_BACKOFF_SECONDS, 'timeout');
            return { ok: false, reason: 'timeout' };
        }
        if (outcome.status === 401) {
            writeLock(nowSeconds + EXPIRED_BACKOFF_SECONDS, 'expired');
            return { ok: false, reason: 'expired' };
        }
        if (outcome.status === 429) {
            const retryAfterSeconds = parseRetryAfter(outcome.headers);
            writeLock(nowSeconds + retryAfterSeconds, 'rate-limited');
            return { ok: false, reason: 'rate-limited', retryAfterSeconds };
        }
        if (outcome.status !== 200) {
            // Reported as the in-enum timeout either way, but backed off by
            // what the status says about persistence: a non-401/429 4xx does
            // not self-heal (a retired oauth beta answers 404 until someone
            // ships a fix), so it takes the long class rather than a 60s
            // re-poll forever, while 5xx and oddities stay transient. The
            // lock records the literal status so a 403 is distinguishable
            // from a real timeout afterwards.
            const status = Number.isInteger(outcome.status) ? outcome.status : 0;
            const persistent = status >= 400 && status < 500;
            writeLock(
                nowSeconds + (persistent ? PERSISTENT_BACKOFF_SECONDS : TRANSIENT_BACKOFF_SECONDS),
                'status-' + status,
            );
            return { ok: false, reason: 'timeout' };
        }
        const normalized = normalizeBody(outcome.body);
        if (!normalized.ok) {
            writeLock(nowSeconds + TRANSIENT_BACKOFF_SECONDS, 'parse');
            return { ok: false, reason: 'parse' };
        }

        const fetchedAt = now.toISOString();
        // All three writes are best effort: the fetched data is good, and a
        // disk hiccup in the bookkeeping must not turn a successful read into
        // a failure.
        publishText(usageFilePath(), JSON.stringify({ fetchedAt, windows: normalized.windows, spend: normalized.spend }) + '\n');
        clearLock();
        appendReading(fetchedAt, normalized.windows, normalized.spend);
        return { ok: true, fetchedAt, fromCache: false, windows: normalized.windows, spend: normalized.spend };
    } finally {
        releaseLease();
    }
}

module.exports = {
    readUsage,
    storeRoot,
    profileKey,
    ensureStore,
    resolveNow,
    usageFilePath,
    lockFilePath,
    leaseFilePath,
    logFilePath,
    LOG_MAX_LINES,
    EXPIRED_BACKOFF_SECONDS,
    PERSISTENT_BACKOFF_SECONDS,
    RATE_LIMIT_DEFAULT_SECONDS,
    TRANSIENT_BACKOFF_SECONDS,
    FETCH_LEASE_TTL_SECONDS,
};
