# PRD-Tech: Canvas-Native Isometric Click & Hover System

## 1. Product Overview

This document defines the technical product requirements for replacing the current CSS 3D-transformed DOM grid overlay with a **canvas-native mathematical isometric system** for click detection and hover feedback. The implementation must preserve the existing DOM grid as a **swappable fallback** that can be easily re-enabled.

---

## 2. Current State Summary

| Component | Current Implementation | Issues |
|-----------|----------------------|--------|
| **Click Detection** | DOM div cells (`.tileAction`) with `addEventListener("click")` | CSS 3D transforms (`rotateX(60deg) rotateZ(45deg)`) don't match the 2:1 isometric math ratio; breaks at non-standard zoom |
| **Hover Feedback** | None | No visual indication of which tile is under the cursor |
| **Height Awareness** | None — flat grid | Can't distinguish tiles at different heights |
| **Inverse Projection** | Does not exist — only forward projection (`translatePoint`) | Canvas-native mouse events cannot identify tiles |
| **Performance** | 1600 DOM elements (40×40 grid) | DOM overhead for rendering, layout, and event propagation |

---

## 3. Architecture Vision

```
┌─────────────────────────────────────────────────────────────┐
│  Abstraction Layer: IClikGridHandler                         │
│                                                              │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │ DomGridHandler      │    │ CanvasGridHandler          │  │
│  │ (existing CSS 3D)   │    │ (new math-based)           │  │
│  │ - DOM click cells   │    │ - Canvas mousemove/click   │  │
│  │ - CSS transforms    │    │ - Inverse projection       │  │
│  │ - Height alignment  │    │ - Hover overlay rendering  │  │
│  └─────────────────────┘    │ - Canvas grid overlay      │  │
│                             └────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ IsometricProjector (extended)                        │   │
│  │ - translatePoint()      [existing]                   │   │
│  │ - screenToTile()        [new]                        │   │
│  │ - screenToTileWithHeight() [new]                     │   │
│  │ - _isPointInDiamond()   [new]                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CanvasMapDrawers (extended)                          │   │
│  │ - hoveredTile property  [new]                        │   │
│  │ - setHoveredTile()      [new]                        │   │
│  │ - drawHoverOverlay()    [new]                        │   │
│  │ - drawGridOverlay()     [new]                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principle: Swapability

The existing DOM grid must **NOT be removed**. Instead, both implementations must adhere to a common interface, and a configuration flag or runtime switch determines which handler is active. This allows:
- A/B testing between the two approaches
- Fallback if the new system has issues on certain browsers
- Gradual migration and debugging

---

## 4. User Stories

### Story 1: Inverse Projection Methods

**As a** developer,  
**I want** `IsometricProjector` to support inverse projection (screen → tile),  
**so that** canvas-native mouse events can determine which tile is under the cursor.

#### Acceptance Criteria

- [ ] `screenToTile(screenX, screenY, tileZ)` computes tile coordinates fromscreen coordinates at a known Z level
- [ ] `screenToTileWithHeight(screenX, screenY, mapLvl, mapSize, mapInfo)` finds the topmost tile at a screen position considering terrain height
- [ ] `_isPointInDiamond(tile, screenX, screenY)` performs point-in-diamond hit testing in screen space
- [ ] Round-trip test: `translatePoint(screenToTile(x, y, 0))` returns coordinates within 1 pixel of `(x, y)` for flat terrain
- [ ] Methods handle edge cases: coordinates outside map bounds return `null`

#### Mathematical Derivation

Given forward projection in `translatePoint()`:
```
screenX = originX + (tx - offsetX) * sx + (ty - offsetY) * (-sx)
        = originX + sx * (tx - offsetX - ty + offsetY)

screenY = originY - (tx - offsetX) * sy - (ty - offsetY) * sy - tz * ISO_LVL_SCALE / SCALE_MOD
        = originY - sy * (tx - offsetX + ty - offsetY) - tz * ISO_LVL_SCALE / SCALE_MOD
