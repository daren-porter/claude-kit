// Unit tests for plugins/claude-kit/hooks/kit-goal-lib.js.
//
// Node's built-in test runner, no framework, no install. Each test builds a
// fresh temp directory under os.tmpdir() as a fake repo cwd, writes whatever
// plan fixture it needs, runs the lib against it, and cleans up in a finally
// block regardless of pass/fail.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
    goalPath,
    readGoal,
    armGoal,
    bindSession,
    clearGoal,
    composeCondition,
    planHead,
    classifyPlanStatus,
    isClosedPlanStatus
} = require('../plugins/claude-kit/hooks/kit-goal-lib.js');

const CLI = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'kit-goal.js');

// Fresh temp dir per test, acting as a fake repo root.
function makeRepo() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-goal-test-'));
    return dir;
}

function rmRepo(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // Best-effort cleanup; leaving a temp dir behind never fails the test.
    }
}

function writePlan(repo, relPath, contents) {
    const full = path.join(repo, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, 'utf8');
}

test('armGoal success writes goal-state.json with the exact schema', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n\nsome content\n');
        const result = armGoal(repo, 'docs/plans/foo.md');
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.plan, 'docs/plans/foo.md');

        const state = readGoal(repo);
        assert.ok(state, 'goal state should be readable after arming');
        assert.deepStrictEqual(Object.keys(state).sort(), ['armedAt', 'boundSession', 'condition', 'plan']);
        assert.strictEqual(state.plan, 'docs/plans/foo.md');
        assert.strictEqual(state.boundSession, null, 'a freshly armed goal is unbound');
        assert.ok(!state.plan.includes('\\'), 'plan path must be forward-slash');
        assert.ok(state.condition.includes('docs/plans/foo.md'));
        assert.ok(state.condition.includes('(a)'));
        assert.ok(state.condition.includes('(b)'));
        assert.ok(!Number.isNaN(Date.parse(state.armedAt)), 'armedAt should be a valid ISO timestamp');
    } finally {
        rmRepo(repo);
    }
});

test('armGoal writes atomically: no leftover .tmp.<pid> file after success', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        const result = armGoal(repo, 'docs/plans/foo.md');
        assert.strictEqual(result.ok, true);
        assert.ok(fs.existsSync(goalPath(repo)));
        // armGoal runs in this same process, so its tmp name is deterministic here.
        assert.ok(!fs.existsSync(goalPath(repo) + '.tmp.' + process.pid));
    } finally {
        rmRepo(repo);
    }
});

test('armGoal rejects a missing plan file', () => {
    const repo = makeRepo();
    try {
        const result = armGoal(repo, 'docs/plans/does-not-exist.md');
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /not found/i);
        assert.ok(!fs.existsSync(goalPath(repo)), 'no state file should be written on rejection');
    } finally {
        rmRepo(repo);
    }
});

test('armGoal rejects a plan whose header is Status: Complete', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/done.md', 'Status: Complete\n\nfinished\n');
        const result = armGoal(repo, 'docs/plans/done.md');
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /Complete/);
        assert.ok(!fs.existsSync(goalPath(repo)), 'no state file should be written on rejection');
    } finally {
        rmRepo(repo);
    }
});

test('armGoal accepts a plan whose header is Status: In Progress', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/wip.md', 'Status: In Progress\n\nworking\n');
        const result = armGoal(repo, 'docs/plans/wip.md');
        assert.strictEqual(result.ok, true);
        assert.ok(fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
    }
});

test('armGoal rejects a relative path that escapes the repo', () => {
    const repo = makeRepo();
    try {
        const result = armGoal(repo, '../outside.md');
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /outside the repo/i);
        assert.ok(!fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
    }
});

test('armGoal rejects an absolute path outside the repo', () => {
    const repo = makeRepo();
    const other = makeRepo();
    try {
        writePlan(other, 'plan.md', 'Status: In Progress\n');
        const result = armGoal(repo, path.join(other, 'plan.md'));
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /outside the repo/i);
        assert.ok(!fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
        rmRepo(other);
    }
});

