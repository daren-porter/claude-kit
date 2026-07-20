#!/usr/bin/env node
// token-profiler.js: maintainer tool (Piece 2 of the token-efficiency work).
// Lives at repo root, OUTSIDE plugins/claude-kit/, so it is never packaged for
// kit users and adds zero standing footprint. On-demand, read-only, report to
// stdout. Not a skill/hook/command.
//
// Two layers live here. The ENGINE (Section 1) reads a session's main transcript
// and its subagent transcripts and produces per-turn cost records weighted by a
// per-model, per-token-type price table, exposed as an engine API
// (module.exports). The REPORT (Section 2) links each subagent back to the skill
// that spawned it, attributes main-thread and fan-out cost per skill, aggregates
// across the project's sessions, and renders the compact ranked report the CLI
// prints. The engine stays pure and side-effect-free; only the CLI at the bottom
// (guarded by require.main === module) reads argv and writes stdout.
//
// Transcript layout (inherited verbatim in spirit from standing-context-audit.js,
// the Piece 1 sibling; the two tools are siblings and deliberately do not share a
// module):
//   - config base search order: CLAUDE_CONFIG_DIR, then ~/.claude-work, then
//     ~/.claude; a project's transcripts live at <base>/projects/<encoded-cwd>/.
//   - the main transcript is <projectDir>/<session-id>.jsonl (main thread only).
//   - its subagent transcripts are one file per dispatched agent at
//     <projectDir>/<session-id>/subagents/agent-<agentId>.jsonl (a sibling
//     agent-<agentId>.meta.json is NOT a transcript and is skipped).
//
// Node core only, no dependencies. Defensive throughout: a missing or unreadable
// transcript or subagents dir degrades to empty arrays plus a stated note rather
// than throwing, and the CLI always exits 0.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Per-model base prices in USD per million tokens (MTok), a DATED constant
// sourced from the claude-api skill. Only input and output are stored; the cache
// rates are derived below with standard multipliers so the constant stays small
// and the derivation is transparent (and recomputable if a rate changes).
const PRICES_AS_OF = '2026-06-24';
const PRICES = {
    'claude-opus-4-8': { input: 5.00, output: 25.00 },
    // Sonnet 5 carries an intro price of $2.00/$10.00 through 2026-08-31; the
    // standard sticker ($3.00/$15.00) is used here so the durable constant does
    // not silently jump when the intro window ends.
    'claude-sonnet-5': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5': { input: 1.00, output: 5.00 }
};

// Standard Anthropic cache multipliers, relative to the model's base input price
// (confirmed against the claude-api skill's prompt-caching notes):
//   cache read  = 0.1x input, cache write (5m TTL) = 1.25x input,
//   cache write (1h TTL) = 2.0x input.
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_5M_MULT = 1.25;
const CACHE_WRITE_1H_MULT = 2.0;

// An unknown model falls back to this rate (the most expensive of the known set)
// so a cost estimate is never silently understated; the turn is flagged so the
// caller can surface the assumption.
const FALLBACK_MODEL = 'claude-opus-4-8';

// Claude Code names a project's transcript directory after the absolute cwd with
// every non-alphanumeric character replaced by a dash (so '/', '.', and other
// separators all collapse to '-'). Copied from standing-context-audit.js: the
// two sibling tools must encode cwd identically.
function encodeCwd(cwd) {
    return cwd.replace(/[^A-Za-z0-9]/g, '-');
}

// Config bases in search order, matching standing-context-audit.js.
function configBases() {
    const bases = [];
    if (process.env.CLAUDE_CONFIG_DIR) bases.push(process.env.CLAUDE_CONFIG_DIR);
    bases.push(path.join(os.homedir(), '.claude-work'));
    bases.push(path.join(os.homedir(), '.claude'));
    return bases;
}

