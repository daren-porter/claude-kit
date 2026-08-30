#!/usr/bin/env node
// PreToolUse guard on subagent dispatch (matcher Agent|Task): the kit usage
// barrier, with the Fable ratchet riding in the same file.
//
// Two predicates in one hook because both are the same event and matcher and
// differ only in predicate and scope, so one cache read serves both and the
// precedence is explicit rather than two guards racing:
//   1. The barrier. When the operator's threshold policy says the session or
//      weekly-all-models window is at `barrier`, every subagent dispatch is
//      denied, with a reason that is by itself a sufficient instruction for an
//      unattended run to stop gracefully.
//   2. The Fable ratchet. Failing that, when the Fable-scoped weekly window is
//      at or above the ratchet, only a dispatch carrying an explicit
//      `model: "fable"` override is denied, telling the caller to re-dispatch
//      without it. An inherited Fable model on a Fable-led session carries no
//      override and is invisible here; the executing-work prose is the only
//      control there, and the reason text does not imply otherwise.
//
// PreToolUse also fires for tool calls made INSIDE subagents, and some agent
// types carry the Agent tool, so a nested dispatch can reach this hook. The
// deny stands there too (the point is to stop spending, whoever is spending),
// but the instruction changes: a subagent must not write a Chapter, must not
// arm a resume, and must not surface `BLOCKED:` to end a turn that is not the
// effort's, so a dispatch whose payload carries a subagent identity gets the
// shorter subagent forms of the same reasons.
//
// The deny is a PreToolUse permissionDecision JSON on stdout with exit 0, not
// the exit-2-plus-stderr path the kit's other PreToolUse guards use. Denying
// is deliberate rather than rewriting the call through updatedInput: the hook
// chain honors updatedInput only on an allow or an ask, never on a deny
// (confirmed against the 2.1.248 binary), so a silent model downgrade is not
// available on this path, and it would be wrong anyway: the orchestrator would
// believe it got Fable and write a Chapter saying so.
//
// No additionalContext rides with the deny, which deviates from the spec text
// on purpose. Whether additionalContext renders to the model on a DENIED tool
// call is chain-confirmed but not live-verified, so the load-bearing
// instruction belongs in the one channel a deny is guaranteed to deliver; and
// for the BARRIER the sibling wind-down hook already owns the
// additionalContext channel for the same state, so emitting it here would put
// the same instruction into one turn twice. The ratchet has no sibling
// channel at all (the nudge emits only on warn and barrier, and fableRatchet
// is never a verdict state), so its justification is self-sufficiency alone.
// permissionDecisionReason is therefore written self-sufficient,
// and kept short on purpose: the stop instruction sits at its END, so anything
// that truncates the field costs exactly the part the model needs. The longest
// branch measures 1297 characters over 11 lines with a typical reset instant
// (session barrier, reset known), and the kit budgets
// itself 2000 characters and 20 lines as prudence, not as an established
// harness bound: an earlier claim that the binary enforces those numbers was
// retracted on review (the constants are real but sit in a hook-output
// normalizer that also drops PreToolUse decisions local command hooks
// demonstrably use, so it governs a narrower path, most plausibly hooks
// forwarded from another machine).
//
// SAFETY: this is the only hook in the kit that can deny a tool call on a
// network-derived signal, and it runs unattended with nobody present to clear
// a wrong deny, so it fails OPEN everywhere. A deny requires a positive
// determination on data no older than the verdict's own staleness budget; a
// tool that is not Agent or Task, an absent or disabled config, every reader
// failure (`expired` included), stale data after the one permitted re-read,
// an unknown percent and any internal error all allow. Allowing means exit 0
// with empty stdout: an explicit permissionDecision "allow" is a positive
// approval that shortcuts the permission system (one normalizer in the binary
// drops it outright), which is not what this hook is for, so silence is how it
// allows, like every other kit guard.
//
// Nothing from the endpoint payload and nothing from tool_input crosses into
// the reason text. The only interpolated values are numbers the library
// already bounded, re-checked as finite at the emission door and rendered by
// usage-lib's shared formatOneDecimal (faithful at one decimal; the three
// rounding rules tried before it are the reproduced defects its comment
// carries), a window label from a fixed two-literal map, and a reset
// timestamp usage-lib has already validated against its anchored ISO-8601
// pattern. The agent type, the prompt and the model value the hook saw are
// never echoed.

'use strict';

const fs = require('fs');
const lib = require('./usage-lib.js');

// The fixed map from the verdict's window key to the label the reason names.
// Any other key means emit nothing at all: a label this hook cannot name is
// not a window it can instruct anyone about, and doubt allows.
const WINDOW_LABELS = {
    session: 'session (5-hour)',
    weeklyAll: 'weekly all-models',
};

