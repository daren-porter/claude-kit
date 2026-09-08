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

const { materialize, insideRepo } = require('../tools/arm-harness.js');
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
    assert.ok(!fs.existsSync(path.join(REPO, '.kit', 'arm', 'rep-01')),
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
    const r = materialize({ name: 'kaizen-mandate-probe', reps: 1, fixtures: [f] });
    // Registered BEFORE the assert: materialize mkdtemps before both its insideRepo
    // check and its template read, so a failure can leave the directory on disk.
    if (r.base) MADE.push(r.base);
    assert.strictEqual(r.ok, true, r.reason);
    const generated = path.relative(os.tmpdir(), r.base);
    // Assert the opaque FORM rather than scanning for cue substrings: mkdtemp's
    // random suffix can contain "rep" or "arm" by chance, and the scan this replaced
    // was case-insensitive, so it would have failed about once in three thousand
    // runs. Both review seats brute-forced it independently, at 1-in-3,640 and
    // 1-in-3,333 over 20,000,000 and 20,000 trials; the estimate here was 20,000.
    assert.match(generated, /^w-[A-Za-z0-9]{6}$/,
        'the generated directory must be the opaque fixed form: ' + generated);
    // No second assertion on the name: given the form above, `generated` is exactly
    // eight characters, so no arm name can fit in it. The form regex is the guard.
    assert.match(path.basename(r.dirs[0]), /^rep-\d\d$/,
        'the per-rep leaf is positional only');
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
