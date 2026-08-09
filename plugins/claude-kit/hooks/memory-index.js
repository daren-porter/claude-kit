// Generated index for the kit-owned cross-project memory tier.
//
// Two surfaces, both non-throwing:
//
//   sync()   sweeps the store and updates the sidecar at <storeRoot>/.index.json
//   lines()  generates the lines SessionStart (section 4) emits, marking a
//            record whose body was revised while its description was not
//
// EVERY LINE IS GENERATED FROM `description:`. Nothing here reads a
// hand-maintained line, and nothing here stores one. That is the central
// decision of this tier: in the native store, index currency is a byproduct of
// CREATING a record (15 of 15 sessions) and never an act of REVISING one (0 of
// 8), so a second hand-maintained copy of the line drifts from the record it
// advertises as a matter of course. One copy cannot diverge from itself.
//
// ---------------------------------------------------------------------------
// THE SIDECAR. <storeRoot>/.index.json:
//
//   { "version": 1,
//     "records": { "<name>": { "descriptionHash": "<16 hex>",
//                              "bodyHash": "<16 hex>" | null } } }
//
// Dot-prefixed because it is DERIVED, per-machine, and not a record: the store
// root was chosen so it can be synced across machines, and a rebuildable
// observation of local state is the one file that must not travel. A future
// sync section excludes it by that name.
//
// It holds only what the marker needs: the two hashes observed at the last
// sync. It is never authority for a record's content, so a missing or corrupt
// sidecar REBUILDS (every record reads as new, and a rebuilt sidecar makes no
// drift claim it cannot support) rather than failing a session.
//
// `bodyHash: null` means OBSERVED BUT NOT COMPARABLE: the record is larger
// than the library's read cap, so its body was never read. That is a third
// state on purpose. Recording it as "unchanged" hides a revision forever, and
// recording it as "changed" cries wolf forever; it is reported in a count
// instead, and the caller surfaces it.
//
// ---------------------------------------------------------------------------
// THE `[body revised]` MARKER. It fires when the CURRENT body hash differs
// from the stored one WHILE the description hash is unchanged: the body was
// revised and the description that advertises it was not.
//
// When BOTH changed, the line refreshes silently with NO marker. The author
// updated the description along with the body, which is the correct behavior,
// not drift, and marking it would train the reader to ignore the marker.
//
// It is DESCRIPTIVE, not a truth claim. A body edit can perfectly well leave
// the description accurate (a typo fix, an added counter-case), so the marker
// says what was observed, "the body moved and this line did not", and leaves
// the judgment to whoever reads it. It is deliberately not named `[stale]`.
//
// The comparison is easy to get subtly backwards, and an inverted one passes
// every happy-path assertion while firing on EVERY record, which is a marker
// nobody reads. `markerFor` below is one function with one comparison for
// exactly that reason, and the tests pin the fire RATE over a seeded set, not
// just the fire.
//
// Change detection is by CONTENT HASH, never mtime, for the reason the library
// header gives: a record's file can be rewritten without its text changing.
//
// ---------------------------------------------------------------------------
// THE SEAM WITH SECTION 4. `lines()` never writes; `sync()` is the only
// writer. The caller therefore owns the marker's lifetime: syncing after an
// emission shows a given revision once, while leaving the sync to the CLI
// keeps the marker up until an author acts on it. Section 4 makes that call.
// This module refuses to make it implicitly by writing during a read.
//
// Node core modules only, CommonJS, zero dependencies. Every exported function
// degrades to a typed result rather than throwing: a SessionStart hook calls
// this and must never crash a session over a memory read.

'use strict';

const fs = require('fs');
const path = require('path');

const lib = require('./memory-lib.js');

const INDEX_FILE = '.index.json';

// Bumped when the stored shape changes. A sidecar from a version this code
// does not understand is rebuilt rather than misread, which is free: the
// sidecar is derived from the store and holds nothing that cannot be observed
// again.
const INDEX_VERSION = 1;