function readStdin() {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// The dispatch's tool_input. The 2.1.248 binary's PreToolUse payload schema is
// literally {hook_event_name, tool_name, tool_input, tool_use_id}, so only
// tool_input can arrive from this version; toolInput and tool.input are
// defensive parity with docs-write-guard.js, which reads the same three.
function toolInput(payload) {
    const input = payload.tool_input || payload.toolInput || (payload.tool && payload.tool.input);
    return input && typeof input === 'object' ? input : {};
}

// Whether the dispatch carries an explicit Fable model override. Trimmed and
// case-insensitive, and matched as a dash-delimited token so both the alias
// ("fable") and a full model id ("claude-fable-5") count, while an
// unrecognized name that merely contains the letters never does: a false
// positive here is a wrong deny, so the match errs narrow.
function carriesFableOverride(payload) {
    const model = toolInput(payload).model;
    if (typeof model !== 'string') return false;
    return model.trim().toLowerCase().split('-').includes('fable');
}

// The CALLER's identity when this dispatch is being made from inside a
// subagent, or null for a main-session call or anything not positively
// identified. docs-write-guard.js's reader, breadth and all; the value picks
// which instruction form the deny carries and is never echoed into it.
function subagentType(payload) {
    const cand = payload.agent_type || payload.agentType || payload.subagent_type || payload.subagentType;
    return (typeof cand === 'string' && cand.trim().length) ? cand.trim() : null;
}

// A user-launched background job presents as the bare catch-all "claude"
// agent type. It is the main session of its job, not a dispatched subagent,
// so it gets the orchestrator forms (it CAN write the Chapter and arm the
// resume). Exact match only, docs-write-guard.js's exemption verbatim.
function isBackgroundMain(t) {
    return /^claude$/i.test(t);
}

// The verdict's ageSeconds against its own maxAgeSeconds: the two-pass
// staleness protocol. maxAgeSeconds is advice for the caller's NEXT read and
// ageSeconds is the age of the data THIS verdict judged, so a hook that read
// at the 600-second budget can be handed back 120 while holding older data.
// Strict less-than mirrors readUsageInner's own freshness door at whole-second
// resolution, erring stale on the boundary. A null age is never within any
// budget (evaluate's ageOf states why), which is the fail-open direction.
function withinBudget(verdict) {
    return verdict.ageSeconds !== null && verdict.ageSeconds < verdict.maxAgeSeconds;
}

// The emission door for every number in the reason text: usage-lib's shared
// formatOneDecimal, which renders faithfully at one decimal (each rounding
// direction tried before it printed one sentence whose two numbers compared
// differently than their originals; its comment carries the three reproduced
// defects) and returns null for anything that is not a finite number. The
// null answer is the second layer under evaluate's own unknown-never-trips
// guarantees: those are pinned by usage-lib's suite, and this door is what
// makes "a deny quoting a fabricated percent" impossible even if a future
// edit upstream breaks them, because Math.floor(null) is 0 and 0 reads as a
// real measurement.
function renderedOrNull(value) {
    return lib.formatOneDecimal(value);
}

function resetClause(resetsAt) {
    return resetsAt === null
        ? 'Its reset instant could not be read.'
        : 'Resetting at ' + resetsAt + '.';
}

// The resume instruction splits by horizon: a session window resets in hours,
// so a known reset instant earns a one-shot in-session resume ("or
// immediately if that instant has already passed", because a barrier can fire
// on data minutes old and normTimestamp validates shape, not futurity); the
// weekly window resets days out, so it never arms one regardless.
function resumeStep(windowKey, resetsAt) {
    if (windowKey === 'session') {
        return resetsAt === null
            ? "Do not arm a resume: this window's reset instant could not be read, and a resume needs one. Say so in the BLOCKED line so the operator knows to restart by hand."
            : 'Arm a one-shot resume: create a single scheduled job at ' + resetsAt + ", or immediately if that instant has already passed, whose prompt resumes this effort from the plan doc. That job lives in this session's memory and dies with the session, so it resumes only if this session is still open at that instant. Say in the BLOCKED line whether you armed it.";
    }
    return 'Do not arm a resume. This window resets days out, and auto-resuming unattended that far ahead is not a pause. Notify the operator that the effort is held on the weekly usage barrier, then stop.';
}

// Step 4 of the orchestrator sequence, the single home of its wording. Two
// forms by whether the reset instant validated: the null form does not demand
// the model name an instant the same text has just said was unreadable.
function blockedStep(resetsAt) {
    return resetsAt === null
        ? 'Surface a line whose very first characters are `BLOCKED:`, naming this window and its percent, and saying its reset instant could not be read, then stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.'
        : 'Surface a line whose very first characters are `BLOCKED:`, naming this window, its percent and its reset instant, and stop the turn. `BLOCKED:` must lead the message; an armed kit-goal leash releases only on that exact leading prefix and ignores one sitting mid-message.';
}

// The canonical barrier deny texts, authored in the main thread as a
// cross-hook contract; reproduce, never paraphrase. Returns null when the
// window label is outside the fixed map or the percent is not finite, both of
// which mean emit nothing at all.
// The deny reason at the WARN threshold, which is a different instruction from
// the barrier's rather than a softer wording of it. A warn means "not through a
// subagent", where a barrier means "not at all", so this text tells the caller
// to keep working in the main thread and the barrier's tells it to stop. Same
// guards as barrierReason for the same reasons; see its comments.
function windDownReason(verdict, config, nested) {
    if (typeof verdict.window !== 'string' || !Object.prototype.hasOwnProperty.call(WINDOW_LABELS, verdict.window)) return null;
    const label = WINDOW_LABELS[verdict.window];
    const percent = renderedOrNull(verdict.percent);
    if (percent === null) return null;
    // A stood-down warn is Infinity and renderedOrNull refuses it. Unreachable
    // through main, since windowState cannot report `warn` against a threshold
    // no percent can reach, but the door costs nothing and the header claims it.
    const warn = renderedOrNull(config[verdict.window].warn);
    if (warn === null) return null;
    const lead = 'Held by the kit usage wind-down: the ' + label + ' usage window is at ' + percent + '%, at or past the wind-down threshold of ' + warn + '%. ' + resetClause(verdict.resetsAt) + ' Subagent dispatch is refused until this window resets.';
    if (nested) {
        return [
            lead,
            '',
            'Do not retry this dispatch and do not reshape it. Carry on with your own work if you can do it without dispatching, and otherwise stop and return to whoever dispatched you, reporting that you stopped on the kit usage wind-down and naming this window and its percent.',
            '',
            'Do not write a Chapter, do not arm a resume, and do not surface a `BLOCKED:` line. Those belong to the session that dispatched you.',
        ].join('\n');
    }
    return [
        lead,
        '',
        'This is not a stop and it is not the barrier. Continue in the main thread on work that needs no subagent: documentation, the plan doc and its Chapters, investigation, staging.',
        '',
        "Do not retry this dispatch, and do not do this subagent's work in the main thread instead: that costs more than the dispatch saved and it lands unreviewed, because review is dispatched here too and is equally unavailable.",
        '',
        'Do not CLOSE a section that would normally take review. Finish the one in flight, stop at that boundary rather than opening another, and follow the wind-down instruction already in your context.',
    ].join('\n');
}

function barrierReason(verdict, config, nested) {
    // Own-property lookup, not a plain read: a window key like "constructor"
    // would otherwise resolve through Object.prototype and interpolate a
    // function's source into the deny reason. Unreachable today (evaluate
    // emits only the two keys), but the hook that can deny must not carry the
    // weaker guard.
    if (typeof verdict.window !== 'string' || !Object.prototype.hasOwnProperty.call(WINDOW_LABELS, verdict.window)) return null;
    const label = WINDOW_LABELS[verdict.window];
    const percent = renderedOrNull(verdict.percent);
    if (percent === null) return null;
    // The config-derived number goes through the same finite door as the
    // verdict's: the header's claim is EVERY interpolated number, and a
    // non-finite threshold is now a value the library deliberately produces
    // (a stood-down warn is Infinity), so this shape is live in the config
    // object, not hypothetical, even though readConfig keeps barriers finite
    // on every path through main today.
    const barrier = renderedOrNull(config[verdict.window].barrier);
    if (barrier === null) return null;
    const lead = 'Denied by the kit usage barrier: the ' + label + ' usage window is at ' + percent + '%, at or past the barrier of ' + barrier + '%. ' + resetClause(verdict.resetsAt) + ' Subagent dispatch is held until this window resets.';
    const close = 'This is a spend control the operator armed, not an error and not a rate limit.';
    if (nested) {
        return [
            lead,
            '',
            'Do not retry this dispatch and do not reshape it. Stop the work you are doing, stage anything already complete, and return to whoever dispatched you, reporting that you stopped on the kit usage barrier and naming this window and its percent.',
            '',
            'Do not write a Chapter, do not arm a resume, and do not surface a `BLOCKED:` line. Those belong to the session that dispatched you, and it will act on your report.',
            '',
            close,
        ].join('\n');
    }
    return [
        lead,
        '',
        "Do not retry this dispatch, do not reshape it, and do not do the subagent's work in the main thread instead. The barrier exists to stop spending, and every one of those routes around it spends more.",
        '',
        'Stop now, in this order:',
        '1. Stage whatever is already complete.',
        "2. Write the current section's Chapter in the plan doc, naming this barrier as the reason the effort stopped. If no section is in flight, or you cannot write there, record where the effort stopped and hand that back instead.",
        '3. ' + resumeStep(verdict.window, verdict.resetsAt),
        '4. ' + blockedStep(verdict.resetsAt),
        '',
        close,
    ].join('\n');
}

// The canonical ratchet deny text. Only the bookkeeping clause changes in the
// subagent form, because re-dispatching without the override is something a
// subagent can legitimately do. Returns null on a non-finite Fable percent:
// emit nothing.
function ratchetReason(verdict, config, nested) {
    const percent = renderedOrNull(verdict.fablePercent);
    if (percent === null) return null;
    // Same finite door as barrierReason's threshold, same reason.
    const ratchet = renderedOrNull(config.fableRatchet);
    if (ratchet === null) return null;
    return [
        'Held by the kit Fable ratchet: the Fable weekly window is at ' + percent + '%, at or past the ratchet of ' + ratchet + '%. ' + resetClause(verdict.fableResetsAt),
        '',
        nested
            ? 'Re-dispatch this agent without the `model: "fable"` override. It runs at the session model until that window resets, and nothing else is held: only a dispatch carrying that override is refused, and work already in flight is untouched. Report the downgrade to whoever dispatched you, naming the percent and the reset instant, rather than recording it yourself.'
            : 'Re-dispatch this agent without the `model: "fable"` override. It runs at the session model until that window resets, and nothing else is held: only a dispatch carrying that override is refused, and work already in flight is untouched. Record the downgrade in the Chapter, naming the percent and the reset instant.',
        '',
        'Nothing is paused by this. The effort continues at the session model.',
    ].join('\n');
}

function deny(reason) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason,
        },
    }));
}

