## Neutral restatement

Should a 9-developer team spend an unscoped block of engineering time consolidating three Azure DevOps projects (59 repos, 95 pipelines, ~14,000 work items, an external-contractor access boundary, and full area/iteration path remapping) into one, given that their last and much smaller ADO migration overran its estimate by more than 2x?

## Cold read

You asked whether you are being rational or talking yourself into it. Both, in different places. The destination is defensible and possibly correct. The motivated reasoning is in the cost, the timing, and the scope, and the clearest tell is where you put the 2023 datum: the single most predictive fact in your message is the last bullet on the list. Do not book two sprints.

## Framing audit

Five things in the framing that could tip the answer:

**"I've wanted this for about a year."** A year of wanting inflates the felt payoff and deflates the felt cost. Persistent irritation is sometimes a real signal, so this does not invalidate the goal. It is not evidence of value either, and you flagged it yourself by asking the question.

**"The team complains constantly about the context switching."** Your own numbers say 3 of 9 developers work across all three projects daily; the other 6 live mostly in Platform. "The team" is doing rhetorical work that the headcount does not support. Two-thirds of the team is being enlisted into a grievance it does not hold. Separately, complaining is cheap and the people complaining are not the people who will pay the migration cost, which lands on whoever runs it plus everyone who eats the cutover disruption.

**"I floated it to my manager and she seemed positive."** Positive on an idea is not sponsorship of a multi-week engineering freeze. You have not yet asked her the real question, which is whether she will fund five-plus weeks of migration instead of five-plus weeks of feature work. Her answer to the floated version tells you close to nothing about her answer to the funded version.

**"Clearly the right call and I should just book the two sprints."** This bundles two decisions that deserve separate scores: should the end state be one project, and is now the time at this price. The first is arguable and might be yes. The second is where the evidence bites. Scoring them together lets the appeal of the first carry the second.

**The 2023 migration, listed last.** Splitting Internal out was 6 repos and took five weeks against a two-week estimate. The proposed job is roughly ten times the artifact count and adds a permission redesign the 2023 job did not need. That fact belongs at the top of your message and it is at the bottom. Placement is itself a data point about which way you are leaning.

One thing that is not a bias: asking the question at all. You did the check most people skip.

## Evidence

**For consolidating, on the merits:**
- Cross-project friction is real and compounds. Boards, backlogs, queries, and dashboards being project-scoped is a genuine daily tax on the 3 people who straddle.
- At 9 developers and 59 repos, the organization is small enough that a single project is a plausible right shape. Multi-project structures usually earn their keep at larger headcounts or with harder boundaries.
- The cost grows with time. 59 repos now is cheaper to move than 80 repos in two years, if you are going to do it at all.

**Against, on the merits:**
- Your only calibrated estimate of your own team's ADO migration ability says you overrun by 2.5x on a job an order of magnitude smaller. Two sprints is not an estimate, it is a wish. Nothing in your fact list supports it and one thing in it directly contradicts it.
- The benefit is concentrated in 3 of 9 people. The disruption (re-cloning, re-pointing remotes, broken links, CI instability during cutover, contractor access churn) is spread across all 9 plus the two contractors.
- Permissions are per-project today, which means the isolation between two external contractors and 41 client-facing repos is currently structural. After a merge it becomes configured. Configured boundaries have to be maintained correctly forever, including on every repo and area path created after the migration. You filed this as a remapping chore. It is the most consequential item on your list.

**What is missing, and would decide it:**
- **Do all three projects share the same process template?** You did not mention this. If Platform is on a custom or inherited process and the others are not, field mapping across 14,000 work items is where your schedule disappears. This is the first thing to check because it can change the estimate by weeks.
- **Does any client contract or contractor agreement require access separation?** If separation is contractual rather than a preference, the full merge is not risky, it is off the table, and everything else is moot. Treat this as a possible hard blocker, not a cost line.
- **Which seam do the 3 cross-project developers actually switch across, and what does it cost them per week in hours?** Not adjectives. This determines both whether the project is worth doing and what its correct scope is. See the recommendation.
- **How many service connections, variable groups, and secure files exist across the three projects?** This is the invisible half of migrating 95 pipelines, and secrets generally cannot be exported, only re-entered.
- **Must pull request history survive the move?** That is the review record for 59 repos. If it must survive, the repo migration is a materially different and larger job than if it does not.
- **What are the actual mechanics and losses of an ADO cross-project migration in your org's current configuration?** I am not going to assert what Azure DevOps does or does not support here from memory. Verify it against current Microsoft documentation and, better, against a dry run.

## Strongest objection

The merge dissolves the only structural control separating two external contractors from 41 client-facing repos and 14,000 work items, and replaces it with a hand-maintained configuration that every future repo and area path can silently defeat. You are buying a permanent, ongoing operational risk to relieve a daily friction that three people feel. Every other cost here ends when the migration ends. That one does not.

The second-strongest objection is simpler: the only estimate you have from your own team on this exact class of work was wrong by 2.5x on an easier job, and you have responded by producing a smaller number with less analysis behind it.

## Recommendation

Two things your own evidence already settles:

**Do not book two sprints.** Your base rate refutes it and nothing you have offered rehabilitates it. If you take this to your manager at two sprints and it lands at six weeks, you spend credibility you will want for the next thing.

**Scope is determined by which seam the switching happens on, and you are one question away from knowing.** Ask the three cross-project developers which pair of projects they bounce between.

Then it branches:

**If the pain is on the Internal seam:** merge Internal into Platform only. Six repos, history from 2022, no external parties, no client-facing code. You get real relief, you avoid touching the contractor boundary entirely, and you come out the other side with a measured per-repo and per-work-item cost that makes any future decision about Integrations an estimate instead of a guess.

**If the pain is on the Integrations seam:** say the awkward thing out loud, which is that the merge you want is precisely the one your only hard boundary blocks. In that case the work in front of you is not a migration, it is designing and testing a permission model that isolates two external contractors inside a single project, and proving it holds for repos and work items that do not exist yet. Do that first, or wait for the contractor relationship to end, at which point the whole decision gets much cheaper.

Confidence: high on "do not book two sprints," because your own base rate settles it without needing anything I would have to look up. Moderate on the branch structure, because it depends on the process-template answer and the contractual question, either of which could override it.

What would change this: contractors leaving within the quarter (removes the hard boundary, and the full merge becomes reasonable to scope properly); identical process templates plus no requirement to preserve PR history (removes the two largest unknowns from the estimate); or a contractual separation requirement (kills the full merge outright and settles the scope question for you).

## Next check

One day, in this order:

1. Ask the three cross-project developers which seam they cross and roughly how many hours a week it costs. This is a conversation, not a study, and it decides the scope.
2. Compare the process templates across the three projects. If they differ, stop and re-estimate before anything else.
3. Check whether any client contract or contractor agreement speaks to access separation.
4. Then, and only then, do a timeboxed dry run: move one representative repo, one pipeline, and twenty work items into a throwaway target project. Record what took how long and what was lost. Multiply by the real counts.

Take the resulting number to your manager. If it is five to eight weeks and she is still positive, you have an actual mandate rather than a favorable impression, and you will be right to proceed.
