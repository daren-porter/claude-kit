# kaizen - a self-improvement loop for the kit

Status: In Progress
Commit Model: Commit-and-Push
Created: 2026-06-17

## Goal

A self-improvement loop for claude-kit. While the kit runs (on any project, in
any session), concrete friction with the kit itself is captured cheaply to a
durable, cross-project inbox. When there is something worth discussing, a kaizen
pass reflects on it with Daren and produces a portable brief; a fresh session in
the kit repo applies the brief as real improvements, authored per the
writing-skills discipline. It is built so it never prompts on an uneventful
session and never nags across Daren's other projects. This closes the loop the
writing-skills meta-skill opened: noticing what should improve, then changing the
kit well.

## Approach

1. **Two phases.** Capture & reflect (anywhere) produces a portable kaizen brief;
   Apply (a fresh session in the kit repo) executes it per writing-skills. The two
   collapse into one session when Daren is already in the kit repo. Why fresh: the
   friction is usually observed while using the kit on another repo, which should
   not also be editing the kit; a fresh kit-repo session has clean context and the
   kit's own skills properly loaded.

2. **The inbox is the spine.** A stable, home-level location (not tied to the kit
   repo's path, reachable from any project and both config profiles) holds raw
   one-line friction notes and the briefs produced from them. It is the capture
   store, the brief store, and the SessionStart hook's trigger source, all one
   place. Memory is deliberately not the carrier (it is project-scoped and meant
   for durable facts, not a transient work queue).

3. **Non-nag is structural, not a judgment call.** Every offer is gated on an
   observable predicate - the inbox has pending items - which is exactly the
   writing-skills "conditional on an observable predicate" form. No items, no
   offer, by construction. The SessionStart nudge is scoped to the kit repo, so
   friction is captured from anywhere but the "go act on it" reminder only appears
   when Daren is in claude-kit and positioned to fix things. That scoping is what
   keeps reliable from becoming intrusive.

4. **Self-monitoring rides the kit's existing reflection points; it is not a nudge
   bolted onto every step.** The kit already compares expected-vs-reality in
   specific places (executing-work's Chapter "Decisions / Surprises", finishing-
   work's close-out, review verdicts, qa PASS/FAIL); that comparison is the gauge.
   A surprise or finding that traces to the kit itself (an ambiguous rule, a step
   that fought the work) is kaizen signal, captured where it surfaced. A single
   passive-permission posture line in the always-loaded global rules covers ad-hoc
   work that has no Chapters. A "did you notice friction?" nudge is deliberately
   NOT added to every skill: that is the version that becomes the intrusion and
   drags the bar down to noise.

5. **The capture bar is the whole game for effectiveness.** A note is worth keeping
   only when it is concrete kit friction: a rule that was ambiguous, wrong, or that
   let a rationalization through; a step that fought the work or added cost without
   value; a capability wished for and missing; an agent that behaved in a way
   suggesting its prompt needs tuning. Not worth keeping: "went fine", generic
   praise, a project-specific gotcha (routes to memory), a one-off mistake not about
   the kit. Zero notes in a session is the normal, healthy case. Capture is a cheap
   action: the global posture line (decision 4) carries an abbreviated bar so a
   one-line note is jotted without loading the full kaizen skill; the skill owns the
   complete bar and the reflect/apply pass and loads only when a pass is run. The
   abbreviated bar duplicating a few words of the full bar is an intentional
   structural choice (a quick action should not require loading a skill), not drift.

6. **writing-skills is mandatory in Phase 2** for any behavior-shaping change:
   baseline-test the wording before trusting it. Triage in the brief: small and
   clear is applied directly in Phase 2; large is promoted to a full spec via
   brainstorming; not-actually-kit is routed to memory or a project doc.

7. **Authoring is main-session by exception**, as in v2: the deliverables are
   behavior-shaping prose in the kit's own voice plus one small, security-sensitive
   hook edit, all design-entangled and voice-critical. Fresh-context adversarial-
   reviewer passes per section are preserved. The kaizen skill additionally gets a
   writing-skills baseline test (the dogfood of the meta-skill), since its capture
   calibration is the crux and cannot be judged by dry-reading alone.

## Sections of Work

### 1. The kaizen skill

New skill at `plugins/claude-kit/skills/kaizen/SKILL.md`, single SKILL.md in the
kit's voice, authored per writing-skills.

Acceptance criteria:
- File exists with valid quoted YAML frontmatter; the description is a trigger
  (an explicit kaizen request; accepting an end-of-effort or session-start offer
  to run a pass; or applying a pending kaizen brief), not a workflow summary.
- The body covers: the capture bar (with concrete in/out examples and "zero is
  normal"); the two-phase flow (capture & reflect -> portable brief; apply in a
  fresh kit-repo session, collapsing when already there); the brief's role and a
  pointer to its format (Section 2); triage (apply directly / promote to a spec /
  route to memory); the offer-gating predicate (inbox has pending items); and
  writing-skills as mandatory for behavior-shaping changes in Phase 2.
- The capture behavior is baseline-tested per writing-skills: a fresh subagent
  given a kit task with planted kit-friction captures it; a fresh subagent given a
  clean kit task produces no capture (no manufactured noise). Read across reps for
  calibration, not a single sample; tune the wording until both hold.
- A fresh-session dry read is coherent and contradicts neither executing-work,
  finishing-work, nor writing-skills.

### 2. Inbox and brief artifact format

Define the durable inbox and the two artifact formats it holds.

Acceptance criteria:
- A documented, stable inbox location reachable from any project and both config
  profiles, not tied to the kit repo's path. Absent inbox or empty inbox means no
  pending items; it is created on first capture.
- A one-line note format carrying enough to act on later (the friction, where it
  was) on one dated line, appendable from any session.
- A brief format that is self-contained: a fresh kit-repo session can execute it
  without the originating session's context - what to change, why (the friction it
  addresses), acceptance criteria, and the instruction to follow writing-skills
  for behavior-shaping changes. A large item may instead be promoted to a full
  `docs/plans/` spec.
- The "inbox has pending items" predicate is well defined against this structure,
  so both the kaizen skill and the SessionStart hook can rely on it.

### 3. Self-monitoring touchpoints

Wire capture into the kit's existing reflection points plus one global posture
line.

Acceptance criteria:
- `home/CLAUDE.md` gains one passive-permission line: capture kit friction (an
  ambiguous or wrong rule, a step that fought the work, a wished-for missing
  capability) to the kaizen inbox as it surfaces; zero-cost when nothing is wrong;
  bar and mechanism per the kaizen skill. Framed as permission, not surveillance;
  one bullet, the file stays lean.
- `executing-work`'s Chapter step notes that a "Surprise" tracing to the kit
  itself is also captured to the kaizen inbox - a light addition at the existing
  reflection point, not a new step.
- `finishing-work`'s close-out gains a conditional capture-and-offer: at the end
  of an effort, if kit friction surfaced, capture it and offer a kaizen pass;
  nothing on a clean effort (gated on the predicate).
- No "did you notice friction?" nudge is added to any other skill; the always-on
  posture covers the rest. Verified by a scan of the skills.
- None of these contradict the kaizen skill's bar or the non-nag predicate.

### 4. SessionStart hook extension

Extend `plugins/claude-kit/hooks/session-start.js` to nudge about pending kaizen
items, scoped to the kit repo.

Acceptance criteria:
- When a session starts in the claude-kit repo and the inbox has pending items,
  the hook injects a one-line nudge naming the count; when the inbox is empty, or
  the session is in any other repo, it injects nothing about kaizen.
- The existing in-progress-plan scan is unchanged; the kaizen check is additive
  and never blocks.
- The inbox read is safe: a missing dir or file is a silent no-op, and any inbox
  content surfaced into the injected context is bounded and sanitized to the same
  standard as the existing plan scan (no unsanitized inbox text injected).
- `node --check` passes and `claude plugin validate` passes.

## Out of Scope

- Auto-applying briefs without Daren; Phase 2 is a session he runs.
- A SessionEnd harness hook (wrong tool: no model at session end; the kit-repo-
  scoped SessionStart nudge covers cross-session reliability).
- Capture nudges in skills beyond the two named reflection points.
- Using auto-memory as the cross-project carrier (the inbox is the carrier).
- Building a backlog of kit improvements to act on now: this effort builds the
  loop; acting on captured items is the loop's own later use. (If building kaizen
  surfaces real kit friction, seeding the first inbox entry with it is allowed.)

