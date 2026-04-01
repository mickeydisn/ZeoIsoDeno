# TASKS-PHASE-7: Config Loader & Round-Trip Validation

**Goal:** Implement the JSON → WcAbstractBuildConf loader for optional runtime integration with the game, and validate the complete round-trip (extract → edit → save → load → generate).

**Estimated Time:** 3-4 hours  
**Dependencies:** All previous phases, especially Phase 1 (extractor.ts, types.ts)

---

## Context

This is the final phase. It closes the loop by enabling JSON configs to be used at runtime in the game, completing the round-trip: extract from TS → edit in UI → save as JSON → load back into game → generate. The loader is optional integration — the game continues to work with TS classes via fallback. Zero modifications to game code are required; integration happens through a wrapper.

---

## File: `loader.ts` — JSON Config Loader for Runtime

### ConfigLoader Class
- [x] Create `class ConfigLoader` with static methods
- [x] Implement `async loadBuilding(id: string, params = {}): Promise<WcAbstractBuildConf>`
  - Step 1: Try JSON first
    - Construct path: `IsoGame/wcBuilding2/editor/conf/buildings/{id}.json`
    - Read file with `Deno.readTextFile()`
    - Parse JSON into `BuildingConfig`
    - If success → call `buildFromJSON(json)` → return
  - Step 2: Fall back to TS class
    - Look up in `buildingConfigRegistry` by id
    - If found → call `entry.createConfig(params)` → return
  - Step 3: Try by class name
    - Check `indexBuildingConfigClass["WcBuildConf_" + id]`
    - If found → instantiate with params → return
  - Step 4: Throw error: `Building config not found: ${id}`
- [x] Implement `private static buildFromJSON(json: BuildingConfig): WcAbstractBuildConf`
  - Create new `WcAbstractBuildConf` with params from `json.params`
  - Set `conf.faceLinkWeight = { ...json.faceLinkWeight }`
  - **Expand unique faceLinks to bidirectional:**
    ```typescript
    conf.faceLinks = json.faceLinks.flatMap(
      ([a, b]) => [[a, b], [b, a]]
    ) as [string, string][];
    ```
  - Set `conf.startTileOptions = json.startTiles.map(tileFromJSON)`
  - Set `conf.listTileOptions = json.tiles.map(tileFromJSON)`
  - Call `conf.init()` — rebuilds face indices and tile lookups
  - Return configured instance
- [x] Implement `private static tileFromJSON(json: TileConfig): WcConfTile`
  - Copy `face` as `WcFace` (4-element array)
  - Copy `weight` (number)
  - Copy `assets` (WcConfTileAsset[])
  - Copy `functions` (WcConfTileFunction[])
  - Copy booleans: `allowMove`, `isFrise`, `empty`
  - Copy optional: `color`, `colorT`, `h`
  - Note: `lvl` is set at runtime, ignore if present in JSON

---

## Integration with `wcBuildAction.ts` (Optional Wrapper)

### Wrapper Approach — No Game Code Modifications
- [x] Create wrapper module: `editor/integration.ts`
- [x] Implement `wrapCreateBuilding(originalHandler)` function
  - Intercepts `createBuilding` action
  - Calls `ConfigLoader.loadBuilding(conf.buildingType, params)` instead of direct instantiation
  - Falls back to original handler if loader fails
- [x] Document integration steps:
  ```typescript
  // In wcBuildAction.ts handler for "createBuilding":
  import { ConfigLoader } from "../editor/loader.ts";
  
  const buildingConf = await ConfigLoader.loadBuilding(conf.buildingType, {
    growLoopCount: conf.growLoopCount || 50,
    endLoopMax: conf.endLoopMax || 200,
  });
  ```
- [x] Integration is OPTIONAL — game works without it (uses TS classes via fallback)

---

## Round-Trip Validation Script

### Validation Script: `editor/validate.ts`
- [x] Create Deno test script for automation
- [x] Test 1: Extract all 6 building configs
  - For each class in `BUILDING_CLASSES`:
    - Call `ConfigExtractor.extractBuilding(className)`
    - Assert valid JSON structure (version, type, required fields)
    - Assert all tiles have 4-element face arrays
    - Assert faceLinkWeight keys are consistent with faceLinks
    - Assert mainLvl is NOT present
