# Plan — Map Tools System

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Tech Lead: Implementation Breakdown

---

## Introduction

The current map interaction model in ZeoIsoDeno relies on hardcoded buttons in `flyMenu.ts` that directly trigger specific actions (e.g., `gridClick_Building`, `gridClick`, `init_test`). This approach lacks flexibility — adding new tools requires modifying core worker message handlers and UI code. The ARD proposes a **tool-based interaction model** where users select an active tool from a categorized menu, then click the map to execute that tool's action.

This plan breaks the implementation into 5 phases, starting with the foundational tool registry and UI, then progressively adding tool categories. Each phase builds on the previous one. The existing `TilesActions` singleton already provides terrain manipulation primitives (`lvlUp`, `lvlFlatSquare`, `colorSquare`, `itemAddKey`, etc.) that the new tools will wrap. The worker's message handler pattern (`handlers` Map in `GameWorker`) and the main thread's `MessageHandler` class provide the communication backbone. The new system integrates cleanly by adding a `toolClick` message type and a `ToolRegistry` on the worker side.

**Key integration points:**
- `web/js/main.ts` — Add `initToolMenu(gameWorker)` alongside existing `initFlyMenu()`
- `web/js/gameWorker.ts` — Add `toolClick` handler that delegates to `ToolRegistry.executeAt()`
- `web/indexIso.html` — Add `<div id="toolMenu"></div>` inside `#righMenu`
- `web/stylesIso.css` — Add styles for tool menu UI
- New file: `IsoGame/tools/toolRegistry.ts` — Core tool interface and registry
- New file: `web/js/menu/toolMenu.ts` — Tool selection UI

---

## Phase 1: Foundation

> **Goal**: Establish the tool registry, UI shell, and wire map clicks to the active tool.
> **Duration**: 1-2 days

### Task 1.1: Create Tool Interface & Registry

**File**: `IsoGame/tools/toolRegistry.ts`

```ts
export interface MapTool {
  id: string;
  name: string;
  icon: string;
  category: "terrain" | "color" | "asset" | "structure" | "inspect";
  execute(x: number, y: number, brushSize: number, world: World): void;
}

export class ToolRegistry {
  private tools: Map<string, MapTool> = new Map();
  private activeTool: MapTool | null = null;
  private brushSize: number = 1;

  register(tool: MapTool): void;
  setActive(toolId: string): void;
  getActive(): MapTool | null;
  getActiveId(): string | null;
  setBrushSize(size: number): void;
  getBrushSize(): number;
  getToolsByCategory(category: string): MapTool[];
  executeAt(x: number, y: number, world: World): void;
}
```

- [x] Define `MapTool` interface with `id`, `name`, `icon`, `category`, `execute()`
- [x] Implement `ToolRegistry` class with `register()`, `setActive()`, `getActive()`, `setBrushSize()`, `executeAt()`
- [x] Implement `getToolsByCategory()` for UI rendering
- [x] Export singleton `toolRegistry` instance
- [x] Add `World` import from `IsoGame/word.ts`

### Task 1.2: Create Tool Menu UI

**File**: `web/js/menu/toolMenu.ts`

- [x] Create `initToolMenu(gameWorker: Worker)` function following `flyMenu.ts` pattern
- [x] Render category tabs: `[Terrain] [Color] [Assets] [Structure] [Inspect]`
- [x] Render tool buttons per category (initially empty, populated in later phases)
- [x] Render brush size selector: `[1×1] [3×3] [5×5] [9×9]`
- [x] Render active tool display: `Active: ⬆️ Raise Terrain (3×3)`
- [x] On tool button click: send `setActiveTool { toolId }` to worker
- [x] On brush button click: send `setBrushSize { size }` to worker
- [x] On map click (via grid.ts): send `toolClick { x, y }` to worker
- [x] Update active tool display on `toolExecuted` callback

### Task 1.3: Add Tool Menu to HTML

**File**: `web/indexIso.html`

- [x] Add `<div id="toolMenu"></div>` inside `#righMenu` between `#mapflyMenu` and `#infoMenu`
- [x] Verify DOM structure: `<div id="righMenu"><div id="mapflyMenu"></div><div id="toolMenu"></div><div id="infoMenu"></div></div>`

