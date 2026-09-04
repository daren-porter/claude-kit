// Tests for plugins/claude-kit/hooks/kit-goal-stop.js (the goal-leash Stop hook).
//
// Node's built-in test runner, no framework. The hook is spawned as a real child
// process, fed a Stop payload on stdin, and asserted on by its stdout: a block
// emits {"decision":"block", reason}; an allow emits nothing. Each case builds a
// fresh temp cwd (with its own .kit/goal-state.json and a fake JSONL transcript)
// and cleans that state up in a finally block.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'claude-kit', 'hooks', 'kit-goal-stop.js');
const { armGoal, bindSession } = require('../plugins/claude-kit/hooks/kit-goal-lib.js');

function makeDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmDir(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

function writeFile(full, contents) {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, 'utf8');
}

// Build a JSONL transcript from an array of assistant text turns. Each turn
// becomes one assistant line with a single text content block; a genuine
// arming-invocation user line (the plan path inside a <command-args> span) is
// prepended so the scoping predicate claims this session, matching the real
// shape the /kit-goal skill produces.
function writeTranscript(full, planRel, assistantTexts) {
    const lines = [];
    lines.push(JSON.stringify({
        type: 'user',
        message: {
            role: 'user',
            content: '<command-name>/kit-goal</command-name>\n            '
                + '<command-message>kit-goal</command-message>\n            '
                + '<command-args>' + planRel + '</command-args>'
        }
    }));
    for (const t of assistantTexts) {
        lines.push(JSON.stringify({
            type: 'assistant',
            message: { role: 'assistant', content: [{ type: 'text', text: t }] }
        }));
    }
    writeFile(full, lines.join('\n') + '\n');
}

// Run the hook with the given payload. Returns the spawnSync result (stdout,
// stderr, status). Clause-(b) retries are disabled by default so block-path
// tests stay fast and an ambient KIT_GOAL_STOP_RETRY_MS cannot warp the suite's
// timing; pass extraEnv to exercise a real schedule.
function runHook(payload, extraEnv) {
    const env = { ...process.env, KIT_GOAL_STOP_RETRY_MS: '0', ...(extraEnv || {}) };
    return spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify(payload),
        env,
        encoding: 'utf8'
    });
}

// Arm a goal in a fresh repo with an In-Progress plan, and lay down a transcript
// that references the plan. Returns { repo, planRel, transcript }.
function armedRepo(assistantTexts, planStatus) {
    const repo = makeDir('kit-goal-stop-repo-');
    const planRel = 'docs/plans/example.md';
    const planFull = path.join(repo, planRel);
    // Arm against an In-Progress plan (armGoal refuses a Complete one), then
    // rewrite the plan header to the requested status so the hook's clause-(a)
    // check sees the intended live state.
    writeFile(planFull, 'Status: In Progress\n\nbody\n');
    const armed = armGoal(repo, planRel);
    assert.strictEqual(armed.ok, true, 'test setup: goal should arm');
    if (planStatus && planStatus !== 'Status: In Progress') {
        writeFile(planFull, planStatus + '\n\nbody\n');
    }
    const transcript = path.join(repo, 'transcript.jsonl');
    writeTranscript(transcript, planRel, assistantTexts || ['Working on it.']);
    return { repo, planRel, transcript };
}

function readBoundSession(repo) {
    return JSON.parse(fs.readFileSync(path.join(repo, '.kit', 'goal-state.json'), 'utf8')).boundSession;
}