// Candidate project transcript dirs for a cwd, one per config base, de-duplicated
// (CLAUDE_CONFIG_DIR may alias a default base). Existence is not checked here;
// callers try each in turn.
function projectDirs(cwd) {
    const encoded = encodeCwd(cwd);
    const seen = new Set();
    const dirs = [];
    for (const base of configBases()) {
        const dir = path.join(base, 'projects', encoded);
        if (seen.has(dir)) continue;
        seen.add(dir);
        dirs.push(dir);
    }
    return dirs;
}

// Newest *.jsonl (by mtime) across whichever project dir(s) exist. Returns the
// full path, or null if none is found.
function findLatestTranscript(cwd) {
    let best = null;
    for (const dir of projectDirs(cwd)) {
        let entries;
        try {
            entries = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
        } catch {
            continue; // No such project dir under this base.
        }
        for (const f of entries) {
            const full = path.join(dir, f);
            try {
                const mtime = fs.statSync(full).mtimeMs;
                if (!best || mtime > best.mtime) best = { path: full, mtime };
            } catch {
                // Unreadable entry - skip it.
            }
        }
    }
    return best ? best.path : null;
}

// Resolve the CLI/argument value to a main transcript path.
//   - A value that looks like a path (contains a separator or ends in .jsonl) is
//     used verbatim (resolved against cwd if relative).
//   - A bare session id is looked up as <projectDir>/<id>.jsonl across the bases;
//     if none exists a best-effort path under the first base is returned so the
//     caller can report a clean "not found" rather than crash.
//   - With no value, the newest transcript in the current project is used.
// Returns a path string, or null only when no default could be located.
function resolveMainTranscript(idOrPath, cwd) {
    if (idOrPath && (idOrPath.includes('/') || idOrPath.toLowerCase().endsWith('.jsonl'))) {
        return path.resolve(idOrPath);
    }
    if (idOrPath) {
        const dirs = projectDirs(cwd);
        for (const dir of dirs) {
            const candidate = path.join(dir, idOrPath + '.jsonl');
            try {
                if (fs.statSync(candidate).isFile()) return candidate;
            } catch {
                // Not under this base - try the next.
            }
        }
        return path.join(dirs[0] || cwd, idOrPath + '.jsonl');
    }
    return findLatestTranscript(cwd);
}

// Build a per-turn record from one parsed transcript entry, or null if the entry
// is not a billable turn (no message.usage) or is a meta line. agentId is set on
// subagent turns and left undefined for main-thread turns.
function parseTurn(entry, agentId) {
    if (!entry || entry.isMeta === true) return null;
    const msg = entry.message;
    if (!msg || !msg.usage) return null; // Only turns with usage are billable.
    const u = msg.usage;

    // Cache writes split by TTL. Prefer the per-TTL breakdown when present;
    // otherwise, if a flat cache_creation_input_tokens is reported, treat the
    // whole amount as the cheaper 5m tier and flag the assumption.
    let cacheWrite5m = 0;
    let cacheWrite1h = 0;
    let cacheWriteAssumed5m = false;
    if (u.cache_creation && typeof u.cache_creation === 'object') {
        cacheWrite5m = u.cache_creation.ephemeral_5m_input_tokens || 0;
        cacheWrite1h = u.cache_creation.ephemeral_1h_input_tokens || 0;
    } else if ((u.cache_creation_input_tokens || 0) > 0) {
        cacheWrite5m = u.cache_creation_input_tokens;
        cacheWriteAssumed5m = true;
    }

    const turn = {
        model: msg.model || null,
        input: u.input_tokens || 0,
        output: u.output_tokens || 0,
        cacheRead: u.cache_read_input_tokens || 0,
        cacheWrite5m,
        cacheWrite1h,
        cacheWriteAssumed5m,
        // Pass-through for Section 2's attribution. attributionSkill is top-level
        // on main-thread entries; content carries any Task/Agent dispatch
        // tool_use blocks (with subagent_type).
        attributionSkill: entry.attributionSkill || null,
        content: Array.isArray(msg.content) ? msg.content : []
    };
    if (agentId) turn.agentId = agentId;

    const resolved = resolveModelRate(turn.model, PRICES);
    turn.unknownModel = resolved.unknown;
    turn.costUSD = turnCostUSD(turn, PRICES);
    return turn;
}

