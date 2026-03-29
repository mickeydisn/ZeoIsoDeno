# ADR — Map Tools System

> ZeoIsoDeno Feature Design — 2026-03-28
> Author: Tech Lead

## Overview

Introduce a **tool selection menu** allowing users to choose an active tool that determines the action performed when clicking on the map. This replaces the current button-per-action pattern with a more intuitive tool-based interaction model.

---

## Tool Inventory

### Category 1: Terrain Tools

| Tool | Icon | Description | Existing Code |
|------|------|-------------|---------------|
| **Raise Terrain** | ⬆️ | Increase tile elevation by 1 level | `TileActions` (partial) |
| **Lower Terrain** | ⬇️ | Decrease tile elevation by 1 level | `TileActions` (partial) |
| **Flatten** | ⏹️ | Set all tiles in area to same level | `lvlFlatSquare` |
| **Smooth** | 〰️ | Average neighboring levels for gradual terrain | New |
| **Plateau** | 🏔️ | Flatten to target level at click point | New |

### Category 2: Color Tools

| Tool | Icon | Description | Existing Code |
|------|------|-------------|---------------|
| **Color Picker** | 🎨 | Select color from palette | New |
| **Paint Color** | 🖌️ | Apply selected color to tiles | New |
| **Eyedropper** | 💉 | Pick color from existing tile | New |
| **Random Shade** | 🎲 | Apply random shade of selected color | New |

**Note**: Biomes are procedurally generated and cannot be modified by users. Color tools only affect the visual appearance of tiles.

### Category 3: Asset Tools

Users select assets from the `AssetLoaderOpti`, organized by groups from `img/asset_opti/`.

| Group | Assets | Description |
|-------|--------|-------------|
| **Nature** | 🌳 NatureTree, 🌸 NatureFlower, 🪨 NatureRock | Trees, flowers, rocks |
| **Town** | 🏠 Town1, 🏘️ Town2 | Building structures |
| **Items** | 💀 ItemGrave, 🗿 ItemPilar, ⚙️ ItemTech, 📦 ItemOther | Decorative objects |
| **Astro** | 🚀 AstroRocket, 🛸 AstroPlatform, 🏗️ AstroBase (1-5) | Sci-fi structures |
| **Transport** | 🚂 Train | Vehicles |
| **User** | 👤 UserAstro, 🧑 MyPerso2 | Characters |
| **Walls** | 🧱 Wall | Barriers |

| Tool | Icon | Description | Communication |
|------|------|-------------|---------------|
| **Asset Picker** | 📂 | Browse and select asset by group | Main → Worker: `setActiveAsset { assetId: string }` |
| **Place Asset** | 🖼️ | Place selected asset on tile | Main → Worker: `toolClick { x, y, assetId }` |
| **Clear Items** | 🧹 | Remove all items from area | Main → Worker: `toolClick { x, y, action: "clear" }` |

### Category 4: Structure Tools

| Tool | Icon | Description | Existing Code |
|------|------|-------------|---------------|
| **Place Road** | 🛣️ | Draw road path between clicks | `PathFactory` |
| **Place Building** | 🏠 | Generate building at location | `WcBuildingFactory` |
| **Generate City** | 🏙️ | Procedural city generation | `City` class |
| **Clear Structure** | 🏚️ | Remove building from tile | New |

### Category 5: Inspection Tools

| Tool | Icon | Description | Existing Code |
|------|------|-------------|---------------|
| **Inspect** | 🔍 | Show tile info on click | `query_infoCell` |
| **Measure** | 📏 | Distance between two clicks | New |

---

## Brush System

Each tool should support configurable brush sizes:

| Size | Tiles Affected | Use Case |
|------|----------------|----------|
| 1×1 | 1 tile | Precise placement |
| 3×3 | 9 tiles | Small adjustments |
| 5×5 | 25 tiles | Medium areas |
| 9×9 | 81 tiles | Large terrain editing |

---

## UI Design

### Tool Menu Layout

```
┌─────────────────────────────────────────────┐
│  🛠️ Map Tools                               │
├─────────────────────────────────────────────┤
│                                             │
│  [Terrain]  [Color]  [Assets]  [Structure]  │  ← Category tabs
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ ⬆️  │ │ ⬇️  │ │ ⏹️  │ │ 〰️  │  ...      │  ← Tool buttons
│  │Raise│ │Lower│ │Flat │ │Smooth│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  Brush: [1×1] [3×3] [5×5] [9×9]           │  ← Size selector
│                                             │
│  Active: ⬆️ Raise Terrain (3×3)            │  ← Current tool display
│                                             │
└─────────────────────────────────────────────┘
```

### Placement

Add as a new panel in the right-side menu area, below `#mapflyMenu`:

```html
<div id="righMenu">
  <div id="mapflyMenu"></div>      <!-- Existing -->
  <div id="toolMenu"></div>        <!-- NEW -->
  <div id="infoMenu"></div>        <!-- Existing -->
</div>
```

