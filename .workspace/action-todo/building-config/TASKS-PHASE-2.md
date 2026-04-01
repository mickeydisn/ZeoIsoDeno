# TASKS-PHASE-2: Deno Server Endpoints

**Goal:** Create isolated HTTP endpoints for the editor's API, handling config listing, extraction, saving, preview generation, and asset listing.

**Estimated Time:** 3-4 hours  
**Dependencies:** Phase 1 (extractor.ts), existing `webServer.ts`

---

## Context

The server endpoints provide the API layer between the web UI and the extraction/engine logic. All endpoints are mounted under `/editor/*` to avoid conflicts with game routes. The server uses Oak router from the existing `webServer.ts` stack.

---

## File: `server.ts` — Deno HTTP Endpoints

### Server Setup
- [x] Import `ConfigExtractor` from `./extractor.ts`
- [x] Import `BUILDING_CLASSES` and `ASSET_COLLECTION_REGISTRY`
- [x] Import Oak's `Router` from existing `webServer.ts` pattern
- [x] Create dedicated `editorRouter = new Router()` instance
- [x] Export `editorRouter` for mounting in `webServer.ts`

### Mounting in `webServer.ts`
- [x] Import `editorRouter` in `webServer.ts`
- [x] Register routes: `app.use(editorRouter.routes())` and `app.use(editorRouter.allowedMethods())`
- [x] Verify no conflicts with existing `/card/`, `/img/`, `/web/` routes

### `GET /editor/list/classes` — List Extractable TS Classes
- [x] Extract `className` from `Object.keys(BUILDING_CLASSES)`
- [x] Extract `assetClassName` from `Object.keys(ASSET_COLLECTION_REGISTRY)`
- [x] Return: `{ buildings: [...], assetCollections: [...] }`
- [x] Content-Type: `application/json`, Status: 200

### `GET /editor/list` — List All Configs
- [x] Scan `conf/buildings/` directory for existing JSON files
- [x] Scan `conf/asset-collections/` directory for existing JSON files
- [x] Combine with TS-extractable classes from `BUILDING_CLASSES`
- [x] Return: `{ tsBuildings: [...], tsAssetCollections: [...], jsonBuildings: [...], jsonAssetCollections: [...] }`
- [x] Return empty arrays if conf directories don't exist yet

### `POST /editor/extract/building/:className` — Extract Building Config
- [x] Extract `className` from URL params
- [x] Call `ConfigExtractor.extractBuilding(className)`
- [x] Return raw JSON config on success (200)
- [x] Return `{ error: message }` with status 400 if class unknown or extraction fails
- [x] Catch and handle all exceptions with descriptive messages

### `POST /editor/extract/asset-collection/:className` — Extract Asset Collection
- [x] Extract `className` from URL params
- [x] Optionally accept `{ params: {} }` in request body for constructor override
- [x] Call `ConfigExtractor.extractAssetCollection(className, params)`
- [x] Return raw JSON config on success (200)
- [x] Return `{ error: message }` with status 400 on failure

### `POST /editor/save/building/:name` — Save Building JSON
- [x] Extract `name` from URL params
- [x] Read JSON body from request
- [x] Validate: body must have `type: "building"` and `version: "1.0"`
- [x] Ensure `conf/buildings/` directory exists (create if needed via `Deno.mkdir`)
- [x] Write to `IsoGame/wcBuilding2/editor/conf/buildings/{name}.json` with `JSON.stringify(config, null, 2)`
- [x] Return `{ success: true, path: "..." }` on success (200)
- [x] Return `{ error: message }` with status 400 on write failure

### `POST /editor/save/asset-collection/:name` — Save Asset Collection JSON
- [x] Extract `name` from URL params
- [x] Read JSON body from request
- [x] Validate: body must have `type: "assetCollection"`
- [x] Ensure `conf/asset-collections/` directory exists
- [x] Write to `IsoGame/wcBuilding2/editor/conf/asset-collections/{name}.json`
- [x] Return `{ success: true, path: "..." }` on success

### `POST /editor/preview/generate` — Run Building Generation Preview
- [x] Read JSON `BuildingConfig` from request body
- [x] Construct temporary `WcAbstractBuildConf` from JSON:
  - Set `growLoopCount`, `endLoopMax`
  - Set `faceLinkWeight`, `faceLinks` (expand unique pairs → bidirectional)
  - Set `startTileOptions`, `listTileOptions` from JSON tiles
  - Call `conf.init()` to rebuild face indices
- [x] Create `WcBuildFactoryGenarator` with temp config
- [x] Call `generator.start2(0, 0)` to run generation
- [x] Return result: `{ success: true, tiles: [{x, y, tileType, face}], iterations: N, stats: {...} }`
- [x] Return `{ error: message }` on generation failure
- [x] Limit `growLoopCount` to safe range (5-100) and `endLoopMax` (50-1000)

### `GET /editor/assets/list` — List Available Game Assets
- [x] Scan `img/asset_opti/` directory for `.png` files
- [x] Parse filenames to extract asset keys (e.g., `wallDoor.png` → `wallDoor`)
- [x] Return: `{ assets: [{ key: "wallDoor", category: "Wall", filename: "wallDoor.png" }, ...] }`
- [x] Group by inferred category from filename prefix

### `GET /editor/asset-preview/:key` — Get Asset Image
- [x] Extract `key` from URL params
- [x] Look up file path for asset key in `img/asset_opti/`
- [x] Stream file back as response with `image/png` content type
- [x] Return 404 if asset not found

### Error Handling Middleware
- [x] Add try/catch around all endpoint handlers
- [x] Return consistent error format: `{ success: false, error: "Descriptive message" }`
- [x] Log errors to server console with context (endpoint, params)

---

## Integration

- [x] Verify all 9 endpoints respond correctly
- [x] Test with `curl` commands before building UI
- [x] Test extraction: `curl -X POST http://localhost:8081/editor/extract/building/WcBuildConf_HouseA`
- [x] Test saving: `curl -X POST -H "Content-Type: application/json" -d @test.json http://localhost:8081/editor/save/building/HouseA`
- [x] Test listing: `curl http://localhost:8081/editor/list/classes`

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/server.ts` — All HTTP endpoints
2. Updated `webServer.ts` — Mounted editor routes
3. `IsoGame/wcBuilding2/editor/conf/` directory structure (auto-created)