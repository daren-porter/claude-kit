# Token-Efficiency Static Audit

Status: Proposed
Commit Model: Commit-and-Push
Created: 2026-07-09

## Why this exists

A kaizen note (2026-06-26) captured Daren's perceived increase in token usage
across sessions. This stub parks that as a deferred-promote item so the backlog
lives here rather than as an ambiguous line in the kaizen inbox. It is not yet
designed; it needs a brainstorming pass before execution.

## Intent

Measure before trimming. The friction is a *perceived* increase, so the first
deliverable is a measurement, not a set of cuts.

**Static (standing) context cost - deterministic, needs no telemetry.** Sum the
bytes that sit in every session's context regardless of the task:
- Every skill's `description` (all are listed in the system prompt each session).
- Every agent's description (same).
- The SessionStart hook payload (what the kit injects on open).
- `CLAUDE.md` (global + any project) and `MEMORY.md`.

This is a script-and-report job: enumerate the sources, count the bytes/tokens,
rank the heaviest, and identify trim candidates (over-long skill descriptions,
redundant agent blurbs, a bloated SessionStart payload).

**Variable cost - discipline, not measurement.** The other half is carrying large
external docs (for example DevOps PBIs) in the main context turn after turn instead
of summarizing-and-dropping. This is a workflow-discipline question, likely a line
in a skill or CLAUDE.md, and depends on what the static audit surfaces.

## Considered and set aside

OTel/Grafana log capture: likely overkill for this, and per-skill token attribution
is muddy even with it, since skills load into the same shared context and cannot be
cleanly attributed. Revisit only if the static audit proves insufficient.

## Starting point

Begin with the static audit. It is deterministic, cheap, and its output scopes
whether the variable-cost half is worth pursuing.

## Chapters

(none yet - Proposed)
