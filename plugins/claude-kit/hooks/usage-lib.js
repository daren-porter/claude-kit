// Shared library for the kit's usage awareness: the reader and the threshold
// policy it feeds.
//
// Reads Anthropic's OAuth usage endpoint (GET api.anthropic.com/api/oauth/usage
// with the harness's own OAuth bearer, probed live 2026-08-27) and normalizes
// the answer to the three windows the kit acts on (session, weeklyAll,
// fableWeekly) plus overage spend. The second half is the threshold policy:
// the operator's config, the verdict S3's wind-down text and S4's dispatch
// barrier act on. It issues no request and calls no reader entry point (it does
// share this file's normalizers and its clock seam); it answers about a read
// the caller already holds.
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
// no-token, expired, rate-limited, timeout, parse, locked, no-store and
// bad-call. Every failure is typed by what actually happened, because the
// classes back off differently and conflating them poisons the wrong thing:
// 401 is `expired`
// (900s quiet, never a rate-limit lock, so a stale token cannot poison
// backoff), 429 is `rate-limited` (retry-after honored, 300s default),
// transport trouble and 5xx are `timeout` (60s), an unusable 200 is `parse`
// (60s). Any other 4xx also reports the in-enum `timeout` but takes the LONG
// backoff with the literal status recorded in the lock: the reason enum and
// the backoff horizon are independent axes, and a 403 or a retired-beta 404
// does not self-heal, so re-polling it every 60s forever would hammer the
// endpoint for nothing. `locked` reports that no request was made because a
// backoff lock is in force. `no-store` reports that the store could not be
// created or written, so no backoff could be held and no request was made:
// fetching without a place to record the result is what earns the 429.
// `bad-call` is the one reason outside the operational set: kit-internal
// misuse (no usable maxAgeSeconds, an unparsable clock) or an unmodeled
// internal error, returned typed rather than folded into a class that would
// blame the endpoint or the credential for a kit bug.
//
// NOT guarded, and deliberately: concurrent readers. Request coalescing was
// built here and removed, because a lease that makes the loser wait or go
// without adds failure modes of its own, and both of the ones it added were a
// permanent brick. So several sessions starting at once each issue their own
// request, once per staleness window, and readings.log gains a line for each.
// That cost is accepted rather than overlooked: the sequential amplification
// `no-store` prevents is unbounded, while this one is bounded by the number of
// simultaneous session starts.
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
// the window rolls. Files, and the module writes exactly these three:
// usage.json (the cached normalized read), usage.lock (the backoff) and
// readings.log (one JSON line per successful FETCH, never a cache hit, bounded
// and self-truncating, each line carrying the profile key as its
// discriminator). A fourth file deliberately sits OUTSIDE the profile
// directory, in its shared parent: ~/.claude-kit-usage/config.json holds the
// operator's thresholds, which are a policy preference rather than an account
// fact, so a profile switch must not switch the policy with it. That one the
// OPERATOR writes by hand and the kit only ever reads, so its mode is not this
// module's to set. The three the module does write are created 0600 inside
// directories created 0700; as docs/security-model.md records for the sibling
// memory store, those are creation-time properties rather than invariants,
// since mkdir does not tighten an existing directory and open's mode is
// ignored for an existing file. The log exists for the operator and a later
// burn-rate projection; nothing emits it to the model, and it holds no token
// material.
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
// A retry-after AT or beyond a day is treated as a broken header rather than
// honored: a day already exceeds every window this feature watches, and an
// absurd value must not brick the reader for longer. This same constant is
// readLock's corruption horizon, which is why the absurd class is REFUSED here
// rather than clamped to the cap: clamping wrote a horizon sitting exactly on
// the guard, where a one-second backward clock step makes the next read
// discard the lock as corruption and immediately re-request the endpoint that
// just rate-limited us. Refusing keeps every horizon this module writes well
// inside the horizon it will later read.
const RATE_LIMIT_CAP_SECONDS = 86400;


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
    } catch (err) {
        return { ok: false, reason: 'cannot create store: ' + sanitize(err && err.message, 120) };
    }
    // mkdirSync with recursive succeeds on an EXISTING directory even when it
    // is read-only, on a full filesystem, or owned by another user, so
    // creatability is not writability and only a write proves the store can
    // hold a backoff. The probe is paid only on the paths that are about to
    // write anyway.
    // 'wx' and not 'w': the store's 0700 is a creation-time property rather
    // than an invariant (see the header), and 'w' follows a symlink and
    // truncates whatever it points at. publishText uses 'wx' for exactly this
    // reason. An EEXIST is our own orphaned probe, so clear it and retry once.
    const probe = path.join(storeRoot(), '.writable-' + process.pid);
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            fs.writeFileSync(probe, '', { mode: 0o600, flag: 'wx' });
            try { fs.unlinkSync(probe); } catch { /* the write is what mattered */ }
            return { ok: true };
        } catch (err) {
            if (err && err.code === 'EEXIST' && attempt === 0) {
                try { fs.unlinkSync(probe); } catch { /* refuted below */ }
                continue;
            }
            return { ok: false, reason: 'store not writable: ' + sanitize(err && err.message, 120) };
        }
    }
    return { ok: false, reason: 'store not writable: probe could not be placed' };
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
        // Whether the window opened on a line boundary decides if its first
        // line is a whole record or the tail of one, which is the difference
        // between keeping a good line and keeping a fragment.
        let startedOnBoundary = start === 0;
        if (start > 0) {
            const probe = Buffer.alloc(1);
            const got = fs.readSync(fd, probe, 0, 1, start - 1);
            startedOnBoundary = got === 1 && probe[0] === 0x0a;
        }
        // shortRead is reported apart from `truncated`, which means "the
        // window skipped older bytes": a read that came up short is an
        // incomplete tail instead, and trimLog writes this text back over the
        // log, so collapsing the two would let an incomplete tail become the
        // log. readCapped reports the same condition through its own truncated
        // flag, where nothing rewrites the file. Unreachable for a pread of a
        // local regular file, so this arm is reported for symmetry rather than
        // pinned by a test.
        return {
            text: buf.toString('utf8', 0, bytes),
            truncated: start > 0,
            shortRead: bytes < buf.length,
            startedOnBoundary,
        };
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
    const raw = process.env.CLAUDE_CONFIG_DIR;
    const named = raw && String(raw).trim() ? String(raw).trim() : path.join(os.homedir(), '.claude');
    // Resolved HERE and nowhere else, so every derived path agrees within a
    // call. A relative CLAUDE_CONFIG_DIR would otherwise resolve against the
    // hook's cwd, which is the project directory: that makes a repo-local
    // .credentials.json the Bearer token, and it scatters the store one per
    // repo so the backoff lock never applies across sessions. realpath also
    // collapses a symlinked config dir onto a single store; it throws when the
    // directory does not exist yet, and path.resolve is the fallback because a
    // store key must stay derivable even then.
    const resolved = path.resolve(named);
    try {
        return fs.realpathSync(resolved);
    } catch {
        return resolved;
    }
}

