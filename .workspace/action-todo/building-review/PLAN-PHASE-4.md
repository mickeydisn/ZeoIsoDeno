# Phase 4: Frontend Refactoring — Split tile.ts Panel and api.ts Service

**Goal:** Reduce `tile.ts` from 975 lines and `api.ts` from 463 lines by extracting section renderers into separate components and organizing API calls into focused service modules.

**Dependencies:** None (can be done in parallel with Phase 1-3)

## Tasks

 - [x] Task: Create `IsoGame/wcBuilding2/editor/web/js/components/tilePropertiesEditor.ts`
   - Detail: Extract the tile basic properties rendering and editing logic from `tile.ts` (tile ID, weight, boolean flags, height, level).
   - Detail: Export a class `TilePropertiesEditor` with methods `render()` (uses tile from constructor) and `getValues()`.
   - Detail: Remove `innerHTML` usage in favor of `document.createElement` for all form element creation (addresses tile.ts Issue #2).
   - Detail: Integrated into `tile.ts` — replaced `renderPropertiesSection()` and `renderHeader()` tile ID input, added cleanup in `close()`.

 - [x] Task: Create `IsoGame/wcBuilding2/editor/web/js/components/tileFaceEditor.ts`
   - Detail: Extract face-specific editing logic from `tile.ts` (the FaceEditor component integration, face rendering, face link handling).
   - Detail: Export a class or function `TileFaceEditor` with methods for rendering face panels and updating face data.

 - [x] Task: Create `IsoGame/wcBuilding2/editor/web/js/components/tileFunctionsEditor.ts`
   - Detail: Extract function-related editing UI from `tile.ts` (the Canvas2DPreview integration, function panels, weight tables).
   - Detail: Export a class or function `TileFunctionsEditor`.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/web/js/components/contextBuilders.ts`
  - Detail: Extract the context builder functions (`buildAssetContext`, `buildAssetCollectionContext`, etc.) from `tile.ts` into this shared utility module.
  - Detail: These are pure data transformation functions that prepare config data for rendering.

- [ ] Task: Refactor `IsoGame/wcBuilding2/editor/web/js/panels/tile.ts` to be a coordinator class
  - Detail: Keep only the `TileEditorPanel` class that coordinates the sub-components (TilePropertiesEditor, TileFaceEditor, TileFunctionsEditor).
  - Detail: Replace full re-rendering (`section.innerHTML = ""` then recreate) with incremental update methods where possible (addresses tile.ts Issue #3).
  - Detail: Remove `setTimeout(..., 0)` binding pattern — bind listeners immediately after element creation (addresses tile.ts Issue #4).
  - Detail: Target file size: under 300 lines.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/web/js/services/buildingService.ts`
  - Detail: Extract building-related API calls from `api.ts`: load, save, save-as, duplicate, extract, validate endpoints.
  - Detail: Export a `BuildingService` object with typed methods like `saveBuilding(name: string, config: BuildingConfig): Promise<SaveResult>`.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/web/js/services/assetCollectionService.ts`
  - Detail: Extract asset collection-related API calls from `api.ts`.
  - Detail: Export an `AssetCollectionService` object with typed methods.

- [ ] Task: Refactor `IsoGame/wcBuilding2/editor/web/js/api.ts` to be a thin HTTP client wrapper
  - Detail: Keep only the base `fetch` wrapper, error handling, and request/response utilities.
  - Detail: Remove direct endpoint calls — delegate to service modules.
  - Detail: Target file size: under 150 lines.