### Task 1.4: Add Tool Menu Styles

**File**: `web/stylesIso.css`

- [x] Style `#toolMenu` container (padding, width, within `#righMenu`)
- [x] Style category tabs (flex row, active state highlighting)
- [x] Style tool buttons (grid layout, hover states, active state with `.active` class)
- [x] Style brush size buttons (inline, active state)
- [x] Style active tool display bar

### Task 1.5: Wire Worker Messages

**File**: `web/js/gameWorker.ts`

- [x] Add `setActiveTool` handler: `toolRegistry.setActive(data.toolId)`
- [x] Add `setBrushSize` handler: `toolRegistry.setBrushSize(data.size)`
- [x] Add `toolClick` handler: `toolRegistry.executeAt(data.x, data.y, this.world)` then send `toolExecuted` callback
- [x] Import `ToolRegistry` from `IsoGame/tools/toolRegistry.ts`

**File**: `web/js/main.ts`

- [x] Import and call `initToolMenu(gameWorker)` after `initFlyMenu(gameWorker)`
- [x] Add `toolExecuted` handler in `handlers.append()` to update UI

### Task 1.6: Update Grid Click to Support Tool Mode

**File**: `IsoGame/mapIso/grid.ts`

- [x] Modify tile click handler to also send `toolClick` message (in addition to existing `query_infoCell`)
- [x] Pass `gridX` and `gridY` as tile coordinates in `toolClick` payload

---

## Phase 2: Terrain Tools

> **Goal**: Implement the 5 terrain manipulation tools using existing `TilesActions` primitives.
> **Duration**: 1 day

### Task 2.1: Implement Raise Terrain Tool

**File**: `IsoGame/tools/terrainTools.ts`

```ts
export const raiseTerrainTool: MapTool = {
  id: "raise_terrain",
  name: "Raise Terrain",
  icon: "⬆️",
  category: "terrain",
  execute(x, y, brushSize, world) {
    TilesActions.getInstance().doAction({
      func: "lvlUp",
      x, y,
      size: brushSize,
      lvl: 1,
    });
  }
};
```

- [x] Create `terrainTools.ts` with `raiseTerrainTool`
- [x] Use `TilesActions.getInstance().lvlUpSquare()` with `lvl: 1` for brush sizes > 1
- [x] Use `TilesActions.getInstance().lvlUp()` for 1×1 brush
- [x] Register tool in `ToolRegistry` during worker init

### Task 2.2: Implement Lower Terrain Tool

- [x] Create `lowerTerrainTool` with `id: "lower_terrain"`, icon `⬇️`
- [x] Use `TilesActions.getInstance().lvlUpSquare()` with `lvl: -1`
- [x] Register tool in `ToolRegistry`

### Task 2.3: Implement Flatten Tool

- [x] Create `flattenTool` with `id: "flatten"`, icon `⏹️`
- [x] Wrap existing `TilesActions.getInstance().doAction({ func: "lvlFlatSquare", x, y, size: brushSize })`
- [x] Register tool in `ToolRegistry`

### Task 2.4: Implement Smooth Tool

- [x] Create `smoothTool` with `id: "smooth"`, icon `〰️`
- [x] Use `TilesActions.getInstance().doAction({ func: "lvlAvgSquare", x, y, size: brushSize })`
- [x] Register tool in `ToolRegistry`

### Task 2.5: Implement Plateau Tool

- [x] Create `plateauTool` with `id: "plateau"`, icon `🏔️`
- [x] First click: store target level from clicked tile
- [x] Second click: flatten surrounding area to target level using `lvlFlatSquare`
- [x] Alternative: use `lvlSet` for each tile in brush area with stored level
- [x] Register tool in `ToolRegistry`

### Task 2.6: Register Terrain Tools in Worker Init

**File**: `web/js/gameWorker.ts`

- [x] Import terrain tools from `IsoGame/tools/terrainTools.ts`
- [x] Register all 5 terrain tools in `initWorker` after `this.world.init()`
- [x] Send tool list to main thread for UI rendering: `handler.send({ action: "toolList", tools: [...] })`

