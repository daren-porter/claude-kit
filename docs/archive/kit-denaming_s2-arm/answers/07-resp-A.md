Rejecting this finding. No code change.

Two of its claims are false against the code it quotes:

1. The regular-file check it asks for is already there: `if (!fs.fstatSync(fd).isFile()) return null;`. The finding's premise, "reads it without checking that it is a regular file", is contradicted by the line above the read.

2. The hang it describes cannot happen. The open passes `O_NONBLOCK`, and POSIX specifies that opening a FIFO for reading with `O_NONBLOCK` returns immediately instead of waiting for a writer. That is the exact failure mode the finding names, and the flag is what closes it.

The proposed remedy would regress the property it claims to protect. `statSync(path)` followed by `openSync(path)` checks one file and opens another whenever the path is swapped between the two calls, which is the TOCTOU window the current fstat-on-the-open-fd ordering exists to eliminate. It also implies dropping `O_NONBLOCK`, in which case the open being guarded can block on a FIFO before the stat result is ever acted on. Weaker on both counts. The rationale is already stated in the comment above the function.

The reviewer's underlying concern, stated correctly, does have a residual: `O_NONBLOCK` buys nothing for a regular file on a stalled NFS or FUSE mount, so "never blocks" is not absolute. A `statSync` would block on that same mount, so the proposed guard does not close it either. If that exposure is worth closing, the fix is a time budget in the hook, not a stat, and that is a separate decision rather than a defect in this function.

One unrelated note, not worth acting on: on Windows `fs.constants.O_NONBLOCK` is undefined, so the flag silently degrades to plain `O_RDONLY`. It costs nothing there, because Windows has no filesystem FIFOs at ordinary paths.

Disposition: Major finding rejected, no change made, recorded as adjudicated.
