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

   Four causes recur on this stack, cost one observation each to rule out, and invalidate every theory built without them. Rule them out early rather than reasoning past them:

   - **Deployment drift.** Is the thing that ran the source you are reading? Compare `sys.sql_modules` against the file for a procedure; check the built artifact's timestamp for code. A missed deployment leaves the old behavior in place, and then every theory about the source is a theory about the wrong text.
   - **Execution context.** What identity and settings did it run under: `WITH EXECUTE AS` on a procedure or trigger, the connection's principal, the environment's configuration. Code that behaves under your context can fail under the caller's, and nothing in the source shows it.
   - **The actual data shape at the failure point.** Query it. NULLs, duplicates, empty strings where NULL was assumed, a row count nobody expected: what is in the table is a hypothesis until you have selected it.
   - **Isolation and concurrency.** The declared isolation level (READ UNCOMMITTED returns mid-transaction state), and whether a competing writer touches the same rows in the window where it fails.

4. **Explain it.** One or two sentences: this fails because X, and here is the evidence. If the explanation cannot account for every observed symptom, the cause is not isolated yet; go back to step 3.

5. **Fix the cause, not the symptom.** The minimum change that removes the demonstrated cause. No defensive try/catch wrapped around the mystery, no retry loop hiding a race, no "also tidied up while here".

6. **Verify against the original repro.** Re-run the exact reproduction from step 1 and observe it pass. Then run the surrounding tests to confirm nothing else broke. A fix without this step is a claim, not a fact. Delete any temporary repro script afterward (unless told to keep it).

## When to stop and report

Stop investigating and bring the user the findings instead of guessing when:

- Three consecutive hypotheses have been falsified; the mental model of the system is wrong somewhere, and fresh information beats a fourth guess.
- The cause is isolated to something outside the workspace (vendor bug, infrastructure, data corruption) where a code change would only mask it.
- Reproducing requires access, credentials, or environments that are not available.

Report what was tried, what was ruled out (with the evidence), and the narrowed-down suspect list. Ruling things out is progress; hiding the dead ends wastes the next session's time.

## Red flags that mean restart this skill

- "Just try changing X and see if it helps."
- A fix is being written with no repro to verify it against, and irreproducibility was never declared per step 1.
- The explanation contains "probably" or "somehow" at the load-bearing step.
- The symptom moved (different error, different place) and the plan is to chase the new symptom without revisiting the hypothesis.
