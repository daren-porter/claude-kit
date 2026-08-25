# Prose accretion and the take-stock loop

The kit measures churn in its own prose and has exactly one channel for taking prose back out. Before this loop shipped, no `.md` file under `plugins/claude-kit/` had ever net-shrunk in a commit. The plan's whole-history measurement at `90769cc` counted 163 markdown file-events with none net-negative, against 10 net-negative JS file-events, one of which was itself a kaizen pass. The kit could subtract; it had only ever been pointed at code. The two subtraction rules `writing-skills` already carried both fire at admission time, on drafts that were never shipped, so the gap was specifically post-ship.

Four pieces implement the loop, plus wording in two skills. A maintainer tool ranks sections by churn, a shared parser defines what a section is, a SessionStart hook says when the prose has moved since anyone last read it whole, and `docs/take-stock.md` records what came down and what was spared. Detection is cheap and lives in the hook; diagnosis is expensive and lives in the tool. Nothing here decides anything: the tool ranks and never flags, the hook reports a count and never names a section, and the verdict on any section is the user's at the pass.

## Files

- `tools/accretion.js` - the maintainer tool. Outside `plugins/claude-kit/`, so it is never packaged and adds zero standing footprint. Node core plus one kit-local require.
- `plugins/claude-kit/hooks/accretion-lib.js` - the shared markdown section parser. Pure, no I/O, no dependencies.
- `plugins/claude-kit/hooks/take-stock-nudge.js` - the SessionStart nudge, kit-repo gated, git-based, fail-open.
- `docs/take-stock.md` - the record, and the hook's marker. A living document, not a solution document.
- `plugins/claude-kit/skills/writing-skills/SKILL.md`, section `## Compression: rewriting a section shorter` - what a compression owes.
- `plugins/claude-kit/skills/kaizen/SKILL.md` - the third gather input (step 1), the take-stock triage bucket (step 2), and the recording rule (step 4).
- `test/take-stock-nudge.test.js` (16 tests) and `tools/accretion.test.js` (15 tests).

The parser sits in the shipped payload rather than in `tools/` because the direction of the dependency is fixed by what ships: a plugin user receives `hooks/` and never `tools/`, so the hook cannot depend on a file its users never receive. `tools/accretion.js` requires `../plugins/claude-kit/hooks/accretion-lib.js`, mirroring how `session-start.js` requires `memory-lib.js`. Two things depend on `tools/accretion.js` sitting exactly one directory below the repo root: `REPO_ROOT` is `path.join(__dirname, '..')`, and that relative require. Moving the file means fixing both.

## The corpus, defined twice on purpose

Four globs under `plugins/claude-kit/`, and both the tool and the hook carry their own copy of the rule:

- `skills/*/SKILL.md`, matched case-insensitively (`/^skill\.md$/i`)
- `skills/*/references/*.md`, matched case-insensitively
- `agents/*.md`, matched case-insensitively
- `assets/CLAUDE.md`, an exact path join, so case-sensitive on Linux

The unevenness is real and deliberate. The hook's `inCorpus()` mirrors the tool's rules including their inconsistency, on the reasoning stated in its own comment: a tidier rule of its own would be a second definition of the corpus, and the two would part company the day somebody committed `assets/claude.md`. Nothing tests that the two definitions agree, which is the first thing to know before changing either.

Prose in `docs/`, the root `README.md`, `hooks/` and commands is not measured. `references/` and `assets/CLAUDE.md` are in because the cost this loop is about is reader attention and operator wall clock rather than tokens, and a 251-line style reference costs a reader what a 251-line SKILL.md section costs. Chapter 1 measured the addition at 39 sections over 792 lines for roughly 0.3s.

## The tool: `node tools/accretion.js`

It prints a ranked report to stdout, writes no artifact, edits nothing, and recommends nothing. Run it from anywhere: sources resolve against the script, not the cwd.

Every number comes from one snapshot, HEAD. Each file's text is read with `git show HEAD:<path>` and its sections are parsed from that text, so the line ranges handed to git are ranges HEAD actually has. Parsing the working tree instead is the bug this avoids: `git log -L` silently clamps a range whose end runs past the file's length at HEAD and exits 0, so a maintainer with uncommitted edits gets a confident undercount with no `n/a` and no note. Commits come from `git log -s -L<start>,<end>:<path> --pretty=format:%H`, counted as non-empty output lines. `%H` and not `%h`, because `%h` honours `core.abbrev` and a user with `abbrev = 4` in `~/.gitconfig` would defeat any matcher with a width in it.

