'use strict';

// Durable unit test for the two pure functions the accretion report rests on: the
// section parser, which lives in the shipped plugin payload because the take-stock
// SessionStart hook parses the same prose, and the ranker, which stays in the tool.
// Both fail silently (a wrong range is still a valid range, a wrong order is still
// an order) and everything the report says rests on them, so they earn a durable
// test (Node's built-in node:test, zero dependencies).
//
// The parser rule under test:
//   - a section starts at a "## " heading and runs through the line before the next
//     "## " heading, or to the last line for the final section;
//   - line numbers are 1-based and inclusive, matching git's convention;
//   - "## " inside a fenced code block is not a heading. The kit's prose quotes
//     markdown inside fences, so this is the case that separates 185 real sections
//     from the 197 lines that start with "## ".
//
// The ranker rule under test: product descending, an unknown product below every
// known one including a known zero, then line count, then path, then title.

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSections } = require('../plugins/claude-kit/hooks/accretion-lib.js');
const { rank } = require('./accretion.js');

// Build a document from an array of lines so every expected line number can be read
// straight off the array index (line N is lines[N - 1]).
function doc(lines) {
    return lines.join('\n') + '\n';
}

test('a normal multi-section document yields 1-based inclusive ranges', () => {
    const text = doc([
        '---',              // 1
        'name: example',    // 2
        '---',              // 3
        '',                 // 4
        'Preamble prose.',  // 5
        '',                 // 6
        '## First',         // 7
        'a',                // 8
        '',                 // 9
        '## Second',        // 10
        'b',                // 11
        'c',                // 12
        '',                 // 13
        '## Third',         // 14
        'd'                 // 15
    ]);
    assert.deepEqual(parseSections(text), [
        { title: 'First', start: 7, end: 9 },
        { title: 'Second', start: 10, end: 13 },
        { title: 'Third', start: 14, end: 15 }
    ]);
});

test('the last section runs to the last line, with or without a trailing newline', () => {
    const lines = ['## Only', 'a', 'b'];
    // A trailing newline does not add a line: git counts "a\n" as one line, and the
    // empty string after the final split must not become line 4.
    assert.deepEqual(parseSections(lines.join('\n') + '\n'), [{ title: 'Only', start: 1, end: 3 }]);
    assert.deepEqual(parseSections(lines.join('\n')), [{ title: 'Only', start: 1, end: 3 }]);
    // Trailing blank lines are real lines and do belong to the section.
    assert.deepEqual(parseSections(doc(['## Only', 'a', '', ''])), [{ title: 'Only', start: 1, end: 4 }]);
});

test('a heading on line 1 starts at line 1', () => {
    const text = doc([
        '## Top',   // 1
        'a',        // 2
        '## Next',  // 3
        'b'         // 4
    ]);
    assert.deepEqual(parseSections(text), [
        { title: 'Top', start: 1, end: 2 },
        { title: 'Next', start: 3, end: 4 }
    ]);
});

test('a "## " line inside a fenced code block is not a heading', () => {
    const text = doc([
        '## Real',              // 1
        'prose',                // 2
        '```markdown',          // 3
        '## Quoted example',    // 4
        'more quoted prose',    // 5
        '```',                  // 6
        'prose after the fence',// 7
        '## Also real',         // 8
        'tail'                  // 9
    ]);
    // Without fence tracking this would report three sections and would cut "Real"
    // short at line 3.
    assert.deepEqual(parseSections(text), [
        { title: 'Real', start: 1, end: 7 },
        { title: 'Also real', start: 8, end: 9 }
    ]);
});

test('fence variants are tracked: tilde fences, long fences, and indented fences', () => {
    const text = doc([
        '## Real',          // 1
        '~~~',              // 2
        '## tilde-fenced',  // 3
        '~~~',              // 4
        '````',             // 5
        '```',              // 6  (too short to close a 4-backtick fence)
        '## still fenced',  // 7
        '````',             // 8
        '   ```',           // 9  (indented up to 3 spaces is still a fence)
        '## indented fence',// 10
        '   ```',           // 11
        '## Second'         // 12
    ]);
    assert.deepEqual(parseSections(text), [
        { title: 'Real', start: 1, end: 11 },
        { title: 'Second', start: 12, end: 12 }
    ]);
});

