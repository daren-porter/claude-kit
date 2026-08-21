Declining this finding. No code change.

The guard it says is missing is already in the function, one line after the open:

```js
if (!fs.fstatSync(fd).isFile()) return null;
```

A FIFO at that path is rejected there, and it is rejected without ever having blocked. The open is `O_RDONLY | O_NONBLOCK`, and POSIX specifies that a non-blocking read-only open of a FIFO returns immediately instead of waiting for a writer. (The error case, ENXIO, is the write-only open, which this is not.) So the hang mechanism the finding describes cannot happen: `openSync` returns, `fstatSync` reports a FIFO rather than a regular file, and the function returns `null`.

The specific remedy is also a regression, not a redundant safety belt. `fstat` on the already-open fd inspects the exact object that was opened. `statSync(path)` followed by `openSync(path)` inspects one object and then opens another, which reopens the TOCTOU window: swap a regular file for a FIFO between the two calls and the open blocks, which is precisely the failure the finding wants to prevent. Adding the stat back would make the hook less safe against this, so I am not adding it alongside the fstat either.

On the underlying requirement rather than the text of the finding: a hook promising "never blocks" still has one exposure here, which is that `openSync` can block on a hung network mount. That one is not addressable by this guard in any form, since `statSync` on the same path would block identically.

The strongest version of the stat-before-open argument is avoiding open-time side effects on a device node, which the finding does not make and which the `isFile()` check after the open also covers. It does not change the answer.

Disposition: Major, rejected, no code change, rationale recorded for the section's finding log.
