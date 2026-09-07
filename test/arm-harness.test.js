// The harness's whole value is the isolation it produces, and the one property a
// unit test can hold is that it never materializes a rep inside this repo. That is
// the guard worth having, because the isolation was MEASURED against a scratch cwd:
// a rep dispatched from the repo quoted the project auto-memory index and two of its
// prose-rule entries from context alone, and one dispatched from a scratch directory
// reported neither. A rep directory inside the repo silently restores that channel
// and nothing about the output would look different.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { materialize, insideRepo } = require('../tools/arm-harness.js');
const REPO = path.join(__dirname, '..');

function scratch() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'arm-harness-test-'));
}
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
        const agent = path.join(d, '.claude', 'agents', 'arm-rep.md');
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
