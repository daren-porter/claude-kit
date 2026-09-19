# The Report File Is Three Unsolved Problems Wearing One Convention

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-09-02

## Related

- `plans/prose-claim-review_spec_v1.md` - its 2026-09-04 design council hands this spec one
  constraint and one corroboration. **Constraint:** the report path this stub must bound also has
  to satisfy that council's placement criterion, because an orchestrator-materialized report
  carries the draft wording it reviewed, not only findings about it. That criterion is stricter
  than "leak nothing to a blind seat" and is already stated there in full.
  **Corroboration:** two council seats independently reported the framework-injected "do NOT write
  report files" line present in their own prompts, unprompted, which is a second and third
  first-hand sighting of what the ANSWERED section below established by probe.

- Promoted 2026-09-02 from `~/.claude-kaizen/briefs/report-file-vs-write-refusal.md`, whose own
  2026-09-01 triage read "SPEC, not an apply", together with three inbox notes that turned out to
  be the same convention failing in three other places.
- `docs/backlog.md` carries the open question this stub now owns: bounding a report path so it can
  be handed to a blind seat without naming the section, the round or the role.
- `plans/enumerations-stop-short_spec_v1.md` - the Re-review half of the pr-review brief is an
  instance of that class; this stub is not, and the distinction is that nothing here is one member
  short of a set. The convention is underspecified rather than incomplete.

## Why this exists

`executing-work:81` and `:169` mandate that a dispatched agent write its full report last to a
named path, and that the orchestrator treat that file's existence as the readiness signal. Under
an armed leash that file is the ONLY readiness signal, so a session with no file has nothing to
poll. Four independent failures now sit on that one convention, and no two of them have the same
fix:

1. **A tool-level refusal contradicts it.** An implementer attempting the write got back
   "Subagents should return findings as text, not write report files", verbatim. Two implementers
   dispatched in parallel with identical instructions diverged: one reached for Bash and the file
   appeared, the other took the refusal as policy and returned inline, so the orchestrator polled
   for a file that would never appear and would have waited out its full hour.
2. **A missing file is indistinguishable from an agent still working.** This is a protocol defect
   rather than a wording one: ANY readiness signal carried by a file's existence has the same
   ambiguity, and it breaks worst under the parallel dispatch the same skill recommends.
3. **The convention names a file and never a location, and the natural choice leaks.** Five of six
   reps across two arms reasoned about this unprompted and each solved it differently. `.kit/`
   holds the prior round's findings and the dispatch notes; the obvious filename
   (`s2-review-round2-blind.md`) leaks section, round and role on its own. The `docs/` scoping
   rule stated beside it is careful; the report-path equivalent is not stated at all.
4. **Nothing makes the filename round-distinct**, so a fix round's poll fires on the previous
   round's file and the orchestrator adjudicates stale findings as fresh. Surfaced by a blind
   reviewer reading `executing-work:81`.

## The decision this stub cannot make, because it is the operator's

**Should the three code reviewers carry the single-write clause that `blind-reader` and
`prose-reviewer` already have?** The facts, checked:

- `security-reviewer.md:8` reads "Read-only: never edit files", and `970827b` - the commit that
  added `executing-work:81`'s carve-out - records the roster identity as already in hand and the
  exclusivity as deliberate: "prose rather than a tool boundary, which makes the prose the whole
  guarantee", and "Chose the exception over giving the agent a sanctioned write path, on the user's
  delegation."
- One day later, `3604f03` went the other way for two agents: `blind-reader.md:22` and
  `prose-reviewer.md:22` both permit "writing the report to that one path" as "the single write
  this rule permits".

So a sanctioned narrow write path is already shipped and in force for two of five seats. Extending
it needs the user's call, because `970827b` chose otherwise on their delegation. Two facts for whoever
puts the question: **the step's reviewer roster is FIVE, not three**, and under an armed leash the
report file is the only readiness signal, so a universal refusal leaves a leashed session with
nothing to poll.

**This was attempted as a cheap premise correction on 2026-09-02 and reverted.** It was a rule
change dressed as one, and it re-made the roster miscount it meant to fix. Do not re-attempt it as
a clause.

## ANSWERED 2026-09-02, by probe, and it collapses most of this stub

The stub said to check the framework-injection branch first because it was the cheapest and might
dissolve the rest. It was checked, empirically, by dispatching an `implementer-sonnet` and having
it attempt the write and report verbatim. **All three answers came back and they agree.**

**1. The Write tool refuses, at the tool layer, with a scripted message:**

> Subagents should return findings as text, not write report files. Include this content in your
> final response instead.

The file never reached disk, confirmed by `ls` in the same run.

**2. The framework-injected instruction is REAL, and it is a standing system-prompt directive
rather than anything the kit or the dispatch supplies:**

> Do NOT Write report/summary/findings/analysis .md files. Return findings directly as your final
> assistant message - the parent agent reads your text output, not files you create. (Files
> written as input to another tool are fine; this note is about report files.)

**3. Bash is not the enforcement point.** The identical write through a heredoc succeeded, exit 0,
110 bytes on disk.

### What this settles, and what it leaves

- **The kit's convention is fighting the harness, not a quirk.** `executing-work:81` and `:169`
  mandate a behavior the platform instructs every subagent not to perform and blocks at the tool
  it would naturally use. The undocumented Bash workaround is the only reason it ever appears to
  work, which is exactly why two implementers with identical instructions diverged.
