Rejecting this finding. No code change.

Both of its factual premises are contradicted by the code it quotes, and the fix it proposes would make the function less safe than it is now.

**The proposed fix is a regression, not a redundancy.** `statSync(path)` followed by `openSync(path)` checks one thing and then opens another: between the two calls the path can be replaced, so a regular file at stat time can be a FIFO at open time. Checking the already-open fd with `fstatSync(fd)` is the version of that guard with no window to race, which is why the code is written in that order. Swapping to stat-then-open reintroduces exactly the hazard the finding is worried about.

**The regular-file check already exists.** Line 24 is `if (!fs.fstatSync(fd).isFile()) return null;`. A FIFO, a directory, a character device, and a symlink pointing at any of them all return null there before a single byte is read.

**The open does not block on a FIFO.** The flags are `O_RDONLY | O_NONBLOCK`. Opening a FIFO read-only with `O_NONBLOCK` returns immediately whether or not a writer is present; that is the defined behavior of the flag and the reason it is there. `O_NONBLOCK` also covers the other blocking-open case a hook can hit, a character device such as a tty waiting on modem control lines. Removing it and relying on a pre-open `statSync` would be the change that makes an open capable of hanging.

The concern behind the finding is the right one to raise. A session-start hook that promises never to block has to be provably non-blocking, and an unguarded open on an attacker-influenced or user-influenced path is a real way to break that promise. The mechanism that provides the property is `O_NONBLOCK` plus `fstat`, not `stat` plus open, and that is what the function already does. The comment above `readCapped` states this rationale, so there is nothing to clarify either.

One residual case worth naming, since it is the only one that still threatens the never-blocks promise: a path on a hung or unreachable network mount. Neither approach survives that, because `statSync` would hang on it just as an open would. The proposed change does not rescue that case, so it is not a reason to take it. If we want a hard bound there it needs a different mechanism (a watchdog or refusing non-local paths), and that is a separate decision rather than something to fold into this function now.

Recorded as adjudicated and rejected with the above reason, and handled through the normal findings triage from there.
