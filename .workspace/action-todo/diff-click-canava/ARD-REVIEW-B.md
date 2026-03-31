# ARD-REVIEW-B: Main-Worker Message-Passing Architecture (Alternative to SharedBuffer)

## 1. Review Objective

Evaluate an alternative architecture for transferring hover overlay position from the main thread to the game worker **without** using `SharedArrayBuffer`. Instead, the main thread (or worker) computes the tile under the mouse, detects when it changes, and sends a message to update the overlay state.

---

## 2. Actual Codebase Analysis (Not Plan — Real Code)

### 2.1 Current Architecture (What Actually Exists)

The current codebase does **NOT** use a canvas-native mouse event system. Instead, it uses a **CSS 3D-transformed DOM grid overlay** (`grid.ts`) layered on top of the canvas:

```
┌─────────────────────────────────────┐
│  HTML Structure                     │
│                                     │
│  #mapRelative                       │
│    ├─ #mapImage  (canvas)           │  ← OffscreenCanvas, rendered by GameWorker
│    └─ #mapGrid   (DOM overlay)      │  ← CSS 3D: rotateX(60deg) rotateZ(45deg)
│         └─ .tileAction (div cells)  │  ← Click events attached here
└─────────────────────────────────────┘
```

**Key files and their actual roles:**

| File | Role | Relevant Code |
|------|------|---------------|
| `IsoGame/mapIso/grid.ts` | `GridMapDrawers` — Creates a CSS 3D-transformed DOM grid overlay with click handlers | `_init_gridMatrix()` — creates `div.tileAction` cells with `addEventListener("click")` |
| `web/js/gameWorker.ts` | GameWorker (worker thread) — Receives `toolClick` and `query_infoCell` messages | `"toolClick"` handler — extracts `gridX`, `gridY` from message |
| `IsoGame/mapIso/canvasMapDrawer.ts` | `CanvasMapDrawers` — Renders isometric tiles to OffscreenCanvas | `drawUpdate()` → `drawIso()` → draws tiles, shares `mapLvl` and `mapInfo` buffers |
| `IsoGame/mapIso/simpleIso/IsometricProjector.ts` | `IsometricProjector` — 3D→2D forward projection only | `translatePoint()` — **NO** `screenToTile()` or inverse projection exists |
| `web/js/main.ts` | Main thread — Initializes worker, canvas, grid overlay | `callback_initCanvasMap` — creates `GridMapDrawers` |

### 2.2 Shared Buffer: Actual State (NOT What the Other ARDs Claim)

**`canvasMapDrawer.ts` line ~87-93:**
```typescript
// Init the Worker-Shared Matrix : [ 0:centreX , 1:centreY, 2:offX, 3:offY ]
this.bufferMapInfo = new SharedArrayBuffer(
  4 * Float32Array.BYTES_PER_ELEMENT,  // ONLY 4 SLOTS, not 10
);
this.mapInfo = new Float32Array(this.bufferMapInfo);
```

**`canvasMapDrawer.ts` `drawUpdate()` line ~173-177:**
```typescript
// Update Shared Info Buffer
this.mapInfo[0] = centreX;
this.mapInfo[1] = centreY;
this.mapInfo[2] = offx;
this.mapInfo[3] = offy;
```

**Reality check:** The buffer is **only 4 slots** (16 bytes). There is NO expansion to 10 slots. The ARD-REF-shared-buffer document describes a **plan that was never implemented**. No hover coordinates are stored in the shared buffer. The other ARD documents (ARD-REF-hover-feedback, ARD-REF-shared-buffer) document a **design that doesn't exist in code**.

### 2.3 Inverse Projection: Does NOT Exist

**ARD-REF-inverse-projection**, **ARD-REF-height-aware-picking**, **ARD-REF-rhombus-test** all document methods like:
- `screenToTile()`
- `screenToTileWithHeight()`
- `_isPointInTileFace()`

**None of these methods exist in `IsometricProjector.ts`**. The class only has:
- `translatePoint()` — forward projection only (3D → 2D)
- `updateConf()` — configuration updates

The ARD documents describe **planned but never written code**.

### 2.4 Hover Overlay: Does NOT Exist

The ARD-REF-hover-feedback document describes `drawHoverOverlay()`, `hoveredTile`, and `setHoveredTile()`. **None of these exist in `canvasMapDrawer.ts`**. There is no hover visual feedback in the current codebase.

### 2.5 Click Detection: DOM Grid, Not Canvas