test('no goal armed: empty stdout (allow)', () => {
    const repo = makeDir('kit-goal-stop-repo-');
    try {
        const transcript = path.join(repo, 'transcript.jsonl');
        writeTranscript(transcript, 'docs/plans/example.md', ['Working.']);
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('goal armed, transcript names plan, In Progress, no BLOCKED: block', () => {
    const { repo, planRel, transcript } = armedRepo(['Making progress.']);
    try {
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.status, 0);
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block');
        assert.ok(out.reason.includes(path.basename(planRel)), 'reason names the plan basename');
        assert.ok(out.reason.includes('/kit-goal clear'), 'reason names the way out');
        assert.ok(!/relay/i.test(out.reason), 'the two-clause reason carries no relay wording');
    } finally {
        rmDir(repo);
    }
});

test('goal armed but transcript does NOT name the plan: empty stdout (scoping allow)', () => {
    const { repo } = armedRepo(['Making progress.']);
    try {
        const other = path.join(repo, 'unrelated.jsonl');
        writeFile(other, JSON.stringify({
            type: 'assistant',
            message: { role: 'assistant', content: [{ type: 'text', text: 'Different work entirely.' }] }
        }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: other });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('goal armed, plan Status: Complete: empty stdout AND goal auto-cleared', () => {
    const { repo, transcript } = armedRepo(['Done all sections.'], 'Status: Complete');
    try {
        assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'setup: goal armed');
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
        assert.ok(!fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'goal auto-cleared on Complete');
    } finally {
        rmDir(repo);
    }
});

test('goal armed, plan file deleted (archived): empty stdout AND goal auto-cleared', () => {
    const { repo, planRel, transcript } = armedRepo(['Still going.']);
    try {
        fs.rmSync(path.join(repo, planRel));
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
        assert.ok(!fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'goal auto-cleared when plan is gone');
    } finally {
        rmDir(repo);
    }
});

test('goal armed, plan momentarily unreadable (not ENOENT): allow but keep the leash armed',
    { skip: process.platform === 'win32' ? 'POSIX permission-denial fixture' : false }, () => {
        // planHead reports exists:false on ANY open failure, so a transient read
        // error must not be mistaken for an archived plan: allow this stop, but
        // leave the goal armed so a filesystem hiccup cannot permanently disarm
        // the run (only a true ENOENT means archived).
        const { repo, planRel, transcript } = armedRepo(['Still going.']);
        const planFull = path.join(repo, planRel);
        try {
            fs.chmodSync(planFull, 0o000);
            const res = runHook({ cwd: repo, transcript_path: transcript });
            assert.strictEqual(res.stdout, '', 'an indeterminate plan read allows the stop');
            assert.strictEqual(res.status, 0);
            assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')),
                'a transient plan-read error must NOT disarm the goal');
        } finally {
            try { fs.chmodSync(planFull, 0o600); } catch { /* already gone */ }
            rmDir(repo);
        }
    });

test('goal armed, last assistant turn leads with BLOCKED: empty stdout (allow); only the last turn counts', () => {
    // An earlier turn without BLOCKED proves the scan reads the LAST assistant
    // turn, not the first match.
    const { repo, transcript } = armedRepo([
        'Investigating the failure.',
        'BLOCKED: this needs a decision only the user can make.'
    ]);
    try {
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('goal armed, an EARLIER turn had BLOCKED but the last did not: block (only the last counts)', () => {
    const { repo, transcript } = armedRepo([
        'BLOCKED: was blocked earlier.',
        'Now unblocked and back to work.'
    ]);
    try {
        const res = runHook({ cwd: repo, transcript_path: transcript });
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block');
    } finally {
        rmDir(repo);
    }
});

test('self-injection: plan named only in a hook attachment or tool_result does NOT leash: allow', () => {
    // The scoping guard's worst case: session-start surfacing injects the armed
    // plan path into EVERY session's transcript as a hook_additional_context
    // attachment. An unrelated session whose genuine user/assistant text never
    // names the plan must not be leashed by that self-injection (or by a
    // tool_result that merely echoes the path).
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'unrelated-session.jsonl');
        // The real SessionStart injection is a top-level type:"attachment" with
        // the plan path nested in attachment.stdout (attachment.type
        // "hook_success"); mirror that shape so the fixture pins the real carrier.
        const lines = [
            JSON.stringify({ type: 'user', message: { role: 'user', content: 'Fix the CSS on the login page.' } }),
            JSON.stringify({ type: 'attachment', attachment: { type: 'hook_success', stdout: 'A kit goal is armed for ' + planRel + ' in this project.' } }),
            JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'grep hit: ' + planRel }] } }),
            JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'The login CSS is fixed.' }] } })
        ];
        writeFile(tx, lines.join('\n') + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx });
        assert.strictEqual(res.stdout, '', 'an unrelated session must not be leashed by the self-injected plan name');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('assistant text alone naming the plan does NOT leash: allow', () => {
    // The scoping predicate reads genuine USER-side command-args text only, so
    // an assistant echo of the plan path (e.g. quoting the session-start goal
    // surfacing back to the user) must never bind the leash.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'assistant-echo.jsonl');
        const lines = [
            JSON.stringify({ type: 'user', message: { role: 'user', content: 'Help me with an unrelated task.' } }),
            JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'A kit goal is armed for ' + planRel + ' in this project.' }] } })
        ];
        writeFile(tx, lines.join('\n') + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander-sess' });
        assert.strictEqual(res.stdout, '', 'an assistant self-quote of the plan path must not leash the session');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('scoping matches the full plan path, not just the basename: a same-name file in another dir does not leash', () => {
    const { repo } = armedRepo(['unused']); // goal armed for docs/plans/example.md
    try {
        const tx = path.join(repo, 'other-example.jsonl');
        // Genuine user/assistant text names docs/archive/example.md (same basename,
        // different dir) but never the armed docs/plans/example.md.
        const lines = [
            JSON.stringify({ type: 'user', message: { role: 'user', content: 'Review docs/archive/example.md for me.' } }),
            JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Reviewed docs/archive/example.md; looks fine.' }] } })
        ];
        writeFile(tx, lines.join('\n') + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx });
        assert.strictEqual(res.stdout, '', 'a same-basename file in another directory must not leash the session');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('unbound goal, a plain prose mention of the plan does NOT claim: allow, still unbound', () => {
    // A bystander that merely types or discusses the plan path in ordinary
    // prose (not as a slash-command argument) must not steal the binding: only
    // the genuine arming invocation (see the command-args test below) claims.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'prose-mention.jsonl');
        writeFile(tx, JSON.stringify({
            type: 'user',
            message: { role: 'user', content: 'Please work ' + planRel + ' to completion.' }
        }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'sess-bystander' });
        assert.strictEqual(res.stdout, '', 'a plain prose mention must not claim the binding');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

test('bound to ANOTHER session: allow, even for a session carrying the arming claim, and the binding is untouched', () => {
    // The goal binds to exactly one session and nothing transfers that leash to
    // another: a session that is not the bound one is allowed outright, before
    // any enforcement clause is consulted, even though this transcript carries
    // the arming invocation (armedRepo writes one) and names the plan repeatedly.
    // Re-arming from the session that should hold the leash is the documented
    // recovery when the bound session dies.
    const { repo, transcript } = armedRepo(['Working hard, mentioning docs/plans/example.md often.']);
    try {
        assert.strictEqual(bindSession(repo, 'sess-owner').ok, true);
        const res = runHook({ cwd: repo, transcript_path: transcript, session_id: 'sess-bystander' });
        assert.strictEqual(res.stdout, '', 'only the bound session is leashed');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), 'sess-owner', 'the bystander neither steals nor rewrites the binding');
    } finally {
        rmDir(repo);
    }
});

test('bound to this session (case-insensitive): a non-BLOCKED turn still blocks (a case-sensitive compare would misread this as a bystander and allow)', () => {
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        assert.strictEqual(bindSession(repo, 'sess-me').ok, true);
        // The stopping session_id differs only in case from the bound value. A
        // case-sensitive compare would fail to recognize it as the bound session,
        // fall through to "some other session", and allow (empty stdout) - the
        // same outcome a correct compare produces on a genuine BLOCKED lead, which
        // is why that shape cannot tell the two implementations apart. A non-
        // BLOCKED last turn can: only the correct case-insensitive match reaches
        // enforcement and blocks.
        const res = runHook({ cwd: repo, transcript_path: transcript, session_id: 'SESS-ME' });
        assert.strictEqual(res.status, 0);
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'the case-differing bound session is still enforced');
    } finally {
        rmDir(repo);
    }
});

test('the /kit-goal arming invocation (command-args) binds the leash and enforces', () => {
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'arming.jsonl');
        // Real slash-command invocation shape: a user entry whose string content
        // carries <command-name>/<command-args>; the plan path the user typed as
        // the argument is the deliberate arming signal.
        const invocation = '<command-name>/kit-goal</command-name>\n            '
            + '<command-message>kit-goal</command-message>\n            '
            + '<command-args>' + planRel + '</command-args>';
        writeFile(tx, JSON.stringify({ type: 'user', message: { role: 'user', content: invocation } }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'arming-sess' });
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'the arming invocation leashes and enforces');
        assert.strictEqual(readBoundSession(repo), 'arming-sess');
    } finally {
        rmDir(repo);
    }
});

