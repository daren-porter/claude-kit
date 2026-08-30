#!/usr/bin/env node
// PostToolUse hook: the usage wind-down channel, and the kit's only mid-turn
// channel to the model.
//
// Reads the usage cache through usage-lib.js and, when the operator's own
// threshold policy puts this session at `warn` or `barrier`, emits one
// `additionalContext` block. The two states carry DIFFERENT instructions and
// the difference is the point. A barrier says stop now, write the section's
// Chapter and end the turn on a `BLOCKED:` lead. A warn says keep working in
// the main thread and dispatch nothing, finish the section in flight, stop at
// that boundary rather than opening another, and do that same bookkeeping only
// once the run has actually stopped. That prefix is what kit-goal-stop.js's
// leash already releases on, so a stop from either state ends the run through
// an existing tested path rather than a new one. The hook denies nothing and
// blocks nothing: the kit has no lever that stops a session, so this channel
// permits and encourages a stop, and cannot force one. The mechanical refusal
// of dispatch that rides with a warn belongs to the sibling PreToolUse barrier,
// not to this hook.
//
// Registered on PostToolUse ONLY, and deliberately not on SubagentStop, which
// accepts `additionalContext` too. The 2.1.248 binary's own schema description
// for SubagentStop reads "additionalContext is non-error feedback delivered to
// the subagent; the subagent continues so it can act on it", where the Stop
// event's equivalent says "delivered to the model". Every instruction below is
// written for the orchestrator (write the section's Chapter, surface `BLOCKED:`,
// stop the turn), so a SubagentStop emission would hand it to an implementer
// subagent and encourage that subagent to keep going on it. PostToolUse after
// the Agent call returns is the same section boundary delivered to the right
// reader.
//
// The matcher this hook is registered with is UNRESTRICTED, and that is
// load-bearing rather than lazy, because it is invisible from inside this file.
// A PreToolUse deny suppresses the PostToolUse event for that call: confirmed
// against the 2.1.248 binary, whose repl tool-call path answers a PreToolUse
// chain yielding `stop` with `return U(stopReason ?? "Blocked by PreToolUse
// hook")` and returns BEFORE it calls the tool, so the PostToolUse chain that
// would run after the call is never reached. At a barrier the kit's own
// PreToolUse barrier denies every Agent dispatch, so a matcher narrowed to
// Agent would cost this hook its event at exactly the moment the barrier text
// matters most, leaving the barrier wind-down undeliverable while the warn text
// still worked. Narrowing the matcher to cut process spawns is therefore not
// the cheap optimisation it looks like, and it requires re-deriving this. For
// the same reason this hook reads no `tool_name`: the registration decides
// which calls it sees, and a gate here would silently re-narrow what the
// matcher deliberately left open.
//
// Silence is the whole of the ordinary case, and every doubtful path takes it.
// The feature is off unless the operator's config says otherwise, so the
// ordinary run costs one capped config read and nothing else, which matters
// here more than in any other kit hook: this one fires after every tool call.
// Nothing at `clear`; nothing when the read failed for any reason (evaluate
// resolves all of those to `clear`); nothing when the data is older than a
// claim about a REFUSAL may stand on AND one re-read at that tighter budget
// could not produce fresher (see the two-pass protocol in main); nothing
// without a session id to dedupe on, because a nudge that cannot dedupe fires
// on every tool call for the rest of the run; nothing when the store cannot
// hold the marker.
//
// The emission door. Every value interpolated into the emitted text is a
// number rendered by usage-lib's shared formatOneDecimal, one of two
// whitelisted window literals, or a timestamp usage-lib.js has already put
// through normTimestamp. Everything else is a hardcoded literal in this file.
// No string from the endpoint payload crosses, `spend.disclaimer` included,
// because it carries a markdown link. Percents and thresholds render
// FAITHFULLY at one decimal rather than through any rounding direction:
// normPercent and normThreshold both admit fractional numbers, an unformatted
// value would put float noise into trusted context, and every rounding rule
// tried here let one sentence's two numbers compare differently than their
// originals do (formatOneDecimal's comment carries the three reproduced
// defects).
//
// The marker. One append-only file, `<store>/nudged.log`, one JSON object per
// line, keyed on (session id, window, reset instant, verdict state) so a new
// window re-arms the nudge and an escalation from warn to barrier is not
// swallowed by the warn that preceded it. The state belongs in the key because
// the two states carry different instructions, so a key without it would make
// the barrier text unreachable on the ordinary escalation path: a gradual burn
// crosses the warn first, and a key that could not tell the two apart would
// report the barrier as already delivered. The reverse order is suppressed
// explicitly: a warn is silent once a barrier has fired for the same window and
// reset instant, because telling a winding-down run to wind down less reads as
// a bug.
//
// The session id is a JSON value and never a path component, which is why this
// hook needs no path-safety door on it: an earlier draft of this feature put a
// session id into a filename and needed a strict character class to make that
// safe, and both were removed. This hook also owns reaping that file, and it is
// the only store file this hook writes.
//
// Two known accepted costs, recorded so the next reader does not rediscover
// them as defects.
//
// One: the dedupe is read-then-append with nothing between, so two hook
// processes that read the marker before either appends both emit. Reproduced at
// six concurrent processes against one store: two identical blocks and two
// marker lines, on one run in three. It is bounded by the width of a parallel
// tool-call batch rather than being a flood, and the duplicate says the same
// true thing twice. The obvious fix, a per-key claim file created with 'wx' as
// the mutex, is refused on purpose: the key contains the session id, so a
// per-key file would put a harness-supplied string back into a filesystem path
// and reintroduce the character-class door this design exists to do without.
// One append-only file whose id is a JSON value is the trade, and this is its
// cost.
//
// Two: the dedupe check sits AFTER both reads, so a session parked in an
// already-nudged WARN OR BARRIER state runs the two-pass protocol on every tool
// call and can pay a live fetch every 120 seconds for a nudge that can never
// speak again for that key. Moving the check earlier is not available: the
// re-read is what can change the deciding window or the reset instant, and
// therefore the key itself, so there is no point before the second verdict at
// which the key is known.
//
// The rate that cost runs at, measured rather than asserted, because the warn
// band is where this hook now expects a run to SIT. A parked warn or barrier
// pays a fetch every 120 seconds rather than every 600, because BOTH texts
// assert that subagent dispatch is being refused and a claim about a refusal
// is held to the same freshness as the refusal itself: lib.withinDenyBudget,
// which usage-barrier.js asks in the same shape and at the same point. Gating
// on the verdict's own polling cadence instead is what had this hook emitting
// "Subagent dispatch is now being refused" on 300-second-old data while the
// barrier beside it allowed the very next dispatch.
//
// What that costs is smaller than it reads, measured against evaluate. On the
// weekly defaults the warn threshold and the near point are the same number
// (85 = 95 - 10), so the whole weekly warn band already polled at 120, as does
// the operator's live 92/95. The bands whose cadence this changes are session
// [80, 85), on a window that resets in under five hours, and the sub-1 barrier
// case main's own comment names. The ordinary crossing pays nothing extra at
// all besides, because a verdict only BECOMES a warn when a fresh read moved
// the percent, so the emission normally rides data zero seconds old. The
// re-read is paid by a session that did not do the refresh itself.
//
// Node core modules only, CommonJS, zero dependencies. Fail-open like every
// other kit hook: any internal error exits 0 with no output.

