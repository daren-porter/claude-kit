#!/usr/bin/env node
// SessionStart hook: autoContinueAtUsageLimit posture check.
//
// autoContinueAtUsageLimit is a Claude Code setting that, when on, makes a
// session wait out a usage-limit reset and continue automatically. Two facts
// read off the 2.1.247 binary bound what "off" means. Its own schema
// description says "When off, the limit dialog offers the wait as a choice
// instead", so off removes the AUTOMATIC resume and leaves the pause and the
// wait standing as a manual choice. And the effective value is the settings
// value wherever one is defined, otherwise the key being absent from the
// harness's own storage, so "on" is true in effect rather than by a literal
// default. The setting only fires when a request is actually rejected, so a seat
// with overage enabled never reaches it; it stays the right mechanism for a seat
// without overage. The only condition worth catching is therefore a settings
// file saying false, which is what this hook checks for and all it says
// anything about. It never writes, patches, or offers to patch a settings file.
//
// Scope is bounded on purpose, and the bound has two halves:
//   - Claude Code resolves the effective value by merging several tiers of its
//     own, and kit-adoptions.md candidate 1 of the 2026-08-07 pass records the
//     upstream project abandoning harness detection outright for a sibling
//     setting after two review rounds each found another layer. Precedent
//     rather than proof, since that was a different key, but the mechanism is
//     the same and this hook does not re-fight it.
//   - The /config toggle for this key is consent-gated and persists through the
//     harness's own async writer rather than the synchronous local-settings
//     writer its neighbouring autoCompact toggle uses, so the ordinary opt-out
//     lands in no file this hook can read.
// What it reads is only the settings files the kit can name:
//   1. $CLAUDE_CONFIG_DIR/settings.json
//   2. $CLAUDE_CONFIG_DIR/settings.local.json
//   3. ~/.claude/settings.json
//   4. ~/.claude/settings.local.json
// 1 and 2 are absent from that list entirely when CLAUDE_CONFIG_DIR is unset,
// blank or RELATIVE (candidateFiles carries why a relative value is refused
// rather than resolved); unset is the ordinary case, and any of the three
// leaves two rather than four. A false in
// one of them is a real and winning configuration (the kit's own
// settings.recommended.json merge is a hand-edit path into exactly that file),
// and it is reported without resolving precedence between the files: a false in
// any one is reported even when a later file holds true, because deciding which
// would actually win is the merge this hook declines to reimplement.
//
// The emitted text carries both halves of the bound, so what reaches the model
// is "this file says false" and never "the setting is off for this session":
// the value found could be overridden by a tier the kit cannot name or belong to
// a config profile this session did not load, and an opt-out made through
// /config would be invisible here.
//
// Fail-open, like every other SessionStart nudge in this family: a settings file
// that is missing, unreadable or unparsable reads as "nothing established here"
// rather than as a warning, and any other failure emits nothing. Silence is also
// the whole of the ordinary case, on purpose - this hook runs at every session start
// in every repo, so a nudge that fired on the ordinary configuration would fire
// forever.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// A settings file is a handful of KB of hand-edited JSON; refuse a pathological
// one rather than read it in whole.
const SETTINGS_MAX_BYTES = 1024 * 1024;

// Caps the interpolated file paths before they reach the trusted context
// channel. Ordinary paths are well under this; a deep CLAUDE_CONFIG_DIR is the
// only way to approach it, which is the reason the value is 300 rather than the
// kit's other two caps, and docs/security-model.md's divergence ledger records
// it as a third cap value on that reason.
const SAFE_PATH_MAX = 300;

