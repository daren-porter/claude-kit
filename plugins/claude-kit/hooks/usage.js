#!/usr/bin/env node
// CLI entry for the kit's usage reader: one read-only command that prints the
// current usage reading and what the operator's threshold policy says about it.
//
// Subcommands:
//   usage.js status
//
// Every request, every store file and every threshold decision lives in
// usage-lib.js; this file is argument handling and output formatting, the same
// split memory.js/memory-lib.js uses for the same reason (argv handling stays
// out of the file every hook requires). Node core only, CommonJS, zero
// dependencies. This file issues no writes of its own, but `status` does
// trigger the reader's (its cache, its backoff lock, its reading log), and on
// an unarmed machine it is the first thing to create the store at all, which
// is the deliberate difference stated below.
//
// The consumer is a MODEL reading terminal output mid-effort, and secondarily
// the operator at a prompt. That is what picks the fields: whether the feature
// is armed, each of the three windows, the thresholds the percentages are being
// judged against, the verdict and its `fableRatchet` flag, and how old the
// reading is. An orchestrator about to dispatch a subagent with a fable model
// override reads this to decide whether to downgrade that dispatch.
//
// ONE DELIBERATE DIFFERENCE FROM THE HOOKS, stated here because it is
// invisible from inside usage-lib.js and it contradicts what the living docs
// currently claim. Both hooks read the config first and return on
// `enabled: false`, so an unarmed machine makes no network call and never
// creates the store. This command does not: an operator or orchestrator asking
// for a reading gets one whether or not the feature is armed, because refusing
// to answer "what is my usage" when the control is disarmed would be useless.
// So `status` is the one path in the payload that touches the store and the
// network without the feature being enabled, on an explicit request.
//
// The verdict is therefore evaluated AS IF ARMED, with `enabled` reported on
// its own line and the two policy lines marked advisory when it is false. The
// alternative was to pass the config through as read, and that makes the block
// useless on exactly the machine it was built for: with `enabled: false`
// (the shipped default, and the state of this machine) evaluate returns its
// clear verdict, so `state` and `fableRatchet` would be hardcoded constants
// rather than readings. `enabled` describes whether a hook ACTS; this command
// denies nothing and nudges nothing, so it is a field to report rather than a
// gate on the rest of the block.
//
// EVERY READER STATE GOES TO STDOUT AT EXIT 0, the failure line included,
// which is the difference from memory.js. Every reason in the reader's fixed
// set is a state the reader is entitled to be in, so it is an ANSWER, and an
// orchestrator may run this inside a compound command, where a non-zero exit
// reads as a broken step rather than as "no reading available". Two things
// are not answers and are not covered by that contract: argument misuse (a
// caller bug, reported memory.js's way with the usage line on stderr and a
// non-zero exit, because `status --json` answering the untyped question at
// exit 0 on stdout made misuse undetectable to a caller) and an output
// stream that failed for a reason other than a closed pipe (reported on the
// opposite channel at exit 1, because swallowing it manufactures exactly the
// silence this paragraph promises never to emit).
//
// A failed fresh read does NOT discard a usable cache. The reader's own
// staleness budget governs what counts as fresh, but this command's reader is
// deciding whether to downgrade a dispatch, and under a rate-limit lock the
// horizon can run to a day: printing `no reading available` for that day
// while a good usage.json sits in the store would defeat the ratchet in the
// case it exists for. So on a failed read the command retries once at an
// effectively unbounded age, which can only serve the cache (see cmdStatus),
// and prints the block with the age labelled stale and the fresh failure's
// reason beside it. Neither contract bends: the reader gets numbers, and they
// are not presented as fresh.
//
// WHAT THIS DELIBERATELY DOES NOT PRINT: `spend`, and anything from
// readings.log. docs/security-model.md records the invariant that nothing
// emits the reading log to the model, and the spend figure is account dollars.
// A model running this command before every fable dispatch would put both into
// its own context on every invocation, which is the disclosure the reader was
// built to avoid making. The operator can read either directly at its path in
// the store. This is a contract, not an omission to be tidied up later.
//
// No token material, ever: not the token, not a fragment, not a hash. The
// reader already guarantees it (its store key is derived from the credentials
// DIRECTORY path), and the failure line here is a reason from a fixed set
// rather than an error object, so nothing this file prints can undo that.
//
// The process is left to end on its own on every path; a non-zero exit is set
// through process.exitCode, never process.exit(). A process.exit() after
// writing can discard bytes still in flight on a pipe; that is an open defect
// at seven sites in this kit and not one to reproduce in new code.

