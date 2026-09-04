# A Design Skill for the Kit

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-08-15

## Why this exists

The user asked (2026-08-15) for the kit to have its own version of a frontend design
skill: analyze the popular ones, take what is good wholesale, trim what is not, and
fit the rest to this kit's philosophies. Two scope answers came back in the same
exchange and both widen it. It serves **all** design work, work and client-facing as
well as personal, not just the kit's own HTML surfaces. And the **stack is
deliberately unsettled**, so nothing may assume React, Tailwind, or a dev server.

This stub records what the two named sources actually are, measured rather than
described, and the three findings that should drive the design pass. It is not the
design.

## The two sources, measured

Watermarked so a later pass can diff rather than re-read.

**Hallmark** (`Nutlope/hallmark`, MIT, Hassan El Mghari with Together AI, head
`13ac0ec7e148` 2026-08-06). 690 KB across 111 files under `skills/hallmark/`.
`SKILL.md` alone is 67 KB. Pure prose, no executable anything. Four verbs (build,
`audit`, `redesign`, `study`), 21 macrostructures, themes across four genres, and 58
numbered slop-test gates by its own count. Its stated differentiator is *structural*
variety rather than visual variety: two pages for two briefs should not share a
hero/3-feature/CTA/footer rhythm.

**Impeccable** (`pbakaus/impeccable`, Apache 2.0, head `7b646bafd60b` 2026-08-14).
2.23 MB under `skill/`. An 11 KB `SKILL.src.md` router, 40 on-demand reference files
(`critique.md` and `new-work.md` are 45 KB each, `live.md` 36 KB), four bundled
subagents, and roughly 1.6 MB of executable JS. That JS is the interesting half: a
pre-edit hook (`hook-before-edit.mjs` plus a 95 KB `hook-lib.mjs`) running 59
deterministic detectors at zero token cost, and a live browser mode
(`live-browser.js` alone is 500 KB) with framework adapters for Next, Nuxt,
SvelteKit, Astro, TanStack and Vite.

**"Wholesale" is arithmetically dead, and this is the first thing to internalize.**
This kit's entire plugin payload is 528 KB, covering 18 skills, 8 hooks and 13 agents (the agent figure was stated as 8 when this plan was written and was already wrong by three; the document review battery has since added two more, corrected 2026-08-26).
Hallmark alone is 1.3x that. Impeccable is 4.2x. The failure mode this stub most
wants to prevent is a session opening it and beginning by reading 690 KB of source.
Frame the work as the smallest thing that carries the value, never as port-then-trim.

## Three findings that should drive the design

**1. This is the kit's third style skill, and the precedent it sets is narrower than
it looks.** `csharp-style` (10.7 KB) and `sql-style` (6.9 KB) contain no RED, no GREEN
and no baseline anything, and neither appears in `backlog.md`'s open-instances list.
The obvious reading is that a taste corpus is exempt: it is the user's preference, not an
empirical claim about agent behavior, so no arm can settle it.

That reading does not survive reading the skills. `csharp-style`'s "Signature wrapping
is formatter-owned, not willpower" is not taste. It asserts a fact about agent
behavior ("delegated implementers miss it even when the dispatch prompt orders the
chop") and a fact about an external system (Rider's on-type formatting does not fire
on a `.cs` file a tool edits externally), then prescribes an orchestrator sweep on the
strength of both. That is precisely the shape `writing-skills` gates, and it shipped
inside a style skill unmarked.

**So the boundary is per-clause, not per-skill**, and the hazard this predicts is
specific: a design corpus will accrete behavior claims ("agents default to X unless
told", "this gate is the one instruction does not buy") among the taste rules, and
nobody will notice the category change, exactly as happened in `csharp-style`. The
text offers no help here either, since `writing-skills` opens "A skill is
behavior-shaping prose, not documentation" and sets the standard "for any change to
behavior-shaping content, the kit's own skills included," with no carve-out for taste.
Settle the per-clause test as part of this design, and put the answer in
`writing-skills` rather than only here. That file is under concurrent edit by the
`red-for-rule-changes` effort, so quote it rather than citing line numbers.

**2. The architecture fork is real, and the kit already picks a side.** Hallmark is
67 KB of always-loaded prose. Impeccable is a thin router plus on-demand references,
bundled subagents, and deterministic detectors in a pre-edit hook. The second shape is
what this kit already is: thin `SKILL.md` plus `references/`, three PreToolUse guards,
`agents/`, and a `test/` suite that pins hook behavior. Hallmark has independently
converged on the same lazy-load discipline internally, instructing that its 21 macro
files never be loaded more than one at a time.

The consequence worth acting on: **deterministic detectors are code with tests, so
they sidestep the prose gate entirely and cost no tokens per run.** If this work has a
cheap, provable first section, that is it. The caveat is that a detector needs
something to run on, and a stack-agnostic detector over CSS is a much narrower
instrument than one over JSX.

**3. Stack-agnostic is a hard cut, and it cuts most of the mass.** the user's "not settled
yet" means Impeccable's live mode and framework adapters are out (they bind to a dev
server and a named framework), and Hallmark's content, while portable prose, is
marketing-site-shaped: 21 macrostructures and a theme catalogue are a landing-page
vocabulary that will not survive contact with a dashboard or an internal tool. What
survives the intersection is the taste layer (color, type, scale, spacing, motion),
the anti-pattern and slop-gate corpus, and the structural-variety idea. Those transfer
to plain HTML, React and Blazor alike.

