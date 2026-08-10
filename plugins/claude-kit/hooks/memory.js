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
//   memory.js reindex
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

// Advisory decay ranking lives in memory-lib as `rankDecay`, because the
// SessionStart hook nudges with the same candidate count and cannot require
// this file (it runs main() on load). This command formats what that function
// ranks; nothing here retires, deletes, or rewrites anything.

// Concurrency. This tier is shared across concurrent sessions of every
// project, so neither write path takes a lock. `add` publishes with linkSync,
// which fails EEXIST and so claims the name in one atomic syscall. `stamp`
// does not touch the record at all: it appends one line to the applied
// journal, which is why there is no read-modify-write to guard here.
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
// `kind` is a closed enum, so a hand-edited value outside it renders as
// `unknown` rather than putting arbitrary prose in a slot the emitted block
// presents to the model as typed. `reindex` is what reports it.
function safeKind(value) {
    return lib.KINDS.includes(value) ? value : 'unknown';
}

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
        '       memory.js reindex',
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

// The seam itself lives in the library so the hook resolves the same clock:
// while it lived here, CLAUDE_KIT_MEMORY_NOW moved this command's list without
// moving the nudge's count, and the two could disagree about the very number
// the nudge sends a reader here to check.
function resolveNow() {
    return lib.resolveNow();
}

// UTC throughout, matching the library's generated `created` and `modified`.
// A local-time day would make the same instant stamp two different days on
// two machines sharing one synced store.
function dayOf(date) {
    return date.toISOString().slice(0, 10);
}

// Refresh the derived sidecar after a write. Deliberately best-effort: the
// index is rebuildable from the records at any time, so a sidecar that could
// not be written is a marker that misses once, not a failed write. Failing the
// command here would let a derived cache veto an authoring act.
function syncIndex() {
    try {
        const result = index.sync();
        return !!(result && result.ok);
    } catch {
        /* derived data; the next write or read rebuilds it */
        return false;
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
        const recordKind = safeKind(record.metadata && record.metadata.kind);
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

    const already = lib.appliedDays(read.record).includes(today);
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

    const ranked = lib.rankDecay({ now: clock.now });
    if (!ranked.ok) return fail(ranked.unreadable ? unreadableStore(ranked) : ranked.reason);
    const { candidates, unevaluated, skipped, journalUnreadable, journalTruncated, journalSkipped } = ranked;

    // An unreadable journal takes every stamp with it, so every record falls
    // back to `created` and the list becomes a set of records claiming "applied
    // on 0 days" that were in fact stamped yesterday. Printing that list with a
    // warning above it would still be presenting a fabricated ranking as the
    // ranking, and this command is the surface the nudge sends a reader to when
    // it suppresses itself for the same reason. So it refuses, non-zero, the
    // way an unreadable store already does: an input nobody could read must
    // never come back as an answer.
    if (journalUnreadable) {
        return fail('the applied-day journal at ' + render(lib.journalPath(), 200)
            + ' could not be read, so every stamp is missing and no ranking here would be real.'
            + ' Fix or move that file and run this again.');
    }

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
    // Both inflate idleness by losing applied days, so the list above may name
    // records that are not really idle. Said out loud rather than left for the
    // reader to infer from a number that looks exact.
    if (journalTruncated) {
        out('(the applied-day journal is larger than ' + lib.JOURNAL_READ_CAP
            + ' bytes, so the newest stamps were not read and this list may be too long)');
    }
    if (journalSkipped > 0) {
        out('(' + journalSkipped + ' applied-day journal entr' + (journalSkipped === 1 ? 'y' : 'ies')
            + ' could not be read, so this list may be too long)');
    }
}

// Re-establish the store's invariants after a hand edit, which is the
// sanctioned way to correct or retire a record and the one path that bypasses
// this CLI's validators. Two jobs, because they are the same job: the sidecar
// is re-synced, which is what ACKNOWLEDGES a `[body revised]` marker (nothing
// else clears one, since the hook deliberately never writes and `stamp` would
// invent an applied day the record never had), and every record is re-checked
// against the write-door validators, which is what catches a hand edit that
// wrote something `add` would have refused. Reporting only; it never edits a
// record, because deciding what a bad record should say is a human's call.
function cmdReindex(args) {
    if (args.length) return fail('reindex takes no arguments');

    const listed = lib.listRecords();
    if (listed.unreadable) return fail(unreadableStore(listed));

    const problems = [];
    for (const record of listed.records) {
        const check = lib.validateFieldText(record.description, 'description');
        if (!check.ok) problems.push(record.name + ': ' + check.reason);
        else if (String(record.description || '').length > lib.DESCRIPTION_MAX) {
            problems.push(record.name + ': description is ' + record.description.length
                + ' characters, over the ' + lib.DESCRIPTION_MAX + ' the writer allows, so its emitted line is truncated');
        }
        const kind = record.metadata && record.metadata.kind;
        if (!lib.KINDS.includes(kind)) {
            problems.push(record.name + ': kind ' + render(String(kind), 40) + ' is not one of ' + lib.KINDS.join(', '));
        }
        const body = validateBody(record.body || '');
        if (!body.ok) problems.push(record.name + ': ' + body.reason);
    }

    const synced = syncIndex();
    out('reindexed ' + listed.records.length + ' record(s)'
        + (listed.skipped > 0 ? ', ' + listed.skipped + ' unreadable or unparsable' : '')
        + (synced === false ? ' (the index sidecar could not be written)' : ''));
    if (!problems.length) return;
    // Non-zero: a store holding content the writer would have refused is a
    // state to fix, not a report to skim past.
    process.exitCode = 1;
    for (const p of problems) process.stderr.write('memory: ' + p + '\n');
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
        else if (cmd === 'reindex') cmdReindex(args);
        else usage();
    } catch (err) {
        // This CLI is the only authoring path, so a crash here is a lost
        // fact. Anything unexpected still leaves a sanitized message and a
        // non-zero status rather than a stack trace.
        fail(err && err.message ? err.message : String(err));
    }
}

main();
