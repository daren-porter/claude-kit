# S2 arm protocol

How the twelve dispatches run. Written during S1's review window; the fixtures and variants it
depends on are already captured and do not change with S1's findings.

## The design in one line

Two skills, two variants each, three reps per cell, scored on behavior rather than prose quality:
`2 skills x 2 variants x 3 reps = 12 dispatches`.

## Variants

| Variant | What it is | Captured at |
|---|---|---|
| A (pre-sweep) | The skill exactly as it stands before this effort touches it | `.kit/s2/variantA-cold.md`, `.kit/s2/variantA-responding.md`, taken from `git show df880e6:<path>`, verified byte-identical to the working tree |
| B (post-sweep) | The same skill after S1's rules are applied | produced at the start of S2, from the working tree |

A and B differ by the whole substitution: name, pronouns, and verb agreement. That package is the
treatment under test, not the name alone. Variant A carries 6 `Daren` and 6 pronouns in `cold`,
5 and 1 in `responding-to-review`.

## Delivery, and the thing the arm rests on

Each rep receives, in-prompt and in this order:

1. The full text of one variant, presented as the operative instruction it is.
2. The fixture prompt from `.kit/s2/fixture-cold.md` or `.kit/s2/fixture-responding.md`.

And nothing else. Specifically **not**:

- repo access to claude-kit (the swept working tree would show a rep that something is mid-edit),
- the plan doc or this protocol,
- the other variant, or any statement that a second variant exists,
- any framing that a comparison, an experiment, or a measurement is happening.

That last set is what the arm rests on. A rep that can see a half-swept tree is measuring its own
suspicion rather than the wording, and a rep told it is comparing two drafts will find a
difference because it was asked to. `writing-skills`' answer-leak rules are the governing
discipline here; this spec is a committed `docs/plans/` file naming both the substitution and the
claim under test, which makes in-prompt-only delivery mandatory rather than merely tidy.

## Scoring

Each fixture defines three binary criteria. Score every rep 0 or 1 on each, independently, and
report per-cell totals out of 9 (3 reps x 3 criteria) rather than a prose impression, so the two
variants are compared on one scale.

Record the raw rep outputs alongside the scores. A score with no output behind it cannot be
re-adjudicated later, and this arm is the effort's only test signal.

## Reading the result

- **B scores at or above A:** the substitution did not degrade the behavior. Pass. Proceed to
  section 3. Record the totals in the Chapter, including when the answer is "no observable
  difference", which is a pass and not a null result.
- **B scores below A:** the gate fails. Do not proceed to section 3. Identify which criterion
  moved, revise the substitution vocabulary in `.kit/denaming-rules.md` to address it, re-sweep
  the two skills, and re-run the B half. Record the revision and its reason in the Chapter.
- **Neither variant discriminates** (both cells at or near 0, or both at a ceiling of 9): the
  fixture failed, not the wording. Say so plainly rather than reporting a pass the arm did not
  earn. The spec's second Open Question owns this outcome: record that the flattening claim is
  untestable at this fixture's resolution and hand it to the backlog, rather than letting a
  degenerate result stand as evidence either way.

## What this arm is not

It is not a RED. Nothing new is being ruled, so admissibility is not the question; regression is.
`writing-skills` owns dispatch discipline and the leak rules, which apply unchanged, but its
three-arm RED shape does not fit and is not being followed.
