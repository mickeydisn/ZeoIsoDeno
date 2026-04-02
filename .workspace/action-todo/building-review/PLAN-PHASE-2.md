# Phase 2: Server Refactoring — Split server.ts into Domain-Based Route Modules

**Goal:** Reduce `server.ts` from 1564 lines to under 350 lines by extracting route handlers into domain-focused router modules grouped by concern.

**Dependencies:** Phase 1 (configPaths, services modules)

## Tasks

- [x] Task: Create `IsoGame/wcBuilding2/editor/routes/assetCollection.ts` router module
  - Detail: Extract all `/editor/*asset-collection*` endpoints: POST extract, POST save, POST save-as, POST duplicate, GET load.
  - Detail: Import from `configPaths.ts`, `duplicateConfig.ts` (Phase 1), and the extractor/loader modules as needed.
  - Detail: Export the configured Oak `Router` instance.
  - Detail: File should be under 200 lines after extraction.

- [x] Task: Create `IsoGame/wcBuilding2/editor/routes/building.ts` router module
  - Detail: Extract all `/editor/*building*` endpoints: POST extract, POST save, POST save-as, POST duplicate, GET load.
  - Detail: Import from `configPaths.ts`, `duplicateConfig.ts` (Phase 1), and the extractor/loader modules as needed.
  - Detail: Export the configured Oak `Router` instance.
  - Detail: File should be under 200 lines after extraction.

- [x] Task: Create `IsoGame/wcBuilding2/editor/routes/preview.ts` router module
   - Detail: Extract `/editor/preview/generate` and `/editor/asset-preview/:key` endpoints.
   - Detail: Import from `services/previewBuilder.ts` and `services/assetPreview.ts` (Phase 1).
   - Detail: Export the configured Oak `Router` instance.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/routes/validation.ts` router module
  - Detail: Extract any validation-related endpoints from `server.ts` (search for validation route handlers).
  - Detail: Import from `validation.ts` module.
  - Detail: Export the configured Oak `Router` instance.

- [ ] Task: Create `IsoGame/wcBuilding2/editor/routes/listing.ts` router module
  - Detail: Extract `/editor/list/classes`, `/editor/list`, and `/editor/assets/list` endpoints.
  - Detail: Import from `extractor.ts` and relevant asset listing utilities.
  - Detail: Export the configured Oak `Router` instance.

- [ ] Task: Refactor `IsoGame/wcBuilding2/editor/server.ts` to be a thin router aggregator
  - Detail: Remove all extracted endpoint handlers. Keep only the main `editorRouter` setup that registers all sub-routers via `editorRouter.use(...)`.
  - Detail: Keep shared middleware, imports, and router aggregation logic only.
  - Detail: Target file size: under 100 lines.
  - Detail: Verify all routes still work by checking endpoint URL patterns are unchanged.