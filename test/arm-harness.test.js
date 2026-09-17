// The harness's whole value is the isolation it produces. A unit test cannot dispatch
// a rep, so what it holds is the materialization: the tool's own guards, the agent
// definition it writes, and above all that it never materializes a rep inside this
// repo. That is
// the guard worth having, because the isolation was MEASURED against a scratch cwd:
// a rep dispatched from the repo quoted the project auto-memory index and two of its
// prose-rule entries from context alone, and one dispatched from a scratch directory
// reported neither. A rep directory inside the repo silently restores that channel
// and nothing about the output would look different.

'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { materialize, insideRepo, dispatchCommand } = require('../tools/arm-harness.js');
const REPO = path.join(__dirname, '..');

// Every directory these tests create is registered and removed at the end, because
// the tool's own default destination is a mkdtemp under the system temp dir and an
// unregistered one is never cleaned up.
const MADE = [];
function scratch() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'arm-harness-test-'));
    MADE.push(d);
    return d;
}
after(() => {
    for (const d of MADE) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ } }
});
function fixture(dir, name, body) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, body, 'utf8');
    return p;
}

test('insideRepo catches the repo, its subdirectories and itself', () => {
    assert.strictEqual(insideRepo(REPO), true);
    assert.strictEqual(insideRepo(path.join(REPO, 'docs')), true);
    assert.strictEqual(insideRepo(path.join(REPO, '.kit', 'anything')), true);
    assert.strictEqual(insideRepo(os.tmpdir()), false);
});

test('a destination inside the repo is refused, which is the isolation guard', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'do the thing');
    const r = materialize({ name: 'probe', reps: 1, fixtures: [f], root: path.join(REPO, '.kit', 'arm') });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /inside the repo/);
    assert.ok(!fs.existsSync(path.join(REPO, '.kit', 'arm')),
        'nothing was created before the refusal');
});

test('one directory per rep, each with the agent definition and every fixture', () => {
    const work = scratch();
    const a = fixture(work, 'task.md', 'the task');
    const b = fixture(work, 'wording.md', 'the draft under test');
    const r = materialize({ name: 'two-fixtures', reps: 3, fixtures: [a, b], root: path.join(scratch(), 'out') });
    assert.strictEqual(r.ok, true, r.reason);
    assert.strictEqual(r.dirs.length, 3);
    for (const d of r.dirs) {
        const agent = path.join(d, '.claude', 'agents', 'plain-worker.md');
        assert.ok(fs.existsSync(agent), 'agent definition present in ' + d);
        const body = fs.readFileSync(agent, 'utf8');
        assert.match(body, /^tools: Read, Bash$/m, 'tools omit Skill, which is what suppresses the listing');
        assert.ok(!/\bSkill\b/.test(body), 'the definition never grants Skill');
        assert.strictEqual(fs.readFileSync(path.join(d, 'task.md'), 'utf8'), 'the task');
        assert.strictEqual(fs.readFileSync(path.join(d, 'wording.md'), 'utf8'), 'the draft under test');
    }
    // Distinct directories, so parallel reps cannot overwrite each other's work.
    assert.strictEqual(new Set(r.dirs).size, 3);

});

test('bad inputs are refused rather than half-materialized', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const out = path.join(scratch(), 'o');
    assert.match(materialize({ name: 'Bad Name', reps: 1, fixtures: [f], root: out }).reason, /kebab-case/);
    assert.match(materialize({ name: 'ok', reps: 0, fixtures: [f], root: out }).reason, /1-20/);
    assert.match(materialize({ name: 'ok', reps: 99, fixtures: [f], root: out }).reason, /1-20/);
    assert.match(materialize({ name: 'ok', reps: 2, fixtures: [path.join(work, 'nope.md')], root: out }).reason,
        /fixture not found/);
    assert.match(materialize({ name: 'ok', reps: 1, fixtures: [work], root: out }).reason, /not a file/);
    assert.ok(!fs.existsSync(out), 'no directory created by any refused call');
});

// Both cues that leaked on this harness's first live arm, pinned so they cannot come
// back. One rep wrote that it declined to read the harness doc because "the directory
// name says this is a probe"; another enumerated its own `.claude/agents/arm-rep.md`.
// A fixture's path reaches every rep and no rep can decline to read its own cwd, which
// is `writing-skills`' recorded leak-with-nothing-walked.
test('the generated rep path names neither the arm nor the experiment', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const r = materialize({ name: 'kaizen-mandate-probe', reps: 3, fixtures: [f] });
    // Registered BEFORE the assert: materialize mkdtemps before its template read,
    // so a failure can leave directories on disk.
    for (const d of (r.dirs || [])) MADE.push(d);
    assert.strictEqual(r.ok, true, r.reason);
    for (const d of r.dirs) {
        const generated = path.relative(os.tmpdir(), d);
        // Assert the opaque FORM rather than scanning for cue substrings: mkdtemp's
        // random suffix can contain "rep" or "arm" by chance, and the scan this
        // replaced was case-insensitive, so it would have failed about once in three
        // thousand runs. Both review seats brute-forced it independently, at
        // 1-in-3,640 and 1-in-3,333 over 20,000,000 and 20,000 trials.
        assert.match(generated, /^w-[A-Za-z0-9]{6}$/,
            'every rep directory must be the opaque fixed form: ' + generated);
    }
});

