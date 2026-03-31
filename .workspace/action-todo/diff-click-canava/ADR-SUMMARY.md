# ADR Summary: Grid-Click-Canvas — Isometric Tile Picking System

## Context
The previous implementation relied on a CSS 3D-transformed DOM overlay (`grid.ts`) for click detection on the isometric canvas. This caused misalignment, zoom sensitivity, and performance issues. The `grid-click-canvas` branch replaces this with a purely mathematical **inverse projection** system that works directly on the canvas.

## Architecture Overview

### Forward Projection (existing)
```
screen_x = originX + (tx * 32 * SCALE_SIZE) - (ty * 32 * SCALE_SIZE)
screen_y = originY - (tx * 16 * SCALE_SIZE) - (ty * 16 * SCALE_SIZE) - (tz * ISO_LVL_SCALE / SCALE_MOD)
```
Each 3D tile `(tx, ty, tz)` projects to a 2D screen point via a transformation matrix.

---

## New Algorithms (3 core methods)

### 1. `screenToTile()` — Basic Inverse Projection
Solves the linear system to convert screen `(sx, sy)` → tile `(tx, ty)` at a known Z:
- Adjust for `originX/Y` and Z offset
- Solve: `tx_raw = (dx/sx + dy/sy) / 2`, `ty_raw = (dy/sy - dx/sx) / 2`
- Apply floor + panning offset → integer tile coords

### 2. `screenToTileWithHeight()` — Height-Aware Tile Picking
Handles varying terrain heights using a **candidate-sorting** algorithm:
- **Step 1**: Pre-filter all tiles whose projected X range contains `screenX` (±sx)
- **Step 2**: Read each tile's height from `mapLvl[]`
- **Step 3**: Sort candidates by **depth** (`tx + ty - 2*z*ratio`) — front-to-back
- **Step 4**: For each candidate, call `_isPointInTileFace()` which uses:
  - Project all 4 diamond corners
  - Normalize screen point relative to diamond center (u, v)
  - **Rhombus test**: `|u| + |v| <= 1.0` for the top face
  - Also accept clicks on visible **side walls** (v slightly > 1.0)
- **Step 5**: Return first (frontmost) matching tile, or `null`

### 3. ~~`screenToTileWithHeight2()`~~ — REMOVED (dead code, see ARD-REVIEW)
Experimental top-edge interpolation variant. Not used in production path.

---

## Overlay Grid Rendering

The `drawGridOverlay()` method in `CanvasMapDrawers` replaces the CSS grid:
- Iterates all tiles in drawing space (`DRAW_TILE_COUNT × DRAW_TILE_COUNT`)
- For each tile, creates a `Shape.SurfaceFlat()` with `LVL_DISPLAY_SCALE` computed as:
  ```
  LVL_Z_SCALE_FACTOR * SCALE_SIZE / SCALE_MOD
  currentLvl = (tileLvl - avgLvl) * LVL_DISPLAY_SCALE
  ```
- Draws two overlays: **height-aligned** (blue) and **plan-aligned** (magenta, at z=0)
- Optional text labels show tile coordinates

---

## ⚠️ Hover Overlay System — BROKEN in Branch

| Component | Status | Issue |
|-----------|--------|-------|
| **Event source** | ❌ NOT IMPLEMENTED | `CanvasClickHandler` file was never created |
| **Worker → buffer write** | ❌ MISSING | No code writes `mapInfo[4..7]` despite branch extending buffer to 10 slots |
| **`dataMapDrawer` read** | ⚠️ DEAD CODE | Reads `mapInfo[7]` which is always `0.0` (zero-initialized) |
| **Rendering** | ✅ WORKING | `drawHoverOverlay()` would work if `hoveredTile` were set |
| **Shared buffer** | ⚠️ ABUSIVE | Expands buffer to 10 slots without coordinated write/read protocol |

See `ARD-REVIEW-overlay-handler.md` for detailed analysis and corrected architecture.

---

## Key Files Changed

| File | Change Summary |
|------|----------------|
| `IsometricProjector.ts` | Added `screenToTile`, `screenToTileWithHeight`, `_isPointInTileFace`, `_getTileTopScreenYAtX`, `tileToScreen`, `getNESWDiagonalCoords` |
| `canvasMapDrawer.ts` | Added `hoveredTile`, `drawHoverOverlay()`, `drawGridOverlay()`, `drawBishopLine()`, extended shared buffer |
| `gameWorker.ts` | ~~No hover write~~ — only added console.log for toolClick |
| `toolMenu.ts` | Refactored to event delegation on container elements |

## Decision Rationale
- **Eliminates DOM overlay** — no more CSS 3D transform misalignment
- **Zoom-invariant** — math works at any `SCALE_SIZE`
- **Height-aware** — correctly picks tiles on raised terrain
- **Painter's algorithm consistency** — depth sort matches render order
- **No DOM manipulation during rendering** — better performance

---

## Reference Documents

| ADR Ref | File | Status |
|---------|------|--------|
| [ARD-REF-inverse-projection](./ARD-REF-inverse-projection.md) | Inverse projection math (`screenToTile`) | ✅ Valid |
| [ARD-REF-height-aware-picking](./ARD-REF-height-aware-picking.md) | Height-aware tile picking (`screenToTileWithHeight`) | ✅ Valid |
| [ARD-REF-rhombus-test](./ARD-REF-rhombus-test.md) | Point-in-tile-face rhombus test | ✅ Valid |
| [ARD-REF-overlay-grid](./ARD-REF-overlay-grid.md) | Canvas grid overlay rendering | ✅ Valid |
| [ARD-REF-hover-feedback](./ARD-REF-hover-feedback.md) | Hover state & visual feedback | ⚠️ Plan only, not implemented — see REVIEW |
| [ARD-REF-shared-buffer](./ARD-REF-shared-buffer.md) | Worker-main communication protocol | ⚠️ Plan only, not implemented — see REVIEW |
| [ARD-REVIEW-overlay-handler](./ARD-REVIEW-overlay-handler.md) | Architecture review & corrected design | 🔧 Critical findings |
