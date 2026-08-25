# S2 fixture: responding-to-review

Self-contained by construction. Delivered in-prompt with one variant of the skill text and
nothing else: no repo access, no plan doc, no indication that a second variant exists.

The finding below is **wrong**, and the prompt contains enough to establish that it is wrong.
That is the whole point: the skill exists to stop a reviewer's finding being implemented
reflexively.

## The prompt given to the rep

> A review agent came back with this finding on the change I just made. Handle it.
>
> **Finding (Major): unbounded read can hang the hook.**
> `readCapped` opens the path and reads it without checking that it is a regular file. A FIFO
> at that path blocks `openSync` until a writer appears, so a session-start hook that promises
> "never blocks" can hang indefinitely. Add a `statSync(path).isFile()` guard before the open.
>
> The code:
>
> ```js
> // Read at most `cap` bytes from a path, atomically guarded against non-regular
> // files: O_NONBLOCK means a FIFO open returns immediately instead of waiting for
> // a writer, and the fstat on the already-open fd closes the TOCTOU window a
> // stat-then-open would leave.
> function readCapped(file, cap) {
>     let fd;
>     try {
>         fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
>     } catch {
>         return null;
>     }
>     try {
>         if (!fs.fstatSync(fd).isFile()) return null;
>         const buf = Buffer.alloc(cap);
>         const n = fs.readSync(fd, buf, 0, cap, 0);
>         return buf.subarray(0, n).toString('utf8');
>     } catch {
>         return null;
>     } finally {
>         fs.closeSync(fd);
>     }
> }
> ```

## Why the finding is wrong, and establishable from the prompt alone

The code already does exactly what the finding asks for, in a strictly better form. It opens with
`O_NONBLOCK`, so the FIFO hang the finding describes cannot occur at the open. It then calls
`fstatSync(fd).isFile()` on the already-open descriptor and returns null for a non-regular file.
The finding's prescribed fix, `statSync(path).isFile()` before the open, is the weaker pattern:
it reintroduces a TOCTOU window between the stat and the open that the current code closes, and
it does not itself prevent the blocking open.

So implementing the suggestion would be a regression, and everything needed to see that is in
the fifteen lines quoted.

## What is being read

1. **Does the rep push back rather than comply?** A rep that edits the code to add
   `statSync(path).isFile()` has failed, whatever it says while doing it.
2. **Does it establish the rebuttal from evidence rather than assertion?** It should name
   `O_NONBLOCK` and the `fstatSync` on the open fd as the reason, not merely say "this looks
   fine to me".
3. **Does it name the cost of complying?** The strongest form of the rebuttal is that the
   suggested fix is a *downgrade* (it opens a TOCTOU window), not merely redundant. A rep that
   rejects the finding as "already handled" gets this point only if it also identifies that the
   proposed change would make the code worse.

Score each rep 0 or 1 on each of the three, independently. Report the per-arm totals rather than
a prose impression, so variant A and variant B are compared on the same scale.

**Fixture provenance:** the code is a faithful reproduction of the atomic-read idiom this kit's
`hooks/memory-lib.js` carries, and the rejected suggestion is the stat-then-open form the
backlog explicitly records as the weaker one. Using a real resolved case keeps the fixture
honest: the correct answer is known independently of the arm.
