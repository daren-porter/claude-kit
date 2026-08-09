#!/usr/bin/env node
// CLI entry for the kit-owned cross-project memory tier.
//
// Subcommands:
//   memory.js add <name> --kind <machine|platform> --description "<text>"
//                        [--machine <label>] [--origin <label>] [--body "<text>"]
//   memory.js list [--kind <machine|platform>]
//   memory.js get <name>
//   memory.js stamp <name>
//   memory.js decay
//
// Every filesystem operation and every field validation lives in
// memory-lib.js; this file is argument parsing, the concurrency choices
// around writes, and output formatting. Node core only, CommonJS, zero
// dependencies.
//
// Retrieval here is a convenience and never the only path: record bodies stay
// plain markdown that any reader can open directly, so this CLI must not
// become a gate on reading. It IS the only writer, which is what lets the
// generated stamps and the field validation hold.
//
// Status is set through process.exitCode and the process is left to end on
// its own. A process.exit() after writing to stdout can discard bytes still
// in flight on a pipe; that is an open defect at seven sites in this kit and
// not one to reproduce in new code.

'use strict';


const lib = require('./memory-lib.js');
// The index sidecar is maintained by the writer. Nothing else can: the
// SessionStart hook only reads, and an index nobody writes leaves every
// `[body revised]` comparison with no stored hash to compare against, so the
// marker could never fire while the emitted block promised it could.
const index = require('./memory-index.js');

// Advisory decay ranking. Nothing here retires, deletes, or rewrites
// anything: the ranked list is a prompt for a human decision, which is why
// these can be seeds rather than tuned values.
//
//   idleDays  = days since the most recent applied day, or since `created`
//               when the record was never applied
//   extension = min(distinctAppliedDays * EXTEND_PER_APPLIED_DAY, EXTEND_CAP_DAYS)
//   candidate when idleDays > SUMMARIZE_AFTER_DAYS + extension
//
// Use buys time rather than immunity. A record applied on many distinct days
// has proven itself and earns a longer runway, while the cap stops an old
// streak from propping up a record nothing has touched in a year.
const SUMMARIZE_AFTER_DAYS = 30;
const EXTEND_PER_APPLIED_DAY = 7;
const EXTEND_CAP_DAYS = 60;

// Concurrency. The library's tmp+publish write prevents a torn file but not
// a lost update: two concurrent stamps each read, each append a day, and the
// later write erases the earlier one's. This tier is shared across concurrent
// sessions of every project, so both write paths are optimistic rather than
// locked. `add` publishes with linkSync, which fails EEXIST and so claims the
// name in one atomic syscall. `stamp` reads, modifies, and publishes under a
// compare-and-swap on the record's mtime, retrying on a lost race.
//
// This replaced a store-wide lockfile after two review rounds in which every
// Critical was a lock-lifecycle failure: a stale lock stolen with no grace
// period, a reused pid wedging every write from every project until a human
// deleted the file, an unbreakable lock spinning at 100% CPU. None of those
// can exist without a lock. A pid is also meaningless in this store's own
// future, since the root was chosen so the store can be synced across
// machines and a pid recorded on one host says nothing on another.
//
// Stamping appends to that journal and never rewrites a record, so there is
// no lost-update window to bound and no retry to tune. The earlier design
// rewrote the record under a compare-and-swap; it was measured losing a day
// 8.3% of the time with two concurrent stampers, every process reporting
// success, which is the "accept and discard" shape this tier refuses.

// Output caps. Every string reaching stdout or stderr is reduced to printable
// ASCII and capped first, matching the sibling hooks. Truncation is announced
// rather than silent: `applied` can legitimately be a long list, and a line
// that quietly lost its tail is the silent-drop shape this tier is built
// against.
const LINE_CAP = 4000;
const REASON_CAP = 300;
const LABEL_CAP = 60;
const BODY_OUT_MAX = 64 * 1024;

const ADD_FLAGS = ['kind', 'description', 'machine', 'origin', 'body'];

