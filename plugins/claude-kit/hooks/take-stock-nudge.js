#!/usr/bin/env node
// SessionStart hook: take-stock trigger for the kit's own prose.
//
// It reports one number and nothing else: how many of the kit's current prose
// sections hold lines that differ from the last recorded take-stock. It names no
// section, ranks nothing, recommends no cut, and points at the kaizen skill.
// What, if anything, follows from the number is a human's call, made by reading
// the sections themselves.
//
// Detection here, diagnosis elsewhere. Which sections carry the change, and by
// how much, is the ranking tools/accretion.js reports, and that measurement costs
// one `git log -L` per section - around 220 git calls and 1.7 seconds measured on
// this repo at 1e5db4e, a figure that grows with the corpus and is a snapshot
// rather than a property. The block points at that command rather than running
// it, because a session start is the wrong place to spend a diagnosis's cost on
// the chance somebody wanted it, and because a hook that ranked would be claiming
// more than the diffs below actually measure.
//
// Gated to the kit repo by one fs.existsSync of the plugin manifest, checked
// before any git call: this hook ships to every kit user and the kit's own prose
// is nobody else's business, so everywhere else costs a stdin read, one stat and
// an exit.
//
// Fail-open and non-blocking, like branch-reaper-nudge.js: any error exits 0 with
// no output, and it is kept out of session-start.js so the resume hook is
// untouched.
//
// What it says, and when:
//   - sections differ from the marker: the count.
//   - no marker could be read: a line saying so, which names the file's absence
//     only when absence is what happened. A take-stock that has never happened is
//     the thing most worth saying; a record file that could not be read is a
//     different fact and is not dressed up as that one.
//   - the marker names a commit this checkout does not hold: a line saying so.
//     Silence there would be byte-identical to "nothing changed", and the state
//     is permanent rather than transient - a shallow clone, or a history rewrite
//     that orphans the recorded sha, would disable this hook forever with no
//     signal that it had stopped measuring.
//   - git answered the first call and a later one failed, or the run's deadline
//     hit: a line saying the measurement failed, for the same reason. "Could not
//     measure" is not "measured zero".
//   - nothing differs from the marker: silence.
//   - not the kit repo, or git cannot run here at all: silence. Nothing was
//     claimed, and there is nothing to report.
//
// What it structurally cannot count. Each of these is defensible alone and the
// union is disclosed nowhere else, which matters for a hook whose entire claim is
// one number:
//   - content above a file's first "## " heading (front matter, a title, a
//     preamble) belongs to no section, so changing it counts nothing;
//   - a corpus file holding no level-2 heading contributes nothing, however much
//     of it changed;
//   - a prose file DELETED since the marker is never examined at all, because the
//     paths diffed are HEAD's listing, so cutting a whole file reads here as
//     silence. That is the pointed one in an effort whose subject is subtraction;
//   - lines cut from above HEAD's first line, by the same rule as front matter.
//
// Cost. Speaking and staying silent do the same work, because the same count
// decides both: one `git ls-tree` for the corpus, one `rev-parse` to check the
// marker resolves, one `git diff --name-only` over the corpus, then one
// `git show` and one `-U0` diff per file that named. Measured on the kit repo at
// 1e5db4e: 0.02-0.03s with a marker, whether it goes on to speak or not, and
// 0.01s outside a kit repo; 0.11s against a marker at the root commit, which
// changes every file in the corpus and is the worst case history can offer.
// Every call is bounded twice, by its own timeout and by the run's deadline.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Bounds one git call.
const GIT_TIMEOUT_MS = 5000;
// Bounds the whole run, which the per-call timeout cannot: this hook makes two
// calls plus two per changed file, so a git that was slow rather than wedged
// would multiply GIT_TIMEOUT_MS by the corpus and hold up a session start for a
// minute without any single call misbehaving. The accretion tool accepts that
// same gap deliberately, being a CLI where a hang costs a Ctrl-C; a hook that
// gates session start has no such user. Sized under branch-reaper-nudge.js's
// worst case (4s + a 6s fetch), so this is not the slowest hook in the kit.
const RUN_BUDGET_MS = 6000;
// Generous but bounded. The largest output here is one file's diff between an old
// marker and HEAD, and the largest prose file in the corpus is well under a
// megabyte.
const GIT_MAX_BUFFER = 32 * 1024 * 1024;

// The take-stock log is a few KB of dated entries; refuse a pathological file
// rather than read it.
const TAKE_STOCK_MAX_BYTES = 1024 * 1024;

// Set in main() once the payload is in hand. Until then there is no run to bound.
let deadline = Infinity;