// The store key for the active profile: the resolved credentials directory
// made legible (its basename, sanitized) and collision-proof (a short hash of
// the full resolved path, so two dirs sharing a basename cannot share a
// store). The key is derived from the directory PATH and never from the token
// or a hash of it: "no token material reaches any file" is a documented
// property in docs/security-model.md and the key lands in every store path.
function profileKey() {
    const resolved = credentialsDir();
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

// A relative CLAUDE_CONFIG_DIR cannot identify a profile: both the credential
// and the store key would depend on the directory the hook happened to fire
// in, so one configured value would mean a different account per repo, and a
// repo-local .claude/.credentials.json arriving in a clone would become the
// Bearer token. Refused rather than resolved, and refused as no-token, which
// every consumer already treats as allow.
function configDirUsable() {
    const raw = process.env.CLAUDE_CONFIG_DIR;
    if (!raw || !String(raw).trim()) return true;
    return path.isAbsolute(String(raw).trim());
}

function resolveToken() {
    if (!configDirUsable()) return null;
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

// Spend in minor units, or null. This is a cumulative LEVEL rather than a
// delta, so a value below zero is a malformed payload rather than a credit
// anything here could act on, and it rides into the cache and the reading log
// where every later reader would have to defend against it again.
function normAmountMinor(value) {
    const n = normNumber(value);
    // A ceiling as well as a floor: finite is not the same as plausible, and
    // this rides into the cache and the reading log. Number.MAX_SAFE_INTEGER
    // is the bound past which the value stops being an exact integer anyway.
    if (n === null || n < 0 || n > Number.MAX_SAFE_INTEGER) return null;
    return n;
}

// The exponent is a UNIT MULTIPLIER for amountMinor rather than a value to
// compare, so an implausible one is worse than an implausible percent: a
// consumer computing amountMinor / 10 ** exponent gets 0 or Infinity from a
// payload that claims a real amount. Observed value is 2 (cents).
function normExponent(value) {
    const n = normNumber(value);
    if (n === null || !Number.isInteger(n) || n < 0 || n > 6) return null;
    return n;
}

// severity and currency are short tokens that S3 interpolates into
// model-facing text. A printable-ASCII shape check admits spaces and
// punctuation; this admits only token characters, which stays tolerant of
// values the server has not shipped yet (the payload is volatile) while
// leaving nothing that could read as prose or markup at the emission door.
function normToken(value, cap) {
    if (typeof value !== 'string' || !value || value.length > cap) return null;
    return /^[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

// Bounded printable ASCII or null. The lock reason and the timestamp door ride into the cache
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
// The zone is REQUIRED, not optional. Without it Date.parse reads the value as
// LOCAL time, so the same payload yields a reset instant up to fourteen hours
// out depending on the reader's TZ, and this value is what a resume is armed
// against.
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

function normTimestamp(value) {
    const s = normShortString(value, 40);
    if (s === null || !ISO_TIMESTAMP_RE.test(s) || Number.isNaN(Date.parse(s))) return null;
    return s;
}

function windowFields(percent, severity, resetsAt, isActive) {
    return {
        percent: normPercent(percent),
        severity: normToken(severity, 40),
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
    // All three shapes are the same event, a server-side change to the payload,
    // and none of them self-heals. Splitting them across backoff classes would
    // leave two of the three re-polling a rate-limited endpoint forever, which
    // is the mistake the 4xx class already exists to avoid.
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.limits) || parsed.limits.length === 0) {
        return { ok: false, persistent: true };
    }
    const windows = { session: emptyWindow(), weeklyAll: emptyWindow(), fableWeekly: emptyWindow() };
    const seen = new Set();
    for (const entry of parsed.limits) {
        if (!entry || typeof entry !== 'object') continue;
        const key = windowKeyFor(entry);
        if (!key) continue;
        // First match wins. The payload is volatile enough to grow a second
        // entry per kind, and last-wins would silently replace a real reading
        // with whatever trailed it; first-wins is at least deterministic.
        if (seen.has(key)) continue;
        seen.add(key);
        windows[key] = windowFields(entry.percent, entry.severity, entry.resets_at, entry.is_active);
    }
    // A limits[] carrying no recognized kind is the volatile-payload case this
    // file's header opens by warning about, and it fails exactly the way an
    // empty array would: an all-null "success" that caches, suppresses real
    // fetches for the staleness window, pollutes the observation log, and
    // reads to S2's unknown-never-barriers rule as a clear account when the
    // account may be saturated. Treated as a parse failure for that reason.
    if (seen.size === 0) return { ok: false, persistent: true };
    const kinds = Array.from(seen);
    const spendObj = parsed.spend && typeof parsed.spend === 'object' ? parsed.spend : {};
    const used = spendObj.used && typeof spendObj.used === 'object' ? spendObj.used : {};
    const spend = {
        amountMinor: normAmountMinor(used.amount_minor),
        exponent: normExponent(used.exponent),
        currency: normToken(used.currency, 10),
    };
    return { ok: true, windows, spend, kinds };
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
        exponent: normExponent(rawSpend.exponent),
        currency: normToken(rawSpend.currency, 10),
    };
    // The SAME question the wire door asks, not a similar one. Refusing on
    // "every percent is null" instead would discard a cache the wire door had
    // just accepted (recognized kinds whose percents are genuinely unknown),
    // and since a 200 clears the lock nothing would stop the refetch: the
    // staleness budget would be defeated on every call rather than honored.
    const kinds = Array.isArray(parsed.kinds) ? parsed.kinds.filter((k) => WINDOW_KEYS.includes(k)) : [];
    if (kinds.length === 0) return null;
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
    return { blockedUntil, reason: normShortString(parsed.reason, 40), credsMtimeMs: normNumber(parsed.credsMtimeMs) };
}

// Whether an auth-class lock has been superseded by a re-auth. An `expired`
// lock records that this profile's credential took a 401 at the moment the
// lock was written; a credentials file modified AFTER that cannot have caused
// the 401, so the lock must not gate the fetch it feeds (a valid new token
// sitting out a 900s backoff it did not earn). File mtimes carry that
// ordering with no token material involved. Any stat failure keeps the lock:
// the cost of honoring a stale auth lock is bounded at 900s, and this check
// must never throw.
function credentialsMtimeMs() {
    try {
        return fs.statSync(credentialsFilePath()).mtimeMs;
    } catch {
        return null;
    }
}

// Has the credential been rewritten since this auth lock was taken? A lock
// written before the snapshot existed, or a credentials file that cannot be
// stat'd, both answer no and keep the lock: the pre-existing 900s wait is the
// safe direction, and a missing credential is a no-token condition rather than
// grounds to retry a 401.
function authLockSuperseded(lock) {
    if (!lock || lock.credsMtimeMs === null) return false;
    const current = credentialsMtimeMs();
    if (current === null) return false;
    return current > lock.credsMtimeMs;
}

function writeLock(blockedUntil, reason, credsMtimeMs) {
    // Best effort: a lock that cannot be written costs an extra fetch on the
    // next call, which the endpoint itself will refuse if it must.
    const payload = { blockedUntil, reason };
    // An auth-class lock carries the credential's mtime AS OF THE LOCK. The
    // supersession test then asks "did the credential change since the lock",
    // which is a question about one file compared with itself, so the wall
    // clock's direction cannot make it true forever. Comparing the credential
    // against the LOCK's own mtime instead would do exactly that: a credentials
    // file stamped ahead of the clock (a backward NTP step, rsync -t, a restore
    // from a faster machine) would supersede every auth lock forever and defeat
    // this backoff entirely.
    if (reason === 'expired' && credsMtimeMs !== null && credsMtimeMs !== undefined) {
        payload.credsMtimeMs = credsMtimeMs;
    }
    publishText(lockFilePath(), JSON.stringify(payload) + '\n');
}

function clearLock() {
    try {
        fs.unlinkSync(lockFilePath());
    } catch { /* absent already, which is the goal */ }
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
    // The only thing done with this text is write it back, so an incomplete
    // tail is refused rather than absorbed: rewriting the log from bytes that
    // came up short would drop the newest record. Leaving the log unbounded
    // for one append is the safe direction.
    if (read === null || read.shortRead) return;
    let lines = read.text.split('\n');
    if (read.truncated) {
        // Split BEFORE filtering: a window opening exactly on a record's
        // terminating newline yields an empty leading element, and filtering
        // first would remove it so the slice below would eat a whole record
        // instead of a fragment. A window with no newline at all holds no
        // complete record to keep.
        if (read.text.indexOf('\n') === -1) lines = [];
        else if (!read.startedOnBoundary && lines[0] !== '') lines = lines.slice(1);
        lines = lines.filter((l) => l !== '');
        publishText(logFilePath(), lines.slice(-LOG_MAX_LINES).join('\n') + '\n');
        return;
    }
    lines = lines.filter((l) => l !== '');
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
                res.on('end', () => done(res.complete === false ? { kind: 'transport' } : {
                    kind: 'response',
                    status: res.statusCode,
                    headers: res.headers || {},
                    body: Buffer.concat(chunks).toString('utf8'),
                }));
                res.on('error', () => done({ kind: 'transport' }));
            });
        } catch {
            // No destroy here: req is assigned by the very expression that
            // throws, so on this path it does not exist yet. The trailing catch
            // below is the opposite case and does destroy.
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

// retry-after in whole seconds, or the default. Absent, unparseable, zero or
// negative, and a day or longer all take the default: "retry immediately" from
// a 429 is a header this module does not believe, and neither is "come back
// tomorrow" (RATE_LIMIT_CAP_SECONDS carries why that class is refused rather
// than clamped to the cap).
function parseRetryAfter(headers) {
    const raw = headers && headers['retry-after'];
    if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return RATE_LIMIT_DEFAULT_SECONDS;
    const seconds = Number(raw.trim());
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds >= RATE_LIMIT_CAP_SECONDS) {
        return RATE_LIMIT_DEFAULT_SECONDS;
    }
    return seconds;
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
    // Before the cache, not just before the credential: a relative
    // CLAUDE_CONFIG_DIR also picks which store's cache is served, so gating it
    // only at token resolution would let one repo serve another's numbers from
    // disk while reporting no-token once that cache went stale.
    if (!configDirUsable()) return { ok: false, reason: 'no-token' };
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

    // Resolved here, after the cache short-circuit, and held only in this
    // local: a fresh cache needs no credential at all. This runs BEFORE the
    // lock check so that a missing or empty credential reports the condition
    // that is actually true: a lock in force would otherwise mask it as
    // 'locked', which reads as transient to a consumer and never self-clears.
    // Stat BEFORE the read, not after: a refresh landing between the two would
    // otherwise stamp the lock with the new credential's mtime while the old
    // token is what took the 401.
    const tokenMtimeMs = credentialsMtimeMs();
    const token = resolveToken();
    if (token === null) return { ok: false, reason: 'no-token' };


    // A store that cannot be written cannot hold the backoff this module is
    // about to decide on, so every failure would refetch immediately and the
    // 429 with its ~54 minute retry-after is exactly what that earns. Refused
    // typed instead, before any request.
    const store = ensureStore();
    if (!store.ok) return { ok: false, reason: 'no-store' };

    const lock = readLock(nowSeconds);
    if (lock && lock.blockedUntil > nowSeconds) {
        // The reason class matters: an expired (auth-class) lock does not gate
        // a fetch it could not have caused, which is any fetch fed by a
        // credential rewritten since the lock. Every other class gates on time
        // alone.
        if (!(lock.reason === 'expired' && authLockSuperseded(lock))) {
            return { ok: false, reason: 'locked' };
        }
    }

    const transport = opts.requestImpl || https.request;
    const outcome = await fetchUsage(token, transport);

    if (outcome.kind !== 'response') {
        writeLock(nowSeconds + TRANSIENT_BACKOFF_SECONDS, 'timeout');
        return { ok: false, reason: 'timeout' };
    }
    if (outcome.status === 401) {
        writeLock(nowSeconds + EXPIRED_BACKOFF_SECONDS, 'expired', tokenMtimeMs);
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
        // A malformed body may be a blip; a body whose limits[] carries no kind
        // this module recognizes is a server-side rename, which does not
        // self-heal. Re-polling that every 60s forever is the same mistake the
        // 4xx class exists to avoid.
        const backoff = normalized.persistent ? PERSISTENT_BACKOFF_SECONDS : TRANSIENT_BACKOFF_SECONDS;
        writeLock(nowSeconds + backoff, 'parse');
        return { ok: false, reason: 'parse' };
    }

    const fetchedAt = now.toISOString();
    // All three writes are best effort: the fetched data is good, and a
    // disk hiccup in the bookkeeping must not turn a successful read into
    // a failure.
    publishText(usageFilePath(), JSON.stringify({ fetchedAt, kinds: normalized.kinds, windows: normalized.windows, spend: normalized.spend }) + '\n');
    clearLock();
    appendReading(fetchedAt, normalized.windows, normalized.spend);
    return { ok: true, fetchedAt, fromCache: false, windows: normalized.windows, spend: normalized.spend };
}

