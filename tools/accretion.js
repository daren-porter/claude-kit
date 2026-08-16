#!/usr/bin/env node
// accretion.js: maintainer tool. Lives in tools/, OUTSIDE plugins/claude-kit/, so
// it is never packaged for kit users and adds zero standing footprint (measuring
// the kit's prose must not itself add standing cost). Two things depend on exactly
// this nesting, one directory under the repo root: REPO_ROOT below is
// path.join(__dirname, '..'), and the accretion-lib require reaches the payload by
// a relative path. Moving this file means fixing both.
//
// It reports churn per section over the kit's prose files: every level-2 ("## ")
// section of plugins/claude-kit/skills/*/SKILL.md, skills/*/references/*.md,
// agents/*.md and assets/CLAUDE.md, with its line span, the number of commits that
// touched that line span, and the product of the two as the ordering key. The top
// rows are printed by rank. It edits nothing and writes no artifact; the report
// goes to stdout so it can never go stale in the tree.
//
// The corpus is what a reader's attention actually pays for, not what a skill's
// front door costs: a 251-line style reference costs a reader what a 251-line
// SKILL.md section costs, and assets/CLAUDE.md is the shipped global rules file
// that loads in every session in every repo that adopts the kit.
//
// Why the product and not either number alone: a section's line count says how big
// it is and its commit count says how often it has been edited. Either alone is
// uninformative (a long section nobody touches is settled; a short section edited
// often is ordinary correction). The product orders sections by both at once. What
// the ordering means, and what if anything follows from it, is for a human reading
// the sections themselves to work out. This tool reports counts, locations and
// rank, makes no assessment of any section, and recommends nothing.
//
// Measurement method:
//   - Every measurement comes from one snapshot, HEAD. A file's text is read with
//     `git show HEAD:<path>` and its sections are parsed from that text, so the
//     line ranges handed to git are ranges HEAD actually has. Reading ranges from
//     the working tree instead is the bug this avoids: git clamps a range that
//     runs past HEAD's end of file, answers for the part that fits and exits 0, so
//     any file with uncommitted edits yields a confident undercount with nothing
//     to mark it. Churn is a property of history, so history's text is the right
//     text to measure.
//   - A section starts at a "## " heading line and runs through the line before the
//     next "## " heading, or to end of file for the last one. Line numbers are
//     1-based, matching git's convention.
//   - "##" sequences inside fenced code blocks are not headings. The kit's prose
//     quotes markdown in fenced examples, so tracking fences is what separates the
//     real sections from the quoted ones.
//   - Commits come from `git log -s -L<start>,<end>:<path> --pretty=format:%H`,
//     which prints one full sha per commit touching that line range. %H and not
//     %h: %h honours core.abbrev, so a user with `abbrev = 4` in ~/.gitconfig
//     would get 4-character shas from the same command. -s suppresses the diff
//     body: the shas are the whole signal, and the diffs run to six figures of
//     bytes for a large section.
//
// Honest limits (also stated in the report itself):
//   - Line count is a proxy for size. It counts raw lines, blanks and fenced code
//     included, not words or tokens.
//   - Commit count weights every commit equally. A typo fix and a rewrite each
//     count as one, and a commit touching two sections counts once against each.
//   - `git log -L` counts the commit that created a line range as a commit that
//     touched it, so a section nobody has edited since it was written reports 1
//     and not 0, and every product carries a floor of lines x 1.
//   - `git log -L` traces a line range backwards through history and adjusts it as
//     diffs are applied, but the trail can be lost across a file rename or a
//     wholesale rewrite, which undercounts. History that predates a file's current
//     path is not counted at all.
//   - A section's identity here is its current line range, not its title. A section
//     that was renamed, split or merged carries the history of the lines it now
//     occupies, which is not the same as the history of the idea in it.
//   - The product mixes two units. It orders rows and nothing more; its magnitude
//     is not a quantity of anything.
//   - Line counts and spans are HEAD's, so they can differ from what a maintainer
//     sees in an editor mid-edit.
//   - The top-N cutoff is a report length, not a claim about where accretion stops.
//   - Scope is the four globs above. Prose in docs/, the root README.md, hooks/ and
//     commands is not measured.
//
// Node core plus one kit-local module, no third-party dependencies. The section
// parser is shared with the take-stock SessionStart hook, so it lives in the
// shipped payload (plugins/claude-kit/hooks/accretion-lib.js) and this tool
// requires inward to it: a hook cannot require a file that is never packaged, and
// two copies of the fence rule would drift.
// Defensive throughout, and the CLI always exits 0.
// These degrade to a partial report with a note naming the cause, rather than
// throwing: an unreadable directory, a skill directory with no SKILL.md, an absent
// assets/CLAUDE.md, a file present in the working tree but absent from HEAD, a line
// range git will not answer for, and a machine with no git at all (which falls back
// to reading the working tree, without commit counts). Exactly one case degrades
// silently: an *.md path that is not a regular file is dropped by the gate in
// listMarkdown without a note, because the alternative is opening a FIFO and hanging
// the tool. It is the one thing the report can omit without saying so.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseSections } = require('../plugins/claude-kit/hooks/accretion-lib.js');