// Read every billable turn from one JSONL transcript. Skips blank lines, lines
// that fail JSON.parse, meta lines, and lines without message.usage. Returns an
// array of turns, or null if the file itself could not be read (so the caller can
// distinguish "unreadable" from "read but empty").
function readTurns(filePath, agentId) {
    let text;
    try {
        text = fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
    const turns = [];
    for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        const turn = parseTurn(o, agentId);
        if (turn) turns.push(turn);
    }
    return turns;
}

// Resolve a model id to its base rate. Matching is lenient: a transcript may
// carry an exact id ('claude-opus-4-8') or a dated variant
// ('claude-haiku-4-5-20251001'); a variant resolves to its base by longest
// matching key prefix. An unrecognized model falls back to FALLBACK_MODEL's rate
// and is flagged unknown. Returns { model, rate: { input, output }, unknown }.
function resolveModelRate(model, priceTable) {
    const table = priceTable || PRICES;
    if (typeof model === 'string' && model.length > 0) {
        let bestKey = null;
        for (const key of Object.keys(table)) {
            if (model === key || model.startsWith(key)) {
                if (!bestKey || key.length > bestKey.length) bestKey = key;
            }
        }
        if (bestKey) return { model: bestKey, rate: table[bestKey], unknown: false };
    }
    const rate = table[FALLBACK_MODEL] || PRICES[FALLBACK_MODEL];
    return { model: FALLBACK_MODEL, rate, unknown: true };
}

// The pure, unit-tested cost model. Returns a turn's estimated cost in USD from
// its token components and its model's rate. Never throws; an unknown model uses
// the documented fallback rate (turn.unknownModel carries the flag).
//
//   cost = (input*inP + output*outP + cacheWrite5m*inP*1.25
//           + cacheWrite1h*inP*2.0 + cacheRead*inP*0.1) / 1e6
function turnCostUSD(turn, priceTable) {
    const { rate } = resolveModelRate(turn && turn.model, priceTable);
    const inP = rate.input;
    const outP = rate.output;
    const input = (turn && turn.input) || 0;
    const output = (turn && turn.output) || 0;
    const cacheRead = (turn && turn.cacheRead) || 0;
    const cacheWrite5m = (turn && turn.cacheWrite5m) || 0;
    const cacheWrite1h = (turn && turn.cacheWrite1h) || 0;
    return (
        input * inP
        + output * outP
        + cacheWrite5m * inP * CACHE_WRITE_5M_MULT
        + cacheWrite1h * inP * CACHE_WRITE_1H_MULT
        + cacheRead * inP * CACHE_READ_MULT
    ) / 1e6;
}

