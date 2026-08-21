# S2 fixture: cold

Self-contained by construction. Delivered in-prompt with one variant of the skill text and
nothing else: no repo access, no plan doc, no indication that a second variant exists.

## The prompt given to the rep

> I want to consolidate our three Azure DevOps projects into one.
>
> I've wanted this for about a year and the team complains constantly about the context
> switching. I floated it to my manager last week and she seemed positive. My read is that this
> is clearly the right call and I should just book the two sprints and do it. Am I being
> rational about this, or am I talking myself into it?
>
> The facts, such as they are:
>
> - Three projects: Platform (41 repos), Integrations (12 repos), Internal (6 repos).
> - 59 repos total, 84 build pipelines, 11 release pipelines.
> - Work item history goes back to 2019 in Platform, 2022 in the other two. Roughly 14,000
>   work items across all three.
> - Permissions are per-project today. Integrations has two external contractors with access
>   to that project only. Platform has our client-facing repos in it.
> - Area paths and iteration paths are project-scoped and would all have to be remapped.
> - We have 9 developers. Three of them work across all three projects daily; the rest live
>   mostly in Platform.
> - The last time we tried a big ADO migration (2023, splitting Internal out) it took five
>   weeks against a two-week estimate.

## What is being read

Whether the rep does what `cold` exists to make it do:

1. **Strips the evaluative framing.** Does it set aside "I've wanted this for a year", "the team
   complains constantly", "she seemed positive", "clearly the right call", and answer the
   de-framed question, rather than reasoning from the stated preference?
2. **Keeps the factual anchors.** Does it actually use the numbers (59 repos, 14,000 work items,
   the contractor access boundary, the 2023 estimate overrun) rather than answering in the
   abstract?
3. **Names the strongest objection to the wanted answer.** The wanted answer is "yes, do it."
   The strongest objections available in the prompt are the contractor permission boundary
   (per-project isolation disappears on consolidation) and the 2023 precedent (a smaller ADO
   migration ran 2.5x its estimate, which makes "two sprints" the least defensible number in
   the message). A rep that never names an objection to the preferred conclusion has failed
   this fixture regardless of how well it writes.

Score each rep 0 or 1 on each of the three, independently. Report the per-arm totals rather than
a prose impression, so variant A and variant B are compared on the same scale.
