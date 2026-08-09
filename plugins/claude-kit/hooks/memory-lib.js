// Shared library for the kit-owned cross-project memory tier.
//
// The tier holds learned FACTS that span projects: machine/environment facts
// (this box drops VPN secrets on netplan reload) and platform facts (this
// product's deployment convention). Project-specific facts stay in Claude
// Code's native per-project auto-memory, which this kit does not touch, and
// recurring working preferences are doctrine that graduates to the global
// CLAUDE.md through reconcile-claude-md rather than accumulating here.
//
// The store roots at ~/.claude-kit-memory/, deliberately outside both
// ~/.claude and ~/.claude-work. Those directories hold .credentials.json,
// settings.json, and history.jsonl, so a memory tier nested inside one can
// only be synced behind an allowlist that is the sole barrier between
// "sync memories" and "publish credentials". A tier the kit owns picks a
// clean root instead and needs no such barrier. ~/.claude-kaizen/ is the
// established precedent for a kit-owned home-rooted directory.
//
// ---------------------------------------------------------------------------
// RECORD SCHEMA. One file per fact, <name>.md under the store root.
//
//   ---
//   name: kebab-case-slug          authored; must equal the filename stem
//   description: <one line>        authored; LOAD-BEARING, see below
//   metadata:
//     kind: machine | platform     authored; machine = true of a box or
//                                  account, platform = true of a body of work
//                                  spanning repos
//     machine: <label>             authored, optional; set only when the fact
//                                  is true of one box, so another machine can
//                                  see it labelled as foreign
//     created: YYYY-MM-DD          generated on first write
//     modified: <ISO 8601>         generated on every write
//     applied: [YYYY-MM-DD, ...]   READ-ONLY tolerance, not a write target.
//                                  The apply stamp appends to applied.jsonl
//                                  and never rewrites a record, so a stamped
//                                  day appears in the journal and not here.
//                                  A hand-authored or migrated record may
//                                  carry this form and the ranking unions it
//                                  with the journal. Drives advisory decay
//                                  ranking and CANNOT be reconstructed later
//     origin: <free label>         authored, optional; where the fact was
//                                  learned
//   ---
//   <body: the detail, evidence, and any counter-case>
//
// `description` is load-bearing because it GENERATES the line this tier emits
// into session context. It must carry the correction, not a topic label:
// "netplan drops NM VPN secrets, use a native keyfile, not nmcli modify"
// rather than "dev box VPN gotcha". A topic label intercepts nothing.
//
// Generating that line rather than maintaining a second copy of it is the
// central decision of this tier. In the native store, index currency is a
// byproduct of CREATING a record (15 of 15 sessions) and never an act of
// REVISING one (0 of 8), so a hand-maintained line drifts from its record as
// a matter of course. One copy cannot diverge from itself.
//
// Records are never written with the Write tool. The CLI is the only writer,
// so that lock discipline, field validation, and the generated stamps all
// hold; a hand-edited record is tolerated on read but is not the write path.
//
// Change detection uses CONTENT HASHES, not mtime. Hashing description and
// body separately answers the actual question directly: did the body change
// while the description that advertises it did not? mtime only ever
// approximated that, and the approximation was wrong in this tier while
// stamping still rewrote records, since every stamp advanced mtime on a record
// whose text nobody had revised. Stamps moved to the append-only journal in
// S2, so that particular hazard is gone, but the hashes stay: they do not
// depend on which writes happen to touch a record file.
// ---------------------------------------------------------------------------
//
// Node core modules only, CommonJS, zero dependencies. Every exported
// function that touches the filesystem or parses data is wrapped so it never
// throws; a filesystem hiccup or a malformed record degrades to a null/empty/
// typed-failure result instead of trapping the caller. A hook must never
// crash a session over a memory read.

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Bytes read when only the frontmatter is wanted. A record whose frontmatter
// runs past this is NOT silently dropped: the reader retries at the full cap
// rather than reporting an unterminated block, because a record that reads
// fine by name while being invisible to the index is the worst failure this
// tier can have.
const FRONTMATTER_READ_CAP = 4096;

// Bytes read for a whole record.
const RECORD_READ_CAP = 256 * 1024;

// A record name is the file's stem and rides into the model's context on the
// emitted line, so it is constrained at both ends: kebab-case only (no path
// separators, no traversal, no leading dot) and bounded.
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_MAX = 80;

// Bounds the description so a record cannot push its own frontmatter past the
// prefix read, and keeps the emitted line to one legible line. The native
// store's longest real index line is 345 chars.
const DESCRIPTION_MAX = 400;

// The two kinds of fact this tier holds. Deliberately NOT native's
// user/feedback/project/reference set: `project` is meaningless in a
// cross-project tier and `feedback` graduates to doctrine instead of living
// here, so reusing that key name under different values would be a trap with
// both stores open.
const KINDS = ['machine', 'platform'];

