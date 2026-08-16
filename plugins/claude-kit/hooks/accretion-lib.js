// Shared markdown section parser for the kit's prose.
//
// It lives here, in the shipped plugin payload, rather than in tools/, because
// two callers need it and only one of them ships: take-stock-nudge.js is a hook
// every kit user installs, while tools/accretion.js is a maintainer script that
// is never packaged. So the shared code sits in the payload and the tool
// requires inward to it; the reverse direction would ship a hook depending on a
// file its users do not have. session-start.js requires memory-lib.js the same
// way.
//
// Pure and import-free: no I/O, no dependencies, nothing to fail at load.

'use strict';

// Parse a markdown document into its level-2 sections. Pure: no I/O, no throwing.
// Returns [{ title, start, end }] with 1-based inclusive line numbers, in document
// order; [] for a document with no level-2 headings.
//
// A section runs from its "## " heading through the line before the next "## "
// heading, or to the last line for the final section. Lines before the first
// heading belong to no section. Fenced code blocks are skipped wholesale, so a
// "## " line quoted inside a fence is not a heading; this is the one subtle rule
// here and the reason this function carries a durable unit test.
function parseSections(text) {
    const sections = [];
    if (typeof text !== 'string' || text.length === 0) return sections;

    const lines = text.split(/\r?\n/);
    // A trailing newline leaves a final empty element that is not a line in git's
    // numbering; drop it so end line numbers match git's.
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    // Fence state: the marker character and its run length, per CommonMark, where a
    // fence may be indented up to three spaces and its closer must use the same
    // character and be at least as long.
    let fenceChar = null;
    let fenceLen = 0;
    let current = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);

        if (fenceChar === null) {
            if (fence) {
                fenceChar = fence[1][0];
                fenceLen = fence[1].length;
                continue;
            }
        } else {
            // Inside a fence. Only a bare run of the same character, at least as
            // long as the opener, closes it; an opener's info string ("```js") on
            // such a line would make it a nested opener, not a closer.
            if (fence && fence[1][0] === fenceChar && fence[1].length >= fenceLen
                && /^ {0,3}[`~]+[ \t]*$/.test(line)) {
                fenceChar = null;
                fenceLen = 0;
            }
            // An unterminated fence runs to end of file, so every remaining line is
            // code and no heading can start inside one.
            continue;
        }

        if (/^## /.test(line)) {
            if (current) {
                // i is the 0-based index of this heading, which is the 1-based
                // number of the line before it: where the previous section ends.
                current.end = i;
                sections.push(current);
            }
            current = { title: line.slice(3).trim(), start: i + 1, end: lines.length };
        }
    }
    if (current) {
        current.end = lines.length;
        sections.push(current);
    }
    return sections;
}

module.exports = { parseSections };
