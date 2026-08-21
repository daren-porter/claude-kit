# Cold read: consolidating three ADO projects into one

## Neutral restatement

A 9-person team runs three Azure DevOps projects holding 59 repos, 84 build
pipelines, 11 release pipelines, and roughly 14,000 work items with history back
to 2019. Permissions are project-scoped today, and that boundary is currently
doing real work: two external contractors are confined to one project, and
client-facing repos sit in another. Three of the nine developers cross project
boundaries daily; six do not. The team's only prior data point on an ADO
migration is a smaller job in 2023 that ran five weeks against a two-week
estimate.

Should this team commit two sprints now to merging all three projects into one?

## Cold read

No, not as scoped. The destination is defensible and probably right; the plan is
not. You are proposing to commit a fixed budget to an unsupported migration path
before answering the three questions that determine whether the job is a week or
a quarter, and the one benefit you are buying has partial cheap substitutes while
the largest cost you are paying (collapsing a permission boundary that currently
isolates external contractors from client-facing code) has none.

Split the decision. "One project is the better end state" and "book two sprints
and start" are separate calls, and the second does not follow from the first.

## Framing audit

You asked whether you are being rational or talking yourself into it. Partly the
latter, and the tell is not your conclusion. It is the shape of your evidence.

- **Every fact you listed is a cost or a risk. Not one is a benefit.** You
  enumerated repos, pipelines, work item counts, permission entanglement, path
  remapping, and a prior overrun. The benefit appears only as an assertion
  ("the team complains constantly"). When someone has assembled the cost side in
  detail and left the benefit unquantified, they are usually building a case for
  a conclusion they already hold rather than testing it.
- **The wanting predates the evidence by a year.** That is the highest-risk
  signal in the whole message. A year of wanting something produces a standing
  readiness to accept any argument for it.
- **"The team complains constantly" is three people.** Three of nine cross
  boundaries daily. The other six live mostly in Platform and will absorb
  migration disruption for a benefit that is largely not theirs. Complaint volume
  is a real signal about pain, but it is not a measure of cost, and the loudest
  pain is not automatically the most expensive one.
- **"She seemed positive" is not approval.** A hallway float met with warmth is
  the weakest form of stakeholder buy-in that exists, and you are about to
  convert it into two booked sprints. If this runs to eight weeks (and your own
  history says overruns happen here), "she seemed positive" will not hold as
  cover, and you will be defending the spend alone.
- **"Clearly the right call" is doing work the facts do not support.** The word
  *clearly* is load-bearing and unearned. Nothing in your list makes the case
  obvious in either direction.

What is not distorted: your read that cross-project fragmentation is a genuine
Azure DevOps limitation rather than a preference. That part is sound, and I am
not going to manufacture skepticism about it.

## Evidence

### For consolidation

- The coordination tax on the three cross-project developers is real, daily, and
  has persisted for a year. That is not nothing.
- Azure DevOps genuinely fragments across project boundaries: area and iteration
  paths, backlogs, repo namespaces, branch policies, service connections,
  dashboards, and notification scoping are all project-scoped. This is a real
  product constraint, not a workflow preference you could train around.
- 59 repos in one project is unremarkable. There is no scale reason to keep them
  separate; the end state you want is ordinary and well within how ADO is meant
  to be used.
- My recollection is that Microsoft's own guidance leans toward a single project
  per organization for most teams, with teams and area paths providing the
  subdivision. I am flagging that as recalled, not verified. It is worth
  confirming in current docs, but it points the same direction you do.

### Against consolidation as scoped

- **There is no supported project merge in Azure DevOps.** This is the fact that
  governs everything else. Every class of artifact migrates by a different
  mechanism, several of them lossy, and there is no single operation that does
  the job or rolls it back.
- **Repos move, repo history does not.** Git history survives a re-push. Pull
  request history, review comments, approvals, and branch policies do not come
  with it. Across 59 repos with history to 2019, that is a substantial archive of
  decision context that people do not miss until six months later when they are
  trying to reconstruct why something was done.
- **Work item fidelity depends on process-template compatibility.** Work items
  can move between projects inside an organization, but how cleanly depends on
  whether the three projects share a process template. Your facts do not say.
  This is the single highest-risk asset in the migration and the least reversible
  once mangled.
- **Pipelines are not as portable as they look.** YAML definitions travel in the
  repo, but the pipeline objects, triggers, variable bindings, environment
  approvals, and service connection references are rebuilt on the other side.
  Anything classic is recreated outright. Service connections, variable groups,
  task groups, secure files, and environments are all project-scoped, and secrets
  in variable groups cannot be exported with their values, so every one gets
  re-entered by hand. Eleven release pipelines plus 84 builds is a lot of surface
  for a class of work that is individually trivial and collectively enormous.
- **The permission model regresses.** Today, isolation is a project boundary:
  coarse, simple, and hard to misconfigure. After consolidation, the same
  isolation has to be reconstructed from area path permissions and per-repo
  permissions inside one project, maintained by hand, with external contractors
  and client-facing code on the wrong side of any mistake. I am asserting the
  direction confidently and not the specifics, because the specifics depend on
  configuration I cannot see. The direction is enough: you are trading a boundary
  that fails closed for one that has to be actively kept correct.
