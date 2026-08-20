---
name: sql-style
description: "The user's T-SQL house style. Use whenever writing or modifying ANY SQL: stored procedures, tables, functions, indexes, install/deployment scripts, or ad-hoc queries. Signature traits: shell-then-ALTER deployment, idempotent re-runnable scripts, TRY/CATCH with guarded usp_AuditError, UPPERCASE keywords, trailing commas (never leading). Trigger on any SQL work even when style isn't named."
---

# T-SQL Style

The user's T-SQL style: Scott Applefeld's house style as the functional baseline, with the ceremony layer simplified. This file alone covers routine procedure work; the exemplar below is the deployment idiom. Consult [references/sql-style.md](references/sql-style.md) when creating new objects from scratch (table, index, function, job, and TVP-type templates), naming new objects, or handling deployment cases beyond the proc skeleton shown here.

## Precedence

In shared repos the repo's own style wins: first its stated style (CLAUDE.md, style docs), then sibling files. EleosCore and similar team codebases use the full Scott style (leading commas, tab alignment, leading semicolons, banner ceremony); match siblings exactly there, including everything this skill simplifies away. This skill governs the user's SQL in their own projects.

## Core philosophy

1. **Idempotent and re-runnable by default.** Procedures deploy shell-then-ALTER (preserves GRANTs). Functions drop-and-recreate. Tables and indexes guard with IF NOT EXISTS. A deployment script never breaks on re-execution.
2. **Errors are audited, not thrown at callers.** TRY/CATCH wraps the main logic; CATCH calls the error-audit procedure behind an OBJECT_ID guard and does not re-throw.
3. **The procedure layer is the security boundary.** Where the codebase uses impersonation (WITH EXECUTE AS), dynamic SQL by concatenation is a privilege-escalation vector, never a style choice. sp_executesql with typed parameters and a justifying comment when truly unavoidable.
4. **Readable structure over measured ceremony.** Banners and section comments divide a procedure into named phases - declarations, temp tables, base data, validation, main logic, outputs, cleanup - but nobody counts asterisks or aligns columns with tabs. Sentence comments end with a period; label comments don't.
5. **Find a sibling and mimic it.** In any existing codebase, copy the layout of a neighboring object solving the same shape.

## Exemplar (deployment idiom and body skeleton)

```sql
-- CREATE A SHELL PROCEDURE IF NONE EXISTS.
IF OBJECT_ID('APP.usp_GetOrderStops') IS NULL
    EXEC ('CREATE PROCEDURE APP.usp_GetOrderStops AS RETURN 0;')
GO

-- ALTER THE UPDATED PROCEDURE DEFINITION.
ALTER PROCEDURE APP.usp_GetOrderStops
(
    @p_OrderNumber INT = NULL,
    @p_DriverCode VARCHAR(50) = NULL
)
WITH EXECUTE AS 'APP'
AS
BEGIN
    /**********************************************************************
        SCRIPT:  APP.usp_GetOrderStops.sql
        AUTHOR:  ASR Solutions
        DATE:    2026-06-10
        VERSION: 1.0
        NOTES:   v1.0 - 2026-06-10 - ASR SOLUTIONS
                 Initial version.
    **********************************************************************/

    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    BEGIN TRY
        /* Return the stops for the requested order. */
        SELECT
            [StopId] = S.[StopId],
            [City] = S.[City],
            [ScheduledAt] = S.[ScheduledAt]
        FROM APP.OrderStops S
        WHERE S.[OrderNumber] = @p_OrderNumber
        ORDER BY S.[Sequence];
    END TRY
    BEGIN CATCH
        /* Audit and report the error. */
        IF (OBJECT_ID('APP.usp_AuditError') IS NOT NULL)
            EXECUTE APP.usp_AuditError @p_ErrorData = @p_OrderNumber;
    END CATCH
END
GO
```

## Antipatterns (violations of this style)

- ❌ `CREATE OR ALTER PROCEDURE`; shell-then-ALTER, always (it preserves GRANTs)
- ❌ Leading commas; standard trailing commas, always
- ❌ Tab-aligned name/type/default columns; single spaces, no alignment maintenance
- ❌ Leading semicolons on statements; terminate statements normally. The one survivor: a CTE is written `;WITH` unless the preceding statement is verifiably terminated
- ❌ Lowercase keywords; UPPERCASE always
- ❌ Unbracketed columns; `[ColumnName]` always
- ❌ Right-hand aliases (`expr AS Alias`) in SELECT; left-hand form `[Alias] = expression`
- ❌ `RAISERROR`/`THROW` for routine errors; guarded `usp_AuditError` in CATCH
- ❌ Dynamic SQL built by string concatenation (privilege escalation under EXECUTE AS)
- ❌ Skipping `SET NOCOUNT ON` + the paired isolation level (`READ UNCOMMITTED` for reads, `READ COMMITTED` for writes)
- ❌ `SET XACT_ABORT ON`; TRY/CATCH owns error handling
- ❌ Bare `JOIN` or `LEFT OUTER JOIN`; write `INNER JOIN` and `LEFT JOIN`
- ❌ `MERGE` for upserts; the pattern is `IF (@p_Id > 0)` UPDATE, ELSE INSERT + `SCOPE_IDENTITY()`
- ❌ Dumping request bodies or PII into `@p_ErrorData`; choose audited error data deliberately
- ❌ `@True`/`@False` BIT variables; literal 1/0
- ❌ Ordinal English dates in headers ("February 16th, 2025"); ISO dates (2026-06-10)
- ❌ `GETDATE()` for audit timestamps; `SYSDATETIMEOFFSET()`
- ❌ `SELECT *` in result sets returned to callers
- ❌ Rewriting banner/version history; new versions ADD a NOTES line, never edit old ones

## Checklist before declaring SQL work complete

- [ ] Procs shell-then-ALTER; functions drop-and-recreate; tables/indexes IF NOT EXISTS guarded; script re-runs clean
- [ ] `WITH EXECUTE AS` where the codebase uses impersonation; no identifier-name parameters; no concatenated dynamic SQL
- [ ] Objects live in the controlled app schema, never dbo; new procs GRANT EXECUTE to the app role only (nothing broader, never PUBLIC)
- [ ] Header banner with SCRIPT / AUTHOR / DATE (ISO) / VERSION / NOTES; append-only history
- [ ] `SET NOCOUNT ON;` paired with the correct isolation level for the operation
- [ ] TRY/CATCH wraps main logic; CATCH audits via the error proc behind an OBJECT_ID guard, no re-throw
- [ ] Parameters `@p_PascalCase` with sensible defaults; locals plain `@PascalCase`; CTEs `ctePascalCase`; OUTPUT parameters (rare) last
- [ ] Temp tables `#PascalCase` with a purpose comment above, creation guarded with `IF (OBJECT_ID('tempdb..#Name') IS NULL)`
- [ ] Function preferences: `CONCAT` not `+`, `COALESCE` not `ISNULL`, `TRY_CONVERT` for casts that may fail, `CONVERT` not `FORMAT` for internal conversions
- [ ] Trailing commas; UPPERCASE keywords; bracketed columns; left-hand aliases
- [ ] Tables: `/* Group Name */` column groups, CreatedDt/UpdatedDt audit fields (SYSDATETIMEOFFSET defaults) last before the PK
- [ ] Indexes: `IX_<Table>_<Cols>`, own IF NOT EXISTS block, in the table's file
- [ ] File named `<Schema>.<ObjectName>.sql` in the deployment folder for its object type; ends with `GO`
