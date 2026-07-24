---
name: kaizen
description: "Use when running a kaizen pass on the kit - an explicit kaizen request, accepting an end-of-effort or session-start offer to reflect on captured friction, or applying a pending kaizen brief in the kit repo. Jotting a single friction note does not need this skill; the global posture rule covers capture."
---

# Kaizen

Kaizen is the kit improving itself. Friction with the kit - a rule that was
ambiguous, a step that fought the work, a capability you wished for - is captured
cheaply while you work; a kaizen pass turns that captured friction into real
improvements, authored well. It runs only when there is something to discuss. It
is the kit's own writing-skills loop, pointed at the kit.

## The inbox

Captured friction and the briefs made from it live in one home-level inbox, the
same across every project and both config profiles:

- `~/.claude-kaizen/notes.md` - append-only; one line per note carrying the date, the friction, and where it surfaced, e.g. `2026-06-17  finishing-work close-out is silent on X  (repo: acme-api)`.
- `~/.claude-kaizen/briefs/` - one file per brief a reflect pass produces.

**Pending items** means `notes.md` has any note lines (clearing a note means
removing its line) or `briefs/` holds a file. That predicate gates every offer and
the SessionStart nudge: nothing pending means no kaizen, by construction.

## Capturing (the cheap half)

A one-line note is jotted to `notes.md` the moment friction surfaces. You do not
load this skill to do it - the global posture rule in CLAUDE.md carries an
abbreviated bar so capture costs nothing. The bar in full:

**Worth a note (concrete kit friction):**
- a kit rule or skill instruction was ambiguous, contradicted the actual
  situation, or let you rationalize around it
- a workflow step fought the work or added cost without value
- you wished for a capability the kit does not have, or hit a gap
- a review or agent behaved in a way that suggests its prompt needs tuning

**Not worth a note:**
- "it went fine", or general praise
- a project-specific gotcha (that goes to auto memory, not here)
- a one-off mistake of your own that is not about the kit

Zero notes in a session is the normal, healthy case. A note you have to talk
yourself into is noise; leave it out.

## The pass (the reflect half)

Run it when Daren asks, when he accepts an end-of-effort or session-start offer, or
when you sit down to a pending brief.

1. **Gather.** Read the inbox notes plus any friction from this session still in
   context, and enumerate the deferred-promote backlog alongside them: the
   `Status: Proposed` stubs already parked in `docs/plans/`. Nothing else
   resurfaces those - the SessionStart nudge fires on inbox items and in-progress
   plans, never on Proposed stubs - so a pass that reads only `notes.md` silently
   drops the parked work. List both, then ask Daren for his: his half of the retro
   is the other half.
2. **Reflect and triage.** For each item, with Daren: is it real, and what is the
   smallest change that fixes it? Sort into:
   - **Apply now:** small and clear. Becomes a brief (or is fixed directly if you
     are already in the kit repo).
   - **Promote:** large enough to deserve its own design. Brainstorm it into a
     `docs/plans/` spec instead of a brief. If the design is not happening in this
     pass, still capture it now as a **Proposed**-status stub spec (the friction,
     the intent, and enough to pick it up cold) so the deferred-promote backlog
     lives in `docs/plans/`, not as an ambiguous line in the inbox. Register the
     stub in `docs/README.md` with a "(Proposed)" marker per the curating-docs
     create path, so the index never omits a file the taxonomy owns.
   - **Route elsewhere:** not actually about the kit. A project learning goes to
     auto memory; a project convention to that project's CLAUDE.md. It leaves the
     inbox either way.
3. **Clear every triaged item from `notes.md`.** Triage always empties the line:
   an apply-now item becomes a brief (format below), a promote becomes a spec or a
   Proposed-status stub in `docs/plans/`, a route-elsewhere lands at its
   destination. `notes.md` holds only untriaged friction; nothing triaged-but-parked
   lingers there. That invariant is what lets the SessionStart nudge and the next
   pass read a note line as "not yet looked at", never "looked at, parked here".

## The brief, and applying it

A brief is a self-contained directive a fresh kit-repo session can execute without
this session's context:

```
# Kaizen brief: <short title>
Friction: <what went wrong, one or two lines - the evidence>
Change: <what to change, which files or skills>
Acceptance: <how you know it is right - verifiable>
Discipline: follow writing-skills; baseline-test any behavior-shaping wording.
```

**Applying (Phase 2)** happens in a fresh session in the kit repo: read the brief,
make the change per writing-skills (baseline-test behavior-shaping wording before
trusting it), commit it (the kit repo is Commit-and-Push; a promoted spec follows
its own recorded commit model), then archive the brief out of `briefs/`. When the pass already runs inside the kit repo, Phase 1 and Phase 2
collapse into one session.

## Offering a pass

Never offer on an uneventful session. Offer only when the inbox has pending items,
and only at a natural moment: finishing-work's close-out, or when Daren signals he
is wrapping up. The offer is one dismissable line ("N kaizen items captured - want
to run a pass?"). Daren can always start one explicitly. The SessionStart nudge
(kit repo only) is the same predicate from the other end: it reminds you when you
open claude-kit and items are waiting.