// Bytes read for the sidecar. Bounded like every other read in this tier: a
// corrupt or hostile .index.json must not make a hook allocate without limit.
// At roughly 130 bytes an entry this holds a store of several thousand
// records, well past any store a human authors.
const INDEX_READ_CAP = 512 * 1024;

const BODY_REVISED_MARKER = '[body revised]';

// Structural characters on a generated line, matching memory.js. A value
// interpolated AHEAD of the description can otherwise forge everything after
// it, including the description position itself. The same class of defect the
// CLI documents at its own render door, neutralized here because this door
// writes into the model's session context rather than a terminal.
//
// `description` is deliberately not covered: it is LAST on the line, so
// nothing in it can displace a field after it, and refusing a colon there
// would refuse legitimate corrections. The marker sits ahead of the colon for
// the same reason: a description CAN put the literal `[body revised]` on its
// own line, but only after the colon, where it occupies no structural
// position. `marked` is therefore the authoritative count of markers and a
// grep of the emitted text is not.
const LINE_DELIMITERS = /[[\]@:]/g;

const LABEL_CAP = 60;

function indexPath() {
    return path.join(lib.storeRoot(), INDEX_FILE);
}

// Read a bounded prefix of a file. Mirrors memory-lib's readCapped, which is
// not exported: O_NONBLOCK plus a regular-file check ON THE DESCRIPTOR, since
// a stat-then-open pair leaves a TOCTOU window and openSync on a FIFO blocks
// until a writer appears, which would hang the hook that promises never to
// block. Returns null on any failure.
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
        const buf = Buffer.alloc(cap);
        const bytes = fs.readSync(fd, buf, 0, cap, 0);
        return { text: buf.toString('utf8', 0, bytes), truncated: stat.size > bytes };
    } catch {
        return null;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Load the sidecar. NEVER fails: an absent, unreadable, oversized, corrupt, or
// foreign-versioned sidecar all rebuild from an empty set, and each says so in
// `reason` so a caller can surface it rather than a rebuild happening silently
// every session. A rebuild costs only the markers for changes made before it,
// because a comparison with nothing to compare against makes no claim.
function readIndex() {
    const file = indexPath();
    const read = readCapped(file, INDEX_READ_CAP);
    if (read === null) {
        // Absent and unreadable are separated by an lstat rather than folded
        // together: an absent sidecar is the normal first run, an unreadable
        // one is a condition an operator may need to hear about.
        return { entries: Object.create(null), rebuilt: true, reason: exists(file) ? 'the index could not be read' : null };
    }
    if (read.truncated) {
        return { entries: Object.create(null), rebuilt: true, reason: 'the index exceeds ' + INDEX_READ_CAP + ' bytes' };
    }
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    } catch {
        return { entries: Object.create(null), rebuilt: true, reason: 'the index is not parsable JSON' };
    }
    if (!parsed || typeof parsed !== 'object' || parsed.version !== INDEX_VERSION) {
        return { entries: Object.create(null), rebuilt: true, reason: 'the index is not version ' + INDEX_VERSION };
    }
    const records = parsed.records;
    if (!records || typeof records !== 'object') {
        return { entries: Object.create(null), rebuilt: true, reason: 'the index has no records map' };
    }

    // Prototype-free: `constructor` passes the kebab-case name pattern, so a
    // plain {} literal returns Object.prototype's member for it and the entry
    // is silently dropped, uncounted. Found independently by two reviewers.
    const entries = Object.create(null);
    let dropped = 0;
    for (const [name, entry] of Object.entries(records)) {
        // A name arriving from the sidecar's JSON is CONTENT, exactly like a
        // name arriving from a record's frontmatter, and it is about to reach
        // recordPath() and an lstat. It is validated at this door for the same
        // reason the library validates that one.
        if (!lib.validateName(name).ok || !entry || typeof entry !== 'object') { dropped++; continue; }
        const descriptionHash = hashField(entry.descriptionHash);
        const bodyHash = hashField(entry.bodyHash);
        if (descriptionHash === undefined || bodyHash === undefined) { dropped++; continue; }
        entries[name] = { descriptionHash, bodyHash };
    }
    // A dropped entry is reported, not swallowed. It costs the marker for one
    // record, which is a thing the operator can be told rather than a thing
    // that quietly never fires.
    return { entries, rebuilt: false, reason: dropped ? dropped + ' index entries were unusable and were dropped' : null };
}