// Characters the generated lines use as structure. `list` emits
// `- <name> [<kind>] @<machine>: <description>`, so a value interpolated
// AHEAD of the description can forge everything after it. Reproduced through
// the sanctioned writer with no hand-editing:
//   --machine 'prod] @other-box: <forged correction>'
// put attacker-chosen text in the description position of the emitted line.
// The library already refuses a comma in a metadata value because a comma
// delimits its inline lists; these are the same class of character for the
// lines this file generates, so they are refused at the write door and
// neutralized at the render door (a hand-edited record never passes the
// write door).
//
// `description` is deliberately NOT covered: it is the last field on the
// line, so nothing it contains can displace a field after it, and refusing a
// colon there would refuse legitimate corrections ('ban "Net effect:" style
// prose' is a real record). Section 4 must keep it last for the same reason.
const LINE_DELIMITERS = /[[\]@:]/;
// Derived rather than written twice: a delimiter added to one copy and not
// the other is precisely the one-door-not-every-door defect.
const LINE_DELIMITERS_ALL = new RegExp(LINE_DELIMITERS.source, 'g');

// Bidi overrides and zero-width characters, by codepoint so this line is
// legible in source. Every channel this file writes is reduced to printable
// ASCII, so these cannot reach a terminal through the CLI, but a record body
// is read DIRECTLY by humans and models at its absolute path, which is the
// whole point of the tier's "the CLI is not a gate on reading" rule. That
// direct read is the Trojan Source shape: text that renders in one order and
// is stored in another. Refused at the write door, where the only sanctioned
// author is standing.
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;

function render(value, cap) {
    const safe = lib.sanitize(String(value == null ? '' : value), 0);
    return safe.length > cap ? safe.slice(0, cap) + ' [truncated]' : safe;
}

// A value bound for a structural position on a generated line. The delimiter
// substitution happens BEFORE render so the ' [truncated]' marker's own
// brackets survive it. Neutralized rather than dropped: a hand-edited record
// must still appear in the listing, just without the power to forge the
// fields after it, and `get` still shows the record verbatim.
function label(value) {
    return render(String(value == null ? '' : value).replace(LINE_DELIMITERS_ALL, ' '), LABEL_CAP);
}

function out(line, cap) {
    process.stdout.write(render(line, cap || LINE_CAP) + '\n');
}

function fail(reason) {
    process.stderr.write('memory: ' + render(reason, REASON_CAP) + '\n');
    process.exitCode = 1;
}

// `list | head` and `list | grep -q` are the obvious usages, and both close
// the read end mid-run. Node's default for the resulting EPIPE is an uncaught
// exception, which put 1245 bytes of stack trace on stderr and exited 1 for
// `memory.js list | head -2` against a 40-record store. A reader that stopped
// reading is a normal end to a read, not a failure of the command, and this
// CLI's contract is a sanitized line rather than a stack trace on every path.
// Installed before anything writes, on both channels: `2>&1 | head` closes
// stderr the same way.
function tolerateClosedPipe(stream, other) {
    stream.on('error', err => {
        const code = err && err.code;
        if (code === 'EPIPE' || code === 'ERR_STREAM_DESTROYED') return;
        // Any other stream failure is real, and is reported on the channel
        // that is still open rather than swallowed.
        process.exitCode = 1;
        try {
            other.write('memory: output stream failed: ' + render(code || 'unknown error', LABEL_CAP) + '\n');
        } catch {
            /* both channels are gone; the exit code is all that is left */
        }
    });
}

function usage() {
    process.stderr.write([
        'usage: memory.js add <name> --kind <machine|platform> --description "<text>"',
        '                  [--machine <label>] [--origin <label>] [--body "<text>"]',
        '       memory.js list [--kind <machine|platform>]',
        '       memory.js get <name>',
        '       memory.js stamp <name>',
        '       memory.js decay',
        '',
    ].join('\n'));
    process.exitCode = 1;
}