test('an unterminated fence swallows the rest of the document', () => {
    // CommonMark: an unclosed fence runs to end of file. Anything else would let one
    // stray fence in one file invent sections for the whole tail.
    const text = doc([
        '## Real',      // 1
        '```',          // 2
        '## not a heading', // 3
        'x'             // 4
    ]);
    assert.deepEqual(parseSections(text), [{ title: 'Real', start: 1, end: 4 }]);
});

test('a document with no level-2 headings yields an empty list', () => {
    assert.deepEqual(parseSections(doc(['# Title', 'prose', '### deeper', 'more'])), []);
    assert.deepEqual(parseSections(''), []);
    assert.deepEqual(parseSections('no newline at all'), []);
});

test('only "## " starts a section: not "###", not a bare "##"', () => {
    const text = doc([
        '## Real',      // 1
        '### Sub',      // 2
        'a',            // 3
        '##NoSpace',    // 4
        '##',           // 5
        '## Second'     // 6
    ]);
    assert.deepEqual(parseSections(text), [
        { title: 'Real', start: 1, end: 5 },
        { title: 'Second', start: 6, end: 6 }
    ]);
});

test('the title is the heading text, trimmed, with the marker removed', () => {
    const text = doc(['##   Spaced out   ', 'a']);
    assert.deepEqual(parseSections(text), [{ title: 'Spaced out', start: 1, end: 2 }]);
});

test('CRLF line endings parse to the same 1-based ranges as LF', () => {
    // Asserted against literal ranges rather than against parseSections of the LF
    // form: comparing the function to itself still passes if a bug shifts both by
    // a line, which is the whole class of bug these ranges exist to catch.
    const lines = [
        '## First',     // 1
        'a',            // 2
        '',             // 3
        '## Second',    // 4
        'b'             // 5
    ];
    assert.deepEqual(parseSections(lines.join('\r\n') + '\r\n'), [
        { title: 'First', start: 1, end: 3 },
        { title: 'Second', start: 4, end: 5 }
    ]);
    // A trailing CR must not survive into the title either.
    assert.deepEqual(parseSections('## Title\r\nbody\r\n'), [{ title: 'Title', start: 1, end: 2 }]);
});

test('a non-string input yields an empty list rather than throwing', () => {
    assert.deepEqual(parseSections(null), []);
    assert.deepEqual(parseSections(undefined), []);
    assert.deepEqual(parseSections(42), []);
});

// Build a row the way collect() does, so the tests below pin rank against the
// shape it actually sorts rather than an invented one.
function row(displayPath, title, lines, commits) {
    return {
        displayPath,
        title,
        lines,
        commits,
        product: commits === null ? null : lines * commits
    };
}

test('rank orders by product descending, and an unknown product sorts below a known zero', () => {
    const rows = [
        row('a.md', 'unknown', 500, null),  // no product; 500 lines, so line count alone would put it first
        row('b.md', 'zero', 3, 0),          // product 0 is an answer, and outranks no answer
        row('c.md', 'small', 2, 2),         // 4
        row('d.md', 'big', 10, 10)          // 100
    ];
    assert.deepEqual(rank(rows).map((r) => r.title), ['big', 'small', 'zero', 'unknown']);
});

test('rank breaks a product tie on line count, then path, then title', () => {
    // Every product here is 12, so only the tiebreaks decide the order.
    const rows = [
        row('b.md', 'beta', 12, 1),
        row('a.md', 'alpha', 12, 1),
        row('a.md', 'aardvark', 12, 1),
        row('z.md', 'fewer lines', 6, 2)
    ];
    assert.deepEqual(rank(rows).map((r) => r.title), ['aardvark', 'alpha', 'beta', 'fewer lines']);
});

test('rank falls back to line count when no row has a commit count', () => {
    // The no-git report: every product is null, so the order must still be by size
    // rather than arbitrary.
    const rows = [
        row('a.md', 'short', 5, null),
        row('b.md', 'long', 50, null),
        row('c.md', 'middle', 20, null)
    ];
    assert.deepEqual(rank(rows).map((r) => r.title), ['long', 'middle', 'short']);
});

test('rank returns a new array and leaves its input order alone', () => {
    const rows = [row('a.md', 'small', 1, 1), row('b.md', 'big', 10, 10)];
    const ranked = rank(rows);
    assert.notEqual(ranked, rows);
    assert.deepEqual(rows.map((r) => r.title), ['small', 'big']);
    assert.deepEqual(ranked.map((r) => r.title), ['big', 'small']);
});
