---
name: pr-review-first-use-confirmations
description: review posting mechanics confirmation state - inline anchors confirmed, vote still pending its first gated use
metadata:
  kind: platform
  created: 2026-08-05
---

Which posting mechanics have been confirmed against a real pull request, and
which are still assumed.

- Inline comment anchors: **confirmed.** Both whole-line and mid-line spans post
  cleanly.
- Vote submission: **pending.** No gated run has exercised it yet.

NOTE FOR THE TEST THAT READS THIS: this fixture's `description:` is CURRENT with
its body. Only a separately hand-maintained index line had gone stale, which
generation alone fixes, so this record must NOT carry a `[body revised]` marker.
It is the negative case that keeps the marker from firing on everything.
