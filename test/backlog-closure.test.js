// docs/backlog.md's two mechanical invariants, which nothing checked before.
//
// A kaizen note on 2026-09-04 recorded the failure these pin: an item's title
// asserted an action ("Extract a shared plan-status helper") while its body made
// the work conditional, and a reader triaging a 20-item file by title mis-sized
// it. The title half of that fix is a wording convention no test can reach. The
// half that can be reached is narrower and turned out to select the same items:
// of sixteen active items, the only two carrying no statement of how they close
// were the same two whose titles the note implicated. A missing closure clause is
// the machine-checkable shadow of a title that mis-sizes its work.
//
// Both invariants are asserted over the Active section only. Archived snapshots
// live in docs/archive/ and are closed by construction.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const BACKLOG = path.join(__dirname, '..', 'docs', 'backlog.md');

// A top-level item opens at column zero with `- **`; continuation lines and
// nested sub-bullets are indented, so splitting on that anchor keeps a
// multi-paragraph item whole. Same shape the kaizen note-counting rule uses.
function activeItems() {
    const text = fs.readFileSync(BACKLOG, 'utf8');
    const afterHeading = text.split('## Active');
    assert.strictEqual(afterHeading.length, 2, 'docs/backlog.md must have exactly one "## Active" heading');
    const active = afterHeading[1].split('## Snapshots')[0];
    return active
        .split(/\n(?=- \*\*)/)
        .filter((chunk) => chunk.trimStart().startsWith('- **'));
}

// The parse itself is asserted, not just its output. A regex change that made
// activeItems() return nothing would otherwise pass every check below by
// vacuous truth, which is how a guard silently stops guarding.
test('the Active section parses into a plausible number of items', () => {
    const items = activeItems();
    assert.ok(items.length >= 5, `expected at least 5 active items, parsed ${items.length}`);
    assert.ok(items.length <= 60, `parsed ${items.length} active items, which suggests the split anchor is matching continuation lines`);
});

test('every active item states how it closes', () => {
    // "Closes by", "closes when", "closes on", and "closes it" (used by items
    // whose closure is a clause about retiring the thing they track).
    const closure = /clos(?:es|e|ing|ed)\s+(?:by|when|on)|closes\s+it/i;
    const missing = activeItems()
        .filter((item) => !closure.test(item))
        .map((item) => (item.match(/- \*\*(.+?)\*\*/s) || [, item.slice(0, 60)])[1].replace(/\s+/g, ' ').slice(0, 70));
    assert.deepStrictEqual(missing, [], `active items with no closure clause:\n  ${missing.join('\n  ')}`);
});

test('every active item title carries a trailing dated parenthetical', () => {
    const undated = activeItems()
        .map((item) => (item.match(/- \*\*(.+?)\*\*/s) || [, ''])[1].replace(/\s+/g, ' ').trim())
        .filter((title) => !/\(20\d\d-\d\d-\d\d[^)]*\)\.?$/.test(title))
        .map((title) => title.slice(0, 70));
    assert.deepStrictEqual(undated, [], `active items whose title has no trailing date:\n  ${undated.join('\n  ')}`);
});