// ---------------------------------------------------------------------------
// Threshold policy and evaluation (S2). This half issues no request and calls
// no reader entry point: it shares this file's normalizers and its clock seam,
// and otherwise takes a read the caller already holds and answers what the kit
// should do about it. Its verdict is what S3's wind-down text and S4's dispatch
// barrier act on, so every uncertain input resolves to `clear`, which both
// consumers treat as allow.
// ---------------------------------------------------------------------------

// The operator's policy, and every default in it is deliberate. The
// percentages sit well below 100 because on an overage seat 100 is not a
// barrier at all (the request is served and the account spends), and because
// winding down is itself work that costs window. `enabled` is false because a
// component that can deny a tool dispatch must not arm itself at install: the
// operator opts in.
//
// Frozen, children included, because it is exported: normConfig hands out
// fresh objects, but a consumer or a test assigning to
// lib.DEFAULT_CONFIG.session.warn would rewrite the policy for every later
// readConfig in the process, and freezing the outer object alone would leave
// the thresholds that actually decide a barrier writable.
const DEFAULT_CONFIG = Object.freeze({
    enabled: false,
    session: Object.freeze({ warn: 80, barrier: 95 }),
    weeklyAll: Object.freeze({ warn: 85, barrier: 95 }),
    fableRatchet: 85,
});

