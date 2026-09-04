# docs-write-guard Reads Command Text, Not Command Structure

Status: Abandoned
Commit Model: Commit-and-Push
Created: 2026-09-04
Closed: 2026-09-04

## Why this was abandoned, the same day it was filed

**Its own first design question was the answer.** That question was "whether any code change is
warranted at all", and it named the alternative: leave the matcher alone, document the false block
where an operator will hit it, and say to rephrase. That alternative shipped, and it closes this.

Adjudicated on the operator's delegation in the 2026-09-04 kaizen triage. Three grounds, in order
of weight:

1. **The matcher fix has been examined twice and failed twice, both times in the dangerous
   direction.** A tokenizer produced eight measured deny-to-allow regressions on real writes plus
   a critical unbounded-allocation hang; blanking quoted spans produced three more, because the
   redirect pattern deliberately matches a quoted target. A third mechanism was located this pass
   and is recorded below, but building it means putting a small shell parser inside a fail-open
   `PreToolUse` hook that fires on every tool call in every repository on this machine, with no
   registered timeout. Attempt 1 already reached the right conclusion about that.
2. **Matcher precision is not what makes this guard work, and the file says so.** Its header:
   "the teeth are the role rule, not path spelunking." It already tolerates far larger holes by
   design, since `python3`, `sed -i` and `Copy-Item` walk straight past it. Spending a shell
   parser to sharpen a heuristic whose own author declared it a heuristic is the wrong trade.
3. **The measured harm was the AMBIGUITY, not the block.** The friction as recorded is "a blocked
   call plus a full read of the hook to decide whether retrying is legitimate or evasion." The
   block costs one rephrase. The hook read costs far more, and it was caused by a denial message
   that told a falsely-caught agent it "may not write into docs/" when it had not tried to.

## What shipped instead, and it is small

`docs-write-guard.js` now names the false-positive class in the denial, but **only on a
command-matcher hit**, since Write/Edit are matched exactly by `file_path` and have no
false-positive class:

> If this command only MENTIONS a docs/ path rather than writing to one - a path inside a commit
> message, a quoted string, or a heredoc body - this is a known false positive: the shell matcher
> reads command text, not command structure. Rephrasing to avoid the literal string is legitimate
> and is not an attempt to evade this guard.

The false blocks still deny; the matcher is untouched. Two tests pin it, and the second is the
pin against the WRONG fix (appending the clause unconditionally, which would tell an agent that
really did target `docs/` that rephrasing might get it through). Watched failing against that fix
before being trusted. The header's known-misses paragraph now points here instead of at an inbox
brief that no longer exists.

## Revival condition, stated so this is not lost

**A third false-block instance, or one instance where rephrasing is not possible.** Everything a
revival needs is below: the located operator-position mechanism, both measured disproofs with
their commands, the fail-safe direction, the heredoc-before-quotes ordering trap, and the
mandatory `sh -c` / `eval` carve-out. The design question that would then be live is the one
ground 1 above answers only for today's evidence, not forever.

## Why this exists

`docs-write-guard.js` denies commands that only *mention* a write. Both shell branches match
text rather than syntax, so `git commit -m 'wrote > docs/a.md today'` exits 2 for any governed
subagent, and a blind reviewer's own harness file was blocked mid-review by a heredoc whose
**body** contained `echo x > docs/a.md`. That trips the file's own cardinal rule, "a guard bug
must never trap legitimate work", in the direction its SAFETY paragraph forbids.

**This is promoted out of brief form because the brief format has now failed to hold it twice.**
Three mechanisms have been proposed for the same defect. Two are measured and disproven. The
third is located but has no reviewed implementation, and building it means putting a small shell
parser inside a `PreToolUse` hook that fires on every tool call in every repository on this
machine, with no registered timeout. Attempt 1's own conclusion is the reason this is a spec:
**"A hand-rolled shell parser in a hook that gates every tool call is a design problem, not a
brief."**

## What is already measured, so no design pass re-derives it

- **Attempt 1, the tokenizer (2026-09-02): reverted.** Replaced both regexes, passed 562/562
  tests, flipped all three reproductions, and a blind review measured **eight deny-to-allow
  regressions on real writes**, each verified by running the command and checking the file
  landed. Plus a **critical unbounded-allocation hang** on any whitespace character outside
  space/tab/newline (CR from a CRLF command line, NBSP, U+2028, BOM and nine others).
- **Attempt 2, blanking quoted spans and heredoc bodies (2026-09-04): disproven before
  building.** Not strictly narrowing, contrary to its own stated justification. The redirect
  pattern carries an explicit `["']?` before the path, so it deliberately matches a *quoted
  target*; blanking removes real writes from its reach. Three measured deny-to-allow flips.
