# TASKS-PHASE-4: Building Editor Panel

**Goal:** Implement the full building configuration editor with parameters, asset collection references, face weight table, face links table, start tiles, and tile list management.

**Estimated Time:** 5-6 hours  
**Dependencies:** Phase 3 (state.ts, api.ts, library.ts), Phase 1 (types.ts)

---

## Context

The Building Editor Panel is the main editing surface when a building config is active. It has multiple sections that manipulate different parts of the `BuildingConfig` JSON. Changes to any section mark the config as dirty. The panel renders reactively when `activeConfig` changes.

---

## File: `web/js/panels/building.ts` — Main Building Editor

### Panel Structure
- [x] Create `class BuildingEditorPanel` with `constructor(stateManager, apiClient)`
- [x] Implement `render(container: HTMLElement)` method
  - Only renders when `activeConfig.type === "building"`; otherwise show empty state
  - Header with building name, metadata (classRef, registryId, sourceFile) read-only
  - Sections (collapsible via `<details>` or custom toggle):
    1. Parameters
    2. Asset Collections
    3. Face Link Weights
    4. Face Links (Unique Pairs)
    5. Start Tiles
    6. Tiles
    7. Preview
- [x] Implement `private subscribe()` — re-renders when activeConfig changes
- [x] Implement `private onConfigChange()` — marks dirty and triggers re-render

### Section 1: Building Parameters
- [x] Display "Parameters" header
- [x] Number input for `growLoopCount`: range 5-100, default 50
  - Validation: clamp to range on change, show error if invalid
- [x] Number input for `endLoopMax`: range 50-1000, default 200
  - Validation: clamp to range on change
- [x] Read-only metadata display:
  - Class Reference: `WcBuildConf_HouseA`
  - Registry ID: `house_a`
  - Source File: `buildConf_HouseA`
- [x] Changes immediately call `stateManager.markDirty()`
- [x] Changes update `activeConfig.data.params` in state

### Section 2: Asset Collection References
- [x] Table listing all `assetCollections` used by the building
  - Columns: Name, Tag Prefix, Params (summary), Actions
- [x] Per-row actions:
  - "Edit params" button → inline edit mode for param values (WALL_SUFFIX, ROOF_SUFFIX, etc.)
  - "Open in editor" link button → switches activeConfig to that asset collection
  - "Remove" button → removes collection reference (with confirmation if tiles reference it)
- [x] "Add Asset Collection" button with dropdown of available collections
  - Dropdown populated from `tsClasses.assetCollections` or loaded JSON collections
- [x] When params change, mark dirty and update `activeConfig.data.assetCollections[i].params`

### Section 3: Face Link Weights [→ weightTable.ts component]
- [x] Delegate to `WeightTable` component (see below)
- [x] Pass `faceLinkWeight` from `activeConfig.data`
- [x] On weight change → update config and mark dirty

### Section 4: Face Links (Unique Pairs) [→ faceLinkTable.ts component]
- [x] Delegate to `FaceLinkTable` component (see below)
- [x] Pass `faceLinks` and `faceLinkWeight` from config
- [x] On link change → update config and mark dirty

### Section 5: Start Tiles
- [x] Display count of configured start tiles
- [x] Summary view showing each start tile's face keys and weight
- [ ] "Edit Start Tiles" button → opens tile editor modal with start tiles
- [ ] "Reset to Default" button → restores original TS class values (re-extract from TS)

### Section 6: Tile List
- [x] Display tile count and filter input
- [x] Table view with columns: ID, Face Preview (4 dirs), Weight, Source Info, Actions
- [x] Filter input: filters tiles by face key content or source getter name
- [ ] Sort buttons: by face key, weight, source getter
- [x] Per-row actions:
  - "Edit" button → opens tile in tile editor modal (Phase 5)
  - "Duplicate" button → clones tile, adds to tiles array
  - "Delete" button → removes tile with confirmation
- [x] "Add Tile" button → creates new empty tile with face `[null,null,null,null]`, weight 0
- [x] Tiles from asset collections show source badge: "from WallHouse.Wall_Door"

### Section 7: Preview
- [x] "Run Generation" button → calls `apiClient.previewGenerate(config)`
- [x] "Clear" button → removes preview canvas
- [x] Stats display: tile count, generation duration, iterations
- [x] Canvas area for preview rendering (delegates to canvas2d.ts from Phase 5)

---

## File: `web/js/components/weightTable.ts` — Face Weight Table Component

### Component Structure
- [x] Create `class WeightTable` with `constructor(container, config, onChange)`
- [x] Render table with columns: Face Key, Weight, Actions
- [x] Weight column: editable number input (range 0-infinity)
- [x] Zero-weight items shown with muted styling (opacity 0.5)
- [x] "Delete" button per row → removes weight entry
- [x] "Add Weight" section with dropdown of unused face keys + number input
- [x] Dropdown populated from all face keys used in tiles minus existing weight keys
- [x] Tooltip on each face key showing usage context (e.g., "WH_in = Wall Interior, used in 12 tiles")
- [x] On any change → call `onChange(updatedFaceLinkWeight)` callback

---

## File: `web/js/components/faceLinkTable.ts` — Face Links Table Component

### Component Structure
- [x] Create `class FaceLinkTable` with `constructor(container, config, onChange)`
- [x] Render table with columns: From, To, Actions
- [x] Only show unique pairs (no bidirectional duplicates)
- [x] Each row has "Face Key" dropdowns with autocomplete
- [x] Dropdowns populated from known face keys in config
- [x] "Add Link" section with two dropdowns: "From" and "To"
- [x] Validation: prevent duplicate pairs, prevent self-links unless intentionally configured
- [x] "Delete" button per row → removes pair
- [x] Visual indicator: warning icon if a face key in a pair has no weight entry
- [x] Helper text: "Note: Each pair expands to bidirectional at save time: [a,b] ↔ [b,a]"
- [x] On any change → call `onChange(updatedFaceLinks)` callback

---

## Integration & Testing

- [x] Building Editor Panel renders when a building config is selected from library
- [x] Parameters section correctly loads growLoopCount/endLoopMax from config
- [x] Changing parameters marks config dirty (yellow indicator in library)
- [x] Asset collection references section shows all collections used by building
- [x] WeightTable renders all face key weights and allows editing
- [x] FaceLinkTable renders unique pairs and allows add/delete
- [x] Tile list shows all tiles with source badges
- [x] Filtering tiles by face key works
- [x] Adding a new tile creates it with default values
- [x] Delete tile requires confirmation
- [x] Save button posts updated config to API and marks clean
- [x] No console errors in browser

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/web/js/panels/building.ts` — Main building editor panel
2. `IsoGame/wcBuilding2/editor/web/js/components/weightTable.ts` — Face weight table component
3. `IsoGame/wcBuilding2/editor/web/js/components/faceLinkTable.ts` — Face links table component