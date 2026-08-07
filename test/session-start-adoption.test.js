// Tests for the adoption-pass staleness nudge in
// plugins/claude-kit/hooks/session-start.js.
//
// Node's built-in test runner, no framework. The hook is spawned as a real child
// process, fed a SessionStart payload on stdin, and asserted on by the
// additionalContext it emits. Each case builds a fresh temp cwd holding the
// kit-repo marker and its own docs/kit-adoptions.md, cleaned up in a finally.
//
// Every no-nudge fixture also carries an in-progress plan doc, and every no-nudge
// assert requires the plan-recovery block to still be there. Silence on its own
// proves nothing: an adoption check that throws its way past main()'s wrapper
// takes the whole hook down with it and looks exactly like a quiet one, which is
// the risk the section names. Verified by mutation: with the wrapper in place a
// throwing check leaves these cases green, and with the wrapper removed every one
// of them goes red.
//
// HOME and USERPROFILE are redirected for every spawn (os.homedir() reads the
// first on POSIX and the second on Windows). The hook's other additive blocks
// read the home directory (the kaizen inbox, the CLAUDE.md sync marker), and the
// CLAUDE.md one is not kit-repo gated, so against the live home it fires in every
// fixture and "the hook stayed silent" becomes unassertable. The redirected home
// carries a sync marker matching the shipped asset, which is what lets the
// early-return guard be pinned: with nothing else to say, an emitted block can
// only have come from this nudge.
//
// Pass dates are computed relative to the day the suite runs, never hardcoded.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'session-start.js');
const ASSET = path.join(__dirname, '..', 'plugins', 'claude-kit', 'assets', 'CLAUDE.md');

// The block under test, and the day count it must carry.
const NUDGE = /the last adoption pass over Scott's kit was (\d+) days ago/;
// The block that must survive the adoption check no matter what it reads.
const PLAN_RECOVERY = /- docs\/plans\/proj_thing_spec_v1\.md \(Commit Model: Commit-and-Push\)/;

function makeDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmDir(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

function writeFile(full, contents) {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, 'utf8');
}

// A home directory whose CLAUDE.md sync marker already matches the shipped asset
// and whose kaizen inbox is absent, so both of those blocks stay quiet.
const HOME = makeDir('ssa-home-');
writeFile(
    path.join(HOME, '.claude', '.claude-kit-md-version'),
    crypto.createHash('sha256').update(fs.readFileSync(ASSET)).digest('hex')
);
process.on('exit', () => rmDir(HOME));

// Spawn the hook against a fixture cwd; return { status, context }.
function runHook(cwd) {
    const res = spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ cwd, source: 'startup', hook_event_name: 'SessionStart' }),
        env: { ...process.env, HOME, USERPROFILE: HOME },
        encoding: 'utf8',
        // A hook that blocks holds up every session start, so a hang has to fail
        // a test rather than wedge the suite: the kill leaves status null and the
        // exit-0 asserts below catch it.
        timeout: 15000
    });
    const out = (res.stdout || '').trim();
    // Unparseable output is a failure, not silence: swallowing it here would let
    // a broken hook pass every no-nudge case.
    const parsed = out ? JSON.parse(out) : null;
    return {
        status: res.status,
        context: parsed ? (parsed.hookSpecificOutput || {}).additionalContext || '' : ''
    };
}

