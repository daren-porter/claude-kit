---
name: kaizen
description: "Use when running a kaizen pass on the kit - an explicit kaizen request, accepting an end-of-effort or session-start offer to reflect on captured friction, taking stock of the kit's own prose when the take-stock nudge reports it has changed, or applying a pending kaizen brief in the kit repo. Jotting a single friction note does not need this skill; the global posture rule covers capture."
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
removing its line) or `briefs/` holds a file. That predicate gates the friction offer
and `session-start.js`'s kaizen count: nothing pending means no captured friction to
triage, by construction.

**Take stock is a second entry, and it does not read the inbox at all.** A separate
SessionStart hook, `take-stock-nudge.js`, reports how many of the kit's prose sections
changed since the last `docs/take-stock.md` entry, so it fires in exactly the state the
friction predicate calls empty. An empty inbox is a reason not to triage friction. It
is not a reason to decline a pass.

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

Run it when Daren asks, when he accepts an end-of-effort or session-start offer, when
you sit down to a pending brief, or when the take-stock nudge reports the kit's prose
has changed since the last entry.

1. **Gather.** Read the inbox notes plus any friction from this session still in
   context, and enumerate the deferred-promote backlog alongside them: the
   `Status: Proposed` stubs already parked in `docs/plans/`. Nothing else
   resurfaces those - the SessionStart nudge fires on inbox items and in-progress
   plans, never on Proposed stubs - so a pass that reads only `notes.md` silently
   drops the parked work.

   **In the kit repo, also read the kit's own state, the one input that is not a
   friction report:** `node tools/accretion.js` for the ranking, and
   `docs/take-stock.md` for what the last pass examined, cut and spared. Outside it a
   pass covers the inbox and the stubs only, since that tool is deliberately not
   packaged and that record is this repo's. The reason for the sub-step is that an
   inbox reports what a rule lacks far more often than what it costs, so a pass
   gathering only friction tends to grow the kit; `docs/take-stock.md` carries the
   measured history.

   List all three, then ask Daren for his: his half of the retro is the other half.
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
   - **Take stock:** a section in the top rows of `tools/accretion.js`, or one you
     find changed since the marker while reading it. (The nudge supplies a count and
     never a section; only the ranking names one.) Read it whole and ask what it
     would lose by being shorter, then route what you find.

     **A rewrite whose inventory maps every claim in both directions is a
     compression**, and it takes `writing-skills`' compression bill; the finished
     mapping is what classifies it, never an intention to shorten. A rule that no
     longer earns its lines is a **retirement**: a rule change, owing the arms, and
     it goes to Daren rather than into a brief because it changes what the kit is
     held to. A rule you find load-bearing is **spared**, which is not praise, since
     it names what was observed to happen because of it and "it seems to be working"
     closes nothing. **A preventive rule succeeds by producing no event**, so its
     spared evidence is the incident that admitted it rather than a sighting. Where
     you can find neither, leave it **unverdicted** and say so: an unverdicted rule
     is not a retirement candidate, it is one nobody has watched yet.

     **The step asks the question; it does not promise a cut**, in either direction.
     A pass that takes nothing out and records why is a pass that ran, and so is one
     that cuts less than it hoped: measured on the kit's two most accreted sections
     (2026-08-16), 143 claims at about 172 characters each, where a hard compression
     bought 6.5% against the 18.5% wanted.
3. **Clear every triaged item from `notes.md`.** Triage always empties the line:
   an apply-now item becomes a brief (format below), a promote becomes a spec or a
   Proposed-status stub in `docs/plans/`, a route-elsewhere lands at its
   destination, and a take-stock item empties its line by becoming an entry in step
   4. `notes.md` holds only untriaged friction; nothing triaged-but-parked
   lingers there. That invariant is what lets the SessionStart nudge and the next
   pass read a note line as "not yet looked at", never "looked at, parked here".
4. **Record every take-stock verdict in `docs/take-stock.md`**, spared and
   unverdicted entries included, newest first. The heading is literally
   `## YYYY-MM-DD - <40-hex sha>`; an abbreviated sha does not parse, and the nudge
   then reports for every session that no take-stock was ever recorded.

   **That sha is the commit holding the prose as the pass left it, never the one the
   pass read.** `take-stock-nudge.js` measures from the marker to HEAD, so naming the
   sha you read makes the nudge count the pass's own edits against it, forever, in
   exactly the case the mechanism exists for. It forces an ordering: land the prose
   changes first, then record the entry in a later commit touching no corpus file.
   `notes.md` holds untriaged friction; this file holds what a take-stock decided
   about the kit's own prose.

**Capture does not change, and a pass does not get to change it.** Whether friction
with a rule wants a cut or a companion is this step's judgment, not the logging one,
and the one step whose value is that it carries no decision has to keep carrying none.

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

**When the change took writing-skills' borrowed-evidence path, that commit message is
where its three artifacts live**, because a pass has no plan doc and so no Chapter to hold
them, and the commit is not made until it carries them. The brief never does: the artifacts
are produced when the change is applied, and the brief was written before that. **A
compression's claim unit, inventory and probe output have the same home for the same
reason**, all three, and that commit is likewise not made until it carries them.

## Offering a pass

Never offer on an uneventful session. Offer only when the inbox has pending items,
and only at a natural moment: finishing-work's close-out, or when Daren signals he
is wrapping up. The offer is one dismissable line ("N kaizen items captured - want
to run a pass?"). Daren can always start one explicitly. `session-start.js`'s kaizen
count (kit repo only) is the same predicate from the other end: it reminds you when you
open claude-kit and items are waiting.

**The take-stock nudge is not that predicate and is offered on its own terms.** It fires
on changed prose rather than captured friction, so offer a take-stock at the same natural
moments even when the inbox is empty, which is the state it is built to speak into.