test('armGoal accepts an absolute path under cwd and re-relativizes it', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/abs.md', 'Status: In Progress\n');
        const absPath = path.join(repo, 'docs', 'plans', 'abs.md');
        const result = armGoal(repo, absPath);
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.plan, 'docs/plans/abs.md');
        const state = readGoal(repo);
        assert.strictEqual(state.plan, 'docs/plans/abs.md');
    } finally {
        rmRepo(repo);
    }
});

test('readGoal returns null when absent, the object when present, null on corrupt JSON', () => {
    const repo = makeRepo();
    try {
        assert.strictEqual(readGoal(repo), null);

        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');
        const state = readGoal(repo);
        assert.ok(state);
        assert.strictEqual(state.plan, 'docs/plans/foo.md');

        fs.writeFileSync(goalPath(repo), '{ not valid json', 'utf8');
        assert.strictEqual(readGoal(repo), null);
    } finally {
        rmRepo(repo);
    }
});

test('clearGoal removes the file and is a no-op when absent', () => {
    const repo = makeRepo();
    try {
        assert.deepStrictEqual(clearGoal(repo), { ok: true, cleared: false });

        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');
        assert.ok(fs.existsSync(goalPath(repo)));

        assert.deepStrictEqual(clearGoal(repo), { ok: true, cleared: true });
        assert.ok(!fs.existsSync(goalPath(repo)));

        assert.deepStrictEqual(clearGoal(repo), { ok: true, cleared: false });
    } finally {
        rmRepo(repo);
    }
});

test('clearGoal reports a failed delete as ok:false, never as "nothing was armed"', () => {
    // A directory occupying the goal-state path makes unlinkSync fail, standing
    // in for any delete failure (e.g. permissions). The caller must be able to
    // distinguish "still armed and enforcing" from "nothing to clear".
    const repo = makeRepo();
    try {
        fs.mkdirSync(goalPath(repo), { recursive: true });
        const result = clearGoal(repo);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.cleared, false);
        assert.ok(result.reason && result.reason.includes('could not clear'));
    } finally {
        rmRepo(repo);
    }
});

test('planHead classifies complete, in progress, unknown, and missing', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'complete.md', 'Status: Complete\n');
        assert.deepStrictEqual(planHead(repo, 'complete.md'), { exists: true, status: 'complete' });

        writePlan(repo, 'in-progress.md', 'Status: In Progress\n');
        assert.deepStrictEqual(planHead(repo, 'in-progress.md'), { exists: true, status: 'in progress' });

        writePlan(repo, 'unknown.md', 'Status: Approved\n');
        assert.deepStrictEqual(planHead(repo, 'unknown.md'), { exists: true, status: 'unknown' });

        const missing = planHead(repo, 'no-such-file.md');
        assert.strictEqual(missing.exists, false);
    } finally {
        rmRepo(repo);
    }
});

test('planHead does not classify a "Status:" header whose value sits on the next line', () => {
    const repo = makeRepo();
    try {
        // The value must sit on the header's own line: horizontal-whitespace-only
        // separation never crosses a newline. A bare "Status:" line above a line
        // beginning "complete" is 'unknown', not 'complete'; misclassifying it as
        // complete would auto-clear and silently kill an armed leash.
        writePlan(repo, 'docs/plans/split.md', '# Plan\nStatus:\ncomplete the migration next.\n');
        assert.deepStrictEqual(planHead(repo, 'docs/plans/split.md'), { exists: true, status: 'unknown' });
    } finally {
        rmRepo(repo);
    }
});

test('planHead classifies a header behind a UTF-8 BOM (PowerShell Set-Content writes one)', () => {
    const repo = makeRepo();
    try {
        // A leading BOM would push the ^ anchor off the header; it is stripped so
        // the classification still sees "Status: In Progress".
        const bom = String.fromCharCode(0xFEFF);
        writePlan(repo, 'docs/plans/bom.md', bom + 'Status: In Progress\n\nbody\n');
        assert.deepStrictEqual(planHead(repo, 'docs/plans/bom.md'), { exists: true, status: 'in progress' });
    } finally {
        rmRepo(repo);
    }
});