// Argument parsing. An unknown option, a repeated one, or one missing its
// value is reported rather than ignored: silently dropping `--description`
// because it was misspelled would create a record without the field that
// generates its emitted line.
function parseFlags(argv, allowed) {
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (typeof token !== 'string' || !token.startsWith('--')) {
            return { ok: false, reason: 'unexpected argument: ' + render(token, LABEL_CAP) };
        }
        let key = token.slice(2);
        let value = null;
        const eq = key.indexOf('=');
        if (eq !== -1) {
            value = key.slice(eq + 1);
            key = key.slice(0, eq);
        }
        if (!allowed.includes(key)) {
            return { ok: false, reason: 'unknown option: --' + render(key, LABEL_CAP) };
        }
        if (Object.prototype.hasOwnProperty.call(flags, key)) {
            return { ok: false, reason: 'option --' + key + ' was given twice' };
        }
        if (value === null) {
            const next = argv[i + 1];
            if (next === undefined || isFlagToken(next, allowed)) {
                return { ok: false, reason: 'option --' + key + ' needs a value' };
            }
            value = next;
            i++;
        }
        flags[key] = value;
    }
    return { ok: true, flags };
}

// Only a KNOWN flag name ends the previous flag's value. Treating any token
// starting with `--` as a flag refused a legitimate body opening with a
// markdown horizontal rule (`--body '--- a leading rule'` exited 1), and a
// body is free text this CLI is the only door for.
function isFlagToken(token, allowed) {
    if (typeof token !== 'string' || !token.startsWith('--')) return false;
    const key = token.slice(2).split('=')[0];
    return allowed.includes(key);
}

// The library validates every authored single-line field, but not the body,
// which is legitimately multi-line and so cannot go through the same check.
// Escape sequences and NULs in a body still reach a terminal and the model on
// `get`, so the guard is applied at this door instead, the only one a body
// enters through: tab and newline pass, nothing else in the control range
// does.
//
// CRLF is normalized rather than refused. A body pasted from Windows arrives
// with \r\n and every read door in the tier already tolerates it
// (parseRecord splits on /\r?\n/, outBody rewrites it), so failing the write
// door alone would refuse a body the rest of the tier reads happily. A LONE
// \r survives the normalization and is still refused: it rewrites the line a
// reader just saw, which is the control-character problem, not a line ending.
// Returns the normalized value, which is what the caller must write.
function validateBody(value) {
    const normalized = String(value == null ? '' : value).replace(/\r\n/g, '\n');
    if (/[\x00-\x08\x0B-\x1F\x7F]/.test(normalized)) {
        return { ok: false, reason: 'body must not contain control characters other than tab and newline' };
    }
    if (INVISIBLE.test(normalized)) {
        return { ok: false, reason: invisibleReason('body') };
    }
    return { ok: true, value: normalized };
}

function invisibleReason(field) {
    return field + ' must not contain bidirectional-override or zero-width characters;'
        + ' they hide text from a reader opening the record directly';
}

function resolveNow() {
    const raw = process.env.CLAUDE_KIT_MEMORY_NOW;
    if (!raw || !raw.trim()) return { ok: true, now: new Date() };
    const parsed = new Date(raw.trim());
    if (Number.isNaN(parsed.getTime())) {
        return { ok: false, reason: 'CLAUDE_KIT_MEMORY_NOW is not a parsable date: ' + render(raw, 60) };
    }
    return { ok: true, now: parsed };
}

// UTC throughout, matching the library's generated `created` and `modified`.
// A local-time day would make the same instant stamp two different days on
// two machines sharing one synced store.
function dayOf(date) {
    return date.toISOString().slice(0, 10);
}

// The shape check is not enough on its own: Date.UTC rolls over, so
// 2026-13-45 becomes 2027-02-14 and 2026-02-31 becomes 2026-03-03, and both
// would rank in the decay query at a date nobody wrote. Reconstructing the
// components from the result and comparing is what turns an impossible date
// into the null the callers already handle (stamp refuses, decay counts it as
// unrankable) instead of a plausible wrong answer.
function dayNumber(day) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day));
    if (!m) return null;
    const [year, month, date] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const ms = Date.UTC(year, month - 1, date);
    if (Number.isNaN(ms)) return null;
    const back = new Date(ms);
    if (back.getUTCFullYear() !== year || back.getUTCMonth() + 1 !== month || back.getUTCDate() !== date) {
        return null;
    }
    return Math.floor(ms / 86400000);
}

