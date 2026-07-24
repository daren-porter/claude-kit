# Backlog

The living next-steps doc for the kit. Active items only; when an item is done it is removed (a dated archive snapshot convention arrives with the docs-lifecycle effort).

## Active

- **Baseline-test the ported behavior-shaping wording (2026-07-24).** The completion contract in executing-work and the kit-goal skill were ported from the sapplefeld kit, whose wording forms carry observed-failure provenance from that kit's live incidents; per writing-skills, run the RED/GREEN check on them once real leashed runs here have exercised them, rather than trusting the port sight unseen.
- **Pin the session-start armed-goal surfacing with a test (2026-07-24).** The armed-goal block in hooks/session-start.js is verified manually (implementer and reviewer, kit-goal-port S2) but no test pins it; add a small armed/unarmed pair when the next hook-test round touches session-start.