'use strict';

const fs = require('fs');
const path = require('path');

const lib = require('./usage-lib.js');

// The two windows this hook speaks about, and the only labels reachable in the
// emitted text. A verdict window outside this pair emits nothing at all rather
// than falling back to a phrasing that would name no window.
const WINDOW_LABELS = {
    session: 'session (5-hour)',
    weeklyAll: 'weekly all-models',
};

const MARKER_NAME = 'nudged.log';

// Eight days: one day past the longest window the kit tracks (the weekly ones),
// so a marker cannot outlive the reset instant it was keyed on by more than a
// day.
const MARKER_MAX_AGE_MS = 8 * 24 * 60 * 60 * 1000;

// The line cap, on this file's own reason rather than an inherited one. A
// session emits at most one line per window per reset instant, which over the
// eight-day horizon is around forty lines, so five thousand is far past any
// real run and is a backstop behind the age reap rather than the working bound.
// It happens to equal usage-lib.js's LOG_MAX_LINES; the reason is not the same
// one (that file gains a line per successful fetch).
const MARKER_MAX_LINES = 5000;

// Sized to hold the line cap at its worst case: a 200-character session id
// makes a line of about 280 bytes, so 5000 of them is comfortably under 2MB,
// and the rest is room for the overshoot between an append and the trim after
// it. The value matches usage-lib.js's LOG_READ_CAP for the same reason it
// exists there.
const MARKER_READ_CAP = 8 * 1024 * 1024;

// The session id is bounded rather than sanitized because it reaches no
// channel: it is a JSON value in a file this hook owns, never a path component
// and never interpolated into the emitted text. JSON.stringify escapes whatever
// it holds, so a control character in it cannot break the one-object-per-line
// shape. The accepted trade is that two session ids differing only past
// character 200 would share a marker; a real one is a 36-character uuid.
const SESSION_ID_MAX = 200;

