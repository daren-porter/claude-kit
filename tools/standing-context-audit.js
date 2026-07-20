#!/usr/bin/env node
// standing-context-audit.js: maintainer tool. Lives at repo root, OUTSIDE
// plugins/claude-kit/, so it is never packaged for kit users and adds zero
// standing footprint (measuring standing cost must not itself add standing cost).
//
// It reports the standing (per-session, task-independent) context cost of the
// kit: the kit-owned slice measured precisely from the repo, grounded against the
// real standing-token total read from a session transcript, with size-outlier
// descriptions flagged as trim candidates. It edits nothing and writes no
// artifact; the report goes to stdout so it can never go stale in the tree.
//
// Standing-token isolation method (the measure Piece 2 inherits):
//   From a real session transcript (*.jsonl), take the FIRST entry in file order
//   that is a main-thread assistant message (type === "assistant" AND
//   isSidechain !== true) carrying message.usage. The input prefix of that first
//   request is the task-independent standing context (system prompt + harness
//   tool schemas + skills + agents + CLAUDE.md + MEMORY) plus the first user
//   message, which is typically small.
//     standing_total = input_tokens
//                    + cache_creation_input_tokens
//                    + cache_read_input_tokens
//   All three input components are summed on purpose. A cold prompt cache books
//   the prefix under cache_creation while a warm cache books the same tokens
//   under cache_read, so summing all three is robust to cache temperature.
//   Only the first request is used: later turns carry accumulated conversation
//   history that would inflate the prefix.
//
// Honest limits (also stated in the report itself):
//   - The total is REAL tokens, but the per-source kit figures are a chars/4
//     ESTIMATE. The transcript yields one assembled total, not a per-source
//     breakdown, so kit-owned sources can only be proxied by char count.
//   - The non-kit remainder (total minus kit-owned) is unattributed by size:
//     harness tool schemas and MCP payloads are not on disk here, so the script
//     reports their combined size and names the contributors it can identify.
//   - The total is environment-specific: it reflects whatever MCP servers and
//     plugins were connected in the measured session, not a fixed property of
//     the kit. The kit-owned slice is the portable part.
//
// Node core only, no dependencies. Defensive throughout: any failure degrades to
// a partial report rather than throwing, and the script always exits 0.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Documented char->token proxy. Real tokenizers vary, but ~4 chars/token is the
// standard rough proxy for English prose. Every figure derived from it is
// labeled an estimate in the report and never presented as a measured count.
const CHARS_PER_TOKEN = 4;

// A description whose char length exceeds this multiple of its group's median is
// flagged as a trim candidate (skills judged against skills, agents against
// agents). This surfaces outliers for human review; the tool never edits them.
const OUTLIER_FACTOR = 1.5;

// Kit sources are resolved relative to this script, not the cwd, so the audit
// works from any directory. The transcript search deliberately uses the cwd
// (below), because that is what the harness encodes into the transcript path.
const REPO_ROOT = path.join(__dirname, '..');
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins', 'claude-kit');

function toTokens(chars) {
    return Math.round(chars / CHARS_PER_TOKEN);
}

// Format an integer with thousands separators for readability in the report.
function fmtInt(n) {
    return Number(n).toLocaleString('en-US');
}

// Pull the single-line description value from a SKILL.md / agent .md file. The
// description lives in the YAML frontmatter (the block between the first two
// '---' fences); all current files keep it on one line, so we take everything
// after 'description:' to end of line. Returns null if no frontmatter or no
// description is present.
function extractDescription(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || lines[0].trim() !== '---') return null;
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') { end = i; break; }
    }
    if (end === -1) return null;
    for (let i = 1; i < end; i++) {
        const m = /^description:[ \t]*(.*)$/.exec(lines[i]);
        if (m) {
            let v = m[1].replace(/\s+$/, '');
            // Strip a surrounding matched quote pair so a quoted value does not
            // count its quote chars. Current kit files use unquoted single-line
            // scalars; folded/block scalars ('>' or '|') are not handled because
            // no kit description uses them.
            if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) {
                v = v.slice(1, -1);
            }
            return v;
        }
    }
    return null;
}