### Task 2.7: Populate Terrain Tab in UI

**File**: `web/js/menu/toolMenu.ts`

- [x] Handle `toolList` message from worker to populate tool buttons
- [x] Render terrain tools in `[Terrain]` tab with icons and names
- [x] Highlight active tool button with `.active` class

---

## Phase 3: Color Tools

> **Goal**: Implement color painting tools for visual tile customization.
> **Duration**: 0.5 day

### Task 3.1: Implement Color Picker Tool

**File**: `IsoGame/tools/colorTools.ts`

- [x] Create `colorPickerTool` with `id: "color_picker"`, icon `🎨`
- [x] Store selected color in `ToolRegistry` state (add `activeColor: [number, number, number]` property)
- [x] UI: render color picker input in tool menu when color category is active
- [x] On color change: send `setColor { r, g, b }` to worker

### Task 3.2: Implement Paint Color Tool

- [x] Create `paintColorTool` with `id: "paint_color"`, icon `🖌️`
- [x] Use `TilesActions.getInstance().doAction({ func: "colorSquare", x, y, size: brushSize, color: activeColor })`
- [x] Register tool in `ToolRegistry`

### Task 3.3: Implement Eyedropper Tool

- [x] Create `eyedropperTool` with `id: "eyedropper"`, icon `💉`
- [x] Read tile color: `FactoryMap.getInstance().getTileColor(x, y)`
- [x] Send color back to main: `handler.send({ action: "pickedColor", r, g, b })`
- [x] Main thread: update color picker UI via `handlePickedColor()`

### Task 3.4: Implement Random Shade Tool

- [x] Create `randomShadeTool` with `id: "random_shade"`, icon `🎲`
- [x] Apply random variation of active color: `color = activeColor.map(c => Math.max(0, Math.min(255, c + (Math.random() - 0.5) * 60)))`
- [x] Use `TilesActions.getInstance().doAction({ func: "colorSquare", x, y, size: brushSize, color: variedColor })`
- [x] Register tool in `ToolRegistry`

### Task 3.5: Add Color UI Elements

**File**: `web/js/menu/toolMenu.ts`

- [x] Add color picker `<input type="color">` to color category tab
- [x] Handle `pickedColor` message from worker via `handlePickedColor()`
- [x] On color change: send `setColor` message to worker

### Task 3.6: Register Color Tools in Worker

**File**: `web/js/gameWorker.ts`

- [x] Import color tools from `IsoGame/tools/colorTools.ts`
- [x] Add `setColor` handler: store color in `toolRegistry.activeColor`
- [x] Register all 4 color tools in `initWorker`

---

## Phase 4: Asset Tools

> **Goal**: Implement asset placement tools using existing `AssetLoaderOpti` and `TilesActions`.
> **Duration**: 0.5 day

### Task 4.1: Implement Asset Picker Tool

**File**: `IsoGame/tools/assetTools.ts`

- [ ] Create `assetPickerTool` with `id: "asset_picker"`, icon `📂`
- [ ] Send asset groups to main thread: read from `AssetLoaderOpti.assetList` config
- [ ] Handler: `handler.send({ action: "assetGroups", groups: assetOptiConfig.map(g => ({ group: g.group, images: g.images.map(i => i.label) })) })`

### Task 4.2: Implement Place Asset Tool

- [ ] Create `placeAssetTool` with `id: "place_asset"`, icon `🖼️`
- [ ] Use `TilesActions.getInstance().doAction({ func: "itemAddKey", x, y, assetKey: activeAssetId })`
- [ ] Store `activeAssetId` in `ToolRegistry` state
- [ ] Register tool in `ToolRegistry`

### Task 4.3: Implement Clear Items Tool

- [ ] Create `clearItemsTool` with `id: "clear_items"`, icon `🧹`
- [ ] Use `TilesActions.getInstance().doAction({ func: "clearItemSquare", x, y, size: brushSize })`
- [ ] Register tool in `ToolRegistry`

### Task 4.4: Add Asset UI Elements

**File**: `web/js/menu/toolMenu.ts`

