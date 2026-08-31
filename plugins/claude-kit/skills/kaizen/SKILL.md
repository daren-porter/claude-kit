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

- `~/.claude-kaizen/notes.md` - append-only for capture, rewritten only by a triage pass
  clearing what it triaged (step 3). One note is one or more lines: the first opens at
  column zero with the capture date, bare or behind a `- `, and any continuation line is indented,
  e.g. `2026-06-17  finishing-work close-out is silent on X  (repo: acme-api)`. Most notes are one
  line; a long one wraps, and the indent is what keeps it one note.
- `~/.claude-kaizen/briefs/` - one file per brief a reflect pass produces.
- `~/.claude-kaizen/applied/` - briefs already executed, moved here by Phase 2 below. Nothing counts it and no pass reads it; it is history, listed here so the inbox is not
  described as two directories when it is three.

**Pending items** means `notes.md` holds any note or `briefs/` holds a file. A note is one
or more lines in the form above, so **clearing one means removing all of its lines**. That
predicate gates the friction offer and `session-start.js`'s kaizen count, which is **one per
note rather than one per line**, and which **floors a non-empty file it cannot parse at one**
rather than reporting zero, so a file holding nothing parseable is visible as something instead of
invisible as nothing. The floor fires only when NOTHING in the file parses, so a count of
one you cannot account for means open the file, and a plausible count is not proof that
every note in it parsed. Nothing pending means
no captured friction to triage, by construction.

**Take stock is a second entry, and it does not read the inbox at all.** A separate
SessionStart hook, `take-stock-nudge.js`, reports how many of the kit's prose sections
changed since the last `docs/take-stock.md` entry, so it fires in exactly the state the
friction predicate calls empty. An empty inbox is a reason not to triage friction. It
is not a reason to decline a pass.

## Capturing (the cheap half)

A note is jotted to `notes.md` the moment friction surfaces, one line where one line does it. You do not
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

Run it when the user asks, when they accept an end-of-effort or session-start offer, when
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
   `docs/take-stock.md` for what the last pass examined, cut and spared, and for any
   retirement candidate it recorded without acting on, which nothing else resurfaces
   either. Outside it a pass covers the inbox and the stubs only, since that tool is
   deliberately not packaged and that record is this repo's. The reason for the
   sub-step is that an inbox reports what a rule lacks far more often than what it
   costs, so a pass gathering only friction tends to grow the kit;
   `docs/take-stock.md` carries the measured history.

   List all three, **naming every pending item rather than counting it**: each note, each
   parked stub, and each retirement candidate the last take-stock left unadjudicated, with
   enough of its text to be argued about without opening another file. A class reported as
   non-empty is a class the user has to go and read for themselves, which is how a candidate
   stays unadjudicated for one more pass; a pass on 2026-08-16 reported "four retirement
   candidates, still unadjudicated" twice without ever saying what they were. Then ask
   the user for theirs: their half of the retro is the other half.
2. **Reflect and triage.** For each item, with the user: is it real, and what is the
   smallest change that fixes it? Sort into:
   - **Apply now:** small and clear. Becomes a brief (or is fixed directly if you
     are already in the kit repo). Either way, corpus prose takes the paired review
     below before it is committed.
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
     it goes to the user rather than into a brief because it changes what the kit is
     held to. A rule you find load-bearing is **spared**, which is not praise, since
     it names what was observed to happen because of it and "it seems to be working"
     closes nothing. **A preventive rule succeeds by producing no event**, so its
     spared evidence is the incident that admitted it rather than a sighting. Where
     you can find neither, leave it **unverdicted** and say so: an unverdicted rule
     is not a retirement candidate, it is one nobody has watched yet.

     **A retirement candidate you examine and do not retire is declined**, which
     closes it. `writing-skills`' disposal rule logs a candidate every time a
     compression finds a claim with no counterpart, so that list records what a
     rewrite declined to drop rather than what anyone judged should go. Four sat
     unadjudicated across three passes because a pass reading them could record
     nothing: retiring owes the arms, spared demands an observed event or an
     admitting incident, and unverdicted is by definition one nobody has watched.
     **A decline names what keeping the claim buys**, in the currency spared pays
     in. "Not worth the arms" closes nothing, for the reason "it seems to be
     working" does not: it prices the change rather than the claim. Declining is
     the only verdict here that subtracts from the kit's ability to subtract, so
     it is the one to be suspicious of in your own pass.

     **The step asks the question; it does not promise a cut**, in either direction.
     A pass that takes nothing out and records why is a pass that ran, and so is one
     that cuts less than it hoped: measured on the kit's two most accreted sections
     (2026-08-16), 143 claims at about 172 characters each, where a hard compression
     bought 6.5% against the 18.5% wanted.
