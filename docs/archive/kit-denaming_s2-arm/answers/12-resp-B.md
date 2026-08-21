**Rejected. No code change.**

Both premises of the finding are false against the code it quotes.

"reads it without checking that it is a regular file": the check is on the line before the read. `if (!fs.fstatSync(fd).isFile()) return null;` runs ahead of the `Buffer.alloc` and the `readSync`, so a FIFO, directory, socket, or device node returns `null` and nothing is read.

"a FIFO at that path blocks `openSync` until a writer appears": not with the flags this open uses. It passes `fs.constants.O_NONBLOCK`, and a read-only open of a FIFO with `O_NONBLOCK` returns immediately whether or not a writer exists. Blocking until a writer shows up is the behavior *without* that flag. The same flag covers the other blocking-open case, device nodes.

The prescribed fix is the alternative this function already rejected in writing. The comment above it says the fstat on the already-open fd "closes the TOCTOU window a stat-then-open would leave," and `statSync(path).isFile()` before the open is precisely stat-then-open: it checks the path, then opens the path a second time, and what the path resolves to can change between the two calls. Adding it on top of the existing fstat would not break anything. It buys a syscall to check something weaker than what is already checked, and leaves the next reader to work out which of two overlapping guards is the real one.

Logged as rejected with reason under executing-work's triage. If the reviewer comes back with something the code does not show, I will look again.