// YYYY-MM-DD for the calendar day `days` before today, local time, so the
// fixtures track whatever day the suite runs on.
function daysAgo(days) {
    const now = new Date();
    const then = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${then.getFullYear()}-${pad(then.getMonth() + 1)}-${pad(then.getDate())}`;
}

// Assert the nudge fired with the expected count. The fixture date is stamped
// when the fixture is written and the hook reads the clock again at spawn time,
// so a run that crosses local midnight legitimately sees one more day.
function assertNudged(context, expected) {
    const m = NUDGE.exec(context);
    assert.ok(m, 'expected the staleness nudge; context was: ' + context);
    const got = Number(m[1]);
    assert.ok(got === expected || got === expected + 1,
        `expected ${expected} days (or ${expected + 1} across local midnight), got ${got}`);
    return m;
}

// Assert the fixture raises no nudge, exits 0, and leaves plan recovery intact.
function assertNoNudge(cwd, why) {
    const { status, context } = runHook(cwd);
    assert.strictEqual(status, 0, 'the hook must always exit 0: ' + why);
    assert.doesNotMatch(context, NUDGE, why);
    assert.match(context, PLAN_RECOVERY,
        'the adoption check must not take plan recovery down with it (' + why + ')');
    return context;
}

function doc(lastPassLine) {
    return `# Kit Adoptions\n\n${lastPassLine}\nWatermark: 09c91a4\n\nStanding record.\n`;
}

const PLAN = '# Fixture\n\nStatus: In Progress\nCommit Model: Commit-and-Push\n';

