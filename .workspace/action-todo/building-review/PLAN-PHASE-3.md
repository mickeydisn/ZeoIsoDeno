# Phase 3: Backend Module Splitting — Split extractor.ts, validation.ts, migration.ts

**Goal:** Split the remaining large backend modules into focused sub-modules, each under 350 lines, improving maintainability and testability.

**Dependencies:** Phase 1 (configPaths, types)

## Tasks

- [x] Task: Create `IsoGame/wcBuilding2/editor/registries.ts` module
  - Detail: Move `ASSET_COLLECTION_REGISTRY` definitions from `extractor.ts` (lines 99-238) and any related registry stubs from `types.ts` (lines 310-313) into this single source-of-truth module.
  - Detail: Export all registry types and data structures with proper TypeScript interfaces.
  - Detail: Update `extractor.ts` and `types.ts` to import from `registries.ts`.

- [x] Task: Create `IsoGame/wcBuilding2/editor/extractionEngine.ts` module
  - Detail: Extract the core extraction logic from `extractor.ts` into a dedicated file containing the `ConfigExtractor` class and related extraction functions.
  - Detail: Keep only type definitions and small inline helpers in the original `extractor.ts` or move them to `types.ts`.
  - Detail: Target file size: under 300 lines for the extraction engine. (~ 340 lines with code + comments)
  - Detail: Update imports in `server.ts` and other consumers. ✅ (`extractor.ts` now re-exports from `extractionEngine.ts` for backward compat)

- [x] Task: Create `IsoGame/wcBuilding2/editor/sanitizer.ts` module
  - Detail: Extract the `sanitizeBuildingConfig` function and related sanitization utilities from `validation.ts` into this new file.
  - Detail: This separates fix/repair logic from validation/checking logic.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/validationUtils.ts` module
  - Detail: Extract the `formatValidationSummary`, `formatTileRefValidationSummary`, severity type definitions, and any shared formatting utilities from `validation.ts`.
  - Detail: Include the `ValidationResult` type definition with `string[]` instead of `Set<string>` for serializable HTTP responses (addresses validation Issue #2).

- [ ] Task: Refactor `IsoGame/wcBuilding2/editor/validation.ts` to focus on validation rules
  - Detail: Keep only the core `validateBuildingConfig`, `validateTileReferences`, and rule-checking functions.
  - Detail: Import from `validationUtils.ts` and `sanitizer.ts`.
  - Detail: Target file size: under 250 lines.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/migrationHelpers.ts` module
  - Detail: Extract migration helper functions (version checking, context building, result construction) from `migration.ts`.
  - Detail: Keep the migration engine core (function registry and sequential application) in `migration.ts`.
  - Detail: Target file size: migration.ts under 200 lines, migrationHelpers.ts under 200 lines.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/dynamicImport.ts` module
  - Detail: Extract the `tryImportClass` function and module map from `loader.ts` (addresses loader Issue #1).
  - Detail: Consider generating the module map from the registry to avoid maintenance drift.
  - Detail: Target file size: under 150 lines.
  - Detail: Update `loader.ts` imports accordingly.