- [ ] Handle `assetGroups` message to populate asset browser
- [ ] Render asset group dropdown/tabs: Nature, Town, Items, Astro, Transport, User, Walls
- [ ] Render asset thumbnails/names within selected group
- [ ] On asset select: send `setActiveAsset { assetId }` to worker
- [ ] Highlight selected asset

### Task 4.5: Register Asset Tools in Worker

**File**: `web/js/gameWorker.ts`

- [ ] Import asset tools from `IsoGame/tools/assetTools.ts`
- [ ] Add `setActiveAsset` handler: store in `toolRegistry.activeAssetId`
- [ ] Register all 3 asset tools in `initWorker`
- [ ] Send `assetGroups` after asset loader is initialized

---

## Phase 5: Structure & Inspection Tools

> **Goal**: Implement road placement, building generation, city generation, and inspection tools.
> **Duration**: 2 days

### Task 5.1: Implement Place Road Tool (Two-Click)

**File**: `IsoGame/tools/structureTools.ts`

- [ ] Create `placeRoadTool` with `id: "place_road"`, icon `🛣️`
- [ ] First click: store start position
- [ ] Second click: call `PathFactory.createPath(start, end)` then apply `actionDrawPath()`
- [ ] Use existing `PathFactory` from `IsoGame/city/pathFactory.ts`
- [ ] Register tool in `ToolRegistry`

### Task 5.2: Implement Place Building Tool

- [ ] Create `placeBuildingTool` with `id: "place_building"`, icon `🏠`
- [ ] Wrap existing: `new WcBuildingFactoryGenarator(world, conf).start2(x, y)`
- [ ] Use default `WcBuildConf_GraveA` config (matching current `gridClick_Building` handler)
- [ ] Register tool in `ToolRegistry`

### Task 5.3: Implement Generate City Tool

- [ ] Create `generateCityTool` with `id: "generate_city"`, icon `🏙️`
- [ ] Wrap existing: `new City(world, x, y)` (matching current `gridClick` handler)
- [ ] Register tool in `ToolRegistry`

### Task 5.4: Implement Clear Structure Tool

- [ ] Create `clearStructureTool` with `id: "clear_structure"`, icon `🏚️`
- [ ] Use `TilesActions.getInstance().doAction({ func: "clearAllSquare", x, y, size: brushSize })`
- [ ] Register tool in `ToolRegistry`

### Task 5.5: Implement Inspect Tool

**File**: `IsoGame/tools/inspectTools.ts`

- [ ] Create `inspectTool` with `id: "inspect"`, icon `🔍`
- [ ] Execute on main thread (no worker round-trip): directly call existing `query_infoCell` handler
- [ ] Main-side execution: `handlers.send({ action: "query_infoCell", x, y })`
- [ ] Update `toolMenu.ts` to handle main-side tool execution for inspect category

### Task 5.6: Implement Measure Tool

- [ ] Create `measureTool` with `id: "measure"`, icon `📏`
- [ ] First click: store start position
- [ ] Second click: calculate distance using `PathFactory.tilesDistance(start, end)`
- [ ] Display distance in info panel
- [ ] Execute on main thread (no worker needed)

### Task 5.7: Register Structure & Inspection Tools in Worker

**File**: `web/js/gameWorker.ts`

- [ ] Import structure tools from `IsoGame/tools/structureTools.ts`
- [ ] Import inspect tools from `IsoGame/tools/inspectTools.ts`
- [ ] Register all structure and inspection tools in `initWorker`
- [ ] Handle two-click tools: store first click state, execute on second click

---

## Phase 6: Keyboard Shortcuts & Polish

> **Goal**: Add keyboard shortcuts, brush system integration, and final polish.
> **Duration**: 0.5 day

### Task 6.1: Add Keyboard Shortcuts

**File**: `web/js/keyboad.ts`

- [ ] Add tool shortcut bindings: `1`=Raise, `2`=Lower, `3`=Flatten, `4`=Paint, `5`=Eyedropper, `6`=Place Asset, `7`=Place Road, `Q`=Inspect, `B`=Cycle Brush, `Esc`=Deselect
- [ ] On keydown: send `setActiveTool` or `setBrushSize` to worker
- [ ] Avoid conflicts with existing movement keys (z/s/q/d/arrows)

