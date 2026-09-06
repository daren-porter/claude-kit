// The adoption ledger's currency contract, enforced.
//
// docs/kit-adoptions.md carries a stated contract in its own prose: "Each entry
// carries: capability, verdict, the date and sha the verdict was made at". Nothing
// checked it, and docs/backlog.md carried "The adoption ledger's currency contract
// does not exist, and a reader cannot bound any entry's age" from 2026-08-31.
//
// WHAT MADE IT WORTH A TEST RATHER THAN A CONVENTION. Checking the item's seven
// counts found two already fixed by a commit landing the SAME DAY the item was
// written, one where the header was correct and only unexplained, and three live.
// A convention that drifts inside a day, and an item that goes stale inside a day,
// are the same problem: nothing was reading either.
//
// The invariant these pin is the file's own, discovered by measurement rather than
// invented: index rows and detail sections carry the IDENTICAL verdict string. It
// held 31 of 31 before this pass and was broken to 25 of 31 by dating index rows
// alone, which is what surfaced it as an invariant worth keeping.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const LEDGER = path.join(__dirname, '..', 'docs', 'kit-adoptions.md');
const lines = () => fs.readFileSync(LEDGER, 'utf8').split('\n');

const PASS_RE = /^### (?:Pass of|Pending-queue working session,) (\d{4}-\d{2}-\d{2})/;
const INDEX_RE = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*\*\*(.+?)\*\*\s*\|$/;
const HEAD_RE = /^#### (\d{4}-\d{2}-\d{2}) candidate (\d+):/;
const VERDICT_RE = /\*\*Verdict:\s*(.+?)\*\*/;

// Numbered candidates only. Sub-lists nested inside a pass use ##### and are
// deliberately unnumbered per the file's own "Editing this file" convention, so
// they carry no index number to pair against.
function candidates() {
    const L = lines();
    const index = new Map();
    const detail = new Map();
    let pass = null;
    for (let i = 0; i < L.length; i++) {
        const p = PASS_RE.exec(L[i]);
        if (p) { pass = p[1]; continue; }
        const m = INDEX_RE.exec(L[i]);
        if (m && pass) index.set(`${pass}|${m[1]}`, { verdict: m[3], capability: m[2], line: i + 1 });
        const h = HEAD_RE.exec(L[i]);
        if (h) {
            for (let j = i + 1; j < Math.min(i + 6, L.length); j++) {
                const v = VERDICT_RE.exec(L[j]);
                if (v) { detail.set(`${h[1]}|${h[2]}`, { verdict: v[1], line: j + 1 }); break; }
            }
        }
    }
    return { index, detail };
}

test('the ledger holds numbered candidates to read at all', () => {
    const { index } = candidates();
    assert.ok(index.size >= 25, `parsed only ${index.size} index rows: the parser or the file shape moved`);
});

// The load-bearing one. A verdict stated twice can disagree with itself, and this
// file is read by a future pass deciding whether work is settled: an index saying
// pending against a detail saying rejected sends that pass to re-adjudicate.
test('every candidate index row and its detail section carry the identical verdict', () => {
    const { index, detail } = candidates();
    const bad = [];
    for (const [key, row] of index) {
        const d = detail.get(key);
        if (!d) { bad.push(`${key}: index row has no #### detail section (${row.capability.slice(0, 40)})`); continue; }
        if (d.verdict !== row.verdict) {
            bad.push(`${key}: index line ${row.line} "${row.verdict}" != detail line ${d.line} "${d.verdict}"`);
        }
    }
    assert.strictEqual(bad.length, 0, '\n  ' + bad.join('\n  '));
});

// The contract the backlog item was named for: a reader must be able to bound an
// entry's age. `pending` is exempt and deliberately so - it means "not yet
// adjudicated", so there is no decision date to carry, and the file's own header
// section says pending still counts as a verdict for watermark purposes.
test('every settled verdict carries the date it was decided', () => {
    const { index } = candidates();
    const undated = [];
    for (const [key, row] of index) {
        if (/^pending\b/.test(row.verdict)) continue;
        if (!/\d{4}-\d{2}-\d{2}/.test(row.verdict)) undated.push(`${key} line ${row.line}: "${row.verdict}"`);
    }
    assert.strictEqual(undated.length, 0,
        'a settled verdict with no date cannot be aged by a reader:\n  ' + undated.join('\n  '));
});

// Every table in the file, because a body that bursts its cell is how candidates
// 2 through 21 once rendered as one run-on paragraph (fixed by d9ee478, and the
// "never a table carrying the reasoning in its cells" convention exists because of
// it). A column-count drift is the mechanical shadow of that failure.
test('every markdown table in the ledger has consistent column counts', () => {
    const L = lines();
    const cols = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').length;
    const bad = [];
    let i = 0, tables = 0;
    while (i < L.length) {
        if (/^\s*\|/.test(L[i]) && i + 1 < L.length && /^\s*\|[\s:|-]+\|?\s*$/.test(L[i + 1])) {
            const header = cols(L[i]);
            const at = i + 1;
            tables++;
            let j = i + 2;
            while (j < L.length && /^\s*\|/.test(L[j])) {
                if (cols(L[j]) !== header) bad.push(`table at line ${at}: row ${j + 1} has ${cols(L[j])} cols, header has ${header}`);
                j++;
            }
            i = j;
        } else i++;
    }
    assert.ok(tables >= 5, `found only ${tables} tables; the parser or the file shape moved`);
    assert.strictEqual(bad.length, 0, '\n  ' + bad.join('\n  '));
});