- **The mechanism that does work, located and unimplemented.** The two harms differ by **where
  the operator sits**, not by whether quoting is present. A false block has the `>` operator
  *inside* the inert span; a real write has the operator outside and only the path quoted. Both
  regexes begin their match at the operator, so `m.index` is the operator position and the test
  is one containment check per match. This keeps every currently-caught write.
- **The fail-safe direction, which matters more than the scan.** A confused scanner must yield
  **fewer** inert spans, never more, because fewer spans means current behavior means deny. Bail
  and suppress nothing on an unbalanced quote, an unterminated heredoc, or an outsized command.
  Attempt 1's hang came from a cursor loop that could fail to advance, so any scan is a bounded
  `for` over indices.
- **One ordering trap, found on the first ten-line implementation.** Blanking single-quoted spans
  before locating heredoc bodies destroys a quoted delimiter: `<<'EOF'` becomes `<<     ` and the
  body is never found, so the harness-file false block does not flip at all. Heredoc bodies must
  be located before single-quote spans are touched, or in one pass aware of both.
- **The mandatory carve-out, unchanged across all three.** Under `sh -c` / `bash -c` / `zsh -c` /
  `eval` a quoted span **is** a command, so its operators are syntax. Skip all suppression there
  and fail toward current behavior. Verified still deny at HEAD.

## What a design pass has to settle

- **Whether any code change is warranted at all.** This is the first question, not a formality.
  The file's header says outright that "the teeth are the role rule, not path spelunking", and it
  already tolerates larger holes by design: `python3`, `sed -i` and `Copy-Item` walk straight
  past this guard. Against a self-declared heuristic with acknowledged misses in both directions,
  the honest alternative is to leave the matcher alone, document the false block where an operator
  will hit it, and say to rephrase the command. The measured harm is one single-quoted commit
  message and one heredoc body.
- **Whether shell-structure awareness belongs in a fail-open hook.** Three distinct
  mechanism-level surprises in three days, all in a file whose own header commits to failing
  open. If the answer is no, this stub closes Abandoned and the previous bullet is the whole
  outcome.
- **If it does ship, the scanner's contract**, which is the part to specify rather than code:
  fail-to-no-suppression on every anomaly, bounded iteration, heredoc bodies before quote spans,
  and a stated list of what it does not attempt.
- **Whether double-quoted spans are in scope.** `git commit -m "wrote > docs/a.md"` is the same
  false block, but a double-quoted span can contain `$(...)` or backticks, which execute, and
  attempt 1 regressed on exactly that pair. Covering it safely needs a substitution test inside
  the span. Deliberately excluded so far because the measured harm was single-quoted.
- **How the acceptance criterion is enforced.** `95d1646` established for this file that each new
  pin is checked **against the wrong fix**, not only against the defect, after a blind review
  caught two regressions in one change. Both attempts since then passed the full existing suite
  and were still wrong, so the suite is not the bar and the design has to say what is.

## Deliberately out of scope, with the reason

Gaps **(b)** one-target-per-operator and **(c)** punctuated-path blindness are both false
ALLOWS, meaning under-enforcement the header already tolerates. Chasing them is what produced
attempt 1's eight regressions. Any design that widens enforcement re-opens the direction that
has failed twice.

## Related

- `plugins/claude-kit/hooks/docs-write-guard.js` - the guard, whose known-misses paragraph
  already names all three defects honestly as of `95d1646`.
- `test/docs-write-guard.test.js` - the existing suite, which both failed attempts passed.
- `docs/security-model.md` - the trusted-workspace premise this guard sits inside, and the reason
  its teeth are the role rule rather than the matcher.
- `~/.claude-kaizen/declined.md` - carries a separate, declined `docs-write-guard` item about the
  role rule blocking a dispatched kaizen pass. Different defect in the same file; do not conflate.

## Starting point

Answer the first design question before touching code. If a structure-aware matcher is judged
worth having, specify the scanner's contract and its fail-safe direction in this file, then build
against the operator-position mechanism above, and hold the change to a blind read rather than to
the test suite.

## Chapters

(none yet - Proposed)

---

# Evidence: the promoted brief, reproduced whole

# Kaizen brief: docs-write-guard reads command text, not command structure

Friction: three defects in one hook, all verified at `95d1646`, and the note that carried them says
they are one defect wearing three faces - a regex over command TEXT cannot see command STRUCTURE.