// Measure each skill's description: name is the parent directory of SKILL.md.
function measureSkills() {
    const dir = path.join(PLUGIN_ROOT, 'skills');
    const out = [];
    let names;
    try {
        names = fs.readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
    } catch {
        return out;
    }
    for (const name of names) {
        try {
            const text = fs.readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8');
            const desc = extractDescription(text);
            if (desc === null) continue;
            out.push({ name, chars: desc.length });
        } catch {
            // Missing or unreadable SKILL.md - skip this skill.
        }
    }
    return out;
}

// Measure each agent's description: name is the filename without the .md suffix.
function measureAgents() {
    const dir = path.join(PLUGIN_ROOT, 'agents');
    const out = [];
    let files;
    try {
        files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md'));
    } catch {
        return out;
    }
    for (const file of files) {
        try {
            const text = fs.readFileSync(path.join(dir, file), 'utf8');
            const desc = extractDescription(text);
            if (desc === null) continue;
            out.push({ name: file.replace(/\.md$/i, ''), chars: desc.length });
        } catch {
            // Unreadable agent file - skip it.
        }
    }
    return out;
}

// Char length of the entire shipped CLAUDE.md (the whole file loads into every
// session that adopts it, so the full length is the standing cost). Returns null
// if it cannot be read.
function measureShippedClaudeMd() {
    try {
        return fs.readFileSync(path.join(PLUGIN_ROOT, 'assets', 'CLAUDE.md'), 'utf8').length;
    } catch {
        return null;
    }
}

// Claude Code names a project's transcript directory after the absolute cwd with
// every non-alphanumeric character replaced by a dash. So '/', '.', and other
// separators all collapse to '-': a leading slash yields a leading dash, and a
// '/.claude-worktrees' segment becomes '--claude-worktrees'. Replacing only '/'
// would miss any dotted path (the worktree workflow's own '.claude-worktrees').
function encodeCwd(cwd) {
    return cwd.replace(/[^A-Za-z0-9]/g, '-');
}

// Locate the transcript to read. An explicit path (first CLI arg) overrides the
// search unconditionally. Otherwise search the config bases in order and pick the
// newest *.jsonl by mtime across whichever project dir(s) exist.
function findTranscript(explicitPath, cwd) {
    if (explicitPath) {
        return { path: explicitPath, explicit: true };
    }
    const bases = [];
    if (process.env.CLAUDE_CONFIG_DIR) bases.push(process.env.CLAUDE_CONFIG_DIR);
    bases.push(path.join(os.homedir(), '.claude-work'));
    bases.push(path.join(os.homedir(), '.claude'));

    const encoded = encodeCwd(cwd);
    const seen = new Set();
    let best = null;
    for (const base of bases) {
        const projectDir = path.join(base, 'projects', encoded);
        // CLAUDE_CONFIG_DIR may alias a default base; do not double-scan it.
        if (seen.has(projectDir)) continue;
        seen.add(projectDir);
        let entries;
        try {
            entries = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
        } catch {
            continue; // No such project dir under this base.
        }
        for (const f of entries) {
            const full = path.join(projectDir, f);
            try {
                const mtime = fs.statSync(full).mtimeMs;
                if (!best || mtime > best.mtime) best = { path: full, mtime };
            } catch {
                // Unreadable entry - skip it.
            }
        }
    }
    return best ? { path: best.path, explicit: false } : null;
}

// Read the standing-token total and the connected MCP servers from a transcript.
// Returns null if the file cannot be read at all (graceful degradation). If the
// file reads but has no qualifying assistant entry, standingTotal stays null.
function readTranscript(filePath) {
    let text;
    try {
        text = fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }

    const result = {
        basename: path.basename(filePath),
        sessionId: null,
        standingTotal: null,
        components: null,
        mcpServers: []
    };

    // Best-effort MCP enumeration: a real tool reference has the form
    // mcp__<server>__<tool>, so require an alphanumeric tool character after the
    // second '__'. That excludes bare "mcp__<word>__" placeholders that appear in
    // prose (docs, this script's own comments, design discussion in a transcript),
    // which would otherwise be counted as phantom servers. The captured group is
    // the server name; these name the identifiable contributors to the remainder.
    const mcp = new Set();
    const re = /mcp__([A-Za-z0-9_]+?)__[A-Za-z0-9]/g;
    let m;
    while ((m = re.exec(text)) !== null) mcp.add(m[1]);
    result.mcpServers = [...mcp].sort();

    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        if (!line.trim()) continue;
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        if (o && o.type === 'assistant' && o.isSidechain !== true && o.message && o.message.usage) {
            const u = o.message.usage;
            const input = u.input_tokens || 0;
            const cacheCreation = u.cache_creation_input_tokens || 0;
            const cacheRead = u.cache_read_input_tokens || 0;
            result.standingTotal = input + cacheCreation + cacheRead;
            result.components = { input, cacheCreation, cacheRead };
            result.sessionId = o.sessionId || o.session_id || null;
            break;
        }
    }
    return result;
}

