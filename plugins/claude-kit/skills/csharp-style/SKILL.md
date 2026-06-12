---
name: csharp-style
description: "Daren Porter's C# house style. Use whenever writing or modifying ANY C# code, including tests. Signature traits: modern idiomatic .NET (primary constructors, file-scoped namespaces), self-documenting code with why-only comments, BCL-quality XML docs on reusable surfaces only, returns on their own line, no regions. Trigger on any C# work even when style isn't named."
---

# C# Style

Daren's personal C# style. Internalize the philosophy; this file alone covers routine code. Consult [references/csharp-style.md](references/csharp-style.md) before working in its territories: XML documentation on public/reusable surfaces, test scaffolding (the full template lives there), library/BCL-shape conventions (Try* pairs, options classes, injectable clock), or creating a new file (layout, using-directive order, and one-type-per-file rules live there).

## Precedence

Project-declared rules win, then this skill, then (last resort) the neighbors:

1. **Explicit style rules in the repo** - CLAUDE.md and any committed style docs.
2. **`.editorconfig`** - when present it governs formatting and analyzer-style preferences. Do not hand-impose or "match the neighbor" against it; let the config and a formatter settle the mechanics (wrapping, spacing, `var`, expression bodies, naming). A rich `.editorconfig` (like EleosCore's `develop` config) makes most of the formatting rules below moot on that branch.
3. **This skill** - Daren's house style. It is the default for anything 1 and 2 do not cover, in his own repos AND in shared repos. Use it rather than mirroring whatever a legacy sibling file happens to do.
4. **A sibling file** - last resort only, for a genuine convention none of the above address, and for raw whitespace when there is no `.editorconfig` (match the file's prevailing indentation).

The old "match the team's established style even where it conflicts with this skill" default is retired: a legacy neighbor is not authority. A repo that wants a different style states so in CLAUDE.md or `.editorconfig`. (This is C#-specific; `sql-style` keeps sibling-matching, since there is no SQL `.editorconfig` and the established team SQL style is the real target.) Still: surgical changes only - do not reformat unrelated code toward this style while doing other work.

## Core philosophy

1. **Code is self-documenting; comments are earned.** Names and structure carry the what; prefer names that read as sentences over brevity. A comment exists only when it adds something the code cannot say: the why, a non-obvious constraint, an intentional deviation. Comments are prose, not section labels.
2. **Modern idiomatic .NET.** Primary constructors, file-scoped namespaces, collection expressions, switch expressions, pattern matching. Adopt new language features as they arrive; this codebase is not nostalgic.
3. **Documentation scales with API-ness.** Interfaces and classes likely to be reused get BCL-quality XML docs (nullability semantics, exceptions, remarks). Internal plumbing gets none. There is no middle tier of half-hearted summaries.
4. **Returns stand alone.** A return sits on its own line, with a blank line above it when statements precede it. The eye finds every exit point while scanning.
5. **Library shape for library code.** Reusable classes follow BCL conventions: `Try*`/`out` pairs beside throwing counterparts, validate-and-throw at public entry points, sealed by default, options classes, injectable time.

## Exemplar (the shape of a service)

```csharp
namespace OkWidgets.Web.Refresh;

public sealed class WidgetRefreshService(IWidgetRepository repository, ILogger<WidgetRefreshService> logger)
{
    public async Task<bool> TryRefreshAsync(string widgetId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(widgetId))
            return false;

        var widget = await repository.GetAsync(widgetId, ct);
        if (widget is null)
        {
            logger.LogWarning("Refresh requested for unknown widget {WidgetId}", widgetId);

            return false;
        }

        // Stamp before persisting so downstream consumers can rely on ordering
        widget.RefreshedAt = DateTimeOffset.UtcNow;
        await repository.UpdateAsync(widget, ct);

        return true;
    }
}
```

No regions, no section comments, one why-comment doing real work, every return visually distinct.

## Antipatterns (common AI habits that violate the style)

- ❌ Same-line if/return (`if (x) return true;`); the return goes on its own line, always
- ❌ Copying primary-constructor parameters into `private readonly` fields; use the captured parameters directly (a field only when construction transforms the value)
- ❌ `== null` / `!= null` comparisons; use `is null` / `is not null`
- ❌ Narration comments ("Now we check the inputs", "Loop over the entries") or section-label comments; comments say why, or they don't exist
- ❌ Em dashes or emoji anywhere, including comments; use regular dashes, commas, or parentheses
- ❌ `#region` blocks; the one sanctioned use is folding hundreds of lines of mechanical data (lookup tables and the like)
- ❌ XML doc comments on internal plumbing, or sloppy XML docs on public surfaces (a public API doc without nullability/exception information is half-done)
- ❌ Implementation detail or multi-paragraph narrative in an interface/abstraction doc; document at the type's own altitude (the interface states its contract; the implementation's summary just names what it is)
- ❌ Reflexive `<inheritdoc/>` (or re-documenting) on an implementation when the interface already carries the doc and nothing generates/ships API docs; modern IDEs inherit it on hover automatically
- ❌ Pre-wrapping a signature that fits on one line; keep it on one line within the line limit, chop to one-param-per-line only when it would exceed
- ❌ Braceless bodies spanning multiple lines; braceless is allowed only when the body is truly one line
- ❌ Null-guarding injected dependencies; the DI container is trusted (guard public method arguments instead, `ArgumentNullException.ThrowIfNull`)
- ❌ Defensive validation in app-internal methods beyond what matters; full validate-and-throw is for library entry points
- ❌ Logging expected cancellation as an error; catch `OperationCanceledException` separately and exit quietly
- ❌ Bare fire-and-forget `Task.Run`; carry an internal try/catch or a comment accepting the unobserved-exception risk
- ❌ A multi-line expression body with `=>` dropped to the next line; it hangs at the end of the signature
- ❌ Classic constructors in new code where a primary constructor does the job
- ❌ Static logger or `Log.Error` patterns; inject `ILogger<T>`
- ❌ Trailing periods on log messages
- ❌ The null-forgiving `!` without a comment justifying the invariant
- ❌ Explicit types where `var` reads fine (explicit is for implicit conversions and genuinely unclear cases)
- ❌ Removing trailing commas from multi-line initializers
- ❌ Leaving classes unsealed by default; seal unless extension is expected (or the type is currently extended)
- ❌ Mocking simple collaborators with a library when a five-line hand-rolled fake is clearer
- ❌ FluentAssertions 8+ (commercial license); stay on 7.x or use AwesomeAssertions

## Checklist before declaring C# work complete

- [ ] File-scoped namespace; primary constructor for injected dependencies; `sealed` unless extension is expected; fields `_camelCase` and `readonly` wherever possible
- [ ] Signatures on one line within the line limit (~120 cols); one parameter per line only when chopping a longer one
- [ ] Public/reusable surfaces: BCL-quality XML docs at the type's own altitude (no impl detail in interface docs); internal plumbing: no XML docs; `<inheritdoc/>` only when docs are generated/shipped
- [ ] When documenting, document fully (`<param>`/`<returns>`/`<exception>`), not a bare `<summary>`
- [ ] Comments: why-only, no narration, no em dashes
- [ ] Every return on its own line, blank line above when preceded by statements
- [ ] Braceless only for truly one-line bodies
- [ ] `var` unless implicit conversion or clarity demands otherwise
- [ ] `ILogger<T>` injected; structured messages; no trailing periods; `LogError` passes the exception object
- [ ] Library entry points validate and throw; exceptions propagate (catch-log-continue only at background-loop tops; empty catch carries a justifying comment)
- [ ] `Async` suffix on Task methods; `CancellationToken` last and propagated down the chain
- [ ] Tests: xUnit, `Method_DoesSomething_WhenSomeCondition`, Arrange/Act/Assert comments, `Build()` tuple factory, hand-rolled sealed fakes or NSubstitute, FluentAssertions 7.x
- [ ] Tests earn their place (edge cases, business rules, regressions); no coverage padding, no new test infrastructure unless asked; say so when no test is worth writing