// Sources are resolved relative to this script, not the cwd, so the report is the
// same from any directory.
const REPO_ROOT = path.join(__dirname, '..');
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins', 'claude-kit');

// Every git call carries this timeout, so no single git call can hang forever. It
// bounds each call and not the run: the tool makes one call per file plus one per
// section, so a git that hung on every call would still take a long time to finish.
// Observed runtime on this repo is under two seconds.
const GIT_TIMEOUT_MS = 15000;
// Generous, but bounded: -s keeps a log call to a few hundred bytes, and the
// largest prose file in the corpus is well under a megabyte.
const GIT_MAX_BUFFER = 32 * 1024 * 1024;

// How many ranked rows the report prints.
const TOP_N = 15;

// Collapse a message to one bounded line. A report note is a single markdown
// bullet and git's fatals can run to several lines, so an unflattened message
// would break the list it lands in.
function oneLine(s, limit) {
    if (typeof s !== 'string') return '';
    const flat = s.replace(/\s+/g, ' ').trim();
    const max = limit || 140;
    return flat.length > max ? flat.slice(0, max - 3) + '...' : flat;
}

// The .md files directly in one directory, sorted, each confirmed a regular file.
// Returns { names, missing, error }: missing marks a directory that is not there at
// all, which is the normal case for a skill with no references/.
//
// The lstatSync gate is load-bearing, not decoration. Without it a FIFO named
// something.md is opened by readFileSync and blocks until a writer appears, hanging
// the tool indefinitely, and an .md symlink is followed wherever it points. lstat
// rather than stat because stat follows the symlink and would report the target. A
// path the gate rejects is dropped without a note, which is the one omission this
// tool does not announce.
function listMarkdown(dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        if (err && err.code === 'ENOENT') return { names: [], missing: true, error: null };
        return { names: [], missing: false, error: oneLine(err && err.message) };
    }
    const names = [];
    for (const entry of entries) {
        if (!/\.md$/i.test(entry.name)) continue;
        try {
            if (!fs.lstatSync(path.join(dir, entry.name)).isFile()) continue;
        } catch {
            continue;
        }
        names.push(entry.name);
    }
    names.sort();
    return { names, missing: false, error: null };
}

