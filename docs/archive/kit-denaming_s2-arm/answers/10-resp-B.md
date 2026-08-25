Rejecting this finding. No code change.

The concern is legitimate as a class: a hook that promises never to block must not perform an unbounded blocking open. This code already answers it, and the specific fix proposed would make it weaker.

**The guard exists.** `fstatSync(fd).isFile()` is the first statement inside the second `try`. A non-regular file returns `null` before a single byte is read.

**The hang cannot happen at that open.** The open uses `O_RDONLY | O_NONBLOCK`. A read-only open of a FIFO with `O_NONBLOCK` returns immediately whether or not a writer exists, so the block the finding describes is prevented at the open rather than detected after it. That is precisely what the flag is doing there.

**`statSync(path)` before the open would be a regression.** It checks the path, not the object that ends up being opened. Swap the path for a FIFO between the stat and the open and the blocking open happens anyway. The current code fstats the fd it is already holding, so the thing checked and the thing read are the same object. Switching to stat-then-open reopens the TOCTOU window this code deliberately closes.

One residual risk the finding is right to send me looking for, which neither version handles: on a hard-mounted network filesystem that has gone unresponsive, the open can block regardless of `O_NONBLOCK`. `statSync` would block in the same place, so the proposed guard buys nothing there either. If "never blocks" has to hold across an unreachable mount, that needs a different mechanism (a watchdog, or an out-of-process read), not a stat.

Disposition: Major, rejected, no code change. The requested guard is already present in a stronger form, as an fstat on the open fd, and the proposed stat-then-open would reintroduce the race that form closes. Evaluated against the code as pasted in the finding.