```

Where `sx = 32 * SCALE_SIZE`, `sy = 16 * SCALE_SIZE`.

Solving for `tx`, `ty`:
```
adjustedX = screenX - originX
adjustedY = originY - screenY - (tz * ISO_LVL_SCALE / SCALE_MOD)

tx = offsetX + (adjustedX / sx + adjustedY / sy) / 2
ty = offsetY + (adjustedY / sy - adjustedX / sx) / 2
```

#### Files to Modify

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts`

---

### Story 2: Hover Overlay on Canvas

**As a** player,  
**I want** to see a visual highlight on the tile under my mouse cursor,  
**so that** I know exactly which tile I'm about to click.

#### Acceptance Criteria

- [ ] `CanvasMapDrawers` has a `hoveredTile: PointIso | null` property
- [ ] `setHoveredTile(tile)` updates the hover state and triggers a redraw
- [ ] `drawHoverOverlay()` renders a semi-transparent yellow overlay on the hovered tile's top face
- [ ] Hover overlay respects the tile's current height (Z coordinate) — overlay rises with elevated terrain
- [ ] Hover overlay disappears when the mouse leaves the canvas
- [ ] Hover overlay renders at 60fps without impacting the main render loop

#### Overlay Rendering Details

- Color: `Color(255, 220, 50, 0.35)` (semi-transparent yellow)
- Shape: Diamond matching the tile's top face
- Rendered in `drawIso()` after tile drawing, before asset overlay
- No outline needed — the color difference from the tile is sufficient

#### Files to Modify

- `IsoGame/mapIso/canvasMapDrawer.ts`

---

### Story 3: Canvas Grid Overlay

**As a** player,  
**I want** to see grid lines on the canvas that align perfectly with tile edges,  
**so that** I can understand the tile boundaries regardless of zoom level.

#### Acceptance Criteria

- [ ] `drawGridOverlay()` renders diamond-shaped outlines on all visible tiles
- [ ] Grid lines are drawn in a subtle blue/gray color with low opacity
- [ ] Grid lines align pixel-perfectly with tile edges (no CSS transform misalignment)
- [ ] Grid rendering works at any zoom level — lines remain sharp
- [ ] Grid rendering is optional — can be toggled on/off via configuration
- [ ] Grid lines appear at the correct Z height for each tile (elevated tiles have grid at their height)

#### Rendering Strategy

- Iterate tiles in the visible range
- For each tile, compute its 4 corners using `translatePoint()`
- Draw diamond outline using `canvasCtx.stroke()`
- Use a single path for all diamonds to minimize draw calls
- Stroke style: `rgba(100, 150, 255, 0.15)`

#### Files to Modify

- `IsoEventDispatcher.ts` (new file — canvas event handling)

---

### Story 4: Canvas Event Dispatcher with Change Detection

**As a** developer,  
**I want** mouse events on the canvas to detect the hovered tile and only send messages when the tile changes,  
**so that** network/IPC traffic is minimized and hover updates are efficient.

#### Acceptance Criteria

- [ ] `mousemove` event on canvas converts browser coordinates to canvas coordinates
- [ ] Inverse projection is called with current `mapLvl` and `mapInfo` from shared buffers
- [ ] Previous hovered tile is cached and compared with current result
- [ ] `postMessage({ type: 'hover_change', x, y, z })` is sent **only** when tile coordinates differ
- [ ] `postMessage({ type: 'hover_clear' })` is sent when the mouse leaves the canvas
- [ ] Message frequency is < 10/second during normal mouse movement (change detection throttling)
- [ ] Event dispatcher is encapsulated in a dedicated class (`CanvasEventDispatcher`)

#### Coordinate Conversion

```typescript
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const screenX = (e.clientX - rect.left) * scaleX;
const screenY = (e.clientY - rect.top) * scaleY;
```

#### Files to Create

- `IsoGame/mapIso/simpleIso/CanvasEventDispatcher.ts`

---

### Story 5: Grid Handler Abstraction Interface

**As a** developer,  
**I want** a common interface for both DOM-based and canvas-based grid handling,  
**so that** I can easily swap between the two implementations via configuration.