// The prose files to measure, in a stable order: each skill's SKILL.md followed by
// its references/*.md, then every agents/*.md, then the shipped assets/CLAUDE.md.
// Each entry carries the repo-root-relative path git needs and the plugin-relative
// path the report shows. A directory that cannot be read yields a note instead of
// an exception, and so does a skill directory with no SKILL.md: dropping such a
// skill silently removed it from the report while Totals still read "N of N found".
function listProseFiles() {
    const files = [];
    const notes = [];

    const skillsDir = path.join(PLUGIN_ROOT, 'skills');
    let skillNames = null;
    try {
        skillNames = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();
    } catch {
        notes.push('Could not read the skills directory; no skill files were measured.');
    }
    for (const name of skillNames || []) {
        const dir = path.join(skillsDir, name);
        const listing = listMarkdown(dir);
        if (listing.error) {
            notes.push('Could not read skills/' + name + '/; that skill is not measured (' + listing.error + ').');
        } else {
            // Matched case-insensitively, so this branch and the agents branch
            // agree about what counts as a markdown file.
            const skill = listing.names.filter((f) => /^skill\.md$/i.test(f));
            if (skill.length > 0) files.push(describeFile(path.join(dir, skill[0])));
            else notes.push('skills/' + name + '/ holds no readable SKILL.md; that skill contributes no rows.');
        }

        const refsDir = path.join(dir, 'references');
        const refs = listMarkdown(refsDir);
        // refs.missing is the ordinary case: most skills carry no references/.
        if (refs.error) {
            notes.push('Could not read skills/' + name + '/references/; those files are not measured (' + refs.error + ').');
        }
        for (const f of refs.names) files.push(describeFile(path.join(refsDir, f)));
    }

    const agentsDir = path.join(PLUGIN_ROOT, 'agents');
    const agents = listMarkdown(agentsDir);
    if (agents.missing || agents.error) {
        notes.push('Could not read the agents directory; no agent files were measured.');
    }
    for (const f of agents.names) files.push(describeFile(path.join(agentsDir, f)));

    // The shipped global rules file: one known path, not a glob. It is prose with
    // the widest reach in the kit, loading into every session in every repo that
    // adopts it, so its absence is worth a note rather than a silent skip.
    const claudeMd = path.join(PLUGIN_ROOT, 'assets', 'CLAUDE.md');
    let claudeMdIsFile = false;
    try {
        claudeMdIsFile = fs.lstatSync(claudeMd).isFile();
    } catch {
        claudeMdIsFile = false;
    }
    if (claudeMdIsFile) files.push(describeFile(claudeMd));
    else notes.push('assets/CLAUDE.md is not present as a regular file; it is not measured.');

    return { files, notes };
}

// Both path forms for one file: gitPath is relative to the repo root (git resolves
// it against REPO_ROOT), displayPath is relative to plugins/claude-kit/ so the
// report's rows stay short and read the way the kit's own docs name these files.
function describeFile(full) {
    return {
        full,
        gitPath: toPosix(path.relative(REPO_ROOT, full)),
        displayPath: toPosix(path.relative(PLUGIN_ROOT, full))
    };
}

function toPosix(p) {
    return p.split(path.sep).join('/');
}

// Run one git command under the shared limits. Returns { ok, out } on success, or
// { ok: false, out: '', reason, code } carrying git's own message so a caller can
// name the real cause in a note instead of guessing at it. Every git call in this
// file goes through here, so no call site can drift from the timeout or the kill
// signal.
function runGit(args) {
    try {
        const out = execFileSync('git', args, {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            timeout: GIT_TIMEOUT_MS,
            // execFileSync's default killSignal is SIGTERM, which a child is free
            // to trap and outlive; that makes the timeout advisory. SIGKILL cannot
            // be trapped, so the timeout above is the real bound.
            killSignal: 'SIGKILL',
            maxBuffer: GIT_MAX_BUFFER,
            // stderr is piped rather than dropped: git writes "fatal: There is no
            // path ..." for a path absent from history, and that is exactly the
            // detail a note should carry. Piping also keeps it out of our stdout,
            // which is the report.
            stdio: ['ignore', 'pipe', 'pipe']
        });
        return { ok: true, out, reason: null, code: null };
    } catch (err) {
        return { ok: false, out: '', reason: gitFailureReason(err), code: err && err.code };
    }
}

