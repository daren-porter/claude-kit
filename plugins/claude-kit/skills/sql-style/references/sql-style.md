# T-SQL Style Reference

Detailed patterns behind the sql-style skill. Baseline: Scott Applefeld's house style (canonical examples throughout EleosCore's ASR.Eleos.Database* projects), with the user's adjudicated simplifications applied (recorded in the kit's spec). Where this document and a shared repo disagree, the repo wins; see Precedence in the skill.

## 1. File and project organization

- Database projects use numbered deployment folders so execution order follows dependencies: `0-Client`, `3-Tables`, `4-Functions`, `5-Procedures`, `9-System`, `Database`. Gaps are reserved.
- File naming: `<Schema>.<ObjectName>.sql`. Procedure and function files carry the `usp_`/`udf_` prefix in the name; table files do not.
- Indexes ship in the same file as their table, after the table's guard block.
- Every file ends with `GO`.

## 2. Deployment idioms (the functional core)

**Procedures: shell-then-ALTER.** Never `CREATE OR ALTER`; the shell preserves existing GRANTs across deployments.

```sql
-- CREATE A SHELL PROCEDURE IF NONE EXISTS.
IF OBJECT_ID('APP.usp_SaveOrderNote') IS NULL
    EXEC ('CREATE PROCEDURE APP.usp_SaveOrderNote AS RETURN 0;')
GO

-- ALTER THE UPDATED PROCEDURE DEFINITION.
ALTER PROCEDURE APP.usp_SaveOrderNote
...
```

**Functions: drop-and-recreate.** Functions carry the same header banner as procedures (inside the body for scalar/multi-statement functions, above the CREATE for inline TVFs). `WITH EXECUTE AS` applies to scalar and multi-statement functions only; SQL Server does not allow it on inline TVFs, which run under ownership chaining instead.

```sql
IF OBJECT_ID('APP.udf_FormatStopWindow') IS NOT NULL
    DROP FUNCTION APP.udf_FormatStopWindow
GO

CREATE FUNCTION APP.udf_FormatStopWindow
(
    @p_Earliest DATETIMEOFFSET,
    @p_Latest DATETIMEOFFSET
)
RETURNS VARCHAR(100)
WITH EXECUTE AS 'APP'
AS
BEGIN
    RETURN CONCAT(FORMAT(@p_Earliest, 'HH:mm'), ' - ', FORMAT(@p_Latest, 'HH:mm'))
END
GO
```

Inline TVFs use `RETURN ( ... query ... )` with no BEGIN/END and no EXECUTE AS clause; scalar functions put `RETURN` on its own line at the end of the body.

**Tables: existence-guarded, schema-aware.** Check `sys.schemas`/`sys.tables`, not just OBJECT_ID, so a same-named object in another schema cannot mask the check:

```sql
IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas S
    LEFT JOIN sys.tables T ON T.schema_id = S.schema_id
    WHERE S.name = 'APP' AND T.name = 'OrderNotes'
)
BEGIN
    CREATE TABLE APP.OrderNotes
    (
        ...
    )
END
GO
```

**Indexes: one IF NOT EXISTS block each**, checking `sys.indexes` by object and name:

```sql
-- Check for and create IX_OrderNotes_OrderNumber.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes I
    WHERE I.object_id = OBJECT_ID('APP.OrderNotes') AND I.name = 'IX_OrderNotes_OrderNumber'
)
    CREATE NONCLUSTERED INDEX IX_OrderNotes_OrderNumber
        ON APP.OrderNotes ( [OrderNumber] )
GO
```

A deployment script run twice succeeds twice. The qa-verifier agent checks this.

## 3. Procedure anatomy

In order:

1. **Signature.** Parameters in parentheses, `@p_PascalCase`, one per line with trailing commas, single-space separated name/type/default. Defaults make parameters optional: `= NULL` dominant, `= 0` for counts, `= 1` for on-by-default flags. Table-valued parameters are `READONLY`. OUTPUT parameters (rare) go last.
2. **`WITH EXECUTE AS '<principal>'`** where the codebase uses impersonation (shared Eleos-style databases always do; personal projects may not).
3. **Header banner** immediately inside BEGIN: SCRIPT / AUTHOR / DATE / VERSION / NOTES. Dates are ISO (2026-06-10). Version history is append-only: a new version adds a NOTES line above the previous; history is never rewritten. Banner width is by eye; nobody counts asterisks.
4. **Session settings:** `SET NOCOUNT ON;` always, paired with the isolation level matching the operation: `READ UNCOMMITTED` for Get*/read procedures, `READ COMMITTED` for Save*/Process*/write procedures. No XACT_ABORT; TRY/CATCH owns error handling.
5. **Declarations,** then temp tables, then base data, then validation, then main logic (subdivided by entity), then output datasets, then cleanup. Phase banners (a simple asterisk block with an UPPERCASE title) divide the phases in longer procedures; short procedures get `/* Sentence comments. */` only.
6. **TRY/CATCH.** The body's main logic sits in BEGIN TRY. CATCH audits and absorbs:

```sql
    BEGIN CATCH
        /* Audit and report the error. */
        IF (OBJECT_ID('APP.usp_AuditError') IS NOT NULL)
            EXECUTE APP.usp_AuditError @p_ErrorData = @p_OrderNumber;
    END CATCH
```

   The OBJECT_ID guard defends deployments where the audit proc is not present yet. No re-throw; callers are not failed by auditable errors. THROW appears only in rare nested CATCHes that genuinely must propagate, with a comment saying why. Be deliberate about what goes into `@p_ErrorData`; request bodies can carry PII (the security-reviewer flags this).

## 4. Formatting

- **Trailing commas everywhere** (parameter lists, column lists, VALUES, SET clauses). Never leading commas in the user's own SQL; shared Scott-style repos use leading commas, and siblings win there.
- **No alignment columns.** Name, type, default separated by single spaces. No tab art, no heading rows inside parameter lists.
- **UPPERCASE keywords.** `SELECT`, `FROM`, `LEFT JOIN`, `CASE WHEN`.
- **Bracketed columns:** `[ColumnName]`, even where optional.
- **Left-hand aliases** in SELECT lists: `[Alias] = expression`, never `expr AS Alias`. Table aliases are short identifiers without AS: `FROM APP.OrderStops S`.
- **Statement termination:** terminate statements with `;` normally. CTEs are written `;WITH` unless the preceding statement is verifiably terminated.
- **Verbose join keywords:** `LEFT JOIN` not `LEFT OUTER JOIN`, `INNER JOIN` not bare `JOIN`.
- **Comment punctuation:** sentence comments end with a period (`/* Return the matched stops. */`); label comments (banners, `/* Group Name */`) do not.

## 5. Naming

| Object | Convention |
|---|---|
| Schema | One controlled app schema (ELEOS in the Eleos integrations; per-project elsewhere) |
| Tables | PascalCase, no prefix |
| Procedures | `usp_PascalCase`; helper sub-procs suffix by role (`_Data`, `_Sort`); variants `_Default`, `_Debug`, `_Custom_<Vendor>` |
| Functions | `udf_PascalCase` |
| Parameters | `@p_PascalCase` (inputs only; never on locals) |
| Locals | `@PascalCase` |
| Temp tables | `#PascalCase`, purpose comment above creation |
| CTEs | `cte<PascalCase>` |
| Primary keys | `PK_<TableName>` |
| Indexes | `IX_<TableName>_<ColumnList>` |
| Table-valued types | `<Schema>.<PascalCase>` (e.g. `APP.FormFieldType`), used by READONLY TVP parameters |
| SQL Agent jobs | `JOB.<schema>.<Name>` |

## 6. Tables

- Columns organized into `/* Group Name */` groups with a blank line between groups.
- Audit fields last before the key: `CreatedDt`/`UpdatedDt` as `DATETIMEOFFSET` with `SYSDATETIMEOFFSET()` defaults.
- `PK_<TableName>` is the final entry, named, `PRIMARY KEY CLUSTERED ( [Col] )`.
- Inline DEFAULT constraints are unnamed; computed columns use `AS ( expression ) PERSISTED`.

## 7. T-SQL function preferences