function readStdin() {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// Run one git command under the shared limits, with no shell. Returns { ok, out };
// every git call in this file goes through here, so no call site can drift from
// the timeout, the kill signal or the deadline.
//
// Fails closed past the deadline: it refuses to spawn, and the refusal reaches
// the caller as a failed measurement, which is reported as a failure rather than
// rounded down to a smaller number.
function runGit(cwd, args) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { ok: false, out: '' };
    try {
        const out = execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            // Whichever bound is nearer. The per-call ceiling stops one wedged
            // call; the remaining budget stops many slow ones.
            timeout: Math.min(GIT_TIMEOUT_MS, remaining),
            // execFileSync's default killSignal is SIGTERM, which a child may trap
            // and outlive, making the timeout advisory. SIGKILL cannot be trapped.
            killSignal: 'SIGKILL',
            maxBuffer: GIT_MAX_BUFFER,
            // stderr is dropped: this hook never quotes git at the user, and
            // inheriting it would put git's fatals on the session's stream.
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return { ok: true, out };
    } catch {
        return { ok: false, out: '' };
    }
}

// The shared section parser, required lazily rather than at the top of the file.
// A top-level require that failed would throw at module load, outside main()'s
// catch, and a plugin cache missing the lib would then print a stack and exit
// non-zero instead of degrading to silence. Called from inside main()'s call
// stack, a failure is caught and the hook says nothing. Node caches the module, so
// the repeat calls cost a map lookup.
function parseSections(text) {
    return require('./accretion-lib.js').parseSections(text);
}

// Is this one of the four prose globs? Written as the accretion tool's own rules
// rather than as one tidier rule of my own, because the tool's rules are not
// uniform: it matches SKILL.md and any references/ or agents/ *.md
// case-insensitively (its /^skill\.md$/i and /\.md$/i gates), and reaches
// assets/CLAUDE.md by an exact path join, which is case-sensitive on Linux.
// Mirroring the unevenness is the point - a rule of my own would be a second
// definition of the corpus, and the two would part company on the day somebody
// committed assets/claude.md.
//
// The leading prefix is accepted blind because the ls-tree pathspec is what bounds
// this to the kit tree under the session's cwd: paths arrive repo-root relative,
// so a kit checkout one directory down inside a larger repo arrives as
// "sub/plugins/claude-kit/...".
function inCorpus(gitPath) {
    const at = gitPath.indexOf('plugins/claude-kit/');
    if (at === -1 || (at !== 0 && gitPath[at - 1] !== '/')) return false;
    const rest = gitPath.slice(at + 'plugins/claude-kit/'.length).split('/');
    if (rest.length === 3 && rest[0] === 'skills' && /^skill\.md$/i.test(rest[2])) return true;
    if (rest.length === 4 && rest[0] === 'skills' && rest[2] === 'references' && /\.md$/i.test(rest[3])) return true;
    if (rest.length === 2 && rest[0] === 'agents' && /\.md$/i.test(rest[1])) return true;
    if (rest.length === 2 && rest[0] === 'assets' && rest[1] === 'CLAUDE.md') return true;
    return false;
}

// Pathspecs resolve against the cwd, but every path here is repo-root relative.
// ":(top)" says "from the root of the working tree", so a nested kit checkout
// diffs the files it just listed rather than nothing at all.
function topPathspec(gitPath) {
    return ':(top)' + gitPath;
}

// The corpus at HEAD, from the tree rather than a directory walk: a file in the
// working tree but not in HEAD correctly does not appear, since nothing here can
// measure what history does not hold. Returns null when git could not answer,
// which doubles as this hook's probe that git can run here at all.
function corpusFiles(cwd) {
    const res = runGit(cwd, [
        'ls-tree', '-r',
        // -z: names arrive raw and NUL-separated, so no path is ever C-quoted or
        // tab-terminated. --full-name: names arrive relative to the repository
        // root rather than to the cwd, which is the form `git show HEAD:<path>`
        // wants and the form `git diff` reports, so all three agree even when the
        // kit checkout is not itself the repository root.
        '-z', '--full-name', '--name-only',
        'HEAD', '--', 'plugins/claude-kit'
    ]);
    if (!res.ok) return null;
    return res.out.split('\0').filter((p) => p !== '' && inCorpus(p)).sort();
}

// One file's sections as of HEAD, or null when git could not produce the text.
//
// HEAD's text and not the working tree's. The hunk ranges these sections are
// matched against are post-image line numbers, which are HEAD's line numbers, so
// parsing a working tree carrying uncommitted edits would line hunks up against
// sections from a different snapshot and report a confident wrong count. The
// accretion tool avoids the same trap for the same reason.
function sectionsAtHead(cwd, gitPath) {
    const res = runGit(cwd, ['show', 'HEAD:' + gitPath]);
    return res.ok ? parseSections(res.out) : null;
}