// Why git failed, in one printable line. git's own stderr first because it says it
// best; then the signal, because a timeout killed with SIGKILL arrives as a signal
// and not reliably as an ETIMEDOUT code; then the code, then the message.
function gitFailureReason(err) {
    const stderr = oneLine(err && err.stderr);
    if (stderr) return stderr;
    if (err && err.signal) return 'git was killed by ' + err.signal + ' (the timeout is ' + GIT_TIMEOUT_MS + 'ms)';
    if (err && err.code) return 'git failed with ' + err.code;
    return oneLine(err && err.message) || 'git failed for an unknown reason';
}

// Can git run here at all? Probed once so a machine with no git costs one failed
// spawn rather than one per section. Returns { ok, reason }.
function probeGit() {
    const res = runGit(['rev-parse', '--git-dir']);
    if (res.ok) return { ok: true, reason: null };
    // A failed spawn produces no stderr to quote, so name that case plainly.
    if (res.code === 'ENOENT') return { ok: false, reason: 'git is not installed or not on PATH' };
    return { ok: false, reason: res.reason };
}

// One file's text as of HEAD. Returns { ok, text } or { ok: false, reason }: a file
// added to the working tree but not yet committed fails here, and that is a note
// naming the file rather than a silent skip.
function readFileAtHead(gitPath) {
    const res = runGit(['show', 'HEAD:' + gitPath]);
    if (!res.ok) return { ok: false, text: null, reason: res.reason };
    return { ok: true, text: res.out, reason: null };
}

// Commits touching one line range of one file. Returns { commits, reason }, where
// commits is null when git could not answer and reason carries git's own message.
function countCommits(gitPath, start, end) {
    const res = runGit([
        'log',
        '-s',
        '-L' + start + ',' + end + ':' + gitPath,
        '--pretty=format:%H'
    ]);
    if (!res.ok) return { commits: null, reason: res.reason };
    // One full sha per line, with no trailing newline under `format:`. Counting
    // non-empty lines rather than matching a sha shape is the point: any matcher
    // with a width in it is a matcher a git config can defeat.
    const commits = res.out.split('\n').filter((line) => line.trim() !== '').length;
    // `git log -L` counts the commit that created a line range, so a range git
    // answered for has at least one commit and a genuine zero is unreachable. An
    // empty answer is therefore a miss, and reporting it as null (which renders
    // n/a) is what keeps "no answer" and "zero commits" distinguishable. Do not
    // "fix" this to return 0.
    if (commits === 0) return { commits: null, reason: 'git returned no commits for that line range' };
    return { commits, reason: null };
}

// Measure every section of every prose file. Returns the rows plus the counts and
// notes the report needs. Each file read and each git call degrades on its own, so
// one bad file costs one row, not the report.
function collect() {
    const { files, notes } = listProseFiles();
    const git = probeGit();
    if (!git.ok) {
        notes.push('Commit counts are unavailable: ' + git.reason
            + '. Sections are read from the working tree rather than from HEAD, and rows are ordered by line count alone.');
    }

    const rows = [];
    let filesRead = 0;
    let filesWithoutSections = 0;
    let unreadableFiles = 0;
    let unknownCommitRows = 0;
    // Distinct git failures, deduped: forty bad rows are one cause, not forty notes.
    const unknownReasons = new Map();

    for (const file of files) {
        // Ranges and history must come from one snapshot, or git silently clamps
        // the mismatch. See the measurement method at the top of this file.
        let text;
        if (git.ok) {
            const head = readFileAtHead(file.gitPath);
            if (!head.ok) {
                unreadableFiles++;
                notes.push('Could not read ' + file.displayPath + ' at HEAD, so it is not measured: '
                    + head.reason + '. A file added to the working tree but not yet committed reads this way.');
                continue;
            }
            text = head.text;
        } else {
            try {
                text = fs.readFileSync(file.full, 'utf8');
            } catch {
                unreadableFiles++;
                notes.push('Could not read ' + file.displayPath + '; it is not measured.');
                continue;
            }
        }
        filesRead++;

        const sections = parseSections(text);
        if (sections.length === 0) {
            filesWithoutSections++;
            continue;
        }

        for (const s of sections) {
            const lines = s.end - s.start + 1;
            let commits = null;
            if (git.ok) {
                const counted = countCommits(file.gitPath, s.start, s.end);
                commits = counted.commits;
                if (commits === null) {
                    unknownCommitRows++;
                    unknownReasons.set(counted.reason, (unknownReasons.get(counted.reason) || 0) + 1);
                }
            }
            rows.push({
                displayPath: file.displayPath,
                title: s.title,
                start: s.start,
                end: s.end,
                lines,
                commits,
                product: commits === null ? null : lines * commits
            });
        }
    }

    if (git.ok && unknownCommitRows > 0) {
        const causes = [...unknownReasons.entries()]
            .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
            .slice(0, 3)
            .map(([reason, count]) => count + ' x "' + reason + '"');
        notes.push(unknownCommitRows + ' section(s) have no commit count and read n/a. git said: ' + causes.join('; ') + '.');
    }
    if (filesWithoutSections > 0) {
        notes.push(filesWithoutSections + ' file(s) hold no level-2 heading and contribute no rows.');
    }

    return { rows, filesFound: files.length, filesRead, unreadableFiles, notes, gitOk: git.ok };
}

