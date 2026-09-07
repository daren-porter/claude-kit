// The trusted-channel inventory in docs/security-model.md, enforced.
//
// That document is not written for its author: docs/architecture.md says the
// generalized `security-reviewer` agent "reads it first", so it is loaded in every
// session a security review runs. Its trusted-channel table is the list a reviewer
// audits kit-text-to-model doors against, and an emitter missing from it is a door
// nobody checks.
//
// WHY A TEST. The table went stale within hours on 2026-09-06: node-probe.sh was
// added that morning, emits additionalContext, and was not in the table. The gap
// was introduced by the same session that later found it, which is the same shape
// as instance 10 in plans/enumerations-stop-short_spec_v1.md - an author adding a
// file and not touching the enumeration that names them.
//
// SCOPE, stated because this test is narrower than the table. It checks the
// EMITTER side only: every payload file that can put text on a trusted channel
// must appear in the "Written by" column. It says nothing about whether a row's
// sanitization description is true, which is a reading task and stays one.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const DOC = path.join(REPO, 'docs', 'security-model.md');
const HOOKS = path.join(REPO, 'plugins', 'claude-kit', 'hooks');

// The table runs from its header to the first blank line after it.
function tableRows() {
    const lines = fs.readFileSync(DOC, 'utf8').split('\n');
    const start = lines.findIndex((l) => /^\| Surface \| Written by \|/.test(l));
    assert.notStrictEqual(start, -1, 'the trusted-channel table header moved or was renamed');
    const rows = [];
    for (let i = start + 1; i < lines.length && lines[i].startsWith('|'); i++) {
        if (/^\|[\s:|-]+\|?\s*$/.test(lines[i])) continue;
        rows.push(lines[i]);
    }
    return rows;
}

// Column 2 only. usage-lib.js appears in a row's THIRD column as the source of a
// formatting helper and a validator, and is not an emitter; a whole-row grep
// counts it and gets the wrong answer.
function documentedEmitters() {
    const names = new Set();
    for (const row of tableRows()) {
        const col = row.split('|')[2] || '';
        for (const m of col.matchAll(/`([a-z0-9-]+\.(?:js|sh))`/g)) names.add(m[1]);
    }
    return names;
}

// A payload file that can put text on a trusted channel. Keyed on the mechanisms
// the table itself enumerates, so a new mechanism is out of scope by construction
// and this test does not silently claim to cover one.
function actualEmitters() {
    const found = new Set();
    for (const f of fs.readdirSync(HOOKS)) {
        if (!/\.(js|sh)$/.test(f)) continue;
        const src = fs.readFileSync(path.join(HOOKS, f), 'utf8');
        if (/additionalContext|permissionDecisionReason/.test(src)) found.add(f);
    }
    return found;
}

test('the trusted-channel table parses and is not empty', () => {
    const rows = tableRows();
    assert.ok(rows.length >= 8, `parsed ${rows.length} rows: the table shape moved`);
    assert.ok(documentedEmitters().size >= 10, 'the Written-by column parsed almost nothing');
});

// The load-bearing one. A file that speaks to the model and is absent from this
// table is a door the reviewer this document is written for will not audit.
test('every payload file that emits on a trusted channel is named in the table', () => {
    const documented = documentedEmitters();
    const missing = [...actualEmitters()].filter((f) => !documented.has(f)).sort();
    assert.deepStrictEqual(missing, [],
        'emits additionalContext or permissionDecisionReason but is absent from '
        + 'docs/security-model.md\'s trusted-channel table, so nothing tells a reviewer to audit it');
});

// The counting unit the document now states, pinned so the stated numbers cannot
// drift from the table they describe. Rows and emitters move independently: the
// three deny-by-stderr guards share one row, so the two counts are not the same
// number and a reviewer needs both.
test('the stated row and emitter counts match the table', () => {
    const doc = fs.readFileSync(DOC, 'utf8');
    const rows = tableRows().length;
    const emitters = documentedEmitters().size;

    const WORDS = { nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14 };
    const surfaces = /\*\*([A-Z][a-z]+) surfaces carry kit text to the model/.exec(doc);
    assert.ok(surfaces, 'the surfaces count sentence moved');
    assert.strictEqual(WORDS[surfaces[1].toLowerCase()], rows,
        `prose says ${surfaces[1]} surfaces, the table has ${rows} rows`);

    const named = /name \*\*([a-z]+)\*\* emitting files/.exec(doc);
    assert.ok(named, 'the emitting-files count sentence moved');
    assert.strictEqual(WORDS[named[1]], emitters,
        `prose says ${named[1]} emitting files, the Written-by column names ${emitters}`);
});


