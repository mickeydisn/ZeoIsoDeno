# TASKS-PHASE-5: Tile Editor & Components

**Goal:** Create the tile editor modal with 4-direction face configuration, asset list CRUD, function management, 2D canvas preview, and color suffix picker component.

**Estimated Time:** 5-6 hours  
**Dependencies:** Phase 4 (building.ts panel), Phase 1 (types.ts)

---

## Context

The Tile Editor is the most frequently used component — it appears as a modal when editing tiles from the building editor or asset collection editor. It provides full CRUD for tile configuration: face keys (4 directions), visual assets with color suffix support, terrain functions, and boolean properties. The face editor and asset list are reusable components used both in the tile editor and potentially elsewhere.

---

## File: `web/js/panels/tile.ts` — Tile Editor Modal/Panel

### Modal Structure
- [ ] Create `class TileEditorPanel` with `constructor(stateManager, apiClient)`
- [ ] Implement `open(container: HTMLElement, tile: TileConfig | null, context: TileEditContext)` method
  - `tile`: existing tile to edit, or null for new tile
  - `context`: `{ parentCollection: string, isStartTile: boolean, onSave: (tile) => void }`
- [ ] Implement `close()` — hides modal, clears state
- [ ] Modal rendered inside `#modal-overlay` from index.html
- [ ] Backdrop click → close modal (with "unsaved changes" confirmation if dirty)

### Tile ID & Source Info
- [ ] Tile ID text input (auto-populated if new tile)
- [ ] Source info row (read-only): e.g., "From WallHouse → Wall_Door"
- [ ] Mark modal as dirty on any field change

### Face Configuration Section
- [ ] Delegate to `FaceEditor` component (see below)
- [ ] Label: "Face Configuration (NW, NE, SE, SW)"
- [ ] Display 4 dropdowns with all known face keys + null option
- [ ] Face keys color-coded by prefix (WH_ = blue, F_ = green, E_ = orange, etc.)
- [ ] Validation: must be exactly 4 elements

### Properties Section
- [ ] Weight number input (default 0, range 0-infinity)
- [ ] Checkbox: Allow Move (`allowMove`)
- [ ] Checkbox: Is Frise (`isFrise`) — decorative, no collision
- [ ] Checkbox: Empty (`empty`) — no assets rendered
- [ ] Optional Height number input (`h`)
- [ ] Optional Level number input (`lvl`)
- [ ] Color override: `[R, G, B]` inputs with color picker button

### Asset List Section [→ assetList.ts component]
- [ ] Delegate to `AssetListEditor` component
- [ ] Section header: "Assets" with count
- [ ] "Add Asset" button with available asset dropdown
- [ ] List of asset rows (see assetList.ts below)

### Function List Section
- [ ] Section header: "Terrain Functions"
- [ ] Table with columns: Function Name, Size, Actions
- [ ] Function name dropdown (e.g., "lvlAvgSquare")
- [ ] Size number input
- [ ] "Delete" button per row
- [ ] "Add Function" button
- [ ] On change → update `tile.functions` array

### Preview Section [→ canvas2d.ts component]
- [ ] Delegate to `Canvas2DPreview` component
- [ ] Shows live preview as tile config changes
- [ ] Toggle: Show face key overlays
- [ ] Toggle: Show asset outlines

### Action Buttons
- [ ] "Cancel" button → closes modal, discards changes
- [ ] "Save & Close" button → validates tile, calls `context.onSave(updatedTile)`, closes modal
- [ ] Validation before save:
  - Face must have exactly 4 elements
  - At least one asset or function (warning, not error)
  - Weight must be ≥ 0
- [ ] Show validation errors inline

---

## File: `web/js/components/faceEditor.ts` — 4-Direction Face Editor Widget

### Component Structure
- [ ] Create `class FaceEditor` with `constructor(container, faceValues, faceKeys, onChange)`
  - `faceValues`: `[string | null, string | null, string | null, string | null]`
  - `faceKeys`: list of all available face keys (for dropdown options)
  - `onChange`: callback with updated face array
- [ ] Render diamond/compass layout showing 4 directions:
  ```
        NW (0)
    SW (3)  NE (1)
        SE (2)
  ```
- [ ] Each direction has a `<select>` dropdown with:
  - `<option value="">— null —</option>`
  - `<option value="WH_in">WH_in</option>`
  - All known face keys from config