function readStdin() {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// The subagent's type, or null for a main-session call and for any payload this
// cannot positively identify. docs-write-guard.js's pair, copied whole
// including the four spellings, because the same payload shape is being read
// for the same purpose: that hook's header records that plugin PreToolUse hooks
// fire for tool calls made INSIDE subagents and that the payload carries the
// subagent identity. Whether PostToolUse behaves the same way is an inference
// from riding the same tool loop rather than something observed; the gate's own
// comment in main states what that leaves open.
function subagentType(payload) {
    const cand = payload.agent_type || payload.agentType || payload.subagent_type || payload.subagentType;
    return (typeof cand === 'string' && cand.trim().length) ? cand.trim() : null;
}

// A user-launched background session presents as the bare catch-all "claude"
// agent type. It is the main session of its job rather than a dispatched
// subagent, so it is the right reader for a wind-down and stays nudged. Exact
// match only: namespaced ids ("claude-kit:implementer") and named types stay
// governed. The accepted trade, docs-write-guard.js's too: a deliberately
// dispatched catch-all "claude" agent shares the type and so also passes.
function isBackgroundMain(type) {
    return /^claude$/i.test(type);
}

function markerPath() {
    return path.join(lib.storeRoot(), MARKER_NAME);
}

// The marker file's whole text, or a refusal. usage-lib.js's readCapped door,
// copied rather than imported because that module does not export it (the same
// trade its own header records for copying memory-lib's): open with O_NONBLOCK
// so a FIFO planted at this name cannot hang a tool call, confirm
// regular-file-ness on the descriptor itself rather than on the name
// (stat-then-open leaves a TOCTOU window), read at most MARKER_READ_CAP bytes.
// The prefix-and-truncated shape is the one copied, and not readTailCapped's,
// because the dedupe question needs to know that a key was NOT present, which a
// tail read of a partial window cannot answer.
//
// TWO outcomes, and the split is the whole point: { ok: true, text } means
// "these bytes are all the marker file holds", which is as true of a file that
// does not exist as of one read whole, so ENOENT and ENOTDIR resolve to an
// empty text. Everything else is { ok: false }, meaning nothing was
// established, and every caller takes silence on it. An earlier draft split
// these the other way and let an unreadable file read as "no nudge on record":
// a chmod 0200 on this file (read denied, write permitted) then emitted on
// every single tool call, which is exactly the flood the marker exists to
// prevent. A transient EMFILE under fd pressure would do the same. Past the
// read cap lands here too, because a prefix cannot answer the question and
// rewriting the file from one would delete the rest.
function readMarkerText() {
    let fd;
    try {
        fd = fs.openSync(markerPath(), fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch (err) {
        const code = err && err.code;
        // ENOENT: no such file, the ordinary first nudge of a run. ENOTDIR: a
        // path component is not a directory, so no such file can exist either.
        // Both establish absence; nothing else does.
        if (code === 'ENOENT' || code === 'ENOTDIR') return { ok: true, text: '' };
        return { ok: false };
    }
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile()) return { ok: false };
        const buf = Buffer.alloc(Math.min(MARKER_READ_CAP, stat.size));
        const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
        if (stat.size > bytes) return { ok: false };
        return { ok: true, text: buf.toString('utf8', 0, bytes) };
    } catch {
        return { ok: false };
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// The marker file's lines as { raw, key, at }, oldest first. A line that is not
// a JSON object is dropped, and the reap below drops it from the file for the
// same reason it is invisible here: it carries neither a key to match nor an
// `at` to expire, and the only writer of this file is this hook.
function markerLines(text) {
    const out = [];
    for (const raw of text.split('\n')) {
        if (raw === '') continue;
        let parsed;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (!parsed || typeof parsed !== 'object') continue;
        out.push({
            raw,
            key: typeof parsed.key === 'string' ? parsed.key : null,
            at: typeof parsed.at === 'string' ? parsed.at : null,
        });
    }
    return out;
}

// Every key on record. Held as a set rather than probed one key at a time
// because the emission asks up to two questions of it (this verdict's own key,
// and, for a warn only, the barrier key that suppresses one), each across three
// adjacent buckets, and all of them have to be answered from ONE read of the
// file rather than from one read apiece. So a barrier verdict asks three
// lookups and a warn six, and a null reset instant collapses either triple to a
// single key, since every offset renders '-'.
function markerKeySet(text) {
    const keys = new Set();
    for (const line of markerLines(text)) {
        if (line.key !== null) keys.add(line.key);
    }
    return keys;
}

// One line appended. O_APPEND with O_NONBLOCK and a regular-file check on the
// descriptor: usage-lib.js's appendReading door, for the same two reasons (a
// whole-line append is atomic under concurrency, so two sessions cannot
// interleave halves of a record, and a planted FIFO cannot hang a hook).
// Returns true only when the line reached the file, because the emission is
// gated on it.
function appendMarker(key, at) {
    let fd;
    try {
        fd = fs.openSync(
            markerPath(),
            fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NONBLOCK,
            0o600,
        );
    } catch {
        return false;
    }
    try {
        if (!fs.fstatSync(fd).isFile()) return false;
        fs.writeSync(fd, JSON.stringify({ key, at }) + '\n');
        return true;
    } catch {
        return false;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Rewrite the marker file without its expired lines and within its line cap,
// keeping the newest when it must lose any. Called opportunistically on the
// emit path only, never on the silent path, so the ordinary run stays one
// config read.
//
// The rewrite is a tmp file carrying the pid plus 'wx' and then a rename:
// usage-lib.js's publishText idiom, copied because that module does not export
// it. The pid is what stops two concurrent sessions colliding on one tmp path,
// and 'wx' refuses a planted file so nothing can donate its permissions
// through the rename. An append landing between the read and the rename is
// lost, which is the trade trimLog documents and takes: the cost is one
// repeated nudge in another session, and the reap is what keeps this file from
// growing without bound.
function reapMarkers(nowMs) {
    const read = readMarkerText();
    if (!read.ok) return;
    const lines = markerLines(read.text);
    const kept = lines.filter((line) => {
        const at = line.at === null ? NaN : Date.parse(line.at);
        // An unusable `at` is dropped rather than kept forever: this file's
        // only writer is this hook, so a line without a readable timestamp is
        // corrupt and could never expire. Date.parse's leniency costs nothing
        // here because this value is only ever compared to a cutoff and never
        // emitted. A line dated in the FUTURE (a backward clock step, a pinned
        // clock seam) is kept: it stays bounded by the line cap, and dropping
        // it would break the dedupe for the session that wrote it.
        return Number.isFinite(at) && nowMs - at <= MARKER_MAX_AGE_MS;
    }).slice(-MARKER_MAX_LINES);
    // Compared against the RAW line count, not against the parsed one, so a
    // line that failed to parse also earns the one rewrite that removes it.
    const rawCount = read.text.split('\n').filter((line) => line !== '').length;
    if (kept.length === rawCount) return;
    const text = kept.length === 0 ? '' : kept.map((line) => line.raw).join('\n') + '\n';
    const tmp = markerPath() + '.tmp.' + process.pid;
    try {
        fs.writeFileSync(tmp, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
        fs.renameSync(tmp, markerPath());
    } catch {
        try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
    }
}

// The session id, bounded, or null when there is none usable. Both spellings
// are read because kit-goal-stop.js reads both at its own payload door.
function normSessionId(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return trimmed.slice(0, SESSION_ID_MAX);
}

// How coarsely the reset instant is bucketed for KEYING. FIVE minutes, and
// what the width buys is drift tolerance and nothing else. The straddle, which
// is the one hazard a rounding bucket has, is covered at ANY width by the
// neighbouring-bucket probe at the check (see markerSeen), so narrowing this
// costs tolerance one for one and buys no safety. A narrowing to one minute
// shipped once, reasoning that a whole-minute nominal can never sit on a
// half-bucket boundary. That is true and beside the point: the probe had
// already made the boundary harmless.
//
// What the drift actually measures. Two lines from the operator's own live
// store carry one nominal reset a second apart (17:00:00 and 16:59:59), so it
// is about a second either side of a whole-minute nominal, which any width
// from a minute up absorbs. And the instants observed live (22:50:00 on the
// session window, 17:00:00 and 2026-09-06T17:00:00 on the weekly ones) all sit
// ON the five-minute grid, which is the FURTHEST a value can be from a
// half-bucket boundary rather than the closest. An earlier comment defended
// this width by claiming reset instants sit at :00 and :30 of the hour; that
// wording was wrong and its conclusion was right.
//
// The upper bound is the five hours that separate two occurrences of the
// shortest window the kit tracks, which a five-minute bucket and its two
// neighbours come nowhere near, so a rolled window still keys apart. Behaviour
// does not otherwise pin this number (a sweep at 1s, 30s and 15min left the
// entire suite green), so the suite now pins the rendered key of two instants
// that each of those three widths gets wrong.
const RESET_BUCKET_MS = 5 * 60 * 1000;

// The reset instant reduced to something stable enough to identify one window
// occurrence by, offset by whole buckets for the neighbour probe (see
// markerSeen). Two live defects sit behind this and the second is why rounding
// rather than truncation is needed.
//
// The endpoint returns resets_at at microsecond precision that VARIES between
// reads of one window (.171560, .211728, .100701 for a single 17:00:00
// instant), so the raw string re-keyed on every cache refresh and re-emitted
// the wind-down every 120 seconds, which is the flood this marker exists to
// prevent. Truncating the fraction fixed that and was still not enough: the
// value is COMPUTED per response rather than read off a fixed boundary, so
// consecutive reads then returned 17:00:00 and 16:59:59, straddling the second
// and the minute at once. Both were found by the feature running for real, on
// the account it protects, after 516 tests and nine reviewer dispatches had
// missed them, because every fixture in the suite uses a hand-written timestamp
// and only real data drifts.
//
// Rounding to the nearest bucket rather than flooring is the point: flooring
// puts the danger zone exactly on the whole minute, which is exactly where
// these instants sit.
function resetBucket(resetsAt, bucketOffset) {
    if (resetsAt === null) return '-';
    const ms = Date.parse(resetsAt);
    if (!Number.isFinite(ms)) return '-';
    const bucket = (Math.round(ms / RESET_BUCKET_MS) + (bucketOffset || 0)) * RESET_BUCKET_MS;
    // Rendered in the `+00:00` form the endpoint publishes and normTimestamp
    // preserves, and without milliseconds, so a bucket-aligned instant renders
    // the exact string an existing marker line already holds. The render was
    // `Z` between f36e586 and this fix, and it was self-consistent: those
    // markers were written and checked in the same form, so they matched each
    // other. What they could not match is the `+00:00` form every key already
    // on the operator's disk carries (`weeklyAll|2026-08-30T17:00:00+00:00|warn`),
    // written before f36e586 introduced the `Z` render.
    //
    // So the invisibility is scoped to a boundary in each direction rather than
    // running across the whole history, and BOTH directions are worth stating.
    // Backwards it is closed: a wind-down already delivered against a
    // pre-f36e586 key would otherwise have been delivered again, and a barrier
    // recorded that way would have stopped suppressing the warn behind it.
    // Checked against the live store on 2026-08-30, its five keys are all the
    // `+00:00` form and none is a `Z` form, and the one whose instant is
    // BUCKET-ALIGNED (`...T17:00:00+00:00`) is the exact string this render
    // produces for every one of the five instants recorded there, so that
    // window stays suppressed.
    //
    // Forwards it is open, and that is a property of the deployment rather than
    // of this machine. The build the plugin cache holds at user scope
    // (a0a6d3d4f4cb, read there on 2026-08-30) ships f36e586's `Z` render
    // beside this same five-minute bucket, so a marker IT writes is invisible
    // to this render exactly as a `+00:00` marker was invisible to it. No such
    // key exists here, which is why the live check above is clean; on any
    // adopter whose store was written by that build, the first run behind a
    // `/plugin update` can repeat one already-delivered nudge per key. One
    // repeat and not a flood: the new key is written and dedupes from there.
    return new Date(bucket).toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

// The dedupe key: session id, window key, reset instant and verdict state,
// bar-separated. A null reset instant contributes a literal '-' rather than an
// empty segment, because an empty one would let two windows with unreadable
// resets produce the same key and dedupe across each other instead of within
// one. The bar stays safe as the delimiter even for a session id that contains
// one: the last THREE segments are drawn from bar-free fixed sets (two window
// literals; either a timestamp normTimestamp has already anchored or '-'; and
// 'warn' or 'barrier'), so the key still reads unambiguously from the right and
// no two distinct tuples collide.
function markerKey(sessionId, windowKey, resetsAt, state, bucketOffset) {
    return [sessionId, windowKey, resetBucket(resetsAt, bucketOffset), state].join('|');
}

// Is a marker for this tuple already on record? The bucket either side counts,
// which is what makes the rounding safe rather than merely narrow: an instant
// that happens to sit on the half-bucket boundary rounds one way on one reading
// and the other way on the next, and without the probe that re-arms the nudge
// exactly as the raw string did. It is only ever asked at the CHECK; the line
// written is the exact bucket, never a neighbour, so the file gains no extra
// keys and an offset probe can only ever add silence.
//
// Safe because two distinct occurrences of one window are at least five hours
// apart (the session window is the shortest the kit tracks) while these buckets
// are five minutes wide, so a probe reaches at most a bucket and a half either
// side of the instant and no neighbour of one occurrence can come near the
// next. A null reset instant renders '-' at every offset, so the three probes
// collapse to the one key there.
function markerSeen(seen, sessionId, windowKey, resetsAt, state) {
    for (const offset of [-1, 0, 1]) {
        if (seen.has(markerKey(sessionId, windowKey, resetsAt, state, offset))) return true;
    }
    return false;
}

// Would this verdict speak at all? The two states that emit, and every reader
// failure lands outside them: evaluate resolves no-token, no-store, locked,
// expired, rate-limited, timeout, parse and bad-call alike to `clear`, which is
// the fail-open direction this whole feature is built on.
function wouldEmit(verdict) {
    return verdict.state === 'warn' || verdict.state === 'barrier';
}

// One of exactly two literals. evaluate returns a null resetsAt on a non-clear
// verdict whenever the producing window's timestamp failed validation, which is
// reachable straight off the wire from a window carrying a valid percent and a
// malformed resets_at, so the unknown case is a real one rather than a
// defensive arm.
function resetClause(resetsAt) {
    return resetsAt === null ? 'Its reset instant could not be read.' : `Resetting at ${resetsAt}.`;
}

// Step 4 of the barrier's sequence and step 8 of the wind-down's stop block,
// and the ONE place its wording lives. It had been hand-copied into each text,
// which is how two copies of it drifted apart under a contract saying never to
// paraphrase. Two forms, by whether the reset instant validated: the null form
// must not demand an instant the first line has just said could not be read.
function blockedStep(resetsAt) {
    if (resetsAt === null) {
        return 'Surface a line whose very first characters are `BLOCKED:`, naming this window and its percent, and saying its reset instant could not be read, then stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.';
    }
    return 'Surface a line whose very first characters are `BLOCKED:`, naming this window, its percent and its reset instant, and stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.';
}

// The wind-down text. It names the BARRIER rather than the warn threshold it
// just crossed, on purpose: the warn exists to precede the deadline, so the
// number worth stating is the deadline being wound down ahead of.
//
// TWO EXPLICITLY SCOPED BLOCKS, and the scoping is this text's correctness
// rather than its presentation. The lead says this is not a stop; the first
// block is what to do WHILE THE RUN CONTINUES; the second is the bookkeeping OF
// A STOP, and it applies only once the run has actually reached the boundary
// the first block sends it to. One unconditioned numbered list is what this
// replaced, and a model executing that list halted the run at the warn
// threshold and armed a resume for a window that was never exhausted, which is
// the exact behavior the warn band exists to remove. The other way round was no
// better: a run that honored the keep-working step instead left an armed job
// firing into a session that never stopped.
//
// The resume and the BLOCKED lead therefore belong to the STOP rather than to
// the threshold, and they are still carried here rather than left to the
// barrier text because the stop a wind-down leads to may never reach a barrier.
// The run stops spending at the boundary, so the barrier that would have
// carried them is never crossed, and kit-goal-stop.js releases its leash only
// on the `BLOCKED:` lead this block asks for.
//
// One consequence worth stating for the next reader: this text branches on the
// WINDOW as well as on the reset instant, because resumeStep does, so warn and
// barrier have the same four reachable renderings each.
function warnText(windowKey, label, percent, barrier, resetsAt) {
    return [
        `Kit usage wind-down: the ${label} usage window is at ${percent}% and the barrier the operator set for it is ${barrier}%. ${resetClause(resetsAt)}`,
        '',
        'Subagent dispatch is now being refused. This is not a stop: the effort continues in the main thread, which costs a fraction of what a dispatch does.',
        '',
        'While you keep working:',
        '1. Finish the section in flight and stage it.',
        '2. Do not dispatch subagents. The kit is refusing them until this window resets, so one would come back denied rather than running.',
        '3. Keep working on what needs no subagent: documentation, the plan doc and its Chapters, investigation, staging, answering the operator.',
        '4. Do not CLOSE a section that would normally take review, where closing means marking it complete rather than merely finishing the work of step 1. Review is dispatched here too, so it is unavailable, and landing unreviewed work while nobody is watching is the trade this threshold exists to avoid.',
        '5. Do not open another section. Stop when the one in flight reaches a clean boundary.',
        '',
        'Then, and only once you have actually stopped:',
        '6. Write the Chapter in the plan doc naming this wind-down as the reason. If no section is in flight, or you cannot write there, record where the effort stopped and hand that back instead.',
        '7. ' + resumeStep(windowKey, resetsAt),
        '8. ' + blockedStep(resetsAt),
        '',
        'This is a spend control the operator armed, not an error and not a rate limit. Nothing is broken and no work is lost.',
    ].join('\n');
}

// The resume step, step 3 of the barrier text and step 7 of the wind-down's
// stop block, and the one line that splits by horizon. The
// session window resets in under five hours, so a paused session arms a
// one-shot job at the reset instant, and such a job fires only while the REPL
// is idle, which is precisely the paused state. The weekly window resets days
// out, where resuming unattended that far ahead is not a pause, so it never
// arms one whether or not the instant is known. Both mechanisms are
// session-scoped model tools rather than hooks, so this text instructs and
// never arms. Never-arm is the fallback rather than the session branch, so a
// window key this hook does not model could not reach an armed resume.
//
// The session step names the instant AND allows for it having already passed,
// because a reset instant in the past is reachable rather than hypothetical: a
// barrier can fire on data up to 119 seconds old, and normTimestamp validates
// an ISO-8601 shape with a zone rather than futurity. Without the clause a
// scheduler handed a past instant is left to guess.
//
// The weekly arm names the WINDOW and not the barrier, because this step is
// shared with the wind-down text and with usage-barrier.js's deny, where a
// wind-down saying the effort is held on the weekly usage BARRIER would
// contradict the lead sentence three lines above it.
function resumeStep(windowKey, resetsAt) {
    if (windowKey !== 'session') {
        return 'Do not arm a resume. This window resets days out, and auto-resuming unattended that far ahead is not a pause. Notify the operator that the effort is held on the weekly usage window, then stop.';
    }
    if (resetsAt === null) {
        return "Do not arm a resume: this window's reset instant could not be read, and a resume needs one. Say so in the BLOCKED line so the operator knows to restart by hand.";
    }
    return `Arm a one-shot resume: create a single scheduled job at ${resetsAt}, or immediately if that instant has already passed, whose prompt resumes this effort from the plan doc. That job lives in this session's memory and dies with the session, so it resumes only if this session is still open at that instant. Say in the BLOCKED line whether you armed it.`;
}

function barrierText(windowKey, label, percent, barrier, resetsAt) {
    return [
        `Kit usage barrier: the ${label} usage window is at ${percent}%, at or past the barrier of ${barrier}%. ${resetClause(resetsAt)}`,
        '',
        'Stop now, in this order:',
        '1. Stage whatever is already complete. Start nothing new, and dispatch no subagent: the kit is denying Agent dispatch until this window resets.',
        "2. Write the current section's Chapter in the plan doc, naming this barrier as the reason the effort stopped. If no section is in flight, or you cannot write there, record where the effort stopped and hand that back instead.",
        '3. ' + resumeStep(windowKey, resetsAt),
        '4. ' + blockedStep(resetsAt),
        '',
        'This is a spend control the operator armed, not an error and not a rate limit. Nothing is broken and no work is lost.',
    ].join('\n');
}

function emit(text) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext: text,
        },
    }));
}

async function main() {
    // The payload is parsed for two fields: the subagent identity gated on
    // immediately below, and the session id the marker dedupes on. Nothing else
    // here reads it, because the config, the cache and the store are all
    // anchored to the home directory and CLAUDE_CONFIG_DIR rather than to the
    // session's cwd.
    let payload = {};
    try { payload = JSON.parse(readStdin() || '{}'); } catch { return; }

    // A tool call made INSIDE a subagent is not this hook's business, and this
    // gate is first because it costs no I/O and because every door downstream
    // would answer the wrong question.
    //
    // What is ESTABLISHED, and it is less than it looks: docs-write-guard.js's
    // header records live-fire evidence that plugin hooks fire for tool calls
    // made inside subagents and that the payload carries the subagent identity,
    // and that evidence is PreToolUse only. That PostToolUse rides the same tool
    // loop is an inference from the harness's structure rather than a fact
    // anyone has observed, and this payload has never run in a live session
    // behind a `/plugin update`.
    //
    // Two failure modes this gate closes IF the identity arrives here. With the
    // PARENT session id in the payload (what subagent transcripts on this
    // machine show: the parent session_id plus a separate agentId), a subagent's
    // tool call would consume the orchestrator's one nudge for that key and the
    // orchestrator would never be told, and that is the normal case rather than
    // an edge, because while an Agent call is in flight EVERY tool call is the
    // subagent's. If instead the additionalContext lands in the subagent's own
    // loop, an implementer is told to write the section's Chapter (which
    // docs-write-guard then denies it) and to stop the turn, the exact
    // mis-delivery that dropping SubagentStop avoided.
    //
    // Two behaviours it does NOT close, neither of them verifiable from here.
    // PostToolUse may fire in subagent context while OMITTING the identity
    // fields, in which case this gate is inert and both failure modes above
    // stay open. And the mirror: if the orchestrator's own PostToolUse payload
    // for an `Agent` call carries a top-level agent identity, this gate silences
    // the nudge at exactly the section boundary that made dropping SubagentStop
    // costless. So this is not an exhaustive guard, and the first live armed run
    // is the point at which to check which behaviour actually holds.
    //
    // Under every one of the four it is fail-open in this hook's sense: the gate
    // can only ever add silence, never an emission and never a deny. The agent
    // identity deliberately does NOT go into the dedupe key instead: per-agent
    // keying would preserve orchestrator delivery while multiplying the
    // mis-delivery, which is the worse half.
    const agentType = subagentType(payload);
    if (agentType !== null && !isBackgroundMain(agentType)) return;

    // First, and cheap on purpose. The feature is off unless the operator armed
    // it, that is the whole of the ordinary case, and this hook runs after
    // every tool call, so the disabled path costs one capped config read (plus
    // the realpath and hash that key the store) and nothing else: no cache
    // read, no credential, no network. readConfig never throws and resolves
    // absent, unreadable, over-cap, unparseable and misshapen alike to the
    // defaults, which are disabled.
    const config = lib.readConfig();
    if (config.enabled !== true) return;

    // No session id, no dedupe, and a nudge that cannot dedupe would fire after
    // every tool call for the rest of the run. Silence is the safe direction.
    const sessionId = normSessionId(payload.session_id || payload.sessionId);
    if (sessionId === null) return;

    let usage = await lib.readUsage({ maxAgeSeconds: lib.STALENESS_SECONDS });
    let verdict = lib.evaluate(usage, config);
    if (!wouldEmit(verdict)) return;

    // The verdict would speak but judged data older than its own budget: one
    // re-read at the tighter budget, then re-decide on the second verdict.
    // Exactly one, never a loop; a loop here is a hook that can spin after
    // every tool call. The bound holds structurally too: a read at the tighter
    // budget can only return data younger than it, so a third pass could never
    // learn more.
    //
    // Re-reading rather than falling silent is what keeps the wind-down timely.
    // The first read serves a cache up to 600s old while anything this hook
    // SAYS is held to 120s, so silence on the gap would leave it able to speak
    // during only about 120 of every 600 seconds, and a crossed threshold could
    // keep the main thread spending for minutes before the instruction landed.
    // That delay is the cost S9 exists to prevent.
    //
    // The budget is lib.withinDenyBudget rather than the verdict's own number,
    // which is what makes this hook's claim about a refusal and the barrier's
    // actual refusal rest on the same data. It also covers a case an earlier
    // comment here got wrong by calling the tightened cadence "every barrier
    // verdict by construction": evaluate floors its near point at
    // Math.max(1, barrier - 10), so a barrier below 1 leaves a barrier-state
    // percent under 1 on the wide 600s cadence (measured: barrier 0.5, percent
    // 0.6). A barrier in [1, 11) is not such a case, since the floor puts the
    // near point at 1 and any percent reaching that barrier is already past it.
    //
    // Every failure of the second pass stays silent: a re-read that fails lands
    // as `clear` and fails wouldEmit, and a second verdict still outside the
    // deny budget is refused outright.
    if (!lib.withinDenyBudget(verdict)) {
        usage = await lib.readUsage({ maxAgeSeconds: lib.STALENESS_NEAR_BARRIER_SECONDS });
        verdict = lib.evaluate(usage, config);
        if (!wouldEmit(verdict)) return;
        if (!lib.withinDenyBudget(verdict)) return;
    }

    // The window gate, and the only place a window key becomes prose.
    // hasOwnProperty rather than a truthiness test on the lookup, so an
    // inherited Object.prototype name cannot resolve to a label.
    if (!Object.prototype.hasOwnProperty.call(WINDOW_LABELS, verdict.window)) return;
    const label = WINDOW_LABELS[verdict.window];

    // Rendered FAITHFULLY at one decimal by the library's shared formatter,
    // never through a rounding direction: rounding let a WARN print a first
    // line whose numbers assert a barrier (at barrier 95 and percent 94.6
    // both rendered 95, so the text read "is at 95% and the barrier the
    // operator set for it is 95%" above an instruction to wind down BEFORE
    // the barrier), flooring reopened the same class from the other side
    // (95.5 against a barrier of 95.9 rendered 95 and 95), and
    // formatOneDecimal's comment carries why no rounding rule can close it.
    //
    // Both values are checked finite HERE rather than trusted from the door
    // that decided: a null percent can never reach a non-clear verdict
    // (windowState reports `clear` for an unknown percent) and normThreshold
    // always yields a bounded number, but the rule that only a finite number is
    // ever interpolated is absolute, so the door that emits is the one that
    // enforces it. readConfig guarantees a complete threshold object for both
    // window keys in WINDOW_LABELS, so that lookup cannot miss.
    const rawBarrier = config[verdict.window].barrier;
    if (!Number.isFinite(verdict.percent) || !Number.isFinite(rawBarrier)) return;
    const percent = lib.formatOneDecimal(verdict.percent);
    const barrier = lib.formatOneDecimal(rawBarrier);

    // The dedupe, and both questions are answered from the one read, each of
    // them across the bucket either side (see markerSeen). The verdict's own
    // key is the ordinary one. The second is what keeps adding
    // the state to the key from introducing warn-after-barrier: a percent
    // falling back from 96 to 82 on the same reset instant would otherwise emit
    // the milder instruction after the stronger one, which tells a
    // winding-down run to wind down less. The reverse needs no guard, because a
    // barrier after a warn is exactly what the state in the key exists to
    // allow.
    const marker = readMarkerText();
    if (!marker.ok) return;
    const seen = markerKeySet(marker.text);
    const key = markerKey(sessionId, verdict.window, verdict.resetsAt, verdict.state);
    if (markerSeen(seen, sessionId, verdict.window, verdict.resetsAt, verdict.state)) return;
    if (verdict.state === 'warn'
        && markerSeen(seen, sessionId, verdict.window, verdict.resetsAt, 'barrier')) return;

    // The store is created only here, on the path about to write it: a disabled
    // or clear run never touches it. A store that cannot hold the marker takes
    // the same silent direction as a missing session id, for the same reason.
    if (!lib.ensureStore().ok) return;

    // The kit's own clock seam rather than Date.now(), so the marker's
    // timestamp and the reap's cutoff sit on the same timeline as the reading
    // this nudge was written for. Unreachable as a failure by this point
    // (readUsage refuses the same unparsable seam as bad-call, which lands as
    // `clear` above), and it stays a door rather than a fallback because
    // falling back to the wall clock would write an `at` the reap then measures
    // against a different clock.
    const clock = lib.resolveNow();
    if (!clock.ok) return;

    // The marker is written BEFORE the emission and the emission is gated on
    // it: a nudge emitted without its marker would repeat after every tool call
    // for the rest of the run, while a marker whose nudge did not land costs
    // one nudge. The flood is the worse failure, so the order takes that side.
    if (!appendMarker(key, clock.now.toISOString())) return;

    emit(verdict.state === 'barrier'
        ? barrierText(verdict.window, label, percent, barrier, verdict.resetsAt)
        : warnText(verdict.window, label, percent, barrier, verdict.resetsAt));

    // Last, and only on this path. After the emission rather than before it, so
    // a failure in the bookkeeping cannot cost a nudge whose marker already
    // claims it was delivered.
    reapMarkers(clock.now.getTime());
}

// The whole of main inside one swallowing catch. A synchronous throw inside an
// async function arrives as a rejection, so this single catch is the same
// whole-of-main swallow the synchronous sibling nudges write as try/catch, and
// it is also what keeps a rejection off the top level: this hook runs after
// every tool call, and an unhandled rejection there would print a warning to
// stderr on every one of them.
main().catch(() => { /* never break a turn over a hook */ });
