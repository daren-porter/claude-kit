# Cold read: consolidating three ADO projects

You asked whether you're being rational or talking yourself into it. Answering the
second question honestly: partly the second, and I'll show you where.

## Neutral restatement

Should a 9-developer team commit an uncosted multi-week effort to merge three Azure
DevOps projects (59 repos, 84 build pipelines, 11 release pipelines, ~14,000 work
items, and permission boundaries currently separating two external contractors from
client-facing code) into one, on a two-sprint estimate, when the team's only
comparable prior effort ran five weeks against a two-week estimate?

## Cold read

The direction is defensible. The plan is not. Two things break it: your own only
relevant data point says the two-sprint estimate is off by a large multiple, and the
entire stated benefit lands on 3 of your 9 developers in a form that requires
dissolving the contractor boundary to actually deliver.

## The trade you haven't named

This is the part I'd most want you to sit with, because it isn't in your list of
facts and it decides the question.

Three developers work across all three projects daily. Six live mostly in Platform.
The six already have what consolidation promises: their work is in one place. They
gain close to nothing. So the whole benefit accrues to three people.

Now follow it one step further. Those three people's pain is spread across Platform,
Integrations, and Internal. Folding Internal into Platform is the cheap, safe,
low-risk version, and it barely helps them, because Integrations is still a separate
context. The version that actually delivers the stated benefit is the one that
absorbs Integrations. Integrations is the project with the two external contractors.

So the real proposition is not "consolidate for less context switching." It is:
**dissolve the contractor boundary in order to reduce context switching for three
developers.** The version that keeps the boundary structurally intact delivers very
little of what you're buying.

That is the decision. Everything else is implementation.

## Framing audit

**"I've wanted this for about a year."** This is the highest-risk signal in your
message. A year of wanting builds conviction that stops updating on evidence. Note
that you included the 2023 overrun in your own facts. You are not unaware of the
disconfirming evidence. You've just filed it as background rather than letting it
move the conclusion, which is what talking yourself into something looks like from
the inside.

**The 2023 reversal.** In 2023 you spent five weeks splitting Internal out. In 2026
you want to spend more than that putting it back. Read that as a rate: your
organization's confidence about optimal project structure has roughly a three-year
half-life, at five-plus weeks per revision. Something motivated that split. Nothing
in your facts says what it was or why it's dead. Until someone can state the 2023
rationale and say specifically what changed, the base rate says this conviction has
about the same shelf life as the last one.

**"The team complains constantly."** The complaints are real. They are not a
business case. A grievance establishes that a problem exists, not that your preferred
remedy is the right one or that it's worth ten weeks. You have not measured what the
switching actually costs the three affected people, and you have not tried the cheap
mitigations.

**"She seemed positive."** That is a soft social signal on a casually floated idea,
not approval and not a budget. It was given without a cost number attached, because
you don't have one yet. Manager enthusiasm for a good idea reliably survives contact
with "two sprints" and reliably does not survive contact with "a quarter of team
capacity."

**"Book the two sprints."** Two sprints of whom? All nine? Two people? The sentence
doesn't say, and that ambiguity is itself the tell: the plan isn't costed. You cannot
have a credible duration without a credible headcount, and you have neither.

**"Clearly the right call."** "Clearly" is carrying a lot of weight on a decision
with an unquantified benefit, a one-way door, and a documented 2.5x estimation miss
on the nearest comparable work.

## Evidence

### For consolidating

- The pain is real and recurring, not hypothetical. Three people feel it daily.
- Cross-project friction in ADO is genuine and structural, not just a UI annoyance.
  Boards and backlogs cannot span projects. Dashboards are project-scoped. Query
  results, notifications, and PR lists all fragment along project lines.
- Area and iteration path sprawl across three projects makes any organization-wide
  planning view awkward to build and awkward to maintain.
- One project is the simpler steady state. Fewer places for a new repo, a new
  pipeline, or a new hire to end up in the wrong spot.
- Nine developers is small. Three projects is a structure sized for a much larger
  organization, and the overhead is not obviously earning its keep.

### Against, on cost

- **Azure DevOps has no merge-projects operation.** There is no supported path. Every
  artifact class moves by a different mechanism, and several don't move at all.
- **Repos move by clone and push.** Commit history survives. Pull request history, PR
  comments, branch policies, and repo-level permissions do not. That is 59 repos of
  hand-rebuilt policy and a permanent loss of code review history, which for
  client-facing repos may matter more than you'd like.
- **Pipelines are the likely long pole and are entirely absent from your facts.** You
  have not said how many of the 84 build pipelines are YAML versus classic. YAML
  pipelines are cheap to re-point, since the definition lives in the repo. Classic
  pipelines are hand-rebuilt. Around them sit service connections, variable groups,
  agent pools, environments, secure files, and task groups, all project-scoped, all
  recreated. The YAML-to-classic ratio could swing the total by weeks in either
  direction and nobody has counted it.
- **The 11 classic release pipelines carry deployment history that does not
  transfer.** If anything in your world requires an auditable record of what shipped
  to production and when, that's a compliance question before it's a technical one.