function appliedDays(record) {
    // The union of the journal (where stamps land) and any `applied:` written
    // by hand into the record. The journal is the write path; the frontmatter
    // form is tolerated so a hand-authored or migrated record keeps its
    // history without a conversion step.
    const fromRecord = (record && record.metadata && Array.isArray(record.metadata.applied))
        ? record.metadata.applied
        : [];
    const journal = lib.readAppliedJournal().days.get(record && record.name) || [];
    return Array.from(new Set(fromRecord.concat(journal))).sort();
}

// Refresh the derived sidecar after a write. Deliberately best-effort: the
// index is rebuildable from the records at any time, so a sidecar that could
// not be written is a marker that misses once, not a failed write. Failing the
// command here would let a derived cache veto an authoring act.
function syncIndex() {
    try {
        index.sync();
    } catch {
        /* derived data; the next write or read rebuilds it */
    }
}

function cmdAdd(args) {
    const [name, ...rest] = args;
    if (!name) return usage();

    // Checked here as well as in the library so the failure names the bad
    // argument before any lock is taken or any path is joined.
    const nameCheck = lib.validateName(name);
    if (!nameCheck.ok) return fail(nameCheck.reason);

    const parsed = parseFlags(rest, ADD_FLAGS);
    if (!parsed.ok) return fail(parsed.reason);
    const flags = parsed.flags;

    if (!flags.kind) return fail('--kind is required and must be one of: ' + lib.KINDS.join(', '));
    if (!lib.KINDS.includes(flags.kind)) return fail('--kind must be one of: ' + lib.KINDS.join(', '));
    if (!flags.description) {
        return fail('--description is required: it generates the line this tier emits into session context');
    }

    // Every authored value, enumerated: the three single-line fields plus the
    // body. `kind` is an enum checked above, and `name` is kebab-case.
    for (const field of ['description', 'machine', 'origin']) {
        if (flags[field] !== undefined && INVISIBLE.test(flags[field])) {
            return fail(invisibleReason('--' + field));
        }
    }
    // Only the values that land AHEAD of the description on a generated line.
    if (flags.machine !== undefined && LINE_DELIMITERS.test(flags.machine)) {
        return fail('--machine must not contain [ ] @ or : ; they delimit the generated list line');
    }

    const bodyCheck = validateBody(flags.body || '');
    if (!bodyCheck.ok) return fail(bodyCheck.reason);
    // The clock seam is honored here too. `stamp` and `decay` read it while
    // `add` silently ignored it, so a pinned run wrote today's `created` from
    // the wall clock: the one field of the three that cannot be backfilled
    // from anywhere else.
    const clock = resolveNow();
    if (!clock.ok) return fail(clock.reason);

    // No pre-check for an existing name. lstat-then-write is exactly the
    // check-then-act race the lock used to guard; linkSync answers "is this
    // name free" and "claim it" in one atomic syscall, so the answer cannot
    // go stale between the two. It refuses a dangling symlink too, because
    // the link itself occupies the name.
    const result = lib.writeRecord({
        name,
        description: flags.description,
        metadata: { kind: flags.kind, machine: flags.machine, origin: flags.origin },
        body: bodyCheck.value,
    }, clock.now, { mode: 'create' });

    if (!result.ok) return fail(result.reason);
    syncIndex();
    out('created ' + render(lib.recordPath(name), 200));
}

function cmdList(args) {
    const parsed = parseFlags(args, ['kind']);
    if (!parsed.ok) return fail(parsed.reason);
    const kind = parsed.flags.kind;
    if (kind !== undefined && !lib.KINDS.includes(kind)) {
        return fail('--kind must be one of: ' + lib.KINDS.join(', '));
    }

    const listed = lib.listRecords();
    if (listed.unreadable) return fail(unreadableStore(listed));
    const records = listed.records;
    const skipped = listed.skipped;
    const shown = kind === undefined
        ? records
        : records.filter(r => r.metadata && r.metadata.kind === kind);

    if (!shown.length) out(kind === undefined ? 'no records' : 'no records of kind ' + kind);
    for (const record of shown) {
        // The line is generated from `description` every time rather than
        // stored anywhere, so it cannot drift from the record it advertises.
        // `name` needs no delimiter pass: it is the validated kebab-case file
        // stem, taken from the listing and never from record content.
        const machine = record.metadata && record.metadata.machine
            ? ' @' + label(record.metadata.machine)
            : '';
        const recordKind = record.metadata && record.metadata.kind
            ? label(record.metadata.kind)
            : 'unknown';
        out('- ' + record.name + ' [' + recordKind + ']' + machine + ': '
            + render(record.description, lib.DESCRIPTION_MAX));
    }
    if (skipped > 0) {
        out('(' + skipped + ' entr' + (skipped === 1 ? 'y' : 'ies') + ' skipped as unreadable or malformed)');
    }
}

