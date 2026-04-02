# Phase 1: Infrastructure — Centralized Paths, Shared Types, and Utility Modules

**Goal:** Create foundational modules that will be used by subsequent refactoring phases — centralized path constants, a shared duplicate helper, and proper type definitions.

**Dependencies:** None

## Tasks

- [x] Task: Create `IsoGame/wcBuilding2/editor/configPaths.ts` module with centralized path construction
  - Detail: Export a `ConfigPaths` object or class that provides methods like `getBuildingsDir()`, `getAssetCollectionsDir()`, `getBuildingPath(name)`, `getAssetCollectionPath(name)`. Replace the hardcoded `${getBuildingsDir()}/${name}.json` patterns currently scattered across `server.ts` (lines 53, 311, 329) and `loader.ts`.
  - Detail: Include base directory configuration as a single source of truth, supporting both relative and absolute paths.
  - Detail: Update `server.ts` and `loader.ts` to import from `configPaths.ts` instead of computing paths inline.

- [x] Task: Create `IsoGame/wcBuilding2/editor/services/duplicateConfig.ts` helper function
  - Detail: Extract the duplicated save-as/duplicate logic from `server.ts` endpoints (lines 297-372, 378-456, 1073-1133, 1139-1199) into a single async function `duplicateConfig(type: 'building' | 'asset-collection', originalName: string, newName: string)` that handles validation, file reading, ID update, and writing.
  - Detail: The function should return a typed result `{ success: boolean; path?: string; error?: string }`.
  - Update `server.ts` save-as and duplicate endpoints to call this shared function.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/services/previewBuilder.ts` module
  - Detail: Move `buildTempConfig` and `tileFromJSON` helper functions from `server.ts` (lines 1489-1559) into this new service module.
  - Detail: Define proper return type for `tileFromJSON` as `WcConfTile` or a dedicated `TileFromJsonResult` interface instead of `any` (addresses Issue #4 in `server.ts`).
  - Detail: Update `server.ts` preview endpoint to import from `previewBuilder.ts`.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/services/assetPreview.ts` module
  - Detail: Extract the asset preview image generation logic from `server.ts` (lines 1347-1452) into a dedicated service class or function `generateAssetPreview(key: string): Promise<Uint8Array>`.
  - Detail: Wrap the `npm:sharp` import in a try/catch and provide a graceful fallback (returns a placeholder PNG or throws a descriptive error) to address Issue #3 severity Medium.
  - Detail: Update `server.ts` `/editor/asset-preview/:key` endpoint to use the new service.