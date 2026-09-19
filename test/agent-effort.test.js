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
// carry to any other operator's machine. Two facts measured on 2026-09-19 against
// client 2.1.278, and one the architecture doc already recorded, make a typo in
// this field indistinguishable from that absence, with nothing anywhere saying so:
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
// directory rather than a filesystem walk, following the git-scoped pattern both
// siblings use while differing from one of them on which git view:
// test/denaming.test.js:113 reads the INDEX with `git ls-files`, as this does,
// and test/corpus-agreement.test.js:38 reads the committed tree with
// `git ls-tree -r HEAD`. The index is the right view here because the plugin
// reaches an operator by clone, so tracked is exactly what ships, and a
// fourteenth agent becomes visible the moment it is staged, which is before it
// can be committed. An untracked agent file on disk is invisible to all of this,
// which is the accepted cost of that choice.
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
//   - WHETHER A FILE HERE IS AN AGENT AT ALL. Every tracked `.md` under the
//     directory is treated as a charter, so a README dropped in would be told to
//     declare an effort. The directory holds only charters today and the kit's
//     other two scope definitions treat it as flat.
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

// The recorded assignment, keyed by filename stem. Eleven seats at xhigh, one
// rung above the fleet's own default effort, and two at that default, pinned
// rather than inherited. The split is by FAILURE MODE and not by job title: ten
// of the eleven are gates, and the eleventh is implementer-fable, whose sections
// are the subtle cross-cutting correctness a review round is least reliable at
// catching, so its failure is not the loud kind the other two implementers' is.
// Counting it among "the gates" is the specific error this comment exists to
// prevent, since it erases the one reasoned exception in the table.
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
const DUPLICATE_KEY = '(more than one effort: key)';

function agentFiles() {
    const res = spawnSync('git', ['-C', REPO, 'ls-files', '-z', '--', AGENTS], { encoding: 'utf8' });
    assert.strictEqual(res.status, 0, 'git ls-files must succeed: this test defines its own scope');
    return res.stdout.split('\0').filter((f) => f.toLowerCase().endsWith('.md')).sort();
}