**(a) It DENIES a command that only mentions a write.** Both shell branches match text that names a
redirect rather than performs one, because neither reads quoting or heredoc bodies. Reproduced:
`git commit -m 'wrote > docs/a.md today'` exits 2 for any governed subagent, and a blind reviewer's
own harness file was blocked mid-review by a heredoc whose BODY contained the string
`echo x > docs/a.md`. That is the hook's cardinal rule ("a guard bug must never trap legitimate
work") broken in the direction its SAFETY paragraph forbids, and it costs a blocked call plus a
full read of the hook to decide whether retrying is legitimate or evasion.

**(b) One target per operator.** A second word sharing a `tee` or a `-Path` list is never judged:
`tee /tmp/x/docs/a.md docs/b.md` writes the project's own `docs/` and exits 0.

**(c) Punctuation in a project path blinds both patterns outright.** A path holding a space, a
quote, or one of `&;|` is excluded by the path class, so neither pattern matches at all.

Change: `plugins/claude-kit/hooks/docs-write-guard.js` and `test/docs-write-guard.test.js`. Cost a
small tokenizer against fixing the three separately, since one pass that understands quoting,
heredocs and word boundaries answers all three and three regex patches answer none of the others.

Acceptance: the three reproductions above flip (mention-only allowed, second target judged,
punctuated path judged) with every one of the file's existing tests still green; and each new pin
is checked against the WRONG fix, not only against the defect, which is the discipline `95d1646`
established for this file after blind review caught two regressions in one change.

Discipline: this is code with an existing test file, so the bill is tests rather than arms. It is a
guard that fires on every tool call in every repository on this machine, so a widening needs the
blind read that caught the last two. Both halves of (a) are a FALSE BLOCK, so the fix must not open
a hole in the other direction: a real redirect inside a quoted compound command still writes.

Note the file's known-misses paragraph already names all three as of `95d1646`, so the code is
honest about them; this brief is the fix, not the disclosure.

## ATTEMPT 1, 2026-09-02: built, reviewed, REVERTED. Its own recommendation is disproven.

**This brief said "cost a small tokenizer against fixing the three separately." That was
attempted and it is wrong.** A hand-rolled shell tokenizer replaced the two regexes, passed all
29 existing tests plus 3 new ones (562/562 green), flipped every one of the three reproductions,
and was reverted after a blind review measured **eight deny-to-allow regressions on real writes**,
each verified by running the command against a throwaway repo and checking the file landed:

| real write, denied at HEAD | tokenizer |
|---|---|
| `echo x \| sudo tee docs/x.md` (the canonical tee idiom) | allowed |
| `echo x \| command tee docs/a.md`, `env`/`nice`/`LC_ALL=C` prefixes | allowed |
| `sh -c 'echo x > docs/a.md'`, `bash -c "..."`, `eval '...'` | allowed |
| `echo $(echo x > docs/a.md)` and the backtick form | allowed |
| `cat <<< hi > /tmp/z\necho x > docs/a.md` | allowed |
| `cat <<\EOF > /tmp/z\nbody\nEOF\necho x > docs/a.md` | allowed |
| `Set-Content -ErrorAction Stop docs/x.md hi` (and every PowerShell common parameter) | allowed |

Plus a **CRITICAL unbounded-allocation hang** on any whitespace character outside space/tab/
newline - CR from a CRLF command line, NBSP, U+2028, BOM, and nine others - in a hook registered
with no timeout that fires on every subagent tool call in every repository on this machine. Found
by fuzzing before the review returned; the review found it independently and characterized it
better (the token array grows without bound; under a 48MB heap the process dies SIGABRT).

### The lesson, which is the useful part

**The two failure directions are not symmetric, and they belong to different matchers.** The
regexes are OVER-inclusive: they match text that merely mentions a write, which produces the
FALSE BLOCKS this brief exists to fix. A tokenizer is UNDER-inclusive: a shell has far more ways
to spell a write than to spell a mention - wrapper prefixes, `-c`, `eval`, substitution bodies,
three heredoc spellings - and missing any one is a false ALLOW on a real write. Trading three
false blocks for eight false allows is a bad trade in the direction that matters, even for a
guard whose header says its teeth are the role rule.

**A hand-rolled shell parser in a hook that gates every tool call is a design problem, not a
brief.** Three review rounds on this file today each found regressions in the change under
review, and the third found eight.

### The narrow alternative, NOT yet attempted, and the thing to try next

Keep the existing regexes as the finder, and add a pre-pass that BLANKS the contents of
single-quoted spans and heredoc bodies (replacing them with spaces, preserving offsets) before
matching. That is strictly narrowing: it can only remove matches, so it cannot lose any write the
regexes currently catch, and it fixes the cardinal-rule violation which is the only half of this
brief that has actually harmed anyone.

