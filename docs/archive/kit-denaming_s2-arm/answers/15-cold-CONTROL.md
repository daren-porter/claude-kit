You asked whether you're being rational or talking yourself into it. Short version: the goal is
legitimate, the estimate is wrong by a large factor, and the shape of the plan is wrong. There's a
version of this that's clearly worth doing, and it isn't the one you're about to book.

One caveat up front, and it's load-bearing for how you read the rest: I can't verify anything
against your actual ADO tenant or against current Microsoft documentation in this session. Every
Azure DevOps mechanic below is from memory and is flagged as such. The recommendation is "spike and
verify before booking," which holds even if an individual mechanic has drifted, but do not treat any
specific claim as checked.

---

### Neutral restatement

A 9-developer organization runs three Azure DevOps projects (41, 12, and 6 repos; 84 build and 11
release pipelines; ~14,000 work items; per-project permissions isolating two external contractors to
one project). Three developers work across all three daily; six work almost entirely in the largest.
Should the organization merge all three into a single project, at a cost of two sprints, given that
its last ADO migration ran 5 weeks against a 2-week estimate?

### Cold read

Merge Internal into Platform. Leave Integrations alone. The right end state is probably two
projects, not one, and it's reachable for a fraction of the cost, because Integrations is the only
one of the three carrying a permissions boundary that consolidation would destroy. Do not book
sprints for anything until a 3-day spike has answered four factual questions, one of which
(is the contractor scoping an audited or contractual control?) can disqualify the whole idea by
itself.

### Framing audit

Four things are tilting the scale, and you named three of them yourself without registering them as
warnings:

- **"I've wanted this for about a year."** A year of wanting is a year of accumulating reasons, not
  evidence. This is the highest-risk signal in your message, because the reasons you've collected
  were all recruited by a conclusion you'd already reached.
- **"She seemed positive."** That's not sponsorship. Nobody has been asked to approve the real
  proposal yet, because the real proposal isn't two sprints. A positive reaction to a two-sprint
  idea tells you nothing about the appetite for a ten-week one.
- **"My read is that this is clearly the right call."** The word doing work there is *clearly*. The
  permissions question in your own fact list is unresolved, and it isn't a scheduling problem you
  can sprint through.
- **The team's complaints are doing double duty.** They're strong evidence that people are
  frustrated. They're weak evidence that consolidation is the fix, and they're no evidence at all
  about cost. Six of your nine developers live in Platform and gain nothing from this.

Also worth separating: your numbers overstate the job in one direction and understate it in another.
"59 repos" is not the move surface if Platform is the target. Platform's 41 stay put; only Internal's
6 and Integrations' 12 actually move. Same for work items: Platform's 2019-onward history stays,
so the migration surface is the 2022-onward items from the other two, not all 14,000. That cuts in
your favor and it's the thing that makes a small pilot cheap. The understatement is in the pipelines,
below.

### Evidence

