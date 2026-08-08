# Appsec Security Reviewer for Non-.NET Repos

Status: Abandoned
Commit Model: Commit-and-Push
Created: 2026-07-14
Closed: 2026-08-07

## Why this was abandoned

Adjudicated in the 2026-08-07 kaizen pass, on the reasoning the Related note below had already
assembled. The docs-lifecycle effort (section 5, 2026-07-24) generalized `security-reviewer` to
any production codebase, making JS/Node, shell, and configuration first-class and the
procedure-only data-access model conditional on the project documenting it. That is
substantially this stub's option 3, delivered. The friction that opened the stub was a Python
repo getting a "you are Python now" dispatch override; that override is no longer needed,
because the agent is no longer .NET-shaped.

What the generalization did not settle is the narrower question of whether an appsec
*specialist* beats a general reviewer carrying security bullets. That question is real but it
is no longer pressing, and it was never what the friction was about. If it returns it will
return with new evidence (a real miss by the generalized reviewer on a repo with genuine attack
surface), and that evidence should open a fresh spec rather than revive this one, whose scope
framing ("non-.NET repos need a separate agent") is now wrong at the premise.

## Related

- The docs-lifecycle-and-guards spec (section 5, 2026-07-24; archived at that effort's close) generalized
  the existing security-reviewer to any production codebase (JS/Node hooks, shell, config
  first-class; procedure-only model conditional on the project documenting it), which is
  essentially this stub's option 3. The stub likely retires; Daren adjudicates. Note the
  spec's own scope framing ("non-.NET repos need a separate agent") predates that change.

## Why this exists

A kaizen note (2026-07-10) captured real friction: the `security-reviewer` agent
is built around the .NET/T-SQL procedure-only model and SOC 2, but
mcp-providers-connector is Python with genuine security surface (subprocess
execution, credential handling, injection). The reviewer does not transplant, so it
got overridden with a "you are Python now" dispatch, and `finishing-work` step 2
folds non-.NET security into the adversarial pass. This stub parks the question as a
deferred-promote item; it needs a brainstorming pass before execution.

## The current kit posture (what a design must engage)

The kit already has a stated position on non-.NET security, and a design here is a
decision to keep or change it:

- `finishing-work` step 2: when the changeset is entirely outside C#/.NET or T-SQL,
  do not dispatch `security-reviewer`; security folds into the adversarial pass.
- `adversarial-reviewer` carries a "Security (non-.NET changesets only)" bullet:
  command/argument injection, unsafe shell/`eval`, path traversal, untrusted input,
  committed secrets.

So the friction is not "there is no coverage" - it is "the coverage is a general
bullet in a code reviewer, not an appsec specialist, and that felt too shallow for a
repo with real attack surface."

## The question to resolve

Is non-.NET security review common enough across Daren's repos to warrant a standing
specialist, or rare enough that a per-dispatch override plus a stronger adversarial
bullet suffices? Options to weigh at design time:

- **Strengthen the adversarial bullet only.** Cheapest. Keep the fold, deepen the
  non-.NET security checklist in `adversarial-reviewer`. Beats a new agent if
  non-.NET security work is infrequent.
- **New language-agnostic appsec reviewer agent.** A specialist separate from the
  .NET one (subprocess/command injection, secrets, path traversal, deserialization,
  SSRF, dependency CVEs). Must beat "one more paragraph in adversarial-reviewer" -
  the kit stays lean, and every agent is paid in every session's agent list.
- **Profile the existing reviewer.** Give `security-reviewer` a .NET/procedure-only
  profile plus a general-appsec profile. Risk: dilutes the sharp .NET/SOC 2 focus
  that makes it good today.

## Starting point

Decide the frequency question first (how often do non-.NET repos here warrant real
appsec review), because it discriminates between "strengthen the bullet" and "add an
agent." Then, whichever path, keep the .NET/SOC 2 reviewer's focus intact.

## Chapters

(none yet - Proposed)