const CONFIG_READ_CAP = 16 * 1024;

// The staleness budget the verdict hands back to the caller for its next
// readUsage. 600s is deliberate under-sampling (a third-party tool already
// polls this endpoint every 180s and a spend control does not need
// three-minute resolution), tightening near a barrier so a fast burn is not
// discovered ten minutes late.
const STALENESS_SECONDS = 600;
const STALENESS_NEAR_BARRIER_SECONDS = 120;
const NEAR_BARRIER_POINTS = 10;

// Precedence, fixed: any barrier outranks any warn, and weeklyAll outranks
// session at the SAME level because its horizon is days rather than hours and
// the consumers handle the two differently (a session barrier arms a resume at
// the reset instant, a weekly one deliberately does not). One ordering applied
// at both levels is what makes the table over two windows and three states
// total, rather than leaving warn-versus-warn to whichever branch ran first.
const WINDOW_PRECEDENCE = ['weeklyAll', 'session'];

// The threshold config is MACHINE-GLOBAL: the shared parent of the per-profile
// stores, never inside one. Thresholds are an operator policy preference
// rather than an account fact, so switching config profiles must not silently
// switch the policy with it, while the cache, the lock and the log all stay
// per profile because each of those IS an account fact.
function configFilePath() {
    return path.join(path.dirname(storeRoot()), 'config.json');
}

