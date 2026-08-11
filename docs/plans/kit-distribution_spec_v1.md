# Kit Distribution: a core others fork into their own kits

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-11

## Why this exists

Daren's goal, stated 2026-08-11: turn this kit into something others at his org download and
then effectively **fork into their own personal kits**, with their own styles and philosophies,
and keep building on theirs the way he has built on his. A "core" kit keeps being updated;
forkers merge core's changes in and reshape them to preference; there is some path for them to
propose things back to core; and a first-run flow walks them through installation, the CLAUDE.md
setup, and optionally learning their coding and writing style from samples they provide.

Publishing is real but unscheduled, and a lot of other change comes first. This stub parks the
future state so the work already proposed can be sequenced against it rather than colliding
with it.

## The finding that reframes this

**The fork relationship already exists, implemented once.** `kit-adoption-pass/SKILL.md:8` opens
"claude-kit is a personalized fork of Scott Applefeld's kit," and that skill is already the
merge-upstream-into-my-personalized-fork pass, with a watermark sha, a standing ledger of what
was taken, reshaped, or refused, and a staleness nudge. Daren's kit relates to Scott's exactly
as a future forker's kit would relate to core.

So this is not a new architecture. It is generalizing a relationship the kit runs today, and the
design work is mostly subtraction: find what is specific to *Scott's kit in particular* rather
than to *an upstream*. Two things already point the right way:

- **Per-fork state is already outside the shipped payload.** `kit-adoptions.md` lives in `docs/`,
  and `docs/README.md:3` states nothing there ships inside `plugins/claude-kit/`. A forker's
  ledger of what they declined from core is theirs and never travels. Nothing needs moving.
- **`reconcile-claude-md` is a working model of the merge this needs**, at one-file scale: base,
  ours, theirs, with a version marker and a baseline snapshot, the upstream delta folded onto the
  user's content, every conflict flagged rather than guessed, and a hard rule against dropping a
  user's own rule. That is the whole fork-merge problem in miniature, already solved and tested.

What is genuinely hard-coded is the upstream's identity (the skill's description, its prose, the
clone path, the watermark) and its stance at `:16`, "Inbound only. Nothing goes back to Scott" -
which is exactly the half this proposal adds.

## The four capabilities, and what each actually needs

1. **Install and first run.** A guided path: install the plugin, establish the canonical global
   CLAUDE.md, reconcile it, and explain the workflow skills. Most of the mechanism exists
   (`setup.sh`, `reconcile-claude-md`, the canonical-plus-symlink scheme); what is missing is the
   guided sequence and a first-run state that knows it has not run yet.
2. **Learn the forker's style, optionally.** The sharpest product idea in the set, and the one
   worth designing first because it is valuable even if publishing never happens: `csharp-style`
   and `sql-style` are today statements of one person's house style. Under this model they are
   *derived artifacts*, generated from samples a forker volunteers. That is a different skill
   shape (a generator plus a generated skill) and it wants its own design pass. It is also the
   honest answer to "not required": a fork with no samples gets a neutral style skill, not a
   broken one.
3. **Merge core's updates.** `kit-adoption-pass` with a parameterized upstream. Decide whether one
   skill serves both relationships (Daren's kit reads Scott's *and* a forker reads core) or
   whether they diverge, and note that a fork of a fork is then possible and probably fine.
4. **Propose changes back.** The hardest, and it is governance rather than code. See below.

## The decisions a design pass must make first

- **What is core, and what is fork-local?** The payload/`docs/` split already answers most of it,
  but not all: the `cold` and `responding-to-review` skills encode a philosophy, not a mechanism,
  and a forker who disagrees should be able to reshape them without that reading as drift from
  core. Which parts of core are "mechanism you inherit" versus "opinion you are expected to
  overwrite" needs stating, because the merge pass has to treat them differently.
- **What does a contribution owe?** The kit's quality bar is `writing-skills`' RED/GREEN gate with
  recorded artifacts. A contributor proposing a skill change owes that bar, so either they run the
  gate and submit the artifacts, or core's maintainer re-runs it on their behalf. The first
  scales and is easy to fake; the second does not scale and is the only one that actually
  verifies. That tradeoff decides whether contribution is realistic at all, and it should be
  settled before any contribution mechanism is built.
- **Does core carry a name at all?** See the de-naming stub, whose central question this changes.

## The part most likely to be underestimated: the trust boundary moves

`docs/security-model.md:29` states the premise the whole kit rests on: "The workspace is
trusted." That holds for one person running their own kit in their own repos. Distribution breaks
it in both directions, and neither is a wording problem:

- **Inbound to a forker.** Installing the kit means installing hooks, which are executable code
  that runs at every session start, plus PreToolUse guards that see every tool call. A forker
  installing core is running someone else's code with that reach. Today the author and the whole
  audience are the same person; under distribution that is a supply chain. `security-model.md:143`
  currently
  discharges supply chain on the grounds that there is no `package.json`, no lockfile and no
  dependency - true, and it answers a different question than this one.
- **Inbound to core.** Accepting a contributed hook means shipping code, to everyone who installs
  core, that core's maintainer did not write. That is the same exposure pointed the other way, and
  it is the reason the contribution question above is a security question and not just a
  scaling one.

A design pass must extend `security-model.md` with a distribution section rather than leave the
trusted-workspace premise standing unqualified, because that premise is currently load-bearing
for the `security-reviewer` agent's judgment.

## What a mechanical approach provably misses

Recorded so a later pass does not learn it the expensive way. The kit's own history says a sweep
that greps for names finds prose and misses generated output (see the de-naming stub's category
3). The distribution analogue: what makes this kit effective is not only its files but its
*recorded reasoning* - archived Chapters, the adoptions ledger, the backlog's closure conditions.
None of that ships in the payload, all of it is what lets a session pick up work cold, and a fork
that starts with an empty history starts without the thing that makes the kit compound. Whether
a fork inherits any of core's reasoning, and in what form, is an open question this stub will not
answer.

## Out of scope

Licensing, contribution legal terms, and repo or marketplace renaming. Whether Scott's kit is
credited publicly, which is his consent question and not a packaging one. Any actual publishing
decision or date.

## Chapters

(none yet - Proposed)
