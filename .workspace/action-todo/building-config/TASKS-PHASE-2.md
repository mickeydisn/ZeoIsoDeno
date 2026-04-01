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
- [ ] Import `ConfigExtractor` from `./extractor.ts`
- [ ] Import `BUILDING_CLASSES` and `ASSET_COLLECTION_REGISTRY`
- [ ] Import Oak's `Router` from existing `webServer.ts` pattern
- [ ] Create dedicated `editorRouter = new Router()` instance
- [ ] Export `editorRouter` for mounting in `webServer.ts`

### Mounting in `webServer.ts`
- [ ] Import `editorRouter` in `webServer.ts`
- [ ] Register routes: `app.use(editorRouter.routes())` and `app.use(editorRouter.allowedMethods())`
- [ ] Verify no conflicts with existing `/card/`, `/img/`, `/web/` routes

### `GET /editor/list/classes` — List Extractable TS Classes
- [ ] Extract `className` from `Object.keys(BUILDING_CLASSES)`
- [ ] Extract `assetClassName` from `Object.keys(ASSET_COLLECTION_REGISTRY)`
- [ ] Return: `{ buildings: [...], assetCollections: [...] }`
- [ ] Content-Type: `application/json`, Status: 200

### `GET /editor/list` — List All Configs
- [ ] Scan `conf/buildings/` directory for existing JSON files
- [ ] Scan `conf/asset-collections/` directory for existing JSON files
- [ ] Combine with TS-extractable classes from `BUILDING_CLASSES`
- [ ] Return: `{ tsBuildings: [...], tsAssetCollections: [...], jsonBuildings: [...], jsonAssetCollections: [...] }`
- [ ] Return empty arrays if conf directories don't exist yet

### `POST /editor/extract/building/:className` — Extract Building Config
- [ ] Extract `className` from URL params
- [ ] Call `ConfigExtractor.extractBuilding(className)`
- [ ] Return raw JSON config on success (200)
- [ ] Return `{ error: message }` with status 400 if class unknown or extraction fails
- [ ] Catch and handle all exceptions with descriptive messages

### `POST /editor/extract/asset-collection/:className` — Extract Asset Collection
- [ ] Extract `className` from URL params
- [ ] Optionally accept `{ params: {} }` in request body for constructor override
- [ ] Call `ConfigExtractor.extractAssetCollection(className, params)`
- [ ] Return raw JSON config on success (200)
- [ ] Return `{ error: message }` with status 400 on failure

### `POST /editor/save/building/:name` — Save Building JSON
- [ ] Extract `name` from URL params
- [ ] Read JSON body from request
- [ ] Validate: body must have `type: "building"` and `version: "1.0"`
- [ ] Ensure `conf/buildings/` directory exists (create if needed via `Deno.mkdir`)
- [ ] Write to `IsoGame/wcBuilding2/editor/conf/buildings/{name}.json` with `JSON.stringify(config, null, 2)`
- [ ] Return `{ success: true, path: "..." }` on success (200)
- [ ] Return `{ error: message }` with status 400 on write failure

### `POST /editor/save/asset-collection/:name` — Save Asset Collection JSON
- [ ] Extract `name` from URL params
- [ ] Read JSON body from request
- [ ] Validate: body must have `type: "assetCollection"`
- [ ] Ensure `conf/asset-collections/` directory exists
- [ ] Write to `IsoGame/wcBuilding2/editor/conf/asset-collections/{name}.json`
- [ ] Return `{ success: true, path: "..." }` on success

### `POST /editor/preview/generate` — Run Building Generation Preview
- [ ] Read JSON `BuildingConfig` from request body
- [ ] Construct temporary `WcAbstractBuildConf` from JSON:
  - Set `growLoopCount`, `endLoopMax`
  - Set `faceLinkWeight`, `faceLinks` (expand unique pairs → bidirectional)
  - Set `startTileOptions`, `listTileOptions` from JSON tiles
  - Call `conf.init()` to rebuild face indices
- [ ] Create `WcBuildFactoryGenarator` with temp config
- [ ] Call `generator.start2(0, 0)` to run generation
- [ ] Return result: `{ success: true, tiles: [{x, y, tileType, face}], iterations: N, stats: {...} }`
- [ ] Return `{ error: message }` on generation failure
- [ ] Limit `growLoopCount` to safe range (5-100) and `endLoopMax` (50-1000)

### `GET /editor/assets/list` — List Available Game Assets
- [ ] Scan `img/asset_opti/` directory for `.png` files
- [ ] Parse filenames to extract asset keys (e.g., `wallDoor.png` → `wallDoor`)
- [ ] Return: `{ assets: [{ key: "wallDoor", category: "Wall", filename: "wallDoor.png" }, ...] }`
- [ ] Group by inferred category from filename prefix

### `GET /editor/asset-preview/:key` — Get Asset Image
- [ ] Extract `key` from URL params
- [ ] Look up file path for asset key in `img/asset_opti/`
- [ ] Stream file back as response with `image/png` content type
- [ ] Return 404 if asset not found

### Error Handling Middleware
- [ ] Add try/catch around all endpoint handlers
- [ ] Return consistent error format: `{ success: false, error: "Descriptive message" }`
- [ ] Log errors to server console with context (endpoint, params)

---

## Integration

- [ ] Verify all 9 endpoints respond correctly
- [ ] Test with `curl` commands before building UI
- [ ] Test extraction: `curl -X POST http://localhost:8081/editor/extract/building/WcBuildConf_HouseA`
- [ ] Test saving: `curl -X POST -H "Content-Type: application/json" -d @test.json http://localhost:8081/editor/save/building/HouseA`
- [ ] Test listing: `curl http://localhost:8081/editor/list/classes`

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/server.ts` — All HTTP endpoints
2. Updated `webServer.ts` — Mounted editor routes
3. `IsoGame/wcBuilding2/editor/conf/` directory structure (auto-created)