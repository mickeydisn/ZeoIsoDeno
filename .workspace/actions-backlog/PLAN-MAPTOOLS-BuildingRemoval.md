# Plan — Building Removal Tool

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Sub-plan of: PLAN-MAPTOOLS-Building.md

---

## Introduction

This sub-plan details the implementation of a building removal tool for ZeoIsoDeno. The tool allows users to clear buildings from a selected area by "painting" over them, providing a simple and intuitive way to remove unwanted structures.

**Chosen Approach: Option A (Enhanced)**
- Clear all visual elements (items, color) AND `wcBuild` property in selected area
- Simple and effective for game use case
- No complex tracking or undo system needed
- Users can "paint" over unwanted buildings with brush tool

---

## Research Summary

### How Buildings Are Stored

1. **WcBuildTile Reference**: Each tile that's part of a building has `tile.wcBuild` property pointing to a `WcBuildTile` object
2. **Visual Items**: Buildings add items to `tile.items` array (asset items for rendering)
3. **Existing Clear Function**: `TilesActions.clearAllSquare()` clears:
   - `isBlock` (blocked state)
   - `isFrise` (frise state)
   - `color` (tile color)
   - `items` (visual items)
   - **BUT NOT** `wcBuild` property

### The Problem

Current `clearAllSquare` function does NOT clear the `wcBuild` property, meaning:
- Visual elements are removed
- But the building data reference persists on the tile
- This can cause issues with building generation logic

### The Solution

Create a new `clearBuildingSquare` function that:
1. Calls `clearAllSquare` to clear visual elements
2. Also clears `tile.wcBuild = undefined` for each tile in the area

---

## Implementation Tasks

### Task 1: Add clearBuildingSquare to TilesActions

**File**: `IsoGame/map/tileActions.ts` (MODIFY)

- [ ] Add `clearBuildingTile(tile: Tile)` helper method:
  ```typescript
  clearBuildingTile(tile: Tile) {
    this.clearAllTile(tile);
    tile.wcBuild = undefined;
  }
  ```

- [ ] Add `clearBuildingSquare(conf: TypeTileActionConfig)` method:
  ```typescript
  clearBuildingSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        this.clearBuildingTile(cellTile);
      });
    });
  }
  ```

- [ ] Register `clearBuildingSquare` in the `index` object:
  ```typescript
  clearBuildingSquare: this.clearBuildingSquare.bind(this),
  ```

### Task 2: Create Clear Building Tool

**File**: `IsoGame/tools/structureTools.ts` (MODIFY)

- [ ] Import `TilesActions`:
  ```typescript
  import { TilesActions } from "../map/tileActions.ts";
  ```

- [ ] Create `clearBuildingTool` implementing `MapTool` interface:
  ```typescript
  export const clearBuildingTool: MapTool = {
    id: "clear_building",
    name: "Clear Building",
    icon: "🧹",
    category: "structure",
    execute(x, y, brushSize, _world) {
      const tilesActions = TilesActions.getInstance();
      tilesActions.clearBuildingSquare({
        func: "clearBuildingSquare",
        x: x,
        y: y,
        size: brushSize,
      });
    }
  };
  ```

- [ ] Export `clearBuildingTool` in `structureTools` array:
  ```typescript
  export const structureTools: MapTool[] = [
    placeBuildingTool,
    clearBuildingTool,
  ];
  ```

### Task 3: Register Clear Building Tool in Worker

**File**: `web/js/gameWorker.ts` (MODIFY)

- [ ] Verify `structureTools` import includes `clearBuildingTool`:
  ```typescript
  import { structureTools } from "../../IsoGame/tools/structureTools.ts";
  ```

- [ ] No additional changes needed - `structureTools.forEach((tool) => toolRegistry.register(tool))` will automatically register `clearBuildingTool`

---

## File Summary

| File | Type | Task |
|------|------|------|
| `IsoGame/map/tileActions.ts` | MODIFY | 1 |
| `IsoGame/tools/structureTools.ts` | MODIFY | 2 |
| `web/js/gameWorker.ts` | MODIFY | 3 (verify) |

---

## Integration Points

### Message Protocol

No new messages needed - the tool uses existing `setActiveTool` and `gridClick` messages.

### UI Integration

The `clearBuildingTool` will automatically appear in the structure category of the tool menu:
- Icon: 🧹
- Name: "Clear Building"
- Category: "structure"

Users can:
1. Select the "Clear Building" tool
2. Choose brush size (1×1, 3×3, 5×5, 9×9)
3. Click on the map to clear buildings in that area

---

## Estimated Effort

| Task | Description | Time |
|------|-------------|------|
| Task 1 | Add clearBuildingSquare to TilesActions | 0.5 hour |
| Task 2 | Create clearBuildingTool | 0.5 hour |
| Task 3 | Verify registration | 0.25 hour |
| **Total** | | **1.25 hours** |

---

## Testing Plan

1. Place a building using "Place Building" tool
2. Select "Clear Building" tool
3. Click on the building area
4. Verify:
   - Visual items are removed
   - Tile color is reset
   - `tile.wcBuild` is cleared
   - New buildings can be placed in the cleared area

---

## Future Enhancements (Out of Scope)

- **Option B**: Track placed building tiles for selective removal
- **Option C**: Undo/redo system for building operations
- **Selective removal**: Remove only specific building types
- **Building preview**: Show which buildings will be affected before clearing

---

## Dependencies

- Requires Phase 1-3 of main plan to be complete (for structure category in tool menu)
- Uses existing `TilesActions` infrastructure
- No external dependencies

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Clearing area removes non-building elements | Medium | Document that tool clears ALL elements in area; user should use small brush sizes near important features |
| `wcBuild` reference not cleared properly | High | Test thoroughly; add console warning if `wcBuild` exists after clear |
| Brush size too large causes performance issues | Low | Existing brush sizes (1-9) are reasonable; monitor performance |