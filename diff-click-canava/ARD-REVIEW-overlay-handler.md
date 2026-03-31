# ARD-REVIEW-overlay-handler: Architecture Review & Corrected Design

## 1. Critical Findings

### 1.1 Shared Buffer: Writer is MISSING (BRANCH IS BROKEN)

The `canvasMapDrawer.ts` extended `mapInfo` from 4 to 10 `Float32` slots and reads hover state:
```typescript
// canvasMapDrawer.ts line ~186
const hasHover = this.mapInfo[7] === 1;  // READS index 7
if (hasHover) {
  this.hoveredTile = new PointIso(this.mapInfo[4], this.mapInfo[5], this.mapInfo[6]);
}
```

**BUT** neither `GameWorker.ts` (worker side) nor `web/js/gameWorker.ts` contain any code that **WRITES** to `mapInfo[4..7]`. The diff confirms:
```diff
// GameWorker.ts — NO HOVER WRITE ADDITION
+        console.log(`Tool click at (${x}, ${y}) with active tool: ${toolRegistry.getActiveId()}`);
```

**Consequence**: `mapInfo[4..7]` are always `0.0` (zero-initialized by `SharedArrayBuffer`). The hover overlay **never renders** because `hasHover` is permanently `0`.

### 1.2 The "canvasClickHandler.ts" File Does Not Exist On Branch

The plan documents reference a `CanvasClickHandler` class in `IsoGame/mapIso/canvasClickHandler.ts`. This file was **never created**. Click handling logic is absent from the branch.

### 1.3 setCanvas in main.ts Has No Effect on Hover

The `gridMapDrawer.setCanvas()` call in `main.ts` appears to be from a different class (`GridMapDrawers`, not `CanvasMapDrawers`). The `GridMapDrawers` class in `grid.ts` does **NOT** have a `setCanvas()` method in the current code — this call will fail at runtime.

### 1.4 drawUpdate Reads Stale Data

The `drawUpdate()` method in `canvasMapDrawer.ts` reads `mapInfo[4..7]` every frame, but since nobody writes there, this is dead code. The `avgLvl` at index 8 is the **only** useful new write.

---

## 2. Correct Architecture Assessment

### What actually works:
| Component | Status | Notes |
|-----------|--------|-------|
| `screenToTile()` inverse projection | ✅ WORKING | Math is correct and tested |
| `screenToTileWithHeight()` picking | ✅ WORKING | Algorithm is sound |
| `drawHoverOverlay()` rendering | ✅ WORKING | Draws yellow overlay if `hoveredTile` is set |
| `drawGridOverlay()` rendering | ✅ WORKING | Draws magenta/blue grid lines |
| `setHoveredTile()` setter | ✅ WORKING | Sets internal state |
| **Shared buffer hover write** | ❌ NOT IMPLEMENTED | No code writes `mapInfo[4..7]` |
| **CanvasClickHandler class** | ❌ NOT CREATED | Planned file never written |
| **GridMapDrawers.setCanvas()** | ❌ MISSING METHOD | Will throw runtime error |
| **Worker-side mouse event handling** | ❌ NOT IMPLEMENTED | mousemove never captured by worker |

### What actually causes the "map update break":
The `setCanvas()` call in `main.ts` will throw a `TypeError: gridMapDrawer.setCanvas is not a function` because `GridMapDrawers` class (from `IsoGame/mapIso/grid.ts`) has no such method. This error during initialization could prevent the canvas from rendering properly.

---

## 3. Recommended Fix: Clean Architecture Without Shared Buffer Abuse

### Problem with Current Design
The branch tried to push hover state through `SharedArrayBuffer` but never implemented the write side. Even if it did, writing Float32 values from a worker every `mousemove` event creates:
1. **Race conditions** — worker writes while main thread reads in `drawUpdate()`
2. **Stale data** — `mapInfo[4]` might be from 3 frames ago
3. **Buffer expansion risk** — changing buffer size is a breaking change for any existing code reading indices 0-3

### Proposed Solution: Main-Thread Only Event Handling

Since the canvas is transferred to offscreen **after** initialization in `main.ts`, we can capture events **before** the transfer:

```
[main.ts]                                   [gameWorker.ts (worker)]
  | Mouse event on canvas                     | Tile data via SharedArrayBuffer
  ├─ getBoundingClientRect()                  | mapLvl[] terrain data
  ├─ Convert to canvas coords                 | mapInfo[0..3] camera position  
  ├─ Call projector.screenToTileWithHeight()  | mapInfo[8] avgLvl
  ├─ Set hoveredTile directly on CanvasMap    |
  └─ (No shared buffer abuse needed)          |
```

**Key Principle**: The inverse projection math runs on the **main thread**, where mouse events originate. The worker only provides terrain data (`mapLvl`) and camera info. No need to write hover coordinates back.

### Implementation Steps

1. **Remove dead shared buffer extension** — keep `mapInfo` at 4 slots, don't abuse indices 4-7
2. **Create a proper CanvasEventDispatcher** in `canvasMapDrawer.ts` or a new file:
   ```typescript
   class CanvasEventDispatcher {
     private projector: IsometricProjector;
     private canvas: HTMLCanvasElement;
     hoveredTile: PointIso | null = null;

     constructor(canvas: HTMLCanvasElement, projector: IsometricProjector) {
       this.canvas = canvas;
       this.projector = projector;
     }

     start(mouseHandler: (tile: PointIso | null) => void) {
       this.canvas.addEventListener('mousemove', (e) => {
         const rect = this.canvas.getBoundingClientRect();
         const sx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
         const sy = (e.clientY - rect.top) * (this.canvas.height / rect.height);
         // Need access to mapLvl and mapInfo — pass as closure or property
         this.hoveredTile = this.projector.screenToTileWithHeight(sx, sy, mapLvl, mapSize, mapInfo);
         mouseHandler(this.hoveredTile);
       });
     }
   }
   ```
3. **Fix `main.ts`** — call `setCanvas()` on `CanvasMapDrawers`, not `GridMapDrawers`
4. **Remove `screenToTileWithHeight2()`** — it's dead code, use only `screenToTileWithHeight()`

---

## 4. What to Keep vs. What to Discard

### KEEP (valuable additions from branch):
- ✅ All methods in `IsometricProjector.ts` (except `screenToTileWithHeight2`)
- ✅ `drawGridOverlay()` in `canvasMapDrawer.ts`
- ✅ `drawHoverOverlay()` in `canvasMapDrawer.ts`
- ✅ `setHoveredTile()` setter
- ✅ `drawBishopLine()` (commented out but useful for later)
- ✅ `drawShapePaths()` with text label support
- ✅ `mapInfo[8] = avgLvl` write — this is useful!

### DISCARD (broken or harmful):
- ❌ Shared buffer expansion to 10 slots for hover data
- ❌ Read of `mapInfo[4..7]` in `drawUpdate()`
- ❌ `screenToTileWithHeight2()` — dead code, never used
- ❌ `test.html` — unrelated WFC tool
- ❌ Any reference to `CanvasClickHandler` file — never created

### NEEDS FIXING:
- 🔧 `main.ts` `setCanvas()` call — ensure it targets correct class
- 🔧 Event handling — move to main thread, not worker
- 🔧 `GridMapDrawers` class — add `setCanvas()` method or remove the call