// A threshold percent, or the default. Bounded [0, 100] rather than
// normPercent's [0, 1000]: a percent READ off the wire can legitimately run
// past 100 on an overage seat, but a threshold set past 100 is one the kit
// could never act on, so it is an operator typo rather than a policy.
function normThreshold(value, fallback) {
    const n = normNumber(value);
    return n === null || n < 0 || n > 100 ? fallback : n;
}

function normWindowThresholds(raw, fallback) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const barrier = normThreshold(source.barrier, fallback.barrier);
    const statedWarn = normThreshold(source.warn, fallback.warn);
    // A warn above its own barrier inverts the design: the wind-down exists to
    // PRECEDE the deadline, and windowState tests the barrier first, so a warn
    // past it can never be reached and the operator's wind-down would silently
    // never happen. The barrier is the safety-bearing half and is kept as
    // stated; only the warn that could not fire falls back. This does not
    // guarantee warn <= barrier (a barrier of 60 leaves the default warn of 80
    // unreachable too), and inventing a value under someone's barrier would be
    // policy the operator did not write.
    return { warn: statedWarn > barrier ? fallback.warn : statedWarn, barrier };
}

// Defaults applied FIELD BY FIELD rather than all-or-nothing: one garbage
// value must not silently disable the fields beside it, and a half-edited config
// should still hold the policy it does state. `enabled` is the exception in
// spirit only: anything that is not literally true is false, because every
// other value there is an operator who did not opt in.
function normConfig(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        enabled: source.enabled === true,
        session: normWindowThresholds(source.session, DEFAULT_CONFIG.session),
        weeklyAll: normWindowThresholds(source.weeklyAll, DEFAULT_CONFIG.weeklyAll),
        fableRatchet: normThreshold(source.fableRatchet, DEFAULT_CONFIG.fableRatchet),
    };
}

