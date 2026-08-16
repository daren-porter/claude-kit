# S3 claim inventory: the compression of writing-skills/SKILL.md

The artifact half of `writing-skills`' compression bill, for the compression recorded
in Chapter 3 of `kaizen-stop-start-continue_spec_v1.md` and committed at `1e5db4e`.

**Why it lives here.** That bill says a compression does not close until the unit, the
inventory and the probe output are recorded where the gated path records its own, and
the gated path's homes are the effort's Chapter or the commit carrying the wording. This
shipped in neither: it sat in `.kit/`, which is gitignored, so the rule's own words were
not met and the QA pass caught it. 347 rows inline would drown the Chapter, so the
artifact is committed here and Chapter 3 points at it. That is a deliberate reading of
the rule's purpose (durable and checkable by a later reader, never a description of an
artifact) rather than of its letter, and it is recorded as such rather than passed off
as compliance.

---


Sections compressed: `## Know it works before you trust it` (A) and
`## When a local RED is not available` (B), in
`plugins/claude-kit/skills/writing-skills/SKILL.md`.

## The claim unit, fixed before the rewrite

**One claim is one thing the section asserts that a reader could act on differently if
it were absent**: a directive, a bar, a permission, a named exception, or an assertion
about how something behaves. An example, a restatement and a rationale for a claim
already counted are not claims. Where I could not tell whether something was one claim
or two, I split it, and where the fine split maps to one survivor the row says so.

Every row carries three things: the claim, its trigger verbatim, and its attached
content (the provenance clause, locator, dated incident or recorded instance). An
unconditional claim records "unconditional" in the trigger column. Attached content is
not a claim and is not droppable; a row whose third column empties out between the two
texts is a drop, not a compression.

The unit was written here before the draft existed. The mapping direction
longer -> shorter (columns 1-4) was built against the longer text before drafting; the
`Kept as` column and the reverse direction (shorter -> longer) were filled after.

## Line counts, measured

| | Before | After | Removed |
|---|---|---|---|
| A `## Know it works before you trust it` | 175 | 164 | 11 |
| B `## When a local RED is not available` | 165 | 155 | 10 |
| Whole file | 535 | **514** | 21 |

**Target was "under 467". Reached 514. Shortfall: 48 lines.** The target was not
reachable without dropping claims, so per the section's own disposal rule the rewrite
stopped at the best honest compression. The reasoning is under "Why 467 is not
reachable" at the end of this file.

Line counts are only comparable if the wrapping is. The original's effective wrap width
was measured by unwrapping each section and re-wrapping it at a range of widths. Section
A is 174 text lines and re-wraps to 175 at width 95 / 173 at width 96; section B is 164
and re-wraps to 165 at width 93 / 163 at width 94. The compressed text was wrapped at 95
and 93, the conservative end of each bracket, so the line delta is text removed rather
than reflowing, and if anything it understates the removal by a line per section. Fill after the rewrite: A avg 87.8 chars/line against the original's 87.4,
B avg 82.8 against the original's 83.9 (B ends slightly under-filled, i.e. conservative).

---

## Direction 1: every claim in the longer text, and where it survives

### A. `## Know it works before you trust it`