- [x] Test 2: Save and reload JSON configs
  - For each extracted config:
    - Save to `conf/buildings/{id}.json`
    - Reload via `ConfigLoader.loadBuilding(id)`
    - Assert loaded config has same tile count
    - Assert face links expanded to bidirectional (2x unique pairs)
- [x] Test 3: Generation consistency
  - For each loaded config:
    - Run generation via `WcBuildFactoryGenarator.start2(0, 0)`
    - Assert generation completes without errors
    - Record tile count and iterations
    - Compare with expected ranges from TS config generation
- [x] Test 4: Asset collection round-trip
  - For each asset collection:
    - Extract to JSON
    - Save to `conf/asset-collections/{id}.json`
    - Verify all tiles have sourceGetter
    - Verify params are preserved
- [x] Test 5: Zero game code modifications
  - Run `git diff --name-only IsoGame/wcBuilding2/!(editor)/**`
  - Assert no files outside `editor/` are modified
- [x] Test 6: Browser error check
  - Verify no errors in browser console when using editor
  - Verify all API endpoints respond correctly

---

## Face Links Expansion Validation
- [x] Verify unique pairs in JSON have been correctly expanded to bidirectional
- [x] For each `[a, b]` pair in JSON, loaded config has both `[a, b]` and `[b, a]`
- [x] Loaded config's `init()` correctly rebuilds face index from expanded links
- [x] Face index (`indexTileOptions_KeyFaceKey`) matches TS-loaded config

---

## Performance Validation
- [x] Measure extraction time per building config — should be < 500ms
- [x] Measure save/write time — should be < 100ms
- [x] Measure generation preview time (normal building) — should be < 2s
- [x] Measure tile list filtering (100+ tiles) — should be < 50ms
- [x] All times should fall within NFR targets from PRD

---

## Documentation
- [x] Add JSDoc comments to all exported functions in `loader.ts`
- [x] Create `editor/README.md` with:
  - Overview of the editor tool
  - How to start the server and access the editor
  - How to extract, edit, save configs
  - How to enable runtime JSON loading (optional)
  - Known limitations and troubleshooting
- [x] Document JSON schema structure for future reference

---

## Integration & Testing

- [x] ConfigLoader successfully loads JSON config that was saved by the editor
- [x] Loaded config generates buildings identical to TS class generation
- [x] Round-trip validation script passes all 6 tests
- [x] No modifications to existing game code (verified via git diff)
- [x] Fallback to TS classes works when JSON doesn't exist
- [x] Integration wrapper documented but not required
- [x] All validation tests pass
- [x] Performance within NFR targets

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/loader.ts` — JSON config loader
2. `IsoGame/wcBuilding2/editor/integration.ts` — Optional wrapper for game integration
3. `editor/validate.ts` — Round-trip validation script
4. `editor/README.md` — Documentation

---

## Final Checklist (Complete Project)

After Phase 7, verify the entire project:

### Architecture
- [x] All code isolated in `IsoGame/wcBuilding2/editor/`
- [x] Zero modifications to existing game code
- [x] Clean separation: server / client / types
- [x] All imports resolve correctly

### Functionality
- [x] Extraction: All 6 building configs + ~10 asset collections extract without errors
- [x] Editing: All UI sections functional (parameters, weights, face links, tiles, assets)
- [x] Saving: JSON configs written to `conf/` directories correctly
- [x] Loading: `ConfigLoader.loadBuilding()` works with JSON or TS fallback
- [x] Preview: Generation preview renders on canvas
- [x] Validation: Round-trip consistency verified

### User Experience
- [x] Library panel shows all configs with status indicators
- [x] Building editor has all sections: params, collections, weights, faceLinks, tiles
- [x] Tile editor modal with face config, assets, functions, preview
- [x] Asset collection editor with param editing
- [x] Color suffix picker constructs valid #H_C_S_B format
- [x] Canvas renders tiles and buildings isometrically
- [x] Error handling: all failures show user-friendly messages
- [x] Loading indicators during async operations
- [x] Dirty state clearly visible (yellow indicator in library)

### Data Quality
- [x] All saved configs are valid JSON conforming to schema
- [x] All tiles have 4-element face arrays
- [x] All weights ≥ 0
- [x] faceLinks stored as unique pairs, expanded on load
- [x] sourceGetter/sourceCollection set on tiles for traceability
- [x] Template references ({PARAM_NAME}) preserved where applicable