// The operator's policy from disk, always a complete config. Absent,
// unreadable, over-cap, unparseable and misshapen all resolve to the defaults,
// and the defaults are disabled, so every one of those states leaves the
// feature off rather than half-armed. Never throws: readCapped swallows its
// own I/O errors, but configFilePath reaches os.homedir(), which can raise, so
// the wrapper is what makes the stated contract true (readUsage wraps for the
// same reason).
function readConfig() {
    try {
        return readConfigInner();
    } catch {
        // The one reachable raiser is configFilePath's os.homedir(). The safe
        // degradation is the same as every other unreadable config state: the
        // defaults, which are disabled.
        return normConfig(null);
    }
}

function readConfigInner() {
    const read = readCapped(configFilePath(), CONFIG_READ_CAP);
    if (read === null || read.truncated) return normConfig(null);
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    } catch {
        return normConfig(null);
    }
    return normConfig(parsed);
}

// One window's state. An UNKNOWN percent is clear and can never be anything
// else: unknown is neither zero nor saturated, and a barrier is a positive
// determination on data the kit actually has. The null check is explicit
// rather than left to JavaScript's coercion because the coercion agrees only
// by luck: null >= 95 is false, but null >= 0 is TRUE, so a threshold at zero
// would turn every unknown window into a barrier.
function windowState(percent, thresholds) {
    if (percent === null) return 'clear';
    if (percent >= thresholds.barrier) return 'barrier';
    if (percent >= thresholds.warn) return 'warn';
    return 'clear';
}

