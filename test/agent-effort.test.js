// Mechanical enforcement of the agent effort assignment.
//
// THE INVARIANT. Every agent definition tracked under plugins/claude-kit/agents/
// declares an `effort:` level in its frontmatter; that level is one of the five
// the client's schema names (low | medium | high | xhigh | max); and it is the
// level this file records for that agent. The assignment and the rule that
// produced it - effort follows the failure mode, not the model, so a seat whose
// failure is silent runs one rung above the model's own default and a seat whose
// failure is loud runs at that default and never below it - are in
// docs/plans/agent-effort-dials_spec_v1.md.
//
// WHY THIS FILE EXISTS. Absent, the key means "inherit the session's effort",
// which is a per-machine setting the kit does not ship, cannot read, and does not
// carry to any other operator's machine. Three facts measured on 2026-09-19
// against client 2.1.278 make a typo in this field indistinguishable from that
// absence, with nothing anywhere saying so:
//
//   - An agent declaring `effort: ultrahigh` LOADS WITHOUT ERROR, dispatches
//     without error, and runs at the inherited effort. The invalid level is
//     silently ignored and the run reports green either way.
//   - `claude plugin validate`, the kit's only shipped frontmatter gate, accepted
//     `zzzbogus: nonsense` in an agent's frontmatter exactly as readily as it
//     accepted `effort: high`, both passing with only the pre-existing no-version
//     warning. It validates the manifest, not the agent files.
//   - docs/architecture.md:9 already records the general case: a new agent charter
//     "fires no hook at runtime and is pinned by nothing in `test/`".
//
// So a mistyped level degrades silently to a missing one, and a missing one
// degrades silently to whatever the machine happens to be set to. That is the
// defect this file catches.
//
// DISCOVERY IS BY THE TRACKED DIRECTORY, NEVER BY A LIST, which is the design
// decision to read before editing anything below. A hard-coded list of the
// thirteen agents would pass a fourteenth silently, which is the same
// silent-absence failure in a new place. Scope is `git ls-files` over the
// directory rather than a filesystem walk, matching test/denaming.test.js and
// test/corpus-agreement.test.js: the plugin reaches an operator by clone, so
// tracked is exactly what ships, and a fourteenth agent becomes visible here the
// moment it is staged, which is before it can be committed.
//
// DELIBERATELY NOT COVERED. Four gaps, each real rather than a hedge:
//
//   - WHAT IS ACTUALLY RUNNING. Hooks, agents and skills load from the installed
//     plugin cache and not from this checkout (docs/architecture.md:13). A green
//     run here says the definitions on disk are right; it says nothing about the
//     agents a session is dispatching until `/plugin update claude-kit`.
//   - THE RESOLVED LEVEL. This reads a declared field and observes no dispatch,
//     and the spec's own standing rule is that a declared key is not a measured
//     one. Two documented paths move the resolved level off the declaration:
//     `maxEffortLevel` caps every effort setting including an agent's
//     frontmatter, and a level the selected model does not support falls back to
//     `high` rather than to the next rung down. Chapter 1 measured resolution by
//     probe. Nothing mechanical does.
//   - THE KEY IS THE FILENAME STEM, while the client identifies an agent by its
//     `name:` field. All thirteen agree today and nothing here asserts they must,
//     so a file renamed without its `name:` would pin an effort onto an agent
//     type that no longer exists.
//   - WHETHER THE ASSIGNMENT IS RIGHT. The table below is a record of a decision,
//     not a defense of one, and the spec carries an open question on the two
//     implementer seats. Changing a value is meant to cost a second file edit;
//     that is the point. Do not read a green run as evidence the levels are good.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const AGENTS = 'plugins/claude-kit/agents';

// The five named levels the client's agent-definition schema accepts. The schema
// also accepts a bare integer; this kit does not use one, and any integer would
// fail the assignment check below in any case.
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

// The recorded assignment, keyed by filename stem. Eleven gates at xhigh, one
// rung above the fleet's own default effort; the two plan-following implementer
// seats at that default, pinned rather than inherited.
const ASSIGNMENT = {
    'adversarial-reviewer': 'xhigh',
    'blind-reader': 'xhigh',
    'blind-reviewer': 'xhigh',
    'council-member': 'xhigh',
    'design-facilitator': 'xhigh',
    'docs-curator': 'xhigh',
    'implementer-fable': 'xhigh',
    'implementer-opus': 'high',
    'implementer-sonnet': 'high',
    'pr-reviewer': 'xhigh',
    'prose-reviewer': 'xhigh',
    'qa-verifier': 'xhigh',
    'security-reviewer': 'xhigh',
};