'use strict';

const lib = require('./usage-lib.js');

// The reader's fixed reason set, restated because usage-lib.js does not export
// it. A reason outside the set prints as `unknown` rather than being passed
// through: the failure line is the one place a value produced by a failure
// path reaches stdout, and a whitelist is what keeps it a closed vocabulary
// even if a later edit upstream adds a reason this file has not been taught.
const REASONS = [
    'no-token',
    'expired',
    'rate-limited',
    'timeout',
    'parse',
    'locked',
    'no-store',
    'bad-call',
];

// The three windows, in the order the block prints them. Restated for the same
// reason: usage-lib.js keeps its own WINDOW_KEYS private.
const WINDOW_KEYS = ['session', 'weeklyAll', 'fableWeekly'];

// The two windows that can produce a verdict state. The Fable window has a
// ratchet rather than a barrier, so it never appears here.
const STATE_WINDOWS = ['session', 'weeklyAll'];

const VALUE_CAP = 60;
const NO_READING = 'usage: no reading available';

// usage-lib.js does not export its `sanitize` and this file must not modify
// it, so the cap-and-scrub door is local. It is the SECOND layer rather than
// the only one: every value that reaches it is already a number, a reason from
// the set above, a severity normToken reduced to token characters, or a
// timestamp normTimestamp anchored to ISO-8601. This door is what keeps the
// line printable if a future edit upstream loosens one of those.
function render(value, cap) {
    const text = String(value == null ? '' : value).replace(/[^\x20-\x7E]/g, ' ');
    // Marked the way memory.js marks its clips, because a silent slice tells
    // the reader a truncated value was the whole value. Unreachable today
    // (every value that reaches this door was already capped upstream at 40
    // against this 60), so the marker is insurance against a loosened
    // upstream cap rather than a live path.
    return text.length > cap ? text.slice(0, cap) + ' [truncated]' : text;
}

// A percentage for the terminal: usage-lib's shared formatOneDecimal
// (faithful at one decimal, and both hooks' emission door too, so the block's
// numbers can never disagree with a deny's), and `unknown` for anything that
// is not a finite number.
//
// The null arm is the load-bearing half. Math.floor(null) is 0 and a zero is
// a REAL measurement, so a manufactured zero would tell a reader the window
// is empty when the truth is that nobody knows. Unknown and empty are
// different answers, and the whole feature's fail-open posture rests on the
// difference (usage-lib's windowState treats an unknown percent as clear
// precisely because it is not a positive determination).
function percentText(value) {
    const text = lib.formatOneDecimal(value);
    return text === null ? 'unknown' : text + '%';
}

// A configured threshold, which has two shapes a percentage does not.
// normWindowThresholds stands a warn above its own barrier DOWN by setting it
// to Infinity, because such a warn cannot fire as written and substituting the
// default would arm a stricter trigger than the operator wrote. Neither raw
// form is fit to print: `Infinity` reads as a number nobody configured, and
// JSON.stringify renders it as null. A FINITE threshold past 1000 is the same
// answer by arithmetic rather than by construction: normPercent nulls any
// percent above 1000, so no reading can ever reach such a threshold
// (`barrier: 999999` is the documented way to write "never fire this
// window"), and rendering it as a number invites exponential notation at the
// extreme (toFixed on 1e21 yields "1e+21", which is not a percentage anyone
// configured).
function thresholdText(value) {
    if (value === Infinity || (Number.isFinite(value) && value > 1000)) return 'never fires';
    return percentText(value);
}