// Collect a whole session: its main transcript turns and every subagent's turns.
// idOrPath is an optional session id or transcript path; default is the newest
// transcript in the current project. Read-only; missing/unreadable inputs degrade
// to empty arrays plus notes rather than throwing.
// Returns { sessionId, mainTranscript, mainTurns, subagents: [{ agentId, turns }], notes }.
function collectSession(idOrPath) {
    const cwd = process.cwd();
    const notes = [];

    const mainTranscript = resolveMainTranscript(idOrPath || null, cwd);
    if (!mainTranscript) {
        notes.push('No session transcript found for this project.');
        return { sessionId: null, mainTranscript: null, mainTurns: [], subagents: [], notes };
    }

    const sessionId = path.basename(mainTranscript).replace(/\.jsonl$/i, '');
    const projectDir = path.dirname(mainTranscript);

    let mainTurns = readTurns(mainTranscript);
    if (mainTurns === null) {
        notes.push('Could not read main transcript: ' + mainTranscript);
        mainTurns = [];
    }

    // Subagent transcripts live under <projectDir>/<sessionId>/subagents/. Match
    // agent-<id>.jsonl only (the sibling agent-<id>.meta.json is not a transcript).
    const subagents = [];
    const subagentsDir = path.join(projectDir, sessionId, 'subagents');
    let files = [];
    try {
        files = fs.readdirSync(subagentsDir)
            .filter((f) => f.startsWith('agent-') && f.toLowerCase().endsWith('.jsonl'));
    } catch {
        // No subagents dir (a session with no fan-out, or an explicit path whose
        // sibling dir does not exist) - degrade quietly to no subagents.
    }
    for (const f of files) {
        const m = /^agent-(.+)\.jsonl$/i.exec(f);
        const agentId = m ? m[1] : f;
        let turns = readTurns(path.join(subagentsDir, f), agentId);
        if (turns === null) {
            notes.push('Could not read subagent transcript: ' + f);
            turns = [];
        }
        subagents.push({ agentId, turns });
    }
    // Deterministic order so the report's per-subagent lines are stable across runs.
    subagents.sort((a, b) => (a.agentId < b.agentId ? -1 : a.agentId > b.agentId ? 1 : 0));

    return { sessionId, mainTranscript, mainTurns, subagents, notes };
}

// Sum the per-turn USD cost of a turn array.
function sumCost(turns) {
    return turns.reduce((s, t) => s + (t.costUSD || 0), 0);
}

// ---------------------------------------------------------------------------
// SECTION 2: attribution, cross-session rollup, and the ranked report.
// ---------------------------------------------------------------------------

// The cache-read slice of a turn's cost, isolated so a skill's "accumulation"
// (the price of re-reading its accumulated context each turn) can be split out of
// its main-thread cost. Computed exactly as the cache-read term inside
// turnCostUSD, so the two stay consistent: cacheRead * inputRate * 0.1 / 1e6.
function turnCacheReadCostUSD(turn) {
    const { rate } = resolveModelRate(turn && turn.model, PRICES);
    const cacheRead = (turn && turn.cacheRead) || 0;
    return (cacheRead * rate.input * CACHE_READ_MULT) / 1e6;
}

// Dispatch map: toolUseId -> { subagentType, spawningSkill }. A dispatch is a
// tool_use block whose input.subagent_type is set; these live in billable
// assistant turns, so scanning mainTurns finds them all. spawningSkill is the
// attributionSkill of the turn that issued the dispatch (may be null).
function dispatchMap(mainTurns) {
    const map = new Map();
    for (const turn of mainTurns) {
        for (const block of turn.content) {
            if (!block || typeof block !== 'object') continue;
            if (block.type === 'tool_use' && block.input && block.input.subagent_type) {
                map.set(block.id, {
                    subagentType: block.input.subagent_type,
                    spawningSkill: turn.attributionSkill || null
                });
            }
        }
    }
    return map;
}

// The dispatch's agentId (which names the subagent file) lives in the dispatch's
// tool_result. tool_result blocks ride in user-role messages with no
// message.usage, so the engine's mainTurns (billable turns only) omits every one
// of them; the raw transcript is the only place a result block can be read. Hence
// this targeted raw pass, distinct from mainTurns. Returns toolUseId -> agentId.
const AGENT_ID_RE = /agentId[":' ]+([a-z0-9]{16,})/i;
function resultMap(mainTranscript) {
    const map = new Map();
    if (!mainTranscript) return map;
    let text;
    try {
        text = fs.readFileSync(mainTranscript, 'utf8');
    } catch {
        return map; // Missing/unreadable transcript degrades to no links.
    }
    for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        const msg = o.message;
        if (!msg || !Array.isArray(msg.content)) continue;
        for (const block of msg.content) {
            if (!block || block.type !== 'tool_result') continue;
            const s = typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '');
            const m = AGENT_ID_RE.exec(s);
            if (m && !map.has(block.tool_use_id)) map.set(block.tool_use_id, m[1]);
        }
    }
    return map;
}

