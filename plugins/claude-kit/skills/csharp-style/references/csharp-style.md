# C# Style Reference

Detailed patterns behind the csharp-style skill. Derived from the user's code: `okmind` (personal repo) and their hand-written classes in EleosCore (`ConcurrentCache`, `GeotabHelper`, `ActionRequestBackgroundService`), plus conversation adjudications recorded in the kit's spec.

## 1. Scope and precedence

Precedence runs: explicit repo rules (CLAUDE.md, committed style docs) -> `.editorconfig` (governs formatting and analyzer-style preferences when present; let it and a formatter settle the mechanics) -> this document (the user's default house style, in their own repos and shared repos alike) -> a sibling file only as a last resort, for a convention none of the above cover, and for raw whitespace when there is no `.editorconfig`. A legacy neighbor is not authority: do not mirror its style over this document just because it is nearby (the old "match Scott-style siblings even where this disagrees" default is retired). A repo that genuinely wants a different style states so in CLAUDE.md or `.editorconfig`. Regardless of precedence, keep changes surgical - do not "fix" unrelated code toward this style while doing other work.

## 2. File layout

- File-scoped namespace (`namespace X.Y.Z;`) in all new files. Leave existing block-scoped files alone.
- Using directives at the top: `System.*` first, then everything else alphabetically. Projects with ImplicitUsings enabled simply omit the implicit set; do not add redundant usings.
- One public type per file, named for the type. Small, tightly-coupled companions (an options class, a public nested interface) may share the file when they only exist to serve the main type, as `ConcurrentCacheOptions` does.
- No file-header comments, no copyright banners.

## 3. Types

- `sealed` on concrete classes that are not currently extended. It is a small perf and intent win, not dogma; do not flag its absence in review as more than Minor.
- Primary constructors for DI-style classes in new code:

```csharp
public sealed class ActionRequestBackgroundService(
    IAppConfiguration appConfiguration,
    IActionRequestService actionRequestService,
    ILogger<ActionRequestBackgroundService> logger
) : BackgroundService
```

  Keep the signature on one line when it fits the line limit (~120 cols); when it would exceed, chop to one parameter per line with the closing paren on its own line (as in the example above, whose signature exceeds the limit). A two- or three-parameter signature that fits stays on one line. Use captured parameters directly; introduce a `private readonly` field only when transformation is needed at construction time (`private readonly TurnstileOptions _opts = options.Value.Turnstile;`).
- Classic constructors remain correct where construction does real work or the type predates the feature; do not churn existing classes.
- Private implementation details live as private nested classes at the bottom of the type that owns them (`CacheEntry` inside `ConcurrentCache`). A nested public interface is acceptable when it is part of the owner's contract (`ICacheEntry`).
- Options classes: `sealed`, init-only properties, defaults inline, one XML doc line per property when the class is reusable:

```csharp
public sealed class ConcurrentCacheOptions
{
    /// <summary>
    /// The default <see cref="TimeSpan"/> in which cache entries should expire.
    /// </summary>
    public TimeSpan? DefaultExpirationPeriod { get; init; }

    /// <summary>
    /// The frequency that the cache is scanned for expired entries.  Default is 1 minute.
    /// </summary>
    public TimeSpan ExpirationScanFrequency { get; init; } = TimeSpan.FromMinutes(1);

    /// <summary>
    /// The <see cref="ISystemClock"/> implementation that the cache should use to determine current system time.
    /// </summary>
    public ISystemClock? Clock { get; init; }
}
```

- Fields: `_camelCase`, `readonly` wherever possible, declared above the constructor.

## 4. Documentation and comments

**XML docs** appear on two kinds of surface, at full BCL quality, or not at all:

- Interfaces, and classes/methods with a real chance of reuse beyond their immediate feature.
- Anywhere they genuinely help another developer consume the code conveniently.

Full quality means: `<summary>`, `<param>`/`<paramref>`, `<returns>` including `<see langword="true"/>`-style precision, `<exception>` for every throw the caller can trigger, `<remarks>` for null-return semantics and behavioral subtleties, `<see cref>` links to related types. Model: `ConcurrentCache.TryGetValue`, `GetOrAddAsync`. The rule is about completeness *when* documenting: if a surface earns docs, it gets the full set, not a lone `<summary>`.

**Document at the type's own altitude.** A doc describes what *this* surface promises, not what something else does. An interface summary states the contract the interface guarantees; it does not narrate how an implementation fulfills it or detail granular runtime behavior unless that behavior is genuinely part of the contract. An implementation's summary is short and names *that* implementation: "Default `ILoadBoardRepository`, backed by the in-memory cache", "No-op `IGridStateService` for the wireframe phase". The common failures are multi-paragraph narratives and implementation detail leaking into an interface doc - keep each doc to its own level of abstraction.

**`<inheritdoc/>` is not required by default.** Modern Roslyn tooling (Rider, current Visual Studio) surfaces the interface's documentation on an implementing member without it, so for code consumed only in-IDE it adds nothing. Reach for it only when (a) the project generates or ships API docs - DocFX/Sandcastle and the raw XML-doc file do not auto-inherit, so the implementation's generated doc is blank without it - or (b) you want to inherit the base doc and add to it. Otherwise an undocumented implementation of a documented interface is correct: the doc lives on the interface.

Internal plumbing (background services, app-internal services, private methods) gets no XML docs. A class-level prose comment is the right tool when the class needs context that isn't API documentation:

```csharp
// Daily background purge of inquiries past the configured retention window. Only
// registered when a real database is present (see Program.cs); a purge hiccup is
// swallowed so it can never crash the host.
```

**Inline comments** are rare and always carry information the code cannot: intent, constraints, justified deviations.

```csharp
// It is intentional for the nullability of Key to differ from the interface...
// Manually create a CacheEntry to pass into the function since we don't currently know what
// its key will be.  The factory function will return both the key and value.
```

Never: narration ("loop through the items"), section labels, restating the signature. No em dashes in comments; no emoji.

## 5. Method shape

- **Returns stand alone.** Own line, blank line above when statements precede it:

```csharp
        if (_entries.ContainsKey(key))
        {
            StartScanForExpiredEntriesIfNeeded();

            return false;
        }
```

  Same-line `if (x) return;` is never written, even for guards.
- **Braces:** a body may go braceless only when it is truly one line. A single statement wrapped across multiple lines still gets braces. Loops in practice almost always have braces.

```csharp
        if (expiresIn.HasValue)
            entry.SetExpirationRelativeToNow(expiresIn.Value);
```

- **Expression bodies** for genuine one-liners: simple properties, delegating overloads, tiny helpers. Multi-line expression bodies hang the `=>` at the end of the signature:

```csharp
    public static bool DeviceIsTrailer(Device? device) =>
        device?.Groups?.Any(g => g.Id == KnownId.GroupTrailerId) == true;
```

  Property accessor form (`=>`, `{ get => }`, full `{ get { } }`) follows context; no normalization passes.
- **Early validation** at the top: guard clauses first, then the work. Public library entry points use `ArgumentNullException.ThrowIfNull` and real `ArgumentException`s; app-internal methods validate what matters and no more.
- Blank lines group statements into logical paragraphs; a method reads as a few small movements, not a wall.

## 6. Nullability

- Nullable reference types enabled; annotations are deliberate (`TValue?` where null is meaningful, not sprinkled).
- The null-forgiving `!` is allowed only with a comment stating the invariant that makes it safe, optionally backed by `Debug.Assert`. An unexplained `!` is a review finding.
- Prefer `is null` / `is not null` over `== null` / `!= default` comparisons; say what you mean.

## 7. Naming

- Descriptive method names that read as sentences are preferred over brevity: `StartScanForExpiredEntriesIfNeeded`, `GenerateRandomPasswordAdheringToPolicy`, `ViolatesKnownImplicitPasswordPolicies`.
- `Try*` prefix with `out` parameter for non-throwing lookups; the throwing counterpart keeps the plain name.
- `Async` suffix on all Task-returning methods. `CancellationToken` is the last parameter and is propagated down the entire chain.

## 8. Logging

- Inject `ILogger<T>`; never a static logger in this style's repos.
- Structured message templates (`"Turnstile verification failed: {ErrorCodes}"`), no string interpolation in the message, no trailing period.
- Log levels: LogError with the exception object for failures handled at a boundary; LogWarning for suspicious-but-handled; avoid chatty LogInformation in hot paths.

## 9. Error handling

- **Library code throws.** Validate at entry, throw real exception types, let them propagate. No catch-and-return-default in reusable classes.
- **Background loops absorb.** The top of a long-running loop catches, logs with the exception, and continues; one failed iteration never kills the host:

```csharp
            catch (Exception e)
            {
                logger.LogError(e, "Error encountered processing pending action requests");
            }
```

- `catch (OperationCanceledException)` handled separately when cancellation is expected (break, not log-as-error).
- An empty catch is legal only with a justifying comment inside it: `catch { /* logged by EF; never crash the host on a purge hiccup */ }`.
- Fire-and-forget (`Task.Run`) carries either an internal try/catch or a comment accepting the unobserved-exception risk. This is a review-adopted rule (from the ConcurrentCache analysis), not observed practice; existing code predating it is not churned.

## 10. Library API conventions

For reusable classes (the `ConcurrentCache` tier):

- `Try*`/`out` + throwing counterpart pairs, matching BCL semantics (TryAdd returns false on duplicate; Add throws).
- Factory-function overloads (`GetOrAddAsync(key, valueFactory)`) document their null-handling in `<remarks>`.
- Time is injectable (`ISystemClock`-style option) so expiration and scheduling logic is testable; `DateTimeOffset` over `DateTime`.
- Snapshot semantics are consistent across the surface: if one read materializes (`ToList()`), they all do.
- Thread-safety claims in the class doc match the implementation.

## 11. Tests

**Test for value, not coverage.** Write the tests that exercise edge cases, business rules, and behavior worth locking against regression - not tests that exist to move a coverage number. Integration tests are welcome where the infrastructure to run them already exists and they cost about what a unit test costs to write; they must never expand the scope of the work (new harnesses, containers, fixtures) unless the user explicitly asks. When a change has no test worth writing, say so rather than padding.

xUnit. Test names: `Method_DoesSomething_WhenSomeCondition` (the condition clause optional when there is only the happy path). Arrange/Act/Assert comments by default:

```csharp
[Fact]
public async Task Submit_StillEmails_WhenDbFails()
{
    // Arrange
    var (svc, _, email, metric) = Build(dbThrows: true);

    // Act
    var result = await svc.SubmitAsync(ValidModel(), null, CancellationToken.None);

    // Assert
    result.Should().BeTrue();
    email.Sent.Should().Be(1);
}
```

- A private static `Build()` factory constructs the system under test and returns a tuple of it plus the collaborators the assertions need. Named helper methods (`ValidModel()`) for common fixtures.
- **Fakes first:** simple collaborators get hand-rolled fakes as `private sealed` nested classes implementing the interface, with counters/flags the test asserts on. Reach for **NSubstitute** when behavior verification or many-membered interfaces make hand-rolling noisy. Moq is not used in new tests.
- **Assertions:** FluentAssertions, pinned to the 7.x line (the last Apache-licensed majors). Never upgrade to 8+ (commercial license). AwesomeAssertions (the free 7.x-API fork) is the approved alternative when updates matter. Plain xUnit `Assert` is fine where it reads better.
- Tests are allowed to be more compact than production code, but the same hard rules hold: no same-line if/return, no em dashes, no narration comments.

## 12. Formatting details

- `var` everywhere except: an implicit conversion would hide the real type, or the right-hand side genuinely does not reveal the type and clarity suffers. Explicit type in a foreach over a non-obvious collection is fine (`CacheEntry entry = item.Value;`).
- Trailing commas in multi-line initializers and collection expressions (they keep diffs one-line).
- One statement per line in production code.
- Indentation and spacing follow the .NET defaults (4 spaces, never tabs); no custom alignment columns, no tab art.
- Lines wrap at roughly 120 columns. Keep a signature on one line within that limit; chop to one parameter per line beyond it (see section 3).
- **Named arguments only where required.** Pass arguments positionally by default. Name one only when the language forces it (you are skipping an optional parameter to set a later one) or when a bare literal would be unreadable at the call site (a lone `true`/`false`/`null` whose meaning the call does not reveal). Do not name every argument because a legacy sibling call does. Example: `await db.QueryAsync(sql, parameters, commandType: CommandType.StoredProcedure, cancellationToken: ct)` passes `sql`/`parameters` positionally and names only `commandType`/`cancellationToken`, because the optional `transaction`/`commandTimeout` parameters between them are skipped and the language requires naming to reach the later ones.

## 13. Configuration and settings

A value meant to be operator-configurable lives in configuration, not hard-coded. When you add a bound settings property (to an `IOptions`/settings model such as `HorizonSettings`), give it a real value in `appsettings.json` AND `appsettings.Development.json`. A default on the model alone is not configuration; it is a hidden constant nobody can change without a rebuild, and the appsettings omission is the recurring miss.

The corollary draws the line. If a value is NOT meant to be changed without a code change, do not smuggle it into the settings model as a default either. A genuine constant belongs in a purpose-built `static`/`Global` class or on the type that uses it. The test is intent: can an operator need to change this without a deploy? Yes leads to configuration (model + both appsettings files); no leads to a `const`/`static`, not a settings property.
