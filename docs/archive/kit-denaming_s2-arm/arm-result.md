# S2 arm result: VOID

Run 2026-08-20, 15 dispatches. **The arm does not support a gate decision and no pass is
claimed.** Raw answers are in `answers/` beside this file, keyed by `answers/KEY.txt`, and are kept
because the finding that voided them is worth more than the scores would have been. (They were
authored under the gitignored `.kit/s2/` and promoted here at close-out; the durable copies are
these.)

## The scores, recorded and then set aside

| Cell | Score |
|---|---|
| `cold` variant A (pre-sweep), runs 01/03/05 | 9/9 |
| `cold` variant B (post-sweep), runs 02/04/06 | 9/9 |
| `responding-to-review` variant A, runs 07/09/11 | 9/9 |
| `responding-to-review` variant B, runs 08/10/12 | 9/9 |
| **`cold` no-skill CONTROL, runs 13/14/15** | **9/9** |

The control is the whole story. Three reps handed **no skill text at all**, only the fixture
prompt, produced the skill's exact mandated output shape (Neutral restatement, Cold read, Framing
audit, Evidence, Strongest objection, Recommendation, Next check), scored 4/4 on the factual
anchors, and named the contractor permission boundary as the strongest objection. One titled its
section "Strongest objection to what you want to hear".

A control that scores identically to both treatment arms means the arm measured something other
than the wording under test.

## Why: the installed plugin was answering, not the handed-in variant

The reps were dispatched inside this repo, so the `claude-kit` plugin was loaded from its
installed cache at `74adfa99a5b5`, which predates this branch. That cache carries the
**pre-sweep** `cold` and `responding-to-review` skills, both still naming the operator (5
occurrences each). Both fixtures then trigger-match those installed descriptions almost verbatim:

| Installed description says | The fixture prompt says |
|---|---|
| `cold`: `"am I being rational about Y?"` | "Am I being **rational about this**, or am I talking myself into it?" |
| `responding-to-review`: "Use when **a review agent returns findings**" | "**A review agent came back with this finding** on the change I just made." |

So every rep in every cell had the pre-sweep skill available and cued, whichever variant text it
was handed. Variant A and variant B were never contrasted; both arms ran the same installed
skill. The 18/18 against 18/18 was never evidence of "no degradation", and the control proves it
by reaching the same ceiling with nothing handed to it.

**This repo's own memory records the hazard and this section walked into half of it anyway.** The
note says a kit skill edited in the repo is inert until the plugin is reinstalled, because the
runtime loads from the installed cache, and prescribes handing new wording to a subagent in the
prompt. Handing it in the prompt is necessary and it is not sufficient: it adds the new text
without removing the old one, and where the fixture trigger-matches the installed description the
old one wins.

## The two independent defects the review found, which stand regardless

Both were real before the confound was known, and both would have to be fixed in any re-run.

1. **The `responding-to-review` fixture hands the rep its own answer.** Criteria 2 and 3 ask the
   rep to name `O_NONBLOCK`, the `fstat` on the open fd, and the TOCTOU window. All three are
   written verbatim in the code comment quoted inside the fixture prompt, and `12-resp-B.md`
   quotes that comment back as its reasoning. The fixture also restages a case this repo has
   already resolved, in the prescribing form, in at least six on-disk places. `writing-skills`
   rules that denying repo access is not a control, because the test is whether the answer is on
   disk.
2. **Scoring was unblinded and every judgment resolved toward the pass.** `KEY.txt` mapped every
   answer to its cell and the scorer owned the gate. 24 of 24 unanimous binary judgments. At
   least one sat on the edge and was scored generously: criterion 3 asks the rep to identify that
   complying would make the code worse, and `12-resp-B.md` explicitly declines that framing
   ("Adding it on top of the existing fstat would not break anything") where `11-resp-A.md` calls
   the same case "a net loss".

## Two corrections to this document's own earlier claims

Recorded rather than quietly edited, because this file is the section's evidence of record.

- **The direct-address claim was false, in the direction that favored the conclusion.** The
  earlier draft said "two A reps and two B reps opened the objection with an explicit 'what you
  want to hear is...'". Counted: A used the phrase in 2 of 3 and opened with it in 2 of 3; B used
  it in 1 of 3 and opened with it in **0** of 3. Asserting symmetry converted the only observation
  bearing on the flattening claim into evidence of no effect. Under the confound this observation
  cannot mean anything anyway, but the misreport was independent of the confound.
- **The 2023-overrun count was wrong.** The earlier draft said four reps priced the two-sprint
  number against it. All six did.

## Verdict

**VOID. No gate decision.** The pre-registered degenerate branch fired and then the control
explained why: the fixture could not discriminate because the installed skill was answering.

What the run does establish is narrow and worth keeping: across six post-sweep reps in two skills,
none dropped a mandated section, missed the strongest objection, or complied with a wrong finding.
That is an absence of catastrophic breakage, observed under a confound that would have masked
anything subtler. It is not a gate pass and must not be cited as one.

**The stub's flattening claim remains untested.**

## What a valid arm would take

Not a repair of this one. The fixtures cannot simply be reworded, because any prompt realistic
enough to exercise `cold` will trigger-match `cold`.

- **Test a skill with no installed counterpart.** Give the variant text a fictional skill name and
  strip the trigger phrases, so nothing in the loaded plugin can claim the task. This is the
  isomorph `writing-skills` prescribes, applied to the skill rather than only to the fixture.
- **Restage the `responding-to-review` fixture** on a defect this repo has never resolved, with
  the rationale stripped out of any quoted comment.
- **Add a no-skill control to every cell**, since it is the only thing that made this run legible.
- **Score from shuffled, de-keyed answers**, or have a second agent score blind.