// A stored hash is a 16-char hex prefix, null when the body was never read, or
// undefined when the entry is unusable. Anything else is not a hash this code
// wrote and cannot be compared, so it invalidates its entry rather than being
// coerced into one.
function hashField(value) {
    if (value === null) return null;
    if (typeof value === 'string' && /^[0-9a-f]{16}$/.test(value)) return value;
    return undefined;
}

// Deliberately not two-valued. "I could not tell" must never be recorded as
// "the record was deleted": that discards the very hashes the retention
// branch exists to preserve, so a revision made while the store was briefly
// unreachable becomes invisible afterwards. Only ENOENT is gone; every other
// error retains. This store is meant to be synced across machines, where a
// transient EIO or ESTALE on a child with a healthy parent is ordinary.
function exists(file) {
    try {
        // lstat, not stat: a dangling symlink still occupies the name, and the
        // CLI settled on the same choice at its record door.
        fs.lstatSync(file);
        return true;
    } catch (err) {
        return !(err && err.code === 'ENOENT');
    }
}

// Publish the sidecar atomically. tmp + rename with the pid in the tmp name,
// matching the library's write discipline: this store is shared across
// concurrent sessions of every project, so two writers must never collide on
// one tmp path. A half-written index would be read as corrupt and rebuilt,
// which is survivable, but a torn write is not a thing to leave possible when
// a rename forbids it.
function writeIndex(entries) {
    const ensured = lib.ensureStore();
    if (!ensured.ok) return ensured;
    const file = indexPath();
    const tmp = file + '.tmp.' + process.pid;
    const payload = { version: INDEX_VERSION, records: entries };
    try {
        fs.writeFileSync(tmp, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
        fs.renameSync(tmp, file);
        return { ok: true };
    } catch (err) {
        try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
        return { ok: false, reason: 'could not write the index: ' + lib.sanitize(err && err.message, 120) };
    }
}

// Observe every record in the store once. sync() and lines() BOTH go through
// here, so what the sidecar stores and what the marker compares can never be
// derived differently; a second observation path is how an index ends up
// disagreeing with itself.
//
// Reads are two-tier by necessity, not by optimization. listRecords() parses a
// 4KB prefix, which is the whole file for a typical record and yields its body
// hash directly; a record longer than that comes back `partial` with NO body
// hash, so it is re-read at the full cap. The real fixture that motivated this
// marker is 8KB, so a single-tier prefix sweep would have compared nothing on
// the exact record the marker exists for.
//
// Returns { ok, observations, skipped, bodyUnknown, unresolved } or
// { ok:false, unreadable:true, reason }. `bodyUnknown` counts every record
// whose body could not be hashed and so cannot be compared; `unresolved` is
// the subset of those where the re-read itself failed rather than the record
// simply being larger than the read cap. Both are reported because they are
// different conditions with the same consequence for the marker.
function observeStore() {
    const listed = lib.listRecords();
    if (listed.unreadable) {
        // An absent store and an unreadable one are different answers and must
        // not collapse. Reporting "no records" for a store that exists but
        // could not be listed is this tier's worst failure: it says there are
        // no facts when it simply could not look, and here it would also read
        // as "every record was deleted" and empty the sidecar.
        return {
            ok: false,
            unreadable: true,
            reason: 'the store at ' + lib.sanitize(lib.storeRoot(), 160) + ' exists but could not be read'
                + (listed.reason ? ': ' + lib.sanitize(listed.reason, 120) : '')
                + '; this is not an empty store',
        };
    }

    const observations = [];
    let bodyUnknown = 0;
    let unresolved = 0;

    for (const prefix of listed.records) {
        let record = prefix;
        if (!record.bodyHash) {
            const full = lib.readRecord(record.name);
            // A record that vanished or turned unparsable between the listing
            // and this read keeps its prefix view: the description is already
            // in hand, so the line is still generated and the record stays
            // visible. Only its body comparison is lost, and that is counted.
            if (full.ok) record = full.record;
            else unresolved++;
        }
        if (!record.bodyHash) bodyUnknown++;
        observations.push({
            name: record.name,
            description: record.description,
            metadata: record.metadata || {},
            descriptionHash: record.descriptionHash,
            // Explicitly null rather than absent: this is the "observed but
            // not comparable" state the sidecar stores, and it must survive a
            // JSON round trip as that state instead of disappearing.
            bodyHash: record.bodyHash || null,
        });
    }

    return { ok: true, observations, skipped: listed.skipped, bodyUnknown, unresolved };
}

// The one comparison. A marker fires only when the body moved and the
// description did not.
//
// Every guard here refuses to CLAIM something unobserved:
//   no stored entry      the record is new to the index; nothing to compare
//   either hash null     the body was never read at one end of the comparison
//   equal body hashes    the body did not move
// and only then does the description decide. Inverting that last comparison
// makes the marker fire on every record whose description changed, which is
// the defect the fire-rate test exists to catch.
function markerFor(stored, observed) {
    if (!stored) return false;
    if (!stored.bodyHash || !observed.bodyHash) return false;
    if (stored.bodyHash === observed.bodyHash) return false;
    return stored.descriptionHash === observed.descriptionHash;
}

// Sweep the store and bring the sidecar up to date, handling all four
// transitions: a new record is added, a changed record's hashes are updated, a
// deleted record's entry is dropped, an unchanged record is left alone.
//
// Returns { ok, added, changed, removed, unchanged, retained, bodyUnknown,
// unresolved, skipped, rebuilt, wrote } or { ok:false, reason }. `retained` is
// an entry whose record was not listed but is still on disk, kept rather than
// dropped for the reason given at that branch.
function sync() {
    try {
        const observed = observeStore();
        // The sidecar is NOT rewritten from a store that could not be read.
        // Doing so would read every record as deleted and empty the index,
        // and the next successful sweep would then re-add them all as new,
        // suppressing every marker in the store.
        if (!observed.ok) return observed;

        const index = readIndex();
        const before = index.entries;
        const after = Object.create(null);
        let added = 0;
        let changed = 0;
        let unchanged = 0;

        for (const record of observed.observations) {
            const stored = before[record.name];
            // A body that could not be read this sweep does not erase the last
            // hash that WAS read. Overwriting it with null would forget the
            // only state a later comparison could fire against, so a revision
            // made while the record was unreadable would never surface.
            const bodyHash = record.bodyHash === null && stored ? stored.bodyHash : record.bodyHash;
            const entry = { descriptionHash: record.descriptionHash, bodyHash };
            after[record.name] = entry;

            if (!stored) added++;
            else if (stored.descriptionHash !== entry.descriptionHash || stored.bodyHash !== entry.bodyHash) changed++;
            else unchanged++;
        }

        let removed = 0;
        let retained = 0;
        for (const [name, entry] of Object.entries(before)) {
            if (after[name]) continue;
            // Absent from the listing is not the same as deleted. listRecords
            // skips a malformed record, a symlinked one, and anything it could
            // not parse, and dropping those entries would discard the hashes
            // the marker fires against; the record would come back as new and
            // a revision made in between would be invisible. So the name is
            // checked directly: gone from the filesystem is a deletion, still
            // present is a retention, counted either way.
            const file = lib.recordPath(name);
            if (file && exists(file)) {
                after[name] = entry;
                retained++;
            } else {
                removed++;
            }
        }

        // `index.reason` covers the repair case: a sidecar that parsed but
        // held an unusable entry is rewritten without it, so the diagnostic is
        // reported once and then converges, rather than every sweep for the
        // life of the store reporting the same hand-edit.
        const dirty = added > 0 || changed > 0 || removed > 0 || index.rebuilt || index.reason !== null;
        // Nothing observed and no sidecar on disk means an absent or empty
        // store on a machine that has never used this tier. Writing then would
        // create the store root as a side effect of a read-shaped sweep.
        const empty = observed.observations.length === 0 && index.rebuilt && !exists(indexPath());
        let wrote = false;
        if (dirty && !empty) {
            const written = writeIndex(after);
            if (!written.ok) return written;
            wrote = true;
        }

        return {
            ok: true,
            added,
            changed,
            removed,
            unchanged,
            retained,
            bodyUnknown: observed.bodyUnknown,
            unresolved: observed.unresolved,
            skipped: observed.skipped,
            rebuilt: index.rebuilt,
            reason: index.reason || null,
            wrote,
        };
    } catch (err) {
        // Belt and braces. Everything above is wrapped already; a hook still
        // must not crash a session because something unforeseen threw here.
        return { ok: false, reason: 'index sync failed: ' + lib.sanitize(err && err.message, 120) };
    }
}

// The generated index lines, in store order (listRecords sorts by name).
//
// Pure: this never writes the sidecar. See the seam note in the header.
//
// Returns { ok, lines, marked, bodyUnknown, unresolved, skipped, rebuilt,
// reason } or { ok:false, unreadable:true, reason }.
function lines() {
    try {
        // Index first, then observe. A concurrent sync landing between these
        // two makes one side newer than the other either way; this ordering
        // leaves the stored hash OLDER than the observed record, which yields
        // a MISSED marker. The reverse ordering yields a FALSE one, and a
        // marker that cries wolf is the failure this module argues against.
        const index = readIndex();
        const observed = observeStore();
        if (!observed.ok) return observed;

        const out = [];
        let marked = 0;
        for (const record of observed.observations) {
            const mark = markerFor(index.entries[record.name], record);
            if (mark) marked++;
            out.push(renderLine(record, mark));
        }
        return {
            ok: true,
            lines: out,
            marked,
            bodyUnknown: observed.bodyUnknown,
            unresolved: observed.unresolved,
            skipped: observed.skipped,
            rebuilt: index.rebuilt,
            reason: index.reason || null,
        };
    } catch (err) {
        // `unreadable` is part of this function's contract, so it is carried
        // on every failure path rather than only the expected one.
        return { ok: false, unreadable: true, reason: 'index generation failed: ' + lib.sanitize(err && err.message, 120) };
    }
}

// One line, generated from the record every time and stored nowhere. Shaped
// like memory.js's list line so the two surfaces read alike:
//
//   - <name> [<kind>] @<machine> [body revised]: <description>
//
// `name` needs no neutralizing: it is the validated kebab-case file stem,
// taken from the directory listing and never from record content. Everything
// else ahead of the colon does, and the description stays last.
// A hand-written `kind: []` parses to an empty array, which is truthy, and
// `kind: [a, b]` parses to an array of two. Truthiness is the wrong test at a
// render door; only a non-empty string is a usable scalar.
function usableScalar(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function renderLine(record, marked) {
    const md = record.metadata || {};
    const kind = usableScalar(md.kind) ? label(md.kind) : 'unknown';
    const machine = usableScalar(md.machine) ? ' @' + label(md.machine) : '';
    const mark = marked ? ' ' + BODY_REVISED_MARKER : '';
    return '- ' + record.name + ' [' + kind + ']' + machine + mark + ': '
        + render(record.description, lib.DESCRIPTION_MAX);
}

// A value bound for a structural position on the line. Substituted rather than
// dropped, so a hand-edited record still appears in the index without the
// power to forge the fields after it.
function label(value) {
    return render(String(value == null ? '' : value).replace(LINE_DELIMITERS, ' '), LABEL_CAP);
}

// Truncation is announced, never silent: the writer bounds `description`, so
// an over-long one reached the store by hand, and a line that quietly lost its
// tail is the silent-drop shape this tier is built against.
function render(value, cap) {
    const safe = lib.sanitize(String(value == null ? '' : value), 0);
    return safe.length > cap ? safe.slice(0, cap) + ' [truncated]' : safe;
}

module.exports = {
    INDEX_FILE,
    INDEX_VERSION,
    INDEX_READ_CAP,
    BODY_REVISED_MARKER,
    indexPath,
    readIndex,
    writeIndex,
    observeStore,
    markerFor,
    sync,
    lines,
};
