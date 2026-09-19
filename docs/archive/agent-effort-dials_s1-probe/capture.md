# Section 1 probe capture, 2026-09-19

Raw `effort.level` readings out of PreToolUse payloads, in run order, from the two
probe rounds described in Chapter 1 of `plans/agent-effort-dials_spec_v1.md`.
Round 1 used a hook alone; round 2 added each agent's own `$CLAUDE_EFFORT` as a
second independent reading. The instrument is deleted; this is what it produced.

**Identifiers are truncated and paths are placeholders.** The full values named this
machine's config directory, its scratch root and eight session UUIDs, and the archive is
public; the first eight hex characters are enough to correlate a row to its dispatching
session, which is the only evidentiary use they have.

## Round 1
```json
{"at":"2026-09-19T15:29:38.765Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-a","agent_id":null,"session_id":"dd521f57...","keys":["agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:29:44.599Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:29:53.783Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-b","agent_id":null,"session_id":"8df6db8e...","keys":["agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:29:58.191Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-c","agent_id":null,"session_id":"30ccc58b...","keys":["agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:30:06.161Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-d","agent_id":null,"session_id":"5581d092...","keys":["agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:30:18.689Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:30:26.326Z","effort":{"level":"medium"},"agent_type":"effort-probe-a","agent_id":null,"session_id":"c0940c8d...","keys":["agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:30:30.374Z","effort":{"level":"low"},"agent_type":null,"agent_id":null,"session_id":"bb574304...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:30:48.960Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:31:13.459Z","effort":{"level":"medium"},"agent_type":"effort-probe-d","agent_id":"a4b7d865...","session_id":"70a9bb49...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:31:25.831Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-b","agent_id":"a107d4c9...","session_id":"70a9bb49...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:31:46.001Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:31:52.908Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:32:03.928Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-b","agent_id":"a08534df...","session_id":"71d20012...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:32:14.954Z","effort":{"level":"xhigh"},"agent_type":"effort-probe-c","agent_id":"af5fc3d8...","session_id":"71d20012...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:32:26.332Z","effort":{"level":"max"},"agent_type":"effort-probe-e","agent_id":"ab87b629...","session_id":"71d20012...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:32:40.192Z","effort":{"level":"max"},"agent_type":"effort-probe-f","agent_id":"a703c33d...","session_id":"71d20012...","keys":["agent_id","agent_type","cwd","effort","hook_event_name","permission_mode","prompt_id","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
{"at":"2026-09-19T15:33:04.148Z","effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"session_id":"044079bd...","keys":["cwd","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_use_id","transcript_path"]}
```

## Round 2
```json
{"effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/044079bd....jsonl","cmd":"SP=/tmp/claude-1000/-home-daren-repos-claude-kit/044079bd-5f"}
{"effort":{"level":"low"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/3f19f993....jsonl","cmd":"echo \"PARENT=$CLAUDE_EFFORT\""}
{"effort":{"level":"low"},"agent_type":"ep-none","agent_id":"a1eca04f...","transcript_path":"~/<config>/projects/<project>/3f19f993....jsonl","cmd":"echo \"EFFORT=$CLAUDE_EFFORT\""}
{"effort":{"level":"xhigh"},"agent_type":"ep-son-x","agent_id":"ae040282...","transcript_path":"~/<config>/projects/<project>/3f19f993....jsonl","cmd":"echo \"EFFORT=$CLAUDE_EFFORT\""}
{"effort":{"level":"medium"},"agent_type":"ep-son-m","agent_id":"ac42a4c6...","transcript_path":"~/<config>/projects/<project>/3f19f993....jsonl","cmd":"echo \"EFFORT=$CLAUDE_EFFORT\""}
{"effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/044079bd....jsonl","cmd":"T=~/.claude-work/projects/-home-daren-repos-claude"}
{"effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/044079bd....jsonl","cmd":"T=~/.claude-work/projects/-home-daren-repos-claude"}
{"effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/044079bd....jsonl","cmd":"T=~/.claude-work/projects/-home-daren-repos-claude"}
{"effort":{"level":"xhigh"},"agent_type":null,"agent_id":null,"transcript_path":"~/<config>/projects/<project>/044079bd....jsonl","cmd":"SP=/tmp/claude-1000/-home-daren-repos-claude-kit/044079bd-5f"}
```

## Round 2 model attribution

The parent session transcript's `modelUsage` for the round-2 run, which is what
confirms the `model: sonnet` pin took effect on the two agents that declared it:

```json
{"claude-opus-5[1m]": {"outputTokens": 760, ...}, "claude-sonnet-5": {"outputTokens": 389, "thinkingTokens": 76, ...}}
```
