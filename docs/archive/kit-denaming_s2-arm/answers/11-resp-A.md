# Adjudication: rejected, no code change

The finding is wrong, and its proposed fix would make the code worse. I am not implementing it.

## Why the proposed fix is a regression

The hazard is a hang **inside `open()`**. A FIFO opened blocking-mode `O_RDONLY` parks the calling
thread in the kernel until a writer shows up. That means no check that runs *before* the open can
prevent it: `statSync(path)` and the subsequent `openSync(path)` are two separate path resolutions
with a window between them, and whatever the path pointed at during the stat is not guaranteed to
be what the open resolves. Swap a regular file for a FIFO in that window and the guard passes,
then the open hangs anyway.

The only thing that actually prevents a blocking open is a flag on the open call itself. That is
`O_NONBLOCK`, which POSIX defines as making a read-only FIFO open return immediately instead of
waiting for a writer. The code already passes it (line 19).

So the finding proposes replacing a mechanism that closes the hazard with one that structurally
cannot, and that reintroduces a TOCTOU race in the process. This holds regardless of which
revision the reviewer was reading.

## The premise is also false against this code

The claim is that `readCapped` "reads it without checking that it is a regular file." It checks:

```js
if (!fs.fstatSync(fd).isFile()) return null;
```

That is line 24, before any `readSync`. It is `fstat` on the already-open descriptor rather than
`stat` on the path, which is the stronger form: the descriptor is bound to one specific inode, so
the thing being stat'd is provably the thing that will be read. A FIFO reaches that line (the open
returned immediately thanks to `O_NONBLOCK`), fails `isFile()`, and returns `null` without a read.
The block comment above the function states this design explicitly. The finding did not engage
with either the flag or the `fstat`.

## No belt-and-braces compromise either

The tempting middle path is to add the `statSync` anyway, on the theory that a redundant check is
free. It is not free and it is not redundant in the right direction:

- an extra syscall on a session-start hot path,
- a new TOCTOU window between the stat and the open,
- and it protects against nothing `fstatSync` on the fd does not already cover, more soundly.

Adding a weaker duplicate of a check you already have correct is a net loss. Declined.

## Scope of this adjudication

I adjudicated against the code exactly as pasted in the finding. Two things I would confirm before
closing it out, neither of which changes the verdict above:

1. That the pasted function matches HEAD. If the reviewer was reasoning from an older diff hunk
   where the guard genuinely was absent, the finding was accurate when written and is now stale.
   Either way the fix it prescribes is the wrong one.
2. That `readCapped` is the only read path here, so no sibling helper does the naive
   open-and-read the finding describes. That would be a real instance of this defect class, just
   not in the function quoted.

Out of scope and not worth code now: `O_NONBLOCK` does not help if the path lives on a hung hard
mount, where `open()` blocks no matter what flags you pass. That is unfixable at this layer and is
not what the finding claimed.

## Reply to the reviewer

> Not implementing this. The hang you describe happens inside `open()`, so a `statSync` before the
> open cannot prevent it: the two calls resolve the path separately, and a FIFO substituted in
> between passes the guard and then blocks. What prevents it is the flag on the open call, and the
> function already passes `O_NONBLOCK` (line 19), which makes a read-only FIFO open return
> immediately. The regular-file check is also already present at line 24, as `fstatSync` on the
> open fd rather than `stat` on the path, so the object being checked is the object being read.
> Adopting the suggestion would replace a race-free check with a racy one.
>
> Worth confirming on your side: if you were reviewing a revision before the `O_NONBLOCK` and
> `fstat` guard landed, the finding was correct against that revision. Against the current
> function it is not.

## Triage record

**Major, unbounded read can hang the hook: rejected.** Guard already present and stronger than the
one proposed (`O_NONBLOCK` open plus `fstatSync` on the fd). The proposed `statSync`-before-open
cannot prevent an in-open hang and would reintroduce a TOCTOU window. No change.