**One carve-out is mandatory or it reproduces regression 3:** a quoted span IS a command under
`sh -c` / `bash -c` / `zsh -c` / `eval`, so skip the blanking entirely when the command contains
one of those. Fail toward current behavior.

Scope this to the FALSE BLOCK half only. The multi-target gap (b) and the punctuated-path
blindness (c) are false ALLOWS, i.e. under-enforcement the header already tolerates, and chasing
them is what produced the eight regressions.

### Do not redo

The tokenizer, unless a design pass decides to take shell parsing seriously with a real grammar
and an adversarial corpus. The review's full finding list, including four MINOR items (`>|`
clobber, process substitution truncating a tee operand list, `<<-` stripping spaces where bash
strips tabs only, and comma-splitting tee operands), is in the 2026-09-02 session transcript and
was not carried here because each is contingent on an approach this brief now advises against.

## ATTEMPT 2, 2026-09-04: the narrow alternative above is ALSO disproven as written

**"Blank the contents of single-quoted spans and heredoc bodies" is not strictly narrowing, and
the claim that it "cannot lose any write the regexes currently catch" is false.** The redirect
pattern at `docs-write-guard.js:224` carries an explicit optional quote before the path,
`["']?((?:[^\s"'|;&><]*[\\/])?docs[\\/])`, so it deliberately matches a quoted TARGET. Blanking
quoted spans therefore removes real writes from its reach. **Both columns measured**, not derived:
the hook at `fed36ed` for the first, and a scratch copy carrying the blanking pre-pass plus the
mandatory carve-out for the second, same governed agent type and same payloads.

| real write | at HEAD | with span-blanking |
|---|---|---|
| `echo x > 'docs/a.md'` | deny | **allow** |
| `echo x \| tee 'docs/a.md'` | deny | **allow** |
| `Set-Content -Path 'docs/x.md' hi` | deny | **allow** |

Same failure direction as attempt 1's eight, smaller in count only. Every other probe held: bare
target, double-quoted target, `sudo tee`, `sh -c` and a real heredoc-to-docs all stayed deny.

**One implementation-order trap, found in that scratch copy and worth keeping.** Blanking
single-quoted spans BEFORE locating heredoc bodies destroys a quoted heredoc delimiter: `<<'EOF'`
becomes `<<     ` and the body is never found, so the harness-file false block does not flip at
all. Whatever mechanism ships, heredoc bodies have to be located before single-quote spans are
touched, or located in one pass that knows about both.

### The distinction the fix actually turns on, which neither attempt had

The two harms differ by **where the operator sits**, not by whether quoting is present:

- **False block:** `git commit -m 'wrote > docs/a.md today'`. The `>` **operator** is inside the
  quoted span. It is text.
- **Real write:** `echo x > 'docs/a.md'`. The operator is outside; only the **path** is quoted.
  It is syntax.

So the rule is **suppress a match whose OPERATOR falls inside an inert span**, never blank the
span's contents. Both regexes begin their match at the operator (`redirect` at `>`/`>>`/`tee`,
`cmdlet` at the separator before the cmdlet name), so `m.index` is the operator position and the
test is one containment check per match. This keeps every currently-caught write, including all
three above, because their operators are outside the span.

### Fail-safe direction, which is the part to get right rather than the scan

The scanner must yield **fewer** inert spans when confused, never more, because fewer spans means
current behavior means deny. Concretely: bail out and suppress nothing on an unbalanced quote, an
unterminated heredoc, or an outsized command. And attempt 1's CRITICAL hang came from a loop that
could fail to advance, so the scan must be a bounded `for` over indices rather than a `while` on a
cursor.

The `sh -c` / `bash -c` / `zsh -c` / `eval` carve-out from attempt 1's lesson still applies
unchanged and is still mandatory: there the quoted span IS a command, so its operators are syntax.
Verified still DENY at HEAD: `sh -c 'echo x > docs/a.md'`.

### Deliberately still out of scope, with the reason

**Double-quoted spans**, though `git commit -m "wrote > docs/a.md"` is the same false block.
A double-quoted span can contain `$(...)` or backticks, which execute, and attempt 1 regressed on
exactly that pair (`echo $(echo x > docs/a.md)` and the backtick form). Covering double quotes
safely needs a substitution test inside the span, which is more machinery than the measured harm
justifies. The observed harm was one single-quoted commit message and one heredoc body.

Gaps (b) multi-target and (c) punctuated path remain out of scope per attempt 1's lesson: both are
false ALLOWS, and chasing them is what produced the eight regressions.
