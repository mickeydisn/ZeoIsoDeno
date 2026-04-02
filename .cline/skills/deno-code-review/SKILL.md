---
name: deno-code-review
description: Review Deno application code as a tech lead, providing structured feedback on code quality, architecture, security, and best practices. Use when user asks to review Deno code, audit a module, analyze code quality, or points to a Deno entry point (index.ts, main.ts, mod.ts, or any module).
---

# Deno Code Review

Act as a senior tech lead reviewing a Deno application. Provide concise, actionable feedback focused on code quality, architecture, security, and Deno-specific patterns.

## Workflow

1. **Identify entry point** - User provides a file path (index.ts, module, etc.)
2. **Trace dependencies** - Map out the module graph and related files
3. **Review each file** - Apply review rules (see below)
4. **Output structured review** - Follow the output format

## Review Rules Per File

For each reviewed file, evaluate:

### Code Quality

- [ ] File length under 450 lines (flag if exceeded)
- [ ] Single responsibility - file has one clear purpose
- [ ] No code duplication - DRY principle applied
- [ ] Proper naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE)
- [ ] Type safety - explicit types used where inference isn't clear
- [ ] Error handling - no swallowed errors, proper try/catch usage

### Deno Best Practices

- [ ] Uses Deno standard library with version pins (`@std@x.x.x`)
- [ ] No `npm:` specifiers unless justified (prefer native Deno)
- [ ] Proper permission usage (flags documented if needed)
- [ ] Uses `deno.json` for configuration (tasks, imports, compiler options)
- [ ] No `any` type without justification
- [ ] Proper async/await patterns (no unhandled promises)

### Architecture

- [ ] Clear separation of concerns (no mixing layers)
- [ ] Interface-first design for extensibility
- [ ] Singleton pattern used correctly if present
- [ ] No circular dependencies
- [ ] Proper module boundaries (imports are logical)

### Security

- [ ] No hardcoded secrets or credentials
- [ ] Input validation present for user/external data
- [ ] No `eval()` or `Function()` constructor usage
- [ ] Proper sanitization for file/system operations

## Output Format

```
## Review: [file_path]

### Issues (max 5 per file)
1. **[Severity: High/Medium/Low]** Brief description
   - **Why:** [1-sentence explanation]
   - **Fix:** [concise suggestion, no code blocks unless critical]

### Strengths
- [Notable good practices found]

### Refactoring Suggestions
- [High-level architectural improvements, if needed]

---
```

## Severity Guidelines

| Severity | Criteria                                             |
| -------- | ---------------------------------------------------- |
| High     | Security risk, breaking bug, major design flaw       |
| Medium   | Maintainability issue, anti-pattern, type safety gap |
| Low      | Style inconsistency, minor optimization, naming      |

## Rules

- **Maximum 350 lines per file reviewed** - flag files exceeding this
- **No code duplication** - point out repeated logic that should be extracted
- **Split features** - suggest extraction if file handles multiple concerns
- **Avoid copying code in review** - reference line numbers, don't paste snippets
- **Maximum 5 issues per file** - prioritize by severity
- **Be constructive** - focus on improvements, not criticism
- **Deno-specific** - highlight Deno patterns (permissions, std lib, native APIs)

## Review Process

1. Read the entry file and trace imports
2. For each significant file (>50 LOC or key logic), perform review
3. Group findings by file using the output format
4. End with a **Summary** section containing:
   - Overall code health assessment (1-2 sentences)
   - Top 3 priorities for improvement
   - Any architectural concerns

## Summary Format

```
## Summary

**Code Health:** [Good / Needs Work / Critical]
- [Overall assessment]

**Top Priorities:**
1. [Most important fix/improvement]
2. [Second priority]
3. [Third priority]

**Architecture:** [Brief note on structure, if concerns exist]
```