- **Problems 1 and 2 collapse into one decision: retire existence-as-readiness.** The
  orchestrator materializes the file from the return value, which `executing-work:81` already does
  for `security-reviewer` and which the harness's own directive describes as the intended shape
  ("the parent agent reads your text output"). No sentinel is needed and no per-seat write clause
  is needed.
- **The reviewer single-write question below is very likely MOOT, and this is the surprise.**
  `blind-reader.md:22` and `prose-reviewer.md:22` grant "the single write this rule permits" - a
  permission the kit cannot actually grant, because the block is above the kit. So `970827b`'s
  choice to refuse rather than sanction a write path was correct for reasons its author did not
  have, and `3604f03` shipped two clauses that the harness overrides. **Do not put the roster
  question to the operator as a policy choice; it is a factual correction to two agent
  definitions.** Verify the block applies to those two agent types before acting, since this probe
  used `implementer-sonnet`.
- **Problems 3 and 4 survive intact** and are now the whole remaining design: a report path is
  still needed for the orchestrator's own materialized files, and it still must be bounded,
  round-distinct, and leak nothing to a blind seat.

## What a design pass has to settle

- **Verify the refusal is still live, and for which agent types, before designing around it.** The
  whole shape turns on that. It may be agent-type-specific or may have changed. `executing-work:81`
  already carries a partial precedent that may generalize: where a seat's charter forbids the
  write, the orchestrator materializes the file itself from the return value.
- **Whether a framework-injected instruction is the real cause.** A "Do NOT Write
  report/summary/findings/analysis .md files" line has been reported in dispatch context. If it is
  real and general, the convention should be retired in favour of materialize-from-return-value
  and problems 1 and 2 collapse into one decision. **Check this first**: it is the cheapest branch
  and it may dissolve most of this stub.
- **What replaces existence-as-readiness.** Candidates: a sentinel the agent always writes
  including on the inline path, or an explicit report-inline contract with no polling at all.
- **A path convention that is bounded, round-distinct, and leaks nothing** - three constraints
  that pull against each other, since round-distinctness wants the round in the name and the blind
  seat must not see it.

## Acceptance a design pass inherits

Two implementers dispatched in parallel with identical instructions produce the same observable
readiness behavior; an orchestrator can tell "still working" from "finished, no file"; a blind seat
receives a path naming neither section, round, nor role; and a round-2 poll cannot fire on round 1's
file.

---

# Evidence: the promoted brief, reproduced whole

# Kaizen brief: the report-file readiness signal conflicts with a tool-level refusal

Friction: 2026-08-28, kit-usage-awareness S3/S4. `executing-work:169` mandates that a dispatched
agent write its full report last to a named path and that the orchestrator treat that file's
existence as the readiness signal. The Write tool refuses it: an implementer attempting it got back
"Subagents should return findings as text, not write report files", verbatim. Two implementers
dispatched in parallel with identical instructions diverged: one reached for Bash and the file
appeared, the other took the refusal as environment policy and returned inline, so the
orchestrator's Monitor polled for a file that would never appear while that agent was already
finished, and would have waited out its full hour.

Three things are wrong at once and a fix has to name which it addresses:
1. the convention conflicts with a tool-level refusal nobody has reconciled;
2. the workaround (use Bash) is undocumented and therefore luck;
3. a missing report file is indistinguishable from an agent still working, which is exactly what
   breaks under the parallel dispatch the same skill recommends.

Change: `plugins/claude-kit/skills/executing-work/SKILL.md:169`, and possibly the implementer agent
definitions under `plugins/claude-kit/agents/`. This is the largest item in the pass and may want a
`docs/plans/` spec rather than a clause, because (3) is a protocol defect rather than a wording one:
any readiness signal carried by a file's existence has the same ambiguity, and the fix may be a
sentinel the agent always writes (including on the inline path) or an explicit "report inline"
contract with no polling at all.

Note `executing-work:81` already carries a partial precedent: `security-reviewer` refuses the file
because its contract is read-only, and the skill's answer is that the orchestrator materializes the
file itself from the return value. That is the same shape as (1) and may generalize.

Acceptance: two implementers dispatched in parallel with identical instructions produce the same
observable readiness behavior, and an orchestrator can tell "still working" from "finished, no
file". Verify the refusal is still live before designing around it: it may be agent-type-specific
or may have changed.

Discipline: follow writing-skills; baseline-test any behavior-shaping wording. Reproduce the
verbatim refusal first, since the whole design turns on whether it still fires and for which agents.

## Triage 2026-09-01

Verdict: **SPEC, not an apply.** The brief says so itself and
the triage agrees: (3) is a protocol defect rather than a wording one.

Two things from 2026-09-01 to fold into the design. `executing-work:81` calls `security-reviewer`
"the one exception" that refuses the write-to-file instruction "because its contract is read-only",
and that grounding is **false**: `adversarial-reviewer`, `blind-reviewer` and `security-reviewer` all
carry the identical `tools: Read, Grep, Glob, Bash`, and blind-reviewer's charter also forbids
modifying the repo. And the convention names a file but never a location: five of six reps across two
arms independently reasoned that the obvious path leaks intent to the blind reviewer, since `.kit/`
holds the prior round's findings and a name like `s2-review-round2-blind.md` leaks section and round
on its own. Each of the five solved it differently, which is the tell that the convention is
underspecified.