// Join dispatches to results on toolUseId, keyed by agentId (the subagent file's
// name). agentId -> { subagentType, spawningSkill }. An agentId with no dispatch
// is simply absent, and its subagent gets bucketed as "unattributed" by the caller.
function joinLinkage(dispatches, results) {
    const byAgent = new Map();
    for (const [toolUseId, agentId] of results) {
        const d = dispatches.get(toolUseId);
        if (d) byAgent.set(agentId, d);
    }
    return byAgent;
}

// Strip the plugin prefix for display; a non-kit skill (e.g. "claude-api") and the
// synthetic buckets ("session base", "unattributed") are left as-is.
function shortName(name) {
    if (typeof name !== 'string') return String(name);
    return name.startsWith('claude-kit:') ? name.slice('claude-kit:'.length) : name;
}

function fmtUSD(n) {
    return '$' + (n || 0).toFixed(2);
}

// The largest of a bucket's three cost components names the lever to pull:
// accumulation (shorten sessions / reset at boundaries), skill (its own
// prompts/verbosity), or fan-out (fewer/cheaper dispatches).
function bucketComponents(bucket) {
    return [
        { label: 'accumulation', value: bucket.accumulationCost, action: 'shorten sessions or reset context at Chapter boundaries' },
        { label: 'skill', value: bucket.mainCost - bucket.accumulationCost, action: "trim the skill's own prompts and verbosity" },
        { label: 'fan-out', value: bucket.fanoutCost, action: 'reduce or cheapen its dispatches' }
    ];
}

// Bucket-aware leverage: label, cost, and advice. A real skill gets its dominant
// cost component with the matching action. The two synthetic buckets are NOT
// skills, so "trim the skill's prompts" is wrong advice for them: "session base"
// is orchestrator work outside any skill, and "unattributed" is subagents that
// could not be linked to a dispatch (no actionable skill lever).
function bucketLever(name, bucket) {
    if (name === 'session base') {
        const value = Math.max(bucket.accumulationCost, bucket.mainCost - bucket.accumulationCost, bucket.fanoutCost);
        return { label: 'orchestration', value, action: 'reduce session length and un-skilled orchestrator back-and-forth' };
    }
    if (name === 'unattributed') {
        return { label: 'unlinked', value: bucket.fanoutCost, action: 'subagents not linked to a dispatch, so not an actionable skill lever' };
    }
    const top = bucketComponents(bucket).slice().sort((a, b) => b.value - a.value)[0];
    return { label: top.label, value: top.value, action: top.action };
}

// Terse spawned-agents cell, e.g. "implementer-opus x2, adversarial-reviewer x2",
// sorted by count then name. A null type (an unattributed subagent) reads "unknown".
function fmtSpawned(spawned) {
    if (!spawned || spawned.size === 0) return '-';
    const items = [...spawned.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    return items.map(([type, n]) => shortName(type || 'unknown') + ' x' + n).join(', ');
}

// Parse argv (after the node/script tokens) into { detail, days, daysInvalid, target }.
// Supports "--days N" and "--days=N"; the first non-flag token is the single-session
// target (a session id or transcript path). Unknown flags are ignored, never fatal.
function parseArgs(argv) {
    const opts = { detail: false, days: null, daysInvalid: false, target: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--detail') {
            opts.detail = true;
        } else if (a === '--days') {
            opts.days = parseDays(argv[++i], opts);
        } else if (a.startsWith('--days=')) {
            opts.days = parseDays(a.slice('--days='.length), opts);
        } else if (a.startsWith('--')) {
            // Unknown flag: ignore to stay robust; the CLI must always exit 0.
        } else if (opts.target === null) {
            opts.target = a;
        }
    }
    return opts;
}

