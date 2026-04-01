# TASKS-PHASE-1: Types & Runtime Extractor

**Goal:** Define JSON schema interfaces and implement runtime extraction of TS building configs and asset collections into valid JSON.

**Estimated Time:** 5-6 hours  
**Dependencies:** None (first phase to implement)

---

## Context

This phase establishes the foundation for the entire editor. All subsequent phases depend on these types and the extraction capability. Two critical patterns must be handled:

1. **Getter-based asset collections** (WallHouse, WallManor, WallRLab) — tiles are produced by individual getters like `Corner`, `Wall_Door`, etc. Each getter computes face keys dynamically using `tag + suffix`.
2. **groupAsset-based collections** (FenceSimple, FencePlatform, FenceGrave) — tiles are produced by calling `groupAsset({flatW, cornerW, innerW, isFrise})` with weight parameters.

Face links must be deduplicated (store only unique pairs, not bidirectional duplicates). The runtime value `mainLvl` must NOT be included in JSON.

---

## File: `types.ts` — JSON Schema Interfaces

- [x] Define `BuildingConfig` interface matching the JSON schema from PLAN-SUMMARY-v4.md
  - Fields: `version: "1.0"`, `type: "building"`, `id`, `metadata {classRef, sourceFile, registryId}`, `params {growLoopCount, endLoopMax}`, `assetCollections[]`, `faceLinkWeight`, `faceLinks`, `startTiles[]`, `tiles[]`
  - Explicitly exclude `mainLvl` from params
- [x] Define `AssetCollectionConfig` interface
  - Fields: `version`, `type: "assetCollection"`, `id`, `metadata {classRef, sourceFile}`, `tag`, `params`, `paramsSchema`, `tiles[]`
- [x] Define `TileConfig` interface extending `WcConfTile`
  - Must include traceability fields: `sourceGetter?: string`, `sourceTileId?: string`, `sourceCollection?: string`
- [x] Define `WcConfTileAsset` interface
  - Fields: `key?`, `keyR?`, `sufix?`, `h?`, `off?`
- [x] Define `WcConfTileFunction` interface
  - Fields: `func`, `size?`
- [x] Define `AssetCollectionRef` interface for building → collection references
  - Fields: `id`, `classRef`, `tag`, `params`, `sourceFile`
- [x] All types must compile without errors — verify with `deno check types.ts`

---

## File: `extractor.ts` — Runtime TS Class → JSON Extraction

### Building Config Classes Registry
- [x] Define `BUILDING_CLASSES` constant mapping class names to class constructors
  - Keys: `WcBuildConf_HouseA`, `WcBuildConf_GraveA`, `WcBuildConf_ManorA`, `WcBuildConf_LabBorderA`, `WcBuildConf_LabPipeA`, `WcBuildConf_RLabA`
  - Import all 6 building config classes
- [x] Define `REGISTRY_ID_MAP` mapping class names to registry IDs from `buildingConfigRegistry.ts`
  - HouseA → `house_a`, GraveA → `grave_a`, ManorA → `manor_a`, etc.

### Asset Collection Classes Registry
- [x] Define `ASSET_COLLECTION_REGISTRY` with per-class configuration
  - For getter-based classes: `tileGetters: string[]` listing all getter names
    - `WcAsset_WallHouse`: ["Corner", "Corner_B", "Wall", "Wall_Door", "Wall_Windows", "Wall_RoofWindows", "InnerCorner", "InnerCorner_X", "Inside_Full"]
    - `WcAsset_WallManor`: ["Corner", "Wall_Door", "Wall", "Wall_Windows", "InnerCorner", "InnerCorner_X"]
    - `WcAsset_WallRLab`: similar pattern
  - For groupAsset-based classes: `usesGroupAsset: true`, `groupAssetParams: {flatW, cornerW, innerW, isFrise}` with defaults
    - `WcAsset_FenceSimple`, `WcAsset_FencePlatform`, `WcAsset_FenceGrave`
  - Special handling for `WcAsset_Enter`: `groupInit: true`, `groupAsset: true`
  - `WcAsset_CorridorLab`, `WcAsset_CorridorPipe`: identify their pattern

