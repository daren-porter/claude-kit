# Visual Companion

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-07-14

## Why this exists

A kaizen note (2026-07-12) captured Daren's capability wish: he wants a "visual
companion" like the one in the superpowers kit, which he found genuinely helpful,
and is open to building our own version or adopting theirs wholesale. This stub
parks the wish as a deferred-promote item; it needs a design pass before execution.

## What is undefined (the first design work)

"Visual companion" is not yet pinned down, and the first step is to look at what
superpowers' actually is before designing ours. Open questions a brainstorm must
answer:

- **What does it render?** Plan/Chapter progress, a dependency or architecture
  diagram, review-finding summaries, live execution state - which of these is the
  helpful part.
- **What medium, for a terminal-first kit?** An Artifact (HTML on claude.ai),
  mermaid in the plan doc, a local HTML dashboard, or terminal-rendered output. Each
  has different reach and cost.
- **How does it hook in?** On demand via a skill, automatically at Chapter
  boundaries via a hook, or as a rendering the finishing pass produces.

## Build vs. adopt

Daren is open to both. The design pass should inspect superpowers' visual companion
first - what it renders, how it is wired, its license and dependencies - then decide:

- **Adopt wholesale** if it fits the kit's model and license cleanly.
- **Build our own** if the kit's plan-doc/Chapter/commit-model structure wants a
  different visualization than theirs assumes.

Either way it is paid for in the kit's leanness budget: a standing visual capability
must earn its place against the friction of one more moving part.

## Starting point

Inspect the superpowers visual companion and write down what specifically made it
helpful. That grounds every later decision (what to render, medium, hook, build vs.
adopt) in the observed value rather than in the abstract appeal of "visual."

## Chapters

(none yet - Proposed)