// Read the `effort:` value out of the frontmatter block ALONE. Every agent body
// discusses effort in prose, and a paragraph is not a declaration. A file listed
// by the index but missing from disk throws here, which names it and is loud.
function declaredEffort(rel) {
    // Strip CR before splitting: a Windows checkout with core.autocrlf=true would
    // otherwise fail `lines[0] !== '---'` and report every agent as frontmatter-less.
    const lines = fs.readFileSync(path.join(REPO, rel), 'utf8').replace(/\r/g, '').split('\n');
    if (lines[0] !== '---') return NO_FRONTMATTER;
    const end = lines.indexOf('---', 1);
    if (end === -1) return NO_FRONTMATTER;
    const hits = lines.slice(1, end).filter((l) => /^effort:/.test(l));
    // A second `effort:` line is its own defect and must not resolve to the first.
    // YAML takes the last or rejects the document; this regex would have taken the
    // first, so `effort: xhigh` followed by `effort: ultrahigh` would have read as
    // valid while shipping the typo.
    if (hits.length > 1) return DUPLICATE_KEY;
    if (hits.length === 0) return NO_KEY;
    return hits[0]
        .replace(/^effort:[ \t]*/, '')
        .replace(/\s+#.*$/, '')   // a legal trailing YAML comment is not part of the value
        .trim()
        .replace(/^["']|["']$/g, '');
}

// The stem is the map key everywhere below, and `path.basename` is case- and
// extension-sensitive in ways the discovery above deliberately is not, so it is
// computed in one place.
function stem(rel) {
    return path.basename(rel).replace(/\.md$/i, '');
}

function declared() {
    const out = {};
    for (const rel of agentFiles()) out[stem(rel)] = declaredEffort(rel);
    return out;
}

// Two files sharing a stem would let the second silently overwrite the first in
// that map and never be compared to anything. Discovery recurses, so
// `agents/legacy/qa-verifier.md` is reachable and would do exactly that.
function stemCollisions() {
    const seen = new Map();
    for (const rel of agentFiles()) {
        const key = stem(rel);
        seen.set(key, (seen.get(key) || []).concat(rel));
    }
    return [...seen.entries()].filter(([, files]) => files.length > 1);
}

// The frontmatter `name:` is what the client dispatches by; the stem is only what
// this file keys on. They agree across all thirteen today and nothing made them.
function declaredName(rel) {
    const text = fs.readFileSync(path.join(REPO, rel), 'utf8').replace(/\r/g, '');
    const lines = text.split('\n');
    if (lines[0] !== '---') return null;
    const end = lines.indexOf('---', 1);
    if (end === -1) return null;
    const hit = lines.slice(1, end).join('\n').match(/^name:[ \t]*(.*)$/m);
    return hit ? hit[1].trim().replace(/^["']|["']$/g, '') : null;
}

function report(findings, guidance) {
    return findings.length === 0 ? '' : `\n${findings.length} finding(s):\n  ${findings.join('\n  ')}\n\n${guidance}\n`;
}

// ---------------------------------------------------------------------------

test('every agent definition declares an effort level', () => {
    const findings = agentFiles()
        .map((rel) => [rel, declaredEffort(rel)])
        .filter(([, value]) => value === NO_KEY || value === NO_FRONTMATTER || value === DUPLICATE_KEY)
        .map(([rel, value]) => `${rel}: ${value}`);
    assert.strictEqual(findings.length, 0, report(findings,
        'An agent with no `effort:` key inherits the session\'s effort, which is a per-machine '
        + 'setting the kit does not ship. Add the key on its own line after `description:`, and add '
        + 'the same value to ASSIGNMENT above. The spec\'s assignment rule decides which value, and '
        + 'it turns on how the seat FAILS rather than on what it is called: a seat whose failure is '
        + 'silent, because nothing downstream re-asks the question, runs one rung above the model '
        + 'default at `xhigh`; a seat whose failure is loud, because a build, a test run or a review '
        + 'round already catches it, runs at that default and never below it. implementer-fable sits '
        + 'in the first group despite being an implementer, for the reason beside ASSIGNMENT above.'));
});

test('every declared effort is one of the five named levels', () => {
    const findings = agentFiles()
        .map((rel) => [rel, declaredEffort(rel)])
        .filter(([, value]) => ![NO_KEY, NO_FRONTMATTER, DUPLICATE_KEY].includes(value) && !LEVELS.includes(value))
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

// A positive control on the discovery itself. The first two checks above iterate
// what discovery returns and would pass vacuously on an empty set; the third
// would not, since deepStrictEqual against a populated ASSIGNMENT fails loudly on
// `{}`. So this covers tests 1 and 2, which is narrower than "all of them" and is
// the honest claim. Against test 3 it is otherwise redundant, since that
// deepStrictEqual already fails on any key-set difference in either direction.
// What it buys is a failure message that names the DISCOVERY rather than the
// assignment, which is the difference a reader needs between "the table is wrong"
// and "the check has stopped seeing files".
test('discovery selects exactly the recorded agent inventory', () => {
    const found = agentFiles().map(stem).sort();
    assert.deepStrictEqual(found, Object.keys(ASSIGNMENT).sort(),
        `discovery under ${AGENTS}/ returned a different set of agents than ASSIGNMENT records. `
        + 'If an agent was added or removed, update the table. If the names match what you expect, '
        + 'the discovery itself has stopped selecting a file, and the two checks above are now '
        + 'vacuous for it.');
});

// Two files, one stem. Not reachable through the check above, which compares sets.
test('no two agent files share a stem', () => {
    const findings = stemCollisions().map(([key, files]) => `${key}: ${files.join(', ')}`);
    assert.strictEqual(findings.length, 0, report(findings,
        'The stem is this file\'s map key, so a second file at the same stem overwrites the first '
        + 'and its effort is never compared to anything. Rename one, or remove it.'));
});

// The client dispatches by the frontmatter `name:`, not by the filename. They
// agree across all thirteen and nothing enforced that until now, so a file
// renamed without its `name:` would pin an effort onto an agent type that no
// longer exists, and a `name:` changed without the file would do the reverse.
test('each agent\'s frontmatter name matches its filename', () => {
    const findings = agentFiles()
        .map((rel) => [rel, declaredName(rel)])
        .filter(([rel, name]) => name !== stem(rel))
        .map(([rel, name]) => `${rel}: name is ${JSON.stringify(name)}`);
    assert.strictEqual(findings.length, 0, report(findings,
        'This file keys its assignment by filename while the client dispatches by `name:`. When '
        + 'they disagree, the pinned effort belongs to an agent type nothing dispatches. Make the '
        + 'two agree rather than relaxing this check.'));
});