function readStdin() {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// Non-ASCII stripped, length capped: the filename-sanitizer idiom session-start.js
// uses for repo-derived strings bound for this same channel (its
// findCompletedUnarchived), rather than the prose sanitizer that replaces instead
// of drops - a file path has no word-boundary hazard a dropped byte could fuse.
// The backtick is stripped as well as the non-ASCII: this value is emitted
// inside a markdown code span, so a path carrying one would close the span
// early and leave the rest of the path reading as prose in a trusted channel.
function safePath(value) {
    return String(value).replace(/[^\x20-\x7E]|`/g, '').slice(0, SAFE_PATH_MAX);
}

// The settings files the kit can name, in the fixed order this hook checks and
// reports them in: two when CLAUDE_CONFIG_DIR is unset or blank, four when it
// points somewhere else. Each directory is resolved before the filenames are
// joined onto it, so a relative CLAUDE_CONFIG_DIR cannot make the hook read
// cwd-relative files (a repo-local settings.json is not this hook's business) or
// put an ambiguous relative path into the trusted channel. The dedupe is for the
// case where CLAUDE_CONFIG_DIR is set explicitly to the home config directory:
// the two directories coincide, and the pair would otherwise be read, and
// listed, twice.
function candidateFiles() {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    const dirs = [];
    // A relative CLAUDE_CONFIG_DIR resolves against this hook's cwd, which is
    // the project directory. Honoring one would let a cloned repo decide both
    // whether this hook speaks and which paths it names in trusted context, so
    // a relative value is ignored and only the home config dir is consulted.
    // usage-lib.js refuses the same shape at its own credential door.
    if (envDir && envDir.trim() !== '' && path.isAbsolute(envDir.trim())) dirs.push(envDir.trim());
    dirs.push(path.join(os.homedir(), '.claude'));

    const seen = new Set();
    const files = [];
    for (const dir of dirs) {
        // realpath, not just resolve: the case this dedupe exists for is
        // CLAUDE_CONFIG_DIR naming the home config directory, and a symlink is
        // one of the ordinary ways it does. path.resolve alone would let the
        // pair through twice and the emitted file list would then name four
        // paths for two files, which is a false statement in a trusted
        // channel. realpath throws on a directory that does not exist, and
        // resolve is the fallback because a missing directory still has to be
        // listed as looked at.
        let resolved;
        try {
            resolved = fs.realpathSync(path.resolve(dir));
        } catch {
            resolved = path.resolve(dir);
        }
        if (seen.has(resolved)) continue;
        seen.add(resolved);
        files.push(path.join(resolved, 'settings.json'));
        files.push(path.join(resolved, 'settings.local.json'));
    }
    return files;
}

// Parsed settings object, or null for anything short of a readable JSON object:
// missing, a directory, oversized, unreadable or unparsable, or JSON that parsed
// to something other than an object. Every one of those means "nothing was
// established by this file", which is the same outcome as the key being absent -
// this check reports what it found, not why a file failed to yield anything.
//
// Open first, then fstat the descriptor: memory-lib's readCapped form, for the
// reason take-stock-nudge.js states at its own readMarker. Stat-then-open checks
// one file and reads whatever holds the name a moment later, so both the isFile
// gate and the size cap would be advisory; O_NONBLOCK is what keeps a FIFO
// swapped in under the name from blocking in the open itself, which matters more
// here than in most hooks because this one carries no time bound at all.
function readSettings(file) {
    let fd;
    try {
        fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    } catch {
        return null;
    }
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size > SETTINGS_MAX_BYTES) return null;
        const buf = Buffer.alloc(stat.size);
        const bytes = fs.readSync(fd, buf, 0, stat.size, 0);
        let text = buf.toString('utf8', 0, bytes);
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const parsed = JSON.parse(text);
        return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch {
        return null;
    } finally {
        try { fs.closeSync(fd); } catch { /* already closed or invalid */ }
    }
}

// The first of the given files, in order, whose autoContinueAtUsageLimit is the
// boolean false - not the string "false", which is a different value the native
// setting does not treat as off. Deliberately does not keep scanning to prefer a
// "more authoritative" file: this hook does not know, and does not claim to know,
// which file actually wins, so it surfaces the first false it finds rather than
// silently deferring to a later file that happens to say true.
function findDisabledFile(files) {
    for (const file of files) {
        const settings = readSettings(file);
        if (!settings) continue;
        if (Object.prototype.hasOwnProperty.call(settings, 'autoContinueAtUsageLimit')
            && settings.autoContinueAtUsageLimit === false) {
            return file;
        }
    }
    return null;
}

function emit(lines) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext: lines.join('\n')
        }
    }));
}

function main() {
    // The SessionStart payload is drained, not parsed: nothing here reads a
    // field off it, because the files this hook checks are anchored to the home
    // directory and CLAUDE_CONFIG_DIR rather than to the session's cwd. The
    // drain is kept because the parent writes that payload to this pipe and
    // reading it is what lets the write complete, which is a reason in principle
    // rather than an observed failure. It is also this hook's only blocking
    // operation, so it is the one line here worth a stated reason.
    readStdin();

    // Built before the scan so the emitted text can name the files this run
    // actually looked at rather than a fixed count of four: with
    // CLAUDE_CONFIG_DIR unset there are two.
    const files = candidateFiles();
    const file = findDisabledFile(files);
    if (!file) return;

    emit([
        `\`autoContinueAtUsageLimit\` is set to \`false\` in ${safePath(file)}.`,
        'What that turns off is the automatic resume, not the pause: the description shipped with the setting says the limit dialog offers the wait as a choice instead. So where that value is the one in force, on a seat whose overage is absent or exhausted, a usage limit still stops the session, and it then waits for a person to accept the wait rather than resuming on its own. Worth a look if the `false` was not deliberate.',
        `The only files this check looks at, in this order: ${files.map(safePath).join(', ')}.`,
        'This is not a claim about the setting this session resolved, in either direction: a tier the kit cannot name could override the value above, the file could belong to a config profile this session did not load, and the `/config` toggle for this setting persists inside Claude Code rather than in any file listed here, so an opt-out made that way never appears in this check.'
    ]);
}

try { main(); } catch { /* never break a session over a hook */ }
