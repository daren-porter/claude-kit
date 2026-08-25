# Consolidating three ADO projects: cold read

## Neutral restatement

Should a 9-developer team commit two sprints to merging three Azure DevOps projects (59 repos, 95 pipelines, ~14,000 work items, and a project-level permission boundary currently isolating two external contractors) into one, given that the team's last ADO migration, a smaller one, ran five weeks against a two-week estimate?

## Cold read

The destination is probably right. The plan is not. Two sprints has no visible derivation, your only relevant base rate says you overrun ADO migrations by 2.5x on smaller work, and the one item in your list that is a design problem rather than a migration task (contractor isolation) has no answer yet. Don't book the sprints.

On "am I talking myself into it": partly, and in a way I can point at rather than speculate about.

## Framing audit

1. **You listed the 2023 overrun and then didn't let it touch the number.** It is the last fact in your evidence and it is absent from your conclusion. You gathered the disconfirming data point and left it inert. That is the tell, and it is a cleaner one than any mood I could read off the message.
2. **"The team complains constantly" is 3 of 9, by your own count.** Six developers live mostly in Platform and would get a bigger board, more area paths, and a noisier backlog out of this. The collective noun makes a benefit for one third read as a benefit for everyone.
3. **"She seemed positive" on an informal float is being carried as approval.** She has the same 2023 memory you do. A formal ask attached to an honest number may get a different answer than the hallway version did, and you want to find that out before you book anything.
4. **A year of wanting it.** Not evidence that it's wrong. It is the condition under which estimates get generous, which is exactly what appears to have happened.

## Evidence

*(The Azure DevOps mechanics below are from what I know of the product, not from documentation I checked just now. They are load-bearing enough that I would verify them before writing a plan.)*

**For consolidating (these are real, and I am not thinning them out because the verdict is "not yet"):**

- Microsoft's own guidance leans toward fewer projects. ADO scopes area paths, iterations, boards, queries, variable groups, environments, and dashboards to the project, so cross-project work is structurally taxed. And 59 repos in one project is unremarkable; single projects routinely hold far more.
- The cost compounds. Platform's history is already seven years deep. Every year you defer, whatever migration you eventually run is larger.
- Your three affected developers are probably your integration-heavy people. Their friction may be worth more per hour than the 3-of-9 headcount ratio suggests.

**Against:**

- **There is no supported project merge in Azure DevOps.** Every mechanism is manual or lossy. Moving a repo means clone and push, which carries commits, branches, and tags but not pull requests, not their review comments, not work item links, not branch policies, not build history. That is the item teams discover after the move rather than before it.
- **95 pipelines to recreate**, with project-scoped dependencies that do not travel: variable groups, secure files, environments, release approvals. Agent pools are organization-level and service connections can be shared across projects in current ADO, so that part is less duplicated than it first looks (check whether yours are already shared before you count consolidation as a win there). The rest is per-pipeline hand work, and any pipeline that deploys to production has to actually deploy to prove it survived.
- **Permissions.** The project is ADO's clean security boundary. Inside one project you can scope permissions per repo, but work item security is by area path and is coarse, and project membership grants a lot of default visibility. Reproducing today's contractor isolation inside one project means an explicit deny-based structure that is fragile and can break silently.
- **Your only base rate is 2.5x**, on a smaller job.
- **One-way door.** Splitting back apart costs at least what merging cost. The damage lands in the half-migrated state, where pipelines point at old repos and nobody knows where to file.

**Missing, in the order it would move the decision:**

1. **What process template each project uses, and what custom fields, states, and work item types each has accumulated.** Platform is 2019, the others 2022. Three years apart in ADO almost guarantees divergence. Consolidating means choosing one process and mapping two onto it, which breaks saved queries, board column configs, dashboard widgets, and any field with no equivalent in the target. Your fact list names area and iteration paths and stops there. That omission is itself a reading on how deeply this has been scoped.
2. **What "client-facing repos in Platform" means concretely.** If clients have ADO access to them, Platform already carries your tightest isolation requirement, and merging contractors into it is worse than the status quo. That one answer can invert the whole sequencing.
3. **What the three cross-project developers actually lose time to**, measured rather than asserted.
4. **How many of the 84 build pipelines have run in the last 90 days.** In most estates a large fraction are dead. That count moves the estimate more than any other single number you can get cheaply.
5. **Whether work item IDs survive a same-org cross-project move.** I believe they do, because IDs are organization-scoped rather than project-scoped, but that is memory and it matters: if it is wrong, every commit message, document, and support ticket referencing an ID breaks.

## Strongest objection

Not to the goal. To the number.

Two sprints has no derivation you've shown, and the honest expected figure given your own history is north of five. At five-plus sprints of a 9-person team, the benefit has to be re-argued from scratch, and "three of nine developers stop switching contexts" may not survive that argument.

The failure mode here is not deciding wrong about consolidation. It's booking two sprints, arriving at week seven mid-migration with pipelines half-moved and work items in two places, and having to choose between pushing through and unwinding. That is precisely what 2023 looked like, at smaller scale.

## Recommendation

**Don't book the two sprints.** High confidence on the estimate being wrong; moderate confidence that consolidation is right eventually.

Three things reshape the question before any estimate is worth writing:

1. **Ask whether the history has to move at all.** Your cost model assumes 14,000 work items migrate. Nothing in what you wrote requires that. The cheaper variant: move the live repos, recreate pipelines for live repos only, migrate the few hundred *open* work items, and leave closed 2019 to 2022 history in a read-only archive project that stays queryable. That collapses your largest cost center and takes most of the process-mapping problem with it. This is the biggest scope lever available and it is currently unexamined.

2. **Settle the permission design on paper before anything moves.** If contractor isolation cannot be reproduced cleanly inside a single project, the honest answer is fewer projects rather than one.

3. **If fewer rather than one, don't assume which pair merges.** The obvious compromise is Platform plus Internal with Integrations kept separate for the contractors. Check it against your own numbers first: your three painful cases work across all three *daily*. If their switching is mostly Platform to Integrations, merging in Internal (6 repos, probably your least-touched) buys them nothing and you still pay to move it. The open question is which boundary the pain actually crosses, and you don't know yet.

## Next check

Spend an hour, not a sprint. **Ask the three cross-project developers what they specifically lose time to.**

If the answers are "I can't see my PRs in one list", "re-authenticating", or "switching between boards", those have non-migration fixes. The organization-level My Work view already spans projects, queries and Delivery Plans can be cross-project, and pipelines can consume repos and artifacts from another project. Try those first and see how much pain survives.

What survives is your real business case, and it's what you take back to your manager attached to a real number. Only after that is it worth spending a day on the pipeline census and standing up a throwaway project to test whether repo-level and area-path permissions can isolate the contractors as tightly as a project boundary does.