- [ ] Color-code dropdown borders by face key prefix:
  - `WH_` = blue (#4a9eff)
  - `F_` = green (#4caf50)
  - `FP_` = teal (#009688)
  - `E_` = orange (#ff9800)
  - `X` = grey (#9e9e9e)
- [ ] Tooltip on each option showing face key meaning
- [ ] Warning badge if selected face key has no matching weight entry
- [ ] On any dropdown change → call `onChange(updatedFaceArray)`

---

## File: `web/js/components/assetList.ts` — Tile Asset List Editor

### Component Structure
- [ ] Create `class AssetListEditor` with `constructor(container, assets, availableAssets, collectionParams, onChange)`
  - `assets`: `WcConfTileAsset[]` current list
  - `availableAssets`: list of asset keys from `/editor/assets/list`
  - `collectionParams`: params for resolving template references (e.g., `{ROOF_SUFFIX: "..."}`)
  - `onChange`: callback with updated assets array
- [ ] Render table with columns: Layer, Asset Key, Rotation, Suffix, Height, Actions

### Asset Row
- [ ] Layer indicator: "h:0", "h:1", "h:2" (matches `WcConfTileAsset.h`)
- [ ] Asset Key dropdown with autocomplete from `availableAssets`
- [ ] Rotation selector: 0°, 90°, 180°, 270° (or index 0-3)
- [ ] Suffix input:
  - Supports template references: `{WALL_SUFFIX}`, `{ROOF_SUFFIX}`
  - Supports raw values: `#H210_C115_S35_B120`
  - Template references resolved to preview value from `collectionParams`
  - Suffix helper button (🎨) opens color picker dialog
- [ ] Height selector: 0, 1, 2
- [ ] Delete button (🗑️) per row
- [ ] Live preview of asset in row (mini thumbnail if image available)

### Add Asset Section
- [ ] "Add Asset" button
- [ ] Dropdown of available assets
- [ ] Creates asset with defaults: `keyR: 0`, `sufix: ""`, `h: 0`

### Reordering (Optional / P2)
- [ ] Drag handle on each row for reordering
- [ ] Uses HTML5 drag-and-drop API

---

## File: `web/js/components/colorPicker.ts` — Color Suffix Helper

### Component Structure
- [ ] Create `class ColorPicker` with `constructor(onChange)`
- [ ] Openable as modal dialog or inline panel
- [ ] Four range sliders:
  - Height (H): 0-300
  - Color (C): 0-255
  - Saturation (S): 0-100
  - Brightness (B): 50-200
- [ ] Live preview of constructed suffix: `#H210_C115_S35_B120`
- [ ] Copy-to-clipboard button
- [ ] Preset color swatches for common values (wall color, roof color, fence color)
- [ ] "Use template reference" radio option to switch from raw value to `{PARAM_REF}`
- [ ] Color preview shows approximate rendered color as a colored rectangle
- [ ] On value change → call `onChange(suffixString)`

---

## File: `web/js/components/canvas2d.ts` — 2D Isometric Canvas Preview

### Component Structure
- [ ] Create `class Canvas2DPreview` with `constructor(container)`
- [ ] Implements `renderTile(tile: TileConfig, assets: Map<string, HTMLImageElement>)`
  - Renders single tile with assets
  - Face key overlay: colored rectangles for each face direction
  - Asset overlay: isometric sprites from `img/asset_opti/`
- [ ] Implements `renderGrid(tiles: {x, y, tile}[], zoom, pan)`
  - Renders generated building grid
  - Each tile drawn as isometric rhombus
  - Tile colored by face key or asset type
- [ ] Pan controls: mouse drag
- [ ] Zoom controls: scroll wheel, range 0.5x - 5x
- [ ] Toggle: Show face key labels on tiles
- [ ] Toggle: Show asset outlines
- [ ] Click on tile → show tile config popup
- [ ] Canvas size: responsive to container
- [ ] Uses HTML5 Canvas 2D context

---

## Integration & Testing

- [ ] Tile editor modal opens when clicking "Edit Tile" in building panel
- [ ] Face editor widget renders with 4 directional dropdowns
- [ ] Face key dropdowns populated with all known face keys
- [ ] Face key color-coding renders correctly
- [ ] Asset list renders existing assets
- [ ] Adding an asset creates a new row with defaults
- [ ] Deleting an asset removes the row
- [ ] Color picker constructs valid suffix format (#H_C_S_B)
- [ ] Template references ({WALL_SUFFIX}) resolve correctly in preview
- [ ] Canvas renders a single tile with colored rectangles
- [ ] Canvas renders a generated building grid
- [ ] Canvas pan/zoom works smoothly
- [ ] Save & Close validates and saves tile
- [ ] Cancel discards changes
- [ ] No console errors

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/web/js/panels/tile.ts` — Tile editor modal
2. `IsoGame/wcBuilding2/editor/web/js/components/faceEditor.ts` — 4-direction face widget
3. `IsoGame/wcBuilding2/editor/web/js/components/assetList.ts` — Asset list editor
4. `IsoGame/wcBuilding2/editor/web/js/components/colorPicker.ts` — Color suffix helper
5. `IsoGame/wcBuilding2/editor/web/js/components/canvas2d.ts` — 2D preview canvas