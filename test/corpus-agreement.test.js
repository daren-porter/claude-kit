// The corpus is defined twice, and these tests are the thing that asserts the two
// definitions agree.
//
// `tools/accretion.js`'s listProseFiles() walks the filesystem to decide what the
// accretion ranking measures. `hooks/take-stock-nudge.js`'s inCorpus() is a pure
// path predicate deciding what the take-stock nudge counts as changed prose. Same
// four globs, two implementations, and `docs/prose-accretion.md` carried "The
// corpus is defined twice and no test asserts the two definitions agree" as a
// known gap.
//
// WHY MIRRORING IS DELIBERATE, which is what makes the check the right fix rather
// than a refactor. The hook's own comment says it reproduces the tool's rules
// "rather than as one tidier rule of my own, because the tool's rules are not
// uniform": SKILL.md and references/agents markdown match case-insensitively,
// while assets/CLAUDE.md is reached by an exact path join and so is
// case-sensitive on Linux. A tidier rule would be a third definition. Mirroring
// only works if something checks the mirror, and nothing did.
//
// Both are exported for this file alone. The hook now fires under
// `require.main === module`, the pattern accretion.js already used for its own
// unit test, so spawning it as a hook is unchanged and requiring it is silent.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('node:child_process');
const path = require('path');

const { listProseFiles } = require('../tools/accretion.js');
const { inCorpus } = require('../plugins/claude-kit/hooks/take-stock-nudge.js');

const REPO = path.join(__dirname, '..');

// Every file the corpus could possibly be drawn from, as repo-root-relative POSIX
// paths. Read from the index, not from HEAD as the hook does: the predicates are
// what is under test, and the pre-commit gate runs this before HEAD moves, so a
// HEAD listing blocked every commit that added or removed a corpus file (the
// walk already reflects the change, HEAD does not). Outside a commit the index
// and HEAD agree.
function trackedUnderPlugin() {
    const out = execSync('git ls-files -z --full-name -- plugins/claude-kit',
        { cwd: REPO, encoding: 'utf8' });
    return out.split('\0').filter(Boolean);
}

test('the two definitions select exactly the same files in the real tree', () => {
    const tracked = trackedUnderPlugin();
    assert.ok(tracked.length > 20, `only ${tracked.length} tracked files: the pathspec or the tree moved`);

    const toolSet = new Set(listProseFiles().files.map((f) => f.gitPath));
    const hookSet = new Set(tracked.filter((p) => inCorpus(p)));

    // Both directions, named separately, because the two failures mean different
    // things: a file the tool measures and the nudge ignores is prose whose change
    // never prompts a take-stock, and a file the nudge counts and the tool never
    // measures is a nudge about a section that appears in no ranking.
    const toolOnly = [...toolSet].filter((p) => !hookSet.has(p));
    const hookOnly = [...hookSet].filter((p) => !toolSet.has(p));
    assert.deepStrictEqual(toolOnly, [], 'measured by the ranking, invisible to the nudge');
    assert.deepStrictEqual(hookOnly, [], 'counted by the nudge, absent from the ranking');
    assert.ok(toolSet.size > 25, `corpus collapsed to ${toolSet.size} files, which is its own bug`);
});

// The path shapes, asserted against inCorpus directly. The tool's half of each of
// these is covered by the real-tree test above; what these pin is that the mirror
// reproduces the tool's UNEVENNESS rather than smoothing it, since a smoothed rule
// passes the test above today and parts company the first time somebody commits
// one of these.
test('inCorpus mirrors the tool case-sensitivity, unevenness included', () => {
    const P = 'plugins/claude-kit/';
    // Case-insensitive, matching the tool's /^skill\.md$/i and /\.md$/i gates.
    assert.ok(inCorpus(P + 'skills/x/SKILL.md'));
    assert.ok(inCorpus(P + 'skills/x/skill.md'));
    assert.ok(inCorpus(P + 'skills/x/references/y.md'));
    assert.ok(inCorpus(P + 'skills/x/references/y.MD'));
    assert.ok(inCorpus(P + 'agents/a.md'));
    assert.ok(inCorpus(P + 'agents/a.MD'));
    // Case-SENSITIVE, because the tool reaches this one by an exact path join.
    // This asymmetry is the specific thing the hook's comment says the two would
    // part company over, so it is pinned rather than tidied.
    assert.ok(inCorpus(P + 'assets/CLAUDE.md'));
    assert.ok(!inCorpus(P + 'assets/claude.md'), 'the tool would not measure it, so the nudge must not count it');
});

test('inCorpus rejects everything outside the four globs', () => {
    const P = 'plugins/claude-kit/';
    for (const p of [
        P + 'skills/x/notes.md',                    // a skill file that is not SKILL.md
        P + 'skills/x/references/deep/y.md',        // references/ is not recursive
        P + 'skills/x/y/SKILL.md',                  // SKILL.md one level too deep
        P + 'agents/sub/a.md',                      // agents/ is not recursive
        P + 'assets/other.md',                      // assets/ holds one named file
        P + 'hooks/session-start.js',
        P + 'skills/x/SKILL.txt',
        'docs/architecture.md',                     // outside the plugin entirely
        'plugins/other-plugin/agents/a.md',         // a sibling plugin
    ]) {
        assert.ok(!inCorpus(p), 'must be outside the corpus: ' + p);
    }
});

// The pathspec bounds the hook to the kit tree, so the prefix is accepted wherever
// it starts - a kit checkout nested inside a larger repo reports
// "sub/plugins/claude-kit/...". A partial directory name must not match.
test('inCorpus accepts a nested checkout prefix but not a partial directory name', () => {
    assert.ok(inCorpus('sub/dir/plugins/claude-kit/agents/a.md'));
    assert.ok(!inCorpus('xplugins/claude-kit/agents/a.md'), 'a partial segment must not match');
    assert.ok(!inCorpus('plugins/claude-kit-fork/agents/a.md'));
});

// THE ONE KNOWN DIVERGENCE, pinned as an asymmetry rather than fixed, because
// fixing it means either a filesystem call in a path predicate or dropping the
// tool's guard, and that guard is load-bearing: without lstat, a FIFO named
// something.md hangs the tool on readFileSync and an .md symlink is followed
// wherever it points.
//
// So a SYMLINKED corpus file would be counted by the nudge and never measured by
// the ranking. Latent rather than live: the repo tracks no symlink at all today,
// verified below, which is why this is a documented asymmetry and not a defect
// anyone has met. If a symlink ever lands in the corpus, the real-tree test above
// fails with "counted by the nudge, absent from the ranking" and this comment is
// the explanation.
test('no symlink is tracked in the corpus, which is what keeps the one known asymmetry latent', () => {
    const out = execSync('git ls-tree -r HEAD -- plugins/claude-kit', { cwd: REPO, encoding: 'utf8' });
    const symlinks = out.split('\n').filter(Boolean)
        .filter((l) => l.startsWith('120000'))
        .map((l) => l.split('\t')[1]);
    assert.deepStrictEqual(symlinks, [],
        'a symlinked corpus file diverges: inCorpus is a path predicate and the tool requires lstat().isFile()');
});