- **The long tail is where migrations actually die.** Anything outside ADO that
  references a project name breaks: service hooks into Slack or Teams, badge URLs in
  READMEs, wiki and Confluence links, bookmarks, external CI integrations, and any
  package feed whose URL includes the project. My honest guess is that this class of
  breakage is a strong candidate for what consumed weeks 3 through 5 in 2023. Go find
  out, because if I'm right it's fully predictable this time and if I'm wrong you've
  learned something more important.
- **Your own base rate.** Five weeks against two, on a job smaller in every countable
  dimension than this one. Apply that same 2.5x factor to four weeks and you get ten,
  before adjusting for the fact that this migration is several times larger. Two
  sprints is not a conservative estimate that might slip. It is contradicted by the
  only directly relevant measurement you have.

### What I could not verify and you should

I'm working from recall on Azure DevOps mechanics here, with no access to your
tenant. Three things could each move the cost materially and none should be assumed:

1. **Process templates.** If the three projects use different or differently
   customized process templates, cross-project work item moves get constrained and
   field mappings get lossy. Platform's history goes back to 2019 and may sit on
   something the other two don't.
2. **Work item move mechanics and batch limits.** Bulk-moving 14,000 items has real
   constraints on batch size, on what happens to test artifacts, and on whether area
   and iteration assignments survive. Verify the actual behavior on a sample before
   sizing that phase.
3. **Package feed scoping.** Project-scoped feed URLs contain the project name.
   Organization-scoped ones don't. Which you have determines whether every consuming
   project's package config needs editing.

None of my recommendation depends on these resolving a particular way. Check them
anyway before estimating.

## Strongest objection

**The permission change is not a migration cost. It is a permanent downgrade in how
your security boundary is enforced.**

Today, contractors cannot see client-facing code because they are not in that
project. That safety is structural. The tool enforces it, for free, forever, and no
human has to remember anything.

After the merge, that same safety becomes procedural. It holds only as long as every
future repo creation, every group membership change, and every permission inheritance
default gets the right treatment, indefinitely, by people who will eventually forget.
Inherited defaults in a consolidated project will tend toward broader access, not
narrower, so the failure mode is silent and the direction of drift is against you.

You have not made a configuration task for yourself. You have converted a boundary
the tool guarantees into one a human has to keep guaranteeing. That is a real and
permanent cost, and it is the price of the only version of this that delivers the
benefit.

Second objection, close behind: **the benefit asymmetry.** Three of nine people gain,
and their gain is unmeasured. Six gain nothing. That is a poor ratio for a one-way
door with a ten-week floor, and it's the kind of ratio that looks obvious in
retrospect and invisible in advance when you've wanted the thing for a year.

One thing that is genuinely worth checking before anything else: whether your
contractors' agreements or NDAs even permit them to hold accounts in a project
containing client-facing repositories, regardless of how correctly you deny them at
the repo level. That could be a contractual blocker rather than a technical one, and
it would settle the whole question in an afternoon.

## Recommendation

Don't book it. Not "don't do it," and not "do it later." Don't book *this*, because
what you have is a direction rather than a plan, and the number attached to it is
wrong.

Confidence: high that the two-sprint estimate is wrong, and high that the benefit is
currently unquantified. Genuinely uncertain whether full consolidation is correct
once it's properly costed. It might well be.

Spend about a week on four things, none of which commit you:

1. **Post-mortem the 2023 migration.** What specifically consumed weeks three through
   five? This is the highest-value hour available to you. If those causes are
   knowable, they're estimable this time. If nobody can reconstruct them, that is
   itself decisive: it means you have no basis for any estimate at all.
2. **Recover the 2023 rationale.** Why was Internal split out? If the reason still
   holds, you're about to pay to recreate a problem you already paid to solve.
3. **Try the cheap mitigations for one sprint and measure.** Cross-project queries,
   a Delivery Plan spanning the teams, and a cross-project Analytics or Power BI view
   cover a real fraction of "I can't see my work in one place," and cost days rather
   than sprints. If the three affected developers' complaints drop meaningfully, you
   have just bought most of the benefit for two percent of the cost and the question
   is closed. If they don't, you've proven the consolidation hypothesis instead of
   assuming it, and you walk into the manager conversation with evidence.
4. **Count the pipelines.** YAML versus classic, plus an inventory of service
   connections, variable groups, and task groups. Then verify the three unknowns
   listed above.

Then re-estimate. If the honest number comes back at eight to twelve weeks and the
measured benefit still justifies it, go, with the permission model designed up front
rather than discovered in week six.

On staging, if you get that far: Internal first is the right pilot, but be clear
about what it buys. It calibrates your per-repo and per-pipeline mechanical cost,
which is the number you're missing. It tells you nothing about either hard part,
because Internal has no external contractors and no client-facing code. And a
half-migrated state temporarily makes context switching *worse* for exactly the three
people this is supposed to help. So a clean Internal run is weak evidence about
Platform and Integrations. Do not let a green pilot become the mandate for the rest.

## Next check

One conversation, this week, with whoever ran the 2023 migration: what actually ate
weeks three through five, and why was Internal split out in the first place?

Everything above is a probability estimate. That conversation is the cheapest thing
that turns any of it into a fact, and depending on the answer it either kills the
project or gives you the first credible number you've had.