// A short string from the reader, or `unknown`. Same rule as percentText: an
// absent severity or an unreadable reset instant is reported as unknown rather
// than as an empty field a reader could mistake for a value.
function textOrUnknown(value) {
    if (typeof value !== 'string' || value === '') return 'unknown';
    const rendered = render(value, VALUE_CAP).trim();
    return rendered === '' ? 'unknown' : rendered;
}

// A whole-second duration, or `unknown`. Same rule as percentText and for the
// same reason: a non-finite value must never print as a measurement, and the
// age line now carries three of these.
function secondsText(value) {
    return Number.isFinite(value) ? Math.floor(value) + 's' : 'unknown';
}

function reasonText(result) {
    const reason = result && result.reason;
    return REASONS.includes(reason) ? reason : 'unknown';
}

// The failure, with the one detail that rides beside a reason: a rate-limited
// read carries retryAfterSeconds, and dropping it left a reader unable to
// tell a 300s backoff from a 54-minute one. parseRetryAfter bounds the value
// under a day before it ever reaches a result, so printing it is safe, and it
// is still checked finite at this door like every other number.
function failureText(result) {
    const reason = reasonText(result);
    const retry = result && result.retryAfterSeconds;
    if (reason === 'rate-limited' && Number.isFinite(retry)) {
        return reason + ', retry after ' + Math.floor(retry) + 's';
    }
    return reason;
}

function out(text) {
    process.stdout.write(text + '\n');
}

// `usage.js status | head -1` is a plausible invocation for a reader that
// wants one field, and it closes the read end mid-write. Node's default for
// the resulting EPIPE is an uncaught exception, which would put a stack trace
// where this command's contract says one line, so that class is absorbed:
// a reader that stopped reading is a normal end to a read. Any OTHER stream
// failure is real (a full disk is not a reader who left), and swallowing it
// manufactures the zero-bytes-on-both-channels silence the header promises
// never to emit: `status > /dev/full` did exactly that before this branch.
// memory.js's handler, verbatim in shape: report on the channel that is
// still open, exit 1.
function tolerateClosedPipe(stream, other) {
    stream.on('error', (err) => {
        const code = err && err.code;
        if (code === 'EPIPE' || code === 'ERR_STREAM_DESTROYED') return;
        process.exitCode = 1;
        try {
            other.write('usage: output stream failed: ' + render(code || 'unknown error', VALUE_CAP) + '\n');
        } catch {
            /* both channels are gone; the exit code is all that is left */
        }
    });
}

// Argument misuse is a caller bug, not a reader state, so it takes memory.js's
// convention rather than this command's answer contract: the usage line on
// stderr at a non-zero exit, where `status --json` at exit 0 on stdout was
// undetectable by the caller whose flag was silently refused. process.exitCode
// rather than process.exit(), per the header.
function usage() {
    process.stderr.write('usage: usage.js status   (the only subcommand; prints the current kit usage reading)\n');
    process.exitCode = 1;
}