test('a non-kit-goal command (/graphify) carrying the plan path in its args does NOT claim: allow', () => {
    // /graphify legitimately takes a path argument; a plan path in ITS
    // command-args must not steal the binding from the arming session. Only a
    // kit-goal invocation's command-args counts as an arming claim.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'graphify.jsonl');
        writeFile(tx, JSON.stringify({
            type: 'user', isSidechain: false,
            message: {
                role: 'user',
                content: '<command-message>graphify</command-message>\n'
                    + '<command-name>/graphify</command-name>\n'
                    + '<command-args>' + planRel + '</command-args>'
            }
        }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'graphify-sess' });
        assert.strictEqual(res.stdout, '', 'a non-kit-goal command must not claim the binding');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

test('the real namespaced /kit-goal arming record (backtick-wrapped args) binds the leash', () => {
    const repo = makeDir('kit-goal-stop-repo-');
    const planRel = 'docs/plans/kit-goal-port_spec_v1.md';
    try {
        writeFile(path.join(repo, planRel), 'Status: In Progress\n\nbody\n');
        assert.strictEqual(armGoal(repo, planRel).ok, true);
        const tx = path.join(repo, 'arming.jsonl');
        // Verbatim real arming record: namespaced command-name (/claude-kit:kit-goal),
        // no isMeta field, backtick-wrapped args value. The substring match tolerates
        // the backticks, and the command-name gate accepts the ':kit-goal' suffix.
        writeFile(tx, JSON.stringify({
            type: 'user', isSidechain: false,
            message: {
                role: 'user',
                content: '<command-message>claude-kit:kit-goal</command-message>\n'
                    + '<command-name>/claude-kit:kit-goal</command-name>\n'
                    + '<command-args>`' + planRel + '`</command-args>'
            }
        }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'arming-sess' });
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'the namespaced arming invocation leashes and enforces');
        assert.strictEqual(readBoundSession(repo), 'arming-sess');
    } finally {
        rmDir(repo);
    }
});

test('a local-command-stdout echoing the plan path does NOT bind (a /kit-goal status check in a bystander)', () => {
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'status.jsonl');
        // Real /kit-goal status flow: the user types `status` (no plan path in the
        // args), and the CLI echoes the armed plan path back inside a
        // <local-command-stdout> block. That echo is the CLI's own output, not
        // user-typed text, so a bystander that merely checked status must not bind.
        const lines = [
            JSON.stringify({ type: 'user', message: { role: 'user', content: 'Look at the login page.' } }),
            JSON.stringify({ type: 'user', message: { role: 'user', content: '<command-name>/kit-goal</command-name>\n            <command-args>status</command-args>' } }),
            JSON.stringify({ type: 'user', message: { role: 'user', content: '<local-command-stdout>kit goal armed for ' + planRel + ' (armed 2026-07-16T00:00:00.000Z; unbound)</local-command-stdout>' } })
        ];
        writeFile(tx, lines.join('\n') + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander' });
        assert.strictEqual(res.stdout, '', 'a status echo of the plan path must not leash a bystander');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('isMeta stop-hook feedback carrying a command-args-wrapped plan path does NOT claim', () => {
    // Real shape: this hook's own block reason names the plan path in full, and
    // the harness replays a denied stop back into the transcript as an isMeta
    // user entry ("Stop hook feedback: ..."). That entry can end up containing
    // text that reads exactly like a genuine <command-args> claim; isMeta must
    // win regardless, since none of it is something the user typed.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'stop-feedback.jsonl');
        const feedback = 'Stop hook feedback:\n[Implement `<command-name>/kit-goal</command-name>'
            + '<command-args>' + planRel + '</command-args>` and continue.]';
        writeFile(tx, JSON.stringify({
            type: 'user',
            isMeta: true,
            message: { role: 'user', content: feedback }
        }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander-fed-back' });
        assert.strictEqual(res.stdout, '', 'an isMeta entry must not claim even when it carries a command-args-shaped span');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

test('a stray closing tag of a different name inside local-command output does not leave a fake command-args claimable', () => {
    // Realistic in this very repo: a user cats or greps a file whose content
    // includes literal tag-like text (e.g. a fixture in this test suite). The
    // CLI echoes that content inside <local-command-stdout>, which coincidentally
    // contains a mismatched closing tag before the block's true close, followed
    // by an embedded fake <command-args> wrapping the real plan path. The strip
    // must follow the backreferenced close (skipping the stray mismatched one)
    // to the true </local-command-stdout>, removing the whole block, so the
    // embedded fake claim never surfaces as ordinary user text.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'stray-tag.jsonl');
        const content = '<local-command-stdout>noise before </local-command-caveat> '
            + '<command-args>' + planRel + '</command-args> more noise</local-command-stdout> '
            + 'Genuine unrelated user text.';
        writeFile(tx, JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander-cat' });
        assert.strictEqual(res.stdout, '', 'the embedded fake command-args inside CLI-echoed output must not claim');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

test('an unclosed local-command opener (a truncated CLI echo) is stripped to end-of-text and cannot claim', () => {
    // No closing tag anywhere: a truncated echo (cut by the transcript read cap,
    // or caught mid-write). Without the unclosed-opener fallback, the embedded
    // command-args-shaped text would never be stripped and would read as a
    // genuine claim.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'unclosed.jsonl');
        const content = '<local-command-stdout>truncated echo showing '
            + '<command-args>' + planRel + '</command-args> partial output cut off';
        writeFile(tx, JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander-trunc' });
        assert.strictEqual(res.stdout, '', 'an unclosed opener\'s content must not claim');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

test('an embedded same-name close tag inside CLI output cannot expose a following fake kit-goal claim', () => {
    // The one strip failure mode that errs toward CLAIMING: echoed stdout (e.g. a
    // catted transcript) embeds a literal </local-command-stdout>, then a fake
    // kit-goal command-name plus command-args naming the plan, before the block's
    // true close. A lazy strip would stop at the embedded close and leave the fake
    // claim exposed; the greedy strip runs to the LAST same-name close, removing
    // the whole block so nothing between the opener and its final close survives.
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'embedded-close.jsonl');
        const content = '<local-command-stdout>cat transcript: </local-command-stdout>'
            + '<command-name>/kit-goal</command-name><command-args>' + planRel + '</command-args>'
            + ' end of cat</local-command-stdout> Genuine unrelated text.';
        writeFile(tx, JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx, session_id: 'bystander-cat' });
        assert.strictEqual(res.stdout, '', 'an embedded close tag must not expose a following fake command-args claim');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), null, 'the goal stays unbound');
    } finally {
        rmDir(repo);
    }
});

// Spawn the hook and, before writing its stdin, synchronously occupy the exact
// tmp path bindSession will try to write to (goal-state.json.tmp.<the child's
// own pid>) with a directory, so that specific write fails. readStdin() blocks
// the child on a synchronous read until stdin is written and closed, so the
// child cannot reach its write step before this obstruction is in place: this
// is deterministic, not timing-dependent, and (unlike a bare spawnSync, whose
// pid is only known after the child has already finished) works because
// spawn() exposes the child's pid immediately.
function runHookForcingBindWriteFailure(repo, payload, extraEnv) {
    const env = { ...process.env, KIT_GOAL_STOP_RETRY_MS: '0', ...(extraEnv || {}) };
    const child = spawn(process.execPath, [HOOK], { env });
    fs.mkdirSync(path.join(repo, '.kit', 'goal-state.json.tmp.' + child.pid), { recursive: true });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    const closed = new Promise((resolve) => child.on('close', (status) => resolve(status)));
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
    return closed.then((status) => ({ stdout, status }));
}

test('a bind write failure still enforces that stop (fail-open on persistence, not enforcement)', async () => {
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        // The goal-state.json itself is still readable (unbound), so the session
        // resolves via the arming-invocation claim and must still be enforced.
        const res = await runHookForcingBindWriteFailure(
            repo, { cwd: repo, transcript_path: transcript, session_id: 'sess-x' });
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'enforcement proceeds even when the bind write fails');
        assert.strictEqual(readBoundSession(repo), null, 'the failed bind did not persist');
    } finally {
        rmDir(repo);
    }
});

test('a sidechain (sub-agent) BLOCKED turn does not count; the last main-thread turn decides: block', () => {
    const { repo, planRel } = armedRepo(['unused']);
    try {
        const tx = path.join(repo, 'sidechain.jsonl');
        const lines = [
            JSON.stringify({ type: 'user', message: { role: 'user', content: '<command-name>/kit-goal</command-name><command-args>' + planRel + '</command-args>' } }),
            JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Dispatching a reviewer.' }] } }),
            JSON.stringify({ type: 'assistant', isSidechain: true, message: { role: 'assistant', content: [{ type: 'text', text: 'BLOCKED: the sub-agent is blocked.' }] } })
        ];
        writeFile(tx, lines.join('\n') + '\n');
        const res = runHook({ cwd: repo, transcript_path: tx });
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'a sidechain BLOCKED must not release the main-thread leash');
    } finally {
        rmDir(repo);
    }
});

test('stop_hook_active true: still blocks (the leash re-evaluates every stop attempt)', () => {
    // The harness's own consecutive-block cap (CLAUDE_CODE_STOP_HOOK_BLOCK_CAP)
    // is the loop backstop; the hook itself must keep holding inside a stop
    // continuation, or the leash is one-shot per turn.
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        const res = runHook({ cwd: repo, transcript_path: transcript, stop_hook_active: true });
        assert.strictEqual(res.status, 0);
        const out = JSON.parse(res.stdout);
        assert.strictEqual(out.decision, 'block', 'a stop-hook continuation must not release the leash');
    } finally {
        rmDir(repo);
    }
});

test('a mid-append partial final line makes the last turn indeterminate: allow', () => {
    // The harness appends the turn's final entries (assistant text, stop-time
    // metadata) around the same moment the Stop hook runs. A read that lands
    // mid-append sees a truncated JSON fragment as the last line; the last turn
    // is then indeterminate and the stop must be allowed, not answered from the
    // previous turn's text. The file is far below the 1MB tail cap, so this
    // exercises the mid-write guard, not the cap-truncation guard.
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        fs.appendFileSync(transcript,
            '{"type":"assistant","message":{"role":"assistant","content":[{"type":"te');
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '', 'a mid-write tail must be indeterminate (allow), not read as the prior turn');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('clause (b) tolerates the stop-time flush race: a BLOCKED entry landing just after the stop still allows', async () => {
    // Live-observed race: the hook can evaluate before the harness's append of
    // the final assistant text entry is readable, so a genuine 'BLOCKED:' exit
    // was answered from the previous turn and blocked. The hook re-reads after
    // a short delay; an entry that lands inside that window must be honored.
    // Probabilistic pin: if child spawn plus first read ever exceeds the 250ms
    // append delay, the first read already sees the entry and the retry path is
    // not exercised that run; the test can green vacuously on a slow machine
    // but can never falsely fail (any ordering yields an allow).
    const { repo, transcript } = armedRepo(['Working; about to surface a blocker.']);
    try {
        const env = { ...process.env, KIT_GOAL_STOP_RETRY_MS: '900' };
        const child = spawn(process.execPath, [HOOK], { env });
        let stdout = '';
        child.stdout.on('data', (d) => { stdout += d; });
        const closed = new Promise((resolve) => child.on('close', resolve));
        child.stdin.write(JSON.stringify({ cwd: repo, transcript_path: transcript }));
        child.stdin.end();
        // Land the BLOCKED entry after the hook's first read, inside its retry window.
        await new Promise((resolve) => setTimeout(resolve, 250));
        fs.appendFileSync(transcript, JSON.stringify({
            type: 'assistant',
            message: { role: 'assistant', content: [{ type: 'text', text: 'BLOCKED: needs a supervised step.' }] }
        }) + '\n');
        await closed;
        assert.strictEqual(stdout, '', 'the late-landing BLOCKED entry must be seen by the clause-(b) re-read');
    } finally {
        rmDir(repo);
    }
});

test('a partial final line that completes into a non-BLOCKED entry inside the retry window: block', async () => {
    // The other half of the mid-append guard: a partial tail is retried, not
    // allowed on first sighting, so when the in-flight append resolves to an
    // ordinary (non-BLOCKED) turn inside the window, the leash correctly holds.
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        const full = JSON.stringify({
            type: 'assistant',
            message: { role: 'assistant', content: [{ type: 'text', text: 'Just progress, not a blocker.' }] }
        });
        fs.appendFileSync(transcript, full.slice(0, 40));
        const env = { ...process.env, KIT_GOAL_STOP_RETRY_MS: '900' };
        const child = spawn(process.execPath, [HOOK], { env });
        let stdout = '';
        child.stdout.on('data', (d) => { stdout += d; });
        const closed = new Promise((resolve) => child.on('close', resolve));
        child.stdin.write(JSON.stringify({ cwd: repo, transcript_path: transcript }));
        child.stdin.end();
        // Complete the in-flight entry inside the hook's retry window.
        await new Promise((resolve) => setTimeout(resolve, 250));
        fs.appendFileSync(transcript, full.slice(40) + '\n');
        await closed;
        const out = JSON.parse(stdout);
        assert.strictEqual(out.decision, 'block', 'a partial tail resolving to a non-BLOCKED turn must still block');
    } finally {
        rmDir(repo);
    }
});

test('KIT_GOAL_STOP_RETRY_MS parsing fails open and never throws: 0, garbage, and mixed junk all still block promptly', () => {
    // The env boundary of the retry schedule: a disable ('0'), pure garbage, and
    // a mixed junk list must all degrade to "no retries" (or sane clamped
    // delays), never to a throw, which the top-level catch would turn into a
    // silent allow on every leashed stop.
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        for (const raw of ['0', 'garbage', '-5,abc']) {
            const res = runHook({ cwd: repo, transcript_path: transcript },
                { KIT_GOAL_STOP_RETRY_MS: raw });
            assert.strictEqual(res.status, 0, `retry env '${raw}' must not crash the hook`);
            const out = JSON.parse(res.stdout);
            assert.strictEqual(out.decision, 'block', `retry env '${raw}' must still block`);
        }
    } finally {
        rmDir(repo);
    }
});

test('malformed stdin: empty stdout, exit 0 (never throws)', () => {
    const res = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
    assert.strictEqual(res.stdout, '');
    assert.strictEqual(res.status, 0);
});

test('goal armed but transcript path absent: empty stdout (cannot scope, so allow)', () => {
    const { repo } = armedRepo(['Working.']);
    try {
        const res = runHook({ cwd: repo });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
    } finally {
        rmDir(repo);
    }
});

test('bound to this session but the transcript is unreadable: empty stdout (fail-open, leash stays armed)', () => {
    // The leashed path's fail-open invariant: scoping resolves (this IS the bound
    // session) and the plan is In Progress, but clause (b) cannot read the
    // transcript at all, so it throws and the top-level catch allows rather than
    // trapping a session whose last turn may well have been a 'BLOCKED:'.
    const { repo } = armedRepo(['Making progress.']);
    try {
        assert.strictEqual(bindSession(repo, 'sess-me').ok, true);
        const missing = path.join(repo, 'no-such-transcript.jsonl');
        const res = runHook({ cwd: repo, transcript_path: missing, session_id: 'sess-me' });
        assert.strictEqual(res.stdout, '', 'an unreadable transcript must allow the stop, never block it');
        assert.strictEqual(res.status, 0);
        assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'the goal stays armed');
    } finally {
        rmDir(repo);
    }
});

test('require() of the hook loads it without executing main (the load-check seam)', () => {
    // The hook's tail is guarded by require.main === module, and the guarded
    // block ends in an unconditional process.exit(0). That exit is the
    // discriminator: if the guard were dropped, requiring the hook would run
    // the block and exit the process before the sentinel below ever printed.
    // The require also proves the file parses and kit-goal-lib.js resolves,
    // which is the load-check's original purpose (a syntax- or require-broken
    // hook would otherwise sit silently dead at every Stop). Run from an
    // armed repo so an executed main() has real state in reach.
    const { repo } = armedRepo(['Making progress.']);
    try {
        const res = spawnSync(process.execPath, [
            '-e',
            "require(process.argv[1]); process.stdout.write('LOADED-NO-EXECUTE');",
            HOOK
        ], { cwd: repo, encoding: 'utf8', input: '' });
        assert.strictEqual(res.status, 0);
        assert.strictEqual(res.stdout, 'LOADED-NO-EXECUTE',
            'the sentinel must survive the require: main() and its process.exit(0) must not run');
        assert.strictEqual(res.stderr, '', 'a clean load writes nothing to stderr');
        assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'the goal state is untouched by a load');
    } finally {
        rmDir(repo);
    }
});

test('bound goal, Stop payload missing session_id entirely: empty stdout (the documented fail-open release)', () => {
    // Pins the shape loudly: if the harness ever stops sending session_id, a
    // bound goal must not silently start enforcing (or silently stop enforcing)
    // by accident. sameSessionId treats a missing id as "no match", so this
    // resolves as a bystander and allows.
    const { repo, transcript } = armedRepo(['Making progress.']);
    try {
        assert.strictEqual(bindSession(repo, 'sess-owner').ok, true);
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '', 'a Stop payload with no session_id at all is treated as a bystander: allow');
        assert.strictEqual(res.status, 0);
        assert.strictEqual(readBoundSession(repo), 'sess-owner', 'the existing binding is untouched');
    } finally {
        rmDir(repo);
    }
});