// Rank by the product, descending. An unknown product sorts below every known one,
// including a known zero; line count breaks the tie, so a report with no commit
// counts at all still orders by size. Path and title are the final tiebreak, so two
// runs over an unchanged tree produce the same row order (the report itself is not
// byte-identical between runs: it carries a fresh Generated: timestamp).
function rank(rows) {
    return rows.slice().sort((a, b) => {
        const ap = a.product === null ? -1 : a.product;
        const bp = b.product === null ? -1 : b.product;
        if (ap !== bp) return bp - ap;
        if (a.lines !== b.lines) return b.lines - a.lines;
        if (a.displayPath !== b.displayPath) return a.displayPath < b.displayPath ? -1 : 1;
        return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
    });
}

function fmtCount(n) {
    return n === null ? 'n/a' : String(n);
}

// A heading or path is arbitrary prose and the rows are pipe-delimited, so a title
// containing "|" would render as extra cells and misalign the whole row.
function escapeCell(s) {
    return String(s).split('|').join('\\|');
}

function renderReport(data) {
    const { rows, filesFound, filesRead, unreadableFiles, notes } = data;
    const ranked = rank(rows);
    const out = [];

    out.push('# Section churn (claude-kit prose)');
    out.push('');
    out.push('Generated: ' + new Date().toISOString());
    out.push('Repo root: ' + REPO_ROOT);
    out.push('');
    out.push('What this reports:');
    out.push('');
    out.push('- One row per level-2 ("## ") section of plugins/claude-kit/skills/*/SKILL.md, skills/*/references/*.md, agents/*.md and assets/CLAUDE.md. Paths shown are relative to plugins/claude-kit/.');
    out.push('- Every number is measured at HEAD: each file\'s text is read with `git show HEAD:<path>` and its sections are parsed from that text, so the line ranges are ranges HEAD has.');
    out.push('- lines: the section\'s span, its heading through the line before the next "## " heading (or end of file).');
    out.push('- span: the section\'s first and last line numbers, so a row can be opened at the section it names.');
    out.push('- commits: commits touching that line range, from `git log -L<start>,<end>:<path>`.');
    out.push('- product: lines x commits. It orders the rows and nothing more; it is not a quantity of anything.');
    out.push('');
    out.push('This tool edits nothing and recommends nothing. It reports counts, locations and rank. Reading the sections themselves and deciding what, if anything, follows from these numbers is a human\'s job.');
    out.push('');

    out.push('## Top ' + TOP_N + ' by lines x commits');
    out.push('');
    if (ranked.length === 0) {
        out.push('No sections were measured, so there is nothing to rank.');
    } else {
        out.push('| # | product | lines | commits | file | span | section |');
        out.push('| ---: | ---: | ---: | ---: | --- | ---: | --- |');
        const top = ranked.slice(0, TOP_N);
        for (let i = 0; i < top.length; i++) {
            const r = top[i];
            out.push('| ' + (i + 1) + ' | ' + fmtCount(r.product) + ' | ' + r.lines + ' | '
                + fmtCount(r.commits) + ' | ' + escapeCell(r.displayPath) + ' | '
                + r.start + '-' + r.end + ' | ' + escapeCell(r.title) + ' |');
        }
        if (ranked.length > TOP_N) {
            out.push('');
            out.push('Rows ' + (TOP_N + 1) + '-' + ranked.length + ' are not printed.');
        }
    }
    out.push('');

    out.push('## Totals');
    out.push('');
    out.push('- Sections measured: ' + rows.length);
    out.push('- Files measured: ' + filesRead + ' of ' + filesFound + ' found'
        + (unreadableFiles > 0 ? ' (' + unreadableFiles + ' unreadable)' : ''));
    for (const n of notes) out.push('- ' + n);
    out.push('');

    out.push('## Honest limits');
    out.push('');
    out.push('- Line count is a proxy for size: raw lines, blanks and fenced code included, not words or tokens.');
    out.push('- Commit count weights every commit equally. A typo fix and a rewrite each count as one, and a commit touching two sections counts once against each.');
    out.push('- `git log -L` counts the commit that created a line range as a commit that touched it, so a section nobody has edited since it was written reports 1 and not 0. Every product carries a floor of lines x 1.');
    out.push('- `git log -L` traces a line range backwards through history and adjusts it as diffs are applied, but the trail can be lost across a file rename or a wholesale rewrite, which undercounts. History that predates a file\'s current path is not counted at all.');
    out.push('- A section\'s identity here is its current line range, not its title. A section that was renamed, split or merged carries the history of the lines it now occupies, which is not the same as the history of the idea in it.');
    out.push('- The product mixes two units. It orders rows and nothing more; its magnitude is not a quantity of anything.');
    out.push('- Everything here is measured at HEAD, so the line counts and spans are HEAD\'s and can differ from what a maintainer with uncommitted edits sees in an editor. A file present in the working tree but absent from HEAD is named above rather than measured. Where git cannot run at all, the working tree is read instead and Totals says so.');
    out.push('- The top ' + TOP_N + ' cutoff is a report length, not a claim that accretion stops at row ' + TOP_N + '. The rows below it are the same measurement and are counted in Totals.');
    out.push('- Scope is the four globs above. Prose in docs/, the root README.md, hooks/ and commands is not measured.');
    out.push('');

    return out.join('\n') + '\n';
}

function main() {
    process.stdout.write(renderReport(collect()));
}

// Exported for the durable unit test. rank is the pure ordering every measured row
// feeds into; the other pure rule the report rests on, parseSections, now lives in
// plugins/claude-kit/hooks/accretion-lib.js and is tested from there. The rest of
// this file is I/O around the two.
module.exports = {
    rank
};

// Render only when invoked directly, never when required as a module (the unit test
// imports this file).
if (require.main === module) {
    try {
        main();
    } catch (err) {
        // Never crash: the report is best-effort and the CLI always exits 0. The
        // detail goes to stderr, where it cannot corrupt the report on stdout but
        // is still there to debug with. The fallback below shares a stream with the
        // write that may have just failed, so an EPIPE from a closed pipe throws
        // straight out of this catch; that is the one case where the exit is not 0,
        // and there is no stdout left to say anything on anyway.
        process.stderr.write('accretion.js: ' + ((err && err.stack) || String(err)) + '\n');
        process.stdout.write('# Section churn (claude-kit prose)\n\nThe report could not be produced due to an unexpected error; the detail is on stderr.\n');
    }
}