#### Acceptance Criteria

- [ ] `IGridHandler` interface defines:
  - `init(): void` — sets up the grid/event system
  - `destroy(): void` — tears down the grid/event system
  - `onHoverChange(callback: (tile: PointIso | null) => void): void` — registers hover callback
  - `onClick(tile: PointIso): void` — handles click on tile
  - `update(): void` — called each frame for sync
  - `isVisible(): boolean` — returns whether this handler is active
- [ ] `DomGridHandler` wraps the existing `GridMapDrawers` implementation
- [ ] `CanvasGridHandler` uses the new `CanvasEventDispatcher` and canvas overlays
- [ ] A configuration flag (`useCanvasGrid: boolean`) in `CanvasMapDrawersConf` selects which handler to use
- [ ] Switching handlers is a one-line config change — no code modification needed
- [ ] Both handlers send tile coordinates in the same format to the worker

#### Interface Definition

```typescript
export interface IGridHandler {
    init(canvas: OffscreenCanvas, worker: Worker): void;
    destroy(): void;
    setHoverCallback(callback: (tile: PointIso | null) => void): void;
    setClickCallback(callback: (tile: PointIso) => void): void;
    update(mapLvl: Float32Array, mapInfo: Float32Array): void;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
}
```

#### Files to Create

- `IsoGame/mapIso/IGridHandler.ts` (interface)
- `IsoGame/mapIso/DomGridHandler.ts` (existing DOM grid wrapper)
- `IsoGame/mapIso/CanvasGridHandler.ts` (new canvas-based handler)

---

### Story 6: Worker Hover Message Handlers

**As a** developer,  
**I want** the game worker to handle `hover_change` and `hover_clear` messages,  
**so that** the canvas renders the hover overlay in sync with user input.

#### Acceptance Criteria

- [ ] `"hover_change"` handler reads `(x, y, z)` from message and calls `canvasMapDrawer.setHoveredTile(new PointIso(x, y, z))`
- [ ] `"hover_clear"` handler calls `canvasMapDrawer.setHoveredTile(null)`
- [ ] Hover state is read during `drawIso()` and overlay is rendered
- [ ] Hover updates do not trigger terrain recalculation — only visual overlay changes
- [ ] Message handler validates input (x, y must be within map bounds)

#### Handler Code

```typescript
["hover_change", (data: GameHandlerData) => {
    const x = (data as any).x;
    const y = (data as any).y;
    const z = (data as any).z;
    if (this.canvasMapDrawer && x >= 0 && y >= 0) {
        this.canvasMapDrawer.setHoveredTile(new PointIso(x, y, z));
    }
}],

["hover_clear", (_data: GameHandlerData) => {
    if (this.canvasMapDrawer) {
        this.canvasMapDrawer.setHoveredTile(null);
    }
}],
```

#### Files to Modify

- `web/js/gameWorker.ts` — add handlers to the `handlers` Map

---

### Story 7: Main Thread Event Dispatcher Integration

**As a** developer,  
**I want** the main thread to use the abstraction layer for grid handling,  
**so that** the swap config flag actually controls which system is used.

#### Acceptance Criteria

- [ ] `main.ts` reads the `useCanvasGrid` config flag
- [ ] If `true`: instantiate `CanvasGridHandler`, attach to canvas element
- [ ] If `false`: instantiate `DomGridHandler`, attach to DOM grid element (existing behavior)
- [ ] Both handlers receive the same `worker` reference and shared buffers
- [ ] Hover callback sends `postMessage` to worker in both cases
- [ ] Click callback sends `postMessage` to worker in both cases
- [ ] No code changes needed in `gameWorker.ts` for the swap — it receives identical messages

#### Integration Code Structure