// The verdict every doubtful path returns. Named rather than inlined so the
// allow-everything shape is one thing that cannot drift between its callers.
function clearVerdict() {
    return {
        state: 'clear',
        window: null,
        percent: null,
        resetsAt: null,
        fableRatchet: false,
        fablePercent: null,
        fableResetsAt: null,
        maxAgeSeconds: STALENESS_SECONDS,
        ageSeconds: null,
    };
}

// How old the data being judged is, in whole seconds, or null when that cannot
// be established. Null covers three states and they are all the same answer to
// a consumer: no usable fetchedAt, an unusable clock seam, and a fetchedAt in
// the FUTURE, which is a clock disagreement rather than data fresher than any
// budget (readUsageInner treats a future-dated cache as a miss for the same
// reason). Null must never read as fresh: S4 denies only when the age is
// within the budget, so an unknown age has to fall outside it.
function ageOf(fetchedAt) {
    const stamp = normTimestamp(fetchedAt);
    if (stamp === null) return null;
    const clock = resolveNow();
    if (!clock.ok) return null;
    const ageMs = clock.now.getTime() - Date.parse(stamp);
    if (!Number.isFinite(ageMs) || ageMs < 0) return null;
    return Math.floor(ageMs / 1000);
}

// What the kit should do about a usage read. Arguments:
//   usage   a readUsage result, either shape
//   config  a config object (readConfig's, or a literal); defaults are applied
//           per field here too, so a partial or absent one is safe
//
// Returns { state, window, percent, resetsAt, fableRatchet, fablePercent,
// fableResetsAt, maxAgeSeconds, ageSeconds }. Never throws.
//
// maxAgeSeconds and ageSeconds are a TWO-PASS protocol, and holding both is
// the point. maxAgeSeconds is advice for the caller's NEXT read; ageSeconds is
// the age of the data THIS verdict judged. A hook that read at 600 and is
// handed 120 back is holding data that may be older than the budget it was
// just given, so a consumer that denies on this verdict compares the two and
// re-reads at the tighter budget before deciding, rather than denying on data
// older than the budget it was handed. ageSeconds is null when the age cannot
// be established, and a null age is never within a budget, which is the
// fail-open direction (see ageOf).
//
// resetsAt is null on a NON-CLEAR verdict whenever the producing window's
// timestamp failed validation, which is reachable straight off the wire from a
// window carrying a valid percent and a malformed resets_at. There is no reset
// instant to invent, so S3's dedupe key and S4's deny text both have to
// tolerate a null rather than assume one is present.
//
// The Fable ratchet is evaluated SEPARATELY and never contributes to `state`,
// because its response is a routing cap rather than a pause: at or above the
// ratchet the kit stops sending work to Fable and continues at the session
// model, and nothing stops.
function evaluate(usage, config) {
    try {
        return evaluateInner(usage, config);
    } catch {
        // Unreachable by design, like readUsage's outer catch, but the
        // never-throws contract is what lets a hook call this on every tool
        // call. A verdict that threw would take the session with it, so the
        // failure degrades to the verdict that allows everything.
        return clearVerdict();
    }
}