Rows are ranked by lines multiplied by commits, descending, with an unknown product sorting below every known one including a known zero, then line count, then path, then title. The top 15 print; the cutoff is a report length and the report says so. The product needs no tuned constant, which is why it replaced the outlier flag the spec first asked for: commit count alone cannot separate accretion from healthy correction (`executing-work`'s "Section loop" carries 15 commits in 25 lines against `writing-skills`' "Know it works" at 15 in 169), and every thresholded form flagged 27 to 65 of the 146 sections measured at design time. A rank is a measurement; a flag is a verdict.

Recorded runs, each with its sha because these figures move: Chapter 1 records 185 sections across 33 of 33 files in 1.66 seconds at S1's close (`4b115c0`), with `writing-skills`' two accreted sections at ranks 1 and 2 (169 lines/15 commits and 162/8). Chapter 4 records 186 sections over 33 files at `1e5db4e`. Re-measure before quoting either.

Degradation is per row, never per report, and each case leaves a note in Totals: an unreadable directory, a skill directory holding no SKILL.md, an absent `assets/CLAUDE.md`, a file present in the working tree but absent from HEAD, a line range git will not answer for (rendered `n/a`, deduped to at most three causes), and a machine with no git at all, which falls back to reading the working tree and orders by line count alone. Exactly one case degrades silently: an `*.md` path that is not a regular file is dropped by the `lstatSync` gate without a note, because the alternative is opening a FIFO and hanging the tool. Each git call carries a 15-second timeout killed with SIGKILL; there is no aggregate bound on the run, accepted deliberately for a CLI where a hang costs a Ctrl-C.

An empty answer from `git log -L` is reported as `n/a` and never as 0. That is load-bearing: `git log -L` counts the commit that created a line range, so a genuine zero is unreachable, and collapsing the two would make "no answer" indistinguishable from "never edited".

## The parser

`parseSections(text)` returns `[{ title, start, end }]` with 1-based inclusive line numbers in document order, and `[]` for a document with no level-2 heading or a non-string input. A section starts at a `## ` heading and runs through the line before the next `## ` heading, or to the last line for the final section. Content above the first heading (front matter, a title, a preamble) belongs to no section, which is the definition every count in this loop inherits.

Fenced blocks are skipped wholesale, so a `## ` line quoted inside a fence is not a heading. The fence rule follows CommonMark closely enough to matter: an opener may be indented up to three spaces, uses three or more backticks or tildes, and is closed only by a bare run of the same character at least as long. An unterminated fence runs to end of file. That rule is what separates real sections from quoted ones: `tools/accretion.test.js`'s header records 185 real sections against 197 lines in the corpus that begin with `## `. It is also why the take-stock record can safely document its own heading format in a fenced example.

A trailing newline leaves a final empty element that is not a line in git's numbering, so it is dropped. That off-by-one is the exact defect the tool caught in its own motivating measurements, on the one section exposed to it (a to-end-of-file range).

## The hook

Registered in `hooks.json` under SessionStart with matcher `startup|resume`, matching `branch-reaper-nudge` rather than `session-start.js`: a compact resume should not re-nudge. It is the kit's third SessionStart hook and it is deliberately not a ninth block in `session-start.js`, which spawns zero processes and would have taken its first subprocess to host this.

The gate is one `fs.existsSync` of `plugins/claude-kit/.claude-plugin/plugin.json` under the payload's `cwd`, checked before any git call, so everywhere else in the world this hook costs a stdin read, one stat and an exit. The run is bounded twice: 5 seconds per git call killed with SIGKILL, and a 6-second budget for the whole run that starts after the stdin read. Past the deadline `runGit` refuses to spawn, and the refusal reaches the caller as a failed measurement rather than as a smaller number.

What it does, in order: list the corpus at HEAD (`git ls-tree -r -z --full-name --name-only HEAD -- plugins/claude-kit`, filtered through `inCorpus`), read the marker, verify the marker resolves (`git rev-parse --verify --quiet <sha>^{commit}`), name the changed corpus files (`git diff --name-only -z` between marker and HEAD), then per changed file take its sections from `git show HEAD:<path>` and a `-U0` diff, and intersect hunk ranges with section ranges. A section counts once however many hunks touch it; the reported number is the sum across files.