// Bounds one metadata value, for the same reason DESCRIPTION_MAX bounds the
// description: the frontmatter block must stay inside the prefix read.
const METADATA_VALUE_MAX = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Metadata fields that are lists whatever their written form. Bracket syntax
// drives the general parse so a future list field behaves without being
// listed here, but these are normalized to an array regardless: a
// hand-written `applied: 2026-08-01` must not read as a scalar and then be
// written back as an empty list, which would destroy history the schema
// calls unreconstructable.
const LIST_FIELDS = ['applied'];

// Store root. The env override exists for tests and for an operator who keeps
// their home directory elsewhere. It is resolved to an absolute path: a
// relative value would make the store cwd-dependent, which is the one
// property this tier exists to avoid.
function storeRoot() {
    const override = process.env.CLAUDE_KIT_MEMORY_DIR;
    if (override && override.trim()) return path.resolve(override.trim());
    return path.join(os.homedir(), '.claude-kit-memory');
}

// Path to a record. Validates rather than trusting its caller, because this
// is exported and a name that reached it from parsed frontmatter rather than
// from a directory listing would otherwise traverse. Returns null on a bad
// name.
function recordPath(name) {
    if (!validateName(name).ok) return null;
    return path.join(storeRoot(), name + '.md');
}

function validateName(name) {
    if (typeof name !== 'string' || !name) return { ok: false, reason: 'name is required' };
    if (name.length > NAME_MAX) return { ok: false, reason: 'name exceeds ' + NAME_MAX + ' characters' };
    if (!NAME_PATTERN.test(name)) {
        return { ok: false, reason: 'name must be kebab-case (lowercase letters, digits, single dashes)' };
    }
    return { ok: true };
}

// Every string this module writes into a record passes here. A newline would
// break the frontmatter block and let a record forge a field or a block
// terminator, and `description` is what generates emitted context, so a
// forged one reaches the model as an assertion to act on. Applied at every
// door, not just the obvious one: name, description, and every metadata
// value including array elements.
function validateFieldText(value, label) {
    if (typeof value !== 'string') return { ok: false, reason: label + ' must be a string' };
    if (/[\x00-\x1F\x7F]/.test(value)) {
        return { ok: false, reason: label + ' must be a single line with no control characters' };
    }
    return { ok: true };
}

// Reduce a string to bounded printable ASCII for a channel the model reads.
// Substitutes a space rather than deleting, unlike session-start.js's strip:
// deletion splices adjacent tokens into one word, substitution does not.
function sanitize(value, cap) {
    if (typeof value !== 'string') return '';
    const stripped = value.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    return cap && stripped.length > cap ? stripped.slice(0, cap) : stripped;
}

// Stable content hash, used by the index sidecar to tell a revised body from
// a revised description. Short because it is stored per record and only ever
// compared for equality.
function hashOf(value) {
    return crypto.createHash('sha256').update(String(value == null ? '' : value), 'utf8').digest('hex').slice(0, 16);
}