3. **Clear every triaged item from `notes.md`, all of its lines.** Triage always
   removes the whole note: an apply-now item becomes a brief (format below), a promote
   becomes a spec or a Proposed-status stub in `docs/plans/`, a route-elsewhere lands at
   its destination, and a take-stock item clears by becoming an entry in step 4.
   **Removing a multi-line note's first line and leaving its continuations is the failure
   to avoid**, and it is worse than leaving the note whole: the orphans carry no date, so
   nothing counts them and no later pass can recognize them as anything. Where other dated
   notes survive they are simply invisible; where they are all that is left, the file reports
   the floor below rather than the nothing it looks like. Rewrite the file from the notes
   that survive rather than deleting lines in place. `notes.md` holds only untriaged friction; nothing
   triaged-but-parked lingers there. That invariant is what lets the SessionStart nudge and
   the next pass read a note as "not yet looked at", never "looked at, parked here".
4. **Record every take-stock verdict in `docs/take-stock.md`**, spared, declined and
   unverdicted entries included, newest first. The heading is literally
   `## YYYY-MM-DD - <40-hex sha>`. An abbreviated sha does not parse, and the failure is
   quiet rather than loud: the reader takes the first entry that parses, so a malformed
   newest entry falls through to an older one and the nudge measures against a stale
   marker. Only a missing file reports that no take-stock was ever recorded.

   **That sha is the commit holding the prose as the pass left it, never the one the
   pass read.** `take-stock-nudge.js` measures from the marker to HEAD, so naming the
   sha you read makes the nudge count the pass's own edits against it, forever, in
   exactly the case the mechanism exists for. It forces an ordering: land the prose
   changes first, taking the paired review below before that commit, then record the entry in a
   later commit touching no corpus file.
   `notes.md` holds untriaged friction; this file holds what a take-stock decided
   about the kit's own prose.

**Corpus prose takes the paired review before it is committed, and no
corpus commit lands until its Criticals are resolved.** Corpus is a path
test rather than a judgment: the four globs `tools/accretion.js` measures,
`skills/*/SKILL.md`, `skills/*/references/*.md`, `agents/*.md` and
`assets/CLAUDE.md`, all of them under `plugins/claude-kit/`.
`executing-work`'s review step owns what each reviewer is handed, and its
trivial carve-out does not reach this path. **The adversarial half expects
a `docs/plans/` spec a pass does not have**, so give it the brief, the
drafted take-stock entry, or an intent note written before dispatch, and
say to read that in place of a Goal and Approach; without one it reviews
quality only and the pair collapses to two blind reads. A pass has no
Chapter, so the findings and the justification for any Major left unfixed
go in the commit message, and the commit is not made until it carries them.

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
trusting it), take the paired review above for any corpus prose, commit it (the kit repo is Commit-and-Push; a promoted spec follows
its own recorded commit model), then archive the brief out of `briefs/` into `applied/`. When the pass already runs inside the kit repo, Phase 1 and Phase 2
collapse into one session.

**When the change took writing-skills' borrowed-evidence path, that commit message is
where its three artifacts live**, because a pass has no plan doc and so no Chapter to hold
them, and the commit is not made until it carries them. The brief never does: the artifacts
are produced when the change is applied, and the brief was written before that. **A
compression's claim unit, inventory and probe output have the same home for the same
reason**, all three, and that commit is likewise not made until it carries them.

## Offering a pass

Never offer on an uneventful session. Offer only when the inbox has pending items,
and only at a natural moment: finishing-work's close-out, or when the user signals they
are wrapping up. The offer is one dismissable line ("N kaizen items captured - want
to run a pass?"). The user can always start one explicitly. `session-start.js`'s kaizen
count (kit repo only) is the same predicate from the other end: it reminds you when you
open claude-kit and items are waiting.

**The take-stock nudge is not that predicate and is offered on its own terms.** It fires
on changed prose rather than captured friction, so offer a take-stock at the same natural
moments even when the inbox is empty, which is the state it is built to speak into.