// A cwd that looks like the kit repo: the marker the nudge gates on, plus an
// adoptions doc. Pass null for contents to leave the doc out entirely, and
// plan=true to add the in-progress plan doc the no-nudge cases assert on.
function makeKitRepo(prefix, contents, plan) {
    const cwd = makeDir(prefix);
    writeFile(path.join(cwd, 'plugins', 'claude-kit', '.claude-plugin', 'plugin.json'), '{"name":"claude-kit"}');
    if (contents !== null) writeFile(path.join(cwd, 'docs', 'kit-adoptions.md'), contents);
    if (plan) writeFile(path.join(cwd, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
    return cwd;
}

// No plan doc here, deliberately: with a recent pass the hook has nothing at all
// to say, which is the only way to pin that the early-return guard lets the
// stale case through rather than the CLAUDE.md block carrying it.
test('a recent pass raises no nudge', () => {
    const cwd = makeKitRepo('ssa-fresh-', doc(`Last pass: ${daysAgo(3)}`));
    try {
        const { status, context } = runHook(cwd);
        assert.strictEqual(status, 0);
        assert.strictEqual(context, '',
            'nothing else had anything to say, so any output here means either the nudge fired early or the HOME isolation broke');
    } finally { rmDir(cwd); }
});

test('a stale pass nudges with the elapsed whole-day count', () => {
    const cwd = makeKitRepo('ssa-stale-', doc(`Last pass: ${daysAgo(45)}`));
    try {
        const { status, context } = runHook(cwd);
        assert.strictEqual(status, 0);
        const m = assertNudged(context, 45);
        assert.match(context, /kit-adoption-pass/);
        // The nudge's own block closes in the siblings' register.
        assert.match(context, new RegExp(`was ${m[1]} days ago[^\\n]*Reminder, not a blocker\\.$`, 'm'));
    } finally { rmDir(cwd); }
});

// The threshold is exclusive: 30 days is not yet stale, 31 is. This pins the
// boundary in both directions so the constant cannot drift unnoticed.
test('exactly the threshold is not yet stale; one day past it is', () => {
    const at = makeKitRepo('ssa-at-', doc(`Last pass: ${daysAgo(30)}`), true);
    try {
        const { status, context } = runHook(at);
        assert.strictEqual(status, 0);
        const m = NUDGE.exec(context);
        // A run crossing local midnight between fixture and spawn sees 31, which
        // is correctly stale; any other nudge means the threshold moved.
        assert.ok(m === null || m[1] === '31', 'at the threshold the nudge must hold; context was: ' + context);
        assert.match(context, PLAN_RECOVERY);
    } finally { rmDir(at); }
    const past = makeKitRepo('ssa-past-', doc(`Last pass: ${daysAgo(31)}`), true);
    try {
        assertNudged(runHook(past).context, 31);
    } finally { rmDir(past); }
});

test('an adoptions doc with no Last pass: line at all is silent', () => {
    const cwd = makeKitRepo('ssa-noheader-', '# Kit Adoptions\n\nWatermark: 09c91a4\n\nStanding record.\n', true);
    try {
        assertNoNudge(cwd, 'no header means no date to age');
    } finally { rmDir(cwd); }
});

test('a missing adoptions doc is silent', () => {
    const cwd = makeKitRepo('ssa-nodoc-', null, true);
    try {
        assertNoNudge(cwd, 'no adoptions doc at all');
    } finally { rmDir(cwd); }
});

// The header is a contract about the line, not just the words: reformatting it
// into a heading or a list item moves it off column zero and the anchored
// predicate stops seeing it. Stale dates, so only the anchoring can explain the
// silence.
test('a non-anchored Last pass: occurrence (heading or list item) is silent', () => {
    for (const [prefix, lead] of [['ssa-head-', '### '], ['ssa-item-', '- '], ['ssa-indent-', '  ']]) {
        const cwd = makeKitRepo(prefix, doc(`${lead}Last pass: ${daysAgo(90)}`), true);
        try {
            assertNoNudge(cwd, 'a ' + JSON.stringify(lead) + ' prefix must not parse');
        } finally { rmDir(cwd); }
    }
});

// Anything but strict YYYY-MM-DD is silence, including forms Date would happily
// accept, and including a date carrying trailing prose.
test('a loosely formed date is silent', () => {
    for (const [prefix, date] of [
        ['ssa-short-', '2020-1-5'],
        ['ssa-slash-', '2020/01/05'],
        ['ssa-words-', 'January 5 2020'],
        ['ssa-trailing-', '2020-01-05 (approximately)']
    ]) {
        const cwd = makeKitRepo(prefix, doc(`Last pass: ${date}`), true);
        try {
            assertNoNudge(cwd, JSON.stringify(date) + ' must not parse');
        } finally { rmDir(cwd); }
    }
});

// Well formed but impossible. Date rolls month 13 into the next January and day
// 32 into the next month, which would turn a typo into a confidently wrong count.
test('an impossible date is silent rather than rolled over', () => {
    for (const [prefix, date] of [
        ['ssa-m13-', '2020-13-05'],
        ['ssa-d32-', '2020-01-32'],
        ['ssa-m00-', '2020-00-05'],
        ['ssa-d00-', '2020-01-00']
    ]) {
        const cwd = makeKitRepo(prefix, doc(`Last pass: ${date}`), true);
        try {
            assertNoNudge(cwd, JSON.stringify(date) + ' must not parse');
        } finally { rmDir(cwd); }
    }
});

// The read is bounded at 2 KB, which is why the adoptions doc pins the header to
// the top of the file. A header pushed below that bound is invisible.
test('a Last pass: line pushed past the bounded head read is silent', () => {
    const padding = ('x'.repeat(79) + '\n').repeat(30);
    const cwd = makeKitRepo('ssa-deep-', `# Kit Adoptions\n\n${padding}Last pass: ${daysAgo(90)}\n`, true);
    try {
        assertNoNudge(cwd, 'a header below the 2 KB bound is not read');
    } finally { rmDir(cwd); }
});

// A header cut in half by that same bound must not parse as a whole line either:
// under the m flag $ matches the truncation point, so a line that really runs on
// with prose would otherwise look strict.
test('a Last pass: line straddling the head-read boundary is silent', () => {
    // Padded so the date ends exactly on byte 2048: "Last pass: YYYY-MM-DD" is 21
    // bytes, so the read stops right after the date and the rest of the line,
    // which makes it anything but a bare header, is never seen.
    const padding = 'x'.repeat(2048 - 21 - 1) + '\n';
    const cwd = makeKitRepo('ssa-cut-', `${padding}Last pass: ${daysAgo(90)} and then prose that runs well past the bound\n`, true);
    try {
        assertNoNudge(cwd, 'a header the read could not see the end of must not parse');
    } finally { rmDir(cwd); }
});

// The idioms the sibling scans carry: a BOM ahead of the first line, CRLF
// endings, and a case that does not match the file's own spelling.
test('a BOM, CRLF endings, and mixed case still parse', () => {
    const cwd = makeKitRepo('ssa-bom-', `﻿# Kit Adoptions\r\n\r\nLAST PASS:  ${daysAgo(60)}\r\nWatermark: 09c91a4\r\n`);
    try {
        assertNudged(runHook(cwd).context, 60);
    } finally { rmDir(cwd); }
});

// The gate: a project that is not the kit repo never hears about the pass, no
// matter what its docs/ tree holds.
test('a non-kit repo with a stale adoptions doc is silent', () => {
    const cwd = makeDir('ssa-other-');
    try {
        writeFile(path.join(cwd, 'docs', 'kit-adoptions.md'), doc(`Last pass: ${daysAgo(365)}`));
        writeFile(path.join(cwd, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
        assertNoNudge(cwd, 'no kit marker, so the nudge never runs here');
    } finally { rmDir(cwd); }
});

// A pass dated in the future is nonsense, not an elapsed span.
test('a future pass date is silent', () => {
    const cwd = makeKitRepo('ssa-future-', doc(`Last pass: ${daysAgo(-40)}`), true);
    try {
        assertNoNudge(cwd, 'a future date is not an elapsed span');
    } finally { rmDir(cwd); }
});

// The shipped docs/kit-adoptions.md is the only file this nudge ever parses, and
// the failure it warns about is silent: reformat the header and the nudge dies
// with no error anywhere. Run the real file through the hook, with only its date
// token rewritten in a throwaway copy, so a reformat is caught here instead of by
// nobody. Replacing the token rather than the whole line is what makes the guard
// real: overwriting the line would canonicalize a reformatted header (a slashed
// date, an annotation trailing the date) into the fixture and pass green while
// the shipped file had gone silent. A header the hook cannot parse leaves the
// replace a no-op or leaves the annotation in place, and the assert fails.
test('the shipped docs/kit-adoptions.md header parses through the hook', () => {
    const shipped = fs.readFileSync(path.join(__dirname, '..', 'docs', 'kit-adoptions.md'), 'utf8');
    // Anchored and case-insensitive, mirroring the hook's own predicate.
    assert.match(shipped, /^last pass:/im, 'the shipped doc no longer carries a Last pass: line');
    const aged = shipped.replace(/^(last pass:[^\S\r\n]*)\d{4}-\d{2}-\d{2}/im, `$1${daysAgo(90)}`);
    const cwd = makeKitRepo('ssa-shipped-', aged);
    try {
        assertNudged(runHook(cwd).context, 90);
    } finally { rmDir(cwd); }
});

// The fail-open property the whole file rests on: a docs/kit-adoptions.md that
// is not a readable regular file is silence, not a crash and not a lost plan
// recovery. A directory of that name is the portable case.
test('an unreadable adoptions doc leaves the session and plan recovery intact', () => {
    const cwd = makeKitRepo('ssa-dir-', null, true);
    try {
        fs.mkdirSync(path.join(cwd, 'docs', 'kit-adoptions.md'));
        assertNoNudge(cwd, 'a directory where the doc should be');
    } finally { rmDir(cwd); }
});

// The non-regular-file case with teeth: openSync on a FIFO blocks until someone
// writes, which would hang session start rather than fail it, so the read is
// gated on statSync().isFile() ahead of the open. The spawn timeout above turns
// a regression here into a failed status instead of a wedged suite.
test('a FIFO in place of the adoptions doc does not hang session start', () => {
    const cwd = makeKitRepo('ssa-fifo-', null, true);
    try {
        const made = spawnSync('mkfifo', [path.join(cwd, 'docs', 'kit-adoptions.md')], { encoding: 'utf8' });
        // No mkfifo (Windows, or a stripped image): nothing to pin here.
        if (made.error || made.status !== 0) return;
        assertNoNudge(cwd, 'a FIFO must be refused before the open, not blocked on');
    } finally { rmDir(cwd); }
});
