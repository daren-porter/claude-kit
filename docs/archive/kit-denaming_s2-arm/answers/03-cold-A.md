You asked two questions bundled as one, and they have different answers. Taking them apart is most of the value here.

## Neutral restatement

An engineering org runs three Azure DevOps projects (59 repos, 84 build pipelines, 11 release pipelines, ~14,000 work items, 9 developers, 3 of whom cross project boundaries daily). One project carries external contractors whose access is bounded by the project itself; another holds client-facing repos. A previous ADO migration of a strictly smaller scope overran 2.5x.

Two separable questions:

1. Is a single consolidated project the right end state?
2. Is "book two sprints and execute it" the right way to get there, starting now?

## Cold read

On (1) you are probably right, and it is not motivated reasoning: fewer projects is the better default configuration and the cost of the move only grows with the repo count. On (2) you are talking yourself into it. Your estimate is not derived from a work inventory, it is derived from wanting this for a year, and the facts you listed argue against your plan more than for it.

The tell is not that two sprints is too low. It is that nothing in your list is an input to a two-sprint number. You have not counted the things that determine the schedule.

## Framing audit

Five thumbs on the scale, in rough order of weight:

- **"I've wanted this for about a year."** The highest-risk signal in the message. Year-long wants tend to arrive pre-justified, and the justification gets built backwards from the conclusion.
- **"Clearly the right call and I should just book the two sprints."** Two claims fused into one. The destination and the delivery plan are being carried by the same conviction, and only one of them has earned it.
- **"The team complains constantly."** Your own numbers say 3 of 9 developers cross projects daily. "The team" is doing work here that the data does not support. Six developers live mostly in Platform, get close to zero benefit, and absorb full disruption. That is a materially different project than the one "the team complains" describes.
- **"My manager seemed positive."** A hallway float is not approval. Nobody has priced this yet, so nobody has approved it. If it runs long, "she seemed positive" will not be the thing that protects the schedule.
- **The 2023 overrun is present but not doing any work.** You listed it and then proposed a two-sprint big bang anyway. Listing a disconfirming fact is not the same as pricing it in.

Credit where it is due: you asked whether you are talking yourself into it, unprompted. That is the right question and most people do not ask it a week after floating the plan to their manager.

## Evidence

**Caveat on the platform mechanics below: these are from memory, not verified.** I have not checked Microsoft's current documentation in this session. Treat every ADO behavior claim here as a strong prior to confirm, not a fact to plan against. The claims are load-bearing enough that confirming them is part of the discovery pass I recommend.

### For consolidation as the end state

- Microsoft's own guidance leans toward a single project with multiple teams, treating multiple projects as the exception for hard boundaries. Your instinct matches the documented default.
- The cross-project friction is structural, not a tooling gap you can configure away. Backlogs, boards, and iteration alignment are project-scoped. No amount of dashboard work fixes that.
- Work item IDs are unique per organization, so the highest-volume link type in the wild (work item URLs in chats, emails, commit messages) should survive a cross-project move intact.
- Git history moves cleanly. A repo re-pushed to another project keeps its full commit history.
- The 3 developers who cross daily are usually the highest-leverage people in an org, because spanning systems is what they are for. Friction on them compounds outward.
- **The cost is monotonically increasing.** This is the strongest argument on your side and I want to give it fully: at 59 repos it is expensive, at 100 it is worse, and there is no future date at which this gets cheaper. "Not now" has a real price.

### Against the plan as scoped

- There is no supported project-merge operation. This is a hand-built migration end to end.
- Things that do not come with you, to the best of my recollection: pull request history and review discussion, build history, release history and approval records. Those stay in the old projects as read-only archaeology, or die with them.
- Test Plans, suites, and cases are the notable exception to cross-project work item moves. If any of the three uses Test Plans, that is a separate problem with no clean answer.
- Service connections, variable groups, secure files, environments, and agent pool authorizations are project-scoped and need rebuilding. Secrets in variable groups cannot be exported and must be re-entered by hand. This category is the classic long pole, and it is entirely absent from your fact list.
- Classic pipelines are hand-rebuilt. YAML pipelines mostly come along because the definition lives in the repo. You have not said which 84 you have, and the ratio swings the estimate hard.
- Permissions stop being a boundary and start being a configuration. Per-repo ACLs and area-path security replace a project wall. Achievable, but the failure mode is silent: a contractor gains visibility into client-facing code and nothing alerts you.
- Your own base rate is 2.5x, on an easier class of operation.

### What is missing, in priority order