Five knobs are pinned rather than inherited on every diff, because each can rewrite what a diff reports: `--no-ext-diff`, `--no-textconv` (an external driver is not the same thing as a textconv driver, and `--no-ext-diff` does not disable the latter, which can empty every patch), `--no-color`, `--no-relative`, and `--no-renames`. Paths are read from `-z` output and never from a `+++ b/<path>` header, which git tab-terminates for a path holding a space and C-quotes for one holding a quote or a backslash. Pathspecs carry the `:(top)` prefix so a kit checkout nested inside a larger repository diffs the files it just listed rather than nothing.

Five states, four of which speak:

| State | Output |
|---|---|
| One or more sections differ from the marker | Three lines: the count with the marker's date and sha, a gloss that the count is a measurement and not a verdict, and the hand-off |
| The marker names a commit this checkout does not hold | One line saying so, naming the sha |
| A git call failed part way, or the run's deadline hit | One line saying the prose could not be measured, and to read that as "not measured" rather than "nothing has changed" |
| No marker could be read | Three lines. The lead names the file's absence only when `ENOENT` is what happened; every other read failure says only that no marker could be read |
| Nothing differs from the marker | Silence |

Silence also covers three conditions that claim nothing: not the kit repo, git cannot run here at all, and a kit checkout whose HEAD holds no corpus prose. The hand-off line is shared by every speaking block and points at `node tools/accretion.js` for the ranking and at the `kaizen` skill for the pass, closing "Reminder, not a blocker."

No repo-controlled text reaches the emitted block. The only repo-derived values are the marker's date and sha, and both are constrained at the parse door by the anchored regex rather than scrubbed at emission: an entry that does not match is not sanitized, it is not a marker. Everything else is a hardcoded literal plus a non-negative integer. `security-model.md` carries that row of the trusted-channel table, including the one property that is new with this hook, that its hand-off asks the model to run a repo file rather than doing bounded work itself.

The three failure blocks are as-built behavior the spec's acceptance criteria did not originally describe, since the spec asked for silence on any git failure. **The criterion was amended to match during the finishing pass**, on the reasoning below and on the distinction it turns on: git being unable to answer is silent, git answering that the marker does not exist here is not. They exist because a review found that every failure mode collapsing to silence made an orphaned marker sha, which is a permanent condition after a shallow clone or a history rewrite, byte-identical to "nothing changed".

The count is a two-point comparison between the marker and HEAD, not a walk of history. A section changed and then changed back is not counted, which is why the emitted sentence says sections "hold lines that differ from the last take-stock" rather than "have been patched since".

A substitution sweep is the case where the count is largest and means least. `kit-denaming` (2026-08-20) edited 24 of the corpus's 33 files to change who the prose refers to rather than what it says, so the next nudge measured against the `60addb93` marker at `docs/take-stock.md:25` reports near-total churn that carries no accretion signal. That effort left re-baselining the marker out of scope, on the grounds that re-baselining is a take-stock act and not a de-naming one, so the number is expected rather than a finding and reading it as growth is the misreading this paragraph exists to prevent. `plans/take-stock-instrument_spec_v1.md` owns the larger question of whether the instrument is asking the right thing at all.

What the hook structurally cannot count, disclosed here because the union of these is disclosed nowhere else and the hook's whole claim is one number:

- content above a file's first `## ` heading, so changing front matter, a title or a preamble counts nothing;
- a corpus file holding no level-2 heading, however much of it changed;
- a prose file deleted since the marker, because the paths diffed are HEAD's listing. Cutting a whole file reads as silence. That is the pointed blind spot in a mechanism about subtraction, and it was accepted rather than fixed: counting it means diffing the marker's tree too, and sections that no longer exist would join a count of current sections until the number stopped meaning one thing;
- lines cut from above HEAD's first line, which git prints as `+0,0`, by the same rule as front matter.

A pure deletion is the case that nearly defeated the hook. Git prints a zero-length post-image range as `+<line the gap follows>,0`, and attributing that to the named line alone made a cut first section invisible in every file with front matter, which Chapter 4 records as all 33 corpus files. The cut is attributed to both the named line and the one after it.

