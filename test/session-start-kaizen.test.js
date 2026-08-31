// Tests for the kaizen inbox count in plugins/claude-kit/hooks/session-start.js.
//
// Same harness as session-start-adoption.test.js: the hook is spawned as a real
// child process with HOME redirected, fed a SessionStart payload, and asserted on
// by the additionalContext it emits.
//
// What these pin is that the count is one per NOTE, not one per line. The shipped
// count was per non-blank line, so the inbox of 2026-08-31 (26 notes, 4 of them
// multi-line at 6, 7, 7 and 7 lines, 49 non-blank lines) reported 49 and the
// operator sized a pass off a number nearly double the real one. A multi-line fixture is therefore the whole
// point of the first case: a suite whose notes are all one-liners cannot tell the
// two implementations apart, and that is exactly how the defect survived.
//
// Verified by mutation: reverting countPendingKaizen's filter to
// `l.trim().length > 0` reddens every case that depends on per-note counting and
// leaves the rest green. Deliberately not enumerated here - a list of which cases
// carry it goes stale the moment a case is added, which is a defect this suite's
// own history supplies twice.
//
// Every fixture carries the kit-repo marker, since the count is kit-repo gated,
// and CLAUDE_KIT_MEMORY_DIR is pointed at a path that does not exist so the
// cross-project block cannot add text these asserts would have to tolerate.
//
// Every no-block fixture also carries an in-progress plan doc and asserts the
// plan-recovery block survives, the idiom session-start-adoption.test.js uses:
// main() swallows a throw out of countPendingKaizen, so "no kaizen block" on its
// own is also satisfied by a hook that fell over, and the co-assert rules that out.
//
// It does NOT prove the counter ran, and no assertion here can: a counter that
// returns 0 and one that throws are indistinguishable from outside, since both
// emit nothing. What catches a throwing counter is every case that expects a count.
// Verified by mutation with `throw` as the counter's first statement: those go red,
// and the cases that expect no block stay green, correctly and unavoidably.

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

const KAIZEN = /the kaizen inbox \(~\/\.claude-kaizen\) has (\d+) pending item\(s\)/;

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

// A cwd carrying the kit-repo marker the count is gated on, and nothing else, so
// no plan-recovery or adoption block competes for the emitted text.
function makeKitRepo() {
    const dir = makeDir('ssk-repo-');
    writeFile(path.join(dir, 'plugins', 'claude-kit', '.claude-plugin', 'plugin.json'), '{}');
    return dir;
}

// A home whose CLAUDE.md sync marker already matches the shipped asset, so that
// block stays quiet, and whose kaizen inbox each case writes for itself.
function makeHome() {
    const home = makeDir('ssk-home-');
    writeFile(
        path.join(home, '.claude', '.claude-kit-md-version'),
        crypto.createHash('sha256').update(fs.readFileSync(ASSET)).digest('hex')
    );
    return home;
}

function runHook(cwd, home) {
    const res = spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ cwd, source: 'startup', hook_event_name: 'SessionStart' }),
        env: {
            ...process.env,
            HOME: home,
            USERPROFILE: home,
            CLAUDE_KIT_MEMORY_DIR: path.join(home, 'absent-memory-store')
        },
        encoding: 'utf8',
        timeout: 15000
    });
    const out = (res.stdout || '').trim();
    const parsed = out ? JSON.parse(out) : null;
    assert.strictEqual(res.status, 0, 'hook must exit 0; stderr was: ' + (res.stderr || ''));
    return parsed ? (parsed.hookSpecificOutput || {}).additionalContext || '' : '';
}

// A plan doc the recovery block will report, so a case expecting NO kaizen block
// can prove the hook still ran instead of proving it died.
const PLAN = ['# Thing', '', 'Status: In Progress', 'Commit Model: Commit-and-Push', ''].join('\n');
const PLAN_RECOVERY = /proj_thing_spec_v1\.md \(Commit Model: Commit-and-Push\)/;

