# Consolidating three Azure DevOps projects into one

## Neutral restatement

A 9-developer team runs three Azure DevOps projects (59 repos, 95 pipelines, ~14,000
work items, history to 2019). Three of the nine cross all three projects daily; six
work mostly in one. Two external contractors have access scoped to one project by the
project boundary itself. The same team ran an ADO topology migration in 2023 that took
five weeks against a two-week estimate.

Should they commit two sprints now to merging all three projects into one?

## Cold read

No, not as framed. The direction is defensible and probably right as an end state, but
the schedule is contradicted by evidence you supplied yourself.

That is also the answer to "am I talking myself into it." You put the 2.5x overrun in
your own fact list and then let the conclusion stand as if it were not there. Applying
your own multiplier to two sprints gives roughly ten weeks, and this job is larger than
the 2023 one in every dimension you listed. Producing the disconfirming number and then
not letting it touch the estimate is the specific shape of talking yourself into
something. The wanting is not the problem; the unrepriced estimate is.

## Framing audit

- **A year of wanting.** Duration of desire carries no information about value. It is
  the highest-risk signal in the set, because it makes the conclusion feel settled
  before the evidence is in.
- **"Clearly the right call" plus "just book the two sprints"** bundles two separate
  decisions. The target topology and the delivery plan need to be judged apart. One
  survives scrutiny better than the other.
- **"The team complains constantly."** Complaint frequency measures irritation, not
  cost. By your own numbers the acute pain is concentrated in 3 of 9 people. You have
  no measurement of it, while the cost side has a hard historical number attached.
- **"She seemed positive" when floated.** Warmth toward a concept is not sponsorship of
  a multi-week engineering spend. It is also the kind of exchange that gets recalled as
  endorsement once a schedule slips, by both parties, in opposite directions.
- **The 2023 line reads as a footnote.** In an honest estimate it is the central
  evidence, not a caveat at the bottom.

## Evidence

**For consolidating (real, and I am not going to talk you out of these):**

- Three projects for nine developers is over-partitioned. Microsoft's own default
  guidance leans toward a single project for most organizations precisely to avoid this
  fragmentation, and the end state you want is the recommended one.
- Boards genuinely do not merge across projects. Backlogs, sprint capacity, and
  swimlanes are project-scoped, so the 3 cross-project developers are carrying a real
  structural cost, not an imagined one.
- Including the 2023 overrun at all was honest. Most people leave that out.

**Against, on the schedule:**

- Your only calibration data point is 2.5x, on a smaller job. Two sprints (assuming
  two-week sprints, which is not in your facts) becomes ~10 weeks at that ratio, and
  overrun ratios on migrations tend to grow with scope rather than hold constant. Treat
  10 weeks as a floor, not a range.
- Four mechanics that set the real cost, all of which I would verify rather than take
  from me:
  1. There is no supported "merge projects" operation in ADO. Every part of this is
     manual reconstruction.
  2. Repos move by mirror push. Commits, branches, and tags come across. Pull request
     history, branch policies, and repo permissions do not, for all 18 repos in the two
     smaller projects.
  3. Area and iteration paths are project-scoped. All ~14,000 work items need remapping,
     and sprint history from 2019 has to be recreated or lost. (Work items can move
     within a single ADO organization preserving their IDs, which assumes all three
     projects are in one org.)
  4. Contractor isolation stops being a project boundary and becomes per-repo and
     per-area-path deny rules that someone has to maintain correctly, forever, in the
     same project that holds your client-facing repos.

**Against, on the benefit:**

- 6 of 9 developers get close to nothing. The gain is concentrated in 3 people whose
  pain you have never measured.
- Cheaper partial relief exists and has not been tried: cross-project work item queries,
  Delivery Plans that span projects, and org-level dashboards. Days of work, not weeks.
  If those close most of the gap, the migration was never the right instrument. If they
  do not, you now have a much stronger case for the spend.

**Missing, and one of these is decisive:**

- **Why was Internal split out in 2023?** This is the largest hole in your case. The
  2023 migration is not just a schedule analogue, it is this move in reverse. If the
  split was driven by permissions, client separation, or a compliance ask, merging back
  re-opens whatever it closed. If nobody can state the reason, that is evidence the
  organization oscillates on topology and will oscillate again, which is an argument
  against paying ten weeks to move in either direction.
- Is there a contractual or compliance obligation governing contractor access to
  client-facing code? If yes, Integrations may never be mergeable, and the terminal
  state is two projects, not one.
- Do all three projects run the same process template? Mismatched work item types and
  fields are the difference between a scripted bulk move and a hand-mapped one.
- How many of the 84 build pipelines are YAML versus classic? YAML is largely
  re-registration; classic is rebuild-by-hand.

## Strongest objection

The one that actually threatens the plan is not the schedule, it is the permissions
model. Today, two external contractors cannot reach your client-facing repos because
they are in a different project, and that boundary holds by default, including for
every mistake nobody has made yet. After consolidation it holds because someone
configured deny rules correctly on 41 repos and keeps them correct through every new
repo, group change, and contractor onboarding. You are trading a boundary that fails
safe for one that fails open, permanently, in exchange for a workflow improvement for
three people. That trade does not obviously clear, and no amount of schedule accuracy
fixes it.

## Recommendation

Do not book the two sprints. Confidence: high on the schedule, moderate on the
end-state, because the 2023 reason and the compliance question could move it either way.

The strongest case for going anyway is worth stating: the direction is right, so budget
ten weeks honestly, and spend the manager's goodwill while you have it. It loses on
three counts. The benefit is unmeasured and concentrated in a third of the team; the
cheap relief path is untested, so you cannot say how much of the win needs a migration
at all; and the contractor constraint may cap the end state at two projects, meaning
you would be paying a one-project price for a two-project outcome.

What I would do instead, in order:

1. Answer the 2023 question. An afternoon of asking. If the split had a live reason,
   stop here.
2. Ship the cheap relief (cross-project queries, a Delivery Plan, one shared dashboard)
   and have the 3 cross-project developers log actual friction for two weeks. You get
   either most of the value for days of work, or a measured benefit number you currently
   do not have.
3. Only then, if the pain survives, run Internal into Platform as a scoped pilot: 6
   repos, 2022-onward history, no contractors, no client-facing code. It delivers the
   same "three contexts down to two" relief as any other pairing, at the lowest risk,
   and it produces a real multiplier for estimating the Integrations merge.

One honest risk in my own recommendation: a staged consolidation that stalls after
Internal leaves you with a topology worse than either endpoint, two projects that were
recently three, with half-migrated conventions and nobody sure where things live. If you
take the staged path, decide up front what result at step 3 means "stop permanently"
versus "continue," and write it down before you start.

## Next check

Find out why Internal was split out in 2023, and whether that reason is dead. It costs
one conversation, and it is the only item on this list that can invalidate the entire
premise rather than adjust its price.