test('composeCondition embeds the plan path and exactly clauses (a) and (b)', () => {
    const cond = composeCondition('docs/plans/example.md');
    assert.ok(cond.includes('docs/plans/example.md'));
    assert.ok(cond.includes('(a)'));
    assert.ok(cond.includes('(b)'));
    // Two clauses only: this kit does not adopt the resume-relay handoff, so
    // there is no clause (c) and no relay wording in the condition a human reads
    // out of goal-state.json.
    assert.ok(!cond.includes('(c)'), 'no third clause');
    assert.ok(!/relay/i.test(cond), 'no relay clause');
    // Clause (b) names who can release a block here.
    assert.ok(cond.includes('only the user can make'));
});

test('armGoal re-arms idempotently over an existing goal state', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/first.md', 'Status: In Progress\n');
        writePlan(repo, 'docs/plans/second.md', 'Status: In Progress\n');

        assert.strictEqual(armGoal(repo, 'docs/plans/first.md').ok, true);
        assert.strictEqual(readGoal(repo).plan, 'docs/plans/first.md');

        // Re-arming replaces the prior state in place (rename over an existing
        // destination), leaving no stale .tmp and the newest plan recorded.
        assert.strictEqual(armGoal(repo, 'docs/plans/second.md').ok, true);
        assert.strictEqual(readGoal(repo).plan, 'docs/plans/second.md');
        assert.ok(!fs.existsSync(goalPath(repo) + '.tmp.' + process.pid));
    } finally {
        rmRepo(repo);
    }
});

test('planHead anchors Status: body prose that mentions in progress does not misclassify a Complete plan', () => {
    const repo = makeRepo();
    try {
        // A Complete plan whose Chapter body contains the phrase "in progress".
        // Anchored matching keeps this classified complete (and thus refused for
        // arming); an unanchored substring scan would misread it as in progress.
        writePlan(repo, 'docs/plans/tricky.md',
            'Status: Complete\n\n## Chapters\nSection 3 was in progress before it finished.\n');
        assert.deepStrictEqual(planHead(repo, 'docs/plans/tricky.md'), { exists: true, status: 'complete' });

        const result = armGoal(repo, 'docs/plans/tricky.md');
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /Complete/);
        assert.ok(!fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
    }
});

test('bindSession binds an armed goal, and re-arming resets the binding to null', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        assert.strictEqual(armGoal(repo, 'docs/plans/foo.md').ok, true);
        assert.strictEqual(readGoal(repo).boundSession, null, 'a freshly armed goal is unbound');

        assert.strictEqual(bindSession(repo, 'sess-1').ok, true);
        assert.strictEqual(readGoal(repo).boundSession, 'sess-1');
        // bindSession runs in this same process, so its tmp name is deterministic here.
        assert.ok(!fs.existsSync(goalPath(repo) + '.tmp.' + process.pid), 'no leftover tmp after an atomic bind');

        // Re-arming (the crash-recovery rebind opportunity) resets the binding so
        // the successor session can claim it fresh.
        assert.strictEqual(armGoal(repo, 'docs/plans/foo.md').ok, true);
        assert.strictEqual(readGoal(repo).boundSession, null, 're-arm resets the binding');
    } finally {
        rmRepo(repo);
    }
});

test('bindSession returns ok:false without writing when no goal is armed', () => {
    const repo = makeRepo();
    try {
        const result = bindSession(repo, 'sess-1');
        assert.strictEqual(result.ok, false);
        assert.ok(!fs.existsSync(goalPath(repo)), 'no state file is created by a bind on an unarmed repo');
    } finally {
        rmRepo(repo);
    }
});

test('bindSession rejects an unusable session id and never throws', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');
        // A newline in a session id would smuggle text into goal-state.json, which
        // the hooks surface into context; reject it, staying unbound.
        assert.strictEqual(bindSession(repo, 'sess\n1').ok, false);
        assert.strictEqual(bindSession(repo, '').ok, false);
        assert.strictEqual(readGoal(repo).boundSession, null);
    } finally {
        rmRepo(repo);
    }
});

