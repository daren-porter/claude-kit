// Materializes one isolated directory per rep for a writing-skills arm.
//
// WHY THIS EXISTS. An arm dispatched from inside this repo cannot control what
// reaches its reps. Measured 2026-09-07, a rep dispatched here quoted, from context
// alone: the project auto-memory index and three of its titles, the memory entries
// "Premise corrections need verifying" and "Size a wording change by its readers",
// and the global style rules. For an arm about prose rules that is the answer key.
// A rep dispatched from a scratch directory instead reported no memory index and no
// such entries, because the project auto-memory is keyed to the repo path.
//
// The other half is the agent definition. A rep whose `tools:` omits `Skill` gets
// no Skill tool AND no skill_listing at all, verified by the rep reporting "no list
// of available skills with names and descriptions anywhere in my context". A
// general-purpose rep gets the listing, which carries every installed skill's
// description, so an arm whose treated text is a description runs with both
// versions in front of it.
//
// WHAT THIS DOES NOT CLOSE, measured the same day and stated because a harness
// oversold is worse than none: the global CLAUDE.md still loads (it is user-level,
// and it names kit skills in prose), MCP server instructions still arrive, and
// `advisor` is injected whatever the tools list says. And isolation is not
// discriminating power: the arm that motivated this was ALSO void because its
// criteria were satisfiable by any competent rep, which no harness fixes.
//
// Node core only, CommonJS, no dependencies, consistent with tools/accretion.js.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'arm-harness', 'plain-worker.md');

// The repo must never be the cwd of a rep, which is the whole point, so refuse a
// destination inside it rather than trusting the caller to pass one outside.
function insideRepo(dir) {
    const repo = path.resolve(__dirname, '..');
    const rel = path.relative(repo, path.resolve(dir));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function materialize(opts) {
    const { name, reps, fixtures, root } = opts;
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(String(name || ''))) {
        return { ok: false, reason: 'arm name must be kebab-case, 1-41 chars' };
    }
    const n = Number(reps);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
        return { ok: false, reason: 'reps must be an integer 1-20' };
    }
    for (const f of fixtures) {
        if (!fs.existsSync(f)) return { ok: false, reason: 'fixture not found: ' + f };
        if (!fs.statSync(f).isFile()) return { ok: false, reason: 'fixture is not a file: ' + f };
    }
    // The directory name carries NO arm name, and the agent is called plain-worker
    // rather than arm-rep, because both leaked on this harness's first live use. One
    // rep wrote that it declined to read the harness doc since "the directory name
    // says this is a probe"; another enumerated its own `.claude/agents/arm-rep.md`.
    // A fixture's path reaches every rep and no rep can decline to read its own cwd.
    const base = root || fs.mkdtempSync(path.join(os.tmpdir(), 'w-'));
    if (insideRepo(base)) {
        return { ok: false, reason: 'destination is inside the repo, which defeats the isolation: ' + base };
    }
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const dirs = [];
    for (let i = 1; i <= n; i++) {
        // One directory per rep, because reps that run in parallel against a shared
        // output path overwrite each other and the failure is silent.
        const dir = path.join(base, 'rep-' + String(i).padStart(2, '0'));
        fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
        fs.writeFileSync(path.join(dir, '.claude', 'agents', 'plain-worker.md'), template, 'utf8');
        // Without this the printed dispatch is refused by the permission classifier
        // ("Blocked by classifier") in a non-interactive session, which is a
        // reproducibility defect rather than a safety one: the same command shape
        // succeeded for the four recorded reps and was blocked on a later run. The
        // grant is scoped to a throwaway directory outside the repo and to an agent
        // holding only Read and Bash.
        fs.writeFileSync(
            path.join(dir, '.claude', 'settings.local.json'),
            JSON.stringify({ permissions: { allow: ['Task', 'Agent'] } }, null, 2) + '\n',
            'utf8');
        for (const f of fixtures) {
            fs.copyFileSync(f, path.join(dir, path.basename(f)));
        }
        dirs.push(dir);
    }
    return { ok: true, base, dirs };
}

function main() {
    const argv = process.argv.slice(2);
    if (argv.length < 3) {
        process.stderr.write(
            'usage: arm-harness.js <arm-name> <reps> <fixture>...\n'
            + '  Creates one isolated directory per rep, each carrying the plain-worker agent\n'
            + '  definition and a copy of every fixture. Prints the dispatch command per rep.\n'
            + '  Nothing is dispatched: the caller runs each command and reads each reply.\n');
        process.exitCode = 1;
        return;
    }
    const r = materialize({ name: argv[0], reps: argv[1], fixtures: argv.slice(2) });
    if (!r.ok) {
        process.stderr.write('arm-harness: ' + r.reason + '\n');
        process.exitCode = 1;
        return;
    }
    process.stdout.write(r.base + '\n\n');
    for (const d of r.dirs) {
        // A rep is a SUBAGENT of a throwaway dispatcher session, not a top-level
        // session, and that is measured rather than stylistic. Every one of the six
        // recorded arm reps ran this way and carried no `hook_additional_context`.
        // A top-level session, which is what `claude -p --agent plain-worker` gives
        // you, carries the SessionStart hook injection instead: a 2KB preview of the
        // kit's cross-project memory AND the absolute path of the untruncated 10.6KB
        // file behind it, which holds the records describing the skill-listing
        // mechanism itself. That path is one `Read` away for a rep holding `Read`,
        // and the only thing observed stopping a rep was a prompt telling it not to
        // look, which this kit's own rules say is not a control.
        //
        // The first version of this line printed neither form and omitted the agent
        // entirely, so it started an ordinary session holding the full listing while
        // a corpus sentence claimed otherwise. Both review seats caught it.
        //
        // The prompt is passed inline rather than written into the rep directory: a
        // rep reads what is in its cwd, and one that found the dispatcher's own
        // prompt file there reported reading it.
        process.stdout.write(
            'cd ' + d + " && claude -p 'Dispatch the plain-worker agent with exactly "
            + "this prompt, then report its reply verbatim and nothing else: \"<the rep "
            + "task>\"' --output-format text\n");
    }
    process.stdout.write(
        '\nEach directory is one rep. Dispatch serially where the arm is RED-side.\n'
        + 'Do not write the dispatch prompt, notes or scoring into a rep directory.\n');
}

if (require.main === module) {
    // Piping this to `head` closes stdout mid-write, and an unhandled EPIPE prints a
    // stack trace over the output the caller is trying to read.
    process.stdout.on('error', (err) => { if (err && err.code === 'EPIPE') process.exit(0); });
    main();
}

module.exports = { materialize, insideRepo };