// An absent store and an unreadable one are different answers. Printing
// "no records" at exit 0 for a store that exists but could not be listed
// (permissions, a regular file at the root, an I/O error) is this tier's
// worst failure: it says there are no facts when it simply could not look,
// and a caller cannot tell the two apart.
function unreadableStore(listed) {
    return 'the store at ' + render(lib.storeRoot(), 160) + ' exists but could not be read'
        + (listed.reason ? ': ' + render(listed.reason, 120) : '')
        + '; this is not an empty store';
}

function cmdGet(args) {
    const [name, ...rest] = args;
    if (!name) return usage();
    if (rest.length) return fail('get takes one record name');

    const check = lib.validateName(name);
    if (!check.ok) return fail(check.reason);

    const result = lib.readRecord(name);
    if (!result.ok) return fail(result.reason);
    const record = result.record;

    out('name: ' + record.name);
    out('description: ' + render(record.description, lib.DESCRIPTION_MAX));
    // Every metadata key is printed, including ones this version does not
    // know about, so a field a later section adds is never invisible here.
    // Namespaced with `metadata.` because these are content: a record
    // carrying `metadata.name` or `metadata.description` otherwise emitted a
    // second line indistinguishable from the two authoritative ones above,
    // and the library takes the name from the filename precisely so content
    // can never claim it.
    for (const [key, value] of Object.entries(record.metadata || {})) {
        const rendered = Array.isArray(value)
            ? '[' + value.map(v => render(v, LABEL_CAP)).join(', ') + ']'
            : render(value, LINE_CAP);
        out('metadata.' + render(key, LABEL_CAP) + ': ' + rendered);
    }
    out('');
    if (record.partial) {
        // The library withholds the body of any record read past its cap, so
        // printing "(no body)" here would report an empty body for a record
        // that has a large one. Reported on both channels: stdout carries the
        // marker in the body's place, stderr and the exit code say the answer
        // is incomplete, and the path is the recovery, since a body is always
        // directly readable.
        out('[body withheld: this record is larger than the ' + lib.RECORD_READ_CAP
            + ' byte read cap, so only a prefix was read]');
        return fail('record ' + name + ' exceeds the ' + lib.RECORD_READ_CAP + ' byte read cap; read '
            + render(lib.recordPath(name), 160) + ' directly for the whole body');
    }
    outBody(record.body);
}

// The body is the payload the caller asked for, so it keeps its line breaks;
// only the rest of the control range is neutralized, and a body past the cap
// says so instead of ending mid-sentence.
function outBody(text) {
    const cleaned = String(text == null ? '' : text)
        .replace(/\r\n/g, '\n')
        .replace(/[^\x20-\x7E\n\t]/g, ' ')
        .replace(/\s+$/, '');
    if (!cleaned) {
        process.stdout.write('(no body)\n');
        return;
    }
    if (cleaned.length > BODY_OUT_MAX) {
        process.stdout.write(cleaned.slice(0, BODY_OUT_MAX)
            + '\n[body truncated at ' + BODY_OUT_MAX + ' characters]\n');
        return;
    }
    process.stdout.write(cleaned + '\n');
}