### `ConfigExtractor.extractBuilding()` Method
- [x] Instantiate config class with `{}` (or optional override params)
- [x] Call `conf.init()` to populate `startTileOptions` and `listTileOptions`
- [x] Extract `growLoopCount` and `endLoopMax` from instance
- [x] Copy `faceLinkWeight` as-is from instance
- [x] Extract `faceLinks` and pass through `deduplicateFaceLinks()` to remove bidirectional duplicates
- [x] Extract `startTiles` from `startTileOptions` using `tileToJson()`
- [x] Extract `tiles` from `listTileOptions` using `tileToJson()`
- [x] Extract `assetCollections` references from known instance properties (e.g., `this.houseSimple`, `this.fence`)
- [x] Construct and return complete `BuildingConfig` object
- [x] Verify extraction for HouseA produces valid JSON with all 6 required face keys (WH_out, WH_outD, WH_in, WH_r, WH_l, WH_rX, WH_lX)

### `ConfigExtractor.extractAssetCollection()` Method
- [x] Look up class in `ASSET_COLLECTION_REGISTRY`
- [x] Instantiate with default params (or override params map)
- [x] **Getter-based branch:** iterate through `entry.tileGetters`, check if getter exists on instance, call it, convert result to JSON with `sourceGetter` set
- [x] **groupAsset-based branch:** call `instance.groupAsset(entry.groupAssetParams)` and convert results to JSON
- [x] **Special case — WcAsset_Enter:** call `groupInit()` for start tiles and `groupAsset()` for entrance tiles
- [x] Extract `tag` from instance
- [x] Extract `params` (WALL_SUFFIX, ROOF_SUFFIX, etc.) from instance properties
- [x] Construct `paramsSchema` with type hints ("color" for suffix params)
- [x] Return complete `AssetCollectionConfig`

### `ConfigExtractor.tileToJson()` Helper
- [x] Copy `face` array (4 elements: NW, NE, SE, SW)
- [x] Copy `weight`
- [x] Deep copy `assets[]` if present
- [x] Deep copy `functions[]` if present
- [x] Copy booleans: `allowMove`, `isFrise`, `empty`
- [x] Copy optional: `color`, `colorT`, `h`, `lvl`

### `ConfigExtractor.deduplicateFaceLinks()` Helper
- [x] Create `Set<string>` for seen pairs
- [x] Normalize each pair to canonical form (sorted alphabetically: `a < b ? a|b : b|a`)
- [x] Filter out pairs already in set
- [x] Return deduplicated array of `[string, string][]`

### `ConfigExtractor.extractAssetCollectionRefs()` Helper
- [x] Scan building config instance for asset collection property names
- [x] For each found collection, extract: `id`, `classRef`, `tag`, `params`, `sourceFile`
- [x] Return array of `AssetCollectionRef[]`

---

## Validation & Testing

- [x] Write test script that extracts all 6 building configs
- [x] Verify each extracted config is valid JSON via `JSON.parse(JSON.stringify())`
- [x] Verify all tiles have exactly 4 face elements
- [x] Verify `faceLinkWeight` keys are consistent with face keys used in `faceLinks`
- [x] Verify deduplicated `faceLinks` has ≈50% fewer entries than raw `conf.faceLinks`
- [x] Verify `mainLvl` is NOT present in any extracted config
- [x] Verify asset collections extract correctly for both getter-based and groupAsset-based patterns
- [x] Verify `sourceGetter` is set on all tiles from getter-based collections
- [x] Total validation: all 6 building configs + ~10 asset collections extract without errors

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/types.ts` — All JSON schema interfaces
2. `IsoGame/wcBuilding2/editor/extractor.ts` — Complete extraction logic
3. `IsoGame/wcBuilding2/editor/test_extraction.ts` — Validation test script