// The block a model reads. Field order follows the decision: is anything
// armed (and whether the operator's config file actually took), how old is
// this reading and which two budgets that age is judged against, what do the
// three windows say, what is being judged against, and what does the policy
// conclude.
//
// Deliberately absent: `spend` and anything from readings.log. The header says
// why, and it is a contract rather than an oversight.
//
// opts.staleReason marks a block served off the stale-cache fallback,
// carrying the reason the fresh read failed; opts.configIssue names a present
// config file readConfig rejected whole.
function statusBlock(reading, verdict, config, opts) {
    const o = opts || {};
    const armed = config.enabled === true;
    // The advisory marker rides on the two POLICY lines rather than only on
    // the `enabled` line, because those are the two a reader acts on. Without
    // it a model skimming the block could read `state: barrier` as the kit
    // already holding dispatch when nothing is armed to hold anything. It
    // names no enforcer: the documented reader of this block is not a hook
    // and DOES act on it, so the honest statement is that nothing enforces
    // the policy, not that nobody reads it.
    const advisory = armed ? '' : ' [advisory: the feature is disabled, so nothing enforces this; treat it as advice]';
    const windows = reading.windows && typeof reading.windows === 'object' ? reading.windows : {};

    const lines = ['kit usage status', 'enabled: ' + (armed ? 'true' : 'false')];
    // Cause beside effect: `enabled: false` with a config file the operator
    // wrote and readConfig rejected is the one state this surface exists to
    // diagnose, and without this line it is indistinguishable from no config
    // at all.
    if (typeof o.configIssue === 'string' && o.configIssue !== '') {
        lines.push('config: config.json exists but was rejected (' + render(o.configIssue, VALUE_CAP)
            + '); the enabled flag and thresholds shown are the shipped defaults');
    }
    // THREE numbers rather than two, and each is told what it governs, because
    // one label over two of them conflated exactly the pair a reader acts on.
    // The age is what this block stands on. The poll CADENCE is the verdict's
    // advice for the next read, and it is also the freshness the Fable ratchet
    // rides, which is the predicate a reader running this before a fable
    // dispatch is reading against. The DENY BUDGET is the freshness both hooks
    // require of a refusal on a window state (usage-lib's withinDenyBudget).
    //
    // Which number governs which predicate has to be IN THE LINE and not only
    // in this comment, or the block reopens the same desync from the other
    // side: at fable 92% on a 300-second-old cache the barrier hook denies an
    // override dispatch, while a reader comparing that age against a bare "deny
    // budget 120s" would conclude nothing would be refused. This block's reader
    // is an actor, and it can only apply the right rule to the age it was
    // handed if the block says which rule that is.
    const sourceLabel = typeof o.staleReason === 'string'
        ? 'stale cache (fresh read failed: ' + render(o.staleReason, VALUE_CAP) + ')'
        : (reading.fromCache === true ? 'from cache' : 'freshly fetched');
    lines.push('age: ' + secondsText(verdict.ageSeconds)
        + ', ' + sourceLabel
        + ', poll cadence ' + secondsText(verdict.maxAgeSeconds)
        + ', deny budget ' + secondsText(lib.STALENESS_NEAR_BARRIER_SECONDS)
        + ' (window states only; the Fable ratchet rides the cadence)');
    for (const key of WINDOW_KEYS) {
        const w = windows[key] && typeof windows[key] === 'object' ? windows[key] : {};
        lines.push(key + ': ' + percentText(w.percent)
            + ', severity ' + textOrUnknown(w.severity)
            + ', resets ' + textOrUnknown(w.resetsAt));
    }
    lines.push('thresholds: session warn ' + thresholdText(config.session.warn)
        + ' barrier ' + thresholdText(config.session.barrier)
        + ', weeklyAll warn ' + thresholdText(config.weeklyAll.warn)
        + ' barrier ' + thresholdText(config.weeklyAll.barrier)
        + ', fableRatchet ' + thresholdText(config.fableRatchet));
    // The deciding window is named because two windows feed one state, and
    // `state: warn` alone leaves a reader guessing which one. Whitelisted
    // rather than interpolated: evaluate emits only these two today, and a key
    // read off the verdict without the check is how `constructor` would end up
    // in the line.
    const window = STATE_WINDOWS.includes(verdict.window) ? ' (' + verdict.window + ')' : '';
    lines.push('state: ' + textOrUnknown(verdict.state) + window + advisory);
    lines.push('fableRatchet: ' + (verdict.fableRatchet === true ? 'true' : 'false') + advisory);
    return lines.join('\n');
}

// Evaluated with the config the operator wrote, `enabled` forced on. See the
// header for why. Object.assign leaves the thresholds untouched, and
// re-normalizing an already-normalized config is safe by construction:
// normWindowThresholds admits its own Infinity back precisely so this round
// trip cannot resurrect a stood-down warn to the default.
function evaluateAsArmed(reading, config) {
    return lib.evaluate(reading, Object.assign({}, config, { enabled: true }));
}