// The marker: the sha of the last recorded take-stock, from the first dated entry
// in docs/take-stock.md. First and not newest-by-date: the record format puts the
// newest entry at the top, and reading file order keeps this hook out of the
// business of judging dates it did not write.
//
// Returns { marker, absent }. `marker` is null when none could be read, and
// `absent` separates the one condition worth naming in the emitted text - there
// is no file, so no take-stock has ever been recorded - from every other reason a
// read can fail (a directory, an oversized file, a permission error, a file
// holding no entry). Claiming a cause the code has not established is how a
// permission error would put a false sentence into the session's context.
//
// Read from the working tree rather than from HEAD: an entry written but not yet
// committed is still the latest take-stock.
function readMarker(cwd) {
    const file = path.join(cwd, 'docs', 'take-stock.md');
    let fd;
    try {
        // Open first, then fstat the descriptor: memory-lib's readCapped form.
        // stat-then-open checks one file and reads whatever holds the name a
        // moment later, and O_NONBLOCK is what keeps a FIFO from blocking in the
        // open itself.
        fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch (err) {
        return { marker: null, absent: !!(err && err.code === 'ENOENT') };
    }
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size > TAKE_STOCK_MAX_BYTES) return { marker: null, absent: false };
        const buf = Buffer.alloc(stat.size);
        const bytes = fs.readSync(fd, buf, 0, stat.size, 0);
        let text = buf.toString('utf8', 0, bytes);
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        // Headings come from the shared fence-aware parse rather than a bare regex
        // over the text. The hazard the format invites is a fenced example of the
        // record form inside the record file itself - the obvious way to document
        // "## YYYY-MM-DD - <sha>" is to show one - and a regex would take that
        // example's sha as the marker and measure against the wrong commit.
        for (const section of parseSections(text)) {
            const entry = /^(\d{4}-\d{2}-\d{2}) - ([0-9a-fA-F]{40})$/.exec(section.title);
            if (entry) return { marker: { date: entry[1], sha: entry[2] }, absent: false };
        }
        return { marker: null, absent: false };
    } catch {
        return { marker: null, absent: false };
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// Which of HEAD's prose sections hold a line that differs between the marker and
// HEAD. Returns one of:
//   { status: 'counted', count }   0 is a real answer here, not a failure
//   { status: 'unknown-marker' }   the sha is not a commit this repository holds
//   { status: 'failed' }           a call failed, or the deadline hit, part way
//
// No patch header is parsed anywhere. `--name-only -z` names the changed files
// NUL-separated, which git never quotes and never tab-terminates, and each file
// is then diffed alone, so the only lines read are hunk headers. Reading paths out
// of "+++ b/<path>" was the earlier shape, and it dropped, silently and with a
// confident smaller number, any path holding a space (git ends that header with a
// TAB), a quote or a backslash (git C-quotes the whole header); core.quotePath
// governs only the non-ASCII case.
function measure(cwd, sha, files) {
    // Asked separately, and first, so an orphaned marker is reported as an
    // orphaned marker instead of arriving as a failed diff indistinguishable from
    // a broken repository.
    if (!runGit(cwd, ['rev-parse', '--verify', '--quiet', sha + '^{commit}']).ok) {
        return { status: 'unknown-marker' };
    }

    const named = runGit(cwd, [
        'diff',
        // Four config knobs pinned rather than inherited, because each can rewrite
        // what a diff reports: an external driver (diff.external), a textconv
        // driver (a .gitattributes diff=<driver> plus diff.<driver>.textconv,
        // which --no-ext-diff does NOT disable and which can empty every patch),
        // forced colour, and diff.relative, which would name files relative to the
        // cwd and so disagree with the root-relative names everything else uses.
        '--no-ext-diff', '--no-textconv', '--no-color', '--no-relative',
        // --no-renames keeps a rename a delete plus an add, so a renamed file's
        // sections are attributed to the path they now live at.
        '--no-renames', '--name-only', '-z',
        sha, 'HEAD', '--', ...files.map(topPathspec)
    ]);
    if (!named.ok) return { status: 'failed' };

    const corpus = new Set(files);
    const changed = named.out.split('\0').filter((p) => p !== '' && corpus.has(p));

    let count = 0;
    for (const file of changed) {
        const sections = sectionsAtHead(cwd, file);
        // A file the tree listed a moment ago and git will not now show is a
        // failure to measure, not a file with nothing in it.
        if (sections === null) return { status: 'failed' };

        const res = runGit(cwd, [
            'diff', '--no-ext-diff', '--no-textconv', '--no-color', '--no-renames',
            // -U0: every line inside a hunk's range actually changed, so the range
            // can be intersected with a section without counting context.
            '-U0',
            sha, 'HEAD', '--', topPathspec(file)
        ]);
        if (!res.ok) return { status: 'failed' };

        const patched = new Set();
        for (const line of res.out.split('\n')) {
            // Only a hunk header can match: under -U0 every body line carries a
            // "+" or "-" prefix, so nothing in the prose can reach this.
            const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
            if (!hunk) continue;
            const start = Number(hunk[1]);
            const len = hunk[2] === undefined ? 1 : Number(hunk[2]);

            let from = start;
            let to = start + len - 1;
            if (len === 0) {
                // A pure deletion. Git prints "+<the line the gap follows>,0", so
                // the cut text sat between HEAD's `start` and `start + 1`, and both
                // of those lines are where a section lost something. Attributing
                // only to `start` made a cut first section invisible in every file
                // with front matter, because `start` was then the front matter.
                //
                // "+0,0" is a cut from above the first line: it belongs to no
                // section, by the same rule that puts front matter in none, and is
                // skipped rather than clamped onto line 1. Clamping reported a
                // section as changed whose lines were byte-identical.
                if (start === 0) continue;
                from = start;
                to = start + 1;
            }

            for (const section of sections) {
                // Overlap, not containment: one hunk can span a heading.
                if (section.start <= to && section.end >= from) patched.add(section.start);
            }
            // A change above the first heading belongs to no section and is
            // counted by nothing here. That is the definition of the unit being
            // counted, and it is disclosed in the header rather than left implicit.
        }
        count += patched.size;
    }
    return { status: 'counted', count };
}

// The hand-off, shared by every block that reports a measurement. The ranking is a
// real question this hook deliberately does not answer.
const POINTER = 'Which sections carry the change is a separate and slower question, deliberately not answered here: '
    + 'run `node tools/accretion.js` for the ranking. At a natural stopping point, consider a take-stock pass over '
    + 'the kit\'s prose (see the kaizen skill). Reminder, not a blocker.';

function emit(lines) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext: lines.join('\n')
        }
    }));
}