```typescript
// In main.ts callback_initCanvasMap handler:

const useCanvasGrid = mapConf?.useCanvasGrid ?? false;

if (useCanvasGrid) {
    const canvasHandler = new CanvasGridHandler();
    canvasHandler.init(canvasImageMap, gameWorker);
    canvasHandler.setHoverCallback((tile) => {
        gameWorker.postMessage({ type: 'hover_change', x: tile?.x, y: tile?.y, z: tile?.z });
    });
    canvasHandler.setClickCallback((tile) => {
        gameWorker.postMessage({ action: 'toolClick', gridX: tile.x, gridY: tile.y });
    });
    activeGridHandler = canvasHandler;
} else {
    const domHandler = new DomGridHandler(gameWorker, bufferMapLvl, bufferMapInfo);
    domHandler.init();
    activeGridHandler = domHandler;
}
```

#### Files to Modify

- `web/js/main.ts` — integrate handler selection in `callback_initCanvasMap`

---

### Story 8: Configuration and Feature Flags

**As a** developer,  
**I want** clear configuration flags to control grid system behavior,  
**so that** I can test and debug each system independently.

#### Configuration Schema

```typescript
interface GridConfig {
    useCanvasGrid: boolean;      // true = canvas math, false = DOM overlay
    showGridOverlay: boolean;    // render grid lines on canvas (canvas mode only)
    showHoverOverlay: boolean;   // render hover highlight (canvas mode only)
    gridOverlayColor: string;    // e.g., "rgba(100, 150, 255, 0.15)"
    hoverOverlayColor: string;   // e.g., "rgba(255, 220, 50, 0.35)"
}
```

#### Default Values

```typescript
const defaultGridConfig: GridConfig = {
    useCanvasGrid: false,        // Start with existing DOM grid (safe default)
    showGridOverlay: true,
    showHoverOverlay: true,
    gridOverlayColor: "rgba(100, 150, 255, 0.15)",
    hoverOverlayColor: "rgba(255, 220, 50, 0.35)",
};
```

#### Files to Modify

- `IsoGame/mapIso/canvasMapDrawer.ts` — add `GridConfig` field
- `web/js/main.ts` — pass config to handlers

---

## 5. Implementation Phases

### Phase 1: Foundation — Inverse Projection
**Dependencies:** None  
**Estimated Effort:** 1-2 days

- [ ] **Story 1:** Add `screenToTile()`, `screenToTileWithHeight()`, `_isPointInDiamond()` to `IsometricProjector`
- [ ] Write unit tests for round-trip projection accuracy
- [ ] Verify behavior on flat and elevated terrain

### Phase 2: Hover Feedback — Canvas Overlay
**Dependencies:** Phase 1  
**Estimated Effort:** 1 day

- [ ] **Story 2:** Add `hoveredTile`, `setHoveredTile()`, `drawHoverOverlay()` to `CanvasMapDrawers`
- [ ] Test hover rendering on tiles at various heights
- [ ] Verify performance impact is negligible

### Phase 3: Grid Overlay — Canvas Rendering
**Dependencies:** Phase 1  
**Estimated Effort:** 1 day

- [ ] **Story 3:** Implement `drawGridOverlay()` in `CanvasMapDrawers`
- [ ] Verify grid line alignment with tile edges
- [ ] Test at multiple zoom levels

### Phase 4: Event Handling — Canvas Mouse Events
**Dependencies:** Phase 1  
**Estimated Effort:** 1 day

- [ ] **Story 4:** Create `CanvasEventDispatcher` with change-driven `postMessage`
- [ ] Test message frequency under normal mouse movement
- [ ] Verify coordinates are correct when sent to worker

### Phase 5: Abstraction — Swap Interface
**Dependencies:** Phase 2, 3, 4  
**Estimated Effort:** 1-2 days

- [ ] **Story 5:** Create `IGridHandler` interface, `DomGridHandler`, `CanvasGridHandler`
- [ ] **Story 6:** Add worker handlers for `hover_change` and `hover_clear`
- [ ] **Story 7:** Integrate handler selection in `main.ts`
- [ ] **Story 8:** Add configuration flags

### Phase 6: Verification & Testing
**Dependencies:** Phase 5  
**Estimated Effort:** 1 day