function median(nums) {
    if (nums.length === 0) return 0;
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

// Render one sorted-largest-first table with a subtotal row.
function renderGroupTable(unitLabel, items) {
    const sorted = items.slice().sort((a, b) => b.chars - a.chars);
    const totalChars = sorted.reduce((s, i) => s + i.chars, 0);
    const totalTokens = toTokens(totalChars);
    const lines = [];
    lines.push(`| ${unitLabel} | Chars | ~Tokens (est.) |`);
    lines.push('| --- | ---: | ---: |');
    for (const it of sorted) {
        lines.push(`| ${it.name} | ${fmtInt(it.chars)} | ${fmtInt(toTokens(it.chars))} |`);
    }
    lines.push(`| **Subtotal** | **${fmtInt(totalChars)}** | **${fmtInt(totalTokens)}** |`);
    return { lines, totalChars, totalTokens };
}

// Trim candidates: descriptions whose char length exceeds OUTLIER_FACTOR times
// their own group's median.
function flagOutliers(items) {
    const med = median(items.map((i) => i.chars));
    const threshold = med * OUTLIER_FACTOR;
    const flagged = items
        .filter((i) => i.chars > threshold)
        .sort((a, b) => b.chars - a.chars);
    return { median: med, threshold, flagged };
}

function renderReport(ctx) {
    const { skills, agents, claudeMdChars, located, transcript, cwd } = ctx;
    const out = [];

    // Header block with the honest caveats.
    out.push('# Standing-Context Audit (claude-kit)');
    out.push('');
    out.push(`Generated: ${new Date().toISOString()}`);
    out.push(`Working directory: ${cwd}`);
    out.push('');
    out.push('How to read this report:');
    out.push('');
    out.push(`- Kit-owned per-source figures are an ESTIMATE (proxy ratio: ${CHARS_PER_TOKEN} chars/token). They are not measured token counts.`);
    out.push('- The standing total is REAL tokens, read from a session transcript (the input prefix of the session\'s first request).');
    out.push('- The total is environment-specific: it reflects whatever MCP servers and plugins were connected in that session, not a fixed property of the kit.');
    out.push('- Per-source REAL token counts are unavailable: the transcript yields one assembled total, not a breakdown, so kit-owned sources are proxied by char count.');
    out.push('- The standing total includes the session\'s first user message (typically small).');
    out.push('');

    // The real standing total and its source.
    out.push('## Standing total (real tokens)');
    out.push('');
    const haveTotal = transcript && transcript.standingTotal > 0;
    if (haveTotal) {
        const c = transcript.components;
        out.push(`- Standing total: **${fmtInt(transcript.standingTotal)} tokens**`);
        out.push(`- Source transcript: ${transcript.basename}`);
        out.push(`- Session id: ${transcript.sessionId || 'unknown'}`);
        out.push(`- Components summed (robust to warm/cold prompt cache): input ${fmtInt(c.input)} + cache_creation ${fmtInt(c.cacheCreation)} + cache_read ${fmtInt(c.cacheRead)}.`);
    } else if (located && transcript) {
        out.push(`- No standing-token total available: ${transcript.basename} was read but yielded no usable total (no main-thread assistant message with positive usage data).`);
        out.push('- Kit-owned figures below are still valid; no real total or proportion could be computed.');
    } else if (located && !transcript) {
        out.push(`- No standing-token total available: could not read the transcript at ${located.path}.`);
        out.push('- Kit-owned figures below are still valid; no real total or proportion could be computed.');
    } else {
        out.push('- No transcript was found for this project, so no real total or proportion could be computed.');
        out.push('- Kit-owned figures below are still valid on their own.');
    }
    out.push('');

    // Kit-owned breakdown.
    out.push('## Kit-owned breakdown (estimated tokens)');
    out.push('');
    out.push('### Skills');
    out.push('');
    const skillsTable = renderGroupTable('Skill', skills);
    out.push(...skillsTable.lines);
    out.push('');
    out.push('### Agents');
    out.push('');
    const agentsTable = renderGroupTable('Agent', agents);
    out.push(...agentsTable.lines);
    out.push('');
    out.push('### Shipped CLAUDE.md');
    out.push('');
    let claudeMdTokens = 0;
    if (claudeMdChars != null) {
        claudeMdTokens = toTokens(claudeMdChars);
        out.push(`- assets/CLAUDE.md: ${fmtInt(claudeMdChars)} chars (~${fmtInt(claudeMdTokens)} tokens est.)`);
    } else {
        out.push('- assets/CLAUDE.md: could not be read.');
    }
    out.push('');

    const kitOwnedTokens = skillsTable.totalTokens + agentsTable.totalTokens + claudeMdTokens;
    const kitOwnedChars = skillsTable.totalChars + agentsTable.totalChars + (claudeMdChars || 0);
    out.push(`**Kit-owned subtotal: ${fmtInt(kitOwnedChars)} chars (~${fmtInt(kitOwnedTokens)} tokens est.)**`);
    out.push('');

    // Proportion and remainder.
    out.push('## Proportion and remainder');
    out.push('');
    if (haveTotal) {
        const pct = (kitOwnedTokens / transcript.standingTotal) * 100;
        const remainder = transcript.standingTotal - kitOwnedTokens;
        out.push(`- Kit-owned slice: **${pct.toFixed(2)}%** of the standing total ((estimated kit tokens ${fmtInt(kitOwnedTokens)}) / (real total tokens ${fmtInt(transcript.standingTotal)})).`);
        out.push(`- Remainder: **${fmtInt(remainder)} tokens** = non-kit / harness tool schemas / MCP / system overhead (unattributed by size).`);
        if (transcript.mcpServers.length > 0) {
            out.push(`- Identifiable remainder contributors (connected MCP servers): ${transcript.mcpServers.join(', ')}.`);
        } else {
            out.push('- No MCP servers could be identified in the transcript.');
        }
    } else {
        out.push('- Not computed: no real standing total was available (see above).');
        if (transcript && transcript.mcpServers.length > 0) {
            out.push(`- Connected MCP servers found in the transcript: ${transcript.mcpServers.join(', ')}.`);
        }
    }
    out.push('');

    // Trim candidates.
    out.push('## Trim candidates (review only)');
    out.push('');
    out.push(`Descriptions whose char length exceeds ${OUTLIER_FACTOR}x their group's median are flagged for review. This tool edits nothing; trimming is a separate, deliberate effort.`);
    out.push('');
    const skillOut = flagOutliers(skills);
    const agentOut = flagOutliers(agents);
    out.push(`Skills (median ${fmtInt(Math.round(skillOut.median))} chars, threshold ${fmtInt(Math.round(skillOut.threshold))} chars):`);
    if (skillOut.flagged.length > 0) {
        for (const it of skillOut.flagged) {
            out.push(`- ${it.name}: ${fmtInt(it.chars)} chars (~${fmtInt(toTokens(it.chars))} tokens est.)`);
        }
    } else {
        out.push('- None.');
    }
    out.push('');
    out.push(`Agents (median ${fmtInt(Math.round(agentOut.median))} chars, threshold ${fmtInt(Math.round(agentOut.threshold))} chars):`);
    if (agentOut.flagged.length > 0) {
        for (const it of agentOut.flagged) {
            out.push(`- ${it.name}: ${fmtInt(it.chars)} chars (~${fmtInt(toTokens(it.chars))} tokens est.)`);
        }
    } else {
        out.push('- None.');
    }
    out.push('');

    return out.join('\n') + '\n';
}

function main() {
    const explicit = process.argv[2] || null;
    const cwd = process.cwd();

    const skills = measureSkills();
    const agents = measureAgents();
    const claudeMdChars = measureShippedClaudeMd();

    const located = findTranscript(explicit, cwd);
    let transcript = null;
    if (located) {
        try {
            transcript = readTranscript(located.path);
        } catch {
            transcript = null; // Never let a bad transcript throw.
        }
    }

    process.stdout.write(renderReport({ skills, agents, claudeMdChars, located, transcript, cwd }));
}

try {
    main();
} catch {
    // Never crash: the audit is a best-effort report, not a critical path.
    process.stdout.write('# Standing-Context Audit (claude-kit)\n\nThe audit could not complete due to an unexpected error.\n');
}
process.exit(0);
