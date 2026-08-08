# Kit De-naming for Public Release

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-07

## Why this exists

A kaizen note (2026-08-07) captured Daren's capability wish: he may make this kit public so
others can use it, and personal names are baked in throughout. It is two problems wearing one
coat, a privacy question and an adoption barrier, and it needs a decision on what replaces the
names before any mechanical sweep, because the voice of several skills leans on direct address.
This stub parks the wish; it needs a design pass before execution.

## The measured surface

Counted 2026-08-07 against the plugin payload (`plugins/claude-kit/`), so a design pass can
size the work rather than re-derive it. **137 occurrences of "Daren" across 25 files.** The
heaviest: `executing-work` (17), `pr-review` (16), `design-council` (13), `kit-adoption-pass`
(8), `brainstorming` (8), `finishing-work` (7), `pr-reviewer` (6).

These are not one problem. They are five, and they want different answers:

1. **Direct address in skill prose.** The bulk of the 137. "Raise it to Daren", "when Daren
   asks", "Daren adjudicates". Mechanical to change, but the *target* is the open question:
   this is where the voice decision below actually bites.
2. **Skill titles and descriptions.** `csharp-style` and `sql-style` are both titled "Daren
   Porter's house style" in their frontmatter `description`, which is what an installing user
   reads first in the skill list. Cheap to change, high visibility.
3. **Names the kit writes into a user's files.** `sql-style/SKILL.md:41` and
   `sql-style/references/sql-style.md:180` carry `AUTHOR:  Daren Porter / ASR Solutions` inside
   the install-script header template the kit instructs agents to emit. This is not prose about
   the operator, it is *generated output*, so it needs a placeholder or a configured value, not
   a rewording. Distinct from every other category and easy to miss in a prose sweep.
4. **Plugin metadata.** `.claude-plugin/plugin.json` names the author in the `author` field and
   the `description`. This is legitimate attribution and probably stays; a public kit having a
   named author is normal. Worth an explicit decision so the sweep does not strip it reflexively.
5. **The upstream kit's owner.** See below. The hard case, and the only one with a blocker in it.

## The decision a design pass must make first

What replaces direct address? The options are not cosmetically equivalent, because several
skills' force comes from addressing a specific person with authority:

- **Second person ("you").** Reads naturally and costs nothing at install time, but it collides
  with the fact that skills already address the *agent* as "you". "Raise it to you" is
  incoherent, so every site needs a role word anyway.
- **A role noun ("the operator", "the owner", "your user").** Unambiguous against the existing
  "you", and mechanically substitutable. Flatter and more institutional in tone, which costs
  some of the directness that makes `cold` and `responding-to-review` work.
- **A configured operator name.** Keeps the current voice exactly, at the price of a
  configuration surface the kit does not have today, plus a fallback for when it is unset.

The choice is not uniform across the kit, and a design pass should decide whether it must be.
`cold` and `responding-to-review` lean hardest on direct address; `curating-docs` and
`kit-goal` barely lean on it at all.

## The hard case: the adoption-pass surface

`kit-adoption-pass` (8 hits in the skill, 6 naming the upstream owner), `docs/kit-adoptions.md`
(9), `hooks/session-start.js` (3), `README.md` (4) and `docs/README.md` (3) all name Scott
Applefeld, whose kit this one reads from. It resists the same treatment for two reasons, and the
second is a blocker rather than a design question:

- **It is genuinely about one specific person's repo.** A neutral "the upstream kit" works in the
  skill's prose, but the clone path, the watermark, and the ledger all point at a real
  named repository. Generalizing the *skill* is possible; generalizing the *record* is not,
  because the record's whole value is that it is about a particular kit.
- **Daren cannot consent on Scott's behalf.** Publishing a repo that names a third party, and
  carries a standing-rejections list about that person's work, is a different act from
  publishing one's own name. This wants Scott's agreement, or the adoption surface stripped from
  the public artifact, before anything ships. A design pass that treats this as a wording problem
  has misread it.

That points at an option the other categories do not need: the adoption surface may belong
outside the public payload entirely (a local-only skill, or a private overlay), rather than
being de-named in place.

## What a mechanical sweep provably misses

Recorded because the last classification sweep over this repo learned it the expensive way: a
grep for the names finds category 1 and 2 cleanly, and silently misses category 3, because the
name there sits inside a code fence that reads as example output rather than as prose about a
person. Any execution plan needs a pass over generated-artifact templates specifically, not just
a name grep.

## Out of scope

Renaming the repo, the plugin, or the marketplace entry. Licensing and contribution
guidelines for a public kit. Both are real questions a public release raises; neither is this.