- [ ] Test hover overlay accuracy on flat terrain
- [ ] Test hover overlay accuracy on elevated/stepped terrain
- [ ] Test grid overlay alignment at 1×, 2×, 0.5× zoom
- [ ] Test click accuracy — clicks should affect the visually highlighted tile
- [ ] Test handler switching — DOM grid ↔ canvas grid at runtime
- [ ] Performance profiling: FPS during active hovering (should remain 60fps)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## 6. Edge Cases and Considerations

### 6.1 Zoom Invariance

The inverse projection math uses `SCALE_SIZE` and `SCALE_MOD` from the projector's config. These values change during zoom. The `screenToTile()` method must use the **current** config values, not cached ones.

**Mitigation:** `IsometricProjector.conf` is updated by `updateConf()` every frame in `drawUpdate()`. The event dispatcher should read from the shared projector instance, which always has current values.

### 6.2 Terrain Height Ambiguity

When terrain has varying heights, multiple tiles can project to overlapping screen positions. `screenToTileWithHeight()` resolves this by depth-sorting candidates and testing the frontmost first.

**Edge Case:** A mouse click on the border between two elevated tiles should consistently pick the frontmost (higher Z) tile.

### 6.3 Map Boundary Clipping

When the cursor is near the edge of the map, `screenToTile()` may return coordinates outside the valid tile range. These should return `null` rather than an out-of-bounds tile.

**Validation:** Check `0 <= tx < mapSize` and `0 <= ty < mapSize` before returning a result.

### 6.4 Shared Buffer Read Safety

`screenToTileWithHeight()` reads from `mapLvl` and `mapInfo` shared buffers. These are written by the worker and read by the main thread. While `SharedArrayBuffer` provides atomic reads for individual Float32 elements, reading `mapLvl` (1600 elements) during iteration could see partially updated data.

**Mitigation:** `mapLvl` is only 1600 floats and is written by the worker in a single `drawUpdate()` call. The chance of tearing affecting the result is minimal for a hover detection use case. If precision issues arise, a snapshot copy can be made before iteration.

### 6.5 DOM Grid Cleanup

When switching from DOM to canvas grid, the DOM grid elements should be hidden (not destroyed) so they can be re-enabled. Use `element.style.display = 'none'` rather than `element.remove()`.

---

## 7. Files to Create

| File | Purpose |
|------|---------|
| `IsoGame/mapIso/simpleIso/CanvasEventDispatcher.ts` | Canvas mouse event handling with change detection |
| `IsoGame/mapIso/IGridHandler.ts` | Abstraction interface for grid handlers |
| `IsoGame/mapIso/DomGridHandler.ts` | Existing DOM grid wrapper implementing `IGridHandler` |
| `IsoEventDispatcher.ts` (new file — canvas event handling) | Canvas mouse event handling with change detection |

## 8. Files to Modify

| File | Changes |
|------|---------|
| `IsoGame/mapIso/simpleIso/IsometricProjector.ts` | Add `screenToTile()`, `screenToTileWithHeight()`, `_isPointInDiamond()` |
| `IsoGame/mapIso/canvasMapDrawer.ts` | Add `hoveredTile`, `setHoveredTile()`, `drawHoverOverlay()`, `drawGridOverlay()` |
| `web/js/gameWorker.ts` | Add `"hover_change"` and `"hover_clear"` message handlers |
| `web/js/main.ts` | Integrate handler selection based on config flag |
| `IsoGame/mapIso/grid.ts` | Wrap existing `GridMapDrawers` in `DomGridHandler` |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Hover overlay accuracy (matches tile under cursor) | >99% on flat terrain, >95% on elevated terrain |
| Click accuracy (affects correct tile) | >99% |
| Message frequency during hover | <10/second average |
| FPS during active hover interaction | 60fps (no perceptible slowdown) |
| Grid line alignment error (canvas vs tile edges) | <1 pixel at any zoom |
| DOM element count (canvas mode) | 0 new DOM elements for grid |
| Swap time (DOM ↔ canvas handler switch) | <100ms (config change, no reload) |

---

## 10. Out of Scope

The following are **NOT** part of this PRD:

- **Multi-touch support** — only single-pointer mouse events are handled
- **Mobile/touch device support** — touch events require different handling (tap, long-press)
- **3D camera rotation** — the isometric camera angle is fixed; rotation would require full 3D picking
- **Dynamic terrain modification during hover** — hover detection assumes terrain is static between frames
- **Animation of hover transition** — hover overlay is a simple color change; no animated transition
- **Accessibility (a11y)** — keyboard navigation for tile selection is a separate initiative

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Inverse Projection** | Converting 2D screen coordinates back to 3D isometric tile coordinates |
| **Forward Projection** | Converting 3D tile coordinates to 2D screen position (`translatePoint`) |
| **Rhombus / Diamond** | The 2D screen-space shape of an isometric tile's top face |
| **Depth Sort** | Ordering tiles by `tx + ty - 2*tz` for front-to-back rendering |
| **Change Detection** | Only sending messages when the hovered tile changes, not every frame |
| **DOM Grid** | The existing CSS 3D-transformed overlay of div elements |
| **Canvas Grid** | The new math-based grid rendered as canvas paths |

---

## 12. Appendix A: Inverse Projection Math (Complete Derivation)

### Forward Projection (`translatePoint`)

```
Input:  PointIso(tx, ty, tz)
Config: originX, originY, offsetX, offsetY, SCALE_SIZE
Constants: sx = 32 * SCALE_SIZE, sy = 16 * SCALE_SIZE, ISO_LVL_SCALE = 39

Transformed point:
  ptx = tx - offsetX
  pty = ty - offsetY

screenX = originX + ptx * sx + pty * (-sx)
        = originX + sx * (ptx - pty)

screenY = originY - ptx * sy - pty * sy - tz * ISO_LVL_SCALE / SCALE_MOD
        = originY - sy * (ptx + pty) - tz * ISO_LVL_SCALE / SCALE_MOD
```

### Inverse Projection (`screenToTile`)

```
Input:  screenX, screenY, tz (known height)
Output: tx, ty (tile coordinates)

Step 1: Compute adjusted coordinates
  adjustedX = screenX - originX
  adjustedY = originY - screenY - (tz * ISO_LVL_SCALE / SCALE_MOD)

Step 2: Solve for raw tile coordinates
  tileXRaw = (adjustedX/sx + adjustedY/sy) / 2
  tileYRaw = (adjustedY/sy - adjustedX/sx) / 2

Step 3: Apply offset and floor
  tx = floor(tileXRaw + offsetX)
  ty = floor(tileYRaw + offsetY)
```

### Point-in-Diamond Test (`_isPointInDiamond`)

The four corners of a tile's top face in screen space:
```
top    = translatePoint(tx,     ty,     tz)
right  = translatePoint(tx + 1, ty,     tz)
bottom = translatePoint(tx + 1, ty + 1, tz)
left   = translatePoint(tx,     ty + 1, tz)
```

Diamond center and dimensions:
```
cx = (top.x + bottom.x) / 2
cy = (top.y + bottom.y) / 2
halfW = (right.x - left.x) / 2
halfH = (bottom.y - top.y) / 2
```

L1 norm diamond test:
```
u = (screenX - cx) / halfW
v = (screenY - cy) / halfH
return |u| + |v| <= 1.0
```

---

## 13. Appendix B: Message Protocol

### `hover_change` Message

```json
{
  "type": "hover_change",
  "x": 15,
  "y": 22,
  "z": 0.5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ | Must be `"hover_change"` |
| `x` | number | ✅ | Tile X coordinate (world space) |
| `y` | number | ✅ | Tile Y coordinate (world space) |
| `z` | number | ✅ | Tile Z coordinate (height) |

### `hover_clear` Message

```json
{
  "type": "hover_clear"
}
```

### Response (from worker → main): None

Hover state changes are fire-and-forget. The worker updates its internal state and the next `drawIso()` frame renders the overlay.

---

*Document Version: 1.0*  
*Created from: ARD-REVIEW-B.md*  
*Status: Ready for review*