// THE SANITIZER LEDGER, pinned for the same reason the table above is: the doc's
// paragraph on it has been wrong twice. Version one gave the count three ways at
// once; version two claimed seven files and three caps with no counting rule, and
// a blind-reader on 2026-09-07 could reach eight filenames or six but never seven,
// and reported the missing baseline as the first step it could not perform.
//
// The rule the doc now states: a LEDGER file defines a door on an EMISSION path,
// meaning a value entering a hook output field the harness carries to the model.
// Doors on a CLI's own stdout and on a write path are out of scope, because a CLI's
// output reaches the model as a tool result rather than through a hook field.
//
// This census is deliberately dumb. It counts sites of the one idiom the ledger
// tracks and asserts the per-file map, so ANY new door anywhere fails and the author
// has to decide which side of the rule it falls on and say so here. That is the
// property version two lacked: its number could drift silently in either direction.

const DOOR_IDIOM = 'replace(/[^\\x20-\\x7E';

// Files whose doors are deliberately NOT ledger files, with the reason each is out
// of scope. A door added to one of these still fails the census below, which is the
// point: the exemption is per site, not a blanket pass for the file.
const OUT_OF_SCOPE = {
    'kit-goal.js': 'door on the CLI\'s own stdout, which reaches the model as a tool result',
    'usage.js': 'door on the CLI\'s own stdout, same reason',
    'memory.js': 'write-path normalizer, and the one door that preserves \\n and \\t',
};

const DOOR_CENSUS = {
    'docs-write-guard.js': 1,
    'kit-goal-stop.js': 1,
    'kit-goal.js': 1,
    'memory-lib.js': 1,
    'memory.js': 1,
    'session-start.js': 4,
    'stop-docs-hygiene.js': 2,
    'usage-autocontinue-nudge.js': 1,
    'usage.js': 1,
    'usage-lib.js': 1,
};

function doorCensus() {
    const out = {};
    for (const f of fs.readdirSync(HOOKS)) {
        if (!f.endsWith('.js')) continue;
        const body = fs.readFileSync(path.join(HOOKS, f), 'utf8');
        let n = 0, at = 0;
        for (;;) {
            const i = body.indexOf(DOOR_IDIOM, at);
            if (i === -1) break;
            n++; at = i + 1;
        }
        if (n) out[f] = n;
    }
    return out;
}

test('the sanitizer door census matches, so a new door cannot appear unnoticed', () => {
    const found = doorCensus();
    assert.ok(Object.keys(found).length >= 5,
        `census found ${Object.keys(found).length} files with a door; the scan is probably broken`);
    assert.deepStrictEqual(found, DOOR_CENSUS);
});

test('the ledger files are exactly the census minus the out-of-scope ones', () => {
    const ledger = Object.keys(doorCensus())
        .filter((f) => !Object.prototype.hasOwnProperty.call(OUT_OF_SCOPE, f))
        .sort();
    assert.strictEqual(ledger.length, 7,
        `the doc says seven ledger files; the rule yields ${ledger.length}: ${ledger.join(', ')}`);
    const doc = fs.readFileSync(DOC, 'utf8');
    assert.match(doc, /five BEHAVIORS across seven files/,
        'the doc states a count this test can check');
    for (const f of ledger) {
        assert.ok(doc.includes('`' + f + '`'), `ledger file ${f} is not named in the document`);
    }
});

test('the three fixed caps in the delete-and-truncate family are the ones stated', () => {
    const doc = fs.readFileSync(DOC, 'utf8');
    for (const cap of ['120', '160', '300']) {
        assert.ok(doc.includes('at ' + cap),
            `the doc no longer states the ${cap} cap`);
    }
});