## Open Questions

1. Exact inbox path and internal structure (a single home-level dir holding a
   notes file and briefs, vs. another shape). Defaulted in execution to a sensible
   home-level location; Daren can rename. Owner: Daren.
2. Whether a non-trivial brief should always become a `docs/plans/` spec rather
   than a lighter in-inbox brief. Defaulted to brief-for-small, spec-for-large;
   refine in execution. Owner: Daren.

## Chapters

### Chapter 1 - 2026-06-17
Completed: Sections 1 and 2 (the kaizen skill; the inbox and brief artifact format), delivered together
Decisions / Surprises: Sections 1 and 2 landed in one file - the kaizen SKILL.md is the natural home for the inbox location and the note/brief formats, so it documents both. Inbox defaulted (Open Question 1) to `~/.claude-kaizen/` ($HOME-level, profile-independent, kit-path-independent): `notes.md` (append-only; date + friction + origin per line) and `briefs/`. The capture wording was baseline-tested per writing-skills (the dogfood of the meta-skill): 4 fresh subagents, 2 clean scenarios both returned NO NOTE (one correctly excluding the agent's own mistake, not the kit's), 2 genuine-friction scenarios both captured a concrete note. Calibration established; the tested posture wording goes verbatim into CLAUDE.md in Section 3. Known forward reference: the skill cites "the global posture rule in CLAUDE.md", which Section 3 lands (disclosed to the reviewer). Bonus: friction-run A independently surfaced a real kit gap - v2's "earn a durable test" vs csharp-style's "no new test infra unless asked" have no stated precedence - a genuine first kaizen candidate.
Review Findings: APPROVED_WITH_CONCERNS, 3 Minors, all fixed: the note format gained a concrete date+friction+origin example (Section 2 required "where it was"); "clear the note" was pinned to "remove its line from `notes.md`" so the hook's line-count predicate is unambiguous; the apply-flow commit model was given a defined source (kit repo is Commit-and-Push; a promoted spec follows its own).
Next: Section 3 (self-monitoring touchpoints)
Commit Model: Commit-and-Push