---

## Architecture

### New Files

```
web/js/
├── menu/
│   ├── flyMenu.ts          # Existing
│   ├── InfoMenu.ts         # Existing
│   └── toolMenu.ts         # NEW — Tool selection UI

IsoGame/
├── tools/
│   ├── toolRegistry.ts     # NEW — Tool definitions
│   ├── terrainTools.ts     # NEW — Terrain manipulation
│   ├── colorTools.ts       # NEW — Color painting
│   ├── assetTools.ts       # NEW — Asset placement
│   └── structureTools.ts   # NEW — Building/road tools
```

### Tool Interface

```ts
// IsoGame/tools/toolRegistry.ts

interface MapTool {
  id: string
  name: string
  icon: string
  category: "terrain" | "color" | "asset" | "structure" | "inspect"
  
  execute(x: number, y: number, brushSize: number, world: World): void
}
```

### Tool Registry

```ts
class ToolRegistry {
  private tools: Map<string, MapTool> = new Map()
  private activeTool: MapTool | null = null
  private brushSize: number = 1

  register(tool: MapTool): void
  setActive(toolId: string): void
  getActive(): MapTool | null
  setBrushSize(size: number): void
  
  executeAt(x: number, y: number, world: World): void {
    if (!this.activeTool) return
    this.activeTool.execute(x, y, this.brushSize, world)
  }
}
```

### Tool Implementation Example

```ts
// IsoGame/tools/terrainTools.ts

const raiseTerrainTool: MapTool = {
  id: "raise_terrain",
  name: "Raise Terrain",
  icon: "⬆️",
  category: "terrain",
  
  execute(x, y, brushSize, world) {
    const half = Math.floor(brushSize / 2)
    for (let dx = -half; dx <= half; dx++) {
      for (let dy = -half; dy <= half; dy++) {
        const tile = FactoryMap.getInstance().getTile(x + dx, y + dy)
        tile.level += 1
      }
    }
  }
}
```

---

## Integration Plan

### Phase 1: Foundation

1. Create `IsoGame/tools/toolRegistry.ts` with `MapTool` interface
2. Create `web/js/menu/toolMenu.ts` with UI rendering
3. Add `toolMenu` to `main.ts` initialization
4. Wire click events: map click → `toolRegistry.executeAt()`

### Phase 2: Terrain Tools

1. Implement `raiseTerrainTool`
2. Implement `lowerTerrainTool`
3. Implement `flattenTool` (wraps existing `lvlFlatSquare`)
4. Implement `smoothTool`
5. Implement `plateauTool`

### Phase 3: Color Tools

1. Implement `colorPickerTool` — UI color selection, stores active color
2. Implement `paintColorTool` — Apply active color to tiles
3. Implement `eyedropperTool` — Pick color from tile, send to main
4. Implement `randomShadeTool` — Apply random variation of active color

### Phase 4: Asset Tools

1. Implement `assetPickerTool` — Query asset groups from `AssetLoaderOpti`
2. Implement `placeAssetTool` — Place selected asset on tile
3. Implement `clearItemsTool` (wraps existing `clearItemSquare`)

### Phase 5: Structure Tools

1. Implement `placeRoadTool` (two-click path drawing)
2. Implement `placeBuildingTool` (wraps existing `WcBuildingFactory`)
3. Implement `generateCityTool` (wraps existing `City` class)

---

## Message Protocol

### New Worker Messages

| Direction | Action | Payload |
|-----------|--------|---------|
| Main → Worker | `setActiveTool` | `{ toolId: string }` |
| Main → Worker | `setBrushSize` | `{ size: number }` |
| Main → Worker | `toolClick` | `{ x: number, y: number }` |
| Worker → Main | `toolExecuted` | `{ toolId: string, success: boolean }` |

### Alternative: Main-Side Tools

For simple tools (inspect, measure), execute on main thread without worker round-trip:

```ts
// In toolMenu.ts
if (activeTool.category === "inspect") {
  // Handle locally
  handlers.send({ action: "query_infoCell", x, y })
} else {
  // Send to worker
  handlers.send({ action: "toolClick", x, y })
}
```

---

## Keyboard Shortcuts

| Key | Tool |
|-----|------|
| `1` | Raise Terrain |
| `2` | Lower Terrain |
| `3` | Flatten |
| `4` | Paint Color |
| `5` | Eyedropper |
| `6` | Place Asset |
| `7` | Place Road |
| `Q` | Inspect |
| `B` | Brush size cycle |
| `Esc` | Deselect tool |

---

## Migration Path

### Keep Existing Buttons

The fly menu buttons (`City`, `Building`, `Test Init`) remain functional during transition. They simply call `toolRegistry.setActive()` + immediate execute.

### Deprecation

After tool menu is stable, remove individual action buttons from fly menu. Keep fly menu for global actions (reset view, export, etc.).

---

## Story Backlog

