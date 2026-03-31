# ARD-REF-overlay-grid: Canvas Grid Overlay Rendering

## Purpose
Replace the CSS 3D-transformed DOM grid overlay with a canvas-rendered grid that precisely matches the mathematical isometric projection.

## Source Location
`IsoGame/mapIso/canvasMapDrawer.ts` — method `drawGridOverlay()`

## Algorithm

### Iteration Space
The grid is drawn over the visible tile matrix (`DRAW_TILE_COUNT × DRAW_TILE_COUNT`), typically 40×40 tiles centered on the camera.

### Height Calculation
Each tile's display Z is computed relative to the map's average level:
```typescript
LVL_DISPLAY_SCALE = (1/3) * SCALE_SIZE / SCALE_MOD
currentLvl = (metaTile.lvl - tilesMatrix.avgLvl) * LVL_DISPLAY_SCALE
```
The `1/3` factor (`LVL_Z_SCALE_FACTOR`) reduces the visual height exaggeration.

### Two Grid Layers
1. **Height-aligned grid** (blue): Drawn at each tile's actual `currentLvl` — tiles sit at their terrain height.
2. **Plan-aligned grid** (magenta): Drawn at `z = 0` — a flat reference plane.

### Rendering Pipeline
```typescript
for each tile (xx, yy):
    shape = Shape.SurfaceFlat(new Point(xx, yy, currentLvl - height), 1, 1, height)
    drawShapePaths(shape)  // stroke only, no fill
```
The `Shape.SurfaceFlat()` creates the 4-corner polygon for a tile's top face, which is then projected via `translatePoint()` and stroked.

### Placement in Render Order
`drawGridOverlay()` is called **after** all tiles are drawn but **before** the hover overlay, ensuring grid lines are visible on top of terrain.

## Why Canvas Instead of CSS?
- CSS `rotateX(60deg) rotateZ(45deg)` does not match the exact 2:1 isometric ratio used by the math
- CSS transforms break at non-standard zoom levels
- Canvas rendering guarantees pixel-perfect alignment with tile geometry
- No DOM maintenance overhead

## Key Constants
| Constant | Value | Meaning |
|----------|-------|---------|
| `LVL_Z_SCALE_FACTOR` | 1/3 | Reduces Z height visual exaggeration |
| `ISO_LVL_SCALE` | 39 | Base Z-scale in forward projection |
| Grid color (height-aligned) | `rgba(0, 0, 255, 1)` | Blue — matches terrain |
| Grid color (plan-aligned) | `rgba(255, 0, 255, 0.9)` | Magenta — reference plane |