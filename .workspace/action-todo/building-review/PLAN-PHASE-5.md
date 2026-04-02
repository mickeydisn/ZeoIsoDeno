# Phase 5: Type Safety & Cleanup — Fix `any` Casts, Serializable Types, and Polish

**Goal:** Address remaining type safety issues, ensure all HTTP responses use serializable types, and perform final cleanup across the refactored codebase.

**Dependencies:** Phases 1-4 (all refactoring complete)

## Tasks

- [ ] Task: Fix `any` casts in `IsoGame/wcBuilding2/editor/extractionEngine.ts`
  - Detail: Replace `(instance as any)` dynamic property access (lines 331, 359, 458 in original `extractor.ts`) with a proper `AssetCollectionInstance` interface using typed index access or a Record type.
  - Detail: Define `interface AssetCollectionInstance { [key: string]: unknown }` or a more specific type based on the actual dynamic properties accessed.

- [ ] Task: Fix `any` cast in `genResult` handling in `IsoGame/wcBuilding2/editor/routes/preview.ts`
  - Detail: Replace the `genResult as any` cast (line 1538-1558 in original `server.ts`) with a proper interface for the generation result.
  - Detail: Define `interface GenerationResult { tiles: WcConfTile[]; warnings: string[]; stats: object }` or extend existing types from `types.ts`.

- [ ] Task: Verify `ValidationResult` uses arrays instead of Sets for HTTP serialization
  - Detail: Ensure all places in `validation.ts` and `validationUtils.ts` that construct `ValidationResult` objects use `string[]` for the `errors` and `warnings` fields rather than `Set<string>`.
  - Detail: Check that any existing code reading `ValidationResult.stats` fields handles arrays properly.

- [ ] Task: Fix registry data duplication between `extractor.ts` and `types.ts`
  - Detail: Ensure `REGISTRY_ID_MAP`, `BUILDING_CLASSES` stubs in `types.ts` are either properly populated, removed as dead code, or documented as intentionally empty with a note pointing to `registries.ts` as the source of truth.

- [ ] Task: Add documentation comments to new module structure
  - Detail: Add JSDoc comments to each new module file explaining its purpose and exported API.
  - Detail: Update any README or integration documentation to reflect the new file structure.

- [ ] Task: Run type check and fix any TypeScript errors introduced during refactoring
  - Detail: Run `deno check IsoGame/wcBuilding2/editor/server.ts` and `deno check web/js/main.ts` to verify all imports resolve correctly.
  - Detail: Fix any type mismatches, missing exports, or broken import paths.

- [ ] Task: Verify all HTTP endpoints function correctly after refactoring
  - Detail: Test each endpoint: list, extract, save, save-as, duplicate, preview, load, validate, asset-preview.
  - Detail: Verify response format matches the original structure (backward compatible).
  - Detail: Check that error responses still use the consistent `{ success: false, error: string }` format.