| # | Claim | Trigger (verbatim) | Attached content | Kept as |
|---|---|---|---|---|
| A1 | An untested skill is a guess; the honest test is watching behavior with and without the wording | unconditional ("A skill you wrote and never tested") | none | opening para |
| A2 | RED = give a fresh subagent a realistic task that tempts the failure, without the new guidance | step 1 of the test | none | step 1 |
| A3 | Tempting it takes combined pressure (time + sunk cost + authority); a single pressure is a weak test | when building the RED task | none | step 1 |
| A4 | An untempted RED tempts nothing, and bites hardest on did-not-reproduce, where a clean run from an unpressured rep is the weakest ground for calling a rule redundant | "an untempted RED" | none | step 1 |
| A5 | Watch it fail; record the rationalization verbatim | when the RED fires | none | step 1 |
| A6 | For a silent-omission failure the artifact is the end state on disk plus a verbatim list of what the rep created, read and deleted | "When the failure is a silent omission" | rationale: a deleted file leaves no trace and the list cannot be reconstructed afterward | step 1 |
| A7 | Ask for that list in the dispatch | same as A6 | same clause | step 1 |
| A8 | One rep failing in the guarded state is a reproduction; record the ratio, do not need a majority | reading RED results | rationale: RED asks whether the failure can happen, which a single instance settles | step 1 |
| A9 | GREEN's every-rep bar is stricter for the opposite reason: whether the rule reliably holds, which no single instance settles | same as A8 (the asymmetry) | none | step 1, kept in place as the asymmetry clause; A18 also survives at step 2 |
| A10 | If it does not fail, or you could not build a task that would, there is nothing to fix - stop | "If it does not fail, or you could not build a task that would" | none | step 1 |
| A11a | Before reading a clean run that way, check the rep was in the state the rule guards | "Before you read a clean run that way" | none | step 1 |
| A11b | ...and then check what produced its compliance | same | none | step 1 |
| A12 | A fixture staging the case the rule does not cover comes back clean by construction, so that run says the RED has not been attempted yet | clean run, rep not in the guarded state | none | step 1 |
| A13 | A rep in the state can comply because something else in the kit already forces the behavior, which is a finding about the draft rather than the rule | clean run, rep in the guarded state | none | step 1 |
| A14 | Both live in the four answers under "When a local RED is not available", and they read any clean run, not only that section's | any clean run | locator: the section name | step 1 (kept in place, per trigger) |
| A15 | Evidence real but not yours to re-run, ported or reported, costs three recorded artifacts rather than a claim | "Evidence that is real but not yours to re-run, ported or reported" | locator: same section | routing block (destination merged, condition kept verbatim) |
| A16 | A rewrite that adds no claim cannot stage a RED at all, and routes to "Compression", not to the four answers; the test is a finished two-directional mapping | "a rewrite that adds no claim" | locator: the section name | routing block (destination merged, condition kept verbatim) |
| A17a | GREEN adds the minimal guidance addressing that specific failure | step 2 | none | step 2 |
| A17b | Re-run under the same pressure RED carried | step 2 | none | step 2 |
| A18 | GREEN's bar is every rep; two in three is not a rule | step 2 | none | step 2 |
| A19a | REFACTOR: if it finds a new loophole, add the counter and re-run until it holds | "if it finds a new loophole" | none | step 3 |
| A19b | Each revision is a fresh arm against reps that have not seen a prior version | each revision | none | step 3 |
| A20 | A rule change to shipped wording asks RED whether the rule as it stands produces the harm | "Changing a rule the kit already ships" | rationale: a rep obeying the current rule is complying with the shipped kit rather than failing, and counting that would make the RED fire for any rule change whatever | rule-change para |
| A21 | Stage the state where the current rule does the damage | same | none | rule-change para |
| A22 | Read the rep's reasoning, not only its output | same | rationale: a rep can reach a defensible outcome while documenting a misreading of the rule being replaced, and that misreading is the finding | rule-change para |
| A23 | Take it off the rep's transcript rather than asking | same | rationale: asking tells it which line is graded | rule-change para |
| A24 | RED and GREEN share that one state, since GREEN re-runs RED's task | same | none | rule-change para |
| A25 | A narrowing owes a third arm in the state the change leaves alone, read for the rule still doing there what it always did | "a narrowing" | rationale: one that quietly took the untouched case with it looks exactly like one that worked | rule-change para |
| A26a | That third arm carries the draft and can fail, so it holds the replaced rule in its fixture | the third arm | none | rule-change para |
| A26b | ...and dispatches serially like RED | the third arm | none | rule-change para |
| A27 | Run three reps at least - one sample lies | any arm | none | standard para |
| A28 | Read every flagged result yourself | any arm | rationale: template echoes masquerade as both failures and successes | standard para |
| A29 | This is the standard for any change to behavior-shaping content, the kit's own skills included | unconditional | none | standard para |
| A30 | Three sections route around it, and cost chooses none of them | unconditional | none | routing block |
| A31a | "When a local RED is not available" is for evidence real but not yours to re-run | (same condition as A15) | locator: section name | routing block |
| A31b | It substitutes different work rather than less | that section | none | routing block |
| A32 | "When you meet a counter-case to a rule" states its own bill and when it is available | that section | locator: section name | routing block |
| A33 | "Compression" takes a rewrite that keeps every claim the section already makes, on a bill of an inventory and a probe; it opens on a finished two-directional mapping and never on an intention to shorten | (same condition as A16) | locator: section name | routing block |
| A34 | Run RED before you persist the wording | unconditional (RED) | none | leak para |
| A35 | Keep the wording out of three places: the repo, the scratchpad, the RED prompt | RED-side | none | leak para |
| A36 | Baseline-testing a kit skill edit from inside the kit repo is a trap; a persisted edit leaks into the RED and voids it as a control | RED run from inside the kit repo | recorded instance: "a RED rep once cited the edited file's line numbers" | leak para |
| A37 | The RED prompt is barred for the same reason | RED prompt | rationale: the prompt that carries the wording is GREEN's, and RED's whole job is to fail without it | leak para |
| A38 | The scratchpad is the worst of the three, because fixtures point subagents into it by construction (report, sample input, the file the rep reads) | scratchpad | dated incident: a rep found the candidate wording beside its own fixture, read it, and reported the contamination itself (2026-08-11), the operator having deliberately kept the draft out of the repo and put it there instead | leak para |
| A39 | "Out of the repo" is the wrong test and passing it is no comfort | same | same incident | leak para |
| A40 | The arm controls which copy of the skill the rep reads, and the repo is not it | unconditional | none | cache para |
| A41 | Reps load skills through the harness from the installed plugin cache, which lags | unconditional | none | cache para |
| A42 | Resolve the live copy from `<configBase>/plugins/installed_plugins.json`, which names its `installPath` | unconditional (dispatching a rep at a skill) | locator + dated evidence: neither guessing the tree nor sorting by mtime finds it; a second cache tree under `~/.claude/` on 2026-08-15 held a build with whole skills missing; sibling versions tie on mtime; 13 versions under the live tree alone; the active one was behind the repo on `executing-work` and `finishing-work` by content nothing to do with the edit under test | cache para |
| A43 | A rep that reaches a skill by name reads text you are not editing, and a RED firing against a stale baseline licenses wording the live file may already make redundant (the redundancy finding inverted) | rep reaches a skill by name | none | cache para |
| A44 | Point each rep at an explicit repo path, or hand it a fixture copy and diff that copy against the repo file at dispatch | at dispatch | none | cache para |
| A45 | GREEN carries its wording in the prompt; in-prompt is mandatory rather than stylistic | GREEN | rationale: persisting to the repo does not change what a rep loads | cache para |
| A46 | What goes untested that way is placement, trigger, and whether a real session would read the rule at all | GREEN in-prompt | none | cache para |
| A47 | The scratchpad bar is arm-scoped, not absolute: it binds through every RED-side arm and lifts once you are running GREEN | RED-side vs GREEN | rationale: a GREEN fixture copy in the scratchpad is the mechanism working, not a leak | scratchpad-scope para |
| A48 | Run the arms serially, so no RED rep is alive while a GREEN fixture holding the draft exists | RED and GREEN in one effort | none | scratchpad-scope para |
| A49 | Quarantine the spent GREEN fixtures before any REFACTOR arm, which is RED-side again for the revised wording | before any REFACTOR arm | none | scratchpad-scope para |
| A50 | Persist when the arm is done, not when the first rep fails | unconditional | rationale: three reps make an arm, and a repo written to after rep 1 contaminates reps 2 and 3 | scratchpad-scope para |
| A51 | Until then the wording lives in your own context and in no file you wrote | until the arm is done | none | scratchpad-scope para, kept verbatim |
| A52 | Absolute absence is not the bar, because it is not available | unconditional | dated locator: the harness records prompts and tool results into this session's transcript and a per-subagent transcript at `<configBase>/projects/<project>/<session-id>/subagents/agent-<agentId>.jsonl`, owned by the same user the reps run as (verified 2026-08-11; path corrected 2026-08-15, the earlier "sibling under `projects/`" being two levels too shallow, which matters because the detection rule sends you to that file) | detection para |
| A53 | What you control is which paths a rep has reason to walk; a rep working a fixture has every reason to open the skill file and none to open a transcript directory | unconditional | none | detection para |
| A54 | Those three are where it bites in practice rather than an exhaustive list; any other directory you point a fixture into inherits the same property | any other directory a fixture points into | none | detection para |
| A55 | Past them what is left is detection: read what each rep actually opened before you count it | unconditional | none | detection para |
| A56 | Recover a rep's agentId by grepping its `toolUseId` across the `.meta.json` sidecars beside those transcripts (which carry the dispatch `description` and `spawnDepth`), then read the paths its transcript records | when detecting what a rep read | dated verification: both verified 2026-08-15, after a first draft sent you joining `tool_use` to `tool_result` in your own transcript, which works and is two steps longer; named here because the obligation appears three times in this section with no way to discharge it | detection para |
| A57 | Nested reps land in the root session's `subagents/`, not their dispatcher's, so that is the one directory to search | nested reps | same dated verification | detection para |
| A58 | Asking the rep what it read is self-report and is not the instrument | unconditional | rationale: it is the thing this section distrusts everywhere else, and a rep that read what it should not have is the least likely to volunteer it | detection para |
| A59 | On the gated path, where RED by construction never fails, the persist hold releases once that path's first two preconditions have been done and their artifacts recorded, never on the writing-up alone | "On the gated path below" | none | detection para |
| A60 | Reps that run in parallel need one fixture each: copy the fixture once per rep and point each rep at its own copy | reps run in parallel | dated incident: three reps dispatched at once against a fixture holding a single output path overwrote each other; the tell was a rep reporting that "the file was rewritten on disk by an outside process twice while I worked", then auditing what it found and keeping the better version, so its artifact was partly another rep's (2026-08-14) | parallel-fixture para |
| A61 | The leak rules are about what a rep can read; this one is about what two reps can write | same | none | parallel-fixture para |
| A62 | Whether a rep took the action under test survives this; any judgment of what it produced does not | same | same incident | parallel-fixture para |
| A63 | The failure is silent unless a rep happens to mention it, so do not rely on noticing | same | same incident | parallel-fixture para |
| A64 | The kaizen inbox is that same hazard with no fixture in it: the global posture rule sends every rep to `~/.claude-kaizen/notes.md`, so a rep testing a kit skill files a note about the gap under test and a concurrent rep reads it as prior art | any arm on a kit skill | dated instance: one rep opening with "the kaizen notes for both frictions are already filed from earlier in this pass" (2026-08-15) | kaizen-inbox para |
| A65 | Clear the inbox before an arm and read it after, counting whatever is in it as those reps' output rather than as inbox items | before/after an arm | none | kaizen-inbox para |
| A66 | That buys attribution and not isolation: clearing beforehand does nothing about rep 2 reading rep 1's note mid-arm, and mid-arm is when it happened | same | dated instance above | kaizen-inbox para |
| A67 | Isolation costs serial dispatch with a clear between reps, and the arm that earns it is RED | when isolation is wanted | dated evidence: of five arms run on 2026-08-15, only RED produced inbox writes, because the rep the wording fails is the rep with something to file | kaizen-inbox para |
| A68 | Scoped wider than RED, the exception swallows the parallel default, since the posture rule points every rep at that same file | scoping the exception | none | kaizen-inbox para |
| A69 | Nothing about this announces itself: every rep followed a standing rule correctly, and the shared file is kit-owned rather than something the fixture pointed at | same | none | kaizen-inbox para |
| A70 | Reps' own outputs travel the same way | unconditional | dated incident: a probe this session opened a gate file an earlier rep had written to the shared scratchpad under a near-identical fixture, took its pre-fix wording for a prior pass having dropped the rule, and reported that as a finding; the file simply predated the wording (2026-08-15) | kaizen-inbox para (fused, both directions kept) |
| A71 | Sweep both directions: clear what a rep could find before an arm, and attribute what you find after it | same | same incident | kaizen-inbox para |
| A72 | The answer leaks too: a fixture restaging a situation this repo has already resolved leaves a second route to the conclusion open (the commit, the archived plan, the Chapter that recorded the decision) | fixture restages a resolved situation | none | answer-leak para |
| A73 | Those routes are not all in-repo: other sessions' scratchpads persist on the machine | "when the fixture imitates real work rather than a decision" | dated incident: a rep sent to review a fictional PR found a real gate report for the very PR the fixture was modelled on (2026-08-11) and reasoned from it | answer-leak para |
| A74 | Give the fixture identifiers nothing on this disk already answers | fixture design | dated incident: one RED lost all three of its reps that way (2026-08-10), each reaching the recorded answer rather than deriving it, one through `git show <sha>:docs/plans/...`, one through a `docs/archive/` grep, one by reading the commit | answer-leak para |
| A75 | Instructing the subagent not to look is not a control; a fresh agent that checks its premises will look and is right to | same | none | answer-leak para |
| A76 | The test is whether the answer is on disk, not whether the fixture told it to stay away: a fixture asking for a decision this repo already made has one to find, a fixture asking for a behavior has none | same | none | answer-leak para |
| A77 | Stage an isomorph with the specifics changed, or a situation the repo has never resolved, and read what the rep actually opened before you count it | same | none | answer-leak para (second half restates A55; fine split maps to one survivor) |
| A78 | An open question the repo documents primes rather than answers, which is harder to notice and is a surface the kaizen loop creates for itself | repo documents an open question in the arm's territory | dated incident: a probe on 2026-08-15 read a `docs/plans/` stub committed hours earlier in that same pass and reported its framing as primed rather than independent; the finding survived, being checkable against the skill text, the claim to have reached it independently did not | answer-leak para |
| A79 | When an arm's territory is a question this repo has parked, discount what a rep reports having found on its own, and expect a promoted note to be exactly where its territory got documented | "when an arm's territory is a question this repo has parked" | same incident | answer-leak para |