- **Your only local base rate says the estimate is optimistic.** The 2023 split
  ran 2.5x over on a job an order of magnitude smaller in surface area. The
  useful reading of that is not "this job will take 2.5x too" (much of a
  migration's cost is fixed learning, and repo moves parallelize). It is that
  your team's estimation process for ADO migrations has one recorded trial and it
  was off by 150 percent, and you are about to use the same process again. Two
  sprints (four weeks, if yours are two-week) is a gut number, not a
  discovery-based one. Nothing has changed to make the estimate better this time.

### Missing, and decisive

None of these are in your facts, and each one moves the answer:

1. **Same organization?** If any of the three projects sits in a different ADO
   organization, there is no in-place move at all and the job becomes a different
   and much larger project. Confirm this first; it is a two-minute check.
2. **Process templates.** Do all three use the same one (and the same
   customizations)? Identical templates make the work item move roughly
   mechanical. Divergent ones make it a data-mapping project with permanent
   fidelity loss.
3. **YAML versus classic across the 84 build pipelines.** The ratio is the
   difference between days and weeks on the single largest line item.
4. **The measured cost of the status quo.** Not complaints: hours. Ask your three
   cross-project developers to track boundary-crossing overhead for two weeks.
   Even a crude number converts this from a preference into a business case you
   can defend when it runs long, and it is the number your manager will want the
   moment the second sprint ends unfinished.
5. **Contractor end dates.** If those two contractors roll off in a few months,
   the hardest permission constraint dissolves on its own. Waiting could be the
   cheapest available intervention, and it is worth knowing before you design
   around them.
6. **Why was Internal split out in 2023, and does that reason still hold?**
   Someone made a case for separation three years ago and won. If it was
   permissions or compliance (HR data, finance, anything not meant for all nine
   developers), that reason may still be live, and merging it back is the *worst*
   of the three merges rather than the easiest. If it was organizational and the
   org has changed, that is a clean answer. You need to know which.
7. **Did the 2023 split actually finish?** Five weeks against two on a completed
   job is a very different signal from five weeks that ended with stranded
   pipelines and half-migrated artifacts still limping today. Cheap to check,
   highly diagnostic of what this team's migrations actually look like at the
   end.
8. **Client obligations on the client-facing repos.** If any client contract
   specifies access scoping, project-level isolation may be the documented
   control you are currently relying on, and dismantling it becomes a
   contractual question, not an engineering one.

## Strongest objection

The benefit you are buying has partial substitutes. The cost you are paying does
not.

Be precise about what the substitutes cover, because this cuts both ways.
Cross-project work item queries, Delivery Plans spanning teams, and Analytics
views feeding Power BI genuinely cover the *reporting and rollup* half of
"context switching," and they cost days, not sprints. They do not cover the daily
working surface: one backlog, one area path tree, one repo namespace, one set of
branch policies and service connections, cross-project PR views, coherent
notifications. That half is real and only consolidation fixes it. So the
substitutes downgrade the benefit rather than erasing it.

But the permission collapse has no substitute at all. There is no configuration
that gives you a single project *and* the isolation strength of separate
projects; the whole point of merging is that the boundary goes away, and every
reconstruction of it inside one project is weaker and needs active maintenance.
That is a bad trade shape: you are paying a permanent, hard-to-reverse cost in
the security model to buy a convenience whose cheaper half you have not yet
bought separately.

The honest counter to my own objection: this argument justifies *sequencing and
scoping*, not *never*. If discovery comes back clean (same org, same process
template, mostly YAML pipelines, contractors leaving, no client access
obligation), the case for doing it flips to strong. I do not think you are wrong
about where you want to end up. I think you have not earned the right to book the
sprints yet.

## Recommendation

**Do not book two sprints. Book a discovery spike instead**, three to five days,
one person, with a written output. The spike answers items 1, 2, 3, 6, and 7
above, and produces a bottom-up estimate to replace the gut one. Then decide.

Confidence: moderate-to-high on "the plan as scoped is not ready," because that
rests on your own facts (unsupported merge path, unmeasured benefit, a live
permission boundary, and one recorded estimate that missed by 2.5x). Lower
confidence, maybe 60/40, on the eventual go/no-go itself, because the deciding
evidence has not been gathered.

What would change my read toward "just do it": discovery showing same
organization, identical process templates, a large YAML majority in the
pipelines, contractors rolling off soon, and a measured status-quo cost in the
range of several hours per week per cross-project developer. That combination
makes the job smaller than you fear and the benefit larger than I can currently
credit, and I would say go.

What would change it toward "don't, or not for a long time": divergent process
templates, a mostly-classic pipeline estimate, a 2023 split driven by a
permission or compliance need that still holds, or any client contract language
about access scoping.

Two things to consider regardless of the outcome:

- **A staged merge may be available, but do not pre-select the pair.** Merging
  two projects before all three is a genuinely useful de-risking move: smaller
  blast radius, and it rehearses the mechanics. But which pair (if any) is safe
  depends entirely on question 6. If Internal was split out for permission
  reasons, folding it back first is the wrong choice, not the cautious one. Let
  discovery name the pair. Note also that any two-project variant leaves your
  three cross-project developers still crossing one boundary, so it captures
  something well short of the full benefit.
- **Convert your manager's warmth into an explicit budget before you start**,
  with a stated overrun band and a named decision point where you stop or
  continue. "She seemed positive" is not a mandate that survives week six, and
  the moment to negotiate the overrun band is now, not from inside it.

## Next check

Two hours, this week, before anything else: confirm all three projects live in
the same ADO organization, open the process template for each and compare, and
pull the YAML-versus-classic split across the 84 build pipelines. If any of those
three comes back wrong, you have saved yourself two sprints and learned it from
a settings page rather than from a stalled migration.

Then ask one person who was there in 2023 two questions: why did Internal get
split out, and did that project actually finish clean.