Cost, measured at `1e5db4e` and recorded in Chapter 4: 0.02 to 0.03 seconds with a marker whether it goes on to speak or not, 0.01 seconds outside a kit repo, and 0.11 seconds against a marker at the root commit, which changes every corpus file and is the worst case history can offer. The emitting and silent paths are indistinguishable because one `git diff` decides both. The hook was first built naming the top three sections by rank and cost 1.69 seconds at every emitting session start, because ranking across the kit needs the full per-section sweep; the ranking came out and runtime went to 0.02 seconds.

## The record and its machine contract

`docs/take-stock.md` holds dated entries, newest first, under a heading of the literal form `## YYYY-MM-DD - <40-hex sha>`. The first heading in file order that matches `/^(\d{4}-\d{2}-\d{2}) - ([0-9a-fA-F]{40})$/` is the marker. File order and not newest-by-date, which keeps the hook out of judging dates it did not write. Headings come from the shared fence-aware parse, so a fenced example of the format inside the file is not read as a marker; `test/take-stock-nudge.test.js` pins that with a fixture where the two readings disagree.

Three properties of that contract bite:

- **An abbreviated sha does not parse.** The file then holds no marker and the hook emits its no-marker block at every session start until the heading is fixed.
- **The sha is the commit holding the prose as the pass left it, never the commit the pass read.** The hook measures marker to HEAD, so naming the pre-pass sha makes it count the pass's own edits forever, in exactly the case the mechanism exists for. This forces an ordering: land the prose changes first, then record the entry in a later commit touching no corpus file. That second commit is safe by construction, since `docs/` is not in the corpus.
- **The marker is read from the working tree, not from HEAD.** An entry written and not yet committed is already the latest take-stock.

The file is read through the atomic door (`O_RDONLY | O_NONBLOCK`, then `fstatSync(fd).isFile()`), refused above 1 MiB, and BOM-tolerant. A directory under that name, a permission error, an oversized file and a file holding no entry all reach the same "no marker could be read" text, which is deliberately not the stronger "no take-stock has ever been recorded" sentence: only `ENOENT` establishes that one.

Content is what a spared entry owes, and the bar is inherited verbatim from `docs/backlog.md`: "it seems to be working" closes nothing. A spared entry names the rule and what was observed to happen because of it, and for a preventive rule, which succeeds by producing no event, that evidence is the incident that admitted it. A rule with neither is recorded as unverdicted, which is explicitly not a retirement candidate.

## The wording, and where it lives

`writing-skills`' compression section defines the bill and is the single home for it; this document does not restate it. In outline: a compression is classified by a finished claim inventory mapping every claim in both directions, never by an intention to shorten; it owes no arms because the RED could not be constructed rather than because it is waived; it pays a claim inventory plus a followability probe with one extra control, that the rep must not reach the pre-compression text through the installed plugin cache; and disposal splits three ways by direction, of which only a claim in the longer text with nothing opposite it stays on the compression path.

`kaizen` carries the trigger and the routing: step 1 reads `node tools/accretion.js` and `docs/take-stock.md` as a third gather input inside the kit repo only, step 2's take-stock bucket routes a section to compression, retirement, spared or unverdicted, and step 4 records every verdict. The skill states what does not change: capture stays friction-only, and a working session records friction without triaging it.

One sentence in `kaizen` step 4 used to describe the abbreviated-sha failure as the nudge reporting "that no take-stock was ever recorded", which the hook does not do; **corrected during the finishing pass** in both that skill and `docs/take-stock.md`, and a test pins the discrimination. The sharper half is that the failure is quiet rather than loud: the reader takes the first entry that parses, so a malformed newest entry falls through to an older one and the measurement silently uses a stale marker.

## How it fails

- **Nothing in the hook can be wrong loudly.** Every path ends with status 0 and no path throws: a bare `catch` wraps `main()` and there is no `process.exit` call at all. What varies is whether a failure is stated (an orphaned marker, an unreadable marker, a measurement that stopped part way) or silent (no git, not the kit repo, no corpus in HEAD).
- **A marker that names a commit this checkout does not hold disables the measurement permanently**, not transiently. A shallow clone or a history rewrite does that. The hook says so rather than falling silent.
- **A reformatted heading breaks the contract while the hook keeps talking.** It emits its no-marker text at every session start, which is easy to read as the loop nagging rather than as the record being unparseable.
- **The tool undercounts across a rename or a wholesale rewrite**, because `git log -L` loses the trail, and history predating a file's current path is not counted at all. A section's identity is its current line range and not its title, so a renamed, split or merged section carries the history of the lines it now occupies.
- **Both instruments measure HEAD.** Line counts and spans can differ from what an editor shows mid-edit, and a file in the working tree but not in HEAD is named in the tool's notes rather than measured, and is invisible to the hook.