async function cmdStatus() {
    const config = lib.readConfig();
    const configIssue = lib.configFileIssue();
    // lib.STALENESS_SECONDS rather than a local number, so repeated
    // invocations serve the cache instead of issuing a request each time: an
    // orchestrator may call this before every fable dispatch, and the reader
    // has no coalescing to absorb that.
    let reading = await lib.readUsage({ maxAgeSeconds: lib.STALENESS_SECONDS });
    if (!reading || reading.ok !== true) {
        // The failure's reason is captured BEFORE the fallback read: when no
        // cache exists the retry lands on the lock the failure just wrote and
        // would report the less informative `locked`.
        const failure = failureText(reading);
        // The fallback: one retry at an effectively unbounded age, which is
        // free and cannot re-fetch or re-lock WHEN A CACHE EXISTS, because
        // readUsageInner consults the cache before token resolution, before
        // ensureStore and before the lock check. With no cache the retry
        // re-runs those doors instead, where every fetch-class failure has
        // just written its backoff lock, so the answer is a typed failure
        // rather than a second request.
        const stale = await lib.readUsage({ maxAgeSeconds: Number.MAX_SAFE_INTEGER });
        if (!stale || stale.ok !== true) {
            // One line naming the reason, and nothing else. Every reason is a
            // state the reader is entitled to be in (no credential, a backoff
            // lock in force, an endpoint that answered oddly), so this is an
            // answer rather than an error, which is why it prints on stdout
            // at exit 0.
            out(NO_READING + ' (' + failure + ')');
            return;
        }
        // No re-read below on this path: the fresh read just failed, and the
        // stale label plus the printed age and budget carry the basis.
        out(statusBlock(stale, evaluateAsArmed(stale, config), config,
            { staleReason: failure, configIssue }));
        return;
    }
    let verdict = evaluateAsArmed(reading, config);
    // The two-pass staleness protocol both hooks run on a window state, on the
    // one standard they run it on: lib.withinDenyBudget, never a rule written
    // here. A third hand copy stood here and had already gone wrong, comparing
    // ageSeconds against the verdict's own maxAgeSeconds, so a session at 82%
    // on a five-minute-old cache reported `state: warn` while both hooks would
    // have allowed the very next dispatch and said nothing on the same store.
    // That is the surface docs/usage-awareness.md teaches an operator to use as
    // the anti-imitation check, so it has to agree with the hooks by
    // construction rather than by inspection.
    //
    // A non-clear verdict outside that budget therefore earns one re-read at
    // it. Exactly one, never a loop, and a re-read that fails keeps the first
    // reading: this command reports rather than denies, so the honest move is
    // to print what it holds with the age, the cadence and the budget beside
    // it, not to withhold the block.
    if (verdict.state !== 'clear' && !lib.withinDenyBudget(verdict)) {
        const reread = await lib.readUsage({ maxAgeSeconds: lib.STALENESS_NEAR_BARRIER_SECONDS });
        if (reread && reread.ok === true) {
            reading = reread;
            verdict = evaluateAsArmed(reading, config);
        }
    }
    out(statusBlock(reading, verdict, config, { configIssue }));
}

async function main() {
    tolerateClosedPipe(process.stdout, process.stderr);
    tolerateClosedPipe(process.stderr, process.stdout);

    const [cmd, ...rest] = process.argv.slice(2);
    // No flags in this version, so a trailing argument is a misuse rather than
    // something to ignore: silently accepting `status --json` would answer a
    // question the caller did not ask.
    if (cmd !== 'status' || rest.length) return usage();
    await cmdStatus();
}

// The whole of main inside one swallowing catch, the usage-nudge.js/
// usage-barrier.js idiom: a synchronous throw inside an async function arrives
// as a rejection, so a try/catch here would not hold and an unhandled
// rejection would print a stack trace this command promises never to print.
// `bad-call` is the honest reason for it, and the one usage-lib.js already
// reserves for kit-internal misuse and unmodeled internal errors, so the line
// stays inside the reader's vocabulary. The block is written in a single call
// at the end of cmdStatus, so a throw during its construction leaves nothing
// half-printed above this line.
main().catch(() => {
    try {
        out(NO_READING + ' (bad-call)');
    } catch {
        /* the channel is gone; exit 0 stands, which is the contract */
    }
});