- `CONCAT()` over `+` (null-safe).
- `COALESCE` over `ISNULL`, especially with multiple fallbacks.
- `TRY_PARSE`/`TRY_CONVERT` for safe casts that should yield NULL on failure.
- `FORMAT` only for user-facing strings; `CONVERT` for internal conversions (FORMAT is slow).
- `SYSDATETIMEOFFSET()` for audit timestamps; `GETDATE()` only for transient comparisons where zone is irrelevant.
- `IS NULL` for existence checks; recursive CTEs and `OUTER APPLY` freely where they fit.
- Upserts: `IF (@p_Id > 0)` update, ELSE insert + `SCOPE_IDENTITY()`.
- Temp tables: guard creation with `IF (OBJECT_ID('tempdb..#Name') IS NULL)`; tables shared with nested EXECs are declared in the outer proc (temp-table scoping).
- No `SELECT *` in result sets returned to callers; `SELECT * INTO #Temp` from a controlled-schema source is acceptable.

## 8. Security invariants

These are architecture rules, not formatting; the security-reviewer agent enforces them:

- No dynamic SQL by string concatenation, ever, inside impersonated (`WITH EXECUTE AS`) procedures. When dynamic SQL is genuinely unavoidable: `sp_executesql`, typed parameters, justifying comment.
- No parameters that accept identifier names (table/column/schema).
- New objects belong to the controlled schema, not dbo. Application-facing roles receive EXECUTE grants only; nothing is granted to PUBLIC.
- Impersonation principals stay disabled-login permission containers.

## 9. Procedure template

```sql
-- CREATE A SHELL PROCEDURE IF NONE EXISTS.
IF OBJECT_ID('APP.usp_DoSomething') IS NULL
    EXEC ('CREATE PROCEDURE APP.usp_DoSomething AS RETURN 0;')
GO

-- ALTER THE UPDATED PROCEDURE DEFINITION.
ALTER PROCEDURE APP.usp_DoSomething
(
    @p_OrderNumber INT = NULL,
    @p_IncludeHistory BIT = 0
)
WITH EXECUTE AS 'APP'
AS
BEGIN
    /**********************************************************************
        SCRIPT:  APP.usp_DoSomething.sql
        AUTHOR:  ASR Solutions
        DATE:    2026-06-10
        VERSION: 1.0
        NOTES:   v1.0 - 2026-06-10 - ASR SOLUTIONS
                 Initial version.
    **********************************************************************/

    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    /* Declarations. */
    DECLARE @Now DATETIMEOFFSET = SYSDATETIMEOFFSET();

    BEGIN TRY
        /* Main logic, divided by phase banners when it grows. */
        SELECT
            [OrderNumber] = O.[OrderNumber],
            [CreatedDt] = O.[CreatedDt]
        FROM APP.Orders O
        WHERE O.[OrderNumber] = @p_OrderNumber;
    END TRY
    BEGIN CATCH
        /* Audit and report the error. */
        IF (OBJECT_ID('APP.usp_AuditError') IS NOT NULL)
            EXECUTE APP.usp_AuditError @p_ErrorData = @p_OrderNumber;
    END CATCH
END
GO
```

## 10. Table template

```sql
/* TABLE: APP.OrderNotes */
IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas S
    LEFT JOIN sys.tables T ON T.schema_id = S.schema_id
    WHERE S.name = 'APP' AND T.name = 'OrderNotes'
)
BEGIN
    CREATE TABLE APP.OrderNotes
    (
        /* Keys */
        [OrderNoteId] INT IDENTITY(1,1) NOT NULL,
        [OrderNumber] INT NOT NULL,

        /* Note Data */
        [NoteText] NVARCHAR(2000) NOT NULL,
        [Author] VARCHAR(100) NOT NULL,

        /* Audit Fields */
        [CreatedDt] DATETIMEOFFSET NOT NULL DEFAULT ( SYSDATETIMEOFFSET() ),
        [UpdatedDt] DATETIMEOFFSET NOT NULL DEFAULT ( SYSDATETIMEOFFSET() ),

        -- PRIMARY KEY.
        CONSTRAINT PK_OrderNotes
            PRIMARY KEY CLUSTERED ( [OrderNoteId] )
    )
END
GO

-- Check for and create IX_OrderNotes_OrderNumber.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes I
    WHERE I.object_id = OBJECT_ID('APP.OrderNotes') AND I.name = 'IX_OrderNotes_OrderNumber'
)
    CREATE NONCLUSTERED INDEX IX_OrderNotes_OrderNumber
        ON APP.OrderNotes ( [OrderNumber] )
GO
```