function evaluateInner(usage, rawConfig) {
    const config = normConfig(rawConfig);
    // The two doors that keep every reader failure allowing: the feature is
    // off unless the operator armed it, and a failed read is not a positive
    // determination about anything, whatever it may carry alongside its
    // reason.
    if (!config.enabled || !usage || usage.ok !== true) return clearVerdict();

    // The two windows that feed the state, in precedence order. Both are held
    // to the same doors the wire and cache readers use, because this object
    // may also arrive hand-built from a consumer hook: a garbage percent reads
    // as unknown, which can never barrier, and resetsAt is what S3 puts in
    // front of the model.
    const rawWindows = usage.windows || {};
    const percents = {};
    const resets = {};
    for (const key of WINDOW_PRECEDENCE) {
        const w = rawWindows[key] && typeof rawWindows[key] === 'object' ? rawWindows[key] : {};
        percents[key] = normPercent(w.percent);
        resets[key] = normTimestamp(w.resetsAt);
    }

    const states = {};
    for (const key of WINDOW_PRECEDENCE) states[key] = windowState(percents[key], config[key]);

    let state = 'clear';
    let windowKey = null;
    for (const level of ['barrier', 'warn']) {
        for (const key of WINDOW_PRECEDENCE) {
            if (states[key] === level) {
                state = level;
                windowKey = key;
                break;
            }
        }
        if (windowKey !== null) break;
    }

    // Tightened by proximity to a BARRIER rather than to a warn: the warn is
    // the wind-down and the barrier is the deadline, so the resolution that
    // matters is the one approaching the deadline. Only the two windows that
    // have a barrier are consulted; the Fable window has a ratchet, which
    // pauses nothing and so has no deadline to sample faster for.
    const nearBarrier = WINDOW_PRECEDENCE.some((key) => {
        // Floored at 1: a barrier set at or below ten points would otherwise
        // put every known percent on the fast poll, zero included, and a
        // window reading 0 is not near anything.
        const nearPoint = Math.max(1, config[key].barrier - NEAR_BARRIER_POINTS);
        return percents[key] !== null && percents[key] >= nearPoint;
    });

    const fable = rawWindows.fableWeekly && typeof rawWindows.fableWeekly === 'object' ? rawWindows.fableWeekly : {};
    const fablePercent = normPercent(fable.percent);

    return {
        state,
        window: windowKey,
        percent: windowKey === null ? null : percents[windowKey],
        resetsAt: windowKey === null ? null : resets[windowKey],
        fableRatchet: fablePercent !== null && fablePercent >= config.fableRatchet,
        fablePercent,
        fableResetsAt: normTimestamp(fable.resetsAt),
        maxAgeSeconds: nearBarrier ? STALENESS_NEAR_BARRIER_SECONDS : STALENESS_SECONDS,
        ageSeconds: ageOf(usage.fetchedAt),
    };
}

module.exports = {
    readUsage,
    storeRoot,
    profileKey,
    ensureStore,
    resolveNow,
    usageFilePath,
    lockFilePath,
    logFilePath,
    LOG_MAX_LINES,
    EXPIRED_BACKOFF_SECONDS,
    PERSISTENT_BACKOFF_SECONDS,
    RATE_LIMIT_DEFAULT_SECONDS,
    TRANSIENT_BACKOFF_SECONDS,
    evaluate,
    readConfig,
    configFilePath,
    DEFAULT_CONFIG,
    STALENESS_SECONDS,
    STALENESS_NEAR_BARRIER_SECONDS,
    NEAR_BARRIER_POINTS,
};
