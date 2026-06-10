---
name: csharp-style
description: "Daren Porter's C# house style. Use whenever writing or modifying ANY C# code, including tests. Signature traits: modern idiomatic .NET (primary constructors, file-scoped namespaces), self-documenting code with why-only comments, BCL-quality XML docs on reusable surfaces only, returns on their own line, no regions. Trigger on any C# work even when style isn't named."
---

# C# Style

Daren's personal C# style. Internalize the philosophy, then consult [references/csharp-style.md](references/csharp-style.md) for the detailed pattern reference (file anatomy, documentation rules, library conventions, full test template) before writing code.

## Precedence

In shared repos the repo's own style wins: first its stated style (CLAUDE.md, style docs in the repo), then the style established by sibling files solving a similar shape. Match them even where they conflict with this skill (EleosCore and other team codebases read as Scott-style; that is correct there). This skill's rules govern Daren's own repos and greenfield code.

## Core philosophy

1. **Code is self-documenting; comments are earned.** Names and structure carry the what. A comment exists only when it adds something the code cannot say: the why, a non-obvious constraint, an intentional deviation. Comments are prose, not section labels.
2. **Modern idiomatic .NET.** Primary constructors, file-scoped namespaces, collection expressions, switch expressions, pattern matching. Adopt new language features as they arrive; this codebase is not nostalgic.
3. **Documentation scales with API-ness.** Interfaces and classes likely to be reused get BCL-quality XML docs (nullability semantics, exceptions, remarks). Internal plumbing gets none. There is no middle tier of half-hearted summaries.
4. **Returns stand alone.** A return sits on its own line, with a blank line above it when statements precede it. The eye finds every exit point while scanning.
5. **Library shape for library code.** Reusable classes follow BCL conventions: `Try*`/`out` pairs beside throwing counterparts, validate-and-throw at public entry points, sealed by default, options classes, injectable time.

## Exemplar (the shape of a service)

```csharp
namespace OkWidgets.Web.Refresh;

public sealed class WidgetRefreshService(
    IWidgetRepository repository,
    ILogger<WidgetRefreshService> logger
)
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
- ❌ Narration comments ("Now we check the inputs", "Loop over the entries") or section-label comments; comments say why, or they don't exist
- ❌ Em dashes anywhere, including comments; use regular dashes, commas, or parentheses
- ❌ `#region` blocks; the one sanctioned use is folding hundreds of lines of mechanical data (lookup tables and the like)
- ❌ XML doc comments on internal plumbing, or sloppy XML docs on public surfaces (a public API doc without nullability/exception information is half-done)
- ❌ Braceless bodies spanning multiple lines; braceless is allowed only when the body is truly one line
- ❌ Null-guarding injected dependencies; the DI container is trusted (guard public method arguments instead, `ArgumentNullException.ThrowIfNull`)
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

- [ ] File-scoped namespace; primary constructor for injected dependencies; `sealed` unless extension is expected
- [ ] Public/reusable surfaces: BCL-quality XML docs; internal plumbing: no XML docs
- [ ] Comments: why-only, no narration, no em dashes
- [ ] Every return on its own line, blank line above when preceded by statements
- [ ] Braceless only for truly one-line bodies
- [ ] `var` unless implicit conversion or clarity demands otherwise
- [ ] `ILogger<T>` injected; structured messages; no trailing periods
- [ ] Library entry points validate and throw; exceptions propagate (catch-log-continue only at background-loop tops; empty catch carries a justifying comment)
- [ ] `Async` suffix on Task methods; `CancellationToken` last and propagated down the chain
- [ ] Tests: xUnit, `Method_DoesSomething_WhenSomeCondition`, Arrange/Act/Assert comments, `Build()` tuple factory, hand-rolled sealed fakes or NSubstitute, FluentAssertions 7.x