### B. `## When a local RED is not available`

| # | Claim | Trigger (verbatim) | Attached content | Kept as |
|---|---|---|---|---|
| B1 | Sometimes the evidence for a rule is real but not yours to re-run: wording ported from another kit that wrote it against a failure it observed, or a failure Daren reports from a live session a synthetic RED will not reproduce | the two disjuncts, verbatim | none | opening para |
| B2 | Dropping that wording because your own RED came back clean discards real evidence | same | none | opening para |
| B3 | This is a gated path, not a judgment call; three preconditions | on this path | none | opening para |
| B4 | Each precondition is discharged by an artifact, never by your description of one | each precondition | rationale: a summary of work nobody can see is the walk this gate exists to block, and the RED bar above already demands the rationalization verbatim | opening para |
| B5 | The artifacts live in the effort's Chapter; the backlog carries the one-line debt plus a pointer to it | effort has a plan doc | locators + rationale: per-effort history belongs in Chapters, which is what `curating-docs` says and what `docs/backlog.md` is not shaped for; quoted subagent output pasted into a one-line active-items file gets truncated to fit, which is the description-instead-of-artifact walk this gate blocks | homes para |
| B6 | It also keeps the record writable on the default delegated path | delegated path | locator: `docs-write-guard` denies an implementer any `docs/` write | homes para |
| B7 | A delegated run parks the artifacts in `.kit/` and the main thread folds them into the Chapter at section close | "A delegated run" | none | homes para |
| B8 | The Chapter carries the first two artifacts before the wording is persisted and the third after | Chapter home | none | homes para |
| B9 | The section does not close until it carries all three, and a debt pointer resolving to a Chapter missing any of them is an open gate | Chapter home | none | homes para |
| B10 | A change with no plan doc has no Chapter; the home is then the commit that carries the wording, the `kaizen` case, a home rather than an exception | "A change with no plan doc" | rationale: a commit message has no line budget to truncate quoted output, it is atomic with the wording it evidences, and a sha in the debt line resolves on any machine and in any clone, which a path into someone's home directory does not | homes para |
| B11 | Before the wording is persisted, "recorded" means captured as verbatim text you could commit right then (a drafted message body, or a `.kit/` file folded in at commit time), never a summary you mean to write up afterward from memory | "Before the wording is persisted" | rationale: that is the walk this gate exists to block | homes para |
| B12 | Neither home witnesses the ordering, which is why precondition 1 demands the prompt as well: what shows a rep ran before the edit is the prompt carrying the wording, not any timestamp | both homes | none | homes para |
| B13 | The commit is not made until its message carries all three artifacts, the probe included | commit home | none | homes para |
| B14 | Precondition 1: you attempted a local RED. Artifact: the fresh subagent's actual output, quoted, not a report of it | precondition 1 | none | precondition 1 |
| B15 | Which outcome you are on turns on whether your rep entered the state the rule guards, never on whether it came back clean | reading the RED result | rationale: a fixture staging the case the rule does NOT guard produces a clean run by construction, which is not evidence of anything | precondition 1 |
| B16 | Ask what state the rule is about, then whether the rep was in it, and only then read the result | same | none | precondition 1 |
| B17 | Four answers; only the last two are this section's, and they carry different bars | same | none | precondition 1 |
| B18 | In the state and the failure appeared: you are on the normal bar with a real local RED, and none of this section's costs attach | answer 1 | rationale: the easiest answer to walk past, because a rep that read as fine overall can still carry the defect in its output, which is why you read the output rather than the rep's summary of itself | precondition 1, bullet 1 |
| B19 | Not in the state and the state is stageable: you have not attempted the RED yet; restage it, and do not file the clean run under either branch below | answer 2 | rationale: a rep never in the guarded state cannot speak to what happens inside it | precondition 1, bullet 2 |
| B20 | Did not reproduce: the rep was in that state and behaved correctly anyway; three reps at least, and the entry carries their output | answer 3 | rationale: so a clean run is as checkable as a failing one | precondition 1, bullet 3 |
| B21 | Ask what produced the compliance before you file it here | answer 3 | rationale: these four answers classify the rep's state and not the cause of its behavior | precondition 1, bullet 3 |
| B22 | When something already in the kit forces the result (a REQUIRED field in the template, a hook that rejects the bad output, a step the surrounding skill already orders), the finding is that the draft is redundant and the change is to cut it | "When something already in the kit forces the result" | rationale: a better outcome than admitting it, and one this branch otherwise buries | precondition 1, bullet 3 |
| B23 | Where the change forecloses a reading the current wording still allows, the rule being replaced is not one of those things; take that to the fall-through, not to the cut | "Where the change forecloses a reading the current wording still allows" | rationale: a clean run shows that wording can be read the intended way, never that it will be, and the reading you are removing is the one no rep happened to take | precondition 1, bullet 3 |
| B24 | When nothing does, and the rep simply routed around wording that was wrong, that is a real did-not-reproduce and the wording may still be worth fixing on its own evidence | "When nothing does" | rationale: prose that only capable readers survive is a defect whether or not a rep trips on it | precondition 1, bullet 3 |
| B25 | Could not be constructed: name the element you cannot stage and the substitute you tried, with the substitute's output and where it fell short | answer 4 | worked example: "I compressed the session to forty turns of synthetic context, and here is what came back" | precondition 1, bullet 4 (example kept in short form) |
| B26 | Naming the element alone is never enough | answer 4 | rationale: "their harness", "their platform" and "a long live session" are the entry conditions restated, and a gate discharged by restating its own entry condition is paperwork | precondition 1, bullet 4 |
| B27 | Without a substitute that actually ran, this branch fails the gate; it is the cheap branch, so it is the strict one | answer 4 | none | precondition 1, bullet 4 |
| B28 | One case owes no substitute, because no substitute could reach its state: a rewrite that adds no claim, which "Compression" routes and gates on a finished two-directional mapping. Nothing else is excused by resembling it | "a rewrite that adds no claim" | locator: the section name | precondition 1, bullet 4 |
| B29 | The two branches want different evidence on purpose: did-not-reproduce asserts a behavioral negative, so it takes three reps; a substitute measures no behavior, so reps add nothing and what it establishes is that you reached for the element. Do not read the single substitute as the lower bar and file a single clean in-state rep beside it | the two branches | none | precondition 1, closing para |
| B30 | Attempt it first, and record the prompt alongside the output | precondition 1 | none | precondition 1, closing para |
| B31 | On a rep carrying the new wording, the prompt shows the wording was supplied in-prompt rather than read off the repo; output alone proves the rep ran, not that it ran before the edit, and both land in the same commit, so git witnesses nothing | "On a rep carrying the new wording" | none | precondition 1, closing para |
| B32 | On a substitute, which carries no new wording, the prompt shows which state the substitute actually staged, so the branch you claimed is checkable rather than asserted | "On a substitute" | none | precondition 1, closing para |
| B33 | Precondition 2: you can locate the failure someone else recorded. Artifact: a locator another person could follow - for a port, the file and section of their spec, Chapter or incident write-up; for a report, a date or a transcript path | precondition 2, split by port vs report | none | precondition 2 |
| B34 | A detailed account with no locator does not qualify: hearsay with more words, and the disjunct an agent in a hurry reaches for | precondition 2 | none | precondition 2 |
| B35 | A preference or a hunch is not a report, and wording whose provenance you cannot locate goes back to the normal bar | precondition 2 | none | precondition 2 |
| B36 | A rule the other kit wrote from imagination reads exactly like one it wrote from an incident | precondition 2 | none | precondition 2 |
| B37 | Then persist, and run the third | ordering | none | between preconditions 2 and 3 |
| B38 | Precondition 3: a followability probe on the persisted wording. Artifact: the probe subagent's output, in the same Chapter | precondition 3 | none | precondition 3 |
| B39 | This is the precondition most easily skipped, because it falls due after the work looks finished; with no recorded output a skipped probe and a passing one are indistinguishable, so an entry without the probe's output records a gate that was not passed | precondition 3 | none | precondition 3 |
| B40 | This is not GREEN as defined above: re-running the RED task proves nothing here, because on this path that task either does not exist or already passed without the wording | precondition 3 | none | precondition 3 |
| B41 | Hand a fresh subagent the persisted wording and a realistic task inside the rule's territory, which is all the task has to be | precondition 3 | none | precondition 3 |
| B42 | It does not have to stage the failure, so the could-not-be-constructed branch can always run this | could-not-be-constructed branch | none | precondition 3 |
| B43 | Check that it applies the rule correctly; it fails if the subagent misapplies the rule or has to ask what it means | precondition 3 | none | precondition 3 |
| B44 | Three reps at least for a pass, since one clean run tells you little; a single failure is enough to act on | precondition 3 | none | precondition 3 |
| B45 | Ask whether the rule was applied, not whether an ambiguity can be named in it | phrasing the probe prompt | dated incident: a capable reader can answer the second about any prose, so such a prompt gets a list however good the wording is, and that list reads as friction without being any; three probes phrased that way on 2026-08-15 returned twelve inbox notes against wording all three had applied correctly, and the count was then read as a measure of the kit rather than of the prompt | precondition 3 (kept as its own bolded rule; cross-referenced by `## Compression`) |
| B46 | Keep the self-report to what the rep had to interpret in order to act | same | same incident | precondition 3 |
| B47 | A failed probe is not a regret, it is a stop: revert the wording, or fix it and re-probe, before the work closes | probe fails | rationale: unfollowable prose that shipped with a note saying it should not have is the worst of both | precondition 3 |
| B48 | The probe proves followability and nothing else: it does not validate the claim and it does not discharge the debt below | precondition 3 | none | precondition 3 |
| B49 | Every claim in the persisted wording maps to a specific sentence in the source record, or it is cut | bounding what you claim | rationale: the checkable form of "narrowing and restating are admitted, extending is not"; adaptation to this kit's vocabulary and harness is fine, but a claim with no sentence behind it asserts something the source never observed, so it is held to the normal bar; it does not ride in on the ported half's evidence just because it shared a sentence | bounds bullet 1 |
| B50 | Mark the provenance, not the coverage, as a clause in the wording itself, carrying the locator into it | bounding what you claim | none | bounds bullet 2 |
| B51 | Do not try to label which half of a sentence is covered | same | none | bounds bullet 2 |
| B52 | What a later session needs is to know the evidence is borrowed and to be able to read it, so it can weigh the rule against its own observations instead of treating it as locally proven; a marker naming no source sends it hunting through an archived backlog | same | none | bounds bullet 2 |
| B53 | This is the one place the "nothing at all for judgment wording" rule below yields | same | locator: the rule below | bounds bullet 2 |
| B54 | Record the debt in `docs/backlog.md`: one line, naming the wording and pointing at whichever home holds the artifacts, the Chapter or the commit sha | bounding what you claim | none | bounds bullet 3 |
| B55 | This clause holds the rule, that home holds the evidence, and the backlog holds the open instances | same | none | bounds bullet 3 |
| B56 | A sha pointer costs one ordering: the line cannot sit in the commit it cites, so it lands in a second commit after it, and amending the first rewrites the sha the line just cited | sha pointer | none | bounds bullet 3 |
| B57 | The debt closes on one of two observable events: the failure occurring, or a session where the rule was applied and the record shows what it changed. "It seems to be working" closes nothing, and neither does time. Retiring the wording also closes it | debt closure | none | bounds bullet 3 |
| B58 | Marking wording as unverified is not itself an admission path: a claim you simply believe, with no port and no report, is either cut or held to the normal bar | no port and no report | none | closing para |
| B59 | Scoping a rule you already had against a counter-case is the separate discipline below | counter-case | locator: the section below | closing para |

