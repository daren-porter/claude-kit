---
name: systematic-debugging
description: Root-cause discipline for any bug, test failure, or unexpected behavior. Use BEFORE proposing or applying a fix, whenever something fails, breaks, regresses, or behaves differently than expected. Reproduce first, isolate the cause, fix, then verify against the original repro. Skip only when the cause is already proven (not just suspected).
---

# Systematic Debugging

Fixes proposed before the root cause is proven are guesses. A guess that happens to make the symptom disappear is the most expensive outcome: the bug is still there and now it is hidden. Follow the sequence; do not skip steps because the answer "seems obvious".

## The sequence

1. **Reproduce it.** Get the failure happening on demand: the failing test, a minimal repro script (the temporary repro-script discipline from the global rules), or the exact command and input that triggers it. A bug that cannot be reproduced cannot be verified fixed. If reproduction is genuinely impossible (production-only, timing-dependent), say so explicitly and treat every later conclusion as provisional.

2. **Read the actual error.** The full message, the stack trace, the logs around it. Not a skim; the answer is frequently in text that was scrolled past. Record what the error literally claims before forming theories.

3. **Isolate the cause.** Form a hypothesis, then test it with evidence: add targeted logging, bisect the input, shrink the repro, check the recent diff (`git log`/`git diff` over the touched area), inspect the relevant state. One variable at a time. Each test should be able to falsify the hypothesis, not just agree with it. Repeat until the cause is demonstrated, not just plausible.

4. **Explain it.** One or two sentences: this fails because X, and here is the evidence. If the explanation cannot account for every observed symptom, the cause is not isolated yet; go back to step 3.

5. **Fix the cause, not the symptom.** The minimum change that removes the demonstrated cause. No defensive try/catch wrapped around the mystery, no retry loop hiding a race, no "also tidied up while here".

6. **Verify against the original repro.** Re-run the exact reproduction from step 1 and observe it pass. Then run the surrounding tests to confirm nothing else broke. A fix without this step is a claim, not a fact. Delete any temporary repro script afterward (unless told to keep it).

## When to stop and report

Stop investigating and bring Daren the findings instead of guessing when:

- Three consecutive hypotheses have been falsified; the mental model of the system is wrong somewhere, and fresh information beats a fourth guess.
- The cause is isolated to something outside the workspace (vendor bug, infrastructure, data corruption) where a code change would only mask it.
- Reproducing requires access, credentials, or environments that are not available.

Report what was tried, what was ruled out (with the evidence), and the narrowed-down suspect list. Ruling things out is progress; hiding the dead ends wastes the next session's time.

## Red flags that mean restart this skill

- "Just try changing X and see if it helps."
- A fix is being written with no repro to verify it against, and irreproducibility was never declared per step 1.
- The explanation contains "probably" or "somehow" at the load-bearing step.
- The symptom moved (different error, different place) and the plan is to chase the new symptom without revisiting the hypothesis.