// Clause (a) reads CLOSED rather than Complete, from 2026-09-04. Abandoning a
// plan is a close-out too (docs/README.md: a plan moves to archive/ "in the
// close-out that completes or abandons it"), so a leash must not keep holding a
// session to a plan somebody abandoned. A correctly archived plan already
// released via the file-is-gone branch; this covers the window where the status
// changed and the move has not happened yet, which is exactly the state
// session-start.js now nudges about.
test('goal armed, plan Status: Abandoned: empty stdout AND goal auto-cleared', () => {
    const { repo, transcript } = armedRepo(['Abandoning this one.'], 'Status: Abandoned');
    try {
        assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'setup: goal armed');
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.stdout, '');
        assert.strictEqual(res.status, 0);
        assert.ok(!fs.existsSync(path.join(repo, '.kit', 'goal-state.json')), 'goal auto-cleared on Abandoned');
    } finally {
        rmDir(repo);
    }
});

// The pin against widening clause (a) to "anything not In Progress". A Proposed
// stub is what a user arms a leash on the moment they decide to build it, so the
// leash must still HOLD there, and holding means the hook blocks the stop.
test('goal armed, plan Status: Proposed: the leash still holds', () => {
    const { repo, transcript } = armedRepo(['Still going.'], 'Status: Proposed');
    try {
        const res = runHook({ cwd: repo, transcript_path: transcript });
        assert.strictEqual(res.status, 0);
        assert.notStrictEqual(res.stdout, '',
            'a Proposed plan is not closed out: the leash must not release');
        assert.ok(fs.existsSync(path.join(repo, '.kit', 'goal-state.json')),
            'goal must stay armed on a Proposed plan');
    } finally {
        rmDir(repo);
    }
});
