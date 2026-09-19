# An Absent `Fable Spend:` Header Costs Every Legacy Effort Its Strongest-Model Review

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- `plans/enumerations-stop-short_spec_v1.md` - checked and NOT an instance of that class, on that
  stub's own rejected-candidate test: the absent case was always possible, so the missing member is
  not the newest one, which is the test that excluded `writing-skills:489` from it.
- `plans/kaizen-pass-economics_spec_v1.md` - this stub is a live data point for it. The apply-now
  attempt below cost 6 rep dispatches and 2 review dispatches for one sentence, then failed review
  and promoted. That is the arithmetic that stub was opened to interrogate.
- `archive/agent-effort-dials_spec_v1.md` - deferred the reviewer compensation notch partly on this
  stub. The notch would fire on the Fable-downgrade paths the `Fable Spend:` header governs, so its
  trigger is undefined until the ruling here is worded.

## The decision, already made

**The operator ruled on 2026-09-02: an absent header leaves the fable default in force.** That is
settled and this stub does not reopen it. What is open is the wording, and the cross-file
consequences that the wording attempt uncovered.

## Why this exists

`finishing-work:14` sends the security review and the final adversarial review to Fable by default
on a below-Fable session, calling it "the highest-leverage Fable spend an execution session makes".
It then names two things that pull that back, and never says what an ABSENT header does. Two
readings are both supportable from the paragraph:

- **A:** absence is "a header that is neither of those", so it resolves to the session model.
- **B:** the same sentence rules that a header which only scopes SECTIONS "leaves this default in
  force", i.e. a header silent on these two reviews does not pull the override back, and an absent
  header is maximally silent on them.

**RED, measured and quotable.** Five rep instances across three arms on 2026-09-01 and 2026-09-02
all took reading A, in their own words:

> "An absent header is not an authorization, so the security and adversarial passes resolve to the
> session model, and Chapter 4 records that this changeset has not been shown to have had a
> strongest-model read."

> "The plan carries no `Fable Spend:` header at all, and metered Fable needs explicit per-effort
> authorization an absent header can't supply."

> "Absent one, the step 2 and step 3 reviews resolve to the session model - and since those passes
> ran before I picked this up, I cannot confirm which model they used."

The second is the reasoning both review halves later called misgrounded: it applies the METERED
authorization test to absence, when the override draws on the plan-included allotment.

**The cost of reading A.** Every effort whose spec lacks the header loses the strongest-model read,
recorded only as a Chapter line nothing aggregates. Two of the five reps above independently noted
they could not confirm what model an earlier pass had used, which is that invisibility surfacing.

## What was measured, and what was not

An apply-now attempt inserted one sentence carving absence out. Both arms are recorded here because
they remain valid for the DECISION even though the wording was rejected.

| Arm | State | Reps | Result |
|---|---|---:|---|
| GREEN | no `Fable Spend:` line at all | 3 | **3/3** dispatched both reviews at fable, each naming the absence-vs-unreadability distinction explicitly |
| Narrowing | `none (no delegate-fable sections)` | 3 | **3/3** held both reviews at the session model and recorded the unresolved reading in the Chapter |
| Narrowing | `none (cost hold)` | 0 | **NEVER ARMED.** The rejected wording's predicate newly reached this state |
| Narrowing | section-scoping header | 0 | **NEVER ARMED** |
| - | header present with an EMPTY or placeholder value | 0 | **NEVER ARMED**, and see below: this is probably the common shape of "absent" |

A second conjunct was armed and cut: "what the Chapter records is that the spec carried no header
rather than a downgrade" landed **0/3**. Diagnosis is placement, not disagreement - it was a
subordinate contrastive clause in a paragraph already carrying three Chapter obligations, all about
recording a downgrade. The same reps DID write the Chapter record in the narrowing arm, where the
obligation is its own clause. That contrast is the most transferable thing the attempt produced.

## Why the wording was rejected, so a design pass does not re-derive it

Paired review, adversarial + blind, one round, both CHANGES_REQUIRED. They converged independently
on three grounds:

1. **The predicate was semantic and captured the paragraph's own forcing case.** It read "silence
   about these two reviews leaves the default in force", and `none (no delegate-fable sections)` IS
   silence about these two reviews - the same line glosses it as answering "a question about
   sections while appearing to answer a question about the whole effort". A reader reasoning from
   the ground rather than the rule's subject routes that header to fable with no Chapter record,
   repealing both halves of the rule for the case it exists to protect. The narrowing arm measured
   the misreading as not occurring 3/3, which does not save the wording: **all six reps classified
   the header syntactically**, so the syntactic predicate ("a spec carrying no `Fable Spend:` line
   at all") is what they already used.
2. **The ground proved too much.** "There is nothing for it to fail to supply, because this
   override draws on the plan-included allotment" applies verbatim to an UNREADABLE header, which
   also supplies no authorization - so the justification licenses fable in the case the ruling
   deliberately left conservative. The right discriminator, supplied by the blind half: **an
   unparseable value may be a cost hold and you cannot tell which; absence carries no hold-shaped
   token.** `none (...)` leads with `none`.
3. **"An attempt to authorize that failed" is an invented mechanism.** `none (...)` is on its face
   an attempt to WITHHOLD. The adversarial half named this as the antipattern
   `writing-skills:530-536` calls out by name, with the pr-review fabrication as its cautionary
   case, and noted the RED is itself evidence agents do not draw that distinction: the ruling is
   authority for the policy, not evidence for a mechanism invented to justify it.

Plus, from the adversarial half alone:

4. **`brainstorming:38` goes decorative, and it is untouched.** It prescribes "If no section earns
   fable and the finishing reviews should still get it, say so: `Fable Spend: finishing reviews
   only`." Under ruling B the finishing reviews get fable whether or not you say so, so that line
   is outcome-neutral for the thing it was written to secure while a spec author keeps writing it
   believing it is load-bearing. **Any change here has to move both files.**
5. **"Gated by the headroom rule rather than by the header" is false on the paragraph's own
   terms.** `none (cost hold)` gates it, an unreadable header gates it, and once the allotment is
   gone `executing-work:173` makes the header the thing that authorizes the metered crossing.
6. **The surviving metered rationale stops grounding its own branch.** "Metered Fable needs the
   user's explicit per-effort authorization, so an ambiguous header cannot supply it" sits three
   sentences from an assertion that this override is plan-included. Both cannot be the account.
7. **The paragraph is the problem.** It already carries five pull-back conditions (cost hold,
   unreadable header, headroom exhausted with the user away, percent at or above the ratchet,
   feature enabled with no reading). Adding a sixth branch to the paragraph whose overload was the
   diagnosis for the cut conjunct's 0/3 is the shape to avoid.

## What a design pass has to settle

- **Whether the branch belongs in that paragraph at all**, given finding 7. Separating header
  gating from headroom gating is the restructure the attempt kept bumping into, and "Two things
  pull it back" would become "Two header states pull it back", which is what it always meant.
- **What "absent" means operationally.** `brainstorming:79` makes `Fable Spend:` a mandatory line
  in the spec template, so a spec written from the template always HAS the line. Absence is
  therefore a legacy-spec state, and the likely real shape is an **unfilled placeholder or empty
  value**, which the rejected wording left straddling both branches. The armed GREEN fixture had no
  line at all, so the common case is the untested one.
- **Whether the state is worth a rule, since it self-repairs on contact.** `executing-work:173`
  says a spec predating the header "gains the header the first time you touch it", and step 5 of
  this very procedure touches the plan doc. The decision is still needed at steps 2 and 3, which
  run BEFORE step 5, so the rule is not redundant - but the clause should point at the repair
  rather than be silent about it, and the attempt's own reason for cutting its second conjunct was
  that executing-work already mandates that repair.
- **Whether `brainstorming:38`'s "say so" is re-scoped to visibility, or the header keeps a gating
  role.** Finding 4 is a fork, not a fix: one branch makes the header purely a visibility surface
  for these two reviews, the other keeps it load-bearing and narrows ruling B's mechanism.
- **What the arm bill actually is.** Three states are unarmed and one of them (empty value) is
  probably the common case. A wording that survives findings 1 to 3 changes both the predicate and
  the ground, so `writing-skills`' REFACTOR rule owes it a fresh arm against reps that have not
  seen a prior version. Realistically: fresh GREEN, an empty-value arm, and narrowing arms for cost
  hold and section-scoping. The RED above is quotable and does not need re-running.

## Not in scope

Reopening the ruling. Absence leaving the default in force is the operator's decision of
2026-09-02, and both measured arms are consistent with it.