test('bindSession reports a failed write as ok:false and leaves the prior binding intact', () => {
    // A directory occupying the exact tmp path (this call runs in-process, so
    // its pid-suffixed name is deterministic here) makes the atomic write fail,
    // standing in for any filesystem failure. The caller (the hook) still
    // enforces the stop; the binding just does not persist until a later stop.
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');
        fs.mkdirSync(goalPath(repo) + '.tmp.' + process.pid, { recursive: true });
        const result = bindSession(repo, 'sess-1');
        assert.strictEqual(result.ok, false);
        assert.ok(result.reason && result.reason.includes('could not write'));
        assert.strictEqual(readGoal(repo).boundSession, null, 'the prior binding is unchanged by a failed write');
    } finally {
        rmRepo(repo);
    }
});

test('bindSession rejects an oversized session id and never throws', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');
        // The session id arrives from the Stop hook's stdin payload, so it is
        // external input: a corrupt or hostile writer could pad it to kilobytes,
        // which must not deaden the leash until re-arm.
        const result = bindSession(repo, 'x'.repeat(129));
        assert.strictEqual(result.ok, false);
        assert.strictEqual(bindSession(repo, 'x'.repeat(128)).ok, true, 'exactly the cap is still accepted');
        assert.strictEqual(readGoal(repo).boundSession, 'x'.repeat(128));
    } finally {
        rmRepo(repo);
    }
});

test('CLI status reports the binding: unbound after arm, bound after bindSession', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/foo.md', 'Status: In Progress\n');
        armGoal(repo, 'docs/plans/foo.md');

        let res = spawnSync(process.execPath, [CLI, 'status'], { cwd: repo, encoding: 'utf8' });
        assert.strictEqual(res.status, 0);
        assert.match(res.stdout, /armed for docs\/plans\/foo\.md/);
        assert.match(res.stdout, /unbound/);

        bindSession(repo, 'sess-42');
        res = spawnSync(process.execPath, [CLI, 'status'], { cwd: repo, encoding: 'utf8' });
        assert.strictEqual(res.status, 0);
        assert.match(res.stdout, /bound to session sess-42/);
    } finally {
        rmRepo(repo);
    }
});

