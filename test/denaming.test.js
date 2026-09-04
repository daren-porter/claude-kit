// Mechanical enforcement of the de-naming vocabulary contract.
//
// THE INVARIANT. Every file outside docs/archive/ calls the operator "the user"
// and the fork source "the upstream kit"/"the upstream author", with they/them
// throughout. The contract that defines it is immutable history at
// docs/archive/kit-denaming_s1-rules.md: a substitution table, a
// quotation-and-identifier carve-out, and three EXHAUSTIVE keep-lists
// (identifiers, attribution, verbatim quotations).
//
// WHY THIS FILE EXISTS. docs/backlog.md carried "The de-naming vocabulary is an
// invariant nothing checks" from 2026-08-20: the only check was a by-hand grep,
// and "a new skill, a rule ported by kit-adoption-pass, or a Chapter written from
// a transcript can put a name or a gendered pronoun back and nothing will say so."
// That is exactly what happened. When this file was written on 2026-09-04 the tree
// held ELEVEN gendered-pronoun sites and FIVE prose namings of the operator, all
// in specs and ledger entries authored after the sweep, none of them on any of the
// three lists. Fixed in the same commit as this test.
//
// The item offered two closure paths, writing the rule into writing-skills or
// recording that habit plus a by-hand grep is enough. This takes a third it did
// not consider, because one of its premises had aged: it says the gate "cannot
// exercise prose", and tools/accretion.test.js has measured prose mechanically
// since 2026-08-16. A test runs on every commit; a rule and a habit did not.
//
// ENFORCEMENT IS SPLIT BY DECIDABILITY, which is the design decision to read
// before editing any pattern below:
//
//   - The operator's name and gendered pronouns are HARD-FAILED. Their legitimate
//     forms are a short, stable set of mechanical pointers (an email, a repo slug,
//     a marketplace id, JSON author fields, real filesystem paths), so there are
//     no false positives and the set does not grow with ordinary authoring.
//   - The upstream author's name is CLASS-ALLOWED. The contract's own distinction
//     is credit versus machinery ("names are not deleted from things that do not
//     belong to this kit", but "describing this kit's own machinery is operational
//     and is de-named, even when the upstream's name appears"), and that is NOT
//     mechanically decidable. So this half catches a bare new occurrence in an
//     unexpected shape and CANNOT judge an attribution-shaped one. Stated rather
//     than papered over: do not trust this half further than it goes.
//
// DELIBERATELY NOT COVERED: the role noun "the operator". The contract makes it a
// one-site exception at agents/security-reviewer.md:29; the live tree had 100+
// occurrences across 35 files when this test was written. Usage has voted against
// the contract there, and whether that vote should stand is a vocabulary decision
// for the user rather than something a test should force. Reported as a finding,
// not enforced here.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

// The contract's scope: "the tracked tree excluding docs/archive/". Tracked
// rather than a filesystem walk, so scratch files and build output never enter.
// This file is excluded because it necessarily contains every pattern it bans.
const SELF = 'test/denaming.test.js';

function trackedFiles() {
    const res = spawnSync('git', ['-C', REPO, 'ls-files'], { encoding: 'utf8' });
    assert.strictEqual(res.status, 0, 'git ls-files must succeed: this test defines its own scope');
    return res.stdout.split('\n')
        .filter(Boolean)
        .filter((f) => !f.startsWith('docs/archive/'))
        .filter((f) => f !== SELF);
}

function readText(rel) {
    try {
        const buf = fs.readFileSync(path.join(REPO, rel));
        // A NUL byte means binary; nothing authored lives there.
        if (buf.includes(0)) return null;
        return buf.toString('utf8');
    } catch {
        return null;   // unreadable (a submodule entry, say): not authored prose
    }
}

// Strip every allowed form from a line, then look for what is left. Keyed on
// CONTENT rather than location, exactly as the contract keys its own
// kit-denaming_spec sites, "located by content rather than line number, because
// that file's lines move as the effort runs".
function residue(line, allowed, banned) {
    let rest = line;
    for (const re of allowed) rest = rest.replace(re, ' ');
    const hits = rest.match(banned);
    return hits ? hits : null;
}

function scan(allowed, banned) {
    const findings = [];
    for (const rel of trackedFiles()) {
        const text = readText(rel);
        if (text === null) continue;
        text.split('\n').forEach((line, i) => {
            const hits = residue(line, allowed, banned);
            if (hits) findings.push(`${rel}:${i + 1}: ${hits.join(', ')}  ||  ${line.trim().slice(0, 130)}`);
        });
    }
    return findings;
}

function report(findings, guidance) {
    return findings.length === 0 ? '' : `\n${findings.length} finding(s):\n  ${findings.join('\n  ')}\n\n${guidance}\n`;
}

// ---------------------------------------------------------------------------
// Gendered pronouns. No allowlist at all.
//
// The contract requires this one to match BOTH cases explicitly. Its own
// cautionary tale is on the name patterns rather than here: revision 1 dropped
// `porter` AND declared the name patterns case-sensitive, and the two together
// made `DAREN PORTER` unreachable by every grep the contract mandates, so two
// occurrences in generated output went unlisted.
//
// A verbatim quotation carrying a pronoun would be a legitimate survivor (the
// contract's List 3 had one, quoting finishing-work's pre-sweep text). None is in
// the live tree: that list's pronoun entry lives in docs/archive/ now. If one
// returns, add it here with the quoted source rather than widening the pattern.
const PRONOUNS = /\b([Hh]e|[Hh]is|[Hh]im|[Hh]imself)\b/g;