### P0-1: Create tool registry & interface
**Effort**: Medium
**Files**: `IsoGame/tools/toolRegistry.ts`
**Communication**:
- Define `MapTool` interface with `execute()` method
- Create `ToolRegistry` singleton with `register()`, `setActive()`, `executeAt()`
- Export registry instance for use in `toolMenu.ts` and `gameWorker.ts`

### P0-2: Create tool menu UI
**Effort**: Medium
**Files**: `web/js/menu/toolMenu.ts`, `web/indexIso.html`
**Communication**:
- Main → DOM: Render category tabs and tool buttons
- DOM → Main: Button click → `registry.setActive(toolId)`
- Main → DOM: Update active tool display
- DOM events: Brush size buttons → `registry.setBrushSize(size)`

### P0-3: Wire map clicks to active tool
**Effort**: Low
**Files**: `web/js/main.ts`, `web/js/gameWorker.ts`
**Communication**:
- Main → Worker: `toolClick { x: number, y: number, toolId: string, brushSize: number }`
- Worker → Main: `toolExecuted { toolId: string, success: boolean }`
- Worker handler: `ToolRegistry.executeAt(x, y, world)`

### P1-4: Implement terrain tools (5)
**Effort**: Medium
**Files**: `IsoGame/tools/terrainTools.ts`, `IsoGame/map/tileActions.ts`
**Communication**:
- Worker internal: `FactoryMap.getInstance().getTile(x, y)`
- Worker internal: `tile.level += delta` for raise/lower
- Worker internal: `TileActions.getInstance().doActions([...])` for flatten

### P1-5: Implement brush size system
**Effort**: Low
**Files**: `IsoGame/tools/toolRegistry.ts`, `web/js/menu/toolMenu.ts`
**Communication**:
- Main → Worker: `setBrushSize { size: 1 | 3 | 5 | 9 }`
- Worker: Store `brushSize` in registry, pass to `tool.execute()`
- Main → DOM: Highlight active brush size button

### P2-6: Implement color tools (4)
**Effort**: Low
**Files**: `IsoGame/tools/colorTools.ts`, `IsoGame/map/data/biomes.ts`
**Communication**:
- Main → Worker: `setColor { r: number, g: number, b: number }`
- Main → Worker: `toolClick { x, y, toolId: "paint_color" }`
- Worker: `tile.color = { r, g, b }`
- Eyedropper: Worker → Main `tileColor { r, g, b }`

### P2-7: Implement asset tools (3)
**Effort**: Low
**Files**: `IsoGame/tools/assetTools.ts`, `IsoGame/mapIso/asset/assetLoaderOpti.ts`
**Communication**:
- Main → Worker: `setActiveAsset { assetId: string }`
- Main → Worker: `toolClick { x, y, toolId: "place_asset", assetId }`
- Worker: `tile.items.push({ assetId, x, y })`
- Asset Picker: Worker → Main `assetList { groups: [...] }` for UI rendering

### P2-8: Add keyboard shortcuts
**Effort**: Low
**Files**: `web/js/keyboad.ts`, `web/js/menu/toolMenu.ts`
**Communication**:
- DOM event: `keydown` → `registry.setActive(toolId)` or `registry.cycleBrushSize()`
- Main → DOM: Update active tool display after keyboard selection

### P3-9: Implement structure tools (3)
**Effort**: High
**Files**: `IsoGame/tools/structureTools.ts`, `IsoGame/city/pathFactory.ts`
**Communication**:
- Place Road: Main → Worker `toolClick { x, y, toolId: "place_road" }` (two-click)
- Worker: `PathFactory.createPath(from, to)`
- Place Building: Main → Worker `toolClick { x, y, toolId: "place_building" }`
- Worker: `new WcBuildingFactoryGenarator(world, conf).start2(x, y)`
- Generate City: Main → Worker `toolClick { x, y, toolId: "generate_city" }`
- Worker: `new City(world, x, y)`

### P3-10: Implement inspection tools (2)
**Effort**: Low
**Files**: `IsoGame/tools/inspectTools.ts`, `web/js/menu/InfoMenu.ts`
**Communication**:
- Inspect: Main → Worker `query_infoCell { x, y }`
- Worker → Main `infoCell { data: TileInfo }`
- Main → DOM: Render tile info in `#infoMenu`
- Measure: Main local (no worker), store first click, calculate distance on second click

---

## Estimated Effort

| Phase | Stories | Time Estimate |
|-------|---------|---------------|
| Phase 1 | Foundation | 1-2 days |
| Phase 2 | Terrain Tools | 1 day |
| Phase 3 | Color Tools | 0.5 day |
| Phase 4 | Asset Tools | 0.5 day |
| Phase 5 | Structure Tools | 2 days |
| **Total** | | **5-6 days** |

---

## Conclusion

The tool-based interaction model provides a more intuitive and extensible foundation for map editing. The modular `MapTool` interface allows easy addition of new tools without modifying core systems. Phase 1-2 delivers the most impactful tools for terrain editing, which is the primary use case for a map editor.