**For consolidation (real, don't dismiss it):**

- Three of nine developers hit this daily. That's a third of the team, and daily friction compounds.
- Some pain genuinely has no cross-project workaround: one unified board and backlog, one area and
  iteration tree, one wiki, one set of variable groups. If that's where the complaints actually
  live, tooling tweaks won't touch it.
- (Recall, unverified) Work item IDs in Azure DevOps are unique per *organization*, not per project.
  If all three projects live in one org, moving work items preserves their IDs, so commit-message
  references and any external links by ID keep working. That removes a whole category of breakage
  people usually fear.
- The move surface is 18 repos, not 59.

**Against, or at least against the current plan:**

- **The 11 release pipelines are the sharpest signal in your list, and it's bad.** Counting "release
  pipelines" separately from "build pipelines" implies Classic Release definitions rather than YAML
  multi-stage pipelines (recall, worth confirming in five minutes). Classic release definitions are
  the single most painful ADO artifact to move between projects: environments, approvals, gates,
  variable groups, and service connection bindings do not port cleanly and are substantially
  rebuild-by-hand. If a meaningful share of the 84 builds are also Classic, the pipeline work alone
  could exceed your entire two-sprint budget.
- **(Recall, unverified) There is no first-party "merge projects" operation in Azure DevOps.** This
  is not a configuration change. It's a bespoke migration project requiring scripts or a third-party
  tool, chosen and piloted before anyone can estimate honestly.
- **Repo history moves; ADO metadata doesn't.** A mirror push carries git objects. Pull requests, PR
  comments, code review history, branch policies, and repo-level permissions are ADO-side data and
  do not come with it. So does every URL: local remotes, pipeline checkout refs, service
  connections, submodules, feed references, doc links, bookmarks.
- **Merging forces collision resolution that a split never did:** duplicate repo names, area path
  names, team names, pipeline names, variable group names, service connection names.
- **The estimate.** Two independent bases, and I'd keep them separate rather than blending:
  1. Your own track record: 2.5x miss on the 2023 job, applied to 4 weeks, gives 10 weeks. And that
     multiplier came from the *smaller* version of this work, done by this team on this platform.
  2. Bottom-up: roughly 10x the artifact surface of the 2023 job, plus probable Classic release
     rebuilds, plus an unchosen migration tool, plus collision resolution that didn't exist last
     time.
  Both land in the 8 to 12 week neighborhood. Neither lands near two sprints.
- **This is close to a one-way door.** Un-merging costs at least what merging cost. You have direct
  proof: the 2023 split *was* an un-merge, on the smallest project, and it cost five weeks.

**Missing facts, in the order they should be answered:**

1. **Are the 84 builds and 11 releases YAML or Classic?** Swings the estimate more than anything
   else on this list.
2. **Is contractor scoping (or client-facing repo access) an audited control or a contract term?**
   If it's a SOC 2 control or a client MSA clause, consolidating Integrations creates an audit
   finding, not an admin inconvenience. One email.
3. **Do all three projects use the same process template?** Agile vs Scrum vs CMMI mismatches turn
   work item migration from mechanical into brutal (field and state mapping).
4. **Are all three in the same organization?** Everything above about ID preservation, cross-project
   queries, and work item move assumes one org. Your phrasing implies it. Confirm it.
5. **What did the 2023 post-mortem say?** Where did the extra three weeks actually go? That's the
   most directly predictive data you own, and it's free.
6. **What specifically do the three cross-project developers lose time to?** Nobody has measured it.
   "Complains constantly" is real, but it can't be weighed against a ten-week number.

### Strongest objection to what you want to hear

The permissions inversion, and it isn't about cost or schedule.

Per-project permissions are ADO's coarsest and most robust boundary: default-deny, hard to
misconfigure, hard to silently erode. Consolidation replaces it with a fine-grained scheme you must
build correctly and then never get wrong again. (Recall, unverified) You *can* rebuild most of it:
repo-level deny rules, area-path permissions to scope work item visibility, permissioned query
folders and pipeline folders. But work item visibility would then hang on area path discipline
rather than on a project wall, and some project-scoped surfaces (the project wiki, dashboards,
project-scoped artifact feeds) are awkward or impossible to segment cleanly.

So the trade is: a permanent increase in security surface and ongoing admin burden, in exchange for a
one-time convenience gain, at an organization that has external contractors *and* client-facing code.
For Integrations specifically, three projects may simply be the correct architecture, and the
structure you find annoying may be the structure doing the work.

That objection applies to Integrations. It does not apply to Internal, which is why the two-project
end state is the answer rather than a compromise.

### Recommendation

**Don't book the two sprints. Run a 3-day spike, then take a real number back to your manager.**

If the spike comes back clean, do this in stages and stop early if the value isn't there:

- **Stage 1: Internal into Platform.** 6 repos, 2022-onward work items, no contractor boundary. This
  is both the pilot and a genuine deliverable. It's also the direct inverse of the 2023 job, so you
  get a clean cost comparison against known history.
- **Stage 2: reassess.** With Stage 1 measured, you'll have a real multiplier. Decide about
  Integrations with data instead of a year of wanting.
- **Stage 3 (probably never): Integrations.** Only if fact #2 comes back "convention, not control,"
  and only if Stage 1 came in near estimate.

Confidence: high that two sprints is materially wrong and that the spike should precede any booking.
Moderate on the final go/no-go for Integrations, because facts 1 through 3 are unknown and any of
them could settle it.

What would change this: Stage 1 lands near estimate, pipelines turn out to be YAML, process
templates match, and the contractor boundary is convention rather than a control. Then merging
Integrations becomes a normal, defensible piece of work rather than a bet.

### Next check

Three days, in this order, before you commit to anything:

1. **Half a day.** Answer the six missing facts. #1 and #4 are a few minutes in the ADO UI. #2 is one
   email to whoever owns your client contracts and compliance. #5 is asking whoever ran the 2023
   migration.
2. **One day, cheap-fix trial.** (Recall, all unverified, and the point of the trial is to verify
   them.) Turn on cross-project work item queries, build a Delivery Plan spanning teams in all three
   projects, and stand up a cross-project dashboard for the three affected developers. If you also
   need cross-project repo checkout in pipelines, note the usual blocker: the organization setting
   that limits job authorization scope to the current project, which is commonly enabled and will
   make it fail in a way that looks like a permissions bug. Also check whether org-scoped artifact
   feeds would remove a chunk of the friction. Let it run two weeks and ask the three developers
   whether the pain moved. This is worth a day even if you migrate anyway, because it tells you how
   much of the complaint is structural versus how much is nobody knowing these features exist.
3. **A day and a half, pilot move.** Move ONE low-value repo and about 20 work items from Internal
   into Platform. Time it honestly, and inventory precisely what broke: PR history, work item links,
   attachments, pipeline references, branch policies, permissions. You'll need a tool or scripts for
   the bulk work; choose and pilot one here rather than after the sprints are booked. Then multiply
   by the real surface, and add your team's demonstrated 2.5x rather than assuming this time is
   different.

One blunt thing, because you'll feel it either way: going back with 8 to 12 weeks after floating two
sprints is a credibility event. It is a much smaller one now, with a 3-day spike behind the number,
than it will be five weeks into a ten-week job. Your manager was positive about a proposal that
doesn't exist. Reset the number while resetting it is cheap.

To answer the question you actually asked: you're not being irrational about the *problem*. You're
being optimistic about the *cost*, in exactly the direction a year of wanting something would
predict, and you've routed around the one fact in your own list (the contractors) that could make
the answer no.