function main() {
    let payload = {};
    try { payload = JSON.parse(readStdin() || '{}'); } catch { return; }
    const cwd = payload.cwd || process.cwd();

    // The kit gate, before any git call.
    if (!fs.existsSync(path.join(cwd, 'plugins', 'claude-kit', '.claude-plugin', 'plugin.json'))) return;

    // The run's budget starts here, after the stdin read, so a parent slow to
    // close the pipe spends its own time rather than git's.
    deadline = Date.now() + RUN_BUDGET_MS;

    // No git, or a kit checkout whose HEAD holds no prose: nothing was measured
    // and nothing is claimed, so there is nothing to say.
    const files = corpusFiles(cwd);
    if (files === null || files.length === 0) return;

    const { marker, absent } = readMarker(cwd);

    if (marker) {
        const result = measure(cwd, marker.sha, files);

        if (result.status === 'unknown-marker') {
            emit([`Take stock (claude-kit prose): the last recorded take-stock names commit ${marker.sha}, which is not a commit in this repository, so nothing could be measured against it. A shallow clone, a rewritten history, or a marker recorded in another checkout all read this way. This says nothing about whether the prose has changed; the marker needs to name a commit this checkout holds. Reminder, not a blocker.`]);
            return;
        }
        if (result.status === 'failed') {
            emit(['Take stock (claude-kit prose): the prose could not be measured against the last recorded take-stock this session, because a git command failed or the run\'s time budget ran out. Read that as "not measured", never as "nothing has changed". Reminder, not a blocker.']);
            return;
        }
        // Measured, and every current section matches the marker.
        if (result.count === 0) return;

        emit([
            // Both halves are computed values: an integer, and a date and sha the
            // marker regex already constrained to digits and hex.
            //
            // "hold lines that differ from" and not "have been patched since": this
            // is a two-point comparison, so a section changed and then changed back
            // is not counted, and the sentence must not claim a history it never
            // read.
            `Take stock (claude-kit prose): ${result.count} of the kit's current prose section(s) hold lines that differ from the last take-stock (${marker.date}, ${marker.sha}).`,
            'That count is a measurement and not a verdict: it says prose has changed since anyone last read it whole, and nothing about what should change, shrink or go.',
            POINTER
        ]);
        return;
    }

    // No marker. The lead names only what was established: an absent file is a
    // take-stock that has never happened, while any other failure to read one is
    // just that.
    emit([
        'Take stock (claude-kit prose): ' + (absent
            ? 'No take-stock has ever been recorded: docs/take-stock.md does not exist, so there is no marker to measure changes against.'
            : 'No take-stock marker could be read from docs/take-stock.md: it holds no "## YYYY-MM-DD - <40-character sha>" entry, or could not be read.'),
        'Nothing has been measured here, because there is no marker to measure against: this says only that no pass has been recorded, not that anything is wrong.',
        POINTER
    ]);
}

try { main(); } catch { /* never break a session over a hook */ }
