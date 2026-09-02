# Two Dispatch Instructions That Do Not Determine the Dispatch

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- Promoted 2026-09-02 from two inbox notes, both produced by the same six reps running a
  `finishing-work` close-out on 2026-09-02. Neither was a probe of the clause it hit.
- `plans/fable-spend-absence_spec_v1.md` - the third finding from those same six reps, promoted
  separately because it carries an operator ruling this stub does not.
- `plans/enumerations-stop-short_spec_v1.md` - checked, and neither finding here is an instance:
  nothing is one member short of a set. Both are cases where a stated instruction underdetermines
  the action it names.

## Why this exists

Six agents were dispatched to plan a `finishing-work` close-out on the same fixture, differing only
in one spec header. That is more close-outs in one afternoon than this kit sees in a month of real
use, and it surfaced two places where the skill's dispatch instructions do not determine the
dispatch. Both change what actually runs; neither is a tidiness question.

## Finding 1: the combined-pass exception has two preconditions that disagree, 4-2

`finishing-work:12` reads: "For a small effort that had no meaningful per-section reviews (a few
files, one short pass), a single combined adversarial + security pass is enough; do not manufacture
separate passes for a handful of files."

On a fixture of 2 files, 45 lines, 3 sections, with no per-section review outcomes recorded,
**four of six reps collapsed steps 2 and 3** into one adversarial pass carrying the security read,
and **two kept them separate**, naming the same clause to reject it. The split is clean:

- "a few files" measures the CHANGESET, and it qualifies.
- "one short pass" measures the EFFORT'S SHAPE, and three sections with three execution modes and
  three Chapters is not one short pass.

No tiebreak is stated. One of the two that split named the paragraph's own governing sentence as
its tiebreak - "Eliminate true duplication, not coverage" - which is the closest thing to a rule the
clause has and points the opposite way from the trailing imperative.

**The consequence is review coverage.** One rep that collapsed noted it would have to record that
"the security-reviewer's OWASP-mapped depth was folded into this pass rather than run separately",
so the collapse trades a charter for a line in a brief.

Candidate: say which precondition governs when they disagree, or drop one. "A handful of files" in
the trailing imperative suggests the file count was meant to be the test, in which case "one short
pass" is the clause to cut rather than to arbitrate.

## Finding 2: "run it at the session model" is not what omitting the model override does

Verified against the tree. Of the five agents `finishing-work` step 2/3 can dispatch,
`security-reviewer`, `adversarial-reviewer`, `blind-reader` and `prose-reviewer` carry **no**
`model:` pin. (`qa-verifier` is pinned `sonnet` and `docs-curator` `opus`, so `finishing-work:14`'s
pinned-model claim is true as written, and all six reps honored it.)

For an unpinned agent the Agent tool resolves an omitted model to the agent definition, else a
**configured default subagent model**, else the parent. So on any session where that default is
configured, omission yields the default rather than the session model, and every instruction that
says to run something "at the session model" without saying to pass it explicitly relies on an
unstated precondition.

**Three of six reps reasoned about this unprompted**, and two resolved it by passing `opus`
explicitly, one in as many words:

> "an omitted `model` resolves to the agent definition's frontmatter or a configured default
> subagent model, neither of which I can read from here, so 'inherits the session model' is not
> something I can guarantee by omission."

Reaches at least `finishing-work:14` twice (the document battery, and the ratchet and headroom
downgrades) and `executing-work:171` ("`implementer-fable` carries no model pin: it inherits the
session model").

Candidate: say to pass the session model explicitly wherever the text means the session model, and
keep omission only for the two genuinely pinned agents.

## What a design pass has to settle

- **Whether these are one change or two.** They are in the same paragraph region of the same skill
  and would take one review round, which is the argument for batching. They are independent in
  substance, which is the argument against. The 2026-09-01 triage batched on shared-file grounds
  and that reasoning applies here.
- **Whether finding 2 is a kit-wide sweep rather than two edits.** The phrase pattern may occur
  elsewhere in the corpus; nobody has walked it. Walk it before scoping, per
  `plans/enumerations-stop-short_spec_v1.md`'s own opening lesson about importing a count instead
  of walking it.
- **The arm bill.** Both are directives about what an agent does, so both owe the arms whatever
  their premise. Finding 1 has a measured 4-2 baseline to beat; finding 2 has a 3-of-6 baseline of
  reps working around it correctly, which is a weaker RED and needs staging that puts a configured
  default subagent model in play, or it cannot reproduce at all.
- **Whether finding 2 wants a mechanism rather than prose.** A dispatch that means the session
  model could name it explicitly in the agent definition's frontmatter instead, which is code and
  takes tests rather than arms.