**`grid.ts` `_init_gridMatrix()`** — Click handling is done on DOM div cells:
```typescript
cell.addEventListener("click", (event) => {
    const clickX = this.mod * (-i + this.gridSize / 2);
    const clickY = this.mod * (-j + this.gridSize / 2);
    
    this.gameWorker.postMessage({ action: "query_infoCell", gridX: clickX, gridY: clickY });
    this.gameWorker.postMessage({ action: "toolClick", gridX: clickX, gridY: clickY });
});
```

Click coordinates are computed from **grid cell index**, not from screen-to-tile inverse projection. The DOM grid is CSS 3D-transformed (`rotateX(60deg) rotateZ(45deg)`), which the ARD documents correctly identify as problematic (misalignment at non-standard zoom levels, doesn't match the exact 2:1 isometric ratio of the math).

---

## 3. Problem Statement (Real Problems, Not Hypothetical)

### 3.1 DOM Grid Overlay Issues

| Problem | Impact |
|---------|--------|
| CSS 3D transforms (`rotateX(60deg) rotateZ(45deg)`) don't match the 2:1 isometric ratio of the math (`sx=32, sy=16`) | Grid lines don't align perfectly with tile edges on the canvas |
| CSS transforms break at non-standard zoom levels | Hover/click accuracy degrades when zooming |
| Thousands of DOM elements (40×40 = 1600 divs) | DOM overhead for rendering and event propagation |
| No height awareness — click goes through to a flat grid tile | Can't distinguish between tiles at different heights |
| Click detection uses grid index math, not coordinate math | Only works for axis-aligned isometric tiles; breaks on rotated views |

### 3.2 No Inverse Projection Exists

There is currently **no way** to convert a screen coordinate `(screenX, screenY)` back to a tile coordinate `(tx, ty, tz)`. The only projection that exists is forward (`translatePoint()`). This means:
- Canvas-native mouse events (`mousemove`, `click`) cannot identify which tile is under the cursor
- Hover feedback requires DOM overlay hit-testing, not math
- Selection/identification of tiles on variable-height terrain is impossible

### 3.3 No Hover Feedback At All

The codebase has no visual hover feedback. Users get no visual indication of which tile they're about to click.

---

## 4. Proposed Architecture: Inverse Projection + Change-Triggered Messages

### 4.1 Core Idea

Replace the DOM grid overlay click detection with a **purely mathematical isometric system** that:
1. Implements the missing inverse projection methods (`screenToTileWithHeight()`)
2. Captures mouse events directly on the canvas (no DOM overlay needed)
3. Detects when the hovered tile **changes**, and only then sends a message to the worker
4. Draws hover overlay and grid overlay directly on the canvas (no CSS grid)

```
┌─────────────────────────────────────────────┐
│  Main Thread (main.ts)                      │
│                                             │
│  Canvas 'mousemove' event                   │
│    │                                        │
│    ├─ Convert e.clientX/Y → canvas coords   │
│    │                                        │
│    ├─ projector.screenToTileWithHeight()    │
│    │    Uses: mapLvl (read from SAB)        │
│    │          mapInfo (read from SAB)       │
│    │                                        │
│    ├─ Compare result to previousHoverTile    │
│    │                                        │
│    └─ IF changed → postMessage to worker    │
│         { type: 'hover_change', x, y, z }   │
│                                             │
│  Canvas 'drawIso()' renders hover overlay   │
│  (drawn directly on the canvas, not DOM)    │
└─────────────────────────────────────────────┘
```

### 4.2 Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Pure math, no DOM overlay** | Canvas-native event handling; CSS grid is removed entirely |
| **Inverse projection on main thread** | Mouse events arrive on main thread; computation uses `mapLvl` read from SAB (read-only) |
| **Change-driven communication** | Only send `postMessage` when hovered tile changes, not every `mousemove` |
| **No buffer abuse** | Shared buffers keep their original purpose (camera, terrain data) |
| **Canvas-rendered overlays** | Grid lines and hover highlight drawn as canvas paths, not CSS transforms |

### 4.3 Missing Components That Need to Be Created

#### 4.3.1 Inverse Projection Methods (new file or extend `IsometricProjector.ts`)

```typescript
// In IsometricProjector.ts (new methods to add):

/**
 * Basic inverse projection: screen → tile at known Z.
 * Solves the linear system of translatePoint() for tx, ty.
 */
screenToTile(screenX: number, screenY: number, tileZ: number = 0): PointIso | null {
    const { originX, originY, offsetX, offsetY, SCALE_SIZE, SCALE_MOD } = this.conf;
    const sx = 32 * SCALE_SIZE;
    const sy = 16 * SCALE_SIZE;
    
    // Reverse of translatePoint():
    // screenX = originX + (tx - offsetX - (ty - offsetY)) * sx
    // screenY = originY - (tx - offsetX + (ty - offsetY)) * sy - tileZ * ISO_LVL_SCALE / SCALE_MOD
    const adjustedX = screenX - originX;
    const adjustedY = originY - screenY - (tileZ * ISO_LVL_SCALE / SCALE_MOD);
    
    const tileXRaw = (adjustedX / sx + adjustedY / sy) / 2;
    const tileYRaw = (adjustedY / sy - adjustedX / sx) / 2;
    
    const tileX = Math.floor(tileXRaw + offsetX);
    const tileY = Math.floor(tileYRaw + offsetY);
    
    return new PointIso(tileX, tileY, tileZ);
}

/**
 * Height-aware picking: finds the topmost tile at screen position.
 * Iterates candidate tiles, filters by X-projection, sorts by depth,
 * and tests point-in-diamond for the frontmost candidate.
 */
screenToTileWithHeight(
    screenX: number, 
    screenY: number, 
    mapLvl: Float32Array,
    mapSize: number,
    mapInfo: Float32Array
): PointIso | null {
    // Candidate generation: tiles whose X-projection contains screenX
    const candidates: PointIso[] = [];
    const sx = 32 * this.conf.SCALE_SIZE;
    const sy = 16 * this.conf.SCALE_SIZE;
    
    for (let tx = 0; tx < mapSize; tx++) {
        for (let ty = 0; ty < mapSize; ty++) {
            const tz = mapLvl[tx * mapSize + ty];
            const center = this.screenToTile(screenX, screenY, tz);
            if (center && Math.abs(screenX - center.x) <= sx) {
                candidates.push(new PointIso(tx, ty, tz));
            }
        }
    }
    
    // Sort front-to-back by depth (tx + ty - 2*tz)
    candidates.sort((a, b) => b.depth() - a.depth());
    
    // Test each candidate's diamond
    for (const tile of candidates) {
        if (this._isPointInDiamond(tile, screenX, screenY)) {
            return tile;
        }
    }
    
    return null;
}

/**
 * Point-in-diamond test in screen space.
 */
private _isPointInDiamond(tile: PointIso, screenX: number, screenY: number): boolean {
    const top    = this.translatePoint(tile.x,     tile.y,     tile.z);
    const right  = this.translatePoint(tile.x + 1, tile.y,     tile.z);
    const bottom = this.translatePoint(tile.x + 1, tile.y + 1, tile.z);
    const left   = this.translatePoint(tile.x,     tile.y + 1, tile.z);
    
    const cx = (top.x + bottom.x) / 2;
    const cy = (top.y + bottom.y) / 2;
    const halfW = (right.x - left.x) / 2;
    const halfH = (bottom.y - top.y) / 2;
    
    if (halfW <= 0 || halfH <= 0) return false;
    
    const u = (screenX - cx) / halfW;
    const v = (screenY - cy) / halfH;
    
    return Math.abs(u) + Math.abs(v) <= 1.0;  // L1 norm diamond test
}
```

#### 4.3.2 Canvas Event Dispatcher (main.ts or new file)

```typescript
// In main.ts, after canvas setup:

let previousHoverTile: PointIso | null = null;

canvasImageMap.addEventListener('mousemove', (e) => {
    if (!gridMapDrawer) return;
    
    const rect = canvasImageMap.getBoundingClientRect();
    const scaleX = canvasImageMap.width / rect.width;
    const scaleY = canvasImageMap.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    // Compute tile using inverse projection
    const tile = gridMapDrawer.screenToTileWithHeight(
        screenX, screenY, 
        gridMapDrawer.mapLvl,  // read-only access to terrain
        gridMapDrawer.mapSize,
        gridMapDrawer.mapInfo   // read-only access to camera
    );
    
    // Detect change: only send message if tile changed
    if (tile && (!previousHoverTile || 
        tile.x !== previousHoverTile.x || 
        tile.y !== previousHoverTile.y || 
        tile.z !== previousHoverTile.z)) {
        
        gameWorker.postMessage({
            type: 'hover_change',
            x: tile.x,
            y: tile.y,
            z: tile.z
        });
        previousHoverTile = tile;
    } else if (!tile && previousHoverTile) {
        gameWorker.postMessage({ type: 'hover_clear' });
        previousHoverTile = null;
    }
});

canvasImageMap.addEventListener('mouseleave', () => {
    if (previousHoverTile) {
        gameWorker.postMessage({ type: 'hover_clear' });
        previousHoverTile = null;
    }
});
```

#### 4.3.3 Canvas Hover Overlay Rendering (extend `CanvasMapDrawers`)

```typescript
// In canvasMapDrawer.ts (new methods to add):

hoveredTile: PointIso | null = null;

setHoveredTile(tile: PointIso | null) {
    this.hoveredTile = tile;
}

drawHoverOverlay() {
    if (!this.hoveredTile) return;
    
    const x = Math.round(this.hoveredTile.x);
    const y = Math.round(this.hoveredTile.y);
    const z = this.hoveredTile.z;
    
    // Draw semi-transparent yellow overlay on the tile's top face
    const shape = Shape.SurfaceFlat(new Point(x, y, z), 1, 1, 0);
    // Render the shape with a highlight color
    this.isomer.add(shape, new Color(255, 220, 50, 0.35));
}

drawGridOverlay() {
    // Replace CSS 3D grid with canvas-rendered grid
    // Iterate tiles in drawing space, draw diamond outlines
    const size = this.conf.DRAW_TILE_COUNT;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const metaTile = this.tilesMatrix.tiles[x][y];
            const LVL_DISPLAY_SCALE = (1/3) * this.conf.SCALE_SIZE / this.conf.SCALE_MOD;
            const currentLvl = (metaTile.lvl - this.tilesMatrix.avgLvl) * LVL_DISPLAY_SCALE;
            
            // Draw diamond outline at tile's height
            const tile = new Point(x, y, currentLvl);
            const shape = Shape.SurfaceFlat(tile, 1, 1, 0);
            // Stroke only, no fill, blue color
        }
    }
}
```

#### 4.3.4 Worker Message Handler (gameWorker.ts)

```typescript
// In web/js/gameWorker.ts handlers map:

["hover_change", (data: GameHandlerData) => {
    this.canvasMapDrawer.setHoveredTile(
        new PointIso(data.x, data.y, data.z)
    );
}],

["hover_clear", (_data: GameHandlerData) => {
    this.canvasMapDrawer.setHoveredTile(null);
}],
```

### 4.4 What Gets Removed

| Component | Reason for Removal |
|-----------|-------------------|
| `GridMapDrawers._init_gridMatrix()` (DOM cell creation) | Replaced by canvas event handling |
| `GridMapDrawers.updateGrid()` (CSS 3D transform + per-cell height alignment) | Replaced by `drawGridOverlay()` on canvas |
| CSS grid overlay div (`#mapGrid`) | No longer needed |
| Thousands of `.tileAction` divs | Performance improvement |
| `mapInfo` expansion to 10 slots (planned but never written) | Don't expand; keep at 4 |

---

## 5. Comparison: DOM Overlay vs. Canvas-Native Math

| Aspect | Current (CSS 3D DOM Grid) | Proposed (Canvas Math + Messages) |
|--------|---------------------------|----------------------------------|
| **Click detection** | DOM div cell index | Inverse projection math |
| **Hover feedback** | None | Canvas-drawn overlay |
| **Height awareness** | None — flat grid | Height-aware picking |
| **Zoom invariance** | Breaks at non-standard zoom | Works at any zoom |
| **Performance** | 1600 DOM elements, CSS transforms | Canvas paths only |
| **Alignment** | CSS 3D doesn't match 2:1 isometric ratio | Pixel-perfect match to math |
| **Code complexity** | DOM + CSS + JS mixed | Unified canvas math |
| **Message frequency** | One per click | ~2-10 per second (hover changes) |
| **Buffer usage** | 4 slots (camera only) — good | Same — no expansion needed |

---

## 6. Performance Considerations

### 6.1 Change Detection Throttles Messages

A `mousemove` event fires at ~60-120 Hz, but change detection only sends messages when the tile actually changes. Most frames the cursor stays within the same tile diamond.

| Cursor Movement | Message Sent? | Typical Frequency |
|-----------------|---------------|-------------------|
| Within same tile | ❌ No | ~95% of frames |
| Cross to adjacent tile | ✅ Yes | 2-5 times/second |
| Over elevated terrain | ✅ Yes (z differs) | occasional |
| Leave canvas | ✅ Clear | once |

### 6.2 Inverse Projection Cost

`screenToTileWithHeight()` iterates the tile matrix (40×40 = 1600 tiles) with early exit after depth sort:

| Step | Cost |
|------|------|
| Candidate filtering (X-projection) | ~400 tiles survive (25% of 1600) |
| Depth sort | O(400 log 400) ≈ 3400 comparisons |
| Diamond hit test (early exit) | 1-20 tests average |
| **Total per mousemove** | ~0.5-2ms |

This fits within the 16ms frame budget at 60fps.

### 6.3 DOM Removal Benefits

Removing 1600 DOM elements and CSS 3D transforms:
- Eliminates layout/paint overhead from DOM grid
- Reduces memory footprint (no cell divs, no event listeners on each)
- Simplifies the rendering pipeline to canvas-only

---

## 7. Implementation Order

1. **Phase 1: Add inverse projection to IsometricProjector.ts**
   - Add `screenToTile()`, `screenToTileWithHeight()`, `_isPointInDiamond()`
   - Verify with unit tests (round-trip: project → unproject → compare)

2. **Phase 2: Add hover state to CanvasMapDrawers**
   - Add `hoveredTile` property, `setHoveredTile()`, `drawHoverOverlay()`
   - Add `drawGridOverlay()` — canvas-rendered grid replacing CSS grid

3. **Phase 3: Add canvas event handling to main.ts**
   - Add `mousemove` listener with change detection
   - Send `postMessage` only on hover change

4. **Phase 4: Add hover message handlers to gameWorker.ts**
   - Add `"hover_change"` and `"hover_clear"` handlers
   - Call `setHoveredTile()` in `drawUpdate()` cycle

5. **Phase 5: Remove DOM grid overlay**
   - Remove `GridMapDrawers._init_gridMatrix()` and `.updateGrid()`
   - Remove CSS grid overlay div and styles
   - Keep click handling on canvas (add `canvas.addEventListener('click')` in main.ts)

6. **Phase 6: Verify and test**
   - Test hover overlay renders correctly on flat and raised terrain
   - Test grid overlay aligns with tile edges
   - Test click/tile selection accuracy
   - Measure performance (FPS during hover interaction)

---

## 8. Summary of Key Findings

### ARD Documents vs. Actual Code

| Document | Status | Actual Code State |
|----------|--------|-------------------|
| ARD-REF-shared-buffer | Describes 10-slot buffer | Buffer is **4 slots only** — no hover data |
| ARD-REF-hover-feedback | Describes hover overlay | **No hover code exists** — `hoveredTile`, `drawHoverOverlay()` not written |
| ARD-REF-inverse-projection | Describes `screenToTile()` | **Method doesn't exist** — only `translatePoint()` (forward) |
| ARD-REF-height-aware-picking | Describes `screenToTileWithHeight()` | **Method doesn't exist** |
| ARD-REF-rhombus-test | Describes `_isPointInTileFace()` | **Method doesn't exist** |
| ARD-REF-overlay-grid | Describes canvas grid overlay | Grid is **CSS 3D DOM**, not canvas |
| ARD-REVIEW-overlay-handler | Correctly identifies branch is broken | Understatement — **nothing was implemented** |

**All 7 ARD-REF documents describe planned features that were never coded.** The only working code is the existing DOM grid overlay and forward projection. The `grid-click-canvas` branch documentation was written **before implementation**, and implementation was never completed.

### What Actually Works

- ✅ OffscreenCanvas rendering (tiles draw correctly)
- ✅ Forward projection (`translatePoint`)
- ✅ Shared buffer for camera position (4 slots)
- ✅ Shared buffer for terrain height (`mapLvl`, 40×40 Float32Array)
- ✅ Tool click execution via `postMessage`
- ✅ CSS 3D DOM grid overlay (functional but misaligned)

### What Needs to Be Built From Scratch

- ❌ Inverse projection methods (`screenToTile`, `screenToTileWithHeight`)
- ❌ Rhombus/diamond hit testing
- ❌ Hover overlay rendering on canvas
- ❌ Canvas grid overlay rendering
- ❌ Canvas-native mouse event handling
- ❌ Change-driven message protocol for hover state

---

## 9. Conclusion

The current codebase's `grid-click-canvas` branch is **documentation without implementation**. The ARD documents are well-written plans but were never translated into code. The working system relies on a CSS 3D-transformed DOM grid overlay for click detection, which has known alignment and scalability issues.

The proposed architecture (inverse projection + canvas-native event handling + change-driven `postMessage`) is the right direction, but it requires **implementing the planned code that was never written**. This is not a refactoring task — it's a green-box implementation of the documented algorithms.

The shared buffer does **not** need to be expanded for hover state. Using `postMessage()` with change detection is cleaner, safer, and avoids the race conditions that would come from concurrent shared memory access. The shared buffer should remain dedicated to its existing purpose: camera position (read by grid overlay) and terrain height (read by inverse projection).