// The ordinal. This assertion is INVERTED from the one it replaces, which required
// the per-rep leaf to match /^rep-\d\d$/ and called it "positional only". It is the
// third instance of the cue class the two tests above pin: `rep-01` is a bookkeeping
// ordinal in every rep's cwd, which is exactly the `r4` ancestor segment
// `writing-skills` records as the tell in its fixture-path leak, and the test six
// lines below has always banned the same token in the agent filename. Reps read the
// segment and quote it back; twenty such paths appear in one 2026-09-17 arm's output.
// Inverted rather than deleted, because a deleted assertion and one that never
// existed look identical to every later reader.
test('no rep directory carries an ordinal or an experiment token', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const r = materialize({ name: 'ordinal', reps: 3, fixtures: [f], root: path.join(scratch(), 'o') });
    assert.strictEqual(r.ok, true, r.reason);
    for (const d of r.dirs) {
        const leaf = path.basename(d);
        // Exact, not a substring scan. The comment above records why scanning is the
        // wrong instrument here: mkdtemp's suffix can contain "rep" or "arm" by
        // chance, so a case-insensitive scan fails about once in three thousand runs.
        // The old shape is what this asserts against, and the opaque form is the guard.
        assert.ok(!/^rep-\d+$/.test(leaf),
            'rep directory leaf is a bookkeeping ordinal, the shape this test inverted: ' + leaf);
        assert.match(leaf, /^w-[A-Za-z0-9]{6}$/,
            'rep directory leaf must be the opaque fixed form: ' + leaf);
    }
});

// Separate roots, which is what retires the shared parent. It was a write surface no
// caller was told about: a rep of the 2026-09-17 arm wrote a scratch file one level
// above its own cwd, where its two siblings could have read it, and it was caught only
// because the operator listed that directory by hand between serial reps.
test('reps share no parent but the system temp dir', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const r = materialize({ name: 'noshare', reps: 3, fixtures: [f] });
    for (const d of (r.dirs || [])) MADE.push(d);
    assert.strictEqual(r.ok, true, r.reason);
    assert.strictEqual(new Set(r.dirs).size, 3);
    for (const d of r.dirs) {
        assert.strictEqual(path.dirname(d), os.tmpdir(),
            'a rep directory sits directly in the temp dir, with no arm-owned parent');
        // The fixtures are at the rep's own root, so nothing about the layout tells a
        // rep it is one of several.
        assert.ok(fs.existsSync(path.join(d, 'task.md')), 'fixture at the rep root');
    }
    assert.ok(!('base' in r), 'materialize no longer hands back a shared base');
});

// Both invocation defects, measured on four reps of the 2026-09-17 posting-scope arm
// before they were written down. Pinned against the real string rather than a copy.
test('the printed dispatch closes stdin and demands the reply as the final output', () => {
    const cmd = dispatchCommand('/tmp/w-abc123');
    assert.ok(cmd.includes('< /dev/null'),
        'without this every rep printed "no stdin data received in 3s" into the capture');
    assert.ok(cmd.includes('Your entire final output must be'),
        'the reply has to BE the last message, since --output-format text keeps only that');
    assert.ok(!/report its reply verbatim and nothing else/.test(cmd),
        'the old phrasing let the dispatcher relay and then summarize, and the summary won');
    assert.ok(cmd.includes('--agent') || cmd.includes('Dispatch the plain-worker agent'),
        'the rep must be a subagent, not a top-level session');
});

test('the agent file carries no experiment cue in its name either', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const r = materialize({ name: 'probe', reps: 1, fixtures: [f], root: path.join(scratch(), 'o') });
    const agents = fs.readdirSync(path.join(r.dirs[0], '.claude', 'agents'));
    assert.deepStrictEqual(agents, ['plain-worker.md']);
    assert.ok(!/arm|probe|rep\b/i.test(agents[0]), 'agent filename is a cue: ' + agents[0]);
});

// The permission grant, pinned because without it the printed dispatch is refused by
// the classifier in a non-interactive session, which was observed after four reps had
// already succeeded with the same command shape.
test('each rep directory grants the dispatch the printed command needs', () => {
    const work = scratch();
    const f = fixture(work, 'task.md', 'x');
    const r = materialize({ name: 'grant', reps: 2, fixtures: [f], root: path.join(scratch(), 'g') });
    assert.strictEqual(r.ok, true, r.reason);
    for (const d of r.dirs) {
        const cfg = JSON.parse(fs.readFileSync(path.join(d, '.claude', 'settings.local.json'), 'utf8'));
        assert.deepStrictEqual(cfg.permissions.allow.slice().sort(), ['Agent', 'Task']);
    }
});