async function main() {
    let payload;
    try {
        payload = JSON.parse(readStdin() || '{}');
    } catch {
        return; // unreadable payload: allow
    }
    if (!payload || typeof payload !== 'object') return;

    // The matcher the orchestrator registers is Agent|Task, but a matcher is
    // configuration and this hook is the thing that must be right, so the tool
    // name is checked here too, exactly. This session's subagent tool is named
    // Agent; Task is the name older harnesses used, kept for compatibility.
    const toolName = payload.tool_name;
    if (toolName !== 'Agent' && toolName !== 'Task') return;

    // readConfig always returns a complete normalized config, and its defaults
    // are disabled: a component that can deny a dispatch does not arm itself.
    const config = lib.readConfig();
    if (config.enabled !== true) return;

    let usage = await lib.readUsage({ maxAgeSeconds: lib.STALENESS_SECONDS });
    if (!usage || usage.ok !== true) return; // any reader failure at all: allow
    let verdict = lib.evaluate(usage, config);

    const fable = carriesFableOverride(payload);
    // Denies from the WARN threshold upward, not just at the barrier. The two
    // carry different instructions (see windDownReason) but the same mechanical
    // answer, because dispatches are the expensive thing and prose alone left
    // the saving to compliance. S9 of the plan records why the warn band stopped
    // being a stop and became a cheaper working state.
    const wouldDeny = (v) => v.state === 'barrier' || v.state === 'warn' || (v.fableRatchet === true && fable);
    if (!wouldDeny(verdict)) return;

    // The verdict would deny but judged data older than its own budget: one
    // re-read at the tighter budget, then re-decide. Exactly one, never a
    // loop; a loop here is a hook that can spin on every tool call. The bound
    // holds structurally too: a read at the tighter budget can only return
    // data younger than it, so a third pass could never learn more.
    if (!withinBudget(verdict)) {
        usage = await lib.readUsage({ maxAgeSeconds: verdict.maxAgeSeconds });
        if (!usage || usage.ok !== true) return;
        verdict = lib.evaluate(usage, config);
        if (!wouldDeny(verdict)) return;
        if (!withinBudget(verdict)) return;
    }

    // Which instruction form the deny carries. The deny itself never varies
    // by caller; only the bookkeeping instructions do (see the header).
    const callerType = subagentType(payload);
    const nested = callerType !== null && !isBackgroundMain(callerType);

    // A session-or-weekly barrier outranks the ratchet: at a barrier every
    // dispatch is denied regardless of model.
    let reason;
    if (verdict.state === 'barrier') {
        reason = barrierReason(verdict, config, nested);
    } else if (verdict.state === 'warn') {
        reason = windDownReason(verdict, config, nested);
    } else {
        reason = ratchetReason(verdict, config, nested);
    }
    if (reason !== null) deny(reason);
}

// A hook must never break a session, and this one must never wrongly hold a
// dispatch: any internal error exits 0 with no output.
(async () => {
    try { await main(); } catch { /* fail open */ }
})();
