# What the Kit Lets an Operator Configure, and Where That Is Written Down

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-31 (asked for 2026-08-29)

## Related

- `plans/kit-distribution_spec_v1.md` - a forker arrives with none of this repo's history, so
  whatever this stub produces is the surface they configure the kit through. If distribution lands
  first, this becomes part of its guided first run rather than a standalone document.

## Why this exists

The user's ask, 2026-08-29, and it is **an idea rather than observed friction**: the kit has no
single surface that tells an operator what it lets them configure. That provenance matters for how
this is judged, because nothing here is discharging a recorded failure and the usual evidence
question ("what went wrong") has no answer to give.

Seven configuration surfaces exist, each verified on 2026-08-31 (the files present, the command real), and nothing inventories them
together. **The seventh was missing from this stub's first draft and found by its review**, which is
the `plans/enumerations-stop-short_spec_v1.md` class landing inside the paragraph that warns about
it three sections down:

| Surface | What it controls |
|---|---|
| `~/.claude-kit-usage/config.json` | whether usage awareness is on at all, and the warn and barrier percents per window |
| `settings/settings.recommended.json` | the harness settings the kit recommends, including hook registration |
| `CLAUDE_CONFIG_DIR` | which config profile a session runs under |
| `/kit-goal <plan>` | arms the completion leash for a plan run (the command is the surface; `.kit/goal-state.json` is kit-written state, not an operator file, and is absent unless a leash is armed) |
| `~/.claude-kaizen/` | the friction inbox and briefs |
| `~/.claude-kit-memory/` | the cross-project memory tier |
| `CLAUDE_KIT_MEMORY_DIR` | relocates that store's root (`docs/cross-project-memory.md:109`) |

The usage one is the argument for the stub existing: it arrived the week before the ask and **took a
whole document (`docs/usage-awareness.md`) to explain one file**, which is the cost of having no
place where a knob can be described briefly next to its siblings.

## The two shapes, and the case for the cheaper one

- **A `docs/configuration.md` inventory.** Probably covers most of the want, because most of this is
  lookup rather than judgment: where the file lives, what keys it takes, what the default is, what
  reads it. No `docs/configuration.md` exists today.
- **A skill.** Earns its place only where judgment is involved: which threshold to set, which profile
  to run under, whether a given knob is the right instrument for the problem at all. `writing-skills`'
  lean rule binds here, and the bar it sets is that the skill must beat **one more paragraph in an
  existing skill**.

## The constraint that shapes it

A non-kit skill, `update-config`, already owns harness `settings.json`, permissions, hooks and
environment variables. So the kit-specific half is the actual gap, and **a skill spanning both would
duplicate a skill the user already loads**. Any design that reaches for the skill shape has to say
what it does with that overlap before it says anything else.

## What a design pass has to settle

- Whether the inventory alone closes the ask, which is the outcome to argue against rather than for,
  since the ask named no failure the inventory would not answer.
- Whether an inventory of seven surfaces stays current. It is an enumeration of exactly the kind
  `plans/enumerations-stop-short_spec_v1.md` is about: an eighth knob added later is the member
  nothing points back to, and this stub has already supplied one instance of that by shipping a
  first draft with six.
- Whether `docs/usage-awareness.md` shrinks once a configuration home exists, or stays whole with the
  inventory pointing at it. This is the only part of the work that could subtract.

## Open Questions

- Is the operator being served here the user, a forker, or a session reading its own configuration?
  The three want different documents, and the ask did not distinguish them.
