### Neutral restatement

Should a nine-person team commit an unbudgeted multi-week block to merging three Azure DevOps projects (59 repos, 95 pipelines, ~14,000 work items) into one, when the project boundary is currently the mechanism enforcing external-contractor isolation from client-facing repos, and when the team's only comparable prior migration ran five weeks against a two-week estimate on a smaller scope?

### Cold read

You are not irrational about the premise. You are talking yourself into the scope and the schedule. Cross-project friction is a real structural cost, but "consolidate all three" and "two sprints" are two separate claims riding on the back of a problem that is genuinely real, and neither of them is carried by anything in your facts.

### Framing audit

Four things in the framing are pushing the answer:

**The year-long want.** You have wanted this for about a year. That is the highest-risk signal in the whole message, because a conclusion held that long stops being evaluated and starts being defended. Every new fact gets read as confirming it.

**"She seemed positive."** You floated it and read positivity. That is not approval, and it is certainly not a budget commitment for four to ten weeks of a nine-person team. A manager agreeing that context switching is annoying costs her nothing; agreeing to fund the fix is a different conversation you have not yet had.

**"Clearly."** The word is doing work that no cited evidence does. Nothing in your facts establishes the size of the benefit.

**Three weak signals read as one strong one.** The year-long want, the soft nod, and "the team complains constantly" are each thin. Stacked, they feel like consensus. They are not independent confirmations; they are the same enthusiasm observed three times.

One bundling worth separating: "the team complains about context switching" and "therefore merge all three projects" arrive in one breath. The complaint being legitimate is not evidence that this particular remedy is the right size. Grade the remedy on its own.

### Evidence

**For:**

- The friction is structural, not preferential. Three developers pay it every day, and no amount of tooling discipline makes a project boundary disappear for them.
- A year of consistent complaint means this is not a passing irritation.
- Part of this is genuinely cheap. Internal is six repos with history only back to 2022. That is a small, self-contained piece of the job.

**Against:**

- **Your own estimating record on this exact class of work.** Five weeks against two, in 2023, on a job that moved six repos out. You are now proposing to move 59 repos, 95 pipelines, and 14,000 work items in four weeks. A 2.5x overrun is your floor here, not your midpoint, because the scope is larger than the job that produced the 2.5x. Ten weeks is the optimistic reading of your own history.
- **The benefit is concentrated in a third of the team.** Three of nine work cross-project daily. The other six live in Platform and gain close to nothing, while absorbing the churn of a re-organized workspace. "The team complains constantly" is, on your own numbers, most plausibly those three.
- **The permissions point is the serious one.** You state that permissions are per-project today, that Integrations has two external contractors scoped to that project only, and that Platform holds your client-facing repos. Consolidation dissolves the boundary that is currently doing that isolation and replaces it with configuration someone has to get right and keep right. That is not a migration cost that ends when the migration ends.
- **This reverses a decision you already paid for.** In 2023 the org concluded Internal should be separate and spent five weeks making it so. The proposal undoes part of that without stating what changed. Either the 2023 reasoning was wrong, or it was right and has since expired, or it still holds. You have not said which, and it is the same organization making both calls.
- Area and iteration path remapping is in your own list of costs, so it is conceded rather than something I am asserting at you.

**Missing, and it is the deciding evidence:**

- Any number at all on the switching cost. The entire benefit case is a complaint with no hours attached.
- Why Internal was split out in 2023, and whether that reason still holds.
- When the two contractors roll off.
- Whether the three projects share a process template.
- Whether any client contract imposes traceability or audit requirements on the client-facing repos that a re-homed repo would disturb.

A note on my own limits here: I have general recollection about what does and does not survive a project move in Azure DevOps (pull request history, classic versus YAML pipeline portability, how far area-path permissions can substitute for project-level ones, bulk work-item move limits). That is memory, not verified in this session, so I have kept it out of the load-bearing argument. Treat those as questions that will move your cost estimate, potentially by a lot, not as findings.

### Strongest objection

The estimate problem can be bought off with schedule. Book six sprints instead of two and that objection is answered.

The permissions problem cannot. You are proposing to remove the mechanism that is currently doing the isolating, and to replace a boundary the platform enforces by structure with one your team maintains by hand, in a project that contains client-facing code and two people who are not employees. Every other cost on the list is one-time. This one is permanent, it accrues to whoever inherits it, and its failure mode is silent: nobody gets an alert when an inherited permission quietly grants access it should not.

That is the best case against what you want to hear, and I do not think it is a technicality.

### Recommendation

Do not book the two sprints for the full three-way merge. Confidence: medium-high, and it rests on your own numbers rather than on anything I brought.

The defensible version of this is narrower: fold Internal into Platform, keep Integrations separate as the contractor boundary. Six repos, history back to 2022 only, and it removes one of the two switches your three cross-project developers make. It also carries no security regression, because the boundary you would be dissolving is not the one doing any work.

Even that should wait on two facts: a real number for the switching cost, and the 2023 rationale.

What would move me toward the full merge: the contractors rolling off inside the next couple of quarters, since that removes the objection I just called strongest. A switching-cost measurement large enough to pencil against a ten-week program would move me further. What would move me against even the narrow version: discovering the 2023 split was driven by a constraint that still holds.

### Next check

Two steps, both cheap, in this order.

1. Have the three cross-project developers track switching cost for one week. Rough is fine. You are trying to distinguish "two hours a week each" from "eight." At two, the full merge never pays back; at eight, it starts to. This costs a few minutes a day from three people and is roughly three orders of magnitude cheaper than the thing it decides.

2. Find out when the contractors' engagements end, and go read why Internal was split out in 2023. Both are lookups, not projects, and either one can restructure the answer.

Then take the narrow proposal to your manager as an actual funding request with a number attached, rather than a float. If the measurement comes back large, you will have the case for the wider version, and you will have it in the form that survives contact with a budget conversation.

To answer the question you actually asked: you are talking yourself into it, but not about the part you probably feared. The problem is real. It is the size of the fix, the length of the calendar, and the strength of your manager's nod that you have been generous with.