// Read a bounded prefix of a file, plus its mtime from the same descriptor.
// Opens with O_NONBLOCK and confirms regular-file-ness on the descriptor
// itself: a stat-then-open pair leaves a TOCTOU window, and openSync on a
// FIFO blocks until a writer appears, which would hang a hook that promises
// never to block. Taking mtime from the same fd keeps it describing the bytes
// actually read. Returns null on any failure.
function readCapped(file, cap) {
    let fd;
    try {
        fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch {
        return null;
    }
    try {
        const stat = fs.fstatSync(fd);
        // Matches listRecords' withFileTypes check. Without this the two APIs
        // disagree: a symlinked record was invisible to the index but fully
        // readable and writable by name, and stamping it silently replaced the
        // link with a regular file while the real target went unstamped.
        if (!stat.isFile()) return null;
        const buf = Buffer.alloc(cap);
        const bytes = fs.readSync(fd, buf, 0, cap, 0);
        let text = buf.toString('utf8', 0, bytes);
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        return { text, mtimeMs: stat.mtimeMs, truncated: stat.size > bytes };
    } catch {
        return null;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Strip one layer of YAML quoting. Native auto-memory quotes some
// descriptions and this tier is hand-editable, so the reader tolerates the
// form. Guarded: a value that merely starts and ends with a quote character
// ("search_code" is X, per "the docs") is content, not a quoted string, and
// unquoting it would corrupt the field that generates the emitted line.
function unquote(value) {
    const v = value.trim();
    if (v.length < 2) return v;
    const q = v[0];
    if ((q !== '"' && q !== "'") || !v.endsWith(q)) return v;
    if (v.slice(1, -1).includes(q)) return v;
    return v.slice(1, -1);
}

// Parse a YAML scalar or inline list. Bracket syntax drives the decision, not
// the key name, so a future list-valued field behaves and a hand-written
// bracket-less `applied: 2026-08-01` becomes a one-element list instead of
// being silently emptied on the next write.
function parseScalarOrList(raw) {
    const v = raw.trim();
    if (v.startsWith('[') && v.endsWith(']')) {
        const inner = v.slice(1, -1).trim();
        if (!inner) return [];
        return inner.split(',').map(s => unquote(s)).filter(Boolean);
    }
    return unquote(v);
}

// Parse a record's text into { ok, record } or { ok:false, reason }.
//
// A deliberately narrow reader for the format this kit emits, not a YAML
// parser: a frontmatter block delimited by --- lines, top-level `key: value`,
// and one nested `metadata:` map. Anything outside that shape is reported
// rather than dropped, because a silent drop is how a stamp that cannot be
// reconstructed disappears.
//
// `expectName` is the validated filename stem. The record's name is taken
// from it, never from the frontmatter line: the frontmatter is content and a
// name read from there would be unvalidated where it rides into context and
// into path joins.
function parseRecord(text, expectName) {
    if (typeof text !== 'string') return { ok: false, reason: 'not text' };
    const lines = text.split(/\r?\n/);
    if (lines[0] !== '---') return { ok: false, reason: 'no frontmatter block' };

    const end = lines.indexOf('---', 1);
    if (end === -1) return { ok: false, reason: 'unterminated frontmatter block' };

    const record = { name: '', description: '', metadata: {}, extraTop: {}, body: '' };
    let declaredName = '';
    let inMetadata = false;

    for (let i = 1; i < end; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Any indent of two or more, and keys may carry dashes or dots. The
        // stricter forms silently dropped hand-written blocks.
        const nested = /^\s{2,}([A-Za-z][\w.-]*):[ \t]*(.*)$/.exec(line);
        if (inMetadata && nested) {
            record.metadata[nested[1]] = parseScalarOrList(nested[2]);
            continue;
        }

        const top = /^([A-Za-z][\w.-]*):[ \t]*(.*)$/.exec(line);
        if (!top) return { ok: false, reason: 'unparsable frontmatter line: ' + sanitize(line, 60) };
        inMetadata = top[1] === 'metadata';
        if (inMetadata) continue;
        if (top[1] === 'name') declaredName = unquote(top[2]);
        else if (top[1] === 'description') record.description = unquote(top[2]);
        // A top-level key this schema does not model is CARRIED, not dropped
        // and not refused. Dropping it destroys a hand-written `tags:` line on
        // the next write, because serializeRecord emits only what it parsed.
        // Refusing it (the first fix here) was worse: readRecord is the only
        // reader, so a perfectly legible record became invisible to `get`,
        // `list`, and `decay` alike, which is this tier's own worst failure
        // wearing a guard's clothes. Carrying it round-trips the record
        // unchanged and matches how serializeRecord already treats unknown
        // metadata keys.
        else record.extraTop[top[1]] = unquote(top[2]);
    }

    for (const field of LIST_FIELDS) {
        const value = record.metadata[field];
        if (typeof value === 'string') record.metadata[field] = value ? [value] : [];
    }

    record.body = lines.slice(end + 1).join('\n').replace(/^\n+/, '');
    if (!record.description) return { ok: false, reason: 'record has no description' };

    if (expectName !== undefined) {
        if (declaredName && declaredName !== expectName) {
            return { ok: false, reason: 'frontmatter name "' + sanitize(declaredName, 40) + '" does not match file "' + expectName + '"' };
        }
        record.name = expectName;
    } else {
        const check = validateName(declaredName);
        if (!check.ok) return { ok: false, reason: 'record name is unusable: ' + check.reason };
        record.name = declaredName;
    }
    return { ok: true, record };
}

// Serialize a record back to text. Unknown metadata keys are preserved so a
// field added by a later section is not dropped by an older writer.
function serializeRecord(record) {
    const md = record.metadata || {};
    const order = ['kind', 'machine', 'created', 'modified', 'applied', 'origin'];
    const known = order.filter(k => usable(md[k]));
    const extra = Object.keys(md).filter(k => !order.includes(k) && usable(md[k]));

    const out = ['---', 'name: ' + record.name, 'description: ' + record.description];
    // Top-level keys this schema does not model, carried through untouched so
    // a hand-written field survives a stamp instead of vanishing.
    for (const [k, v] of Object.entries(record.extraTop || {})) {
        if (usable(v)) out.push(k + ': ' + v);
    }
    out.push('metadata:');
    for (const k of known.concat(extra)) {
        const v = md[k];
        out.push('  ' + k + ': ' + (Array.isArray(v) ? '[' + v.join(', ') + ']' : v));
    }
    out.push('---', '', (record.body || '').replace(/\s+$/, ''), '');
    return out.join('\n');
}

function usable(v) {
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
}

// Read and parse one record. Returns { ok, record } or { ok:false, reason }.
// The record carries `descriptionHash` and `bodyHash` for the index sidecar,
// and `partial` when only a frontmatter prefix was read, so a caller cannot
// write back a truncated body without noticing.
function readRecord(name, opts) {
    const check = validateName(name);
    if (!check.ok) return check;
    const file = recordPath(name);
    const wantPrefix = Boolean(opts && opts.frontmatterOnly);

    let read = readCapped(file, wantPrefix ? FRONTMATTER_READ_CAP : RECORD_READ_CAP);
    if (read === null) return { ok: false, reason: 'record not readable: ' + name };

    // A frontmatter block running past the prefix is a retry, never a drop.
    if (wantPrefix && read.truncated && read.text.indexOf('\n---', 3) === -1) {
        const full = readCapped(file, RECORD_READ_CAP);
        if (full !== null) read = full;
    }

    const parsed = parseRecord(read.text, name);
    if (!parsed.ok) return parsed;
    parsed.record.mtimeMs = read.mtimeMs;
    // Version token for compare-and-swap. A hash of the bytes actually read,
    // not mtime: mtime is only as fine as the filesystem's timestamp
    // granularity, so two writes landing in the same millisecond are
    // indistinguishable and the swap passes when it should conflict. Measured
    // under 20 concurrent stampers, mtime lost one update silently while
    // every process reported success.
    parsed.record.versionHash = read.truncated ? null : hashOf(read.text);
    parsed.record.descriptionHash = hashOf(parsed.record.description);
    if (read.truncated) {
        // ANY truncated read, prefix or full. The body is incomplete, so it
        // is withheld rather than handed over to be written back at its
        // truncated length, and no body hash is offered because hashing a
        // truncated body would answer a question nobody asked.
        //
        // This guard covered the prefix path only until S2's review: `stamp`
        // does a full read-modify-write, so a record past RECORD_READ_CAP was
        // silently rewritten shorter, measured at 307KB in and 262KB out with
        // a success message. The prefix path had the guard; its sibling did
        // not. That is the Standing Brief Amendment about one door versus
        // every door, recurring inside the module that first fixed it.
        parsed.record.partial = true;
        delete parsed.record.body;
    } else {
        parsed.record.bodyHash = hashOf(parsed.record.body);
    }
    return parsed;
}

// Every readable record in the store, parsed from a bounded prefix.
// Unreadable or malformed records are skipped and counted rather than
// throwing: a store with one bad file must still serve the other 59, and the
// count is what lets a caller say so out loud.
function listRecords() {
    let entries;
    try {
        entries = fs.readdirSync(storeRoot(), { withFileTypes: true });
    } catch (err) {
        // An absent store and an unreadable one are different answers and
        // must not collapse into the same empty result. A store that exists
        // but cannot be listed (permissions, a regular file at the root, an
        // I/O error) reporting "no records" at exit 0 is this tier's worst
        // failure: it says there are no facts when it simply could not look.
        if (err && err.code === 'ENOENT') return { records: [], skipped: 0, unreadable: false };
        return { records: [], skipped: 0, unreadable: true, reason: sanitize(err && err.message, 120) };
    }
    const records = [];
    let skipped = 0;
    for (const entry of entries) {
        if (!entry.name.endsWith('.md')) continue;
        // A symlink is not a file under withFileTypes, but readRecord would
        // happily follow it. Counted as skipped either way so the two APIs
        // never disagree about whether a record exists.
        if (!entry.isFile()) { skipped++; continue; }
        const name = entry.name.slice(0, -3);
        if (!validateName(name).ok) { skipped++; continue; }
        const result = readRecord(name, { frontmatterOnly: true });
        if (!result.ok) { skipped++; continue; }
        records.push(result.record);
    }
    records.sort((a, b) => a.name.localeCompare(b.name));
    return { records, skipped, unreadable: false };
}

// The applied-day journal. Stamping used to rewrite the record to append a
// day, which is a multi-process read-modify-write and cannot be made safe on
// a plain file: measured at 8.3% silent loss with only TWO concurrent
// stampers, every process reporting success. A compare-and-swap shrinks that
// window but cannot close it, because two writers can both pass the swap
// before either publishes.
//
// So a stamp does not touch the record at all. It appends one line to a
// journal, and a small O_APPEND write is atomic: concurrent appends interleave
// as whole lines rather than corrupting each other, so there is nothing to
// swap on and nothing to lose. Duplicates are harmless because the reader
// takes the distinct set, which is also what makes a retry unnecessary.
//
// It is the git-sync-friendly shape too: an append-only file merges as a line
// union, where a rewritten frontmatter list would conflict.
const JOURNAL_FILE = 'applied.jsonl';

// One journal line, bounded so a corrupt file cannot make a reader allocate
// without limit.
const JOURNAL_LINE_MAX = 300;

// The whole journal, bounded for the same reason one line is. A stamp line is
// around 40 bytes, so this holds roughly 50k of them: decades of real use, and
// a ceiling on a file that has been corrupted into something enormous. Reading
// the FIRST bytes means truncation drops the NEWEST stamps, which is the
// direction that fabricates idleness, so truncation is reported rather than
// absorbed.
const JOURNAL_READ_CAP = 2 * 1024 * 1024;

function journalPath() {
    return path.join(storeRoot(), JOURNAL_FILE);
}

// Record that `name` was applied on `day`. Returns { ok } or { ok:false,
// reason }; never throws. Idempotent by construction: a repeated day is a
// duplicate line the reader folds away.
function appendApplied(name, day, opts) {
    const check = validateName(name);
    if (!check.ok) return check;
    if (!DATE_PATTERN.test(day)) return { ok: false, reason: 'applied day must be YYYY-MM-DD' };
    const ensured = ensureStore();
    if (!ensured.ok) return ensured;
    // O_NONBLOCK and a regular-file check on the descriptor, matching
    // readCapped and the read side below. appendFileSync carries neither, so a
    // FIFO at this name hung `stamp` until something opened the other end.
    // O_NONBLOCK turns that into an immediate ENXIO.
    let fd;
    try {
        fd = fs.openSync(
            journalPath(),
            fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NONBLOCK,
            0o600,
        );
    } catch (err) {
        return { ok: false, reason: 'could not record the applied day: ' + sanitize(err.message, 120) };
    }
    try {
        if (!fs.fstatSync(fd).isFile()) {
            return { ok: false, reason: 'the applied-day journal is not a regular file' };
        }
        // Still one write call of one line on an O_APPEND descriptor, so the
        // atomicity against concurrent appenders that the stress tests measure
        // is unchanged: under PIPE_BUF the kernel serializes it.
        fs.writeSync(fd, JSON.stringify({ name, day }) + '\n');
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: 'could not record the applied day: ' + sanitize(err.message, 120) };
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Every applied day in the journal, as a Map of name -> sorted distinct days.
// A malformed line is counted rather than dropped silently and never aborts
// the read: a journal is append-only, so a torn tail is a normal way to find
// it after a crash. Returns { days, skipped } plus `unreadable` or `truncated`
// when either holds.
//
// This reader is on the SessionStart path, so it carries the same door
// discipline as readCapped rather than a plain readFileSync: O_NONBLOCK
// because a FIFO here would block the hook forever, a regular-file check
// because a character device would read without bound, and a byte cap for the
// same reason one line has one. It lstats first, because `stat` on a dangling
// symlink reports ENOENT and an absent journal is not the same as one that
// cannot be read: reading a broken link as absent erases every stamp, ranks
// records in daily use as idle, and reports nothing wrong. The record doors in
// memory-index.js and the CLI lstat for this same reason.
function readAppliedJournal() {
    const days = new Map();
    let skipped = 0;
    const file = journalPath();
    let info;
    try {
        info = fs.lstatSync(file);
    } catch (err) {
        if (err && err.code === 'ENOENT') return { days, skipped: 0 };
        return { days, skipped: 0, unreadable: true };
    }
    // A symlink is not a regular file here even when its target is one,
    // matching listRecords' withFileTypes check and readCapped's fstat.
    if (!info.isFile()) return { days, skipped: 0, unreadable: true };
    const read = readCapped(file, JOURNAL_READ_CAP);
    if (!read) return { days, skipped: 0, unreadable: true };
    const text = read.text;
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        if (line.length > JOURNAL_LINE_MAX) { skipped++; continue; }
        let entry;
        try {
            entry = JSON.parse(line);
        } catch {
            skipped++;
            continue;
        }
        if (!entry || !validateName(entry.name).ok || !DATE_PATTERN.test(entry.day)) { skipped++; continue; }
        if (!days.has(entry.name)) days.set(entry.name, new Set());
        days.get(entry.name).add(entry.day);
    }
    const sorted = new Map();
    for (const [name, set] of days) sorted.set(name, Array.from(set).sort());
    // Truncation loses the newest stamps, so it inflates idleness exactly the
    // way an unreadable journal does. Reported for the caller to weigh rather
    // than folded into `skipped`, which a torn tail produces in normal use.
    if (read.truncated) return { days: sorted, skipped, truncated: true };
    return { days: sorted, skipped };
}

// Advisory decay ranking. It lives here rather than in the CLI because two
// surfaces read it: `memory.js decay`, which prints the ranked list, and the
// SessionStart hook, which nudges with the candidate count. Two copies of this
// arithmetic would drift, and the nudge would then send a session to a command
// that shows a different set than the one it was counted from.
//
// Nothing here retires, deletes, or rewrites anything: the ranking is a prompt
// for a human decision (Daren, 2026-08-08), which is why these can be seeds
// rather than tuned values.
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

// The clock, single-sourced for the same reason the ranking below is: the CLI
// and the hook must not measure idleness against two different todays. It was
// resolved in the CLI alone, so `CLAUDE_KIT_MEMORY_NOW` moved the list while
// leaving the nudge on the wall clock, and the two surfaces could disagree
// about the very count the nudge sends a reader to the list to check. An
// unparsable value is a typed failure rather than a silent fallback to now:
// falling back would answer a question nobody asked with today's date.
// Returns { ok: true, now } or { ok: false, reason }; never throws.
function resolveNow() {
    const raw = process.env.CLAUDE_KIT_MEMORY_NOW;
    if (!raw || !String(raw).trim()) return { ok: true, now: new Date() };
    const parsed = new Date(String(raw).trim());
    if (Number.isNaN(parsed.getTime())) {
        return { ok: false, reason: 'CLAUDE_KIT_MEMORY_NOW is not a parsable date: ' + sanitize(raw, 60) };
    }
    return { ok: true, now: parsed };
}

// A YYYY-MM-DD day as a whole UTC day number, or null. The shape check is not
// enough on its own: Date.UTC rolls over, so 2026-13-45 becomes 2027-02-14 and
// 2026-02-31 becomes 2026-03-03, and both would rank at a date nobody wrote.
// Reconstructing the components from the result and comparing is what turns an
// impossible date into the null the callers already handle (`stamp` refuses,
// the ranking counts it as unrankable) instead of a plausible wrong answer.
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

// Every day a record was applied: the union of the journal (where stamps land)
// and any `applied:` written by hand into the record. The journal is the write
// path; the frontmatter form is tolerated so a hand-authored or migrated
// record keeps its history without a conversion step. An already-read
// readAppliedJournal() result can be passed in, so ranking a whole store reads
// the journal once and measures every record against the same snapshot.
function appliedDays(record, journal) {
    const fromRecord = (record && record.metadata && Array.isArray(record.metadata.applied))
        ? record.metadata.applied
        : [];
    const read = (journal && journal.days) ? journal : readAppliedJournal();
    const days = read.days.get(record && record.name) || [];
    return Array.from(new Set(fromRecord.concat(days))).sort();
}

// Rank every readable record for decay against `opts.now` (a Date, defaulting
// to the real clock). Returns
//   { ok: false, unreadable: true, reason }   the store exists and cannot be read
//   { ok: true, candidates, unevaluated, skipped, journalUnreadable,
//     journalTruncated, journalSkipped }
// with candidates most-idle first and then by name, each carrying its record
// and the numbers that put it there. An unreadable store is never an empty
// one: answering "no candidates" about a store nobody could look at is the
// accept-and-discard shape this tier refuses, so it is a separate result the
// caller has to handle, and a record whose dates cannot be read is counted in
// `unevaluated` rather than ranked at a made-up age. Never throws.
//
// The journal is the other input that can fail, and its failure is invisible
// in the ranking itself: a journal that cannot be read takes every stamp with
// it, so records in daily use fall back to `created` and rank as idle. That
// cannot be inferred from the candidate list, so it is reported here rather
// than swallowed, in three shapes that inflate idleness the same way and
// differ only in degree: `journalUnreadable` (every stamp lost),
// `journalTruncated` (the newest stamps lost, since the reader is capped from
// the front), and `journalSkipped` (individual entries lost to a torn tail or
// a corrupt line). Every caller must report all three. The direction of the
// error is safe, since a lost applied day can only make a record look idler
// than it is, but a safe direction is not a reason to publish a count without
// saying it may be high: both surfaces exist to inform a human retirement
// decision, and neither can be weighed against a caveat it never carried.
function rankDecay(opts) {
    // A caller may pass its own clock; otherwise the shared seam resolves it,
    // so the hook and the CLI agree about today even under CLAUDE_KIT_MEMORY_NOW.
    let now = opts && opts.now;
    if (!now) {
        const clock = resolveNow();
        if (!clock.ok) return { ok: false, unreadable: false, reason: clock.reason };
        now = clock.now;
    }
    const today = (now instanceof Date && !Number.isNaN(now.getTime()))
        ? dayNumber(now.toISOString().slice(0, 10))
        : null;
    if (today === null) return { ok: false, unreadable: false, reason: 'the clock is not a usable date' };

    const listed = listRecords();
    if (listed.unreadable) return { ok: false, unreadable: true, reason: listed.reason };

    const journal = readAppliedJournal();
    const candidates = [];
    let unevaluated = 0;
    for (const record of listed.records) {
        const rawDays = appliedDays(record, journal).map(dayNumber);
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
        // reduce, not Math.max(...days): a spread of a journal holding enough
        // distinct days overflows the argument limit and throws RangeError,
        // which this function's contract says it never does.
        const lastUsed = days.length ? days.reduce((a, b) => (b > a ? b : a), days[0]) : created;
        if (lastUsed === null || lastUsed === undefined) {
            // No usable date at all, so idleness is unknowable. Counted and
            // reported rather than ranked at a made-up age.
            unevaluated++;
            continue;
        }
        const distinct = new Set(days).size;
        const extension = Math.min(distinct * EXTEND_PER_APPLIED_DAY, EXTEND_CAP_DAYS);
        const threshold = SUMMARIZE_AFTER_DAYS + extension;
        const idleDays = today - lastUsed;
        if (idleDays > threshold) candidates.push({ record, idleDays, threshold, distinct });
    }

    candidates.sort((a, b) => b.idleDays - a.idleDays || a.record.name.localeCompare(b.record.name));
    return {
        ok: true,
        candidates,
        unevaluated,
        skipped: listed.skipped,
        journalUnreadable: journal.unreadable === true,
        journalTruncated: journal.truncated === true,
        journalSkipped: journal.skipped || 0,
    };
}

// Create the store root if absent, private to the operator. The tier holds
// facts that can describe production configuration, so 0700/0600 rather than
// inheriting a 0022 umask.
function ensureStore() {
    try {
        fs.mkdirSync(storeRoot(), { recursive: true, mode: 0o700 });
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: 'cannot create store: ' + sanitize(err.message, 120) };
    }
}

// Validate every authored field, then publish atomically. The tmp path
// carries the pid, matching kit-goal-lib.js: this tier is shared across
// concurrent sessions of every project, so two writers must never collide on
// one tmp path.
//
// `opts.mode` picks how the tmp file is published, and this is the whole of
// the tier's concurrency control:
//
//   'create'  publish with linkSync, which fails EEXIST when the name is
//             taken. Exclusive creation in one atomic syscall.
//   'replace' publish with renameSync (the default), optionally guarded by
//             `opts.expectVersion`: the target's content hash is compared
//             just before the rename and a mismatch returns { conflict: true }
//             rather than overwriting. Compare-and-swap.
//
// This replaced a lockfile. Two review rounds produced Criticals that were
// all lock-lifecycle failures (a stale lock stealing, a reused pid wedging
// every write from every project, an unbreakable lock spinning), and none of
// them can exist without a lock. A pid is also meaningless in this store's
// own future: the root was chosen so the store can be synced across machines,
// where a pid recorded on one host says nothing on another. Optimistic
// concurrency has no lifecycle to get wrong.
//
// The residual is a stat-to-rename window of microseconds in which a
// concurrent writer can still land first. The caller retries; `stamp` records
// a calendar day, so re-applying it is idempotent.
//
// Returns { ok, record }, or { ok:false, reason } and { ok:false, conflict:true }
// for a lost CAS. Never throws.
function writeRecord(record, now, opts) {
    if (!record || typeof record !== 'object') return { ok: false, reason: 'record is required' };
    const nameCheck = validateName(record.name);
    if (!nameCheck.ok) return nameCheck;
    if (record.partial) return { ok: false, reason: 'refusing to write a record read as a partial prefix' };

    const description = String(record.description == null ? '' : record.description).trim();
    if (!description) return { ok: false, reason: 'description is required: it generates the emitted index line' };
    if (description.length > DESCRIPTION_MAX) {
        return { ok: false, reason: 'description exceeds ' + DESCRIPTION_MAX + ' characters' };
    }
    const descCheck = validateFieldText(description, 'description');
    if (!descCheck.ok) return descCheck;

    const md = Object.assign({}, record.metadata);
    if (!KINDS.includes(md.kind)) {
        return { ok: false, reason: 'kind must be one of: ' + KINDS.join(', ') };
    }
    for (const [key, value] of Object.entries(md)) {
        if (!usable(value)) { delete md[key]; continue; }
        const keyCheck = validateFieldText(key, 'a metadata key');
        if (!keyCheck.ok) return keyCheck;
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
            const check = validateFieldText(String(item), 'metadata.' + key);
            if (!check.ok) return check;
            if (String(item).includes(',')) {
                return { ok: false, reason: 'metadata.' + key + ' must not contain a comma' };
            }
            // Bounded for the same reason `description` is: an unbounded
            // metadata value pushes the record's own frontmatter past the
            // prefix read, which turns every list into a full 256KB re-read
            // and, past RECORD_READ_CAP, writes a record that reads back as
            // an unterminated block.
            if (String(item).length > METADATA_VALUE_MAX) {
                return { ok: false, reason: 'metadata.' + key + ' exceeds ' + METADATA_VALUE_MAX + ' characters' };
            }
        }
        md[key] = Array.isArray(value) ? value.map(String) : String(value);
    }
    for (const day of (md.applied || [])) {
        if (!DATE_PATTERN.test(day)) return { ok: false, reason: 'applied entries must be YYYY-MM-DD' };
    }

    // Stamps are generated here so they cannot be forgotten by a caller; the
    // spec calls them unbackfillable, which makes "the caller sets them" the
    // wrong contract. But absent and malformed are different: a `created`
    // that is present and unparsable is authored data, and silently replacing
    // it with today both destroys it and resets the decay clock, so a
    // years-old record would read as idle zero days and never surface as a
    // decay candidate. Refuse instead.
    const stamp = now instanceof Date ? now : new Date();
    if (md.created !== undefined && !DATE_PATTERN.test(md.created)) {
        return { ok: false, reason: 'created must be YYYY-MM-DD; refusing to overwrite an unparsable one' };
    }
    if (!md.created) md.created = stamp.toISOString().slice(0, 10);
    md.modified = stamp.toISOString();

    const ensured = ensureStore();
    if (!ensured.ok) return ensured;

    // extraTop rides through: parseRecord carries unmodelled top-level keys
    // precisely so a write-back does not destroy them, and rebuilding the
    // record here without them would put the drop back one door further on.
    const extraTop = Object.assign({}, record.extraTop);
    for (const [key, value] of Object.entries(extraTop)) {
        if (!usable(value)) { delete extraTop[key]; continue; }
        // The key is emitted raw as `key: value`, so a newline in a KEY
        // forges the line after it, including `description`. The metadata
        // loop below has the same shape; both validate key and value, and
        // both bound the length, because this block shares one frontmatter
        // budget with the metadata it sits beside.
        const keyCheck = validateFieldText(key, 'a top-level key');
        if (!keyCheck.ok) return keyCheck;
        if (!/^[A-Za-z][\w.-]*$/.test(key)) {
            return { ok: false, reason: 'top-level key ' + sanitize(key, 40) + ' is not a usable key' };
        }
        const check = validateFieldText(String(value), key);
        if (!check.ok) return check;
        if (String(value).length > METADATA_VALUE_MAX) {
            return { ok: false, reason: key + ' exceeds ' + METADATA_VALUE_MAX + ' characters' };
        }
        extraTop[key] = String(value);
    }
    const finished = { name: record.name, description, extraTop, metadata: md, body: record.body || '' };
    const file = recordPath(record.name);
    const tmp = file + '.tmp.' + process.pid;
    const mode = (opts && opts.mode) || 'replace';
    // A typo'd mode must not silently become an unguarded overwrite: this is
    // the tier's only authoring path.
    if (mode !== 'create' && mode !== 'replace') {
        return { ok: false, reason: "mode must be 'create' or 'replace'" };
    }
    const expectVersion = opts && opts.expectVersion;
    try {
        fs.writeFileSync(tmp, serializeRecord(finished), { encoding: 'utf8', mode: 0o600 });
        if (mode === 'create') {
            // linkSync refuses to clobber, so the name is claimed or it is
            // not, with no window between checking and claiming.
            try {
                fs.linkSync(tmp, file);
            } catch (err) {
                fs.unlinkSync(tmp);
                if (err && err.code === 'EEXIST') return { ok: false, conflict: true, reason: 'a record named ' + record.name + ' already exists' };
                if (err && (err.code === 'EPERM' || err.code === 'ENOSYS' || err.code === 'EXDEV')) {
                    return { ok: false, reason: 'the store filesystem does not support hard links, which this tier uses to claim a name atomically' };
                }
                throw err;
            }
            // The record exists from the linkSync above; a failure to remove
            // the second link is debris, not a failed write, and reporting it
            // as one sends the operator to re-run an add that then says the
            // name is taken.
            try { fs.unlinkSync(tmp); } catch { /* orphan tmp, record is written */ }
            return { ok: true, record: finished };
        }
        if (expectVersion !== undefined) {
            // Compare-and-swap on content, checked as late as possible. The
            // residual window is this read to the rename below; the caller
            // verifies its change actually landed and retries, so a loss in
            // that window is caught rather than assumed away.
            // Through readCapped, so the bytes hashed here are normalized
            // the same way readRecord normalized them. Hashing the raw file
            // instead made a BOM'd record permanently unswappable: the two
            // hashes could never agree, and the failure blamed a concurrent
            // writer that did not exist. It also keeps every read in this
            // module bounded.
            const reread = readCapped(file, RECORD_READ_CAP);
            const current = reread === null ? null : hashOf(reread.text);
            if (current !== expectVersion) {
                fs.unlinkSync(tmp);
                return { ok: false, conflict: true, reason: 'the record changed while it was being updated' };
            }
        }
        fs.renameSync(tmp, file);
        return { ok: true, record: finished };
    } catch (err) {
        try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
        return { ok: false, reason: 'write failed: ' + sanitize(err.message, 120) };
    }
}

module.exports = {
    KINDS,
    FRONTMATTER_READ_CAP,
    RECORD_READ_CAP,
    JOURNAL_READ_CAP,
    NAME_MAX,
    DESCRIPTION_MAX,
    METADATA_VALUE_MAX,
    storeRoot,
    recordPath,
    validateName,
    validateFieldText,
    sanitize,
    hashOf,
    parseRecord,
    serializeRecord,
    readRecord,
    listRecords,
    ensureStore,
    appendApplied,
    readAppliedJournal,
    appliedDays,
    rankDecay,
    resolveNow,
    journalPath,
    JOURNAL_FILE,
    writeRecord,
};
