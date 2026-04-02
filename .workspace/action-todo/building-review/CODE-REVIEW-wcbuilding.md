# Code Review: IsoGame/wcBuilding2/editor

## Review: server.ts

### Issues (max 5 per file)
1. **[Severity: High]** File length exceeds 1565 lines (limit: 350)
   - **Why:** This file contains too many HTTP endpoint handlers and helper functions, making it hard to maintain and navigate.
   - **Fix:** Split into multiple router files grouped by concern (e.g., `routes/building.ts`, `routes/assetCollection.ts`, `routes/validation.ts`, `routes/preview.ts`).

2. **[Severity: High]** Code duplication between save/save-as/duplicate endpoints
   - **Why:** The save-as and duplicate endpoints for both building and asset collection are nearly identical (lines 297-372, 378-456, 1073-1133, 1139-1199), differing only in directory and type checks.
   - **Fix:** Extract a generic `duplicateConfig` helper function that accepts the target directory, type, and name parameters.

3. **[Severity: Medium]** Uses `npm:sharp` without graceful fallback
   - **Why:** The asset-preview endpoint (line 36) hard-depends on the `sharp` npm package, which may fail to install or run on some platforms without a Deno-native alternative.
   - **Fix:** Add a try/catch around the sharp import and provide a fallback (e.g., return a placeholder or use Deno's native image APIs if available), or document the dependency requirement clearly.

4. **[Severity: Medium]** Uses `any` type in `tileFromJSON` return and `genResult` cast
   - **Why:** Lines 569-572 and 1538-1558 use `any` type, reducing type safety and defeating TypeScript's benefits.
   - **Fix:** Define proper interfaces for the return type of `tileFromJSON` (reuse or extend `WcConfTile`) and for the cast on `genResult`.

5. **[Severity: Low]** Mixed concern: endpoint routing and business logic
   - **Why:** The `buildTempConfig` and `tileFromJSON` helper functions (lines 1489-1559) are business logic co-located with HTTP routing.
   - **Fix:** Move these functions to a separate service module (e.g., `services/previewBuilder.ts`) for cleaner separation.

### Strengths
- Comprehensive endpoint coverage with proper error handling and consistent response format
- Good use of TypeScript `unknown` with `instanceof Error` guards in catch blocks
- Clear documentation via JSDoc comments and section dividers
- Proper input validation on save endpoints (type check, version check, name format regex)

### Refactoring Suggestions
- Extract router groups by domain: building operations, asset collection operations, validation, and preview
- Consider using Oak middleware for request parsing and error handling to reduce boilerplate
- The asset preview logic (lines 1347-1452) could be extracted into a dedicated `AssetPreviewService` class

---

## Review: extractor.ts

### Issues (max 5 per file)
1. **[Severity: Medium]** File length exceeds 725 lines (limit: 350)
   - **Why:** The file combines registry definitions, extraction logic, and utility functions in a single module.
   - **Fix:** Split registry definitions into `registries.ts` and extraction logic into a separate file.

2. **[Severity: Medium]** Uses `(instance as any)` dynamic property access extensively
   - **Why:** Lines 331, 359, 458 use `any` casts to access dynamic properties, losing type safety.
   - **Fix:** Define proper interfaces for the asset collection instances (e.g., `AssetCollectionInstance`) with typed index access.

3. **[Severity: Low]** Registry data duplication between `extractor.ts` and `types.ts`
   - **Why:** `ASSET_COLLECTION_REGISTRY` is defined in `extractor.ts` (lines 99-238) but also referenced as an empty object in `types.ts` (line 310-313), creating confusion about the source of truth.
   - **Fix:** Move the registry to a single location (likely `types.ts` or a dedicated `registries.ts`) and import it where needed.

### Strengths
- Clear separation of getter-based vs groupAsset-based extraction patterns
- Good deduplication logic for face links
- Proper traceability metadata in extracted configs

### Refactoring Suggestions
- Extract registry data into JSON or a dedicated config module to reduce TypeScript bloat
- Consider a builder pattern for constructing `AssetCollectionClassEntry` configs

---

## Review: types.ts

### Issues (max 5 per file)
1. **[Severity: Low]** File length 335 lines — close to the 350 line limit
   - **Why:** While under the threshold, the file contains type definitions, constants, type guards, and registry stubs.
   - **Fix:** Consider extracting registry stubs (`REGISTRY_ID_MAP`, `ASSET_COLLECTION_REGISTRY`, `BUILDING_CLASSES`) into a separate `registries.ts` module.

### Strengths
- Excellent documentation with clear JSDoc comments explaining design principles
- Good use of discriminated unions (`AnyConfig`) and type guards
- Well-structured version constants with `as const` for type safety

### Refactoring Suggestions
- Consider extracting the `ParamSchemaEntry` and related UI types into a separate `editor-ui-types.ts` if the frontend grows

---

## Review: validation.ts

### Issues (max 5 per file)
1. **[Severity: Medium]** File length exceeds 618 lines (limit: 350)
   - **Why:** Combines building config validation, tile reference validation, sanitization, and formatting utilities.
   - **Fix:** Split into `buildingValidation.ts`, `tileRefValidation.ts`, `sanitizer.ts`, and `validationUtils.ts`.

2. **[Severity: Medium]** Validation results contain `Set<string>` in stats — not serializable
   - **Why:** The `ValidationResult.stats` type includes `Set<string>` fields (lines 40-41), which become `{}` when stringified for HTTP responses.
   - **Fix:** Convert sets to arrays before returning from HTTP endpoints, or change the result type to use `string[]`.

### Strengths
- Well-structured with clear separation of validation concerns (structure, face keys, weights, start tiles)
- Good use of severity levels (ERROR, WARNING, INFO) for actionable feedback
- Sanitize function is practical and fixes common issues automatically

### Refactoring Suggestions
- Consider making validation rules configurable/extensible via a plugin system
- Asset key validation (lines 508-518) only checks for path separators — consider validating against known asset patterns

---

## Review: migration.ts

### Issues (max 5 per file)
1. **[Severity: Medium]** File length exceeds 445 lines (limit: 350)
   - **Why:** Contains migration engine, result types, function registry, and validation helpers all in one file.
   - **Fix:** Extract migration engine to `migrationEngine.ts` and helpers to `migrationHelpers.ts`.

2. **[Severity: Low]** Only version "1.0" is supported — migration system is preemptive
   - **Why:** The migration framework is fully built out but there's only one supported version, making most of the engine dead code until version 1.1 is introduced.
   - **Fix:** This is acceptable as forward-thinking architecture, but consider adding a comment noting that migrations are placeholder until schema evolves.

### Strengths
- Well-designed migration framework with proper registration and sequential application
- Good separation of building and asset collection migration registries
- Clear migration context pattern with warning accumulation

### Refactoring Suggestions
- No immediate architectural concerns — the framework is extensible and well-structured

---

## Review: loader.ts

### Issues (max 5 per file)
1. **[Severity: Medium]** File length exceeds 380 lines (limit: 350)
   - **Why:** Combines loading logic, class import fallbacks, and JSON-to-runtime conversion in one file.
   - **Fix:** Extract the `tryImportClass` and module map to a separate `dynamicImport.ts` module.

2. **[Severity: Medium]** Hardcoded path strings used in multiple places
   - **Why:** Paths like `IsoGame/wcBuilding2/editor/conf/buildings/` are hardcoded (lines 53, 311, 329) instead of using a centralized config.
   - **Fix:** Create a `ConfigPaths` module that centralizes all file path construction.

### Strengths
- Excellent fallback chain pattern (JSON → Registry → Class → Error)
- Proper config migration on load with clear error messaging
- Good separation of concerns between loading and conversion logic

### Refactoring Suggestions
- Consider making the module map in `tryImportClass` auto-generated from the registry to avoid maintenance drift

---

## Review: web/js/panels/tile.ts

### Issues (max 5 per file)
1. **[Severity: High]** File length exceeds 976 lines (limit: 350)
   - **Why:** This is the largest file and combines UI rendering, component management, event handling, and context building in a single class.
   - **Fix:** Split into smaller components: `TilePropertiesEditor`, `TileFaceEditor`, `TileFunctionsEditor`, and extract the context builders to a separate file.

2. **[Severity: Medium]** DOM manipulation via `innerHTML` for complex structures
   - **Why:** Lines 253-256, 331-333, 463-473, 668-680 use `innerHTML` to inject HTML templates, which can be error-prone and harder to maintain.
   - **Fix:** Consider using `document.createElement` programmatically or a lightweight template system for better type safety and XSS protection.

3. **[Severity: Medium]** Re-rendering via `section.innerHTML = ""` and re-creating elements
   - **Why:** Lines 529-531, 577-579, 654-656, 700-704 re-render entire sections by destroying and recreating DOM elements, which is inefficient and loses DOM state.
   - **Fix:** Implement incremental DOM updates (e.g., update only the changed row) or use a virtual DOM approach for better performance.

4. **[Severity: Low]** Uses `setTimeout(..., 0)` for element binding
   - **Why:** Line 683 uses `setTimeout` with 0ms to defer binding, which is a code smell indicating DOM timing issues.
   - **Fix:** Bind event listeners immediately after element creation rather than deferring.

### Strengths
- Well-organized with clear section rendering methods
- Good use of component composition (FaceEditor, AssetListEditor, Canvas2DPreview)
- Proper dirty state tracking and unsaved changes warning

### Refactoring Suggestions
- Consider using a lightweight UI framework or web components for better maintainability
- Extract section renderers into separate modules to reduce class size

---

## Summary

**Code Health:** Good
- The editor module demonstrates solid software engineering practices: clear separation of concerns across modules (server, extractor, loader, validation, migration, types), proper error handling, and comprehensive documentation. The frontend code is well-structured but suffers from large file sizes.

**Top Priorities:**
1. **Split large files** — `server.ts` (1565 lines), `tile.ts` (976 lines), `extractor.ts` (725 lines), and `validation.ts` (618 lines) all exceed the 350 line guideline significantly and would benefit from domain-based splitting.
2. **Extract duplicated logic** — The save-as and duplicate endpoints in `server.ts` share ~80% identical code between building and asset collection variants.
3. **Improve type safety** — Several `any` casts in `server.ts` and `extractor.ts` undermine TypeScript benefits; define proper interfaces for dynamic access patterns.

**Architecture:** The overall architecture is sound with a clean layered approach (editor backend ↔ HTTP API ↔ frontend panels). The migration framework and validation system show forward-thinking design. No circular dependencies detected between modules.