test('no gendered pronoun appears outside docs/archive/', () => {
    const findings = scan([], PRONOUNS);
    assert.strictEqual(findings.length, 0, report(findings,
        'The kit uses they/them throughout: the operator\'s pronouns are not stated anywhere and a '
        + 'name does not imply them. Rewrite to they/them. If the text is a VERBATIM QUOTATION whose '
        + 'pronoun is the point, add it to this test with the source it quotes.'));
});

// ---------------------------------------------------------------------------
// The operator's name. Hard-failed outside these mechanical forms, every one of
// which is a pointer: rewriting the text does not rename the thing, it breaks
// what the text points at.
const OPERATOR_ALLOWED = [
    /daren@asr-solutions\.com/gi,              // attribution metadata, kept by decision
    /daren-porter\/claude-kit/gi,              // GitHub target; /plugin marketplace add argument
    /claude-kit@daren\b/gi,                    // /plugin install argument
    /"name":\s*"Daren Porter"/g,               // package and marketplace author
    /"name":\s*"daren"/g,                      // the marketplace id every install path keys off
    /`daren`/g,                                // the marketplace id, backticked, in prose
    /marketplace (?:add|update) daren\b/gi,    // command arguments
    /[-/]home[-/]daren[-/]/gi,                 // real filesystem paths, both spellings
    /Daren Porter \/ ASR Solutions/g,          // the generated banner line
    /`DAREN PORTER`/g,                         // see the note below
];

// The last entry needs its reason recorded, because it is the only prose-shaped
// survivor and a future reader will be tempted to remove it. docs/README.md
// quotes the literal string `DAREN PORTER` while describing the contract's own
// trap: revision 1 made that exact string unreachable by every mandated grep. The
// backticked all-caps form IS the quotation, and editing it would make the
// sentence false. Narrow on purpose: only the backticked all-caps spelling.
test('the operator is called "the user", never named, outside the pointer forms', () => {
    const findings = scan(OPERATOR_ALLOWED, /\b(?:[Dd]aren|[Pp]orter|DAREN|PORTER)\b/g);
    assert.strictEqual(findings.length, 0, report(findings,
        'Prose calls the operator "the user". If this occurrence is a POINTER (a path, URL, repo '
        + 'slug, package or marketplace id, email, or a real external artifact), add its exact form '
        + 'to OPERATOR_ALLOWED above with the reason it cannot be rewritten. Otherwise de-name it.'));
});

// ---------------------------------------------------------------------------
// The upstream author. Class-allowed, per the decidability note in this file's
// header. Attribution is kept wherever it appears, payload or docs/; describing
// this kit's own machinery is de-named even when the upstream's name appears in
// the description. No pattern can tell those apart, so these classes are
// permissive by design and this test's job is narrower than it looks: it catches
// the name arriving in a shape nobody has ruled on.
const UPSTREAM_ALLOWED = [
    /SApplefeld\/sapplefeld-claude-kit/gi,     // the recorded upstream remote
    /sapplefeld-claude-kit/gi,                 // the clone path kit-adoption-pass tests for
    /claude-kit-scott/gi,                      // a path already on record as drifted
    /scott-[a-z-]+/g,                          // real upstream skill names, e.g. scott-writing-style
    /SCOTT-CLAUDE|SCOTT-DEVELOP/g,             // named machines in an adoption entry
    /Voice:\s*scott/gi,                        // a real field value in an upstream agent
    /Scott Applefeld/g,                        // the fork and adaptation credits
    /Scott-baseline|Scott-style|Scott-informed/g,   // named-convention adjectives
    /Scott's memq/g,                           // adaptation credit
    /full Scott style/g,                       // the convention as an ASR reader would find it
    /goes back to Scott/g,                     // a verbatim quotation of the upstream skill
];

test('the upstream author appears only in ruled-on forms', () => {
    const findings = scan(UPSTREAM_ALLOWED, /\b(?:[Ss]cott|SCOTT|[Aa]pplefeld|[Ss]applefeld)\b/g);
    assert.strictEqual(findings.length, 0, report(findings,
        'The fork source is "the upstream kit" or "the upstream author" when describing this kit\'s '
        + 'machinery, and is named only to CREDIT work that is not this kit\'s. If this is credit or '
        + 'a pointer, add its form to UPSTREAM_ALLOWED with the reason. Otherwise de-name it.'));
});

// ---------------------------------------------------------------------------
// The allowlists must not rot into wildcards. A pattern that matches a bare name
// token with nothing around it would silence the check it belongs to, which is
// how a guard like this dies: not by being deleted, but by being widened once to
// clear a red build.
test('no allowlist pattern matches a bare name token on its own', () => {
    for (const [label, list] of [['OPERATOR_ALLOWED', OPERATOR_ALLOWED], ['UPSTREAM_ALLOWED', UPSTREAM_ALLOWED]]) {
        for (const re of list) {
            for (const bare of ['daren', 'Daren', 'porter', 'Porter', 'scott', 'Scott', 'applefeld']) {
                const probe = new RegExp(re.source, re.flags.replace('g', ''));
                assert.ok(!probe.test(bare),
                    `${label} pattern ${re} matches the bare token "${bare}", which would silence the check`);
            }
        }
    }
});