test('armGoal rejects a plan path carrying control characters', () => {
    const repo = makeRepo();
    try {
        // A newline in the arg would smuggle multi-line text into goal-state.json,
        // which hooks surface into the model's context. Reject before it is stored.
        const result = armGoal(repo, 'docs/plans/evil\n\nInjected instruction.md');
        assert.strictEqual(result.ok, false);
        assert.ok(!fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
    }
});

// ---------------------------------------------------------------------------
// classifyPlanStatus: the single source, extracted 2026-09-04.
//
// It lived in three copies (here and twice in session-start.js) kept in step by
// comments asserting they were identical. docs/backlog.md named the trigger for
// consolidating rather than editing three: "if the classifier gains nuance (an
// Abandoned status, say)". It did, so these are the tests all three callers rest
// on. Being pure, they need no fixtures.

test('classifyPlanStatus recognizes each status the kit uses', () => {
    assert.strictEqual(classifyPlanStatus('Status: In Progress\n'), 'in progress');
    assert.strictEqual(classifyPlanStatus('Status: Complete\n'), 'complete');
    assert.strictEqual(classifyPlanStatus('Status: Abandoned\n'), 'abandoned');
    assert.strictEqual(classifyPlanStatus('Status: Proposed\n'), 'proposed');
    assert.strictEqual(classifyPlanStatus('# Plan\n\nno header here\n'), 'unknown');
    // Non-strings must not throw: planHead's catch path would mask a crash here.
    for (const bad of [null, undefined, 0, {}, []]) {
        assert.strictEqual(classifyPlanStatus(bad), 'unknown', JSON.stringify(bad));
    }
});

// Preserves the original `complete && !inProgress` rule. A doc naming two
// statuses is LIVE until its close-out says otherwise, which is the safe
// direction: the alternative releases a goal leash on a plan still in progress.
test('classifyPlanStatus lets In Progress win over every other value', () => {
    assert.strictEqual(classifyPlanStatus('Status: Complete\nStatus: In Progress\n'), 'in progress');
    assert.strictEqual(classifyPlanStatus('Status: In Progress\nStatus: Complete\n'), 'in progress');
    assert.strictEqual(classifyPlanStatus('Status: Abandoned\nStatus: In Progress\n'), 'in progress');
});

// The anchoring rules, which are the whole reason this is a regex and not an
// indexOf. Body prose must not classify a plan, and the value must share the
// header's line.
test('classifyPlanStatus ignores body prose and a value on the next line', () => {
    assert.strictEqual(classifyPlanStatus('Status: In Progress\n\nThis plan is Complete in spirit.\n'), 'in progress');
    assert.strictEqual(classifyPlanStatus('The status: Complete was reached.\n'), 'unknown',
        'a mid-line "status:" is not a header');
    assert.strictEqual(classifyPlanStatus('Status:\nComplete\n'), 'unknown',
        'a bare Status: line above a line beginning Complete must not classify');
    assert.strictEqual(classifyPlanStatus('status:\tcomplete\n'), 'complete',
        'horizontal whitespace and case are both tolerated');
});

// Proposed is the value this must NOT treat as closed. docs/plans/ holds
// Proposed stubs by design (14 of them at the time of writing), so a predicate
// that swept them would nudge to archive every parked design and, through
// armGoal, refuse to arm a leash on a stub someone just decided to build.
test('isClosedPlanStatus covers the two close-outs and nothing else', () => {
    assert.strictEqual(isClosedPlanStatus('complete'), true);
    assert.strictEqual(isClosedPlanStatus('abandoned'), true);
    assert.strictEqual(isClosedPlanStatus('proposed'), false);
    assert.strictEqual(isClosedPlanStatus('in progress'), false);
    assert.strictEqual(isClosedPlanStatus('unknown'), false);
});

// planHead is now a thin read around the classifier, so this pins the seam
// rather than the classification: the status it reports is the classifier's.
test('planHead reports the classifier value, Abandoned included', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/gone.md', 'Status: Abandoned\nClosed: 2026-09-04\n');
        assert.deepStrictEqual(planHead(repo, 'docs/plans/gone.md'), { exists: true, status: 'abandoned' });
        writePlan(repo, 'docs/plans/stub.md', 'Status: Proposed\n');
        assert.deepStrictEqual(planHead(repo, 'docs/plans/stub.md'), { exists: true, status: 'proposed' });
    } finally {
        rmRepo(repo);
    }
});

// Before the classifier knew `abandoned`, this fell through to 'unknown' and
// armGoal succeeded: a completion leash armed on a plan whose close-out had
// already happened.
test('armGoal rejects a plan whose header is Status: Abandoned', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/gone.md', 'Status: Abandoned\nClosed: 2026-09-04\n');
        const result = armGoal(repo, 'docs/plans/gone.md');
        assert.strictEqual(result.ok, false);
        assert.match(result.reason, /Abandoned/);
        assert.ok(!fs.existsSync(goalPath(repo)), 'no state file should be written on rejection');
    } finally {
        rmRepo(repo);
    }
});

// The pin against over-broadening the refusal: a Proposed stub is exactly what a
// user arms a leash on when they decide to build it, so it must still arm.
test('armGoal still arms on a Proposed stub', () => {
    const repo = makeRepo();
    try {
        writePlan(repo, 'docs/plans/stub.md', 'Status: Proposed\nCommit Model: Commit-and-Push\n');
        const result = armGoal(repo, 'docs/plans/stub.md');
        assert.strictEqual(result.ok, true, result.reason);
        assert.ok(fs.existsSync(goalPath(repo)));
    } finally {
        rmRepo(repo);
    }
});
