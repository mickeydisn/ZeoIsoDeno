# ARD-REF-hover-feedback: Hover State & Visual Feedback

## Purpose
Provide immediate visual feedback when the user hovers over a tile, highlighting it with a semi-transparent overlay and displaying tile coordinates.

## Source Location
- `IsoGame/mapIso/canvasMapDrawer.ts` — `hoveredTile`, `setHoveredTile()`, `drawHoverOverlay()`
- `IsoGame/worker/game/GameWorker.ts` — writes hover state to shared buffer

## Data Flow

### 1. Mouse Event Capture (Worker)
The `GameWorker` listens for `mousemove` on the canvas:
```typescript
canvas.addEventListener('mousemove', (e) => {
    // Convert to canvas-local coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    // Use inverse projection to find tile
    const tile = projector.screenToTileWithHeight(screenX, screenY, mapLvl, mapSize, mapInfo);
    
    // Write to shared buffer
    if (tile) {
        mapInfo[4] = tile.x;  // hoverX
        mapInfo[5] = tile.y;  // hoverY
        mapInfo[6] = tile.z;  // hoverZ
        mapInfo[7] = 1;       // hasHover = true
    } else {
        mapInfo[7] = 0;       // hasHover = false
    }
});
```

### 2. Read State (Main Thread / CanvasMapDrawers)
Each frame in `drawUpdate()`:
```typescript
const hasHover = mapInfo[7] === 1;
if (hasHover) {
    hoveredTile = new PointIso(mapInfo[4], mapInfo[5], mapInfo[6]);
} else {
    hoveredTile = null;
}
```

### 3. Render Overlay
`drawHoverOverlay()` is called at the end of `drawIso()`:
```typescript
const xx = Math.round(hoveredTile.x);
const yy = Math.round(hoveredTile.y);
const shape = Shape.SurfaceFlat(new Point(xx, yy, currentLvl - height), 1, 1, height);
drawShapePaths(shape, 'rgba(255, 220, 50, 0.35)', `${xx},${yy}`);
```
This draws a semi-transparent yellow overlay with tile coordinates.

## Visual Properties
| Property | Value |
|----------|-------|
| Overlay color | `rgba(255, 220, 50, 0.35)` (warm yellow, 35% opacity) |
| Label text | `xx,yy` (grid coordinates) |
| Render order | Last (on top of all tiles + grid + bishop lines) |
| Clearing | Set `hoveredTile = null` → overlay disappears |

## Design Decisions
- **Worker writes, main thread reads**: Avoids posting messages back; uses shared memory for zero-latency updates
- **Integer grid coordinates**: Hover tile is in grid space (0 to DRAW_TILE_COUNT-1), matching the draw matrix
- **Height from projection**: Uses actual terrain height, not Z=0, so hover overlay sits on the tile surface
- **Semi-transparent**: Allows terrain and grid to remain visible underneath