## Operating it

Run the ranking during a kaizen pass, or any time the nudge speaks:

```
node tools/accretion.js
```

Take a stock: read the sections the ranking puts on top, or a section found changed while reading it, whole. Ask what it would lose by being shorter and route what you find per `kaizen` step 2. Land any prose change first. Then add an entry to `docs/take-stock.md`, newest first, with the heading naming the commit that carried the prose change, in a commit that touches no corpus file. The nudge goes quiet until the prose moves again.

Tests, and note that they sit in two places:

```
node --test test/take-stock-nudge.test.js     # 16 cases, inside the repo gate
node --test tools/accretion.test.js           # 15 cases, in the gate since 2026-08-16
```

The documented gate is `node --test test/*.test.js tools/*.test.js` from the repo root (`README.md:159`), widened 2026-08-16 to reach `tools/` for exactly this reason: `accretion-lib.js` ships in the payload and `tools/accretion.test.js` is its only coverage, so the narrower form left a payload file untested by the thing called the gate. That narrower `test/*.test.js` form still appears in `README.md:63`'s directory listing and is not the gate.

## Modifying it safely

- **The corpus is defined twice** and no test asserts the two definitions agree. Change `inCorpus()` in the hook and `listProseFiles()` in the tool together.
- **The count block and both no-marker blocks are pinned at three lines.** `assertNoRanking` asserts the exact line count on those three cases (the one-line orphaned-marker and failed-measurement blocks are asserted by content instead), so any added line fails the suite whatever it says. That is the guard against the ranking creeping back in and taking the per-section sweep with it, which is the session-start cost already paid once and removed.
- **`accretion-lib.js` is payload code with two callers.** A parser change moves every number in both instruments, and its test is the one outside the gate.
- **The record's machine contract is not pinned against the real file.** `test/session-start-adoption.test.js` runs the shipped `docs/kit-adoptions.md` through its hook so a reformat fails the suite; `test/take-stock-nudge.test.js` uses synthetic fixtures only. The newer and more brittle contract is the unprotected one.
- **Anything the hook computes per section is a session-start cost.** Detection at file granularity is the design; the precise instrument is the tool.

## What this loop has and has not proved

The mechanism ran end to end and its headline proof failed. The compression of `writing-skills` took the file from 535 lines to 514 against an acceptance criterion of under 467, a shortfall of 48 lines, and the section reported that rather than dropping a claim to reach the number. Two things came out of the failure. The bar was mis-specified: 58 of the 68 lines the effort added were the new compression section itself, which is out of scope for compression by construction, so the criterion asked the pass to take about seven times as much out of the two target sections as the effort had put into them. And the finding, which is the durable half: those two sections hold 143 claims across 24,598 characters, about 172 characters per claim, much of it condition and locator rather than prose. A hard pass bought 6.5% where 18.5% was needed, and the file's own disposal rule caps a compression by construction, since a claim with nothing opposite it is restored rather than cut. **This is claim accretion, not prose accretion, and the lever past it is retirement rather than compression.**

What did land: the kit's first net-negative markdown commit in 165 file-events (`1e5db4e`, 229 insertions against 250 deletions), a 143-row claim inventory at `docs/archive/kaizen-stop-start-continue_s3-inventory.md` with every piece of provenance intact, four retirement candidates recorded and deliberately not acted on, and a loop verified live: with the marker at S3's sha the nudge was silent, and committing S5's edit to `kaizen/SKILL.md` made it speak. The live marker is still `1e5db4e`, so a session opened in this repo today gets the count block rather than silence. That is the mechanism working: prose has moved and nobody has read it whole since. The marker was deliberately not advanced to quiet it.

Design decisions, the arms, the reviews and the numbers behind all of this are in `docs/archive/kaizen-stop-start-continue_spec_v1.md` and its five Chapters.