1. **Can repo-level ACLs plus area-path security actually reconstruct the contractor boundary to your satisfaction?** This is the crux, not a footnote. It decides whether Integrations can merge at all, and therefore whether the end state is one project or two. I am genuinely unsure how completely area-path security hides work items across every surface (queries, dashboards, notifications, search), and whether project-level artifacts leak structure you would rather contractors not see. Answer this before anything else, because a "no" changes the goal, not the schedule.
2. **Are all three projects on the same process template?** Same inherited process, or three different ones? This single fact probably moves the estimate more than any other, because field and state mismatches turn a bulk move into a per-type mapping exercise. It is one click per project to check and it is not in your list.
3. **Classic versus YAML pipeline counts, per project.**
4. **Counts of service connections, variable groups, secure files, and environments, per project.**
5. **Test Plans usage.**
6. **External integrations keyed to project URLs**: service hooks, Teams or Slack connectors, deployment tooling, PAT scopes, dashboards, bookmarks.
7. **Contractual or compliance constraints** on contractor access to client-facing code. If a client contract specifies access controls, this may not be your call to make.
8. **A number for the context-switching cost.** "Complains constantly" is a feeling. Ask the 3 to tally switches for a week. If it turns out to be four a day and 30 seconds each, the whole business case changes.

### On the estimate

I am deliberately not giving you a corrected number, because a number invites arguing about the number instead of about the gap. Two points:

- Applying your own 2.5x to two sprints is a floor, not an estimate, and it is derived from a single data point on an easier operation. Splitting Internal out meant moving a subset into an empty project. Merging three in means reconciling three sets of area paths, iteration paths, team configurations, and process customizations against each other. The 2.5x is the optimistic multiplier.
- "Two sprints" is ambiguous between two person-sprints and two team-sprints. That is a 9x range in the same phrase, and the fact that it has not been disambiguated is itself evidence the number is not built from anything.

## Strongest objection

The thing you want to hear is "yes, you are being rational, book it." The best case against that:

Integrations is the one project whose separateness is a control rather than an inconvenience, and the merge is what deletes it. If, after checking, you conclude the contractor boundary should stay structural, then Integrations stays out, the premise of the plan (one place, no switching) fails, and you have spent a long, disruptive quarter going from three projects to two. Your 3 cross-project developers still cross. The 6 Platform developers absorbed the disruption for nothing they asked for.

That objection is not fatal. Per-repo ACLs can very likely do the job. But it is a cost and a risk you have not priced, and it lands squarely on the highest-consequence surface you own, which is client-facing code.

## Recommendation

**Split the decision. Keep pursuing the destination, kill the two-sprint big bang.**

Concretely:

1. **Do not book two sprints.** Book two to three days of discovery against the missing-evidence list above, contractor boundary first, process templates second. This is arithmetic, not a project, and it converts your estimate from a wish into a number.
2. **Run the cheap intervention in parallel, for one sprint.** Cross-project queries, a cross-project Delivery Plan, and one org-level dashboard for the 3 who cross daily. From memory, ADO supports all three natively. It will not fix the structural board and backlog split, and it is not a substitute for consolidation. It is a measurement instrument: if it takes a meaningful bite out of the complaints, your urgency was partly a tooling-configuration problem, and you have learned that for a day of work rather than a quarter.
3. **If discovery still supports consolidating, pilot with Internal into Platform.** Six repos, 2022-onward history, no contractors. **The pilot's purpose is calibration, not value.** It will deliver little on its own, and it moves your 3 cross-project developers from three contexts to two rather than one. Judge it on the cost data it produces, not on the relief it delivers, or it will look like a failure when it is doing its job.
4. **Hold Integrations out pending an explicit, written decision on contractor access.** And take seriously that Platform-plus-Internal with Integrations separate may be the correct terminal state rather than a way-station. It keeps the boundary that is actually load-bearing. Whether one project with per-repo ACLs beats it depends on contractor terms I do not have.

**Confidence:** High that two sprints as scoped is wrong. Moderate-to-high that phasing beats a big bang. Moderate on the end state, held back mainly by the contractor question and the process-template unknown.

**What would flip me to "yes, go, and phase it less":** all three projects on the same inherited process; pipelines predominantly YAML; Test Plans unused; contractors ending soon or handleable by per-repo ACLs you already run elsewhere and trust; and a service-connection and variable-group inventory that comes back small. That combination compresses the estimate substantially and makes the incremental caution mostly unnecessary. It is a real off-ramp, and if the facts come back that way I will say so.

**What would move me further against:** three different process templates, or a client contract with explicit access-control language covering the contractors.

## Next check

Open Project Settings, Boards, Process in each of the three projects and write down what each one says. It is under five minutes, it is the highest information per minute available to you, and if the three answers differ you should stop and re-scope before anything else happens.