The fit to kit philosophy then falls out for free, because the shape already exists
twice. Both style skills open with a precedence ladder (project-declared rules win,
then `.editorconfig` or siblings, then the skill), and design work needs exactly that:
a project with a real design system must beat the kit's taste, every time. Copy the
ladder rather than inventing a posture.

## Operator ruling, 2026-09-04: kept, and the purpose is stated

Put up as an abandon candidate in the 2026-09-04 kaizen triage on the ground that
`artifact-design` already loads in every session and Hallmark names it as an upstream.
**Kept.** The operator's stated purpose: a kit-native "anti AI slop" design skill, which
Hallmark and its siblings intentionally aim at.

**That answers why, and it deliberately does not answer the first design question below**,
which stays live and stays first. The objection was never "why would anyone want anti-slop
design guidance"; it was that the anti-slop content may already be present first-hand, since
Hallmark's own head note sources its rules to "the consensus of the anti-AI-slop design field
(Anthropic's frontend-design skill, the Claude cookbook on frontend aesthetics, ...)". So the
question narrows rather than dissolves:

**Not** "should the kit have an anti-slop design skill" - the operator has ruled that it should.
**But** "what does `artifact-design` fail to deliver, measured on a real page rather than
described?" The stub's own Starting point already prescribes that measurement, and it is now the
whole gate: whatever survives it is the kit-native skill's content, and if nothing survives, the
honest outcome is a thin router pointing at what already loads. Either way the ruling is
satisfied, because a router is still kit-native.

Read the per-clause boundary finding below as the standing hazard for this one, since a taste
corpus written to a purpose is exactly where behavior claims accrete unmarked.

## What is undefined (the first design work)

- **What does it add over what already loads?** `artifact-design`, `dataviz` and
  `artifact-diagramming` are Anthropic-shipped and already available in every session.
  Hallmark's own head note says its rules are drawn from "the consensus of the
  anti-AI-slop design field (Anthropic's frontend-design skill, the Claude cookbook on
  frontend aesthetics, and the 2026 'tactile rebellion' movement)," so part of what is
  wanted here may be reachable first-hand rather than at third hand. **Answer this
  before writing a line of taste content.**
- **Where is the size ceiling?** The kit's largest `SKILL.md` is `writing-skills` at
  32.6 KB. Name the budget before drafting, or the corpus grows to fill the source.
- **Taste corpus, deterministic detector, or both?** See finding 2. These have
  different costs, different gates, and different failure modes.
- **How wide is "design"?** the user's answer widened it past frontend. Whether it reaches
  non-web surfaces is undecided and should be decided, not discovered.
- **Does taste ever earn a block?** Hallmark blocks on gate failure. The kit's three
  guards deny, but they guard docs and branches, never taste, and `backlog.md` already
  carries an open item about how a guard denial reads to an agent. A design skill that
  blocks is a posture change, not a feature.
- **Licence mechanics, if any text is taken.** Hallmark is MIT and the
  `visual-companion` precedent applies directly (permission notice in-file, since this
  repo has no `LICENSE`). Impeccable is Apache 2.0 **and does ship a `NOTICE.md`**, so
  §4(d)'s propagation clause is live, on top of retaining notices and stating changes
  in modified files. The practical bite is small: that NOTICE covers only
  `reference/ios.md` and `reference/android.md`, themselves distilled from ehmo's MIT
  `platform-design-skills`, and both are out of scope on the stack-agnostic answer.
  The cheapest position by some distance is Hallmark for any text and Impeccable for
  shape only, since the obligations attach to the material copied. Worth noting that
  the NOTICE exists because Impeccable did to a third skill exactly what is proposed
  here, which is the closest thing to a worked precedent for the ask.

## Starting point

Answer the first open question with a comparison rather than an assumption. Build one
real page against `artifact-design` and its siblings, then name what actually went
wrong that a kit skill would have caught. If nothing goes wrong, the honest outcome is
a thin skill that points at what already loads and adds only the user's own taste plus
the precedence ladder, sized like `sql-style`. That is a good result, not a
disappointing one, and it is the outcome the size arithmetic already favors.

When reading the sources, read these and stop: Hallmark's `SKILL.md`,
`references/slop-test.md` and `references/structure.md`; Impeccable's `SKILL.src.md`,
`reference/routing.md`, `reference/hooks.md` and `scripts/hook-before-edit.mjs`. That
is under 200 KB and covers both the taste layer and the enforcement layer.

## Related

- `plugins/claude-kit/skills/csharp-style/SKILL.md` and `.../sql-style/SKILL.md` - the
  family this joins, and the precedence ladder to copy rather than reinvent.
- `plugins/claude-kit/skills/writing-skills/SKILL.md` - the gate, and the
  taste-versus-behavior boundary this design has to settle. Under concurrent edit by
  `red-for-rule-changes`.
- `plugins/claude-kit/skills/kit-adoption-pass/SKILL.md` - the kit's existing
  inbound-adoption discipline (classify off docs and diffs, adjudicate one survivor,
  gate the ported wording). Built for the upstream kit; the ladder transfers to these two.
- `docs/visual-companion.md` - the worked precedent for porting third-party MIT
  material into this kit, including the permission notice this repo needs.
- `docs/backlog.md` - the guard-deny framing item, live if enforcement gets a block.
- Sources: `https://github.com/Nutlope/hallmark`, `https://github.com/pbakaus/impeccable`.

## Chapters

(none yet - Proposed)