// Run one case: write `notes` (and optional brief filenames) into a fresh inbox,
// spawn, and return the reported count, or null when no kaizen block was emitted.
// Every case carries the plan doc; `expectNoBlock` additionally asserts the
// plan-recovery block came back, which is what makes a null meaningful.
function countFor(notes, briefs, expectNoBlock) {
    const repo = makeKitRepo();
    const home = makeHome();
    try {
        writeFile(path.join(repo, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
        if (notes !== null) writeFile(path.join(home, '.claude-kaizen', 'notes.md'), notes);
        for (const name of briefs || []) {
            writeFile(path.join(home, '.claude-kaizen', 'briefs', name), '# brief\n');
        }
        const context = runHook(repo, home);
        if (expectNoBlock) {
            assert.match(context, PLAN_RECOVERY,
                'the hook must still have run; a missing kaizen block proves nothing on its own');
        }
        const m = KAIZEN.exec(context);
        return m ? Number(m[1]) : null;
    } finally {
        rmDir(repo);
        rmDir(home);
    }
}

test('a multi-line note counts once, not once per line', () => {
    const notes = [
        '2026-08-28 - executing-work: the report-file readiness signal is contradicted by the',
        'harness itself, and the failure mode is a silent stall rather than an error. Three things',
        'are wrong at once, and the workaround is undocumented and therefore luck.',
        '',
        '2026-08-29 - a one-line note.',
        ''
    ].join('\n');
    assert.strictEqual(countFor(notes), 2);
});

test('every bullet form counts, and an indented continuation never does', () => {
    const notes = [
        '- 2026-08-25 (EleosCore PBI #24979): three reviewers pointed at one SQL Server container',
        '  mutated each other\'s fixture rows mid-review, so the evidence could not be trusted.',
        '2026-08-26 - a bare-prefix note.',
        '* 2026-08-27 - an asterisk bullet is a formatting slip, not an empty inbox.',
        '+ 2026-08-28 - so is a plus.',
        ''
    ].join('\n');
    assert.strictEqual(countFor(notes), 4);
});

test('an indented continuation that itself opens with a date is still one note', () => {
    // Defensive rather than observed, and said so because the difference matters:
    // of the 23 continuation lines in the real 2026-08-31 inbox, 11 sat at column
    // zero and ZERO carried a date in any form. So no note has yet tripped this,
    // and what makes it worth pinning is that 11 unindented continuations means the
    // only thing standing between the corpus and a miscount is that none of them
    // happened to begin with a date.
    const notes = [
        '2026-08-28 - the report-file readiness signal is contradicted by the harness.',
        '  2026-07-30 was when the convention landed, which is why nobody noticed.',
        '  and a third line for good measure.',
        ''
    ].join('\n');
    assert.strictEqual(countFor(notes), 1);
});

test('a FIFO at notes.md does not hang session start', () => {
    // The hook header promises it never blocks, and openSync on a FIFO blocks
    // forever, so the regular-file guard has to run before the open rather than on
    // an already-open descriptor. A guard placed after the open passes every other
    // case in this file and hangs here.
    const repo = makeKitRepo();
    const home = makeHome();
    try {
        fs.mkdirSync(path.join(home, '.claude-kaizen'), { recursive: true });
        const res = spawnSync('mkfifo', [path.join(home, '.claude-kaizen', 'notes.md')]);
        if (res.status !== 0) return; // no mkfifo on this platform; nothing to pin
        writeFile(path.join(repo, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
        // runHook's own timeout leaves status null on a hang, which the exit-0
        // assert inside it turns into a failure rather than a wedged suite.
        assert.match(runHook(repo, home), PLAN_RECOVERY,
            'the hook must return promptly and still emit its other blocks');
    } finally {
        rmDir(repo);
        rmDir(home);
    }
});

test('a BOM does not swallow the first note', () => {
    assert.strictEqual(countFor('\uFEFF2026-08-30 - one note behind a byte-order mark.\n'), 1);
});

test('briefs add one apiece on top of the notes', () => {
    assert.strictEqual(countFor('2026-08-30 - one note.\n', ['a.md', 'b.md']), 3);
});

test('an empty inbox emits no kaizen block at all', () => {
    assert.strictEqual(countFor('\n', [], true), null);
    assert.strictEqual(countFor(null, [], true), null);
});

test('an inbox past the bounded read reports a floor, not a false exact count', () => {
    // At the observed 727 bytes per note, 64KB holds about 90, so this is a guard
    // rather than an expected path.
    // What it pins is that the undercount announces itself: a bare number here
    // would be the same silent misreport the per-note count was written to end.
    const note = (i) => `2026-08-${String((i % 28) + 1).padStart(2, '0')} - note ${i} ` + 'x'.repeat(200);
    const notes = Array.from({ length: 600 }, (_, i) => note(i)).join('\n') + '\n';
    const repo = makeKitRepo();
    const home = makeHome();
    try {
        writeFile(path.join(repo, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
        writeFile(path.join(home, '.claude-kaizen', 'notes.md'), notes);
        const context = runHook(repo, home);
        assert.match(context, /has at least \d+ pending item\(s\)/,
            'a truncated read must say the count is a floor; context was: ' + context);
        const seen = Number(/has at least (\d+) pending/.exec(context)[1]);
        assert.ok(seen > 0 && seen < 600, 'expected a partial count, got ' + seen);
    } finally {
        rmDir(repo);
        rmDir(home);
    }
});

test('a briefs directory past the cap also reports a floor', () => {
    // The function has two truncation sources and the honesty fix first went to
    // only one of them, so 520 briefs read as a flat exact-looking 501.
    const repo = makeKitRepo();
    const home = makeHome();
    try {
        writeFile(path.join(repo, 'docs', 'plans', 'proj_thing_spec_v1.md'), PLAN);
        writeFile(path.join(home, '.claude-kaizen', 'notes.md'), '2026-08-30 - one note.\n');
        for (let i = 0; i < 520; i++) {
            writeFile(path.join(home, '.claude-kaizen', 'briefs', `b${i}.md`), '# brief\n');
        }
        assert.match(runHook(repo, home), /has at least \d+ pending item\(s\)/,
            'an over-cap briefs directory must say the count is a floor');
    } finally {
        rmDir(repo);
        rmDir(home);
    }
});

test('outside the kit repo the counter is skipped and the hook stays silent', () => {
    // The count is kit-repo gated, and this is the dominant path: most sessions are
    // not in this repo. It went untested once and a return-shape change broke it,
    // emitting an empty additionalContext where the base ref emitted nothing at all.
    // A full inbox is planted so a silent result cannot come from an empty one.
    const repo = makeDir('ssk-notkit-');
    const home = makeHome();
    try {
        writeFile(path.join(home, '.claude-kaizen', 'notes.md'),
            '2026-08-30 - a note the hook must not report outside the kit repo.\n');
        writeFile(path.join(home, '.claude-kaizen', 'briefs', 'a.md'), '# brief\n');
        const res = spawnSync(process.execPath, [HOOK], {
            input: JSON.stringify({ cwd: repo, source: 'startup', hook_event_name: 'SessionStart' }),
            env: {
                ...process.env,
                HOME: home,
                USERPROFILE: home,
                CLAUDE_KIT_MEMORY_DIR: path.join(home, 'absent-memory-store')
            },
            encoding: 'utf8',
            timeout: 15000
        });
        assert.strictEqual(res.status, 0, 'stderr was: ' + (res.stderr || ''));
        assert.strictEqual((res.stdout || '').trim(), '',
            'with nothing to say the hook must write nothing at all, not an empty block');
    } finally {
        rmDir(repo);
        rmDir(home);
    }
});

test('content with no parseable date floors at one rather than going invisible', () => {
    // The failure worse than a wrong count: friction sitting in the file while the
    // nudge, and the skill's pending predicate with it, report nothing waiting.
    assert.strictEqual(countFor('a note somebody wrote with no date on it\n'), 1);
});