### Task 6.2: Implement Brush Size System

**File**: `IsoGame/tools/toolRegistry.ts`

- [ ] Ensure `brushSize` is passed to `tool.execute(x, y, brushSize, world)`
- [ ] Implement `cycleBrushSize()` method: 1 → 3 → 5 → 9 → 1

**File**: `web/js/menu/toolMenu.ts`

- [ ] Update brush button highlight on `setBrushSize` message
- [ ] Keyboard shortcut `B` calls `cycleBrushSize()`

### Task 6.3: Tool Executed Feedback

**File**: `web/js/gameWorker.ts`

- [ ] Send `toolExecuted { toolId, success, message }` after each tool execution
- [ ] Handle errors gracefully (e.g., blocked tiles, invalid positions)

**File**: `web/js/menu/toolMenu.ts`

- [ ] Display brief success/error feedback in active tool bar
- [ ] Flash active tool button on execution

### Task 6.4: Migration — Keep Existing Buttons

- [ ] Verify existing `flyMenu` buttons (`City`, `Building`, `Test Init`) still work
- [ ] Optionally: make them call `toolRegistry.setActive()` + immediate execute
- [ ] Add deprecation note in code comments for future removal

---

## File Summary

| File | Type | Phase |
|------|------|-------|
| `IsoGame/tools/toolRegistry.ts` | NEW | 1 |
| `IsoGame/tools/terrainTools.ts` | NEW | 2 |
| `IsoGame/tools/colorTools.ts` | NEW | 3 |
| `IsoGame/tools/assetTools.ts` | NEW | 4 |
| `IsoGame/tools/structureTools.ts` | NEW | 5 |
| `IsoGame/tools/inspectTools.ts` | NEW | 5 |
| `web/js/menu/toolMenu.ts` | NEW | 1 |
| `web/js/main.ts` | MODIFY | 1 |
| `web/js/gameWorker.ts` | MODIFY | 1-5 |
| `web/js/keyboad.ts` | MODIFY | 6 |
| `web/indexIso.html` | MODIFY | 1 |
| `web/stylesIso.css` | MODIFY | 1 |
| `IsoGame/mapIso/grid.ts` | MODIFY | 1 |

---

## Message Protocol Summary

| Direction | Action | Payload | Phase |
|-----------|--------|---------|-------|
| Main → Worker | `setActiveTool` | `{ toolId: string }` | 1 |
| Main → Worker | `setBrushSize` | `{ size: number }` | 1 |
| Main → Worker | `toolClick` | `{ x: number, y: number }` | 1 |
| Main → Worker | `setColor` | `{ r: number, g: number, b: number }` | 3 |
| Main → Worker | `setActiveAsset` | `{ assetId: string }` | 4 |
| Worker → Main | `toolExecuted` | `{ toolId: string, success: boolean }` | 1 |
| Worker → Main | `toolList` | `{ tools: MapTool[] }` | 2 |
| Worker → Main | `assetGroups` | `{ groups: [...] }` | 4 |
| Worker → Main | `pickedColor` | `{ color: [r,g,b] }` | 3 |

---

## Estimated Effort

| Phase | Stories | Time Estimate |
|-------|---------|---------------|
| Phase 1 | Foundation (6 tasks) | 1-2 days |
| Phase 2 | Terrain Tools (7 tasks) | 1 day |
| Phase 3 | Color Tools (6 tasks) | 0.5 day |
| Phase 4 | Asset Tools (5 tasks) | 0.5 day |
| Phase 5 | Structure & Inspection (7 tasks) | 2 days |
| Phase 6 | Shortcuts & Polish (4 tasks) | 0.5 day |
| **Total** | **35 tasks** | **5-6 days** |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| `TilesActions` methods not thread-safe in worker | Worker is single-threaded; `TilesActions` singleton is safe within worker context |
| Two-click tools (road, plateau, measure) need state | Store first-click state in `ToolRegistry`, clear on tool change or `Esc` |
| Asset picker UI complexity | Start with simple dropdown, iterate to grid/thumbnails later |
| Grid click conflicts (existing `query_infoCell` + new `toolClick`) | Send both messages from grid click; inspect tool runs on main side |