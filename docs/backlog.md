# Backlog

The living next-steps doc for the kit. Active items only; when an item is done it moves out to a dated snapshot in `archive/` (`backlog-YYYY-QN.md`) rather than being struck through in place. Per-effort history lives in each plan's Chapters, not here; this file is for cross-effort next steps that belong to no single open plan.

## Active

- **Baseline-test the ported behavior-shaping wording (2026-07-24).** The completion contract in executing-work and the kit-goal skill were ported from the sapplefeld kit, whose wording forms carry observed-failure provenance from that kit's live incidents; per writing-skills, run the RED/GREEN check on them once real leashed runs here have exercised them, rather than trusting the port sight unseen.
- **Pin the session-start armed-goal surfacing with a test (2026-07-24).** The armed-goal block in hooks/session-start.js is verified manually (implementer and reviewer, kit-goal-port S2) but no test pins it; add a small armed/unarmed pair when the next hook-test round touches session-start.
- **Extract a shared plan-status helper (2026-07-24).** The anchored Status-header predicate now lives in four places (kit-goal-lib planHead, session-start.js twice, stop-docs-hygiene.js); if it gains nuance (an Abandoned status, say), single-source it into a hooks/lib/ helper rather than editing four copies.

## Snapshots

Completed items are archived to `archive/backlog-YYYY-QN.md`. None exist yet; nothing has been pruned from this doc since the convention landed.
