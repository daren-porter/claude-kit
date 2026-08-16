// Tests for plugins/claude-kit/hooks/take-stock-nudge.js (the SessionStart
// take-stock trigger).
//
// Node's built-in test runner, no framework, the branch-reaper-nudge.test.js
// harness: the hook is spawned as a real child process, fed a SessionStart
// payload on stdin, and asserted on by its stdout - a nudge emits one
// {"hookSpecificOutput":{additionalContext}} object, silence emits nothing. Each
// case builds a fresh temp repo holding a miniature kit tree (the plugin manifest
// the hook gates on, plus a prose corpus of six sections over three files), all
// cleaned up in finally blocks. No network, and nothing reads the real repo.
//
// The five conditions of the hook's contract are pinned here: not a kit repo, git
// unavailable or failing, nothing patched since the marker, one or more sections
// patched since the marker, and no take-stock ever recorded. Three of the eight
// cases below expect a block and five expect silence, so a regression in either
// direction - a hook that went mute, or one that spoke at every session start in
// every repo - fails here.
//
// A block carries a count and no ranking. That is a contract and not an omission,
// so the two block cases assert the absence of ranked rows as well as the presence
// of the count: a hook that started naming sections would be spending a per-section
// `git log -L` sweep at every session start, and would fail here.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync, execSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'take-stock-nudge.js');

function makeDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmDir(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

function git(cwd, args) {
    return execSync('git ' + args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function write(dir, rel, text) {
    const full = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
}

// The prose corpus every fixture starts from: six level-2 sections over three
// files, two of the corpus glob shapes (a skill's SKILL.md, an agent). Six
// sections and three files, rather than one section per file, so that a count of
// patched sections and a count of patched files are different numbers and the
// assertions below can tell them apart.
function writeCorpus(dir) {
    write(dir, 'plugins/claude-kit/.claude-plugin/plugin.json', '{ "name": "claude-kit" }\n');
    write(dir, 'plugins/claude-kit/skills/alpha/SKILL.md', [
        '---',              // 1
        'name: alpha',      // 2
        '---',              // 3
        '',                 // 4
        '## A1',            // 5   A1: 5-11, 7 lines
        'a', 'a', 'a', 'a', 'a',
        '',                 // 11
        '## A2',            // 12  A2: 12-15, 4 lines
        'b', 'b',
        '',                 // 15
        '## A3',            // 16  A3: 16-17, 2 lines
        'c'                 // 17
    ].join('\n') + '\n');
    write(dir, 'plugins/claude-kit/skills/beta/SKILL.md', [
        '## B1',            // 1   B1: 1-5, 5 lines
        'x', 'x', 'x',
        '',                 // 5
        '## B2',            // 6   B2: 6-7, 2 lines
        'y'                 // 7
    ].join('\n') + '\n');
    write(dir, 'plugins/claude-kit/agents/gamma.md', [
        '## G1',            // 1   G1: 1-3, 3 lines
        'g', 'g'
    ].join('\n') + '\n');
}

// A git repo holding the corpus at one commit. Committed, not just written: every
// number the hook reports is measured at HEAD, so a working tree alone has nothing
// for it to read.
function makeKitRepo() {
    const dir = makeDir('take-stock-test-');
    git(dir, 'init -b main');
    writeCorpus(dir);
    git(dir, 'add -A');
    git(dir, '-c user.name=t -c user.email=t@t commit -m init');
    return dir;
}

function head(dir) {
    return git(dir, 'rev-parse HEAD').trim();
}

// Append a line inside a named section, which is a patch to that section and to no
// other: the lines below it shift, but shifted lines are not changed lines.
function appendToSection(dir, rel, heading, line) {
    const full = path.join(dir, ...rel.split('/'));
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.splice(lines.indexOf(heading) + 1, 0, line);
    fs.writeFileSync(full, lines.join('\n'));
}

// Cut a whole section, heading through the line before the next "## " heading.
// Deletion is the case an append-only fixture cannot reach at all: only a removal
// produces a zero-length hunk range, and a take-stock pass is mostly removals.
function deleteSection(dir, rel, heading) {
    const full = path.join(dir, ...rel.split('/'));
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    const from = lines.indexOf(heading);
    assert.ok(from !== -1, 'fixture has no ' + heading);
    let to = from + 1;
    while (to < lines.length && !lines[to].startsWith('## ')) to++;
    lines.splice(from, to - from);
    fs.writeFileSync(full, lines.join('\n'));
}

// Cut one line by exact text.
function deleteLine(dir, rel, text) {
    const full = path.join(dir, ...rel.split('/'));
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    const at = lines.indexOf(text);
    assert.ok(at !== -1, 'fixture has no line ' + JSON.stringify(text));
    lines.splice(at, 1);
    fs.writeFileSync(full, lines.join('\n'));
}

function commit(dir, message) {
    git(dir, 'add -A');
    git(dir, `-c user.name=t -c user.email=t@t commit -m ${message}`);
}

function writeTakeStock(dir, body) {
    write(dir, 'docs/take-stock.md', body);
}

function entry(sha, date) {
    return `# Take stock\n\n## ${date || '2026-08-16'} - ${sha}\n\nWhat was cut, and why.\n`;
}

function runHook(cwd) {
    return spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({ cwd, source: 'startup' }),
        encoding: 'utf8'
    });
}

// The emitted block, or null for silence. Asserts the envelope on the way through:
// stdout is exactly one JSON object of the shape the sibling nudge emits.
function block(result) {
    assert.strictEqual(result.status, 0);
    if (result.stdout === '') return null;
    const parsed = JSON.parse(result.stdout);
    assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.deepStrictEqual(Object.keys(parsed), ['hookSpecificOutput']);
    return parsed.hookSpecificOutput.additionalContext;
}

// A counted or first-run block is three lines: the lead, its gloss, and the
// hand-off. Asserting the line COUNT is what makes this a real guard - matching
// on a row's shape only catches the shapes I thought of, and a ranking printed as
// "1. Know it works before you trust it - 164 lines, 17 commits" would pass every
// pattern test while failing this one. Any added line fails here, whatever it
// says.
function assertNoRanking(text) {
    assert.strictEqual(text.split('\n').length, 3);
    // The ranking is a real question, so the block hands it off rather than
    // pretending there is nothing more to know.
    assert.match(text, /run `node tools\/accretion\.js` for the ranking/);
}

test('a repo that is not the kit repo is silent, with no git work at all', () => {
    const dir = makeKitRepo();
    try {
        // Everything the hook needs EXCEPT the manifest it gates on, so silence
        // here can only come from the gate.
        fs.rmSync(path.join(dir, 'plugins', 'claude-kit', '.claude-plugin'), { recursive: true });
        const r = runHook(dir);
        assert.strictEqual(r.status, 0);
        assert.strictEqual(r.stdout, '');
    } finally { rmDir(dir); }
});

test('a kit tree that is not a git repo is silent', () => {
    const dir = makeDir('take-stock-test-');
    try {
        // No `git init`: every git call fails, including the first.
        writeCorpus(dir);
        const r = runHook(dir);
        assert.strictEqual(r.status, 0);
        assert.strictEqual(r.stdout, '');
    } finally { rmDir(dir); }
});

// Silence would be indistinguishable from "nothing has changed", and this state
// is permanent rather than transient: a shallow clone, or any history rewrite
// that orphans the recorded sha, leaves the hook unable to measure anything ever
// again. It has to say so, and it must not fall through to the first-run text
// either, which would claim no take-stock was ever recorded when one was.
test('a marker sha this repo does not have says so, rather than staying silent', () => {
    const dir = makeKitRepo();
    try {
        writeTakeStock(dir, entry('0'.repeat(40)));
        const text = block(runHook(dir));
        assert.ok(text, 'expected a block naming the unresolvable marker');
        assert.match(text, /which is not a commit in this repository/);
        assert.match(text, new RegExp('0{40}'));
        assert.doesNotMatch(text, /No take-stock has ever been recorded/);
        assert.doesNotMatch(text, /hold lines that differ/);
        assert.match(text, /Reminder, not a blocker\.$/);
    } finally { rmDir(dir); }
});

test('nothing patched since the marker is silent', () => {
    const dir = makeKitRepo();
    try {
        writeTakeStock(dir, entry(head(dir)));
        const r = runHook(dir);
        assert.strictEqual(r.status, 0);
        assert.strictEqual(r.stdout, '');
    } finally { rmDir(dir); }
});

test('a commit that touches three sections emits one block carrying the count', () => {
    const dir = makeKitRepo();
    try {
        const marker = head(dir);
        // Three sections over TWO files, deliberately: with one section per file
        // a hook counting changed FILES reports the same number as one counting
        // changed sections, and the assertion below would pass either way.
        appendToSection(dir, 'plugins/claude-kit/skills/alpha/SKILL.md', '## A1', 'a');
        appendToSection(dir, 'plugins/claude-kit/skills/alpha/SKILL.md', '## A2', 'b');
        appendToSection(dir, 'plugins/claude-kit/skills/beta/SKILL.md', '## B1', 'x');
        git(dir, 'add -A');
        git(dir, '-c user.name=t -c user.email=t@t commit -m edit');
        // Uncommitted on purpose: an entry written and not yet committed is still
        // the latest take-stock, so the marker is read from the working tree.
        writeTakeStock(dir, entry(marker));

        const text = block(runHook(dir));
        // Exactly one block, carrying the count: a hook that emitted nothing
        // fails on the first assertion, and one that emitted without the number
        // fails on the second.
        assert.ok(text, 'expected a block');
        // Three sections were patched: the three that gained a line. A3, below
        // two of them, shifted down without changing and must not be counted.
        assert.match(text, /^Take stock \(claude-kit prose\): 3 of the kit's current prose section\(s\) hold lines that differ from the last take-stock \(2026-08-16, [0-9a-f]{40}\)\./);
        assert.match(text, /see the kaizen skill\)\. Reminder, not a blocker\.$/);
        assertNoRanking(text);
    } finally { rmDir(dir); }
});

// The case this hook exists for, and the one an append-only fixture cannot reach.
// A take-stock pass cuts prose, so a cut section is the change it most needs to
// see. Deleting the first section of a file with front matter produces a
// zero-length hunk whose "+" line number is the line BEFORE the gap - front
// matter, which is in no section - so attributing a deletion to that line alone
// makes every cut of a first section invisible. All 33 files in the real corpus
// carry front matter.
test('a deleted section is counted, not invisible', () => {
    const dir = makeKitRepo();
    try {
        const marker = head(dir);
        deleteSection(dir, 'plugins/claude-kit/skills/alpha/SKILL.md', '## A1');
        commit(dir, 'cut-A1');
        writeTakeStock(dir, entry(marker));

        const text = block(runHook(dir));
        assert.ok(text, 'a cut section must not read as silence');
        // The gap left by A1 sits between HEAD line 4 (front matter) and line 5
        // (A2's heading, which moved up to become the first section), so one
        // current section holds the cut.
        assert.match(text, /: 1 of the kit's current prose section\(s\) hold lines that differ/);
    } finally { rmDir(dir); }
});

// The other side of the same rule. A deletion above HEAD's first line prints
// "+0,0", and there is no line 0: the removed text sat above the first line of
// the file, which is above the first heading, which is in no section. Counting it
// would contradict the rule that front matter belongs to no section, and would
// report a section as changed whose lines are byte-identical.
test('a deletion above the first line of a file counts nothing', () => {
    const dir = makeKitRepo();
    try {
        write(dir, 'plugins/claude-kit/agents/delta.md', 'junk\n## D1\nd\n');
        commit(dir, 'add-delta');
        const marker = head(dir);
        deleteLine(dir, 'plugins/claude-kit/agents/delta.md', 'junk');
        commit(dir, 'cut-junk');
        writeTakeStock(dir, entry(marker));

        const r = runHook(dir);
        assert.strictEqual(r.status, 0);
        assert.strictEqual(r.stdout, '');
    } finally { rmDir(dir); }
});

// Git ends the "+++" header with a TAB when a path holds a space, and C-quotes
// the whole header when it holds a quote or a backslash (core.quotePath=false
// suppresses only the non-ASCII case). Any hook reading paths out of patch
// headers therefore drops those files silently and reports a smaller number with
// no sign that it did. `T-SQL style guide.md` is a name this kit would plausibly
// give a reference file.
test('a prose file whose name holds a space or a quote is measured', () => {
    const dir = makeKitRepo();
    try {
        write(dir, 'plugins/claude-kit/skills/alpha/references/T-SQL style guide.md', '## S1\ns\n');
        write(dir, 'plugins/claude-kit/skills/alpha/references/odd "name".md', '## Q1\nq\n');
        commit(dir, 'add-awkward-names');
        const marker = head(dir);
        appendToSection(dir, 'plugins/claude-kit/skills/alpha/references/T-SQL style guide.md', '## S1', 's');
        appendToSection(dir, 'plugins/claude-kit/skills/alpha/references/odd "name".md', '## Q1', 'q');
        commit(dir, 'edit-awkward-names');
        writeTakeStock(dir, entry(marker));

        const text = block(runHook(dir));
        assert.ok(text, 'expected a block');
        assert.match(text, /: 2 of the kit's current prose section\(s\) hold lines that differ/);
    } finally { rmDir(dir); }
});

// `git ls-tree` names files relative to the cwd, `git diff` names them relative to
// the repository root, and pathspecs resolve against the cwd. A kit checkout
// nested inside a larger repository is where those three disagree, and the hook
// there matched no path at all and was permanently silent.
test('a kit checkout nested inside a larger repo is measured', () => {
    const root = makeDir('take-stock-nested-');
    const kit = path.join(root, 'sub');
    try {
        git(root, 'init -b main');
        write(root, 'README.md', '# the outer repo\n');
        writeCorpus(kit);
        commit(root, 'init');
        const marker = head(root);
        appendToSection(kit, 'plugins/claude-kit/skills/beta/SKILL.md', '## B1', 'x');
        commit(root, 'edit');
        writeTakeStock(kit, entry(marker));

        const text = block(runHook(kit));
        assert.ok(text, 'a nested kit checkout must be measured, not skipped');
        assert.match(text, /: 1 of the kit's current prose section\(s\) hold lines that differ/);
    } finally { rmDir(root); }
});

// A textconv driver runs a command over each blob and diffs its output, so a
// repo-configured one can empty every patch this hook reads and turn a real
// change into a confident zero. --no-ext-diff does not disable it; --no-textconv
// does. The driver here is `true`, which prints nothing for any input.
test('a repo-configured textconv driver cannot empty the measurement', () => {
    const dir = makeKitRepo();
    try {
        const marker = head(dir);
        appendToSection(dir, 'plugins/claude-kit/skills/beta/SKILL.md', '## B1', 'x');
        write(dir, '.gitattributes', '*.md diff=blank\n');
        commit(dir, 'edit');
        git(dir, 'config diff.blank.textconv true');
        writeTakeStock(dir, entry(marker));

        const text = block(runHook(dir));
        assert.ok(text, 'a textconv driver must not silence the measurement');
        assert.match(text, /: 1 of the kit's current prose section\(s\) hold lines that differ/);
    } finally { rmDir(dir); }
});

test('a missing docs/take-stock.md emits the first-run block rather than silence', () => {
    const dir = makeKitRepo();
    try {
        const text = block(runHook(dir));
        assert.ok(text, 'expected a first-run block');
        assert.match(text, /No take-stock has ever been recorded/);
        // No marker means no count: the first-run block must not invent one, and
        // must not carry a sentence that refers to one it never printed.
        assert.doesNotMatch(text, /hold lines that differ/);
        assert.doesNotMatch(text, /That count/);
        assert.match(text, /Nothing has been measured here/);
        assert.match(text, /see the kaizen skill\)\. Reminder, not a blocker\.$/);
        assertNoRanking(text);
    } finally { rmDir(dir); }
});

// A file that exists and yields no marker is NOT the same fact as no file at all,
// and the block must not claim the stronger one. "No take-stock has ever been
// recorded" is established only by the file's absence; every other way a read can
// fail (no entry, a directory, an oversized file, a permission error) establishes
// only that no marker could be read.
test('a docs/take-stock.md with no parseable entry says so, without claiming none was ever recorded', () => {
    const dir = makeKitRepo();
    try {
        // Right shape, wrong sha width: an abbreviated sha is not the record
        // format, and half a marker is no marker.
        writeTakeStock(dir, '# Take stock\n\n## 2026-08-16 - abc1234\n\nprose\n');
        const text = block(runHook(dir));
        assert.ok(text, 'expected a first-run block');
        assert.match(text, /No take-stock marker could be read from docs\/take-stock\.md/);
        assert.doesNotMatch(text, /No take-stock has ever been recorded/);
        assert.doesNotMatch(text, /does not exist/);
        assertNoRanking(text);
    } finally { rmDir(dir); }
});

// The open-error branch, which the directory case below does not reach: there,
// the open succeeds and the fstat refuses it. Here the open itself throws, with a
// code that is not ENOENT (a `docs` that is a regular file gives ENOTDIR), which
// is the shape a permission error on the directory also takes. Only ENOENT
// establishes "no take-stock has ever been recorded"; every other errno
// establishes only that this hook could not read one.
test('an open error that is not ENOENT does not claim the file is missing', { skip: process.platform === 'win32' && 'errno differs' }, () => {
    const dir = makeKitRepo();
    try {
        fs.writeFileSync(path.join(dir, 'docs'), 'a file where the directory should be\n');
        const text = block(runHook(dir));
        assert.ok(text, 'expected a block');
        assert.match(text, /No take-stock marker could be read from docs\/take-stock\.md/);
        assert.doesNotMatch(text, /does not exist/);
        assert.doesNotMatch(text, /No take-stock has ever been recorded/);
    } finally { rmDir(dir); }
});

test('an unreadable docs/take-stock.md does not claim the file is missing', () => {
    const dir = makeKitRepo();
    try {
        // A directory under the record's name: the open succeeds and the fstat
        // refuses it, which is the branch a permission error also lands in. Chosen
        // over chmod 000 because it behaves the same whoever runs the suite.
        fs.mkdirSync(path.join(dir, 'docs', 'take-stock.md'), { recursive: true });
        const text = block(runHook(dir));
        assert.ok(text, 'expected a block');
        assert.match(text, /No take-stock marker could be read from docs\/take-stock\.md/);
        assert.doesNotMatch(text, /does not exist/);
    } finally { rmDir(dir); }
});

// The other half of "could not measure is not measured zero": git answers the
// first calls and then fails part way. Built with a `git` shim on PATH that
// delegates to the real git except for `show`, the guards.test.js recorder-shim
// idiom pointed at a different binary. A hook that swallowed this would report a
// smaller number, or nothing, with no sign that half the corpus went unread.
test('a git failure part way through says the measurement failed', { skip: process.platform === 'win32' && 'POSIX shim' }, () => {
    const dir = makeKitRepo();
    const shimDir = makeDir('take-stock-shim-');
    try {
        const realGit = execSync('command -v git', { encoding: 'utf8' }).trim();
        const shim = path.join(shimDir, 'git');
        fs.writeFileSync(shim, `#!/bin/sh\nif [ "$1" = show ]; then exit 1; fi\nexec ${realGit} "$@"\n`);
        fs.chmodSync(shim, 0o755);

        const marker = head(dir);
        appendToSection(dir, 'plugins/claude-kit/skills/beta/SKILL.md', '## B1', 'x');
        commit(dir, 'edit');
        writeTakeStock(dir, entry(marker));

        const env = Object.assign({}, process.env);
        const key = Object.keys(env).find((k) => k.toLowerCase() === 'path') || 'PATH';
        env[key] = shimDir + path.delimiter + (env[key] || '');
        const r = spawnSync(process.execPath, [HOOK], {
            input: JSON.stringify({ cwd: dir, source: 'startup' }),
            encoding: 'utf8',
            env
        });

        const text = block(r);
        assert.ok(text, 'a failed measurement must not read as silence');
        assert.match(text, /could not be measured against the last recorded take-stock/);
        assert.doesNotMatch(text, /hold lines that differ/);
    } finally { rmDir(dir); rmDir(shimDir); }
});

// The record format is documented inside the file that holds the records, so the
// first "## YYYY-MM-DD - <sha>" line in docs/take-stock.md is routinely a fenced
// example rather than an entry. The hook parses headings fence-aware for exactly
// this, and the case is built so the two readings disagree: the fenced example
// names the first commit (which would report a patched section and speak), the
// real entry names HEAD (which is silence).
test('a fenced example of the record format is not read as the marker', () => {
    const dir = makeKitRepo();
    try {
        const first = head(dir);
        appendToSection(dir, 'plugins/claude-kit/skills/beta/SKILL.md', '## B1', 'x');
        git(dir, 'add -A');
        git(dir, '-c user.name=t -c user.email=t@t commit -m edit');
        writeTakeStock(dir, [
            '# Take stock',
            '',
            'Each entry opens with a heading of this form:',
            '',
            '```markdown',
            '## 2026-08-15 - ' + first,
            '```',
            '',
            '## 2026-08-16 - ' + head(dir),
            '',
            'What was cut, and why.',
            ''
        ].join('\n'));
        const r = runHook(dir);
        assert.strictEqual(r.status, 0);
        assert.strictEqual(r.stdout, '');
    } finally { rmDir(dir); }
});