function parseDays(value, opts) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        opts.daysInvalid = true;
        return null;
    }
    return n;
}

// Every main *.jsonl across the project dir(s), de-duplicated by full path, each
// with its file mtime (used for the --days window and the "latest may be partial"
// note). Existence failures are skipped, never fatal.
function listProjectTranscripts(cwd) {
    const found = [];
    const seen = new Set();
    for (const dir of projectDirs(cwd)) {
        let entries;
        try { entries = fs.readdirSync(dir); } catch { continue; }
        for (const f of entries) {
            if (!f.toLowerCase().endsWith('.jsonl')) continue;
            const full = path.join(dir, f);
            if (seen.has(full)) continue;
            seen.add(full);
            let mtime = 0;
            try { mtime = fs.statSync(full).mtimeMs; } catch { continue; }
            found.push({ path: full, mtime });
        }
    }
    return found;
}

// Roll a set of collected sessions up into the per-skill buckets plus the
// per-session and per-subagent detail. Pure over its inputs (no I/O beyond the
// resultMap raw read, which is read-only). Returns everything the renderer needs.
function buildRollup(collected) {
    const skills = new Map(); // bucket name -> { mainCost, accumulationCost, fanoutCost, spawned }
    const perSession = [];
    const perSubagent = [];
    const notes = [];
    let unattributedCount = 0;
    // Estimation caveats: turns priced with the Opus fallback because their model
    // is outside the price table, and turns whose flat cache-write was assumed 5m.
    let unknownModelTurns = 0;
    let assumed5mTurns = 0;

    let latestMtime = 0;
    for (const c of collected) if (c.mtime > latestMtime) latestMtime = c.mtime;

    const bucketFor = (name) => {
        if (!skills.has(name)) {
            skills.set(name, { mainCost: 0, accumulationCost: 0, fanoutCost: 0, spawned: new Map() });
        }
        return skills.get(name);
    };

    for (const { session, mtime } of collected) {
        for (const n of session.notes) notes.push(n);
        const partial = latestMtime > 0 && mtime === latestMtime;

        let sMain = 0;
        for (const turn of session.mainTurns) {
            const name = turn.attributionSkill || 'session base';
            const b = bucketFor(name);
            const cost = turn.costUSD || 0;
            b.mainCost += cost;
            b.accumulationCost += turnCacheReadCostUSD(turn);
            sMain += cost;
            if (turn.unknownModel) unknownModelTurns++;
            if (turn.cacheWriteAssumed5m) assumed5mTurns++;
        }

        const link = joinLinkage(dispatchMap(session.mainTurns), resultMap(session.mainTranscript));
        let sFan = 0;
        for (const sub of session.subagents) {
            const fileCost = sumCost(sub.turns);
            sFan += fileCost;
            for (const t of sub.turns) {
                if (t.unknownModel) unknownModelTurns++;
                if (t.cacheWriteAssumed5m) assumed5mTurns++;
            }
            const info = link.get(sub.agentId);
            let name, subagentType;
            if (info) {
                name = info.spawningSkill || 'session base';
                subagentType = info.subagentType;
            } else {
                name = 'unattributed';
                subagentType = null;
                unattributedCount++;
            }
            const b = bucketFor(name);
            b.fanoutCost += fileCost;
            b.spawned.set(subagentType || 'unknown', (b.spawned.get(subagentType || 'unknown') || 0) + 1);
            perSubagent.push({
                sessionId: session.sessionId,
                agentId: sub.agentId,
                subagentType,
                attributedTo: name,
                cost: fileCost
            });
        }

        perSession.push({
            sessionId: session.sessionId,
            total: sMain + sFan,
            mainCost: sMain,
            fanoutCost: sFan,
            partial
        });
    }

    let totalMain = 0;
    let totalFan = 0;
    for (const b of skills.values()) { totalMain += b.mainCost; totalFan += b.fanoutCost; }

    // The single biggest lever: the bucket whose dominant component costs the most,
    // with bucket-appropriate wording (synthetic buckets are not skills).
    let lever = null;
    for (const [name, b] of skills) {
        const bl = bucketLever(name, b);
        if (!lever || bl.value > lever.value) {
            lever = { skill: name, label: bl.label, value: bl.value, action: bl.action };
        }
    }

    return {
        skills, perSession, perSubagent, notes, unattributedCount,
        unknownModelTurns, assumed5mTurns,
        totalMain, totalFan, grand: totalMain + totalFan,
        leverSkill: lever ? lever.skill : '',
        leverLabel: lever ? lever.label : '',
        leverValue: lever ? lever.value : 0,
        leverAction: lever ? lever.action : ''
    };
}

