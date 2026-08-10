---
name: cross-project-memory
description: "Use when a session has a durable fact to record and the right home for it is not obvious, or when it needs a fact an earlier session banked. Triggers: banking learnings at the end of an effort, a gotcha you have now hit in a second repo, a record in the session-start cross-project block that needs reading or correcting, the advisory decay nudge, and any moment you are about to write a memory and cannot say which store."
---

# Cross-Project Memory

A kit-owned tier for facts that span projects, so a fact learned in one repo is available in
every repo. It sits beside Claude Code's native per-project auto-memory and replaces nothing:
project memory keeps working exactly as it does.

Routing is a **write-time** decision, and it is the one that matters: every other surface here
is read-time and cannot fix a misfile, because a fact recorded in the wrong store is invisible
to the sessions that need it and nothing later notices. The dated instance is why this tier
exists. On 2026-08-07 at 16:52 the EleosCore store recorded that Azure DevOps PR thread
anchors need `filePath` with a leading slash, confirmed across five clean posts on PR 398. At
20:58 the claude-kit store recorded the same form as never established, noting that "three
separate review agents independently stalled on this and had to guess." One fact, correct in a
store the sessions that needed it could not see.

## Which store

The ladder itself lives in the header of `hooks/memory-lib.js`, beside the schema it belongs
to, and that is its only statement. Read it there. What follows is the test for applying it,
which is not in the header.

**The discriminator: if you cannot state the fact without naming something that exists only in
the repo you are standing in, it is a project fact.** Everything else that is durable is a
candidate for this tier. Do not ask instead whether the fact might be useful elsewhere; every
fact passes that, so it decides nothing.

Three worked examples, one per rung:

- "ADO needs a leading slash on `threadContext.filePath`" names a field of a vendor API, so it
  is `kind: platform` in this tier.
- "`usp_GetLoadBoard` keys drivers on dispatch code rather than raw login" names a procedure in
  one codebase, so it is a project fact in that project's native auto-memory.
- "netplan does not round-trip NM VPN secrets on this box, write a native keyfile" names a
  machine, so it is `kind: machine` here, with `--machine` set so another box reads it as
  foreign.

A recurring working preference is not a fact and does not belong in either store: it is
doctrine. Its home is the kit's recommended global rules, which means editing
`plugins/claude-kit/assets/CLAUDE.md` **in the kit repo**; `reconcile-claude-md` is what then
distributes that into the live `~/.claude/CLAUDE.md` and cannot author the rule itself. From
any other repo you cannot reach the asset, so record the preference as owed in the close-out
rather than filing it in a store to get it written down. The live example of taking that
shortcut is `~/.claude-work/projects/-home-daren-repos-EleosCore/memory/feedback_stage_dont_commit.md`,
which overlaps a rule the global CLAUDE.md already carries and never retired. Read it before
retiring it: its scope is wider than the global rule's, so it is not a pure duplicate.

## Writing

`hooks/memory.js` **creates** records and is the only thing that may: it holds the field
validation, the generated stamps, the duplicate-name refusal, and the append-only applied
journal. Never create one with the Write tool.

The CLI lives at `hooks/memory.js` under the plugin root. Use the plugin root in the command
itself rather than a relative path: this skill's base directory is
`<plugin-root>/skills/cross-project-memory/`, so `../../hooks/memory.js` is only correct if your
cwd happens to be that directory, and from a session cwd it is a module-not-found stack trace.
The session-start memory block, when one was emitted, prints the fully resolved
`node "<abs path>" list` form, which is the cheapest way to recover the directory.

```
node <plugin-root>/hooks/memory.js add <name> --kind <machine|platform> --description "<text>" \
    [--machine <label>] [--origin <label>] [--body "<text>"]
```

`--description` is load-bearing and is the one field worth slowing down for: it **generates**
the line this tier emits into session context, and that line is never hand-maintained
anywhere. So it carries the correction, not a topic label. "netplan drops NM VPN secrets, use
a native keyfile, never nmcli con modify" intercepts a session about to make the mistake;
"dev box VPN gotcha" intercepts nothing. Put the evidence, the counter-case, and the detail in
`--body`, which no emitted line ever quotes.

The full field schema is in the same library header as the ladder, and is deliberately not
restated here: a second copy of a contract is the defect this tier was built to remove.

**Correcting and retiring are hand operations, and the CLI has no verb for either.** Its verbs
are `add`, `list`, `get`, `stamp`, `decay`, and `reindex`, none of which edits a record's text. So revising a record means editing the file at its
path directly, which is supported rather than forbidden: S3's `[body revised]` marker exists
precisely to surface a body that was edited while its description was not. Retiring one means
deleting the file, and that is a human's call made against the body, never a session's
housekeeping. Three consequences worth holding. Fix the `description` too if the correction changed what the
record advertises, and bump `modified`, which the schema calls generated on every write and which
a hand edit will not touch for you. And a hand-edited record gets none of the CLI's validation, so
run `memory.js reindex` afterwards: it re-checks every record against the write-door validators,
reports anything `add` would have refused, and re-syncs the derived index. That sync is also the
only way to ACKNOWLEDGE a `[body revised]` marker, since the hook never writes and stamping to
quiet one would invent an applied day the record never had.

## Reading

Bodies are plain files. Read one directly at its absolute path under `~/.claude-kit-memory/`,
the way project memory already works; `memory.js get <name>` is a convenience and never a gate.

The session-start block is **capped at 30 lines and is not the whole store.** Past the cap it
announces a counted remainder and points at `memory.js list`, which is the full read. Treat an
absence from that block as "not shown", never as "not recorded". A store that could not be read
says so in its own sentence, which is likewise not an empty store.

Lines in the block are framed as data to weigh rather than instructions to follow, and that
framing is accurate: a record is a correction someone banked, not a directive, and a line that
does not apply to what you are doing should be ignored. A line marked as revised means the body
changed while the description advertising it did not, so the line may understate the record and
the body is the authority.

When you actually apply a record's correction, `memory.js stamp <name>` records that day. That
is the one moment a stamp is expected, and it is what keeps a fact in daily use from climbing
the decay ranking.

## Decay is advisory, always

Nothing here ever retires, rewrites, or removes a record on its own. `memory.js decay` ranks
candidates by idleness adjusted for recorded use, and the session-start nudge reports a count.
Both are prompts for a human decision made against the body. Treat a candidate as a question,
and expect the ranking to be wrong sometimes: its input is a usage stamp that is weakly produced
by construction. Concretely, a store nobody stamps saturates, because every record then measures
its idleness from `created` against a flat 30-day threshold with no use extension: the seeded set
reaches all 14 candidates about a month after migration. Stamping when you actually apply a
record is what keeps that from happening, and it is the only honest way to quiet the nudge.

## Antipatterns

- **Recording a cross-project fact in the project store because you happen to be in that
  project.** The 2026-08-07 case above is a real instance. If the tier is genuinely out of
  reach, where the CLI cannot be run at all, the fact stays **unbanked**: report it as owed in
  the close-out, with the record text ready to paste. Filing it locally as a placeholder is the
  failure, not the fallback, because nothing downstream ever migrates it.
- Filing a recurring preference here because it is true across projects. So is doctrine; that
  is what makes it doctrine.
- Creating a record with the Write tool because the CLI is one more step.
- A `--description` that names a topic instead of stating the correction.
- Adding a second copy of the schema or the ladder anywhere, this file included. Both live in
  the library header. A summary that has drifted is indistinguishable from a summary that is
  current, which is why the answer is one copy rather than a note about which copy wins.