const NO_KEY = '(no effort: key)';
const NO_FRONTMATTER = '(no frontmatter block)';

function agentFiles() {
    const res = spawnSync('git', ['-C', REPO, 'ls-files', '-z', '--', AGENTS], { encoding: 'utf8' });
    assert.strictEqual(res.status, 0, 'git ls-files must succeed: this test defines its own scope');
    return res.stdout.split('\0').filter((f) => f.endsWith('.md')).sort();
}

// Read the `effort:` value out of the frontmatter block ALONE. Every agent body
// discusses effort in prose, and a paragraph is not a declaration. A file listed
// by the index but missing from disk throws here, which names it and is loud.
function declaredEffort(rel) {
    const lines = fs.readFileSync(path.join(REPO, rel), 'utf8').split('\n');
    if (lines[0] !== '---') return NO_FRONTMATTER;
    const end = lines.indexOf('---', 1);
    if (end === -1) return NO_FRONTMATTER;
    const hit = lines.slice(1, end).join('\n').match(/^effort:[ \t]*(.*)$/m);
    if (!hit) return NO_KEY;
    return hit[1].trim().replace(/^["']|["']$/g, '');
}

function declared() {
    const out = {};
    for (const rel of agentFiles()) out[path.basename(rel, '.md')] = declaredEffort(rel);
    return out;
}

function report(findings, guidance) {
    return findings.length === 0 ? '' : `\n${findings.length} finding(s):\n  ${findings.join('\n  ')}\n\n${guidance}\n`;
}

// ---------------------------------------------------------------------------

test('every agent definition declares an effort level', () => {
    const findings = agentFiles()
        .map((rel) => [rel, declaredEffort(rel)])
        .filter(([, value]) => value === NO_KEY || value === NO_FRONTMATTER)
        .map(([rel, value]) => `${rel}: ${value}`);
    assert.strictEqual(findings.length, 0, report(findings,
        'An agent with no `effort:` key inherits the session\'s effort, which is a per-machine '
        + 'setting the kit does not ship. Add the key on its own line after `description:`, and add '
        + 'the same value to ASSIGNMENT above. The spec\'s assignment rule decides which value: a '
        + 'seat whose failure is silent runs at `xhigh`, a plan-following seat at the model default.'));
});

test('every declared effort is one of the five named levels', () => {
    const findings = agentFiles()
        .map((rel) => [rel, declaredEffort(rel)])
        .filter(([, value]) => value !== NO_KEY && value !== NO_FRONTMATTER && !LEVELS.includes(value))
        .map(([rel, value]) => `${rel}: ${JSON.stringify(value)}`);
    assert.strictEqual(findings.length, 0, report(findings,
        `The client accepts only ${LEVELS.join(' | ')}. Anything else is ignored in silence: an agent `
        + 'declaring `effort: ultrahigh` loads, dispatches, and runs at the inherited effort with no '
        + 'error anywhere. Fix the spelling rather than widening LEVELS.'));
});

test('the declared efforts match the assignment this test records', () => {
    // One comparison, both directions. A changed value, an agent added without a
    // recorded level, and a recorded level whose agent is gone all land here, so
    // moving an agent's effort stays a deliberate two-file edit.
    assert.deepStrictEqual(declared(), ASSIGNMENT,
        `The definitions under ${AGENTS}/ and the ASSIGNMENT table above disagree. If the change to `
        + 'the agent file was intended, record it here and in the spec\'s Approach table, which is the '
        + 'authority. If it was not, the agent file is the thing to fix.');
});

// A positive control on the discovery itself. Every check above iterates what the
// glob returns, so a glob that matched nothing would pass all of them vacuously,
// which is how a guard like this dies: not by being deleted, but by quietly
// selecting an empty set.
test('the discovery finds the whole agent inventory', () => {
    const files = agentFiles();
    const expected = Object.keys(ASSIGNMENT).length;
    assert.ok(files.length >= expected,
        `discovery returned ${files.length} file(s) under ${AGENTS}/, fewer than the ${expected} `
        + 'recorded in ASSIGNMENT. Either agents were removed without updating the table, or the '
        + 'discovery itself has stopped selecting them and every check in this file is now vacuous.');
});