### Chapter 2 - 2026-06-17
Completed: Section 3 (self-monitoring touchpoints)
Decisions / Surprises: home/CLAUDE.md gained the "Kaizen self-monitoring" posture bullet under Plans/Chapters/Memory, wording kept faithful to the Section 1 baseline-tested version to preserve the calibration; it propagates live to both config profiles via the symlink. executing-work's "Append a Chapter" step and finishing-work's new step 8 are the two reflection-point capture nudges; no capture nudge was added to any other skill (verified by grep - the only other kaizen mention is writing-skills' trigger word, which is intended). All cross-references resolve now that this section lands the posture rule the kaizen skill referenced.
Review Findings: APPROVED. 2 Minors: finishing-work step 8 reworded to gate the offer on the observable inbox-has-pending-items predicate rather than a session judgment, matching the kaizen skill's structural non-nag gate (fixed); executing-work's "Decision/Surprise" vs the Chapter field label "Decisions / Surprises" is cosmetic (not fixed).
Next: Section 4 (SessionStart hook extension)
Commit Model: Commit-and-Push

### Chapter 3 - 2026-06-17
Completed: Section 4 (SessionStart hook extension)
Decisions / Surprises: Added countPendingKaizen(cwd) - gates on the kit-repo marker (cwd/plugins/claude-kit/.claude-plugin/plugin.json), reads ~/.claude-kaizen (note lines + brief files, both bounded), and injects only the integer count, never inbox text. Restructured the emit section into independent blocks so the kaizen nudge fires whether or not a plan is in progress; the plan-recovery path is byte-for-byte preserved. No durable test: the kit has no test harness and standing one up is out of scope (new test infra, unasked), so verified behaviorally via synthetic payloads - kit repo + notes injects both blocks; non-kit cwd is silent; empty inbox suppresses the kaizen nudge while plan recovery still fires; node --check clean - per the reframed test discipline.
Review Findings: adversarial APPROVED, security CLEAR. The shared substantive Minor (the notes read pulled the whole file into memory before slicing) was hardened to a bounded openSync/readSync buffer matching the file's own plan-scan idiom (re-verified: counting still correct). Accepted Minors, not fixed: the 64KB boundary can undercount or bisect the final line of an enormous notes.md (conservative direction; notes are one line each); briefs readdir enumerates before the 500-cap (benign, the inbox is the user's own dir); kit detection assumes cwd is the repo root (consistent with the existing plan scan); the no-version warning (pre-existing, intended).
Next: finishing-work
Commit Model: Commit-and-Push