---

## Direction 2: every claim in the shorter text, mapped back

Walked sentence by sentence over the applied text (SKILL.md lines 81-244 and 303-457).
Every assertion in the shorter text maps to a row above; that mapping is the `Kept as`
column read in reverse. **No sentence in the shorter text asserts anything the longer
text did not**: the rewrite introduced no directive, no bar, no permission, no named
exception and no assertion about how something behaves. Nothing fell to the second
disposal rule (a claim only in the shorter text is new wording, so cut it).

The reverse walk is only useful if it names what was removed, so here is the complete
list, each item classified and mapped to the row that still carries the claim.

### Removed from A

| Removed text | Class | Where the claim still lives |
|---|---|---|
| "the report and the sample input and the file the rep is sent to read all living there" | example list | A38's claim ("fixtures point subagents into it by construction") stands |
| "for the same reason:" before the RED-prompt bar | framing | A37, reworded to "because" |
| "which is the thing this section distrusts everywhere else" | rationale | A58's bar stands |
| "and it is named here because the obligation appears three times in this section with no way to discharge it" | meta-rationale | A56; the obligation itself stays at A55 |
| "Two consequences." / "which is the weaker half" | framing | A48/A49 and A66 stand |
| A77's trailing "and read what the rep actually opened before you count it" | fine split to one survivor | A55, which states it once in the detection para |
| the second entry into the gated path and into Compression (step 1's "Two things route away from here...") | duplicated destination | A15/A16, whose **conditions** are quoted verbatim into the routing block |

### Removed from B

| Removed text | Class | Where the claim still lives |
|---|---|---|
| "which is the description-instead-of-artifact walk this gate exists to block" | restatement (3rd of 3 echoes) | B4 states the walk once; B5 keeps "which is that same walk" |
| "which is the walk this gate exists to block" (B11's echo) | restatement | B4 |
| "which a path into someone's home directory does not" | rationale | B10's two surviving reasons |
| "Two things follow, and they are the Chapter's ordering rules in the only form a change without sections can take them." | framing | B11/B12/B13 follow regardless |
| "the Chapter no more than the commit" | restatement | B12 |
| "which is the section-does-not-close rule for a change that has no sections" | restatement | B9, and B13's own sentence |
| "which is why you read the output rather than the rep's summary of itself" | restatement | B14's artifact rule |
| "their platform" from the trio of restated entry conditions | example | B26 keeps two of three |
| "I compressed the session to forty turns of synthetic context, and here is what came back" | worked example, shortened not dropped | B25, now "a forty-turn synthetic-context compression, say, and what came back" |
| "a fixture that cannot reach the guarded state will not reach it on the fifth run either" | rationale | B29's claim ("reps add nothing") stands |
| "so it can weigh the rule against its own observations instead of treating it as locally proven" | rationale, restates B50 | B50, B52's surviving half |

Two removals were reversed during the walk, because the inventory showed I had cut the
actionable half of a row rather than its argument. Recording them because they are the
mechanism working, not tidy afterthoughts:

1. **A12/A13.** A first draft read "A fixture staging the case the rule does not cover
   comes back clean by construction, and a rep that was in the state can comply because
   something else in the kit already forces the behavior" - keeping both setups and
   cutting both conclusions ("rather than that there is nothing to fix", "which is a
   finding about the draft rather than about the rule"). Restored in full.
2. **B31.** The clause "and the record and the edit land in the same commit either way,
   so git witnesses nothing" was cut as a restatement of B12. It is not: B12 asserts that
   neither *home* witnesses the ordering, while B31 asserts a fact about git. Restored,
   at a cost of one line.

Also restored on the same test: "with the shipped kit" (A20), "is stricter" (A9), "since
asking tells it which line is graded" (A23), "to the repo" (A45), the permission "a GREEN
fixture copy in the scratchpad is the mechanism working, not a leak" (A47), "the shared
file is kit-owned" (A69), and "Copy the fixture once per rep and point each rep at its
own copy" (A60).

## Disposal decisions

- **Direction 1 (a claim only in the longer text).** Fired once, on **B55** ("This clause
  holds the rule, that home holds the evidence, and the backlog holds the open
  instances"), which a draft cut as framing. Per the rule it was **restored to the
  shorter text and is recorded as a retirement candidate** below. The rest of the rewrite
  stays a compression.
- **Direction 2 (a claim only in the shorter text).** Never fired. Nothing was added.
- **Direction 3 (a trigger that moved).** Never fired, and it was the constraint that
  shaped the one structural merge. The longer text entered the gated path from two
  conditions (A14, on reading any clean run; A15, on evidence real but not yours to
  re-run) and entered `## Compression` from two (A16, A33). I merged the **destinations**
  into one routing block and kept every **condition** where it was: A14 stays inside step
  1, and A15/A16's conditions are quoted verbatim into the routing block ("Evidence that
  is real but not yours to re-run, ported or reported" and "A rewrite that adds no
  claim"). Read cold, each surviving clause binds the same set of situations it bound
  before. No trigger was broadened, narrowed or relocated.

### Retirement candidates

Recorded, not acted on. Retiring any of these is a separate change owing the arms what a
rule change owes.

1. **B55** - restored per the disposal rule. It restates the division of labour already
   set by B50 (the clause holds the rule), B5 (the home holds the evidence) and B54 (the
   backlog holds the open instances).
2. **The doubled routing into the gated path and into `## Compression`.** Now stated once
   in A's routing block, but B's opening and B28 state the same destinations a third
   time.
3. **A59** ("on the gated path the hold releases once the first two preconditions have
   been done and their artifacts recorded") against **B8** and **B11**, which carry the
   same ordering from B's side. A59 survives because it is framed as a named exception to
   A's persist-hold, which B never frames it as.
4. **A63** ("the failure is silent unless a rep happens to mention it") against **A69**
   ("nothing about this announces itself"). Same claim, two hazards, two reasons.

## Attached content

Every third-column entry survives in the shorter text with its narrative intact, not
thinned to a bare date. Three checks, because the cheap one is not sufficient:

1. **Date markers** (whole file): 14 before, 14 after, same distribution (1x 2026-08-10, 3x
   2026-08-11, 1x 2026-08-14, 8x 2026-08-15, 1x 2026-08-16).
2. **Backtick-quoted locators**: the full multiset is byte-identical before and after
   (26 distinct locators, `diff` clean). This is the check the date grep cannot do, since
   `installed_plugins.json`, the `agent-<agentId>.jsonl` path, `toolUseId`, `spawnDepth`,
   `curating-docs`, `docs-write-guard` and the rest are not date-shaped.
3. **The third column walked by hand** against the new text. Neither grep would catch a
   dated incident thinned to a bare `(2026-08-15)` with the narrative removed, which is
   the specific failure this column exists to make visible. Every incident keeps its
   narrative: the line-numbers rep, the fixture-adjacent draft, the two cache trees and
   the 13 versions, the transcript path correction, the overwriting reps and their quoted
   complaint, the "already filed from earlier in this pass" opener, the five arms, the
   predating gate file, the fictional PR, the three reps that found the recorded answer by
   three different routes, the twelve inbox notes, and the primed `docs/plans/` stub.

---

## Why 467 is not reachable by compression

Reached 514 against a target of 466. The gap is 48 lines, and it is structural rather
than a matter of trying harder.

- **Two passes, measured.** The first pass cut argumentation only: 3.4% of section A's
  characters. The second cut rationale, framing, restatement and examples much harder,
  and reached 5.8% on A and 7.3% on B (6.5% overall). Reaching 466 needs about **18.5%** off both
  sections together. Nothing enumerated as remaining fat totals more than another 4-5%.
- **The sections are mostly claim and evidence.** 143 claims across 24,598 characters is
  ~172 characters per claim, and much of that is condition and locator rather than prose.
  A register test confirmed the ceiling: rewriting the kaizen-inbox paragraph
  telegraphically saved 55 characters out of 1,020, about half a line, and read worse.
- **The file's own rule caps how short a compression can get.** A claim with nothing
  opposite it is *restored* and recorded as a candidate; a compression is not permitted to
  retire anything. So once the argument is gone, the floor is the claim set itself.
- **The arithmetic of the ask.** The effort added 68 lines, but 58 of them are the new
  `## Compression` section, which is out of scope. A and B grew about 10 lines net.
  Getting the file under 467 while keeping that 58-line section means taking 69 lines out
  of A and B - roughly seven times what the effort put into them.

The reading this supports: **the accretion in these two sections is claim accretion, not
prose accretion.** Compression is the wrong instrument for it. The remaining path is
retirement, which the file itself routes to the arms as a separate change, and the four
candidates above are where I would start.