function cmdStamp(args) {
    const [name, ...rest] = args;
    if (!name) return usage();
    if (rest.length) return fail('stamp takes one record name');

    const check = lib.validateName(name);
    if (!check.ok) return fail(check.reason);
    const clock = resolveNow();
    if (!clock.ok) return fail(clock.reason);
    const today = dayOf(clock.now);

    // A stamp appends one line to the journal and never rewrites the record,
    // so there is no read-modify-write to lose and nothing to retry. The
    // record is still read first, to refuse a name that does not exist and to
    // report an already-stamped day honestly.
    const read = lib.readRecord(name, { frontmatterOnly: true });
    if (!read.ok) return fail(read.reason);

    const already = appliedDays(read.record).includes(today);
    const result = already ? { ok: true, already: true } : lib.appendApplied(name, today);

    if (!result.ok) return fail(result.reason);
    syncIndex();
    out(result.already
        ? name + ' was already stamped on ' + today
        : 'stamped ' + name + ' on ' + today);
}

function cmdDecay(args) {
    if (args.length) return fail('decay takes no arguments');
    const clock = resolveNow();
    if (!clock.ok) return fail(clock.reason);
    const todayNumber = dayNumber(dayOf(clock.now));

    const listed = lib.listRecords();
    if (listed.unreadable) return fail(unreadableStore(listed));
    const records = listed.records;
    const skipped = listed.skipped;
    const candidates = [];
    let unevaluated = 0;

    for (const record of records) {
        const rawDays = appliedDays(record).map(dayNumber);
        const days = rawDays.filter(n => n !== null);
        // An applied entry this code cannot parse makes the record's whole use
        // history untrustworthy, so it is counted rather than ranked on the
        // entries that happened to survive. Dropping the bad one and ranking
        // the rest fabricates idleness: a record applied yesterday through an
        // unparsable date read as idle 219 days and sorted to the top of the
        // candidate list. `stamp` already refuses this same record.
        if (rawDays.length !== days.length) {
            unevaluated++;
            continue;
        }
        const created = dayNumber(record.metadata && record.metadata.created);
        const lastUsed = days.length ? Math.max(...days) : created;
        if (lastUsed === null || lastUsed === undefined) {
            // No usable date at all, so idleness is unknowable. Counted and
            // reported rather than ranked at a made-up age.
            unevaluated++;
            continue;
        }
        const distinct = new Set(days).size;
        const extension = Math.min(distinct * EXTEND_PER_APPLIED_DAY, EXTEND_CAP_DAYS);
        const threshold = SUMMARIZE_AFTER_DAYS + extension;
        const idleDays = todayNumber - lastUsed;
        if (idleDays > threshold) candidates.push({ record, idleDays, threshold, distinct });
    }

    candidates.sort((a, b) => b.idleDays - a.idleDays || a.record.name.localeCompare(b.record.name));

    if (!candidates.length) out('no decay candidates');
    for (const c of candidates) {
        out('- ' + c.record.name + ' (idle ' + c.idleDays + 'd, threshold ' + c.threshold
            + 'd, applied on ' + c.distinct + ' day' + (c.distinct === 1 ? '' : 's') + '): '
            + render(c.record.description, lib.DESCRIPTION_MAX));
    }
    // Advisory only. This command reports; retiring or summarizing a record
    // stays a human decision made against the body.
    if (unevaluated > 0) {
        out('(' + unevaluated + ' record' + (unevaluated === 1 ? '' : 's')
            + ' could not be ranked: an unusable created or applied date)');
    }
    if (skipped > 0) {
        out('(' + skipped + ' entr' + (skipped === 1 ? 'y' : 'ies') + ' skipped as unreadable or malformed)');
    }
}

function main() {
    tolerateClosedPipe(process.stdout, process.stderr);
    tolerateClosedPipe(process.stderr, process.stdout);

    const [cmd, ...args] = process.argv.slice(2);
    try {
        if (cmd === 'add') cmdAdd(args);
        else if (cmd === 'list') cmdList(args);
        else if (cmd === 'get') cmdGet(args);
        else if (cmd === 'stamp') cmdStamp(args);
        else if (cmd === 'decay') cmdDecay(args);
        else usage();
    } catch (err) {
        // This CLI is the only authoring path, so a crash here is a lost
        // fact. Anything unexpected still leaves a sanitized message and a
        // non-zero status rather than a stack trace.
        fail(err && err.message ? err.message : String(err));
    }
}

main();