// Gather the sessions to profile from parsed options. A positional target profiles
// exactly that session; otherwise every project transcript, optionally within the
// --days window, oldest first (so the newest, possibly-partial one reads last).
function gatherSessions(opts) {
    const collected = [];
    if (opts.target) {
        const session = collectSession(opts.target);
        let mtime = 0;
        try { if (session.mainTranscript) mtime = fs.statSync(session.mainTranscript).mtimeMs; } catch { /* keep 0 */ }
        collected.push({ session, mtime });
        return collected;
    }
    let files = listProjectTranscripts(process.cwd());
    if (opts.days) {
        const cutoff = Date.now() - opts.days * 86400000;
        files = files.filter((f) => f.mtime >= cutoff);
    }
    files.sort((a, b) => a.mtime - b.mtime);
    for (const f of files) collected.push({ session: collectSession(f.path), mtime: f.mtime });
    return collected;
}

// Render the report to a string. Compact by default; opts.detail appends the
// per-session and per-subagent breakdowns after the summary.
function renderReport(opts, collected, roll) {
    const L = [];
    const pct = (part) => (roll.grand > 0 ? Math.round((part / roll.grand) * 100) : 0);

    // 1. Header: cost model, the accumulation-signal and partial-session caveats,
    // and how many sessions were aggregated.
    L.push('# token-profiler');
    L.push('Estimated USD cost from transcript usage; prices as of ' + PRICES_AS_OF + '.');
    L.push('Cache-read cost is the accumulation signal (context re-read each turn, billed at ~10% of a fresh token).');
    L.push('The latest session may be in progress, so its totals can be partial.');
    L.push('Aggregated ' + collected.length + ' session(s)' + (opts.target ? ' (single-session mode).' : ' from the current project.'));
    if (roll.unattributedCount > 0) {
        L.push(roll.unattributedCount + ' subagent file(s) could not be linked to a dispatch; bucketed as "unattributed".');
    }
    if (opts.daysInvalid) L.push('Ignored --days (expected a positive number of days).');

    // Estimation caveats: surface the two "computed but otherwise silent"
    // assumptions so a reader knows when a figure rests on a fallback.
    if (roll.unknownModelTurns > 0 || roll.assumed5mTurns > 0) {
        L.push('Estimation caveats:');
        if (roll.unknownModelTurns > 0) {
            L.push('- ' + roll.unknownModelTurns + ' turn(s) used a model outside the price table, priced at the Opus fallback rate.');
        }
        if (roll.assumed5mTurns > 0) {
            L.push('- ' + roll.assumed5mTurns + ' turn(s) reported a flat cache-write with no TTL, assumed to be the cheaper 5m tier.');
        }
    }

    // Dedup and surface any read notes (e.g. a missing transcript) tersely.
    const seenNotes = new Set();
    for (const n of roll.notes) {
        if (seenNotes.has(n)) continue;
        seenNotes.add(n);
        L.push('note: ' + n);
    }
    L.push('');

    if (roll.skills.size === 0 || roll.grand === 0) {
        L.push('No billable turns found in the selected session(s). Nothing to rank.');
        L.push('');
        L.push('This tool edits nothing and reads transcripts only; all figures are estimates.');
        return L.join('\n') + '\n';
    }

    // 2. Summary first: total, the main-vs-fan-out split, the single biggest lever.
    L.push('## Summary');
    L.push('Total estimated cost: ' + fmtUSD(roll.grand) + '.');
    L.push('Main thread ' + fmtUSD(roll.totalMain) + ' (' + pct(roll.totalMain) + '%) vs fan-out '
        + fmtUSD(roll.totalFan) + ' (' + pct(roll.totalFan) + '%).');
    L.push('Biggest lever: ' + shortName(roll.leverSkill) + ' ' + roll.leverLabel + ' ('
        + fmtUSD(roll.leverValue) + '). Action: ' + roll.leverAction + '.');
    L.push('');

    // --detail: per-session and per-subagent breakdowns, kept behind the flag so
    // the default stays small enough to paste back to Claude cheaply.
    if (opts.detail) {
        L.push('## Per-session');
        L.push('| Session | Total $ | main $ | fan-out $ | partial |');
        L.push('|---|---|---|---|---|');
        const sessRows = roll.perSession.slice().sort((a, b) => b.total - a.total);
        for (const s of sessRows) {
            L.push('| ' + (s.sessionId || 'none') + ' | ' + fmtUSD(s.total) + ' | ' + fmtUSD(s.mainCost)
                + ' | ' + fmtUSD(s.fanoutCost) + ' | ' + (s.partial ? 'yes' : '-') + ' |');
        }
        L.push('');
        L.push('## Per-subagent');
        L.push('| Session | agentId | subagent type | attributed to | $ |');
        L.push('|---|---|---|---|---|');
        const subRows = roll.perSubagent.slice().sort((a, b) => b.cost - a.cost);
        for (const s of subRows) {
            L.push('| ' + (s.sessionId || 'none') + ' | ' + s.agentId + ' | '
                + (s.subagentType ? shortName(s.subagentType) : '-') + ' | '
                + shortName(s.attributedTo) + ' | ' + fmtUSD(s.cost) + ' |');
        }
        L.push('');
    }

    // 3. Ranked per-skill table, highest total cost first.
    L.push('## Skills and processes by total cost');
    L.push('| Skill/Process | Total $ | main $ | fan-out $ | leverage | spawned |');
    L.push('|---|---|---|---|---|---|');
    const ranked = [...roll.skills.entries()]
        .map(([name, b]) => ({ name, b, total: b.mainCost + b.fanoutCost }))
        .sort((a, b) => b.total - a.total);
    for (const r of ranked) {
        L.push('| ' + shortName(r.name) + ' | ' + fmtUSD(r.total) + ' | ' + fmtUSD(r.b.mainCost)
            + ' | ' + fmtUSD(r.b.fanoutCost) + ' | ' + bucketLever(r.name, r.b).label + ' | ' + fmtSpawned(r.b.spawned) + ' |');
    }
    L.push('');

    // 4. Read-only, estimate-only disclaimer.
    L.push('This tool edits nothing and reads transcripts only; all figures are estimates.');
    return L.join('\n') + '\n';
}

function main() {
    const opts = parseArgs(process.argv.slice(2));
    const collected = gatherSessions(opts);
    const roll = buildRollup(collected);
    process.stdout.write(renderReport(opts, collected, roll));
}

// Exports for the durable unit test only. Section 2 lives in this same file and
// calls the engine functions directly, so nothing else needs to be exported.
module.exports = {
    turnCostUSD,
    resolveModelRate,
    PRICES
};

// Render the report only when invoked directly, never when required as a module
// (the unit test imports this file).
if (require.main === module) {
    try {
        main();
    } catch {
        // Never crash: the report is best-effort and the CLI always exits 0.
        process.stdout.write('token-profiler: could not render the report.\n');
    }
    process.exit(0);
}
